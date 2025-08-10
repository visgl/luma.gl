// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

const source = /* wgsl */ `
uniform bloomUniforms {
  radius: f32,
  threshold: f32,
  intensity: f32,
};

@group(0) @binding(1) var<uniform> bloom: bloomUniforms;

fn bloom_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) -> vec4f {
  let base: vec4f = texture(source, texCoord);
  let texel: vec2f = vec2f(bloom.radius) / texSize;
  var sum: vec4f = vec4f(0.0);
  var total: f32 = 0.0;

  for (var x: f32 = -1.0; x <= 1.0; x = x + 1.0) {
    for (var y: f32 = -1.0; y <= 1.0; y = y + 1.0) {
      let offset: vec2f = vec2f(x, y) * texel;
      let sampleColor: vec4f = texture(source, texCoord + offset);
      let brightness: f32 = max(max(sampleColor.r, sampleColor.g), sampleColor.b);
      if (brightness > bloom.threshold) {
        sum = sum + sampleColor;
        total = total + 1.0;
      }
    }
  }

  if (total > 0.0) {
    sum = sum / total;
  }

  return base + sum * bloom.intensity;
}
`;

const fs = /* glsl */ `
uniform bloomUniforms {
  float radius;
  float threshold;
  float intensity;
} bloom;

vec4 bloom_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec4 base = texture(source, texCoord);
  vec2 texel = vec2(bloom.radius) / texSize;
  vec4 sum = vec4(0.0);
  float total = 0.0;

  for (float x = -1.0; x <= 1.0; x++) {
    for (float y = -1.0; y <= 1.0; y++) {
      vec2 offset = vec2(x, y) * texel;
      vec4 sampleColor = texture(source, texCoord + offset);
      float brightness = max(max(sampleColor.r, sampleColor.g), sampleColor.b);
      if (brightness > bloom.threshold) {
        sum += sampleColor;
        total += 1.0;
      }
    }
  }

  if (total > 0.0) {
    sum /= total;
  }

  return base + sum * bloom.intensity;
}
`;

/**
 * Bloom - Adds a simple glow to bright areas of the image.
 */
export type BloomProps = {
  /** Radius of the sampling kernel in pixels. */
  radius?: number;
  /** Luminance threshold above which a pixel contributes to bloom. */
  threshold?: number;
  /** Strength of the bloom contribution. */
  intensity?: number;
};

export type BloomUniforms = BloomProps;

export const bloom = {
  name: 'bloom',
  source,
  fs,

  props: {} as BloomProps,
  uniforms: {} as BloomUniforms,
  uniformTypes: {
    radius: 'f32',
    threshold: 'f32',
    intensity: 'f32'
  },
  propTypes: {
    radius: {value: 4, min: 0, softMax: 20},
    threshold: {value: 0.8, min: 0, max: 1},
    intensity: {value: 1, min: 0, softMax: 3}
  },

  passes: [{sampler: true}]
} as const satisfies ShaderPass<BloomProps, BloomProps>;
