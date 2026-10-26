// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type GPUCommandNode, createGPUComputeCommandNode} from './gpu-command-node';
import {type Binding} from '@luma.gl/core';
import {Kernel} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from './gpu-dispatch-utils';
import {GPUScan, type GPUScanInput} from './gpu-scan';
import {
  getViewBinding,
  getViewElementOffset,
  getGraphDataPrefix,
  validatePackedUint32View
} from './graph-data-view-utils';
import {alignGraphVectorViews, getGraphVectorData} from './graph-vector-view-utils';

const SEGMENTED_LAYOUT_WORKGROUP_SIZE = 256;

/** Properties for scan-based materialization of a flagged segmented sequence. */
export type GPUSegmentedLayoutProps = {
  /** Prefix for generated graph node IDs. */
  id?: string;
  /** One for every slot that owns a physical value; zero otherwise. */
  valueFlags: GPUScanInput;
  /** One for every slot that represents a logical element; zero otherwise. */
  elementFlags: GPUScanInput;
  /** One when a slot starts a new segment after the implicit first segment; zero otherwise. */
  segmentStartFlags: GPUScanInput;
  /** Exclusive dense physical-value index for every slot. */
  valueOffsets: GPUScanInput;
  /** Exclusive dense logical-element index for every slot. */
  elementOffsets: GPUScanInput;
  /** Dense zero-based segment index for every slot. */
  segmentIndices: GPUScanInput;
  /** Dense logical-element offsets for every segment plus one terminal offset. */
  segmentOffsets: GraphDataView<'uint32'>;
  /** Single uint32 receiving the number of physical values. */
  valueCount: GraphDataView<'uint32'>;
  /** Single uint32 receiving the number of logical elements. */
  elementCount: GraphDataView<'uint32'>;
  /** Single uint32 receiving the number of segments. */
  segmentCount: GraphDataView<'uint32'>;
};

