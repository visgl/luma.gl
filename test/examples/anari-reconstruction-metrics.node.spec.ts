// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  compareEmitterGpuCosts,
  compareReconstructionGpuCosts,
  summarizeFrameGpuTimes,
  summarizeHistoryConfidence,
  decodeRadianceCapture
} from '../../scripts/playwright/chart-image-metrics.mjs';

/** Builds one convergence checkpoint for the interpolation tests. */
function checkpoint(gpuTimeMilliseconds: number, rootMeanSquaredError: number) {
  return {gpuTimeMilliseconds, accumulatedSamples: 4, comparison: {rootMeanSquaredError}};
}

test('compares all reconstruction modes within their shared cost range', () => {
  const unfiltered = [checkpoint(1, 8), checkpoint(5, 4)];
  const spatial = [checkpoint(2, 6), checkpoint(6, 2)];
  const variance = [checkpoint(3, 4), checkpoint(7, 0)];

  expect(compareReconstructionGpuCosts(unfiltered, spatial, variance)).toEqual({
    status: 'interpolated',
    budgets: [
      {gpuTimeMilliseconds: 3, rootMeanSquaredError: {unfiltered: 6, spatial: 5, variance: 4}},
      {gpuTimeMilliseconds: 5, rootMeanSquaredError: {unfiltered: 4, spatial: 3, variance: 2}}
    ]
  });
  expect(compareReconstructionGpuCosts(unfiltered, spatial, [])).toMatchObject({
    status: 'unavailable'
  });
  expect(
    compareReconstructionGpuCosts(unfiltered, spatial, [checkpoint(6, 4), checkpoint(7, 2)])
  ).toMatchObject({status: 'unavailable'});
  expect(compareEmitterGpuCosts(unfiltered, spatial).budgets?.[0]).toEqual({
    gpuTimeMilliseconds: 2,
    uniformRootMeanSquaredError: 7,
    powerRootMeanSquaredError: 6
  });
});

test('reports GPU timing percentiles only from a complete set of positive frame timings', () => {
  expect(summarizeFrameGpuTimes([5, 1, 4, 2, 3], 5)).toEqual({
    totalMilliseconds: 15,
    medianMilliseconds: 3,
    p95Milliseconds: 5
  });
  expect(summarizeFrameGpuTimes([5, 1], 3)).toBeNull();
  expect(summarizeFrameGpuTimes([1, null], 2)).toBeNull();
  expect(summarizeFrameGpuTimes(undefined, 2)).toBeNull();
});

test('reads fractional history confidence independently of linear RGB', () => {
  const bytes = new Uint8Array(32);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 3, true);
  view.setUint32(4, 1, true);
  view.setUint16(8, 0x7c00, true); // RGB is outside the confidence calculation.
  view.setUint16(22, 0x3e00, true); // 1.5 retained samples.
  view.setUint16(30, 0x4480, true); // 4.5 retained samples.
  expect(summarizeHistoryConfidence(decodeRadianceCapture(bytes))).toEqual({
    minimum: 0,
    maximum: 4.5,
    mean: 2,
    pixelsWithoutHistory: 1
  });
});
