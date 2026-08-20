// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  TRACE_ADJACENCY_CHUNK_TARGET_BYTE_LENGTH,
  TRACE_DENSITY_BIN_COUNT,
  TRACE_DISPLAY_LANE_CAPACITY,
  TRACE_DEPENDENCY_RECORD_WORD_LENGTH,
  TRACE_DEPENDENCY_BATCH_CAPACITY,
  TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH,
  TRACE_DEPENDENCY_CHUNK_TARGET_BYTE_LENGTH,
  TRACE_SPAN_CHUNK_TARGET_BYTE_LENGTH,
  TRACE_SPAN_RECORD_WORD_LENGTH,
  TRACE_SPAN_BATCH_CAPACITY,
  TRACE_SPAN_BATCH_RECORD_WORD_LENGTH,
  getMaximumGeneratedTraceDependencyCount,
  getMaximumTraceAdjacencyByteLength,
  type TraceOverviewRenderer
} from './trace-data';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

/** Standard scale points used to compare trace interaction costs across devices and changes. */
export const TRACE_BENCHMARK_CAPACITIES = [
  250_000, 1_000_000, 4_000_000, 10_000_000, 25_000_000
] as const;

/** Stable interaction scenarios whose dispatch and allocation behavior form the 25M contract. */
export const TRACE_BENCHMARK_SCENARIOS = [
  {
    id: 'exact-expanded',
    overviewMode: 'auto',
    density: false,
    collapsed: false,
    filtered: false,
    focused: false,
    picking: false
  },
  {
    id: 'exact-collapsed',
    overviewMode: 'auto',
    density: false,
    collapsed: true,
    filtered: false,
    focused: false,
    picking: false
  },
  {
    id: 'exact-filtered',
    overviewMode: 'auto',
    density: false,
    collapsed: false,
    filtered: true,
    focused: false,
    picking: false
  },
  {
    id: 'exact-focused',
    overviewMode: 'auto',
    density: false,
    collapsed: false,
    filtered: false,
    focused: true,
    picking: false
  },
  {
    id: 'exact-picking',
    overviewMode: 'auto',
    density: false,
    collapsed: false,
    filtered: false,
    focused: false,
    picking: true
  },
  {
    id: 'density',
    overviewMode: 'density',
    density: true,
    collapsed: false,
    filtered: false,
    focused: false,
    picking: false
  },
  {
    id: 'representative',
    overviewMode: 'representative',
    density: true,
    collapsed: false,
    filtered: false,
    focused: false,
    picking: false
  }
] as const;

export type TraceBenchmarkScenario = (typeof TRACE_BENCHMARK_SCENARIOS)[number];
export type TraceBenchmarkScenarioId = TraceBenchmarkScenario['id'];

/** Device-limit report for monolithic and batch-preserving chunked source allocations. */
export type TraceCapacityContract = {
  spanCapacity: number;
  dependencyCapacity: number;
  spanBufferByteLength: number;
  dependencyBufferByteLength: number;
  largestSourceBufferByteLength: number;
  maxStorageBufferBindingSize: number;
  maxBufferSize: number;
  fitsStorageBufferBindingSize: boolean;
  fitsMaxBufferSize: boolean;
  fitsDeviceLimits: boolean;
  spanChunkCount: number;
  largestSpanChunkByteLength: number;
  dependencyChunkCount: number;
  largestDependencyChunkByteLength: number;
  adjacencyChunkCount: number;
  largestAdjacencyChunkByteLength: number;
  largestSourceChunkByteLength: number;
  fitsChunkedDeviceLimits: boolean;
};

export type TraceDatasetPreflight = {
  spanCount: number;
  dependencyCount: number;
  estimatedSourceByteLength: number;
  minimumScanInvocationCount: number;
  requiresConfirmation: boolean;
};

/** Storage envelope for chunk-local lane/time indexes and pixel representatives. */
export type TracePixelMipmapCapacityContract = {
  spanCount: number;
  laneCount: number;
  chunkCount: number;
  maximumPixelCount: number;
  rowOrderByteLength: number;
  laneOffsetByteLength: number;
  representativeByteLength: number;
  compactPersistentByteLength: number;
  rangeMaximumTreeByteLength: number;
  indexedPersistentByteLength: number;
  largestPersistentBufferByteLength: number;
  maximumTransientBufferByteLength: number;
};

