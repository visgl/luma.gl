// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuProj.

import type {ProjectionBounds, ProjectionCoordinates} from './types';

type ConicShape = {
  arithmetic: 'float32';
  semiMajorAxis: number;
  semiMinorAxis: number;
  /** Radians. Central-meridian translation and false origins are separate affine stages. */
  latitudeOrigin: number;
  firstStandardParallel: number;
  secondStandardParallel: number;
  inverse?: boolean;
};

export type LambertConformalConicOperation = ConicShape & {
  type: 'lambert-conformal-conic';
  /** 1SP scale (use coincident parallels); ordinary 2SP uses one. */
  scaleFactor: number;
};
export type AlbersEqualAreaOperation = ConicShape & {type: 'albers-equal-area'};
export type ConicOperation = LambertConformalConicOperation | AlbersEqualAreaOperation;

/** A single unwrapped local branch, excluding polar singularities. */
export const CONIC_GEOGRAPHIC_BOUNDS: ProjectionBounds = [
  -Math.PI / 2,
  (-80 * Math.PI) / 180,
  Math.PI / 2,
  (80 * Math.PI) / 180
];
// The inverse excludes a narrow radial/angular boundary band before Float32 evaluation.
// It must not round an outside point onto the accepted geographic footprint.
const INVERSE_GUARD = 2 ** -20;

/** Binary64 constants from the ellipsoidal conic equations (Snyder, USGS PP 1395).
 * https://proj.org/en/stable/operations/projections/lcc.html
 * https://proj.org/en/stable/operations/projections/aea.html
 * Returned layout: scale, eccentricity squared, cone exponent, F/C, origin northing,
 * guarded minimum/maximum normalized radius squared, guarded angular wedge tangent.
 */
export function getConicParameters(operation: ConicOperation): number[] {
  const {
    semiMajorAxis,
    semiMinorAxis,
    latitudeOrigin,
    firstStandardParallel,
    secondStandardParallel
  } = operation;
  const scaleFactor = operation.type === 'lambert-conformal-conic' ? operation.scaleFactor : 1;
  if (
    operation.arithmetic !== 'float32' ||
    ![
      semiMajorAxis,
      semiMinorAxis,
      latitudeOrigin,
      firstStandardParallel,
      secondStandardParallel,
      scaleFactor
    ].every(Number.isFinite) ||
    !(
      semiMajorAxis > 0 &&
      semiMinorAxis >= 0.99 * semiMajorAxis &&
      semiMinorAxis <= semiMajorAxis &&
      scaleFactor > 0
    ) ||
    [latitudeOrigin, firstStandardParallel, secondStandardParallel].some(
      value => Math.abs(value) > CONIC_GEOGRAPHIC_BOUNDS[3]
    ) ||
    (firstStandardParallel !== secondStandardParallel &&
      Math.abs(firstStandardParallel - secondStandardParallel) < 1e-7)
  ) {
    throw new Error('unsupported conic parameters');
  }
  const eccentricitySquared = 1 - (semiMinorAxis / semiMajorAxis) ** 2;
  const firstMetric =
    Math.cos(firstStandardParallel) /
    Math.sqrt(1 - eccentricitySquared * Math.sin(firstStandardParallel) ** 2);
  const secondMetric =
    Math.cos(secondStandardParallel) /
    Math.sqrt(1 - eccentricitySquared * Math.sin(secondStandardParallel) ** 2);
  const exponent =
    firstStandardParallel === secondStandardParallel
      ? Math.sin(firstStandardParallel)
      : operation.type === 'lambert-conformal-conic'
        ? Math.log(firstMetric / secondMetric) /
          (getLogT(firstStandardParallel, eccentricitySquared) -
            getLogT(secondStandardParallel, eccentricitySquared))
        : (firstMetric ** 2 - secondMetric ** 2) /
          (getAuthalicQ(secondStandardParallel, eccentricitySquared) -
            getAuthalicQ(firstStandardParallel, eccentricitySquared));
  // Near-cylindrical cones amplify Float32 cancellation; leave them to adaptive fitting.
  if (!Number.isFinite(exponent) || Math.abs(exponent) < 0.05 || Math.abs(exponent) >= 1) {
    throw new Error('conic exponent is outside the bounded native branch');
  }
  const constant =
    operation.type === 'lambert-conformal-conic'
      ? firstMetric /
        (exponent * Math.exp(exponent * getLogT(firstStandardParallel, eccentricitySquared)))
      : firstMetric ** 2 + exponent * getAuthalicQ(firstStandardParallel, eccentricitySquared);
  const radius = (latitude: number) =>
    operation.type === 'lambert-conformal-conic'
      ? constant * Math.exp(exponent * getLogT(latitude, eccentricitySquared))
      : Math.sqrt(constant - exponent * getAuthalicQ(latitude, eccentricitySquared)) / exponent;
  const scale = semiMajorAxis * scaleFactor;
  const origin = scale * radius(latitudeOrigin);
  const radii = [radius(CONIC_GEOGRAPHIC_BOUNDS[1]) ** 2, radius(CONIC_GEOGRAPHIC_BOUNDS[3]) ** 2];
  const maximum = Math.max(...radii);
  const parameters = [
    scale,
    eccentricitySquared,
    exponent,
    constant,
    origin,
    Math.min(...radii) * (1 + INVERSE_GUARD),
    maximum * (1 - INVERSE_GUARD),
    Math.tan(Math.abs(exponent) * CONIC_GEOGRAPHIC_BOUNDS[2]) * (1 - INVERSE_GUARD)
  ];
  if (
    Math.fround(scale) < 2 ** -126 ||
    ![...parameters, Math.abs(origin) + scale * Math.sqrt(maximum)].every(value =>
      Number.isFinite(Math.fround(value))
    )
  ) {
    throw new Error('conic parameters must fit the normal Float32 range');
  }
  return parameters;
}

