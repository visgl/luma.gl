// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const SCENE_WGSL = /* wgsl */ `\
struct AppUniforms {
  projectionMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
};

@group(0) @binding(auto) var<uniform> app: AppUniforms;
@group(0) @binding(auto) var cubeTexture: texture_2d<f32>;
@group(0) @binding(auto) var cubeTextureSampler: sampler;
#if LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS
@group(0) @binding(auto) var<storage, read> instanceModelMatrix: array<mat4x4<f32>>;
#endif

struct VertexInputs {
  @builtin(instance_index) instanceIndex: u32,
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
  @location(2) texCoords: vec2<f32>,
#if !LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS
  @location(3) instanceModelMatrixCol0: vec4<f32>,
  @location(4) instanceModelMatrixCol1: vec4<f32>,
  @location(5) instanceModelMatrixCol2: vec4<f32>,
  @location(6) instanceModelMatrixCol3: vec4<f32>,
#endif
};

struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) tint: vec3<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> VertexOutputs {
#if LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS
  let modelMatrix = instanceModelMatrix[inputs.instanceIndex];
#else
  let modelMatrix = mat4x4<f32>(
    inputs.instanceModelMatrixCol0,
    inputs.instanceModelMatrixCol1,
    inputs.instanceModelMatrixCol2,
    inputs.instanceModelMatrixCol3
  );
#endif

  let worldPosition = modelMatrix * vec4<f32>(inputs.positions, 1.0);
  let worldNormal = normalize((modelMatrix * vec4<f32>(inputs.normals, 0.0)).xyz);
  let depthTint = clamp((-modelMatrix[3].z) / 20.0, 0.0, 1.0);

  var outputs: VertexOutputs;
  outputs.position = app.projectionMatrix * app.viewMatrix * worldPosition;
  outputs.normal = worldNormal;
  outputs.uv = inputs.texCoords;
  outputs.tint = mix(vec3<f32>(0.18, 0.55, 0.95), vec3<f32>(1.0, 0.56, 0.18), depthTint);
  return outputs;
}

@fragment
fn fragmentMain(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  let textureColor = textureSample(cubeTexture, cubeTextureSampler, inputs.uv).rgb;
  let baseColor = mix(inputs.tint * 0.55, textureColor, 0.75);
  let light = clamp(dot(normalize(inputs.normal), normalize(vec3<f32>(1.0, 1.0, 0.35))), 0.0, 1.0);
  return vec4<f32>(baseColor * (light + 0.12), 1.0);
}
`;

export const SCENE_VERTEX_SHADER = /* glsl */ `\
#version 300 es

in vec3 positions;
in vec3 normals;
in vec2 texCoords;
in vec4 instanceModelMatrixCol0;
in vec4 instanceModelMatrixCol1;
in vec4 instanceModelMatrixCol2;
in vec4 instanceModelMatrixCol3;

uniform appUniforms {
  mat4 projectionMatrix;
  mat4 viewMatrix;
} app;

uniform sampler2D cubeTexture;

out vec3 vNormal;
out vec2 vUv;
out vec3 vTint;

void main(void) {
  mat4 modelMatrix = mat4(
    instanceModelMatrixCol0,
    instanceModelMatrixCol1,
    instanceModelMatrixCol2,
    instanceModelMatrixCol3
  );

  vec4 worldPosition = modelMatrix * vec4(positions, 1.0);
  gl_Position = app.projectionMatrix * app.viewMatrix * worldPosition;

  vec3 worldNormal = normalize(mat3(modelMatrix) * normals);
  float depthTint = clamp((-modelMatrix[3].z) / 20.0, 0.0, 1.0);

  vNormal = worldNormal;
  vUv = texCoords;
  vTint = mix(vec3(0.18, 0.55, 0.95), vec3(1.0, 0.56, 0.18), depthTint);
}
`;

export const SCENE_FRAGMENT_SHADER = /* glsl */ `\
#version 300 es
precision highp float;

uniform sampler2D cubeTexture;

in vec3 vNormal;
in vec2 vUv;
in vec3 vTint;

out vec4 fragColor;

void main(void) {
  vec3 textureColor = texture(cubeTexture, vec2(vUv.x, 1.0 - vUv.y)).rgb;
  vec3 baseColor = mix(vTint * 0.55, textureColor, 0.75);
  float light = clamp(dot(normalize(vNormal), normalize(vec3(1.0, 1.0, 0.35))), 0.0, 1.0);
  fragColor = vec4(baseColor * (light + 0.12), 1.0);
}
`;
