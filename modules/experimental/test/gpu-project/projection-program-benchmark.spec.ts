// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Proj4Projection} from '@math.gl/proj4';
import {planCRSProjection} from '@luma.gl/experimental/gpu-project/crs';
import {runProjectionProgramBenchmark} from '@luma.gl/experimental/gpu-project/benchmarks';
import type {ProjectionBounds, ProjectionCoordinates} from '@luma.gl/experimental/gpu-project';
import {
  geographicCRS,
  makeTransverseMercatorCRS,
  makeWebMercatorCRS
} from './projection-crs-fixtures';

const fixtures = [
  {
    id: 'web-mercator',
    definition: makeWebMercatorCRS(),
    serialized: 'EPSG:3857',
    bounds: [-122.5, 37.7, -122.3, 37.9],
    inverse: false
  },
  {
    id: 'utm-north',
    definition: makeTransverseMercatorCRS(10),
    serialized: '+proj=utm +zone=10 +datum=WGS84',
    bounds: [-122.5, 37.7, -122.3, 37.9],
    inverse: false
  },
  {
    id: 'utm-south',
    definition: makeTransverseMercatorCRS(56, true),
    serialized: '+proj=utm +zone=56 +south +datum=WGS84',
    bounds: [150.9, -33.1, 151.1, -32.9],
    inverse: false
  },
  {
    id: 'utm-inverse',
    definition: makeTransverseMercatorCRS(10),
    serialized: '+proj=utm +zone=10 +datum=WGS84',
    bounds: [550000, 4180000, 570000, 4200000],
    inverse: true
  }
] satisfies {
  id: string;
  definition: ReturnType<typeof makeWebMercatorCRS> | ReturnType<typeof makeTransverseMercatorCRS>;
  serialized: string;
  bounds: ProjectionBounds;
  inverse: boolean;
}[];

for (const fixture of fixtures) {
  it(`compares native/adaptive ${fixture.id} against an independent oracle before reporting timing`, async context => {
    const device = await getWebGPUTestDevice();
    if (!device) return;
    if (device.info.gpu === 'software' || device.info.gpuType === 'cpu' || device.info.fallback)
      context.skip();
    const configuredRows = import.meta.env.VITE_LUPROJ_BENCHMARK_ROWS;
    const rowCount = configuredRows ? Number(configuredRows) : 32;
    const bounds = fixture.bounds;
    const coordinates: ProjectionCoordinates[] = Array.from({length: rowCount}, (_value, index) => [
      bounds[0] + ((bounds[2] - bounds[0]) * (index + 0.5)) / rowCount,
      bounds[1] + (bounds[3] - bounds[1]) * (((index + 1) * 0.6180339887498949) % 1)
    ]);
    coordinates.push([NaN, 0]);
    const provider = new Proj4Projection({
      from: fixture.inverse ? fixture.serialized : 'EPSG:4326',
      to: fixture.inverse ? 'EPSG:4326' : fixture.serialized
    });
    const report = await runProjectionProgramBenchmark(device, {
      coordinates,
      oracle: position => {
        if (!position.every(Number.isFinite)) return {position: [0, 0], valid: false};
        const projected = provider.project([...position]);
        return {position: [projected[0], projected[1]], valid: true};
      },
      variants: (['float32', 'double-single'] as const).map(projectionArithmetic => ({
        id: projectionArithmetic === 'float32' ? 'native' : 'adaptive',
        maximumError:
          projectionArithmetic === 'float32'
            ? fixture.inverse
              ? 0.0001
              : 20
            : fixture.inverse
              ? 1e-9
              : 1e-5,
        createProgram: () => {
          const result = planCRSProjection({
            from: fixture.inverse ? fixture.definition : geographicCRS,
            to: fixture.inverse ? geographicCRS : fixture.definition,
            bounds,
            tolerance: fixture.inverse ? 1e-9 : 1e-5,
            projectionArithmetic
          });
          if (result.status !== 'ready') throw new Error(JSON.stringify(result.reasons));
          return result.program;
        }
      })),
      warmupIterations: configuredRows ? 2 : 0,
      measuredIterations: configuredRows ? 5 : 1
    });
    expect(report.paths.map(path => `${path.id}/${path.mode}`)).toEqual([
      'native/inline',
      'native/materialized',
      'adaptive/inline',
      'adaptive/materialized'
    ]);
    for (const path of report.paths) {
      expect(path.metadata.inputEncoding).toBe('binary64');
      expect(path.metadata.outputPrecision).toBe('double-single');
      expect(path.metadata.arithmetic).toBe(path.id === 'native' ? 'mixed' : 'double-single');
      expect(path.maximumObservedError).toBeLessThanOrEqual(path.maximumAllowedError);
      expect(path.validRows).toBe(rowCount);
      expect(path.synchronizedCoordinatesPerSecond).toBeGreaterThan(0);
      for (const timing of [
        path.planningTimeMilliseconds,
        path.programCompilationTimeMilliseconds,
        path.cpuEncodeTimeMilliseconds,
        path.synchronizedTimeMilliseconds
      ])
        expect(timing.minimum).toBeGreaterThanOrEqual(0);
      expect(path.graphCompilationTimeMilliseconds).toBeGreaterThanOrEqual(0);
      expect(path.firstUseTimeMilliseconds).toBeGreaterThanOrEqual(0);
      expect(path.intermediateByteLength).toBe(
        path.mode === 'inline' ? 0 : coordinates.length * 20
      );
    }
    for (const first of [0, 2]) {
      expect(report.paths[first].maximumObservedError).toBe(
        report.paths[first + 1].maximumObservedError
      );
      expect(report.paths[first + 1].bufferByteLength - report.paths[first].bufferByteLength).toBe(
        coordinates.length * 20
      );
    }
    expect(report.paths[2].parameterByteLength).toBeGreaterThan(
      report.paths[0].parameterByteLength
    );
    if (configuredRows)
      console.info(`PROJECTION_PROGRAM_BENCHMARK ${JSON.stringify({fixture: fixture.id, report})}`);
  }, 120000);
}