/** The inverse rectangle is an envelope, not a validity proof; also check radius and angle. */
export function getConicBounds(operation: ConicOperation): ProjectionBounds {
  if (!operation.inverse) return [...CONIC_GEOGRAPHIC_BOUNDS];
  const [scale, , , , origin, , maximumSquared] = getConicParameters(operation);
  const maximum = scale * Math.sqrt(maximumSquared);
  return [-maximum, origin - maximum, maximum, origin + maximum];
}

/** Binary64 reference, not a simulation or guarantee of native GPU arithmetic accuracy. */
export function evaluateConic(
  operation: ConicOperation,
  position: ProjectionCoordinates
): ProjectionCoordinates | null {
  const [
    scale,
    eccentricitySquared,
    exponent,
    constant,
    origin,
    minimumSquared,
    maximumSquared,
    tangentLimit
  ] = getConicParameters(operation);
  if (!operation.inverse) {
    const radius =
      operation.type === 'lambert-conformal-conic'
        ? scale * constant * Math.exp(exponent * getLogT(position[1], eccentricitySquared))
        : (scale *
            Math.sqrt(constant - exponent * getAuthalicQ(position[1], eccentricitySquared))) /
          exponent;
    const angle = exponent * position[0];
    return [radius * Math.sin(angle), origin - radius * Math.cos(angle)];
  }
  const direction = Math.sign(exponent);
  const easting = (direction * position[0]) / scale;
  const northing = (direction * (origin - position[1])) / scale;
  const squared = easting * easting + northing * northing;
  if (
    !(
      squared >= minimumSquared &&
      squared <= maximumSquared &&
      northing > 0 &&
      Math.abs(easting) <= northing * tangentLimit
    )
  )
    return null;
  const radius = direction * Math.sqrt(squared);
  const longitude = Math.atan2(easting, northing) / exponent;
  const target =
    operation.type === 'lambert-conformal-conic'
      ? Math.log(radius / constant) / exponent
      : (constant - (exponent * radius) ** 2) / exponent;
  let latitude =
    operation.type === 'lambert-conformal-conic'
      ? Math.PI / 2 - 2 * Math.atan(Math.exp(target))
      : Math.asin(Math.max(-1, Math.min(1, target / 2)));
  for (let iteration = 0; iteration < 8; iteration++) {
    const denominator = 1 - eccentricitySquared * Math.sin(latitude) ** 2;
    latitude +=
      operation.type === 'lambert-conformal-conic'
        ? ((getLogT(latitude, eccentricitySquared) - target) * Math.cos(latitude) * denominator) /
          (1 - eccentricitySquared)
        : ((target - getAuthalicQ(latitude, eccentricitySquared)) * denominator ** 2) /
          (2 * (1 - eccentricitySquared) * Math.cos(latitude));
  }
  return Math.abs(longitude) <= CONIC_GEOGRAPHIC_BOUNDS[2] &&
    Math.abs(latitude) <= CONIC_GEOGRAPHIC_BOUNDS[3]
    ? [longitude, latitude]
    : null;
}

