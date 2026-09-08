// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NumberArray, VariableShaderType} from '@luma.gl/core';

// SPHERE SHADER

export type SphereUniforms = {
  colorAndLighting: NumberArray;
  modelViewMatrix: NumberArray;
  projectionMatrix: NumberArray;
};

export const sphere: {uniformTypes: Record<keyof SphereUniforms, VariableShaderType>} = {
  uniformTypes: {
    // TODO make sure order doesn't matter
    colorAndLighting: 'vec4<f32>',
    modelViewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>'
  }
};

export const SPHERE_WGSL = /* WGSL */ `\
struct SphereUniforms {
  colorAndLighting: vec4<f32>,
  modelViewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
};

@group(0) @binding(auto) var<uniform> sphere : SphereUniforms;

struct VertexInputs {
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
};

struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> VertexOutputs {
  var outputs: VertexOutputs;
  outputs.position = sphere.projectionMatrix * sphere.modelViewMatrix * vec4(inputs.positions, 1.0);
  outputs.normal = vec3((sphere.modelViewMatrix * vec4(inputs.normals, 0.0)).xyz);
  return outputs;
}

@fragment
fn fragmentMain(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  var attenuation = 1.0;
  if (sphere.colorAndLighting.a > 0.5) {
    let light = normalize(vec3(1.0, 1.0, 2.0));
    attenuation = max(dot(inputs.normal, light), 0.0);
  }
  return vec4(sphere.colorAndLighting.rgb * attenuation, 1.0);
}
`;

export const SPHERE_VS = /* glsl */ `\
#version 300 es

in vec3 positions;
in vec3 normals;

uniform sphereUniforms {
  // fragment shader
  vec4 colorAndLighting;
  // vertex shader
  mat4 modelViewMatrix;
  mat4 projectionMatrix;
} sphere;

out vec3 normal;

void main(void) {
  gl_Position = sphere.projectionMatrix * sphere.modelViewMatrix * vec4(positions, 1.0);
  normal = vec3((sphere.modelViewMatrix * vec4(normals, 0.0)));
}
`;

export const SPHERE_FS = /* glsl */ `\
#version 300 es

precision highp float;

uniform sphereUniforms {
  // fragment
  vec4 colorAndLighting;
  // vertex
  mat4 modelViewMatrix;
  mat4 projectionMatrix;
} sphere;

in vec3 normal;
out vec4 fragColor;

void main(void) {
  float attenuation = 1.0;
  if (sphere.colorAndLighting.a > 0.5) {
    vec3 light = normalize(vec3(1,1,2));
    attenuation = max(dot(normal, light), 0.0);
  }
  fragColor = vec4(sphere.colorAndLighting.rgb * attenuation, 1);
}
`;
