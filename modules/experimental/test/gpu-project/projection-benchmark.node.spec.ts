// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';

import * as experimentalModule from '@luma.gl/experimental';
import * as projectionModule from '@luma.gl/experimental/gpu-project';
import * as benchmarkModule from '@luma.gl/experimental/gpu-project/benchmarks';
import {
  runProjectionBenchmark,
  type ProjectionBenchmarkOptions
} from '@luma.gl/experimental/gpu-project/benchmarks';
import {describe, expect, test} from 'vitest';

const BENCHMARK_OPTIONS: ProjectionBenchmarkOptions = {
  projection: (coordinates: number[]): number[] => [
    1_000 + coordinates[0] + coordinates[0] * coordinates[0] * 0.2,
    2_000 + coordinates[1] + coordinates[1] * coordinates[1] * 0.15
  ],
  bounds: [0, 0, 2, 2],
  degree: 1,
  tolerance: 0.06,
  maxDepth: 5,
  coordinateCount: 64,
  warmupIterations: 0,
  measuredIterations: 2
};

describe('CPU projection benchmarks', () => {
  test('compares provider and both adaptive-patch strategies on deterministic coordinates', () => {
    const report = runProjectionBenchmark(BENCHMARK_OPTIONS);

    expect(report.coordinateCount).toBe(64);
    expect(report.patchCount).toBeGreaterThan(1);
    expect(report.warmupIterations).toBe(0);
    expect(report.measuredIterations).toBe(2);
    expect(report.maxError).toBeLessThanOrEqual(BENCHMARK_OPTIONS.tolerance!);
    expect(report.compilationTimeMilliseconds.minimum).toBeGreaterThanOrEqual(0);
    expect(report.compilationTimeMilliseconds.maximum).toBeGreaterThanOrEqual(
      report.compilationTimeMilliseconds.median
    );
    expect(report.paths.map(path => path.strategy)).toEqual([
      'provider',
      'plan-scan',
      'plan-patch-ids'
    ]);

    for (const path of report.paths) {
      expect(path.durationMilliseconds.minimum).toBeGreaterThanOrEqual(0);
      expect(path.durationMilliseconds.percentile95).toBeGreaterThanOrEqual(
        path.durationMilliseconds.median
      );
      expect(path.coordinatesPerSecond).toBeGreaterThan(0);
      expect(Number.isFinite(path.checksum)).toBe(true);
    }
    expect(report.paths[1].checksum).toBe(report.paths[2].checksum);
    expect(Math.abs(report.paths[0].checksum - report.paths[1].checksum)).toBeLessThan(
      report.coordinateCount * BENCHMARK_OPTIONS.tolerance! * 2
    );

    const repeated = runProjectionBenchmark(BENCHMARK_OPTIONS);
    expect(repeated.paths.map(path => path.checksum)).toEqual(
      report.paths.map(path => path.checksum)
    );
  });

  test('preserves object-provider receivers and supplies mutable source-coordinate arrays', () => {
    const provider = {
      offset: 20,
      project(coordinates: number[]): number[] {
        const projected = [coordinates[0] + this.offset, coordinates[1] - this.offset];
        coordinates[0] = Number.NaN;
        return projected;
      }
    };
    const report = runProjectionBenchmark({
      projection: provider,
      bounds: [0, 0, 2, 2],
      degree: 1,
      tolerance: 1e-5,
      coordinateCount: 8,
      warmupIterations: 0,
      measuredIterations: 1
    });

    expect(report.paths[1].checksum).toBeCloseTo(report.paths[0].checksum, 5);
    expect(report.paths[2].checksum).toBeCloseTo(report.paths[0].checksum, 5);
  });

  test('rejects invalid benchmark dimensions without exporting helpers from the root module', () => {
    expect(() => runProjectionBenchmark({...BENCHMARK_OPTIONS, coordinateCount: 0})).toThrow(
      /coordinateCount/
    );
    expect(() => runProjectionBenchmark({...BENCHMARK_OPTIONS, coordinateCount: 1.5})).toThrow(
      /coordinateCount/
    );
    expect(() => runProjectionBenchmark({...BENCHMARK_OPTIONS, warmupIterations: -1})).toThrow(
      /warmupIterations/
    );
    expect(() => runProjectionBenchmark({...BENCHMARK_OPTIONS, measuredIterations: 0})).toThrow(
      /measuredIterations/
    );
  });

  test('isolates benchmark helpers behind their optional nested package entry point', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
    ) as {exports?: Record<string, Record<string, string>>};

    expect(packageJson.exports?.['./gpu-project/benchmarks']).toEqual({
      import: './dist/gpu-project/benchmarks.js',
      require: './dist/gpu-project/benchmarks.cjs',
      types: './dist/gpu-project/benchmarks.d.ts'
    });
    for (const exportName of ['runProjectionBenchmark', 'runGPUProjectionBenchmark'] as const) {
      expect(benchmarkModule[exportName]).toBeTypeOf('function');
      expect(exportName in experimentalModule).toBe(false);
      expect(exportName in projectionModule).toBe(false);
    }
  });
});
