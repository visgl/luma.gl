// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {cleanEvaluate, interleave, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice, TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#interleave#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {
      eval: GPUTableEvaluator;
      expected: TestData;
    }[] = [
      {
        eval: interleave(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], {size: 2}),
          GPUTableEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4], {size: 2})
        ),
        expected: {
          value: [0, 1, 0, 0, 2, 3, 1, 1, 4, 5, 2, 2, 6, 7, 3, 3, 8, 9, 4, 4],
          type: 'float32',
          size: 4
        }
      },
      {
        eval: interleave(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 3}),
          GPUTableEvaluator.fromArray([1, -1, 1, -1], {size: 1})
        ),
        expected: {
          value: [0, 1, 2, 1, 3, 4, 5, -1, 6, 7, 8, 1, 9, 10, 11, -1],
          type: 'float32',
          size: 4
        }
      },
      {
        eval: interleave(
          GPUTableEvaluator.fromConstant([0, 1, 2]),
          GPUTableEvaluator.fromConstant([1, 2, 3])
        ),
        expected: {constant: [0, 1, 2, 1, 2, 3], type: 'float32', size: 6}
      },
      {
        eval: interleave(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 4}),
          GPUTableEvaluator.fromArray([0, 0, 1, 1, 2, 2], {size: 2}),
          GPUTableEvaluator.fromArray([1, 2, 1], {type: 'uint32', size: 1})
        ),
        expected: {
          value: [0, 1, 2, 3, 0, 0, 1, 4, 5, 6, 7, 1, 1, 2, 8, 9, 10, 11, 2, 2, 1],
          type: 'float32',
          size: 7
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
