// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type EffectDefinition} from '../../../passes/effect-renderer';
import type {ShaderPass} from '@luma.gl/shaders';
import {copyPass} from './copy-pass';
import {temporalMotionReprojectionWGSL, type TemporalFrameJitter} from './temporal-frame';

type TAAUniforms = TemporalFrameJitter & {
  historyWeight: number;
  depthThreshold: number;
};

export const taaResolve = {
  name: 'taaResolve',
  source: /* wgsl */ `\
${temporalMotionReprojectionWGSL}
struct taaResolveUniforms {
  historyWeight: f32,
  depthThreshold: f32,
  currentJitter: vec2f,
  previousJitter: vec2f,
};
@group(0) @binding(auto) var<uniform> taaResolve: taaResolveUniforms;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var historyTextureSampler: sampler;
@group(0) @binding(auto) var velocityTexture: texture_2d<f32>;
@group(0) @binding(auto) var velocityTextureSampler: sampler;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var previousDepthTexture: texture_2d<f32>;
@group(0) @binding(auto) var previousDepthTextureSampler: sampler;
fn taaResolve_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let current = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  if (taaResolve.historyWeight <= 0.0) { return current; }
  let dimensions = vec2f(textureDimensions(sourceTexture));
  let texel = 1.0 / dimensions;
  let sceneCoord = texCoord;
  let velocity = textureSample(velocityTexture, velocityTextureSampler, sceneCoord).xy;
  let previousUv = temporal_reprojectMotion(texCoord - taaResolve.currentJitter, velocity) + taaResolve.previousJitter;
  let currentDepth = textureSample(depthTexture, depthTextureSampler, sceneCoord);
  let previousDepth = textureSample(previousDepthTexture, previousDepthTextureSampler, clamp(previousUv, vec2f(0.0), vec2f(1.0))).r;
  var minimumColor = current.rgb;
  var maximumColor = current.rgb;
  for (var y: i32 = -1; y <= 1; y++) {
    for (var x: i32 = -1; x <= 1; x++) {
      let sampleColor = textureSample(sourceTexture, sourceTextureSampler, texCoord + vec2f(f32(x), f32(y)) * texel).rgb;
      minimumColor = min(minimumColor, sampleColor);
      maximumColor = max(maximumColor, sampleColor);
    }
  }
  let history = clamp(textureSample(historyTexture, historyTextureSampler, clamp(previousUv, vec2f(0.0), vec2f(1.0))).rgb, minimumColor, maximumColor);
  let validUv = all(previousUv >= vec2f(0.0)) && all(previousUv <= vec2f(1.0));
  let validDepth = abs(previousDepth - currentDepth) < taaResolve.depthThreshold;
  let weight = select(0.0, taaResolve.historyWeight, validUv && validDepth);
  return vec4f(mix(current.rgb, history, weight), current.a);
}`,
  bindingLayout: [
    {name: 'historyTexture', group: 0},
    {name: 'velocityTexture', group: 0},
    {name: 'depthTexture', group: 0},
    {name: 'previousDepthTexture', group: 0}
  ],
  uniforms: {} as TAAUniforms,
  uniformTypes: {
    historyWeight: 'f32',
    depthThreshold: 'f32',
    currentJitter: 'vec2<f32>',
    previousJitter: 'vec2<f32>'
  },
  propTypes: {
    historyWeight: {value: 0.9, min: 0, max: 0.98},
    depthThreshold: {value: 0.01, min: 0.0001, softMax: 0.1},
    currentJitter: {value: [0, 0], private: true},
    previousJitter: {value: [0, 0], private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

export const depthHistoryCopy = {
  name: 'depthHistoryCopy',
  source: /* wgsl */ `\
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
fn depthHistoryCopy_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f { let depth = textureSample(depthTexture, depthTextureSampler, texCoord); return vec4f(depth, 0.0, 0.0, 1.0); }`,
  bindingLayout: [{name: 'depthTexture', group: 0}],
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

/** Temporal antialiasing with scene velocity and separate color and depth history. */
export const taa = {
  name: 'taaCompositeShaderPass',
  resources: {
    taaHistoryColor: {lifetime: 'history', initialize: 'original'},
    taaHistoryDepth: {
      format: 'rgba16float',
      lifetime: 'history',
      initialize: {clearColor: [1, 0, 0, 1]}
    }
  },
  passes: [
    {
      kind: 'fullscreen',
      shaderPass: taaResolve,
      inputs: {
        sourceTexture: 'previous',
        historyTexture: 'taaHistoryColor',
        previousDepthTexture: 'taaHistoryDepth'
      },
      output: 'taaHistoryColor'
    },
    {
      kind: 'fullscreen',
      shaderPass: copyPass,
      inputs: {sourceTexture: 'taaHistoryColor'},
      output: 'previous'
    },
    {
      kind: 'fullscreen',
      shaderPass: depthHistoryCopy,
      inputs: {sourceTexture: 'previous'},
      output: 'taaHistoryDepth'
    }
  ]
} as const satisfies EffectDefinition<'taaHistoryColor' | 'taaHistoryDepth'>;
