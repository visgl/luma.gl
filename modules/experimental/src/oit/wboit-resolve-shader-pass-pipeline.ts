// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';

/** External capture textures consumed by the weighted-blended OIT resolve pass. */
export type WBOITResolveBindings = {
  accumulationTexture?: Texture;
  revealageTexture?: Texture;
};

/** Resolves weighted color and revealage, then composites over the current color. */
export const wboitResolve = {
  name: 'wboitResolve',
  source: /* wgsl */ `\
@group(0) @binding(auto) var accumulationTexture: texture_2d<f32>;
@group(0) @binding(auto) var accumulationTextureSampler: sampler;
@group(0) @binding(auto) var revealageTexture: texture_2d<f32>;
@group(0) @binding(auto) var revealageTextureSampler: sampler;

fn wboitResolve_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let accumulation = textureSample(
    accumulationTexture,
    accumulationTextureSampler,
    texCoord
  );
  let revealage = textureSample(revealageTexture, revealageTextureSampler, texCoord).r;
  let alpha = 1.0 - revealage;
  let weightedColor = accumulation.rgb / max(accumulation.a, 1e-5);
  let transparentColor = vec4f(weightedColor * alpha, alpha);
  return transparentColor + sourceColor * (1.0 - alpha);
}
`,
  fs: /* glsl */ `\
uniform sampler2D accumulationTexture;
uniform sampler2D revealageTexture;

vec4 wboitResolve_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec4 sourceColor = texture(sourceTexture, texCoord);
  vec4 accumulation = texture(accumulationTexture, texCoord);
  float revealage = texture(revealageTexture, texCoord).r;
  float alpha = 1.0 - revealage;
  vec3 weightedColor = accumulation.rgb / max(accumulation.a, 1e-5);
  vec4 transparentColor = vec4(weightedColor * alpha, alpha);
  return transparentColor + sourceColor * (1.0 - alpha);
}
`,
  bindingLayout: [
    {name: 'accumulationTexture', group: 0},
    {name: 'revealageTexture', group: 0}
  ],
  props: {} as WBOITResolveBindings,
  bindings: {} as WBOITResolveBindings,
  passes: [{sampler: true}]
} as const satisfies ShaderPass<WBOITResolveBindings, Record<string, never>, WBOITResolveBindings>;

/** Creates the fullscreen weighted-blended OIT resolve pipeline. */
export function createWBOITResolveShaderPassPipeline(): ShaderPassPipeline {
  return {
    name: 'wboitResolveShaderPassPipeline',
    steps: [
      {
        shaderPass: wboitResolve,
        inputs: {sourceTexture: 'previous'},
        output: 'previous'
      }
    ]
  };
}
