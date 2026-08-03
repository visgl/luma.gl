// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const TRACE_DURATION = 1000;
export const TRACE_GROUPS = ['compute', 'network', 'storage'] as const;
export const TRACE_PROCESS_COUNT = 16;
export const TRACE_THREADS_PER_PROCESS = 4;
export const TRACE_LANES_PER_THREAD = 4;
export const TRACE_THREAD_COUNT = TRACE_PROCESS_COUNT * TRACE_THREADS_PER_PROCESS;
export const TRACE_LANE_COUNT = TRACE_THREAD_COUNT * TRACE_LANES_PER_THREAD;
export const TRACE_SPAN_RECORD_WORD_LENGTH = 8;
export const TRACE_DEPENDENCY_RECORD_WORD_LENGTH = 4;
export const TRACE_SPAN_BATCH_RECORD_WORD_LENGTH = 8;
export const TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH = 6;
// One span batch maps to one portable WebGPU workgroup for candidate-driven local compaction.
export const TRACE_SPAN_BATCH_CAPACITY = 256;
// One dependency batch maps to one portable WebGPU workgroup for candidate-driven compaction.
export const TRACE_DEPENDENCY_BATCH_CAPACITY = 128;
const TRACE_DEMONSTRATION_CAPACITIES = [250_000, 1_000_000, 4_000_000, 10_000_000];
// Keep density scrolling visually continuous at common viewport widths while retaining a fixed,
// allocation-stable aggregation target for the compiled GPU command graph.
export const TRACE_DENSITY_BIN_COUNT = 512;
/** Switch to density rendering when one horizontal pixel covers at least this much trace time. */
export const TRACE_DENSITY_TIME_PER_PIXEL = 0.08;
export const TRACE_STATUS_COUNT = 4;
export const TRACE_SAME_PROCESS_DEPENDENCY = 0;
export const TRACE_CROSS_PROCESS_DEPENDENCY = 1;
export const TRACE_PARENT_DEPENDENCY_FLAG = 1;
export const TRACE_DEPENDENCY_PROCESS_MASK = 0xff;
export const TRACE_DEPENDENCY_SOURCE_PROCESS_SHIFT = 8;
export const TRACE_DEPENDENCY_DESTINATION_PROCESS_SHIFT = 16;
export const TRACE_RUNTIME_SPAN_FLAG = 1 << 8;
export const TRACE_ERROR_SPAN_FLAG = 1 << 9;
export const TRACE_OVERLAPPING_CHILD_FLAG = 1 << 10;
export const TRACE_SIMILAR_DURATION_PARENT_FLAG = 1 << 11;
/** Active filtering policy bits uploaded independently from immutable source span flags. */
export const TRACE_FILTER_HIDE_RUNTIME_SPANS = 1 << 0;
export const TRACE_FILTER_ERRORS_ONLY = 1 << 1;
export const TRACE_FILTER_HIDE_OVERLAPPING_CHILDREN = 1 << 2;
export const TRACE_FILTER_HIDE_SIMILAR_DURATION_PARENTS = 1 << 3;
export const TRACE_MAXIMUM_OVERLAPPING_CHILD_DURATION = 1;
export const TRACE_MAXIMUM_RELATIVE_PARENT_DURATION_DELTA = 0.25;
export const TRACE_COLLAPSED_STATE = 0;
export const TRACE_EXPANDED_STATE = 1;
export const TRACE_INVALID_SPAN_INDEX = 0xffffffff;

/** Returns useful demonstration sizes that fit in one span storage-buffer binding. */
export function getTraceCapacityOptions(
  maxStorageBufferBindingSize: number,
  maxBufferSize: number
): number[] {
  const spanRecordByteLength = TRACE_SPAN_RECORD_WORD_LENGTH * Uint32Array.BYTES_PER_ELEMENT;
  const maximumSpanCapacity = Math.floor(
    Math.min(maxStorageBufferBindingSize, maxBufferSize) / spanRecordByteLength
  );
  return TRACE_DEMONSTRATION_CAPACITIES.filter(capacity => capacity <= maximumSpanCapacity);
}

