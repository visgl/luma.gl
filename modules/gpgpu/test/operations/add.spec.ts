// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {add, cleanEvaluate, GPUDataEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice, TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#add#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {
      eval: GPUDataEvaluator;
      expected: TestData;
    }[] = [
      {
        eval: add(
          GPUDataEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 2}),
          GPUDataEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {size: 2})
        ),
        expected: {value: [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16], type: 'float32', size: 2}
      },
      {
        eval: add(
          GPUDataEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {
            type: 'uint32',
            size: 2
          }),
          GPUDataEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {
            type: 'uint8',
            size: 2
          })
        ),
        expected: {value: [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16], type: 'uint32', size: 2}
      },
      {
        eval: add(
          GPUDataEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 6}),
          GPUDataEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {size: 6})
        ),
        expected: {value: [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16], type: 'float32', size: 6}
      },
      {
        eval: add(
          GPUDataEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 3}),
          GPUDataEvaluator.fromArray([1, -1, 1, -1], {size: 1})
        ),
        expected: {value: [1, 2, 3, 2, 3, 4, 7, 8, 9, 8, 9, 10], type: 'float32', size: 3}
      },
      {
        eval: add(
          GPUDataEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 3}),
          1
        ),
        expected: {value: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], type: 'float32', size: 3}
      },
      {
        eval: add([0, 1, 2], [1, 2, 3]),
        expected: {constant: [1, 3, 5], type: 'float32', size: 3}
      },
      {
        eval: add(
          GPUDataEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 2}),
          GPUDataEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {size: 2}),
          GPUDataEvaluator.fromArray([1, -1, 1, -1, 1, -1], {type: 'sint8', size: 1})
        ),
        expected: {value: [1, 2, 2, 3, 7, 8, 8, 9, 13, 14, 14, 15], type: 'float32', size: 2}
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
