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

/** Explicit treatment of samples outside the current raster grid. */
export type GPURasterBorderMode = 'clamp' | 'reflect' | 'constant' | 'nodata';

/** Either reject missing neighborhood samples or renormalize nonnegative surviving weights. */
export type GPURasterNoDataPolicy = 'propagate' | 'ignore-renormalize';

/** Symmetric radius, or explicit horizontal and vertical source-pixel radii. */
export type GPURasterNeighborhoodRadius = number | readonly [number, number];

/** Explicit source, destination, and reusable tiled-stencil execution contract. */
export type GPURasterNeighborhoodProps = {
  id?: string;
  width: number;
  height: number;
  /** Native-format nodata and validity are resolved before calibration. */
  input: GPURasterBufferBand;
  /** Separate caller-owned packed float32 output samples. */
  output: GraphDataView<'float32'>;
  /** Separate caller-owned packed uint32 validity flags. */
  outputValidity: GraphDataView<'uint32'>;
  /** Every axis is bounded to eight pixels; tuple radii permit separable passes. */
  radius: GPURasterNeighborhoodRadius;
  /** Row-major coefficients, with exactly `(2 * radiusX + 1) * (2 * radiusY + 1)` entries. */
  kernel: readonly number[];
  /** Defaults to clamp; reflect does not duplicate edge samples. */
  borderMode?: GPURasterBorderMode;
  /** Calibrated constant outside the raster grid. Defaults to zero. */
  borderValue?: number;
  /** Defaults to strict propagation. Invalid center samples always remain invalid. */
  noDataPolicy?: GPURasterNoDataPolicy;
  /** Divides by the participating coefficient sum. Defaults to false. */
  normalize?: boolean;
};

const MAXIMUM_RASTER_NEIGHBORHOOD_RADIUS = 8;

/**
 * Executes one explicitly bordered, nodata-aware weighted stencil as a graph compute pass.
 *
 * Workgroups cooperatively cache calibrated source samples and validity in local memory before
 * evaluating their shared neighborhood. Source and destination buffers never alias, center
 * invalidity is preserved, and invalid output pixels receive a canonical quiet NaN.
 */
