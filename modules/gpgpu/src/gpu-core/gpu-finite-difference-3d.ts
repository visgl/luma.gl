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

export const GPU_FINITE_DIFFERENCE_3D_WORKGROUP_SIZE = 256;

export type GPUFiniteDifference3DOperator = 'gradient' | 'divergence' | 'curl' | 'laplacian';
export type GPUFiniteDifference3DBoundary = 'one-sided' | 'periodic';

export type GPUFiniteDifference3DPlanProps = {
  width: number;
  height: number;
  depth: number;
  spacing: readonly [number, number, number];
  operator: GPUFiniteDifference3DOperator;
  boundary?: GPUFiniteDifference3DBoundary;
};

export type GPUFiniteDifference3DProps = GPUFiniteDifference3DPlanProps & {
  id?: string;
  /** Scalar (`float32`) for gradient/Laplacian; xyz in `float32x4` for divergence/curl. */
  input: GraphDataView<'float32' | 'float32x4'> | GraphVectorView<'float32' | 'float32x4'>;
  /** xyz in `float32x4` for gradient/curl; scalar (`float32`) for divergence/Laplacian. */
  output: GraphDataView<'float32' | 'float32x4'> | GraphVectorView<'float32' | 'float32x4'>;
};

export type GPUFiniteDifference3DStats = {
  width: number;
  height: number;
  depth: number;
  elementCount: number;
  spacing: readonly [number, number, number];
  operator: GPUFiniteDifference3DOperator;
  boundary: GPUFiniteDifference3DBoundary;
  stencilOrder: 2;
  inputComponentCount: 1 | 4;
  outputComponentCount: 1 | 4;
};

export type GPUFiniteDifference3DSupport = {
  supported: boolean;
  reason?: string;
  stats?: GPUFiniteDifference3DStats;
};

/** Graph-native second-order finite differences on a regular three-dimensional sampled field. */
export class GPUFiniteDifference3D {
  readonly id: string;
  readonly input: GPUFiniteDifference3DProps['input'];
  readonly output: GPUFiniteDifference3DProps['output'];
  readonly stats: GPUFiniteDifference3DStats;

  constructor(props: GPUFiniteDifference3DProps) {
    this.id = props.id ?? `gpu-finite-difference-3d-${props.operator}`;
    this.input = props.input;
    this.output = props.output;
    this.stats = makeGPUFiniteDifference3DStats(props);
    validateFiniteDifferenceViews(this.input, this.output, this.stats);
  }

  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const support = getGPUFiniteDifference3DSupport(graph.device, {
      ...this.stats,
      input: this.input,
      output: this.output
    });
    if (!support.supported) throw new Error(support.reason);
    return getFiniteDifferenceNodes(graph, this, (pass, layout) =>
      getGPUFiniteDifference3DShaderSource({...pass, stats: this.stats}, layout)
    );
  }
}

export function makeGPUFiniteDifference3DStats(
  props: GPUFiniteDifference3DPlanProps
): GPUFiniteDifference3DStats {
  if (![props.width, props.height, props.depth].every(Number.isInteger)) {
    throw new Error('GPUFiniteDifference3D dimensions must be integers.');
  }
  if ([props.width, props.height, props.depth].some(value => value < 4)) {
    throw new Error('GPUFiniteDifference3D dimensions must be at least 4 for second-order edges.');
  }
  const elementCount = props.width * props.height * props.depth;
  if (!Number.isSafeInteger(elementCount) || elementCount > 0xffffffff) {
    throw new Error('GPUFiniteDifference3D volume must fit in a uint32 index range.');
  }
  if (
    props.spacing.length !== 3 ||
    !props.spacing.every(value => Number.isFinite(value) && value > 0)
  ) {
    throw new Error('GPUFiniteDifference3D spacing must contain three positive finite values.');
  }
  if (!['gradient', 'divergence', 'curl', 'laplacian'].includes(props.operator)) {
    throw new Error('GPUFiniteDifference3D operator is invalid.');
  }
  const boundary = props.boundary ?? 'one-sided';
  if (!['one-sided', 'periodic'].includes(boundary)) {
    throw new Error('GPUFiniteDifference3D boundary must be one-sided or periodic.');
  }
  const vectorOutput = props.operator === 'gradient' || props.operator === 'curl';
  return Object.freeze({
    width: props.width,
    height: props.height,
    depth: props.depth,
    elementCount,
    spacing: Object.freeze([...props.spacing]) as readonly [number, number, number],
    operator: props.operator,
    boundary,
    stencilOrder: 2,
    inputComponentCount: props.operator === 'gradient' || props.operator === 'laplacian' ? 1 : 4,
    outputComponentCount: vectorOutput ? 4 : 1
  });
}