/** Returns useful dependency limits that fit in one dependency storage-buffer binding. */
export function getTraceDependencyCapacityOptions(
  maxStorageBufferBindingSize: number,
  maxBufferSize: number
): number[] {
  const dependencyRecordByteLength =
    TRACE_DEPENDENCY_RECORD_WORD_LENGTH * Uint32Array.BYTES_PER_ELEMENT;
  const maximumDependencyCapacity = Math.floor(
    Math.min(maxStorageBufferBindingSize, maxBufferSize) / dependencyRecordByteLength
  );
  return TRACE_DEMONSTRATION_CAPACITIES.filter(capacity => capacity <= maximumDependencyCapacity);
}

/** Matches the GPU's adaptive exact-span versus density-rendering decision. */
export function isTraceDensityMode(
  timeMin: number,
  timeMax: number,
  viewportWidth: number
): boolean {
  return (timeMax - timeMin) / Math.max(viewportWidth, 1) >= TRACE_DENSITY_TIME_PER_PIXEL;
}

export type TraceGroupName = (typeof TRACE_GROUPS)[number];

/** Stable source range for one indirect trace-span draw group. */
export type TraceGroupData = {
  name: TraceGroupName;
  groupIndex: number;
  count: number;
  firstSpanIndex: number;
  /** Borrowed source-aligned view into the canonical span allocation. */
  data: Uint32Array;
};

/** Stable source partition and coarse bounds used for GPU candidate-batch selection. */
export type TraceSpanBatchData = {
  batchIndex: number;
  groupIndex: number;
  name: TraceGroupName;
  count: number;
  firstSpanIndex: number;
  timeMin: number;
  timeMax: number;
  laneMin: number;
  laneMax: number;
  /** Borrowed source-aligned view into the canonical span allocation. */
  data: Uint32Array;
};

/** Stable dependency range with a conservative endpoint and ancestor time envelope. */
export type TraceDependencyBatchData = {
  batchIndex: number;
  count: number;
  firstDependencyIndex: number;
  timeMin: number;
  timeMax: number;
  familyMask: number;
};

/** Compact forward or reverse compressed sparse dependency adjacency. */
export type TraceAdjacencyData = {
  /** One stable offset per source node plus the final edge count. */
  offsets: Uint32Array;
  /** Stable destination span indices in source edge order. */
  neighbors: Uint32Array;
};

/** GPU-upload-ready trace source data and hierarchy-preserving graph topology. */
export type TraceDatasetData = {
  /** One canonical 32-byte record per span. */
  spans: Uint32Array;
  /** Original stable group ranges into the canonical span allocation. */
  groups: TraceGroupData[];
  /** Group-aligned source partitions small enough for independent GPU processing. */
  spanBatches: TraceSpanBatchData[];
  /** Packed batch first/count, temporal bounds, lane bounds, group, and stable batch ID records. */
  spanBatchIndex: Uint32Array;
  /** Packed 16-byte dependency source, destination, family, and endpoint metadata records. */
  dependencies: Uint32Array;
  /** Stable dependency partitions small enough for one GPU workgroup. */
  dependencyBatches: TraceDependencyBatchData[];
  /** Packed dependency first/count, conservative time bounds, family mask, and batch ID. */
  dependencyBatchIndex: Uint32Array;
  /** One cross-process-prioritized canonical parent or invalid sentinel per span. */
  parentSpans: Uint32Array;
  /** Forward source-to-destination CSR adjacency. */
  outgoing: TraceAdjacencyData;
  /** Reverse destination-to-source CSR adjacency. */
  incoming: TraceAdjacencyData;
  spanCount: number;
  dependencyCount: number;
  processCount: number;
  threadCount: number;
};

/**
 * Creates deterministic, storage-ready hierarchical spans and dependency adjacency.
 *
 * Source identity is the canonical span row index. Groups borrow contiguous views of that same
 * source allocation rather than creating independently numbered records.
 */