const TRACE_SOFT_SOURCE_BYTE_LIMIT = 512 * 1024 * 1024;
const TRACE_SOFT_SCAN_INVOCATION_LIMIT = 20_000_000;

/** Estimates source topology and minimum full-data work before worker generation begins. */
export function getTraceDatasetPreflight(
  spanCapacity: number,
  dependencyCapacity: number
): TraceDatasetPreflight {
  validateCount(spanCapacity);
  validateCount(dependencyCapacity);
  const dependencyCount = Math.min(
    dependencyCapacity,
    getMaximumGeneratedTraceDependencyCount(spanCapacity)
  );
  const spanByteLength = spanCapacity * TRACE_SPAN_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH;
  const dependencyByteLength =
    dependencyCount * TRACE_DEPENDENCY_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH;
  const parentByteLength = spanCapacity * UINT32_BYTE_LENGTH;
  const spanBatchByteLength =
    Math.ceil(spanCapacity / TRACE_SPAN_BATCH_CAPACITY) *
    TRACE_SPAN_BATCH_RECORD_WORD_LENGTH *
    UINT32_BYTE_LENGTH;
  const dependencyBatchByteLength =
    Math.ceil(dependencyCount / TRACE_DEPENDENCY_BATCH_CAPACITY) *
    TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH *
    UINT32_BYTE_LENGTH;
  const estimatedSourceByteLength =
    spanByteLength +
    dependencyByteLength +
    parentByteLength +
    spanBatchByteLength +
    dependencyBatchByteLength +
    getMaximumTraceAdjacencyByteLength(dependencyCount);
  const minimumScanInvocationCount = spanCapacity + dependencyCount;
  return Object.freeze({
    spanCount: spanCapacity,
    dependencyCount,
    estimatedSourceByteLength,
    minimumScanInvocationCount,
    requiresConfirmation:
      estimatedSourceByteLength >= TRACE_SOFT_SOURCE_BYTE_LIMIT ||
      minimumScanInvocationCount >= TRACE_SOFT_SCAN_INVOCATION_LIMIT
  });
}

/**
 * Estimates the optional pixel-mipmap index without allocating source-sized temporary objects.
 *
 * Generated trace lanes are balanced by construction, so every chunk reserves the next power of
 * two above its mean lane population. Real trace adapters should replace that estimate with their
 * measured maximum lane/depth population before enabling the persistent maximum tree.
 */
export function getTracePixelMipmapCapacityContract(
  spanCount: number,
  laneCount: number,
  maximumChunkSpanCount: number,
  maximumPixelCount: number
): TracePixelMipmapCapacityContract {
  validateCount(spanCount);
  validatePositiveCount(laneCount);
  validatePositiveCount(maximumChunkSpanCount);
  validatePositiveCount(maximumPixelCount);
  const chunkCount = Math.max(1, Math.ceil(spanCount / maximumChunkSpanCount));
  const rowOrderByteLength = spanCount * UINT32_BYTE_LENGTH;
  const laneOffsetByteLength = chunkCount * (laneCount + 1) * UINT32_BYTE_LENGTH;
  const representativeRowsPerChunk = laneCount * maximumPixelCount;
  const representativeByteLength = chunkCount * representativeRowsPerChunk * UINT32_BYTE_LENGTH;
  let rangeMaximumTreeByteLength = 0;
  let largestTreeByteLength = 0;
  let remainingSpanCount = spanCount;
  for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
    const chunkSpanCount = Math.min(remainingSpanCount, maximumChunkSpanCount);
    const maximumLaneSpanCount = Math.max(1, Math.ceil(chunkSpanCount / laneCount));
    const leafCapacity = 2 ** Math.ceil(Math.log2(maximumLaneSpanCount));
    const treeByteLength = laneCount * leafCapacity * 2 * UINT32_BYTE_LENGTH;
    rangeMaximumTreeByteLength += treeByteLength;
    largestTreeByteLength = Math.max(largestTreeByteLength, treeByteLength);
    remainingSpanCount -= chunkSpanCount;
  }
  const compactPersistentByteLength =
    rowOrderByteLength + laneOffsetByteLength + representativeByteLength;
  const indexedPersistentByteLength = compactPersistentByteLength + rangeMaximumTreeByteLength;
  const largestRowOrderByteLength = Math.min(spanCount, maximumChunkSpanCount) * UINT32_BYTE_LENGTH;
  const largestRepresentativeByteLength = representativeRowsPerChunk * UINT32_BYTE_LENGTH;
  const largestPersistentBufferByteLength = Math.max(
    largestRowOrderByteLength,
    (laneCount + 1) * UINT32_BYTE_LENGTH,
    largestRepresentativeByteLength,
    largestTreeByteLength
  );
  const boundaryByteLength = laneCount * (maximumPixelCount + 1) * UINT32_BYTE_LENGTH;
  const candidateByteLength = representativeRowsPerChunk * 2 * UINT32_BYTE_LENGTH;
  return Object.freeze({
    spanCount,
    laneCount,
    chunkCount,
    maximumPixelCount,
    rowOrderByteLength,
    laneOffsetByteLength,
    representativeByteLength,
    compactPersistentByteLength,
    rangeMaximumTreeByteLength,
    indexedPersistentByteLength,
    largestPersistentBufferByteLength,
    maximumTransientBufferByteLength: Math.max(boundaryByteLength, candidateByteLength)
  });
}

