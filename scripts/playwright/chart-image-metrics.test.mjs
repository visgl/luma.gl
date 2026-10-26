// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import test from 'node:test';
import {compareChartImages} from './chart-image-metrics.mjs';

const image = data => ({width: 2, height: 1, data: new Uint8Array(data)});
test('display metrics report exact equality and ignore alpha', () => {
  assert.deepEqual(compareChartImages(image([0, 0, 0, 255, 255, 255, 255, 0]), image([0, 0, 0, 0, 255, 255, 255, 255])), {
    pixelCount: 2, meanAbsoluteError: 0, rootMeanSquaredError: 0, maximumError: 0, peakSignalToNoiseRatioDecibels: null
  });
});
test('display metrics measure known RGB error independently of alpha', () => {
  const metrics = compareChartImages(image([255, 0, 0, 255, 0, 0, 0, 255]), image([0, 0, 0, 255, 0, 0, 0, 255]));
  assert.equal(metrics.meanAbsoluteError, 1 / 6);
  assert.equal(metrics.rootMeanSquaredError, Math.sqrt(1 / 6));
  assert.equal(metrics.maximumError, 1);
  assert.equal(metrics.peakSignalToNoiseRatioDecibels, -10 * Math.log10(1 / 6));
});
test('display metrics reject incompatible dimensions or truncated pixels', () => {
  assert.throws(() => compareChartImages(image([0]), image([0])), /complete RGBA/);
  assert.throws(() => compareChartImages(image(new Array(8)), {...image(new Array(8)), width: 1, height: 2}), /equal positive dimensions/);
});
