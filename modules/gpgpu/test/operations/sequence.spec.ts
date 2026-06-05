// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {cleanEvaluate, GPUDataEvaluator, sequence} from '@luma.gl/gpgpu';
import {getTestDevice, TestData, verifyTableValue} from './fixtures';

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#sequence#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {eval: GPUDataEvaluator; expected: TestData}[] = [
      {
        eval: sequence(5),
        expected: {value: [0, 1, 2, 3, 4], type: 'sint32', size: 1}
      },
      {
        eval: sequence(3, 2, 3),
        expected: {value: [2, 5, 8], type: 'sint32', size: 1}
      },
      {
        eval: sequence(4, 7, -2),
        expected: {value: [7, 5, 3, 1], type: 'sint32', size: 1}
      }
    ];

    for (const testCase of TEST_CASES) {
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
