// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer, Texture} from '@luma.gl/core';
import type {NumberArray3, NumberArray16} from '@math.gl/core';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';

export const MAX_DEFERRED_POINT_LIGHTS = 64;

/** One view-space point light packed into the deferred-lighting storage buffer. */
export type DeferredPointLight = {
  /** View-space light position. */
  position: [number, number, number];
  /** Maximum influence distance in view-space units. */
  range: number;
  /** Linear RGB light color. */
  color: [number, number, number];
  /** Radiant intensity multiplier. */
  intensity: number;
};

type DeferredLightingUniforms = {
  inverseProjectionMatrix: Readonly<NumberArray16>;
  ambientColor: Readonly<NumberArray3>;
  directionalLightDirectionView: Readonly<NumberArray3>;
  directionalLightColor: Readonly<NumberArray3>;
  directionalLightIntensity: number;
  pointLightCount: number;
};

type DeferredLightingBindings = {
  depthTexture?: Texture;
  normalTexture?: Texture;
  baseColorMetallicTexture?: Texture;
  emissiveOcclusionTexture?: Texture;
  pointLights?: Buffer;
};

/** CPU-side uniforms and resource bindings consumed by deferredLighting. */
export type DeferredLightingProps = Partial<DeferredLightingUniforms> & DeferredLightingBindings;

const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/**
 * Packs point lights into the two-vec4 storage record consumed by deferredLighting.
 *
 * Each record stores position.xyz/range followed by color.rgb/intensity. The returned array is
 * padded to maxLightCount so callers can reuse one fixed-size GPU buffer while animating lights.
 */
export function makeDeferredPointLightBufferData(
  lights: readonly DeferredPointLight[],
  maxLightCount: number = MAX_DEFERRED_POINT_LIGHTS
): Float32Array {
  if (!Number.isSafeInteger(maxLightCount) || maxLightCount < 1) {
    throw new Error('maxLightCount must be a positive safe integer.');
  }
  if (lights.length > maxLightCount) {
    throw new Error('Point light count exceeds maxLightCount.');
  }

  const data = new Float32Array(maxLightCount * 8);
  for (let lightIndex = 0; lightIndex < lights.length; lightIndex++) {
    const light = lights[lightIndex]!;
    if (!(light.range > 0) || !(light.intensity >= 0)) {
      throw new Error('Point light range must be positive and intensity must be non-negative.');
    }
    const offset = lightIndex * 8;
    data.set(light.position, offset);
    data[offset + 3] = light.range;
    data.set(light.color, offset + 4);
    data[offset + 7] = light.intensity;
  }
  return data;
}

