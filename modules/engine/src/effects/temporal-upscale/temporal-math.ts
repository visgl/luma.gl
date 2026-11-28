// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Default accumulation kernel sharpness; larger values narrow the sample footprint. */
export const DEFAULT_KERNEL_SHARPNESS = 0.85;

/** Default responsiveness for reducing stale history. */
export const DEFAULT_RESPONSIVENESS = 0.5;

/** A two-component coordinate in top-left UV space, unless documented otherwise. */
export type TemporalVector2 = [number, number];
/** A three-component color or velocity/depth value. */
export type TemporalVector3 = [number, number, number];

/** Radical inverse for a nonnegative integer index and integer base >= 2; index zero is zero. */
export function halton(index: number, base: number): number {
  let fraction = 1;
  let result = 0;
  while (index > 0) {
    fraction /= base;
    result += fraction * (index % base);
    index = Math.floor(index / base);
  }
  return result;
}

/** FSR 2 phase rule for positive render/output widths; eight phases at native resolution. */
export function getJitterPhaseCount(renderWidth: number, outputWidth: number): number {
  return Math.max(1, Math.ceil(8 * (outputWidth / renderWidth) ** 2));
}

/** Periodic Halton(2,3) jitter in render pixels, +x right, +y down; frame zero uses index one. */
export function getJitterOffset(frameIndex: number, phaseCount: number): TemporalVector2 {
  const index = (frameIndex % phaseCount) + 1;
  return [halton(index, 2) - 0.5, halton(index, 3) - 0.5];
}

/** NDC offset: add this pair times clip.w to clip.xy; depth is unchanged. */
export function jitterToClipOffset(
  jitter: TemporalVector2,
  renderSize: TemporalVector2
): TemporalVector2 {
  return [(2 * jitter[0]) / renderSize[0], (-2 * jitter[1]) / renderSize[1]];
}

/** Copies a column-major matrix and adds offset * row-w to rows x/y, including orthographic matrices. */
export function applyJitterToProjectionMatrix(
  matrix16ColumnMajor: ArrayLike<number>,
  jitter: TemporalVector2,
  renderSize: TemporalVector2
): number[] {
  const result = Array.from(matrix16ColumnMajor);
  const offset = jitterToClipOffset(jitter, renderSize);
  for (let column = 0; column < 4; column++) {
    result[column * 4] += offset[0] * matrix16ColumnMajor[column * 4 + 3];
    result[column * 4 + 1] += offset[1] * matrix16ColumnMajor[column * 4 + 3];
  }
  return result;
}

/** Reprojects an UNJITTERED top-left UV using current UV minus previous UV motion. */
export function reprojectUV(uv: TemporalVector2, velocity: TemporalVector2): TemporalVector2 {
  return [uv[0] - velocity[0], uv[1] - velocity[1]];
}

/** Inputs to the camera-only CPU velocity reference. Both matrices are UNJITTERED. */
export type VelocityFromDepthOptions = {
  /** Jittered top-left texture UV. */
  uv: TemporalVector2;
  /** Device depth, mapped from GL-style NDC z by z * 0.5 + 0.5. */
  depth: number;
  /** Current render-pixel jitter. */
  jitter: TemporalVector2;
  /** Render dimensions in pixels. */
  renderSize: TemporalVector2;
  /** Inverse current column-major GL-style view-projection matrix, clip z in [-w,w]. */
  currentViewProjectionInverse: ArrayLike<number>;
  /** Previous column-major GL-style view-projection matrix, clip z in [-w,w]. */
  previousViewProjection: ArrayLike<number>;
};

/** Column-major homogeneous matrix-vector product. */
function transformVector(matrix: ArrayLike<number>, vector: number[]): number[] {
  return [0, 1, 2, 3].map(row =>
    vector.reduce((sum, value, column) => sum + matrix[column * 4 + row] * value, 0)
  );
}

/**
 * Returns [currentU - previousU, currentV - previousV, 1 - previous device depth], excluding
 * jitter. The third component is one minus the depth: most depth values are close to 1, and a
 * half-float texture keeps a small number much more exactly than a number close to 1.
 */
