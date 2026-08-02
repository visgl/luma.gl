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
  /** Multiplier applied to camera-aligned screen-space lens distortion. */
  refractionStrength?: number;
  /** Multiplier applied to environment reflections and specular highlights. */
  reflectionStrength?: number;
  /** Multiplier applied to physically motivated grazing-angle reflection. */
  fresnelStrength?: number;
  /** Strength of the secondary polished surface coating. */
  clearcoatStrength?: number;
  /** Strength of the subtle wavelength-dependent edge interference. */
  iridescenceStrength?: number;
  /** Strength of the curved internal shell reflection. */
  internalReflectionStrength?: number;
  /** Amount of the scene that remains visible through the glass body. */
  transmissionStrength?: number;
};

/** Uniform values consumed by {@link glassMaterial}. */
export type GlassMaterialUniforms = {
  viewportSize: [number, number];
  indexOfRefraction: number;
  roughness: number;
  dispersion: number;
  thickness: number;
  refractionStrength: number;
  reflectionStrength: number;
  fresnelStrength: number;
  clearcoatStrength: number;
  iridescenceStrength: number;
  internalReflectionStrength: number;
  transmissionStrength: number;
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
  refractionStrength: f32,
  reflectionStrength: f32,
  fresnelStrength: f32,
  clearcoatStrength: f32,
  iridescenceStrength: f32,
  internalReflectionStrength: f32,
  transmissionStrength: f32,
};

@group(0) @binding(auto) var<uniform> glassMaterial: GlassMaterialUniforms;
@group(0) @binding(auto) var glassSceneColorTexture: texture_2d<f32>;
@group(0) @binding(auto) var glassSceneColorTextureSampler: sampler;

