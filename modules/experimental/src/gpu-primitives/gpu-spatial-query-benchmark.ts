// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CommandEncoder, Device} from '@luma.gl/core';
import type {
  GPUCommandGraphEncoding,
  GPUCommandGraphNodeTiming,
  GPUCommandGraphTimingReport
} from './gpu-command-graph';

/** Spatial query implementation compared by {@link runGPUSpatialQueryBenchmark}. */
export type GPUSpatialBenchmarkStrategy = 'scan' | 'grid' | 'bvh';

/** Cost category assigned to one command-graph node by a benchmark adapter. */
export type GPUSpatialBenchmarkPhase = 'build' | 'refit' | 'query' | 'refinement';

/** Stable-ID result and observable work returned by one benchmark path. */
export type GPUSpatialBenchmarkResult = {
  ids: readonly number[];
  overflow?: boolean;
  candidateCount?: number;
  visitedCount?: number;
};

/** One scan, grid, or BVH adapter measured by the shared harness. */
export type GPUSpatialBenchmarkPath = {
  id: string;
  strategy: GPUSpatialBenchmarkStrategy;
  /** Caller-owned and graph-owned bytes required by this path. */
  memoryByteLength: number;
  /** Encodes one identical query without submission. */
  encode: (commandEncoder: CommandEncoder) => GPUCommandGraphEncoding;
  /** Reads the most recently encoded exact stable-ID result. */
  readResult: () => Promise<GPUSpatialBenchmarkResult>;
  /** Assigns graph nodes to separately reported spatial cost phases. */
  getNodePhase: (nodeId: string) => GPUSpatialBenchmarkPhase | undefined;
};

/** Configuration for a correctness-gated scan/grid/BVH benchmark. */
export type GPUSpatialQueryBenchmarkProps = {
  id?: string;
  paths: readonly GPUSpatialBenchmarkPath[];
  /** CPU-oracle stable IDs shared by every path. Order is ignored; duplicates are not. */
  expectedIds: readonly number[];
  warmupIterations?: number;
  measuredIterations?: number;
  /** Query reuse counts used to amortize build/refit cost. */
  reuseCounts?: readonly number[];
};

/** Distribution summary for repeated CPU or GPU durations. */
export type GPUSpatialBenchmarkDistribution = {
  minimum: number;
  median: number;
  percentile95: number;
  maximum: number;
};

/** Amortized per-query GPU cost for one index reuse count. */
export type GPUSpatialBenchmarkAmortizedCost = {
  reuseCount: number;
  gpuTimeMilliseconds: number;
};

/** Correctness, work, memory, and timing report for one strategy. */
export type GPUSpatialBenchmarkPathReport = {
  id: string;
  strategy: GPUSpatialBenchmarkStrategy;
  memoryByteLength: number;
  resultCount: number;
  candidateCount?: number;
  visitedCount?: number;
  cpuEncodeTimeMilliseconds: GPUSpatialBenchmarkDistribution;
  gpuTimeMilliseconds?: GPUSpatialBenchmarkDistribution;
  phases: Partial<Record<GPUSpatialBenchmarkPhase, GPUSpatialBenchmarkDistribution>>;
  amortizedGPUTime: GPUSpatialBenchmarkAmortizedCost[];
};

/** Reproducible metadata and per-strategy output from one benchmark run. */
export type GPUSpatialQueryBenchmarkReport = {
  id: string;
  timestampQueries: boolean;
  warmupIterations: number;
  measuredIterations: number;
  expectedResultCount: number;
  paths: GPUSpatialBenchmarkPathReport[];
};

const DEFAULT_WARMUP_ITERATIONS = 3;
const DEFAULT_MEASURED_ITERATIONS = 20;
const DEFAULT_REUSE_COUNTS = [1, 10, 100] as const;

/**
 * Runs scan, grid, and BVH adapters with one correctness oracle and measurement protocol.
 *
 * The harness owns submission and optional timestamp query sets, but not data generation,
 * command graphs, result buffers, or readback. It rejects overflow and result mismatch before
 * reporting timings so a faster incomplete path cannot appear to win.
 */
