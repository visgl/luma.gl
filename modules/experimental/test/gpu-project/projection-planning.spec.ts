// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {Projection} from '@math.gl/projection';
import {planProjection, type ProjectionCoordinates} from '@luma.gl/experimental/gpu-project';
import {runProjectionProgramBenchmark} from '@luma.gl/experimental/gpu-project/benchmarks';

it('executes a caller-prepared math.gl provider inline and in a graph with double-single precision', async context => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  if (device.info.gpu === 'software' || device.info.gpuType === 'cpu' || device.info.fallback)
    context.skip();
  const projection = new Projection({from: 'EPSG:4326', to: 'EPSG:3857'});
  const coordinates: ProjectionCoordinates[] = [
    [-122.400000001, 37.800000001],
    [-122.400000002, 37.800000002],
    [-122.405, 37.805],
    [NaN, 0],
    [0, 0]
  ];
  const report = await runProjectionProgramBenchmark(device, {
    coordinates,
    oracle: position => {
      if (!Number.isFinite(position[0]) || position[0] === 0)
        return {position: [0, 0], valid: false};
      const projected = projection.project([...position]);
      return {position: [projected[0], projected[1]], valid: true};
    },
    variants: ['legacy-provider', 'prepared-provider'].map(id => ({
      id,
      maximumError: 0.001,
      createProgram: () => {
        const result = planProjection({
          projection:
            id === 'legacy-provider'
              ? {project: coordinates => projection.project(coordinates)}
              : projection,
          bounds: [-122.41, 37.79, -122.39, 37.81],
          tolerance: 0.0005
        });
        if (result.status !== 'ready') throw new Error(JSON.stringify(result.reasons));
        expect(result.strategy).toBe('adaptive');
        expect(result.compiled.precision).toBe('double-single');
        return result.program;
      }
    })),
    gpuTiming: false,
    warmupIterations: 0,
    measuredIterations: 1
  });
  expect(report.paths).toHaveLength(4);
  for (const path of report.paths) {
    expect(path.validRows).toBe(3);
    expect(path.metadata.arithmetic).toBe('double-single');
    expect(path.maximumObservedError).toBeLessThanOrEqual(0.001);
  }
});
