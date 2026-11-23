// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import type {ProjectionBounds, ProjectionCoordinates} from './types';

/** Sixth-order Krueger series. Float32 formula arithmetic is an explicit opt-in. */
export type TransverseMercatorOperation = {
  type: 'transverse-mercator';
  arithmetic: 'float32';
  semiMajorAxis: number;
  semiMinorAxis: number;
  scaleFactor: number;
  /** Radians. Longitudes are already relative to the central meridian; false origins are external. */
  latitudeOrigin: number;
  inverse?: boolean;
};

// Published sixth-order coefficient matrices, not implementation code:
// https://proj.org/en/stable/operations/projections/tmerc.html#ellipsoidal-form
const GEOGRAPHIC_TO_CONFORMAL = [
  [-2, 2 / 3, 4 / 3, -82 / 45, 32 / 45, 4642 / 4725],
  [5 / 3, -16 / 15, -13 / 9, 904 / 315, -1522 / 945],
  [-26 / 15, 34 / 21, 8 / 5, -12686 / 2835],
  [1237 / 630, -12 / 5, -24832 / 14175],
  [-734 / 315, 109598 / 31185],
  [444337 / 155925]
];
const CONFORMAL_TO_GEOGRAPHIC = [
  [2, -2 / 3, -2, 116 / 45, 26 / 45, -2854 / 675],
  [7 / 3, -8 / 5, -227 / 45, 2704 / 315, 2323 / 945],
  [56 / 15, -136 / 35, -1262 / 105, 73814 / 2835],
  [4279 / 630, -332 / 35, -399572 / 14175],
  [4174 / 315, -144838 / 6237],
  [601676 / 22275]
];
const SPHERICAL_TO_RECTIFIED = [
  [1 / 2, -2 / 3, 5 / 16, 41 / 180, -127 / 288, 7891 / 37800],
  [13 / 48, -3 / 5, 557 / 1440, 281 / 630, -1983433 / 1935360],
  [61 / 240, -103 / 140, 15061 / 26880, 167603 / 181440],
  [49561 / 161280, -179 / 168, 6601661 / 7257600],
  [34729 / 80640, -3418889 / 1995840],
  [212378941 / 319334400]
];
const RECTIFIED_TO_SPHERICAL = [
  [-1 / 2, 2 / 3, -37 / 96, 1 / 360, 81 / 512, -96199 / 604800],
  [-1 / 48, -1 / 15, 437 / 1440, -46 / 105, 1118711 / 3870720],
  [-17 / 480, 37 / 840, 209 / 4480, -5569 / 90720],
  [-4397 / 161280, 11 / 504, 830251 / 7257600],
  [-4583 / 161280, 108847 / 3991680],
  [-20648693 / 638668800]
];

/** Deliberately bounded local branch; includes ordinary and widened UTM zones, not polar UPS. */
export const TRANSVERSE_MERCATOR_GEOGRAPHIC_BOUNDS: ProjectionBounds = [
  -Math.PI / 15,
  (-85 * Math.PI) / 180,
  Math.PI / 15,
  (85 * Math.PI) / 180
];

export function getTransverseMercatorParameters(operation: TransverseMercatorOperation): number[] {
  const {semiMajorAxis, semiMinorAxis, scaleFactor, latitudeOrigin} = operation;
  if (
    operation.arithmetic !== 'float32' ||
    ![semiMajorAxis, semiMinorAxis, scaleFactor, latitudeOrigin].every(Number.isFinite) ||
    !(
      semiMajorAxis > 0 &&
      semiMinorAxis >= 0.99 * semiMajorAxis &&
      semiMinorAxis <= semiMajorAxis &&
      scaleFactor > 0
    ) ||
    Math.abs(latitudeOrigin) > TRANSVERSE_MERCATOR_GEOGRAPHIC_BOUNDS[3]
  ) {
    throw new Error('unsupported Transverse Mercator parameters');
  }
  const flattening = (1 - semiMinorAxis / semiMajorAxis) / (1 + semiMinorAxis / semiMajorAxis);
  const squared = flattening * flattening;
  const scale =
    (semiMajorAxis / (1 + flattening)) *
    (1 + squared / 4 + squared ** 2 / 64 + squared ** 3 / 256) *
    scaleFactor;
  if (!Number.isFinite(Math.fround(scale * Math.PI)) || Math.fround(scale) < 2 ** -126) {
    throw new Error('Transverse Mercator scale must fit the normal Float32 range');
  }
  const geographic = getCoefficients(GEOGRAPHIC_TO_CONFORMAL, flattening);
  const projected = getCoefficients(SPHERICAL_TO_RECTIFIED, flattening);
  const conformalOrigin = evaluateLatitude(latitudeOrigin, geographic);
  const origin = scale * evaluateLatitude(conformalOrigin, projected);
  return [
    scale,
    origin,
    ...(operation.inverse ? getCoefficients(CONFORMAL_TO_GEOGRAPHIC, flattening) : geographic),
    ...(operation.inverse ? getCoefficients(RECTIFIED_TO_SPHERICAL, flattening) : projected)
  ];
}

