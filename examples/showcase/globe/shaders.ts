// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderModule} from '@luma.gl/shadertools';
import type {Matrix4} from '@math.gl/core';

export type GlobeSceneUniforms = {
  viewProjectionMatrix: Matrix4;
  modelMatrix: Matrix4;
  normalMatrix: Matrix4;
  cameraPosition: [number, number, number];
  showLandTexture: number;
  oceanReflectionStrength: number;
};

export type SkyboxSceneUniforms = {
  modelMatrix: Matrix4;
  viewMatrix: Matrix4;
  projectionMatrix: Matrix4;
  hdrStarsEnabled: number;
};

export const SKYBOX_SHADER_WGSL = /* wgsl */ `\
struct SkyboxSceneUniforms {
  modelMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
  hdrStarsEnabled: i32,
};

@group(0) @binding(auto) var<uniform> skyboxScene : SkyboxSceneUniforms;
@group(0) @binding(auto) var cubeTexture : texture_cube<f32>;
@group(0) @binding(auto) var cubeTextureSampler : sampler;

struct VertexInputs {
  @location(0) positions : vec3<f32>,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) direction : vec3<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  outputs.position =
    skyboxScene.projectionMatrix *
    skyboxScene.viewMatrix *
    skyboxScene.modelMatrix *
    vec4<f32>(inputs.positions, 1.0);
  outputs.direction = inputs.positions;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let skyColor = textureSample(cubeTexture, cubeTextureSampler, normalize(inputs.direction)).rgb;
  let starPeak = max(max(skyColor.r, skyColor.g), skyColor.b);
  let hdrStarGain = 1.0 + smoothstep(0.1, 0.45, starPeak) * 5.0;
  let starGain = select(1.0, hdrStarGain, skyboxScene.hdrStarsEnabled != 0);
  return vec4<f32>(skyColor * starGain, 1.0);
}
`;

export const SKYBOX_SHADER_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec3 positions;

out vec3 vDirection;

uniform skyboxSceneUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  int hdrStarsEnabled;
} skyboxScene;

void main(void) {
  gl_Position =
    skyboxScene.projectionMatrix *
    skyboxScene.viewMatrix *
    skyboxScene.modelMatrix *
    vec4(positions, 1.0);
  vDirection = positions;
}
`;

export const SKYBOX_FRAGMENT_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec3 vDirection;

uniform samplerCube cubeTexture;
uniform skyboxSceneUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  int hdrStarsEnabled;
} skyboxScene;

out vec4 fragColor;

void main(void) {
  vec3 skyColor = texture(cubeTexture, normalize(vDirection)).rgb;
  float starPeak = max(max(skyColor.r, skyColor.g), skyColor.b);
  float hdrStarGain = 1.0 + smoothstep(0.1, 0.45, starPeak) * 5.0;
  float starGain = skyboxScene.hdrStarsEnabled != 0 ? hdrStarGain : 1.0;
  fragColor = vec4(skyColor * starGain, 1.0);
}
`;

