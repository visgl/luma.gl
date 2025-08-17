// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

const source = /* wgsl */ `\
@group(0) @binding(3) var persistenceTexture : texture_2d<f32>;
@group(0) @binding(4) var persistenceSampler : sampler;

fn persistence_filterColor_ext(color: vec4f, texSize: vec2f, texCoord: vec2f) -> vec4f {
  let previous = textureSample(persistenceTexture, persistenceSampler, texCoord);
  return mix(color * 4.0, previous, 0.9);
}
`;

const fs = /* glsl */ `\
uniform sampler2D persistenceTexture;

vec4 persistence_filterColor_ext(vec4 color, vec2 texSize, vec2 texCoord) {
  vec4 previous = texture(persistenceTexture, texCoord);
  return mix(color * 4.0, previous, 0.9);
}
`;

export const persistenceEffect = {
  name: 'persistence',
  source,
  fs,
  passes: [{filter: true}]
} as const satisfies ShaderPass;
