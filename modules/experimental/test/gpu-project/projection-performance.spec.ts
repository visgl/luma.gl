// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {runProjectionProgramBenchmark} from '@luma.gl/experimental/gpu-project/benchmarks';
import {
  makePerformanceOptions,
  parsePerformanceSweep,
  performanceFixtures
} from './projection-performance-fixtures';

const rowCounts = parsePerformanceSweep(import.meta.env.VITE_LUPROJ_SWEEP_ROWS, [32]);
const consumerCounts = parsePerformanceSweep(import.meta.env.VITE_LUPROJ_SWEEP_CONSUMERS, [1, 4]);
const measured = import.meta.env.VITE_LUPROJ_SWEEP_ROWS !== undefined;

for (const fixture of performanceFixtures) {
  for (const rowCount of rowCounts) {
    for (const consumerCount of consumerCounts) {
      it(`measures ${fixture.id}/${rowCount} rows/${consumerCount} consumers at equal precision and accuracy`, async context => {
        const device = await getWebGPUTestDevice();
        if (!device) context.skip();
        if (device.info.gpu === 'software' || device.info.gpuType === 'cpu' || device.info.fallback)
          context.skip();
        const report = await runProjectionProgramBenchmark(device, {
          ...makePerformanceOptions(fixture, rowCount, consumerCount),
          // Default to production-like pass coalescing. Optional instrumentation is a separate run.
          gpuTiming: import.meta.env.VITE_LUPROJ_SWEEP_GPU_TIMING === 'true',
          warmupIterations: measured ? 2 : 0,
          measuredIterations: measured ? 5 : 1
        });
        expect(report.comparison).toBe('equal-error-budget');
        expect(report.consumerCount).toBe(consumerCount);
        expect(report.cpuProvider).toBe('@math.gl/proj4 Proj4Projection.project (proj4js)');
        expect(report.cpuPaths).toHaveLength(2);
        for (const path of report.cpuPaths) {
          expect(path.validRows).toBe(rowCount + 9);
          expect(path.projectionsPerRow).toBe(path.mode === 'inline' ? consumerCount : 1);
          expect(path.outputEncoding).toBe('binary64');
        }
        expect(report.coordinateCount).toBe(rowCount + 11);
        expect(report.paths).toHaveLength(4);
        for (const path of report.paths) {
          expect(path.validRows).toBe(rowCount + 9);
          expect(path.maximumObservedError).toBeLessThanOrEqual(0.001);
          const cpuPath = report.cpuPaths.find(candidate => candidate.mode === path.mode)!;
          expect(path.residentSpeedupOverCPU).toBe(
            path.encodeAndSynchronizedTimeMilliseconds.median > 0 &&
              cpuPath.durationMilliseconds.median > 0
              ? cpuPath.durationMilliseconds.median /
                  path.encodeAndSynchronizedTimeMilliseconds.median
              : null
          );
          expect(path.metadata.arithmetic).toBe('double-single');
          expect(path.adaptiveStages).toHaveLength(1);
          expect(path.dispatchCount).toBe(consumerCount + (path.mode === 'materialized' ? 1 : 0));
          expect(path.projectionsPerRow).toBe(path.mode === 'materialized' ? 1 : consumerCount);
          expect(path.bufferByteLength).toBe(
            report.coordinateCount * (16 + 20 * consumerCount) +
              path.parameterByteLength +
              path.intermediateByteLength
          );
          expect(path.intermediateByteLength).toBe(
            path.mode === 'materialized' ? report.coordinateCount * 20 : 0
          );
        }
        expect(report.paths[0].adaptiveStages[0].patchCount).toBeGreaterThan(
          report.paths[2].adaptiveStages[0].patchCount
        );
        if (measured)
          console.info(
            `PROJECTION_PERFORMANCE_SWEEP ${JSON.stringify({schemaVersion: 2, capturedAt: new Date().toISOString(), browser: navigator.userAgent, fixture: fixture.id, bounds: fixture.bounds, rowCount, report})}`
          );
      }, 180000);
    }
  }
}
