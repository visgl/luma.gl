// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type GPUCommandGraphContributor,
  type GraphBufferUse,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  type GPUBoundedDispatchLayout
} from '@luma.gl/gpgpu/gpu-core';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from '@luma.gl/gpgpu/gpu-core';
import {GPUScan} from '@luma.gl/gpgpu/gpu-core';
import {GPUSort} from '@luma.gl/gpgpu/gpu-core';

const LANE_INDEX_WORKGROUP_SIZE = 256;
const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

/** `validationErrors` bit indicating a non-finite span start time. */
export const GPU_TRACE_LANE_INDEX_INVALID_START_TIME = 1;
/** `validationErrors` bit indicating a lane outside `[0, laneCount)`. */
export const GPU_TRACE_LANE_INDEX_INVALID_LANE = 2;
/** `validationErrors` bit indicating a negative or non-finite duration. */
export const GPU_TRACE_LANE_INDEX_INVALID_DURATION = 4;
/** `validationErrors` bit indicating overlapping spans within one lane/depth domain. */
export const GPU_TRACE_LANE_INDEX_OVERLAPPING_SPANS = 8;

/** Canonical source columns consumed by {@link GPUTraceLaneIndexBuilder}. */
export type GPUTraceLaneIndexSource = {
  /** Span start times in canonical source order. */
  startTimes: GraphDataView<'float32'>;
  /** Span durations in canonical source order. */
  durations: GraphDataView<'float32'>;
  /** Dense lane/depth identifier for each canonical span. */
  laneIds: GraphDataView<'uint32'>;
};

/** Persistent lane-major columns produced by {@link GPUTraceLaneIndexBuilder}. */
export type GPUTraceLaneIndexOutput = {
  /** Optional gathered start times sorted by lane, then start time, then source row. */
  startTimes?: GraphDataView<'float32'>;
  /** Optional gathered durations in the same secondary-index order. */
  durations?: GraphDataView<'float32'>;
  /** Source row for every secondary-index row. This is also a compact `rowOrder` index. */
  spanIds: GraphDataView<'uint32'>;
  /** Lane offsets with one trailing sentinel, analogous to CSR offsets. */
  laneOffsets: GraphDataView<'uint32'>;
  /** One persistent validation word populated by malformed source rows. */
  validationErrors: GraphDataView<'uint32'>;
};

/** Properties for GPU construction of a lane/time-ordered trace secondary index. */
export type GPUTraceLaneIndexBuilderProps = {
  id?: string;
  source: GPUTraceLaneIndexSource;
  /** Number of dense lane/depth domains represented by `laneIds`. */
  laneCount: number;
  output: GPUTraceLaneIndexOutput;
};

/** Immutable capacity and sort information for one lane-index construction. */
export type GPUTraceLaneIndexBuilderStats = {
  spanCount: number;
  laneCount: number;
  sortCount: number;
};

/**
 * Builds a canonical-ID-preserving lane/time secondary index entirely on the GPU.
 *
 * The builder first performs a stable start-time sort, then a stable lane sort. Stability makes
 * the resulting order `(lane, startTime, canonicalId)` without requiring a packed 64-bit key.
 * A lane histogram and prefix scan publish CSR-style offsets for segmented galloping search.
 *
 * This is construction work, not a per-view query. Applications should execute the containing
 * graph when source partitions change and retain the output for interactive frame graphs. Large
 * builds can use `CompiledGPUCommandGraph.createExecution()` to spread sort stages across frames.
 */
export class GPUTraceLaneIndexBuilder implements GPUCommandGraphContributor {
  readonly id: string;
  readonly source: GPUTraceLaneIndexSource;
  readonly output: GPUTraceLaneIndexOutput;
  readonly stats: Readonly<GPUTraceLaneIndexBuilderStats>;

  constructor(props: GPUTraceLaneIndexBuilderProps) {
    this.id = props.id ?? 'gpu-trace-lane-index-builder';
    this.source = props.source;
    this.output = props.output;
    this.stats = Object.freeze(validateBuilder(this.id, props));
  }

