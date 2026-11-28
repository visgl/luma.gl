// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: Copyright (c) 2025, Parcels team
// RKF45 stages/controller adapted from Parcels AdvectionRK45 at
// 8584c09a4189ed29a49aa980b9830a2379e42c65, src/parcels/kernels/_advection.py.
// See PARCELS-LICENSE.txt for the retained upstream MIT notice.
/*!
The MIT License (MIT)

Copyright (c) 2025, Parcels team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
import {SPHERICAL_FLOW_SAMPLING} from './spherical-flow-sampling-shaders';

/** Embedded RKF45 in Cartesian directions; error is physical chord distance on the sphere. */
export function makeSphericalFlowRK45Shader(persistent: boolean): string {
  return /* wgsl */ `
struct Parameters {integration: vec4f, limits: vec4f, temporal: vec4f, counters: vec4u};
@group(0) @binding(0) var<uniform> parameters: Parameters;
@group(0) @binding(1) var<storage, read_write> particles: array<vec4f>;
${persistent ? '' : '@group(0) @binding(2) var<storage, read_write> previous: array<vec4f>;'}
@group(0) @binding(3) var velocityField: texture_2d<f32>;
@group(0) @binding(4) var nextVelocityField: texture_2d<f32>;
@group(0) @binding(5) var<storage, read_write> diagnostics: array<vec4f>;
@group(0) @binding(6) var<storage, read_write> statistics: array<atomic<u32>>;
${
  persistent
    ? `
@group(0) @binding(7) var<storage, read> activeIndices: array<u32>;
@group(0) @binding(8) var<storage, read_write> survivorIndices: array<atomic<u32>>;
@group(0) @binding(9) var<storage, read_write> survivorArguments: array<atomic<u32>>;
`
    : ''
}
${SPHERICAL_FLOW_SAMPLING}
fn fraction(elapsed: f32) -> f32 {
  return mix(parameters.temporal.x, parameters.temporal.y, clamp(elapsed / max(parameters.temporal.z, 1e-30), 0.0, 1.0));
}
fn derivative(position: vec3f, fraction: f32) -> vec3f {
  let normal = normalize(position);
  let sampled = mix(sampleSnapshot(velocityField, normal), sampleSnapshot(nextVelocityField, normal), fraction);
  return (sampled - dot(sampled, normal) * normal) / parameters.integration.x;
}
struct Trial {position: vec3f, error: f32};
fn trial(position: vec3f, elapsed: f32, deltaTime: f32) -> Trial {
  let first = derivative(position, fraction(elapsed));
  let second = derivative(position + deltaTime * first.xyz / 4.0, fraction(elapsed + deltaTime / 4.0));
  let third = derivative(position + deltaTime * (3.0/32.0 * first.xyz + 9.0/32.0 * second.xyz), fraction(elapsed + 3.0/8.0 * deltaTime));
  let fourth = derivative(position + deltaTime * (1932.0/2197.0 * first.xyz - 7200.0/2197.0 * second.xyz + 7296.0/2197.0 * third.xyz), fraction(elapsed + 12.0/13.0 * deltaTime));
  let fifth = derivative(position + deltaTime * (439.0/216.0 * first.xyz - 8.0 * second.xyz + 3680.0/513.0 * third.xyz - 845.0/4104.0 * fourth.xyz), fraction(elapsed + deltaTime));
  let sixth = derivative(position + deltaTime * (-8.0/27.0 * first.xyz + 2.0 * second.xyz - 3544.0/2565.0 * third.xyz + 1859.0/4104.0 * fourth.xyz - 11.0/40.0 * fifth.xyz), fraction(elapsed + deltaTime / 2.0));
  let lower = deltaTime * (25.0/216.0 * first.xyz + 1408.0/2565.0 * third.xyz + 2197.0/4104.0 * fourth.xyz - fifth.xyz / 5.0);
  let higher = deltaTime * (16.0/135.0 * first.xyz + 6656.0/12825.0 * third.xyz + 28561.0/56430.0 * fourth.xyz - 9.0/50.0 * fifth.xyz + 2.0/55.0 * sixth.xyz);
  let candidate = normalize(position + higher);
  let reference = normalize(position + lower);
  return Trial(candidate, length(candidate - reference) * parameters.integration.x);
}
@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  ${
    persistent
      ? `
  if (invocation.x >= activeIndices[0]) {return;}
  let index = activeIndices[invocation.x + 1u];
  `
      : `
  let index = invocation.x;
  if (index >= parameters.counters.x) {return;}
  `
  }
  var particle = particles[index];
  ${persistent ? '' : 'if (parameters.counters.w != 0u) {previous[index] = particle;}'}
  var state = diagnostics[index];
  if (parameters.counters.z != 0u) {state.x = 0.0;}
  let startingAge = particle.w;
  let startingElapsed = state.x;
  var accepted = 0u;
  var rejected = 0u;
  for (var attempt = 0u; attempt < parameters.counters.y; attempt++) {
    if (state.z != 0.0 || state.x >= parameters.temporal.z) {break;}
    if (particle.w >= parameters.limits.x) {state.z = 1.0; break;}
    let remaining = parameters.temporal.z - state.x;
    let remainingLife = parameters.limits.x - particle.w;
    let proposed = min(state.y, parameters.integration.w);
    let deltaTime = min(proposed, min(remaining, remainingLife));
    let tail = state.x > 0.0 && deltaTime == remaining;
    if (!(deltaTime > 0.0) || !(state.x + deltaTime > state.x) ||
        (!(particle.w + deltaTime > particle.w) && !tail)) {state.z = 5.0; break;}
    let candidate = trial(particle.xyz, state.x, deltaTime);
    if (!(candidate.error >= 0.0) || !(candidate.error <= 3.402823e38) ||
        !(dot(candidate.position, candidate.position) > 0.5)) {state.z = 5.0; break;}
    if (candidate.error > parameters.integration.y) {
      rejected++;
      if (deltaTime <= parameters.integration.z) {state.z = 4.0; break;}
      state.y = max(parameters.integration.z, deltaTime * 0.5);
      continue;
    }
    state.x = select(state.x + deltaTime, parameters.temporal.z, deltaTime == remaining);
    particle = vec4f(candidate.position, startingAge + (state.x - startingElapsed));
    state.w = deltaTime;
    state.y = select(min(parameters.integration.w, select(deltaTime, deltaTime * 2.0,
      candidate.error < parameters.integration.y * 0.1)), proposed, deltaTime < proposed);
    accepted++;
    if (deltaTime == remainingLife) {particle.w = parameters.limits.x; state.z = 1.0;}
  }
  particles[index] = particle;
  diagnostics[index] = state;
  ${
    persistent
      ? `
  if (state.z != 0.0) {
    atomicSub(&statistics[0], 1u);
    atomicAdd(&statistics[u32(state.z)], 1u);
  } else if (state.x < parameters.temporal.z) {
    let slot = atomicAdd(&survivorIndices[0], 1u);
    atomicStore(&survivorIndices[slot + 1u], index);
    atomicMax(&survivorArguments[0], slot / 128u + 1u);
  }
  `
      : 'atomicAdd(&statistics[u32(state.z)], 1u);'
  }
  if (state.z == 0.0 && state.x < parameters.temporal.z) {atomicAdd(&statistics[6], 1u);}
  atomicAdd(&statistics[7], accepted);
  atomicAdd(&statistics[8], rejected);
}
`;
}
