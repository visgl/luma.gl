// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView
} from '../gpu-core/gpu-command-graph';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../gpu-core/gpu-dispatch-utils';
import {
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from '../gpu-core/graph-data-view-utils';
import type {GPUTraceTemporalIndexLevel} from './gpu-trace-temporal-index';

const TEMPORAL_INDEX_BUILD_WORKGROUP_SIZE = 256;

/** Word offsets for packed leaf-batch records consumed by the GPU hierarchy builder. */
export type GPUTraceTemporalIndexLeafLayout = {
  recordWordLength: number;
  minimumTimeWordOffset: number;
  maximumTimeWordOffset: number;
  maximumDurationWordOffset: number;
  groupWordOffset: number;
  minimumLaneWordOffset: number;
  maximumLaneWordOffset: number;
};

/** Word offsets for packed persistent hierarchy records built on the GPU. */
export type GPUTraceTemporalIndexHierarchyLayout = GPUTraceTemporalIndexLeafLayout & {
  firstBatchWordOffset: number;
  batchCountWordOffset: number;
};

/** Properties for persistent, partition-aware GPU temporal-index construction. */
export type GPUTraceTemporalIndexBuilderProps = {
  id?: string;
  /** Packed immutable or incrementally uploaded leaf-batch records. */
  batches: GraphDataView<'uint32'>;
  batchCount: number;
  batchLayout: GPUTraceTemporalIndexLeafLayout;
  /** Packed hierarchy records with caller-initialized group/range topology. */
  hierarchy: GraphDataView<'uint32'>;
  hierarchyLayout: GPUTraceTemporalIndexHierarchyLayout;
  levels: readonly GPUTraceTemporalIndexLevel[];
  /** Maximum leaf capacity of one independently updateable source partition. */
  partitionBatchCount: number;
  /** One nonzero word per dirty partition. Cleared after its summaries are rebuilt. */
  dirtyPartitions: GraphDataView<'uint32'>;
  /** Persistent bit field populated when GPU-visible topology or source rows are invalid. */
  validationErrors: GraphDataView<'uint32'>;
};

/** Immutable work and capacity information for a GPU temporal-index build contributor. */
export type GPUTraceTemporalIndexBuilderStats = {
  batchCount: number;
  nodeCount: number;
  levelCount: number;
  partitionCount: number;
  maximumBatchCount: number;
};

/**
 * Builds persistent multi-resolution trace summaries directly from packed leaf-batch records.
 *
 * Hierarchy topology is caller-owned and stable: each record identifies a contiguous leaf range
 * and renderer group. Setting one dirty-partition word rebuilds only hierarchy records whose leaf
 * ranges begin in that partition. The contributor clears processed dirty words after construction,
 * allowing the same compiled graph to serve initial upload and later streaming updates.
 */
export class GPUTraceTemporalIndexBuilder {
  readonly id: string;
  readonly props: GPUTraceTemporalIndexBuilderProps;
  readonly stats: Readonly<GPUTraceTemporalIndexBuilderStats>;

  constructor(props: GPUTraceTemporalIndexBuilderProps) {
    this.id = props.id ?? 'gpu-trace-temporal-index-builder';
    this.props = props;
    this.stats = Object.freeze(validateBuilder(this.id, props));
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const {props} = this;
    const views = [props.batches, props.hierarchy, props.dirtyPartitions, props.validationErrors];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    if (this.stats.nodeCount > 0) {
      addHierarchyBuildPass(graph, this);
    }
    if (this.stats.partitionCount > 0) {
      addDirtyPartitionClearPass(graph, this);
    }
  }
}

function addHierarchyBuildPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  builder: GPUTraceTemporalIndexBuilder
): void {
  const {props, stats, id} = builder;
  const dispatch = getBoundedDispatchLayout(
    id,
    stats.nodeCount,
    TEMPORAL_INDEX_BUILD_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const batch = props.batchLayout;
  const hierarchy = props.hierarchyLayout;
  const source = /* wgsl */ `
const NODE_COUNT: u32 = ${stats.nodeCount}u;
const BATCH_COUNT: u32 = ${stats.batchCount}u;
const PARTITION_BATCH_COUNT: u32 = ${props.partitionBatchCount}u;
const BATCH_RECORD_WORD_LENGTH: u32 = ${batch.recordWordLength}u;
const BATCH_MINIMUM_TIME_WORD: u32 = ${batch.minimumTimeWordOffset}u;
const BATCH_MAXIMUM_TIME_WORD: u32 = ${batch.maximumTimeWordOffset}u;
const BATCH_MAXIMUM_DURATION_WORD: u32 = ${batch.maximumDurationWordOffset}u;
const BATCH_GROUP_WORD: u32 = ${batch.groupWordOffset}u;
const BATCH_MINIMUM_LANE_WORD: u32 = ${batch.minimumLaneWordOffset}u;
const BATCH_MAXIMUM_LANE_WORD: u32 = ${batch.maximumLaneWordOffset}u;
const HIERARCHY_RECORD_WORD_LENGTH: u32 = ${hierarchy.recordWordLength}u;
const HIERARCHY_MINIMUM_TIME_WORD: u32 = ${hierarchy.minimumTimeWordOffset}u;
const HIERARCHY_MAXIMUM_TIME_WORD: u32 = ${hierarchy.maximumTimeWordOffset}u;
const HIERARCHY_MAXIMUM_DURATION_WORD: u32 = ${hierarchy.maximumDurationWordOffset}u;
const HIERARCHY_GROUP_WORD: u32 = ${hierarchy.groupWordOffset}u;
const HIERARCHY_MINIMUM_LANE_WORD: u32 = ${hierarchy.minimumLaneWordOffset}u;
const HIERARCHY_MAXIMUM_LANE_WORD: u32 = ${hierarchy.maximumLaneWordOffset}u;
const HIERARCHY_FIRST_BATCH_WORD: u32 = ${hierarchy.firstBatchWordOffset}u;
const HIERARCHY_BATCH_COUNT_WORD: u32 = ${hierarchy.batchCountWordOffset}u;
const BATCH_OFFSET: u32 = ${getViewElementOffset(props.batches)}u;
const HIERARCHY_OFFSET: u32 = ${getViewElementOffset(props.hierarchy)}u;
const DIRTY_OFFSET: u32 = ${getViewElementOffset(props.dirtyPartitions)}u;
const ERROR_OFFSET: u32 = ${getViewElementOffset(props.validationErrors)}u;
@group(0) @binding(0) var<storage, read> batches: array<u32>;
@group(0) @binding(1) var<storage, read_write> hierarchy: array<u32>;
@group(0) @binding(2) var<storage, read> dirtyPartitions: array<u32>;
@group(0) @binding(3) var<storage, read_write> validationErrors: array<atomic<u32>>;

@compute @workgroup_size(${TEMPORAL_INDEX_BUILD_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, TEMPORAL_INDEX_BUILD_WORKGROUP_SIZE)}
  if (index >= NODE_COUNT) { return; }
  let hierarchyBase = HIERARCHY_OFFSET + index * HIERARCHY_RECORD_WORD_LENGTH;
  let firstBatch = hierarchy[hierarchyBase + HIERARCHY_FIRST_BATCH_WORD];
  let ownedBatchCount = hierarchy[hierarchyBase + HIERARCHY_BATCH_COUNT_WORD];
  if (ownedBatchCount == 0u || firstBatch >= BATCH_COUNT || ownedBatchCount > BATCH_COUNT - firstBatch) {
    atomicOr(&validationErrors[ERROR_OFFSET], 1u);
    return;
  }
  let partitionIndex = firstBatch / PARTITION_BATCH_COUNT;
  if ((firstBatch + ownedBatchCount - 1u) / PARTITION_BATCH_COUNT != partitionIndex) {
    atomicOr(&validationErrors[ERROR_OFFSET], 2u);
    return;
  }
  if (dirtyPartitions[DIRTY_OFFSET + partitionIndex] == 0u) { return; }

  let expectedGroup = hierarchy[hierarchyBase + HIERARCHY_GROUP_WORD];
  var minimumTime = 3.402823e38;
  var maximumTime = -3.402823e38;
  var maximumDuration = 0.0;
  var minimumLane = 0xffffffffu;
  var maximumLane = 0u;
  for (var batchOffset = 0u; batchOffset < ${stats.maximumBatchCount}u; batchOffset++) {
    if (batchOffset >= ownedBatchCount) { break; }
    let batchBase = BATCH_OFFSET + (firstBatch + batchOffset) * BATCH_RECORD_WORD_LENGTH;
    let group = batches[batchBase + BATCH_GROUP_WORD];
    if (group != expectedGroup) {
      atomicOr(&validationErrors[ERROR_OFFSET], 4u);
      return;
    }
    minimumTime = min(minimumTime, bitcast<f32>(batches[batchBase + BATCH_MINIMUM_TIME_WORD]));
    maximumTime = max(maximumTime, bitcast<f32>(batches[batchBase + BATCH_MAXIMUM_TIME_WORD]));
    maximumDuration = max(
      maximumDuration,
      bitcast<f32>(batches[batchBase + BATCH_MAXIMUM_DURATION_WORD])
    );
    minimumLane = min(minimumLane, batches[batchBase + BATCH_MINIMUM_LANE_WORD]);
    maximumLane = max(maximumLane, batches[batchBase + BATCH_MAXIMUM_LANE_WORD]);
  }
  hierarchy[hierarchyBase + HIERARCHY_MINIMUM_TIME_WORD] = bitcast<u32>(minimumTime);
  hierarchy[hierarchyBase + HIERARCHY_MAXIMUM_TIME_WORD] = bitcast<u32>(maximumTime);
  hierarchy[hierarchyBase + HIERARCHY_MAXIMUM_DURATION_WORD] = bitcast<u32>(maximumDuration);
  hierarchy[hierarchyBase + HIERARCHY_MINIMUM_LANE_WORD] = minimumLane;
  hierarchy[hierarchyBase + HIERARCHY_MAXIMUM_LANE_WORD] = maximumLane;
}`;
  addBuilderComputePass(graph, {
    id: `${id}-build-dirty-partitions`,
    source,
    bindings: {
      batches: props.batches,
      hierarchy: props.hierarchy,
      dirtyPartitions: props.dirtyPartitions,
      validationErrors: props.validationErrors
    },
    resources: [
      {buffer: props.batches, usage: 'storage-read'},
      {buffer: props.hierarchy, usage: 'storage-read-write'},
      {buffer: props.dirtyPartitions, usage: 'storage-read'},
      {buffer: props.validationErrors, usage: 'storage-read-write'}
    ],
    dispatch
  });
}

function addDirtyPartitionClearPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  builder: GPUTraceTemporalIndexBuilder
): void {
  const {props, stats, id} = builder;
  const dispatch = getBoundedDispatchLayout(
    `${id}-clear-dirty`,
    stats.partitionCount,
    TEMPORAL_INDEX_BUILD_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const PARTITION_COUNT: u32 = ${stats.partitionCount}u;
const DIRTY_OFFSET: u32 = ${getViewElementOffset(props.dirtyPartitions)}u;
@group(0) @binding(0) var<storage, read_write> dirtyPartitions: array<u32>;
@compute @workgroup_size(${TEMPORAL_INDEX_BUILD_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, TEMPORAL_INDEX_BUILD_WORKGROUP_SIZE)}
  if (index < PARTITION_COUNT) { dirtyPartitions[DIRTY_OFFSET + index] = 0u; }
}`;
  addBuilderComputePass(graph, {
    id: `${id}-clear-dirty-partitions`,
    source,
    bindings: {dirtyPartitions: props.dirtyPartitions},
    resources: [{buffer: props.dirtyPartitions, usage: 'storage-write'}],
    dispatch
  });
}

function addBuilderComputePass<Parameters>(
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

function validateBuilder(
  id: string,
  props: GPUTraceTemporalIndexBuilderProps
): GPUTraceTemporalIndexBuilderStats {
  validatePackedUint32View(props.batches, `${id} batches`);
  validatePackedUint32View(props.hierarchy, `${id} hierarchy`);
  validatePackedUint32View(props.dirtyPartitions, `${id} dirtyPartitions`);
  validatePackedUint32View(props.validationErrors, `${id} validationErrors`);
  validateRecordLayout(id, 'batch', props.batchLayout, false);
  validateRecordLayout(id, 'hierarchy', props.hierarchyLayout, true);
  if (!Number.isSafeInteger(props.batchCount) || props.batchCount < 0) {
    throw new Error(`${id} batchCount must be a nonnegative safe integer`);
  }
  if (!Number.isSafeInteger(props.partitionBatchCount) || props.partitionBatchCount < 1) {
    throw new Error(`${id} partitionBatchCount must be a positive safe integer`);
  }
  if (props.batches.length < props.batchCount * props.batchLayout.recordWordLength) {
    throw new Error(`${id} packed batch records do not cover batchCount`);
  }
  if (props.hierarchy.length % props.hierarchyLayout.recordWordLength !== 0) {
    throw new Error(`${id} packed hierarchy records must be stride-aligned`);
  }
  const nodeCount = props.hierarchy.length / props.hierarchyLayout.recordWordLength;
  const partitionCount = Math.ceil(props.batchCount / props.partitionBatchCount);
  if (props.dirtyPartitions.length !== partitionCount || props.validationErrors.length !== 1) {
    throw new Error(`${id} incremental controls do not match partition capacity`);
  }
  if (props.levels.length === 0 && nodeCount !== 0) {
    throw new Error(`${id} nonempty hierarchy requires levels`);
  }
  let coveredNodeCount = 0;
  let maximumBatchCount = 0;
  for (const [levelIndex, level] of props.levels.entries()) {
    if (
      level.firstNodeIndex !== coveredNodeCount ||
      level.nodeCount < 1 ||
      level.maximumBatchCount < 1 ||
      level.maximumBatchCount > props.partitionBatchCount ||
      !Number.isFinite(level.averageTimeSpan) ||
      level.averageTimeSpan < 0
    ) {
      throw new Error(`${id} hierarchy level ${levelIndex} is invalid`);
    }
    coveredNodeCount += level.nodeCount;
    maximumBatchCount = Math.max(maximumBatchCount, level.maximumBatchCount);
  }
  if (coveredNodeCount !== nodeCount) {
    throw new Error(`${id} hierarchy levels must cover every packed node`);
  }
  if (
    doGraphDataViewsOverlap(props.batches, props.hierarchy) ||
    doGraphDataViewsOverlap(props.batches, props.dirtyPartitions) ||
    doGraphDataViewsOverlap(props.hierarchy, props.dirtyPartitions) ||
    doGraphDataViewsOverlap(props.validationErrors, props.batches) ||
    doGraphDataViewsOverlap(props.validationErrors, props.hierarchy) ||
    doGraphDataViewsOverlap(props.validationErrors, props.dirtyPartitions)
  ) {
    throw new Error(`${id} source, hierarchy, dirty, and validation views must not overlap`);
  }
  return {
    batchCount: props.batchCount,
    nodeCount,
    levelCount: props.levels.length,
    partitionCount,
    maximumBatchCount
  };
}

function validateRecordLayout(
  id: string,
  name: string,
  layout: GPUTraceTemporalIndexLeafLayout | GPUTraceTemporalIndexHierarchyLayout,
  hierarchy: boolean
): void {
  const offsets = [
    layout.minimumTimeWordOffset,
    layout.maximumTimeWordOffset,
    layout.maximumDurationWordOffset,
    layout.groupWordOffset,
    layout.minimumLaneWordOffset,
    layout.maximumLaneWordOffset,
    ...(hierarchy
      ? [
          (layout as GPUTraceTemporalIndexHierarchyLayout).firstBatchWordOffset,
          (layout as GPUTraceTemporalIndexHierarchyLayout).batchCountWordOffset
        ]
      : [])
  ];
  if (
    !Number.isSafeInteger(layout.recordWordLength) ||
    layout.recordWordLength < 1 ||
    offsets.some(
      offset => !Number.isSafeInteger(offset) || offset < 0 || offset >= layout.recordWordLength
    )
  ) {
    throw new Error(`${id} ${name} record layout is invalid`);
  }
}
