// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {GPUTraceAnalyticsOutputLayout} from '@luma.gl/experimental/gpu-trace';
import {
  TRACE_ERROR_SPAN_FLAG,
  TRACE_FILTER_ERRORS_ONLY,
  TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN,
  TRACE_FILTER_HIDE_RUNTIME_SPANS,
  TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS,
  TRACE_GROUPS,
  TRACE_LABEL_DICTIONARY,
  TRACE_LANE_COUNT,
  TRACE_OVERLAPPING_CHILD_FLAG,
  TRACE_PROCESS_COUNT,
  TRACE_RUNTIME_SPAN_FLAG,
  TRACE_SIMILAR_DURATION_PARENT_FLAG,
  TRACE_STATUS_COUNT,
  TRACE_THREAD_COUNT
} from './trace-data';

const TRACE_WORKGROUP_SIZE = 256;

export const TRACE_DURATION_HISTOGRAM_EDGES = [
  0, 0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512
] as const;
export const TRACE_DURATION_HISTOGRAM_BIN_COUNT = TRACE_DURATION_HISTOGRAM_EDGES.length - 1;
export const TRACE_TIME_BUCKET_COUNT = 32;

export const TRACE_ANALYTICS_OUTPUT = new GPUTraceAnalyticsOutputLayout([
  {id: 'group-counts', format: 'uint32', length: TRACE_GROUPS.length},
  {id: 'group-duration-sums', format: 'float32', length: TRACE_GROUPS.length},
  {id: 'group-duration-means', format: 'float32', length: TRACE_GROUPS.length},
  {id: 'operation-counts', format: 'uint32', length: TRACE_LABEL_DICTIONARY.length},
  {id: 'status-counts', format: 'uint32', length: TRACE_STATUS_COUNT},
  {id: 'process-counts', format: 'uint32', length: TRACE_PROCESS_COUNT},
  {id: 'thread-counts', format: 'uint32', length: TRACE_THREAD_COUNT},
  {id: 'duration-histogram', format: 'uint32', length: TRACE_DURATION_HISTOGRAM_BIN_COUNT},
  {id: 'time-bucket-counts', format: 'uint32', length: TRACE_TIME_BUCKET_COUNT},
  {id: 'time-bucket-durations', format: 'float32', length: TRACE_TIME_BUCKET_COUNT},
  {id: 'time-bucket-concurrency', format: 'float32', length: TRACE_TIME_BUCKET_COUNT},
  {id: 'time-bucket-utilization', format: 'float32', length: TRACE_TIME_BUCKET_COUNT},
  {id: 'time-bucket-idle-lane-time', format: 'float32', length: TRACE_TIME_BUCKET_COUNT}
]);

export type TraceAnalyticsChunk = {
  firstSpanIndex: number;
  firstBatchIndex: number;
  batchCount: number;
};

export function getViewportAggregationClearShader(): string {
  return /* wgsl */ `
const RESULT_WORD_COUNT: u32 = ${TRACE_ANALYTICS_OUTPUT.wordLength}u;
@group(0) @binding(0) var<storage, read_write> results: array<atomic<u32>>;
@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x < RESULT_WORD_COUNT) {
    atomicStore(&results[globalId.x], 0u);
  }
}`;
}

