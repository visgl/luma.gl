// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

const source = /* wgsl */ `\
struct gaussianBlurUniforms {
  radius: f32,
  delta: vec2f,
};

@group(0) @binding(auto) var<uniform> gaussianBlur: gaussianBlurUniforms;

fn gaussianBlur_applySample(color: vec4f) -> vec4f {
  return vec4f(color.rgb * vec3f(color.a), color.a);
}

fn gaussianBlur_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let adjustedDelta = gaussianBlur.delta * gaussianBlur.radius / texSize;
  let centerWeight = 0.22702703;
  let innerOffset = 1.3846154;
  let innerWeight = 0.31621623;
  let outerOffset = 3.2307692;
  let outerWeight = 0.07027027;

  var color = vec4f(0.0);
  var total = 0.0;

  let centerColor = gaussianBlur_applySample(
    textureSample(sourceTexture, sourceTextureSampler, texCoord)
  );
  color += centerColor * centerWeight;
  total += centerWeight;

  let innerPositiveColor = gaussianBlur_applySample(
    textureSample(sourceTexture, sourceTextureSampler, texCoord + adjustedDelta * innerOffset)
  );
  let innerNegativeColor = gaussianBlur_applySample(
    textureSample(sourceTexture, sourceTextureSampler, texCoord - adjustedDelta * innerOffset)
  );
  color += (innerPositiveColor + innerNegativeColor) * innerWeight;
  total += innerWeight * 2.0;

  let outerPositiveColor = gaussianBlur_applySample(
    textureSample(sourceTexture, sourceTextureSampler, texCoord + adjustedDelta * outerOffset)
  );
  let outerNegativeColor = gaussianBlur_applySample(
    textureSample(sourceTexture, sourceTextureSampler, texCoord - adjustedDelta * outerOffset)
  );
  color += (outerPositiveColor + outerNegativeColor) * outerWeight;
  total += outerWeight * 2.0;

  color /= total;
  let unpremultipliedRgb = color.rgb / vec3f(color.a + 0.00001);

  return vec4f(unpremultipliedRgb, color.a);
}
`;

const fs = /* glsl */ `\
layout(std140) uniform gaussianBlurUniforms {
  float radius;
  vec2 delta;
} gaussianBlur;

vec4 gaussianBlur_applySample(vec4 color) {
  return vec4(color.rgb * color.a, color.a);
}

vec4 gaussianBlur_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  vec2 adjustedDelta = gaussianBlur.delta * gaussianBlur.radius / texSize;
  float centerWeight = 0.22702703;
  float innerOffset = 1.3846154;
  float innerWeight = 0.31621623;
  float outerOffset = 3.2307692;
  float outerWeight = 0.07027027;

  vec4 color = vec4(0.0);
  float total = 0.0;

  vec4 centerColor = gaussianBlur_applySample(texture(source, texCoord));
  color += centerColor * centerWeight;
  total += centerWeight;

  vec4 innerPositiveColor = gaussianBlur_applySample(texture(source, texCoord + adjustedDelta * innerOffset));
  vec4 innerNegativeColor = gaussianBlur_applySample(texture(source, texCoord - adjustedDelta * innerOffset));
  color += (innerPositiveColor + innerNegativeColor) * innerWeight;
  total += innerWeight * 2.0;

  vec4 outerPositiveColor = gaussianBlur_applySample(texture(source, texCoord + adjustedDelta * outerOffset));
  vec4 outerNegativeColor = gaussianBlur_applySample(texture(source, texCoord - adjustedDelta * outerOffset));
  color += (outerPositiveColor + outerNegativeColor) * outerWeight;
  total += outerWeight * 2.0;

  color /= total;
  color.rgb /= color.a + 0.00001;

  return color;
}
`;

/**
 * Gaussian Blur - Applies a stronger separable blur using Gaussian weights.
 */
export type GaussianBlurProps = {
  /** The blur radius in pixels. */
  radius?: number;
  /** @deprecated internal property */
  delta?: [number, number];
};

export type GaussianBlurUniforms = GaussianBlurProps;

/**
 * Gaussian Blur
 * Applies a stronger separable blur using Gaussian weights.
 */
export const gaussianBlur = {
  name: 'gaussianBlur',
  source,
  fs,

  props: {} as GaussianBlurProps,
  uniforms: {} as GaussianBlurUniforms,
  uniformTypes: {
    radius: 'f32',
    delta: 'vec2<f32>'
  },
  propTypes: {
    radius: {value: 12, min: 0, softMax: 80},
    delta: {value: [1, 0], private: true}
  },

  passes: [
    {sampler: true, uniforms: {delta: [1, 0]}},
    {sampler: true, uniforms: {delta: [0, 1]}}
  ]
} as const satisfies ShaderPass<GaussianBlurProps, GaussianBlurUniforms>;
