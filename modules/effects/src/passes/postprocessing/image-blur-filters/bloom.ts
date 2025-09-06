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
  var sum: vec3f = vec3f(0.0);
  var total: f32 = 0.0;

  for (var x: f32 = -1.0; x <= 1.0; x = x + 1.0) {
    for (var y: f32 = -1.0; y <= 1.0; y = y + 1.0) {
      var weight: f32;
      if (x == 0.0 && y == 0.0) {
        weight = 4.0;
      } else if (x == 0.0 || y == 0.0) {
        weight = 2.0;
      } else {
        weight = 1.0;
      }

      let offset: vec2f = vec2f(x, y) * texel;
      let sampleColor: vec3f = texture(source, texCoord + offset).rgb;
      let bloomSample: vec3f = max(sampleColor - vec3f(bloom.threshold), vec3f(0.0));
      sum = sum + bloomSample * weight;
      total = total + weight;
    }
  }

  let bloomColor: vec3f = sum / total;
  return vec4f(base.rgb + bloomColor * bloom.intensity, base.a);
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
  vec3 sum = vec3(0.0);
  float total = 0.0;

  for (float x = -1.0; x <= 1.0; x++) {
    for (float y = -1.0; y <= 1.0; y++) {
      float weight = (x == 0.0 && y == 0.0) ? 4.0 : ((x == 0.0 || y == 0.0) ? 2.0 : 1.0);
      vec2 offset = vec2(x, y) * texel;
      vec3 sampleColor = texture(source, texCoord + offset).rgb;
      vec3 bloomSample = max(sampleColor - bloom.threshold, 0.0);
      sum += bloomSample * weight;
      total += weight;
    }
  }

  vec3 bloomColor = sum / total;
  return vec4(base.rgb + bloomColor * bloom.intensity, base.a);
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

