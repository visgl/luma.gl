// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Shared collocated and Cartesian C-grid sampling. Validity: 1 valid, 0 missing, -1 outside domain. */
export const SCIENTIFIC_FLOW_SAMPLING = /* wgsl */ `
// Geographic fields are restricted to latitudes within +/-85 degrees. Evaluate
// cosine on that bounded interval explicitly: native GPU trig approximations can
// otherwise accumulate metres of longitudinal drift over long integrations.
fn latitudeCosine(latitude: f32) -> f32 {
  let angle = latitude * 0.017453292519943295;
  let squared = angle * angle;
  return 1.0 + squared * (-0.5 + squared * (1.0/24.0 + squared * (-1.0/720.0 +
    squared * (1.0/40320.0 + squared * (-1.0/3628800.0 + squared / 479001600.0)))));
}
fn wrapPosition(position: vec2<f32>) -> vec2<f32> {
  if ((parameters.counters.y & 2u) != 0u) {return vec2<f32>(fract(position.x), position.y);}
  return position;
}
fn sampleField(field: texture_2d<f32>, unwrappedPosition: vec2<f32>) -> vec3<f32> {
  let position = wrapPosition(unwrappedPosition);
  if (any(position < vec2<f32>(0.0)) || any(position > vec2<f32>(1.0))) {
    return vec3<f32>(0.0, 0.0, -1.0);
  }
  let dimensions = vec2<i32>(textureDimensions(field));
  let grid = position * vec2<f32>(dimensions - vec2<i32>(1));
  if ((parameters.counters.y & 8u) != 0u) {
    let cell = min(vec2<i32>(floor(grid)), dimensions - vec2<i32>(2));
    let fraction = grid - vec2<f32>(cell);
    let lower = textureLoad(field, cell, 0);
    let right = textureLoad(field, cell + vec2<i32>(1, 0), 0);
    let upper = textureLoad(field, cell + vec2<i32>(0, 1), 0);
    if (min(min(lower.z, lower.w), min(right.z, upper.w)) < 0.5) {return vec3<f32>(0.0);}
    // Each normal component varies only along its normal axis. This reproduces
    // the cell's finite-volume divergence and preserves normal face velocities.
    return vec3<f32>(mix(lower.x, right.x, fraction.x), mix(lower.y, upper.y, fraction.y), 1.0);
  }
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
  if ((parameters.counters.y & 1u) != 0u) {
    let latitude = parameters.domain.y + parameters.domain.w * position.y;
    velocityComponents = velocityComponents / (111195.08 * vec2<f32>(latitudeCosine(latitude), 1.0));
  }
  return vec3<f32>(velocityComponents / parameters.domain.zw, sampled.z);
}
`;
