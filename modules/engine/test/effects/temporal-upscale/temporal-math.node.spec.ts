// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  DEFAULT_KERNEL_SHARPNESS,
  getLuminanceChange,
  getForgetting,
  halton,
  getJitterPhaseCount,
  getJitterOffset,
  jitterToClipOffset,
  applyJitterToProjectionMatrix,
  reprojectUV,
  getVelocityFromDepth,
  rgbToYCoCg,
  yCoCgToRgb,
  clipToBox,
  lanczos2,
  getCatmullRomWeights,
  isDisoccluded,
  getKernelScale,
  getSampleWeight,
  getMaximumWeight,
  getCurrentBlend,
  getNextWeight,
  getHistoryTrust
} from '../../../src/effects/temporal-upscale/temporal-math';
import type {
  TemporalVector2,
  TemporalVector3
} from '../../../src/effects/temporal-upscale/temporal-math';

/** Compares every component, including array length. */
function expectVector(
  actual: readonly number[],
  expected: readonly number[],
  precision = 12
): void {
  expect(actual).toHaveLength(expected.length);
  expected.forEach((value, index) => expect(actual[index]).toBeCloseTo(value, precision));
}

/** Projects a point using a column-major matrix to top-left UV and device depth. */
function project(matrix: number[], point: number[]): TemporalVector3 {
  const clip = [0, 1, 2, 3].map(row =>
    point.reduce((sum, value, column) => sum + matrix[column * 4 + row] * value, 0)
  );
  return [
    (clip[0] / clip[3]) * 0.5 + 0.5,
    0.5 - (clip[1] / clip[3]) * 0.5,
    (clip[2] / clip[3]) * 0.5 + 0.5
  ];
}

/** General test-only inverse, independent of the production projection implementation. */
function invertMatrix(matrix: number[]): number[] {
  const rows = [0, 1, 2, 3].map(row => [
    ...[0, 1, 2, 3].map(column => matrix[column * 4 + row]),
    ...[0, 1, 2, 3].map(column => Number(column === row))
  ]);
  for (let column = 0; column < 4; column++) {
    const pivot = rows.findIndex((row, index) => index >= column && Math.abs(row[column]) > 1e-10);
    [rows[column], rows[pivot]] = [rows[pivot], rows[column]];
    const divisor = rows[column][column];
    rows[column] = rows[column].map(value => value / divisor);
    for (let row = 0; row < 4; row++) {
      if (row === column) continue;
      const multiplier = rows[row][column];
      rows[row] = rows[row].map((value, index) => value - multiplier * rows[column][index]);
    }
  }
  return Array.from({length: 16}, (_, index) => rows[index % 4][4 + Math.floor(index / 4)]);
}

it('Halton uses the exact first eight radical-inverse fractions', () => {
  expect(halton(0, 2)).toBe(0);
  expect(halton(0, 3)).toBe(0);
  const binary = [1 / 2, 1 / 4, 3 / 4, 1 / 8, 5 / 8, 3 / 8, 7 / 8, 1 / 16];
  const ternary = [1 / 3, 2 / 3, 1 / 9, 4 / 9, 7 / 9, 2 / 9, 5 / 9, 8 / 9];
  binary.forEach((value, index) => expect(halton(index + 1, 2)).toBe(value));
  ternary.forEach((value, index) => expect(halton(index + 1, 3)).toBeCloseTo(value, 15));
  expect(halton(9, 3)).toBeCloseTo(1 / 27, 15);
});

