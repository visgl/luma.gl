// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {cleanEvaluate, dot, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice, TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#dot#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {eval: GPUTableEvaluator; expected: TestData}[] = [
      {
        eval: dot(
          GPUTableEvaluator.fromArray([1, 2, 3, 4, 5, 6], {size: 3}),
          GPUTableEvaluator.fromArray([7, 8, 9, -1, -2, -3], {size: 3})
        ),
        expected: {value: [50, -32], type: 'float32', size: 1}
      },
      {
        eval: dot(
          GPUTableEvaluator.fromConstant([1, 0, -1]),
          GPUTableEvaluator.fromArray([3, 4, 5, 6, 7, 8], {size: 3})
        ),
        expected: {value: [-2, -2], type: 'float32', size: 1}
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
        expect(verifyTableValue(testCase.eval, testCase.expected, 1e-6)).toBe(null);
        testCase.eval.destroy();
      });
    }
  });
}
