// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const WGSL_SHADER = /* WGSL */ `\
struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
};

@group(0) @binding(auto) var<uniform> app : Uniforms;
@group(0) @binding(auto) var uTexture : texture_2d<f32>;
@group(0) @binding(auto) var uTextureSampler : sampler;

struct VertexInputs {
  // CUBE GEOMETRY
  @location(0) positions : vec4<f32>,
  @location(1) texCoords : vec2<f32>,
  @location(2) colors : vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition: vec4<f32>,
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.Position = app.modelViewProjectionMatrix * inputs.positions;
  outputs.fragUV = inputs.texCoords;
  outputs.fragPosition = 0.5 * (inputs.positions + vec4(1.0, 1.0, 1.0, 1.0));
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  // return inputs.fragPosition;
  return textureSample(uTexture, uTextureSampler, inputs.fragUV);
  // TODO: apply sRGB OETF
}
`;

// GLSL

export const VS_GLSL = /* glsl */ `\
#version 300 es
#define SHADER_NAME cube-vs

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
} app;

layout(location=0) in vec3 positions;
layout(location=1) in vec2 texCoords;

out vec2 fragUV;
out vec4 fragPosition;

void main() {
  gl_Position = app.modelViewProjectionMatrix * vec4(positions, 1.0);
  fragUV = texCoords;
  fragPosition = 0.5 * (vec4(positions, 1.) + vec4(1., 1., 1., 1.));
}
`;

export const FS_GLSL = /* glsl */ `\
#version 300 es
#define SHADER_NAME cube-fs
precision highp float;

uniform sampler2D uTexture;

uniform appUniforms {
  mat4 modelViewProjectionMatrix;
} app;

in vec2 fragUV;
in vec4 fragPosition;

layout (location=0) out vec4 fragColor;

vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}

void main() {
  fragColor = fragPosition;
  fragColor = texture(uTexture, vec2(fragUV.x, 1.0 - fragUV.y));
  fragColor = sRGBTransferOETF( fragColor );
}
`;