/** Persistent GPU-buffer accounting independent of command-graph transient allocations. */
export type TraceAllocationStats = {
  bufferCount: number;
  persistentByteLength: number;
  largestBufferByteLength: number;
};

/** Aggregated per-node GPU timings for scan work in one trace graph. */
export type TraceScanTimingSummary = {
  nodeCount: number;
  sampleCount: number;
  p50Milliseconds: number;
  p95Milliseconds: number;
};

type TraceTimingSnapshot = {
  readonly graphs: readonly {
    readonly id: string;
    readonly nodes: readonly {
      readonly id: string;
      readonly gpu: {
        readonly sampleCount: number;
        readonly p50Milliseconds?: number;
        readonly p95Milliseconds?: number;
      };
    }[];
  }[];
};

export type TraceWorkloadCounterProps = {
  spanCount: number;
  dependencyCount: number;
  spanBatchCount: number;
  candidateSpanBatchCount: number;
  dependencyBatchCount: number;
  candidateDependencyBatchCount: number;
  visibleSpanCount: number;
  visibleDependencyCount: number;
  /** Optional graph-wide upper bound from `CompiledGPUCommandGraph.preflight`. */
  maximumInvocationCount?: number;
  collapsedProcessCount: number;
  densityMode: boolean;
  overviewRenderer: TraceOverviewRenderer;
  overviewLaneCount: number;
  overviewPixelCount: number;
  overviewSpanChunkCount: number;
  filterActive: boolean;
  focusActive: boolean;
  pickActive: boolean;
  allocation: TraceAllocationStats;
};

/** Bounded end-to-end frame timing summary for one effective overview renderer. */
export type TraceOverviewFrameTimingSummary = {
  sampleCount: number;
  latestMilliseconds: number;
  p50Milliseconds: number;
  p95Milliseconds: number;
};

export const TRACE_CERTIFICATION_SCENARIO_DURATION_MILLISECONDS = 3000;
export const TRACE_CERTIFICATION_DURATION_MILLISECONDS =
  TRACE_BENCHMARK_SCENARIOS.length * TRACE_CERTIFICATION_SCENARIO_DURATION_MILLISECONDS;
export const TRACE_CERTIFICATION_MINIMUM_FRAME_SAMPLES = 3;
export const TRACE_CERTIFICATION_MAXIMUM_FRAME_P95_MILLISECONDS = 33;
export const TRACE_CERTIFICATION_MAXIMUM_PICK_P95_MILLISECONDS = 100;

export type TraceCertificationFrameSample = {
  scenarioId: TraceBenchmarkScenarioId;
  renderer: TraceOverviewRenderer;
  frameTimeMilliseconds: number;
  encodeTimeMilliseconds: number;
  candidateSpanBatchCount: number;
  candidateDependencyBatchCount: number;
  visibleSpanCount: number;
  visibleDependencyCount: number;
};

export type TraceCertificationScenarioResult = {
  scenarioId: TraceBenchmarkScenarioId;
  renderer: TraceOverviewRenderer;
  sampleCount: number;
  frameP50Milliseconds: number;
  frameP95Milliseconds: number;
  maximumFrameMilliseconds: number;
  maximumEncodeMilliseconds: number;
  maximumCandidateSpanBatchCount: number;
  maximumCandidateDependencyBatchCount: number;
  maximumVisibleSpanCount: number;
  maximumVisibleDependencyCount: number;
};