fn glassMaterial_sampleTransmission(
  screenCoordinate: vec2<f32>,
  refractionOffset: vec2<f32>,
  dispersionOffset: vec2<f32>
) -> vec3<f32> {
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
  return vec3<f32>(refractedRed, refractedGreen, refractedBlue);
}

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
  let fresnel = clamp(
    opticalLighting_getFresnel(viewAlignment, baseReflectance, 5.0) * glassMaterial.fresnelStrength,
    0.0,
    0.98
  );
  let thickness = glassMaterial.thickness * mix(0.18, 1.0, sqrt(viewAlignment));
  let refractionDirection = refract(-viewDirection, normalFacingCamera, 1.0 / indexOfRefraction);
  let screenCoordinate = fragmentPosition.xy / glassMaterial.viewportSize;
  let cameraUpAxis = select(
    vec3<f32>(0.0, 1.0, 0.0),
    vec3<f32>(0.0, 0.0, 1.0),
    abs(viewDirection.y) > 0.96
  );
  let cameraRight = normalize(cross(cameraUpAxis, viewDirection));
  let cameraUp = normalize(cross(viewDirection, cameraRight));
  let viewportAspect = glassMaterial.viewportSize.x / max(glassMaterial.viewportSize.y, 1.0);
  let rayDeflection = refractionDirection + viewDirection;
  let screenDeflection = vec2<f32>(
    dot(rayDeflection, cameraRight) / viewportAspect,
    -dot(rayDeflection, cameraUp)
  );
  let screenNormal = vec2<f32>(
    dot(normalFacingCamera, cameraRight) / viewportAspect,
    -dot(normalFacingCamera, cameraUp)
  );
  let surfaceCurvature = sqrt(max(1.0 - viewAlignment * viewAlignment, 0.0));
  let refractionOffset = screenDeflection * glassMaterial.thickness *
    glassMaterial.refractionStrength * mix(0.085, 0.22, surfaceCurvature);
  let dispersionOffset = screenNormal * glassMaterial.dispersion *
    mix(0.12, 0.48, surfaceCurvature);
  let blurOffset = vec2<f32>(-screenNormal.y, screenNormal.x) *
    glassMaterial.roughness * glassMaterial.thickness * 0.018;
  let centralTransmission = glassMaterial_sampleTransmission(
    screenCoordinate,
    refractionOffset,
    dispersionOffset
  );
  let roughnessBlend = smoothstep(0.04, 0.72, glassMaterial.roughness);
  var softenedTransmission = centralTransmission;
  if (glassMaterial.roughness > 0.16) {
    let blurredForward = textureSampleLevel(
      glassSceneColorTexture,
      glassSceneColorTextureSampler,
      clamp(screenCoordinate + refractionOffset + blurOffset, vec2<f32>(0.001), vec2<f32>(0.999)),
      0.0
    ).rgb;
    let blurredBackward = textureSampleLevel(
      glassSceneColorTexture,
      glassSceneColorTextureSampler,
      clamp(screenCoordinate + refractionOffset - blurOffset, vec2<f32>(0.001), vec2<f32>(0.999)),
      0.0
    ).rgb;
    softenedTransmission = (blurredForward + blurredBackward) * 0.5;
  }
  let absorption = exp(-(vec3<f32>(0.075, 0.045, 0.022) +
    (1.0 - baseColor.rgb) * 0.24) * thickness);
  let transmittedColor = mix(centralTransmission, softenedTransmission, roughnessBlend) *
    absorption * glassMaterial.transmissionStrength;
  let reflectionDirection = reflect(-viewDirection, normalFacingCamera);
  let environmentColor = opticalLighting_sampleEnvironment(
    reflectionDirection,
    vec3<f32>(0.035, 0.065, 0.12),
    vec3<f32>(0.38, 0.57, 0.82),
    0.28
  );
  let keySpecular = opticalLighting_getMicrofacetSpecular(
    normalFacingCamera,
    viewDirection,
    opticalLighting_getKeyLight(),
    glassMaterial.roughness
  );
  let fillSpecular = opticalLighting_getMicrofacetSpecular(
    normalFacingCamera,
    viewDirection,
    opticalLighting_getFillLight(),
    min(glassMaterial.roughness + 0.14, 1.0)
  );
  let clearcoat = opticalLighting_getMicrofacetSpecular(
    normalFacingCamera,
    viewDirection,
    normalize(vec3<f32>(-0.24, 0.92, 0.31)),
    0.075
  ) * glassMaterial.clearcoatStrength;
  let rim = pow(1.0 - viewAlignment, 2.25);
  let innerRim = pow(1.0 - viewAlignment, 2.8) * pow(viewAlignment, 0.35);
  let internalDirection = reflect(refractionDirection, -normalFacingCamera);
  let internalReflection = opticalLighting_sampleEnvironment(
    internalDirection,
    vec3<f32>(0.045, 0.07, 0.12),
    vec3<f32>(0.24, 0.48, 0.78),
    0.42
  ) * innerRim * glassMaterial.internalReflectionStrength;
  let interferencePhase = glassMaterial.thickness * (1.0 - viewAlignment) * 12.0;
  let iridescence = (vec3<f32>(0.5) + vec3<f32>(0.5) * cos(
    vec3<f32>(interferencePhase) + vec3<f32>(0.0, 2.094, 4.189)
  )) * rim * glassMaterial.iridescenceStrength;
  let studioRibbon = pow(
    max(dot(reflectionDirection, normalize(vec3<f32>(-0.3, 0.86, 0.42))), 0.0),
    mix(52.0, 16.0, glassMaterial.roughness)
  );
  let glassBody = baseColor.rgb * (0.045 + viewAlignment * 0.105) +
    environmentColor * viewAlignment * 0.11;
  let reflection = (
    environmentColor * (fresnel + rim * 0.65) + baseColor.rgb * rim * 0.32 +
    vec3<f32>(1.0, 0.96, 0.88) * min(keySpecular, 3.0) * 0.34 +
    vec3<f32>(0.34, 0.66, 1.0) * min(fillSpecular, 2.0) * 0.24 +
    vec3<f32>(1.0, 0.97, 0.9) * min(clearcoat, 3.0) * 0.3 +
    vec3<f32>(0.82, 0.9, 1.0) * studioRibbon * 0.32 +
    internalReflection + iridescence + glassBody
  ) * glassMaterial.reflectionStrength;
  let color = transmittedColor * (1.0 - fresnel) + reflection;
  let transmissionCoverage = mix(
    0.38,
    0.74,
    smoothstep(0.12, 0.95, glassMaterial.refractionStrength)
  );
  let opacity = clamp(
    transmissionCoverage + fresnel * 0.28 + rim * 0.19 +
      min(keySpecular + fillSpecular + clearcoat, 2.0) * 0.07,
    0.2,
    0.98
  );
  return vec4<f32>(color, opacity);
}

