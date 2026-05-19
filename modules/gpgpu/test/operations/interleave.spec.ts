// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {cleanEvaluate, interleave, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice} from '@luma.gl/test-utils';
import {TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu'] as const) {
  test(`GPGPU#interleave#execute:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }
    const TEST_CASES: {
      title: string;
      result: GPUTableEvaluator;
      expected: TestData;
    }[] = [
      {
        title: 'vec2 + vec2',
        result: interleave(
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
        title: 'vec3 + float',
        result: interleave(
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
        title: 'constant + constant',
        result: interleave(
          GPUTableEvaluator.fromConstant([0, 1, 2]),
          GPUTableEvaluator.fromConstant([1, 2, 3])
        ),
        expected: {constant: [0, 1, 2, 1, 2, 3], type: 'float32', size: 6}
      },
      {
        title: 'vec4 + vec2 + uint',
        result: interleave(
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
      if (device.type === 'webgpu' && !isSupportedByWebGPU(testCase.result)) {
        continue;
      }
      await cleanEvaluate(device, testCase);
      await testCase.result.readValue();
      expect(verifyTableValue(testCase.result, testCase.expected), testCase.title).toBe(null);
      testCase.result.destroy();
    }
  });
}