export type TraceCertificationReport = {
  schemaVersion: 1;
  createdAt: string;
  adapterKey: string;
  spanCount: number;
  dependencyCount: number;
  canvasWidth: number;
  canvasHeight: number;
  durationMilliseconds: number;
  persistentByteLength: number;
  largestBufferByteLength: number;
  maxStorageBufferBindingSize: number;
  maxBufferSize: number;
  deviceLost: boolean;
  queueStallCount: number;
  deferredPickFrameCount: number;
  pickSampleCount: number;
  pickP50Milliseconds: number | null;
  pickP95Milliseconds: number | null;
  scenarios: readonly TraceCertificationScenarioResult[];
  status: 'pass' | 'fail' | 'incomplete';
  failures: readonly string[];
};

export type TraceCertificationReportProps = {
  createdAt: string;
  adapterKey: string;
  spanCount: number;
  dependencyCount: number;
  canvasWidth: number;
  canvasHeight: number;
  durationMilliseconds: number;
  persistentByteLength: number;
  largestBufferByteLength: number;
  maxStorageBufferBindingSize: number;
  maxBufferSize: number;
  deviceLost: boolean;
  queueStallCount: number;
  deferredPickFrameCount: number;
  samples: readonly TraceCertificationFrameSample[];
  pickResponseMilliseconds: readonly number[];
};

/** Builds one portable, serializable result for the opt-in 25M reference validation. */
export function makeTraceCertificationReport(
  props: TraceCertificationReportProps
): TraceCertificationReport {
  const failures: string[] = [];
  let incomplete = false;
  if (props.spanCount !== 25_000_000 || props.dependencyCount !== 25_000_000) {
    failures.push('Reference validation requires exactly 25M spans and 25M dependencies');
    incomplete = true;
  }
  if (props.durationMilliseconds < TRACE_CERTIFICATION_DURATION_MILLISECONDS) {
    failures.push(
      `Reference validation ran for ${Math.round(props.durationMilliseconds)} ms; ${TRACE_CERTIFICATION_DURATION_MILLISECONDS} ms required`
    );
    incomplete = true;
  }
  if (props.largestBufferByteLength > props.maxStorageBufferBindingSize) {
    failures.push('Largest persistent buffer exceeds maxStorageBufferBindingSize');
  }
  if (props.largestBufferByteLength > props.maxBufferSize) {
    failures.push('Largest persistent buffer exceeds maxBufferSize');
  }
  if (props.deviceLost) {
    failures.push('WebGPU device was lost during reference validation');
  }
  if (props.queueStallCount > 0) {
    failures.push(
      `${props.queueStallCount} frame samples exceeded the one-second queue-stall bound`
    );
  }

  const scenarios = TRACE_BENCHMARK_SCENARIOS.map(scenario => {
    const samples = props.samples.filter(sample => sample.scenarioId === scenario.id);
    if (samples.length < TRACE_CERTIFICATION_MINIMUM_FRAME_SAMPLES) {
      failures.push(
        `${scenario.id} produced ${samples.length}/${TRACE_CERTIFICATION_MINIMUM_FRAME_SAMPLES} required frame samples`
      );
      incomplete = true;
    }
    const result = getTraceCertificationScenarioResult(scenario.id, samples);
    if (
      result.sampleCount >= TRACE_CERTIFICATION_MINIMUM_FRAME_SAMPLES &&
      result.frameP95Milliseconds > TRACE_CERTIFICATION_MAXIMUM_FRAME_P95_MILLISECONDS
    ) {
      failures.push(
        `${scenario.id} frame p95 ${result.frameP95Milliseconds.toFixed(1)} ms exceeds ${TRACE_CERTIFICATION_MAXIMUM_FRAME_P95_MILLISECONDS} ms`
      );
    }
    return result;
  });

  const sortedPickResponses = [...props.pickResponseMilliseconds].sort(
    (left, right) => left - right
  );
  const pickP50Milliseconds =
    sortedPickResponses.length > 0 ? getNearestRank(sortedPickResponses, 0.5) : null;
  const pickP95Milliseconds =
    sortedPickResponses.length > 0 ? getNearestRank(sortedPickResponses, 0.95) : null;
  if (pickP95Milliseconds === null) {
    failures.push('Picking scenario produced no completed response sample');
    incomplete = true;
  } else if (pickP95Milliseconds > TRACE_CERTIFICATION_MAXIMUM_PICK_P95_MILLISECONDS) {
    failures.push(
      `Picking response p95 ${pickP95Milliseconds.toFixed(1)} ms exceeds ${TRACE_CERTIFICATION_MAXIMUM_PICK_P95_MILLISECONDS} ms`
    );
  }

  return Object.freeze({
    schemaVersion: 1,
    createdAt: props.createdAt,
    adapterKey: props.adapterKey,
    spanCount: props.spanCount,
    dependencyCount: props.dependencyCount,
    canvasWidth: props.canvasWidth,
    canvasHeight: props.canvasHeight,
    durationMilliseconds: props.durationMilliseconds,
    persistentByteLength: props.persistentByteLength,
    largestBufferByteLength: props.largestBufferByteLength,
    maxStorageBufferBindingSize: props.maxStorageBufferBindingSize,
    maxBufferSize: props.maxBufferSize,
    deviceLost: props.deviceLost,
    queueStallCount: props.queueStallCount,
    deferredPickFrameCount: props.deferredPickFrameCount,
    pickSampleCount: sortedPickResponses.length,
    pickP50Milliseconds,
    pickP95Milliseconds,
    scenarios,
    status:
      failures.length === 0
        ? 'pass'
        : props.deviceLost || props.queueStallCount > 0
          ? 'fail'
          : incomplete
            ? 'incomplete'
            : 'fail',
    failures: Object.freeze(failures)
  });
}