#ifdef LUMA_OPTICAL_POINT_LIGHTS
fn glassMaterial_getIlluminatedColor(
  normal: vec3<f32>,
  worldPosition: vec3<f32>,
  baseColor: vec4<f32>,
  cameraPosition: vec3<f32>,
  fragmentPosition: vec4<f32>
) -> vec4<f32> {
  let glassColor = glassMaterial_getColor(
    normal,
    worldPosition,
    baseColor,
    cameraPosition,
    fragmentPosition
  );
  let pointLightColor = opticalPointLights_getSpecularColor(
    normal,
    worldPosition,
    cameraPosition,
    glassMaterial.roughness
  );
  return vec4<f32>(
    glassColor.rgb + pointLightColor * glassMaterial.reflectionStrength,
    glassColor.a
  );
}
#endif
`;

const GLASS_MATERIAL_GLSL = /* glsl */ `\
layout(std140) uniform glassMaterialUniforms {
  vec2 viewportSize;
  float indexOfRefraction;
  float roughness;
  float dispersion;
  float thickness;
  float refractionStrength;
  float reflectionStrength;
  float fresnelStrength;
  float clearcoatStrength;
  float iridescenceStrength;
  float internalReflectionStrength;
  float transmissionStrength;
} glassMaterial;

uniform sampler2D glassSceneColorTexture;

