// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  compileProjectionPlan,
  evaluateProjectionPlan,
  findProjectionPatch
} from './projection-plan';
import type {CompileProjectionPlanOptions, ProjectionCoordinates, ProjectionPlan} from './types';

/** Repeated-duration distribution in milliseconds, using nearest-rank percentiles. */
export type ProjectionBenchmarkDistribution = {
  minimum: number;
  median: number;
  percentile95: number;
  maximum: number;
};

/** CPU implementation evaluated against the same deterministic source coordinates. */
export type ProjectionBenchmarkStrategy = 'provider' | 'plan-scan' | 'plan-patch-ids';

/** Timing, throughput, and observable output from one CPU implementation. */
export type ProjectionBenchmarkPathReport = {
  strategy: ProjectionBenchmarkStrategy;
  durationMilliseconds: ProjectionBenchmarkDistribution;
  coordinatesPerSecond: number;
  checksum: number;
};

/** Projection compiler options and controls shared by CPU and WebGPU benchmarks. */
export type ProjectionBenchmarkOptions = CompileProjectionPlanOptions & {
  /** Number of deterministic source rows evaluated by every implementation. Defaults to 16,384. */
  coordinateCount?: number;
  /** Untimed iterations before each measured implementation. Defaults to two. */
  warmupIterations?: number;
  /** Timed iterations used for nearest-rank distributions. Defaults to five. */
  measuredIterations?: number;
};

/** Reproducible compilation and CPU-evaluation benchmark results. */
export type ProjectionBenchmarkReport = {
  coordinateCount: number;
  patchCount: number;
  warmupIterations: number;
  measuredIterations: number;
  maxError: number;
  compilationTimeMilliseconds: ProjectionBenchmarkDistribution;
  paths: ProjectionBenchmarkPathReport[];
};

/** @internal Shared deterministic source data consumed by the WebGPU companion benchmark. */
export type ProjectionBenchmarkContext = {
  plan: ProjectionPlan;
  coordinates: [number, number][];
  patchIds: Uint32Array;
  report: ProjectionBenchmarkReport;
};

const DEFAULT_COORDINATE_COUNT = 16_384;
const DEFAULT_WARMUP_ITERATIONS = 2;
const DEFAULT_MEASURED_ITERATIONS = 5;
const GOLDEN_RATIO_FRACTION = 0.6180339887498949;

/**
 * Benchmarks provider calls, adaptive-plan compilation, patch scans, and explicit patch lookup.
 *
 * Every evaluation path receives the same deterministic in-bounds coordinates. Source generation
 * and patch-ID assignment occur outside the measured evaluation loops, and returned checksums keep
 * calculated values observable without making output allocation part of the comparison.
 */
export function runProjectionBenchmark(
  options: ProjectionBenchmarkOptions
): ProjectionBenchmarkReport {
  return prepareProjectionBenchmark(options).report;
}

/** @internal Builds one CPU report and retains its exact source rows and compiled plan. */
export function prepareProjectionBenchmark(
  options: ProjectionBenchmarkOptions
): ProjectionBenchmarkContext {
  const coordinateCount = options.coordinateCount ?? DEFAULT_COORDINATE_COUNT;
  const warmupIterations = options.warmupIterations ?? DEFAULT_WARMUP_ITERATIONS;
  const measuredIterations = options.measuredIterations ?? DEFAULT_MEASURED_ITERATIONS;

  if (!Number.isSafeInteger(coordinateCount) || coordinateCount < 1) {
    throw new Error('projection benchmark coordinateCount must be a positive safe integer');
  }
  if (!Number.isSafeInteger(warmupIterations) || warmupIterations < 0) {
    throw new Error('projection benchmark warmupIterations must be a non-negative safe integer');
  }
  if (!Number.isSafeInteger(measuredIterations) || measuredIterations < 1) {
    throw new Error('projection benchmark measuredIterations must be a positive safe integer');
  }

  let plan: ProjectionPlan | undefined;
  for (let iteration = 0; iteration < warmupIterations; iteration++) {
    plan = compileProjectionPlan(options);
  }
  const compilationSamples: number[] = [];
  for (let iteration = 0; iteration < measuredIterations; iteration++) {
    const startTime = getProjectionBenchmarkTime();
    plan = compileProjectionPlan(options);
    compilationSamples.push(getProjectionBenchmarkTime() - startTime);
  }

  // At least one measured iteration is required, so a compiled plan always exists here.
  const compiledPlan = plan!;
  const coordinates = createProjectionBenchmarkCoordinates(compiledPlan, coordinateCount);
  const patchIds = Uint32Array.from(coordinates, coordinate =>
    findProjectionPatch(compiledPlan, coordinate)
  );
  const provider =
    typeof options.projection === 'function'
      ? options.projection
      : options.projection.project.bind(options.projection);
  const paths: ProjectionBenchmarkPathReport[] = [
    measureProjectionBenchmarkPath(
      'provider',
      coordinates,
      warmupIterations,
      measuredIterations,
      coordinate => provider([coordinate[0], coordinate[1]])
    ),
    measureProjectionBenchmarkPath(
      'plan-scan',
      coordinates,
      warmupIterations,
      measuredIterations,
      coordinate => evaluateProjectionPlan(compiledPlan, coordinate)
    ),
    measureProjectionBenchmarkPath(
      'plan-patch-ids',
      coordinates,
      warmupIterations,
      measuredIterations,
      (coordinate, coordinateIndex) =>
        evaluateProjectionPlan(compiledPlan, coordinate, patchIds[coordinateIndex])
    )
  ];

  return {
    plan: compiledPlan,
    coordinates,
    patchIds,
    report: {
      coordinateCount,
      patchCount: compiledPlan.patches.length,
      warmupIterations,
      measuredIterations,
      maxError: compiledPlan.maxError,
      compilationTimeMilliseconds: summarizeProjectionBenchmarkSamples(compilationSamples),
      paths
    }
  };
}

