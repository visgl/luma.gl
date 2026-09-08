// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {GPUScan} from './gpu-scan';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

const WORKGROUP_SIZE = 256;

/** Properties for publishing list-style offsets from logical elements and segment starts. */
export type GPUSegmentOffsetsProps = {
  id?: string;
  /** Zero-or-one flags for logical elements, including null elements. */
  elementFlags: GraphDataView<'uint32'>;
  /** Exclusive dense logical-element offsets, normally produced by {@link GPUFlagOffsets}. */
  elementOffsets: GraphDataView<'uint32'>;
  /** One when a slot starts a segment after the implicit first segment. */
  segmentStartFlags: GraphDataView<'uint32'>;
  /** Dense zero-based segment index for every slot. */
  segmentIndices: GraphDataView<'uint32'>;
  /** Logical-element offset for every segment plus one terminal offset. */
  segmentOffsets: GraphDataView<'uint32'>;
  /** Single uint32 receiving the number of segments. */
  segmentCount: GraphDataView<'uint32'>;
};

/**
 * Converts segment-start flags and precomputed logical-element offsets into list-style offsets.
 *
 * Use this after {@link GPUFlagOffsets} when multiple logical element streams share a physical
 * value-selection stream, as in nested columns. The separation prevents repeated scans of shared
 * leaf validity while retaining a small generic operation useful for groups, runs, and lists.
 */
export class GPUSegmentOffsets {
  readonly id: string;
  readonly props: Readonly<GPUSegmentOffsetsProps>;

  constructor(props: GPUSegmentOffsetsProps) {
    this.id = props.id ?? 'gpu-segment-offsets';
    this.props = Object.freeze({...props, id: this.id});
    validateConfiguration(this.props);
  }