vec3 glassMaterial_sampleTransmission(
  vec2 screenCoordinate,
  vec2 refractionOffset,
  vec2 dispersionOffset
) {
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
  return vec3(refractedRed, refractedGreen, refractedBlue);
}

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
  float fresnel = clamp(
    opticalLighting_getFresnel(viewAlignment, baseReflectance, 5.0) * glassMaterial.fresnelStrength,
    0.0,
    0.98
  );
  float thickness = glassMaterial.thickness * mix(0.18, 1.0, sqrt(viewAlignment));
  vec3 refractionDirection = refract(-viewDirection, normalFacingCamera, 1.0 / indexOfRefraction);
  vec2 screenCoordinate = fragmentPosition.xy / glassMaterial.viewportSize;
  vec3 cameraUpAxis = abs(viewDirection.y) > 0.96
    ? vec3(0.0, 0.0, 1.0)
    : vec3(0.0, 1.0, 0.0);
  vec3 cameraRight = normalize(cross(cameraUpAxis, viewDirection));
  vec3 cameraUp = normalize(cross(viewDirection, cameraRight));
  float viewportAspect = glassMaterial.viewportSize.x / max(glassMaterial.viewportSize.y, 1.0);
  vec3 rayDeflection = refractionDirection + viewDirection;
  vec2 screenDeflection = vec2(
    dot(rayDeflection, cameraRight) / viewportAspect,
    dot(rayDeflection, cameraUp)
  );
  vec2 screenNormal = vec2(
    dot(normalFacingCamera, cameraRight) / viewportAspect,
    dot(normalFacingCamera, cameraUp)
  );
  float surfaceCurvature = sqrt(max(1.0 - viewAlignment * viewAlignment, 0.0));
  vec2 refractionOffset = screenDeflection * glassMaterial.thickness *
    glassMaterial.refractionStrength * mix(0.085, 0.22, surfaceCurvature);
  vec2 dispersionOffset = screenNormal * glassMaterial.dispersion *
    mix(0.12, 0.48, surfaceCurvature);
  vec2 blurOffset = vec2(-screenNormal.y, screenNormal.x) *
    glassMaterial.roughness * glassMaterial.thickness * 0.018;
  vec3 centralTransmission = glassMaterial_sampleTransmission(
    screenCoordinate,
    refractionOffset,
    dispersionOffset
  );
  float roughnessBlend = smoothstep(0.04, 0.72, glassMaterial.roughness);
  vec3 softenedTransmission = centralTransmission;
  if (glassMaterial.roughness > 0.16) {
    vec3 blurredForward = texture(
      glassSceneColorTexture,
      clamp(screenCoordinate + refractionOffset + blurOffset, vec2(0.001), vec2(0.999))
    ).rgb;
    vec3 blurredBackward = texture(
      glassSceneColorTexture,
      clamp(screenCoordinate + refractionOffset - blurOffset, vec2(0.001), vec2(0.999))
    ).rgb;
    softenedTransmission = (blurredForward + blurredBackward) * 0.5;
  }
  vec3 absorption = exp(-(vec3(0.075, 0.045, 0.022) +
    (1.0 - baseColor.rgb) * 0.24) * thickness);
  vec3 transmittedColor = mix(centralTransmission, softenedTransmission, roughnessBlend) *
    absorption * glassMaterial.transmissionStrength;
  vec3 reflectionDirection = reflect(-viewDirection, normalFacingCamera);
  vec3 environmentColor = opticalLighting_sampleEnvironment(
    reflectionDirection,
    vec3(0.035, 0.065, 0.12),
    vec3(0.38, 0.57, 0.82),
    0.28
  );
  float keySpecular = opticalLighting_getMicrofacetSpecular(
    normalFacingCamera,
    viewDirection,
    opticalLighting_getKeyLight(),
    glassMaterial.roughness
  );
  float fillSpecular = opticalLighting_getMicrofacetSpecular(
    normalFacingCamera,
    viewDirection,
    opticalLighting_getFillLight(),
    min(glassMaterial.roughness + 0.14, 1.0)
  );
  float clearcoat = opticalLighting_getMicrofacetSpecular(
    normalFacingCamera,
    viewDirection,
    normalize(vec3(-0.24, 0.92, 0.31)),
    0.075
  ) * glassMaterial.clearcoatStrength;
  float rim = pow(1.0 - viewAlignment, 2.25);
  float innerRim = pow(1.0 - viewAlignment, 2.8) * pow(viewAlignment, 0.35);
  vec3 internalDirection = reflect(refractionDirection, -normalFacingCamera);
  vec3 internalReflection = opticalLighting_sampleEnvironment(
    internalDirection,
    vec3(0.045, 0.07, 0.12),
    vec3(0.24, 0.48, 0.78),
    0.42
  ) * innerRim * glassMaterial.internalReflectionStrength;
  float interferencePhase = glassMaterial.thickness * (1.0 - viewAlignment) * 12.0;
  vec3 iridescence = (vec3(0.5) + vec3(0.5) * cos(
    vec3(interferencePhase) + vec3(0.0, 2.094, 4.189)
  )) * rim * glassMaterial.iridescenceStrength;
  float studioRibbon = pow(
    max(dot(reflectionDirection, normalize(vec3(-0.3, 0.86, 0.42))), 0.0),
    mix(52.0, 16.0, glassMaterial.roughness)
  );
  vec3 glassBody = baseColor.rgb * (0.045 + viewAlignment * 0.105) +
    environmentColor * viewAlignment * 0.11;
  vec3 reflection = (
    environmentColor * (fresnel + rim * 0.65) + baseColor.rgb * rim * 0.32 +
    vec3(1.0, 0.96, 0.88) * min(keySpecular, 3.0) * 0.34 +
    vec3(0.34, 0.66, 1.0) * min(fillSpecular, 2.0) * 0.24 +
    vec3(1.0, 0.97, 0.9) * min(clearcoat, 3.0) * 0.3 +
    vec3(0.82, 0.9, 1.0) * studioRibbon * 0.32 +
    internalReflection + iridescence + glassBody
  ) * glassMaterial.reflectionStrength;
  vec3 color = transmittedColor * (1.0 - fresnel) + reflection;
  float transmissionCoverage = mix(
    0.38,
    0.74,
    smoothstep(0.12, 0.95, glassMaterial.refractionStrength)
  );
  float opacity = clamp(
    transmissionCoverage + fresnel * 0.28 + rim * 0.19 +
      min(keySpecular + fillSpecular + clearcoat, 2.0) * 0.07,
    0.2,
    0.98
  );
  return vec4(color, opacity);
}

