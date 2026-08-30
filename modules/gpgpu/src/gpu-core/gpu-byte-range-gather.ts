// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

const BYTE_RANGE_GATHER_WORKGROUP_SIZE = 256;

export type GPUByteRangeGatherProps = {
  id?: string;
  source: GraphDataView<'uint32'>;
  sourceOffsets: GraphDataView<'uint32'>;
  lengths: GraphDataView<'uint32'>;
  outputOffsets: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
  sourceByteLength: number;
  outputByteCapacity: number;
};

/** Concatenates byte ranges described by per-row source offsets, lengths, and output offsets. */
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
      validatePackedUint32View(view, `${this.id} ${name}`);
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
    if (props.output.buffer === props.source.buffer) {
      throw new Error(`${this.id} source and output must use separate buffers`);
    }
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const props = this.props;
    for (const view of [
      props.source,
      props.sourceOffsets,
      props.lengths,
      props.outputOffsets,
      props.output
    ]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (props.outputByteCapacity === 0 || props.lengths.length === 0) {
      return;
    }
    const wordCount = Math.ceil(props.outputByteCapacity / 4);
    const dispatchLayout = getBoundedDispatchLayout(
      'GPUByteRangeGather',
      wordCount,
      BYTE_RANGE_GATHER_WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
    const source = makeShaderSource(props, dispatchLayout);
    graph.addComputePass({
      id: this.id,
      workload: {
        operation: 'GPUByteRangeGather',
        commandCount: 1,
        maximumWorkgroupCount: Math.ceil(wordCount / BYTE_RANGE_GATHER_WORKGROUP_SIZE),
        maximumInvocationCount:
          Math.ceil(wordCount / BYTE_RANGE_GATHER_WORKGROUP_SIZE) *
          BYTE_RANGE_GATHER_WORKGROUP_SIZE,
        readByteLength: props.sourceByteLength + props.lengths.length * 12,
        writeByteLength: props.outputByteCapacity
      },
      resources: [
        {buffer: props.source, usage: 'storage-read'},
        {buffer: props.sourceOffsets, usage: 'storage-read'},
        {buffer: props.lengths, usage: 'storage-read'},
        {buffer: props.outputOffsets, usage: 'storage-read'},
        {buffer: props.output, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: this.id,
          source,
          shaderLayout: {
            bindings: [
              {name: 'sourceWords', type: 'read-only-storage', group: 0, location: 0},
              {name: 'sourceOffsets', type: 'read-only-storage', group: 0, location: 1},
              {name: 'lengths', type: 'read-only-storage', group: 0, location: 2},
              {name: 'outputOffsets', type: 'read-only-storage', group: 0, location: 3},
              {name: 'outputWords', type: 'storage', group: 0, location: 4}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const bindings: Record<string, Binding> = {
              sourceWords: getViewBinding(props.source, getBuffer),
              sourceOffsets: getViewBinding(props.sourceOffsets, getBuffer),
              lengths: getViewBinding(props.lengths, getBuffer),
              outputOffsets: getViewBinding(props.outputOffsets, getBuffer),
              outputWords: getViewBinding(props.output, getBuffer)
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

function makeShaderSource(
  props: Readonly<GPUByteRangeGatherProps>,
  dispatchLayout: ReturnType<typeof getBoundedDispatchLayout>
): string {
  return `const VALUE_COUNT: u32 = ${props.lengths.length}u;
const SOURCE_BYTE_LENGTH: u32 = ${props.sourceByteLength}u;
const OUTPUT_BYTE_CAPACITY: u32 = ${props.outputByteCapacity}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(props.source)}u;
const SOURCE_RANGE_OFFSET: u32 = ${getViewElementOffset(props.sourceOffsets)}u;
const LENGTH_OFFSET: u32 = ${getViewElementOffset(props.lengths)}u;
const OUTPUT_RANGE_OFFSET: u32 = ${getViewElementOffset(props.outputOffsets)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> sourceWords: array<u32>;
@group(0) @binding(1) var<storage, read> sourceOffsets: array<u32>;
@group(0) @binding(2) var<storage, read> lengths: array<u32>;
@group(0) @binding(3) var<storage, read> outputOffsets: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputWords: array<u32>;
fn findRange(byteIndex: u32) -> u32 {
  var lower = 0u;
  var upper = VALUE_COUNT;
  while (lower < upper) {
    let middle = lower + (upper - lower) / 2u;
    if (outputOffsets[OUTPUT_RANGE_OFFSET + middle] <= byteIndex) { lower = middle + 1u; }
    else { upper = middle; }
  }
  return lower - 1u;
}
fn readByte(byteIndex: u32, totalByteLength: u32) -> u32 {
  if (byteIndex >= totalByteLength) { return 0u; }
  let rangeIndex = findRange(byteIndex);
  let sourceByteIndex = sourceOffsets[SOURCE_RANGE_OFFSET + rangeIndex] +
    byteIndex - outputOffsets[OUTPUT_RANGE_OFFSET + rangeIndex];
  if (sourceByteIndex >= SOURCE_BYTE_LENGTH) { return 0u; }
  let word = sourceWords[SOURCE_OFFSET + sourceByteIndex / 4u];
  return (word >> ((sourceByteIndex & 3u) * 8u)) & 255u;
}
@compute @workgroup_size(${BYTE_RANGE_GATHER_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, BYTE_RANGE_GATHER_WORKGROUP_SIZE)}
  let wordIndex = index;
  let byteBase = wordIndex * 4u;
  if (byteBase >= OUTPUT_BYTE_CAPACITY) { return; }
  let lastRange = VALUE_COUNT - 1u;
  let totalByteLength = outputOffsets[OUTPUT_RANGE_OFFSET + lastRange] + lengths[LENGTH_OFFSET + lastRange];
  var word = 0u;
  for (var lane = 0u; lane < 4u; lane++) {
    let byteIndex = byteBase + lane;
    if (byteIndex < OUTPUT_BYTE_CAPACITY) { word |= readByte(byteIndex, totalByteLength) << (lane * 8u); }
  }
  outputWords[OUTPUT_OFFSET + wordIndex] = word;
}`;
}