function getTraceCertificationScenarioResult(
  scenarioId: TraceBenchmarkScenarioId,
  samples: readonly TraceCertificationFrameSample[]
): TraceCertificationScenarioResult {
  const frameTimes = samples.map(sample => sample.frameTimeMilliseconds).sort((a, b) => a - b);
  return Object.freeze({
    scenarioId,
    renderer: samples.at(-1)?.renderer ?? 'exact',
    sampleCount: samples.length,
    frameP50Milliseconds: frameTimes.length > 0 ? getNearestRank(frameTimes, 0.5) : 0,
    frameP95Milliseconds: frameTimes.length > 0 ? getNearestRank(frameTimes, 0.95) : 0,
    maximumFrameMilliseconds: Math.max(0, ...frameTimes),
    maximumEncodeMilliseconds: Math.max(0, ...samples.map(sample => sample.encodeTimeMilliseconds)),
    maximumCandidateSpanBatchCount: Math.max(
      0,
      ...samples.map(sample => sample.candidateSpanBatchCount)
    ),
    maximumCandidateDependencyBatchCount: Math.max(
      0,
      ...samples.map(sample => sample.candidateDependencyBatchCount)
    ),
    maximumVisibleSpanCount: Math.max(0, ...samples.map(sample => sample.visibleSpanCount)),
    maximumVisibleDependencyCount: Math.max(
      0,
      ...samples.map(sample => sample.visibleDependencyCount)
    )
  });
}

