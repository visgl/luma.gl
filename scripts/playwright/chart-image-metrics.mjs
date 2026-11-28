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
export function compareRadianceCaptures(actual, reference, {includeErrorTails = false} = {}) {
  if (actual.width !== reference.width || actual.height !== reference.height) {
    throw new Error('Linear HDR reference and capture must have equal dimensions');
  }
  let absoluteError = 0;
  let squaredError = 0;
  let maximumError = 0;
  const pixelCount = actual.width * actual.height;
  /** Squared RGB RMS error per pixel, independent of history confidence in alpha. */
  const pixelSquaredErrors = includeErrorTails ? new Float64Array(pixelCount) : null;
  for (let pixel = 0; pixel < pixelCount; pixel++) {
    let pixelSquaredError = 0;
    for (let channel = 0; channel < 3; channel++) {
      const offset = 8 + pixel * 8 + channel * 2;
      const error = Math.abs(decodeHalf(actual.view.getUint16(offset, true)) -
        decodeHalf(reference.view.getUint16(offset, true)));
      if (!Number.isFinite(error)) throw new Error('Linear HDR captures must contain finite RGB values');
      absoluteError += error;
      pixelSquaredError += error * error;
      maximumError = Math.max(maximumError, error);
    }
    squaredError += pixelSquaredError;
    if (pixelSquaredErrors) pixelSquaredErrors[pixel] = pixelSquaredError / 3;
  }
  return {
    pixelCount,
    meanAbsoluteError: absoluteError / (pixelCount * 3),
    rootMeanSquaredError: Math.sqrt(squaredError / (pixelCount * 3)),
    maximumError,
    ...(pixelSquaredErrors && {errorTails: summarizePixelErrorTails(pixelSquaredErrors)})
  };
}

/** Report nearest-rank percentiles and the mean energy in the worst 1% of pixels. */
function summarizePixelErrorTails(pixelSquaredErrors) {
  pixelSquaredErrors.sort();
  const pixelCount = pixelSquaredErrors.length;
  const tailCount = Math.ceil(pixelCount / 100);
  let tailEnergy = 0;
  for (let pixel = pixelCount - tailCount; pixel < pixelCount; pixel++) {
    tailEnergy += pixelSquaredErrors[pixel];
  }
  return {
    p95PixelRmse: Math.sqrt(pixelSquaredErrors[Math.ceil(pixelCount * 0.95) - 1]),
    p99PixelRmse: Math.sqrt(pixelSquaredErrors[Math.ceil(pixelCount * 0.99) - 1]),
    worstOnePercentRmse: Math.sqrt(tailEnergy / tailCount)
  };
}

/** Summarize the per-pixel retained sample confidence stored in HDR alpha. */
export function summarizeHistoryConfidence({width, height, view}) {
  const pixelCount = width * height;
  let total = 0;
  let minimum = Infinity;
  let maximum = 0;
  let pixelsWithoutHistory = 0;
  for (let pixel = 0; pixel < pixelCount; pixel++) {
    const confidence = decodeHalf(view.getUint16(8 + pixel * 8 + 6, true));
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 256) {
      throw new Error('Linear HDR history confidence must be finite and between 0 and 256');
    }
    total += confidence;
    minimum = Math.min(minimum, confidence);
    maximum = Math.max(maximum, confidence);
    pixelsWithoutHistory += Number(confidence === 0);
  }
  return {minimum, maximum, mean: total / pixelCount, pixelsWithoutHistory};
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
  const comparison = compareGpuCostCurves({uniform, power});
  if (comparison.status !== 'interpolated') return comparison;
  return {
    status: comparison.status,
    budgets: comparison.budgets.map(({gpuTimeMilliseconds, rootMeanSquaredError}) => ({
      gpuTimeMilliseconds,
      uniformRootMeanSquaredError: rootMeanSquaredError.uniform,
      powerRootMeanSquaredError: rootMeanSquaredError.power
    }))
  };
}

/** Compare display RMSE across reconstruction modes at shared measured GPU costs. */
export function compareReconstructionGpuCosts(unfiltered, spatial, variance) {
  return compareGpuCostCurves({unfiltered, spatial, variance});
}

/** Compare temporal modes over their common measured GPU cost intervals. */
export function compareMotionGpuCosts(off, on) {
  const measurements = {off, on};
  return {
    atPose: compareGpuCostCurves(measurements, 'gpuTimeAtPoseMilliseconds'),
    includingMotionPrefix: compareGpuCostCurves(measurements)
  };
}

/** Summarize complete per-frame GPU timings using nearest-rank percentiles. */
export function summarizeFrameGpuTimes(frameTimes, expectedFrames) {
  if (!expectedFrames || frameTimes?.length !== expectedFrames ||
    !frameTimes.every(time => Number.isFinite(time) && time > 0)) return null;
  const sortedTimes = [...frameTimes].sort((first, second) => first - second);
  return {
    totalMilliseconds: frameTimes.reduce((total, time) => total + time, 0),
    medianMilliseconds: sortedTimes[Math.ceil(sortedTimes.length * 0.5) - 1],
    p95Milliseconds: sortedTimes[Math.ceil(sortedTimes.length * 0.95) - 1]
  };
}

/** Compare measured curves without extrapolating any mode outside its observed costs. */
function compareGpuCostCurves(measurementsByMode, costField = 'gpuTimeMilliseconds') {
  const curves = Object.entries(measurementsByMode).map(([mode, measurements]) =>
    [mode, makeGpuCostCurve(measurements, costField)]);
  if (curves.some(([, curve]) => curve.length < 2)) {
    return {status: 'unavailable', reason: 'Each mode needs two distinct GPU timing checkpoints'};
  }
  const minimum = Math.max(...curves.map(([, curve]) => curve[0].gpuTimeMilliseconds));
  const maximum = Math.min(...curves.map(([, curve]) => curve.at(-1).gpuTimeMilliseconds));
  if (minimum > maximum) {
    return {status: 'unavailable', reason: 'The measured GPU cost ranges do not overlap'};
  }
  const budgets = [...new Set(curves.flatMap(([, curve]) => curve
    .map(point => point.gpuTimeMilliseconds)
    .filter(cost => cost >= minimum && cost <= maximum)))].sort((first, second) => first - second);
  return {
    status: 'interpolated',
    budgets: budgets.map(gpuTimeMilliseconds => ({
      gpuTimeMilliseconds,
      rootMeanSquaredError: Object.fromEntries(curves.map(([mode, curve]) =>
        [mode, interpolateGpuError(curve, gpuTimeMilliseconds)]))
    }))
  };
}

/** Sort valid timing checkpoints and retain the largest sample count for duplicate costs. */
function makeGpuCostCurve(measurements, costField) {
  const points = new Map();
  for (const measurement of measurements) {
    const cost = measurement[costField];
    const error = measurement.comparison?.rootMeanSquaredError;
    if (!Number.isFinite(cost) || cost <= 0 || !Number.isFinite(error)) continue;
    if (!points.has(cost) || (points.get(cost).samplesAtPose ?? points.get(cost).accumulatedSamples) <
        (measurement.samplesAtPose ?? measurement.accumulatedSamples)) {
      points.set(cost, {...measurement, gpuTimeMilliseconds: cost});
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
