// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';

export type PBREnvironmentFilterUniforms = {
  face: number;
  roughness: number;
  mode: number;
  sampleCount: number;
  sourceEncoding: number;
};

export type PBREnvironmentFilterBindings = {
  pbrEnvironmentSource: Texture;
};

export type PBREnvironmentFilterProps = PBREnvironmentFilterUniforms & PBREnvironmentFilterBindings;

const GLSL_UNIFORMS = /* glsl */ `\
layout(std140) uniform pbrEnvironmentFilterUniforms {
  int face;
  float roughness;
  int mode;
  int sampleCount;
  int sourceEncoding;
} pbrEnvironmentFilter;

uniform sampler2D pbrEnvironmentSource;
`;

const WGSL_UNIFORMS = /* wgsl */ `\
struct PBREnvironmentFilterUniforms {
  face: i32,
  roughness: f32,
  mode: i32,
  sampleCount: i32,
  sourceEncoding: i32,
};

@group(0) @binding(auto) var<uniform> pbrEnvironmentFilter: PBREnvironmentFilterUniforms;
@group(0) @binding(auto) var pbrEnvironmentSource: texture_2d<f32>;
@group(0) @binding(auto) var pbrEnvironmentSourceSampler: sampler;
`;

export const pbrEnvironmentFilter = {
  name: 'pbrEnvironmentFilter',
  bindingLayout: [
    {name: 'pbrEnvironmentFilter', group: 0},
    {name: 'pbrEnvironmentSource', group: 0}
  ],
  fs: GLSL_UNIFORMS,
  source: WGSL_UNIFORMS,
  getUniforms: (properties: Partial<PBREnvironmentFilterProps>) => properties,
  uniformTypes: {
    face: 'i32',
    roughness: 'f32',
    mode: 'i32',
    sampleCount: 'i32',
    sourceEncoding: 'i32'
  },
  defaultUniforms: {
    face: 0,
    roughness: 0,
    mode: 0,
    sampleCount: 64,
    sourceEncoding: 0
  }
} as const satisfies ShaderModule<
  PBREnvironmentFilterProps,
  PBREnvironmentFilterUniforms,
  PBREnvironmentFilterBindings
>;

export const PBR_ENVIRONMENT_FRAGMENT_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec2 uv;
out vec4 fragmentColor;

const float ENVIRONMENT_PI = 3.141592653589793;

vec2 getEnvironmentHammersley(uint index, uint sampleCount)
{
  uint reversedBits = (index << 16u) | (index >> 16u);
  reversedBits = ((reversedBits & 0x55555555u) << 1u) |
    ((reversedBits & 0xAAAAAAAAu) >> 1u);
  reversedBits = ((reversedBits & 0x33333333u) << 2u) |
    ((reversedBits & 0xCCCCCCCCu) >> 2u);
  reversedBits = ((reversedBits & 0x0F0F0F0Fu) << 4u) |
    ((reversedBits & 0xF0F0F0F0u) >> 4u);
  reversedBits = ((reversedBits & 0x00FF00FFu) << 8u) |
    ((reversedBits & 0xFF00FF00u) >> 8u);
  return vec2(
    float(index) / float(sampleCount),
    float(reversedBits) * 2.3283064365386963e-10
  );
}

vec3 getEnvironmentFaceDirection(int face, vec2 textureCoordinate)
{
  vec2 coordinate = textureCoordinate * 2.0 - 1.0;
  if (face == 0) return normalize(vec3(1.0, -coordinate.y, -coordinate.x));
  if (face == 1) return normalize(vec3(-1.0, -coordinate.y, coordinate.x));
  if (face == 2) return normalize(vec3(coordinate.x, 1.0, coordinate.y));
  if (face == 3) return normalize(vec3(coordinate.x, -1.0, -coordinate.y));
  if (face == 4) return normalize(vec3(coordinate.x, -coordinate.y, 1.0));
  return normalize(vec3(-coordinate.x, -coordinate.y, -1.0));
}