export async function runGPUSpatialQueryBenchmark(
  device: Device,
  props: GPUSpatialQueryBenchmarkProps
): Promise<GPUSpatialQueryBenchmarkReport> {
  const id = props.id ?? 'gpu-spatial-query-benchmark';
  const warmupIterations = props.warmupIterations ?? DEFAULT_WARMUP_ITERATIONS;
  const measuredIterations = props.measuredIterations ?? DEFAULT_MEASURED_ITERATIONS;
  const reuseCounts = props.reuseCounts ?? DEFAULT_REUSE_COUNTS;
  validateBenchmarkProps(id, props.paths, warmupIterations, measuredIterations, reuseCounts);
  const expectedIds = getSortedIds(props.expectedIds);
  const timestampQueries = device.features.has('timestamp-query');
  const pathReports: GPUSpatialBenchmarkPathReport[] = [];

  for (const path of props.paths) {
    let timestampedNodeCount = 0;
    for (let iteration = 0; iteration < warmupIterations; iteration++) {
      const encoding = encodeAndSubmit(device, path, `${id}-${path.id}-warmup-${iteration}`);
      timestampedNodeCount = encoding.stats.nodes.filter(node => node.type !== 'copy').length;
    }
    const initialResult = await path.readResult();
    validateResult(id, path, initialResult, expectedIds);

    const timingReports: GPUCommandGraphTimingReport[] = [];
    for (let iteration = 0; iteration < measuredIterations; iteration++) {
      const querySet =
        timestampQueries && timestampedNodeCount > 0
          ? device.createQuerySet({
              id: `${id}-${path.id}-timestamps-${iteration}`,
              type: 'timestamp',
              count: timestampedNodeCount * 2
            })
          : undefined;
      const commandEncoder = device.createCommandEncoder({
        id: `${id}-${path.id}-measured-${iteration}`,
        timeProfilingQuerySet: querySet
      });
      try {
        const encoding = path.encode(commandEncoder);
        device.submit(commandEncoder.finish());
        timingReports.push(await encoding.readTimings());
      } catch (error) {
        commandEncoder.destroy();
        throw error;
      } finally {
        querySet?.destroy();
      }
    }
    const finalResult = await path.readResult();
    validateResult(id, path, finalResult, expectedIds);
    pathReports.push(
      makePathReport(path, finalResult, timingReports, reuseCounts, expectedIds.length)
    );
  }

  return {
    id,
    timestampQueries,
    warmupIterations,
    measuredIterations,
    expectedResultCount: expectedIds.length,
    paths: pathReports
  };
}

function encodeAndSubmit(
  device: Device,
  path: GPUSpatialBenchmarkPath,
  id: string
): GPUCommandGraphEncoding {
  const commandEncoder = device.createCommandEncoder({id});
  try {
    const encoding = path.encode(commandEncoder);
    device.submit(commandEncoder.finish());
    return encoding;
  } catch (error) {
    commandEncoder.destroy();
    throw error;
  }
}

function makePathReport(
  path: GPUSpatialBenchmarkPath,
  result: GPUSpatialBenchmarkResult,
  timingReports: readonly GPUCommandGraphTimingReport[],
  reuseCounts: readonly number[],
  resultCount: number
): GPUSpatialBenchmarkPathReport {
  const cpuSamples = timingReports.map(report => report.cpuEncodeTimeMilliseconds);
  const gpuSamples = timingReports.flatMap(report =>
    report.gpuTimeMilliseconds === undefined ? [] : [report.gpuTimeMilliseconds]
  );
  const phases: Partial<Record<GPUSpatialBenchmarkPhase, GPUSpatialBenchmarkDistribution>> = {};
  for (const phase of ['build', 'refit', 'query', 'refinement'] as const) {
    const samples = timingReports.flatMap(report => {
      const phaseNodes = report.nodes.filter(node => path.getNodePhase(node.id) === phase);
      return getSummedGPUTime(phaseNodes);
    });
    if (samples.length > 0) phases[phase] = summarizeGPUSpatialBenchmarkSamples(samples);
  }
  return {
    id: path.id,
    strategy: path.strategy,
    memoryByteLength: path.memoryByteLength,
    resultCount,
    ...(result.candidateCount === undefined ? {} : {candidateCount: result.candidateCount}),
    ...(result.visitedCount === undefined ? {} : {visitedCount: result.visitedCount}),
    cpuEncodeTimeMilliseconds: summarizeGPUSpatialBenchmarkSamples(cpuSamples),
    ...(gpuSamples.length > 0
      ? {gpuTimeMilliseconds: summarizeGPUSpatialBenchmarkSamples(gpuSamples)}
      : {}),
    phases,
    amortizedGPUTime: makeAmortizedCosts(phases, reuseCounts)
  };
}

