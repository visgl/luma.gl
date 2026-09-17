// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Kernel} from '@luma.gl/engine';
import {getGPUVectorChunks} from '@luma.gl/gpgpu/gpu-data';
import type {GPUCommandGraph, GraphDataView, GraphVectorView} from './gpu-command-graph';
import {createGPUComputeCommandNode, type GPUCommandNode} from './gpu-command-node';
import {getGraphVectorData} from './graph-vector-view-utils';
import {
  doGraphDataViewsOverlap,
  getGraphDataPrefix,
  getViewBinding,
  getViewBindingRange,
  getViewElementOffset,
  validatePackedView
} from './graph-data-view-utils';

/** Packed dense operands retain their independent physical partitions. @internal */
export type DenseView = GraphDataView<'float32'> | GraphVectorView<'float32'>;
export type DenseChunk = {data: GraphDataView<'float32'>; offset: number; length: number};
export type DenseDispatch = {x: number; y: number; z: number};

export function validateDenseDimensions(dimensions: number[], products: number[]): void {
  if (
    dimensions.some(value => !Number.isSafeInteger(value) || value < 0 || value > 0x7fffffff) ||
    products.some(value => !Number.isSafeInteger(value) || value > 0xffffffff)
  ) {
    throw new Error(
      'Dense dimensions must be non-negative int32 values with uint32 element counts'
    );
  }
}

export function validateDenseView(view: DenseView, length: number, name: string): void {
  for (const chunk of getGraphVectorData(view)) validatePackedView(chunk, ['float32'], name);
  if (view.length < length) throw new Error(`${name} capacity is smaller than its matrix shape`);
}

export function validateDenseOutput(inputs: DenseView[], output: DenseView): void {
  const buffers = new Set(
    inputs.flatMap(view => getGraphVectorData(view).map(chunk => chunk.buffer))
  );
  const chunks = getGraphVectorData(output);
  if (chunks.some(chunk => buffers.has(chunk.buffer))) {
    throw new Error('Dense output must use separate buffers from its inputs');
  }
  for (const [index, chunk] of chunks.entries()) {
    if (chunks.slice(0, index).some(previous => doGraphDataViewsOverlap(previous, chunk))) {
      throw new Error('Dense output chunks must not overlap');
    }
  }
}

export function getDenseChunks<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: DenseView,
  length: number
): DenseChunk[] {
  if (getGraphVectorData(view).some(chunk => chunk.buffer.graph !== graph)) {
    throw new Error('Dense views must belong to the target graph');
  }
  const chunks = getGPUVectorChunks(
    getGraphVectorData(getGraphDataPrefix(graph, view, length))
  ).filter(chunk => chunk.length);
  for (const chunk of chunks) {
    if (
      getViewBindingRange(chunk.data).size > graph.device.limits.maxStorageBufferBindingSize ||
      chunk.data.buffer.byteLength > graph.device.limits.maxBufferSize
    ) {
      throw new Error('Dense operand chunk exceeds device buffer limits');
    }
  }
  return chunks;
}

/** Plans workgroups directly: MatVec uses one group per row, MatMul one per tile. */
export function getDenseDispatch<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  count: number
): DenseDispatch {
  const maximum = graph.device.limits.maxComputeWorkgroupsPerDimension;
  const x = Math.min(count, maximum);
  const y = Math.min(Math.ceil(count / x), maximum);
  const z = Math.ceil(count / x / y);
  if (
    !Number.isSafeInteger(maximum) ||
    maximum < 1 ||
    !Number.isSafeInteger(count) ||
    count < 1 ||
    z > maximum
  ) {
    throw new Error('Dense operation exceeds the bounded dispatch limit');
  }
  return {x, y, z};
}

export function getDenseWorkgroupIndex(dispatch: DenseDispatch): string {
  return `let workgroupIndex = (workgroupId.z * ${dispatch.y}u + workgroupId.y) * ${dispatch.x}u + workgroupId.x;`;
}

export function createDenseNode<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    operation: string;
    inputs: Record<string, GraphDataView<'float32'>>;
    output: GraphDataView<'float32'>;
    source: string;
    dispatch: DenseDispatch;
    accumulate?: boolean;
    tiled?: boolean;
  }
): GPUCommandNode<Parameters> {
  const limits = graph.device.limits;
  if (
    graph.device.type !== 'webgpu' ||
    limits.maxComputeInvocationsPerWorkgroup < 256 ||
    limits.maxComputeWorkgroupSizeX < (props.tiled ? 16 : 256) ||
    (props.tiled && limits.maxComputeWorkgroupSizeY < 16) ||
    limits.maxComputeWorkgroupStorageSize < (props.tiled ? 2048 : 1024) ||
    limits.maxStorageBuffersPerShaderStage < Object.keys(props.inputs).length + 1
  ) {
    throw new Error('Dense operation requires WebGPU compute limits for its workgroup kernel');
  }
  const bindings = {...props.inputs, outputValues: props.output};
  const workgroups = props.dispatch.x * props.dispatch.y * props.dispatch.z;
  return createGPUComputeCommandNode<Parameters>({
    id: props.id,
    workload: {
      operation: props.operation,
      commandCount: 1,
      maximumWorkgroupCount: workgroups,
      maximumInvocationCount: workgroups * 256,
      readByteLength:
        Object.values(props.inputs).reduce((count, view) => count + view.length * 4, 0) +
        (props.accumulate ? props.output.length * 4 : 0),
      writeByteLength: props.output.length * 4
    },
    resources: [
      ...Object.values(props.inputs).map(buffer => ({buffer, usage: 'storage-read' as const})),
      {buffer: props.output, usage: props.accumulate ? 'storage-read-write' : 'storage-write'}
    ],
    compile: ({device}) => {
      const kernel = new Kernel(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: Object.keys(bindings).map((name, location) => ({
            name,
            type: name === 'outputValues' ? 'storage' : 'read-only-storage',
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          kernel.dispatch(computePass, {
            bindings: Object.fromEntries(
              Object.entries(bindings).map(([name, view]) => [
                name,
                getViewBinding(view, getBuffer)
              ])
            ),
            x: props.dispatch.x,
            y: props.dispatch.y,
            z: props.dispatch.z
          });
        },
        destroy: () => kernel.destroy()
      };
    }
  });
}

/** A zero inner dimension writes zero each time without binding empty source buffers. */
export function createDenseZeroNode<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  operation: string,
  output: GraphDataView<'float32'>
): GPUCommandNode<Parameters> {
  const dispatch = getDenseDispatch(graph, Math.ceil(output.length / 256));
  return createDenseNode(graph, {
    id,
    operation,
    inputs: {},
    output,
    dispatch,
    source: `@group(0) @binding(0) var<storage, read_write> outputValues: array<f32>;
@compute @workgroup_size(256)
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) lane: u32) {
  ${getDenseWorkgroupIndex(dispatch)}
  if (workgroupIndex >= ${Math.ceil(output.length / 256)}u) {
    return;
  }
  let index = workgroupIndex * 256u + lane;
  if (index < ${output.length}u) {
    outputValues[${getViewElementOffset(output)}u + index] = 0.0;
  }
}`
  });
}
