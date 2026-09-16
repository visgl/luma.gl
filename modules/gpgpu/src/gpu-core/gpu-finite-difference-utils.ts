// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Computation} from '@luma.gl/engine';
import type {Device} from '@luma.gl/core';
import {getGPUVectorChunks} from '@luma.gl/gpgpu/gpu-data';
import {type GPUCommandNode, createGPUComputeCommandNode} from './gpu-command-node';
import {type GPUCommandGraph, type GraphDataView, type GraphVectorView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {getGraphVectorData} from './graph-vector-view-utils';
import {
  createTransientView,
  doGraphDataViewsOverlap,
  getGraphDataPrefix,
  getViewBinding,
  getViewBindingRange,
  getViewElementOffset,
  validatePackedView
} from './graph-data-view-utils';

type Format = 'float32' | 'float32x2' | 'float32x4';
type Field = GraphDataView<Format> | GraphVectorView<Format>;
type Stats = {
  width: number;
  height: number;
  depth?: number;
  elementCount: number;
  inputComponentCount: number;
  outputComponentCount: number;
  operator: string;
  boundary: string;
};

/** Atomic storage and logical addressing for one stencil evaluation. @internal */
export type GPUFiniteDifferencePass = {
  input: GraphDataView<Format>;
  output: GraphDataView<Format>;
  outputOffset: number;
  length: number;
  sampleCount: number;
};

export function getFiniteDifferenceArrayOffset(view: GraphDataView, components: number): number {
  const offset = getViewElementOffset(view);
  if (offset % components !== 0) {
    throw new Error('Finite-difference byteOffset must align with its WGSL array element type');
  }
  return offset / components;
}

export function validateFiniteDifferenceViews(input: Field, output: Field, stats: Stats): void {
  for (const [view, components] of [
    [input, stats.inputComponentCount],
    [output, stats.outputComponentCount]
  ] as const) {
    const format = components === 1 ? 'float32' : components === 2 ? 'float32x2' : 'float32x4';
    if (view.format !== format || view.length < stats.elementCount) {
      throw new Error(
        'Finite-difference input and output must match the operator format and contain the field'
      );
    }
    for (const chunk of getGraphVectorData(view)) {
      validatePackedView(chunk, [format], 'Finite-difference view');
      getFiniteDifferenceArrayOffset(chunk, components);
    }
  }
  const inputs = new Set(getGraphVectorData(input).map(chunk => chunk.buffer));
  const outputs = getGraphVectorData(output);
  for (const [index, chunk] of outputs.entries()) {
    if (inputs.has(chunk.buffer))
      throw new Error('Finite-difference output must use separate buffers');
    if (outputs.slice(0, index).some(previous => doGraphDataViewsOverlap(previous, chunk))) {
      throw new Error('Finite-difference output chunks must not overlap');
    }
  }
}

/** Checks caller storage when supplied; plan-only queries retain the single-buffer estimate. */
export function getFiniteDifferenceStorageError(
  device: Device,
  stats: Stats,
  input?: Field,
  output?: Field
): string | undefined {
  const bindingLimit = device.limits.maxStorageBufferBindingSize;
  const bufferLimit = device.limits.maxBufferSize;
  if (!input || !output) {
    const bytes =
      stats.elementCount * Math.max(stats.inputComponentCount, stats.outputComponentCount) * 4;
    return bytes > bindingLimit || bytes > bufferLimit
      ? 'Finite-difference field exceeds device limits.'
      : undefined;
  }
  try {
    validateFiniteDifferenceViews(input, output, stats);
    for (const view of [input, output]) {
      let remaining = stats.elementCount;
      for (const chunk of getGraphVectorData(view)) {
        const length = Math.min(remaining, chunk.length);
        if (length > 0) {
          const bindingSize =
            getViewBindingRange(chunk).size - (chunk.length - length) * chunk.byteStride;
          if (bindingSize > bindingLimit || chunk.buffer.byteLength > bufferLimit) {
            return 'Finite-difference chunk exceeds device buffer limits';
          }
        }
        remaining -= length;
        if (!remaining) break;
      }
    }
  } catch (error) {
    return (error as Error).message;
  }
  return undefined;
}

/** Gathers bounded stencil samples, preserving arithmetic order across source chunks. */
export function getFiniteDifferenceNodes<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  operation: {id: string; input: Field; output: Field; stats: Stats},
  makeSource: (pass: GPUFiniteDifferencePass, layout: {x: number; y: number; z: number}) => string
): readonly GPUCommandNode<Parameters>[] {
  const {id, stats} = operation;
  for (const view of [operation.input, operation.output]) {
    if (getGraphVectorData(view).some(chunk => chunk.buffer.graph !== graph)) {
      throw new Error(`${id} views belong to a different GPUCommandGraph`);
    }
  }
  const inputs = getGPUVectorChunks(
    getGraphVectorData(getGraphDataPrefix(graph, operation.input, stats.elementCount))
  ).filter(chunk => chunk.length);
  const outputs = getGPUVectorChunks(
    getGraphVectorData(getGraphDataPrefix(graph, operation.output, stats.elementCount))
  ).filter(chunk => chunk.length);
  for (const chunk of [...inputs, ...outputs]) {
    if (
      getViewBindingRange(chunk.data).size > graph.device.limits.maxStorageBufferBindingSize ||
      chunk.data.buffer.byteLength > graph.device.limits.maxBufferSize
    ) {
      throw new Error(`${id} chunk exceeds device buffer limits`);
    }
  }
  const sampleCount = inputs.length > 1 ? (stats.depth === undefined ? 13 : 19) : 0;
  // Reuse bounded algorithm scratch; caller buffers and their chunk topology stay untouched.
  const blockLength = sampleCount
    ? Math.min(
        4096,
        Math.floor(
          Math.min(
            graph.device.limits.maxStorageBufferBindingSize,
            graph.device.limits.maxBufferSize
          ) /
            (sampleCount * stats.inputComponentCount * 4)
        ),
        outputs.reduce((maximum, chunk) => Math.max(maximum, chunk.length), 0)
      )
    : stats.elementCount;
  if (blockLength < 1) throw new Error(`${id} device cannot hold one stencil`);
  const scratch = sampleCount
    ? createTransientView(graph, `${id}-samples`, operation.input.format, blockLength * sampleCount)
    : undefined;
  const nodes: GPUCommandNode<Parameters>[] = [];
  let passIndex = 0;
  for (const destination of outputs) {
    for (let offset = 0; offset < destination.length; offset += blockLength) {
      const length = Math.min(blockLength, destination.length - offset);
      const output = graph.createDataView(destination.data.buffer, {
        format: destination.data.format,
        byteOffset: destination.data.byteOffset + offset * destination.data.byteStride,
        length
      });
      const outputOffset = destination.offset + offset;
      if (scratch) {
        for (const source of inputs) {
          const layout = getBoundedDispatchLayout(
            id,
            length * sampleCount,
            256,
            graph.device.limits.maxComputeWorkgroupsPerDimension
          );
          nodes.push(
            makeComputeNode(
              `${id}-gather-${passIndex++}`,
              'GPUFiniteDifference.gather',
              source.data,
              scratch,
              makeSampleGatherSource(
                source.data,
                source.offset,
                outputOffset,
                length,
                sampleCount,
                stats,
                layout
              ),
              layout,
              length * sampleCount * stats.inputComponentCount * 4,
              length * sampleCount * stats.inputComponentCount * 4
            )
          );
        }
      }
      const pass = {input: scratch ?? inputs[0].data, output, outputOffset, length, sampleCount};
      const layout = getBoundedDispatchLayout(
        id,
        length,
        256,
        graph.device.limits.maxComputeWorkgroupsPerDimension
      );
      nodes.push(
        makeComputeNode(
          !scratch && outputs.length === 1 ? id : `${id}-evaluate-${passIndex++}`,
          `GPUFiniteDifference${stats.depth === undefined ? '2D' : '3D'}.${stats.operator}`,
          pass.input,
          output,
          makeSource(pass, layout),
          layout,
          length *
            stats.inputComponentCount *
            4 *
            (stats.operator === 'laplacian'
              ? stats.depth === undefined
                ? 9
                : 13
              : stats.depth === undefined
                ? 7
                : 9),
          length * stats.outputComponentCount * 4
        )
      );
    }
  }
  return nodes;
}