export function makeTraceDataset(
  totalSpanCount: number,
  maximumDependencyCount = 0xffffffff
): TraceDatasetData {
  if (!Number.isSafeInteger(totalSpanCount) || totalSpanCount < 0 || totalSpanCount > 0xffffffff) {
    throw new RangeError('Trace span count must be a nonnegative uint32');
  }
  if (
    !Number.isSafeInteger(maximumDependencyCount) ||
    maximumDependencyCount < 0 ||
    maximumDependencyCount > 0xffffffff
  ) {
    throw new RangeError('Trace dependency count must be a nonnegative uint32');
  }

  const spans = new Uint32Array(totalSpanCount * TRACE_SPAN_RECORD_WORD_LENGTH);
  const spanFloats = new Float32Array(spans.buffer);
  const groups: TraceGroupData[] = [];
  let remainingSpanCount = totalSpanCount;
  let firstSpanIndex = 0;

  for (const [groupIndex, name] of TRACE_GROUPS.entries()) {
    const count =
      groupIndex === TRACE_GROUPS.length - 1
        ? remainingSpanCount
        : Math.floor(totalSpanCount / TRACE_GROUPS.length);
    fillTraceGroup({
      spans,
      spanFloats,
      firstSpanIndex,
      spanCount: count,
      groupIndex
    });
    groups.push({
      name,
      groupIndex,
      count,
      firstSpanIndex,
      data: spans.subarray(
        firstSpanIndex * TRACE_SPAN_RECORD_WORD_LENGTH,
        (firstSpanIndex + count) * TRACE_SPAN_RECORD_WORD_LENGTH
      )
    });
    firstSpanIndex += count;
    remainingSpanCount -= count;
  }

  const topology = makeTraceDependencies(spans, totalSpanCount, maximumDependencyCount);
  const dependencyCount = topology.dependencies.length / TRACE_DEPENDENCY_RECORD_WORD_LENGTH;
  const {spanBatches, spanBatchIndex} = makeTraceSpanBatches(spans, groups);
  const {dependencyBatches, dependencyBatchIndex} = makeTraceDependencyBatches(
    spans,
    topology.dependencies,
    topology.parentSpans
  );
  return {
    spans,
    groups,
    spanBatches,
    spanBatchIndex,
    dependencies: topology.dependencies,
    dependencyBatches,
    dependencyBatchIndex,
    parentSpans: topology.parentSpans,
    outgoing: buildTraceAdjacency(totalSpanCount, topology.dependencies, 'outgoing'),
    incoming: buildTraceAdjacency(totalSpanCount, topology.dependencies, 'incoming'),
    spanCount: totalSpanCount,
    dependencyCount,
    processCount: TRACE_PROCESS_COUNT,
    threadCount: TRACE_THREAD_COUNT
  };
}

/**
 * Partitions canonical dependencies and publishes conservative time bounds for GPU selection.
 *
 * Each endpoint contributes its full ancestor envelope. This keeps selection conservative when a
 * filtered endpoint is projected to a visible ancestor or a collapsed process uses the source row.
 */
