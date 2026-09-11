// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  getGPUVectorFormatInfo,
  isValueListGPUVectorFormat,
  isVertexListGPUVectorFormat,
  type GPUVectorFormat
} from '@luma.gl/gpgpu/gpu-data';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {getViewBinding, getViewElementOffset, validatePackedUint32View} from './graph-data-view-utils';

const GATHER_WORKGROUP_SIZE = 256;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

/** Fixed-width graph data formats accepted by {@link GPUGather}. */
export type GPUGatherFormat = Exclude<GPUVectorFormat, `vertex-list<${string}>` | `value-list<${string}>`>;

/** Properties for one graph-native indexed gather. */
export type GPUGatherProps<T extends GPUGatherFormat = GPUGatherFormat> = {
  /** Prefix for the generated graph node. */
  id?: string;
  /** Packed fixed-width source rows. */
  source: GraphDataView<T>;
  /** Packed uint32 source-row indices. */
  indices: GraphDataView<'uint32'>;
  /** Caller-owned packed destination with the same format as source. */
  output: GraphDataView<T>;
};

/**
 * Gathers packed fixed-width rows through uint32 indices.
 *
 * Each output row receives `source[indices[i]]`. Out-of-range indices write an all-zero row.
 * The current kernel copies rows as 32-bit words, so the row byte length must be a multiple of 4.
 */
export class GPUGather<T extends GPUGatherFormat = GPUGatherFormat> {
  readonly id: string;
  readonly source: GraphDataView<T>;
  readonly indices: GraphDataView<'uint32'>;
  readonly output: GraphDataView<T>;
  readonly wordsPerRow: number;

  constructor(props: GPUGatherProps<T>) {
    this.id = props.id ?? 'gpu-gather';
    this.source = props.source;
    this.indices = props.indices;
    this.output = props.output;

    validatePackedUint32View(this.indices, `${this.id} indices`);
    validateGatherView(this.source, `${this.id} source`);
    validateGatherView(this.output, `${this.id} output`);

    if (this.source.format !== this.output.format) {
      throw new Error(`${this.id} source and output must use the same format`);
    }
    if (this.output.length < this.indices.length) {
      throw new Error(`${this.id} output must contain at least indices.length rows`);
    }
    if (this.output.buffer === this.source.buffer || this.output.buffer === this.indices.buffer) {
      throw new Error(`${this.id} output must use a separate buffer`);
    }

    this.wordsPerRow = this.source.rowByteLength / UINT32_BYTE_LENGTH;
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of [this.source, this.indices, this.output]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (this.indices.length === 0) {
      return;
    }

    const dispatchLayout = getBoundedDispatchLayout(
      'GPUGather',
      this.indices.length,
      GATHER_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    const source = makeShaderSource(this, dispatchLayout);

    graph.addComputePass({
      id: this.id,
      workload: {
        operation: 'GPUGather',
        commandCount: 1,
        maximumWorkgroupCount: dispatchLayout.x * dispatchLayout.y * dispatchLayout.z,
        maximumInvocationCount:
          dispatchLayout.x * dispatchLayout.y * dispatchLayout.z * GATHER_WORKGROUP_SIZE,
        readByteLength: this.indices.length * (UINT32_BYTE_LENGTH + this.source.rowByteLength),
        writeByteLength: this.indices.length * this.output.rowByteLength
      },
      resources: [
        {buffer: this.source, usage: 'storage-read'},
        {buffer: this.indices, usage: 'storage-read'},
        {buffer: this.output, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: this.id,
          source,
          shaderLayout: {
            bindings: [
              {name: 'sourceWords', type: 'read-only-storage', group: 0, location: 0},
              {name: 'indices', type: 'read-only-storage', group: 0, location: 1},
              {name: 'outputWords', type: 'storage', group: 0, location: 2}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const bindings: Record<string, Binding> = {
              sourceWords: getViewBinding(this.source, getBuffer),
              indices: getViewBinding(this.indices, getBuffer),
              outputWords: getViewBinding(this.output, getBuffer)
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

function validateGatherView(view: GraphDataView, name: string): void {
  if (isVertexListGPUVectorFormat(view.format) || isValueListGPUVectorFormat(view.format)) {
    throw new Error(`${name} must use a fixed-width GPU data format`);
  }
  const formatInfo = getGPUVectorFormatInfo(view.format);
  if (
    view.byteStride !== formatInfo.byteLength ||
    view.rowByteLength !== formatInfo.byteLength ||
    view.byteOffset % UINT32_BYTE_LENGTH !== 0 ||
    view.rowByteLength % UINT32_BYTE_LENGTH !== 0
  ) {
    throw new Error(`${name} must be packed, uint32-aligned GPU data with 32-bit-word rows`);
  }
}

function makeShaderSource(
  gather: GPUGather,
  dispatchLayout: ReturnType<typeof getBoundedDispatchLayout>
): string {
  return `const SOURCE_LENGTH: u32 = ${gather.source.length}u;
const INDEX_COUNT: u32 = ${gather.indices.length}u;
const WORDS_PER_ROW: u32 = ${gather.wordsPerRow}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(gather.source)}u;
const INDEX_OFFSET: u32 = ${getViewElementOffset(gather.indices)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(gather.output)}u;
@group(0) @binding(0) var<storage, read> sourceWords: array<u32>;
@group(0) @binding(1) var<storage, read> indices: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputWords: array<u32>;
@compute @workgroup_size(${GATHER_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, GATHER_WORKGROUP_SIZE)}
  if (index >= INDEX_COUNT) { return; }
  let sourceIndex = indices[INDEX_OFFSET + index];
  let outputBase = OUTPUT_OFFSET + index * WORDS_PER_ROW;
  if (sourceIndex >= SOURCE_LENGTH) {
    for (var word = 0u; word < WORDS_PER_ROW; word++) {
      outputWords[outputBase + word] = 0u;
    }
    return;
  }
  let sourceBase = SOURCE_OFFSET + sourceIndex * WORDS_PER_ROW;
  for (var word = 0u; word < WORDS_PER_ROW; word++) {
    outputWords[outputBase + word] = sourceWords[sourceBase + word];
  }
}`;
}