function getLogT(latitude: number, eccentricitySquared: number): number {
  const eccentricity = Math.sqrt(eccentricitySquared);
  return (
    -Math.asinh(Math.tan(latitude)) + eccentricity * Math.atanh(eccentricity * Math.sin(latitude))
  );
}

function getAuthalicQ(latitude: number, eccentricitySquared: number): number {
  const sine = Math.sin(latitude);
  const eccentricity = Math.sqrt(eccentricitySquared);
  return eccentricity
    ? (1 - eccentricitySquared) *
        (sine / (1 - eccentricitySquared * sine * sine) +
          Math.atanh(eccentricity * sine) / eccentricity)
    : 2 * sine;
}

// Small-argument series avoid absolute-error cancellation in transcendental builtins. With
// b/a >= .99, omitted terms in atanh(z)/z are below Float32 rounding (|z| < .142).
export const CONIC_SHADER_FUNCTIONS = `
fn PROGRAM_conicSin(value: f32) -> f32 {
  if (abs(value) < 0.01) {
    let squared = value * value;
    return value * (1.0 + squared * (-1.0 / 6.0 + squared / 120.0));
  }
  return sin(value);
}
fn PROGRAM_conicAtan2(numerator: f32, denominator: f32) -> f32 {
  if (denominator > 0.0 && abs(numerator) < 0.01 * denominator) {
    let ratio = numerator / denominator;
    let squared = ratio * ratio;
    return ratio * (1.0 + squared * (-1.0 / 3.0 + squared / 5.0));
  }
  return atan2(numerator, denominator);
}
fn PROGRAM_conicAtanhRatio(squared: f32) -> f32 {
  return 1.0 + squared * (1.0 / 3.0 + squared * (1.0 / 5.0 + squared * (1.0 / 7.0 + squared / 9.0)));
}
fn PROGRAM_conicLogT(latitude: f32, eccentricitySquared: f32) -> f32 {
  var spherical: f32;
  if (abs(latitude) < 0.01) {
    let squared = latitude * latitude;
    spherical = latitude * (1.0 + squared * (1.0 / 6.0 + squared / 24.0));
  } else {
    spherical = sign(latitude) * asinh(tan(abs(latitude)));
  }
  let sine = PROGRAM_conicSin(latitude);
  return -spherical + eccentricitySquared * sine * PROGRAM_conicAtanhRatio(eccentricitySquared * sine * sine);
}
fn PROGRAM_conicQ(latitude: f32, eccentricitySquared: f32) -> f32 {
  let sine = PROGRAM_conicSin(latitude);
  let squared = eccentricitySquared * sine * sine;
  return (1.0 - eccentricitySquared) * sine * (1.0 / (1.0 - squared) + PROGRAM_conicAtanhRatio(squared));
}`;

