// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {VariableShaderType} from '@luma.gl/core';

// SHADERS

export type AppUniforms = {
  uColor: number[];
  uModel: number[];
  uView: number[];
  uProjection: number[];
};

export const app: {uniformTypes: Record<string, VariableShaderType>} = {
  uniformTypes: {
    uColor: 'vec3<f32>',
    uModel: 'mat4x4<f32>',
    uView: 'mat4x4<f32>',
    uProjection: 'mat4x4<f32>'
  }
};

export const source = /* wgsl */ `\
struct Uniforms {
  uColor : vec3<f32>,
  uModel : mat4x4<f32>,
  uView : mat4x4<f32>,
  uProjection : mat4x4<f32>,
};

@group(0) @binding(auto) var<uniform> app : Uniforms;

struct VertexInputs {
  // CUBE GEOMETRY
  @location(0) positions : vec4<f32>,
  @location(1) normals : vec3<f32>
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec3<f32>,
  @location(1) dirlightNormal: DirlightNormal,
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  // gl_Position = app.uProjection * app.uView * app.uModel * vec4(positions, 1.0);
  outputs.Position = app.uProjection * app.uView * app.uModel * inputs.positions;
  outputs.color = app.uColor;

  let normal: vec3<f32> = (app.uModel * vec4<f32>(inputs.normals, 0.0)).xyz;
  outputs.dirlightNormal = dirlight_setNormal(normal);
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  var fragColor = vec4(inputs.color, 1.);
  fragColor = dirlight_filterColor(fragColor, DirlightInputs(inputs.dirlightNormal));
  return fragColor;
}
`;

export const vs = /* glsl */ `\
#version 300 es

in vec3 positions;
in vec3 normals;

uniform appUniforms {
  vec3 uColor;
  mat4 uModel;
  mat4 uView;
  mat4 uProjection;
} app;

out vec3 color;

void main(void) {
  vec3 normal = vec3(app.uModel * vec4(normals, 0.0));

  // Set up data for modules
  color = app.uColor;
  dirlight_setNormal(normal);
  gl_Position = app.uProjection * app.uView * app.uModel * vec4(positions, 1.0);
}
`;

export const fs = /* glsl */ `\
#version 300 es

precision highp float;

in vec3 color;
out vec4 fragColor;

void main(void) {
  fragColor = vec4(color, 1.);
  fragColor = dirlight_filterColor(fragColor);
}
`;
