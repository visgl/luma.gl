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

const SCATTER_WORKGROUP_SIZE = 256;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

/** Fixed-width graph data formats accepted by {@link GPUScatter}. */
export type GPUScatterFormat = Exclude<
  GPUVectorFormat,
  `vertex-list<${string}>` | `value-list<${string}>`
>;

/** Properties for one graph-native indexed scatter. */
export type GPUScatterProps<T extends GPUScatterFormat = GPUScatterFormat> = {
  /** Prefix for the generated graph node. */
  id?: string;
  /** Packed fixed-width source rows. */
  source: GraphDataView<T>;
  /** Packed uint32 destination-row indices. */
  indices: GraphDataView<'uint32'>;
  /** Caller-owned packed destination with the same format as source. */
  output: GraphDataView<T>;
};

/**
 * Scatters packed fixed-width rows through uint32 destination indices.
 *
 * Each source row `i` is written to `output[indices[i]]`. Out-of-range destination indices are
 * ignored. Duplicate destination indices are intentionally unordered: if multiple invocations write
 * the same output row, the final value is unspecified. Callers that need deterministic conflict
 * handling should pre-aggregate or otherwise ensure unique destination indices.
 *
 * Rows are copied as 32-bit words so float and integer formats share one kernel. Row byte length must
 * therefore be a multiple of four.
 */
export class GPUScatter<T extends GPUScatterFormat = GPUScatterFormat> {
  readonly id: string;
  readonly source: GraphDataView<T>;
  readonly indices: GraphDataView<'uint32'>;
  readonly output: GraphDataView<T>;
  readonly wordsPerRow: number;

  constructor(props: GPUScatterProps<T>) {
    this.id = props.id ?? 'gpu-scatter';
    this.source = props.source;
    this.indices = props.indices;
    this.output = props.output;

    validateScatterView(this.source, `${this.id} source`);
    validatePackedUint32View(this.indices, `${this.id} indices`);
    validateScatterView(this.output, `${this.id} output`);

    if (this.source.format !== this.output.format) {
      throw new Error(`${this.id} source and output must use the same format`);
    }
    if (this.source.length < this.indices.length) {
      throw new Error(`${this.id} source must contain at least indices.length rows`);
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
      'GPUScatter',
      this.indices.length,
      SCATTER_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    const source = makeShaderSource(this, dispatchLayout);

    graph.addComputePass({
      id: this.id,
      workload: {
        operation: 'GPUScatter',
        commandCount: 1,
        maximumWorkgroupCount: dispatchLayout.x * dispatchLayout.y * dispatchLayout.z,
        maximumInvocationCount:
          dispatchLayout.x * dispatchLayout.y * dispatchLayout.z * SCATTER_WORKGROUP_SIZE,
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

function validateScatterView(view: GraphDataView, name: string): void {
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
  scatter: GPUScatter,
  dispatchLayout: ReturnType<typeof getBoundedDispatchLayout>
): string {
  return `const INDEX_COUNT: u32 = ${scatter.indices.length}u;
const OUTPUT_LENGTH: u32 = ${scatter.output.length}u;
const WORDS_PER_ROW: u32 = ${scatter.wordsPerRow}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(scatter.source)}u;
const INDEX_OFFSET: u32 = ${getViewElementOffset(scatter.indices)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(scatter.output)}u;
@group(0) @binding(0) var<storage, read> sourceWords: array<u32>;
@group(0) @binding(1) var<storage, read> indices: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputWords: array<u32>;
@compute @workgroup_size(${SCATTER_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, SCATTER_WORKGROUP_SIZE)}
  if (index >= INDEX_COUNT) { return; }
  let destinationIndex = indices[INDEX_OFFSET + index];
  if (destinationIndex >= OUTPUT_LENGTH) { return; }

  let sourceBase = SOURCE_OFFSET + index * WORDS_PER_ROW;
  let outputBase = OUTPUT_OFFSET + destinationIndex * WORDS_PER_ROW;
  for (var word = 0u; word < WORDS_PER_ROW; word++) {
    outputWords[outputBase + word] = sourceWords[sourceBase + word];
  }
}`;
}
