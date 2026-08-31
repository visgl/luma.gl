import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  runGPUWorkgroupScanBenchmark,
  summarizeGPUWorkgroupScanBenchmarkSamples
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('summarizeGPUWorkgroupScanBenchmarkSamples reports nearest-rank distributions', () => {
  expect(summarizeGPUWorkgroupScanBenchmarkSamples([4, 1, 3, 2])).toEqual({
    minimum: 1,
    median: 2,
    percentile95: 4,
    maximum: 4
  });
  expect(
    () => summarizeGPUWorkgroupScanBenchmarkSamples([1, Number.NaN]),
    'invalid samples cannot produce misleading reports'
  ).toThrow(/finite and non-negative/);
});

it('runGPUWorkgroupScanBenchmark compares graph-owned scan computations', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const report = await runGPUWorkgroupScanBenchmark(device, {
    workgroupCount: 2,
    roundCount: 2,
    dispatchCount: 2,
    warmupIterations: 1,
    measuredIterations: 2
  });
  expect(report.paths[0].strategy, 'portable path is always measured').toBe('portable');
  expect(
    report.paths.length,
    'subgroup path is measured only when both required capabilities are available'
  ).toBe(report.subgroupAvailable ? 2 : 1);
  expect(
    Boolean(report.paths.every(path => path.checksum === report.paths[0].checksum)),
    'every measured path passes the shared checksum oracle'
  ).toBe(true);
  expect(
    Boolean(report.paths.every(path => path.cpuEncodeTimeMilliseconds.minimum >= 0)),
    'per-dispatch CPU encoding distributions are reported'
  ).toBe(true);
  if (report.timestampQueries) {
    expect(
      Boolean(report.paths.every(path => path.gpuTimeMilliseconds?.minimum !== undefined)),
      'per-dispatch GPU timing distributions are reported'
    ).toBe(true);
  }
});
