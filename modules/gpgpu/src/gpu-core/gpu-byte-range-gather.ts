// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GPUCommandNode, createGPUComputeCommandNode} from './gpu-command-node';
import type {Binding} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {getGPUVectorChunks} from '@luma.gl/gpgpu/gpu-data';
import {GPUCommandGraph, type GraphDataView, type GraphVectorView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {
  doGraphDataViewsOverlap,
  getGraphDataPrefix,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';
import {alignGraphVectorViews, getGraphVectorData} from './graph-vector-view-utils';

const BYTE_RANGE_GATHER_WORKGROUP_SIZE = 256;

export type GPUByteRangeGatherProps = {
  id?: string;
  /** Packed words in global byte order; offsets are relative to the logical source. */
  source: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  sourceOffsets: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  lengths: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  /** Each range starts at or after the preceding range's end, including empty ranges. */
  outputOffsets: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  output: GraphDataView<'uint32'> | GraphVectorView<'uint32'>;
  sourceByteLength: number;
  outputByteCapacity: number;
};

/** Gathers byte ranges across independently partitioned source, metadata, and output storage. */
export class GPUByteRangeGather {
  readonly id: string;
  readonly props: Readonly<GPUByteRangeGatherProps>;

  constructor(props: GPUByteRangeGatherProps) {
    this.id = props.id ?? 'gpu-byte-range-gather';
    this.props = Object.freeze({...props, id: this.id});
    for (const [name, view] of Object.entries({
      source: props.source,
      sourceOffsets: props.sourceOffsets,
      lengths: props.lengths,
      outputOffsets: props.outputOffsets,
      output: props.output
    })) {
      for (const chunk of getGraphVectorData(view)) {
        validatePackedUint32View(chunk, `${this.id} ${name}`);
      }
    }
    if (
      props.sourceOffsets.length !== props.lengths.length ||
      props.lengths.length !== props.outputOffsets.length
    ) {
      throw new Error(`${this.id} metadata views must have matching lengths`);
    }
    for (const [name, value] of Object.entries({
      sourceByteLength: props.sourceByteLength,
      outputByteCapacity: props.outputByteCapacity
    })) {
      if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
        throw new Error(`${this.id} ${name} must be a non-negative uint32`);
      }
    }
    if (
      props.source.length * 4 < props.sourceByteLength ||
      props.output.length * 4 < props.outputByteCapacity
    ) {
      throw new Error(`${this.id} byte capacity exceeds its packed view`);
    }
    const inputBuffers = new Set(
      [props.source, props.sourceOffsets, props.lengths, props.outputOffsets].flatMap(view =>
        getGraphVectorData(view).map(chunk => chunk.buffer)
      )
    );
    const output = getGraphVectorData(props.output);
    for (const [index, chunk] of output.entries()) {
      if (inputBuffers.has(chunk.buffer)) {
        throw new Error(`${this.id} output must use separate buffers from source and metadata`);
      }
      if (output.slice(0, index).some(previous => doGraphDataViewsOverlap(previous, chunk))) {
        throw new Error(`${this.id} output chunks must not overlap`);
      }
    }
  }

  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const nodes: GPUCommandNode<Parameters>[] = [];
    const props = this.props;
    for (const view of [
      props.source,
      props.sourceOffsets,
      props.lengths,
      props.outputOffsets,
      props.output
    ]) {
      if (getGraphVectorData(view).some(chunk => chunk.buffer.graph !== graph)) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (props.outputByteCapacity === 0 || props.lengths.length === 0) return nodes;

    const metadata = alignGraphVectorViews(graph, [
      props.sourceOffsets,
      props.lengths,
      props.outputOffsets
    ]);
    const source = getGraphDataPrefix(graph, props.source, Math.ceil(props.sourceByteLength / 4));
    const sources = getGPUVectorChunks(getGraphVectorData(source)).filter(chunk => chunk.length);
    const output = getGraphDataPrefix(graph, props.output, Math.ceil(props.outputByteCapacity / 4));
    const destinations = getGPUVectorChunks(getGraphVectorData(output)).filter(
      chunk => chunk.length
    );
    for (const [outputIndex, destination] of destinations.entries()) {
      // Empty sources only need a fill; do not bind empty buffers or unused metadata.
      const sourcePasses = sources.length ? sources : [undefined];
      const metadataPasses = sources.length ? metadata : [undefined];
      for (const [metadataIndex, ranges] of metadataPasses.entries()) {
        for (const [sourceIndex, chunk] of sourcePasses.entries()) {
          const id =
            destinations.length * metadataPasses.length * sourcePasses.length === 1
              ? this.id
              : `${this.id}-output-${outputIndex}-ranges-${metadataIndex}-source-${sourceIndex}`;
          nodes.push(
            makeGatherNode(graph, {
              id,
              source: chunk?.data,
              sourceByteOffset: (chunk?.offset ?? 0) * 4,
              sourceByteLength: props.sourceByteLength,
              ranges,
              output: destination.data,
              outputByteOffset: destination.offset * 4,
              outputByteCapacity: props.outputByteCapacity,
              initialize: metadataIndex === 0 && sourceIndex === 0
            })
          );
        }
      }
    }
    return nodes;
  }
}

type GatherPass = {
  id: string;
  source?: GraphDataView<'uint32'>;
  sourceByteOffset: number;
  sourceByteLength: number;
  ranges?: readonly [GraphDataView<'uint32'>, GraphDataView<'uint32'>, GraphDataView<'uint32'>];
  output: GraphDataView<'uint32'>;
  outputByteOffset: number;
  outputByteCapacity: number;
  initialize: boolean;
};

function makeGatherNode<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: GatherPass
): GPUCommandNode<Parameters> {
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUByteRangeGather',
    props.output.length,
    BYTE_RANGE_GATHER_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const inputs =
    props.source && props.ranges
      ? [
          {name: 'sourceWords', view: props.source},
          {name: 'sourceOffsets', view: props.ranges[0]},
          {name: 'lengths', view: props.ranges[1]},
          {name: 'outputOffsets', view: props.ranges[2]}
        ]
      : [];
  return createGPUComputeCommandNode<Parameters>({
    id: props.id,
    workload: {
      operation: 'GPUByteRangeGather',
      commandCount: 1,
      maximumWorkgroupCount: dispatchLayout.x * dispatchLayout.y * dispatchLayout.z,
      maximumInvocationCount:
        dispatchLayout.x * dispatchLayout.y * dispatchLayout.z * BYTE_RANGE_GATHER_WORKGROUP_SIZE,
      readByteLength:
        inputs.reduce((total, input) => total + input.view.length * 4, 0) +
        (props.initialize ? 0 : props.output.length * 4),
      writeByteLength: props.output.length * 4
    },
    resources: [
      ...inputs.map(input => ({buffer: input.view, usage: 'storage-read' as const})),
      {buffer: props.output, usage: props.initialize ? 'storage-write' : 'storage-read-write'}
    ],
    compile: ({device}) => {
      const kernel = new Kernel(device, {
        id: props.id,
        source: makeShaderSource(props, dispatchLayout),
        shaderLayout: {
          bindings: [
            {name: 'outputWords', type: 'storage', group: 0, location: 0},
            ...inputs.map((input, index) => ({
              name: input.name,
              type: 'read-only-storage' as const,
              group: 0,
              location: index + 1
            }))
          ]
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {
            outputWords: getViewBinding(props.output, getBuffer)
          };
          for (const input of inputs) bindings[input.name] = getViewBinding(input.view, getBuffer);

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
  });
}

function makeShaderSource(
  props: GatherPass,
  dispatchLayout: ReturnType<typeof getBoundedDispatchLayout>
): string {
  const {source, ranges, output} = props;
  return /* wgsl */ `
const WORD_COUNT: u32 = ${output.length}u;
const OUTPUT_BYTE_CAPACITY: u32 = ${props.outputByteCapacity}u;
const OUTPUT_BYTE_OFFSET: u32 = ${props.outputByteOffset}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(output)}u;
@group(0) @binding(0) var<storage, read_write> outputWords: array<u32>;
${
  source && ranges
    ? `
const VALUE_COUNT: u32 = ${ranges[0].length}u;
const SOURCE_BYTE_LENGTH: u32 = ${props.sourceByteLength}u;
const SOURCE_BYTE_OFFSET: u32 = ${props.sourceByteOffset}u;
const SOURCE_CHUNK_LENGTH: u32 = ${Math.min(source.length * 4, props.sourceByteLength - props.sourceByteOffset)}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(source)}u;
const SOURCE_RANGE_OFFSET: u32 = ${getViewElementOffset(ranges[0])}u;
const LENGTH_OFFSET: u32 = ${getViewElementOffset(ranges[1])}u;
const OUTPUT_RANGE_OFFSET: u32 = ${getViewElementOffset(ranges[2])}u;
@group(0) @binding(1) var<storage, read> sourceWords: array<u32>;
@group(0) @binding(2) var<storage, read> sourceOffsets: array<u32>;
@group(0) @binding(3) var<storage, read> lengths: array<u32>;
@group(0) @binding(4) var<storage, read> outputOffsets: array<u32>;

fn readByte(byteIndex: u32) -> u32 {
  var lower = 0u;
  var upper = VALUE_COUNT;
  while (lower < upper) {
    let middle = lower + (upper - lower) / 2u;
    if (outputOffsets[OUTPUT_RANGE_OFFSET + middle] <= byteIndex) {
      lower = middle + 1u;
    } else {
      upper = middle;
    }
  }
  if (lower == 0u) {
    return 0u;
  }
  let rangeIndex = lower - 1u;
  let relative = byteIndex - outputOffsets[OUTPUT_RANGE_OFFSET + rangeIndex];
  let start = sourceOffsets[SOURCE_RANGE_OFFSET + rangeIndex];
  // Check subtraction bounds before adding GPU-provided offsets, so overflow cannot wrap.
  if (relative >= lengths[LENGTH_OFFSET + rangeIndex] || start >= SOURCE_BYTE_LENGTH) {
    return 0u;
  }
  if (relative >= SOURCE_BYTE_LENGTH - start) {
    return 0u;
  }
  let sourceByteIndex = start + relative;
  if (sourceByteIndex < SOURCE_BYTE_OFFSET) {
    return 0u;
  }
  let localByteIndex = sourceByteIndex - SOURCE_BYTE_OFFSET;
  if (localByteIndex >= SOURCE_CHUNK_LENGTH) {
    return 0u;
  }
  let word = sourceWords[SOURCE_OFFSET + localByteIndex / 4u];
  return (word >> ((localByteIndex & 3u) * 8u)) & 255u;
}
`
    : ''
}
@compute @workgroup_size(${BYTE_RANGE_GATHER_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, BYTE_RANGE_GATHER_WORKGROUP_SIZE)}
  if (index >= WORD_COUNT) {
    return;
  }
  var word = ${props.initialize ? '0u' : 'outputWords[OUTPUT_OFFSET + index]'};
${
  source && ranges
    ? `
  let byteBase = OUTPUT_BYTE_OFFSET + index * 4u;
  for (var lane = 0u; lane < 4u; lane++) {
    let byteIndex = byteBase + lane;
    if (byteIndex < OUTPUT_BYTE_CAPACITY) {
      word |= readByte(byteIndex) << (lane * 8u);
    }
  }
`
    : ''
}
  outputWords[OUTPUT_OFFSET + index] = word;
}`;
}
