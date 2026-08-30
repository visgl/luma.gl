// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {getViewBinding, getViewElementOffset, validatePackedView} from './graph-data-view-utils';

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
  input: GraphDataView<'float32'> | GraphDataView<'float32x4'>;
  /** xyz in `float32x4` for gradient/curl; scalar (`float32`) for divergence/Laplacian. */
  output: GraphDataView<'float32'> | GraphDataView<'float32x4'>;
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
    const scalarInput = props.operator === 'gradient' || props.operator === 'laplacian';
    const vectorOutput = props.operator === 'gradient' || props.operator === 'curl';
    validatePackedView(this.input, [scalarInput ? 'float32' : 'float32x4'], `${this.id} input`);
    validatePackedView(this.output, [vectorOutput ? 'float32x4' : 'float32'], `${this.id} output`);
    getArrayElementOffset(this.input, this.stats.inputComponentCount, `${this.id} input`);
    getArrayElementOffset(this.output, this.stats.outputComponentCount, `${this.id} output`);
    if (
      this.input.length < this.stats.elementCount ||
      this.output.length < this.stats.elementCount
    ) {
      throw new Error(
        `${this.id} input and output must contain at least width * height * depth rows`
      );
    }
    if (this.input.buffer === this.output.buffer) {
      throw new Error(`${this.id} output must use a separate buffer from input`);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.input.buffer.graph !== graph || this.output.buffer.graph !== graph) {
      throw new Error(`${this.id} views belong to a different GPUCommandGraph`);
    }
    const support = getGPUFiniteDifference3DSupport(graph.device, this.stats);
    if (!support.supported) throw new Error(support.reason);
    const dispatchLayout = getBoundedDispatchLayout(
      this.id,
      this.stats.elementCount,
      GPU_FINITE_DIFFERENCE_3D_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    const source = getGPUFiniteDifference3DShaderSource(this, dispatchLayout);
    const inputByteLength = this.stats.elementCount * this.stats.inputComponentCount * 4;
    const outputByteLength = this.stats.elementCount * this.stats.outputComponentCount * 4;
    graph.addComputePass({
      id: this.id,
      workload: {
        operation: `GPUFiniteDifference3D.${this.stats.operator}`,
        commandCount: 1,
        maximumWorkgroupCount: dispatchLayout.x * dispatchLayout.y * dispatchLayout.z,
        maximumInvocationCount:
          dispatchLayout.x *
          dispatchLayout.y *
          dispatchLayout.z *
          GPU_FINITE_DIFFERENCE_3D_WORKGROUP_SIZE,
        readByteLength: inputByteLength * (this.stats.operator === 'laplacian' ? 13 : 9),
        writeByteLength: outputByteLength
      },
      resources: [
        {buffer: this.input, usage: 'storage-read'},
        {buffer: this.output, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: this.id,
          source,
          shaderLayout: {
            bindings: [
              {name: 'inputValues', type: 'read-only-storage', group: 0, location: 0},
              {name: 'outputValues', type: 'storage', group: 0, location: 1}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const bindings: Record<string, Binding> = {
              inputValues: getViewBinding(this.input, getBuffer),
              outputValues: getViewBinding(this.output, getBuffer)
            };
            computation.setBindings(bindings);
            computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
          },
          destroy: () => computation.destroy()
        };
      }
    });
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
  props: GPUFiniteDifference3DPlanProps
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
  const largestByteLength =
    stats.elementCount * Math.max(stats.inputComponentCount, stats.outputComponentCount) * 4;
  if (
    largestByteLength > device.limits.maxStorageBufferBindingSize ||
    largestByteLength > device.limits.maxBufferSize
  ) {
    return {supported: false, reason: 'GPUFiniteDifference3D field exceeds device limits.', stats};
  }
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
  difference: Pick<GPUFiniteDifference3D, 'input' | 'output' | 'stats'>,
  dispatchLayout: {x: number; y: number; z: number}
): string {
  const {stats} = difference;
  const inputType = stats.inputComponentCount === 1 ? 'f32' : 'vec4f';
  const outputType = stats.outputComponentCount === 1 ? 'f32' : 'vec4f';
  const periodic = stats.boundary === 'periodic';
  const firstDerivative = periodic
    ? 'return (sampleField(coordinate + axis) - sampleField(coordinate - axis)) / (2.0 * spacing);'
    : `let extent = axisExtent(axis);
  let position = axisPosition(coordinate, axis);
  if (position == 0) { return (-3.0 * sampleField(coordinate) + 4.0 * sampleField(coordinate + axis) - sampleField(coordinate + axis * 2)) / (2.0 * spacing); }
  if (position + 1 == extent) { return (3.0 * sampleField(coordinate) - 4.0 * sampleField(coordinate - axis) + sampleField(coordinate - axis * 2)) / (2.0 * spacing); }
  return (sampleField(coordinate + axis) - sampleField(coordinate - axis)) / (2.0 * spacing);`;
  const secondDerivative = periodic
    ? 'return (sampleField(coordinate + axis) - 2.0 * sampleField(coordinate) + sampleField(coordinate - axis)) / (spacing * spacing);'
    : `let extent = axisExtent(axis);
  let position = axisPosition(coordinate, axis);
  if (position == 0) { return (2.0 * sampleField(coordinate) - 5.0 * sampleField(coordinate + axis) + 4.0 * sampleField(coordinate + axis * 2) - sampleField(coordinate + axis * 3)) / (spacing * spacing); }
  if (position + 1 == extent) { return (2.0 * sampleField(coordinate) - 5.0 * sampleField(coordinate - axis) + 4.0 * sampleField(coordinate - axis * 2) - sampleField(coordinate - axis * 3)) / (spacing * spacing); }
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
const ELEMENT_COUNT: u32 = ${stats.elementCount}u;
const DX: f32 = ${stats.spacing[0]};
const DY: f32 = ${stats.spacing[1]};
const DZ: f32 = ${stats.spacing[2]};
const INPUT_OFFSET: u32 = ${getArrayElementOffset(difference.input, stats.inputComponentCount, 'input')}u;
const OUTPUT_OFFSET: u32 = ${getArrayElementOffset(difference.output, stats.outputComponentCount, 'output')}u;
@group(0) @binding(0) var<storage, read> inputValues: array<${inputType}>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<${outputType}>;

fn axisExtent(axis: vec3i) -> i32 { if (axis.x != 0) { return i32(WIDTH); } if (axis.y != 0) { return i32(HEIGHT); } return i32(DEPTH); }
fn axisPosition(coordinate: vec3i, axis: vec3i) -> i32 { if (axis.x != 0) { return coordinate.x; } if (axis.y != 0) { return coordinate.y; } return coordinate.z; }
fn sampleField(coordinate: vec3i) -> ${inputType} {
  ${wrap}
  return inputValues[INPUT_OFFSET + (u32(wrapped.z) * HEIGHT + u32(wrapped.y)) * WIDTH + u32(wrapped.x)];
}
fn firstDerivative(coordinate: vec3i, axis: vec3i, spacing: f32) -> ${inputType} { ${firstDerivative} }
fn secondDerivative(coordinate: vec3i, axis: vec3i, spacing: f32) -> ${inputType} { ${secondDerivative} }
@compute @workgroup_size(${GPU_FINITE_DIFFERENCE_3D_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GPU_FINITE_DIFFERENCE_3D_WORKGROUP_SIZE)}
  if (index >= ELEMENT_COUNT) { return; }
  let coordinate = vec3i(i32(index % WIDTH), i32((index / WIDTH) % HEIGHT), i32(index / (WIDTH * HEIGHT)));
  ${expression}
}`;
}

function getArrayElementOffset(view: GraphDataView, componentCount: 1 | 4, name: string): number {
  const componentOffset = getViewElementOffset(view);
  if (componentOffset % componentCount !== 0) {
    throw new Error(`${name} byteOffset must align with its WGSL array element type`);
  }
  return componentOffset / componentCount;
}
