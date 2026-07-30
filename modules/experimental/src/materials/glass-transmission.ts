// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderModule, ShaderPlugin} from '@luma.gl/shadertools';
import {glassMaterial} from './glass-material';

/** Optional rasterized volume inputs layered on top of {@link glassMaterial}. */
export type GlassTransmissionProps = {
  /** Dimensions shared by opaque scene color, opaque depth, and glass backfaces. */
  viewportSize?: [number, number];
  /** Near and far perspective clip planes used to recover linear optical thickness. */
  depthRange?: [number, number];
  /** Sampleable depth attachment from the opaque scene pass. */
  sceneDepthTexture?: Texture;
  /** Encoded backface world normals and normalized framebuffer depth. */
  backfaceTexture?: Texture;
  /** Equirectangular studio or HDR environment map. */
  environmentTexture?: Texture;
  /** Multiplier applied to sampled environment reflections. */
  environmentIntensity?: number;
  /** Multiplier applied to the measured front-to-back optical path. */
  thicknessStrength?: number;
  /** Normalized-depth tolerance used to preserve foreground geometry. */
  depthBias?: number;
  /** Strength of nearby opaque-scene reflections sampled from captured scene color. */
  dynamicReflectionStrength?: number;
  /** Strength of an additional environment bounce inside the glass shell. */
  secondaryBounceStrength?: number;
  /** Strength of animated lens distortion on warm-tinted fault surfaces. */
  faultDistortionStrength?: number;
  /** Animation clock used by optional fault-driven surface distortion. */
  time?: number;
};

/** Uniform values consumed by {@link glassTransmission}. */
export type GlassTransmissionUniforms = {
  viewportSize: [number, number];
  depthRange: [number, number];
  environmentIntensity: number;
  thicknessStrength: number;
  depthBias: number;
  dynamicReflectionStrength: number;
  secondaryBounceStrength: number;
  faultDistortionStrength: number;
  time: number;
};

/** Rasterized volume textures consumed by {@link glassTransmission}. */
export type GlassTransmissionBindings = {
  glassSceneDepthTexture?: Texture;
  glassBackfaceTexture?: Texture;
  glassEnvironmentTexture?: Texture;
};

const SHADER_STAGE_FRAGMENT = 0x2;

