// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

type SSRUniforms = {
  projectionMatrix: number[];
  inverseProjectionMatrix: number[];
  intensity: number;
  maxDistance: number;
  thickness: number;
  sampleCount: number;
};

const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export const ssrTrace = {
  name: 'ssrTrace',
  source: /* wgsl */ `\
struct ssrTraceUniforms {
  projectionMatrix: mat4x4f,
  inverseProjectionMatrix: mat4x4f,
  intensity: f32,
  maxDistance: f32,
  thickness: f32,
  sampleCount: f32,
};
@group(0) @binding(auto) var<uniform> ssrTrace: ssrTraceUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;

fn ssrReconstructViewPosition(uv: vec2f, depth: f32) -> vec3f {
  let clip = vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, depth, 1.0);
  let view = ssrTrace.inverseProjectionMatrix * clip;
  return view.xyz / max(view.w, 0.00001);
}

fn ssrProjectViewPosition(position: vec3f) -> vec2f {
  let clip = ssrTrace.projectionMatrix * vec4f(position, 1.0);
  let ndc = clip.xy / max(clip.w, 0.00001);
  return vec2f(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5);
}

fn ssrTrace_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let sceneCoord = texCoord;
  let normalRoughness = textureSampleLevel(normalTexture, normalTextureSampler, sceneCoord, 0.0);
  let normal = normalize(normalRoughness.xyz * 2.0 - 1.0);
  let roughness = normalRoughness.a;
  let centerDepth = textureSampleLevel(depthTexture, depthTextureSampler, sceneCoord, 0);
  if (centerDepth >= 0.99999 || roughness >= 0.92) { return vec4f(0.0); }

  let viewPosition = ssrReconstructViewPosition(sceneCoord, centerDepth);
  let incident = normalize(viewPosition);
  let reflectedRay = normalize(reflect(incident, normal));
  if (reflectedRay.z >= -0.001) { return vec4f(0.0); }

  var reflection = vec3f(0.0);
  var confidence = 0.0;
  var previousTravel = 0.12;
  for (var index: i32 = 1; index <= 64; index++) {
    if (f32(index) > ssrTrace.sampleCount) { break; }
    let fraction = f32(index) / max(ssrTrace.sampleCount, 1.0);
    let travel = 0.12 + pow(fraction, 1.35) * ssrTrace.maxDistance;
    let rayPosition = viewPosition + reflectedRay * travel;
    let sampleUv = ssrProjectViewPosition(rayPosition);
    if (any(sampleUv <= vec2f(0.0)) || any(sampleUv >= vec2f(1.0))) { break; }
    let sampleDepth = textureSampleLevel(depthTexture, depthTextureSampler, sampleUv, 0);
    if (sampleDepth >= 0.99999) { previousTravel = travel; continue; }
    let scenePosition = ssrReconstructViewPosition(sampleUv, sampleDepth);
    let depthDelta = (-rayPosition.z) - (-scenePosition.z);
    let hitThickness = ssrTrace.thickness + travel * 0.012;
    if (depthDelta >= 0.0 && depthDelta < hitThickness) {
      var nearTravel = previousTravel;
      var farTravel = travel;
      var hitUv = sampleUv;
      for (var refinement: i32 = 0; refinement < 5; refinement++) {
        let refinedTravel = (nearTravel + farTravel) * 0.5;
        let refinedPosition = viewPosition + reflectedRay * refinedTravel;
        let refinedUv = ssrProjectViewPosition(refinedPosition);
        let refinedDepth = textureSampleLevel(depthTexture, depthTextureSampler, refinedUv, 0);
        let refinedScene = ssrReconstructViewPosition(refinedUv, refinedDepth);
        if ((-refinedPosition.z) - (-refinedScene.z) >= 0.0) {
          farTravel = refinedTravel;
          hitUv = refinedUv;
        } else {
          nearTravel = refinedTravel;
        }
      }
      reflection = textureSampleLevel(sourceTexture, sourceTextureSampler, hitUv, roughness * 3.0).rgb;
      let edge = min(min(hitUv.x, hitUv.y), min(1.0 - hitUv.x, 1.0 - hitUv.y));
      let fresnel = mix(0.35, 1.0, pow(1.0 - max(dot(-incident, normal), 0.0), 5.0));
      let roughnessFade = pow(1.0 - roughness, 2.0);
      let distanceFade = 1.0 - clamp(farTravel / ssrTrace.maxDistance, 0.0, 1.0);
      confidence = smoothstep(0.0, 0.1, edge) * roughnessFade * fresnel * distanceFade * ssrTrace.intensity;
      break;
    }
    previousTravel = travel;
  }
  return vec4f(reflection, clamp(confidence, 0.0, 1.0));
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0}
  ],
  uniforms: {} as SSRUniforms,
  uniformTypes: {
    projectionMatrix: 'mat4x4<f32>',
    inverseProjectionMatrix: 'mat4x4<f32>',
    intensity: 'f32',
    maxDistance: 'f32',
    thickness: 'f32',
    sampleCount: 'f32'
  },
  propTypes: {
    projectionMatrix: {value: IDENTITY_MATRIX, private: true},
    inverseProjectionMatrix: {value: IDENTITY_MATRIX, private: true},
    intensity: {value: 1.25, min: 0, softMax: 3},
    maxDistance: {value: 90, min: 1, softMax: 180},
    thickness: {value: 0.65, min: 0.02, softMax: 3},
    sampleCount: {value: 40, min: 8, max: 64}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

export const ssrComposite = {
  name: 'ssrComposite',
  source: /* wgsl */ `\
struct ssrCompositeUniforms {
  debugMode: f32,
};
@group(0) @binding(auto) var<uniform> ssrComposite: ssrCompositeUniforms;
@group(0) @binding(auto) var reflectionTexture: texture_2d<f32>;
@group(0) @binding(auto) var reflectionTextureSampler: sampler;
fn ssrComposite_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let color = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let reflection = textureSample(reflectionTexture, reflectionTextureSampler, texCoord);
  if (ssrComposite.debugMode > 0.5) { return vec4f(reflection.rgb, 1.0); }
  return vec4f(mix(color.rgb, color.rgb + reflection.rgb, reflection.a), color.a);
}`,
  bindingLayout: [{name: 'reflectionTexture', group: 0}],
  uniformTypes: {debugMode: 'f32'},
  propTypes: {debugMode: {value: 0, min: 0, max: 1, private: true}},
  passes: [{sampler: true}]
} as const satisfies ShaderPass;
