// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import type {ProjectionBounds, ProjectionCoordinates} from './types';

/** Analytic fast path. Double-single transport does not increase this stage's arithmetic precision. */
export type WebMercatorOperation = {
  type: 'web-mercator';
  arithmetic: 'float32';
  /** Semi-major axis in metres. Inputs are central-meridian-relative radians, outputs metres. */
  radius: number;
  inverse?: boolean;
};

/** Square-world domain; no implicit longitude wrapping or latitude clamping. */
export function getWebMercatorBounds(operation: WebMercatorOperation): ProjectionBounds {
  const maximumX = operation.inverse ? operation.radius * Math.PI : Math.PI;
  const maximumY = operation.inverse ? maximumX : Math.atan(Math.sinh(Math.PI));
  return [-maximumX, -maximumY, maximumX, maximumY];
}

/** Binary64 reference, not a simulation of WGSL transcendental rounding. */
export function evaluateWebMercator(
  operation: WebMercatorOperation,
  position: ProjectionCoordinates
): ProjectionCoordinates {
  return operation.inverse
    ? [position[0] / operation.radius, Math.atan(Math.sinh(position[1] / operation.radius))]
    : [position[0] * operation.radius, Math.asinh(Math.tan(position[1])) * operation.radius];
}

/** Equivalent to PROJ's spherical formulas, using odd functions to avoid equatorial cancellation.
 * https://proj.org/en/stable/operations/projections/webmerc.html
 */
export function getWebMercatorStage(operation: WebMercatorOperation, offset: number): string {
  if (
    operation.arithmetic !== 'float32' ||
    !(operation.radius > 0) ||
    !Number.isFinite(Math.fround(operation.radius * Math.PI)) ||
    Math.fround(operation.radius) === 0
  ) {
    throw new Error(
      'Web Mercator requires explicit float32 arithmetic and a finite positive radius'
    );
  }
  // Check double-single inputs before narrowing them. Otherwise out-of-domain coordinates
  // that round onto the edge could be reported as valid.
  return `{
    if (compare_fp64(value.xy, PROGRAM_scalar(${offset + 2}u)) < 0 ||
        compare_fp64(value.zw, PROGRAM_scalar(${offset + 4}u)) < 0 ||
        compare_fp64(value.xy, PROGRAM_scalar(${offset + 6}u)) > 0 ||
        compare_fp64(value.zw, PROGRAM_scalar(${offset + 8}u)) > 0) { return invalid; }
    let radius = PROGRAM_scalar(${offset}u).x;
    let coordinates = vec2f(value.x + value.y, value.z + value.w);
    let ordinate = ${operation.inverse ? 'coordinates.y / radius' : 'coordinates.y'};
    var transformed: f32;
    if (abs(ordinate) < 0.01) {
      // Odd fifth-order expansion avoids cancellation in implementations of asinh/sinh near zero.
      // The first omitted term is below Float32 rounding throughout this interval.
      let squared = ordinate * ordinate;
      transformed = ordinate * (1.0 + squared * (${operation.inverse ? '-' : ''}1.0 / 6.0 + squared / 24.0));
    } else {
      transformed = ${operation.inverse ? 'atan(sinh(ordinate))' : 'sign(ordinate) * asinh(tan(abs(ordinate)))'};
    }
    let projected = ${
      operation.inverse
        ? 'vec2f(coordinates.x / radius, transformed)'
        : 'vec2f(coordinates.x * radius, transformed * radius)'
    };
    value = vec4f(projected.x, 0.0, projected.y, 0.0);
  }`;
}