export function getVelocityFromDepth(options: VelocityFromDepthOptions): TemporalVector3 {
  const {uv, depth, jitter, renderSize, currentViewProjectionInverse, previousViewProjection} =
    options;
  const currentUV = [uv[0] - jitter[0] / renderSize[0], uv[1] - jitter[1] / renderSize[1]];
  const world = transformVector(currentViewProjectionInverse, [
    2 * currentUV[0] - 1,
    1 - 2 * currentUV[1],
    2 * depth - 1,
    1
  ]);
  const previous = transformVector(previousViewProjection, world);
  return [
    currentUV[0] - ((previous[0] / previous[3]) * 0.5 + 0.5),
    currentUV[1] - (0.5 - (previous[1] / previous[3]) * 0.5),
    (previous[3] - previous[2]) / (2 * previous[3])
  ];
}

/** Linear RGB to YCoCg; no gamma transfer, operates on premultiplied RGB. */
export function rgbToYCoCg([red, green, blue]: TemporalVector3): TemporalVector3 {
  return [(red + 2 * green + blue) / 4, (red - blue) / 2, (-red + 2 * green - blue) / 4];
}

/** Inverse of rgbToYCoCg, without saturation. */
export function yCoCgToRgb([luminance, orange, green]: TemporalVector3): TemporalVector3 {
  return [luminance + orange - green, luminance + green, luminance - orange - green];
}

/** Clips along the segment from color to box centre; inside values are unchanged, zero extents supported. */
export function clipToBox(
  color: TemporalVector3,
  boxMin: TemporalVector3,
  boxMax: TemporalVector3
): TemporalVector3 {
  const center = boxMin.map((value, index) => (value + boxMax[index]) / 2);
  let scale = 1;
  for (let component = 0; component < 3; component++) {
    const distance = Math.abs(color[component] - center[component]);
    if (distance > 0) {
      scale = Math.min(scale, (boxMax[component] - boxMin[component]) / (2 * distance));
    }
  }
  return color.map(
    (value, index) => center[index] + (value - center[index]) * scale
  ) as TemporalVector3;
}

/** Unnormalized Lanczos-2 kernel, support (-2,2). Normalize sums over the chosen sample footprint. */
export function lanczos2(value: number): number {
  if (value === 0) return 1;
  if (Math.abs(value) >= 2) return 0;
  const angle = Math.PI * value;
  return (Math.sin(angle) * Math.sin(angle / 2)) / ((angle * angle) / 2);
}

/** Catmull-Rom weights for samples at -1,0,1,2 and fraction t in [0,1]; weights sum to one. */
export function getCatmullRomWeights(fraction: number): [number, number, number, number] {
  const squared = fraction * fraction;
  const cubed = squared * fraction;
  return [
    -0.5 * fraction + squared - 0.5 * cubed,
    1 - 2.5 * squared + 1.5 * cubed,
    0.5 * fraction + 2 * squared - 1.5 * cubed,
    -0.5 * squared + 0.5 * cubed
  ];
}

/**
 * Reject only if ALL four previous 1-depth taps are closer than expected by 5%; absolute
 * far-plane guard 1e-5. Both arguments are `1 - depth` values, as the textures store them.
 */
export function isDisoccluded(
  previousOneMinusDepth: readonly number[],
  expectedPreviousOneMinusDepth: number,
  tolerance = 0.05
): boolean {
  const expected = Math.max(0, expectedPreviousOneMinusDepth);
  return Math.min(...previousOneMinusDepth) > expected + Math.max(expected * tolerance, 0.00001);
}

/**
 * Scale of the accumulation kernel, in render pixels: at default sharpness, 1 at native size and 1.7 at half size.
 * A larger scale gives a narrower kernel, so a sample contributes only close to its centre.
 * Sharpness is clamped to [0.5,1]. The default factor 0.85 makes the lobe a little wider than one output pixel. With a factor of 1, the
 * neighbouring output pixels share too few samples, and edges show a one-pixel comb pattern.
 */
export function getKernelScale(
  renderSize: TemporalVector2,
  outputSize: TemporalVector2,
  kernelSharpness = DEFAULT_KERNEL_SHARPNESS
): number {
  const ratio = Math.min(outputSize[0] / renderSize[0], outputSize[1] / renderSize[1]);
  return Math.min(2, Math.max(1, ratio * Math.min(1, Math.max(0.5, kernelSharpness))));
}

/**
 * Weight of one render sample at a distance (render pixels) from an output pixel centre: the
 * main lobe of the Lanczos-2 kernel, narrowed by the kernel scale. Range [0, 1].
 */
export function getSampleWeight(distance: TemporalVector2, kernelScale: number): number {
  return (
    Math.max(0, lanczos2(distance[0] * kernelScale)) *
    Math.max(0, lanczos2(distance[1] * kernelScale))
  );
}

