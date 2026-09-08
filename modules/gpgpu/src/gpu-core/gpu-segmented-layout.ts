// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {GPUScan} from './gpu-scan';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from './graph-data-view-utils';

const SEGMENTED_LAYOUT_WORKGROUP_SIZE = 256;

/** Properties for scan-based materialization of a flagged segmented sequence. */
export type GPUSegmentedLayoutProps = {
  /** Prefix for generated graph node IDs. */
  id?: string;
  /** One for every slot that owns a physical value; zero otherwise. */
  valueFlags: GraphDataView<'uint32'>;
  /** One for every slot that represents a logical element; zero otherwise. */
  elementFlags: GraphDataView<'uint32'>;
  /** One when a slot starts a new segment after the implicit first segment; zero otherwise. */
  segmentStartFlags: GraphDataView<'uint32'>;
  /** Exclusive dense physical-value index for every slot. */
  valueOffsets: GraphDataView<'uint32'>;
  /** Exclusive dense logical-element index for every slot. */
  elementOffsets: GraphDataView<'uint32'>;
  /** Dense zero-based segment index for every slot. */
  segmentIndices: GraphDataView<'uint32'>;
  /** Dense logical-element offsets for every segment plus one terminal offset. */
  segmentOffsets: GraphDataView<'uint32'>;
  /** Single uint32 receiving the number of physical values. */
  valueCount: GraphDataView<'uint32'>;
  /** Single uint32 receiving the number of logical elements. */
  elementCount: GraphDataView<'uint32'>;
  /** Single uint32 receiving the number of segments. */
  segmentCount: GraphDataView<'uint32'>;
};

/**
 * Materializes dense offsets and segment boundaries from three slot-aligned flag streams.
 *
 * Use this after a format-specific classifier has identified physical values, logical elements,
 * and segment starts. Three graph-native prefix scans produce stable value offsets, element
 * offsets, and segment indices; a final pass publishes list-style segment offsets and scalar
 * counts. All flag values must be zero or one. The first non-empty segment is implicit, so
 * `segmentStartFlags[0]` must be zero and each later one starts a new segment.
 *
 * The operation is useful for nullable column compaction, list-offset construction, run or group
 * boundaries, and other columnar formats. It does not move values: compose `valueFlags` and
 * `valueOffsets` with {@link GPUCompaction}, a gather, or a format-specific scatter when packed
 * payload materialization is required.
 */
export class GPUSegmentedLayout {
  /** Prefix for generated graph node IDs. */
  readonly id: string;
  /** Immutable caller-provided views. */
  readonly props: Readonly<GPUSegmentedLayoutProps>;

  /** Creates and validates a segmented layout description without submitting GPU work. */
  constructor(props: GPUSegmentedLayoutProps) {
    this.id = props.id ?? 'gpu-segmented-layout';
    this.props = Object.freeze({...props, id: this.id});
    validateConfiguration(this.props);
  }