export const LAND_SHADER_WGSL = /* wgsl */ `\
struct GlobeSceneUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  cameraPosition: vec3<f32>,
  showLandTexture: i32,
  oceanReflectionStrength: f32,
};

@group(0) @binding(auto) var<uniform> globeScene : GlobeSceneUniforms;
@group(0) @binding(auto) var landTexture: texture_2d<f32>;
@group(0) @binding(auto) var landTextureSampler: sampler;
@group(0) @binding(auto) var landMaskTexture: texture_2d<f32>;
@group(0) @binding(auto) var landMaskTextureSampler: sampler;

struct VertexInputs {
  @location(0) positions : vec3<f32>,
  @location(1) normals : vec3<f32>,
  @location(2) texCoords : vec2<f32>,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition : vec3<f32>,
  @location(2) fragNormal : vec3<f32>,
  @location(3) fragLocalNormal : vec3<f32>,
  @location(4) fragLocalPosition : vec3<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let worldPosition = globeScene.modelMatrix * vec4<f32>(inputs.positions, 1.0);

  outputs.position = globeScene.viewProjectionMatrix * worldPosition;
  outputs.fragUV = inputs.texCoords;
  outputs.fragPosition = worldPosition.xyz;
  outputs.fragNormal = normalize((globeScene.normalMatrix * vec4<f32>(inputs.normals, 0.0)).xyz);
  outputs.fragLocalNormal = normalize(inputs.normals);
  outputs.fragLocalPosition = inputs.positions;

  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let surfaceUV = vec2<f32>(inputs.fragUV.x, 1.0 - inputs.fragUV.y);
  let landSample = textureSample(landTexture, landTextureSampler, surfaceUV).rgb;
  let landMaskSample = textureSample(landMaskTexture, landMaskTextureSampler, surfaceUV).r;
  let landMask = smoothstep(0.4, 0.6, landMaskSample);
  let textureMix = select(0.0, 1.0, globeScene.showLandTexture != 0);
  var baseColor = mix(vec3<f32>(0.74, 0.72, 0.66), landSample, textureMix);
  let normalizedNormal = normalize(inputs.fragNormal);
  let polarNormal = normalize(inputs.fragLocalNormal);
  let latitudeMask = smoothstep(0.45, 0.72, abs(polarNormal.y));
  let southPolarMask = smoothstep(0.58, 0.82, -polarNormal.y);
  let landLuminance = dot(landSample, vec3<f32>(0.2126, 0.7152, 0.0722));
  let brightIceMask = latitudeMask * smoothstep(0.68, 0.9, landLuminance);
  let iceMask = textureMix * landMask * max(brightIceMask, southPolarMask);
  baseColor = mix(baseColor, vec3<f32>(0.95, 0.97, 1.0), iceMask);
  var litColor = lighting_getLightColor2(
    baseColor,
    globeScene.cameraPosition,
    inputs.fragPosition,
    normalizedNormal
  );
  var sunVisibility = 1.0;
  let viewDirection = normalize(globeScene.cameraPosition - inputs.fragPosition);
  let iceRim = pow(1.0 - max(dot(viewDirection, normalizedNormal), 0.0), 6.0);
  var iceHighlight = vec3<f32>(0.0, 0.0, 0.0);

  if (lighting.directionalLightCount > 0) {
    let directionalLight = lighting_getDirectionalLight(0);
    let lightDirection = normalize(-directionalLight.direction);
    sunVisibility = smoothstep(-0.22, 0.28, dot(normalizedNormal, lightDirection));
    let halfVector = normalize(lightDirection + viewDirection);
    let directionalSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 96.0);
    iceHighlight += directionalLight.color * directionalSpecular * 1.6;
  }

  if (lighting.pointLightCount > 0) {
    let pointLight = lighting_getPointLight(0);
    let lightDirection = normalize(pointLight.position - inputs.fragPosition);
    let halfVector = normalize(lightDirection + viewDirection);
    let directionalSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 96.0);
    iceHighlight += pointLight.color * directionalSpecular * 0.8;
  }

  litColor += vec3<f32>(0.9, 0.96, 1.0) * iceMask * (iceRim * 0.55) + iceHighlight * iceMask;
  litColor *= mix(0.22, 1.0, sunVisibility);
  return vec4<f32>(litColor, 1.0);
}
`;

