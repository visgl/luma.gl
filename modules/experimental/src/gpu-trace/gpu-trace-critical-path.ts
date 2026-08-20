// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type GPUCommandGraphContributor,
  type GraphBufferUse,
  type GraphDataView,
  GraphVectorView
} from '../gpu-core/gpu-command-graph';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../gpu-core/gpu-dispatch-utils';
import {
  createTransientView,
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from '../gpu-core/graph-data-view-utils';

const CRITICAL_PATH_WORKGROUP_SIZE = 256;
const DEFAULT_MAXIMUM_ROWS_PER_PASS = 0xffffffff;
const STATE_RECORD_WORD_LENGTH = 4;
const INVALID_INDEX = 0xffffffff;

/** Bit flags written to `summary[3]` by {@link GPUTraceCriticalPath}. */
export const GPU_TRACE_CRITICAL_PATH_INVALID_PARENT = 1;
export const GPU_TRACE_CRITICAL_PATH_INVALID_DURATION = 2;
export const GPU_TRACE_CRITICAL_PATH_CYCLE = 4;
export const GPU_TRACE_CRITICAL_PATH_LIMIT_EXCEEDED = 8;
export const GPU_TRACE_CRITICAL_PATH_NUMERIC_OVERFLOW = 16;

/** Caller-owned outputs produced by one critical parent-path analysis. */
export type GPUTraceCriticalPathOutput = {
  /** Inclusive duration from each span through its canonical parent chain. */
  pathDurations: GraphDataView<'float32'>;
  /** Difference between the winning path duration and each valid span path duration. */
  slackDurations: GraphDataView<'float32'>;
  /** Validated canonical parent or `0xffffffff` for roots and invalid/cyclic rows. */
  criticalPredecessors: GraphDataView<'uint32'>;
  /** Root span reached by each valid parent chain. */
  rootIndices: GraphDataView<'uint32'>;
  /** Number of parent edges from each span to its root. */
  hopCounts: GraphDataView<'uint32'>;
  /** One for spans on the selected longest parent path and zero otherwise. */
  criticalMask: GraphDataView<'uint32'>;
  /** Maximum-duration bits, endpoint index, maximum hops, and validation flags. */
  summary: GraphDataView<'uint32'>;
};

/** Properties for exact, cycle-safe critical analysis over one canonical parent per trace span. */
export type GPUTraceCriticalPathProps = {
  id?: string;
  /** Canonical parent index per span; roots contain `0xffffffff`. */
  parentIndices: GraphDataView<'uint32'>;
  /** Nonnegative finite duration per span. */
  durations: GraphDataView<'float32'> | GraphVectorView<'float32'>;
  output: GPUTraceCriticalPathOutput;
  /** Bounded serial walk used only to materialize the single winning path mask. */
  maximumCriticalPathLength?: number;
  /** Optional row partition size for finer resumable scheduling. Defaults to one uint32 range. */
  maximumRowsPerPass?: number;
};

/** Static work and capacity information for one critical-path contributor. */
export type GPUTraceCriticalPathStats = {
  spanCount: number;
  pointerJumpPassCount: number;
  maximumCriticalPathLength: number;
};

/**
 * Finds the longest duration-weighted path in a canonical trace parent forest.
 *
 * Pointer jumping resolves every root, cumulative duration, and hop count in logarithmic graph
 * passes. Invalid parents and cycles are excluded rather than allowed to poison the winning path.
 * A final bounded single-thread walk materializes the exact selected path; all other per-span work
 * remains parallel and GPU-resident. This parent-forest contract is the first causal-analysis
 * building block. Multi-parent DAG preparation and CPM slack can compose on top without changing
 * the output identity or diagnostics contract.
 */
export class GPUTraceCriticalPath implements GPUCommandGraphContributor {
  readonly id: string;
  readonly props: GPUTraceCriticalPathProps;
  readonly stats: Readonly<GPUTraceCriticalPathStats>;

  constructor(props: GPUTraceCriticalPathProps) {
    this.id = props.id ?? 'gpu-trace-critical-path';
    this.props = props;
    this.stats = Object.freeze(validateCriticalPath(this.id, props));
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = getCriticalPathViews(this.props);
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    addSummaryClearPass(graph, this);
    if (this.stats.spanCount === 0) return;

    const stateViews: [GraphDataView<'uint32'>, GraphDataView<'uint32'>] = [
      createTransientView(
        graph,
        `${this.id}-state-a`,
        'uint32',
        this.stats.spanCount * STATE_RECORD_WORD_LENGTH
      ),
      createTransientView(
        graph,
        `${this.id}-state-b`,
        'uint32',
        this.stats.spanCount * STATE_RECORD_WORD_LENGTH
      )
    ];
    const maximumRowsPerPass = getMaximumRowsPerPass(this.props);
    let firstSpanIndex = 0;
    for (const durationView of getDurationViews(this.props.durations)) {
      for (let firstChunkIndex = 0; firstChunkIndex < durationView.length; ) {
        const rowCount = Math.min(maximumRowsPerPass, durationView.length - firstChunkIndex);
        addInitializationPass(
          graph,
          this,
          stateViews[0],
          durationView,
          firstSpanIndex + firstChunkIndex,
          firstChunkIndex,
          rowCount
        );
        firstChunkIndex += rowCount;
      }
      firstSpanIndex += durationView.length;
    }
    for (let passIndex = 0; passIndex < this.stats.pointerJumpPassCount; passIndex++) {
      for (let firstPassSpanIndex = 0; firstPassSpanIndex < this.stats.spanCount; ) {
        const rowCount = Math.min(maximumRowsPerPass, this.stats.spanCount - firstPassSpanIndex);
        addPointerJumpPass(
          graph,
          this,
          stateViews[passIndex % 2],
          stateViews[(passIndex + 1) % 2],
          passIndex,
          firstPassSpanIndex,
          rowCount
        );
        firstPassSpanIndex += rowCount;
      }
    }
    const resolvedState = stateViews[this.stats.pointerJumpPassCount % 2];
    for (let firstPassSpanIndex = 0; firstPassSpanIndex < this.stats.spanCount; ) {
      const rowCount = Math.min(maximumRowsPerPass, this.stats.spanCount - firstPassSpanIndex);
      addFinalizePass(graph, this, resolvedState, firstPassSpanIndex, rowCount);
      firstPassSpanIndex += rowCount;
    }
    for (let firstPassSpanIndex = 0; firstPassSpanIndex < this.stats.spanCount; ) {
      const rowCount = Math.min(maximumRowsPerPass, this.stats.spanCount - firstPassSpanIndex);
      addEndpointPass(graph, this, firstPassSpanIndex, rowCount);
      firstPassSpanIndex += rowCount;
    }
    addCriticalMaskPass(graph, this);
    for (let firstPassSpanIndex = 0; firstPassSpanIndex < this.stats.spanCount; ) {
      const rowCount = Math.min(maximumRowsPerPass, this.stats.spanCount - firstPassSpanIndex);
      addSlackPass(graph, this, firstPassSpanIndex, rowCount);
      firstPassSpanIndex += rowCount;
    }
  }
}

function addSummaryClearPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  analysis: GPUTraceCriticalPath
): void {
  const {summary} = analysis.props.output;
  const source = /* wgsl */ `
const SUMMARY_OFFSET: u32 = ${getViewElementOffset(summary)}u;
@group(0) @binding(0) var<storage, read_write> summary: array<u32>;
@compute @workgroup_size(1)
fn main() {
  summary[SUMMARY_OFFSET] = 0u;
  summary[SUMMARY_OFFSET + 1u] = ${INVALID_INDEX}u;
  summary[SUMMARY_OFFSET + 2u] = 0u;
  summary[SUMMARY_OFFSET + 3u] = 0u;
}`;
  addCriticalPathPass(graph, {
    id: `${analysis.id}-clear-summary`,
    source,
    bindings: {summary},
    resources: [{buffer: summary, usage: 'storage-write'}],
    dispatch: {x: 1, y: 1, z: 1},
    invocationCount: 1
  });
}

function addInitializationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  analysis: GPUTraceCriticalPath,
  state: GraphDataView<'uint32'>,
  durationView: GraphDataView<'float32'>,
  firstSpanIndex: number,
  firstChunkIndex: number,
  rowCount: number
): void {
  const {props, stats, id} = analysis;
  const {parentIndices, output} = props;
  const dispatch = getCriticalPathDispatch(graph, `${id}-initialize-${firstSpanIndex}`, rowCount);
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${stats.spanCount}u;
const CHUNK_SPAN_COUNT: u32 = ${rowCount}u;
const FIRST_SPAN_INDEX: u32 = ${firstSpanIndex}u;
const FIRST_CHUNK_INDEX: u32 = ${firstChunkIndex}u;
const INVALID_INDEX: u32 = ${INVALID_INDEX}u;
const PARENT_OFFSET: u32 = ${getViewElementOffset(parentIndices)}u;
const DURATION_OFFSET: u32 = ${getViewElementOffset(durationView)}u;
const DURATION_STRIDE: u32 = ${durationView.byteStride / Uint32Array.BYTES_PER_ELEMENT}u;
const STATE_OFFSET: u32 = ${getViewElementOffset(state)}u;
const MASK_OFFSET: u32 = ${getViewElementOffset(output.criticalMask)}u;
const SUMMARY_OFFSET: u32 = ${getViewElementOffset(output.summary)}u;
@group(0) @binding(0) var<storage, read> parentIndices: array<u32>;
@group(0) @binding(1) var<storage, read> durations: array<f32>;
@group(0) @binding(2) var<storage, read_write> state: array<u32>;
@group(0) @binding(3) var<storage, read_write> criticalMask: array<u32>;
@group(0) @binding(4) var<storage, read_write> summary: array<atomic<u32>>;
@compute @workgroup_size(${CRITICAL_PATH_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, CRITICAL_PATH_WORKGROUP_SIZE)}
  if (index >= CHUNK_SPAN_COUNT) { return; }
  let spanIndex = FIRST_SPAN_INDEX + index;
  let stateBase = STATE_OFFSET + spanIndex * ${STATE_RECORD_WORD_LENGTH}u;
  var parent = parentIndices[PARENT_OFFSET + spanIndex];
  var duration = durations[DURATION_OFFSET + (FIRST_CHUNK_INDEX + index) * DURATION_STRIDE];
  var root = spanIndex;
  var validationFlags = 0u;
  if (parent != INVALID_INDEX && parent >= SPAN_COUNT) {
    parent = INVALID_INDEX;
    root = INVALID_INDEX;
    validationFlags = validationFlags | ${GPU_TRACE_CRITICAL_PATH_INVALID_PARENT}u;
  }
  if (!(duration >= 0.0 && duration <= 3.402823e38)) {
    duration = 0.0;
    parent = INVALID_INDEX;
    root = INVALID_INDEX;
    validationFlags = validationFlags | ${GPU_TRACE_CRITICAL_PATH_INVALID_DURATION}u;
  }
  state[stateBase] = parent;
  state[stateBase + 1u] = root;
  state[stateBase + 2u] = 0u;
  state[stateBase + 3u] = bitcast<u32>(duration);
  criticalMask[MASK_OFFSET + spanIndex] = 0u;
  if (validationFlags != 0u) {
    atomicOr(&summary[SUMMARY_OFFSET + 3u], validationFlags);
  }
}`;
  addCriticalPathPass(graph, {
    id: `${id}-initialize-${firstSpanIndex}`,
    source,
    bindings: {
      parentIndices,
      durations: durationView,
      state,
      criticalMask: output.criticalMask,
      summary: output.summary
    },
    resources: [
      {buffer: parentIndices, usage: 'storage-read'},
      {buffer: durationView, usage: 'storage-read'},
      {buffer: state, usage: 'storage-write'},
      {buffer: output.criticalMask, usage: 'storage-write'},
      {buffer: output.summary, usage: 'storage-read-write'}
    ],
    dispatch,
    invocationCount: rowCount
  });
}

function addPointerJumpPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  analysis: GPUTraceCriticalPath,
  sourceState: GraphDataView<'uint32'>,
  destinationState: GraphDataView<'uint32'>,
  passIndex: number,
  firstSpanIndex: number,
  rowCount: number
): void {
  const {stats, props, id} = analysis;
  const dispatch = getCriticalPathDispatch(
    graph,
    `${id}-jump-${passIndex}-${firstSpanIndex}`,
    rowCount
  );
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${stats.spanCount}u;
const ROW_COUNT: u32 = ${rowCount}u;
const FIRST_SPAN_INDEX: u32 = ${firstSpanIndex}u;
const INVALID_INDEX: u32 = ${INVALID_INDEX}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(sourceState)}u;
const DESTINATION_OFFSET: u32 = ${getViewElementOffset(destinationState)}u;
const SUMMARY_OFFSET: u32 = ${getViewElementOffset(props.output.summary)}u;
@group(0) @binding(0) var<storage, read> sourceState: array<u32>;
@group(0) @binding(1) var<storage, read_write> destinationState: array<u32>;
@group(0) @binding(2) var<storage, read_write> summary: array<atomic<u32>>;
@compute @workgroup_size(${CRITICAL_PATH_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, CRITICAL_PATH_WORKGROUP_SIZE)}
  if (index >= ROW_COUNT) { return; }
  let spanIndex = FIRST_SPAN_INDEX + index;
  let sourceBase = SOURCE_OFFSET + spanIndex * ${STATE_RECORD_WORD_LENGTH}u;
  let destinationBase = DESTINATION_OFFSET + spanIndex * ${STATE_RECORD_WORD_LENGTH}u;
  let ancestor = sourceState[sourceBase];
  var root = sourceState[sourceBase + 1u];
  var hops = sourceState[sourceBase + 2u];
  var duration = bitcast<f32>(sourceState[sourceBase + 3u]);
  var nextAncestor = ancestor;
  if (ancestor != INVALID_INDEX) {
    let ancestorBase = SOURCE_OFFSET + ancestor * ${STATE_RECORD_WORD_LENGTH}u;
    nextAncestor = sourceState[ancestorBase];
    root = sourceState[ancestorBase + 1u];
    let ancestorHops = sourceState[ancestorBase + 2u];
    var nextHops = hops + ancestorHops + 1u;
    if (nextHops < hops) {
      nextHops = 0xffffffffu;
      atomicOr(&summary[SUMMARY_OFFSET + 3u], ${GPU_TRACE_CRITICAL_PATH_NUMERIC_OVERFLOW}u);
    }
    hops = nextHops;
    var nextDuration = duration + bitcast<f32>(sourceState[ancestorBase + 3u]);
    if (!(nextDuration <= 3.402823e38)) {
      nextDuration = 3.402823e38;
      atomicOr(&summary[SUMMARY_OFFSET + 3u], ${GPU_TRACE_CRITICAL_PATH_NUMERIC_OVERFLOW}u);
    }
    duration = nextDuration;
  }
  destinationState[destinationBase] = nextAncestor;
  destinationState[destinationBase + 1u] = root;
  destinationState[destinationBase + 2u] = hops;
  destinationState[destinationBase + 3u] = bitcast<u32>(duration);
}`;
  addCriticalPathPass(graph, {
    id: `${id}-jump-${passIndex}-${firstSpanIndex}`,
    source,
    bindings: {sourceState, destinationState, summary: props.output.summary},
    resources: [
      {buffer: sourceState, usage: 'storage-read'},
      {buffer: destinationState, usage: 'storage-write'},
      {buffer: props.output.summary, usage: 'storage-read-write'}
    ],
    dispatch,
    invocationCount: rowCount
  });
}

function addFinalizePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  analysis: GPUTraceCriticalPath,
  state: GraphDataView<'uint32'>,
  firstSpanIndex: number,
  rowCount: number
): void {
  const {props, stats, id} = analysis;
  const {output, parentIndices} = props;
  const dispatch = getCriticalPathDispatch(graph, `${id}-finalize-${firstSpanIndex}`, rowCount);
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${stats.spanCount}u;
const ROW_COUNT: u32 = ${rowCount}u;
const FIRST_SPAN_INDEX: u32 = ${firstSpanIndex}u;
const INVALID_INDEX: u32 = ${INVALID_INDEX}u;
const STATE_OFFSET: u32 = ${getViewElementOffset(state)}u;
const PARENT_OFFSET: u32 = ${getViewElementOffset(parentIndices)}u;
const PATH_OFFSET: u32 = ${getViewElementOffset(output.pathDurations)}u;
const PREDECESSOR_OFFSET: u32 = ${getViewElementOffset(output.criticalPredecessors)}u;
const ROOT_OFFSET: u32 = ${getViewElementOffset(output.rootIndices)}u;
const HOP_OFFSET: u32 = ${getViewElementOffset(output.hopCounts)}u;
const SUMMARY_OFFSET: u32 = ${getViewElementOffset(output.summary)}u;
@group(0) @binding(0) var<storage, read> state: array<u32>;
@group(0) @binding(1) var<storage, read> parentIndices: array<u32>;
@group(0) @binding(2) var<storage, read_write> pathDurations: array<f32>;
@group(0) @binding(3) var<storage, read_write> criticalPredecessors: array<u32>;
@group(0) @binding(4) var<storage, read_write> rootIndices: array<u32>;
@group(0) @binding(5) var<storage, read_write> hopCounts: array<u32>;
@group(0) @binding(6) var<storage, read_write> summary: array<atomic<u32>>;
@compute @workgroup_size(${CRITICAL_PATH_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, CRITICAL_PATH_WORKGROUP_SIZE)}
  if (index >= ROW_COUNT) { return; }
  let spanIndex = FIRST_SPAN_INDEX + index;
  let stateBase = STATE_OFFSET + spanIndex * ${STATE_RECORD_WORD_LENGTH}u;
  let invalid = state[stateBase + 1u] == INVALID_INDEX;
  let cyclic = state[stateBase] != INVALID_INDEX && !invalid;
  let excluded = invalid || cyclic;
  let duration = select(bitcast<f32>(state[stateBase + 3u]), 0.0, excluded);
  let root = select(state[stateBase + 1u], INVALID_INDEX, excluded);
  let hops = select(state[stateBase + 2u], 0u, excluded);
  let parent = parentIndices[PARENT_OFFSET + spanIndex];
  let predecessor = select(parent, INVALID_INDEX, excluded || parent >= SPAN_COUNT);
  pathDurations[PATH_OFFSET + spanIndex] = duration;
  criticalPredecessors[PREDECESSOR_OFFSET + spanIndex] = predecessor;
  rootIndices[ROOT_OFFSET + spanIndex] = root;
  hopCounts[HOP_OFFSET + spanIndex] = hops;
  if (cyclic) {
    atomicOr(&summary[SUMMARY_OFFSET + 3u], ${GPU_TRACE_CRITICAL_PATH_CYCLE}u);
  } else if (!invalid) {
    atomicMax(&summary[SUMMARY_OFFSET], bitcast<u32>(duration));
    atomicMax(&summary[SUMMARY_OFFSET + 2u], hops);
  }
}`;
  addCriticalPathPass(graph, {
    id: `${id}-finalize-${firstSpanIndex}`,
    source,
    bindings: {
      state,
      parentIndices,
      pathDurations: output.pathDurations,
      criticalPredecessors: output.criticalPredecessors,
      rootIndices: output.rootIndices,
      hopCounts: output.hopCounts,
      summary: output.summary
    },
    resources: [
      {buffer: state, usage: 'storage-read'},
      {buffer: parentIndices, usage: 'storage-read'},
      {buffer: output.pathDurations, usage: 'storage-write'},
      {buffer: output.criticalPredecessors, usage: 'storage-write'},
      {buffer: output.rootIndices, usage: 'storage-write'},
      {buffer: output.hopCounts, usage: 'storage-write'},
      {buffer: output.summary, usage: 'storage-read-write'}
    ],
    dispatch,
    invocationCount: rowCount
  });
}

function addEndpointPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  analysis: GPUTraceCriticalPath,
  firstSpanIndex: number,
  rowCount: number
): void {
  const {props, stats, id} = analysis;
  const {output} = props;
  const dispatch = getCriticalPathDispatch(
    graph,
    `${id}-select-endpoint-${firstSpanIndex}`,
    rowCount
  );
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${stats.spanCount}u;
const ROW_COUNT: u32 = ${rowCount}u;
const FIRST_SPAN_INDEX: u32 = ${firstSpanIndex}u;
const INVALID_INDEX: u32 = ${INVALID_INDEX}u;
const PATH_OFFSET: u32 = ${getViewElementOffset(output.pathDurations)}u;
const ROOT_OFFSET: u32 = ${getViewElementOffset(output.rootIndices)}u;
const SUMMARY_OFFSET: u32 = ${getViewElementOffset(output.summary)}u;
@group(0) @binding(0) var<storage, read> pathDurations: array<f32>;
@group(0) @binding(1) var<storage, read> rootIndices: array<u32>;
@group(0) @binding(2) var<storage, read_write> summary: array<atomic<u32>>;
@compute @workgroup_size(${CRITICAL_PATH_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, CRITICAL_PATH_WORKGROUP_SIZE)}
  if (
    index < ROW_COUNT &&
    rootIndices[ROOT_OFFSET + FIRST_SPAN_INDEX + index] != INVALID_INDEX &&
    bitcast<u32>(pathDurations[PATH_OFFSET + FIRST_SPAN_INDEX + index]) == atomicLoad(&summary[SUMMARY_OFFSET])
  ) {
    atomicMin(&summary[SUMMARY_OFFSET + 1u], FIRST_SPAN_INDEX + index);
  }
}`;
  addCriticalPathPass(graph, {
    id: `${id}-select-endpoint-${firstSpanIndex}`,
    source,
    bindings: {
      pathDurations: output.pathDurations,
      rootIndices: output.rootIndices,
      summary: output.summary
    },
    resources: [
      {buffer: output.pathDurations, usage: 'storage-read'},
      {buffer: output.rootIndices, usage: 'storage-read'},
      {buffer: output.summary, usage: 'storage-read-write'}
    ],
    dispatch,
    invocationCount: rowCount
  });
}

function addCriticalMaskPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  analysis: GPUTraceCriticalPath
): void {
  const {props, stats, id} = analysis;
  const {parentIndices, output} = props;
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${stats.spanCount}u;
const INVALID_INDEX: u32 = ${INVALID_INDEX}u;
const MAXIMUM_PATH_LENGTH: u32 = ${stats.maximumCriticalPathLength}u;
const PARENT_OFFSET: u32 = ${getViewElementOffset(parentIndices)}u;
const MASK_OFFSET: u32 = ${getViewElementOffset(output.criticalMask)}u;
const SUMMARY_OFFSET: u32 = ${getViewElementOffset(output.summary)}u;
@group(0) @binding(0) var<storage, read> parentIndices: array<u32>;
@group(0) @binding(1) var<storage, read_write> criticalMask: array<u32>;
@group(0) @binding(2) var<storage, read_write> summary: array<atomic<u32>>;
@compute @workgroup_size(1)
fn main() {
  var spanIndex = atomicLoad(&summary[SUMMARY_OFFSET + 1u]);
  for (var pathOffset = 0u; pathOffset < MAXIMUM_PATH_LENGTH; pathOffset++) {
    if (spanIndex == INVALID_INDEX || spanIndex >= SPAN_COUNT) { return; }
    criticalMask[MASK_OFFSET + spanIndex] = 1u;
    spanIndex = parentIndices[PARENT_OFFSET + spanIndex];
  }
  if (spanIndex != INVALID_INDEX) {
    atomicOr(&summary[SUMMARY_OFFSET + 3u], ${GPU_TRACE_CRITICAL_PATH_LIMIT_EXCEEDED}u);
  }
}`;
  addCriticalPathPass(graph, {
    id: `${id}-mark-path`,
    source,
    bindings: {parentIndices, criticalMask: output.criticalMask, summary: output.summary},
    resources: [
      {buffer: parentIndices, usage: 'storage-read'},
      {buffer: output.criticalMask, usage: 'storage-read-write'},
      {buffer: output.summary, usage: 'storage-read-write'}
    ],
    dispatch: {x: 1, y: 1, z: 1},
    invocationCount: stats.maximumCriticalPathLength
  });
}

function addSlackPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  analysis: GPUTraceCriticalPath,
  firstSpanIndex: number,
  rowCount: number
): void {
  const {props, stats, id} = analysis;
  const {output} = props;
  const dispatch = getCriticalPathDispatch(graph, `${id}-slack-${firstSpanIndex}`, rowCount);
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${stats.spanCount}u;
const ROW_COUNT: u32 = ${rowCount}u;
const FIRST_SPAN_INDEX: u32 = ${firstSpanIndex}u;
const INVALID_INDEX: u32 = ${INVALID_INDEX}u;
const PATH_OFFSET: u32 = ${getViewElementOffset(output.pathDurations)}u;
const SLACK_OFFSET: u32 = ${getViewElementOffset(output.slackDurations)}u;
const ROOT_OFFSET: u32 = ${getViewElementOffset(output.rootIndices)}u;
const SUMMARY_OFFSET: u32 = ${getViewElementOffset(output.summary)}u;
@group(0) @binding(0) var<storage, read> pathDurations: array<f32>;
@group(0) @binding(1) var<storage, read_write> slackDurations: array<f32>;
@group(0) @binding(2) var<storage, read> rootIndices: array<u32>;
@group(0) @binding(3) var<storage, read> summary: array<u32>;
@compute @workgroup_size(${CRITICAL_PATH_WORKGROUP_SIZE})
fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, CRITICAL_PATH_WORKGROUP_SIZE)}
  if (index >= ROW_COUNT) { return; }
  let spanIndex = FIRST_SPAN_INDEX + index;
  let valid = rootIndices[ROOT_OFFSET + spanIndex] != INVALID_INDEX;
  let maximumDuration = bitcast<f32>(summary[SUMMARY_OFFSET]);
  slackDurations[SLACK_OFFSET + spanIndex] = select(
    0.0,
    max(maximumDuration - pathDurations[PATH_OFFSET + spanIndex], 0.0),
    valid
  );
}`;
  addCriticalPathPass(graph, {
    id: `${id}-slack-${firstSpanIndex}`,
    source,
    bindings: {
      pathDurations: output.pathDurations,
      slackDurations: output.slackDurations,
      rootIndices: output.rootIndices,
      summary: output.summary
    },
    resources: [
      {buffer: output.pathDurations, usage: 'storage-read'},
      {buffer: output.slackDurations, usage: 'storage-write'},
      {buffer: output.rootIndices, usage: 'storage-read'},
      {buffer: output.summary, usage: 'storage-read'}
    ],
    dispatch,
    invocationCount: rowCount
  });
}