  /** Adds a segment-index scan followed by segment-offset and count publication passes. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    for (const view of Object.values(this.props).filter(
      (value): value is GraphDataView<'uint32'> =>
        typeof value === 'object' && value !== null && 'buffer' in value
    )) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (this.props.elementFlags.length === 0) {
      addEmptyPass(graph, this.props);
      return;
    }
    new GPUScan({
      id: `${this.id}-segment-indices`,
      input: this.props.segmentStartFlags,
      output: this.props.segmentIndices,
      mode: 'inclusive'
    }).addToGraph(graph);
    addSegmentOffsetsPass(graph, this.props);
    addSegmentCountPass(graph, this.props);
  }
}

type PassResource = {
  name: string;
  view: GraphDataView<'uint32'>;
  usage: 'storage-read' | 'storage-write';
};

function addEmptyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUSegmentOffsetsProps>
): void {
  const source = `const SEGMENT_OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.segmentOffsets)}u;
const SEGMENT_COUNT_OFFSET: u32 = ${getViewElementOffset(props.segmentCount)}u;
@group(0) @binding(0) var<storage, read_write> segmentOffsets: array<u32>;
@group(0) @binding(1) var<storage, read_write> segmentCount: array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(local_invocation_index) localInvocationIndex: u32) {
  if (localInvocationIndex > 0u) { return; }
  segmentOffsets[SEGMENT_OFFSETS_OFFSET] = 0u;
  segmentCount[SEGMENT_COUNT_OFFSET] = 0u;
}`;
  addPass(graph, `${props.id}-empty`, 'GPUSegmentOffsetsEmpty', source, 1, [
    {name: 'segmentOffsets', view: props.segmentOffsets, usage: 'storage-write'},
    {name: 'segmentCount', view: props.segmentCount, usage: 'storage-write'}
  ]);
}

function addSegmentOffsetsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUSegmentOffsetsProps>
): void {
  const length = props.elementFlags.length;
  const source = `const LENGTH: u32 = ${length}u;
const ELEMENT_FLAG_OFFSET: u32 = ${getViewElementOffset(props.elementFlags)}u;
const ELEMENT_OFFSET: u32 = ${getViewElementOffset(props.elementOffsets)}u;
const SEGMENT_START_OFFSET: u32 = ${getViewElementOffset(props.segmentStartFlags)}u;
const SEGMENT_INDEX_OFFSET: u32 = ${getViewElementOffset(props.segmentIndices)}u;
const SEGMENT_OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.segmentOffsets)}u;
@group(0) @binding(0) var<storage, read> segmentStartFlags: array<u32>;
@group(0) @binding(1) var<storage, read> segmentIndices: array<u32>;
@group(0) @binding(2) var<storage, read> elementFlags: array<u32>;
@group(0) @binding(3) var<storage, read> elementOffsets: array<u32>;
@group(0) @binding(4) var<storage, read_write> segmentOffsets: array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(
    getBoundedDispatchLayout(
      'GPUSegmentOffsetsPublish',
      length,
      WORKGROUP_SIZE,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    ),
    WORKGROUP_SIZE
  )}
  if (index >= LENGTH) { return; }
  if (index == 0u) { segmentOffsets[SEGMENT_OFFSETS_OFFSET] = 0u; }
  if (segmentStartFlags[SEGMENT_START_OFFSET + index] != 0u) {
    segmentOffsets[SEGMENT_OFFSETS_OFFSET + segmentIndices[SEGMENT_INDEX_OFFSET + index]] =
      elementOffsets[ELEMENT_OFFSET + index];
  }
  if (index + 1u == LENGTH) {
    let elementCount = elementOffsets[ELEMENT_OFFSET + index] + elementFlags[ELEMENT_FLAG_OFFSET + index];
    let count = segmentIndices[SEGMENT_INDEX_OFFSET + index] + 1u;
    segmentOffsets[SEGMENT_OFFSETS_OFFSET + count] = elementCount;
  }
}`;
  addPass(graph, `${props.id}-publish`, 'GPUSegmentOffsetsPublish', source, length, [
    {name: 'segmentStartFlags', view: props.segmentStartFlags, usage: 'storage-read'},
    {name: 'segmentIndices', view: props.segmentIndices, usage: 'storage-read'},
    {name: 'elementFlags', view: props.elementFlags, usage: 'storage-read'},
    {name: 'elementOffsets', view: props.elementOffsets, usage: 'storage-read'},
    {name: 'segmentOffsets', view: props.segmentOffsets, usage: 'storage-write'}
  ]);
}

function addSegmentCountPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUSegmentOffsetsProps>
): void {
  const source = `const LAST_INDEX: u32 = ${props.elementFlags.length - 1}u;
const SEGMENT_INDEX_OFFSET: u32 = ${getViewElementOffset(props.segmentIndices)}u;
const SEGMENT_COUNT_OFFSET: u32 = ${getViewElementOffset(props.segmentCount)}u;
@group(0) @binding(0) var<storage, read> segmentIndices: array<u32>;
@group(0) @binding(1) var<storage, read_write> segmentCount: array<u32>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(local_invocation_index) localInvocationIndex: u32) {
  if (localInvocationIndex > 0u) { return; }
  segmentCount[SEGMENT_COUNT_OFFSET] = segmentIndices[SEGMENT_INDEX_OFFSET + LAST_INDEX] + 1u;
}`;
  addPass(graph, `${props.id}-count`, 'GPUSegmentOffsetsCount', source, 1, [
    {name: 'segmentIndices', view: props.segmentIndices, usage: 'storage-read'},
    {name: 'segmentCount', view: props.segmentCount, usage: 'storage-write'}
  ]);
}

function addPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  operation: string,
  source: string,
  length: number,
  resources: PassResource[]
): void {
  const dispatchLayout = getBoundedDispatchLayout(
    operation,
    length,
    WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const workgroupCount = Math.ceil(length / WORKGROUP_SIZE);
  graph.addComputePass({
    id,
    workload: {
      operation,
      commandCount: 1,
      maximumWorkgroupCount: workgroupCount,
      maximumInvocationCount: workgroupCount * WORKGROUP_SIZE,
      readByteLength:
        resources.filter(resource => resource.usage === 'storage-read').length * length * 4,
      writeByteLength:
        resources.filter(resource => resource.usage === 'storage-write').length * length * 4
    },
    resources: resources.map(resource => ({buffer: resource.view, usage: resource.usage})),
    compile: ({device}) => {
      const computation = new Computation(device, {
        id,
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

function validateConfiguration(props: Readonly<GPUSegmentOffsetsProps>): void {
  const slotCount = props.elementFlags.length;
  for (const [name, view] of Object.entries({
    elementFlags: props.elementFlags,
    elementOffsets: props.elementOffsets,
    segmentStartFlags: props.segmentStartFlags,
    segmentIndices: props.segmentIndices,
    segmentOffsets: props.segmentOffsets,
    segmentCount: props.segmentCount
  })) {
    validatePackedUint32View(view, `${props.id} ${name}`);
  }
  for (const view of [props.elementOffsets, props.segmentStartFlags, props.segmentIndices]) {
    if (view.length < slotCount) {
      throw new Error(`${props.id} slot-aligned views must cover every element flag`);
    }
  }
  if (props.segmentOffsets.length < slotCount + 1 || props.segmentCount.length < 1) {
    throw new Error(`${props.id} result views are too short`);
  }
}
