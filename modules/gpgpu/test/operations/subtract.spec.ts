// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {cleanEvaluate, GPUTableEvaluator, subtract} from '@luma.gl/gpgpu';
import {getTestDevice, TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#subtract#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {
      eval: GPUTableEvaluator;
      expected: TestData;
    }[] = [
      {
        eval: subtract(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 2}),
          GPUTableEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {size: 2})
        ),
        expected: {value: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6], type: 'float32', size: 2}
      },
      {
        eval: subtract(
          GPUTableEvaluator.fromArray([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], {
            type: 'uint32',
            size: 2
          }),
          GPUTableEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {
            type: 'uint8',
            size: 2
          })
        ),
        expected: {
          value: [10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16],
          type: 'uint32',
          size: 2
        }
      },
      {
        eval: subtract(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 6}),
          GPUTableEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {size: 6})
        ),
        expected: {value: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6], type: 'float32', size: 6}
      },
      {
        eval: subtract(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 3}),
          GPUTableEvaluator.fromArray([1, -1, 1, -1], {size: 1})
        ),
        expected: {value: [-1, 0, 1, 4, 5, 6, 5, 6, 7, 10, 11, 12], type: 'float32', size: 3}
      },
      {
        eval: subtract(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 3}),
          1
        ),
        expected: {value: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], type: 'float32', size: 3}
      },
      {
        eval: subtract([5, 4, 3], [1, 2, 3]),
        expected: {constant: [4, 2, 0], type: 'float32', size: 3}
      },
      {
        eval: subtract(
          GPUTableEvaluator.fromArray([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], {size: 2}),
          GPUTableEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {size: 2}),
          GPUTableEvaluator.fromArray([1, -1, 1, -1, 1, -1], {type: 'sint8', size: 1})
        ),
        expected: {
          value: [9, 10, 12, 13, 11, 12, 14, 15, 13, 14, 16, 17],
          type: 'float32',
          size: 2
        }
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
        expect(verifyTableValue(testCase.eval, testCase.expected)).toBe(null);
        testCase.eval.destroy();
      });
    }
  });
}
