// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {runProjectionRoutingBenchmark} from '@luma.gl/experimental/gpu-project/benchmarks';
import {compileProjectionPlan, type ProjectionCoordinates} from '@luma.gl/experimental/gpu-project';
import {
  makePerformanceOptions,
  performanceFixtures,
  parsePerformanceSweep
} from './projection-performance-fixtures';

const measured = import.meta.env.VITE_LUPROJ_ROUTING_ROWS !== undefined;
const rowCounts = parsePerformanceSweep(import.meta.env.VITE_LUPROJ_ROUTING_ROWS, [32]);
const consumerCounts = parsePerformanceSweep(import.meta.env.VITE_LUPROJ_ROUTING_CONSUMERS, [1, 4]);
for (const fixture of performanceFixtures.filter(candidate => candidate.id !== 'utm-local')) {
  for (const rowCount of rowCounts)
    for (const consumerCount of consumerCounts) {
      it(`isolates ${fixture.id} routing/${rowCount}/${consumerCount} at fixed quadratic arithmetic`, async context => {
        const device = await getWebGPUTestDevice();
        if (
          !device ||
          device.info.gpu === 'software' ||
          device.info.gpuType === 'cpu' ||
          device.info.fallback
        )
          context.skip();
        const options = makePerformanceOptions(fixture, rowCount, consumerCount);
        const program = options.variants[0].createProgram();
        if (program.operations.length !== 1 || program.operations[0].type !== 'adaptive')
          throw new Error('routing fixture must expose one adaptive stage');
        const report = await runProjectionRoutingBenchmark(device, {
          ...options,
          plan: program.operations[0].plan,
          maximumError: 0.001,
          workloadKey: `${fixture.id}-routing-v1/${rowCount}/${consumerCount}`,
          environment: navigator.userAgent,
          gpuTiming: import.meta.env.VITE_LUPROJ_ROUTING_GPU_TIMING === 'true',
          warmupIterations: measured ? 2 : 0,
          measuredIterations: measured ? 5 : 1
        });
        expect(report.program.comparison).toBe('equal-error-budget');
        expect(report.program.cpuPaths).toHaveLength(12);
        if (measured)
          console.info(
            `PROJECTION_ROUTING_PERFORMANCE ${JSON.stringify({schemaVersion: 1, capturedAt: new Date().toISOString(), revision: import.meta.env.VITE_LUPROJ_REVISION ?? 'unspecified', fixture: fixture.id, rowCount, tolerance: 0.001, report})}`
          );
      }, 180000);
    }
}
for (const rowCount of rowCounts)
  for (const consumerCount of consumerCounts)
    for (const tolerance of [0.01, 0.0001]) {
      it(`isolates fixed-degree routing/${rowCount}/${consumerCount}/${tolerance}`, async context => {
        const device = await getWebGPUTestDevice();
        if (
          !device ||
          device.info.gpu === 'software' ||
          device.info.gpuType === 'cpu' ||
          device.info.fallback
        )
          context.skip();
        const projection = (position: number[]) => [Math.sin(position[0]), Math.cos(position[1])];
        const plan = compileProjectionPlan({
          projection,
          bounds: [-2, -2, 2, 2],
          precision: 'double-single',
          degree: 2,
          tolerance
        });
        const coordinates: ProjectionCoordinates[] = Array.from(
          {length: rowCount},
          (_value, index) => [
            -2 + (4 * (index + 0.5)) / rowCount,
            -2 + 4 * ((index * 0.6180339887498949) % 1)
          ]
        );
        // Every fitted corner, including shared seams, and invalid inputs are part of qualification.
        for (const patch of plan.patches)
          coordinates.push([patch.bounds[0], patch.bounds[1]], [patch.bounds[2], patch.bounds[3]]);
        coordinates.push([NaN, 0], [3, 0]);
        const report = await runProjectionRoutingBenchmark(device, {
          plan,
          coordinates,
          maximumError: tolerance,
          workloadKey: `routing-sine-cosine-v1/${rowCount}/${consumerCount}/${tolerance}`,
          environment: navigator.userAgent,
          oracle: position => ({
            position: [Math.sin(position[0]), Math.cos(position[1])],
            valid: position.every(value => Number.isFinite(value) && value >= -2 && value <= 2)
          }),
          consumerCount,
          gpuTiming: import.meta.env.VITE_LUPROJ_ROUTING_GPU_TIMING === 'true',
          warmupIterations: measured ? 2 : 0,
          measuredIterations: measured ? 5 : 1
        });
        expect(report.routing.map(path => path.strategy)).toEqual(['scan', 'indexed']);
        expect(report.indexByteLength).toBeGreaterThan(0);
        expect(report.program.paths.every(path => path.maximumObservedError <= tolerance)).toBe(
          true
        );
        if (measured)
          console.info(
            `PROJECTION_ROUTING_PERFORMANCE ${JSON.stringify({schemaVersion: 1, capturedAt: new Date().toISOString(), revision: import.meta.env.VITE_LUPROJ_REVISION ?? 'unspecified', fixture: 'sine-cosine-routing-stress-v1', rowCount, tolerance, report})}`
          );
      }, 180000);
    }