export function getGPUFiniteDifference3DSupport(
  device: Device,
  props: GPUFiniteDifference3DPlanProps &
    Partial<Pick<GPUFiniteDifference3DProps, 'input' | 'output'>>
): GPUFiniteDifference3DSupport {
  let stats: GPUFiniteDifference3DStats;
  try {
    stats = makeGPUFiniteDifference3DStats(props);
  } catch (error) {
    return {supported: false, reason: (error as Error).message};
  }
  if (device.type !== 'webgpu')
    return {supported: false, reason: 'GPUFiniteDifference3D requires WebGPU.', stats};
  if (
    device.limits.maxComputeInvocationsPerWorkgroup < GPU_FINITE_DIFFERENCE_3D_WORKGROUP_SIZE ||
    device.limits.maxComputeWorkgroupSizeX < GPU_FINITE_DIFFERENCE_3D_WORKGROUP_SIZE
  ) {
    return {
      supported: false,
      reason: 'GPUFiniteDifference3D requires 256 compute invocations.',
      stats
    };
  }
  const storageError = getFiniteDifferenceStorageError(device, stats, props.input, props.output);
  if (storageError) return {supported: false, reason: storageError, stats};
  // Concrete chunk dispatches are checked during lowering.
  if (props.input && props.output) return {supported: true, stats};
  try {
    getBoundedDispatchLayout(
      'GPUFiniteDifference3D',
      stats.elementCount,
      GPU_FINITE_DIFFERENCE_3D_WORKGROUP_SIZE,
      device.limits.maxComputeWorkgroupsPerDimension
    );
  } catch (error) {
    return {supported: false, reason: (error as Error).message, stats};
  }
  return {supported: true, stats};
}

