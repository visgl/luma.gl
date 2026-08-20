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
import type {GPUVolumeBufferChannel} from './types';
import {
  assertVolumeStorageBindingFits,
  getVolumeDispatchSize,
  getVolumeFloatLiteral,
  getVolumeScalarLiteral,
  getVolumeShaderScalarType,
  validateVolumeChannel,
  validateVolumeDimensions,
  validateVolumeScalarView,
  VOLUME_WORKGROUP_DIMENSION
} from './volume-utils';

/** Direction of a GPU-native volume sample classification. */
export type GPUVolumeThresholdOperation = 'above' | 'below' | 'range';

/** Literal sample threshold, ordered literal range, or caller-owned GPU threshold values. */
export type GPUVolumeThresholdValue = number | readonly [number, number] | GraphDataView<'float32'>;

/** Borrowed source samples and caller-owned uint32 destination for volume classification. */
export type GPUVolumeThresholdProps = {
  id?: string;
  width: number;
  height: number;
  depth: number;
  /** Source samples are calibrated only after exact raw-format nodata rejection. */
  input: GPUVolumeBufferChannel;
  /** Caller-owned packed uint32 selection flags, canonicalized to zero or one. */
  output: GraphDataView<'uint32'>;
  /** One value for above/below, or two ordered values for range. */
  threshold: GPUVolumeThresholdValue;
  /** Defaults to above. */
  operation?: GPUVolumeThresholdOperation;
  /** Includes values equal to threshold boundaries by default. */
  inclusive?: boolean;
};

/**
 * Classifies calibrated volume samples without reading them back or submitting commands.
 *
 * Source validity, exact native-format nodata, finite floating-point samples, calibrated values,
 * and GPU-provided thresholds are intersected before publishing the canonical output mask.
 */