/** Candidate-driven fused analytics for one physical span chunk. */
export function getViewportAggregationShader(chunk: TraceAnalyticsChunk): string {
  const getOffset = (id: string): number => TRACE_ANALYTICS_OUTPUT.getSeries(id).wordOffset;
  const histogramEdges = TRACE_DURATION_HISTOGRAM_EDGES.map(value =>
    Number.isInteger(value) ? `${value}.0` : String(value)
  ).join(', ');
  return /* wgsl */ `
struct Span {
  start: f32,
  duration: f32,
  lane: u32,
  group: u32,
  process: u32,
  thread: u32,
  objectId: u32,
  classification: u32,
}
struct TraceSpanBatch {
  firstSpanIndex: u32,
  spanCount: u32,
  timeMin: f32,
  timeMax: f32,
  laneMin: u32,
  laneMax: u32,
  groupIndex: u32,
  batchIndex: u32,
  maximumDuration: f32,
}
const CHUNK_FIRST_SPAN_INDEX: u32 = ${chunk.firstSpanIndex}u;
const CHUNK_FIRST_BATCH_INDEX: u32 = ${chunk.firstBatchIndex}u;
const CHUNK_BATCH_COUNT: u32 = ${chunk.batchCount}u;
const GROUP_COUNT: u32 = ${TRACE_GROUPS.length}u;
const STATUS_COUNT: u32 = ${TRACE_STATUS_COUNT}u;
const OPERATION_COUNT: u32 = ${TRACE_LABEL_DICTIONARY.length}u;
const PROCESS_COUNT: u32 = ${TRACE_PROCESS_COUNT}u;
const THREAD_COUNT: u32 = ${TRACE_THREAD_COUNT}u;
const HISTOGRAM_BIN_COUNT: u32 = ${TRACE_DURATION_HISTOGRAM_BIN_COUNT}u;
const TIME_BUCKET_COUNT: u32 = ${TRACE_TIME_BUCKET_COUNT}u;
const GROUP_COUNTS_OFFSET: u32 = ${getOffset('group-counts')}u;
const GROUP_DURATION_SUMS_OFFSET: u32 = ${getOffset('group-duration-sums')}u;
const OPERATION_COUNTS_OFFSET: u32 = ${getOffset('operation-counts')}u;
const STATUS_COUNTS_OFFSET: u32 = ${getOffset('status-counts')}u;
const PROCESS_COUNTS_OFFSET: u32 = ${getOffset('process-counts')}u;
const THREAD_COUNTS_OFFSET: u32 = ${getOffset('thread-counts')}u;
const HISTOGRAM_OFFSET: u32 = ${getOffset('duration-histogram')}u;
const TIME_BUCKET_COUNTS_OFFSET: u32 = ${getOffset('time-bucket-counts')}u;
const TIME_BUCKET_DURATIONS_OFFSET: u32 = ${getOffset('time-bucket-durations')}u;
const HISTOGRAM_EDGES = array<f32, ${TRACE_DURATION_HISTOGRAM_EDGES.length}>(${histogramEdges});
@group(0) @binding(0) var<storage, read> spans: array<Span>;
@group(0) @binding(1) var<storage, read> spanBatches: array<TraceSpanBatch>;
@group(0) @binding(2) var<storage, read> candidateBatchIds: array<u32>;
@group(0) @binding(3) var<storage, read> aggregationControls: array<u32>;
@group(0) @binding(4) var<storage, read_write> results: array<atomic<u32>>;

fn atomicAddFloat(destination: ptr<storage, atomic<u32>, read_write>, value: f32) {
  var oldBits = atomicLoad(destination);
  loop {
    let newBits = bitcast<u32>(bitcast<f32>(oldBits) + value);
    let exchanged = atomicCompareExchangeWeak(destination, oldBits, newBits);
    if (exchanged.exchanged) { break; }
    oldBits = exchanged.old_value;
  }
}

@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let batchIndex = candidateBatchIds[workgroupId.y];
  if (
    batchIndex < CHUNK_FIRST_BATCH_INDEX ||
    batchIndex >= CHUNK_FIRST_BATCH_INDEX + CHUNK_BATCH_COUNT
  ) { return; }
  let batch = spanBatches[batchIndex];
  let batchRowIndex = globalId.x;
  if (batchRowIndex >= batch.spanCount) { return; }
  let sourceIndex = batch.firstSpanIndex + batchRowIndex;
  let span = spans[sourceIndex - CHUNK_FIRST_SPAN_INDEX];
  let windowMinimum = bitcast<f32>(aggregationControls[0]);
  let windowMaximum = bitcast<f32>(aggregationControls[1]);
  let enabledGroups = aggregationControls[2];
  let enabledStatuses = aggregationControls[3];
  let activeFilters = aggregationControls[4];
  let minimumDuration = bitcast<f32>(aggregationControls[5]);
  let status = span.classification & ${TRACE_STATUS_COUNT - 1}u;
  let groupVisible = (enabledGroups & (1u << span.group)) != 0u;
  let statusVisible = (enabledStatuses & (1u << status)) != 0u;
  let runtimeVisible =
    (activeFilters & ${TRACE_FILTER_HIDE_RUNTIME_SPANS}u) == 0u ||
    (span.classification & ${TRACE_RUNTIME_SPAN_FLAG}u) == 0u;
  let errorVisible =
    (activeFilters & ${TRACE_FILTER_ERRORS_ONLY}u) == 0u ||
    (span.classification & ${TRACE_ERROR_SPAN_FLAG}u) != 0u;
  let overlappingChildVisible =
    (activeFilters & ${TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN}u) == 0u ||
    (span.classification & ${TRACE_OVERLAPPING_CHILD_FLAG}u) == 0u;
  let similarParentVisible =
    (activeFilters & ${TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS}u) == 0u ||
    (span.classification & ${TRACE_SIMILAR_DURATION_PARENT_FLAG}u) == 0u;
  let finiteInterval = span.start == span.start && span.duration == span.duration &&
    span.duration >= 0.0 && abs(span.start) <= 3.402823466e+38 &&
    abs(span.duration) <= 3.402823466e+38;
  let spanEnd = span.start + span.duration;
  if (
    !finiteInterval || span.start >= windowMaximum || spanEnd <= windowMinimum ||
    span.duration < minimumDuration || !groupVisible || !statusVisible || !runtimeVisible ||
    !errorVisible || !overlappingChildVisible || !similarParentVisible
  ) { return; }

  atomicAdd(&results[GROUP_COUNTS_OFFSET + span.group], 1u);
  atomicAddFloat(&results[GROUP_DURATION_SUMS_OFFSET + span.group], span.duration);
  let operation = min(span.group * STATUS_COUNT + status, OPERATION_COUNT - 1u);
  atomicAdd(&results[OPERATION_COUNTS_OFFSET + operation], 1u);
  atomicAdd(&results[STATUS_COUNTS_OFFSET + status], 1u);
  if (span.process < PROCESS_COUNT) {
    atomicAdd(&results[PROCESS_COUNTS_OFFSET + span.process], 1u);
  }
  if (span.thread < THREAD_COUNT) {
    atomicAdd(&results[THREAD_COUNTS_OFFSET + span.thread], 1u);
  }

  if (
    span.duration >= HISTOGRAM_EDGES[0] &&
    span.duration <= HISTOGRAM_EDGES[HISTOGRAM_BIN_COUNT]
  ) {
    var lower = 0u;
    var upper = HISTOGRAM_BIN_COUNT;
    loop {
      if (lower >= upper) { break; }
      let middle = lower + (upper - lower) / 2u;
      if (span.duration < HISTOGRAM_EDGES[middle + 1u]) {
        upper = middle;
      } else {
        lower = middle + 1u;
      }
    }
    atomicAdd(&results[HISTOGRAM_OFFSET + min(lower, HISTOGRAM_BIN_COUNT - 1u)], 1u);
  }

  let bucketDuration = (windowMaximum - windowMinimum) / f32(TIME_BUCKET_COUNT);
  if (bucketDuration > 0.0) {
    let firstBucket = min(
      u32(max(floor((span.start - windowMinimum) / bucketDuration), 0.0)),
      TIME_BUCKET_COUNT - 1u
    );
    let lastTime = max(span.start, spanEnd - max(abs(spanEnd), 1.0) * 1e-7);
    let lastBucket = min(
      u32(max(floor((lastTime - windowMinimum) / bucketDuration), 0.0)),
      TIME_BUCKET_COUNT - 1u
    );
    for (var bucketIndex = firstBucket; bucketIndex <= lastBucket; bucketIndex++) {
      let bucketStart = windowMinimum + f32(bucketIndex) * bucketDuration;
      let bucketEnd = bucketStart + bucketDuration;
      let overlap = max(0.0, min(spanEnd, bucketEnd) - max(span.start, bucketStart));
      if (overlap > 0.0) {
        atomicAdd(&results[TIME_BUCKET_COUNTS_OFFSET + bucketIndex], 1u);
        atomicAddFloat(&results[TIME_BUCKET_DURATIONS_OFFSET + bucketIndex], overlap);
      }
    }
  }
}`;
}

