// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {cleanEvaluate, length, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice, TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#length#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {eval: GPUTableEvaluator; expected: TestData}[] = [
      {
        eval: length(GPUTableEvaluator.fromArray([3, 4, 5, 12, 8, 15], {size: 2})),
        expected: {value: [5, 13, 17], type: 'float32', size: 1}
      },
      {
        eval: length(GPUTableEvaluator.fromArray([2, 3, 6, 1, 2, 2, 9, 12, 20], {size: 3})),
        expected: {value: [7, 3, 25], type: 'float32', size: 1}
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
