// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect, describe, beforeEach} from 'vitest';
import type {Device} from '@luma.gl/core';
import {
  add,
  subtract,
  multiply,
  interleave,
  log,
  tan,
  cleanEvaluate,
  GPUTableEvaluator
} from '@luma.gl/gpgpu';
import {
  getTestDevice,
  TestData,
  verifyTableValue,
  isSupportedByWebGPU,
  getRunStats
} from './fixtures';

for (const deviceType of ['webgl', 'webgpu', 'cpu'] as const) {
  describe(`GPGPU#add#execute:${deviceType}`, () => {
    let device: Device | null;

    beforeEach(async () => {
      device = await getTestDevice(deviceType);
    });

    const TEST_CASES: {
      eval: GPUTableEvaluator;
      expected: TestData;
      runCount?: number;
    }[] = [
      {
        // deck.gl position linear interpolation
        eval: (function () {
          const start = GPUTableEvaluator.fromArray(
            new Float32Array([0, 0, 0, -1, 1, -1, 2, 4, 6, -100, -101, -102]),
            {size: 3}
          );
          const end = GPUTableEvaluator.fromArray(
            new Float32Array([5, 4, 3, 1, -1, 1, -2, -4, -6, -100, -100, -100]),
            {size: 3}
          );

          // interp(start, end, 0.25)
          return add(start, multiply(subtract(end, start), 0.25));
        })(),
        expected: {
          value: [1.25, 1, 0.75, -0.5, 0.5, -0.5, 1, 2, 3, -100, -100.75, -101.5],
          type: 'float32',
          size: 3
        }
      },
      {
        // deck.gl color linear interpolation
        eval: (function () {
          const start = GPUTableEvaluator.fromArray(
            new Uint8Array([0, 0, 0, 255, 255, 255, 255, 255, 10, 20, 40, 80, 200, 160, 80, 40]),
            {size: 4, normalized: true}
          );
          const end = GPUTableEvaluator.fromArray(
            new Uint8Array([
              255, 255, 255, 255, 0, 0, 255, 255, 100, 100, 100, 100, 0, 180, 200, 0
            ]),
            {size: 4, normalized: true}
          );

          // interp(start, end, 0.8)
          return add(start, multiply(subtract(end, start), 0.8));
        })(),
        expected: {
          value: [204, 204, 204, 255, 51, 51, 255, 255, 82, 84, 88, 96, 40, 176, 176, 8].map(
            x => x / 255
          ),
          type: 'float32',
          size: 4
        }
      },
      {
        // web mercator projection
        eval: (function () {
          const pos = GPUTableEvaluator.fromArray(
            new Float32Array([
              -122.4119, 37.7829, -0.11843, 51.5129, -74.01295, 40.7107, -58.4169, -34.6194,
              86.9207, 27.9882, 0, -84.999
            ]),
            {size: 2}
          );
          const lon = new GPUTableEvaluator({
            id: 'x',
            source: pos,
            type: 'float32',
            size: 1,
            offset: 0
          });
          const lat = new GPUTableEvaluator({
            id: 'y',
            source: pos,
            type: 'float32',
            size: 1,
            offset: 4
          });

          // radians(lon)
          const x = multiply(lon, Math.PI / 180);
          // log(tan(PI / 4 + radians(lat) * 0.5))
          const y = log(tan(add(Math.PI / 4, multiply(lat, (Math.PI / 180) * 0.5))));
          return interleave(x, y);
        })(),
        expected: {
          value: [
            [-122.4119, 37.7829],
            [-0.11843, 51.5129],
            [-74.01295, 40.7107],
            [-58.4169, -34.6194],
            [86.9207, 27.9882],
            [0, -84.999]
          ].flatMap(([lon, lat]) => [
            (lon * Math.PI) / 180,
            Math.log(Math.tan(Math.PI / 4 + ((lat * Math.PI) / 180) * 0.5))
          ]),
          type: 'float32',
          size: 2
        },
        runCount: 3
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
        await testCase.eval.readValue();
        expect(verifyTableValue(testCase.eval, testCase.expected, 1e-6)).toBe(null);
        if (stat) {
          expect(stat.count - beforeCount).toBe(testCase.runCount ?? 1);
        }

        testCase.eval.destroy();
      });
    }
  });
}
