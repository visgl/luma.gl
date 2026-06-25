// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

type FogUniforms = {
  fogColor: [number, number, number, number];
  density: number;
  heightFalloff: number;
  scattering: number;
  historyWeight: number;
  time: number;
};

export const volumetricFogPass = {
  name: 'volumetricFog',
  source: /* wgsl */ `\
struct volumetricFogUniforms {
  fogColor: vec4f,
  density: f32,
  heightFalloff: f32,
  scattering: f32,
  historyWeight: f32,
  time: f32,
};
@group(0) @binding(auto) var<uniform> volumetricFog: volumetricFogUniforms;
@group(0) @binding(auto) var depthTexture: texture_depth_2d;
@group(0) @binding(auto) var depthTextureSampler: sampler;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var historyTextureSampler: sampler;
fn volumetricFog_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f {
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let depth = textureSample(depthTexture, depthTextureSampler, texCoord);
  let noise = fract(sin(dot(texCoord * vec2f(textureDimensions(depthTexture)) + volumetricFog.time, vec2f(12.9898, 78.233))) * 43758.5453);
  var opticalDepth = 0.0;
  for (var index: i32 = 0; index < 20; index++) {
    let distance = (f32(index) + noise) / 20.0 * depth;
    let heightDensity = exp(-max((texCoord.y - 0.42) + distance * 0.18, 0.0) * volumetricFog.heightFalloff);
    opticalDepth += heightDensity * volumetricFog.density * depth / 20.0;
  }
  let fogAmount = clamp(1.0 - exp(-opticalDepth * 8.0), 0.0, 0.96);
  let sun = pow(max(1.0 - distance(texCoord, vec2f(0.72, 0.24)) * 1.7, 0.0), 8.0) * volumetricFog.scattering;
  let fogged = vec4f(mix(sourceColor.rgb, volumetricFog.fogColor.rgb + sun * volumetricFog.fogColor.a, fogAmount), sourceColor.a);
  let history = textureSample(historyTexture, historyTextureSampler, texCoord);
  return mix(fogged, history, volumetricFog.historyWeight);
}`,
  bindingLayout: [
    {name: 'depthTexture', group: 0},
    {name: 'historyTexture', group: 0}
  ],
  uniforms: {} as FogUniforms,
  uniformTypes: {
    fogColor: 'vec4<f32>',
    density: 'f32',
    heightFalloff: 'f32',
    scattering: 'f32',
    historyWeight: 'f32',
    time: 'f32'
  },
  propTypes: {
    fogColor: {value: [0.18, 0.34, 0.48, 0.6]},
    density: {value: 0.22, min: 0, softMax: 1},
    heightFalloff: {value: 3, min: 0, softMax: 10},
    scattering: {value: 0.35, min: 0, softMax: 2},
    historyWeight: {value: 0.82, min: 0, max: 0.98},
    time: {value: 0, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass;