/** Fullscreen Cook-Torrance lighting resolve over GBuffer material attachments. */
export const deferredLighting = {
  name: 'deferredLighting',
  source: `\
const DEFERRED_LIGHTING_PI: f32 = 3.141592653589793;
const DEFERRED_LIGHTING_MAX_POINT_LIGHTS: u32 = ${MAX_DEFERRED_POINT_LIGHTS}u;

struct DeferredLightingUniforms {
  inverseProjectionMatrix: mat4x4f,
  ambientColor: vec3f,
  directionalLightDirectionView: vec3f,
  directionalLightColor: vec3f,
  directionalLightIntensity: f32,
  pointLightCount: u32,
};

struct DeferredPointLight {
  positionRange: vec4f,
  colorIntensity: vec4f,
};

@group(0) @binding(auto) var<uniform> deferredLighting: DeferredLightingUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;
@group(0) @binding(auto) var baseColorMetallicTexture: texture_2d<f32>;
@group(0) @binding(auto) var baseColorMetallicTextureSampler: sampler;
@group(0) @binding(auto) var emissiveOcclusionTexture: texture_2d<u32>;
@group(0) @binding(auto) var<storage, read> pointLights: array<DeferredPointLight>;

fn deferredLighting_reconstructViewPosition(uv: vec2f, depth: f32) -> vec3f {
  let clip = vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, depth, 1.0);
  let viewPosition = deferredLighting.inverseProjectionMatrix * clip;
  return viewPosition.xyz / max(viewPosition.w, 0.00001);
}

fn deferredLighting_distributionGGX(normal: vec3f, halfVector: vec3f, roughness: f32) -> f32 {
  let alpha = roughness * roughness;
  let alphaSquared = alpha * alpha;
  let normalDotHalf = max(dot(normal, halfVector), 0.0);
  let normalDotHalfSquared = normalDotHalf * normalDotHalf;
  let denominator = normalDotHalfSquared * (alphaSquared - 1.0) + 1.0;
  return alphaSquared / max(DEFERRED_LIGHTING_PI * denominator * denominator, 0.0001);
}

fn deferredLighting_geometrySchlickGGX(normalDotDirection: f32, roughness: f32) -> f32 {
  let radius = roughness + 1.0;
  let k = radius * radius / 8.0;
  return normalDotDirection / max(normalDotDirection * (1.0 - k) + k, 0.0001);
}

fn deferredLighting_geometrySmith(
  normal: vec3f, viewDirection: vec3f, lightDirection: vec3f, roughness: f32
) -> f32 {
  let normalDotView = max(dot(normal, viewDirection), 0.0);
  let normalDotLight = max(dot(normal, lightDirection), 0.0);
  return deferredLighting_geometrySchlickGGX(normalDotView, roughness) *
    deferredLighting_geometrySchlickGGX(normalDotLight, roughness);
}

fn deferredLighting_fresnelSchlick(cosine: f32, baseReflectance: vec3f) -> vec3f {
  return baseReflectance + (vec3f(1.0) - baseReflectance) * pow(1.0 - cosine, 5.0);
}

fn deferredLighting_evaluateLight(
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
  let fresnel = deferredLighting_fresnelSchlick(
    max(dot(halfVector, viewDirection), 0.0),
    baseReflectance
  );
  let distribution = deferredLighting_distributionGGX(normal, halfVector, roughness);
  let geometry = deferredLighting_geometrySmith(normal, viewDirection, lightDirection, roughness);
  let normalDotView = max(dot(normal, viewDirection), 0.0);
  let specular = distribution * geometry * fresnel /
    max(4.0 * normalDotView * normalDotLight, 0.0001);
  let diffuseWeight = (vec3f(1.0) - fresnel) * (1.0 - metallic);
  let diffuse = diffuseWeight * baseColor / DEFERRED_LIGHTING_PI;
  return (diffuse + specular) * radiance * normalDotLight;
}

fn deferredLighting_sampleColor(
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
  let viewPosition = deferredLighting_reconstructViewPosition(sceneCoord, depth);
  let viewDirection = normalize(-viewPosition);

  var color = baseColor * deferredLighting.ambientColor * occlusion + emissive;
  let directionalLightDirection = normalize(deferredLighting.directionalLightDirectionView);
  color += deferredLighting_evaluateLight(
    normal,
    viewDirection,
    directionalLightDirection,
    deferredLighting.directionalLightColor * deferredLighting.directionalLightIntensity,
    baseColor,
    metallic,
    roughness
  );

  let lightCount = min(
    min(deferredLighting.pointLightCount, arrayLength(&pointLights)),
    DEFERRED_LIGHTING_MAX_POINT_LIGHTS
  );
  for (var lightIndex = 0u; lightIndex < lightCount; lightIndex++) {
    let light = pointLights[lightIndex];
    let toLight = light.positionRange.xyz - viewPosition;
    let distance = length(toLight);
    if (distance >= light.positionRange.w || distance <= 0.0001) {
      continue;
    }
    let lightDirection = toLight / distance;
    let rangeFade = pow(clamp(1.0 - distance / light.positionRange.w, 0.0, 1.0), 2.0);
    let attenuation = rangeFade / max(1.0, distance * distance * 0.06);
    let radiance = light.colorIntensity.rgb * light.colorIntensity.a * attenuation;
    color += deferredLighting_evaluateLight(
      normal,
      viewDirection,
      lightDirection,
      radiance,
      baseColor,
      metallic,
      roughness
    );
  }

  return vec4f(color, 1.0);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0},
    {name: 'baseColorMetallicTexture', group: 0},
    {name: 'emissiveOcclusionTexture', group: 0},
    {name: 'pointLights', group: 0}
  ],
  props: {} as DeferredLightingProps,
  uniforms: {} as DeferredLightingUniforms,
  bindings: {} as DeferredLightingBindings,
  uniformTypes: {
    inverseProjectionMatrix: 'mat4x4<f32>',
    ambientColor: 'vec3<f32>',
    directionalLightDirectionView: 'vec3<f32>',
    directionalLightColor: 'vec3<f32>',
    directionalLightIntensity: 'f32',
    pointLightCount: 'u32'
  },
  propTypes: {
    inverseProjectionMatrix: {value: IDENTITY_MATRIX, private: true},
    ambientColor: {value: [0.04, 0.04, 0.05], private: true},
    directionalLightDirectionView: {value: [0.3, 0.75, 0.55], private: true},
    directionalLightColor: {value: [1, 0.95, 0.86], private: true},
    directionalLightIntensity: {value: 2.5, min: 0, softMax: 8},
    pointLightCount: {value: 0, min: 0, max: MAX_DEFERRED_POINT_LIGHTS}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  DeferredLightingProps,
  DeferredLightingUniforms,
  DeferredLightingBindings
>;

/** Creates a fullscreen deferred-lighting step that composes into the previous color chain. */
export function createDeferredLightingShaderPassPipeline(): ShaderPassPipeline {
  return {
    name: 'deferredLightingShaderPassPipeline',
    steps: [
      {
        shaderPass: deferredLighting,
        inputs: {sourceTexture: 'previous'},
        output: 'previous'
      }
    ]
  };
}
