// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout} from './gpu-dispatch-utils';
import {GPUScan} from './gpu-scan';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

const WORKGROUP_SIZE = 256;

/** Properties for materializing dense indices and a count from binary flags. */
export type GPUFlagOffsetsProps = {
  /** Prefix for generated graph node IDs. */
  id?: string;
  /** Packed zero-or-one flags. */
  flags: GraphDataView<'uint32'>;
  /** Exclusive dense index for every flag. */
  offsets: GraphDataView<'uint32'>;
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
    for (const view of [flags, offsets, count]) {
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
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUFlagOffsetsCount',
    1,
    WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = hasValues
    ? `const LAST_INDEX: u32 = ${props.flags.length - 1}u;
const FLAG_OFFSET: u32 = ${getViewElementOffset(props.flags)}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.offsets)}u;
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
        {name: 'flags', view: props.flags, usage: 'storage-read' as const},
        {name: 'offsets', view: props.offsets, usage: 'storage-read' as const},
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
  for (const [name, view] of Object.entries({
    flags: props.flags,
    offsets: props.offsets,
    count: props.count
  })) {
    validatePackedUint32View(view, `${props.id} ${name}`);
  }
  if (props.offsets.length < props.flags.length || props.count.length < 1) {
    throw new Error(`${props.id} result views are too short`);
  }
}
