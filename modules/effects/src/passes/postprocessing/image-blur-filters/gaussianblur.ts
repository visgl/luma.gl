// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPass} from '@luma.gl/shadertools';

const MAX_GAUSSIAN_BLUR_RADIUS = 32;

const source = /* wgsl */ `\
const GAUSSIAN_BLUR_MAX_RADIUS = ${MAX_GAUSSIAN_BLUR_RADIUS}.0;
const GAUSSIAN_BLUR_MAX_PAIRS = ${Math.ceil(MAX_GAUSSIAN_BLUR_RADIUS / 2)};

struct gaussianBlurUniforms {
  radius: f32,
  delta: vec2f,
};

@group(0) @binding(auto) var<uniform> gaussianBlur: gaussianBlurUniforms;

fn gaussianBlur_applySample(color: vec4f) -> vec4f {
  return vec4f(color.rgb * vec3f(color.a), color.a);
}

fn gaussianBlur_getEffectiveRadius() -> f32 {
  return clamp(gaussianBlur.radius, 0.0, GAUSSIAN_BLUR_MAX_RADIUS);
}

fn gaussianBlur_getSigma(radius: f32) -> f32 {
  return max(radius / 3.0, 0.00001);
}

fn gaussianBlur_getWeight(offset: f32, sigma: f32) -> f32 {
  let normalizedOffset = offset / sigma;
  return exp(-0.5 * normalizedOffset * normalizedOffset);
}

fn gaussianBlur_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let effectiveRadius = gaussianBlur_getEffectiveRadius();
  if (effectiveRadius <= 0.0) {
    return textureSample(sourceTexture, sourceTextureSampler, texCoord);
  }

  let adjustedDelta = gaussianBlur.delta / texSize;
  let sigma = gaussianBlur_getSigma(effectiveRadius);
  let centerWeight = gaussianBlur_getWeight(0.0, sigma);

  var color = vec4f(0.0);
  var totalWeight = centerWeight;

  let centerColor = gaussianBlur_applySample(
    textureSample(sourceTexture, sourceTextureSampler, texCoord)
  );
  color += centerColor * centerWeight;

  for (var pairIndex = 0; pairIndex < GAUSSIAN_BLUR_MAX_PAIRS; pairIndex += 1) {
    let firstOffset = f32(pairIndex * 2 + 1);
    if (firstOffset > effectiveRadius) {
      continue;
    }

    let secondOffset = firstOffset + 1.0;
    let firstWeight = gaussianBlur_getWeight(firstOffset, sigma);
    let secondWeight =
      select(0.0, gaussianBlur_getWeight(secondOffset, sigma), secondOffset <= effectiveRadius);
    let combinedWeight = firstWeight + secondWeight;
    let combinedOffset =
      (firstOffset * firstWeight + secondOffset * secondWeight) / max(combinedWeight, 0.00001);

    let positiveColor = gaussianBlur_applySample(
      textureSample(sourceTexture, sourceTextureSampler, texCoord + adjustedDelta * combinedOffset)
    );
    let negativeColor = gaussianBlur_applySample(
      textureSample(sourceTexture, sourceTextureSampler, texCoord - adjustedDelta * combinedOffset)
    );

    color += (positiveColor + negativeColor) * combinedWeight;
    totalWeight += combinedWeight * 2.0;
  }

  color /= totalWeight;
  let unpremultipliedRgb = color.rgb / vec3f(color.a + 0.00001);

  return vec4f(unpremultipliedRgb, color.a);
}
`;

const fs = /* glsl */ `\
#define GAUSSIAN_BLUR_MAX_RADIUS ${MAX_GAUSSIAN_BLUR_RADIUS}.0
#define GAUSSIAN_BLUR_MAX_PAIRS ${Math.ceil(MAX_GAUSSIAN_BLUR_RADIUS / 2)}

layout(std140) uniform gaussianBlurUniforms {
  float radius;
  vec2 delta;
} gaussianBlur;

vec4 gaussianBlur_applySample(vec4 color) {
  return vec4(color.rgb * color.a, color.a);
}

float gaussianBlur_getEffectiveRadius() {
  return clamp(gaussianBlur.radius, 0.0, GAUSSIAN_BLUR_MAX_RADIUS);
}

float gaussianBlur_getSigma(float radius) {
  return max(radius / 3.0, 0.00001);
}

float gaussianBlur_getWeight(float offset, float sigma) {
  float normalizedOffset = offset / sigma;
  return exp(-0.5 * normalizedOffset * normalizedOffset);
}

vec4 gaussianBlur_sampleColor(sampler2D source, vec2 texSize, vec2 texCoord) {
  float effectiveRadius = gaussianBlur_getEffectiveRadius();
  if (effectiveRadius <= 0.0) {
    return texture(source, texCoord);
  }

  vec2 adjustedDelta = gaussianBlur.delta / texSize;
  float sigma = gaussianBlur_getSigma(effectiveRadius);
  float centerWeight = gaussianBlur_getWeight(0.0, sigma);

  vec4 color = vec4(0.0);
  float totalWeight = centerWeight;

  vec4 centerColor = gaussianBlur_applySample(texture(source, texCoord));
  color += centerColor * centerWeight;

  for (int pairIndex = 0; pairIndex < GAUSSIAN_BLUR_MAX_PAIRS; pairIndex++) {
    float firstOffset = float(pairIndex * 2 + 1);
    if (firstOffset > effectiveRadius) {
      continue;
    }

    float secondOffset = firstOffset + 1.0;
    float firstWeight = gaussianBlur_getWeight(firstOffset, sigma);
    float secondWeight = secondOffset <= effectiveRadius ? gaussianBlur_getWeight(secondOffset, sigma) : 0.0;
    float combinedWeight = firstWeight + secondWeight;
    float combinedOffset =
      (firstOffset * firstWeight + secondOffset * secondWeight) / max(combinedWeight, 0.00001);

    vec4 positiveColor = gaussianBlur_applySample(texture(source, texCoord + adjustedDelta * combinedOffset));
    vec4 negativeColor = gaussianBlur_applySample(texture(source, texCoord - adjustedDelta * combinedOffset));
    color += (positiveColor + negativeColor) * combinedWeight;
    totalWeight += combinedWeight * 2.0;
  }

  color /= totalWeight;
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
    radius: {value: 12, min: 0, max: MAX_GAUSSIAN_BLUR_RADIUS, softMax: MAX_GAUSSIAN_BLUR_RADIUS},
    delta: {value: [1, 0], private: true}
  },

  passes: [
    {sampler: true, uniforms: {delta: [1, 0]}},
    {sampler: true, uniforms: {delta: [0, 1]}}
  ]
} as const satisfies ShaderPass<GaussianBlurProps, GaussianBlurUniforms>;
