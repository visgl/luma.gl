// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {createWebMercatorProjection} from '@luma.gl/experimental/luproj';
import {runGPUProjectionBenchmark} from '@luma.gl/experimental/luproj/benchmarks';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('runGPUProjectionBenchmark compares CPU baselines and synchronized WebGPU paths', async tapeTest => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    tapeTest.comment('WebGPU is not available');
    tapeTest.end();
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

  tapeTest.equal(benchmarkReport.cpu.coordinateCount, coordinateCount);
  tapeTest.ok(benchmarkReport.cpu.patchCount > 1, 'benchmark rows span multiple adaptive patches');
  tapeTest.deepEqual(
    benchmarkReport.cpu.paths.map(path => path.strategy),
    ['provider', 'plan-scan', 'plan-patch-ids'],
    'provider and both CPU patch strategies share one deterministic dataset'
  );
  tapeTest.deepEqual(
    benchmarkReport.paths.map(path => `${path.inputFormat}:${path.patchStrategy}`),
    ['float32x2:scan', 'float32x2:patch-ids', 'uint32x4:scan', 'uint32x4:patch-ids'],
    'both source representations are compared with scan and explicit patch IDs'
  );

  for (const path of benchmarkReport.paths) {
    tapeTest.ok(
      path.synchronizedCoordinatesPerSecond > 0,
      `${path.inputFormat} reports throughput`
    );
    tapeTest.ok(path.synchronizedTimeMilliseconds.minimum >= 0, 'GPU submission is synchronized');
    tapeTest.ok(path.cpuEncodeTimeMilliseconds.minimum >= 0, 'CPU encoding is measured separately');
    tapeTest.ok(path.maxError <= 0.0301, 'the entire output matches its source-format CPU oracle');
    tapeTest.equal(
      path.synchronizedSpeedupOverCPUProvider,
      path.synchronizedCoordinatesPerSecond / benchmarkReport.cpu.paths[0].coordinatesPerSecond,
      'end-to-end GPU throughput is compared directly against the CPU provider'
    );
    if (path.gpuCoordinatesPerSecond !== undefined) {
      tapeTest.equal(
        path.gpuSpeedupOverCPUProvider,
        path.gpuCoordinatesPerSecond / benchmarkReport.cpu.paths[0].coordinatesPerSecond,
        'timestamped compute throughput is compared directly against the CPU provider'
      );
    }
  }
  tapeTest.ok(
    benchmarkReport.paths[1].memoryByteLength > benchmarkReport.paths[0].memoryByteLength,
    'explicit patch-ID storage is reflected in reported memory consumption'
  );
  tapeTest.ok(
    benchmarkReport.paths[2].memoryByteLength > benchmarkReport.paths[0].memoryByteLength,
    'raw binary64 inputs report their wider physical storage'
  );

  if (configuredRows) {
    tapeTest.comment('LUPROJ_BENCHMARK_REPORT', JSON.stringify(benchmarkReport));
  }
  tapeTest.end();
});