it('jitter follows phase count, first-index, range, period and stratification rules', () => {
  expect(getJitterPhaseCount(100, 100)).toBe(8);
  expect(getJitterPhaseCount(100, 200)).toBe(32);
  expect(getJitterPhaseCount(100, 150)).toBe(18);
  expect(getJitterPhaseCount(100, 101)).toBe(9);
  expect(getJitterPhaseCount(1000, 100)).toBe(1);
  expectVector(getJitterOffset(0, 8), [0, -1 / 6]);
  expectVector(getJitterOffset(7, 8), [-7 / 16, 7 / 18]);
  for (const phaseCount of [1, 8, 9, 32]) {
    const offsets = Array.from({length: phaseCount}, (_, index) =>
      getJitterOffset(index, phaseCount)
    );
    expect(new Set(offsets.map(value => value.join(','))).size).toBe(phaseCount);
    offsets.forEach((offset, index) => {
      expectVector(getJitterOffset(index + phaseCount, phaseCount), offset);
      offset.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(-0.5);
        expect(value).toBeLessThan(0.5);
      });
    });
  }
  for (const [component, phaseCount] of [
    [0, 8],
    [1, 9]
  ]) {
    const bins = Array.from({length: phaseCount}, (_, index) =>
      Math.floor((getJitterOffset(index, phaseCount)[component] + 0.5) * phaseCount + 1e-12)
    );
    expect(bins.sort((first, second) => first - second)).toEqual(
      Array.from({length: phaseCount}, (_, index) => index)
    );
  }
});

it('clip jitter has the mandated signs and magnitudes', () => {
  expectVector(jitterToClipOffset([0.5, 0.5], [100, 200]), [0.01, -0.005]);
  expectVector(jitterToClipOffset([-0.25, -0.5], [50, 100]), [-0.01, 0.01]);
});

it('jittered perspective AND orthographic projections move pixels without changing depth or the input', () => {
  const perspective = [1.2, 0, 0, 0, 0, 1.6, 0, 0, 0.1, -0.2, -11 / 9, -1, 0, 0, -20 / 9, 0];
  const orthographic = [0.2, 0, 0, 0, 0, 0.4, 0, 0, 0, 0, -2 / 9, 0, -0.3, 0.1, -11 / 9, 1];
  const renderSize: TemporalVector2 = [100, 80];
  const jitter: TemporalVector2 = [0.375, -0.25];
  for (const matrix of [perspective, orthographic]) {
    const original = [...matrix];
    const jittered = applyJitterToProjectionMatrix(matrix, jitter, renderSize);
    expect(matrix).toEqual(original);
    expect(jittered).not.toBe(matrix);
    for (const point of [
      [1, 0.5, -3, 1],
      [-1, 0.2, -7, 1]
    ]) {
      const before = project(matrix, point);
      const after = project(jittered, point);
      expectVector(
        [(after[0] - before[0]) * 100, (after[1] - before[1]) * 80, after[2] - before[2]],
        [...jitter, 0]
      );
    }
  }
});

it('camera translation recovers unjittered motion and previous depth from jittered depth', () => {
  const current = [1.2, 0, 0, 0, 0, 1.6, 0, 0, 0, 0, -11 / 9, -1, 0, 0, -20 / 9, 0];
  // Previous camera translated by (+0.5,-0.25,+1); last column is projection * -translation.
  const previous = [...current];
  previous[12] = -0.6;
  previous[13] = 0.4;
  previous[14] += 11 / 9;
  previous[15] = 1;
  const world = [0.3, 0.2, -4, 1];
  const jitter: TemporalVector2 = [0.375, -0.2];
  const renderSize: TemporalVector2 = [100, 80];
  const currentPoint = project(current, world);
  const previousPoint = project(previous, world);
  const jitteredPoint = project(applyJitterToProjectionMatrix(current, jitter, renderSize), world);
  const options = {
    uv: jitteredPoint.slice(0, 2) as TemporalVector2,
    depth: jitteredPoint[2],
    jitter,
    renderSize,
    currentViewProjectionInverse: invertMatrix(current),
    previousViewProjection: previous
  };
  const velocity = getVelocityFromDepth(options);
  expectVector(velocity, [
    currentPoint[0] - previousPoint[0],
    currentPoint[1] - previousPoint[1],
    1 - previousPoint[2]
  ]);
  expectVector(
    reprojectUV(
      currentPoint.slice(0, 2) as TemporalVector2,
      velocity.slice(0, 2) as TemporalVector2
    ),
    previousPoint.slice(0, 2)
  );
  expectVector(getVelocityFromDepth({...options, previousViewProjection: current}), [
    0,
    0,
    1 - currentPoint[2]
  ]);
  expectVector(reprojectUV([0.25, 0.6], [0.1, -0.2]), [0.15, 0.8]);
});

