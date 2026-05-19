// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {cleanEvaluate, GPUTableEvaluator, subtract} from '@luma.gl/gpgpu';
import {getTestDevice} from '@luma.gl/test-utils';
import {TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

for (const deviceType of ['webgl', 'webgpu'] as const) {
  test(`GPGPU#subtract#execute:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }
    const TEST_CASES: {
      title: string;
      difference: GPUTableEvaluator;
      expected: TestData;
    }[] = [
      {
        title: 'vec2 - vec2',
        difference: subtract(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 2}),
          GPUTableEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {size: 2})
        ),
        expected: {value: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6], type: 'float32', size: 2}
      },
      {
        title: 'uvec2 - uvec2',
        difference: subtract(
          GPUTableEvaluator.fromArray([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], {
            type: 'uint32',
            size: 2
          }),
          GPUTableEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {
            type: 'uint8',
            size: 2
          })
        ),
        expected: {
          value: [10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16],
          type: 'uint32',
          size: 2
        }
      },
      {
        title: 'vec6 - vec6',
        difference: subtract(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 6}),
          GPUTableEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {size: 6})
        ),
        expected: {value: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6], type: 'float32', size: 6}
      },
      {
        title: 'vec3 - float',
        difference: subtract(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 3}),
          GPUTableEvaluator.fromArray([1, -1, 1, -1], {size: 1})
        ),
        expected: {value: [-1, 1, 2, 4, 4, 5, 5, 7, 8, 10, 10, 11], type: 'float32', size: 3}
      },
      {
        title: 'vec3 - constant',
        difference: subtract(
          GPUTableEvaluator.fromArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], {size: 3}),
          GPUTableEvaluator.fromConstant(1)
        ),
        expected: {value: [-1, 1, 2, 2, 4, 5, 5, 7, 8, 8, 10, 11], type: 'float32', size: 3}
      },
      {
        title: 'constant - constant',
        difference: subtract(
          GPUTableEvaluator.fromConstant([5, 4, 3]),
          GPUTableEvaluator.fromConstant([1, 2, 3])
        ),
        expected: {constant: [4, 2, 0], type: 'float32', size: 3}
      },
      {
        title: 'vec2 - vec2 - int',
        difference: subtract(
          GPUTableEvaluator.fromArray([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], {size: 2}),
          GPUTableEvaluator.fromArray([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5], {size: 2}),
          GPUTableEvaluator.fromArray([1, -1, 1, -1, 1, -1], {type: 'sint8', size: 1})
        ),
        expected: {
          value: [9, 11, 12, 12, 11, 13, 14, 14, 13, 15, 16, 16],
          type: 'float32',
          size: 2
        }
      }
    ];
    for (const testCase of TEST_CASES) {
      if (device.type === 'webgpu' && !isSupportedByWebGPU(testCase.difference)) {
        continue;
      }
      await cleanEvaluate(device, testCase);
      await testCase.difference.readValue();
      expect(verifyTableValue(testCase.difference, testCase.expected), testCase.title).toBe(null);
      testCase.difference.destroy();
    }
  });
}
