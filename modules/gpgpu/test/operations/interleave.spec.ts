// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {interleave} from '@luma.gl/gpgpu';
import {getTestDevice} from '@luma.gl/test-utils';
import {TestData, makeTable, verifyTableValue, isSupportedByWebGPU} from './fixtures';

const TEST_CASES: {
  title: string;
  x: TestData;
  y: TestData;
  z?: TestData;
  result: TestData;
}[] = [
  {
    title: 'vec2 + vec2',
    x: {value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], size: 2},
    y: {value: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4], size: 2},
    result: {
      value: [0, 1, 0, 0, 2, 3, 1, 1, 4, 5, 2, 2, 6, 7, 3, 3, 8, 9, 4, 4],
      type: 'float32',
      size: 4
    }
  },
  {
    title: 'vec3 + float',
    x: {value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], size: 3},
    y: {value: [1, -1, 1, -1], size: 1},
    result: {value: [0, 1, 2, 1, 3, 4, 5, -1, 6, 7, 8, 1, 9, 10, 11, -1], type: 'float32', size: 4}
  },
  {
    title: 'constant + constant',
    x: {constant: [0, 1, 2]},
    y: {constant: [1, 2, 3]},
    result: {constant: [0, 1, 2, 1, 2, 3], type: 'float32', size: 6}
  },
  {
    title: 'vec4 + vec2 + uint',
    x: {value: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], size: 4},
    y: {value: [0, 0, 1, 1, 2, 2], size: 2},
    z: {value: [1, 2, 1], type: 'uint32', size: 1},
    result: {
      value: [0, 1, 2, 3, 0, 0, 1, 4, 5, 6, 7, 1, 1, 2, 8, 9, 10, 11, 2, 2, 1],
      type: 'float32',
      size: 7
    }
  }
];

for (const deviceType of ['webgl', 'webgpu'] as const) {
  test(`GPGPU#interleave#execute:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }
    for (const {title, x, y, z, result} of TEST_CASES) {
      if (device.type === 'webgpu' && !isSupportedByWebGPU(x, y, z)) {
        continue;
      }
      const tx = makeTable(x);
      const ty = makeTable(y);
      const tz = z && makeTable(z);
      const ts = tz ? interleave(tx, ty, tz) : interleave(tx, ty);

      await ts.evaluate(device);
      await ts.readValue();
      expect(verifyTableValue(ts, result), title).toBe(null);
      // clean up
      tx.destroy();
      ty.destroy();
      tz?.destroy();
      ts.destroy();
    }
  });
}
