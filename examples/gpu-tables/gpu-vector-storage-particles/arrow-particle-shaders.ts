// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ComputeShaderLayout, ShaderLayout} from '@luma.gl/core';

export const WORKGROUP_SIZE = 64;
const PARTICLE_SIZE = 0.014;

export const WEBGPU_RENDER_SHADER = /* wgsl */ `\
@group(0) @binding(0) var<storage, read> particlePositions : array<vec2<f32>>;

struct VertexInputs {
  @builtin(vertex_index) vertexIndex : u32,
  @builtin(instance_index) instanceIndex : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec3<f32>,
};

fn getQuadCorner(vertexIndex : u32) -> vec2<f32> {
  if (vertexIndex == 0u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 1u) { return vec2<f32>(1.0, -1.0); }
  if (vertexIndex == 2u) { return vec2<f32>(1.0, 1.0); }
  if (vertexIndex == 3u) { return vec2<f32>(-1.0, -1.0); }
  if (vertexIndex == 4u) { return vec2<f32>(1.0, 1.0); }
  return vec2<f32>(-1.0, 1.0);
}

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let particlePosition = particlePositions[inputs.instanceIndex];
  let corner = getQuadCorner(inputs.vertexIndex % 6u) * ${PARTICLE_SIZE};
  let colorPhase = f32(inputs.instanceIndex % 11u) / 10.0;

  outputs.Position = vec4<f32>(particlePosition + corner, 0.0, 1.0);
  outputs.color = vec3<f32>(0.25 + colorPhase * 0.7, 0.92 - colorPhase * 0.48, 1.0);
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  return vec4<f32>(inputs.color, 1.0);
}
`;

export const WEBGL_TRANSFORM_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in vec2 particlePositions;
in vec2 particleVelocities;
out vec2 nextParticlePositions;
out vec2 nextParticleVelocities;

void main() {
  vec2 position = particlePositions + particleVelocities;
  vec2 velocity = particleVelocities;

  if (position.x < -0.98 || position.x > 0.98) {
    velocity.x = -velocity.x;
    position.x = clamp(position.x, -0.98, 0.98);
  }

  if (position.y < -0.98 || position.y > 0.98) {
    velocity.y = -velocity.y;
    position.y = clamp(position.y, -0.98, 0.98);
  }

  nextParticlePositions = position;
  nextParticleVelocities = velocity;
}
`;

export const WEBGL_RENDER_VERTEX_SHADER = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec2 particlePositions;
out vec3 vColor;

vec2 getQuadCorner(int vertexIndex) {
  if (vertexIndex == 0) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 1) { return vec2(1.0, -1.0); }
  if (vertexIndex == 2) { return vec2(1.0, 1.0); }
  if (vertexIndex == 3) { return vec2(-1.0, -1.0); }
  if (vertexIndex == 4) { return vec2(1.0, 1.0); }
  return vec2(-1.0, 1.0);
}

void main() {
  vec2 corner = getQuadCorner(gl_VertexID % 6) * ${PARTICLE_SIZE};
  float colorPhase = float(gl_InstanceID % 11) / 10.0;
  gl_Position = vec4(particlePositions + corner, 0.0, 1.0);
  vColor = vec3(0.25 + colorPhase * 0.7, 0.92 - colorPhase * 0.48, 1.0);
}
`;

export const WEBGL_RENDER_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

in vec3 vColor;
out vec4 fragColor;

void main() {
  fragColor = vec4(vColor, 1.0);
}
`;

export const COMPUTE_SHADER_LAYOUT = {
  bindings: [
    {name: 'particlePositions', type: 'storage', group: 0, location: 0},
    {name: 'particleVelocities', type: 'storage', group: 0, location: 1}
  ]
} satisfies ComputeShaderLayout;

export const RENDER_SHADER_LAYOUT = {
  attributes: [],
  bindings: [{name: 'particlePositions', type: 'read-only-storage', group: 0, location: 0}]
} satisfies ShaderLayout;

export const WEBGL_TRANSFORM_SHADER_LAYOUT = {
  attributes: [
    {name: 'particlePositions', location: 0, type: 'vec2<f32>'},
    {name: 'particleVelocities', location: 1, type: 'vec2<f32>'}
  ],
  bindings: []
} satisfies ShaderLayout;

export const WEBGL_RENDER_SHADER_LAYOUT = {
  attributes: [{name: 'particlePositions', location: 0, type: 'vec2<f32>', stepMode: 'instance'}],
  bindings: []
} satisfies ShaderLayout;

export function makeComputeShader(): string {
  return /* wgsl */ `\
@group(0) @binding(0) var<storage, read_write> particlePositions : array<vec2<f32>>;
@group(0) @binding(1) var<storage, read_write> particleVelocities : array<vec2<f32>>;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn computeMain(@builtin(global_invocation_id) globalInvocationId : vec3<u32>) {
  let particleIndex = globalInvocationId.x;
  if (particleIndex >= arrayLength(&particlePositions)) {
    return;
  }

  var position = particlePositions[particleIndex];
  var velocity = particleVelocities[particleIndex];
  position = position + velocity;

  if (position.x < -0.98 || position.x > 0.98) {
    velocity.x = -velocity.x;
    position.x = clamp(position.x, -0.98, 0.98);
  }

  if (position.y < -0.98 || position.y > 0.98) {
    velocity.y = -velocity.y;
    position.y = clamp(position.y, -0.98, 0.98);
  }

  particlePositions[particleIndex] = position;
  particleVelocities[particleIndex] = velocity;
}
`;
}
