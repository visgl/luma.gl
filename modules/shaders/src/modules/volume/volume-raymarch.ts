// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '../../lib/shader-module/shader-module';

const source = /* wgsl */ `\
fn volumeRaymarch_intersectBox(origin: vec3f, direction: vec3f, minimum: vec3f, maximum: vec3f) -> vec2f {
  let safeDirection = select(vec3f(0.000001), direction, abs(direction) > vec3f(0.000001));
  let first = (minimum - origin) / safeDirection;
  let second = (maximum - origin) / safeDirection;
  let nearPlane = min(first, second);
  let farPlane = max(first, second);
  return vec2f(
    max(max(nearPlane.x, nearPlane.y), nearPlane.z),
    min(min(farPlane.x, farPlane.y), farPlane.z)
  );
}

fn volumeRaymarch_mixScalar(corners: array<f32, 8>, blend: vec3f) -> f32 {
  let lower = mix(mix(corners[0], corners[1], blend.x), mix(corners[2], corners[3], blend.x), blend.y);
  let upper = mix(mix(corners[4], corners[5], blend.x), mix(corners[6], corners[7], blend.x), blend.y);
  return mix(lower, upper, blend.z);
}

fn volumeRaymarch_mixVector(corners: array<vec3f, 8>, blend: vec3f) -> vec3f {
  let lower = mix(mix(corners[0], corners[1], blend.x), mix(corners[2], corners[3], blend.x), blend.y);
  let upper = mix(mix(corners[4], corners[5], blend.x), mix(corners[6], corners[7], blend.x), blend.y);
  return mix(lower, upper, blend.z);
}

fn volumeRaymarch_sequentialColor(value: f32, lowColor: vec3f, highColor: vec3f) -> vec3f {
  return mix(lowColor, highColor, clamp(value, 0.0, 1.0));
}

fn volumeRaymarch_signedColor(value: f32, negativeColor: vec3f, neutralColor: vec3f, positiveColor: vec3f) -> vec3f {
  let amount = clamp(abs(value), 0.0, 1.0);
  let signedTarget = select(negativeColor, positiveColor, value >= 0.0);
  return mix(neutralColor, signedTarget, amount);
}

fn volumeRaymarch_directionColor(vector: vec3f) -> vec3f {
  let direction = normalize(vector + vec3f(0.00001));
  return 0.18 + 0.82 * (direction * 0.5 + 0.5);
}

fn volumeRaymarch_segmentDistance(point: vec3f, start: vec3f, end: vec3f) -> f32 {
  let segment = end - start;
  let fraction = clamp(dot(point - start, segment) / max(dot(segment, segment), 0.000001), 0.0, 1.0);
  return length(point - (start + segment * fraction));
}

fn volumeRaymarch_arrowDistance(
  point: vec3f,
  center: vec3f,
  direction: vec3f,
  arrowLength: f32,
  shaftRadius: f32,
  headRadius: f32
) -> vec2f {
  let tail = center - direction * arrowLength * 0.48;
  let shoulder = center + direction * arrowLength * 0.18;
  let tip = center + direction * arrowLength * 0.52;
  let shaftDistance = volumeRaymarch_segmentDistance(point, tail, shoulder) - shaftRadius;
  let headVector = point - shoulder;
  let headLength = max(length(tip - shoulder), 0.000001);
  let headPosition = dot(headVector, direction);
  let taperedRadius = headRadius * (1.0 - clamp(headPosition / headLength, 0.0, 1.0));
  let radialDistance = length(headVector - direction * headPosition);
  let headDistance = max(
    radialDistance - taperedRadius,
    max(-headPosition, headPosition - headLength)
  );
  return vec2f(min(shaftDistance, headDistance), headDistance);
}

fn volumeRaymarch_composite(accumulated: vec4f, color: vec3f, alpha: f32) -> vec4f {
  let contribution = (1.0 - accumulated.a) * clamp(alpha, 0.0, 1.0);
  return vec4f(accumulated.rgb + color * contribution, accumulated.a + contribution);
}
`;

/** WGSL helpers shared by structured-volume ray marchers. */
export const volumeRaymarch = {
  name: 'volumeRaymarch',
  source
} as const satisfies ShaderModule<{}, {}>;
