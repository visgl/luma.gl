// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';
import type {SceneVelocityBindings} from './screen-space-effect-types';

type MotionBlurUniforms = {strength: number; sampleCount: number};

export const motionBlurPass = {
  name: 'motionBlur',
  source: /* wgsl */ `\
struct motionBlurUniforms {
  strength: f32,
  sampleCount: f32,
};
@group(0) @binding(auto) var<uniform> motionBlur: motionBlurUniforms;
@group(0) @binding(auto) var velocityTexture: texture_2d<f32>;
@group(0) @binding(auto) var velocityTextureSampler: sampler;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
fn motionBlur_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let sceneCoord = texCoord;
  let velocity = textureSample(velocityTexture, velocityTextureSampler, sceneCoord).xy * motionBlur.strength;
  let centerDepth = textureSample(depthTexture, depthTextureSampler, sceneCoord);
  var color = vec4f(0.0);
  var totalWeight = 0.0;
  for (var index: i32 = 0; index < 16; index++) {
    if (f32(index) >= motionBlur.sampleCount) { break; }
    let amount = (f32(index) / max(motionBlur.sampleCount - 1.0, 1.0)) - 0.5;
    let sampleUv = clamp(texCoord - velocity * amount, vec2f(0.0), vec2f(1.0));
    let sampleDepth = textureSample(depthTexture, depthTextureSampler, sampleUv);
    let weight = exp(-abs(sampleDepth - centerDepth) * 240.0);
    color += textureSample(sourceTexture, sourceTextureSampler, sampleUv) * weight;
    totalWeight += weight;
  }
  return color / max(totalWeight, 0.0001);
}`,
  bindingLayout: [
    {name: 'velocityTexture', group: 0},
    {name: 'depthTexture', group: 0}
  ],
  props: {} as Partial<MotionBlurUniforms> & SceneVelocityBindings,
  uniforms: {} as MotionBlurUniforms,
  uniformTypes: {strength: 'f32', sampleCount: 'f32'},
  propTypes: {
    strength: {value: 1, min: 0, softMax: 4},
    sampleCount: {value: 10, min: 2, max: 16}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass;
