// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer, Texture} from '@luma.gl/core';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
import type {NumberArray3, NumberArray16} from '@math.gl/core';
import {depthAwareBlur} from './depth-aware-blur';

/** Construction options for clustered participating-media integration. */
export type ClusteredVolumetricLightingShaderPassPipelineOptions = {
  /** Fractional integration, history, and denoising resolution. Defaults to 0.4. */
  resolutionScale?: number;
};

type ClusteredVolumetricTraceUniforms = {
  projectionMatrix: Readonly<NumberArray16>;
  inverseProjectionMatrix: Readonly<NumberArray16>;
  inverseViewMatrix: Readonly<NumberArray16>;
  directionalLightDirectionView: Readonly<NumberArray3>;
  directionalLightColor: Readonly<NumberArray3>;
  fogColor: Readonly<NumberArray3>;
  density: number;
  heightFalloff: number;
  fogHeight: number;
  anisotropy: number;
  directionalIntensity: number;
  pointLightIntensity: number;
  maxDistance: number;
  sampleCount: number;
  shadowStrength: number;
  clusterCountX: number;
  clusterCountY: number;
  clusterCountZ: number;
  maxLightsPerCluster: number;
  pointLightCount: number;
  clusterNearPlane: number;
  clusterFarPlane: number;
};

type ClusteredVolumetricTemporalUniforms = {
  inverseProjectionMatrix: Readonly<NumberArray16>;
  historyWeight: number;
  depthThreshold: number;
};

type ClusteredVolumetricCompositeUniforms = {
  strength: number;
  debugMode: number;
};

type ClusteredVolumetricTraceBindings = {
  depthTexture?: Texture;
  pointLights?: Buffer;
  clusterLightCounts?: Buffer;
  clusterLightIndices?: Buffer;
};

type ClusteredVolumetricTemporalBindings = {
  depthTexture?: Texture;
  velocityTexture?: Texture;
  historyTexture?: Texture;
  previousDepthTexture?: Texture;
};

