// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {add} from '@luma.gl/gpgpu';
import {getTestDevice} from '@luma.gl/test-utils';
import {TestData, makeTable, verifyTableValue, isSupportedByWebGPU} from './fixtures';

const TEST_CASES: {
  title: string;
  x: TestData;
  y: TestData;
  z?: TestData;
  sum: TestData;
}[] = [
  {
    title: 'vec2 + vec2',
    x: {value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], size: 2},
    y: {value: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], size: 2},
    sum: {value: [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16], type: 'float32', size: 2}
  },
  {
    title: 'uvec2 + uvec2',
    x: {value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], type: 'uint32', size: 2},
    y: {value: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], type: 'uint8', size: 2},
    sum: {value: [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16], type: 'uint32', size: 2}
  },
  {
    title: 'vec6 + vec6',
    x: {value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], size: 6},
    y: {value: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], size: 6},
    sum: {value: [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16], type: 'float32', size: 6}
  },
  {
    title: 'vec3 + float',
    x: {value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], size: 3},
    y: {value: [1, -1, 1, -1], size: 1},
    sum: {value: [1, 1, 2, 2, 4, 5, 7, 7, 8, 8, 10, 11], type: 'float32', size: 3}
  },
  {
    title: 'vec3 + constant',
    x: {value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], size: 3},
    y: {constant: 1},
    sum: {value: [1, 1, 2, 4, 4, 5, 7, 7, 8, 10, 10, 11], type: 'float32', size: 3}
  },
  {
    title: 'constant + constant',
    x: {constant: [0, 1, 2]},
    y: {constant: [1, 2, 3]},
    sum: {constant: [1, 3, 5], type: 'float32', size: 3}
  },
  {
    title: 'vec2 + vec2 + int',
    x: {value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], size: 2},
    y: {value: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], size: 2},
    z: {value: [1, -1, 1, -1, 1, -1], type: 'sint8', size: 1},
    sum: {value: [1, 1, 2, 4, 7, 7, 8, 10, 13, 13, 14, 16], type: 'float32', size: 2}
  }
];

for (const deviceType of ['webgl', 'webgpu'] as const) {
  test(`GPGPU#add#execute:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }
    for (const {title, x, y, z, sum} of TEST_CASES) {
      if (device.type === 'webgpu' && !isSupportedByWebGPU(x, y, z)) {
        continue;
      }
      const tx = makeTable(x);
      const ty = makeTable(y);
      const tz = z && makeTable(z);
      const ts = tz ? add(tx, ty, tz) : add(tx, ty);

      await ts.evaluate(device);
      await ts.readValue();
      expect(verifyTableValue(ts, sum), title).toBe(null);
      // clean up
      tx.destroy();
      ty.destroy();
      tz?.destroy();
      ts.destroy();
    }
  });
}