/** Inverse bounds are an envelope; recovered geographic coordinates are checked as well. */
export function getTransverseMercatorBounds(
  operation: TransverseMercatorOperation
): ProjectionBounds {
  if (!operation.inverse) return [...TRANSVERSE_MERCATOR_GEOGRAPHIC_BOUNDS];
  const [scale, origin] = getTransverseMercatorParameters(operation);
  return [
    -0.3 * scale,
    (-Math.PI / 2) * scale - origin,
    0.3 * scale,
    (Math.PI / 2) * scale - origin
  ];
}

/** Binary64 series reference, not a Float32 GPU rounding simulator or an exact TM oracle. */
export function evaluateTransverseMercator(
  operation: TransverseMercatorOperation,
  position: ProjectionCoordinates
): ProjectionCoordinates | null {
  const parameters = getTransverseMercatorParameters(operation);
  const [scale, origin] = parameters;
  const geographic = parameters.slice(2, 8);
  const projected = parameters.slice(8, 14);
  let sphericalNorthing: number;
  let sphericalEasting: number;
  if (operation.inverse) {
    sphericalNorthing = (position[1] + origin) / scale;
    sphericalEasting = position[0] / scale;
  } else {
    const tangent = Math.tan(evaluateLatitude(position[1], geographic));
    const cosine = Math.cos(position[0]);
    sphericalNorthing = Math.atan2(tangent, cosine);
    sphericalEasting = Math.asinh(Math.sin(position[0]) / Math.hypot(tangent, cosine));
  }
  let northing = sphericalNorthing;
  let easting = sphericalEasting;
  for (let index = 0; index < 6; index++) {
    const harmonic = 2 * (index + 1);
    northing +=
      projected[index] *
      Math.sin(harmonic * sphericalNorthing) *
      Math.cosh(harmonic * sphericalEasting);
    easting +=
      projected[index] *
      Math.cos(harmonic * sphericalNorthing) *
      Math.sinh(harmonic * sphericalEasting);
  }
  if (!operation.inverse) return [scale * easting, scale * northing - origin];
  const hyperbolic = Math.sinh(easting);
  const longitude = Math.atan2(hyperbolic, Math.cos(northing));
  const conformal = Math.atan2(Math.sin(northing), Math.hypot(hyperbolic, Math.cos(northing)));
  const latitude = evaluateLatitude(conformal, geographic);
  return Math.abs(longitude) <= TRANSVERSE_MERCATOR_GEOGRAPHIC_BOUNDS[2] &&
    Math.abs(latitude) <= TRANSVERSE_MERCATOR_GEOGRAPHIC_BOUNDS[3]
    ? [longitude, latitude]
    : null;
}

function getCoefficients(matrix: number[][], flattening: number): number[] {
  return matrix.map(
    (row, index) =>
      row.reduceRight((sum, coefficient) => sum * flattening + coefficient, 0) *
      flattening ** (index + 1)
  );
}

function evaluateLatitude(latitude: number, coefficients: number[]): number {
  return (
    latitude +
    coefficients.reduce(
      (sum, coefficient, index) => sum + coefficient * Math.sin(2 * (index + 1) * latitude),
      0
    )
  );
}

