// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUCommandNode} from './gpu-command-node';
import type {Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView, type GraphVectorView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {
  getFiniteDifferenceArrayOffset,
  getFiniteDifferenceStorageError,
  getFiniteDifferenceNodes,
  getFiniteDifferenceSampleSource,
  validateFiniteDifferenceViews,
  type GPUFiniteDifferencePass
} from './gpu-finite-difference-utils';

/** Number of invocations in one finite-difference workgroup. */
export const GPU_FINITE_DIFFERENCE_2D_WORKGROUP_SIZE = 256;

/** Differential operator evaluated over a regularly sampled two-dimensional field. */
export type GPUFiniteDifference2DOperator = 'gradient' | 'divergence' | 'curl' | 'laplacian';

/** Sampling policy at the edge of the field. */
export type GPUFiniteDifference2DBoundary = 'one-sided' | 'periodic';

/** Device-independent dimensions and numerical policy. */
export type GPUFiniteDifference2DPlanProps = {
  width: number;
  height: number;
  spacing: readonly [number, number];
  operator: GPUFiniteDifference2DOperator;
  boundary?: GPUFiniteDifference2DBoundary;
};

/** Construction properties for one graph-native differential operator. */
export type GPUFiniteDifference2DProps = GPUFiniteDifference2DPlanProps & {
  id?: string;
  /** Scalar (`float32`) for gradient/Laplacian; vector (`float32x2`) for divergence/curl. */
  input: GraphDataView<'float32' | 'float32x2'> | GraphVectorView<'float32' | 'float32x2'>;
  /** Vector (`float32x2`) for gradient; scalar (`float32`) for all other operators. */
  output: GraphDataView<'float32' | 'float32x2'> | GraphVectorView<'float32' | 'float32x2'>;
};

/** Immutable workload and discretization description. */
export type GPUFiniteDifference2DStats = {
  width: number;
  height: number;
  elementCount: number;
  spacing: readonly [number, number];
  operator: GPUFiniteDifference2DOperator;
  boundary: GPUFiniteDifference2DBoundary;
  stencilOrder: 2;
  inputComponentCount: 1 | 2;
  outputComponentCount: 1 | 2;
};

/** Result returned by {@link getGPUFiniteDifference2DSupport}. */
export type GPUFiniteDifference2DSupport = {
  supported: boolean;
  reason?: string;
  stats?: GPUFiniteDifference2DStats;
};

/**
 * Graph-native second-order finite differences on a regular 2D sampled field.
 *
 * Interior samples use centered differences. `periodic` wraps both axes. `one-sided` uses
 * second-order forward/backward first derivatives and second-order one-sided Laplacians at the
 * boundary, so physical spacing and accuracy do not silently change at the edge.
 */
export class GPUFiniteDifference2D {
  readonly id: string;
  readonly input: GPUFiniteDifference2DProps['input'];
  readonly output: GPUFiniteDifference2DProps['output'];
  readonly stats: GPUFiniteDifference2DStats;

  constructor(props: GPUFiniteDifference2DProps) {
    this.id = props.id ?? `gpu-finite-difference-2d-${props.operator}`;
    this.input = props.input;
    this.output = props.output;
    this.stats = makeGPUFiniteDifference2DStats(props);

    validateFiniteDifferenceViews(this.input, this.output, this.stats);
  }

  /** Returns compute nodes without compiling, submitting, or reading back. */
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const support = getGPUFiniteDifference2DSupport(graph.device, {
      ...this.stats,
      input: this.input,
      output: this.output
    });
    if (!support.supported) throw new Error(support.reason);
    return getFiniteDifferenceNodes(graph, this, (pass, layout) =>
      getGPUFiniteDifference2DShaderSource({...pass, stats: this.stats}, layout)
    );
  }
}

