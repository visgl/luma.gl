// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {cleanEvaluate, gather, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice} from '@luma.gl/test-utils';
import {TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu'] as const) {
  test(`GPGPU#gather#execute:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }
    const TEST_CASES: {
      title: string;
      gathered: GPUTableEvaluator;
      expected: TestData;
    }[] = [
      {
        title: 'uint ids gather vec2',
        gathered: gather(
          GPUTableEvaluator.fromArray([2, 0, 1, 3], {type: 'uint32', size: 1}),
          GPUTableEvaluator.fromArray([10, 11, 20, 21, 30, 31, 40, 41], {size: 2})
        ),
        expected: {value: [30, 31, 10, 11, 20, 21, 40, 41], type: 'float32', size: 2}
      },
      {
        title: 'out of range returns zeros',
        gathered: gather(
          GPUTableEvaluator.fromArray([1, 9, 0, 7], {type: 'uint32', size: 1}),
          GPUTableEvaluator.fromArray([5, 6, 7, 8, 9, 10], {size: 3})
        ),
        expected: {value: [8, 9, 10, 0, 0, 0, 5, 6, 7, 0, 0, 0], type: 'float32', size: 3}
      },
      {
        title: 'uint ids gather uint values',
        gathered: gather(
          GPUTableEvaluator.fromArray([3, 1, 0, 2], {type: 'uint32', size: 1}),
          GPUTableEvaluator.fromArray([2, 3, 5, 7], {type: 'uint32', size: 1})
        ),
        expected: {value: [7, 3, 2, 5], type: 'uint32', size: 1}
      },
      {
        title: 'constant id gathers one row',
        gathered: gather(
          GPUTableEvaluator.fromConstant(2, 'uint32'),
          GPUTableEvaluator.fromArray([10, 11, 20, 21, 30, 31, 40, 41], {size: 2})
        ),
        expected: {constant: [30, 31], type: 'float32', size: 2}
      }
    ];

    for (const testCase of TEST_CASES) {
      if (device.type === 'webgpu' && !isSupportedByWebGPU(testCase.gathered)) {
        continue;
      }
      await cleanEvaluate(device, testCase);
      await testCase.gathered.readValue();
      expect(verifyTableValue(testCase.gathered, testCase.expected), testCase.title).toBe(null);
      testCase.gathered.destroy();
    }
  });
}
