// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {fround} from '@luma.gl/gpgpu';
import {getTestDevice} from '@luma.gl/test-utils';
import {makeTable, verifyTableValue} from './fixtures';

const TEST_CASES: {
  title: string;
  input: number[];
  size: number;
}[] = [
  {
    title: 'size 1',
    input: [1, -2, 0.1, -0.2, 0.3, -1 / 3, 1 / 5, -1 / 7, -Math.E, Math.E, -Math.PI, Math.PI],
    size: 1
  },
  {
    title: 'size 3',
    input: new Array(1000).fill(0).flatMap((_, i) => {
      return [-122.123 - i / 1000, 37.789 + i / 1000, 1000 + i / 100];
    }),
    size: 3
  },
  {
    title: 'edge cases',
    input: [
      0,
      -0,
      // special numbers
      NaN,
      Infinity,
      -Infinity,
      // f32 integer precision boundary
      16777215,
      16777216,
      16777217,
      16777218,
      33554431,
      33554432,
      33554433,
      // f32 subnormal boundary
      2 ** -126,
      2 ** -127,
      -(2 ** -126),
      2 ** -149,
      2 ** -150,
      -(2 ** -149),
      // low part round up behavior
      1 + 2 ** -24,
      1 + 2 ** -25,
      1 + 3 * 2 ** -25,
      -1 - 2 ** -24,
      2 + 2 ** -23,
      2 + 2 ** -24,
      // very small numbers
      Number.MIN_VALUE,
      -Number.MIN_VALUE,
      1e-310,
      2e-307,
      5e-324,
      // very big numbers
      Number.MAX_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER - 1,
      -Number.MAX_SAFE_INTEGER,
      3.4028234663852886e38,
      3.4028235e38,
      3.5e38,
      -3.5e38,
      2 ** 53,
      2 ** 60
    ],
    size: 1
  }
];

function splitFloatsCPU(input: number[], size: number): number[] {
  const inputArr = new Float64Array(input);
  const output = new Array<number>(input.length * 2);
  for (let i = 0; i < inputArr.length; i += size) {
    for (let j = 0; j < size; j++) {
      const value = inputArr[i + j];
      const hiPart = Math.fround(value);
      const lowPart = Math.fround(value - hiPart);
      output[i * 2 + j] = hiPart;
      output[i * 2 + j + size] = lowPart;
    }
  }
  return output;
}

for (const deviceType of ['webgl', 'webgpu'] as const) {
  test(`GPGPU#fround#execute:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }
    for (const {title, input, size} of TEST_CASES) {
      const expected = {
        value: splitFloatsCPU(input, size),
        size: size * 2
      };
      const tx = makeTable({
        value: new Float64Array(input),
        size
      });
      const ts = fround(tx);

      await ts.evaluate(device);
      await ts.readValue();
      expect(verifyTableValue(ts, expected), title).toBe(null);
      // clean up
      tx.destroy();
      ts.destroy();
    }
  });
}