function makeComputeNode<Parameters>(
  id: string,
  operation: string,
  input: GraphDataView,
  output: GraphDataView,
  source: string,
  layout: {x: number; y: number; z: number},
  readByteLength: number,
  writeByteLength: number
): GPUCommandNode<Parameters> {
  return createGPUComputeCommandNode({
    id,
    resources: [
      {buffer: input, usage: 'storage-read'},
      {buffer: output, usage: 'storage-write'}
    ],
    workload: {
      operation,
      commandCount: 1,
      maximumWorkgroupCount: layout.x * layout.y * layout.z,
      maximumInvocationCount: layout.x * layout.y * layout.z * 256,
      readByteLength,
      writeByteLength
    },
    compile: ({device}) => {
      const computation = new Computation(device, {
        id,
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
          computation.setBindings({
            inputValues: getViewBinding(input, getBuffer),
            outputValues: getViewBinding(output, getBuffer)
          });
          computation.dispatch(computePass, layout.x, layout.y, layout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function makeSampleGatherSource(
  input: GraphDataView,
  inputOffset: number,
  outputOffset: number,
  length: number,
  sampleCount: number,
  stats: Stats,
  layout: {x: number; y: number; z: number}
): string {
  const inputType = stats.inputComponentCount === 1 ? 'f32' : `vec${stats.inputComponentCount}f`;
  const wrap =
    stats.boundary === 'periodic'
      ? 'coordinate = ((coordinate % extent) + extent) % extent;'
      : 'coordinate = clamp(coordinate, vec3i(0), extent - vec3i(1));';
  return `@group(0) @binding(0) var<storage, read> inputValues: array<${inputType}>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<${inputType}>;

@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getBoundedInvocationIndexSource(layout, 256)}
  if (index >= ${length * sampleCount}u) {
    return;
  }
  let row = ${outputOffset}u + index / ${sampleCount}u;
  let slot = index % ${sampleCount}u;
  var coordinate = vec3i(i32(row % ${stats.width}u), i32((row / ${stats.width}u) % ${stats.height}u), i32(row / ${stats.width * stats.height}u));
  if (slot != 0u) {
    let axis = (slot - 1u) / 6u;
    let distance = (slot - 1u) % 6u;
    coordinate[axis] += select(i32(distance) + 1, 2 - i32(distance), distance >= 3u);
  }
  let extent = vec3i(${stats.width}, ${stats.height}, ${stats.depth ?? 1});
  ${wrap}
  let source = (u32(coordinate.z) * ${stats.height}u + u32(coordinate.y)) * ${stats.width}u + u32(coordinate.x);
  if (source >= ${inputOffset}u && source - ${inputOffset}u < ${input.length}u) {
    outputValues[index] = inputValues[${getFiniteDifferenceArrayOffset(input, stats.inputComponentCount)}u + source - ${inputOffset}u];
  }
}`;
}

/** Samples pre-gathered neighbors using the same stencil expressions as the atomic path. */
export function getFiniteDifferenceSampleSource(dimensions: 2 | 3, sampleCount: number): string {
  return `let delta = coordinate - sampleOrigin;
  var slot = 0u;
  for (var axis = 0u; axis < ${dimensions}u; axis++) {
    if (delta[axis] != 0) {
      let distance = u32(abs(delta[axis]));
      slot = 1u + axis * 6u + select(distance - 1u, distance + 2u, delta[axis] < 0);
    }
  }
  return inputValues[sampleRow * ${sampleCount}u + slot];`;
}