/** Direction/family are static shader code; shape, footprint and affine parameters can update. */
export function getConicStage(operation: ConicOperation, offset: number): string {
  const lambert = operation.type === 'lambert-conformal-conic';
  return `{
    if (compare_fp64(value.xy, PROGRAM_scalar(${offset + 16}u)) < 0 ||
        compare_fp64(value.zw, PROGRAM_scalar(${offset + 18}u)) < 0 ||
        compare_fp64(value.xy, PROGRAM_scalar(${offset + 20}u)) > 0 ||
        compare_fp64(value.zw, PROGRAM_scalar(${offset + 22}u)) > 0) { return invalid; }
    let scale = PROGRAM_scalar(${offset}u).x;
    let eccentricitySquared = PROGRAM_scalar(${offset + 2}u).x;
    let exponent = PROGRAM_scalar(${offset + 4}u).x;
    let constant = PROGRAM_scalar(${offset + 6}u).x;
    ${
      operation.inverse
        ? `
    let direction = sign(exponent);
    let eastingPair = mul_fp64(div_fp64(value.xy, PROGRAM_scalar(${offset}u)), vec2f(direction, 0.0));
    let northingPair = mul_fp64(div_fp64(sub_fp64(PROGRAM_scalar(${offset + 8}u), value.zw), PROGRAM_scalar(${offset}u)), vec2f(direction, 0.0));
    let squaredPair = sum_fp64(mul_fp64(eastingPair, eastingPair), mul_fp64(northingPair, northingPair));
    let absoluteEasting = select(eastingPair, -eastingPair, compare_fp64(eastingPair, vec2f(0.0)) < 0);
    if (compare_fp64(squaredPair, PROGRAM_scalar(${offset + 10}u)) < 0 ||
        compare_fp64(squaredPair, PROGRAM_scalar(${offset + 12}u)) > 0 ||
        compare_fp64(northingPair, vec2f(0.0)) <= 0 ||
        compare_fp64(absoluteEasting, mul_fp64(northingPair, PROGRAM_scalar(${offset + 14}u))) > 0) { return invalid; }
    let easting = eastingPair.x + eastingPair.y;
    let northing = northingPair.x + northingPair.y;
    let radius = direction * sqrt(easting * easting + northing * northing);
    let longitude = PROGRAM_conicAtan2(easting, northing) / exponent;
    let inverseValue = ${lambert ? 'log(radius / constant) / exponent' : '(constant - exponent * exponent * radius * radius) / exponent'};
    var latitude = ${lambert ? '1.5707963267948966 - 2.0 * atan(exp(inverseValue))' : 'asin(clamp(inverseValue * 0.5, -1.0, 1.0))'};
    for (var iteration = 0u; iteration < 8u; iteration++) {
      let sine = PROGRAM_conicSin(latitude);
      let denominator = 1.0 - eccentricitySquared * sine * sine;
      latitude += ${lambert ? '(PROGRAM_conicLogT(latitude, eccentricitySquared) - inverseValue) * cos(latitude) * denominator / (1.0 - eccentricitySquared)' : '(inverseValue - PROGRAM_conicQ(latitude, eccentricitySquared)) * denominator * denominator / (2.0 * (1.0 - eccentricitySquared) * cos(latitude))'};
    }
    value = vec4f(longitude, 0.0, latitude, 0.0);
    if (compare_fp64(value.xy, PROGRAM_scalar(${offset + 24}u)) < 0 ||
        compare_fp64(value.zw, PROGRAM_scalar(${offset + 26}u)) < 0 ||
        compare_fp64(value.xy, PROGRAM_scalar(${offset + 28}u)) > 0 ||
        compare_fp64(value.zw, PROGRAM_scalar(${offset + 30}u)) > 0) { return invalid; }
    `
        : `
    let coordinates = vec2f(value.x + value.y, value.z + value.w);
    let radius = ${lambert ? 'scale * constant * exp(exponent * PROGRAM_conicLogT(coordinates.y, eccentricitySquared))' : 'scale * sqrt(constant - exponent * PROGRAM_conicQ(coordinates.y, eccentricitySquared)) / exponent'};
    let angle = exponent * coordinates.x;
    let northing = sub_fp64(PROGRAM_scalar(${offset + 8}u), vec2f(radius * cos(angle), 0.0));
    value = vec4f(radius * PROGRAM_conicSin(angle), 0.0, northing);
    `
    }
  }`;
}
