// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type GraphBufferUse, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {getBoundedDispatchLayout, getBoundedInvocationIndexSource} from '@luma.gl/gpgpu/gpu-core';
import {
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from '@luma.gl/gpgpu/gpu-core';
import {GPUScan} from '@luma.gl/gpgpu/gpu-core';
import {GPUVisibilityWorkflow} from '@luma.gl/gpgpu/gpu-core';

const TEMPORAL_INDEX_WORKGROUP_SIZE = 256;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

/** Immutable leaf summaries for a source-ordered trace temporal index. */
export type GPUTraceTemporalIndexBatches = {
  /** Earliest span start in each batch. */
  minimumTimes: GraphDataView<'float32'>;
  /** Latest span end in each batch. */
  maximumTimes: GraphDataView<'float32'>;
  /** Dense renderer group represented by each batch. */
  groupIds: GraphDataView<'uint32'>;
  /** First lane touched by each batch. */
  minimumLanes: GraphDataView<'uint32'>;
  /** Exclusive last lane touched by each batch. */
  maximumLanes: GraphDataView<'uint32'>;
};

/** One immutable source-ordered hierarchy level over contiguous leaf batch ranges. */
export type GPUTraceTemporalIndexLevel = {
  /** First node for this level in the packed hierarchy columns. */
  firstNodeIndex: number;
  /** Number of source-ordered nodes in this level. */
  nodeCount: number;
  /** Largest leaf-batch range owned by one node. Must not exceed 256. */
  maximumBatchCount: number;
  /** Mean node time extent used by applications to choose a semantic query level. */
  averageTimeSpan: number;
};

/** Persistent multi-level summaries over contiguous leaf batch ranges. */
export type GPUTraceTemporalIndexHierarchy = {
  minimumTimes: GraphDataView<'float32'>;
  maximumTimes: GraphDataView<'float32'>;
  groupIds: GraphDataView<'uint32'>;
  firstBatchIndices: GraphDataView<'uint32'>;
  batchCounts: GraphDataView<'uint32'>;
  minimumLanes: GraphDataView<'uint32'>;
  maximumLanes: GraphDataView<'uint32'>;
  levels: readonly GPUTraceTemporalIndexLevel[];
};

/** Mutable GPU-resident query controls updated without rebuilding graph topology. */
export type GPUTraceTemporalIndexQuery = {
  /** Packed `[minimumTime, maximumTime, guardPadding]`. */
  timeWindow: GraphDataView<'float32'>;
  /** Single 32-bit mask of enabled dense renderer groups. */
  enabledGroups: GraphDataView<'uint32'>;
  /** Packed `[minimumLane, exclusiveMaximumLane]` vertical viewport. */
  laneWindow: GraphDataView<'uint32'>;
  /** Selected hierarchy level. Required when `hierarchy` is supplied. */
  level?: GraphDataView<'uint32'>;
};

/** Caller-owned stable candidate outputs shared by trace render and interaction passes. */
export type GPUTraceTemporalIndexOutput = {
  /** Source-ordered batches intersecting the guarded time window and enabled groups. */
  candidates: GraphDataView<'uint32'>;
  /** Exact number of entries published to `candidates`. */
  candidateCount: GraphDataView<'uint32'>;
};

/** Properties for one reusable trace temporal index query. */
export type GPUTraceTemporalIndexProps = {
  /** Diagnostic prefix for generated graph operations. */
  id?: string;
  /** Immutable interval summaries, normally one row per preserved source batch. */
  batches: GPUTraceTemporalIndexBatches;
  /** Optional persistent summaries used to avoid scanning every leaf for ordinary candidates. */
  hierarchy?: GPUTraceTemporalIndexHierarchy;
  /** Mutable query controls. */
  query: GPUTraceTemporalIndexQuery;
  /** Caller-owned compacted query results. */
  output: GPUTraceTemporalIndexOutput;
};

/** Immutable capacity information available without GPU synchronization. */
export type GPUTraceTemporalIndexStats = {
  /** Number of indexed leaf batches. */
  batchCount: number;
  /** Number of index levels currently represented by this contributor. */
  levelCount: number;
  /** Largest hierarchy level queried by one fixed-capacity predicate pass. */
  maximumNodeCount: number;
};

/**
 * Queries source-ordered trace-time batch summaries and publishes stable candidate IDs.
 *
 * Optional persistent hierarchy levels bound the summary nodes scanned at wide zoom levels, then
 * expand matching nodes back into canonical source-ordered leaf batches. The conservative output
 * is shared by exact rendering, density aggregation, representatives, labels, dependencies, and
 * picking; each consumer applies its own row-level semantic policy without publishing another
 * temporal selection or translating IDs on the CPU.
 */
export class GPUTraceTemporalIndex {
  readonly id: string;
  readonly batches: GPUTraceTemporalIndexBatches;
  readonly hierarchy?: GPUTraceTemporalIndexHierarchy;
  readonly query: GPUTraceTemporalIndexQuery;
  readonly output: GPUTraceTemporalIndexOutput;
  readonly stats: Readonly<GPUTraceTemporalIndexStats>;

  constructor(props: GPUTraceTemporalIndexProps) {
    this.id = props.id ?? 'gpu-trace-temporal-index';
    this.batches = props.batches;
    this.hierarchy = props.hierarchy;
    this.query = props.query;
    this.output = props.output;
    validateTemporalIndex(this);
    this.stats = Object.freeze({
      batchCount: this.batches.minimumTimes.length,
      levelCount: 1 + (this.hierarchy?.levels.length ?? 0),
      maximumNodeCount: this.hierarchy
        ? Math.max(...this.hierarchy.levels.map(level => level.nodeCount))
        : this.batches.minimumTimes.length
    });
  }

  /** Adds the query and stable source-order compactions to a caller-owned graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = getTemporalIndexViews(this);
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }

    if (this.hierarchy) {
      addHierarchicalCandidateQuery(graph, this);
    } else {
      const candidateFlags = graph.createDataView(
        graph.createTransientBuffer({
          id: `${this.id}-candidate-flags`,
          byteLength: Math.max(this.stats.batchCount, 1) * UINT32_BYTE_LENGTH,
          usage: Buffer.STORAGE
        }),
        {format: 'uint32', length: this.stats.batchCount}
      );
      if (this.stats.batchCount > 0) {
        addTemporalQueryPass(graph, this, candidateFlags);
      }
      new GPUVisibilityWorkflow({
        id: `${this.id}-candidates`,
        predicates: [{kind: ['time-range', 'bounds'], mask: candidateFlags}],
        output: this.output.candidates,
        count: this.output.candidateCount
      }).addToGraph(graph);
    }
  }
}

function addTemporalQueryPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUTraceTemporalIndex,
  candidateFlags: GraphDataView<'uint32'>
): void {
  const dispatch = getBoundedDispatchLayout(
    index.id,
    index.stats.batchCount,
    TEMPORAL_INDEX_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const stride = (view: GraphDataView): number => view.byteStride / UINT32_BYTE_LENGTH;
  const source = /* wgsl */ `
const BATCH_COUNT: u32 = ${index.stats.batchCount}u;
const MINIMUM_TIME_OFFSET: u32 = ${getViewElementOffset(index.batches.minimumTimes)}u;
const MINIMUM_TIME_STRIDE: u32 = ${stride(index.batches.minimumTimes)}u;
const MAXIMUM_TIME_OFFSET: u32 = ${getViewElementOffset(index.batches.maximumTimes)}u;
const MAXIMUM_TIME_STRIDE: u32 = ${stride(index.batches.maximumTimes)}u;
const GROUP_OFFSET: u32 = ${getViewElementOffset(index.batches.groupIds)}u;
const GROUP_STRIDE: u32 = ${stride(index.batches.groupIds)}u;
const MINIMUM_LANE_OFFSET: u32 = ${getViewElementOffset(index.batches.minimumLanes)}u;
const MINIMUM_LANE_STRIDE: u32 = ${stride(index.batches.minimumLanes)}u;
const MAXIMUM_LANE_OFFSET: u32 = ${getViewElementOffset(index.batches.maximumLanes)}u;
const MAXIMUM_LANE_STRIDE: u32 = ${stride(index.batches.maximumLanes)}u;
const WINDOW_OFFSET: u32 = ${getViewElementOffset(index.query.timeWindow)}u;
const LANE_WINDOW_OFFSET: u32 = ${getViewElementOffset(index.query.laneWindow)}u;
const ENABLED_GROUPS_OFFSET: u32 = ${getViewElementOffset(index.query.enabledGroups)}u;
const CANDIDATE_OFFSET: u32 = ${getViewElementOffset(candidateFlags)}u;
@group(0) @binding(0) var<storage, read> minimumTimes: array<f32>;
@group(0) @binding(1) var<storage, read> maximumTimes: array<f32>;
@group(0) @binding(2) var<storage, read> groupIds: array<u32>;
@group(0) @binding(3) var<storage, read> minimumLanes: array<u32>;
@group(0) @binding(4) var<storage, read> maximumLanes: array<u32>;
@group(0) @binding(5) var<storage, read> timeWindow: array<f32>;
@group(0) @binding(6) var<storage, read> laneWindow: array<u32>;
@group(0) @binding(7) var<storage, read> enabledGroups: array<u32>;
@group(0) @binding(8) var<storage, read_write> candidateFlags: array<u32>;

@compute @workgroup_size(${TEMPORAL_INDEX_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, TEMPORAL_INDEX_WORKGROUP_SIZE)}
  if (index >= BATCH_COUNT) { return; }
  let minimumTime = timeWindow[WINDOW_OFFSET];
  let maximumTime = timeWindow[WINDOW_OFFSET + 1u];
  let guardPadding = max(timeWindow[WINDOW_OFFSET + 2u], 0.0);
  let group = groupIds[GROUP_OFFSET + index * GROUP_STRIDE];
  let timeVisible = minimumTime <= maximumTime &&
    maximumTimes[MAXIMUM_TIME_OFFSET + index * MAXIMUM_TIME_STRIDE] >= minimumTime - guardPadding &&
    minimumTimes[MINIMUM_TIME_OFFSET + index * MINIMUM_TIME_STRIDE] <= maximumTime + guardPadding;
  let groupVisible = group < 32u &&
    (enabledGroups[ENABLED_GROUPS_OFFSET] & (1u << group)) != 0u;
  let laneVisible = maximumLanes[MAXIMUM_LANE_OFFSET + index * MAXIMUM_LANE_STRIDE] >
      laneWindow[LANE_WINDOW_OFFSET] &&
    minimumLanes[MINIMUM_LANE_OFFSET + index * MINIMUM_LANE_STRIDE] <
      laneWindow[LANE_WINDOW_OFFSET + 1u];
  let candidateVisible = timeVisible && laneVisible && groupVisible;
  candidateFlags[CANDIDATE_OFFSET + index] = select(0u, 1u, candidateVisible);
}`;
  const bindings = {
    minimumTimes: index.batches.minimumTimes,
    maximumTimes: index.batches.maximumTimes,
    groupIds: index.batches.groupIds,
    minimumLanes: index.batches.minimumLanes,
    maximumLanes: index.batches.maximumLanes,
    timeWindow: index.query.timeWindow,
    laneWindow: index.query.laneWindow,
    enabledGroups: index.query.enabledGroups,
    candidateFlags
  };
  const resources: GraphBufferUse[] = [
    {buffer: index.batches.minimumTimes, usage: 'storage-read'},
    {buffer: index.batches.maximumTimes, usage: 'storage-read'},
    {buffer: index.batches.groupIds, usage: 'storage-read'},
    {buffer: index.batches.minimumLanes, usage: 'storage-read'},
    {buffer: index.batches.maximumLanes, usage: 'storage-read'},
    {buffer: index.query.timeWindow, usage: 'storage-read'},
    {buffer: index.query.laneWindow, usage: 'storage-read'},
    {buffer: index.query.enabledGroups, usage: 'storage-read'},
    {buffer: candidateFlags, usage: 'storage-write'}
  ];
  graph.addComputePass({
    id: `${index.id}-query`,
    resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: `${index.id}-query`,
        source,
        shaderLayout: {
          bindings: Object.keys(bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const resolved: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(bindings)) {
            resolved[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(resolved);
          computation.dispatch(computePass, dispatch.x, dispatch.y, dispatch.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Queries one selected summary level and expands visible nodes back to canonical leaf batches. */
function addHierarchicalCandidateQuery<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUTraceTemporalIndex
): void {
  const hierarchy = index.hierarchy!;
  const level = index.query.level!;
  const nodeCapacity = index.stats.maximumNodeCount;
  const nodeFlags = createTransientUint32View(graph, `${index.id}-node-flags`, nodeCapacity);
  const activeNodeIds = createTransientUint32View(
    graph,
    `${index.id}-active-node-ids`,
    nodeCapacity
  );
  const activeNodeDispatch = createTransientUint32View(
    graph,
    `${index.id}-active-node-dispatch`,
    3,
    Buffer.INDIRECT
  );
  const activeNodeCounts = createTransientUint32View(
    graph,
    `${index.id}-active-node-counts`,
    nodeCapacity
  );
  const activeNodeOffsets = createTransientUint32View(
    graph,
    `${index.id}-active-node-offsets`,
    nodeCapacity
  );

  addDispatchInitializationPass(graph, `${index.id}-active-node-dispatch`, activeNodeDispatch);
  addHierarchyNodeQueryPass(graph, index, hierarchy, level, nodeFlags);
  new GPUVisibilityWorkflow({
    id: `${index.id}-active-nodes`,
    predicates: [{kind: ['time-range', 'bounds'], mask: nodeFlags}],
    output: activeNodeIds,
    count: graph.createDataView(activeNodeDispatch.buffer, {
      format: 'uint32',
      length: 1,
      byteOffset: activeNodeDispatch.byteOffset + UINT32_BYTE_LENGTH
    })
  }).addToGraph(graph);
  addClearViewPass(graph, `${index.id}-active-node-counts`, activeNodeCounts);
  addActiveNodeCountPass(
    graph,
    index,
    hierarchy,
    level,
    activeNodeIds,
    activeNodeDispatch,
    activeNodeCounts
  );
  new GPUScan({
    id: `${index.id}-active-node-offsets`,
    input: activeNodeCounts,
    output: activeNodeOffsets
  }).addToGraph(graph);
  addActiveNodeScatterPass(
    graph,
    index,
    hierarchy,
    level,
    activeNodeIds,
    activeNodeDispatch,
    activeNodeOffsets
  );
  addCandidateCountPass(graph, index, activeNodeDispatch, activeNodeCounts, activeNodeOffsets);
}

function addHierarchyNodeQueryPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUTraceTemporalIndex,
  hierarchy: GPUTraceTemporalIndexHierarchy,
  level: GraphDataView<'uint32'>,
  nodeFlags: GraphDataView<'uint32'>
): void {
  const dispatch = getBoundedDispatchLayout(
    `${index.id}-hierarchy-query`,
    index.stats.maximumNodeCount,
    TEMPORAL_INDEX_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const levelOffsets = hierarchy.levels.map(item => `${item.firstNodeIndex}u`).join(', ');
  const levelCounts = hierarchy.levels.map(item => `${item.nodeCount}u`).join(', ');
  const stride = (view: GraphDataView): number => view.byteStride / UINT32_BYTE_LENGTH;
  const source = /* wgsl */ `
const LEVEL_COUNT: u32 = ${hierarchy.levels.length}u;
const LEVEL_OFFSETS = array<u32, ${hierarchy.levels.length}>(${levelOffsets});
const LEVEL_COUNTS = array<u32, ${hierarchy.levels.length}>(${levelCounts});
const MINIMUM_TIME_OFFSET: u32 = ${getViewElementOffset(hierarchy.minimumTimes)}u;
const MINIMUM_TIME_STRIDE: u32 = ${stride(hierarchy.minimumTimes)}u;
const MAXIMUM_TIME_OFFSET: u32 = ${getViewElementOffset(hierarchy.maximumTimes)}u;
const MAXIMUM_TIME_STRIDE: u32 = ${stride(hierarchy.maximumTimes)}u;
const GROUP_OFFSET: u32 = ${getViewElementOffset(hierarchy.groupIds)}u;
const GROUP_STRIDE: u32 = ${stride(hierarchy.groupIds)}u;
const MINIMUM_LANE_OFFSET: u32 = ${getViewElementOffset(hierarchy.minimumLanes)}u;
const MINIMUM_LANE_STRIDE: u32 = ${stride(hierarchy.minimumLanes)}u;
const MAXIMUM_LANE_OFFSET: u32 = ${getViewElementOffset(hierarchy.maximumLanes)}u;
const MAXIMUM_LANE_STRIDE: u32 = ${stride(hierarchy.maximumLanes)}u;
const WINDOW_OFFSET: u32 = ${getViewElementOffset(index.query.timeWindow)}u;
const LANE_WINDOW_OFFSET: u32 = ${getViewElementOffset(index.query.laneWindow)}u;
const ENABLED_GROUPS_OFFSET: u32 = ${getViewElementOffset(index.query.enabledGroups)}u;
const LEVEL_OFFSET: u32 = ${getViewElementOffset(level)}u;
const FLAG_OFFSET: u32 = ${getViewElementOffset(nodeFlags)}u;
@group(0) @binding(0) var<storage, read> minimumTimes: array<f32>;
@group(0) @binding(1) var<storage, read> maximumTimes: array<f32>;
@group(0) @binding(2) var<storage, read> groupIds: array<u32>;
@group(0) @binding(3) var<storage, read> minimumLanes: array<u32>;
@group(0) @binding(4) var<storage, read> maximumLanes: array<u32>;
@group(0) @binding(5) var<storage, read> timeWindow: array<f32>;
@group(0) @binding(6) var<storage, read> laneWindow: array<u32>;
@group(0) @binding(7) var<storage, read> enabledGroups: array<u32>;
@group(0) @binding(8) var<storage, read> selectedLevel: array<u32>;
@group(0) @binding(9) var<storage, read_write> nodeFlags: array<u32>;
@compute @workgroup_size(${TEMPORAL_INDEX_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, TEMPORAL_INDEX_WORKGROUP_SIZE)}
  if (index >= ${index.stats.maximumNodeCount}u) { return; }
  let levelIndex = selectedLevel[LEVEL_OFFSET];
  var visible = false;
  if (levelIndex < LEVEL_COUNT && index < LEVEL_COUNTS[levelIndex]) {
    let nodeIndex = LEVEL_OFFSETS[levelIndex] + index;
    let minimumTime = timeWindow[WINDOW_OFFSET];
    let maximumTime = timeWindow[WINDOW_OFFSET + 1u];
    let guardPadding = max(timeWindow[WINDOW_OFFSET + 2u], 0.0);
    let group = groupIds[GROUP_OFFSET + nodeIndex * GROUP_STRIDE];
    visible = minimumTime <= maximumTime && group < 32u &&
      maximumTimes[MAXIMUM_TIME_OFFSET + nodeIndex * MAXIMUM_TIME_STRIDE] >= minimumTime - guardPadding &&
      minimumTimes[MINIMUM_TIME_OFFSET + nodeIndex * MINIMUM_TIME_STRIDE] <= maximumTime + guardPadding &&
      maximumLanes[MAXIMUM_LANE_OFFSET + nodeIndex * MAXIMUM_LANE_STRIDE] >
        laneWindow[LANE_WINDOW_OFFSET] &&
      minimumLanes[MINIMUM_LANE_OFFSET + nodeIndex * MINIMUM_LANE_STRIDE] <
        laneWindow[LANE_WINDOW_OFFSET + 1u] &&
      (enabledGroups[ENABLED_GROUPS_OFFSET] & (1u << group)) != 0u;
  }
  nodeFlags[FLAG_OFFSET + index] = select(0u, 1u, visible);
}`;
  const bindings = {
    minimumTimes: hierarchy.minimumTimes,
    maximumTimes: hierarchy.maximumTimes,
    groupIds: hierarchy.groupIds,
    minimumLanes: hierarchy.minimumLanes,
    maximumLanes: hierarchy.maximumLanes,
    timeWindow: index.query.timeWindow,
    laneWindow: index.query.laneWindow,
    enabledGroups: index.query.enabledGroups,
    selectedLevel: level,
    nodeFlags
  };
  addTemporalComputePass(graph, {
    id: `${index.id}-hierarchy-query`,
    source,
    bindings,
    resources: [
      {buffer: hierarchy.minimumTimes, usage: 'storage-read'},
      {buffer: hierarchy.maximumTimes, usage: 'storage-read'},
      {buffer: hierarchy.groupIds, usage: 'storage-read'},
      {buffer: hierarchy.minimumLanes, usage: 'storage-read'},
      {buffer: hierarchy.maximumLanes, usage: 'storage-read'},
      {buffer: index.query.timeWindow, usage: 'storage-read'},
      {buffer: index.query.laneWindow, usage: 'storage-read'},
      {buffer: index.query.enabledGroups, usage: 'storage-read'},
      {buffer: level, usage: 'storage-read'},
      {buffer: nodeFlags, usage: 'storage-write'}
    ],
    dispatch
  });
}

function addDispatchInitializationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  dispatch: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const DISPATCH_OFFSET: u32 = ${getViewElementOffset(dispatch)}u;
@group(0) @binding(0) var<storage, read_write> command: array<u32>;
@compute @workgroup_size(1)
fn main() {
  command[DISPATCH_OFFSET] = 1u;
  command[DISPATCH_OFFSET + 1u] = 0u;
  command[DISPATCH_OFFSET + 2u] = 1u;
}`;
  addTemporalComputePass(graph, {
    id: `${id}-initialize`,
    source,
    bindings: {command: dispatch},
    resources: [{buffer: dispatch, usage: 'storage-write'}],
    dispatch: {x: 1, y: 1, z: 1}
  });
}

function addClearViewPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  view: GraphDataView<'uint32'>
): void {
  const dispatch = getBoundedDispatchLayout(
    id,
    view.length,
    TEMPORAL_INDEX_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const LENGTH: u32 = ${view.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(view)}u;
@group(0) @binding(0) var<storage, read_write> output: array<u32>;
@compute @workgroup_size(${TEMPORAL_INDEX_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, TEMPORAL_INDEX_WORKGROUP_SIZE)}
  if (index < LENGTH) { output[OUTPUT_OFFSET + index] = 0u; }
}`;
  addTemporalComputePass(graph, {
    id: `${id}-clear`,
    source,
    bindings: {output: view},
    resources: [{buffer: view, usage: 'storage-write'}],
    dispatch
  });
}

function addActiveNodeCountPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUTraceTemporalIndex,
  hierarchy: GPUTraceTemporalIndexHierarchy,
  level: GraphDataView<'uint32'>,
  activeNodeIds: GraphDataView<'uint32'>,
  activeNodeDispatch: GraphDataView<'uint32'>,
  activeNodeCounts: GraphDataView<'uint32'>
): void {
  const levelOffsets = hierarchy.levels.map(item => `${item.firstNodeIndex}u`).join(', ');
  const source = /* wgsl */ `
const LEVEL_COUNT: u32 = ${hierarchy.levels.length}u;
const LEVEL_OFFSETS = array<u32, ${hierarchy.levels.length}>(${levelOffsets});
const LEVEL_OFFSET: u32 = ${getViewElementOffset(level)}u;
const ACTIVE_ID_OFFSET: u32 = ${getViewElementOffset(activeNodeIds)}u;
const BATCH_COUNT_OFFSET: u32 = ${getViewElementOffset(hierarchy.batchCounts)}u;
const BATCH_COUNT_STRIDE: u32 = ${hierarchy.batchCounts.byteStride / UINT32_BYTE_LENGTH}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(activeNodeCounts)}u;
@group(0) @binding(0) var<storage, read> selectedLevel: array<u32>;
@group(0) @binding(1) var<storage, read> activeNodeIds: array<u32>;
@group(0) @binding(2) var<storage, read> batchCounts: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputCounts: array<u32>;
@compute @workgroup_size(1)
fn main(@builtin(workgroup_id) workgroupId: vec3<u32>) {
  let activeIndex = workgroupId.y;
  let levelIndex = selectedLevel[LEVEL_OFFSET];
  if (levelIndex >= LEVEL_COUNT) { return; }
  let nodeIndex = LEVEL_OFFSETS[levelIndex] + activeNodeIds[ACTIVE_ID_OFFSET + activeIndex];
  outputCounts[OUTPUT_OFFSET + activeIndex] =
    batchCounts[BATCH_COUNT_OFFSET + nodeIndex * BATCH_COUNT_STRIDE];
}`;
  addTemporalIndirectComputePass(graph, {
    id: `${index.id}-active-node-counts`,
    source,
    bindings: {
      selectedLevel: level,
      activeNodeIds,
      batchCounts: hierarchy.batchCounts,
      outputCounts: activeNodeCounts
    },
    resources: [
      {buffer: level, usage: 'storage-read'},
      {buffer: activeNodeIds, usage: 'storage-read'},
      {buffer: hierarchy.batchCounts, usage: 'storage-read'},
      {buffer: activeNodeCounts, usage: 'storage-write'}
    ],
    indirect: activeNodeDispatch
  });
}

function addActiveNodeScatterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUTraceTemporalIndex,
  hierarchy: GPUTraceTemporalIndexHierarchy,
  level: GraphDataView<'uint32'>,
  activeNodeIds: GraphDataView<'uint32'>,
  activeNodeDispatch: GraphDataView<'uint32'>,
  activeNodeOffsets: GraphDataView<'uint32'>
): void {
  const levelOffsets = hierarchy.levels.map(item => `${item.firstNodeIndex}u`).join(', ');
  const source = /* wgsl */ `
const LEVEL_COUNT: u32 = ${hierarchy.levels.length}u;
const LEVEL_OFFSETS = array<u32, ${hierarchy.levels.length}>(${levelOffsets});
const LEVEL_OFFSET: u32 = ${getViewElementOffset(level)}u;
const ACTIVE_ID_OFFSET: u32 = ${getViewElementOffset(activeNodeIds)}u;
const FIRST_BATCH_OFFSET: u32 = ${getViewElementOffset(hierarchy.firstBatchIndices)}u;
const FIRST_BATCH_STRIDE: u32 = ${hierarchy.firstBatchIndices.byteStride / UINT32_BYTE_LENGTH}u;
const BATCH_COUNT_OFFSET: u32 = ${getViewElementOffset(hierarchy.batchCounts)}u;
const BATCH_COUNT_STRIDE: u32 = ${hierarchy.batchCounts.byteStride / UINT32_BYTE_LENGTH}u;
const ACTIVE_OFFSET: u32 = ${getViewElementOffset(activeNodeOffsets)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(index.output.candidates)}u;
@group(0) @binding(0) var<storage, read> selectedLevel: array<u32>;
@group(0) @binding(1) var<storage, read> activeNodeIds: array<u32>;
@group(0) @binding(2) var<storage, read> firstBatchIndices: array<u32>;
@group(0) @binding(3) var<storage, read> batchCounts: array<u32>;
@group(0) @binding(4) var<storage, read> activeNodeOffsets: array<u32>;
@group(0) @binding(5) var<storage, read_write> outputCandidates: array<u32>;
@compute @workgroup_size(${TEMPORAL_INDEX_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let activeIndex = workgroupId.y;
  let levelIndex = selectedLevel[LEVEL_OFFSET];
  if (levelIndex >= LEVEL_COUNT) { return; }
  let nodeIndex = LEVEL_OFFSETS[levelIndex] + activeNodeIds[ACTIVE_ID_OFFSET + activeIndex];
  let batchCount = batchCounts[BATCH_COUNT_OFFSET + nodeIndex * BATCH_COUNT_STRIDE];
  if (localInvocationIndex >= batchCount) { return; }
  let firstBatchIndex =
    firstBatchIndices[FIRST_BATCH_OFFSET + nodeIndex * FIRST_BATCH_STRIDE];
  outputCandidates[OUTPUT_OFFSET + activeNodeOffsets[ACTIVE_OFFSET + activeIndex] + localInvocationIndex] =
    firstBatchIndex + localInvocationIndex;
}`;
  addTemporalIndirectComputePass(graph, {
    id: `${index.id}-expand-active-nodes`,
    source,
    bindings: {
      selectedLevel: level,
      activeNodeIds,
      firstBatchIndices: hierarchy.firstBatchIndices,
      batchCounts: hierarchy.batchCounts,
      activeNodeOffsets,
      outputCandidates: index.output.candidates
    },
    resources: [
      {buffer: level, usage: 'storage-read'},
      {buffer: activeNodeIds, usage: 'storage-read'},
      {buffer: hierarchy.firstBatchIndices, usage: 'storage-read'},
      {buffer: hierarchy.batchCounts, usage: 'storage-read'},
      {buffer: activeNodeOffsets, usage: 'storage-read'},
      {buffer: index.output.candidates, usage: 'storage-write'}
    ],
    indirect: activeNodeDispatch
  });
}

function addCandidateCountPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUTraceTemporalIndex,
  activeNodeDispatch: GraphDataView<'uint32'>,
  activeNodeCounts: GraphDataView<'uint32'>,
  activeNodeOffsets: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const DISPATCH_OFFSET: u32 = ${getViewElementOffset(activeNodeDispatch)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(activeNodeCounts)}u;
const ACTIVE_OFFSET: u32 = ${getViewElementOffset(activeNodeOffsets)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(index.output.candidateCount)}u;
@group(0) @binding(0) var<storage, read> activeNodeDispatch: array<u32>;
@group(0) @binding(1) var<storage, read> activeNodeCounts: array<u32>;
@group(0) @binding(2) var<storage, read> activeNodeOffsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputCount: array<u32>;
@compute @workgroup_size(1)
fn main() {
  let activeCount = activeNodeDispatch[DISPATCH_OFFSET + 1u];
  var count = 0u;
  if (activeCount > 0u) {
    let last = activeCount - 1u;
    count = activeNodeOffsets[ACTIVE_OFFSET + last] + activeNodeCounts[COUNT_OFFSET + last];
  }
  outputCount[OUTPUT_OFFSET] = count;
}`;
  addTemporalComputePass(graph, {
    id: `${index.id}-publish-candidate-count`,
    source,
    bindings: {
      activeNodeDispatch,
      activeNodeCounts,
      activeNodeOffsets,
      outputCount: index.output.candidateCount
    },
    resources: [
      {buffer: activeNodeDispatch, usage: 'storage-read'},
      {buffer: activeNodeCounts, usage: 'storage-read'},
      {buffer: activeNodeOffsets, usage: 'storage-read'},
      {buffer: index.output.candidateCount, usage: 'storage-write'}
    ],
    dispatch: {x: 1, y: 1, z: 1}
  });
}

function createTransientUint32View<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  length: number,
  additionalUsage = 0
): GraphDataView<'uint32'> {
  return graph.createDataView(
    graph.createTransientBuffer({
      id,
      byteLength: Math.max(length, 1) * UINT32_BYTE_LENGTH,
      usage: Buffer.STORAGE | additionalUsage
    }),
    {format: 'uint32', length}
  );
}

function addTemporalComputePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    bindings: Record<string, GraphDataView>;
    resources: GraphBufferUse[];
    dispatch: {x: number; y: number; z: number};
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: Object.keys(props.bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const resolved: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            resolved[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(resolved);
          computation.dispatch(computePass, props.dispatch.x, props.dispatch.y, props.dispatch.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function addTemporalIndirectComputePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    bindings: Record<string, GraphDataView>;
    resources: GraphBufferUse[];
    indirect: GraphDataView<'uint32'>;
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: [...props.resources, {buffer: props.indirect, usage: 'indirect'}],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: Object.keys(props.bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const resolved: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            resolved[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(resolved);
          computation.dispatchIndirect(
            computePass,
            getBuffer(props.indirect.buffer),
            props.indirect.byteOffset
          );
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function validateTemporalIndex(index: GPUTraceTemporalIndex): void {
  for (const [name, view, format] of [
    ['minimumTimes', index.batches.minimumTimes, 'float32'],
    ['maximumTimes', index.batches.maximumTimes, 'float32'],
    ['groupIds', index.batches.groupIds, 'uint32'],
    ['minimumLanes', index.batches.minimumLanes, 'uint32'],
    ['maximumLanes', index.batches.maximumLanes, 'uint32']
  ] as const) {
    if (
      view.format !== format ||
      view.rowByteLength !== UINT32_BYTE_LENGTH ||
      view.byteStride < UINT32_BYTE_LENGTH ||
      view.byteStride % UINT32_BYTE_LENGTH !== 0 ||
      view.byteOffset % UINT32_BYTE_LENGTH !== 0
    ) {
      throw new Error(`${index.id} ${name} must be a uint32-aligned scalar ${format} view`);
    }
  }
  const batchCount = index.batches.minimumTimes.length;
  if (
    index.batches.maximumTimes.length !== batchCount ||
    index.batches.groupIds.length !== batchCount ||
    index.batches.minimumLanes.length !== batchCount ||
    index.batches.maximumLanes.length !== batchCount
  ) {
    throw new Error(`${index.id} batch summary columns must have matching lengths`);
  }
  validatePackedView(index.query.timeWindow, ['float32'], `${index.id} timeWindow`);
  validatePackedUint32View(index.query.enabledGroups, `${index.id} enabledGroups`);
  validatePackedUint32View(index.query.laneWindow, `${index.id} laneWindow`);
  if (index.query.level) {
    validatePackedUint32View(index.query.level, `${index.id} level`);
  }
  validatePackedUint32View(index.output.candidates, `${index.id} candidates`);
  validatePackedUint32View(index.output.candidateCount, `${index.id} candidateCount`);
  if (
    index.query.timeWindow.length < 3 ||
    index.query.enabledGroups.length !== 1 ||
    index.query.laneWindow.length !== 2 ||
    (index.query.level && index.query.level.length !== 1) ||
    index.output.candidateCount.length !== 1 ||
    index.output.candidates.length < batchCount
  ) {
    throw new Error(`${index.id} query controls and outputs do not match index capacity`);
  }
  if (index.hierarchy) {
    validateTemporalHierarchy(index);
  } else if (index.query.level) {
    throw new Error(`${index.id} level requires hierarchy summaries`);
  }
  const inputs = [
    ...Object.values(index.batches),
    ...(index.hierarchy ? getHierarchyViews(index.hierarchy) : []),
    ...getQueryViews(index.query)
  ] as GraphDataView[];
  const outputs = Object.values(index.output) as GraphDataView[];
  if (inputs.some(input => outputs.some(output => doGraphDataViewsOverlap(input, output)))) {
    throw new Error(`${index.id} query outputs must not overlap index inputs`);
  }
}

function validateTemporalHierarchy(index: GPUTraceTemporalIndex): void {
  const hierarchy = index.hierarchy!;
  if (!index.query.level) {
    throw new Error(`${index.id} hierarchy requires one selected level control`);
  }
  for (const [name, view, format] of [
    ['minimumTimes', hierarchy.minimumTimes, 'float32'],
    ['maximumTimes', hierarchy.maximumTimes, 'float32'],
    ['groupIds', hierarchy.groupIds, 'uint32'],
    ['firstBatchIndices', hierarchy.firstBatchIndices, 'uint32'],
    ['batchCounts', hierarchy.batchCounts, 'uint32'],
    ['minimumLanes', hierarchy.minimumLanes, 'uint32'],
    ['maximumLanes', hierarchy.maximumLanes, 'uint32']
  ] as const) {
    if (
      view.format !== format ||
      view.rowByteLength !== UINT32_BYTE_LENGTH ||
      view.byteStride < UINT32_BYTE_LENGTH ||
      view.byteStride % UINT32_BYTE_LENGTH !== 0 ||
      view.byteOffset % UINT32_BYTE_LENGTH !== 0
    ) {
      throw new Error(
        `${index.id} hierarchy ${name} must be a uint32-aligned scalar ${format} view`
      );
    }
  }
  const nodeCount = hierarchy.minimumTimes.length;
  if (getHierarchyViews(hierarchy).some(view => view.length !== nodeCount)) {
    throw new Error(`${index.id} hierarchy columns must have matching lengths`);
  }
  if (hierarchy.levels.length === 0) {
    throw new Error(`${index.id} hierarchy requires at least one level`);
  }
  let previousEnd = 0;
  for (const [levelIndex, level] of hierarchy.levels.entries()) {
    if (
      !Number.isSafeInteger(level.firstNodeIndex) ||
      !Number.isSafeInteger(level.nodeCount) ||
      !Number.isSafeInteger(level.maximumBatchCount) ||
      level.firstNodeIndex !== previousEnd ||
      level.nodeCount < 1 ||
      level.maximumBatchCount < 1 ||
      level.maximumBatchCount > TEMPORAL_INDEX_WORKGROUP_SIZE ||
      !Number.isFinite(level.averageTimeSpan) ||
      level.averageTimeSpan < 0 ||
      level.firstNodeIndex + level.nodeCount > nodeCount
    ) {
      throw new Error(`${index.id} hierarchy level ${levelIndex} is invalid`);
    }
    previousEnd = level.firstNodeIndex + level.nodeCount;
  }
  if (previousEnd !== nodeCount) {
    throw new Error(`${index.id} hierarchy levels must cover every packed node`);
  }
}

function getHierarchyViews(hierarchy: GPUTraceTemporalIndexHierarchy): GraphDataView[] {
  return [
    hierarchy.minimumTimes,
    hierarchy.maximumTimes,
    hierarchy.groupIds,
    hierarchy.firstBatchIndices,
    hierarchy.batchCounts,
    hierarchy.minimumLanes,
    hierarchy.maximumLanes
  ];
}

function getTemporalIndexViews(index: GPUTraceTemporalIndex): GraphDataView[] {
  return [
    ...Object.values(index.batches),
    ...(index.hierarchy ? getHierarchyViews(index.hierarchy) : []),
    ...getQueryViews(index.query),
    ...Object.values(index.output)
  ];
}

function getQueryViews(query: GPUTraceTemporalIndexQuery): GraphDataView[] {
  return [
    query.timeWindow,
    query.enabledGroups,
    query.laneWindow,
    ...(query.level ? [query.level] : [])
  ];
}
