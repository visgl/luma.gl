// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import type {ProjectionBounds} from './types';

/** Explicit first-coordinate range reduction, in the coordinate's current angular units. */
export type LongitudeWrapOperation = {
  type: 'longitude-wrap';
  /** One complete turn, e.g. [-180, 180], [0, 360], or [-Math.PI, Math.PI]. */
  interval: readonly [number, number];
  /** Invalid distance on both sides of the seam. Defaults to one turn times 2^-32. */
  seamTolerance?: number;
};

/** Range reduction is bounded so quotient selection and seam classification retain guard bits. */
const MAXIMUM_TURNS = 1024;

export function getLongitudeWrapParameters(operation: LongitudeWrapOperation): {
  minimum: number;
  maximum: number;
  period: number;
  seamTolerance: number;
  inputBounds: ProjectionBounds;
} {
  const [minimum, maximum] = operation.interval;
  const period = maximum - minimum;
  const seamTolerance =
    operation.seamTolerance === undefined ? period * 2 ** -32 : operation.seamTolerance;
  if (
    ![minimum, maximum, period, seamTolerance].every(Number.isFinite) ||
    period < 2 ** -80 ||
    period > 2 ** 100 ||
    Math.max(Math.abs(minimum), Math.abs(maximum)) > MAXIMUM_TURNS * period ||
    seamTolerance < period * 2 ** -32 ||
    seamTolerance >= period / 2
  ) {
    throw new Error('unsupported longitude interval or seam tolerance');
  }
  return {
    minimum,
    maximum,
    period,
    seamTolerance,
    inputBounds: [
      minimum - MAXIMUM_TURNS * period,
      -Number.MAX_VALUE,
      maximum + MAXIMUM_TURNS * period,
      Number.MAX_VALUE
    ]
  };
}

/** Binary64 reference. A discarded turn count cannot be recovered by program inversion. */
export function evaluateLongitudeWrap(
  operation: LongitudeWrapOperation,
  longitude: number
): number | null {
  const {minimum, period, seamTolerance, inputBounds} = getLongitudeWrapParameters(operation);
  if (!Number.isFinite(longitude) || longitude < inputBounds[0] || longitude > inputBounds[2])
    return null;
  const relative = longitude - minimum;
  let reduced = relative - Math.floor(relative / period) * period;
  if (reduced < 0) reduced += period;
  if (reduced >= period) reduced -= period;
  return reduced <= seamTolerance || period - reduced <= seamTolerance ? null : minimum + reduced;
}

export function getLongitudeWrapStage(offset: number): string {
  return `{
    let minimum = PROGRAM_scalar(${offset}u);
    let period = PROGRAM_scalar(${offset + 2}u);
    let seamTolerance = PROGRAM_scalar(${offset + 4}u);
    if (compare_fp64(value.xy, PROGRAM_scalar(${offset + 6}u)) < 0 ||
        compare_fp64(value.xy, PROGRAM_scalar(${offset + 10}u)) > 0) { return invalid; }
    let relative = sub_fp64(value.xy, minimum);
    let quotient = div_fp64(relative, period);
    // The Float32 integer estimate may be one turn off near a boundary; correct in double-single.
    let turns = floor(quotient.x);
    var reduced = sub_fp64(relative, mul_fp64(vec2f(turns, 0.0), period));
    if (compare_fp64(reduced, vec2f(0.0)) < 0) { reduced = sum_fp64(reduced, period); }
    if (compare_fp64(reduced, period) >= 0) { reduced = sub_fp64(reduced, period); }
    if (compare_fp64(reduced, seamTolerance) <= 0 ||
        compare_fp64(sub_fp64(period, reduced), seamTolerance) <= 0) { return invalid; }
    value = vec4f(sum_fp64(minimum, reduced), value.zw);
  }`;
}
