// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import test from 'node:test';
import {compareEmitterGpuCosts, compareChartImages, compareRadianceCaptures, decodeRadianceCapture} from './chart-image-metrics.mjs';

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

function radiance(channels) {
  const bytes = Buffer.alloc(16);
  bytes.writeUInt32LE(1, 0);
  bytes.writeUInt32LE(1, 4);
  channels.forEach((value, channel) => bytes.writeUInt16LE(value, 8 + channel * 2));
  return decodeRadianceCapture(bytes);
}

test('linear HDR metrics retain values above one and ignore history metadata in alpha', () => {
  const metrics = compareRadianceCaptures(
    radiance([0x4400, 0x3800, 0, 0x7c00]),
    radiance([0x4000, 0x3800, 0, 0])
  );
  assert.equal(metrics.maximumError, 2);
  assert.equal(metrics.meanAbsoluteError, 2 / 3);
  assert.equal(metrics.rootMeanSquaredError, Math.sqrt(4 / 3));
});

test('linear HDR metrics reject broken files and nonfinite radiance', () => {
  assert.throws(() => decodeRadianceCapture(Buffer.alloc(7)), /Truncated/);
  assert.throws(() => decodeRadianceCapture(Buffer.alloc(8)), /Invalid/);
  assert.throws(() => compareRadianceCaptures(radiance([0x7c00]), radiance([0])), /finite RGB/);
});

test('emitter cost comparison interpolates only within both measured GPU ranges', () => {
  const checkpoint = (gpuTimeMilliseconds, rootMeanSquaredError) => ({
    gpuTimeMilliseconds, comparison: {rootMeanSquaredError}, accumulatedSamples: 4
  });
  assert.deepEqual(compareEmitterGpuCosts(
    [checkpoint(2, 4), checkpoint(6, 2)],
    [checkpoint(4, 3), checkpoint(8, 1)]
  ), {status: 'interpolated', budgets: [
    {gpuTimeMilliseconds: 4, uniformRootMeanSquaredError: 3, powerRootMeanSquaredError: 3},
    {gpuTimeMilliseconds: 6, uniformRootMeanSquaredError: 2, powerRootMeanSquaredError: 2}
  ]});
  assert.equal(compareEmitterGpuCosts([checkpoint(null, 4)], []).status, 'unavailable');
  assert.equal(compareEmitterGpuCosts(
    [checkpoint(1, 4), checkpoint(2, 2)],
    [checkpoint(4, 3), checkpoint(8, 1)]
  ).status, 'unavailable');
});
