// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {cleanEvaluate, multiply, GPUDataEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice, TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#multiply#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {
      eval: GPUDataEvaluator;
      expected: TestData;
    }[] = [
      {
        eval: multiply(
          GPUDataEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 2}),
          GPUDataEvaluator.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], {size: 2})
        ),
        expected: {value: [0, 2, 6, 12, 20, 30, 42, 56, 72, 90, 110, 132], type: 'float32', size: 2}
      },
      {
        eval: multiply(
          GPUDataEvaluator.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], {
            type: 'uint32',
            size: 2
          }),
          GPUDataEvaluator.fromArray([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], {
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
        eval: multiply(
          GPUDataEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 6}),
          GPUDataEvaluator.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], {size: 6})
        ),
        expected: {value: [0, 2, 6, 12, 20, 30, 42, 56, 72, 90, 110, 132], type: 'float32', size: 6}
      },
      {
        eval: multiply(
          GPUDataEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 3}),
          GPUDataEvaluator.fromArray([2, 2, -1, -1, 0.5, 0.5, -2, -2], {size: 2})
        ),
        expected: {value: [0, 2, 0, -3, -4, 0, 3, 3.5, 0, -18, -20, 0], type: 'float32', size: 3}
      },
      {
        eval: multiply(
          GPUDataEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 3}),
          [1, 2, 3]
        ),
        expected: {value: [0, 2, 6, 3, 8, 15, 6, 14, 24, 9, 20, 33], type: 'float32', size: 3}
      },
      {
        eval: multiply([1, 2, 3], [4, 5, 6]),
        expected: {constant: [4, 10, 18], type: 'float32', size: 3}
      },
      {
        eval: multiply(
          GPUDataEvaluator.fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], {size: 2}),
          GPUDataEvaluator.fromArray([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], {size: 2}),
          GPUDataEvaluator.fromArray([2, -1, 2, -1, 2, -1], {type: 'sint8', size: 1})
        ),
        expected: {
          value: [4, 12, -12, -20, 60, 84, -56, -72, 180, 220, -132, -156],
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
        expect(await verifyTableValue(testCase.eval, testCase.expected)).toBe(null);
        testCase.eval.destroy();
      });
    }
  });
}
