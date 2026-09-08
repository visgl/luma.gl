// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// TODO - WGSL shader is work in progress
export const source = /* WGSL */ `\
struct Uniforms {
  mvpMatrix : mat4x4<f32>,
  time : f32,
};

@group(0) @binding(auto) var<uniform> app : Uniforms;
@group(0) @binding(auto) var uTexture : texture_3d<f32>;
@group(0) @binding(auto) var uTextureSampler : sampler;

struct VertexInputs {
  // CUBE GEOMETRY
  @location(0) position : vec4<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUVW : vec3<f32>,
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = app.mvpMatrix * inputs.position;
  outputs.fragUVW = inputs.position.xyz;
  // outputs.fragPosition = 0.5 * (inputs.position + vec4(1.0, 1.0, 1.0, 1.0));
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let sampleColor = textureSample(uTexture, uTextureSampler, inputs.fragUVW + vec3<f32>(0.0, 0.0, app.time));
  let alpha = sampleColor.r * 0.1;
  return vec4(fract(inputs.fragUVW) * alpha, alpha);
}
`;

export const vs = /* glsl */ `\
#version 300 es
in vec3 position;

uniform appUniforms {
  mat4 mvpMatrix;
  float time;
} app;

out vec3 vUVW;
void main() {
  vUVW = position.xyz + 0.5;
  gl_Position = app.mvpMatrix * vec4(position, 1.0);
  gl_PointSize = 1.0;
}`;

export const fs = /* glsl */ `\
#version 300 es
precision highp float;
precision lowp sampler3D;

uniform appUniforms {
  mat4 mvpMatrix;
  float time;
} app;

uniform sampler3D uTexture;

in vec3 vUVW;
out vec4 fragColor;

void main() {
  vec4 sampleColor = texture(uTexture, vUVW + vec3(0.0, 0.0, app.time));
  float alpha = sampleColor.r * 0.1;
  fragColor = vec4(fract(vUVW) * alpha, alpha);
}`;