/** @internal Returns a monotonic timer when available, with a portable Date fallback. */
export function getProjectionBenchmarkTime(): number {
  return globalThis.performance?.now() ?? Date.now();
}

/** @internal Summarizes validated millisecond samples without interpolating observed timings. */
export function summarizeProjectionBenchmarkSamples(
  samples: readonly number[]
): ProjectionBenchmarkDistribution {
  if (samples.length === 0 || samples.some(sample => !Number.isFinite(sample) || sample < 0)) {
    throw new Error('projection benchmark samples must contain finite non-negative durations');
  }
  const sortedSamples = [...samples].sort((left, right) => left - right);
  return {
    minimum: sortedSamples[0],
    median: sortedSamples[Math.ceil(sortedSamples.length * 0.5) - 1],
    percentile95: sortedSamples[Math.ceil(sortedSamples.length * 0.95) - 1],
    maximum: sortedSamples[sortedSamples.length - 1]
  };
}

function createProjectionBenchmarkCoordinates(
  plan: ProjectionPlan,
  coordinateCount: number
): [number, number][] {
  const [minimumX, minimumY, maximumX, maximumY] = plan.bounds;
  return Array.from({length: coordinateCount}, (_, coordinateIndex) => {
    const horizontalFraction = (coordinateIndex + 0.5) / coordinateCount;
    const verticalFraction = ((coordinateIndex + 1) * GOLDEN_RATIO_FRACTION) % 1;
    return [
      minimumX + (maximumX - minimumX) * horizontalFraction,
      minimumY + (maximumY - minimumY) * verticalFraction
    ];
  });
}

function measureProjectionBenchmarkPath(
  strategy: ProjectionBenchmarkStrategy,
  coordinates: [number, number][],
  warmupIterations: number,
  measuredIterations: number,
  project: (coordinate: ProjectionCoordinates, coordinateIndex: number) => readonly number[]
): ProjectionBenchmarkPathReport {
  for (let iteration = 0; iteration < warmupIterations; iteration++) {
    evaluateProjectionBenchmarkCoordinates(coordinates, project);
  }

  const samples: number[] = [];
  let checksum = 0;
  for (let iteration = 0; iteration < measuredIterations; iteration++) {
    const startTime = getProjectionBenchmarkTime();
    checksum = evaluateProjectionBenchmarkCoordinates(coordinates, project);
    samples.push(getProjectionBenchmarkTime() - startTime);
  }
  const durationMilliseconds = summarizeProjectionBenchmarkSamples(samples);
  return {
    strategy,
    durationMilliseconds,
    coordinatesPerSecond: getProjectionBenchmarkThroughput(
      coordinates.length,
      durationMilliseconds.median
    ),
    checksum
  };
}

function evaluateProjectionBenchmarkCoordinates(
  coordinates: [number, number][],
  project: (coordinate: ProjectionCoordinates, coordinateIndex: number) => readonly number[]
): number {
  let checksum = 0;
  for (let coordinateIndex = 0; coordinateIndex < coordinates.length; coordinateIndex++) {
    const projected = project(coordinates[coordinateIndex], coordinateIndex);
    checksum += projected[0] + projected[1];
  }
  return checksum;
}

/** @internal Converts milliseconds to rows per second without serializing infinite rates. */
export function getProjectionBenchmarkThroughput(
  coordinateCount: number,
  durationMilliseconds: number
): number {
  return (coordinateCount * 1000) / Math.max(durationMilliseconds, Number.EPSILON);
}