export const WATER_SHADER_WGSL = /* wgsl */ `\
struct GlobeSceneUniforms {
  viewProjectionMatrix: mat4x4<f32>,
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  cameraPosition: vec3<f32>,
  showLandTexture: i32,
  oceanReflectionStrength: f32,
};

@group(0) @binding(auto) var<uniform> globeScene : GlobeSceneUniforms;
@group(0) @binding(auto) var waterMaskTexture: texture_2d<f32>;
@group(0) @binding(auto) var waterMaskTextureSampler: sampler;

struct VertexInputs {
  @location(0) positions : vec3<f32>,
  @location(1) normals : vec3<f32>,
  @location(2) texCoords : vec2<f32>,
};

struct FragmentInputs {
  @builtin(position) position : vec4<f32>,
  @location(0) fragUV : vec2<f32>,
  @location(1) fragPosition : vec3<f32>,
  @location(2) fragNormal : vec3<f32>,
  @location(3) fragLocalNormal : vec3<f32>,
  @location(4) fragLocalPosition : vec3<f32>,
};

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  let worldPosition = globeScene.modelMatrix * vec4<f32>(inputs.positions, 1.0);

  outputs.position = globeScene.viewProjectionMatrix * worldPosition;
  outputs.fragUV = inputs.texCoords;
  outputs.fragPosition = worldPosition.xyz;
  outputs.fragNormal = normalize((globeScene.normalMatrix * vec4<f32>(inputs.normals, 0.0)).xyz);
  outputs.fragLocalNormal = normalize(inputs.normals);
  outputs.fragLocalPosition = inputs.positions;

  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let surfaceUV = vec2<f32>(inputs.fragUV.x, 1.0 - inputs.fragUV.y);
  let landMask = textureSample(waterMaskTexture, waterMaskTextureSampler, surfaceUV).r;
  let oceanMask = smoothstep(0.4, 0.6, 1.0 - landMask);
  let normalizedNormal = normalize(inputs.fragNormal);
  let polarNormal = normalize(inputs.fragLocalNormal);
  let polarIceMask = oceanMask * smoothstep(0.8, 0.92, abs(polarNormal.y));
  let openWaterMask = max(oceanMask - polarIceMask, 0.0);
  let waterColor = water_getColorMapped(
    globeScene.cameraPosition,
    inputs.fragPosition,
    inputs.fragLocalPosition,
    normalizedNormal,
    surfaceUV
  );
  let waterLuminance = dot(waterColor.rgb, vec3<f32>(0.2126, 0.7152, 0.0722));
  let waterReflectionGain =
    1.0 + smoothstep(0.6, 0.95, waterLuminance) * globeScene.oceanReflectionStrength;
  let oceanColor = waterColor.rgb * waterReflectionGain;
  var sunVisibility = 1.0;
  let viewDirection = normalize(globeScene.cameraPosition - inputs.fragPosition);
  let iceRim = pow(1.0 - max(dot(viewDirection, normalizedNormal), 0.0), 5.0);
  var iceHighlight = vec3<f32>(0.0, 0.0, 0.0);

  if (lighting.directionalLightCount > 0) {
    let directionalLight = lighting_getDirectionalLight(0);
    let lightDirection = normalize(-directionalLight.direction);
    sunVisibility = smoothstep(-0.22, 0.28, dot(normalizedNormal, lightDirection));
    let halfVector = normalize(lightDirection + viewDirection);
    let iceSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 88.0);
    iceHighlight += directionalLight.color * iceSpecular * 1.55;
  }

  if (lighting.pointLightCount > 0) {
    let pointLight = lighting_getPointLight(0);
    let lightDirection = normalize(pointLight.position - inputs.fragPosition);
    let halfVector = normalize(lightDirection + viewDirection);
    let iceSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 88.0);
    iceHighlight += pointLight.color * iceSpecular * 0.8;
  }

  let iceColor = vec3<f32>(0.95, 0.98, 1.0) + vec3<f32>(0.85, 0.92, 1.0) * iceRim * 0.28 + iceHighlight;
  let finalColor =
    (oceanColor * openWaterMask + iceColor * polarIceMask) *
    mix(0.18, 1.0, sunVisibility);
  let finalAlpha = waterColor.a * openWaterMask + 0.96 * polarIceMask;
  return vec4<f32>(finalColor, finalAlpha);
}
`;