export function makeTraceDependencyBatches(
  spans: Uint32Array,
  dependencies: Uint32Array,
  parentSpans: Uint32Array,
  batchCapacity = TRACE_DEPENDENCY_BATCH_CAPACITY
): {
  dependencyBatches: TraceDependencyBatchData[];
  dependencyBatchIndex: Uint32Array;
} {
  if (!Number.isSafeInteger(batchCapacity) || batchCapacity < 1) {
    throw new RangeError('Trace dependency batch capacity must be a positive safe integer');
  }
  const spanCount = spans.length / TRACE_SPAN_RECORD_WORD_LENGTH;
  const dependencyCount = dependencies.length / TRACE_DEPENDENCY_RECORD_WORD_LENGTH;
  const spanFloats = new Float32Array(spans.buffer, spans.byteOffset, spans.length);
  const envelopeTimeMin = new Float32Array(spanCount);
  const envelopeTimeMax = new Float32Array(spanCount);
  for (let spanIndex = 0; spanIndex < spanCount; spanIndex++) {
    const wordOffset = spanIndex * TRACE_SPAN_RECORD_WORD_LENGTH;
    const start = spanFloats[wordOffset];
    const end = start + spanFloats[wordOffset + 1];
    const parentSpanIndex = parentSpans[spanIndex];
    envelopeTimeMin[spanIndex] =
      parentSpanIndex === TRACE_INVALID_SPAN_INDEX
        ? start
        : Math.min(start, envelopeTimeMin[parentSpanIndex]);
    envelopeTimeMax[spanIndex] =
      parentSpanIndex === TRACE_INVALID_SPAN_INDEX
        ? end
        : Math.max(end, envelopeTimeMax[parentSpanIndex]);
  }

  const dependencyBatches: TraceDependencyBatchData[] = [];
  for (
    let firstDependencyIndex = 0;
    firstDependencyIndex < dependencyCount;
    firstDependencyIndex += batchCapacity
  ) {
    const count = Math.min(batchCapacity, dependencyCount - firstDependencyIndex);
    let timeMin = Number.POSITIVE_INFINITY;
    let timeMax = Number.NEGATIVE_INFINITY;
    let familyMask = 0;
    for (let rowIndex = 0; rowIndex < count; rowIndex++) {
      const wordOffset = (firstDependencyIndex + rowIndex) * TRACE_DEPENDENCY_RECORD_WORD_LENGTH;
      const sourceSpanIndex = dependencies[wordOffset];
      const destinationSpanIndex = dependencies[wordOffset + 1];
      timeMin = Math.min(
        timeMin,
        envelopeTimeMin[sourceSpanIndex],
        envelopeTimeMin[destinationSpanIndex]
      );
      timeMax = Math.max(
        timeMax,
        envelopeTimeMax[sourceSpanIndex],
        envelopeTimeMax[destinationSpanIndex]
      );
      familyMask |= 1 << dependencies[wordOffset + 2];
    }
    dependencyBatches.push({
      batchIndex: dependencyBatches.length,
      count,
      firstDependencyIndex,
      timeMin,
      timeMax,
      familyMask
    });
  }

  const dependencyBatchIndex = new Uint32Array(
    dependencyBatches.length * TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH
  );
  const dependencyBatchIndexFloats = new Float32Array(dependencyBatchIndex.buffer);
  for (const batch of dependencyBatches) {
    const wordOffset = batch.batchIndex * TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH;
    dependencyBatchIndex[wordOffset] = batch.firstDependencyIndex;
    dependencyBatchIndex[wordOffset + 1] = batch.count;
    dependencyBatchIndexFloats[wordOffset + 2] = batch.timeMin;
    dependencyBatchIndexFloats[wordOffset + 3] = batch.timeMax;
    dependencyBatchIndex[wordOffset + 4] = batch.familyMask;
    dependencyBatchIndex[wordOffset + 5] = batch.batchIndex;
  }
  return {dependencyBatches, dependencyBatchIndex};
}

