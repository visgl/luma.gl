// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {runGPUDGGSCellProjectionBenchmark} from '@luma.gl/gpgpu/gpu-dggs/benchmarks';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';

const H3_CELLS = [0x089283082803ffffn, 0x089754e64993ffffn];
const A5_CELLS = [0x0200000000000000n, 0x35bd75e8fee1100dn];

test('DGGS cell projection benchmark validates and measures H3 and A5 paths', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  for (const [family, cells] of [
    ['h3', H3_CELLS],
    ['a5', A5_CELLS]
  ] as const) {
    const report = await runGPUDGGSCellProjectionBenchmark(device, {
      family,
      cells: makeLittleEndianWords(cells, 256),
      projection: 'unit-vector',
      warmupIterations: 0,
      measuredIterations: 1
    });
    t.equal(report.family, family, `${family} family is reported`);
    t.equal(report.cellCount, 256, `${family} row count is reported`);
    t.ok(
      Number.isFinite(report.synchronizedCellsPerSecond) && report.synchronizedCellsPerSecond > 0,
      `${family} synchronized throughput is measured`
    );
    t.ok(
      report.validationReadbackTimeMilliseconds >= 0,
      `${family} correctness readback is measured separately`
    );
  }
  t.end();
});

function makeLittleEndianWords(cells: readonly bigint[], cellCount: number): Uint32Array {
  const words = new Uint32Array(cellCount * 2);
  for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
    const cell = cells[cellIndex % cells.length];
    words[cellIndex * 2] = Number(cell & 0xffffffffn);
    words[cellIndex * 2 + 1] = Number(cell >> 32n);
  }
  return words;
}
