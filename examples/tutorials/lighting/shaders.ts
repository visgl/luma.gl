// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const WGSL_SHADER = /* wgsl */ `\

struct Uniforms {
  modelMatrix : mat4x4<f32>,
  mvpMatrix : mat4x4<f32>,
  eyePosition : vec3<f32>,
};

@group(0) @binding(auto) var<uniform> app : Uniforms;
@group(0) @binding(auto) var uTexture : texture_2d<f32>;
@group(0) @binding(auto) var uTextureSampler : sampler;

struct VertexInputs {
  // CUBE GEOMETRY
  @location(0) positions : vec3<f32>,
  @location(1) normals : vec3<f32>,
  @location(2) texCoords : vec2<f32>
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition: vec3<f32>,
  @location(2) fragNormal: vec3<f32>
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = app.mvpMatrix * vec4<f32>(inputs.positions, 1);
  outputs.fragUV = inputs.texCoords;
  outputs.fragPosition = (app.modelMatrix * vec4<f32>(inputs.positions, 1.0)).xyz;
  // NOTE: WGSL lacks conversion syntax: https://github.com/gpuweb/gpuweb/issues/2399
  let mat3 = mat3x3(app.modelMatrix[0].xyz, app.modelMatrix[1].xyz, app.modelMatrix[2].xyz);
  outputs.fragNormal = mat3 * inputs.normals;
  return outputs;
  //   vPosition = (app.modelMatrix * vec4(positions, 1.0)).xyz;
  //   vNormal = mat3(app.modelMatrix) * normals;
  //   vUV = texCoords;
  //   gl_Position = app.mvpMatrix * vec4(positions, 1.0);
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let surfaceColor = textureSample(uTexture, uTextureSampler, vec2<f32>(inputs.fragUV.x, 1.0 - inputs.fragUV.y)).rgb;
  let litColor = lighting_getLightColor2(
    surfaceColor,
    app.eyePosition,
    inputs.fragPosition,
    normalize(inputs.fragNormal)
  );
  return vec4<f32>(litColor, 1.0);
}
`;

export const vs = /* glsl */ `\
#version 300 es

in vec3 positions;
in vec3 normals;
in vec2 texCoords;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vUV;
out vec3 vColor;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 mvpMatrix;
  vec3 eyePosition;
} app;

void main(void) {
  vPosition = (app.modelMatrix * vec4(positions, 1.0)).xyz;
  vNormal = mat3(app.modelMatrix) * normals;
  vUV = texCoords;

  #ifdef LIGHTING_VERTEX
  vColor = lighting_getLightColor(vec3(1.0), app.eyePosition, vPosition, normalize(vNormal));
  #endif
  gl_Position = app.mvpMatrix * vec4(positions, 1.0);
}
`;

export const fs = /* glsl */ `\
#version 300 es
precision highp float;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vUV;
in vec3 vColor;

uniform sampler2D uTexture;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 mvpMatrix;
  vec3 eyePosition;
} app;

out vec4 fragColor;

void main(void) {
  #ifdef LIGHTING_FRAGMENT
  vec3 surfaceColor = texture(uTexture, vec2(vUV.x, 1.0 - vUV.y)).rgb;
  surfaceColor = lighting_getLightColor(surfaceColor, app.eyePosition, vPosition, normalize(vNormal));
  fragColor = vec4(surfaceColor, 1.0);
  #endif

  #ifdef LIGHTING_VERTEX
  fragColor = vec4(vColor, 1.0);
  #endif
}
`;