export class GPUVolumeThreshold implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly input: GPUVolumeBufferChannel;
  readonly output: GraphDataView<'uint32'>;
  readonly threshold: GPUVolumeThresholdValue;
  readonly operation: GPUVolumeThresholdOperation;
  readonly inclusive: boolean;

  constructor(props: GPUVolumeThresholdProps) {
    this.id = props.id ?? 'gpu-volume-threshold';
    this.width = props.width;
    this.height = props.height;
    this.depth = props.depth;
    this.input = props.input;
    this.output = props.output;
    this.threshold = props.threshold;
    this.operation = props.operation ?? 'above';
    this.inclusive = props.inclusive ?? true;

    const voxelCount = validateVolumeDimensions(this, this.id);
    if (!['above', 'below', 'range'].includes(this.operation)) {
      throw new Error(`${this.id} operation must be above, below, or range`);
    }
    if (typeof this.inclusive !== 'boolean') {
      throw new Error(`${this.id} inclusive must be a boolean`);
    }

    const owner = validateVolumeChannel(this.input, this, `${this.id} input`);
    validateVolumeScalarView(this.output, 'uint32', voxelCount, `${this.id} output`);
    if (this.output.buffer.graph !== owner) {
      throw new Error(`${this.id} resources must belong to the same graph`);
    }
    if (
      this.output.buffer === this.input.values.buffer ||
      this.output.buffer === this.input.validity?.buffer
    ) {
      throw new Error(`${this.id} input and output must use separate buffers`);
    }

    if (typeof this.threshold === 'number') {
      if (this.operation === 'range' || !Number.isFinite(this.threshold)) {
        throw new Error(`${this.id} scalar threshold must be finite and use above or below`);
      }
      getVolumeFloatLiteral(this.threshold);
    } else if (Array.isArray(this.threshold)) {
      if (
        this.operation !== 'range' ||
        this.threshold.length !== 2 ||
        !Number.isFinite(this.threshold[0]) ||
        !Number.isFinite(this.threshold[1]) ||
        this.threshold[0] > this.threshold[1]
      ) {
        throw new Error(`${this.id} range threshold must contain two ordered finite values`);
      }
      getVolumeFloatLiteral(this.threshold[0]);
      getVolumeFloatLiteral(this.threshold[1]);
    } else {
      const threshold = this.threshold as GraphDataView<'float32'>;
      validateVolumeScalarView(
        threshold,
        'float32',
        this.operation === 'range' ? 2 : 1,
        `${this.id} threshold`
      );
      if (threshold.buffer.graph !== owner) {
        throw new Error(`${this.id} threshold must belong to the same graph`);
      }
      if (threshold.buffer === this.output.buffer) {
        throw new Error(`${this.id} threshold and output must use separate buffers`);
      }
    }

    getVolumeFloatLiteral(this.input.scale ?? 1);
    getVolumeFloatLiteral(this.input.offset ?? 0);
  }

  /** Adds one bounded three-dimensional classification pass; its pipeline belongs to the graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const gpuThreshold = getGPUThreshold(this.threshold);
    const inputViews = [
      this.input.values,
      ...(this.input.validity ? [this.input.validity] : []),
      ...(gpuThreshold ? [gpuThreshold] : [])
    ];
    for (const view of [...inputViews, this.output]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} resources must belong to the target graph`);
      }
      assertVolumeStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
    }
    const dispatch = getVolumeDispatchSize(
      graph.device,
      this.width,
      this.height,
      this.depth,
      this.id
    );

    const resources: GraphResourceUse[] = [
      {buffer: this.input.values, usage: 'storage-read'},
      {buffer: this.output, usage: 'storage-write'}
    ];
    if (this.input.validity) resources.push({buffer: this.input.validity, usage: 'storage-read'});
    if (gpuThreshold) resources.push({buffer: gpuThreshold, usage: 'storage-read'});

    graph.addComputePass({
      id: this.id,
      resources,
      compile: ({device}) => {
        const bindings: BindingDeclaration[] = [
          {name: 'sourceValues', type: 'read-only-storage', group: 0, location: 0},
          {name: 'outputValues', type: 'storage', group: 0, location: 1}
        ];
        if (this.input.validity) {
          bindings.push({name: 'sourceValidity', type: 'read-only-storage', group: 0, location: 2});
        }
        if (gpuThreshold) {
          bindings.push({
            name: 'thresholdValues',
            type: 'read-only-storage',
            group: 0,
            location: this.input.validity ? 3 : 2
          });
        }
        const computation = new Computation(device, {
          id: this.id,
          source: this.getShaderSource(gpuThreshold),
          shaderLayout: {bindings}
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const resolvedBindings: Record<string, Binding> = {
              sourceValues: getViewBinding(this.input.values, getBuffer),
              outputValues: getViewBinding(this.output, getBuffer)
            };
            if (this.input.validity) {
              resolvedBindings['sourceValidity'] = getViewBinding(this.input.validity, getBuffer);
            }
            if (gpuThreshold) {
              resolvedBindings['thresholdValues'] = getViewBinding(gpuThreshold, getBuffer);
            }
            computation.setBindings(resolvedBindings);
            computation.dispatch(computePass, dispatch[0], dispatch[1], dispatch[2]);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private getShaderSource(gpuThreshold?: GraphDataView<'float32'>): string {
    const sourceValidity = this.input.validity;
    const validityDeclaration = sourceValidity
      ? `@group(0) @binding(2) var<storage, read> sourceValidity: array<u32>;\nconst SOURCE_VALIDITY_OFFSET: u32 = ${getViewElementOffset(sourceValidity)}u;`
      : '';
    const thresholdDeclaration = gpuThreshold
      ? `@group(0) @binding(${sourceValidity ? 3 : 2}) var<storage, read> thresholdValues: array<f32>;\nconst THRESHOLD_OFFSET: u32 = ${getViewElementOffset(gpuThreshold)}u;`
      : '';
    const thresholdExpression = gpuThreshold
      ? 'thresholdValues[THRESHOLD_OFFSET]'
      : getVolumeFloatLiteral(
          typeof this.threshold === 'number'
            ? this.threshold
            : (this.threshold as readonly [number, number])[0]
        );
    const upperThresholdExpression =
      this.operation === 'range'
        ? gpuThreshold
          ? 'thresholdValues[THRESHOLD_OFFSET + 1u]'
          : getVolumeFloatLiteral((this.threshold as readonly [number, number])[1])
        : undefined;

    const validityConditions = ['isFiniteValue(sample)', 'isFiniteValue(lowerThreshold)'];
    if (sourceValidity) {
      validityConditions.push('sourceValidity[SOURCE_VALIDITY_OFFSET + voxelIndex] != 0u');
    }
    if (this.input.format === 'float32') validityConditions.push('isFiniteValue(rawSample)');
    if (this.input.noDataValue !== undefined && !Number.isNaN(this.input.noDataValue)) {
      validityConditions.push(
        `rawSample != ${getVolumeScalarLiteral(this.input.noDataValue, this.input.format)}`
      );
    }
    if (upperThresholdExpression) {
      validityConditions.push('isFiniteValue(upperThreshold)', 'lowerThreshold <= upperThreshold');
    }

    const lowerComparator = this.inclusive ? '>=' : '>';
    const upperComparator = this.inclusive ? '<=' : '<';
    const selectedExpression =
      this.operation === 'above'
        ? `sample ${lowerComparator} lowerThreshold`
        : this.operation === 'below'
          ? `sample ${upperComparator} lowerThreshold`
          : `sample ${lowerComparator} lowerThreshold && sample ${upperComparator} upperThreshold`;

    return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const DEPTH: u32 = ${this.depth}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(this.input.values)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
@group(0) @binding(0) var<storage, read> sourceValues: array<${getVolumeShaderScalarType(this.input.format)}>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<u32>;
${validityDeclaration}
${thresholdDeclaration}

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${VOLUME_WORKGROUP_DIMENSION}, ${VOLUME_WORKGROUP_DIMENSION}, ${VOLUME_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT || globalId.z >= DEPTH) { return; }
  let voxelIndex = (globalId.z * HEIGHT + globalId.y) * WIDTH + globalId.x;
  let rawSample = sourceValues[SOURCE_OFFSET + voxelIndex];
  let sample = f32(rawSample) * ${getVolumeFloatLiteral(this.input.scale ?? 1)} + ${getVolumeFloatLiteral(this.input.offset ?? 0)};
  let lowerThreshold = ${thresholdExpression};
  ${upperThresholdExpression ? `let upperThreshold = ${upperThresholdExpression};` : ''}
  let selected = ${validityConditions.join(' && ')} && (${selectedExpression});
  outputValues[OUTPUT_OFFSET + voxelIndex] = select(0u, 1u, selected);
}`;
  }
}

function getGPUThreshold(threshold: GPUVolumeThresholdValue): GraphDataView<'float32'> | undefined {
  return typeof threshold === 'number' || Array.isArray(threshold)
    ? undefined
    : (threshold as GraphDataView<'float32'>);
}
