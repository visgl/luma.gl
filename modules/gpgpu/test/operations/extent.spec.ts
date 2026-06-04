// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {cleanEvaluate, extent, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice, TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#extent#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {
      eval: GPUTableEvaluator;
      expected: TestData;
    }[] = [
      {
        eval: extent(GPUTableEvaluator.fromArray([4, 9, -1, 8, 7, 3, 2, 12], {size: 2})),
        expected: {value: [-1, 7, 3, 12], type: 'float32', size: 2}
      },
      {
        eval: extent(GPUTableEvaluator.fromArray([8, 2, 13, 5], {type: 'uint32', size: 1})),
        expected: {value: [2, 13], type: 'uint32', size: 2}
      },
      {
        eval: extent(GPUTableEvaluator.fromConstant([6, -2])),
        expected: {value: [6, 6, -2, -2], type: 'float32', size: 2}
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
