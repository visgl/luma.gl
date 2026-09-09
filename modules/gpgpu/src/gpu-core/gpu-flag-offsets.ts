// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, GraphVectorView, type GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout} from './gpu-dispatch-utils';
import {GPUScan, type GPUScanInput} from './gpu-scan';
import {
  getViewBinding,
  getViewElementOffset,
  validateMatchingVectorTopology,
  validatePackedUint32View
} from './graph-data-view-utils';

const WORKGROUP_SIZE = 256;

/** Properties for materializing dense indices and a count from binary flags. */
export type GPUFlagOffsetsProps = {
  /** Prefix for generated graph node IDs. */
  id?: string;
  /** Packed zero-or-one flags. */
  flags: GPUScanInput;
  /** Exclusive dense index for every flag. */
  offsets: GPUScanInput;
  /** Single uint32 receiving the number of set flags. */
  count: GraphDataView<'uint32'>;
};

/**
 * Converts binary flags into exclusive dense offsets and a GPU-resident count.
 *
 * Use this small primitive when a classifier has already identified selected slots and later graph
 * nodes need stable destinations or a valid-prefix length. It is also the reusable building block
 * for nullable values and each logical element depth in nested column layouts.
 */
export class GPUFlagOffsets {
  readonly id: string;
  readonly props: Readonly<GPUFlagOffsetsProps>;

  constructor(props: GPUFlagOffsetsProps) {
    this.id = props.id ?? 'gpu-flag-offsets';
    this.props = Object.freeze({...props, id: this.id});
    validateConfiguration(this.props);
  }

  /** Adds one exclusive scan and one scalar publication pass to a command graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const {flags, offsets, count} = this.props;
    for (const view of [...getChunks(flags), ...getChunks(offsets), count]) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (flags.length > 0) {
      new GPUScan({
        id: `${this.id}-scan`,
        input: flags,
        output: offsets,
        mode: 'exclusive'
      }).addToGraph(graph);
    }
    addCountPass(graph, this.props);
  }
}

function addCountPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUFlagOffsetsProps>
): void {
  const hasValues = props.flags.length > 0;
  const flagChunk = hasValues ? getLastNonEmptyChunk(props.flags) : undefined;
  const offsetChunk = hasValues ? getLastNonEmptyChunk(props.offsets) : undefined;
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUFlagOffsetsCount',
    1,
    WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = hasValues
    ? `const LAST_INDEX: u32 = ${flagChunk!.length - 1}u;
const FLAG_OFFSET: u32 = ${getViewElementOffset(flagChunk!)}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(offsetChunk!)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(props.count)}u;
@group(0) @binding(0) var<storage, read> flags: array<u32>;
@group(0) @binding(1) var<storage, read> offsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> count: array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(local_invocation_index) localInvocationIndex: u32) {
  if (localInvocationIndex > 0u) { return; }
  count[COUNT_OFFSET] = offsets[OFFSETS_OFFSET + LAST_INDEX] + flags[FLAG_OFFSET + LAST_INDEX];
}`
    : `const COUNT_OFFSET: u32 = ${getViewElementOffset(props.count)}u;
@group(0) @binding(0) var<storage, read_write> count: array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(local_invocation_index) localInvocationIndex: u32) {
  if (localInvocationIndex > 0u) { return; }
  count[COUNT_OFFSET] = 0u;
}`;
  const resources = hasValues
    ? [
        {name: 'flags', view: flagChunk!, usage: 'storage-read' as const},
        {name: 'offsets', view: offsetChunk!, usage: 'storage-read' as const},
        {name: 'count', view: props.count, usage: 'storage-write' as const}
      ]
    : [{name: 'count', view: props.count, usage: 'storage-write' as const}];
  graph.addComputePass({
    id: `${props.id}-count`,
    workload: {
      operation: 'GPUFlagOffsetsCount',
      commandCount: 1,
      maximumWorkgroupCount: 1,
      maximumInvocationCount: WORKGROUP_SIZE,
      readByteLength: hasValues ? 8 : 0,
      writeByteLength: 4
    },
    resources: resources.map(resource => ({buffer: resource.view, usage: resource.usage})),
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: `${props.id}-count`,
        source,
        shaderLayout: {
          bindings: resources.map((resource, location) => ({
            name: resource.name,
            type: resource.usage === 'storage-read' ? 'read-only-storage' : 'storage',
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const resource of resources) {
            bindings[resource.name] = getViewBinding(resource.view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateConfiguration(props: Readonly<GPUFlagOffsetsProps>): void {
  for (const view of getChunks(props.flags)) {
    validatePackedUint32View(view, `${props.id} flags`);
  }
  for (const view of getChunks(props.offsets)) {
    validatePackedUint32View(view, `${props.id} offsets`);
  }
  validatePackedUint32View(props.count, `${props.id} count`);
  const flagsAreVector = props.flags instanceof GraphVectorView;
  if (flagsAreVector !== props.offsets instanceof GraphVectorView) {
    throw new Error(`${props.id} flags and offsets must both be data views or vector views`);
  }
  if (props.flags instanceof GraphVectorView && props.offsets instanceof GraphVectorView) {
    validateMatchingVectorTopology(props.flags, props.offsets, `${props.id} offsets`);
  } else if (props.offsets.length < props.flags.length) {
    throw new Error(`${props.id} offsets must contain at least flags.length rows`);
  }
  if (props.count.length < 1) {
    throw new Error(`${props.id} result views are too short`);
  }
}

function getChunks(input: GPUScanInput): readonly GraphDataView<'uint32'>[] {
  return input instanceof GraphVectorView ? input.data : [input];
}

function getLastNonEmptyChunk(input: GPUScanInput): GraphDataView<'uint32'> {
  const chunks = getChunks(input);
  for (let chunkIndex = chunks.length - 1; chunkIndex >= 0; chunkIndex--) {
    if (chunks[chunkIndex].length > 0) {
      return chunks[chunkIndex];
    }
  }
  throw new Error('Non-empty GPUFlagOffsets input requires a non-empty chunk');
}