const GLASS_TRANSMISSION_WGSL = /* wgsl */ `\
struct glassTransmissionUniforms {
  viewportSize: vec2<f32>,
  depthRange: vec2<f32>,
  environmentIntensity: f32,
  thicknessStrength: f32,
  depthBias: f32,
  dynamicReflectionStrength: f32,
  secondaryBounceStrength: f32,
  faultDistortionStrength: f32,
  time: f32,
};

@group(0) @binding(auto) var<uniform> glassTransmission: glassTransmissionUniforms;
@group(0) @binding(auto) var glassSceneDepthTexture: texture_depth_2d;
@group(0) @binding(auto) var glassBackfaceTexture: texture_2d<f32>;
@group(0) @binding(auto) var glassBackfaceTextureSampler: sampler;
@group(0) @binding(auto) var glassEnvironmentTexture: texture_2d<f32>;
@group(0) @binding(auto) var glassEnvironmentTextureSampler: sampler;

fn glassTransmission_linearizeDepth(depth: f32) -> f32 {
  let nearPlane = glassTransmission.depthRange.x;
  let farPlane = glassTransmission.depthRange.y;
  return nearPlane * farPlane /
    max(farPlane - depth * (farPlane - nearPlane), 0.0001);
}

fn glassTransmission_sampleDepth(screenCoordinate: vec2<f32>) -> f32 {
  let pixelCoordinate = vec2<i32>(clamp(
    screenCoordinate * glassTransmission.viewportSize,
    vec2<f32>(0.0),
    glassTransmission.viewportSize - vec2<f32>(1.0)
  ));
  return textureLoad(glassSceneDepthTexture, pixelCoordinate, 0);
}

fn glassTransmission_sampleEnvironment(reflectionDirection: vec3<f32>) -> vec3<f32> {
  let normalizedDirection = normalize(reflectionDirection);
  let environmentCoordinate = vec2<f32>(
    atan2(normalizedDirection.z, normalizedDirection.x) * 0.15915494 + 0.5,
    acos(clamp(normalizedDirection.y, -1.0, 1.0)) * 0.31830989
  );
  let blurOffset = vec2<f32>(0.018, 0.011) * glassMaterial.roughness;
  let centered = textureSampleLevel(
    glassEnvironmentTexture,
    glassEnvironmentTextureSampler,
    environmentCoordinate,
    0.0
  ).rgb;
  let forward = textureSampleLevel(
    glassEnvironmentTexture,
    glassEnvironmentTextureSampler,
    environmentCoordinate + blurOffset,
    0.0
  ).rgb;
  let backward = textureSampleLevel(
    glassEnvironmentTexture,
    glassEnvironmentTextureSampler,
    environmentCoordinate - blurOffset,
    0.0
  ).rgb;
  return mix(
    centered,
    (centered + forward + backward) / 3.0,
    smoothstep(0.08, 0.7, glassMaterial.roughness)
  ) * glassTransmission.environmentIntensity;
}

fn glassTransmission_getColor(
  normal: vec3<f32>,
  worldPosition: vec3<f32>,
  baseColor: vec4<f32>,
  cameraPosition: vec3<f32>,
  fragmentPosition: vec4<f32>
) -> vec4<f32> {
  let surfaceColor = glassMaterial_getColor(
    normal,
    worldPosition,
    baseColor,
    cameraPosition,
    fragmentPosition
  );
  let viewDirection = normalize(cameraPosition - worldPosition);
  let frontNormal = opticalLighting_faceNormal(normalize(normal), viewDirection);
  let screenCoordinate = fragmentPosition.xy / glassTransmission.viewportSize;
  let backface = textureSampleLevel(
    glassBackfaceTexture,
    glassBackfaceTextureSampler,
    clamp(screenCoordinate, vec2<f32>(0.001), vec2<f32>(0.999)),
    0.0
  );
  let frontDepth = glassTransmission_linearizeDepth(fragmentPosition.z);
  let backDepth = glassTransmission_linearizeDepth(backface.a);
  let hasBackface = backface.a > fragmentPosition.z + 0.00001;
  let measuredThickness = select(
    glassMaterial.thickness * 0.4,
    clamp(backDepth - frontDepth, 0.04, glassMaterial.thickness * 1.65),
    hasBackface
  ) * glassTransmission.thicknessStrength;
  let backNormal = select(-frontNormal, normalize(backface.rgb * 2.0 - 1.0), hasBackface);
  let entryDirection = refract(
    -viewDirection,
    frontNormal,
    1.0 / max(glassMaterial.indexOfRefraction, 1.001)
  );
  let exitDirection = refract(entryDirection, -backNormal, glassMaterial.indexOfRefraction);
  let hasExitRay = dot(exitDirection, exitDirection) > 0.0001;
  let transmittedDirection = select(reflect(entryDirection, -backNormal), exitDirection, hasExitRay);
  let cameraUpAxis = select(
    vec3<f32>(0.0, 1.0, 0.0),
    vec3<f32>(0.0, 0.0, 1.0),
    abs(viewDirection.y) > 0.96
  );
  let cameraRight = normalize(cross(cameraUpAxis, viewDirection));
  let cameraUp = normalize(cross(viewDirection, cameraRight));
  let viewportAspect = glassTransmission.viewportSize.x /
    max(glassTransmission.viewportSize.y, 1.0);
  let combinedDeflection = (entryDirection + viewDirection) * 0.68 +
    (transmittedDirection + viewDirection) * 0.32;
  let projectedDeflection = vec2<f32>(
    dot(combinedDeflection, cameraRight) / viewportAspect,
    -dot(combinedDeflection, cameraUp)
  );
  let projectedNormal = vec2<f32>(
    dot(frontNormal, cameraRight) / viewportAspect,
    -dot(frontNormal, cameraUp)
  );
  let faultStrength = clamp(
    (baseColor.r - max(baseColor.g, baseColor.b)) * 1.55 - 0.16,
    0.0,
    1.0
  );
  let faultRipple = sin(
    dot(worldPosition.xz, vec2<f32>(11.0, 8.0)) +
      glassTransmission.time * 5.5 + measuredThickness * 12.0
  ) * faultStrength * glassTransmission.faultDistortionStrength;
  let proposedOffset = projectedDeflection * measuredThickness *
    glassMaterial.refractionStrength * 0.18 + projectedNormal * faultRipple * 0.018;
  let proposedCoordinate = clamp(
    screenCoordinate + proposedOffset,
    vec2<f32>(0.001),
    vec2<f32>(0.999)
  );
  let sampledDepth = glassTransmission_sampleDepth(proposedCoordinate);
  let foregroundOcclusion = sampledDepth + glassTransmission.depthBias < fragmentPosition.z;
  let safeOffset = select(proposedOffset, vec2<f32>(0.0), foregroundOcclusion);
  let dispersionOffset = projectedNormal * glassMaterial.dispersion *
    measuredThickness * 0.3;
  let transmittedColor = glassMaterial_sampleTransmission(
    screenCoordinate,
    safeOffset,
    dispersionOffset
  );
  let absorption = exp(-(
    vec3<f32>(0.1, 0.065, 0.032) + (1.0 - baseColor.rgb) * 0.22
  ) * measuredThickness);
  let reflectionDirection = reflect(-viewDirection, frontNormal);
  let environmentReflection = glassTransmission_sampleEnvironment(reflectionDirection);
  let viewAlignment = clamp(dot(frontNormal, viewDirection), 0.0, 1.0);
  let fresnel = opticalLighting_getFresnel(viewAlignment, 0.04, 5.0);
  let internalReflection = glassTransmission_sampleEnvironment(
    reflect(entryDirection, -backNormal)
  ) * select(0.18, 0.42, !hasExitRay);
  let secondaryDirection = reflect(reflect(entryDirection, -backNormal), frontNormal);
  let secondaryReflection = glassTransmission_sampleEnvironment(secondaryDirection) *
    glassTransmission.secondaryBounceStrength * pow(1.0 - viewAlignment, 1.45) * 0.24;
  let reflectionCoordinate = clamp(
    screenCoordinate + projectedNormal * (0.025 + measuredThickness * 0.018),
    vec2<f32>(0.001),
    vec2<f32>(0.999)
  );
  let reflectedSceneColor = textureSampleLevel(
    glassSceneColorTexture,
    glassSceneColorTextureSampler,
    reflectionCoordinate,
    0.0
  ).rgb;
  let reflectedSceneLuminance = dot(reflectedSceneColor, vec3<f32>(0.2126, 0.7152, 0.0722));
  let reflectedSceneResponse = smoothstep(0.045, 0.9, reflectedSceneLuminance);
  let dynamicReflection = reflectedSceneColor * reflectedSceneResponse *
    glassTransmission.dynamicReflectionStrength * (0.045 + fresnel * 0.5);
  let faultFilament = baseColor.rgb * faultStrength *
    glassTransmission.faultDistortionStrength *
    pow(max(sin(dot(worldPosition, vec3<f32>(14.0, 10.0, 17.0)) +
      glassTransmission.time * 7.0), 0.0), 10.0) * 0.12;
  let opticalColor = transmittedColor * absorption * glassMaterial.transmissionStrength +
    environmentReflection * (0.09 + fresnel * 0.65) +
    internalReflection * pow(1.0 - viewAlignment, 2.0) + secondaryReflection +
    dynamicReflection + faultFilament;
  return vec4<f32>(mix(surfaceColor.rgb, opticalColor, 0.64), surfaceColor.a);
}

#ifdef LUMA_OPTICAL_POINT_LIGHTS
fn glassTransmission_getIlluminatedColor(
  normal: vec3<f32>,
  worldPosition: vec3<f32>,
  baseColor: vec4<f32>,
  cameraPosition: vec3<f32>,
  fragmentPosition: vec4<f32>
) -> vec4<f32> {
  let transmittedColor = glassTransmission_getColor(
    normal,
    worldPosition,
    baseColor,
    cameraPosition,
    fragmentPosition
  );
  let pointLightColor = opticalPointLights_getColor(normal, worldPosition, cameraPosition);
  return vec4<f32>(
    transmittedColor.rgb + pointLightColor * glassMaterial.reflectionStrength,
    transmittedColor.a
  );
}
#endif
`;