/** Partitions canonical group ranges and builds coarse GPU-readable batch bounds. */
export function makeTraceSpanBatches(
  spans: Uint32Array,
  groups: readonly TraceGroupData[],
  batchCapacity = TRACE_SPAN_BATCH_CAPACITY
): {spanBatches: TraceSpanBatchData[]; spanBatchIndex: Uint32Array} {
  if (!Number.isSafeInteger(batchCapacity) || batchCapacity < 1) {
    throw new RangeError('Trace span batch capacity must be a positive safe integer');
  }
  const spanFloats = new Float32Array(spans.buffer, spans.byteOffset, spans.length);
  const spanBatches: TraceSpanBatchData[] = [];

  for (const group of groups) {
    for (let groupOffset = 0; groupOffset < group.count; groupOffset += batchCapacity) {
      const count = Math.min(batchCapacity, group.count - groupOffset);
      const firstSpanIndex = group.firstSpanIndex + groupOffset;
      let timeMin = Number.POSITIVE_INFINITY;
      let timeMax = Number.NEGATIVE_INFINITY;
      let laneMin = TRACE_LANE_COUNT;
      let laneMax = 0;
      for (let rowIndex = 0; rowIndex < count; rowIndex++) {
        const wordOffset = (firstSpanIndex + rowIndex) * TRACE_SPAN_RECORD_WORD_LENGTH;
        const start = spanFloats[wordOffset];
        const end = start + spanFloats[wordOffset + 1];
        const lane = spans[wordOffset + 2];
        timeMin = Math.min(timeMin, start);
        timeMax = Math.max(timeMax, end);
        laneMin = Math.min(laneMin, lane);
        laneMax = Math.max(laneMax, lane + 1);
      }
      spanBatches.push({
        batchIndex: spanBatches.length,
        groupIndex: group.groupIndex,
        name: group.name,
        count,
        firstSpanIndex,
        timeMin,
        timeMax,
        laneMin,
        laneMax,
        data: spans.subarray(
          firstSpanIndex * TRACE_SPAN_RECORD_WORD_LENGTH,
          (firstSpanIndex + count) * TRACE_SPAN_RECORD_WORD_LENGTH
        )
      });
    }
  }

  const spanBatchIndex = new Uint32Array(spanBatches.length * TRACE_SPAN_BATCH_RECORD_WORD_LENGTH);
  const spanBatchIndexFloats = new Float32Array(spanBatchIndex.buffer);
  for (const batch of spanBatches) {
    const wordOffset = batch.batchIndex * TRACE_SPAN_BATCH_RECORD_WORD_LENGTH;
    spanBatchIndex[wordOffset] = batch.firstSpanIndex;
    spanBatchIndex[wordOffset + 1] = batch.count;
    spanBatchIndexFloats[wordOffset + 2] = batch.timeMin;
    spanBatchIndexFloats[wordOffset + 3] = batch.timeMax;
    spanBatchIndex[wordOffset + 4] = batch.laneMin;
    spanBatchIndex[wordOffset + 5] = batch.laneMax;
    spanBatchIndex[wordOffset + 6] = batch.groupIndex;
    spanBatchIndex[wordOffset + 7] = batch.batchIndex;
  }
  return {spanBatches, spanBatchIndex};
}

/** Maintains the original example API while retaining canonical source references. */
export function makeTraceGroups(totalSpanCount: number): TraceGroupData[] {
  return makeTraceDataset(totalSpanCount).groups;
}

/** Fills one stable group range with deterministic timing, ownership, and classification. */
function fillTraceGroup(params: {
  spans: Uint32Array;
  spanFloats: Float32Array;
  firstSpanIndex: number;
  spanCount: number;
  groupIndex: number;
}): void {
  let randomState = (0x9e3779b9 ^ Math.imul(params.groupIndex, 0x85ebca6b)) >>> 0;
  const random = (): number => {
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    return (randomState >>> 0) / 0x100000000;
  };

  for (let groupRowIndex = 0; groupRowIndex < params.spanCount; groupRowIndex++) {
    const spanIndex = params.firstSpanIndex + groupRowIndex;
    const wordOffset = spanIndex * TRACE_SPAN_RECORD_WORD_LENGTH;
    const laneIndex = Math.floor(random() * TRACE_LANE_COUNT);
    const threadIndex = Math.floor(laneIndex / TRACE_LANES_PER_THREAD);
    const processIndex = Math.floor(threadIndex / TRACE_THREADS_PER_PROCESS);
    const temporalFraction = groupRowIndex / Math.max(params.spanCount, 1);
    const cluster = Math.floor(temporalFraction * 20) * (TRACE_DURATION / 20);
    const start = Math.min(TRACE_DURATION - 0.05, cluster + random() * 55);
    const durationScale = params.groupIndex === 0 ? 5 : params.groupIndex === 1 ? 14 : 28;
    const duration = Math.max(0.08, Math.pow(random(), 2.6) * durationScale);
    const status = Math.floor(random() * TRACE_STATUS_COUNT);
    const runtimeFlag = spanIndex % 11 === 0 ? TRACE_RUNTIME_SPAN_FLAG : 0;
    const errorFlag = spanIndex % 37 === 0 ? TRACE_ERROR_SPAN_FLAG : 0;
    params.spanFloats[wordOffset] = start;
    params.spanFloats[wordOffset + 1] = duration;
    params.spans[wordOffset + 2] = laneIndex;
    params.spans[wordOffset + 3] = params.groupIndex;
    params.spans[wordOffset + 4] = processIndex;
    params.spans[wordOffset + 5] = threadIndex;
    params.spans[wordOffset + 6] = spanIndex;
    params.spans[wordOffset + 7] = status | runtimeFlag | errorFlag;
  }
}

