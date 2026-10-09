// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  prepareCRSProjection,
  ProjectionTableTransform
} from '@luma.gl/experimental/gpu-project/crs';
import {
  runProjectionProgramBenchmark,
  runProjectionTableBenchmark
} from '@luma.gl/experimental/gpu-project/benchmarks';
import {makeVisualizationFixture} from './projection-visualization-fixtures';
import {makePerformanceCoordinates} from './projection-performance-fixtures';

for (const method of ['gnom', 'ortho'] as const) {
  for (const inverse of [false, true]) {
    for (const center of [
      [0, 0],
      [30, -45]
    ] as const) {
      it(`qualifies ${method}/${inverse ? 'inverse' : 'forward'}/${center} in inline consumers and production tables`, async context => {
        const device = await getWebGPUTestDevice();
        if (
          !device ||
          device.info.gpu === 'software' ||
          device.info.gpuType === 'cpu' ||
          device.info.fallback
        )
          context.skip();
        const fixture = makeVisualizationFixture(method, inverse, center);
        const coordinates = makePerformanceCoordinates(fixture.bounds, 64);
        coordinates.push(
          ...(inverse
            ? ([
                [fixture.radius * 1.01, 0],
                [fixture.radius, fixture.radius]
              ] as const)
            : ([
                [89.999, 0],
                [90, 0],
                [90.001, 0],
                [120, 0],
                [-180, 0]
              ] as const))
        );
        const maximumError = fixture.tolerance * 2;
        const report = await runProjectionProgramBenchmark(device, {
          coordinates,
          oracle: position => ({
            valid: fixture.isValid(position),
            position: fixture.isValid(position) ? fixture.project(position) : [0, 0]
          }),
          variants: [1, 0.5].map(toleranceScale => ({
            id: `tolerance-${toleranceScale}`,
            maximumError,
            createProgram: () => {
              const prepared = prepareCRSProjection({
                ...fixture,
                tolerance: fixture.tolerance * toleranceScale
              });
              if (prepared.status !== 'ready') throw new Error(JSON.stringify(prepared.reasons));
              return prepared.program;
            }
          })),
          gpuTiming: false,
          warmupIterations: 0,
          measuredIterations: 1
        });
        for (const path of report.paths) expect(path.validRows).toBe(73);
        const prepared = prepareCRSProjection(fixture);
        if (prepared.status !== 'ready') throw new Error(JSON.stringify(prepared.reasons));
        const table = await runProjectionTableBenchmark(device, {
          transform: new ProjectionTableTransform(prepared),
          batches: [
            {positions: Float64Array.from(coordinates.slice(0, 32).flat())},
            {positions: new Float64Array(0)},
            {positions: Float64Array.from(coordinates.slice(32).flat())}
          ],
          provider: '@math.gl/projection 5.0.0-alpha.15 spherical visualization',
          maximumError,
          warmupIterations: 0,
          measuredIterations: 1
        });
        expect(table.validRows).toBe(73);
        expect(table.batchRowCounts[1]).toBe(0);
        expect(table.metadata.arithmetic).toBe('double-single');
      });
    }
  }
}
