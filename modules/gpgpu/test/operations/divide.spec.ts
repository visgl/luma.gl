// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {cleanEvaluate, divide, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice, TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#divide#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {
      eval: GPUTableEvaluator;
      expected: TestData;
    }[] = [
      {
        eval: divide(
          GPUTableEvaluator.fromArray([2, 6, 12, 20, 30, 42, 56, 72, 90, 110, 132, 156], {
            size: 2
          }),
          GPUTableEvaluator.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], {size: 2})
        ),
        expected: {value: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], type: 'float32', size: 2}
      },
      {
        eval: divide(
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
        eval: divide(
          GPUTableEvaluator.fromArray([2, 6, 12, 20, 30, 42, 56, 72, 90, 110, 132, 156], {
            size: 6
          }),
          GPUTableEvaluator.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], {size: 6})
        ),
        expected: {value: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], type: 'float32', size: 6}
      },
      {
        eval: divide(
          GPUTableEvaluator.fromArray([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24], {size: 3}),
          GPUTableEvaluator.fromArray([2, -2, 0.5, -0.5], {size: 1})
        ),
        expected: {
          value: [1, 2, 3, -4, -5, -6, 28, 32, 36, -40, -44, -48],
          type: 'float32',
          size: 3
        }
      },
      {
        eval: divide(
          GPUTableEvaluator.fromArray([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24], {size: 3}),
          [2, 2, 2]
        ),
        expected: {value: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], type: 'float32', size: 3}
      },
      {
        eval: divide([8, 27, 64], [2, 3, 4]),
        expected: {constant: [4, 9, 16], type: 'float32', size: 3}
      }
    ];

    for (const testCase of TEST_CASES) {
      if (deviceType === 'webgpu' && !isSupportedByWebGPU(testCase.eval)) {
        continue;
      }
      test(testCase.eval.toString(), async t => {
        if (!device) {
          t.skip(`${deviceType} not available`);
          return;
        }
        await cleanEvaluate(device, testCase);
        await testCase.eval.readValue();
        expect(verifyTableValue(testCase.eval, testCase.expected, 1e-7)).toBe(null);
        testCase.eval.destroy();
      });
    }
  });
}
