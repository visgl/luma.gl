// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export {
  ClusteredLightGrid,
  MAX_CLUSTERED_POINT_LIGHTS,
  DEFAULT_CLUSTER_DIMENSIONS,
  DEFAULT_MAX_LIGHTS_PER_CLUSTER
} from '@luma.gl/engine/lighting';
export type {
  ClusteredLightGridProps,
  ClusteredLightGridEncodeOptions,
  ClusteredLightGridBindings,
  ClusteredLightGridShaderPassUniforms
} from '@luma.gl/engine/lighting';
import {DEFAULT_CLUSTER_DIMENSIONS, DEFAULT_MAX_LIGHTS_PER_CLUSTER} from '@luma.gl/engine/lighting';
import type {
  ClusteredLightGridBindings,
  ClusteredLightGridShaderPassUniforms
} from '@luma.gl/engine/lighting';
import type {Buffer} from '@luma.gl/core';
import type {NumberArray3, NumberArray16} from '@math.gl/core';
import {clusteredLightGrid, type ShaderPass, type CompositeShaderPass} from '@luma.gl/shaders';

const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

type ClusteredDeferredLightingUniforms = ClusteredLightGridShaderPassUniforms & {
  inverseProjectionMatrix: Readonly<NumberArray16>;
  ambientColor: Readonly<NumberArray3>;
  directionalLightDirectionView: Readonly<NumberArray3>;
  directionalLightColor: Readonly<NumberArray3>;
  directionalLightIntensity: number;
};

type ClusteredDeferredLightingBindings = ClusteredLightGridBindings & {
  depthTexture?: import('@luma.gl/core').Texture;
  normalTexture?: import('@luma.gl/core').Texture;
  baseColorMetallicTexture?: import('@luma.gl/core').Texture;
  emissiveOcclusionTexture?: import('@luma.gl/core').Texture;
  pointLights?: Buffer;
};

/** CPU-side uniforms and resource bindings consumed by clusteredDeferredLighting. */
export type ClusteredDeferredLightingProps = Partial<ClusteredDeferredLightingUniforms> &
  ClusteredDeferredLightingBindings;