it('YCoCg basis and round trip preserve linear HDR and signed values', () => {
  expectVector(rgbToYCoCg([1, 0, 0]), [0.25, 0.5, -0.25]);
  expectVector(rgbToYCoCg([0, 1, 0]), [0.5, 0, 0.5]);
  expectVector(rgbToYCoCg([0, 0, 1]), [0.25, -0.5, -0.25]);
  for (const color of [
    [0.2, 0.6, 0.9],
    [4, 2, 0.5],
    [-0.3, 1.2, 0]
  ] as TemporalVector3[]) {
    expectVector(yCoCgToRgb(rgbToYCoCg(color)), color);
  }
});

it('box clipping preserves interior and clips a LINE to the box surface, including zero extents', () => {
  expectVector(clipToBox([0.3, 0.4, 0.5], [0, 0, 0], [1, 1, 1]), [0.3, 0.4, 0.5]);
  expectVector(clipToBox([2, 1, 0.5], [0, 0, 0], [1, 1, 1]), [1, 2 / 3, 0.5]);
  expectVector(clipToBox([-2, 1, 0.5], [0, 0, 0], [1, 1, 1]), [0, 0.6, 0.5]);
  expectVector(clipToBox([10, -5, 3], [1, 2, 3], [1, 2, 3]), [1, 2, 3]);
  expectVector(clipToBox([0.5, 2, 0.5], [0, 0.5, 0], [1, 0.5, 1]), [0.5, 0.5, 0.5]);
});

it('four-tap disocclusion is conservative, one-sided, and guarded at the far plane', () => {
  expect(isDisoccluded([0.526, 0.6, 0.7, 0.8], 0.5)).toBe(true);
  expect(isDisoccluded([0.524, 0.6, 0.7, 0.8], 0.5)).toBe(false);
  expect(isDisoccluded([0.525, 0.6, 0.7, 0.8], 0.5)).toBe(false);
  expect(isDisoccluded([0.1, 0.1, 0.1, 0.1], 0.5)).toBe(false);
  expect(isDisoccluded([0.56, 0.56, 0.56, 0.56], 0.5, 0.1)).toBe(true);
  expect(isDisoccluded([0.54, 0.54, 0.54, 0.54], 0.5, 0.1)).toBe(false);
  // The second argument is `1 - depth`: 0 is the far plane.
  expect(isDisoccluded([0, 0, 0, 0], 0)).toBe(false);
  expect(isDisoccluded([0.000009, 0.1, 0.1, 0.1], 0)).toBe(false);
  expect(isDisoccluded([0.000011, 0.1, 0.1, 0.1], 0)).toBe(true);
  // A value below 0 (beyond the far plane) is the far plane.
  expect(isDisoccluded([0.000005, 0.1, 0.1, 0.1], -1)).toBe(false);
});

it('a static distant surface keeps its history after half-float storage', () => {
  /** Rounds to the 11 significant bits of a half-float. */
  const toHalfFloat = (value: number) => {
    if (value === 0) return 0;
    const step = 2 ** (Math.floor(Math.log2(Math.abs(value))) - 10);
    return Math.round(value / step) * step;
  };
  for (const depth of [0.5, 0.9, 0.99, 0.9998, 0.99999]) {
    const stored = toHalfFloat(1 - depth);
    expect(isDisoccluded([stored, stored, stored, stored], toHalfFloat(1 - depth))).toBe(false);
  }
  // The reason for the `1 - depth` form: the depth itself rounds to 1 in a half-float.
  expect(toHalfFloat(0.9998)).toBe(1);
  expect(isDisoccluded(Array(4).fill(toHalfFloat(1 - 0.9998)), 1 - toHalfFloat(0.9998))).toBe(true);
});

