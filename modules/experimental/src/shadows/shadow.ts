// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Sampler, Texture} from '@luma.gl/core';
import type {NumberArray3, NumberArray4, NumberArray16} from '@math.gl/core';
import type {ShaderModule} from '@luma.gl/shadertools';
import type {
  DirectionalShadowLight,
  PointShadowLight,
  ShadowShaderProps,
  SpotShadowLight
} from './shadow-map-renderer';

const MAX_CASCADES = 4;
const MAX_SPOT_LIGHTS = 4;
const MAX_POINT_LIGHTS = 4;
const MAX_POINT_MATRICES = 24;

type DirectionalShadowUniform = {
  direction: Readonly<NumberArray3>;
  strength: number;
  normalBias: number;
  sourceAngularRadius: number;
  cascadeBlendFraction: number;
  farFadeFraction: number;
  shadowDistance: number;
};

type SpotShadowUniform = {
  position: Readonly<NumberArray3>;
  range: number;
  direction: Readonly<NumberArray3>;
  outerConeCos: number;
  sourceRadius: number;
  normalBias: number;
  strength: number;
  nearPlane: number;
};

type PointShadowUniform = {
  position: Readonly<NumberArray3>;
  range: number;
  sourceRadius: number;
  normalBias: number;
  strength: number;
  nearPlane: number;
};

type ShadowUniforms = {
  directionalLightCount: number;
  spotLightCount: number;
  pointLightCount: number;
  cascadeCount: number;
  blockerSampleCount: number;
  filterSampleCount: number;
  cascadeSplits: Readonly<NumberArray4>;
  directionalViewProjectionMatrices: readonly Readonly<NumberArray16>[];
  spotViewProjectionMatrices: readonly Readonly<NumberArray16>[];
  pointViewProjectionMatrices: readonly Readonly<NumberArray16>[];
  directionalLights: readonly DirectionalShadowUniform[];
  spotLights: readonly SpotShadowUniform[];
  pointLights: readonly PointShadowUniform[];
};

type ShadowBindings = {
  directionalShadowTexture: Texture;
  spotShadowTexture: Texture;
  pointShadowTexture: Texture;
  shadowComparisonSampler: Sampler;
};

const DIRECTIONAL_LIGHT_UNIFORM_TYPE = {
  direction: 'vec3<f32>',
  strength: 'f32',
  normalBias: 'f32',
  sourceAngularRadius: 'f32',
  cascadeBlendFraction: 'f32',
  farFadeFraction: 'f32',
  shadowDistance: 'f32'
} as const;

const SPOT_LIGHT_UNIFORM_TYPE = {
  position: 'vec3<f32>',
  range: 'f32',
  direction: 'vec3<f32>',
  outerConeCos: 'f32',
  sourceRadius: 'f32',
  normalBias: 'f32',
  strength: 'f32',
  nearPlane: 'f32'
} as const;

const POINT_LIGHT_UNIFORM_TYPE = {
  position: 'vec3<f32>',
  range: 'f32',
  sourceRadius: 'f32',
  normalBias: 'f32',
  strength: 'f32',
  nearPlane: 'f32'
} as const;