  /** Adds initialization, two stable radix sorts, gather, histogram, and offset scan passes. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [...Object.values(this.source), ...Object.values(this.output)].filter(
      view => view !== undefined
    );
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }

    const sourceTimeKeys = createTransientView(
      graph,
      `${this.id}-source-time-keys`,
      'uint32',
      this.stats.spanCount
    );
    const sourceSpanIds = createTransientView(
      graph,
      `${this.id}-source-span-ids`,
      'uint32',
      this.stats.spanCount
    );
    const timeSortedKeys = createTransientView(
      graph,
      `${this.id}-time-sorted-keys`,
      'uint32',
      this.stats.spanCount
    );
    const timeSortedSpanIds = createTransientView(
      graph,
      `${this.id}-time-sorted-span-ids`,
      'uint32',
      this.stats.spanCount
    );
    const timeOrderedLaneKeys = createTransientView(
      graph,
      `${this.id}-time-ordered-lane-keys`,
      'uint32',
      this.stats.spanCount
    );
    const sortedLaneKeys = createTransientView(
      graph,
      `${this.id}-sorted-lane-keys`,
      'uint32',
      this.stats.spanCount
    );
    const laneCounts = createTransientView(
      graph,
      `${this.id}-lane-counts`,
      'uint32',
      this.stats.laneCount
    );

    addClearPass(graph, this, laneCounts);
    if (this.stats.spanCount > 0) {
      addTimeKeyPass(graph, this, sourceTimeKeys, sourceSpanIds);
      new GPUSort({
        id: `${this.id}-start-time-sort`,
        keys: sourceTimeKeys,
        values: sourceSpanIds,
        outputKeys: timeSortedKeys,
        outputValues: timeSortedSpanIds,
        algorithm: 'radix'
      }).addToGraph(graph);
      addLaneKeyPass(graph, this, timeSortedSpanIds, timeOrderedLaneKeys);
      new GPUSort({
        id: `${this.id}-lane-sort`,
        keys: timeOrderedLaneKeys,
        values: timeSortedSpanIds,
        outputKeys: sortedLaneKeys,
        outputValues: this.output.spanIds,
        algorithm: 'radix'
      }).addToGraph(graph);
      if (this.output.startTimes && this.output.durations) {
        addGatherPass(graph, this, sortedLaneKeys, laneCounts);
      } else {
        addCompactFinalizePass(graph, this, sortedLaneKeys, laneCounts);
      }
    }
    if (this.stats.laneCount > 0) {
      new GPUScan({
        id: `${this.id}-lane-offsets`,
        input: laneCounts,
        output: this.output.laneOffsets,
        mode: 'exclusive'
      }).addToGraph(graph);
    }
    addOffsetSentinelPass(graph, this, laneCounts);
  }
}

function validateBuilder(
  id: string,
  props: GPUTraceLaneIndexBuilderProps
): GPUTraceLaneIndexBuilderStats {
  validateScalarSourceView(props.source.startTimes, 'float32', `${id} source startTimes`);
  validateScalarSourceView(props.source.durations, 'float32', `${id} source durations`);
  validateScalarSourceView(props.source.laneIds, 'uint32', `${id} source laneIds`);
  if (Boolean(props.output.startTimes) !== Boolean(props.output.durations)) {
    throw new Error(`${id} output startTimes and durations must be supplied together`);
  }
  if (props.output.startTimes) {
    validatePackedView(props.output.startTimes, ['float32'], `${id} output startTimes`);
  }
  if (props.output.durations) {
    validatePackedView(props.output.durations, ['float32'], `${id} output durations`);
  }
  validatePackedUint32View(props.output.spanIds, `${id} output spanIds`);
  validatePackedUint32View(props.output.laneOffsets, `${id} output laneOffsets`);
  validatePackedUint32View(props.output.validationErrors, `${id} output validationErrors`);

  const spanCount = props.source.startTimes.length;
  for (const [name, view] of [
    ['source durations', props.source.durations],
    ['source laneIds', props.source.laneIds],
    ...(props.output.startTimes ? ([['output startTimes', props.output.startTimes]] as const) : []),
    ...(props.output.durations ? ([['output durations', props.output.durations]] as const) : []),
    ['output spanIds', props.output.spanIds]
  ] as const) {
    if (view.length !== spanCount) {
      throw new Error(`${id} ${name} must contain exactly ${spanCount} rows`);
    }
  }
  if (!Number.isSafeInteger(props.laneCount) || props.laneCount < 1) {
    throw new Error(`${id} laneCount must be a positive safe integer`);
  }
  if (props.output.laneOffsets.length !== props.laneCount + 1) {
    throw new Error(`${id} laneOffsets must contain laneCount + 1 rows`);
  }
  if (props.output.validationErrors.length !== 1) {
    throw new Error(`${id} validationErrors must contain one uint32`);
  }
  const sourceBuffers = new Set(Object.values(props.source).map(view => view.buffer));
  const outputBuffers = Object.values(props.output).flatMap(view => (view ? [view.buffer] : []));
  if (
    new Set(outputBuffers).size !== outputBuffers.length ||
    outputBuffers.some(buffer => sourceBuffers.has(buffer))
  ) {
    throw new Error(`${id} source and output columns must use separate buffers`);
  }
  return {spanCount, laneCount: props.laneCount, sortCount: spanCount > 0 ? 2 : 0};
}

function validateScalarSourceView(
  view: GraphDataView,
  format: 'float32' | 'uint32',
  name: string
): void {
  if (
    view.format !== format ||
    view.rowByteLength !== UINT32_BYTE_LENGTH ||
    view.byteStride % UINT32_BYTE_LENGTH !== 0 ||
    view.byteOffset % UINT32_BYTE_LENGTH !== 0
  ) {
    throw new Error(`${name} must be uint32-aligned scalar ${format} GPU data`);
  }
}

function addClearPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  builder: GPUTraceLaneIndexBuilder,
  laneCounts: GraphDataView<'uint32'>
): void {
  const length = Math.max(builder.stats.laneCount, 1);
  const dispatch = getBoundedDispatchLayout(
    `${builder.id}-clear`,
    length,
    LANE_INDEX_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const LANE_COUNT: u32 = ${builder.stats.laneCount}u;
const JOB_COUNT: u32 = ${length}u;
const LANE_COUNT_OFFSET: u32 = ${getViewElementOffset(laneCounts)}u;
const ERROR_OFFSET: u32 = ${getViewElementOffset(builder.output.validationErrors)}u;
@group(0) @binding(0) var<storage, read_write> laneCounts: array<u32>;
@group(0) @binding(1) var<storage, read_write> validationErrors: array<u32>;
@compute @workgroup_size(${LANE_INDEX_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, LANE_INDEX_WORKGROUP_SIZE)}
  if (index >= JOB_COUNT) { return; }
  if (index < LANE_COUNT) { laneCounts[LANE_COUNT_OFFSET + index] = 0u; }
  if (index == 0u) { validationErrors[ERROR_OFFSET] = 0u; }
}`;
  addComputationPass(graph, {
    id: `${builder.id}-clear`,
    operation: 'GPUTraceLaneIndexBuilder',
    source,
    dispatch,
    bindings: {
      laneCounts,
      validationErrors: builder.output.validationErrors
    },
    resources: [
      {buffer: laneCounts, usage: 'storage-write'},
      {buffer: builder.output.validationErrors, usage: 'storage-write'}
    ]
  });
}

function addTimeKeyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  builder: GPUTraceLaneIndexBuilder,
  timeKeys: GraphDataView<'uint32'>,
  spanIds: GraphDataView<'uint32'>
): void {
  const dispatch = getSpanDispatch(graph, builder, 'time-keys');
  const startStride = builder.source.startTimes.byteStride / UINT32_BYTE_LENGTH;
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${builder.stats.spanCount}u;
const START_OFFSET: u32 = ${getViewElementOffset(builder.source.startTimes)}u;
const START_STRIDE: u32 = ${startStride}u;
const KEY_OFFSET: u32 = ${getViewElementOffset(timeKeys)}u;
const SPAN_ID_OFFSET: u32 = ${getViewElementOffset(spanIds)}u;
const ERROR_OFFSET: u32 = ${getViewElementOffset(builder.output.validationErrors)}u;
@group(0) @binding(0) var<storage, read> startTimes: array<f32>;
@group(0) @binding(1) var<storage, read_write> timeKeys: array<u32>;
@group(0) @binding(2) var<storage, read_write> spanIds: array<u32>;
@group(0) @binding(3) var<storage, read_write> validationErrors: array<atomic<u32>>;
@compute @workgroup_size(${LANE_INDEX_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, LANE_INDEX_WORKGROUP_SIZE)}
  if (index >= SPAN_COUNT) { return; }
  let startTime = startTimes[START_OFFSET + index * START_STRIDE];
  let valid = startTime == startTime && abs(startTime) <= 3.402823466e+38;
  let bits = bitcast<u32>(startTime);
  let ordered = select(bits ^ 0x80000000u, ~bits, (bits & 0x80000000u) != 0u);
  timeKeys[KEY_OFFSET + index] = select(0xffffffffu, ordered, valid);
  spanIds[SPAN_ID_OFFSET + index] = index;
  if (!valid) {
    atomicOr(&validationErrors[ERROR_OFFSET], ${GPU_TRACE_LANE_INDEX_INVALID_START_TIME}u);
  }
}`;
  addComputationPass(graph, {
    id: `${builder.id}-time-keys`,
    operation: 'GPUTraceLaneIndexBuilder',
    source,
    dispatch,
    bindings: {
      startTimes: builder.source.startTimes,
      timeKeys,
      spanIds,
      validationErrors: builder.output.validationErrors
    },
    resources: [
      {buffer: builder.source.startTimes, usage: 'storage-read'},
      {buffer: timeKeys, usage: 'storage-write'},
      {buffer: spanIds, usage: 'storage-write'},
      {buffer: builder.output.validationErrors, usage: 'storage-read-write'}
    ]
  });
}

function addLaneKeyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  builder: GPUTraceLaneIndexBuilder,
  timeSortedSpanIds: GraphDataView<'uint32'>,
  laneKeys: GraphDataView<'uint32'>
): void {
  const dispatch = getSpanDispatch(graph, builder, 'lane-keys');
  const laneStride = builder.source.laneIds.byteStride / UINT32_BYTE_LENGTH;
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${builder.stats.spanCount}u;
const LANE_COUNT: u32 = ${builder.stats.laneCount}u;
const SOURCE_LANE_OFFSET: u32 = ${getViewElementOffset(builder.source.laneIds)}u;
const SOURCE_LANE_STRIDE: u32 = ${laneStride}u;
const SPAN_ID_OFFSET: u32 = ${getViewElementOffset(timeSortedSpanIds)}u;
const LANE_KEY_OFFSET: u32 = ${getViewElementOffset(laneKeys)}u;
const ERROR_OFFSET: u32 = ${getViewElementOffset(builder.output.validationErrors)}u;
@group(0) @binding(0) var<storage, read> sourceLaneIds: array<u32>;
@group(0) @binding(1) var<storage, read> spanIds: array<u32>;
@group(0) @binding(2) var<storage, read_write> laneKeys: array<u32>;
@group(0) @binding(3) var<storage, read_write> validationErrors: array<atomic<u32>>;
@compute @workgroup_size(${LANE_INDEX_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, LANE_INDEX_WORKGROUP_SIZE)}
  if (index >= SPAN_COUNT) { return; }
  let spanId = spanIds[SPAN_ID_OFFSET + index];
  let lane = sourceLaneIds[SOURCE_LANE_OFFSET + spanId * SOURCE_LANE_STRIDE];
  let valid = lane < LANE_COUNT;
  laneKeys[LANE_KEY_OFFSET + index] = select(0xffffffffu, lane, valid);
  if (!valid) {
    atomicOr(&validationErrors[ERROR_OFFSET], ${GPU_TRACE_LANE_INDEX_INVALID_LANE}u);
  }
}`;
  addComputationPass(graph, {
    id: `${builder.id}-lane-keys`,
    operation: 'GPUTraceLaneIndexBuilder',
    source,
    dispatch,
    bindings: {
      sourceLaneIds: builder.source.laneIds,
      spanIds: timeSortedSpanIds,
      laneKeys,
      validationErrors: builder.output.validationErrors
    },
    resources: [
      {buffer: builder.source.laneIds, usage: 'storage-read'},
      {buffer: timeSortedSpanIds, usage: 'storage-read'},
      {buffer: laneKeys, usage: 'storage-write'},
      {buffer: builder.output.validationErrors, usage: 'storage-read-write'}
    ]
  });
}

function addGatherPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  builder: GPUTraceLaneIndexBuilder,
  sortedLaneKeys: GraphDataView<'uint32'>,
  laneCounts: GraphDataView<'uint32'>
): void {
  const outputStartTimes = builder.output.startTimes;
  const outputDurations = builder.output.durations;
  if (!outputStartTimes || !outputDurations) {
    throw new Error(`${builder.id} gathered output columns are missing`);
  }
  const dispatch = getSpanDispatch(graph, builder, 'gather');
  const startStride = builder.source.startTimes.byteStride / UINT32_BYTE_LENGTH;
  const durationStride = builder.source.durations.byteStride / UINT32_BYTE_LENGTH;
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${builder.stats.spanCount}u;
const LANE_COUNT: u32 = ${builder.stats.laneCount}u;
const SOURCE_START_OFFSET: u32 = ${getViewElementOffset(builder.source.startTimes)}u;
const SOURCE_START_STRIDE: u32 = ${startStride}u;
const SOURCE_DURATION_OFFSET: u32 = ${getViewElementOffset(builder.source.durations)}u;
const SOURCE_DURATION_STRIDE: u32 = ${durationStride}u;
const SORTED_LANE_OFFSET: u32 = ${getViewElementOffset(sortedLaneKeys)}u;
const SORTED_SPAN_ID_OFFSET: u32 = ${getViewElementOffset(builder.output.spanIds)}u;
const OUTPUT_START_OFFSET: u32 = ${getViewElementOffset(outputStartTimes)}u;
const OUTPUT_DURATION_OFFSET: u32 = ${getViewElementOffset(outputDurations)}u;
const LANE_COUNT_OFFSET: u32 = ${getViewElementOffset(laneCounts)}u;
const ERROR_OFFSET: u32 = ${getViewElementOffset(builder.output.validationErrors)}u;
@group(0) @binding(0) var<storage, read> sourceStartTimes: array<f32>;
@group(0) @binding(1) var<storage, read> sourceDurations: array<f32>;
@group(0) @binding(2) var<storage, read> sortedLaneIds: array<u32>;
@group(0) @binding(3) var<storage, read> sortedSpanIds: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputStartTimes: array<f32>;
@group(0) @binding(5) var<storage, read_write> outputDurations: array<f32>;
@group(0) @binding(6) var<storage, read_write> laneCounts: array<atomic<u32>>;
@group(0) @binding(7) var<storage, read_write> validationErrors: array<atomic<u32>>;
@compute @workgroup_size(${LANE_INDEX_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, LANE_INDEX_WORKGROUP_SIZE)}
  if (index >= SPAN_COUNT) { return; }
  let spanId = sortedSpanIds[SORTED_SPAN_ID_OFFSET + index];
  let lane = sortedLaneIds[SORTED_LANE_OFFSET + index];
  let startTime = sourceStartTimes[SOURCE_START_OFFSET + spanId * SOURCE_START_STRIDE];
  let duration = sourceDurations[SOURCE_DURATION_OFFSET + spanId * SOURCE_DURATION_STRIDE];
  outputStartTimes[OUTPUT_START_OFFSET + index] = startTime;
  outputDurations[OUTPUT_DURATION_OFFSET + index] = duration;
  if (lane < LANE_COUNT) { atomicAdd(&laneCounts[LANE_COUNT_OFFSET + lane], 1u); }
  let validDuration = duration == duration && abs(duration) <= 3.402823466e+38 && duration >= 0.0;
  if (!validDuration) {
    atomicOr(&validationErrors[ERROR_OFFSET], ${GPU_TRACE_LANE_INDEX_INVALID_DURATION}u);
  }
  if (validDuration && index + 1u < SPAN_COUNT) {
    let nextLane = sortedLaneIds[SORTED_LANE_OFFSET + index + 1u];
    let nextSpanId = sortedSpanIds[SORTED_SPAN_ID_OFFSET + index + 1u];
    let nextStart = sourceStartTimes[SOURCE_START_OFFSET + nextSpanId * SOURCE_START_STRIDE];
    if (lane < LANE_COUNT && nextLane == lane && startTime + duration > nextStart) {
      atomicOr(&validationErrors[ERROR_OFFSET], ${GPU_TRACE_LANE_INDEX_OVERLAPPING_SPANS}u);
    }
  }
}`;
  addComputationPass(graph, {
    id: `${builder.id}-gather`,
    operation: 'GPUTraceLaneIndexBuilder',
    source,
    dispatch,
    bindings: {
      sourceStartTimes: builder.source.startTimes,
      sourceDurations: builder.source.durations,
      sortedLaneIds: sortedLaneKeys,
      sortedSpanIds: builder.output.spanIds,
      outputStartTimes,
      outputDurations,
      laneCounts,
      validationErrors: builder.output.validationErrors
    },
    resources: [
      {buffer: builder.source.startTimes, usage: 'storage-read'},
      {buffer: builder.source.durations, usage: 'storage-read'},
      {buffer: sortedLaneKeys, usage: 'storage-read'},
      {buffer: builder.output.spanIds, usage: 'storage-read'},
      {buffer: outputStartTimes, usage: 'storage-write'},
      {buffer: outputDurations, usage: 'storage-write'},
      {buffer: laneCounts, usage: 'storage-read-write'},
      {buffer: builder.output.validationErrors, usage: 'storage-read-write'}
    ]
  });
}

function addCompactFinalizePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  builder: GPUTraceLaneIndexBuilder,
  sortedLaneKeys: GraphDataView<'uint32'>,
  laneCounts: GraphDataView<'uint32'>
): void {
  const dispatch = getSpanDispatch(graph, builder, 'compact-finalize');
  const startStride = builder.source.startTimes.byteStride / UINT32_BYTE_LENGTH;
  const durationStride = builder.source.durations.byteStride / UINT32_BYTE_LENGTH;
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${builder.stats.spanCount}u;
const LANE_COUNT: u32 = ${builder.stats.laneCount}u;
const SOURCE_START_OFFSET: u32 = ${getViewElementOffset(builder.source.startTimes)}u;
const SOURCE_START_STRIDE: u32 = ${startStride}u;
const SOURCE_DURATION_OFFSET: u32 = ${getViewElementOffset(builder.source.durations)}u;
const SOURCE_DURATION_STRIDE: u32 = ${durationStride}u;
const SORTED_LANE_OFFSET: u32 = ${getViewElementOffset(sortedLaneKeys)}u;
const SORTED_SPAN_ID_OFFSET: u32 = ${getViewElementOffset(builder.output.spanIds)}u;
const LANE_COUNT_OFFSET: u32 = ${getViewElementOffset(laneCounts)}u;
const ERROR_OFFSET: u32 = ${getViewElementOffset(builder.output.validationErrors)}u;
@group(0) @binding(0) var<storage, read> sourceStartTimes: array<f32>;
@group(0) @binding(1) var<storage, read> sourceDurations: array<f32>;
@group(0) @binding(2) var<storage, read> sortedLaneIds: array<u32>;
@group(0) @binding(3) var<storage, read> sortedSpanIds: array<u32>;
@group(0) @binding(4) var<storage, read_write> laneCounts: array<atomic<u32>>;
@group(0) @binding(5) var<storage, read_write> validationErrors: array<atomic<u32>>;
@compute @workgroup_size(${LANE_INDEX_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, LANE_INDEX_WORKGROUP_SIZE)}
  if (index >= SPAN_COUNT) { return; }
  let spanId = sortedSpanIds[SORTED_SPAN_ID_OFFSET + index];
  let lane = sortedLaneIds[SORTED_LANE_OFFSET + index];
  let startTime = sourceStartTimes[SOURCE_START_OFFSET + spanId * SOURCE_START_STRIDE];
  let duration = sourceDurations[SOURCE_DURATION_OFFSET + spanId * SOURCE_DURATION_STRIDE];
  if (lane < LANE_COUNT) { atomicAdd(&laneCounts[LANE_COUNT_OFFSET + lane], 1u); }
  let validDuration = duration == duration && abs(duration) <= 3.402823466e+38 && duration >= 0.0;
  if (!validDuration) {
    atomicOr(&validationErrors[ERROR_OFFSET], ${GPU_TRACE_LANE_INDEX_INVALID_DURATION}u);
  }
  if (validDuration && index + 1u < SPAN_COUNT) {
    let nextLane = sortedLaneIds[SORTED_LANE_OFFSET + index + 1u];
    let nextSpanId = sortedSpanIds[SORTED_SPAN_ID_OFFSET + index + 1u];
    let nextStart = sourceStartTimes[SOURCE_START_OFFSET + nextSpanId * SOURCE_START_STRIDE];
    if (lane < LANE_COUNT && nextLane == lane && startTime + duration > nextStart) {
      atomicOr(&validationErrors[ERROR_OFFSET], ${GPU_TRACE_LANE_INDEX_OVERLAPPING_SPANS}u);
    }
  }
}`;
  addComputationPass(graph, {
    id: `${builder.id}-compact-finalize`,
    operation: 'GPUTraceLaneIndexBuilder',
    source,
    dispatch,
    bindings: {
      sourceStartTimes: builder.source.startTimes,
      sourceDurations: builder.source.durations,
      sortedLaneIds: sortedLaneKeys,
      sortedSpanIds: builder.output.spanIds,
      laneCounts,
      validationErrors: builder.output.validationErrors
    },
    resources: [
      {buffer: builder.source.startTimes, usage: 'storage-read'},
      {buffer: builder.source.durations, usage: 'storage-read'},
      {buffer: sortedLaneKeys, usage: 'storage-read'},
      {buffer: builder.output.spanIds, usage: 'storage-read'},
      {buffer: laneCounts, usage: 'storage-read-write'},
      {buffer: builder.output.validationErrors, usage: 'storage-read-write'}
    ]
  });
}

function addOffsetSentinelPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  builder: GPUTraceLaneIndexBuilder,
  laneCounts: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const LANE_COUNT: u32 = ${builder.stats.laneCount}u;
const LANE_COUNT_OFFSET: u32 = ${getViewElementOffset(laneCounts)}u;
const LANE_OFFSET: u32 = ${getViewElementOffset(builder.output.laneOffsets)}u;
@group(0) @binding(0) var<storage, read> laneCounts: array<u32>;
@group(0) @binding(1) var<storage, read_write> laneOffsets: array<u32>;
@compute @workgroup_size(1) fn main() {
  let finalLane = LANE_COUNT - 1u;
  laneOffsets[LANE_OFFSET + LANE_COUNT] =
    laneOffsets[LANE_OFFSET + finalLane] + laneCounts[LANE_COUNT_OFFSET + finalLane];
}`;
  addComputationPass(graph, {
    id: `${builder.id}-offset-sentinel`,
    operation: 'GPUTraceLaneIndexBuilder',
    source,
    dispatch: {x: 1, y: 1, z: 1},
    bindings: {laneCounts, laneOffsets: builder.output.laneOffsets},
    resources: [
      {buffer: laneCounts, usage: 'storage-read'},
      {buffer: builder.output.laneOffsets, usage: 'storage-read-write'}
    ]
  });
}

function getSpanDispatch<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  builder: GPUTraceLaneIndexBuilder,
  suffix: string
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    `${builder.id}-${suffix}`,
    builder.stats.spanCount,
    LANE_INDEX_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
}

function addComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    operation: string;
    source: string;
    dispatch: GPUBoundedDispatchLayout;
    bindings: Record<string, GraphDataView>;
    resources: GraphBufferUse[];
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    workload: {
      operation: props.operation,
      commandCount: 1,
      maximumWorkgroupCount: props.dispatch.x * props.dispatch.y * props.dispatch.z,
      maximumInvocationCount:
        props.dispatch.x * props.dispatch.y * props.dispatch.z * LANE_INDEX_WORKGROUP_SIZE
    },
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
          const bindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, props.dispatch.x, props.dispatch.y, props.dispatch.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
