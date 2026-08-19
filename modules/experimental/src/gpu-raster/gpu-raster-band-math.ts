// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, BindingDeclaration} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphDataView,
  GraphResourceUse
} from '../gpu-core/gpu-command-graph';
import {getViewBinding, getViewElementOffset} from '../gpu-core/graph-data-view-utils';
import {
  assertRasterStorageBindingFits,
  getRasterDispatchSize,
  getRasterFloatLiteral,
  getRasterScalarLiteral,
  getRasterShaderScalarType,
  MAXIMUM_RASTER_PIXEL_COUNT,
  RASTER_WORKGROUP_DIMENSION,
  validateRasterBand,
  validateRasterScalarView,
  validateRasterValidityView
} from './raster-utils';
import type {GPURasterBufferBand} from './types';

/** Independently implemented, GPU-resident operations on two calibrated raster bands. */
export type GPURasterBandMathOperation =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'normalized-difference';

/** Explicit inputs and caller-owned destinations for one graph-native raster operation. */
export type GPURasterBandMathProps = {
  id?: string;
  width: number;
  height: number;
  left: GPURasterBufferBand;
  right: GPURasterBufferBand;
  operation: GPURasterBandMathOperation;
  /** Packed float32 samples; invalid pixels receive a canonical quiet NaN. */
  output: GraphDataView<'float32'>;
  /** Separate caller-owned packed uint32 flags, canonicalized to zero or one. */
  outputValidity: GraphDataView<'uint32'>;
  /** Rejects division and normalized-difference denominators whose magnitude is at most epsilon. */
  epsilon?: number;
  /** Optional explicit output range. Without this option, valid results are never clamped. */
  clamp?: readonly [number, number];
};

/**
 * Contributes one raster band-math pass without allocating, submitting, or reading back buffers.
 *
 * Native-format nodata sentinels and source masks are resolved before independent float32
 * calibration. Invalid, nonfinite, or unstable samples remain separate from the output validity.
 */
