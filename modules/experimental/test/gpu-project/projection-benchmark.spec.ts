// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {createWebMercatorProjection} from '@luma.gl/experimental/gpu-project';
import {runGPUProjectionBenchmark} from '@luma.gl/experimental/gpu-project/benchmarks';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('runGPUProjectionBenchmark compares CPU baselines and synchronized WebGPU paths', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    void 0;
    void 0;
    return;
  }

  const configuredRows = import.meta.env.VITE_LUPROJ_BENCHMARK_ROWS;
  const coordinateCount = configuredRows ? Number(configuredRows) : 64;
  const benchmarkReport = await runGPUProjectionBenchmark(device, {
    projection: createWebMercatorProjection(),
    bounds: [-123, 37, -122, 38],
    degree: 2,
    tolerance: 0.03,
    maxDepth: 5,
    coordinateCount,
    warmupIterations: configuredRows ? 2 : 0,
    measuredIterations: configuredRows ? 5 : 1
  });

  expect(benchmarkReport.cpu.coordinateCount, '').toBe(coordinateCount);
  expect(
    Boolean(benchmarkReport.cpu.patchCount > 1),
    'benchmark rows span multiple adaptive patches'
  ).toBe(true);
  expect(
    benchmarkReport.cpu.paths.map(path => path.strategy),
    'provider and both CPU patch strategies share one deterministic dataset'
  ).toEqual(['provider', 'plan-scan', 'plan-patch-ids']);
  expect(
    benchmarkReport.paths.map(path => `${path.inputFormat}:${path.patchStrategy}`),
    'both source representations are compared with scan and explicit patch IDs'
  ).toEqual(['float32x2:scan', 'float32x2:patch-ids', 'uint32x4:scan', 'uint32x4:patch-ids']);

  for (const path of benchmarkReport.paths) {
    expect(
      Boolean(path.synchronizedCoordinatesPerSecond > 0),
      `${path.inputFormat} reports throughput`
    ).toBe(true);
    expect(
      Boolean(path.synchronizedTimeMilliseconds.minimum >= 0),
      'GPU submission is synchronized'
    ).toBe(true);
    expect(
      Boolean(path.cpuEncodeTimeMilliseconds.minimum >= 0),
      'CPU encoding is measured separately'
    ).toBe(true);
    expect(
      Boolean(path.maxError <= 0.0301),
      'the entire output matches its source-format CPU oracle'
    ).toBe(true);
    expect(
      path.synchronizedSpeedupOverCPUProvider,
      'end-to-end GPU throughput is compared directly against the CPU provider'
    ).toBe(
      path.synchronizedCoordinatesPerSecond / benchmarkReport.cpu.paths[0].coordinatesPerSecond
    );
    if (path.gpuCoordinatesPerSecond !== undefined) {
      expect(
        path.gpuSpeedupOverCPUProvider,
        'timestamped compute throughput is compared directly against the CPU provider'
      ).toBe(path.gpuCoordinatesPerSecond / benchmarkReport.cpu.paths[0].coordinatesPerSecond);
    }
  }
  expect(
    Boolean(benchmarkReport.paths[1].memoryByteLength > benchmarkReport.paths[0].memoryByteLength),
    'explicit patch-ID storage is reflected in reported memory consumption'
  ).toBe(true);
  expect(
    Boolean(benchmarkReport.paths[2].memoryByteLength > benchmarkReport.paths[0].memoryByteLength),
    'raw binary64 inputs report their wider physical storage'
  ).toBe(true);

  if (configuredRows) {
    void 0;
  }
  void 0;
});