const SHADOW_WGSL = /* wgsl */ `\
const SHADOW_PI: f32 = 3.141592653589793;

struct DirectionalShadowLightUniform {
  direction: vec3f,
  strength: f32,
  normalBias: f32,
  sourceAngularRadius: f32,
  cascadeBlendFraction: f32,
  farFadeFraction: f32,
  shadowDistance: f32,
};

struct SpotShadowLightUniform {
  position: vec3f,
  range: f32,
  direction: vec3f,
  outerConeCos: f32,
  sourceRadius: f32,
  normalBias: f32,
  strength: f32,
  nearPlane: f32,
};

struct PointShadowLightUniform {
  position: vec3f,
  range: f32,
  sourceRadius: f32,
  normalBias: f32,
  strength: f32,
  nearPlane: f32,
};

struct ShadowUniforms {
  directionalLightCount: i32,
  spotLightCount: i32,
  pointLightCount: i32,
  cascadeCount: i32,
  blockerSampleCount: i32,
  filterSampleCount: i32,
  cascadeSplits: vec4f,
  directionalViewProjectionMatrices: array<mat4x4f, 4>,
  spotViewProjectionMatrices: array<mat4x4f, 4>,
  pointViewProjectionMatrices: array<mat4x4f, 24>,
  directionalLights: array<DirectionalShadowLightUniform, 1>,
  spotLights: array<SpotShadowLightUniform, 4>,
  pointLights: array<PointShadowLightUniform, 4>,
};

@group(2) @binding(auto) var<uniform> shadow: ShadowUniforms;
@group(2) @binding(auto) var directionalShadowTexture: texture_depth_2d_array;
@group(2) @binding(auto) var spotShadowTexture: texture_depth_2d_array;
@group(2) @binding(auto) var pointShadowTexture: texture_depth_cube_array;
@group(2) @binding(auto) var directionalShadowTextureSampler: sampler;
@group(2) @binding(auto) var shadowComparisonSampler: sampler_comparison;

fn shadow_hash(position: vec3f) -> f32 {
  return fract(sin(dot(position, vec3f(12.9898, 78.233, 37.719))) * 43758.5453);
}

fn shadow_diskSample(index: i32, count: i32, rotation: f32) -> vec2f {
  let fraction = (f32(index) + 0.5) / max(f32(count), 1.0);
  let angle = f32(index) * 2.39996323 + rotation;
  return sqrt(fraction) * vec2f(cos(angle), sin(angle));
}

fn shadow_project(matrix: mat4x4f, worldPosition: vec3f) -> vec3f {
  let clip = matrix * vec4f(worldPosition, 1.0);
  let ndc = clip.xyz / max(abs(clip.w), 0.00001);
  return vec3f(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5, ndc.z);
}

fn shadow_validProjection(projected: vec3f) -> bool {
  return all(projected.xy >= vec2f(0.0)) && all(projected.xy <= vec2f(1.0)) &&
    projected.z >= 0.0 && projected.z <= 1.0;
}

fn shadow_directionalCascadeIndex(viewDepth: f32) -> i32 {
  var cascadeIndex = 0;
  for (var index: i32 = 0; index < 4; index++) {
    if (index >= shadow.cascadeCount) { break; }
    cascadeIndex = index;
    if (viewDepth <= shadow.cascadeSplits[index]) { break; }
  }
  return cascadeIndex;
}

fn shadow_getDirectionalCascadeIndex(viewDepth: f32) -> i32 {
  if (shadow.directionalLightCount == 0) { return -1; }
  return shadow_directionalCascadeIndex(viewDepth);
}

fn shadow_directionalPCSS(cascadeIndex: i32, worldPosition: vec3f, viewDepth: f32) -> f32 {
  let projected = shadow_project(shadow.directionalViewProjectionMatrices[cascadeIndex], worldPosition);
  if (!shadow_validProjection(projected)) { return 1.0; }
  let dimensions = vec2f(textureDimensions(directionalShadowTexture));
  let texel = 1.0 / dimensions;
  let light = shadow.directionalLights[0];
  let rotation = shadow_hash(worldPosition) * 2.0 * SHADOW_PI;
  let searchRadius = max(texel.x, light.sourceAngularRadius * viewDepth / max(light.shadowDistance, 0.001));
  var blockerDepth = 0.0;
  var blockerCount = 0.0;
  for (var index: i32 = 0; index < 24; index++) {
    if (index >= shadow.blockerSampleCount) { break; }
    let offset = shadow_diskSample(index, shadow.blockerSampleCount, rotation) * searchRadius;
    let sampleDepth = textureSampleLevel(
      directionalShadowTexture,
      directionalShadowTextureSampler,
      clamp(projected.xy + offset, vec2f(0.0), vec2f(1.0)),
      cascadeIndex,
      0
    );
    if (sampleDepth < projected.z) {
      blockerDepth += sampleDepth;
      blockerCount += 1.0;
    }
  }
  if (blockerCount == 0.0) { return 1.0; }
  let averageBlocker = blockerDepth / blockerCount;
  let penumbra = clamp((projected.z - averageBlocker) / max(abs(averageBlocker), 0.001), 0.0, 1.0);
  let filterRadius = max(texel.x, searchRadius * (1.0 + penumbra * 18.0));
  var visibility = 0.0;
  for (var index: i32 = 0; index < 48; index++) {
    if (index >= shadow.filterSampleCount) { break; }
    let offset = shadow_diskSample(index, shadow.filterSampleCount, rotation) * filterRadius;
    visibility += textureSampleCompareLevel(
      directionalShadowTexture,
      shadowComparisonSampler,
      clamp(projected.xy + offset, vec2f(0.0), vec2f(1.0)),
      cascadeIndex,
      projected.z
    );
  }
  return visibility / max(f32(shadow.filterSampleCount), 1.0);
}

fn shadow_getDirectionalFactor(worldPosition: vec3f, worldNormal: vec3f, viewDepth: f32) -> f32 {
  if (shadow.directionalLightCount == 0 || viewDepth <= 0.0) { return 1.0; }
  let light = shadow.directionalLights[0];
  if (viewDepth >= light.shadowDistance) { return 1.0; }
  let biasedPosition = worldPosition + normalize(worldNormal) * light.normalBias;
  let cascadeIndex = shadow_directionalCascadeIndex(viewDepth);
  var visibility = shadow_directionalPCSS(cascadeIndex, biasedPosition, viewDepth);
  if (cascadeIndex + 1 < shadow.cascadeCount) {
    var cascadeStart = 0.0;
    if (cascadeIndex > 0) { cascadeStart = shadow.cascadeSplits[cascadeIndex - 1]; }
    let cascadeEnd = shadow.cascadeSplits[cascadeIndex];
    let blendWidth = max((cascadeEnd - cascadeStart) * light.cascadeBlendFraction, 0.0001);
    let blend = smoothstep(cascadeEnd - blendWidth, cascadeEnd, viewDepth);
    if (blend > 0.0) {
      visibility = mix(
        visibility,
        shadow_directionalPCSS(cascadeIndex + 1, biasedPosition, viewDepth),
        blend
      );
    }
  }
  let fadeWidth = max(light.shadowDistance * light.farFadeFraction, 0.0001);
  let farFade = smoothstep(light.shadowDistance - fadeWidth, light.shadowDistance, viewDepth);
  visibility = mix(visibility, 1.0, farFade);
  return mix(1.0, visibility, light.strength);
}

fn shadow_spotPCSS(lightIndex: i32, worldPosition: vec3f) -> f32 {
  let projected = shadow_project(shadow.spotViewProjectionMatrices[lightIndex], worldPosition);
  if (!shadow_validProjection(projected)) { return 1.0; }
  let light = shadow.spotLights[lightIndex];
  let dimensions = vec2f(textureDimensions(spotShadowTexture));
  let texel = 1.0 / dimensions;
  let distanceToLight = length(worldPosition - light.position);
  let searchRadius = max(texel.x, light.sourceRadius / max(distanceToLight, 0.001) * 0.5);
  let rotation = shadow_hash(worldPosition) * 2.0 * SHADOW_PI;
  var blockerDepth = 0.0;
  var blockerCount = 0.0;
  for (var index: i32 = 0; index < 24; index++) {
    if (index >= shadow.blockerSampleCount) { break; }
    let offset = shadow_diskSample(index, shadow.blockerSampleCount, rotation) * searchRadius;
    let sampleDepth = textureSampleLevel(
      spotShadowTexture,
      directionalShadowTextureSampler,
      clamp(projected.xy + offset, vec2f(0.0), vec2f(1.0)),
      lightIndex,
      0
    );
    if (sampleDepth < projected.z) { blockerDepth += sampleDepth; blockerCount += 1.0; }
  }
  if (blockerCount == 0.0) { return 1.0; }
  let averageBlocker = blockerDepth / blockerCount;
  let penumbra = clamp((projected.z - averageBlocker) / max(abs(averageBlocker), 0.001), 0.0, 1.0);
  let filterRadius = max(texel.x, searchRadius * (1.0 + penumbra * 16.0));
  var visibility = 0.0;
  for (var index: i32 = 0; index < 48; index++) {
    if (index >= shadow.filterSampleCount) { break; }
    let offset = shadow_diskSample(index, shadow.filterSampleCount, rotation) * filterRadius;
    visibility += textureSampleCompareLevel(
      spotShadowTexture,
      shadowComparisonSampler,
      clamp(projected.xy + offset, vec2f(0.0), vec2f(1.0)),
      lightIndex,
      projected.z
    );
  }
  return visibility / max(f32(shadow.filterSampleCount), 1.0);
}

fn shadow_getSpotFactor(lightIndex: i32, worldPosition: vec3f, worldNormal: vec3f) -> f32 {
  if (lightIndex < 0 || lightIndex >= shadow.spotLightCount) { return 1.0; }
  let light = shadow.spotLights[lightIndex];
  let fromLight = worldPosition - light.position;
  let distanceToLight = length(fromLight);
  let coneCos = dot(normalize(fromLight), normalize(light.direction));
  if (distanceToLight >= light.range || coneCos < light.outerConeCos) { return 1.0; }
  let biasedPosition = worldPosition + normalize(worldNormal) * light.normalBias;
  return mix(1.0, shadow_spotPCSS(lightIndex, biasedPosition), light.strength);
}

fn shadow_pointReferenceDepth(majorDistance: f32, nearPlane: f32, farPlane: f32) -> f32 {
  return (farPlane + nearPlane) / (farPlane - nearPlane) -
    (2.0 * farPlane * nearPlane) / ((farPlane - nearPlane) * majorDistance);
}

fn shadow_pointBasis(direction: vec3f) -> mat2x3f {
  let reference = select(vec3f(0.0, 1.0, 0.0), vec3f(0.0, 0.0, 1.0), abs(direction.y) > 0.99);
  let tangent = normalize(cross(direction, reference));
  return mat2x3f(tangent, normalize(cross(direction, tangent)));
}

fn shadow_getPointFactor(lightIndex: i32, worldPosition: vec3f, worldNormal: vec3f) -> f32 {
  if (lightIndex < 0 || lightIndex >= shadow.pointLightCount) { return 1.0; }
  let light = shadow.pointLights[lightIndex];
  let biasedPosition = worldPosition + normalize(worldNormal) * light.normalBias;
  let fromLight = biasedPosition - light.position;
  let distanceToLight = length(fromLight);
  if (distanceToLight >= light.range || distanceToLight <= light.nearPlane) { return 1.0; }
  let direction = normalize(fromLight);
  let majorDistance = max(max(abs(fromLight.x), abs(fromLight.y)), abs(fromLight.z));
  let referenceDepth = shadow_pointReferenceDepth(majorDistance, light.nearPlane, light.range);
  let searchRadius = light.sourceRadius / max(distanceToLight, 0.001);
  let rotation = shadow_hash(worldPosition) * 2.0 * SHADOW_PI;
  let basis = shadow_pointBasis(direction);
  var blockerDepth = 0.0;
  var blockerCount = 0.0;
  for (var index: i32 = 0; index < 24; index++) {
    if (index >= shadow.blockerSampleCount) { break; }
    let disk = shadow_diskSample(index, shadow.blockerSampleCount, rotation) * searchRadius;
    let sampleDirection = normalize(direction + basis[0] * disk.x + basis[1] * disk.y);
    let sampleDepth = textureSampleLevel(
      pointShadowTexture,
      directionalShadowTextureSampler,
      sampleDirection,
      lightIndex,
      0
    );
    if (sampleDepth < referenceDepth) { blockerDepth += sampleDepth; blockerCount += 1.0; }
  }
  if (blockerCount == 0.0) { return 1.0; }
  let averageBlocker = blockerDepth / blockerCount;
  let penumbra = clamp((referenceDepth - averageBlocker) / max(abs(averageBlocker), 0.001), 0.0, 1.0);
  let filterRadius = searchRadius * (1.0 + penumbra * 12.0);
  var visibility = 0.0;
  for (var index: i32 = 0; index < 48; index++) {
    if (index >= shadow.filterSampleCount) { break; }
    let disk = shadow_diskSample(index, shadow.filterSampleCount, rotation) * filterRadius;
    let sampleDirection = normalize(direction + basis[0] * disk.x + basis[1] * disk.y);
    visibility += textureSampleCompareLevel(
      pointShadowTexture,
      shadowComparisonSampler,
      sampleDirection,
      lightIndex,
      referenceDepth
    );
  }
  visibility /= max(f32(shadow.filterSampleCount), 1.0);
  return mix(1.0, visibility, light.strength);
}
`;