export const GLOBE_SHADER_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec3 positions;
in vec3 normals;
in vec2 texCoords;

out vec2 vUV;
out vec3 vPosition;
out vec3 vNormal;
out vec3 vLocalNormal;
out vec3 vLocalPosition;

uniform globeSceneUniforms {
  mat4 viewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 cameraPosition;
  int showLandTexture;
  float oceanReflectionStrength;
} globeScene;

void main(void) {
  vec4 worldPosition = globeScene.modelMatrix * vec4(positions, 1.0);
  gl_Position = globeScene.viewProjectionMatrix * worldPosition;
  vUV = texCoords;
  vPosition = worldPosition.xyz;
  vNormal = normalize((globeScene.normalMatrix * vec4(normals, 0.0)).xyz);
  vLocalNormal = normalize(normals);
  vLocalPosition = positions;
}
`;

export const LAND_FRAGMENT_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec2 vUV;
in vec3 vPosition;
in vec3 vNormal;
in vec3 vLocalNormal;

uniform sampler2D landTexture;
uniform sampler2D landMaskTexture;

uniform globeSceneUniforms {
  mat4 viewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 cameraPosition;
  int showLandTexture;
  float oceanReflectionStrength;
} globeScene;

out vec4 fragColor;

void main(void) {
  vec2 surfaceUV = vec2(vUV.x, 1.0 - vUV.y);
  vec3 landSample = texture(landTexture, surfaceUV).rgb;
  float landMaskSample = texture(landMaskTexture, surfaceUV).r;
  float landMask = smoothstep(0.4, 0.6, landMaskSample);
  float textureMix = globeScene.showLandTexture != 0 ? 1.0 : 0.0;
  vec3 baseColor = mix(vec3(0.74, 0.72, 0.66), landSample, textureMix);
  vec3 normalizedNormal = normalize(vNormal);
  vec3 polarNormal = normalize(vLocalNormal);
  float latitudeMask = smoothstep(0.45, 0.72, abs(polarNormal.y));
  float southPolarMask = smoothstep(0.58, 0.82, -polarNormal.y);
  float landLuminance = dot(landSample, vec3(0.2126, 0.7152, 0.0722));
  float brightIceMask = latitudeMask * smoothstep(0.68, 0.9, landLuminance);
  float iceMask = textureMix * landMask * max(brightIceMask, southPolarMask);
  baseColor = mix(baseColor, vec3(0.95, 0.97, 1.0), iceMask);
  vec3 litColor = lighting_getLightColor(baseColor, globeScene.cameraPosition, vPosition, normalizedNormal);
  float sunVisibility = 1.0;
  vec3 viewDirection = normalize(globeScene.cameraPosition - vPosition);
  float iceRim = pow(1.0 - max(dot(viewDirection, normalizedNormal), 0.0), 6.0);
  vec3 iceHighlight = vec3(0.0);

  if (lighting.directionalLightCount > 0) {
    DirectionalLight directionalLight = lighting_getDirectionalLight(0);
    vec3 lightDirection = normalize(-directionalLight.direction);
    sunVisibility = smoothstep(-0.22, 0.28, dot(normalizedNormal, lightDirection));
    vec3 halfVector = normalize(lightDirection + viewDirection);
    float directionalSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 96.0);
    iceHighlight += directionalLight.color * directionalSpecular * 1.6;
  }

  if (lighting.pointLightCount > 0) {
    PointLight pointLight = lighting_getPointLight(0);
    vec3 lightDirection = normalize(pointLight.position - vPosition);
    vec3 halfVector = normalize(lightDirection + viewDirection);
    float directionalSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 96.0);
    iceHighlight += pointLight.color * directionalSpecular * 0.8;
  }

  litColor += vec3(0.9, 0.96, 1.0) * iceMask * (iceRim * 0.55) + iceHighlight * iceMask;
  litColor *= mix(0.22, 1.0, sunVisibility);
  fragColor = vec4(litColor, 1.0);
}
`;

