// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {cleanEvaluate, equalAll, GPUDataEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice, TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#equalAll#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {eval: GPUDataEvaluator; expected: TestData}[] = [
      {
        eval: equalAll(
          GPUDataEvaluator.fromArray([1, 2, 3, 4, 5, 6], {size: 3}),
          GPUDataEvaluator.fromArray([1, 2, 3, 4, 0, 6], {size: 3})
        ),
        expected: {value: [1, 0], type: 'uint32', size: 1}
      },
      {
        eval: equalAll(
          GPUDataEvaluator.fromConstant([2, 4]),
          GPUDataEvaluator.fromArray([2, 4, 2, 0, 2, 4], {type: 'uint32', size: 2})
        ),
        expected: {value: [1, 0, 1], type: 'uint32', size: 1}
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