it('reconstruction kernels have known values, symmetry and normalized sums', () => {
  expect(lanczos2(0)).toBe(1);
  expect(lanczos2(1)).toBeCloseTo(0, 15);
  expect(lanczos2(2)).toBe(0);
  expect(lanczos2(-3)).toBe(0);
  expect(lanczos2(0.5)).toBeCloseTo((4 * Math.SQRT2) / Math.PI ** 2, 14);
  expect(lanczos2(1.5)).toBeCloseTo((-4 * Math.SQRT2) / (9 * Math.PI ** 2), 14);
  // Values from an independent calculation of sinc(x) * sinc(x / 2).
  expect(lanczos2(0.25)).toBeCloseTo(0.8773540711908775, 14);
  expect(lanczos2(0.75)).toBeCloseTo(0.23534667751914073, 14);
  expect(lanczos2(-1.25)).toBeCloseTo(-0.08472480390689066, 14);
  expectVector(getCatmullRomWeights(0), [0, 1, 0, 0]);
  expectVector(getCatmullRomWeights(1), [0, 0, 1, 0]);
  expectVector(getCatmullRomWeights(0.5), [-1 / 16, 9 / 16, 9 / 16, -1 / 16]);
  expectVector(getCatmullRomWeights(0.25), [-0.0703125, 0.8671875, 0.2265625, -0.0234375]);
  for (const fraction of [0, 0.1, 0.25, 0.5, 0.9, 1]) {
    expect(getCatmullRomWeights(fraction).reduce((sum, value) => sum + value, 0)).toBeCloseTo(
      1,
      14
    );
    expect(lanczos2(-fraction)).toBe(lanczos2(fraction));
    // Like WGSL, truncate to the nearest three samples and normalize (raw Lanczos is not a partition of unity).
    const nearest = Math.floor(fraction + 0.5);
    const weights = [-1, 0, 1].map(offset => lanczos2(nearest + offset - fraction));
    const sum = weights.reduce((total, value) => total + value, 0);
    expect(sum).toBeGreaterThan(0.9);
    expect(weights.reduce((total, value) => total + value / sum, 0)).toBeCloseTo(1, 14);
  }
});

it('kernel scale follows the upscale ratio and stays in [1, 2]', () => {
  expect(getKernelScale([100, 50], [100, 50])).toBe(1);
  expect(getKernelScale([100, 50], [200, 100])).toBeCloseTo(1.7, 14);
  expect(getKernelScale([150, 75], [200, 100])).toBeCloseTo((4 / 3) * 0.85, 14);
  expect(getKernelScale([50, 25], [200, 100])).toBe(2);
  expect(getKernelScale([200, 100], [100, 50])).toBe(1);
  // The smaller axis ratio wins.
  expect(getKernelScale([100, 100], [200, 150])).toBeCloseTo(1.275, 14);
  expect(getKernelScale([100, 100], [150, 200])).toBeCloseTo(1.275, 14);
});

it('sample weight is the narrowed main lobe', () => {
  expect(getSampleWeight([0, 0], 2)).toBe(1);
  // At scale 2 the lobe ends half a render pixel from the sample centre.
  expect(getSampleWeight([0.5, 0], 2)).toBeCloseTo(0, 14);
  expect(getSampleWeight([0, -0.5], 2)).toBeCloseTo(0, 14);
  expect(getSampleWeight([0.25, 0], 2)).toBeCloseTo(lanczos2(0.5), 14);
  expect(getSampleWeight([0.25, 0.25], 2)).toBeCloseTo(lanczos2(0.5) ** 2, 14);
  expect(getSampleWeight([0.25, 0.5], 1)).toBeCloseTo(lanczos2(0.25) * lanczos2(0.5), 14);
  // The negative lobes give no weight, also when both axes are in a negative lobe.
  expect(getSampleWeight([0.75, 0], 2)).toBe(0);
  expect(getSampleWeight([0.75, 0.75], 2)).toBe(0);
  expect(getSampleWeight([1.5, 1.5], 1)).toBe(0);
});