const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** Integrates real clustered point lights and occluded directional light through height fog. */
export const clusteredVolumetricTrace = {
  name: 'clusteredVolumetricTrace',
  source: /* wgsl */ `\
const CLUSTERED_VOLUMETRIC_PI: f32 = 3.141592653589793;
const CLUSTERED_VOLUMETRIC_MAX_STEPS: u32 = 20u;
const CLUSTERED_VOLUMETRIC_MAX_LIGHTS: u32 = 10u;

struct ClusteredVolumetricTraceUniforms {
  projectionMatrix: mat4x4f,
  inverseProjectionMatrix: mat4x4f,
  inverseViewMatrix: mat4x4f,
  directionalLightDirectionView: vec3f,
  directionalLightColor: vec3f,
  fogColor: vec3f,
  density: f32,
  heightFalloff: f32,
  fogHeight: f32,
  anisotropy: f32,
  directionalIntensity: f32,
  pointLightIntensity: f32,
  maxDistance: f32,
  sampleCount: f32,
  shadowStrength: f32,
  clusterCountX: u32,
  clusterCountY: u32,
  clusterCountZ: u32,
  maxLightsPerCluster: u32,
  pointLightCount: u32,
  clusterNearPlane: f32,
  clusterFarPlane: f32,
};

struct ClusteredVolumetricPointLight {
  positionRange: vec4f,
  colorIntensity: vec4f,
};

@group(0) @binding(auto) var<uniform> clusteredVolumetricTrace:
  ClusteredVolumetricTraceUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var<storage, read> pointLights:
  array<ClusteredVolumetricPointLight>;
@group(0) @binding(auto) var<storage, read> clusterLightCounts: array<u32>;
@group(0) @binding(auto) var<storage, read> clusterLightIndices: array<u32>;

fn clusteredVolumetricTrace_reconstructViewPosition(texCoord: vec2f, depth: f32) -> vec3f {
  let clip = vec4f(texCoord.x * 2.0 - 1.0, 1.0 - texCoord.y * 2.0, depth, 1.0);
  let viewPosition = clusteredVolumetricTrace.inverseProjectionMatrix * clip;
  return viewPosition.xyz / max(abs(viewPosition.w), 0.00001);
}

fn clusteredVolumetricTrace_projectViewPosition(viewPosition: vec3f) -> vec2f {
  let clip = clusteredVolumetricTrace.projectionMatrix * vec4f(viewPosition, 1.0);
  let normalizedDeviceCoordinate = clip.xy / max(clip.w, 0.00001);
  return normalizedDeviceCoordinate * vec2f(0.5, -0.5) + vec2f(0.5);
}

fn clusteredVolumetricTrace_phase(cosine: f32, anisotropy: f32) -> f32 {
  let squaredAnisotropy = anisotropy * anisotropy;
  let denominator = max(1.0 + squaredAnisotropy - 2.0 * anisotropy * cosine, 0.02);
  return (1.0 - squaredAnisotropy) /
    (4.0 * CLUSTERED_VOLUMETRIC_PI * pow(denominator, 1.5));
}

fn clusteredVolumetricTrace_clusterIndex(texCoord: vec2f, viewDepth: f32) -> u32 {
  let tileX = min(
    u32(clamp(texCoord.x, 0.0, 0.999999) * f32(clusteredVolumetricTrace.clusterCountX)),
    clusteredVolumetricTrace.clusterCountX - 1u
  );
  let tileY = min(
    u32(clamp(texCoord.y, 0.0, 0.999999) * f32(clusteredVolumetricTrace.clusterCountY)),
    clusteredVolumetricTrace.clusterCountY - 1u
  );
  let normalizedDepth = clamp(
    log(max(viewDepth, clusteredVolumetricTrace.clusterNearPlane) /
      clusteredVolumetricTrace.clusterNearPlane) /
      log(clusteredVolumetricTrace.clusterFarPlane /
        clusteredVolumetricTrace.clusterNearPlane),
    0.0,
    0.999999
  );
  let tileZ = min(
    u32(normalizedDepth * f32(clusteredVolumetricTrace.clusterCountZ)),
    clusteredVolumetricTrace.clusterCountZ - 1u
  );
  return tileX + clusteredVolumetricTrace.clusterCountX *
    (tileY + clusteredVolumetricTrace.clusterCountY * tileZ);
}

fn clusteredVolumetricTrace_directionalVisibility(viewPosition: vec3f) -> f32 {
  let lightDirection = normalize(clusteredVolumetricTrace.directionalLightDirectionView);
  for (var shadowStep: u32 = 1u; shadowStep <= 3u; shadowStep++) {
    let shadowPosition = viewPosition + lightDirection * (0.32 + f32(shadowStep) * 0.95);
    if (shadowPosition.z >= -0.04) {
      return 1.0;
    }
    let shadowCoord = clusteredVolumetricTrace_projectViewPosition(shadowPosition);
    if (any(shadowCoord <= vec2f(0.0)) || any(shadowCoord >= vec2f(1.0))) {
      return 1.0;
    }
    let occluderDepth = textureSampleLevel(depthTexture, depthTextureSampler, shadowCoord, 0);
    if (occluderDepth >= 0.99999) {
      continue;
    }
    let occluderPosition = clusteredVolumetricTrace_reconstructViewPosition(
      shadowCoord,
      occluderDepth
    );
    let depthBehindOccluder = -shadowPosition.z - (-occluderPosition.z);
    if (depthBehindOccluder > 0.06 && depthBehindOccluder < 1.9) {
      return 1.0 - clusteredVolumetricTrace.shadowStrength;
    }
  }
  return 1.0;
}

fn clusteredVolumetricTrace_pointRadiance(
  texCoord: vec2f,
  viewPosition: vec3f,
  viewDirection: vec3f
) -> vec3f {
  let clusterIndex = clusteredVolumetricTrace_clusterIndex(texCoord, -viewPosition.z);
  let clusterCount = clusterLightCounts[clusterIndex];
  let overflowed = clusterCount > clusteredVolumetricTrace.maxLightsPerCluster;
  let candidateCount = select(
    min(clusterCount, CLUSTERED_VOLUMETRIC_MAX_LIGHTS),
    min(clusteredVolumetricTrace.pointLightCount, CLUSTERED_VOLUMETRIC_MAX_LIGHTS),
    overflowed
  );
  let overflowStride = max(
    clusteredVolumetricTrace.pointLightCount / CLUSTERED_VOLUMETRIC_MAX_LIGHTS,
    1u
  );
  var radiance = vec3f(0.0);
  for (var candidateIndex: u32 = 0u;
      candidateIndex < CLUSTERED_VOLUMETRIC_MAX_LIGHTS;
      candidateIndex++) {
    if (candidateIndex >= candidateCount) {
      break;
    }
    let lightIndex = select(
      clusterLightIndices[
        clusterIndex * clusteredVolumetricTrace.maxLightsPerCluster + candidateIndex
      ],
      candidateIndex * overflowStride,
      overflowed
    );
    if (lightIndex >= arrayLength(&pointLights)) {
      continue;
    }
    let light = pointLights[lightIndex];
    let toLight = light.positionRange.xyz - viewPosition;
    let distanceToLight = length(toLight);
    if (distanceToLight >= light.positionRange.w || distanceToLight <= 0.02) {
      continue;
    }
    let lightDirection = toLight / distanceToLight;
    let rangeFade = pow(1.0 - distanceToLight / light.positionRange.w, 2.0);
    let attenuation = rangeFade / (1.0 + distanceToLight * distanceToLight * 0.1);
    let phase = clusteredVolumetricTrace_phase(
      dot(-viewDirection, lightDirection),
      clusteredVolumetricTrace.anisotropy * 0.65
    );
    radiance += light.colorIntensity.rgb * light.colorIntensity.a *
      attenuation * phase * clusteredVolumetricTrace.pointLightIntensity;
  }
  return radiance;
}

fn clusteredVolumetricTrace_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  if (clusteredVolumetricTrace.density <= 0.0001) {
    return vec4f(0.0, 0.0, 0.0, 1.0);
  }
  let sceneDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  let farPosition = clusteredVolumetricTrace_reconstructViewPosition(texCoord, 0.9999);
  let viewDirection = normalize(farPosition);
  let scenePosition = clusteredVolumetricTrace_reconstructViewPosition(texCoord, sceneDepth);
  let rayDistance = select(
    min(length(scenePosition), clusteredVolumetricTrace.maxDistance),
    clusteredVolumetricTrace.maxDistance,
    sceneDepth >= 0.99999
  );
  let stepCount = clamp(u32(clusteredVolumetricTrace.sampleCount), 3u,
    CLUSTERED_VOLUMETRIC_MAX_STEPS);
  let stepDistance = rayDistance / f32(stepCount);
  let pixelCoordinate = floor(texCoord * texSize);
  let rayJitter = fract(sin(dot(pixelCoordinate, vec2f(12.9898, 78.233))) * 43758.5453);
  let directionalPhase = clusteredVolumetricTrace_phase(
    dot(-viewDirection, normalize(clusteredVolumetricTrace.directionalLightDirectionView)),
    clusteredVolumetricTrace.anisotropy
  );

  var opticalDepth = 0.0;
  var scattering = vec3f(0.0);
  for (var stepIndex: u32 = 0u; stepIndex < CLUSTERED_VOLUMETRIC_MAX_STEPS; stepIndex++) {
    if (stepIndex >= stepCount) {
      break;
    }
    let travel = (f32(stepIndex) + 0.28 + rayJitter * 0.52) * stepDistance;
    let viewPosition = viewDirection * travel;
    let worldPosition =
      (clusteredVolumetricTrace.inverseViewMatrix * vec4f(viewPosition, 1.0)).xyz;
    let localDensity = clusteredVolumetricTrace.density * exp(
      -max(worldPosition.y - clusteredVolumetricTrace.fogHeight, 0.0) *
        clusteredVolumetricTrace.heightFalloff
    );
    let extinction = localDensity * stepDistance;
    opticalDepth += extinction;
    let directionalVisibility = clusteredVolumetricTrace_directionalVisibility(viewPosition);
    let directionalRadiance = clusteredVolumetricTrace.directionalLightColor *
      clusteredVolumetricTrace.directionalIntensity * directionalPhase *
      directionalVisibility;
    let localRadiance = clusteredVolumetricTrace_pointRadiance(
      texCoord,
      viewPosition,
      viewDirection
    );
    let incomingRadiance = clusteredVolumetricTrace.fogColor * 0.11 +
      directionalRadiance + localRadiance;
    scattering += incomingRadiance * extinction * exp(-opticalDepth);
  }

  return vec4f(scattering, clamp(exp(-opticalDepth), 0.0, 1.0));
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'pointLights', group: 0},
    {name: 'clusterLightCounts', group: 0},
    {name: 'clusterLightIndices', group: 0}
  ],
  props: {} as Partial<ClusteredVolumetricTraceUniforms> & ClusteredVolumetricTraceBindings,
  uniforms: {} as ClusteredVolumetricTraceUniforms,
  bindings: {} as ClusteredVolumetricTraceBindings,
  uniformTypes: {
    projectionMatrix: 'mat4x4<f32>',
    inverseProjectionMatrix: 'mat4x4<f32>',
    inverseViewMatrix: 'mat4x4<f32>',
    directionalLightDirectionView: 'vec3<f32>',
    directionalLightColor: 'vec3<f32>',
    fogColor: 'vec3<f32>',
    density: 'f32',
    heightFalloff: 'f32',
    fogHeight: 'f32',
    anisotropy: 'f32',
    directionalIntensity: 'f32',
    pointLightIntensity: 'f32',
    maxDistance: 'f32',
    sampleCount: 'f32',
    shadowStrength: 'f32',
    clusterCountX: 'u32',
    clusterCountY: 'u32',
    clusterCountZ: 'u32',
    maxLightsPerCluster: 'u32',
    pointLightCount: 'u32',
    clusterNearPlane: 'f32',
    clusterFarPlane: 'f32'
  },
  propTypes: {
    projectionMatrix: {value: IDENTITY_MATRIX, private: true},
    inverseProjectionMatrix: {value: IDENTITY_MATRIX, private: true},
    inverseViewMatrix: {value: IDENTITY_MATRIX, private: true},
    directionalLightDirectionView: {value: [0.35, 0.82, 0.38], private: true},
    directionalLightColor: {value: [1, 0.85, 0.66], private: true},
    fogColor: {value: [0.18, 0.3, 0.48]},
    density: {value: 0.055, min: 0, softMax: 0.22},
    heightFalloff: {value: 0.23, min: 0, softMax: 2},
    fogHeight: {value: 0.2, min: -5, softMax: 5},
    anisotropy: {value: 0.45, min: -0.8, max: 0.85},
    directionalIntensity: {value: 2.2, min: 0, softMax: 8},
    pointLightIntensity: {value: 1.8, min: 0, softMax: 6},
    maxDistance: {value: 28, min: 1, softMax: 80},
    sampleCount: {value: 10, min: 3, max: 20},
    shadowStrength: {value: 0.74, min: 0, max: 1},
    clusterCountX: {value: 1, private: true},
    clusterCountY: {value: 1, private: true},
    clusterCountZ: {value: 1, private: true},
    maxLightsPerCluster: {value: 1, private: true},
    pointLightCount: {value: 0, private: true},
    clusterNearPlane: {value: 0.1, private: true},
    clusterFarPlane: {value: 100, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<ClusteredVolumetricTraceUniforms> & ClusteredVolumetricTraceBindings,
  ClusteredVolumetricTraceUniforms,
  ClusteredVolumetricTraceBindings
>;

/** Reprojects participating-media radiance and rejects invalid linear-depth history. */
export const clusteredVolumetricTemporal = {
  name: 'clusteredVolumetricTemporal',
  source: /* wgsl */ `\
struct ClusteredVolumetricTemporalUniforms {
  inverseProjectionMatrix: mat4x4f,
  historyWeight: f32,
  depthThreshold: f32,
};

@group(0) @binding(auto) var<uniform> clusteredVolumetricTemporal:
  ClusteredVolumetricTemporalUniforms;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var historyTextureSampler: sampler;
@group(0) @binding(auto) var velocityTexture: texture_2d<f32>;
@group(0) @binding(auto) var velocityTextureSampler: sampler;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var previousDepthTexture: texture_2d<f32>;
@group(0) @binding(auto) var previousDepthTextureSampler: sampler;

fn clusteredVolumetricTemporal_viewDepth(texCoord: vec2f, depth: f32) -> f32 {
  let clip = vec4f(texCoord.x * 2.0 - 1.0, 1.0 - texCoord.y * 2.0, depth, 1.0);
  let viewPosition = clusteredVolumetricTemporal.inverseProjectionMatrix * clip;
  return abs(viewPosition.z / max(abs(viewPosition.w), 0.00001));
}

fn clusteredVolumetricTemporal_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let current = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let currentDepth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  let velocity = textureSampleLevel(velocityTexture, velocityTextureSampler, texCoord, 0).xy;
  let previousCoord = texCoord - velocity;
  let validCoordinate = all(previousCoord >= vec2f(0.0)) &&
    all(previousCoord <= vec2f(1.0));
  let clampedPreviousCoord = clamp(previousCoord, vec2f(0.0), vec2f(1.0));
  let previousDepth = textureSampleLevel(
    previousDepthTexture,
    previousDepthTextureSampler,
    clampedPreviousCoord,
    0
  ).r;
  let currentViewDepth = clusteredVolumetricTemporal_viewDepth(texCoord, currentDepth);
  let previousViewDepth = clusteredVolumetricTemporal_viewDepth(
    clampedPreviousCoord,
    previousDepth
  );
  let relativeDepthDifference = abs(previousViewDepth - currentViewDepth) /
    max(currentViewDepth, 0.0001);
  let validDepth = relativeDepthDifference < clusteredVolumetricTemporal.depthThreshold;

  let texel = 1.0 / vec2f(textureDimensions(sourceTexture));
  var minimumScattering = current;
  var maximumScattering = current;
  for (var sampleY: i32 = -1; sampleY <= 1; sampleY++) {
    for (var sampleX: i32 = -1; sampleX <= 1; sampleX++) {
      let sampleCoord = clamp(
        texCoord + vec2f(f32(sampleX), f32(sampleY)) * texel,
        vec2f(0.0),
        vec2f(1.0)
      );
      let sampleScattering = textureSampleLevel(
        sourceTexture,
        sourceTextureSampler,
        sampleCoord,
        0
      );
      minimumScattering = min(minimumScattering, sampleScattering);
      maximumScattering = max(maximumScattering, sampleScattering);
    }
  }

  let history = clamp(
    textureSampleLevel(historyTexture, historyTextureSampler, clampedPreviousCoord, 0),
    minimumScattering,
    maximumScattering
  );
  let weight = select(
    0.0,
    clusteredVolumetricTemporal.historyWeight,
    validCoordinate && validDepth
  );
  return mix(current, history, weight);
}`,
  bindingLayout: [
    {name: 'historyTexture', group: 0},
    {name: 'velocityTexture', group: 0},
    {name: 'depthTexture', group: 0},
    {name: 'previousDepthTexture', group: 0}
  ],
  props: {} as Partial<ClusteredVolumetricTemporalUniforms> & ClusteredVolumetricTemporalBindings,
  uniforms: {} as ClusteredVolumetricTemporalUniforms,
  bindings: {} as ClusteredVolumetricTemporalBindings,
  uniformTypes: {
    inverseProjectionMatrix: 'mat4x4<f32>',
    historyWeight: 'f32',
    depthThreshold: 'f32'
  },
  propTypes: {
    inverseProjectionMatrix: {value: IDENTITY_MATRIX, private: true},
    historyWeight: {value: 0.88, min: 0, max: 0.97},
    depthThreshold: {value: 0.035, min: 0.0001, softMax: 0.2}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<ClusteredVolumetricTemporalUniforms> & ClusteredVolumetricTemporalBindings,
  ClusteredVolumetricTemporalUniforms,
  ClusteredVolumetricTemporalBindings
>;

/** Captures current scene depth for atmospheric temporal disocclusion rejection. */
export const clusteredVolumetricDepthHistoryCopy = {
  name: 'clusteredVolumetricDepthHistoryCopy',
  source: /* wgsl */ `\
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;

fn clusteredVolumetricDepthHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, texCoord, 0);
  return vec4f(depth, 0.0, 0.0, 1.0);
}`,
  bindingLayout: [{name: 'depthTexture', group: 0}],
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

/** Applies atmospheric extinction and in-scattering, or exposes direct volume diagnostics. */
export const clusteredVolumetricComposite = {
  name: 'clusteredVolumetricComposite',
  source: /* wgsl */ `\
struct ClusteredVolumetricCompositeUniforms {
  strength: f32,
  debugMode: f32,
};

@group(0) @binding(auto) var<uniform> clusteredVolumetricComposite:
  ClusteredVolumetricCompositeUniforms;
@group(0) @binding(auto) var scatteringTexture: texture_2d<f32>;
@group(0) @binding(auto) var scatteringTextureSampler: sampler;

fn clusteredVolumetricComposite_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let source = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let scattering = textureSampleLevel(scatteringTexture, scatteringTextureSampler, texCoord, 0);
  if (clusteredVolumetricComposite.debugMode > 1.5) {
    return vec4f(vec3f(clamp(scattering.a, 0.0, 1.0)), 1.0);
  }
  if (clusteredVolumetricComposite.debugMode > 0.5) {
    return vec4f(scattering.rgb * 2.4, 1.0);
  }
  let strength = clamp(clusteredVolumetricComposite.strength, 0.0, 2.0);
  let transmittance = mix(1.0, clamp(scattering.a, 0.0, 1.0), min(strength, 1.0));
  return vec4f(source.rgb * transmittance + scattering.rgb * strength, source.a);
}`,
  bindingLayout: [{name: 'scatteringTexture', group: 0}],
  props: {} as Partial<ClusteredVolumetricCompositeUniforms>,
  uniforms: {} as ClusteredVolumetricCompositeUniforms,
  uniformTypes: {strength: 'f32', debugMode: 'f32'},
  propTypes: {
    strength: {value: 0.9, min: 0, softMax: 2},
    debugMode: {value: 0, min: 0, max: 2, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<ClusteredVolumetricCompositeUniforms>,
  ClusteredVolumetricCompositeUniforms
>;

/** Creates clustered participating-media integration, temporal stabilization, and composition. */
export function createClusteredVolumetricLightingShaderPassPipeline(
  options: ClusteredVolumetricLightingShaderPassPipelineOptions = {}
): ShaderPassPipeline<
  | 'clusteredVolumeRaw'
  | 'clusteredVolumeHistory'
  | 'clusteredVolumeDepthHistory'
  | 'clusteredVolumeScratch'
  | 'clusteredVolumeScattering'
> {
  const scale = options.resolutionScale || 0.4;
  return {
    name: 'clusteredVolumetricLightingShaderPassPipeline',
    renderTargets: {
      clusteredVolumeRaw: {scale: [scale, scale], format: 'rgba16float'},
      clusteredVolumeHistory: {
        scale: [scale, scale],
        format: 'rgba16float',
        lifetime: 'history',
        initialize: {clearColor: [0, 0, 0, 1]}
      },
      clusteredVolumeDepthHistory: {
        scale: [scale, scale],
        format: 'rgba16float',
        lifetime: 'history',
        initialize: {clearColor: [1, 0, 0, 1]}
      },
      clusteredVolumeScratch: {scale: [scale, scale], format: 'rgba16float'},
      clusteredVolumeScattering: {scale: [scale, scale], format: 'rgba16float'}
    },
    steps: [
      {
        shaderPass: clusteredVolumetricTrace,
        inputs: {sourceTexture: 'previous'},
        output: 'clusteredVolumeRaw'
      },
      {
        shaderPass: clusteredVolumetricTemporal,
        inputs: {
          sourceTexture: 'clusteredVolumeRaw',
          historyTexture: 'clusteredVolumeHistory',
          previousDepthTexture: 'clusteredVolumeDepthHistory'
        },
        output: 'clusteredVolumeHistory'
      },
      {
        shaderPass: clusteredVolumetricDepthHistoryCopy,
        inputs: {sourceTexture: 'previous'},
        output: 'clusteredVolumeDepthHistory'
      },
      {
        shaderPass: depthAwareBlur,
        inputs: {sourceTexture: 'clusteredVolumeHistory'},
        output: 'clusteredVolumeScratch',
        uniforms: {direction: [1, 0], radius: 3, spatialSigma: 2.2, depthSigma: 0.018}
      },
      {
        shaderPass: depthAwareBlur,
        inputs: {sourceTexture: 'clusteredVolumeScratch'},
        output: 'clusteredVolumeScattering',
        uniforms: {direction: [0, 1], radius: 3, spatialSigma: 2.2, depthSigma: 0.018}
      },
      {
        shaderPass: clusteredVolumetricComposite,
        inputs: {sourceTexture: 'previous', scatteringTexture: 'clusteredVolumeScattering'},
        output: 'previous'
      }
    ]
  };
}
