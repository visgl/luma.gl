// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

export const copyPass = {
  name: 'advancedCopy',
  source: /* wgsl */ `\
fn advancedCopy_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f { return textureSample(sourceTexture, sourceTextureSampler, texCoord); }`,
  passes: [{sampler: true}]
} as const satisfies ShaderPass;
