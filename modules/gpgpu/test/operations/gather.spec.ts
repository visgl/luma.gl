// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {cleanEvaluate, gather, GPUDataEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice, TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#gather#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {
      eval: GPUDataEvaluator;
      expected: TestData;
    }[] = [
      {
        eval: gather(
          GPUDataEvaluator.fromArray([2, 0, 1, 3], {type: 'uint32', size: 1}),
          GPUDataEvaluator.fromArray([10, 11, 20, 21, 30, 31, 40, 41], {size: 2})
        ),
        expected: {value: [30, 31, 10, 11, 20, 21, 40, 41], type: 'float32', size: 2}
      },
      {
        eval: gather(
          GPUDataEvaluator.fromArray([1, 9, 0, 7], {type: 'uint32', size: 1}),
          GPUDataEvaluator.fromArray([5, 6, 7, 8, 9, 10], {size: 3})
        ),
        expected: {value: [8, 9, 10, 0, 0, 0, 5, 6, 7, 0, 0, 0], type: 'float32', size: 3}
      },
      {
        eval: gather(
          GPUDataEvaluator.fromArray([3, 1, 0, 2], {type: 'uint32', size: 1}),
          GPUDataEvaluator.fromArray([2, 3, 5, 7], {type: 'uint32', size: 1})
        ),
        expected: {value: [7, 3, 2, 5], type: 'uint32', size: 1}
      },
      {
        eval: gather(
          GPUDataEvaluator.fromConstant(2, 'uint32'),
          GPUDataEvaluator.fromArray([10, 11, 20, 21, 30, 31, 40, 41], {size: 2})
        ),
        expected: {constant: [30, 31], type: 'float32', size: 2}
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