export class GPURasterBandMath implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly left: GPURasterBufferBand;
  readonly right: GPURasterBufferBand;
  readonly operation: GPURasterBandMathOperation;
  readonly output: GraphDataView<'float32'>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly epsilon: number;
  readonly clamp?: readonly [number, number];

  constructor(props: GPURasterBandMathProps) {
    this.id = props.id ?? 'gpu-raster-band-math';
    this.width = props.width;
    this.height = props.height;
    this.left = props.left;
    this.right = props.right;
    this.operation = props.operation;
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    this.epsilon = props.epsilon ?? 0;
    this.clamp = props.clamp;

    if (
      !Number.isSafeInteger(this.width) ||
      this.width <= 0 ||
      !Number.isSafeInteger(this.height) ||
      this.height <= 0
    ) {
      throw new Error(`${this.id} dimensions must be positive integers`);
    }
    const pixelCount = this.width * this.height;
    if (!Number.isSafeInteger(pixelCount) || pixelCount > MAXIMUM_RASTER_PIXEL_COUNT) {
      throw new Error(`${this.id} pixel count must fit in uint32`);
    }
    if (!isRasterBandMathOperation(this.operation)) {
      throw new Error(`${this.id} operation is not supported`);
    }
    if (!Number.isFinite(this.epsilon) || this.epsilon < 0) {
      throw new Error(`${this.id} epsilon must be finite and non-negative`);
    }
    getRasterFloatLiteral(this.epsilon);
    if (this.clamp) {
      if (
        this.clamp.length !== 2 ||
        !Number.isFinite(this.clamp[0]) ||
        !Number.isFinite(this.clamp[1]) ||
        this.clamp[0] > this.clamp[1]
      ) {
        throw new Error(`${this.id} clamp must contain an ordered finite range`);
      }
      getRasterFloatLiteral(this.clamp[0]);
      getRasterFloatLiteral(this.clamp[1]);
    }

    if (this.left.storage.kind !== 'buffer' || this.right.storage.kind !== 'buffer') {
      throw new Error(`${this.id} requires buffer-backed input bands`);
    }
    const owner = validateRasterBand(this.left, this, `${this.id} left`);
    if (validateRasterBand(this.right, this, `${this.id} right`) !== owner) {
      throw new Error(`${this.id} resources must belong to the same graph`);
    }
    validateRasterScalarView(this.output, 'float32', pixelCount, `${this.id} output`);
    validateRasterValidityView(this.outputValidity, pixelCount, `${this.id} output validity`);
    if (this.output.buffer.graph !== owner || this.outputValidity.buffer.graph !== owner) {
      throw new Error(`${this.id} resources must belong to the same graph`);
    }
    const sourceBuffers = [
      this.left.storage.values.buffer,
      this.right.storage.values.buffer,
      ...(this.left.validity ? [this.left.validity.buffer] : []),
      ...(this.right.validity ? [this.right.validity.buffer] : [])
    ];
    if (
      this.output.buffer === this.outputValidity.buffer ||
      sourceBuffers.includes(this.output.buffer) ||
      sourceBuffers.includes(this.outputValidity.buffer)
    ) {
      throw new Error(`${this.id} inputs and outputs must use separate buffers`);
    }
    for (const input of [this.left, this.right]) {
      getRasterFloatLiteral(input.scale ?? 1);
      getRasterFloatLiteral(input.offset ?? 0);
    }
  }

  /** Adds one bounded two-dimensional compute pass; its computation is owned by the graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const inputViews = [
      this.left.storage.values,
      this.right.storage.values,
      ...(this.left.validity ? [this.left.validity] : []),
      ...(this.right.validity ? [this.right.validity] : [])
    ];
    for (const view of [...inputViews, this.output, this.outputValidity]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} resources must belong to the target graph`);
      }
      assertRasterStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
    }
    const [horizontalCount, verticalCount] = getRasterDispatchSize(
      graph.device,
      this.width,
      this.height,
      this.id
    );
    const resources: GraphResourceUse[] = [
      {buffer: this.left.storage.values, usage: 'storage-read'},
      {buffer: this.right.storage.values, usage: 'storage-read'},
      {buffer: this.output, usage: 'storage-write'},
      {buffer: this.outputValidity, usage: 'storage-write'}
    ];
    if (this.left.validity) {
      resources.push({buffer: this.left.validity, usage: 'storage-read'});
    }
    if (this.right.validity) {
      resources.push({buffer: this.right.validity, usage: 'storage-read'});
    }

    graph.addComputePass({
      id: this.id,
      resources,
      compile: ({device}) => {
        const bindings: BindingDeclaration[] = [
          {name: 'leftValues', type: 'read-only-storage', group: 0, location: 0},
          {name: 'rightValues', type: 'read-only-storage', group: 0, location: 1},
          {name: 'outputValues', type: 'storage', group: 0, location: 2},
          {name: 'outputValidity', type: 'storage', group: 0, location: 3}
        ];
        if (this.left.validity) {
          bindings.push({name: 'leftValidity', type: 'read-only-storage', group: 0, location: 4});
        }
        if (this.right.validity) {
          bindings.push({
            name: 'rightValidity',
            type: 'read-only-storage',
            group: 0,
            location: this.left.validity ? 5 : 4
          });
        }
        const computation = new Computation(device, {
          id: this.id,
          source: this.getShaderSource(),
          shaderLayout: {bindings}
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const resolvedBindings: Record<string, Binding> = {
              leftValues: getViewBinding(this.left.storage.values, getBuffer),
              rightValues: getViewBinding(this.right.storage.values, getBuffer),
              outputValues: getViewBinding(this.output, getBuffer),
              outputValidity: getViewBinding(this.outputValidity, getBuffer)
            };
            if (this.left.validity) {
              resolvedBindings['leftValidity'] = getViewBinding(this.left.validity, getBuffer);
            }
            if (this.right.validity) {
              resolvedBindings['rightValidity'] = getViewBinding(this.right.validity, getBuffer);
            }
            computation.setBindings(resolvedBindings);
            computation.dispatch(computePass, horizontalCount, verticalCount);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private getShaderSource(): string {
    const leftValidityDeclaration = this.left.validity
      ? `@group(0) @binding(4) var<storage, read> leftValidity: array<u32>;\nconst LEFT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.left.validity)}u;`
      : '';
    const rightValidityDeclaration = this.right.validity
      ? `@group(0) @binding(${this.left.validity ? 5 : 4}) var<storage, read> rightValidity: array<u32>;\nconst RIGHT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.right.validity)}u;`
      : '';
    const validityConditions = [
      'isFiniteValue(leftSample)',
      'isFiniteValue(rightSample)',
      ...getBandValidityConditions(this.left, 'left'),
      ...getBandValidityConditions(this.right, 'right')
    ];
    const denominatorExpression =
      this.operation === 'divide'
        ? 'rightSample'
        : this.operation === 'normalized-difference'
          ? 'leftSample + rightSample'
          : undefined;
    const denominatorValidation = denominatorExpression
      ? `\n  let denominator = ${denominatorExpression};\n  if (!isFiniteValue(denominator) || abs(denominator) <= ${getRasterFloatLiteral(this.epsilon)}) {\n    validSample = false;\n  }`
      : '';
    const resultExpression = getBandMathResultExpression(this.operation);
    const clampedExpression = this.clamp
      ? `clamp(result, ${getRasterFloatLiteral(this.clamp[0])}, ${getRasterFloatLiteral(this.clamp[1])})`
      : 'result';

    return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const LEFT_OFFSET: u32 = ${getViewElementOffset(this.left.storage.values)}u;
const RIGHT_OFFSET: u32 = ${getViewElementOffset(this.right.storage.values)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
const OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.outputValidity)}u;
@group(0) @binding(0) var<storage, read> leftValues: array<${getRasterShaderScalarType(this.left.format)}>;
@group(0) @binding(1) var<storage, read> rightValues: array<${getRasterShaderScalarType(this.right.format)}>;
@group(0) @binding(2) var<storage, read_write> outputValues: array<f32>;
@group(0) @binding(3) var<storage, read_write> outputValidity: array<u32>;
${leftValidityDeclaration}
${rightValidityDeclaration}

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let leftRawSample = leftValues[LEFT_OFFSET + pixelIndex];
  let rightRawSample = rightValues[RIGHT_OFFSET + pixelIndex];
  let leftSample = f32(leftRawSample) * ${getRasterFloatLiteral(this.left.scale ?? 1)} + ${getRasterFloatLiteral(this.left.offset ?? 0)};
  let rightSample = f32(rightRawSample) * ${getRasterFloatLiteral(this.right.scale ?? 1)} + ${getRasterFloatLiteral(this.right.offset ?? 0)};
  var validSample = ${validityConditions.join(' && ')};${denominatorValidation}
  var outputSample = bitcast<f32>(0x7fc00000u | (pixelIndex & 0u));
  if (validSample) {
    let result = ${resultExpression};
    if (isFiniteValue(result)) {
      outputSample = ${clampedExpression};
    } else {
      validSample = false;
    }
  }
  outputValues[OUTPUT_OFFSET + pixelIndex] = outputSample;
  outputValidity[OUTPUT_VALIDITY_OFFSET + pixelIndex] = select(0u, 1u, validSample);
}`;
  }
}

function isRasterBandMathOperation(value: string): value is GPURasterBandMathOperation {
  return (
    value === 'add' ||
    value === 'subtract' ||
    value === 'multiply' ||
    value === 'divide' ||
    value === 'normalized-difference'
  );
}

function getBandValidityConditions(band: GPURasterBufferBand, name: 'left' | 'right'): string[] {
  const conditions: string[] = [];
  if (band.validity) {
    const offset = name === 'left' ? 'LEFT_VALIDITY_OFFSET' : 'RIGHT_VALIDITY_OFFSET';
    conditions.push(`${name}Validity[${offset} + pixelIndex] != 0u`);
  }
  if (band.format === 'float32') {
    conditions.push(`isFiniteValue(${name}RawSample)`);
  }
  if (band.noDataValue !== undefined && !Number.isNaN(band.noDataValue)) {
    conditions.push(`${name}RawSample != ${getRasterScalarLiteral(band.noDataValue, band.format)}`);
  }
  return conditions;
}

function getBandMathResultExpression(operation: GPURasterBandMathOperation): string {
  switch (operation) {
    case 'add':
      return 'leftSample + rightSample';
    case 'subtract':
      return 'leftSample - rightSample';
    case 'multiply':
      return 'leftSample * rightSample';
    case 'divide':
      return 'leftSample / denominator';
    case 'normalized-difference':
      return '(leftSample - rightSample) / denominator';
  }
}