/** Shader passes consume physical views after logical chunk alignment. */
type GPUSegmentedLayoutPassProps = {
  [Key in keyof GPUSegmentedLayoutProps]: GPUSegmentedLayoutProps[Key] extends GPUScanInput
    ? GraphDataView<'uint32'>
    : GPUSegmentedLayoutProps[Key];
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
  getCommandNodes<Parameters>(
    graph: GPUCommandGraph<Parameters>
  ): readonly GPUCommandNode<Parameters>[] {
    const nodes: GPUCommandNode<Parameters>[] = [];
    for (const view of [
      this.props.valueFlags,
      this.props.elementFlags,
      this.props.segmentStartFlags,
      this.props.valueOffsets,
      this.props.elementOffsets,
      this.props.segmentIndices,
      this.props.segmentOffsets,
      this.props.valueCount,
      this.props.elementCount,
      this.props.segmentCount
    ].flatMap(getGraphVectorData)) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} views must belong to the target graph`);
      }
    }
    if (this.props.valueFlags.length === 0) {
      nodes.push(...addEmptyPass(graph, this.props));
      return nodes;
    }
    const length = this.props.valueFlags.length;
    const props = {
      ...this.props,
      elementFlags: getGraphDataPrefix(graph, this.props.elementFlags, length),
      segmentStartFlags: getGraphDataPrefix(graph, this.props.segmentStartFlags, length),
      valueOffsets: getGraphDataPrefix(graph, this.props.valueOffsets, length),
      elementOffsets: getGraphDataPrefix(graph, this.props.elementOffsets, length),
      segmentIndices: getGraphDataPrefix(graph, this.props.segmentIndices, length)
    };
    nodes.push(
      ...new GPUScan({
        id: `${this.id}-value-offsets`,
        input: props.valueFlags,
        output: props.valueOffsets,
        mode: 'exclusive'
      }).getCommandNodes(graph)
    );
    nodes.push(
      ...new GPUScan({
        id: `${this.id}-element-offsets`,
        input: props.elementFlags,
        output: props.elementOffsets,
        mode: 'exclusive'
      }).getCommandNodes(graph)
    );
    nodes.push(
      ...new GPUScan({
        id: `${this.id}-segment-indices`,
        input: props.segmentStartFlags,
        output: props.segmentIndices,
        mode: 'inclusive'
      }).getCommandNodes(graph)
    );
    const spans = alignGraphVectorViews(graph, [
      props.valueFlags,
      props.elementFlags,
      props.segmentStartFlags,
      props.valueOffsets,
      props.elementOffsets,
      props.segmentIndices
    ]);
    for (const [spanIndex, span] of spans.entries()) {
      const chunkProps = {
        ...props,
        valueFlags: span[0],
        elementFlags: span[1],
        segmentStartFlags: span[2],
        valueOffsets: span[3],
        elementOffsets: span[4],
        segmentIndices: span[5]
      };
      const lastSpan = spanIndex === spans.length - 1;
      nodes.push(
        ...addSegmentOffsetsPass(
          graph,
          {
            ...chunkProps,
            id: spans.length > 1 ? `${this.id}-chunk-${spanIndex}` : this.id
          },
          spanIndex === 0,
          lastSpan
        )
      );
      if (lastSpan) nodes.push(...addCountsPass(graph, chunkProps));
    }

    return nodes;
  }
}

function addEmptyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUSegmentedLayoutProps>
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
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
  nodes.push(
    ...addPass(
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
    )
  );

  return nodes;
}

function addSegmentOffsetsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUSegmentedLayoutPassProps>,
  firstSpan: boolean,
  lastSpan: boolean
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
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
@group(0) @binding(2) var<storage, read> elementOffsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> segmentOffsets: array<u32>;
${lastSpan ? '@group(0) @binding(4) var<storage, read> elementFlags: array<u32>;' : ''}
@compute @workgroup_size(${SEGMENTED_LAYOUT_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3u,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, SEGMENTED_LAYOUT_WORKGROUP_SIZE)}
  if (index >= LENGTH) { return; }
  ${firstSpan ? 'if (index == 0u) { segmentOffsets[SEGMENT_OFFSET] = 0u; }' : ''}
  if (segmentStartFlags[SEGMENT_START_OFFSET + index] != 0u) {
    segmentOffsets[SEGMENT_OFFSET + segmentIndices[SEGMENT_INDEX_OFFSET + index]] =
      elementOffsets[ELEMENT_OFFSET + index];
  }
  ${
    lastSpan
      ? `if (index + 1u == LENGTH) {
    let logicalElementCount = elementOffsets[ELEMENT_OFFSET + index] + elementFlags[ELEMENT_FLAG_OFFSET + index];
    let segments = segmentIndices[SEGMENT_INDEX_OFFSET + index] + 1u;
    segmentOffsets[SEGMENT_OFFSET + segments] = logicalElementCount;
  }`
      : ''
  }
}`;
  nodes.push(
    ...addPass(
      graph,
      `${props.id}-segment-offsets`,
      'GPUSegmentedLayoutSegmentOffsets',
      source,
      length,
      [
        {name: 'segmentStartFlags', view: props.segmentStartFlags, usage: 'storage-read'},
        {name: 'segmentIndices', view: props.segmentIndices, usage: 'storage-read'},
        {name: 'elementOffsets', view: props.elementOffsets, usage: 'storage-read'},
        {name: 'segmentOffsets', view: props.segmentOffsets, usage: 'storage-write'},
        ...(lastSpan
          ? [{name: 'elementFlags', view: props.elementFlags, usage: 'storage-read' as const}]
          : [])
      ],
      dispatchLayout
    )
  );

  return nodes;
}

function addCountsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: Readonly<GPUSegmentedLayoutPassProps>
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
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
  nodes.push(
    ...addPass(
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
    )
  );

  return nodes;
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
): readonly GPUCommandNode<Parameters>[] {
  const nodes: GPUCommandNode<Parameters>[] = [];
  const workgroupCount = Math.ceil(length / SEGMENTED_LAYOUT_WORKGROUP_SIZE);
  nodes.push(
    createGPUComputeCommandNode<Parameters>({
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
        const kernel = new Kernel(device, {
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

  return nodes;
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
    for (const chunk of getGraphVectorData(view)) {
      validatePackedUint32View(chunk, `${props.id} ${name}`);
    }
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
