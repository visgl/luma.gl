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
import {SCIENTIFIC_FLOW_SAMPLING} from './scientific-flow-sampling-shaders';

export const SCIENTIFIC_FLOW_RK45 = /* wgsl */ `
struct Parameters {
  domain: vec4<f32>,
  integration: vec4<f32>, // tolerance (physical distance), minimum dt, maximum dt, lifetime
  counters: vec4<u32>, // particle count, flags (geographic=1, periodic longitude=2), attempts per dispatch, first dispatch
  temporal: vec4<f32> // start fraction, end fraction, requested duration, unused
};
@group(0) @binding(0) var<uniform> parameters: Parameters;
@group(0) @binding(1) var<storage, read_write> particles: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> previous: array<vec4<f32>>;
@group(0) @binding(3) var velocityField: texture_2d<f32>;
@group(0) @binding(4) var nextVelocityField: texture_2d<f32>;
@group(0) @binding(5) var<storage, read_write> diagnostics: array<vec4<f32>>;
@group(0) @binding(6) var<storage, read_write> statistics: array<atomic<u32>>;

${SCIENTIFIC_FLOW_SAMPLING}

fn fraction(elapsed: f32) -> f32 {
  return mix(parameters.temporal.x, parameters.temporal.y,
    clamp(elapsed / max(parameters.temporal.z, 1e-30), 0.0, 1.0));
}
struct Trial {displacement: vec2<f32>, error: vec2<f32>, validity: f32};
fn trial(position: vec2<f32>, elapsed: f32, deltaTime: f32) -> Trial {
  let first = velocity(position, fraction(elapsed));
  let second = velocity(position + deltaTime * first.xy / 4.0, fraction(elapsed + deltaTime / 4.0));
  let third = velocity(position + deltaTime * (3.0/32.0 * first.xy + 9.0/32.0 * second.xy), fraction(elapsed + 3.0/8.0 * deltaTime));
  let fourth = velocity(position + deltaTime * (1932.0/2197.0 * first.xy - 7200.0/2197.0 * second.xy + 7296.0/2197.0 * third.xy), fraction(elapsed + 12.0/13.0 * deltaTime));
  let fifth = velocity(position + deltaTime * (439.0/216.0 * first.xy - 8.0 * second.xy + 3680.0/513.0 * third.xy - 845.0/4104.0 * fourth.xy), fraction(elapsed + deltaTime));
  let sixth = velocity(position + deltaTime * (-8.0/27.0 * first.xy + 2.0 * second.xy - 3544.0/2565.0 * third.xy + 1859.0/4104.0 * fourth.xy - 11.0/40.0 * fifth.xy), fraction(elapsed + deltaTime / 2.0));
  let lower = deltaTime * (25.0/216.0 * first.xy + 1408.0/2565.0 * third.xy + 2197.0/4104.0 * fourth.xy - fifth.xy / 5.0);
  let higher = deltaTime * (16.0/135.0 * first.xy + 6656.0/12825.0 * third.xy + 28561.0/56430.0 * fourth.xy - 9.0/50.0 * fifth.xy + 2.0/55.0 * sixth.xy);
  let last = velocity(position + higher, fraction(elapsed + deltaTime));
  return Trial(higher, higher - lower,
    min(min(min(first.z, second.z), min(third.z, fourth.z)), min(min(fifth.z, sixth.z), last.z)));
}
fn physicalError(error: vec2<f32>, position: vec2<f32>) -> f32 {
  var scale = parameters.domain.zw;
  if ((parameters.counters.y & 1u) != 0u) {
    let latitude = parameters.domain.y + parameters.domain.w * position.y;
    scale *= 111195.08 * vec2<f32>(cos(radians(latitude)), 1.0);
  }
  return length(error * scale);
}
@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let index = invocation.x;
  if (index >= parameters.counters.x) {return;}
  var particle = particles[index];
  previous[index] = particle;
  var state = diagnostics[index]; // request elapsed, proposed dt, status, last accepted dt
  if (parameters.counters.w != 0u) {state.x = 0.0;}
  let startingAge = particle.z;
  let startingElapsed = state.x;
  var accepted = 0u;
  var rejected = 0u;
  for (var attempt = 0u; attempt < parameters.counters.z; attempt++) {
    if (state.z != 0.0 || state.x >= parameters.temporal.z) {break;}
    if (particle.z >= parameters.integration.w) {state.z = 1.0; break;}
    let initialValidity = velocity(particle.xy, fraction(state.x)).z;
    if (initialValidity < 0.5) {state.z = select(3.0, 2.0, initialValidity < 0.0); break;}
    let remaining = parameters.temporal.z - state.x;
    let remainingLife = parameters.integration.w - particle.z;
    let proposedTimeStep = min(state.y, parameters.integration.z);
    let deltaTime = min(proposedTimeStep, min(remaining, remainingLife));
    // A final roundoff-sized remainder still needs integration, but may be smaller
    // than one age-clock ULP. Ordinary substeps must remain representable.
    let requestTail = state.x > 0.0 && deltaTime == remaining;
    if (!(deltaTime > 0.0) || !(state.x + deltaTime > state.x) ||
        (!(particle.z + deltaTime > particle.z) && !requestTail)) {
      state.z = 5.0; break;
    }
    let candidate = trial(particle.xy, state.x, deltaTime);
    let error = physicalError(candidate.error, particle.xy);
    // Comparisons also reject NaNs/overflow without relying on optional WGSL intrinsics.
    if (!(error >= 0.0) || !(error <= 3.402823e38) || any(abs(candidate.displacement) > vec2<f32>(3.402823e38))) {
      state.z = 5.0; break;
    }
    if (candidate.validity < 0.5 || error > parameters.integration.x) {
      rejected++;
      if (deltaTime <= parameters.integration.y) {
        state.z = select(select(3.0, 2.0, candidate.validity < 0.0), 4.0, candidate.validity > 0.5);
        break;
      }
      state.y = max(parameters.integration.y, deltaTime * 0.5);
      continue;
    }
    state.x = select(state.x + deltaTime, parameters.temporal.z, deltaTime == remaining);
    // Anchor age to this dispatch instead of accumulating one age rounding error per trial.
    particle = vec4<f32>(wrapPosition(particle.xy + candidate.displacement),
      startingAge + (state.x - startingElapsed), particle.w);
    state.w = deltaTime;
    // An endpoint clip says nothing about the useful proposal for the next request.
    // Preserve it unless a rejected trial already reduced it.
    state.y = select(
      min(parameters.integration.z, select(deltaTime, deltaTime * 2.0, error < parameters.integration.x * 0.1)),
      proposedTimeStep, deltaTime < proposedTimeStep);
    accepted++;
    if (deltaTime == remainingLife) {particle.z = parameters.integration.w; state.z = 1.0;}
  }
  particles[index] = particle;
  diagnostics[index] = state;
  atomicAdd(&statistics[u32(state.z)], 1u);
  if (state.z == 0.0 && state.x < parameters.temporal.z) {atomicAdd(&statistics[6], 1u);}
  atomicAdd(&statistics[7], accepted);
  atomicAdd(&statistics[8], rejected);
}
`;