function getCriticalPathDispatch<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  count: number
): {x: number; y: number; z: number} {
  return getBoundedDispatchLayout(
    id,
    count,
    CRITICAL_PATH_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
}

function addCriticalPathPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    bindings: Record<string, GraphDataView>;
    resources: GraphBufferUse[];
    dispatch: {x: number; y: number; z: number};
    invocationCount: number;
  }
): void {
  graph.addComputePass({
    id: props.id,
    workload: {
      operation: 'GPUTraceCriticalPath',
      commandCount: 1,
      maximumWorkgroupCount: props.dispatch.x * props.dispatch.y * props.dispatch.z,
      maximumInvocationCount: props.invocationCount,
      readByteLength: props.resources.reduce(
        (sum, resource) =>
          sum +
          (resource.usage === 'storage-read' || resource.usage === 'storage-read-write'
            ? getGraphBufferByteLength(resource.buffer)
            : 0),
        0
      ),
      writeByteLength: props.resources.reduce(
        (sum, resource) =>
          sum +
          (resource.usage === 'storage-write' || resource.usage === 'storage-read-write'
            ? getGraphBufferByteLength(resource.buffer)
            : 0),
        0
      )
    },
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

function getGraphBufferByteLength(buffer: GraphBufferUse['buffer']): number {
  return 'byteLength' in buffer ? buffer.byteLength : buffer.buffer.byteLength;
}

function validateCriticalPath(
  id: string,
  props: GPUTraceCriticalPathProps
): GPUTraceCriticalPathStats {
  validatePackedUint32View(props.parentIndices, `${id} parentIndices`);
  for (const [chunkIndex, view] of getDurationViews(props.durations).entries()) {
    validateTraceDurationView(view, `${id} durations chunk ${chunkIndex}`);
  }
  const {output} = props;
  validatePackedView(output.pathDurations, ['float32'], `${id} pathDurations`);
  validatePackedView(output.slackDurations, ['float32'], `${id} slackDurations`);
  validatePackedUint32View(output.criticalPredecessors, `${id} criticalPredecessors`);
  validatePackedUint32View(output.rootIndices, `${id} rootIndices`);
  validatePackedUint32View(output.hopCounts, `${id} hopCounts`);
  validatePackedUint32View(output.criticalMask, `${id} criticalMask`);
  validatePackedUint32View(output.summary, `${id} summary`);
  const spanCount = props.parentIndices.length;
  const alignedOutputs = [
    props.durations,
    output.pathDurations,
    output.slackDurations,
    output.criticalPredecessors,
    output.rootIndices,
    output.hopCounts,
    output.criticalMask
  ];
  if (alignedOutputs.some(view => view.length !== spanCount)) {
    throw new Error(`${id} span columns and outputs must have identical lengths`);
  }
  if (output.summary.length !== 4) {
    throw new Error(`${id} summary must contain exactly four uint32 words`);
  }
  const maximumCriticalPathLength =
    props.maximumCriticalPathLength ?? Math.min(Math.max(spanCount, 1), 1_048_576);
  if (
    !Number.isSafeInteger(maximumCriticalPathLength) ||
    maximumCriticalPathLength < 1 ||
    maximumCriticalPathLength > 0xffffffff
  ) {
    throw new Error(`${id} maximumCriticalPathLength must be a positive uint32 integer`);
  }
  getMaximumRowsPerPass(props, id);
  const views = getCriticalPathViews(props);
  for (let firstIndex = 0; firstIndex < views.length; firstIndex++) {
    for (let secondIndex = firstIndex + 1; secondIndex < views.length; secondIndex++) {
      if (doGraphDataViewsOverlap(views[firstIndex], views[secondIndex])) {
        throw new Error(`${id} inputs and outputs must not overlap`);
      }
    }
  }
  return {
    spanCount,
    pointerJumpPassCount: spanCount > 0 ? Math.ceil(Math.log2(spanCount)) + 1 : 0,
    maximumCriticalPathLength
  };
}

function getMaximumRowsPerPass(
  props: GPUTraceCriticalPathProps,
  id: string = props.id ?? 'gpu-trace-critical-path'
): number {
  const maximumRowsPerPass = props.maximumRowsPerPass ?? DEFAULT_MAXIMUM_ROWS_PER_PASS;
  if (!Number.isSafeInteger(maximumRowsPerPass) || maximumRowsPerPass < 1) {
    throw new Error(`${id} maximumRowsPerPass must be a positive safe integer`);
  }
  return maximumRowsPerPass;
}

function getCriticalPathViews(props: GPUTraceCriticalPathProps): GraphDataView[] {
  return [
    props.parentIndices,
    ...getDurationViews(props.durations),
    props.output.pathDurations,
    props.output.slackDurations,
    props.output.criticalPredecessors,
    props.output.rootIndices,
    props.output.hopCounts,
    props.output.criticalMask,
    props.output.summary
  ];
}

function getDurationViews(
  durations: GraphDataView<'float32'> | GraphVectorView<'float32'>
): readonly GraphDataView<'float32'>[] {
  return durations instanceof GraphVectorView ? durations.data : [durations];
}

function validateTraceDurationView(view: GraphDataView, name: string): void {
  if (
    view.format !== 'float32' ||
    view.rowByteLength !== Float32Array.BYTES_PER_ELEMENT ||
    view.byteStride < Float32Array.BYTES_PER_ELEMENT ||
    view.byteStride % Uint32Array.BYTES_PER_ELEMENT !== 0 ||
    view.byteOffset % Uint32Array.BYTES_PER_ELEMENT !== 0
  ) {
    throw new Error(`${name} must be uint32-aligned scalar float32 GPU data`);
  }
}
