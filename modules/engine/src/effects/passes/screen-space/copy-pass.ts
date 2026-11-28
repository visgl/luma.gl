// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shaders';

export const copyPass = {
  name: 'advancedCopy',
  source: /* wgsl */ `\
fn advancedCopy_sampleColor(
  sourceTexture: texture_2d<f32>, sourceTextureSampler: sampler, texSize: vec2f, texCoord: vec2f
) -> vec4f { return textureSample(sourceTexture, sourceTextureSampler, texCoord); }`,
  fs: /* glsl */ `
vec4 advancedCopy_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  return texture(sourceTexture, texCoord);
}`,
  passes: [{sampler: true}]
} as const satisfies ShaderPass;