/** Fullscreen Cook-Torrance lighting resolve over per-cluster point-light lists. */
export const clusteredDeferredLighting = {
  name: 'clusteredDeferredLighting',
  dependencies: [clusteredLightGrid],
  source: `\
const CLUSTERED_DEFERRED_LIGHTING_PI: f32 = 3.141592653589793;

struct ClusteredDeferredLightingUniforms {
  inverseProjectionMatrix: mat4x4f,
  ambientColor: vec3f,
  directionalLightDirectionView: vec3f,
  directionalLightColor: vec3f,
  directionalLightIntensity: f32,
  clusterCountX: u32,
  clusterCountY: u32,
  clusterCountZ: u32,
  maxLightsPerCluster: u32,
  pointLightCount: u32,
  clusterNearPlane: f32,
  clusterFarPlane: f32,
};

struct ClusteredDeferredPointLight {
  positionRange: vec4f,
  colorIntensity: vec4f,
};

@group(0) @binding(auto) var<uniform> clusteredDeferredLighting: ClusteredDeferredLightingUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;
@group(0) @binding(auto) var baseColorMetallicTexture: texture_2d<f32>;
@group(0) @binding(auto) var baseColorMetallicTextureSampler: sampler;
@group(0) @binding(auto) var emissiveOcclusionTexture: texture_2d<u32>;
@group(0) @binding(auto) var<storage, read> pointLights: array<ClusteredDeferredPointLight>;
@group(0) @binding(auto) var<storage, read> clusterLightCounts: array<u32>;
@group(0) @binding(auto) var<storage, read> clusterLightIndices: array<u32>;

fn clusteredDeferredLighting_reconstructViewPosition(uv: vec2f, depth: f32) -> vec3f {
  let clip = vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, depth, 1.0);
  let viewPosition = clusteredDeferredLighting.inverseProjectionMatrix * clip;
  return viewPosition.xyz / max(viewPosition.w, 0.00001);
}

fn clusteredDeferredLighting_distributionGGX(
  normal: vec3f,
  halfVector: vec3f,
  roughness: f32
) -> f32 {
  let alpha = roughness * roughness;
  let alphaSquared = alpha * alpha;
  let normalDotHalf = max(dot(normal, halfVector), 0.0);
  let normalDotHalfSquared = normalDotHalf * normalDotHalf;
  let denominator = normalDotHalfSquared * (alphaSquared - 1.0) + 1.0;
  return alphaSquared /
    max(CLUSTERED_DEFERRED_LIGHTING_PI * denominator * denominator, 0.0001);
}

fn clusteredDeferredLighting_geometrySchlickGGX(
  normalDotDirection: f32,
  roughness: f32
) -> f32 {
  let radius = roughness + 1.0;
  let k = radius * radius / 8.0;
  return normalDotDirection / max(normalDotDirection * (1.0 - k) + k, 0.0001);
}

fn clusteredDeferredLighting_geometrySmith(
  normal: vec3f,
  viewDirection: vec3f,
  lightDirection: vec3f,
  roughness: f32
) -> f32 {
  let normalDotView = max(dot(normal, viewDirection), 0.0);
  let normalDotLight = max(dot(normal, lightDirection), 0.0);
  return clusteredDeferredLighting_geometrySchlickGGX(normalDotView, roughness) *
    clusteredDeferredLighting_geometrySchlickGGX(normalDotLight, roughness);
}

fn clusteredDeferredLighting_fresnelSchlick(cosine: f32, baseReflectance: vec3f) -> vec3f {
  return baseReflectance + (vec3f(1.0) - baseReflectance) * pow(1.0 - cosine, 5.0);
}

fn clusteredDeferredLighting_evaluateLight(
  normal: vec3f,
  viewDirection: vec3f,
  lightDirection: vec3f,
  radiance: vec3f,
  baseColor: vec3f,
  metallic: f32,
  roughness: f32
) -> vec3f {
  let normalDotLight = max(dot(normal, lightDirection), 0.0);
  if (normalDotLight <= 0.0) {
    return vec3f(0.0);
  }
  let halfVector = normalize(viewDirection + lightDirection);
  let baseReflectance = mix(vec3f(0.04), baseColor, metallic);
  let fresnel = clusteredDeferredLighting_fresnelSchlick(
    max(dot(halfVector, viewDirection), 0.0),
    baseReflectance
  );
  let distribution = clusteredDeferredLighting_distributionGGX(normal, halfVector, roughness);
  let geometry = clusteredDeferredLighting_geometrySmith(
    normal,
    viewDirection,
    lightDirection,
    roughness
  );
  let normalDotView = max(dot(normal, viewDirection), 0.0);
  let specular = distribution * geometry * fresnel /
    max(4.0 * normalDotView * normalDotLight, 0.0001);
  let diffuseWeight = (vec3f(1.0) - fresnel) * (1.0 - metallic);
  let diffuse = diffuseWeight * baseColor / CLUSTERED_DEFERRED_LIGHTING_PI;
  return (diffuse + specular) * radiance * normalDotLight;
}

fn clusteredDeferredLighting_evaluatePointLight(
  light: ClusteredDeferredPointLight,
  viewPosition: vec3f,
  normal: vec3f,
  viewDirection: vec3f,
  baseColor: vec3f,
  metallic: f32,
  roughness: f32
) -> vec3f {
  let toLight = light.positionRange.xyz - viewPosition;
  let distance = length(toLight);
  if (distance >= light.positionRange.w || distance <= 0.0001) {
    return vec3f(0.0);
  }
  let lightDirection = toLight / distance;
  let rangeFade = pow(clamp(1.0 - distance / light.positionRange.w, 0.0, 1.0), 2.0);
  let attenuation = rangeFade / max(1.0, distance * distance * 0.06);
  let radiance = light.colorIntensity.rgb * light.colorIntensity.a * attenuation;
  return clusteredDeferredLighting_evaluateLight(
    normal,
    viewDirection,
    lightDirection,
    radiance,
    baseColor,
    metallic,
    roughness
  );
}

fn clusteredDeferredLighting_getClusterIndex(texCoord: vec2f, viewPosition: vec3f) -> u32 {
  return clusteredLightGrid_getIndex(texCoord, -viewPosition.z,
    vec3u(clusteredDeferredLighting.clusterCountX, clusteredDeferredLighting.clusterCountY, clusteredDeferredLighting.clusterCountZ),
    clusteredDeferredLighting.clusterNearPlane, clusteredDeferredLighting.clusterFarPlane);
}

fn clusteredDeferredLighting_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sceneCoord = texCoord;
  let depth = textureSampleLevel(depthTexture, depthTextureSampler, sceneCoord, 0);
  if (depth >= 0.99999) {
    return textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  }

  let normalRoughness = textureSampleLevel(normalTexture, normalTextureSampler, sceneCoord, 0);
  let normal = normalize(normalRoughness.rgb * 2.0 - 1.0);
  let roughness = clamp(normalRoughness.a, 0.045, 1.0);
  let baseColorMetallic = textureSampleLevel(
    baseColorMetallicTexture,
    baseColorMetallicTextureSampler,
    sceneCoord,
    0
  );
  let baseColor = max(baseColorMetallic.rgb, vec3f(0.0));
  let metallic = clamp(baseColorMetallic.a, 0.0, 1.0);
  let emissiveOcclusionCoordinates = vec2i(
    clamp(sceneCoord * texSize, vec2f(0.0), texSize - vec2f(1.0))
  );
  let emissiveOcclusion = vec4f(
    textureLoad(emissiveOcclusionTexture, emissiveOcclusionCoordinates, 0)
  ) / 255.0;
  let emissive = max(emissiveOcclusion.rgb, vec3f(0.0));
  let occlusion = clamp(emissiveOcclusion.a, 0.0, 1.0);
  let viewPosition = clusteredDeferredLighting_reconstructViewPosition(sceneCoord, depth);
  let viewDirection = normalize(-viewPosition);

  var color = baseColor * clusteredDeferredLighting.ambientColor * occlusion + emissive;
  let directionalLightDirection = normalize(
    clusteredDeferredLighting.directionalLightDirectionView
  );
  color += clusteredDeferredLighting_evaluateLight(
    normal,
    viewDirection,
    directionalLightDirection,
    clusteredDeferredLighting.directionalLightColor *
      clusteredDeferredLighting.directionalLightIntensity,
    baseColor,
    metallic,
    roughness
  );

  let clusterIndex = clusteredDeferredLighting_getClusterIndex(sceneCoord, viewPosition);
  let candidateLightCount = clusterLightCounts[clusterIndex];
  if (candidateLightCount > clusteredDeferredLighting.maxLightsPerCluster) {
    let activePointLightCount = min(
      clusteredDeferredLighting.pointLightCount,
      arrayLength(&pointLights)
    );
    for (var lightIndex = 0u; lightIndex < activePointLightCount; lightIndex++) {
      color += clusteredDeferredLighting_evaluatePointLight(
        pointLights[lightIndex],
        viewPosition,
        normal,
        viewDirection,
        baseColor,
        metallic,
        roughness
      );
    }
  } else {
    let indexOffset = clusterIndex * clusteredDeferredLighting.maxLightsPerCluster;
    for (var clusterLightIndex = 0u; clusterLightIndex < candidateLightCount; clusterLightIndex++) {
      let lightIndex = clusterLightIndices[indexOffset + clusterLightIndex];
      if (lightIndex >= arrayLength(&pointLights)) {
        continue;
      }
      color += clusteredDeferredLighting_evaluatePointLight(
        pointLights[lightIndex],
        viewPosition,
        normal,
        viewDirection,
        baseColor,
        metallic,
        roughness
      );
    }
  }

  return vec4f(color, 1.0);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0},
    {name: 'baseColorMetallicTexture', group: 0},
    {name: 'emissiveOcclusionTexture', group: 0},
    {name: 'pointLights', group: 0},
    {name: 'clusterLightCounts', group: 0},
    {name: 'clusterLightIndices', group: 0}
  ],
  props: {} as ClusteredDeferredLightingProps,
  uniforms: {} as ClusteredDeferredLightingUniforms,
  bindings: {} as ClusteredDeferredLightingBindings,
  uniformTypes: {
    inverseProjectionMatrix: 'mat4x4<f32>',
    ambientColor: 'vec3<f32>',
    directionalLightDirectionView: 'vec3<f32>',
    directionalLightColor: 'vec3<f32>',
    directionalLightIntensity: 'f32',
    clusterCountX: 'u32',
    clusterCountY: 'u32',
    clusterCountZ: 'u32',
    maxLightsPerCluster: 'u32',
    pointLightCount: 'u32',
    clusterNearPlane: 'f32',
    clusterFarPlane: 'f32'
  },
  propTypes: {
    inverseProjectionMatrix: {value: IDENTITY_MATRIX, private: true},
    ambientColor: {value: [0.04, 0.04, 0.05], private: true},
    directionalLightDirectionView: {value: [0.3, 0.75, 0.55], private: true},
    directionalLightColor: {value: [1, 0.95, 0.86], private: true},
    directionalLightIntensity: {value: 2.5, min: 0, softMax: 8},
    clusterCountX: {value: DEFAULT_CLUSTER_DIMENSIONS[0], private: true},
    clusterCountY: {value: DEFAULT_CLUSTER_DIMENSIONS[1], private: true},
    clusterCountZ: {value: DEFAULT_CLUSTER_DIMENSIONS[2], private: true},
    maxLightsPerCluster: {value: DEFAULT_MAX_LIGHTS_PER_CLUSTER, private: true},
    pointLightCount: {value: 0, private: true},
    clusterNearPlane: {value: 0.1, private: true},
    clusterFarPlane: {value: 100, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  ClusteredDeferredLightingProps,
  ClusteredDeferredLightingUniforms,
  ClusteredDeferredLightingBindings
>;

/** Creates a fullscreen clustered deferred-lighting step for the previous color chain. */
export function createClusteredDeferredLightingCompositeShaderPass(): CompositeShaderPass {
  return {
    name: 'clusteredDeferredLightingCompositeShaderPass',
    steps: [
      {
        shaderPass: clusteredDeferredLighting,
        inputs: {sourceTexture: 'previous'},
        output: 'previous'
      }
    ]
  };
}
