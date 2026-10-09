// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {projectionEngine} from '@math.gl/projection';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  planCRSProjection,
  createCRSProjectionCPUBenchmarks
} from '@luma.gl/experimental/gpu-project/crs';
import {runProjectionProgramBenchmark} from '@luma.gl/experimental/gpu-project/benchmarks';
import type {ProjectionBounds} from '@luma.gl/experimental/gpu-project';
import {makeConicCRS, geographicCRS, getConicOracleDefinition} from './projection-crs-fixtures';
import {makePerformanceCoordinates, parsePerformanceSweep} from './projection-performance-fixtures';

const rowCounts = parsePerformanceSweep(import.meta.env.VITE_LUPROJ_CONIC_ROWS, [32]);
const measured = import.meta.env.VITE_LUPROJ_CONIC_ROWS !== undefined;
const domains: {id: string; bounds: ProjectionBounds}[] = [
  {id: 'local', bounds: [-72, 41, -71, 42]},
  {id: 'regional', bounds: [-100, 25, -60, 60]}
];
for (const method of ['lambert-1sp', 'lambert-2sp', 'albers'] as const) {
  for (const domain of domains) {
    for (const rowCount of rowCounts) {
      it(`measures ${method}/${domain.id}/${rowCount} at a shared 20-metre output budget`, async context => {
        const device = await getWebGPUTestDevice();
        if (
          !device ||
          device.info.gpu === 'software' ||
          device.info.gpuType === 'cpu' ||
          device.info.fallback
        )
          context.skip();
        const provider = projectionEngine.createProjection({
          from: 'EPSG:4326',
          to: getConicOracleDefinition(method)
        });
        // Both variants are evaluated only on their common domain. Domain-rejection behavior is
        // covered separately: the native geographic footprint is larger than the fitted rectangle.
        const coordinates = makePerformanceCoordinates(domain.bounds, rowCount).slice(0, -2);
        coordinates.push([NaN, 0]);
        const providerLabel = '@math.gl/projection 5.0.0-alpha.15 TypeScript';
        const report = await runProjectionProgramBenchmark(device, {
          coordinates,
          oracleLabel: providerLabel,
          oracle: position => {
            if (!position.every(Number.isFinite)) return {position: [0, 0], valid: false};
            const projected = provider.project([...position]);
            return {position: [projected[0], projected[1]], valid: true};
          },
          cpuVariants: createCRSProjectionCPUBenchmarks({
            projection: provider,
            provider: providerLabel,
            isValid: position => position.every(Number.isFinite)
          }),
          variants: (['double-single', 'float32'] as const).map(projectionArithmetic => ({
            id: projectionArithmetic === 'float32' ? 'native-float32' : 'adaptive-double-single',
            maximumError: 20,
            createProgram: () => {
              const result = planCRSProjection({
                from: geographicCRS,
                to: makeConicCRS(method),
                projectionArithmetic,
                bounds: domain.bounds,
                tolerance: 10,
                degree: 3,
                allowAdaptive: projectionArithmetic === 'double-single'
              });
              if (result.status !== 'ready') throw new Error(JSON.stringify(result.reasons));
              expect(result.strategy).toBe(
                projectionArithmetic === 'float32' ? 'native' : 'adaptive'
              );
              return result.program;
            }
          })),
          gpuTiming: false,
          warmupIterations: measured ? 2 : 0,
          measuredIterations: measured ? 5 : 1
        });
        expect(report.comparison).toBe('equal-error-budget');
        for (const path of report.paths) expect(path.validRows).toBe(rowCount + 9);
        if (measured)
          console.info(
            `PROJECTION_CONIC_PERFORMANCE ${JSON.stringify({
              schemaVersion: 1,
              capturedAt: new Date().toISOString(),
              browser: navigator.userAgent,
              method,
              domain: domain.id,
              bounds: domain.bounds,
              rowCount,
              report
            })}`
          );
      }, 180000);
    }
  }
}