/** WebGPU shadow sampling module. Applications explicitly apply factors to direct-light terms. */
export const shadow = {
  name: 'shadow',
  source: SHADOW_WGSL,
  props: {} as ShadowShaderProps,
  uniforms: {} as ShadowUniforms,
  bindings: {} as ShadowBindings,
  uniformTypes: {
    directionalLightCount: 'i32',
    spotLightCount: 'i32',
    pointLightCount: 'i32',
    cascadeCount: 'i32',
    blockerSampleCount: 'i32',
    filterSampleCount: 'i32',
    cascadeSplits: 'vec4<f32>',
    directionalViewProjectionMatrices: ['mat4x4<f32>', MAX_CASCADES],
    spotViewProjectionMatrices: ['mat4x4<f32>', MAX_SPOT_LIGHTS],
    pointViewProjectionMatrices: ['mat4x4<f32>', MAX_POINT_MATRICES],
    directionalLights: [DIRECTIONAL_LIGHT_UNIFORM_TYPE, 1],
    spotLights: [SPOT_LIGHT_UNIFORM_TYPE, MAX_SPOT_LIGHTS],
    pointLights: [POINT_LIGHT_UNIFORM_TYPE, MAX_POINT_LIGHTS]
  },
  bindingLayout: [
    {name: 'shadow', group: 2},
    {name: 'directionalShadowTexture', group: 2},
    {name: 'spotShadowTexture', group: 2},
    {name: 'pointShadowTexture', group: 2},
    {name: 'shadowComparisonSampler', group: 2}
  ],
  getUniforms(props: Partial<ShadowShaderProps>): Partial<ShadowUniforms & ShadowBindings> {
    if (
      !props.directionalLights ||
      !props.spotLights ||
      !props.pointLights ||
      !props.cascadeSplits ||
      !props.directionalViewProjectionMatrices ||
      !props.spotViewProjectionMatrices ||
      !props.pointViewProjectionMatrices ||
      !props.directionalShadowTexture ||
      !props.spotShadowTexture ||
      !props.pointShadowTexture ||
      !props.nonFilteringSampler ||
      !props.comparisonSampler
    ) {
      return {};
    }
    return {
      directionalLightCount: props.directionalLights.length,
      spotLightCount: props.spotLights.length,
      pointLightCount: props.pointLights.length,
      cascadeCount: props.cascadeCount,
      blockerSampleCount: props.blockerSampleCount,
      filterSampleCount: props.filterSampleCount,
      cascadeSplits: props.cascadeSplits as Readonly<NumberArray4>,
      directionalViewProjectionMatrices:
        props.directionalViewProjectionMatrices as readonly Readonly<NumberArray16>[],
      spotViewProjectionMatrices:
        props.spotViewProjectionMatrices as readonly Readonly<NumberArray16>[],
      pointViewProjectionMatrices:
        props.pointViewProjectionMatrices as readonly Readonly<NumberArray16>[],
      directionalLights: padDirectionalLights(props.directionalLights),
      spotLights: padSpotLights(props.spotLights),
      pointLights: padPointLights(props.pointLights),
      directionalShadowTexture: props.directionalShadowTexture,
      spotShadowTexture: props.spotShadowTexture,
      pointShadowTexture: props.pointShadowTexture,
      shadowComparisonSampler: props.comparisonSampler
    };
  }
} as const satisfies ShaderModule<ShadowShaderProps, ShadowUniforms, ShadowBindings>;