/** Generates sparse same-thread parent chains and cross-process dependency edges. */
function makeTraceDependencies(
  spans: Uint32Array,
  spanCount: number,
  requestedMaximumDependencyCount: number
): {dependencies: Uint32Array; parentSpans: Uint32Array} {
  const generatedMaximumDependencyCount = Math.ceil(spanCount / 5) + Math.ceil(spanCount / 29) + 1;
  const maximumDependencyCount = Math.min(
    requestedMaximumDependencyCount,
    generatedMaximumDependencyCount
  );
  const data = new Uint32Array(maximumDependencyCount * TRACE_DEPENDENCY_RECORD_WORD_LENGTH);
  const spanFloats = new Float32Array(spans.buffer, spans.byteOffset, spans.length);
  const previousSpanByThread = new Uint32Array(TRACE_THREAD_COUNT);
  previousSpanByThread.fill(TRACE_INVALID_SPAN_INDEX);
  const parentSpans = new Uint32Array(spanCount);
  parentSpans.fill(TRACE_INVALID_SPAN_INDEX);
  let dependencyCount = 0;

  for (let spanIndex = 0; spanIndex < spanCount; spanIndex++) {
    const wordOffset = spanIndex * TRACE_SPAN_RECORD_WORD_LENGTH;
    const threadIndex = spans[wordOffset + 5];
    const previousSpan = previousSpanByThread[threadIndex];
    if (
      dependencyCount < maximumDependencyCount &&
      spanIndex % 5 === 0 &&
      previousSpan !== TRACE_INVALID_SPAN_INDEX
    ) {
      writeTraceDependency(
        data,
        spans,
        dependencyCount++,
        previousSpan,
        spanIndex,
        TRACE_SAME_PROCESS_DEPENDENCY
      );
      parentSpans[spanIndex] = previousSpan;
      annotateTraceParentTopology(spans, spanFloats, previousSpan, spanIndex);
    }
    if (dependencyCount < maximumDependencyCount && spanIndex > 7 && spanIndex % 29 === 0) {
      const processIndex = spans[wordOffset + 4];
      let sourceIndex = spanIndex - 7;
      while (
        sourceIndex > 0 &&
        spans[sourceIndex * TRACE_SPAN_RECORD_WORD_LENGTH + 4] === processIndex
      ) {
        sourceIndex--;
      }
      if (spans[sourceIndex * TRACE_SPAN_RECORD_WORD_LENGTH + 4] !== processIndex) {
        writeTraceDependency(
          data,
          spans,
          dependencyCount++,
          sourceIndex,
          spanIndex,
          TRACE_CROSS_PROCESS_DEPENDENCY
        );
        parentSpans[spanIndex] = sourceIndex;
      }
    }
    previousSpanByThread[threadIndex] = spanIndex;
  }

  return {
    dependencies: data.subarray(0, dependencyCount * TRACE_DEPENDENCY_RECORD_WORD_LENGTH),
    parentSpans
  };
}

