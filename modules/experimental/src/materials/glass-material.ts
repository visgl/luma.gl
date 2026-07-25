// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderModule, ShaderPlugin} from '@luma.gl/shadertools';
import {opticalLighting} from './optical-lighting';

/** Runtime properties for the portable refractive glass shader module. */
export type GlassMaterialProps = {
  /** Size of the rendered scene texture in physical pixels. */
  viewportSize?: [number, number];
  /** Scene color rendered before translucent glass geometry. */
  sceneColorTexture?: Texture;
  /** Optical index of refraction. Ordinary glass is approximately 1.5. */
  indexOfRefraction?: number;
  /** Surface roughness in the inclusive zero-to-one range. */
  roughness?: number;
  /** Separation of red, green, and blue refraction samples. */
  dispersion?: number;
  /** Optical distance used for refraction offset and absorption. */
  thickness?: number;
  /** Multiplier applied to environment reflections and specular highlights. */
  reflectionStrength?: number;
};

/** Uniform values consumed by {@link glassMaterial}. */
export type GlassMaterialUniforms = {
  viewportSize: [number, number];
  indexOfRefraction: number;
  roughness: number;
  dispersion: number;
  thickness: number;
  reflectionStrength: number;
};

/** Texture bindings consumed by {@link glassMaterial}. */
export type GlassMaterialBindings = {
  glassSceneColorTexture?: Texture;
};

const SHADER_STAGE_FRAGMENT = 0x2;

const GLASS_MATERIAL_WGSL = /* wgsl */ `\
struct GlassMaterialUniforms {
  viewportSize: vec2<f32>,
  indexOfRefraction: f32,
  roughness: f32,
  dispersion: f32,
  thickness: f32,
  reflectionStrength: f32,
};

@group(0) @binding(auto) var<uniform> glassMaterial: GlassMaterialUniforms;
@group(0) @binding(auto) var glassSceneColorTexture: texture_2d<f32>;
@group(0) @binding(auto) var glassSceneColorTextureSampler: sampler;

fn glassMaterial_getColor(
  normal: vec3<f32>,
  worldPosition: vec3<f32>,
  baseColor: vec4<f32>,
  cameraPosition: vec3<f32>,
  fragmentPosition: vec4<f32>
) -> vec4<f32> {
  let viewDirection = normalize(cameraPosition - worldPosition);
  let normalFacingCamera = opticalLighting_faceNormal(normalize(normal), viewDirection);
  let viewAlignment = clamp(dot(normalFacingCamera, viewDirection), 0.0, 1.0);
  let indexOfRefraction = max(glassMaterial.indexOfRefraction, 1.001);
  let baseReflectance = pow((indexOfRefraction - 1.0) / (indexOfRefraction + 1.0), 2.0);
  let fresnel = opticalLighting_getFresnel(viewAlignment, baseReflectance, 5.0);
  let thickness = glassMaterial.thickness * (0.32 + pow(1.0 - viewAlignment, 1.8));
  let refractionDirection = refract(-viewDirection, normalFacingCamera, 1.0 / indexOfRefraction);
  let screenCoordinate = fragmentPosition.xy / glassMaterial.viewportSize;
  let refractionOffset = refractionDirection.xy * thickness * 0.085;
  let dispersionOffset = normalFacingCamera.xy * glassMaterial.dispersion * thickness;
  let refractedRed = textureSampleLevel(
    glassSceneColorTexture,
    glassSceneColorTextureSampler,
    clamp(screenCoordinate + refractionOffset + dispersionOffset, vec2<f32>(0.001), vec2<f32>(0.999)),
    0.0
  ).r;
  let refractedGreen = textureSampleLevel(
    glassSceneColorTexture,
    glassSceneColorTextureSampler,
    clamp(screenCoordinate + refractionOffset, vec2<f32>(0.001), vec2<f32>(0.999)),
    0.0
  ).g;
  let refractedBlue = textureSampleLevel(
    glassSceneColorTexture,
    glassSceneColorTextureSampler,
    clamp(screenCoordinate + refractionOffset - dispersionOffset, vec2<f32>(0.001), vec2<f32>(0.999)),
    0.0
  ).b;
  let absorption = exp(-(vec3<f32>(0.11, 0.065, 0.035) + (1.0 - baseColor.rgb) * 0.32) * thickness);
  let transmittedColor = vec3<f32>(refractedRed, refractedGreen, refractedBlue) * absorption;
  let reflectionDirection = reflect(-viewDirection, normalFacingCamera);
  let environmentColor = opticalLighting_sampleEnvironment(
    reflectionDirection,
    vec3<f32>(0.035, 0.065, 0.12),
    vec3<f32>(0.38, 0.57, 0.82),
    0.28
  );
  let keyHalfVector = normalize(opticalLighting_getKeyLight() + viewDirection);
  let fillHalfVector = normalize(opticalLighting_getFillLight() + viewDirection);
  let specularExponent = mix(160.0, 20.0, clamp(glassMaterial.roughness, 0.0, 1.0));
  let keySpecular = pow(max(dot(normalFacingCamera, keyHalfVector), 0.0), specularExponent);
  let fillSpecular = pow(max(dot(normalFacingCamera, fillHalfVector), 0.0), specularExponent * 0.65);
  let rim = pow(1.0 - viewAlignment, 2.2);
  let reflection = (
    environmentColor * (fresnel + rim * 0.42) + baseColor.rgb * rim * 0.28 +
    vec3<f32>(1.0, 0.95, 0.86) * keySpecular * 0.9 +
    vec3<f32>(0.35, 0.62, 1.0) * fillSpecular * 0.45
  ) * glassMaterial.reflectionStrength;
  let color = transmittedColor * (1.0 - fresnel) + reflection;
  let opacity = clamp(
    0.26 + fresnel * 0.58 + rim * 0.22 + (keySpecular + fillSpecular) * 0.24,
    0.16,
    0.9
  );
  return vec4<f32>(color, opacity);
}
`;

