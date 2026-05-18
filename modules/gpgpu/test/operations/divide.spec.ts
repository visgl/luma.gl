// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {cleanEvaluate, divide, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice} from '@luma.gl/test-utils';
import {TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu'] as const) {
  test(`GPGPU#divide#execute:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }
    const TEST_CASES: {
      title: string;
      quotient: GPUTableEvaluator;
      expected: TestData;
    }[] = [
      {
        title: 'vec2 / vec2',
        quotient: divide(
          GPUTableEvaluator.fromArray([2, 6, 12, 20, 30, 42, 56, 72, 90, 110, 132, 156], {
            size: 2
          }),
          GPUTableEvaluator.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], {size: 2})
        ),
        expected: {value: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], type: 'float32', size: 2}
      },
      {
        title: 'uvec2 / uvec2',
        quotient: divide(
          GPUTableEvaluator.fromArray(
            [8, 27, 64, 125, 216, 343, 512, 729, 1000, 1331, 1728, 2197],
            {
              type: 'uint32',
              size: 2
            }
          ),
          GPUTableEvaluator.fromArray([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], {
            type: 'uint8',
            size: 2
          })
        ),
        expected: {
          value: [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169],
          type: 'uint32',
          size: 2
        }
      },
      {
        title: 'vec6 / vec6',
        quotient: divide(
          GPUTableEvaluator.fromArray([2, 6, 12, 20, 30, 42, 56, 72, 90, 110, 132, 156], {
            size: 6
          }),
          GPUTableEvaluator.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], {size: 6})
        ),
        expected: {value: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], type: 'float32', size: 6}
      },
      {
        title: 'vec3 / constant',
        quotient: divide(
          GPUTableEvaluator.fromArray([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24], {size: 3}),
          GPUTableEvaluator.fromConstant([2, 2, 2])
        ),
        expected: {value: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], type: 'float32', size: 3}
      },
      {
        title: 'constant / constant',
        quotient: divide(
          GPUTableEvaluator.fromConstant([8, 27, 64]),
          GPUTableEvaluator.fromConstant([2, 3, 4])
        ),
        expected: {constant: [4, 9, 16], type: 'float32', size: 3}
      }
    ];
    for (const testCase of TEST_CASES) {
      if (device.type === 'webgpu' && !isSupportedByWebGPU(testCase.quotient)) {
        continue;
      }
      await cleanEvaluate(device, testCase);
      await testCase.quotient.readValue();
      expect(verifyTableValue(testCase.quotient, testCase.expected, 1e-7), testCase.title).toBe(
        null
      );
      testCase.quotient.destroy();
    }
  });
}
