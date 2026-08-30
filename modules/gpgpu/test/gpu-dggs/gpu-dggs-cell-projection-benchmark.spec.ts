// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {runGPUDGGSCellProjectionBenchmark} from '@luma.gl/gpgpu/gpu-dggs/benchmarks';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {expect} from 'vitest';

const H3_CELLS = [0x089283082803ffffn, 0x089754e64993ffffn];
const A5_CELLS = [
  0x0200000000000000n,
  0x0500000000000000n,
  0x1a38000000000000n,
  0x2628000000000000n,
  0x35bd75e8fee1100dn
];
const H3_REFERENCE_LNGLATS = [
  [-122.4182710369247, 37.773515097238146],
  [-0.0010418183700719888, 0.0005857701415174007]
] as const;
const A5_REFERENCE_LNGLATS = [
  [-93, 90],
  [123, 69.09240188013534],
  [-120.36040534450211, 38.61273252471863],
  [-70.23755667780222, 43.618118491958555],
  [-122.41999998343744, 37.77999999438284]
] as const;

test('DGGS cell projection benchmark validates and measures H3 and A5 paths', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  for (const [family, cells, referenceLongitudeLatitudes] of [
    ['h3', H3_CELLS, H3_REFERENCE_LNGLATS],
    ['a5', A5_CELLS, A5_REFERENCE_LNGLATS]
  ] as const) {
    const report = await runGPUDGGSCellProjectionBenchmark(device, {
      family,
      cells: makeLittleEndianWords(cells, 256),
      referenceValues: makeUnitVectorReferences(referenceLongitudeLatitudes, 256),
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

  const incorrectReferences = makeUnitVectorReferences(H3_REFERENCE_LNGLATS, H3_CELLS.length);
  incorrectReferences[0] = 0;
  await expect(
    runGPUDGGSCellProjectionBenchmark(device, {
      family: 'h3',
      cells: makeLittleEndianWords(H3_CELLS, H3_CELLS.length),
      referenceValues: incorrectReferences,
      projection: 'unit-vector',
      warmupIterations: 0,
      measuredIterations: 1
    })
  ).rejects.toThrow(/reference values/);
  t.end();
});

function makeUnitVectorReferences(
  longitudeLatitudes: ReadonlyArray<readonly [number, number]>,
  cellCount: number
): Float32Array {
  const values = new Float32Array(cellCount * 3);
  for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
    const [longitudeDegrees, latitudeDegrees] =
      longitudeLatitudes[cellIndex % longitudeLatitudes.length];
    const longitude = longitudeDegrees * (Math.PI / 180);
    const latitude = latitudeDegrees * (Math.PI / 180);
    const cosLatitude = Math.cos(latitude);
    values.set(
      [cosLatitude * Math.cos(longitude), cosLatitude * Math.sin(longitude), Math.sin(latitude)],
      cellIndex * 3
    );
  }
  return values;
}

function makeLittleEndianWords(cells: readonly bigint[], cellCount: number): Uint32Array {
  const words = new Uint32Array(cellCount * 2);
  for (let cellIndex = 0; cellIndex < cellCount; cellIndex++) {
    const cell = cells[cellIndex % cells.length];
    words[cellIndex * 2] = Number(cell & 0xffffffffn);
    words[cellIndex * 2 + 1] = Number(cell >> 32n);
  }
  return words;
}