// Small-angle polynomials avoid device-dependent absolute-error loss in WGSL transcendental
// builtins near zero. At this threshold their omitted terms are below Float32 rounding.
export const TRANSVERSE_MERCATOR_SHADER_FUNCTIONS = `
fn PROGRAM_transverseSin(value: f32) -> f32 {
  if (abs(value) < 0.01) {
    let squared = value * value;
    return value * (1.0 + squared * (-1.0 / 6.0 + squared / 120.0));
  }
  return sin(value);
}
fn PROGRAM_transverseTan(value: f32) -> f32 {
  if (abs(value) < 0.01) {
    let squared = value * value;
    return value * (1.0 + squared * (1.0 / 3.0 + 2.0 * squared / 15.0));
  }
  return tan(value);
}
fn PROGRAM_transverseAtan2(numerator: f32, denominator: f32) -> f32 {
  if (denominator > 0.0 && abs(numerator) < 0.01 * denominator) {
    let ratio = numerator / denominator;
    let squared = ratio * ratio;
    return ratio * (1.0 + squared * (-1.0 / 3.0 + squared / 5.0));
  }
  return atan2(numerator, denominator);
}
fn PROGRAM_transverseSinh(value: f32) -> f32 {
  if (abs(value) < 0.01) {
    let squared = value * value;
    return value * (1.0 + squared * (1.0 / 6.0 + squared / 120.0));
  }
  return sinh(value);
}
fn PROGRAM_transverseAsinh(value: f32) -> f32 {
  if (abs(value) < 0.01) {
    let squared = value * value;
    return value * (1.0 + squared * (-1.0 / 6.0 + 3.0 * squared / 40.0));
  }
  return sign(value) * asinh(abs(value));
}`;

/** Static direction; coefficients and bounds remain updateable storage parameters. */
export function getTransverseMercatorStage(
  operation: TransverseMercatorOperation,
  offset: number
): string {
  return `{
    if (compare_fp64(value.xy, PROGRAM_scalar(${offset + 28}u)) < 0 ||
        compare_fp64(value.zw, PROGRAM_scalar(${offset + 30}u)) < 0 ||
        compare_fp64(value.xy, PROGRAM_scalar(${offset + 32}u)) > 0 ||
        compare_fp64(value.zw, PROGRAM_scalar(${offset + 34}u)) > 0) { return invalid; }
    let scale = PROGRAM_scalar(${offset}u).x;
    let origin = PROGRAM_scalar(${offset + 2}u).x;
    let coordinates = vec2f(value.x + value.y, value.z + value.w);
    ${
      operation.inverse
        ? `let sphericalNorthing = (coordinates.y + origin) / scale;
    let sphericalEasting = coordinates.x / scale;`
        : `var conformalLatitude = coordinates.y;
    for (var index = 0u; index < 6u; index++) {
      conformalLatitude += PROGRAM_scalar(${offset + 4}u + 2u * index).x * PROGRAM_transverseSin(2.0 * f32(index + 1u) * coordinates.y);
    }
    let tangent = PROGRAM_transverseTan(conformalLatitude);
    let cosine = cos(coordinates.x);
    let sphericalNorthing = PROGRAM_transverseAtan2(tangent, cosine);
    let sphericalEasting = PROGRAM_transverseAsinh(PROGRAM_transverseSin(coordinates.x) / sqrt(tangent * tangent + cosine * cosine));`
    }
    var northing = sphericalNorthing;
    var easting = sphericalEasting;
    for (var index = 0u; index < 6u; index++) {
      let harmonic = 2.0 * f32(index + 1u);
      let coefficient = PROGRAM_scalar(${offset + 16}u + 2u * index).x;
      northing += coefficient * PROGRAM_transverseSin(harmonic * sphericalNorthing) * cosh(harmonic * sphericalEasting);
      easting += coefficient * cos(harmonic * sphericalNorthing) * PROGRAM_transverseSinh(harmonic * sphericalEasting);
    }
    ${
      operation.inverse
        ? `let hyperbolic = PROGRAM_transverseSinh(easting);
    let cosine = cos(northing);
    let longitude = PROGRAM_transverseAtan2(hyperbolic, cosine);
    let conformalLatitude = PROGRAM_transverseAtan2(PROGRAM_transverseSin(northing), sqrt(hyperbolic * hyperbolic + cosine * cosine));
    var latitude = conformalLatitude;
    for (var index = 0u; index < 6u; index++) {
      latitude += PROGRAM_scalar(${offset + 4}u + 2u * index).x * PROGRAM_transverseSin(2.0 * f32(index + 1u) * conformalLatitude);
    }
    value = vec4f(longitude, 0.0, latitude, 0.0);
    if (compare_fp64(value.xy, PROGRAM_scalar(${offset + 36}u)) < 0 ||
        compare_fp64(value.zw, PROGRAM_scalar(${offset + 38}u)) < 0 ||
        compare_fp64(value.xy, PROGRAM_scalar(${offset + 40}u)) > 0 ||
        compare_fp64(value.zw, PROGRAM_scalar(${offset + 42}u)) > 0) { return invalid; }`
        : `value = vec4f(scale * easting, 0.0, scale * northing - origin, 0.0);`
    }
  }`;
}