mat3 getEnvironmentTangentBasis(vec3 normal)
{
  vec3 up = abs(normal.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  vec3 tangent = normalize(cross(up, normal));
  return mat3(tangent, cross(normal, tangent), normal);
}

vec3 sampleEnvironmentDirection(vec3 direction)
{
  vec3 normalizedDirection = normalize(direction);
  vec2 textureCoordinate = vec2(
    atan(normalizedDirection.z, normalizedDirection.x) / (2.0 * ENVIRONMENT_PI) + 0.5,
    acos(clamp(normalizedDirection.y, -1.0, 1.0)) / ENVIRONMENT_PI
  );
  vec3 color = texture(pbrEnvironmentSource, textureCoordinate).rgb;
  if (pbrEnvironmentFilter.sourceEncoding == 1) {
    vec3 lower = color / 12.92;
    vec3 upper = pow((color + 0.055) / 1.055, vec3(2.4));
    color = mix(lower, upper, step(vec3(0.04045), color));
  }
  return color;
}

vec3 importanceSampleEnvironment(vec2 sequence, vec3 normal, float roughness)
{
  float alpha = max(roughness * roughness, 0.0001);
  float azimuth = 2.0 * ENVIRONMENT_PI * sequence.x;
  float cosine = sqrt(
    (1.0 - sequence.y) / max(1.0 + (alpha * alpha - 1.0) * sequence.y, 0.0001)
  );
  float sine = sqrt(max(1.0 - cosine * cosine, 0.0));
  vec3 halfVector = vec3(cos(azimuth) * sine, sin(azimuth) * sine, cosine);
  return normalize(getEnvironmentTangentBasis(normal) * halfVector);
}

float getEnvironmentGeometry(float normalDotDirection, float roughness)
{
  float alpha = roughness * roughness;
  float factor = alpha * 0.5;
  return normalDotDirection / max(normalDotDirection * (1.0 - factor) + factor, 0.0001);
}

vec2 integrateEnvironmentBRDF(vec2 textureCoordinate, int sampleCount)
{
  float normalDotView = max(textureCoordinate.x, 0.001);
  float roughness = 1.0 - textureCoordinate.y;
  vec3 viewDirection = vec3(sqrt(max(1.0 - normalDotView * normalDotView, 0.0)), 0.0, normalDotView);
  vec2 integration = vec2(0.0);

  for (int sampleIndex = 0; sampleIndex < 1024; sampleIndex++) {
    if (sampleIndex >= sampleCount) break;
    vec3 halfVector = importanceSampleEnvironment(
      getEnvironmentHammersley(uint(sampleIndex), uint(sampleCount)),
      vec3(0.0, 0.0, 1.0),
      roughness
    );
    vec3 lightDirection = normalize(2.0 * dot(viewDirection, halfVector) * halfVector - viewDirection);
    float normalDotLight = max(lightDirection.z, 0.0);
    float normalDotHalf = max(halfVector.z, 0.0);
    float viewDotHalf = max(dot(viewDirection, halfVector), 0.0);
    if (normalDotLight > 0.0) {
      float visibility = getEnvironmentGeometry(normalDotView, roughness) *
        getEnvironmentGeometry(normalDotLight, roughness) * viewDotHalf /
        max(normalDotHalf * normalDotView, 0.0001);
      float fresnel = pow(1.0 - viewDotHalf, 5.0);
      integration += vec2(1.0 - fresnel, fresnel) * visibility;
    }
  }
  return integration / float(sampleCount);
}

vec3 integrateEnvironmentDirection(vec3 normal, int sampleCount)
{
  vec3 accumulatedColor = vec3(0.0);
  float accumulatedWeight = 0.0;

  for (int sampleIndex = 0; sampleIndex < 1024; sampleIndex++) {
    if (sampleIndex >= sampleCount) break;
    vec2 sequence = getEnvironmentHammersley(uint(sampleIndex), uint(sampleCount));
    vec3 direction;
    float sampleWeight;

    if (pbrEnvironmentFilter.mode == 1) {
      float azimuth = 2.0 * ENVIRONMENT_PI * sequence.x;
      float cosine = sqrt(1.0 - sequence.y);
      float sine = sqrt(sequence.y);
      direction = normalize(
        getEnvironmentTangentBasis(normal) *
        vec3(cos(azimuth) * sine, sin(azimuth) * sine, cosine)
      );
      sampleWeight = 1.0;
    } else {
      vec3 halfVector = importanceSampleEnvironment(sequence, normal, pbrEnvironmentFilter.roughness);
      direction = normalize(2.0 * dot(normal, halfVector) * halfVector - normal);
      sampleWeight = max(dot(normal, direction), 0.0);
    }

    accumulatedColor += sampleEnvironmentDirection(direction) * sampleWeight;
    accumulatedWeight += sampleWeight;
  }

  return accumulatedColor / max(accumulatedWeight, 0.0001);
}

void main(void)
{
  int sampleCount = max(pbrEnvironmentFilter.sampleCount, 1);
  if (pbrEnvironmentFilter.mode == 2) {
    fragmentColor = vec4(integrateEnvironmentBRDF(uv, sampleCount), 0.0, 1.0);
    return;
  }

  vec3 direction = getEnvironmentFaceDirection(pbrEnvironmentFilter.face, uv);
  fragmentColor = vec4(integrateEnvironmentDirection(direction, sampleCount), 1.0);
}
`;

export const PBR_ENVIRONMENT_FRAGMENT_WGSL = /* wgsl */ `\
const ENVIRONMENT_PI: f32 = 3.141592653589793;

fn getEnvironmentHammersley(index: u32, sampleCount: u32) -> vec2f {
  return vec2f(f32(index) / f32(sampleCount), f32(reverseBits(index)) * 2.3283064365386963e-10);
}

fn getEnvironmentFaceDirection(face: i32, textureCoordinate: vec2f) -> vec3f {
  let coordinate = textureCoordinate * 2.0 - 1.0;
  if (face == 0) { return normalize(vec3f(1.0, -coordinate.y, -coordinate.x)); }
  if (face == 1) { return normalize(vec3f(-1.0, -coordinate.y, coordinate.x)); }
  if (face == 2) { return normalize(vec3f(coordinate.x, 1.0, coordinate.y)); }
  if (face == 3) { return normalize(vec3f(coordinate.x, -1.0, -coordinate.y)); }
  if (face == 4) { return normalize(vec3f(coordinate.x, -coordinate.y, 1.0)); }
  return normalize(vec3f(-coordinate.x, -coordinate.y, -1.0));
}

fn getEnvironmentTangentBasis(normal: vec3f) -> mat3x3f {
  var up = vec3f(1.0, 0.0, 0.0);
  if (abs(normal.z) < 0.999) {
    up = vec3f(0.0, 0.0, 1.0);
  }
  let tangent = normalize(cross(up, normal));
  return mat3x3f(tangent, cross(normal, tangent), normal);
}

fn sampleEnvironmentDirection(direction: vec3f) -> vec3f {
  let normalizedDirection = normalize(direction);
  let textureCoordinate = vec2f(
    atan2(normalizedDirection.z, normalizedDirection.x) / (2.0 * ENVIRONMENT_PI) + 0.5,
    acos(clamp(normalizedDirection.y, -1.0, 1.0)) / ENVIRONMENT_PI
  );
  var color = textureSampleLevel(
    pbrEnvironmentSource,
    pbrEnvironmentSourceSampler,
    textureCoordinate,
    0.0
  ).rgb;
  if (pbrEnvironmentFilter.sourceEncoding == 1) {
    let lower = color / 12.92;
    let upper = pow((color + 0.055) / 1.055, vec3f(2.4));
    color = mix(lower, upper, step(vec3f(0.04045), color));
  }
  return color;
}

fn importanceSampleEnvironment(sequence: vec2f, normal: vec3f, roughness: f32) -> vec3f {
  let alpha = max(roughness * roughness, 0.0001);
  let azimuth = 2.0 * ENVIRONMENT_PI * sequence.x;
  let cosine = sqrt(
    (1.0 - sequence.y) / max(1.0 + (alpha * alpha - 1.0) * sequence.y, 0.0001)
  );
  let sine = sqrt(max(1.0 - cosine * cosine, 0.0));
  let halfVector = vec3f(cos(azimuth) * sine, sin(azimuth) * sine, cosine);
  return normalize(getEnvironmentTangentBasis(normal) * halfVector);
}

fn getEnvironmentGeometry(normalDotDirection: f32, roughness: f32) -> f32 {
  let alpha = roughness * roughness;
  let factor = alpha * 0.5;
  return normalDotDirection / max(normalDotDirection * (1.0 - factor) + factor, 0.0001);
}

fn integrateEnvironmentBRDF(textureCoordinate: vec2f, sampleCount: u32) -> vec2f {
  let normalDotView = max(textureCoordinate.x, 0.001);
  let roughness = 1.0 - textureCoordinate.y;
  let viewDirection = vec3f(
    sqrt(max(1.0 - normalDotView * normalDotView, 0.0)),
    0.0,
    normalDotView
  );
  var integration = vec2f(0.0);

  for (var sampleIndex = 0u; sampleIndex < sampleCount; sampleIndex++) {
    let halfVector = importanceSampleEnvironment(
      getEnvironmentHammersley(sampleIndex, sampleCount),
      vec3f(0.0, 0.0, 1.0),
      roughness
    );
    let lightDirection = normalize(
      2.0 * dot(viewDirection, halfVector) * halfVector - viewDirection
    );
    let normalDotLight = max(lightDirection.z, 0.0);
    let normalDotHalf = max(halfVector.z, 0.0);
    let viewDotHalf = max(dot(viewDirection, halfVector), 0.0);
    if (normalDotLight > 0.0) {
      let visibility = getEnvironmentGeometry(normalDotView, roughness) *
        getEnvironmentGeometry(normalDotLight, roughness) * viewDotHalf /
        max(normalDotHalf * normalDotView, 0.0001);
      let fresnel = pow(1.0 - viewDotHalf, 5.0);
      integration += vec2f(1.0 - fresnel, fresnel) * visibility;
    }
  }
  return integration / f32(sampleCount);
}

fn integrateEnvironmentDirection(normal: vec3f, sampleCount: u32) -> vec3f {
  var accumulatedColor = vec3f(0.0);
  var accumulatedWeight = 0.0;

  for (var sampleIndex = 0u; sampleIndex < sampleCount; sampleIndex++) {
    let sequence = getEnvironmentHammersley(sampleIndex, sampleCount);
    var direction: vec3f;
    var sampleWeight: f32;

    if (pbrEnvironmentFilter.mode == 1) {
      let azimuth = 2.0 * ENVIRONMENT_PI * sequence.x;
      let cosine = sqrt(1.0 - sequence.y);
      let sine = sqrt(sequence.y);
      direction = normalize(
        getEnvironmentTangentBasis(normal) *
        vec3f(cos(azimuth) * sine, sin(azimuth) * sine, cosine)
      );
      sampleWeight = 1.0;
    } else {
      let halfVector = importanceSampleEnvironment(sequence, normal, pbrEnvironmentFilter.roughness);
      direction = normalize(2.0 * dot(normal, halfVector) * halfVector - normal);
      sampleWeight = max(dot(normal, direction), 0.0);
    }

    accumulatedColor += sampleEnvironmentDirection(direction) * sampleWeight;
    accumulatedWeight += sampleWeight;
  }
  return accumulatedColor / max(accumulatedWeight, 0.0001);
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let sampleCount = u32(max(pbrEnvironmentFilter.sampleCount, 1));
  if (pbrEnvironmentFilter.mode == 2) {
    return vec4f(integrateEnvironmentBRDF(inputs.uv, sampleCount), 0.0, 1.0);
  }

  let direction = getEnvironmentFaceDirection(pbrEnvironmentFilter.face, inputs.uv);
  return vec4f(integrateEnvironmentDirection(direction, sampleCount), 1.0);
}
`;