const GLASS_MATERIAL_GLSL = /* glsl */ `\
layout(std140) uniform glassMaterialUniforms {
  vec2 viewportSize;
  float indexOfRefraction;
  float roughness;
  float dispersion;
  float thickness;
  float reflectionStrength;
} glassMaterial;

uniform sampler2D glassSceneColorTexture;

vec4 glassMaterial_getColor(
  vec3 normal,
  vec3 worldPosition,
  vec4 baseColor,
  vec3 cameraPosition,
  vec4 fragmentPosition
) {
  vec3 viewDirection = normalize(cameraPosition - worldPosition);
  vec3 normalFacingCamera = opticalLighting_faceNormal(normalize(normal), viewDirection);
  float viewAlignment = clamp(dot(normalFacingCamera, viewDirection), 0.0, 1.0);
  float indexOfRefraction = max(glassMaterial.indexOfRefraction, 1.001);
  float baseReflectance = pow((indexOfRefraction - 1.0) / (indexOfRefraction + 1.0), 2.0);
  float fresnel = opticalLighting_getFresnel(viewAlignment, baseReflectance, 5.0);
  float thickness = glassMaterial.thickness * (0.32 + pow(1.0 - viewAlignment, 1.8));
  vec3 refractionDirection = refract(-viewDirection, normalFacingCamera, 1.0 / indexOfRefraction);
  vec2 screenCoordinate = fragmentPosition.xy / glassMaterial.viewportSize;
  vec2 refractionOffset = refractionDirection.xy * thickness * 0.085;
  vec2 dispersionOffset = normalFacingCamera.xy * glassMaterial.dispersion * thickness;
  float refractedRed = texture(
    glassSceneColorTexture,
    clamp(screenCoordinate + refractionOffset + dispersionOffset, vec2(0.001), vec2(0.999))
  ).r;
  float refractedGreen = texture(
    glassSceneColorTexture,
    clamp(screenCoordinate + refractionOffset, vec2(0.001), vec2(0.999))
  ).g;
  float refractedBlue = texture(
    glassSceneColorTexture,
    clamp(screenCoordinate + refractionOffset - dispersionOffset, vec2(0.001), vec2(0.999))
  ).b;
  vec3 absorption = exp(-(vec3(0.11, 0.065, 0.035) + (1.0 - baseColor.rgb) * 0.32) * thickness);
  vec3 transmittedColor = vec3(refractedRed, refractedGreen, refractedBlue) * absorption;
  vec3 reflectionDirection = reflect(-viewDirection, normalFacingCamera);
  vec3 environmentColor = opticalLighting_sampleEnvironment(
    reflectionDirection,
    vec3(0.035, 0.065, 0.12),
    vec3(0.38, 0.57, 0.82),
    0.28
  );
  vec3 keyHalfVector = normalize(opticalLighting_getKeyLight() + viewDirection);
  vec3 fillHalfVector = normalize(opticalLighting_getFillLight() + viewDirection);
  float specularExponent = mix(160.0, 20.0, clamp(glassMaterial.roughness, 0.0, 1.0));
  float keySpecular = pow(max(dot(normalFacingCamera, keyHalfVector), 0.0), specularExponent);
  float fillSpecular = pow(max(dot(normalFacingCamera, fillHalfVector), 0.0), specularExponent * 0.65);
  float rim = pow(1.0 - viewAlignment, 2.2);
  vec3 reflection = (
    environmentColor * (fresnel + rim * 0.42) + baseColor.rgb * rim * 0.28 +
    vec3(1.0, 0.95, 0.86) * keySpecular * 0.9 +
    vec3(0.35, 0.62, 1.0) * fillSpecular * 0.45
  ) * glassMaterial.reflectionStrength;
  vec3 color = transmittedColor * (1.0 - fresnel) + reflection;
  float opacity = clamp(
    0.26 + fresnel * 0.58 + rim * 0.22 + (keySpecular + fillSpecular) * 0.24,
    0.16,
    0.9
  );
  return vec4(color, opacity);
}
`;

