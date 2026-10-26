// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Compare opaque display RGB captures, with errors normalized to [0, 1]. */
export function compareChartImages(actual, reference) {
  if (!Number.isSafeInteger(actual.width) || !Number.isSafeInteger(actual.height) ||
    actual.width <= 0 || actual.height <= 0 || actual.width !== reference.width || actual.height !== reference.height ||
    actual.data.length !== actual.width * actual.height * 4 || reference.data.length !== actual.data.length) {
    throw new Error('Reference and capture must have equal positive dimensions and complete RGBA data');
  }
  let absoluteError = 0;
  let squaredError = 0;
  let maximumError = 0;
  for (let offset = 0; offset < actual.data.length; offset += 4) {
    for (let channel = 0; channel < 3; channel++) {
      const error = Math.abs(actual.data[offset + channel] - reference.data[offset + channel]) / 255;
      absoluteError += error;
      squaredError += error * error;
      maximumError = Math.max(maximumError, error);
    }
  }
  const channelCount = actual.width * actual.height * 3;
  const meanSquaredError = squaredError / channelCount;
  return {
    pixelCount: actual.width * actual.height,
    meanAbsoluteError: absoluteError / channelCount,
    rootMeanSquaredError: Math.sqrt(meanSquaredError),
    maximumError,
    // Null denotes exact equality: infinite PSNR cannot be represented in JSON.
    peakSignalToNoiseRatioDecibels: meanSquaredError === 0 ? null : -10 * Math.log10(meanSquaredError)
  };
}
