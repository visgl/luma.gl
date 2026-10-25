// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Shared collocated sampling. Validity: 1 valid, 0 missing, -1 outside domain. */
export const SCIENTIFIC_FLOW_SAMPLING = /* wgsl */ `
fn sampleField(field: texture_2d<f32>, position: vec2<f32>) -> vec3<f32> {
  if (any(position < vec2<f32>(0.0)) || any(position > vec2<f32>(1.0))) {
    return vec3<f32>(0.0, 0.0, -1.0);
  }
  let dimensions = vec2<i32>(textureDimensions(field));
  let grid = position * vec2<f32>(dimensions - vec2<i32>(1));
  let low = vec2<i32>(floor(grid));
  let high = min(low + vec2<i32>(1), dimensions - vec2<i32>(1));
  let fraction = fract(grid);
  let a = textureLoad(field, low, 0);
  let b = textureLoad(field, vec2<i32>(high.x, low.y), 0);
  let c = textureLoad(field, vec2<i32>(low.x, high.y), 0);
  let d = textureLoad(field, high, 0);
  if (min(min(a.z, b.z), min(c.z, d.z)) < 0.5) {return vec3<f32>(0.0);}
  return vec3<f32>(mix(mix(a.xy, b.xy, fraction.x), mix(c.xy, d.xy, fraction.x), fraction.y), 1.0);
}
fn velocity(position: vec2<f32>, fraction: f32) -> vec3<f32> {
  let weight = clamp(fraction, 0.0, 1.0);
  var sampled = sampleField(velocityField, position);
  if (weight >= 1.0) {
    sampled = sampleField(nextVelocityField, position);
  } else if (weight > 0.0) {
    let following = sampleField(nextVelocityField, position);
    sampled = vec3<f32>(mix(sampled.xy, following.xy, weight), min(sampled.z, following.z));
  }
  var velocityComponents = sampled.xy;
  if (parameters.counters.y == 1u) {
    let latitude = parameters.domain.y + parameters.domain.w * position.y;
    velocityComponents = velocityComponents / (111195.08 * vec2<f32>(cos(radians(latitude)), 1.0));
  }
  return vec3<f32>(velocityComponents / parameters.domain.zw, sampled.z);
}
`;