it('accumulation blends by weight and obeys the history maximum', () => {
  expect(getMaximumWeight(0.95)).toBeCloseTo(19, 12);
  expect(getMaximumWeight(0.5)).toBe(1);
  expect(getMaximumWeight(0)).toBe(0);
  expect(getMaximumWeight(-1)).toBe(0);
  expect(getMaximumWeight(2)).toBeCloseTo(999, 6);
  // A sample is blended by its part of the total weight.
  expect(getCurrentBlend(1, 1)).toBe(0.5);
  expect(getCurrentBlend(1, 3)).toBe(0.25);
  expect(getCurrentBlend(0.25, 0.75)).toBe(0.25);
  expect(getCurrentBlend(0, 4)).toBe(0);
  expect(getCurrentBlend(0, 0)).toBe(0);
  // At the maximum, a full-weight sample has a blend factor of 1 - historyWeightMax.
  expect(getCurrentBlend(1, 1000, 0.95)).toBeCloseTo(0.05, 12);
  expect(getCurrentBlend(1, 1000, 0.5)).toBe(0.5);
  expect(getCurrentBlend(0.5, 3, 0.95, false)).toBe(1);
  expect(getNextWeight(1, 3, 1)).toBe(4);
  expect(getNextWeight(0.25, 0.5, 2)).toBe(0.75);
  expect(getNextWeight(1, 18.5, 1, 0.95)).toBeCloseTo(19, 12);
  expect(getNextWeight(1, 1000, 1, 0.5)).toBe(1);
  // Without history, a pixel starts with the weight of an average frame: 1 / scale^2.
  expect(getNextWeight(0, 7, 2, 0.95, false)).toBe(0.25);
  expect(getNextWeight(0.6, 7, 2, 0.95, false)).toBe(0.6);
  expect(getNextWeight(0, 7, 1, 0.95, false)).toBe(1);
});

it('history trust is 1 inside the history range and falls to 0 outside it', () => {
  const minimum: TemporalVector3 = [0.4, -0.1, -0.1];
  const maximum: TemporalVector3 = [0.6, 0.1, 0.1];
  expect(getHistoryTrust([0.5, 0, 0], minimum, maximum)).toBe(1);
  expect(getHistoryTrust([0.4, -0.1, 0.1], minimum, maximum)).toBe(1);
  // 3 % of the larger luma outside: still 1. More than 12 %: 0. Both sides and each channel.
  expect(getHistoryTrust([0.6 * 1.03, 0, 0], minimum, maximum)).toBeCloseTo(1, 6);
  expect(getHistoryTrust([0.8, 0, 0], minimum, maximum)).toBe(0);
  expect(getHistoryTrust([0.2, 0, 0], minimum, maximum)).toBe(0);
  expect(getHistoryTrust([0.5, 0.3, 0], minimum, maximum)).toBe(0);
  expect(getHistoryTrust([0.5, 0, -0.3], minimum, maximum)).toBe(0);
  // Halfway through the step: excess = 7.5 % of the luma maximum (0.6).
  expect(getHistoryTrust([0.5, 0.1 + 0.075 * 0.6, 0], minimum, maximum)).toBeCloseTo(0.5, 12);
  expect(getHistoryTrust([0.4 - 0.075 * 0.6, 0, 0], minimum, maximum)).toBeCloseTo(0.5, 12);
  // Alpha is tested with the same step, in absolute units.
  expect(getHistoryTrust([0.5, 0, 0], minimum, maximum, [0.5, 0.4, 0.6])).toBe(1);
  expect(getHistoryTrust([0.5, 0, 0], minimum, maximum, [0, 1, 1])).toBe(0);
  expect(getHistoryTrust([0.5, 0, 0], minimum, maximum, [1, 0, 0.5])).toBe(0);
  expect(getHistoryTrust([0.5, 0, 0], minimum, maximum, [0.925, 1, 1])).toBeCloseTo(0.5, 12);
  expect(getHistoryTrust([0.5, 0, 0], minimum, maximum, [0.675, 0.4, 0.6])).toBeCloseTo(0.5, 12);
  // A quarter of the way through: the step is smooth, not linear.
  expect(getHistoryTrust([0.5, 0.1 + 0.0525 * 0.6, 0], minimum, maximum)).toBeCloseTo(0.84375, 12);
  // Dark colors use an absolute floor of 0.02 for the relative excess.
  expect(getHistoryTrust([0.0005, 0, 0], [0, 0, 0], [0, 0, 0])).toBe(1);
  expect(getHistoryTrust([0.01, 0, 0], [0, 0, 0], [0, 0, 0])).toBe(0);
});

