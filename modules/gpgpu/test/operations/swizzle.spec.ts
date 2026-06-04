// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {cleanEvaluate, GPUTableEvaluator, swizzle} from '@luma.gl/gpgpu';
import {getTestDevice, TestData, verifyTableValue, isSupportedByWebGPU} from './fixtures';

test('GPGPU#swizzle validates columns', () => {
  const source = GPUTableEvaluator.fromArray([0, 1, 2, 3], {size: 2});

  expect(() => swizzle(source, [])).toThrow(/must not be empty/);
  expect(() => swizzle(source, [0.5])).toThrow(/must be integers/);
  expect(() => swizzle(source, [-1])).toThrow(/out of range/);
  expect(() => swizzle(source, [2])).toThrow(/out of range/);
});

test('GPGPU#swizzle creates a source view for contiguous columns', () => {
  const source = GPUTableEvaluator.fromArray([10, 11, 12, 13, 20, 21, 22, 23], {size: 4});
  const result = swizzle(source, [1, 2]);

  expect(result.source).toBe(source);
  expect(result.size).toBe(2);
  expect(result.offset).toBe(Float32Array.BYTES_PER_ELEMENT);
  expect(result.stride).toBe(source.stride);
  expect(result.length).toBe(source.length);
  expect(result.normalized).toBe(source.normalized);
});

test('GPGPU#swizzle materializes CPU-backed values for reordered columns', () => {
  const source = GPUTableEvaluator.fromArray([10, 11, 12, 13, 20, 21, 22, 23], {size: 4});
  const result = swizzle(source, [2, 0, 2]);

  expect(result.source).toBe(null);
  expect(Array.from(result.value ?? [])).toEqual([12, 10, 12, 22, 20, 22]);
});

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#swizzle#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {eval: GPUTableEvaluator; expected: TestData; normalized?: boolean}[] = [
      {
        eval: swizzle(
          GPUTableEvaluator.fromArray([10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33], {
            size: 4
          }),
          [1, 2]
        ),
        expected: {value: [11, 12, 21, 22, 31, 32], type: 'float32', size: 2}
      },
      {
        eval: swizzle(
          GPUTableEvaluator.fromArray([10, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32, 33], {
            size: 4
          }),
          [2, 0, 2]
        ),
        expected: {value: [12, 10, 12, 22, 20, 22, 32, 30, 32], type: 'float32', size: 3}
      },
      {
        eval: swizzle(GPUTableEvaluator.fromConstant([4, 5, 6, 7], 'uint32'), [3, 1, 1]),
        expected: {constant: [7, 5, 5], type: 'uint32', size: 3}
      },
      {
        eval: swizzle(
          GPUTableEvaluator.fromArray(new Uint8Array([0, 64, 128, 255, 255, 128, 64, 0]), {
            type: 'uint8',
            size: 4,
            normalized: true
          }),
          [3, 1, 1]
        ),
        expected: {value: [255, 64, 64, 0, 128, 128], type: 'uint8', size: 3},
        normalized: true
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
        expect(testCase.eval.normalized).toBe(testCase.normalized ?? false);
        expect(await verifyTableValue(testCase.eval, testCase.expected)).toBe(null);
        testCase.eval.destroy();
      });
    }
  });
}
