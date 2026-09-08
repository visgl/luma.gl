// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const SAMPLE_MODULE = {
  uniformTypes: {
    rect: 'vec4<f32>',
    uvTransform: 'vec4<f32>',
    options: 'vec4<f32>'
  }
} as const;

export const COLOR_SAMPLE_WGSL = /* wgsl */ `
struct AppUniforms {
  rect: vec4<f32>,
  uvTransform: vec4<f32>,
  options: vec4<f32>,
};

@group(0) @binding(auto) var<uniform> app: AppUniforms;
@group(0) @binding(auto) var uTexture: texture_2d<f32>;
@group(0) @binding(auto) var uTextureSampler: sampler;

struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutputs {
  let localPositions = array<vec2<f32>, 6>(
    vec2<f32>(-0.5, -0.5),
    vec2<f32>(0.5, -0.5),
    vec2<f32>(-0.5, 0.5),
    vec2<f32>(-0.5, 0.5),
    vec2<f32>(0.5, -0.5),
    vec2<f32>(0.5, 0.5)
  );
  let localPosition = localPositions[vertexIndex];
  let normalizedUv = localPosition + vec2<f32>(0.5);
  let effectiveScale = app.uvTransform.x / max(app.options.y, 0.05);
  let transformedUv = (normalizedUv - vec2<f32>(0.5)) * effectiveScale +
    vec2<f32>(0.5) + app.uvTransform.zw;
  let perspective = select(
    1.0,
    mix(1.0, 1.0 + app.options.z * 5.0, normalizedUv.y),
    app.options.x > 0.5
  );
  let screenPosition = app.rect.xy + localPosition * app.rect.zw;
  var outputs: VertexOutputs;
  outputs.position = vec4<f32>(screenPosition * perspective, 0.0, perspective);
  outputs.uv = transformedUv;
  return outputs;
}

@fragment
fn fragmentMain(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  return textureSample(uTexture, uTextureSampler, inputs.uv);
}
`;

export const COLOR_SAMPLE_VS_GLSL = /* glsl */ `#version 300 es
uniform appUniforms {
  vec4 rect;
  vec4 uvTransform;
  vec4 options;
} app;

const vec2 POSITIONS[6] = vec2[6](
  vec2(-0.5, -0.5),
  vec2(0.5, -0.5),
  vec2(-0.5, 0.5),
  vec2(-0.5, 0.5),
  vec2(0.5, -0.5),
  vec2(0.5, 0.5)
);

out vec2 vUV;

void main(void) {
  vec2 localPosition = POSITIONS[gl_VertexID];
  vec2 normalizedUv = localPosition + vec2(0.5);
  float effectiveScale = app.uvTransform.x / max(app.options.y, 0.05);
  vUV = (normalizedUv - vec2(0.5)) * effectiveScale + vec2(0.5) + app.uvTransform.zw;
  float perspective = app.options.x > 0.5
    ? mix(1.0, 1.0 + app.options.z * 5.0, normalizedUv.y)
    : 1.0;
  vec2 screenPosition = app.rect.xy + localPosition * app.rect.zw;
  gl_Position = vec4(screenPosition * perspective, 0.0, perspective);
}
`;

export const COLOR_SAMPLE_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uTexture;

in vec2 vUV;
out vec4 fragColor;

void main(void) {
  fragColor = texture(uTexture, vUV);
}
`;

export const DEPTH_WRITE_WGSL = /* wgsl */ `
struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutputs {
  let positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(1.0, 1.0)
  );
  let position = positions[vertexIndex];
  var outputs: VertexOutputs;
  outputs.uv = position * 0.5 + vec2<f32>(0.5);
  outputs.position = vec4<f32>(position, 0.1 + outputs.uv.x * 0.8, 1.0);
  return outputs;
}

@fragment
fn fragmentMain(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  return vec4<f32>(inputs.uv.x, inputs.uv.y, 0.2, 1.0);
}
`;

export const DEPTH_WRITE_VS_GLSL = /* glsl */ `#version 300 es
const vec2 POSITIONS[6] = vec2[6](
  vec2(-1.0, -1.0),
  vec2(1.0, -1.0),
  vec2(-1.0, 1.0),
  vec2(-1.0, 1.0),
  vec2(1.0, -1.0),
  vec2(1.0, 1.0)
);

out vec2 vUV;

void main(void) {
  vec2 position = POSITIONS[gl_VertexID];
  vUV = position * 0.5 + vec2(0.5);
  gl_Position = vec4(position, vUV.x * 1.6 - 0.8, 1.0);
}
`;

export const DEPTH_WRITE_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUV;
out vec4 fragColor;

void main(void) {
  fragColor = vec4(vUV, 0.2, 1.0);
}
`;

export const COMPARISON_SAMPLE_WGSL = /* wgsl */ `
struct AppUniforms {
  rect: vec4<f32>,
  uvTransform: vec4<f32>,
  options: vec4<f32>,
};

@group(0) @binding(auto) var<uniform> app: AppUniforms;
@group(0) @binding(auto) var uDepthTexture: texture_depth_2d;
@group(0) @binding(auto) var uDepthTextureSampler: sampler_comparison;

struct VertexOutputs {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutputs {
  let localPositions = array<vec2<f32>, 6>(
    vec2<f32>(-0.5, -0.5),
    vec2<f32>(0.5, -0.5),
    vec2<f32>(-0.5, 0.5),
    vec2<f32>(-0.5, 0.5),
    vec2<f32>(0.5, -0.5),
    vec2<f32>(0.5, 0.5)
  );
  let localPosition = localPositions[vertexIndex];
  let normalizedUv = localPosition + vec2<f32>(0.5);
  let effectiveScale = app.uvTransform.x / max(app.options.y, 0.05);
  let transformedUv = (normalizedUv - vec2<f32>(0.5)) * effectiveScale +
    vec2<f32>(0.5) + app.uvTransform.zw;
  let perspective = select(
    1.0,
    mix(1.0, 1.0 + app.options.z * 5.0, normalizedUv.y),
    app.options.x > 0.5
  );
  let screenPosition = app.rect.xy + localPosition * app.rect.zw;
  var outputs: VertexOutputs;
  outputs.position = vec4<f32>(screenPosition * perspective, 0.0, perspective);
  outputs.uv = transformedUv;
  return outputs;
}

@fragment
fn fragmentMain(inputs: VertexOutputs) -> @location(0) vec4<f32> {
  let comparison = textureSampleCompare(
    uDepthTexture,
    uDepthTextureSampler,
    inputs.uv,
    app.options.w
  );
  let failColor = vec3<f32>(0.08, 0.12, 0.24);
  let passColor = vec3<f32>(0.95, 0.58, 0.16);
  return vec4<f32>(mix(failColor, passColor, comparison), 1.0);
}
`;

export const COMPARISON_SAMPLE_VS_GLSL = COLOR_SAMPLE_VS_GLSL;

export const COMPARISON_SAMPLE_FS_GLSL = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2DShadow;

uniform sampler2DShadow uDepthTexture;
uniform appUniforms {
  vec4 rect;
  vec4 uvTransform;
  vec4 options;
} app;

in vec2 vUV;
out vec4 fragColor;

void main(void) {
  float comparison = texture(uDepthTexture, vec3(vUV, app.options.w));
  vec3 failColor = vec3(0.08, 0.12, 0.24);
  vec3 passColor = vec3(0.95, 0.58, 0.16);
  fragColor = vec4(mix(failColor, passColor, comparison), 1.0);
}
`;