/** Calculates the exact source-buffer limit required by one demonstration configuration. */
export function getTraceCapacityContract(
  spanCapacity: number,
  dependencyCapacity: number,
  limits: {maxStorageBufferBindingSize: number; maxBufferSize: number}
): TraceCapacityContract {
  validateCount(spanCapacity);
  validateCount(dependencyCapacity);
  validateCount(limits.maxStorageBufferBindingSize);
  validateCount(limits.maxBufferSize);
  const spanBufferByteLength = spanCapacity * TRACE_SPAN_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH;
  const generatedDependencyCount = Math.min(
    dependencyCapacity,
    getMaximumGeneratedTraceDependencyCount(spanCapacity)
  );
  const dependencyBufferByteLength =
    generatedDependencyCount * TRACE_DEPENDENCY_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH;
  const largestSourceBufferByteLength = Math.max(spanBufferByteLength, dependencyBufferByteLength);
  const fitsStorageBufferBindingSize =
    largestSourceBufferByteLength <= limits.maxStorageBufferBindingSize;
  const fitsMaxBufferSize = largestSourceBufferByteLength <= limits.maxBufferSize;
  const maximumSpanChunkByteLength = Math.min(
    TRACE_SPAN_CHUNK_TARGET_BYTE_LENGTH,
    limits.maxStorageBufferBindingSize,
    limits.maxBufferSize
  );
  const spanChunkCount =
    maximumSpanChunkByteLength > 0
      ? Math.max(1, Math.ceil(spanBufferByteLength / maximumSpanChunkByteLength))
      : 0;
  const largestSpanChunkByteLength =
    maximumSpanChunkByteLength > 0 ? Math.min(spanBufferByteLength, maximumSpanChunkByteLength) : 0;
  const maximumDependencyChunkByteLength = Math.min(
    TRACE_DEPENDENCY_CHUNK_TARGET_BYTE_LENGTH,
    limits.maxStorageBufferBindingSize,
    limits.maxBufferSize
  );
  const dependencyChunkCount =
    maximumDependencyChunkByteLength > 0
      ? Math.max(1, Math.ceil(dependencyBufferByteLength / maximumDependencyChunkByteLength))
      : 0;
  const largestDependencyChunkByteLength =
    maximumDependencyChunkByteLength > 0
      ? Math.min(dependencyBufferByteLength, maximumDependencyChunkByteLength)
      : 0;
  const maximumAdjacencyChunkByteLength = Math.min(
    TRACE_ADJACENCY_CHUNK_TARGET_BYTE_LENGTH,
    limits.maxStorageBufferBindingSize,
    limits.maxBufferSize
  );
  const adjacencyByteLength = getMaximumTraceAdjacencyByteLength(generatedDependencyCount);
  const adjacencyChunkCount =
    maximumAdjacencyChunkByteLength > 0 && generatedDependencyCount > 0
      ? Math.max(1, Math.ceil(adjacencyByteLength / maximumAdjacencyChunkByteLength))
      : 0;
  const largestAdjacencyChunkByteLength =
    maximumAdjacencyChunkByteLength > 0 && generatedDependencyCount > 0
      ? Math.min(adjacencyByteLength, maximumAdjacencyChunkByteLength)
      : 0;
  const largestSourceChunkByteLength = Math.max(
    largestSpanChunkByteLength,
    largestDependencyChunkByteLength,
    largestAdjacencyChunkByteLength
  );
  const fitsChunkedDeviceLimits =
    maximumSpanChunkByteLength >= TRACE_SPAN_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH &&
    maximumDependencyChunkByteLength >= TRACE_DEPENDENCY_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH &&
    maximumAdjacencyChunkByteLength >= 3 * UINT32_BYTE_LENGTH;
  return Object.freeze({
    spanCapacity,
    dependencyCapacity,
    spanBufferByteLength,
    dependencyBufferByteLength,
    largestSourceBufferByteLength,
    maxStorageBufferBindingSize: limits.maxStorageBufferBindingSize,
    maxBufferSize: limits.maxBufferSize,
    fitsStorageBufferBindingSize,
    fitsMaxBufferSize,
    fitsDeviceLimits: fitsStorageBufferBindingSize && fitsMaxBufferSize,
    spanChunkCount,
    largestSpanChunkByteLength,
    dependencyChunkCount,
    largestDependencyChunkByteLength,
    adjacencyChunkCount,
    largestAdjacencyChunkByteLength,
    largestSourceChunkByteLength,
    fitsChunkedDeviceLimits
  });
}

/** Counts unique persistent buffers without conflating them with graph-owned transient storage. */
export function getTraceAllocationStats(
  buffers: readonly {byteLength: number}[]
): TraceAllocationStats {
  const uniqueBuffers = Array.from(new Set(buffers));
  let persistentByteLength = 0;
  let largestBufferByteLength = 0;
  for (const buffer of uniqueBuffers) {
    validateCount(buffer.byteLength);
    persistentByteLength += buffer.byteLength;
    largestBufferByteLength = Math.max(largestBufferByteLength, buffer.byteLength);
  }
  return Object.freeze({
    bufferCount: uniqueBuffers.length,
    persistentByteLength,
    largestBufferByteLength
  });
}

