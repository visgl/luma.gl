// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {cleanEvaluate, select, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice, TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#select#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {eval: GPUTableEvaluator; expected: TestData}[] = [
      {
        eval: select(
          GPUTableEvaluator.fromArray([1, 0, 2], {type: 'uint32', size: 1}),
          GPUTableEvaluator.fromArray([10, 11, 20, 21, 30, 31], {size: 2}),
          GPUTableEvaluator.fromArray([100, 101, 200, 201, 300, 301], {size: 2})
        ),
        expected: {value: [10, 11, 200, 201, 30, 31], type: 'float32', size: 2}
      },
      {
        eval: select(
          GPUTableEvaluator.fromArray([1, 0, 0, 1, 1, 1], {type: 'uint32', size: 2}),
          GPUTableEvaluator.fromConstant(5, 'uint32'),
          GPUTableEvaluator.fromArray([10, 11, 20, 21, 30, 31], {type: 'uint32', size: 2})
        ),
        expected: {value: [5, 11, 20, 5, 5, 5], type: 'uint32', size: 2}
      },
      {
        eval: select(
          GPUTableEvaluator.fromArray([0, 1, 0, 1], {type: 'uint32', size: 1}),
          GPUTableEvaluator.fromArray([0.5, 1.5, 2.5, 3.5], {size: 1}),
          GPUTableEvaluator.fromArray([9, 8, 7, 6], {size: 1})
        ),
        expected: {value: [9, 1.5, 7, 3.5], type: 'float32', size: 1}
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
        expect(await verifyTableValue(testCase.eval, testCase.expected, 1e-6)).toBe(null);
        testCase.eval.destroy();
      });
    }
  });
}