const GLASS_TRANSMISSION_GLSL = /* glsl */ `\
layout(std140) uniform glassTransmissionUniforms {
  vec2 viewportSize;
  vec2 depthRange;
  float environmentIntensity;
  float thicknessStrength;
  float depthBias;
  float dynamicReflectionStrength;
  float secondaryBounceStrength;
  float faultDistortionStrength;
  float time;
} glassTransmission;

uniform sampler2D glassSceneDepthTexture;
uniform sampler2D glassBackfaceTexture;
uniform sampler2D glassEnvironmentTexture;

float glassTransmission_linearizeDepth(float depth) {
  float nearPlane = glassTransmission.depthRange.x;
  float farPlane = glassTransmission.depthRange.y;
  return nearPlane * farPlane /
    max(farPlane - depth * (farPlane - nearPlane), 0.0001);
}

float glassTransmission_sampleDepth(vec2 screenCoordinate) {
  return texture(
    glassSceneDepthTexture,
    clamp(screenCoordinate, vec2(0.001), vec2(0.999))
  ).r;
}

vec3 glassTransmission_sampleEnvironment(vec3 reflectionDirection) {
  vec3 normalizedDirection = normalize(reflectionDirection);
  vec2 environmentCoordinate = vec2(
    atan(normalizedDirection.z, normalizedDirection.x) * 0.15915494 + 0.5,
    acos(clamp(normalizedDirection.y, -1.0, 1.0)) * 0.31830989
  );
  vec2 blurOffset = vec2(0.018, 0.011) * glassMaterial.roughness;
  vec3 centered = texture(glassEnvironmentTexture, environmentCoordinate).rgb;
  vec3 forward = texture(glassEnvironmentTexture, environmentCoordinate + blurOffset).rgb;
  vec3 backward = texture(glassEnvironmentTexture, environmentCoordinate - blurOffset).rgb;
  return mix(
    centered,
    (centered + forward + backward) / 3.0,
    smoothstep(0.08, 0.7, glassMaterial.roughness)
  ) * glassTransmission.environmentIntensity;
}

vec4 glassTransmission_getColor(
  vec3 normal,
  vec3 worldPosition,
  vec4 baseColor,
  vec3 cameraPosition,
  vec4 fragmentPosition
) {
  vec4 surfaceColor = glassMaterial_getColor(
    normal,
    worldPosition,
    baseColor,
    cameraPosition,
    fragmentPosition
  );
  vec3 viewDirection = normalize(cameraPosition - worldPosition);
  vec3 frontNormal = opticalLighting_faceNormal(normalize(normal), viewDirection);
  vec2 screenCoordinate = fragmentPosition.xy / glassTransmission.viewportSize;
  vec4 backface = texture(
    glassBackfaceTexture,
    clamp(screenCoordinate, vec2(0.001), vec2(0.999))
  );
  float frontDepth = glassTransmission_linearizeDepth(fragmentPosition.z);
  float backDepth = glassTransmission_linearizeDepth(backface.a);
  bool hasBackface = backface.a > fragmentPosition.z + 0.00001;
  float measuredThickness = (
    hasBackface
      ? clamp(backDepth - frontDepth, 0.04, glassMaterial.thickness * 1.65)
      : glassMaterial.thickness * 0.4
  ) * glassTransmission.thicknessStrength;
  vec3 backNormal = hasBackface ? normalize(backface.rgb * 2.0 - 1.0) : -frontNormal;
  vec3 entryDirection = refract(
    -viewDirection,
    frontNormal,
    1.0 / max(glassMaterial.indexOfRefraction, 1.001)
  );
  vec3 exitDirection = refract(entryDirection, -backNormal, glassMaterial.indexOfRefraction);
  bool hasExitRay = dot(exitDirection, exitDirection) > 0.0001;
  vec3 transmittedDirection = hasExitRay
    ? exitDirection
    : reflect(entryDirection, -backNormal);
  vec3 cameraUpAxis = abs(viewDirection.y) > 0.96
    ? vec3(0.0, 0.0, 1.0)
    : vec3(0.0, 1.0, 0.0);
  vec3 cameraRight = normalize(cross(cameraUpAxis, viewDirection));
  vec3 cameraUp = normalize(cross(viewDirection, cameraRight));
  float viewportAspect = glassTransmission.viewportSize.x /
    max(glassTransmission.viewportSize.y, 1.0);
  vec3 combinedDeflection = (entryDirection + viewDirection) * 0.68 +
    (transmittedDirection + viewDirection) * 0.32;
  vec2 projectedDeflection = vec2(
    dot(combinedDeflection, cameraRight) / viewportAspect,
    dot(combinedDeflection, cameraUp)
  );
  vec2 projectedNormal = vec2(
    dot(frontNormal, cameraRight) / viewportAspect,
    dot(frontNormal, cameraUp)
  );
  float faultStrength = clamp(
    (baseColor.r - max(baseColor.g, baseColor.b)) * 1.55 - 0.16,
    0.0,
    1.0
  );
  float faultRipple = sin(
    dot(worldPosition.xz, vec2(11.0, 8.0)) +
      glassTransmission.time * 5.5 + measuredThickness * 12.0
  ) * faultStrength * glassTransmission.faultDistortionStrength;
  vec2 proposedOffset = projectedDeflection * measuredThickness *
    glassMaterial.refractionStrength * 0.18 + projectedNormal * faultRipple * 0.018;
  vec2 proposedCoordinate = clamp(
    screenCoordinate + proposedOffset,
    vec2(0.001),
    vec2(0.999)
  );
  float sampledDepth = glassTransmission_sampleDepth(proposedCoordinate);
  bool foregroundOcclusion = sampledDepth + glassTransmission.depthBias < fragmentPosition.z;
  vec2 safeOffset = foregroundOcclusion ? vec2(0.0) : proposedOffset;
  vec2 dispersionOffset = projectedNormal * glassMaterial.dispersion *
    measuredThickness * 0.3;
  vec3 transmittedColor = glassMaterial_sampleTransmission(
    screenCoordinate,
    safeOffset,
    dispersionOffset
  );
  vec3 absorption = exp(-(
    vec3(0.1, 0.065, 0.032) + (1.0 - baseColor.rgb) * 0.22
  ) * measuredThickness);
  vec3 reflectionDirection = reflect(-viewDirection, frontNormal);
  vec3 environmentReflection = glassTransmission_sampleEnvironment(reflectionDirection);
  float viewAlignment = clamp(dot(frontNormal, viewDirection), 0.0, 1.0);
  float fresnel = opticalLighting_getFresnel(viewAlignment, 0.04, 5.0);
  vec3 internalReflection = glassTransmission_sampleEnvironment(
    reflect(entryDirection, -backNormal)
  ) * (hasExitRay ? 0.18 : 0.42);
  vec3 secondaryDirection = reflect(reflect(entryDirection, -backNormal), frontNormal);
  vec3 secondaryReflection = glassTransmission_sampleEnvironment(secondaryDirection) *
    glassTransmission.secondaryBounceStrength * pow(1.0 - viewAlignment, 1.45) * 0.24;
  vec2 reflectionCoordinate = clamp(
    screenCoordinate + projectedNormal * (0.025 + measuredThickness * 0.018),
    vec2(0.001),
    vec2(0.999)
  );
  vec3 reflectedSceneColor = texture(glassSceneColorTexture, reflectionCoordinate).rgb;
  float reflectedSceneLuminance = dot(reflectedSceneColor, vec3(0.2126, 0.7152, 0.0722));
  float reflectedSceneResponse = smoothstep(0.045, 0.9, reflectedSceneLuminance);
  vec3 dynamicReflection = reflectedSceneColor * reflectedSceneResponse *
    glassTransmission.dynamicReflectionStrength * (0.045 + fresnel * 0.5);
  vec3 faultFilament = baseColor.rgb * faultStrength *
    glassTransmission.faultDistortionStrength *
    pow(max(sin(dot(worldPosition, vec3(14.0, 10.0, 17.0)) +
      glassTransmission.time * 7.0), 0.0), 10.0) * 0.12;
  vec3 opticalColor = transmittedColor * absorption * glassMaterial.transmissionStrength +
    environmentReflection * (0.09 + fresnel * 0.65) +
    internalReflection * pow(1.0 - viewAlignment, 2.0) + secondaryReflection +
    dynamicReflection + faultFilament;
  return vec4(mix(surfaceColor.rgb, opticalColor, 0.64), surfaceColor.a);
}

#ifdef LUMA_OPTICAL_POINT_LIGHTS
vec4 glassTransmission_getIlluminatedColor(
  vec3 normal,
  vec3 worldPosition,
  vec4 baseColor,
  vec3 cameraPosition,
  vec4 fragmentPosition
) {
  vec4 transmittedColor = glassTransmission_getColor(
    normal,
    worldPosition,
    baseColor,
    cameraPosition,
    fragmentPosition
  );
  vec3 pointLightColor = opticalPointLights_getColor(normal, worldPosition, cameraPosition);
  return vec4(
    transmittedColor.rgb + pointLightColor * glassMaterial.reflectionStrength,
    transmittedColor.a
  );
}
#endif
`;