/** Preclassifies source-to-child overlap and comparable parent durations at ingestion time. */
function annotateTraceParentTopology(
  spans: Uint32Array,
  spanFloats: Float32Array,
  parentSpanIndex: number,
  childSpanIndex: number
): void {
  const parentWordOffset = parentSpanIndex * TRACE_SPAN_RECORD_WORD_LENGTH;
  const childWordOffset = childSpanIndex * TRACE_SPAN_RECORD_WORD_LENGTH;
  const parentStart = spanFloats[parentWordOffset];
  const parentDuration = spanFloats[parentWordOffset + 1];
  const childStart = spanFloats[childWordOffset];
  const childDuration = spanFloats[childWordOffset + 1];
  if (
    childDuration <= TRACE_MAXIMUM_OVERLAPPING_CHILD_DURATION &&
    childStart >= parentStart &&
    childStart + childDuration <= parentStart + parentDuration
  ) {
    spans[childWordOffset + 7] |= TRACE_OVERLAPPING_CHILD_FLAG;
  }
  if (
    Math.abs(parentDuration - childDuration) <=
    Math.max(parentDuration, childDuration) * TRACE_MAXIMUM_RELATIVE_PARENT_DURATION_DELTA
  ) {
    spans[parentWordOffset + 7] |= TRACE_SIMILAR_DURATION_PARENT_FLAG;
  }
}

/** Writes one fixed-width dependency without allocating intermediate edge objects. */
function writeTraceDependency(
  dependencies: Uint32Array,
  spans: Uint32Array,
  dependencyIndex: number,
  sourceSpanIndex: number,
  destinationSpanIndex: number,
  family: number
): void {
  const wordOffset = dependencyIndex * TRACE_DEPENDENCY_RECORD_WORD_LENGTH;
  dependencies[wordOffset] = sourceSpanIndex;
  dependencies[wordOffset + 1] = destinationSpanIndex;
  dependencies[wordOffset + 2] = family;
  const sourceProcessIndex = spans[sourceSpanIndex * TRACE_SPAN_RECORD_WORD_LENGTH + 4];
  const destinationProcessIndex = spans[destinationSpanIndex * TRACE_SPAN_RECORD_WORD_LENGTH + 4];
  dependencies[wordOffset + 3] =
    TRACE_PARENT_DEPENDENCY_FLAG |
    (sourceProcessIndex << TRACE_DEPENDENCY_SOURCE_PROCESS_SHIFT) |
    (destinationProcessIndex << TRACE_DEPENDENCY_DESTINATION_PROCESS_SHIFT);
}

/** Builds stable compressed sparse rows without materializing per-node edge arrays. */
function buildTraceAdjacency(
  nodeCount: number,
  dependencies: Uint32Array,
  direction: 'outgoing' | 'incoming'
): TraceAdjacencyData {
  const offsets = new Uint32Array(nodeCount + 1);
  const edgeCount = dependencies.length / TRACE_DEPENDENCY_RECORD_WORD_LENGTH;
  const sourceWord = direction === 'outgoing' ? 0 : 1;
  const destinationWord = direction === 'outgoing' ? 1 : 0;

  for (let edgeIndex = 0; edgeIndex < edgeCount; edgeIndex++) {
    const source = dependencies[edgeIndex * TRACE_DEPENDENCY_RECORD_WORD_LENGTH + sourceWord];
    offsets[source + 1]++;
  }
  for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex++) {
    offsets[nodeIndex + 1] += offsets[nodeIndex];
  }

  const neighbors = new Uint32Array(edgeCount);
  const cursors = offsets.slice(0, nodeCount);
  for (let edgeIndex = 0; edgeIndex < edgeCount; edgeIndex++) {
    const wordOffset = edgeIndex * TRACE_DEPENDENCY_RECORD_WORD_LENGTH;
    const source = dependencies[wordOffset + sourceWord];
    neighbors[cursors[source]++] = dependencies[wordOffset + destinationWord];
  }
  return {offsets, neighbors};
}
