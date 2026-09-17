// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GPUCommandNode, createGPUComputeCommandNode} from './gpu-command-node';
import type {Binding} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {
  getGPUVectorFormatInfo,
  getGPUVectorChunks,
  isValueListGPUVectorFormat,
  isVertexListGPUVectorFormat,
  type GPUVectorFormat
} from '@luma.gl/gpgpu/gpu-data';
import {GPUCommandGraph, type GraphDataView, type GraphVectorView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {
  getGraphDataPrefix,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';
import {alignGraphVectorViews, getGraphVectorData} from './graph-vector-view-utils';

const GATHER_WORKGROUP_SIZE = 256;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

/** Fixed-width graph data formats accepted by {@link GPUGather}. */
export type GPUGatherFormat = Exclude<
  GPUVectorFormat,
  `vertex-list<${string}>` | `value-list<${string}>`
>;

/** Properties for one graph-native indexed gather. */
export type GPUGatherProps<T extends GPUGatherFormat = GPUGatherFormat> = {
  /** Prefix for the generated graph node. */
  id?: string;
  /** Word-aligned fixed-width source rows, optionally strided; indices address global rows. */
  source: GraphDataView<T> | GraphVectorView<T>;
  /** Packed uint32 source-row indices, independently partitioned from source and output. */
  indices: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Caller-owned packed destination with the source format and capacity for every index. */
  output: GraphDataView<T> | GraphVectorView<T>;
};

/**
 * Gathers packed fixed-width rows through uint32 indices.
 *
 * Each output row receives `source[indices[i]]`. Out-of-range indices write an all-zero row.
 * The current kernel copies rows as 32-bit words, so the row byte length must be a multiple of 4.
 */
export class GPUGather<T extends GPUGatherFormat = GPUGatherFormat> {
  readonly id: string;
  readonly source: GraphDataView<T> | GraphVectorView<T>;
  readonly indices: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  readonly output: GraphDataView<T> | GraphVectorView<T>;
  readonly wordsPerRow: number;

  constructor(props: GPUGatherProps<T>) {
    this.id = props.id ?? 'gpu-gather';
    this.source = props.source;
    this.indices = props.indices;
    this.output = props.output;

    for (const chunk of getGraphVectorData(this.indices)) {
      validatePackedUint32View(chunk, `${this.id} indices`);
    }
    for (const view of [this.source, this.output]) {
      for (const chunk of getGraphVectorData(view))
        validateGatherView(chunk, this.id, view === this.output);
    }

    if (this.source.format !== this.output.format) {
      throw new Error(`${this.id} source and output must use the same format`);
    }
    if (this.output.length < this.indices.length) {
      throw new Error(`${this.id} output must contain at least indices.length rows`);
    }
    const inputBuffers = new Set([
      ...getGraphVectorData(this.source).map(chunk => chunk.buffer),
      ...getGraphVectorData(this.indices).map(chunk => chunk.buffer)
    ]);
    if (getGraphVectorData(this.output).some(chunk => inputBuffers.has(chunk.buffer))) {
      throw new Error(`${this.id} output must use a separate buffer`);
    }

    this.wordsPerRow = getGPUVectorFormatInfo(this.source.format).byteLength / UINT32_BYTE_LENGTH;
  }

  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    return getGatherCommandNodes(graph, this);
  }
}

/** Shares fixed-width gather lowering with the uint32 invalid-value specialization. @internal */
export function getGatherCommandNodes<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  gather: GPUGather,
  invalidValue = 0,
  operation = 'GPUGather'
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  for (const view of [gather.source, gather.indices, gather.output]) {
    for (const chunk of getGraphVectorData(view)) {
      if (chunk.buffer.graph !== graph) {
        throw new Error(`${gather.id} views must belong to the target graph`);
      }
    }
  }
  if (gather.indices.length === 0) return nodes;

  const output = getGraphDataPrefix(graph, gather.output, gather.indices.length);
  const spans = alignGraphVectorViews(graph, [gather.indices, output]);
  const sources = getGPUVectorChunks(getGraphVectorData(gather.source)).filter(
    chunk => chunk.length
  );
  // With no source rows, use an output-only fill pass; empty buffers need not be bound.
  const sourcePasses = sources.length ? sources : [undefined];
  for (const [spanIndex, [indices, destination]] of spans.entries()) {
    const dispatchLayout = getBoundedDispatchLayout(
      operation,
      indices.length,
      GATHER_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    for (const [sourceIndex, chunk] of sourcePasses.entries()) {
      const sourceView = chunk?.data;
      const id =
        spans.length === 1 && sourcePasses.length === 1
          ? gather.id
          : `${gather.id}-span-${spanIndex}-source-${sourceIndex}`;
      const source = makeShaderSource({
        source: sourceView,
        sourceOffset: chunk?.offset ?? 0,
        indices,
        output: destination,
        wordsPerRow: gather.wordsPerRow,
        initialize: sourceIndex === 0,
        invalidValue,
        dispatchLayout
      });
      nodes.push(
        createGPUComputeCommandNode<Parameters>({
          id,
          workload: {
            operation,
            commandCount: 1,
            maximumWorkgroupCount: dispatchLayout.x * dispatchLayout.y * dispatchLayout.z,
            maximumInvocationCount:
              dispatchLayout.x * dispatchLayout.y * dispatchLayout.z * GATHER_WORKGROUP_SIZE,
            readByteLength: sourceView
              ? indices.length * (UINT32_BYTE_LENGTH + sourceView.rowByteLength)
              : 0,
            writeByteLength: indices.length * destination.rowByteLength
          },
          resources: [
            ...(sourceView
              ? [
                  {buffer: sourceView, usage: 'storage-read' as const},
                  {buffer: indices, usage: 'storage-read' as const}
                ]
              : []),
            {buffer: destination, usage: 'storage-write'}
          ],
          compile: ({device}) => {
            const kernel = new Kernel(device, {
              id,
              source,
              shaderLayout: {
                bindings: [
                  {name: 'outputWords', type: 'storage', group: 0, location: 0},
                  ...(sourceView
                    ? [
                        {
                          name: 'sourceWords',
                          type: 'read-only-storage' as const,
                          group: 0,
                          location: 1
                        },
                        {name: 'indices', type: 'read-only-storage' as const, group: 0, location: 2}
                      ]
                    : [])
                ]
              }
            });
            return {
              encode: ({computePass, getBuffer}) => {
                const bindings: Record<string, Binding> = {
                  outputWords: getViewBinding(destination, getBuffer)
                };
                if (sourceView) {
                  bindings['sourceWords'] = getViewBinding(sourceView, getBuffer);
                  bindings['indices'] = getViewBinding(indices, getBuffer);
                }

                kernel.dispatch(computePass, {
                  bindings,
                  x: dispatchLayout.x,
                  y: dispatchLayout.y,
                  z: dispatchLayout.z
                });
              },
              destroy: () => kernel.destroy()
            };
          }
        })
      );
    }
  }
  return nodes;
}

function validateGatherView(view: GraphDataView, name: string, packed: boolean): void {
  if (isVertexListGPUVectorFormat(view.format) || isValueListGPUVectorFormat(view.format)) {
    throw new Error(`${name} must use a fixed-width GPU data format`);
  }
  const formatInfo = getGPUVectorFormatInfo(view.format);
  if (
    (packed
      ? view.byteStride !== formatInfo.byteLength
      : view.byteStride < formatInfo.byteLength || view.byteStride % UINT32_BYTE_LENGTH !== 0) ||
    view.rowByteLength !== formatInfo.byteLength ||
    view.byteOffset % UINT32_BYTE_LENGTH !== 0 ||
    view.rowByteLength % UINT32_BYTE_LENGTH !== 0
  ) {
    throw new Error(`${name} must be packed, uint32-aligned GPU data with 32-bit-word rows`);
  }
}

function makeShaderSource(props: {
  source?: GraphDataView;
  sourceOffset: number;
  indices: GraphDataView<'uint32'>;
  output: GraphDataView;
  wordsPerRow: number;
  initialize: boolean;
  invalidValue: number;
  dispatchLayout: ReturnType<typeof getBoundedDispatchLayout>;
}): string {
  const {source, indices, output, wordsPerRow, initialize, invalidValue, dispatchLayout} = props;
  return `const INDEX_COUNT: u32 = ${indices.length}u;
const WORDS_PER_ROW: u32 = ${wordsPerRow}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputWords: array<u32>;
${
  source
    ? `
const SOURCE_LENGTH: u32 = ${source.length}u;
const SOURCE_ROW_OFFSET: u32 = ${props.sourceOffset}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(source)}u;
const INDEX_OFFSET: u32 = ${getViewElementOffset(indices)}u;
@group(0) @binding(1) var<storage, read> sourceWords: array<u32>;
@group(0) @binding(2) var<storage, read> indices: array<u32>;
`
    : ''
}
@compute @workgroup_size(${GATHER_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GATHER_WORKGROUP_SIZE)}
  if (index >= INDEX_COUNT) { return; }
  let outputBase = OUTPUT_OFFSET + index * WORDS_PER_ROW;
${
  source
    ? `
  let sourceIndex = indices[INDEX_OFFSET + index];
  if (sourceIndex >= SOURCE_ROW_OFFSET && sourceIndex - SOURCE_ROW_OFFSET < SOURCE_LENGTH) {
    let sourceBase = SOURCE_OFFSET + (sourceIndex - SOURCE_ROW_OFFSET) * ${source.byteStride / UINT32_BYTE_LENGTH}u;
    for (var word = 0u; word < WORDS_PER_ROW; word++) {
      outputWords[outputBase + word] = sourceWords[sourceBase + word];
    }
    return;
  }
`
    : ''
}
${
  initialize
    ? `
  for (var word = 0u; word < WORDS_PER_ROW; word++) {
    outputWords[outputBase + word] = ${invalidValue}u;
  }
`
    : ''
}
}`;
}
