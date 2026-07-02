// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
import {depthHelpers} from './screen-space-shader-helpers';

export type OutlineShaderPassPipelineOptions = {
  normalSource?: 'reconstruct-from-depth' | 'normal-texture';
};

type OutlineUniforms = {
  color: [number, number, number, number];
  thickness: number;
  depthThreshold: number;
  normalThreshold: number;
  useNormalTexture: number;
};

export const outlinePass = {
  name: 'screenSpaceOutline',
  source: /* wgsl */ `\
struct screenSpaceOutlineUniforms {
  color: vec4f,
  thickness: f32,
  depthThreshold: f32,
  normalThreshold: f32,
  useNormalTexture: f32,
};
@group(0) @binding(auto) var<uniform> screenSpaceOutline: screenSpaceOutlineUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var normalTexture: texture_2d<f32>;
@group(0) @binding(auto) var normalTextureSampler: sampler;
${depthHelpers}
fn screenSpaceOutline_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let texel = screenSpaceOutline.thickness / vec2f(textureDimensions(depthTexture));
  let centerSceneUv = advancedSceneUV(texCoord);
  let centerDepth = textureSample(depthTexture, depthTextureSampler, centerSceneUv);
  let centerReconstructed = advancedDepthNormal(depthTexture, depthTextureSampler, centerSceneUv);
  let centerTextureNormal = normalize(textureSample(normalTexture, normalTextureSampler, centerSceneUv).xyz * 2.0 - 1.0);
  let centerNormal = normalize(mix(centerReconstructed, centerTextureNormal, screenSpaceOutline.useNormalTexture));
  var depthEdge = 0.0;
  var normalEdge = 0.0;
  let offsets = array<vec2f, 4>(vec2f(texel.x, 0.0), vec2f(-texel.x, 0.0), vec2f(0.0, texel.y), vec2f(0.0, -texel.y));
  for (var index: i32 = 0; index < 4; index++) {
    let sampleUv = clamp(texCoord + offsets[index], vec2f(0.0), vec2f(1.0));
    let sampleSceneUv = advancedSceneUV(sampleUv);
    let sampleDepth = textureSample(depthTexture, depthTextureSampler, sampleSceneUv);
    depthEdge = max(depthEdge, abs(sampleDepth - centerDepth));
    let reconstructed = advancedDepthNormal(depthTexture, depthTextureSampler, sampleSceneUv);
    let textureNormal = normalize(textureSample(normalTexture, normalTextureSampler, sampleSceneUv).xyz * 2.0 - 1.0);
    let sampleNormal = normalize(mix(reconstructed, textureNormal, screenSpaceOutline.useNormalTexture));
    normalEdge = max(normalEdge, 1.0 - max(dot(centerNormal, sampleNormal), 0.0));
  }
  let edge = max(smoothstep(screenSpaceOutline.depthThreshold, screenSpaceOutline.depthThreshold * 2.0, depthEdge),
                 smoothstep(screenSpaceOutline.normalThreshold, screenSpaceOutline.normalThreshold * 2.0, normalEdge));
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  return mix(sourceColor, screenSpaceOutline.color, edge * screenSpaceOutline.color.a);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'normalTexture', group: 0}
  ],
  uniforms: {} as OutlineUniforms,
  uniformTypes: {
    color: 'vec4<f32>',
    thickness: 'f32',
    depthThreshold: 'f32',
    normalThreshold: 'f32',
    useNormalTexture: 'f32'
  },
  propTypes: {
    color: {value: [0.02, 0.08, 0.12, 0.48]},
    thickness: {value: 1.5, min: 0.5, softMax: 5},
    depthThreshold: {value: 0.003, min: 0.0001, softMax: 0.05},
    normalThreshold: {value: 0.18, min: 0.01, softMax: 1},
    useNormalTexture: {value: 0, min: 0, max: 1, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

export function createOutlineShaderPassPipeline(
  options: OutlineShaderPassPipelineOptions = {}
): ShaderPassPipeline {
  const useNormalTexture = options.normalSource === 'normal-texture' ? 1 : 0;
  const inputs: Record<string, 'previous'> = {sourceTexture: 'previous'};
  if (!useNormalTexture) {
    inputs['normalTexture'] = 'previous';
  }
  return {
    name: 'outlineShaderPassPipeline',
    steps: [{shaderPass: outlinePass, inputs, output: 'previous', uniforms: {useNormalTexture}}]
  };
}
