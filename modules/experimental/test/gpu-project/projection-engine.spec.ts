// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {createSpatialReference} from '@math.gl/crs';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  prepareCRSProjection,
  createCRSProjectionCPUBenchmarks
} from '@luma.gl/experimental/gpu-project/crs';
import {runProjectionProgramBenchmark} from '@luma.gl/experimental/gpu-project/benchmarks';

it('executes stored-axis metadata consistently on CPU, inline GPU and materialized GPU', async context => {
  const device = await getWebGPUTestDevice();
  if (
    !device ||
    device.info.gpu === 'software' ||
    device.info.gpuType === 'cpu' ||
    device.info.fallback
  )
    context.skip();
  const from = createSpatialReference({
    crs: {
      state: 'explicit',
      definition: 'EPSG:4326',
      representation: 'identifier',
      provenance: 'metadata'
    },
    coordinateOrder: ['latitude', 'longitude']
  });
  const to = createSpatialReference({
    crs: {
      state: 'explicit',
      definition: 'EPSG:3857',
      representation: 'identifier',
      provenance: 'metadata'
    },
    coordinateOrder: ['northing', 'easting']
  });
  const result = prepareCRSProjection({from, to, bounds: [-1, -1, 1, 1], tolerance: 0.0005});
  if (result.status !== 'ready') throw new Error(JSON.stringify(result.reasons));
  const isValid = (position: readonly number[]) =>
    position.every(value => Number.isFinite(value) && Math.abs(value) <= 1);
  const report = await runProjectionProgramBenchmark(device, {
    coordinates: [
      [0.3, 0.4],
      [-0.7, 0.2],
      [1, 1],
      [NaN, 0],
      [2, 0]
    ],
    oracle: position => {
      if (!isValid(position)) return {position: [0, 0], valid: false};
      const projected = result.projection.projectSync(position);
      return {position: [projected[0], projected[1]], valid: true};
    },
    cpuVariants: createCRSProjectionCPUBenchmarks({
      projection: result.projection,
      provider: 'math.gl alpha.13',
      isValid
    }),
    variants: [
      {id: 'prepared', createProgram: () => result.program, maximumError: 0.001},
      {id: 'prepared-reuse', createProgram: () => result.program, maximumError: 0.001}
    ],
    consumerCount: 2,
    warmupIterations: 0,
    measuredIterations: 1
  });
  expect(report.cpuPaths).toHaveLength(12);
  for (const path of report.paths) {
    expect(path.validRows).toBe(3);
    expect(path.maximumObservedError).toBeLessThan(0.001);
    expect(path.cpuComparisons).toHaveLength(6);
    expect(path.validationReadbackTimeMilliseconds).toBeGreaterThanOrEqual(0);
  }
});