function getSummedGPUTime(nodes: readonly GPUCommandGraphNodeTiming[]): number[] {
  if (nodes.length === 0 || nodes.some(node => node.gpuTimeMilliseconds === undefined)) return [];
  return [nodes.reduce((sum, node) => sum + node.gpuTimeMilliseconds!, 0)];
}

function makeAmortizedCosts(
  phases: Partial<Record<GPUSpatialBenchmarkPhase, GPUSpatialBenchmarkDistribution>>,
  reuseCounts: readonly number[]
): GPUSpatialBenchmarkAmortizedCost[] {
  const setupTime = (phases.build?.median ?? 0) + (phases.refit?.median ?? 0);
  const queryTime = (phases.query?.median ?? 0) + (phases.refinement?.median ?? 0);
  if (setupTime === 0 && queryTime === 0) return [];
  return reuseCounts.map(reuseCount => ({
    reuseCount,
    gpuTimeMilliseconds: setupTime / reuseCount + queryTime
  }));
}

/** Summarizes finite samples using nearest-rank median and 95th percentile values. */
export function summarizeGPUSpatialBenchmarkSamples(
  samples: readonly number[]
): GPUSpatialBenchmarkDistribution {
  if (samples.length === 0 || samples.some(sample => !Number.isFinite(sample) || sample < 0)) {
    throw new Error('GPU spatial benchmark samples must contain finite non-negative values');
  }
  const sortedSamples = [...samples].sort((left, right) => left - right);
  return {
    minimum: sortedSamples[0],
    median: getPercentile(sortedSamples, 0.5),
    percentile95: getPercentile(sortedSamples, 0.95),
    maximum: sortedSamples[sortedSamples.length - 1]
  };
}

function getPercentile(sortedSamples: readonly number[], percentile: number): number {
  return sortedSamples[Math.ceil(percentile * sortedSamples.length) - 1];
}

function validateResult(
  benchmarkId: string,
  path: GPUSpatialBenchmarkPath,
  result: GPUSpatialBenchmarkResult,
  expectedIds: readonly number[]
): void {
  if (result.overflow) {
    throw new Error(`${benchmarkId} path "${path.id}" overflowed; timing would be incomplete`);
  }
  const actualIds = getSortedIds(result.ids);
  if (
    actualIds.length !== expectedIds.length ||
    actualIds.some((value, index) => value !== expectedIds[index])
  ) {
    throw new Error(`${benchmarkId} path "${path.id}" does not match the shared CPU oracle`);
  }
}

function getSortedIds(ids: readonly number[]): number[] {
  return [...ids].sort((left, right) => left - right);
}

function validateBenchmarkProps(
  id: string,
  paths: readonly GPUSpatialBenchmarkPath[],
  warmupIterations: number,
  measuredIterations: number,
  reuseCounts: readonly number[]
): void {
  const strategies = new Set(paths.map(path => path.strategy));
  const pathIds = new Set(paths.map(path => path.id));
  if (paths.length !== 3 || strategies.size !== 3) {
    throw new Error(`${id} requires exactly one scan, grid, and bvh path`);
  }
  if (pathIds.size !== paths.length) {
    throw new Error(`${id} path IDs must be unique`);
  }
  if (
    !Number.isSafeInteger(warmupIterations) ||
    warmupIterations < 1 ||
    !Number.isSafeInteger(measuredIterations) ||
    measuredIterations < 1
  ) {
    throw new Error(`${id} iteration counts must be positive safe integers`);
  }
  if (
    reuseCounts.length === 0 ||
    reuseCounts.some(reuseCount => !Number.isSafeInteger(reuseCount) || reuseCount < 1)
  ) {
    throw new Error(`${id} reuse counts must be positive safe integers`);
  }
  for (const path of paths) {
    if (!path.id || !Number.isSafeInteger(path.memoryByteLength) || path.memoryByteLength < 0) {
      throw new Error(`${id} paths require IDs and non-negative memory byte lengths`);
    }
  }
}