/** Builds and validates the immutable numerical plan. */
export function makeGPUFiniteDifference2DStats(
  props: GPUFiniteDifference2DPlanProps
): GPUFiniteDifference2DStats {
  if (!Number.isInteger(props.width) || !Number.isInteger(props.height)) {
    throw new Error('GPUFiniteDifference2D width and height must be integers.');
  }
  if (props.width < 4 || props.height < 4) {
    throw new Error('GPUFiniteDifference2D dimensions must be at least 4 for second-order edges.');
  }
  const elementCount = props.width * props.height;
  if (!Number.isSafeInteger(elementCount) || elementCount > 0xffffffff) {
    throw new Error('GPUFiniteDifference2D width * height must fit in a uint32 index range.');
  }
  if (
    props.spacing.length !== 2 ||
    !props.spacing.every(value => Number.isFinite(value) && value > 0)
  ) {
    throw new Error('GPUFiniteDifference2D spacing must contain two positive finite values.');
  }
  if (!['gradient', 'divergence', 'curl', 'laplacian'].includes(props.operator)) {
    throw new Error('GPUFiniteDifference2D operator is invalid.');
  }
  const boundary = props.boundary ?? 'one-sided';
  if (!['one-sided', 'periodic'].includes(boundary)) {
    throw new Error('GPUFiniteDifference2D boundary must be one-sided or periodic.');
  }
  return Object.freeze({
    width: props.width,
    height: props.height,
    elementCount,
    spacing: Object.freeze([props.spacing[0], props.spacing[1]]) as readonly [number, number],
    operator: props.operator,
    boundary,
    stencilOrder: 2,
    inputComponentCount: props.operator === 'gradient' || props.operator === 'laplacian' ? 1 : 2,
    outputComponentCount: props.operator === 'gradient' ? 2 : 1
  });
}

/** Reports whether a device can execute the requested field size. */
export function getGPUFiniteDifference2DSupport(
  device: Device,
  props: GPUFiniteDifference2DPlanProps &
    Partial<Pick<GPUFiniteDifference2DProps, 'input' | 'output'>>
): GPUFiniteDifference2DSupport {
  let stats: GPUFiniteDifference2DStats;
  try {
    stats = makeGPUFiniteDifference2DStats(props);
  } catch (error) {
    return {supported: false, reason: (error as Error).message};
  }
  if (device.type !== 'webgpu') {
    return {supported: false, reason: 'GPUFiniteDifference2D requires WebGPU.', stats};
  }
  if (
    device.limits.maxComputeInvocationsPerWorkgroup < GPU_FINITE_DIFFERENCE_2D_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_FINITE_DIFFERENCE_2D_WORKGROUP_SIZE
  ) {
    return {
      supported: false,
      reason: 'GPUFiniteDifference2D requires 256 compute invocations.',
      stats
    };
  }
  const storageError = getFiniteDifferenceStorageError(device, stats, props.input, props.output);
  if (storageError) return {supported: false, reason: storageError, stats};
  // Concrete chunk dispatches are checked during lowering.
  if (props.input && props.output) return {supported: true, stats};
  try {
    getBoundedDispatchLayout(
      'GPUFiniteDifference2D',
      stats.elementCount,
      GPU_FINITE_DIFFERENCE_2D_WORKGROUP_SIZE,
      device.limits.maxComputeWorkgroupsPerDimension
    );
  } catch (error) {
    return {supported: false, reason: (error as Error).message, stats};
  }
  return {supported: true, stats};
}

