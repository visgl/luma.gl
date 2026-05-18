// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {add, cleanEvaluate, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice} from '@luma.gl/test-utils';
import {TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu'] as const) {
  test(`GPGPU#add#execute:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }
    const TEST_CASES: {
      title: string;
      sum: GPUTableEvaluator;
      expected: TestData;
    }[] = [
      {
        title: 'vec2 + vec2',
        sum: add(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 2}),
          GPUTableEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {size: 2})
        ),
        expected: {value: [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16], type: 'float32', size: 2}
      },
      {
        title: 'uvec2 + uvec2',
        sum: add(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {
            type: 'uint32',
            size: 2
          }),
          GPUTableEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {
            type: 'uint8',
            size: 2
          })
        ),
        expected: {value: [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16], type: 'uint32', size: 2}
      },
      {
        title: 'vec6 + vec6',
        sum: add(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 6}),
          GPUTableEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {size: 6})
        ),
        expected: {value: [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16], type: 'float32', size: 6}
      },
      {
        title: 'vec3 + float',
        sum: add(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 3}),
          GPUTableEvaluator.fromArray([1, -1, 1, -1], {size: 1})
        ),
        expected: {value: [1, 1, 2, 2, 4, 5, 7, 7, 8, 8, 10, 11], type: 'float32', size: 3}
      },
      {
        title: 'vec3 + constant',
        sum: add(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 3}),
          GPUTableEvaluator.fromConstant(1)
        ),
        expected: {value: [1, 1, 2, 4, 4, 5, 7, 7, 8, 10, 10, 11], type: 'float32', size: 3}
      },
      {
        title: 'constant + constant',
        sum: add(
          GPUTableEvaluator.fromConstant([0, 1, 2]),
          GPUTableEvaluator.fromConstant([1, 2, 3])
        ),
        expected: {constant: [1, 3, 5], type: 'float32', size: 3}
      },
      {
        title: 'vec2 + vec2 + int',
        sum: add(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 2}),
          GPUTableEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {size: 2}),
          GPUTableEvaluator.fromArray([1, -1, 1, -1, 1, -1], {type: 'sint8', size: 1})
        ),
        expected: {value: [1, 1, 2, 4, 7, 7, 8, 10, 13, 13, 14, 16], type: 'float32', size: 2}
      }
    ];
    for (const testCase of TEST_CASES) {
      if (device.type === 'webgpu' && !isSupportedByWebGPU(testCase.sum)) {
        continue;
      }
      await cleanEvaluate(device, testCase);
      await testCase.sum.readValue();
      expect(verifyTableValue(testCase.sum, testCase.expected), testCase.title).toBe(null);
      testCase.sum.destroy();
    }
  });
}