it('phase count is never less than 1', () => {
  expect(getJitterPhaseCount(100, 0)).toBe(1);
});

it('kernel sharpness defaults to 0.85 and clamps sharpness and scale', () => {
  expect(DEFAULT_KERNEL_SHARPNESS).toBe(0.85);
  expect(getKernelScale([48, 32], [96, 64])).toBe(1.7);
  expect(getKernelScale([48, 32], [96, 64], 0.75)).toBe(1.5);
  expect(getKernelScale([48, 32], [48, 32], 1)).toBe(1);
  expect(getKernelScale([48, 32], [96, 64], 0)).toBe(1);
  expect(getKernelScale([48, 32], [96, 64], 2)).toBe(2);
  expect(getKernelScale([48, 32], [192, 64], 0.75)).toBe(1.5);
  expect(getKernelScale([48, 32], [384, 256], 0.75)).toBe(2);
});

it('luminance change ignores the range and smoothly responds at 10% to 30% relative excess', () => {
  for (const luminance of [0.4, 0.5, 0.6]) expect(getLuminanceChange(luminance, 0.4, 0.6)).toBe(0);
  expect(getLuminanceChange(0.9, 1, 1)).toBe(0);
  expect(getLuminanceChange(0.8, 1, 1)).toBeCloseTo(0.5);
  expect(getLuminanceChange(0.7, 1, 1)).toBe(1);
  expect(getLuminanceChange(1, 0.8, 0.8)).toBeCloseTo(0.5);
  expect(getLuminanceChange(1, 0.7, 0.7)).toBe(1);
  expect(getLuminanceChange(0, 0, 0)).toBe(0);
  expect(getLuminanceChange(0.001, 0, 0)).toBe(0);
  expect(getLuminanceChange(0.004, 0, 0)).toBeCloseTo(0.5);
  expect(getLuminanceChange(0.008, 0, 0)).toBe(1);
});

it('forgetting needs a luminance change and a sample close to the output pixel', () => {
  expect(getForgetting(1, 1, 1)).toBe(1);
  expect(getForgetting(1, 1, 0.5)).toBe(0);
  expect(getForgetting(1, 1, 0.65)).toBeCloseTo(0.5);
  expect(getForgetting(1, 1, 0.8)).toBe(1);
  expect(getForgetting(1, 0, 1)).toBe(0);
  expect(getForgetting(0, 1, 1)).toBe(0);
  expect(getForgetting(0.5, 0.5, 1)).toBeCloseTo(0.25);
  expect(getForgetting(2, 1, 1)).toBe(1);
  expect(getForgetting(-1, 1, 1)).toBe(0);
});
