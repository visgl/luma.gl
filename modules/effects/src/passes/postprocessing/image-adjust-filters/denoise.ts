// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

// Do a 9x9 bilateral box filter
const source = /* wgsl */ `\
struct denoiseUniforms {
  strength: f32,
};

@group(0) @binding(1) var<uniform> denoise: denoiseUniforms;

fn denoise_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let adjustedExponent = 3.0 + 200.0 * pow(1.0 - denoise.strength, 4.0);
  let center = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  var color = vec4f(0.0);
  var total = 0.0;

  for (var x = -4.0; x <= 4.0; x += 1.0) {
    for (var y = -4.0; y <= 4.0; y += 1.0) {
      let offsetColor = textureSample(
        sourceTexture,
        sourceTextureSampler,
        texCoord + vec2f(x, y) / texSize
      );
      let weight = pow(
        1.0 - abs(dot(offsetColor.rgb - center.rgb, vec3f(0.25))),
        adjustedExponent
      );
      color += offsetColor * weight;
      total += weight;
    }
  }

  return color / total;
}
`;

const fs = /* glsl */ `\
uniform denoiseUniforms {
  float strength;
} denoise;

vec4 denoise_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  float adjustedExponent = 3. + 200. * pow(1. - denoise.strength, 4.);

  vec4 center = texture(source, texCoord);
  vec4 color = vec4(0.0);
  float total = 0.0;
  for (float x = -4.0; x <= 4.0; x += 1.0) {
    for (float y = -4.0; y <= 4.0; y += 1.0) {
      vec4 offsetColor = texture(source, texCoord + vec2(x, y) / texSize);
      float weight = 1.0 - abs(dot(offsetColor.rgb - center.rgb, vec3(0.25)));
      weight = pow(weight, adjustedExponent);
      color += offsetColor * weight;
      total += weight;
    }
  }

  return color / total;
}
`;

/**
 * Denoise -
 * Smooths over grainy noise in dark images using an 9x9 box filter
 * weighted by color intensity, similar to a bilateral filter.
 */
export type DenoiseProps = {
  /**
   * The exponent of the color intensity difference, should be greater
   * than zero. A value of zero just gives an 9x9 box blur and high values
   * give the original image, but ideal values are usually around 10-20.
   */
  strength?: number;
};

export type DenoiseUniforms = DenoiseProps;

/**
 * Denoise -
 * Smooths over grainy noise in dark images using an 9x9 box filter
 * weighted by color intensity, similar to a bilateral filter.
 */
export const denoise = {
  props: {} as DenoiseProps,
  uniforms: {} as DenoiseUniforms,

  name: 'denoise',
  uniformTypes: {
    strength: 'f32'
  },
  propTypes: {
    strength: {format: 'f32', value: 0.5, min: 0, max: 1}
    // strength: {..., adjust: (strength: number): number => 0.53 + 200 * Math.pow(1 - strength, 4) // TODO - JS preprocessing
  },

  source,
  fs,

  passes: [{sampler: true}, {sampler: true}]
} as const satisfies ShaderPass<DenoiseProps, DenoiseUniforms>;