#ifdef LUMA_OPTICAL_POINT_LIGHTS
vec3 opticalPointLights_getColor(vec3 normal, vec3 worldPosition, vec3 cameraPosition);
vec3 opticalPointLights_getSpecularColor(
  vec3 normal,
  vec3 worldPosition,
  vec3 cameraPosition,
  float roughness
);

vec4 glassMaterial_getIlluminatedColor(
  vec3 normal,
  vec3 worldPosition,
  vec4 baseColor,
  vec3 cameraPosition,
  vec4 fragmentPosition
) {
  vec4 glassColor = glassMaterial_getColor(
    normal,
    worldPosition,
    baseColor,
    cameraPosition,
    fragmentPosition
  );
  vec3 pointLightColor = opticalPointLights_getSpecularColor(
    normal,
    worldPosition,
    cameraPosition,
    glassMaterial.roughness
  );
  return vec4(
    glassColor.rgb + pointLightColor * glassMaterial.reflectionStrength,
    glassColor.a
  );
}
#endif
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
    refractionStrength: props.refractionStrength ?? previousUniforms?.refractionStrength ?? 1,
    reflectionStrength: props.reflectionStrength ?? previousUniforms?.reflectionStrength ?? 1,
    fresnelStrength: props.fresnelStrength ?? previousUniforms?.fresnelStrength ?? 1,
    clearcoatStrength: props.clearcoatStrength ?? previousUniforms?.clearcoatStrength ?? 0.7,
    iridescenceStrength: props.iridescenceStrength ?? previousUniforms?.iridescenceStrength ?? 0.1,
    internalReflectionStrength:
      props.internalReflectionStrength ?? previousUniforms?.internalReflectionStrength ?? 0.42,
    transmissionStrength: props.transmissionStrength ?? previousUniforms?.transmissionStrength ?? 1,
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
    refractionStrength: 'f32',
    reflectionStrength: 'f32',
    fresnelStrength: 'f32',
    clearcoatStrength: 'f32',
    iridescenceStrength: 'f32',
    internalReflectionStrength: 'f32',
    transmissionStrength: 'f32'
  },
  defaultUniforms: {
    viewportSize: [1, 1],
    indexOfRefraction: 1.48,
    roughness: 0.14,
    dispersion: 0.022,
    thickness: 1.05,
    refractionStrength: 1,
    reflectionStrength: 1,
    fresnelStrength: 1,
    clearcoatStrength: 0.7,
    iridescenceStrength: 0.1,
    internalReflectionStrength: 0.42,
    transmissionStrength: 1
  },
  getUniforms: getGlassMaterialUniforms
} as const satisfies ShaderModule<GlassMaterialProps, GlassMaterialUniforms, GlassMaterialBindings>;

/** Installs the portable glass material and its shared optical-lighting dependency. */
export const glassMaterialPlugin = {
  name: 'glassMaterial',
  modules: [glassMaterial as ShaderModule]
} as const satisfies ShaderPlugin;