/** Returns the generated second-order WGSL kernel. @internal */
export function getGPUFiniteDifference3DShaderSource(
  difference: Pick<GPUFiniteDifferencePass, 'input' | 'output'> &
    Partial<Pick<GPUFiniteDifferencePass, 'outputOffset' | 'length' | 'sampleCount'>> & {
      stats: GPUFiniteDifference3DStats;
    },
  dispatchLayout: {x: number; y: number; z: number}
): string {
  const {stats} = difference;
  const sampleCount = difference.sampleCount ?? 0;
  const inputType = stats.inputComponentCount === 1 ? 'f32' : 'vec4f';
  const outputType = stats.outputComponentCount === 1 ? 'f32' : 'vec4f';
  const periodic = stats.boundary === 'periodic';
  const firstDerivative = periodic
    ? 'return (sampleField(coordinate + axis) - sampleField(coordinate - axis)) / (2.0 * spacing);'
    : `let extent = axisExtent(axis);
  let position = axisPosition(coordinate, axis);
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
    ? 'return (sampleField(coordinate + axis) - 2.0 * sampleField(coordinate) + sampleField(coordinate - axis)) / (spacing * spacing);'
    : `let extent = axisExtent(axis);
  let position = axisPosition(coordinate, axis);
  if (position == 0) {
    return (2.0 * sampleField(coordinate) - 5.0 * sampleField(coordinate + axis) +
      4.0 * sampleField(coordinate + axis * 2) - sampleField(coordinate + axis * 3)) / (spacing * spacing);
  }
  if (position + 1 == extent) {
    return (2.0 * sampleField(coordinate) - 5.0 * sampleField(coordinate - axis) +
      4.0 * sampleField(coordinate - axis * 2) - sampleField(coordinate - axis * 3)) / (spacing * spacing);
  }
  return (sampleField(coordinate + axis) - 2.0 * sampleField(coordinate) + sampleField(coordinate - axis)) / (spacing * spacing);`;
  const wrap = periodic
    ? `let wrapped = vec3i(
    ((coordinate.x % i32(WIDTH)) + i32(WIDTH)) % i32(WIDTH),
    ((coordinate.y % i32(HEIGHT)) + i32(HEIGHT)) % i32(HEIGHT),
    ((coordinate.z % i32(DEPTH)) + i32(DEPTH)) % i32(DEPTH));`
    : 'let wrapped = clamp(coordinate, vec3i(0), vec3i(i32(WIDTH) - 1, i32(HEIGHT) - 1, i32(DEPTH) - 1));';
  const derivativeSetup = `let derivativeX = firstDerivative(coordinate, vec3i(1, 0, 0), DX);
  let derivativeY = firstDerivative(coordinate, vec3i(0, 1, 0), DY);
  let derivativeZ = firstDerivative(coordinate, vec3i(0, 0, 1), DZ);`;
  const expression = {
    gradient: `${derivativeSetup}\n  outputValues[OUTPUT_OFFSET + index] = vec4f(derivativeX, derivativeY, derivativeZ, 0.0);`,
    divergence: `${derivativeSetup}\n  outputValues[OUTPUT_OFFSET + index] = derivativeX.x + derivativeY.y + derivativeZ.z;`,
    curl: `${derivativeSetup}\n  outputValues[OUTPUT_OFFSET + index] = vec4f(derivativeY.z - derivativeZ.y, derivativeZ.x - derivativeX.z, derivativeX.y - derivativeY.x, 0.0);`,
    laplacian: `outputValues[OUTPUT_OFFSET + index] = secondDerivative(coordinate, vec3i(1, 0, 0), DX) + secondDerivative(coordinate, vec3i(0, 1, 0), DY) + secondDerivative(coordinate, vec3i(0, 0, 1), DZ);`
  }[stats.operator];
  return `const WIDTH: u32 = ${stats.width}u;
const HEIGHT: u32 = ${stats.height}u;
const DEPTH: u32 = ${stats.depth}u;
const ELEMENT_COUNT: u32 = ${difference.length ?? stats.elementCount}u;
const OUTPUT_ROW_OFFSET: u32 = ${difference.outputOffset ?? 0}u;
const DX: f32 = ${stats.spacing[0]};
const DY: f32 = ${stats.spacing[1]};
const DZ: f32 = ${stats.spacing[2]};
const INPUT_OFFSET: u32 = ${getFiniteDifferenceArrayOffset(difference.input, stats.inputComponentCount)}u;
const OUTPUT_OFFSET: u32 = ${getFiniteDifferenceArrayOffset(difference.output, stats.outputComponentCount)}u;
@group(0) @binding(0) var<storage, read> inputValues: array<${inputType}>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<${outputType}>;

fn axisExtent(axis: vec3i) -> i32 {
  if (axis.x != 0) {
    return i32(WIDTH);
  }
  if (axis.y != 0) {
    return i32(HEIGHT);
  }
  return i32(DEPTH);
}
fn axisPosition(coordinate: vec3i, axis: vec3i) -> i32 {
  if (axis.x != 0) {
    return coordinate.x;
  }
  if (axis.y != 0) {
    return coordinate.y;
  }
  return coordinate.z;
}
${sampleCount ? 'var<private> sampleOrigin: vec3i;\nvar<private> sampleRow: u32;' : ''}

fn sampleField(coordinate: vec3i) -> ${inputType} {
  ${
    sampleCount
      ? getFiniteDifferenceSampleSource(3, sampleCount)
      : `${wrap}
  return inputValues[INPUT_OFFSET + (u32(wrapped.z) * HEIGHT + u32(wrapped.y)) * WIDTH + u32(wrapped.x)];`
  }
}
fn firstDerivative(coordinate: vec3i, axis: vec3i, spacing: f32) -> ${inputType} {
  ${firstDerivative}
}
fn secondDerivative(coordinate: vec3i, axis: vec3i, spacing: f32) -> ${inputType} {
  ${secondDerivative}
}
@compute @workgroup_size(${GPU_FINITE_DIFFERENCE_3D_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_FINITE_DIFFERENCE_3D_WORKGROUP_SIZE)}
  if (index >= ELEMENT_COUNT) {
    return;
  }
  let row = OUTPUT_ROW_OFFSET + index;
  let coordinate = vec3i(i32(row % WIDTH), i32((row / WIDTH) % HEIGHT), i32(row / (WIDTH * HEIGHT)));
  ${sampleCount ? 'sampleOrigin = coordinate;\n  sampleRow = index;' : ''}
  ${expression}
}`;
}