export const WATER_FRAGMENT_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec2 vUV;
in vec3 vPosition;
in vec3 vNormal;
in vec3 vLocalNormal;
in vec3 vLocalPosition;

uniform sampler2D waterMaskTexture;

uniform globeSceneUniforms {
  mat4 viewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 cameraPosition;
  int showLandTexture;
  float oceanReflectionStrength;
} globeScene;

out vec4 fragColor;

void main(void) {
  vec2 surfaceUV = vec2(vUV.x, 1.0 - vUV.y);
  float landMask = texture(waterMaskTexture, surfaceUV).r;
  float oceanMask = smoothstep(0.4, 0.6, 1.0 - landMask);
  vec3 normalizedNormal = normalize(vNormal);
  vec3 polarNormal = normalize(vLocalNormal);
  float polarIceMask = oceanMask * smoothstep(0.8, 0.92, abs(polarNormal.y));
  float openWaterMask = max(oceanMask - polarIceMask, 0.0);
  vec4 waterColor = water_getColorMapped(
    globeScene.cameraPosition,
    vPosition,
    vLocalPosition,
    normalizedNormal,
    surfaceUV
  );
  float waterLuminance = dot(waterColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float waterReflectionGain =
    1.0 + smoothstep(0.6, 0.95, waterLuminance) * globeScene.oceanReflectionStrength;
  vec3 oceanColor = waterColor.rgb * waterReflectionGain;
  float sunVisibility = 1.0;
  vec3 viewDirection = normalize(globeScene.cameraPosition - vPosition);
  float iceRim = pow(1.0 - max(dot(viewDirection, normalizedNormal), 0.0), 5.0);
  vec3 iceHighlight = vec3(0.0);

  if (lighting.directionalLightCount > 0) {
    DirectionalLight directionalLight = lighting_getDirectionalLight(0);
    vec3 lightDirection = normalize(-directionalLight.direction);
    sunVisibility = smoothstep(-0.22, 0.28, dot(normalizedNormal, lightDirection));
    vec3 halfVector = normalize(lightDirection + viewDirection);
    float iceSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 88.0);
    iceHighlight += directionalLight.color * iceSpecular * 1.55;
  }

  if (lighting.pointLightCount > 0) {
    PointLight pointLight = lighting_getPointLight(0);
    vec3 lightDirection = normalize(pointLight.position - vPosition);
    vec3 halfVector = normalize(lightDirection + viewDirection);
    float iceSpecular = pow(max(dot(normalizedNormal, halfVector), 0.0), 88.0);
    iceHighlight += pointLight.color * iceSpecular * 0.8;
  }

  vec3 iceColor =
    vec3(0.95, 0.98, 1.0) +
    vec3(0.85, 0.92, 1.0) * iceRim * 0.28 +
    iceHighlight;
  vec3 finalColor =
    oceanColor * openWaterMask +
    iceColor * polarIceMask;
  finalColor *= mix(0.18, 1.0, sunVisibility);
  float finalAlpha = waterColor.a * openWaterMask + 0.96 * polarIceMask;
  fragColor = vec4(finalColor, finalAlpha);
}
`;

export const globeScene: ShaderModule<GlobeSceneUniforms, GlobeSceneUniforms> = {
  name: 'globeScene',
  uniformTypes: {
    viewProjectionMatrix: 'mat4x4<f32>',
    modelMatrix: 'mat4x4<f32>',
    normalMatrix: 'mat4x4<f32>',
    cameraPosition: 'vec3<f32>',
    showLandTexture: 'i32',
    oceanReflectionStrength: 'f32'
  }
};

export const skyboxScene: ShaderModule<SkyboxSceneUniforms, SkyboxSceneUniforms> = {
  name: 'skyboxScene',
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>',
    hdrStarsEnabled: 'i32'
  }
};