export function getViewportAggregationFinalizeShader(): string {
  const getOffset = (id: string): number => TRACE_ANALYTICS_OUTPUT.getSeries(id).wordOffset;
  return /* wgsl */ `
const GROUP_COUNT: u32 = ${TRACE_GROUPS.length}u;
const TIME_BUCKET_COUNT: u32 = ${TRACE_TIME_BUCKET_COUNT}u;
const LANE_COUNT: f32 = ${TRACE_LANE_COUNT}.0;
const GROUP_COUNTS_OFFSET: u32 = ${getOffset('group-counts')}u;
const GROUP_DURATION_SUMS_OFFSET: u32 = ${getOffset('group-duration-sums')}u;
const GROUP_DURATION_MEANS_OFFSET: u32 = ${getOffset('group-duration-means')}u;
const TIME_BUCKET_DURATIONS_OFFSET: u32 = ${getOffset('time-bucket-durations')}u;
const TIME_BUCKET_CONCURRENCY_OFFSET: u32 = ${getOffset('time-bucket-concurrency')}u;
const TIME_BUCKET_UTILIZATION_OFFSET: u32 = ${getOffset('time-bucket-utilization')}u;
const TIME_BUCKET_IDLE_OFFSET: u32 = ${getOffset('time-bucket-idle-lane-time')}u;
@group(0) @binding(0) var<storage, read> aggregationControls: array<u32>;
@group(0) @binding(1) var<storage, read_write> results: array<atomic<u32>>;
@compute @workgroup_size(${TRACE_WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index < GROUP_COUNT) {
    let count = atomicLoad(&results[GROUP_COUNTS_OFFSET + index]);
    let sum = bitcast<f32>(atomicLoad(&results[GROUP_DURATION_SUMS_OFFSET + index]));
    let mean = select(0.0, sum / f32(count), count > 0u);
    atomicStore(&results[GROUP_DURATION_MEANS_OFFSET + index], bitcast<u32>(mean));
  }
  if (index < TIME_BUCKET_COUNT) {
    let windowMinimum = bitcast<f32>(aggregationControls[0]);
    let windowMaximum = bitcast<f32>(aggregationControls[1]);
    let bucketDuration = max((windowMaximum - windowMinimum) / f32(TIME_BUCKET_COUNT), 0.0);
    let activeLaneTime = bitcast<f32>(
      atomicLoad(&results[TIME_BUCKET_DURATIONS_OFFSET + index])
    );
    let capacity = bucketDuration * LANE_COUNT;
    let concurrency = select(0.0, activeLaneTime / bucketDuration, bucketDuration > 0.0);
    let utilization = select(
      0.0,
      clamp(activeLaneTime / capacity, 0.0, 1.0),
      capacity > 0.0
    );
    let idle = max(capacity - activeLaneTime, 0.0);
    atomicStore(&results[TIME_BUCKET_CONCURRENCY_OFFSET + index], bitcast<u32>(concurrency));
    atomicStore(&results[TIME_BUCKET_UTILIZATION_OFFSET + index], bitcast<u32>(utilization));
    atomicStore(&results[TIME_BUCKET_IDLE_OFFSET + index], bitcast<u32>(idle));
  }
}`;
}

