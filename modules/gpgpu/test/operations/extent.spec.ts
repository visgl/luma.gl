// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {cleanEvaluate, extent, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice} from '@luma.gl/test-utils';
import {TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu'] as const) {
  test(`GPGPU#extent#execute:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const TEST_CASES: {
      title: string;
      extents: GPUTableEvaluator;
      expected: TestData;
    }[] = [
      {
        title: 'float vec2 extent',
        extents: extent(GPUTableEvaluator.fromArray([4, 9, -1, 8, 7, 3, 2, 12], {size: 2})),
        expected: {value: [-1, 7, 3, 12], type: 'float32', size: 2}
      },
      {
        title: 'uint scalar extent',
        extents: extent(GPUTableEvaluator.fromArray([8, 2, 13, 5], {type: 'uint32', size: 1})),
        expected: {value: [2, 13], type: 'uint32', size: 2}
      },
      {
        title: 'constant row extent',
        extents: extent(GPUTableEvaluator.fromConstant([6, -2])),
        expected: {value: [6, 6, -2, -2], type: 'float32', size: 2}
      }
    ];

    for (const testCase of TEST_CASES) {
      if (device.type === 'webgpu' && !isSupportedByWebGPU(testCase.extents)) {
        continue;
      }
      await cleanEvaluate(device, testCase);
      await testCase.extents.readValue();
      expect(verifyTableValue(testCase.extents, testCase.expected), testCase.title).toBe(null);
      testCase.extents.destroy();
    }
  });
}