/** Largest accumulated weight. A full-weight sample then has a blend factor of 1 - historyWeightMax. */
export function getMaximumWeight(historyWeightMax = 0.95): number {
  const maximum = Math.min(0.999, Math.max(0, historyWeightMax));
  return maximum / (1 - maximum);
}

/**
 * Blend factor of the current frame: its sample weight as a fraction of all accumulated weight.
 * It is 0 when no render sample is close to the output pixel, and 1 without valid history.
 */
export function getCurrentBlend(
  sampleWeight: number,
  accumulatedWeight: number,
  historyWeightMax = 0.95,
  isHistoryValid = true
): number {
  if (!isHistoryValid) return 1;
  const accumulated = Math.min(accumulatedWeight, getMaximumWeight(historyWeightMax));
  return sampleWeight / Math.max(accumulated + sampleWeight, 0.00001);
}

/** Accumulated weight to store after a frame. A pixel without history starts with an average frame. */
export function getNextWeight(
  sampleWeight: number,
  accumulatedWeight: number,
  kernelScale: number,
  historyWeightMax = 0.95,
  isHistoryValid = true
): number {
  if (!isHistoryValid) return Math.max(sampleWeight, 1 / (kernelScale * kernelScale));
  const maximum = getMaximumWeight(historyWeightMax);
  return Math.min(Math.min(accumulatedWeight, maximum) + sampleWeight, maximum);
}

/**
 * Tests whether the history explains a sample of the current frame: 1 when each YCoCg component
 * of the sample is inside the range of the history near the sample position, 0 when a component
 * is outside by more than 12 % of the larger luma, with a smooth step between 3 % and 12 %.
 */
export function getHistoryTrust(
  sample: TemporalVector3,
  historyMinimum: TemporalVector3,
  historyMaximum: TemporalVector3,
  /** Alpha of the sample and the alpha range of the history, [sample, minimum, maximum]. */
  alpha: TemporalVector3 = [1, 1, 1]
): number {
  const excess = Math.max(
    0,
    ...sample.map((value, index) =>
      Math.max(historyMinimum[index] - value, value - historyMaximum[index])
    )
  );
  // Coverage is tested too: a change of alpha can leave the premultiplied color the same.
  const alphaExcess = Math.max(0, alpha[1] - alpha[0], alpha[0] - alpha[2]);
  const relative = Math.max(excess / Math.max(sample[0], historyMaximum[0], 0.02), alphaExcess);
  const t = Math.min(1, Math.max(0, (relative - 0.03) / (0.12 - 0.03)));
  return 1 - t * t * (3 - 2 * t);
}

/**
 * Luminance disagreement outside the current 3x3 YCoCg Y range, before history clipping.
 * Relative excess uses the larger absolute luminance with a 0.02 dark-noise floor.
 * Smoothstep from 10% to 30% ignores small fluctuations; in-range history always returns zero.
 */
export function getLuminanceChange(
  historyLuminance: number,
  minimumLuminance: number,
  maximumLuminance: number
): number {
  const excess = Math.max(
    0,
    minimumLuminance - historyLuminance,
    historyLuminance - maximumLuminance
  );
  const relative =
    excess /
    Math.max(
      Math.abs(historyLuminance),
      Math.abs(minimumLuminance),
      Math.abs(maximumLuminance),
      0.02
    );
  const transition = Math.min(1, Math.max(0, (relative - 0.1) / 0.2));
  return transition * transition * (3 - 2 * transition);
}

/**
 * Fraction of the accumulated history weight to forget in one frame.
 * `luminanceChange` is the result of `getLuminanceChange`. `sampleWeight` is the accumulation
 * weight of the current frame at this output pixel. A frame is evidence for a change only when
 * one of its samples lies close to the output pixel, so the weight gates the result with a
 * smoothstep from 0.5 to 0.8. Without this gate, each frame whose samples miss a feature
 * smaller than a render pixel would erase that feature from the history.
 */
export function getForgetting(
  responsiveness: number,
  luminanceChange: number,
  sampleWeight: number
): number {
  const evidence = Math.min(1, Math.max(0, (sampleWeight - 0.5) / 0.3));
  return (
    Math.min(1, Math.max(0, responsiveness)) *
    luminanceChange *
    evidence *
    evidence *
    (3 - 2 * evidence)
  );
}