function getGlassTransmissionUniforms(
  props: Partial<GlassTransmissionProps> = {},
  previousUniforms?: GlassTransmissionUniforms
): Partial<GlassTransmissionUniforms & GlassTransmissionBindings> {
  return {
    viewportSize: props.viewportSize ?? previousUniforms?.viewportSize ?? [1, 1],
    depthRange: props.depthRange ?? previousUniforms?.depthRange ?? [0.1, 100],
    environmentIntensity: props.environmentIntensity ?? previousUniforms?.environmentIntensity ?? 1,
    thicknessStrength: props.thicknessStrength ?? previousUniforms?.thicknessStrength ?? 1,
    depthBias: props.depthBias ?? previousUniforms?.depthBias ?? 0.00008,
    dynamicReflectionStrength:
      props.dynamicReflectionStrength ?? previousUniforms?.dynamicReflectionStrength ?? 0,
    secondaryBounceStrength:
      props.secondaryBounceStrength ?? previousUniforms?.secondaryBounceStrength ?? 0,
    faultDistortionStrength:
      props.faultDistortionStrength ?? previousUniforms?.faultDistortionStrength ?? 0,
    time: props.time ?? previousUniforms?.time ?? 0,
    ...(props.sceneDepthTexture ? {glassSceneDepthTexture: props.sceneDepthTexture} : {}),
    ...(props.backfaceTexture ? {glassBackfaceTexture: props.backfaceTexture} : {}),
    ...(props.environmentTexture ? {glassEnvironmentTexture: props.environmentTexture} : {})
  };
}

