// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const POSITIONS = new Float32Array([
  0.0, 0.15, 0.0, -0.1, -0.15, 0.0, 0.1, -0.15, 0.0, 0.0, 0.15, 0.0, 0.1, -0.15, 0.0, 0.0, -0.35,
  0.0
]);

export const COLORS = new Float32Array([
  0.0, 0.6, 1.0, 0.0, 0.4, 0.8, 0.0, 0.8, 0.8, 0.0, 0.6, 1.0, 0.0, 0.8, 0.8, 0.0, 0.4, 0.8
]);

export const WGSL_SHADER = /* WGSL */ `\
struct AppUniforms {
  uModelViewProjection : mat4x4<f32>,
}

@group(0) @binding(auto) var<uniform> app : AppUniforms;

struct VertexInput {
  @location(0) positions : vec3<f32>,
  @location(1) colors : vec3<f32>
}

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) colors : vec3<f32>
}

@vertex
fn vertexMain(input : VertexInput) -> VertexOutput {
  var output : VertexOutput;
  output.position = app.uModelViewProjection * vec4<f32>(input.positions, 1.0);
  output.colors = input.colors;
  return output;
}

@fragment
fn fragmentMain(input : VertexOutput) -> @location(0) vec4<f32> {
  return vec4<f32>(input.colors, 0.8);
}
`;

export const VS_GLSL = /* glsl */ `\
#version 300 es
layout(location = 0) in vec3 positions;
layout(location = 1) in vec3 colors;

layout(std140) uniform app {
  mat4 uModelViewProjection;
};

out vec3 vColor;

void main(void) {
  gl_Position = uModelViewProjection * vec4(positions, 1.0);
  vColor = colors;
}
`;

export const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec3 vColor;

out vec4 fragColor;

void main(void) {
  fragColor = vec4(vColor, 0.8);
}
`;