/** Publishes a stable scalar vocabulary for inspector histories and benchmark assertions. */
export function getTraceWorkloadCounters(
  props: TraceWorkloadCounterProps
): Readonly<Record<string, number>> {
  const overviewRenderer = getTraceOverviewRendererCode(props.overviewRenderer);
  const representativeOutputUpperBound =
    props.overviewRenderer === 'representative'
      ? props.overviewLaneCount * props.overviewPixelCount
      : 0;
  return Object.freeze({
    spans: props.spanCount,
    dependencies: props.dependencyCount,
    'candidate-span-batches': props.candidateSpanBatchCount,
    'candidate-span-percent': getPercentage(props.candidateSpanBatchCount, props.spanBatchCount),
    'candidate-dependency-batches': props.candidateDependencyBatchCount,
    'candidate-dependency-percent': getPercentage(
      props.candidateDependencyBatchCount,
      props.dependencyBatchCount
    ),
    'visible-spans': props.visibleSpanCount,
    'visible-span-percent': getPercentage(props.visibleSpanCount, props.spanCount),
    'visible-dependencies': props.visibleDependencyCount,
    'candidate-span-upper-bound': Math.min(
      props.spanCount,
      props.candidateSpanBatchCount * TRACE_SPAN_BATCH_CAPACITY
    ),
    'candidate-dependency-upper-bound': Math.min(
      props.dependencyCount,
      props.candidateDependencyBatchCount * TRACE_DEPENDENCY_BATCH_CAPACITY
    ),
    'actual-output-rows': props.visibleSpanCount + props.visibleDependencyCount,
    'maximum-shader-invocations': props.maximumInvocationCount ?? 0,
    'persistent-bytes': props.allocation.persistentByteLength,
    'largest-buffer-bytes': props.allocation.largestBufferByteLength,
    'collapsed-processes': props.collapsedProcessCount,
    'density-mode': Number(props.densityMode),
    'overview-renderer': overviewRenderer,
    'overview-pixel-columns': props.overviewPixelCount,
    'overview-output-upper-bound':
      props.overviewRenderer === 'density'
        ? TRACE_DISPLAY_LANE_CAPACITY * TRACE_DENSITY_BIN_COUNT
        : props.overviewRenderer === 'representative'
          ? representativeOutputUpperBound
          : props.visibleSpanCount,
    'representative-search-cells': representativeOutputUpperBound * props.overviewSpanChunkCount,
    'filter-active': Number(props.filterActive),
    'focus-active': Number(props.focusActive),
    'pick-active': Number(props.pickActive)
  });
}

/** Summarizes a bounded renderer-specific frame history using nearest-rank percentiles. */
export function getTraceOverviewFrameTimingSummary(
  samples: readonly number[]
): TraceOverviewFrameTimingSummary | null {
  if (samples.length === 0) {
    return null;
  }
  const sortedSamples = [...samples].sort((left, right) => left - right);
  return Object.freeze({
    sampleCount: samples.length,
    latestMilliseconds: samples.at(-1)!,
    p50Milliseconds: getNearestRank(sortedSamples, 0.5),
    p95Milliseconds: getNearestRank(sortedSamples, 0.95)
  });
}

/** Sums retained p50/p95 timings for every hierarchical scan node in one compiled trace graph. */
export function getTraceScanTimingSummary(
  snapshot: TraceTimingSnapshot,
  graphId: string
): TraceScanTimingSummary | null {
  const graph = snapshot.graphs.find(candidate => candidate.id === graphId);
  const scanNodes =
    graph?.nodes.filter(
      node =>
        node.id.includes('-scan-') &&
        node.gpu.sampleCount > 0 &&
        node.gpu.p50Milliseconds !== undefined &&
        node.gpu.p95Milliseconds !== undefined
    ) ?? [];
  if (scanNodes.length === 0) {
    return null;
  }
  return Object.freeze({
    nodeCount: scanNodes.length,
    sampleCount: Math.min(...scanNodes.map(node => node.gpu.sampleCount)),
    p50Milliseconds: scanNodes.reduce((sum, node) => sum + node.gpu.p50Milliseconds!, 0),
    p95Milliseconds: scanNodes.reduce((sum, node) => sum + node.gpu.p95Milliseconds!, 0)
  });
}

function getPercentage(count: number, total: number): number {
  return total > 0 ? (count / total) * 100 : 0;
}

function getTraceOverviewRendererCode(renderer: TraceOverviewRenderer): number {
  return renderer === 'density' ? 1 : renderer === 'representative' ? 2 : 0;
}

function getNearestRank(sortedValues: readonly number[], percentile: number): number {
  const index = Math.max(0, Math.ceil(sortedValues.length * percentile) - 1);
  return sortedValues[index];
}

function validateCount(value: number): void {
  // Trace capacities, device limits, and buffer lengths must be nonnegative safe integers.
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError();
  }
}

function validatePositiveCount(value: number): void {
  validateCount(value);
  if (value < 1) {
    throw new RangeError();
  }
}