function getGlassMaterialUniforms(
  props: Partial<GlassMaterialProps> = {},
  previousUniforms?: GlassMaterialUniforms
): Partial<GlassMaterialUniforms & GlassMaterialBindings> {
  return {
    viewportSize: props.viewportSize ?? previousUniforms?.viewportSize ?? [1, 1],
    indexOfRefraction: props.indexOfRefraction ?? previousUniforms?.indexOfRefraction ?? 1.48,
    roughness: props.roughness ?? previousUniforms?.roughness ?? 0.14,
    dispersion: props.dispersion ?? previousUniforms?.dispersion ?? 0.022,
    thickness: props.thickness ?? previousUniforms?.thickness ?? 1.05,
    reflectionStrength: props.reflectionStrength ?? previousUniforms?.reflectionStrength ?? 1,
    ...(props.sceneColorTexture ? {glassSceneColorTexture: props.sceneColorTexture} : {})
  };
}

/** Portable refractive glass with Fresnel reflection, dispersion, and Beer-Lambert absorption. */
export const glassMaterial = {
  name: 'glassMaterial',
  source: GLASS_MATERIAL_WGSL,
  fs: GLASS_MATERIAL_GLSL,
  dependencies: [opticalLighting],
  bindingLayout: [
    {name: 'glassSceneColorTexture', group: 0, visibility: SHADER_STAGE_FRAGMENT},
    {name: 'glassSceneColorTextureSampler', group: 0, visibility: SHADER_STAGE_FRAGMENT}
  ],
  uniformTypes: {
    viewportSize: 'vec2<f32>',
    indexOfRefraction: 'f32',
    roughness: 'f32',
    dispersion: 'f32',
    thickness: 'f32',
    reflectionStrength: 'f32'
  },
  defaultUniforms: {
    viewportSize: [1, 1],
    indexOfRefraction: 1.48,
    roughness: 0.14,
    dispersion: 0.022,
    thickness: 1.05,
    reflectionStrength: 1
  },
  getUniforms: getGlassMaterialUniforms
} as const satisfies ShaderModule<GlassMaterialProps, GlassMaterialUniforms, GlassMaterialBindings>;

/** Installs the portable glass material and its shared optical-lighting dependency. */
export const glassMaterialPlugin = {
  name: 'glassMaterial',
  modules: [glassMaterial as ShaderModule]
} as const satisfies ShaderPlugin;