export function getAggregationWindowSelectionShader(firstRow: number, rowCount: number): string {
  return /* wgsl */ `
struct Span {
  start: f32,
  duration: f32,
  lane: u32,
  group: u32,
  process: u32,
  thread: u32,
  objectId: u32,
  classification: u32,
}
@group(0) @binding(0) var<storage, read> spans: array<Span>;
@group(0) @binding(1) var<storage, read> aggregationControls: array<u32>;
@group(0) @binding(2) var<storage, read_write> selectionMask: array<u32>;
@group(0) @binding(3) var<storage, read_write> statusIds: array<u32>;
@group(0) @binding(4) var<storage, read_write> operationIds: array<u32>;
@compute @workgroup_size(${TRACE_WORKGROUP_SIZE}) fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= ${rowCount}u) { return; }
  let index = ${firstRow}u + globalId.x;
  let span = spans[index];
  let status = span.classification & ${TRACE_STATUS_COUNT - 1}u;
  statusIds[index] = status;
  operationIds[index] = min(
    span.group * ${TRACE_STATUS_COUNT}u + status,
    ${TRACE_LABEL_DICTIONARY.length - 1}u
  );
  let windowMinimum = bitcast<f32>(aggregationControls[0]);
  let windowMaximum = bitcast<f32>(aggregationControls[1]);
  let enabledGroups = aggregationControls[2];
  let enabledStatuses = aggregationControls[3];
  let activeFilters = aggregationControls[4];
  let minimumDuration = bitcast<f32>(aggregationControls[5]);
  let groupVisible = (enabledGroups & (1u << span.group)) != 0u;
  let statusVisible = (enabledStatuses & (1u << status)) != 0u;
  let runtimeVisible =
    (activeFilters & ${TRACE_FILTER_HIDE_RUNTIME_SPANS}u) == 0u ||
    (span.classification & ${TRACE_RUNTIME_SPAN_FLAG}u) == 0u;
  let errorVisible =
    (activeFilters & ${TRACE_FILTER_ERRORS_ONLY}u) == 0u ||
    (span.classification & ${TRACE_ERROR_SPAN_FLAG}u) != 0u;
  let overlappingChildVisible =
    (activeFilters & ${TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN}u) == 0u ||
    (span.classification & ${TRACE_OVERLAPPING_CHILD_FLAG}u) == 0u;
  let similarParentVisible =
    (activeFilters & ${TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS}u) == 0u ||
    (span.classification & ${TRACE_SIMILAR_DURATION_PARENT_FLAG}u) == 0u;
  selectionMask[index] = select(
    0u,
    1u,
    span.start < windowMaximum && span.start + span.duration > windowMinimum &&
      span.duration >= minimumDuration && groupVisible && statusVisible && runtimeVisible &&
      errorVisible && overlappingChildVisible && similarParentVisible
  );
}`;
}

export function getAnomalyErrorMaskShader(spanCount: number, errorStatusIndex: number): string {
  return /* wgsl */ `
struct Span {
  start: f32,
  duration: f32,
  lane: u32,
  group: u32,
  process: u32,
  thread: u32,
  objectId: u32,
  classification: u32,
}
@group(0) @binding(0) var<storage, read> spans: array<Span>;
@group(0) @binding(1) var<storage, read_write> errorMask: array<u32>;
@compute @workgroup_size(${TRACE_WORKGROUP_SIZE}) fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let index = globalId.x;
  if (index >= ${spanCount}u) { return; }
  errorMask[index] = select(
    0u,
    1u,
    (spans[index].classification & ${TRACE_STATUS_COUNT - 1}u) == ${errorStatusIndex}u
  );
}`;
}