function padDirectionalLights(
  lights: readonly DirectionalShadowLight[]
): DirectionalShadowUniform[] {
  const light = lights[0];
  return [
    light
      ? {
          direction: light.direction,
          strength: light.strength ?? 1,
          normalBias: light.normalBias ?? 0.04,
          sourceAngularRadius: light.sourceAngularRadius ?? 0.00465,
          cascadeBlendFraction: light.cascadeBlendFraction ?? 0.1,
          farFadeFraction: light.farFadeFraction ?? 0.1,
          shadowDistance: light.shadowDistance ?? 1
        }
      : {
          direction: [0, 1, 0],
          strength: 0,
          normalBias: 0,
          sourceAngularRadius: 0,
          cascadeBlendFraction: 0,
          farFadeFraction: 0,
          shadowDistance: 1
        }
  ];
}

function padSpotLights(lights: readonly SpotShadowLight[]): SpotShadowUniform[] {
  return padArray(
    lights.map(light => ({
      position: light.position,
      range: light.range,
      direction: light.direction,
      outerConeCos: Math.cos(light.outerConeAngle),
      sourceRadius: light.sourceRadius ?? 0.2,
      normalBias: light.normalBias ?? 0.025,
      strength: light.strength ?? 1,
      nearPlane: light.nearPlane ?? 0.1
    })),
    MAX_SPOT_LIGHTS,
    {
      position: [0, 0, 0],
      range: 1,
      direction: [0, -1, 0],
      outerConeCos: 1,
      sourceRadius: 0,
      normalBias: 0,
      strength: 0,
      nearPlane: 0.1
    }
  );
}

function padPointLights(lights: readonly PointShadowLight[]): PointShadowUniform[] {
  return padArray(
    lights.map(light => ({
      position: light.position,
      range: light.range,
      sourceRadius: light.sourceRadius ?? 0.2,
      normalBias: light.normalBias ?? 0.025,
      strength: light.strength ?? 1,
      nearPlane: light.nearPlane ?? 0.1
    })),
    MAX_POINT_LIGHTS,
    {
      position: [0, 0, 0],
      range: 1,
      sourceRadius: 0,
      normalBias: 0,
      strength: 0,
      nearPlane: 0.1
    }
  );
}

function padArray<T>(values: readonly T[], length: number, fallback: T): T[] {
  const result = values.slice(0, length);
  while (result.length < length) {
    result.push(fallback);
  }
  return result;
}
