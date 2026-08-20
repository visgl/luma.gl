// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {runGPUWorkgroupReductionBenchmark} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('runGPUWorkgroupReductionBenchmark compares graph-owned reductions', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const report = await runGPUWorkgroupReductionBenchmark(device, {
    workgroupCount: 2,
    roundCount: 2,
    dispatchCount: 2,
    warmupIterations: 1,
    measuredIterations: 2
  });
  t.equal(report.paths[0].strategy, 'portable', 'portable path is always measured');
  t.equal(
    report.paths.length,
    report.subgroupAvailable ? 2 : 1,
    'subgroup path is measured only when both capabilities are available'
  );
  t.ok(
    report.paths.every(path => path.checksum === report.paths[0].checksum),
    'every measured path passes the shared checksum oracle'
  );
  t.ok(
    report.paths.every(path => path.cpuEncodeTimeMilliseconds.minimum >= 0),
    'per-dispatch CPU encoding distributions are reported'
  );
  t.end();
});
