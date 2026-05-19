// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {cleanEvaluate, multiply, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice} from '@luma.gl/test-utils';
import {TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu'] as const) {
  test(`GPGPU#multiply#execute:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }
    const TEST_CASES: {
      title: string;
      product: GPUTableEvaluator;
      expected: TestData;
    }[] = [
      {
        title: 'vec2 * vec2',
        product: multiply(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 2}),
          GPUTableEvaluator.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], {size: 2})
        ),
        expected: {value: [0, 2, 6, 12, 20, 30, 42, 56, 72, 90, 110, 132], type: 'float32', size: 2}
      },
      {
        title: 'uvec2 * uvec2',
        product: multiply(
          GPUTableEvaluator.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], {
            type: 'uint32',
            size: 2
          }),
          GPUTableEvaluator.fromArray([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], {
            type: 'uint8',
            size: 2
          })
        ),
        expected: {
          value: [2, 6, 12, 20, 30, 42, 56, 72, 90, 110, 132, 156],
          type: 'uint32',
          size: 2
        }
      },
      {
        title: 'vec6 * vec6',
        product: multiply(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 6}),
          GPUTableEvaluator.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], {size: 6})
        ),
        expected: {value: [0, 2, 6, 12, 20, 30, 42, 56, 72, 90, 110, 132], type: 'float32', size: 6}
      },
      {
        title: 'vec3 * vec2',
        product: multiply(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 3}),
          GPUTableEvaluator.fromArray([2, 2, -1, -1, 0.5, 0.5, -2, -2], {size: 2})
        ),
        expected: {value: [0, 2, 0, -3, -4, 0, 3, 3.5, 0, -18, -20, 0], type: 'float32', size: 3}
      },
      {
        title: 'vec3 * constant',
        product: multiply(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 3}),
          GPUTableEvaluator.fromConstant([1, 2, 3])
        ),
        expected: {value: [0, 2, 6, 3, 8, 15, 6, 14, 24, 9, 20, 33], type: 'float32', size: 3}
      },
      {
        title: 'constant * constant',
        product: multiply(
          GPUTableEvaluator.fromConstant([1, 2, 3]),
          GPUTableEvaluator.fromConstant([4, 5, 6])
        ),
        expected: {constant: [4, 10, 18], type: 'float32', size: 3}
      },
      {
        title: 'vec2 * vec2 * int',
        product: multiply(
          GPUTableEvaluator.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], {size: 2}),
          GPUTableEvaluator.fromArray([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], {size: 2}),
          GPUTableEvaluator.fromArray([2, -1, 2, -1, 2, -1], {type: 'sint8', size: 1})
        ),
        expected: {
          value: [4, 0, -12, 0, 60, 0, -56, 0, 180, 0, -132, 0],
          type: 'float32',
          size: 2
        }
      }
    ];
    for (const testCase of TEST_CASES) {
      if (device.type === 'webgpu' && !isSupportedByWebGPU(testCase.product)) {
        continue;
      }
      await cleanEvaluate(device, testCase);
      await testCase.product.readValue();
      expect(verifyTableValue(testCase.product, testCase.expected), testCase.title).toBe(null);
      testCase.product.destroy();
    }
  });
}
