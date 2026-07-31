// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {cleanEvaluate, interleave, GPUDataEvaluator, Operation} from '@luma.gl/gpgpu';
import {
  getRunStats,
  getTestDevice,
  TestData,
  verifyTableValue,
  isSupportedByWebGPU
} from './fixtures';

test('GPGPU#interleave preserves input array order', () => {
  const inputs = [
    GPUDataEvaluator.fromConstant([1]),
    GPUDataEvaluator.fromConstant([2]),
    GPUDataEvaluator.fromConstant([3])
  ];
  const result = interleave(...inputs);

  expect(result.source).toBeInstanceOf(Operation);
  expect((result.source as Operation<GPUDataEvaluator[]>).inputs).toEqual(inputs);

  result.destroy();
  for (const input of inputs) {
    input.destroy();
  }
});

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#interleave#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {
      eval: GPUDataEvaluator;
      expected: TestData;
      runCount?: number;
    }[] = [
      {
        eval: interleave(
          GPUDataEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], {size: 2}),
          GPUDataEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4], {size: 2})
        ),
        expected: {
          value: [0, 1, 0, 0, 2, 3, 1, 1, 4, 5, 2, 2, 6, 7, 3, 3, 8, 9, 4, 4],
          type: 'float32',
          size: 4
        }
      },
      {
        eval: interleave(
          GPUDataEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 3}),
          GPUDataEvaluator.fromArray([1, -1, 1, -1], {size: 1})
        ),
        expected: {
          value: [0, 1, 2, 1, 3, 4, 5, -1, 6, 7, 8, 1, 9, 10, 11, -1],
          type: 'float32',
          size: 4
        }
      },
      {
        eval: interleave(
          GPUDataEvaluator.fromConstant([0, 1, 2]),
          GPUDataEvaluator.fromConstant([1, 2, 3])
        ),
        expected: {constant: [0, 1, 2, 1, 2, 3], type: 'float32', size: 6},
        runCount: 0
      },
      {
        eval: interleave(
          GPUDataEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 4}),
          GPUDataEvaluator.fromArray([0, 0, 1, 1, 2, 2], {size: 2}),
          GPUDataEvaluator.fromArray([1, 2, 1], {type: 'uint32', size: 1})
        ),
        expected: {
          value: [0, 1, 2, 3, 0, 0, 1, 4, 5, 6, 7, 1, 1, 2, 8, 9, 10, 11, 2, 2, 1],
          type: 'float32',
          size: 7
        },
        runCount: 1
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
        const stat = getRunStats(device);
        const beforeCount = stat?.count ?? 0;
        await cleanEvaluate(device, testCase);
        expect(await verifyTableValue(testCase.eval, testCase.expected)).toBe(null);
        if (stat) {
          expect(stat.count - beforeCount).toBe(testCase.runCount ?? 1);
        }
        testCase.eval.destroy();
      });
    }
  });
}