  /** Adds prefix scans and offset publication passes to a command graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const props = this.props;
    for (const view of Object.values(props).filter(
      (value): value is GraphDataView<'uint32'> =>
        typeof value === 'object' && value !== null && 'buffer' in value
    )) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (props.valueFlags.length === 0) {
      addEmptyPass(graph, props);
      return;
    }
    new GPUScan({
      id: `${this.id}-value-offsets`,
      input: props.valueFlags,
      output: props.valueOffsets,
      mode: 'exclusive'
    }).addToGraph(graph);
    new GPUScan({
      id: `${this.id}-element-offsets`,
      input: props.elementFlags,
      output: props.elementOffsets,
      mode: 'exclusive'
    }).addToGraph(graph);
    new GPUScan({
      id: `${this.id}-segment-indices`,
      input: props.segmentStartFlags,
      output: props.segmentIndices,
      mode: 'inclusive'
    }).addToGraph(graph);
    addSegmentOffsetsPass(graph, props);
    addCountsPass(graph, props);
  }
}

function addEmptyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUSegmentedLayoutProps>
): void {
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUSegmentedLayoutEmpty',
    1,
    SEGMENTED_LAYOUT_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = `const SEGMENT_OFFSET: u32 = ${getViewElementOffset(props.segmentOffsets)}u;
const VALUE_COUNT_OFFSET: u32 = ${getViewElementOffset(props.valueCount)}u;
const ELEMENT_COUNT_OFFSET: u32 = ${getViewElementOffset(props.elementCount)}u;
const SEGMENT_COUNT_OFFSET: u32 = ${getViewElementOffset(props.segmentCount)}u;
@group(0) @binding(0) var<storage, read_write> segmentOffsets: array<u32>;
@group(0) @binding(1) var<storage, read_write> valueCount: array<u32>;
@group(0) @binding(2) var<storage, read_write> elementCount: array<u32>;
@group(0) @binding(3) var<storage, read_write> segmentCount: array<u32>;
@compute @workgroup_size(${SEGMENTED_LAYOUT_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, SEGMENTED_LAYOUT_WORKGROUP_SIZE)}
  if (index > 0u) { return; }
  segmentOffsets[SEGMENT_OFFSET] = 0u;
  valueCount[VALUE_COUNT_OFFSET] = 0u;
  elementCount[ELEMENT_COUNT_OFFSET] = 0u;
  segmentCount[SEGMENT_COUNT_OFFSET] = 0u;
}`;
  addPass(
    graph,
    `${props.id}-empty`,
    'GPUSegmentedLayoutEmpty',
    source,
    1,
    [
      {name: 'segmentOffsets', view: props.segmentOffsets, usage: 'storage-write'},
      {name: 'valueCount', view: props.valueCount, usage: 'storage-write'},
      {name: 'elementCount', view: props.elementCount, usage: 'storage-write'},
      {name: 'segmentCount', view: props.segmentCount, usage: 'storage-write'}
    ],
    dispatchLayout
  );
}

function addSegmentOffsetsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUSegmentedLayoutProps>
): void {
  const length = props.valueFlags.length;
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUSegmentedLayoutSegmentOffsets',
    length,
    SEGMENTED_LAYOUT_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = `const LENGTH: u32 = ${length}u;
const ELEMENT_FLAG_OFFSET: u32 = ${getViewElementOffset(props.elementFlags)}u;
const ELEMENT_OFFSET: u32 = ${getViewElementOffset(props.elementOffsets)}u;
const SEGMENT_START_OFFSET: u32 = ${getViewElementOffset(props.segmentStartFlags)}u;
const SEGMENT_INDEX_OFFSET: u32 = ${getViewElementOffset(props.segmentIndices)}u;
const SEGMENT_OFFSET: u32 = ${getViewElementOffset(props.segmentOffsets)}u;
@group(0) @binding(0) var<storage, read> segmentStartFlags: array<u32>;
@group(0) @binding(1) var<storage, read> segmentIndices: array<u32>;
@group(0) @binding(2) var<storage, read> elementFlags: array<u32>;
@group(0) @binding(3) var<storage, read> elementOffsets: array<u32>;
@group(0) @binding(4) var<storage, read_write> segmentOffsets: array<u32>;
@compute @workgroup_size(${SEGMENTED_LAYOUT_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, SEGMENTED_LAYOUT_WORKGROUP_SIZE)}
  if (index >= LENGTH) { return; }
  if (index == 0u) { segmentOffsets[SEGMENT_OFFSET] = 0u; }
  if (segmentStartFlags[SEGMENT_START_OFFSET + index] != 0u) {
    segmentOffsets[SEGMENT_OFFSET + segmentIndices[SEGMENT_INDEX_OFFSET + index]] =
      elementOffsets[ELEMENT_OFFSET + index];
  }
  if (index + 1u == LENGTH) {
    let logicalElementCount = elementOffsets[ELEMENT_OFFSET + index] + elementFlags[ELEMENT_FLAG_OFFSET + index];
    let segments = segmentIndices[SEGMENT_INDEX_OFFSET + index] + 1u;
    segmentOffsets[SEGMENT_OFFSET + segments] = logicalElementCount;
  }
}`;
  addPass(
    graph,
    `${props.id}-segment-offsets`,
    'GPUSegmentedLayoutSegmentOffsets',
    source,
    length,
    [
      {name: 'segmentStartFlags', view: props.segmentStartFlags, usage: 'storage-read'},
      {name: 'segmentIndices', view: props.segmentIndices, usage: 'storage-read'},
      {name: 'elementFlags', view: props.elementFlags, usage: 'storage-read'},
      {name: 'elementOffsets', view: props.elementOffsets, usage: 'storage-read'},
      {name: 'segmentOffsets', view: props.segmentOffsets, usage: 'storage-write'}
    ],
    dispatchLayout
  );
}

function addCountsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUSegmentedLayoutProps>
): void {
  const length = props.valueFlags.length;
  const dispatchLayout = getBoundedDispatchLayout(
    'GPUSegmentedLayoutCounts',
    1,
    SEGMENTED_LAYOUT_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const lastIndex = length - 1;
  const source = `const LAST_INDEX: u32 = ${lastIndex}u;
const VALUE_FLAG_OFFSET: u32 = ${getViewElementOffset(props.valueFlags)}u;
const VALUE_OFFSET: u32 = ${getViewElementOffset(props.valueOffsets)}u;
const ELEMENT_FLAG_OFFSET: u32 = ${getViewElementOffset(props.elementFlags)}u;
const ELEMENT_OFFSET: u32 = ${getViewElementOffset(props.elementOffsets)}u;
const SEGMENT_INDEX_OFFSET: u32 = ${getViewElementOffset(props.segmentIndices)}u;
const VALUE_COUNT_OFFSET: u32 = ${getViewElementOffset(props.valueCount)}u;
const ELEMENT_COUNT_OFFSET: u32 = ${getViewElementOffset(props.elementCount)}u;
const SEGMENT_COUNT_OFFSET: u32 = ${getViewElementOffset(props.segmentCount)}u;
@group(0) @binding(0) var<storage, read> valueFlags: array<u32>;
@group(0) @binding(1) var<storage, read> valueOffsets: array<u32>;
@group(0) @binding(2) var<storage, read> elementFlags: array<u32>;
@group(0) @binding(3) var<storage, read> elementOffsets: array<u32>;
@group(0) @binding(4) var<storage, read> segmentIndices: array<u32>;
@group(0) @binding(5) var<storage, read_write> valueCount: array<u32>;
@group(0) @binding(6) var<storage, read_write> elementCount: array<u32>;
@group(0) @binding(7) var<storage, read_write> segmentCount: array<u32>;
@compute @workgroup_size(${SEGMENTED_LAYOUT_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, SEGMENTED_LAYOUT_WORKGROUP_SIZE)}
  if (index > 0u) { return; }
  valueCount[VALUE_COUNT_OFFSET] =
    valueOffsets[VALUE_OFFSET + LAST_INDEX] + valueFlags[VALUE_FLAG_OFFSET + LAST_INDEX];
  elementCount[ELEMENT_COUNT_OFFSET] =
    elementOffsets[ELEMENT_OFFSET + LAST_INDEX] + elementFlags[ELEMENT_FLAG_OFFSET + LAST_INDEX];
  segmentCount[SEGMENT_COUNT_OFFSET] = segmentIndices[SEGMENT_INDEX_OFFSET + LAST_INDEX] + 1u;
}`;
  addPass(
    graph,
    `${props.id}-counts`,
    'GPUSegmentedLayoutCounts',
    source,
    1,
    [
      {name: 'valueFlags', view: props.valueFlags, usage: 'storage-read'},
      {name: 'valueOffsets', view: props.valueOffsets, usage: 'storage-read'},
      {name: 'elementFlags', view: props.elementFlags, usage: 'storage-read'},
      {name: 'elementOffsets', view: props.elementOffsets, usage: 'storage-read'},
      {name: 'segmentIndices', view: props.segmentIndices, usage: 'storage-read'},
      {name: 'valueCount', view: props.valueCount, usage: 'storage-write'},
      {name: 'elementCount', view: props.elementCount, usage: 'storage-write'},
      {name: 'segmentCount', view: props.segmentCount, usage: 'storage-write'}
    ],
    dispatchLayout
  );
}

type PassResource = {
  name: string;
  view: GraphDataView<'uint32'>;
  usage: 'storage-read' | 'storage-write';
};

function addPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  operation: string,
  source: string,
  length: number,
  resources: PassResource[],
  dispatchLayout: ReturnType<typeof getBoundedDispatchLayout>
): void {
  const workgroupCount = Math.ceil(length / SEGMENTED_LAYOUT_WORKGROUP_SIZE);
  graph.addComputePass({
    id,
    workload: {
      operation,
      commandCount: 1,
      maximumWorkgroupCount: workgroupCount,
      maximumInvocationCount: workgroupCount * SEGMENTED_LAYOUT_WORKGROUP_SIZE,
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

function validateConfiguration(props: Readonly<GPUSegmentedLayoutProps>): void {
  const slotCount = props.valueFlags.length;
  for (const [name, view] of Object.entries({
    valueFlags: props.valueFlags,
    elementFlags: props.elementFlags,
    segmentStartFlags: props.segmentStartFlags,
    valueOffsets: props.valueOffsets,
    elementOffsets: props.elementOffsets,
    segmentIndices: props.segmentIndices,
    segmentOffsets: props.segmentOffsets,
    valueCount: props.valueCount,
    elementCount: props.elementCount,
    segmentCount: props.segmentCount
  })) {
    validatePackedUint32View(view, `${props.id} ${name}`);
  }
  for (const view of [
    props.elementFlags,
    props.segmentStartFlags,
    props.valueOffsets,
    props.elementOffsets,
    props.segmentIndices
  ]) {
    if (view.length < slotCount) {
      throw new Error(`${props.id} slot-aligned views must cover every flag`);
    }
  }
  if (
    props.segmentOffsets.length < slotCount + 1 ||
    props.valueCount.length < 1 ||
    props.elementCount.length < 1 ||
    props.segmentCount.length < 1
  ) {
    throw new Error(`${props.id} result views are too short`);
  }
}