it('refuses accuracy/validity failures before warmup and does not return misleading timing', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  if (device.info.gpu === 'software' || device.info.gpuType === 'cpu' || device.info.fallback)
    context.skip();
  const submit = vi.spyOn(device, 'submit');
  try {
    for (const valid of [true, false]) {
      submit.mockClear();
      await expect(
        runProjectionProgramBenchmark(device, {
          coordinates: [[1, 2]],
          oracle: () => ({position: [100, 200], valid}),
          variants: ['first', 'second'].map(id => ({
            id,
            maximumError: 0,
            createProgram: () => ({precision: 'double-single', operations: []})
          })),
          warmupIterations: 5,
          measuredIterations: 5
        })
      ).rejects.toThrow(valid ? /exceeds error budget/ : /validity differs/);
      expect(submit).toHaveBeenCalledTimes(1);
    }
  } finally {
    vi.restoreAllMocks();
  }
});

it.each([
  'local-f32',
  'double-single'
] as const)('decodes %s identity output and refuses mismatched output precision', async (precision, context) => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  if (device.info.gpu === 'software' || device.info.gpuType === 'cpu' || device.info.fallback)
    context.skip();
  const report = await runProjectionProgramBenchmark(device, {
    coordinates: [[10000000.25, 20000000.5]],
    oracle: position => ({position, valid: true}),
    variants: ['first', 'second'].map(id => ({
      id,
      maximumError: 0,
      createProgram: () => ({
        precision,
        destinationOrigin: [10000000, 20000000],
        operations: []
      })
    })),
    warmupIterations: 0,
    measuredIterations: 1
  });
  expect(report.paths.every(path => path.maximumObservedError === 0)).toBe(true);
  await expect(
    runProjectionProgramBenchmark(device, {
      coordinates: [[1, 2]],
      oracle: position => ({position, valid: true}),
      variants: [
        {
          id: 'local',
          maximumError: 0,
          createProgram: () => ({precision: 'local-f32', operations: []})
        },
        {
          id: 'double',
          maximumError: 0,
          createProgram: () => ({precision: 'double-single', operations: []})
        }
      ],
      warmupIterations: 0,
      measuredIterations: 1
    })
  ).rejects.toThrow(/share output precision/);
});
