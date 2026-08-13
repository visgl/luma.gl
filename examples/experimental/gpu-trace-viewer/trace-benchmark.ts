// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  TRACE_DEPENDENCY_RECORD_WORD_LENGTH,
  TRACE_DEPENDENCY_BATCH_CAPACITY,
  TRACE_DEPENDENCY_BATCH_RECORD_WORD_LENGTH,
  TRACE_SPAN_CHUNK_TARGET_BYTE_LENGTH,
  TRACE_SPAN_RECORD_WORD_LENGTH,
  TRACE_SPAN_BATCH_CAPACITY,
  TRACE_SPAN_BATCH_RECORD_WORD_LENGTH,
  getMaximumGeneratedTraceDependencyCount,
  getMaximumTraceAdjacencyByteLength
} from './trace-data';

const UINT32_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;

/** Standard scale points used to compare trace interaction costs across devices and changes. */
export const TRACE_BENCHMARK_CAPACITIES = [250_000, 1_000_000, 4_000_000, 10_000_000] as const;

/** Stable interaction scenarios whose dispatch and allocation behavior form the 10M contract. */
export const TRACE_BENCHMARK_SCENARIOS = [
  {
    id: 'exact-expanded',
    density: false,
    collapsed: false,
    filtered: false,
    focused: false,
    picking: false
  },
  {
    id: 'exact-collapsed',
    density: false,
    collapsed: true,
    filtered: false,
    focused: false,
    picking: false
  },
  {
    id: 'exact-filtered',
    density: false,
    collapsed: false,
    filtered: true,
    focused: false,
    picking: false
  },
  {
    id: 'exact-focused',
    density: false,
    collapsed: false,
    filtered: false,
    focused: true,
    picking: false
  },
  {
    id: 'exact-picking',
    density: false,
    collapsed: false,
    filtered: false,
    focused: false,
    picking: true
  },
  {id: 'density', density: true, collapsed: false, filtered: false, focused: false, picking: false}
] as const;

export type TraceBenchmarkScenario = (typeof TRACE_BENCHMARK_SCENARIOS)[number];
export type TraceBenchmarkScenarioId = TraceBenchmarkScenario['id'];

/** Device-limit report for the example's current monolithic source allocations. */
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
  fitsChunkedDeviceLimits: boolean;
};

export type TraceDatasetPreflight = {
  spanCount: number;
  dependencyCount: number;
  estimatedSourceByteLength: number;
  minimumScanInvocationCount: number;
  requiresConfirmation: boolean;
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
  collapsedProcessCount: number;
  densityMode: boolean;
  filterActive: boolean;
  focusActive: boolean;
  pickActive: boolean;
  allocation: TraceAllocationStats;
};

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
  const fitsChunkedDeviceLimits =
    maximumSpanChunkByteLength >= TRACE_SPAN_RECORD_WORD_LENGTH * UINT32_BYTE_LENGTH &&
    dependencyBufferByteLength <= limits.maxStorageBufferBindingSize &&
    dependencyBufferByteLength <= limits.maxBufferSize;
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
    'persistent-bytes': props.allocation.persistentByteLength,
    'largest-buffer-bytes': props.allocation.largestBufferByteLength,
    'collapsed-processes': props.collapsedProcessCount,
    'density-mode': Number(props.densityMode),
    'filter-active': Number(props.filterActive),
    'focus-active': Number(props.focusActive),
    'pick-active': Number(props.pickActive)
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

function validateCount(value: number): void {
  // Trace capacities, device limits, and buffer lengths must be nonnegative safe integers.
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError();
  }
}
