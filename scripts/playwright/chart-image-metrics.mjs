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

/** Decode a capture with two uint32 dimensions followed by tightly packed RGBA16F. */
export function decodeRadianceCapture(bytes) {
  if (bytes.byteLength < 8) throw new Error('Truncated radiance capture header');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(0, true);
  const height = view.getUint32(4, true);
  if (!width || !height || bytes.byteLength !== 8 + width * height * 8) {
    throw new Error('Invalid radiance capture dimensions or byte length');
  }
  return {width, height, view};
}

/** Compare unnormalized linear RGB values. Alpha stores history metadata. */
export function compareRadianceCaptures(actual, reference) {
  if (actual.width !== reference.width || actual.height !== reference.height) {
    throw new Error('Linear HDR reference and capture must have equal dimensions');
  }
  let absoluteError = 0;
  let squaredError = 0;
  let maximumError = 0;
  const pixelCount = actual.width * actual.height;
  for (let pixel = 0; pixel < pixelCount; pixel++) {
    for (let channel = 0; channel < 3; channel++) {
      const offset = 8 + pixel * 8 + channel * 2;
      const error = Math.abs(decodeHalf(actual.view.getUint16(offset, true)) -
        decodeHalf(reference.view.getUint16(offset, true)));
      if (!Number.isFinite(error)) throw new Error('Linear HDR captures must contain finite RGB values');
      absoluteError += error;
      squaredError += error * error;
      maximumError = Math.max(maximumError, error);
    }
  }
  return {
    pixelCount,
    meanAbsoluteError: absoluteError / (pixelCount * 3),
    rootMeanSquaredError: Math.sqrt(squaredError / (pixelCount * 3)),
    maximumError
  };
}

/** Decode an IEEE 754 binary16 channel to a JavaScript number. */
function decodeHalf(value) {
  const exponent = (value >> 10) & 31;
  const fraction = value & 1023;
  const sign = value & 0x8000 ? -1 : 1;
  if (exponent === 31) return fraction ? NaN : sign * Infinity;
  if (exponent === 0) return sign * fraction * 2 ** -24;
  return sign * (1 + fraction / 1024) * 2 ** (exponent - 15);
}

/** Compare linear RMSE at costs covered by both recorded GPU timing curves. */
export function compareEmitterGpuCosts(uniform, power) {
  const uniformCurve = makeGpuCostCurve(uniform);
  const powerCurve = makeGpuCostCurve(power);
  if (uniformCurve.length < 2 || powerCurve.length < 2) {
    return {status: 'unavailable', reason: 'Each mode needs two distinct GPU timing checkpoints'};
  }
  const minimum = Math.max(uniformCurve[0].gpuTimeMilliseconds, powerCurve[0].gpuTimeMilliseconds);
  const maximum = Math.min(uniformCurve.at(-1).gpuTimeMilliseconds, powerCurve.at(-1).gpuTimeMilliseconds);
  if (minimum > maximum) {
    return {status: 'unavailable', reason: 'The measured GPU cost ranges do not overlap'};
  }
  const budgets = [...new Set([...uniformCurve, ...powerCurve]
    .map(point => point.gpuTimeMilliseconds)
    .filter(cost => cost >= minimum && cost <= maximum))].sort((first, second) => first - second);
  return {
    status: 'interpolated',
    budgets: budgets.map(gpuTimeMilliseconds => ({
      gpuTimeMilliseconds,
      uniformRootMeanSquaredError: interpolateGpuError(uniformCurve, gpuTimeMilliseconds),
      powerRootMeanSquaredError: interpolateGpuError(powerCurve, gpuTimeMilliseconds)
    }))
  };
}

/** Sort valid timing checkpoints and retain the largest sample count for duplicate costs. */
function makeGpuCostCurve(measurements) {
  const points = new Map();
  for (const measurement of measurements) {
    const cost = measurement.gpuTimeMilliseconds;
    const error = measurement.comparison?.rootMeanSquaredError;
    if (!Number.isFinite(cost) || cost <= 0 || !Number.isFinite(error)) continue;
    if (!points.has(cost) || points.get(cost).accumulatedSamples < measurement.accumulatedSamples) {
      points.set(cost, measurement);
    }
  }
  return [...points.values()].sort((first, second) => first.gpuTimeMilliseconds - second.gpuTimeMilliseconds);
}

/** Linearly interpolate within the measured range. */
function interpolateGpuError(curve, cost) {
  const upper = curve.findIndex(point => point.gpuTimeMilliseconds >= cost);
  const following = curve[upper];
  if (following.gpuTimeMilliseconds === cost) return following.comparison.rootMeanSquaredError;
  const previous = curve[upper - 1];
  const fraction = (cost - previous.gpuTimeMilliseconds) /
    (following.gpuTimeMilliseconds - previous.gpuTimeMilliseconds);
  return previous.comparison.rootMeanSquaredError * (1 - fraction) +
    following.comparison.rootMeanSquaredError * fraction;
}
