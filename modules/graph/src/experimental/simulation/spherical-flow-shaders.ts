// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {SPHERICAL_FLOW_SAMPLING} from './spherical-flow-sampling-shaders';

/** Normalize RK stages in Cartesian space and sample world-vector snapshots on the sphere. */
export const SPHERICAL_FLOW_SHADER = /* wgsl */ `
struct Parameters {integration: vec4f, counts: vec4u};
@group(0) @binding(0) var<uniform> parameters: Parameters;
@group(0) @binding(1) var<storage, read> previous: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> next: array<vec4f>;
@group(0) @binding(3) var velocityField: texture_2d<f32>;
@group(0) @binding(4) var nextVelocityField: texture_2d<f32>;
${SPHERICAL_FLOW_SAMPLING}
fn derivative(position: vec3f, fraction: f32) -> vec3f {
  let normal = normalize(position);
  let velocity = mix(sampleSnapshot(velocityField, normal), sampleSnapshot(nextVelocityField, normal), fraction);
  return (velocity - dot(velocity, normal) * normal) * parameters.integration.y;
}
@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= parameters.counts.x) {return;}
  let initial = previous[index];
  var position = initial.xyz;
  let deltaTime = parameters.integration.x;
  for (var substep = 0u; substep < parameters.counts.y; substep++) {
    let start = mix(parameters.integration.z, parameters.integration.w, f32(substep) / f32(parameters.counts.y));
    let middle = mix(parameters.integration.z, parameters.integration.w, (f32(substep) + 0.5) / f32(parameters.counts.y));
    let end = mix(parameters.integration.z, parameters.integration.w, f32(substep + 1u) / f32(parameters.counts.y));
    let first = derivative(position, start);
    let second = derivative(position + first * deltaTime * 0.5, middle);
    if (parameters.counts.z == 4u) {
      let third = derivative(position + second * deltaTime * 0.5, middle);
      let fourth = derivative(position + third * deltaTime, end);
      position = normalize(position + (first + 2.0 * second + 2.0 * third + fourth) * deltaTime / 6.0);
    } else {position = normalize(position + second * deltaTime);}
  }
  next[index] = vec4f(position, initial.w + deltaTime * f32(parameters.counts.y));
}
`;
