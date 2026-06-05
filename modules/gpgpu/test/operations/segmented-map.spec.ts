// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {cleanEvaluate, segmentedMap, GPUDataEvaluator} from '@luma.gl/gpgpu';
import {getTestDevice, TestData, verifyTableValue} from './fixtures';

const LARGE_SEGMENTS = buildSegmentStarts(
  new Array(100).fill([5, 0, 12, 3, 1, 0, 8, 2, 15, 0, 6, 4, 9, 7, 0, 11]).flat()
);
const LARGE_VERTEX_COUNT = LARGE_SEGMENTS[LARGE_SEGMENTS.length - 1] + 13;
LARGE_SEGMENTS.push(LARGE_VERTEX_COUNT);

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#segmentedMap#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {
      eval: GPUDataEvaluator;
      expected: TestData;
    }[] = [
      {
        eval: segmentedMap(GPUDataEvaluator.fromArray([0, 3, 5], {type: 'uint32'}), 7),
        expected: {
          value: [0, 0, 0, 1, 0, 2, 1, 0, 1, 1, 2, 0, 2, 1],
          type: 'uint32',
          size: 2
        }
      },
      {
        eval: segmentedMap(GPUDataEvaluator.fromArray([0, 3, 3, 6], {type: 'uint32'}), 7),
        expected: {
          value: [0, 0, 0, 1, 0, 2, 2, 0, 2, 1, 2, 2, 3, 0],
          type: 'uint32',
          size: 2
        }
      },
      {
        eval: segmentedMap(GPUDataEvaluator.fromArray([0], {type: 'uint32'}), 0),
        expected: {
          value: [],
          type: 'uint32',
          size: 2
        }
      },
      {
        eval: segmentedMap(GPUDataEvaluator.fromArray([0], {type: 'uint32'}), 4),
        expected: {
          value: [0, 0, 0, 1, 0, 2, 0, 3],
          type: 'uint32',
          size: 2
        }
      },
      {
        eval: segmentedMap(
          GPUDataEvaluator.fromArray(LARGE_SEGMENTS, {type: 'uint32'}),
          LARGE_VERTEX_COUNT
        ),
        expected: {
          value: buildExpectedSegmentedMap(LARGE_SEGMENTS, LARGE_VERTEX_COUNT),
          type: 'uint32',
          size: 2
        }
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

function buildSegmentStarts(segmentLengths: number[]): number[] {
  const starts = [0];
  let offset = 0;
  for (const length of segmentLengths) {
    offset += length;
    starts.push(offset);
  }
  return starts;
}

function buildExpectedSegmentedMap(segmentStarts: number[], vertexCount: number): number[] {
  const expected: number[] = [];
  let segmentIndex = 0;

  for (let vertexIndex = 0; vertexIndex < vertexCount; vertexIndex++) {
    while (
      segmentIndex + 1 < segmentStarts.length &&
      segmentStarts[segmentIndex + 1] <= vertexIndex
    ) {
      segmentIndex++;
    }
    expected.push(segmentIndex, vertexIndex - segmentStarts[segmentIndex]);
  }

  return expected;
}
