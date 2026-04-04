// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

const source = /* wgsl */ `\
@group(0) @binding(auto) var persistenceTexture : texture_2d<f32>;
@group(0) @binding(auto) var persistenceTextureSampler : sampler;

fn persistence_getCoverage(color: vec4f) -> f32 {
  return max(color.a, max(color.r, max(color.g, color.b)));
}

fn persistence_filterColor_ext(color: vec4f, texSize: vec2f, texCoord: vec2f) -> vec4f {
  let previous = textureSample(persistenceTexture, persistenceTextureSampler, texCoord);
  let accumulatedColor = min(
    mix(color.rgb * 4.0, previous.rgb, vec3f(0.9, 0.9, 0.9)),
    vec3f(1.0, 1.0, 1.0)
  );
  let accumulatedAlpha = max(persistence_getCoverage(color), previous.a * 0.9);
  return vec4f(accumulatedColor, accumulatedAlpha);
}
`;

const fs = /* glsl */ `\
uniform sampler2D persistenceTexture;

float persistence_getCoverage(vec4 color) {
  return max(color.a, max(color.r, max(color.g, color.b)));
}

vec4 persistence_filterColor_ext(vec4 color, vec2 texSize, vec2 texCoord) {
  vec4 previous = texture(persistenceTexture, texCoord);
  vec3 accumulatedColor = min(mix(color.rgb * 4.0, previous.rgb, vec3(0.9)), vec3(1.0));
  float accumulatedAlpha = max(persistence_getCoverage(color), previous.a * 0.9);
  return vec4(accumulatedColor, accumulatedAlpha);
}
`;

/**
 * Persistence
 *
 * Blends the current frame with a previous accumulation texture to create fading trails.
 * Callers supply the history texture through the `persistenceTexture` binding each frame.
 */
export const persistenceEffect = {
  name: 'persistence',
  source,
  fs,
  passes: [{filter: true}]
} as const satisfies ShaderPass;