/** Optional backface-thickness, depth-aware transmission, and environment-map glass extension. */
export const glassTransmission = {
  name: 'glassTransmission',
  source: GLASS_TRANSMISSION_WGSL,
  fs: GLASS_TRANSMISSION_GLSL,
  dependencies: [glassMaterial],
  bindingLayout: [
    {name: 'glassSceneDepthTexture', group: 0, visibility: SHADER_STAGE_FRAGMENT},
    {name: 'glassBackfaceTexture', group: 0, visibility: SHADER_STAGE_FRAGMENT},
    {name: 'glassBackfaceTextureSampler', group: 0, visibility: SHADER_STAGE_FRAGMENT},
    {name: 'glassEnvironmentTexture', group: 0, visibility: SHADER_STAGE_FRAGMENT},
    {name: 'glassEnvironmentTextureSampler', group: 0, visibility: SHADER_STAGE_FRAGMENT}
  ],
  uniformTypes: {
    viewportSize: 'vec2<f32>',
    depthRange: 'vec2<f32>',
    environmentIntensity: 'f32',
    thicknessStrength: 'f32',
    depthBias: 'f32',
    dynamicReflectionStrength: 'f32',
    secondaryBounceStrength: 'f32',
    faultDistortionStrength: 'f32',
    time: 'f32'
  },
  defaultUniforms: {
    viewportSize: [1, 1],
    depthRange: [0.1, 100],
    environmentIntensity: 1,
    thicknessStrength: 1,
    depthBias: 0.00008,
    dynamicReflectionStrength: 0,
    secondaryBounceStrength: 0,
    faultDistortionStrength: 0,
    time: 0
  },
  getUniforms: getGlassTransmissionUniforms
} as const satisfies ShaderModule<
  GlassTransmissionProps,
  GlassTransmissionUniforms,
  GlassTransmissionBindings
>;

/** Installs the optional rasterized transmission extension and its glass-material dependency. */
export const glassTransmissionPlugin = {
  name: 'glassTransmission',
  modules: [glassTransmission as ShaderModule]
} as const satisfies ShaderPlugin;
