// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GPUCommandNode} from './gpu-command-node';
import {
  getGPUVectorFormatInfo,
  isValueListGPUVectorFormat,
  isVertexListGPUVectorFormat,
  type GPUVectorFormat
} from '@luma.gl/gpgpu/gpu-data';
import {GPUCommandGraph, type GraphDataView, type GraphVectorView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {getViewElementOffset, validatePackedUint32View} from './graph-data-view-utils';

import {alignGraphVectorViews, getGraphVectorData} from './graph-vector-view-utils';
import {getGraphDataPrefix} from './graph-data-view-utils';
import {createChunkNode, validateChunkViews} from './gpu-chunk-utils';

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
  source: GraphDataView<T> | GraphVectorView<T>;
  /** Packed uint32 destination-row indices. */
  indices: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Caller-owned packed destination with the same format as source. */
  output: GraphDataView<T> | GraphVectorView<T>;
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
  readonly source: GraphDataView<T> | GraphVectorView<T>;
  readonly indices: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  readonly output: GraphDataView<T> | GraphVectorView<T>;
  readonly wordsPerRow: number;

  constructor(props: GPUScatterProps<T>) {
    this.id = props.id ?? 'gpu-scatter';
    this.source = props.source;
    this.indices = props.indices;
    this.output = props.output;

    for (const chunk of getGraphVectorData(this.source))
      validateScatterView(chunk, `${this.id} source`);
    for (const chunk of getGraphVectorData(this.indices))
      validatePackedUint32View(chunk, `${this.id} indices`);
    for (const chunk of getGraphVectorData(this.output))
      validateScatterView(chunk, `${this.id} output`);

    if (this.source.format !== this.output.format) {
      throw new Error(`${this.id} source and output must use the same format`);
    }
    if (this.source.length < this.indices.length) {
      throw new Error(`${this.id} source must contain at least indices.length rows`);
    }
    if (
      getGraphVectorData(this.output).some(output =>
        [...getGraphVectorData(this.source), ...getGraphVectorData(this.indices)].some(
          input => output.buffer === input.buffer
        )
      )
    ) {
      throw new Error(`${this.id} output must use a separate buffer`);
    }

    this.wordsPerRow = this.source.rowByteLength / UINT32_BYTE_LENGTH;
  }

  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    return getGPUScatterCommandNodesWithDispatchLimit(
      this,
      graph,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Shares global scatter lowering with bounded composite operations. @internal */
export function getGPUScatterCommandNodesWithDispatchLimit<Parameters>(
  scatter: GPUScatter,
  graph: GPUCommandGraph<Parameters>,
  maximum: number
): readonly GPUCommandNode<Parameters>[] {
  validateChunkViews(graph, [scatter.source, scatter.indices], [scatter.output]);
  const nodes: GPUCommandNode<Parameters>[] = [];
  const spans = alignGraphVectorViews(graph, [
    getGraphDataPrefix(graph, scatter.source, scatter.indices.length),
    scatter.indices
  ]);
  for (const [spanIndex, [source, indices]] of spans.entries()) {
    const dispatchLayout = getBoundedDispatchLayout(
      scatter.id,
      indices.length,
      SCATTER_WORKGROUP_SIZE,
      maximum
    );
    let outputStart = 0;
    for (const [outputIndex, output] of getGraphVectorData(scatter.output).entries()) {
      if (output.length)
        nodes.push(
          createChunkNode(graph, {
            id:
              spans.length === 1 && getGraphVectorData(scatter.output).length === 1
                ? scatter.id
                : `${scatter.id}-${spanIndex}-${outputIndex}`,
            inputs: {sourceWords: source, indices},
            outputs: {outputWords: output},
            dispatch: dispatchLayout,
            source: makeShaderSource(
              {source, indices, output, wordsPerRow: scatter.wordsPerRow, outputStart},
              dispatchLayout
            )
          })
        );
      outputStart += output.length;
    }
  }
  return nodes;
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
  scatter: {
    source: GraphDataView;
    indices: GraphDataView<'uint32'>;
    output: GraphDataView;
    wordsPerRow: number;
    outputStart: number;
  },
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
  if (destinationIndex < ${scatter.outputStart}u || destinationIndex - ${scatter.outputStart}u >= OUTPUT_LENGTH) { return; }

  let sourceBase = SOURCE_OFFSET + index * WORDS_PER_ROW;
  let outputBase = OUTPUT_OFFSET + (destinationIndex - ${scatter.outputStart}u) * WORDS_PER_ROW;
  for (var word = 0u; word < WORDS_PER_ROW; word++) {
    outputWords[outputBase + word] = sourceWords[sourceBase + word];
  }
}`;
}