/** Returns the generated second-order WGSL kernel. @internal */
export function getGPUFiniteDifference2DShaderSource(
  difference: Pick<GPUFiniteDifferencePass, 'input' | 'output'> &
    Partial<Pick<GPUFiniteDifferencePass, 'outputOffset' | 'length' | 'sampleCount'>> & {
      stats: GPUFiniteDifference2DStats;
    },
  dispatchLayout: {x: number; y: number; z: number}
): string {
  const {stats} = difference;
  const sampleCount = difference.sampleCount ?? 0;
  const inputType = stats.inputComponentCount === 1 ? 'f32' : 'vec2f';
  const outputType = stats.outputComponentCount === 1 ? 'f32' : 'vec2f';
  const periodic = stats.boundary === 'periodic';
  const firstDerivative = periodic
    ? `return (sampleField(coordinate + axis) - sampleField(coordinate - axis)) / (2.0 * spacing);`
    : `let extent = i32(select(HEIGHT, WIDTH, axis.x != 0));
  let position = select(coordinate.y, coordinate.x, axis.x != 0);
  if (position == 0) {
    return (-3.0 * sampleField(coordinate) + 4.0 * sampleField(coordinate + axis) -
      sampleField(coordinate + axis * 2)) / (2.0 * spacing);
  }
  if (position + 1 == extent) {
    return (3.0 * sampleField(coordinate) - 4.0 * sampleField(coordinate - axis) +
      sampleField(coordinate - axis * 2)) / (2.0 * spacing);
  }
  return (sampleField(coordinate + axis) - sampleField(coordinate - axis)) / (2.0 * spacing);`;
  const secondDerivative = periodic
    ? `return (sampleField(coordinate + axis) - 2.0 * sampleField(coordinate) +
    sampleField(coordinate - axis)) / (spacing * spacing);`
    : `let extent = i32(select(HEIGHT, WIDTH, axis.x != 0));
  let position = select(coordinate.y, coordinate.x, axis.x != 0);
  if (position == 0) {
    return (2.0 * sampleField(coordinate) - 5.0 * sampleField(coordinate + axis) +
      4.0 * sampleField(coordinate + axis * 2) - sampleField(coordinate + axis * 3)) /
      (spacing * spacing);
  }
  if (position + 1 == extent) {
    return (2.0 * sampleField(coordinate) - 5.0 * sampleField(coordinate - axis) +
      4.0 * sampleField(coordinate - axis * 2) - sampleField(coordinate - axis * 3)) /
      (spacing * spacing);
  }
  return (sampleField(coordinate + axis) - 2.0 * sampleField(coordinate) +
    sampleField(coordinate - axis)) / (spacing * spacing);`;
  const wrapCoordinate = periodic
    ? `let wrapped = vec2i(
    ((coordinate.x % i32(WIDTH)) + i32(WIDTH)) % i32(WIDTH),
    ((coordinate.y % i32(HEIGHT)) + i32(HEIGHT)) % i32(HEIGHT)
  );`
    : `let wrapped = clamp(coordinate, vec2i(0), vec2i(i32(WIDTH) - 1, i32(HEIGHT) - 1));`;
  const expression = {
    gradient: `vec2f(firstDerivative(coordinate, vec2i(1, 0), DX), firstDerivative(coordinate, vec2i(0, 1), DY))`,
    divergence: `firstDerivative(coordinate, vec2i(1, 0), DX).x + firstDerivative(coordinate, vec2i(0, 1), DY).y`,
    curl: `firstDerivative(coordinate, vec2i(1, 0), DX).y - firstDerivative(coordinate, vec2i(0, 1), DY).x`,
    laplacian: `secondDerivative(coordinate, vec2i(1, 0), DX) + secondDerivative(coordinate, vec2i(0, 1), DY)`
  }[stats.operator];

  return `const WIDTH: u32 = ${stats.width}u;
const HEIGHT: u32 = ${stats.height}u;
const ELEMENT_COUNT: u32 = ${difference.length ?? stats.elementCount}u;
const OUTPUT_ROW_OFFSET: u32 = ${difference.outputOffset ?? 0}u;
const DX: f32 = ${stats.spacing[0]};
const DY: f32 = ${stats.spacing[1]};
const INPUT_OFFSET: u32 = ${getFiniteDifferenceArrayOffset(difference.input, stats.inputComponentCount)}u;
const OUTPUT_OFFSET: u32 = ${getFiniteDifferenceArrayOffset(difference.output, stats.outputComponentCount)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<${inputType}>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<${outputType}>;

${sampleCount ? 'var<private> sampleOrigin: vec2i;\nvar<private> sampleRow: u32;' : ''}

fn sampleField(coordinate: vec2i) -> ${inputType} {
  ${
    sampleCount
      ? getFiniteDifferenceSampleSource(2, sampleCount)
      : `${wrapCoordinate}
  return inputValues[INPUT_OFFSET + u32(wrapped.y) * WIDTH + u32(wrapped.x)];`
  }
}

fn firstDerivative(coordinate: vec2i, axis: vec2i, spacing: f32) -> ${inputType} {
  ${firstDerivative}
}

fn secondDerivative(coordinate: vec2i, axis: vec2i, spacing: f32) -> ${inputType} {
  ${secondDerivative}
}

@compute @workgroup_size(${GPU_FINITE_DIFFERENCE_2D_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_FINITE_DIFFERENCE_2D_WORKGROUP_SIZE)}
  if (index >= ELEMENT_COUNT) { return; }
  let row = OUTPUT_ROW_OFFSET + index;
  let coordinate = vec2i(i32(row % WIDTH), i32(row / WIDTH));
  ${sampleCount ? 'sampleOrigin = coordinate;\n  sampleRow = index;' : ''}
  outputValues[OUTPUT_OFFSET + index] = ${expression};
}`;
}
