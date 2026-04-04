// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

const source = /* wgsl */ `\
struct bloomUniforms {
  radius: f32,
  threshold: f32,
  intensity: f32,
};

@group(0) @binding(auto) var<uniform> bloom: bloomUniforms;

fn bloom_extract(sampleColor: vec3f) -> vec3f {
  let luminance = dot(sampleColor, vec3f(0.2126, 0.7152, 0.0722));
  let normalizedThreshold = max(1.0 - bloom.threshold, 0.00001);
  let bloomAmount = clamp((luminance - bloom.threshold) / normalizedThreshold, 0.0, 1.0);
  return sampleColor * bloomAmount;
}

fn bloom_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let baseColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let texel = vec2f(bloom.radius) / texSize;
  var bloomColor = vec3f(0.0);
  var total = 0.0;

  for (var x = -1.0; x <= 1.0; x += 1.0) {
    for (var y = -1.0; y <= 1.0; y += 1.0) {
      var weight: f32;
      if (x == 0.0 && y == 0.0) {
        weight = 4.0;
      } else if (x == 0.0 || y == 0.0) {
        weight = 2.0;
      } else {
        weight = 1.0;
      }

      let offset = vec2f(x, y) * texel;
      let sampleColor = textureSample(sourceTexture, sourceTextureSampler, texCoord + offset).rgb;
      bloomColor += bloom_extract(sampleColor) * weight;
      total += weight;
    }
  }

  bloomColor /= total;
  return vec4f(baseColor.rgb + bloomColor * bloom.intensity, baseColor.a);
}
`;

const fs = /* glsl */ `\
layout(std140) uniform bloomUniforms {
  float radius;
  float threshold;
  float intensity;
} bloom;

vec3 bloom_extract(vec3 sampleColor) {
  float luminance = dot(sampleColor, vec3(0.2126, 0.7152, 0.0722));
  float normalizedThreshold = max(1.0 - bloom.threshold, 0.00001);
  float bloomAmount = clamp((luminance - bloom.threshold) / normalizedThreshold, 0.0, 1.0);
  return sampleColor * bloomAmount;
}

vec4 bloom_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec4 baseColor = texture(source, texCoord);
  vec2 texel = vec2(bloom.radius) / texSize;
  vec3 bloomColor = vec3(0.0);
  float total = 0.0;

  for (float x = -1.0; x <= 1.0; x++) {
    for (float y = -1.0; y <= 1.0; y++) {
      float weight = (x == 0.0 && y == 0.0) ? 4.0 : ((x == 0.0 || y == 0.0) ? 2.0 : 1.0);
      vec2 offset = vec2(x, y) * texel;
      vec3 sampleColor = texture(source, texCoord + offset).rgb;
      bloomColor += bloom_extract(sampleColor) * weight;
      total += weight;
    }
  }

  bloomColor /= total;
  return vec4(baseColor.rgb + bloomColor * bloom.intensity, baseColor.a);
}
`;

/**
 * Bloom - Adds a glow to bright areas of the image.
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

/**
 * Bloom
 * Adds a glow to bright areas of the image.
 */
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
} as const satisfies ShaderPass<BloomProps, BloomUniforms>;