export class GPURasterNeighborhood implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly input: GPURasterBufferBand;
  readonly output: GraphDataView<'float32'>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly radius: GPURasterNeighborhoodRadius;
  readonly horizontalRadius: number;
  readonly verticalRadius: number;
  readonly requiredHalo: number;
  readonly kernel: readonly number[];
  readonly borderMode: GPURasterBorderMode;
  readonly borderValue: number;
  readonly noDataPolicy: GPURasterNoDataPolicy;
  readonly normalize: boolean;

  private readonly kernelSum: number;

  constructor(props: GPURasterNeighborhoodProps) {
    this.id = props.id ?? 'gpu-raster-neighborhood';
    this.width = props.width;
    this.height = props.height;
    this.input = props.input;
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    this.radius = props.radius;
    this.borderMode = props.borderMode ?? 'clamp';
    this.borderValue = props.borderValue ?? 0;
    this.noDataPolicy = props.noDataPolicy ?? 'propagate';
    this.normalize = props.normalize ?? false;

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

    const radii = typeof this.radius === 'number' ? [this.radius, this.radius] : this.radius;
    if (
      !Array.isArray(radii) ||
      radii.length !== 2 ||
      !radii.every(
        radius =>
          Number.isSafeInteger(radius) &&
          radius >= 0 &&
          radius <= MAXIMUM_RASTER_NEIGHBORHOOD_RADIUS
      )
    ) {
      throw new Error(`${this.id} neighborhood radii must be integers from zero through eight`);
    }
    this.horizontalRadius = radii[0];
    this.verticalRadius = radii[1];
    this.requiredHalo = Math.max(this.horizontalRadius, this.verticalRadius);

    const kernelLength = (this.horizontalRadius * 2 + 1) * (this.verticalRadius * 2 + 1);
    if (!Array.isArray(props.kernel) || props.kernel.length !== kernelLength) {
      throw new Error(`${this.id} kernel must contain exactly one coefficient per neighborhood`);
    }
    for (const coefficient of props.kernel) {
      if (!Number.isFinite(coefficient)) {
        throw new Error(`${this.id} kernel coefficients must be finite`);
      }
      getRasterFloatLiteral(coefficient);
    }
    this.kernel = Object.freeze(props.kernel.map(coefficient => Math.fround(coefficient)));
    this.kernelSum = this.kernel.reduce((sum, coefficient) => sum + coefficient, 0);
    getRasterFloatLiteral(this.kernelSum);

    if (!['clamp', 'reflect', 'constant', 'nodata'].includes(this.borderMode)) {
      throw new Error(`${this.id} border mode must be clamp, reflect, constant, or nodata`);
    }
    if (!Number.isFinite(this.borderValue)) {
      throw new Error(`${this.id} constant border value must be finite`);
    }
    getRasterFloatLiteral(this.borderValue);
    if (!['propagate', 'ignore-renormalize'].includes(this.noDataPolicy)) {
      throw new Error(`${this.id} nodata policy must be propagate or ignore-renormalize`);
    }
    if (typeof this.normalize !== 'boolean') {
      throw new Error(`${this.id} normalize must be a boolean`);
    }
    if (this.noDataPolicy === 'ignore-renormalize' && this.kernel.some(value => value < 0)) {
      throw new Error(`${this.id} ignore-renormalize requires nonnegative kernel coefficients`);
    }
    if ((this.normalize || this.noDataPolicy === 'ignore-renormalize') && this.kernelSum === 0) {
      throw new Error(`${this.id} normalized kernels must have a nonzero coefficient sum`);
    }

    if (this.input.storage.kind !== 'buffer') {
      throw new Error(`${this.id} requires a buffer-backed input band`);
    }
    const owner = validateRasterBand(this.input, this, `${this.id} input`);
    validateRasterScalarView(this.output, 'float32', pixelCount, `${this.id} output`);
    validateRasterValidityView(this.outputValidity, pixelCount, `${this.id} output validity`);
    if (this.output.buffer.graph !== owner || this.outputValidity.buffer.graph !== owner) {
      throw new Error(`${this.id} resources must belong to the same graph`);
    }
    const inputBuffers = [
      this.input.storage.values.buffer,
      ...(this.input.validity ? [this.input.validity.buffer] : [])
    ];
    if (
      this.output.buffer === this.outputValidity.buffer ||
      inputBuffers.includes(this.output.buffer) ||
      inputBuffers.includes(this.outputValidity.buffer)
    ) {
      throw new Error(`${this.id} neighborhood inputs and outputs must use separate buffers`);
    }
    getRasterFloatLiteral(this.input.scale ?? 1);
    getRasterFloatLiteral(this.input.offset ?? 0);
  }

  /** Adds one 8×8 bounded stencil dispatch with workgroup-local source and validity tiles. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [
      this.input.storage.values,
      this.output,
      this.outputValidity,
      ...(this.input.validity ? [this.input.validity] : [])
    ];
    for (const view of views) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} resources must belong to the target graph`);
      }
      assertRasterStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
    }
    const dispatchSize = getRasterDispatchSize(graph.device, this.width, this.height, this.id);
    const tileWidth = RASTER_WORKGROUP_DIMENSION + this.horizontalRadius * 2;
    const tileHeight = RASTER_WORKGROUP_DIMENSION + this.verticalRadius * 2;
    const localStorageByteLength = tileWidth * tileHeight * Float32Array.BYTES_PER_ELEMENT * 2;
    if (localStorageByteLength > graph.device.limits.maxComputeWorkgroupStorageSize) {
      throw new Error(`${this.id} neighborhood exceeds the device workgroup storage limit`);
    }
    if (views.length > graph.device.limits.maxStorageBuffersPerShaderStage) {
      throw new Error(`${this.id} neighborhood exceeds the device storage binding count`);
    }

    const resources: GraphResourceUse[] = [
      {buffer: this.input.storage.values, usage: 'storage-read'},
      {buffer: this.output, usage: 'storage-write'},
      {buffer: this.outputValidity, usage: 'storage-write'}
    ];
    if (this.input.validity) resources.push({buffer: this.input.validity, usage: 'storage-read'});

    graph.addComputePass({
      id: this.id,
      resources,
      compile: ({device}) => {
        const bindings: BindingDeclaration[] = [
          {name: 'sourceValues', type: 'read-only-storage', group: 0, location: 0},
          {name: 'outputValues', type: 'storage', group: 0, location: 1},
          {name: 'outputValidity', type: 'storage', group: 0, location: 2}
        ];
        if (this.input.validity) {
          bindings.push({name: 'sourceValidity', type: 'read-only-storage', group: 0, location: 3});
        }
        const computation = new Computation(device, {
          id: this.id,
          source: this.getShaderSource(),
          shaderLayout: {bindings}
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const resolvedBindings: Record<string, Binding> = {
              sourceValues: getViewBinding(this.input.storage.values, getBuffer),
              outputValues: getViewBinding(this.output, getBuffer),
              outputValidity: getViewBinding(this.outputValidity, getBuffer)
            };
            if (this.input.validity) {
              resolvedBindings['sourceValidity'] = getViewBinding(this.input.validity, getBuffer);
            }
            computation.setBindings(resolvedBindings);
            computation.dispatch(computePass, dispatchSize[0], dispatchSize[1]);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private getShaderSource(): string {
    const tileWidth = RASTER_WORKGROUP_DIMENSION + this.horizontalRadius * 2;
    const tileHeight = RASTER_WORKGROUP_DIMENSION + this.verticalRadius * 2;
    const tilePixelCount = tileWidth * tileHeight;
    const validityDeclaration = this.input.validity
      ? `@group(0) @binding(3) var<storage, read> sourceValidity: array<u32>;\nconst SOURCE_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.input.validity)}u;`
      : '';
    const validityConditions = ['isFiniteValue(sample)'];
    if (this.input.format === 'float32') validityConditions.push('isFiniteValue(rawSample)');
    if (this.input.validity) {
      validityConditions.push('sourceValidity[SOURCE_VALIDITY_OFFSET + sourceIndex] != 0u');
    }
    if (this.input.noDataValue !== undefined && !Number.isNaN(this.input.noDataValue)) {
      validityConditions.push(
        `rawSample != ${getRasterScalarLiteral(this.input.noDataValue, this.input.format)}`
      );
    }
    const coefficientLiterals = this.kernel.map(getRasterFloatLiteral).join(', ');
    const outOfBoundsHandling = getOutOfBoundsHandling(this.borderMode, this.borderValue);
    const invalidNeighborHandling =
      this.noDataPolicy === 'propagate' ? 'neighborhoodIsValid = false;' : '';
    const outputExpression = this.normalize
      ? 'weightedSum / participatingWeight'
      : this.noDataPolicy === 'ignore-renormalize'
        ? `weightedSum * ${getRasterFloatLiteral(this.kernelSum)} / participatingWeight`
        : 'weightedSum';

    return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const RADIUS_X: i32 = ${this.horizontalRadius}i;
const RADIUS_Y: i32 = ${this.verticalRadius}i;
const TILE_WIDTH: u32 = ${tileWidth}u;
const TILE_PIXEL_COUNT: u32 = ${tilePixelCount}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(this.input.storage.values)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
const OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.outputValidity)}u;
const KERNEL: array<f32, ${this.kernel.length}> = array<f32, ${this.kernel.length}>(${coefficientLiterals});
@group(0) @binding(0) var<storage, read> sourceValues: array<${getRasterShaderScalarType(this.input.format)}>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<f32>;
@group(0) @binding(2) var<storage, read_write> outputValidity: array<u32>;
${validityDeclaration}
var<workgroup> neighborhoodValues: array<f32, ${tilePixelCount}>;
var<workgroup> neighborhoodValidity: array<u32, ${tilePixelCount}>;

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn reflectCoordinate(value: i32, length: i32) -> i32 {
  if (length <= 1i) { return 0i; }
  let period = (length - 1i) * 2i;
  let reflected = ((value % period) + period) % period;
  return select(reflected, period - reflected, reflected >= length);
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let localIndex = localId.y * ${RASTER_WORKGROUP_DIMENSION}u + localId.x;
  let workgroupOrigin = vec2<i32>(
    i32(workgroupId.x * ${RASTER_WORKGROUP_DIMENSION}u),
    i32(workgroupId.y * ${RASTER_WORKGROUP_DIMENSION}u)
  );

  for (
    var tileIndex = localIndex;
    tileIndex < TILE_PIXEL_COUNT;
    tileIndex += ${RASTER_WORKGROUP_DIMENSION * RASTER_WORKGROUP_DIMENSION}u
  ) {
    var sourceColumn = workgroupOrigin.x + i32(tileIndex % TILE_WIDTH) - RADIUS_X;
    var sourceRow = workgroupOrigin.y + i32(tileIndex / TILE_WIDTH) - RADIUS_Y;
    var sample = ${getRasterFloatLiteral(this.borderValue)};
    var validSample = false;
    var sampleSource = true;
    if (
      sourceColumn < 0i || sourceColumn >= i32(WIDTH) ||
      sourceRow < 0i || sourceRow >= i32(HEIGHT)
    ) {
      ${outOfBoundsHandling}
    }
    if (sampleSource) {
      let sourceIndex = u32(sourceRow) * WIDTH + u32(sourceColumn);
      let rawSample = sourceValues[SOURCE_OFFSET + sourceIndex];
      sample = f32(rawSample) * ${getRasterFloatLiteral(this.input.scale ?? 1)} + ${getRasterFloatLiteral(this.input.offset ?? 0)};
      validSample = ${validityConditions.join(' && ')};
    }
    neighborhoodValues[tileIndex] = sample;
    neighborhoodValidity[tileIndex] = select(0u, 1u, validSample);
  }
  workgroupBarrier();

  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let centerIndex = (localId.y + u32(RADIUS_Y)) * TILE_WIDTH + localId.x + u32(RADIUS_X);
  var neighborhoodIsValid = neighborhoodValidity[centerIndex] != 0u;
  var weightedSum = 0.0;
  var participatingWeight = 0.0;
  for (var kernelRow = 0u; kernelRow < ${this.verticalRadius * 2 + 1}u; kernelRow++) {
    for (var kernelColumn = 0u; kernelColumn < ${this.horizontalRadius * 2 + 1}u; kernelColumn++) {
      let kernelIndex = kernelRow * ${this.horizontalRadius * 2 + 1}u + kernelColumn;
      let coefficient = KERNEL[kernelIndex];
      if (coefficient != 0.0) {
        let tileIndex = (localId.y + kernelRow) * TILE_WIDTH + localId.x + kernelColumn;
        if (neighborhoodValidity[tileIndex] != 0u) {
          weightedSum += neighborhoodValues[tileIndex] * coefficient;
          participatingWeight += coefficient;
        } else {
          ${invalidNeighborHandling}
        }
      }
    }
  }
  ${this.normalize || this.noDataPolicy === 'ignore-renormalize' ? 'neighborhoodIsValid = neighborhoodIsValid && participatingWeight != 0.0;' : ''}
  let result = ${outputExpression};
  neighborhoodIsValid = neighborhoodIsValid && isFiniteValue(result);
  let invalidValue = bitcast<f32>(0x7fc00000u | (pixelIndex & 0u));
  outputValues[OUTPUT_OFFSET + pixelIndex] = select(invalidValue, result, neighborhoodIsValid);
  outputValidity[OUTPUT_VALIDITY_OFFSET + pixelIndex] = select(0u, 1u, neighborhoodIsValid);
}`;
  }
}

function getOutOfBoundsHandling(borderMode: GPURasterBorderMode, borderValue: number): string {
  switch (borderMode) {
    case 'clamp':
      return `sourceColumn = clamp(sourceColumn, 0i, i32(WIDTH) - 1i);\n      sourceRow = clamp(sourceRow, 0i, i32(HEIGHT) - 1i);`;
    case 'reflect':
      return `sourceColumn = reflectCoordinate(sourceColumn, i32(WIDTH));\n      sourceRow = reflectCoordinate(sourceRow, i32(HEIGHT));`;
    case 'constant':
      return `sample = ${getRasterFloatLiteral(borderValue)};\n      validSample = true;\n      sampleSource = false;`;
    case 'nodata':
      return 'sampleSource = false;';
  }
}
