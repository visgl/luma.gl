// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Compact pending stable IDs and construct a GPU-only indirect dispatch record. */
export function makeScientificFlowSchedulingShader(persistent: boolean, spherical = false): string {
  return /* wgsl */ `
struct Parameters {
  ${spherical ? 'integration: vec4<f32>, limits: vec4<f32>, temporal: vec4<f32>, counters: vec4<u32>' : 'domain: vec4<f32>, integration: vec4<f32>, counters: vec4<u32>, temporal: vec4<f32>'}
};
@group(0) @binding(0) var<uniform> parameters: Parameters;
@group(0) @binding(1) var<storage, read> particles: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> previous: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> diagnostics: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> statistics: array<atomic<u32>>;
@group(0) @binding(5) var<storage, read_write> activeIndices: array<atomic<u32>>;
@group(0) @binding(6) var<storage, read_write> dispatchArguments: array<atomic<u32>>;
@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) invocation: vec3<u32>) {
  let index = invocation.x;
  if (index >= parameters.counters.x) {return;}
  // Lifecycle applies to every stable slot, even if it is absent from the queue.
  if (!${spherical} && (parameters.counters.w & 2u) != 0u) {previous[index] = particles[index];}
  var state = diagnostics[index];
  if ((parameters.counters.${spherical ? 'z' : 'w'} & 1u) != 0u) {
    state.x = 0.0;
    diagnostics[index] = state;
  }
  ${persistent ? 'atomicAdd(&statistics[u32(state.z)], 1u);' : ''}
  if (state.z == 0.0 && state.x < parameters.temporal.z) {
    let slot = atomicAdd(&activeIndices[0], 1u);
    atomicStore(&activeIndices[slot + 1u], index);
    atomicMax(&dispatchArguments[0], slot / 128u + 1u);
  } else {
    // The integration kernel accounts only for queued slots. Include every other
    // status here so final counts always cover the complete particle allocation.
    ${persistent ? '' : 'atomicAdd(&statistics[u32(state.z)], 1u);'}
  }
}
`;
}
