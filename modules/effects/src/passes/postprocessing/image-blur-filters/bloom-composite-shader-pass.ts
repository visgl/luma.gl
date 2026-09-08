// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Texture, TextureFormatColor} from '@luma.gl/core';
import type {
  ShaderPass,
  CompositeShaderPass,
  CompositeShaderPassStep,
  ShaderPassRenderTarget
} from '@luma.gl/shadertools';
import type {BloomProps, BloomUniforms} from './bloom';
import {createBloomComputePyramid} from './bloom-compute-pyramid';
import {
  bloomLensArtifactsPass,
  createBloomLensCompositePass,
  createBloomTemporalPass,
  MAX_BLOOM_LENS_GHOSTS,
  MAX_BLOOM_LENS_SPIKES,
  type BloomLensEffectsOptions
} from './bloom-lens-effects';

export type {BloomLensEffectsOptions} from './bloom-lens-effects';

const MAX_BLOOM_BLUR_RADIUS = 24;
const BLOOM_TARGET_SAMPLER = {minFilter: 'linear', magFilter: 'linear'} as const;
const BLOOM_QUALITY_LEVELS = {low: 2, medium: 3, high: 4, ultra: 5} as const;
const BLOOM_PYRAMID_LEVELS = [
  {name: 'Half', scale: 0.5},
  {name: 'Quarter', scale: 0.25},
  {name: 'Eighth', scale: 0.125},
  {name: 'Sixteenth', scale: 0.0625},
  {name: 'ThirtySecond', scale: 0.03125}
] as const;

type BloomTargetName =
  | 'extractHalf'
  | 'blurHalfScratch'
  | 'blurHalf'
  | 'extractQuarter'
  | 'blurQuarterScratch'
  | 'blurQuarter'
  | 'extractEighth'
  | 'blurEighthScratch'
  | 'blurEighth';

/** Construction options for HDR-capable multiscale bloom. */
export type BloomCompositeShaderPassOptions = BloomProps & {
  /** Controls the number of bloom pyramid levels: low=2, medium=3, high=4, ultra=5. */
  quality?: keyof typeof BLOOM_QUALITY_LEVELS;
  /** Normalized contribution from progressively wider bloom levels. Defaults to 0.55. */
  scatter?: number;
  /** Width of the soft highlight threshold relative to the threshold. Defaults to 0.5. */
  softKnee?: number;
  /** Camera exposure used to move the scene-referred highlight threshold. Defaults to one. */
  exposure?: number;
  /** Additional exposure compensation, measured in photographic stops. Defaults to zero. */
  exposureCompensation?: number;
  /** Luminance-weighted suppression of isolated bright samples. Defaults to 0. */
  fireflyReduction?: number;
  /** Negative values stretch vertically; positive values stretch horizontally. */
  anamorphicRatio?: number;
  /** RGB multiplier applied to the reconstructed bloom before composition. */
  tint?: [number, number, number];
  /** Optional photographic diffraction, spectral ghosts, lens halo, and sampled dirt mask. */
  lens?: BloomLensEffectsOptions;
  /** Neighborhood-clamped history contribution for stable highlights. Defaults to zero. */
  temporalStability?: number;
  /** Reproject temporal history with externally supplied velocityTexture and depthTexture. */
  temporalReprojection?: boolean;
  /** Maximum encoded scene-depth change accepted by motion-aware temporal history. */
  temporalDepthThreshold?: number;
  /** Previous adapted exposure used to rescale glow history when camera exposure changes. */
  previousExposure?: number;
  /** Separable Gaussian filtering or a lower-cost downsample/reconstruction-only pyramid. */
  blurAlgorithm?: 'gaussian' | 'dual-kawase';
  /** Scatter every source pixel and blend normalized glow without duplicating scene energy. */
  energyConserving?: boolean;
  /** Normalized tent reconstruction or four-fetch bicubic B-spline filtering. */
  reconstruction?: 'tent' | 'bicubic';
  /** Select fragment downsampling or the fused WebGPU compute pyramid when available. */
  downsample?: 'auto' | 'render' | 'compute';
  /** Reuse expired extraction textures during reconstruction. Defaults to true. */
  reuseRenderTargets?: boolean;
  /**
   * Positive fractional size multiplier applied to every pyramid level. The extraction filter
   * adapts its source footprint to the resulting target size.
   */
  resolutionScale?: number;
  /** Filterable color intermediate format. Defaults to rgba16float for HDR highlight energy. */
  colorFormat?: TextureFormatColor;
};

const bloomExtractPass = {
  name: 'bloomExtract',
  source: /* wgsl */ `
struct bloomExtractUniforms {
  threshold: f32,
  softKnee: f32,
  fireflyReduction: f32,
  exposure: f32,
  exposureCompensation: f32,
};

@group(0) @binding(auto) var<uniform> bloomExtract: bloomExtractUniforms;

fn bloomExtract_applyThreshold(sourceColor: vec4f) -> vec4f {
  let luminance = dot(sourceColor.rgb, vec3f(0.2126, 0.7152, 0.0722));
  let exposure = max(bloomExtract.exposure * exp2(bloomExtract.exposureCompensation), 0.0001);
  let threshold = bloomExtract.threshold / exposure;
  let knee = max(threshold * bloomExtract.softKnee, 0.00001);
  let soft = clamp((luminance - threshold + knee) / (2.0 * knee), 0.0, 1.0);
  let softContribution = soft * soft * knee;
  let hardContribution = max(luminance - threshold, 0.0);
  let bloomContribution = max(hardContribution, softContribution) / max(luminance, 0.00001);
  return vec4f(sourceColor.rgb * bloomContribution, sourceColor.a * bloomContribution);
}

fn bloomExtract_loadColor(sourceTexture: texture_2d<f32>, coordinate: vec2i) -> vec4f {
  let maximumCoordinate = vec2i(textureDimensions(sourceTexture)) - vec2i(1);
  return textureLoad(sourceTexture, clamp(coordinate, vec2i(0), maximumCoordinate), 0);
}

fn bloomExtract_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceDimensions = vec2i(textureDimensions(sourceTexture));
  let sourceCenter = texCoord * vec2f(sourceDimensions) - vec2f(0.5);
  let sourceFootprint = max(
    (abs(dpdx(texCoord)) + abs(dpdy(texCoord))) * vec2f(sourceDimensions),
    vec2f(1.0)
  );
  let filterRadius = max(sourceFootprint, vec2f(2.0));
  let minimumCoordinate = vec2i(floor(sourceCenter - filterRadius)) + vec2i(1);
  let maximumCoordinate = vec2i(ceil(sourceCenter + filterRadius)) - vec2i(1);
  var color = vec4f(0.0);
  var totalWeight = 0.0;

  // The tent radius follows the actual source-to-target ratio so reduced-resolution pyramids do
  // not leave unsampled bands. At the default half resolution this is the original 4x4 tent.
  for (var sourceY = minimumCoordinate.y; sourceY <= maximumCoordinate.y; sourceY += 1) {
    let weightY = max(1.0 - abs(f32(sourceY) - sourceCenter.y) / filterRadius.y, 0.0);
    for (var sourceX = minimumCoordinate.x; sourceX <= maximumCoordinate.x; sourceX += 1) {
      let weightX = max(1.0 - abs(f32(sourceX) - sourceCenter.x) / filterRadius.x, 0.0);
      let sourceColor = bloomExtract_loadColor(
        sourceTexture,
        vec2i(sourceX, sourceY)
      );
      let luminance = dot(sourceColor.rgb, vec3f(0.2126, 0.7152, 0.0722));
      let fireflyWeight = mix(
        1.0,
        1.0 / (1.0 + max(luminance, 0.0)),
        clamp(bloomExtract.fireflyReduction, 0.0, 1.0)
      );
      let weight = weightX * weightY * fireflyWeight;
      color += bloomExtract_applyThreshold(sourceColor) * weight;
      totalWeight += weight;
    }
  }

  return color / max(totalWeight, 0.00001);
}
`,
  fs: /* glsl */ `
layout(std140) uniform bloomExtractUniforms {
  float threshold;
  float softKnee;
  float fireflyReduction;
  float exposure;
  float exposureCompensation;
} bloomExtract;

vec4 bloomExtract_applyThreshold(vec4 sourceColor) {
  float luminance = dot(sourceColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float exposure = max(bloomExtract.exposure * exp2(bloomExtract.exposureCompensation), 0.0001);
  float threshold = bloomExtract.threshold / exposure;
  float knee = max(threshold * bloomExtract.softKnee, 0.00001);
  float soft = clamp((luminance - threshold + knee) / (2.0 * knee), 0.0, 1.0);
  float softContribution = soft * soft * knee;
  float hardContribution = max(luminance - threshold, 0.0);
  float bloomContribution = max(hardContribution, softContribution) / max(luminance, 0.00001);
  return vec4(sourceColor.rgb * bloomContribution, sourceColor.a * bloomContribution);
}

vec4 bloomExtract_loadColor(sampler2D sourceTexture, ivec2 coordinate) {
  ivec2 maximumCoordinate = textureSize(sourceTexture, 0) - ivec2(1);
  return texelFetch(sourceTexture, clamp(coordinate, ivec2(0), maximumCoordinate), 0);
}

vec4 bloomExtract_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  ivec2 sourceDimensions = textureSize(sourceTexture, 0);
  vec2 sourceCenter = texCoord * vec2(sourceDimensions) - vec2(0.5);
  vec2 sourceFootprint = max(
    (abs(dFdx(texCoord)) + abs(dFdy(texCoord))) * vec2(sourceDimensions),
    vec2(1.0)
  );
  vec2 filterRadius = max(sourceFootprint, vec2(2.0));
  ivec2 minimumCoordinate = ivec2(floor(sourceCenter - filterRadius)) + ivec2(1);
  ivec2 maximumCoordinate = ivec2(ceil(sourceCenter + filterRadius)) - ivec2(1);
  vec4 color = vec4(0.0);
  float totalWeight = 0.0;

  // Keep this kernel identical to the WGSL path so WebGL and WebGPU conserve the same energy.
  for (int sourceY = minimumCoordinate.y; sourceY <= maximumCoordinate.y; sourceY++) {
    float weightY = max(1.0 - abs(float(sourceY) - sourceCenter.y) / filterRadius.y, 0.0);
    for (int sourceX = minimumCoordinate.x; sourceX <= maximumCoordinate.x; sourceX++) {
      float weightX = max(1.0 - abs(float(sourceX) - sourceCenter.x) / filterRadius.x, 0.0);
      vec4 sourceColor = bloomExtract_loadColor(
        sourceTexture,
        ivec2(sourceX, sourceY)
      );
      float luminance = dot(sourceColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      float fireflyWeight = mix(
        1.0,
        1.0 / (1.0 + max(luminance, 0.0)),
        clamp(bloomExtract.fireflyReduction, 0.0, 1.0)
      );
      float weight = weightX * weightY * fireflyWeight;
      color += bloomExtract_applyThreshold(sourceColor) * weight;
      totalWeight += weight;
    }
  }

  return color / max(totalWeight, 0.00001);
}
`,
  uniformTypes: {
    threshold: 'f32',
    softKnee: 'f32',
    fireflyReduction: 'f32',
    exposure: 'f32',
    exposureCompensation: 'f32'
  },
  defaultUniforms: {
    threshold: 0.8,
    softKnee: 0.5,
    fireflyReduction: 0,
    exposure: 1,
    exposureCompensation: 0
  },
  propTypes: {
    threshold: {value: 0.8, min: 0, max: 1},
    softKnee: {value: 0.5, min: 0, max: 1},
    fireflyReduction: {value: 0, min: 0, max: 1},
    exposure: {value: 1, min: 0.0001, softMax: 8},
    exposureCompensation: {value: 0, min: -8, max: 8}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Pick<
    BloomCompositeShaderPassOptions,
    'threshold' | 'softKnee' | 'fireflyReduction' | 'exposure' | 'exposureCompensation'
  >,
  Pick<BloomUniforms, 'threshold'> & {
    softKnee?: number;
    fireflyReduction?: number;
    exposure?: number;
    exposureCompensation?: number;
  }
>;

const bloomDownsamplePass = {
  name: 'bloomDownsample',
  source: /* wgsl */ `
fn bloomDownsample_loadColor(sourceTexture: texture_2d<f32>, coordinate: vec2i) -> vec4f {
  let maximumCoordinate = vec2i(textureDimensions(sourceTexture)) - vec2i(1);
  return textureLoad(sourceTexture, clamp(coordinate, vec2i(0), maximumCoordinate), 0);
}

fn bloomDownsample_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceDimensions = vec2i(textureDimensions(sourceTexture));
  let sourceCenter = texCoord * vec2f(sourceDimensions) - vec2f(0.5);
  let sourceFootprint = max(
    (abs(dpdx(texCoord)) + abs(dpdy(texCoord))) * vec2f(sourceDimensions),
    vec2f(1.0)
  );
  let filterRadius = max(sourceFootprint, vec2f(2.0));
  let minimumCoordinate = vec2i(floor(sourceCenter - filterRadius)) + vec2i(1);
  let maximumCoordinate = vec2i(ceil(sourceCenter + filterRadius)) - vec2i(1);
  var color = vec4f(0.0);
  var totalWeight = 0.0;

  for (var sourceY = minimumCoordinate.y; sourceY <= maximumCoordinate.y; sourceY += 1) {
    let weightY = max(1.0 - abs(f32(sourceY) - sourceCenter.y) / filterRadius.y, 0.0);
    for (var sourceX = minimumCoordinate.x; sourceX <= maximumCoordinate.x; sourceX += 1) {
      let weightX = max(1.0 - abs(f32(sourceX) - sourceCenter.x) / filterRadius.x, 0.0);
      let weight = weightX * weightY;
      color += bloomDownsample_loadColor(
        sourceTexture,
        vec2i(sourceX, sourceY)
      ) * weight;
      totalWeight += weight;
    }
  }

  return color / max(totalWeight, 0.00001);
}
`,
  fs: /* glsl */ `
vec4 bloomDownsample_loadColor(sampler2D sourceTexture, ivec2 coordinate) {
  ivec2 maximumCoordinate = textureSize(sourceTexture, 0) - ivec2(1);
  return texelFetch(sourceTexture, clamp(coordinate, ivec2(0), maximumCoordinate), 0);
}

vec4 bloomDownsample_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  ivec2 sourceDimensions = textureSize(sourceTexture, 0);
  vec2 sourceCenter = texCoord * vec2(sourceDimensions) - vec2(0.5);
  vec2 sourceFootprint = max(
    (abs(dFdx(texCoord)) + abs(dFdy(texCoord))) * vec2(sourceDimensions),
    vec2(1.0)
  );
  vec2 filterRadius = max(sourceFootprint, vec2(2.0));
  ivec2 minimumCoordinate = ivec2(floor(sourceCenter - filterRadius)) + ivec2(1);
  ivec2 maximumCoordinate = ivec2(ceil(sourceCenter + filterRadius)) - ivec2(1);
  vec4 color = vec4(0.0);
  float totalWeight = 0.0;

  for (int sourceY = minimumCoordinate.y; sourceY <= maximumCoordinate.y; sourceY++) {
    float weightY = max(1.0 - abs(float(sourceY) - sourceCenter.y) / filterRadius.y, 0.0);
    for (int sourceX = minimumCoordinate.x; sourceX <= maximumCoordinate.x; sourceX++) {
      float weightX = max(1.0 - abs(float(sourceX) - sourceCenter.x) / filterRadius.x, 0.0);
      float weight = weightX * weightY;
      color += bloomDownsample_loadColor(
        sourceTexture,
        ivec2(sourceX, sourceY)
      ) * weight;
      totalWeight += weight;
    }
  }

  return color / max(totalWeight, 0.00001);
}
`,
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

const bloomBlurPass = {
  name: 'bloomBlur',
  source: /* wgsl */ `
const BLOOM_BLUR_MAX_RADIUS = ${MAX_BLOOM_BLUR_RADIUS}.0;
const BLOOM_BLUR_MAX_PAIRS = ${Math.ceil(MAX_BLOOM_BLUR_RADIUS / 2)};

struct bloomBlurUniforms {
  radius: f32,
  delta: vec2f,
};

@group(0) @binding(auto) var<uniform> bloomBlur: bloomBlurUniforms;

fn bloomBlur_applySample(color: vec4f) -> vec4f {
  return color;
}

fn bloomBlur_getEffectiveRadius() -> f32 {
  return clamp(bloomBlur.radius, 0.0, BLOOM_BLUR_MAX_RADIUS);
}

fn bloomBlur_getSigma(radius: f32) -> f32 {
  return max(radius / 3.0, 0.00001);
}

fn bloomBlur_getWeight(offset: f32, sigma: f32) -> f32 {
  let normalizedOffset = offset / sigma;
  return exp(-0.5 * normalizedOffset * normalizedOffset);
}

fn bloomBlur_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let effectiveRadius = bloomBlur_getEffectiveRadius();
  if (effectiveRadius <= 0.0) {
    return textureSample(sourceTexture, sourceTextureSampler, texCoord);
  }

  let adjustedDelta = bloomBlur.delta / texSize;
  let sigma = bloomBlur_getSigma(effectiveRadius);
  let centerWeight = bloomBlur_getWeight(0.0, sigma);

  var color = vec4f(0.0);
  var totalWeight = centerWeight;

  let centerColor = bloomBlur_applySample(
    textureSample(sourceTexture, sourceTextureSampler, texCoord)
  );
  color += centerColor * centerWeight;

  for (var pairIndex = 0; pairIndex < BLOOM_BLUR_MAX_PAIRS; pairIndex += 1) {
    let firstOffset = f32(pairIndex * 2 + 1);
    if (firstOffset > effectiveRadius) {
      continue;
    }

    let secondOffset = firstOffset + 1.0;
    let firstWeight = bloomBlur_getWeight(firstOffset, sigma);
    let secondWeight =
      select(0.0, bloomBlur_getWeight(secondOffset, sigma), secondOffset <= effectiveRadius);
    let combinedWeight = firstWeight + secondWeight;
    let combinedOffset =
      (firstOffset * firstWeight + secondOffset * secondWeight) / max(combinedWeight, 0.00001);

    let positiveColor = bloomBlur_applySample(
      textureSample(sourceTexture, sourceTextureSampler, texCoord + adjustedDelta * combinedOffset)
    );
    let negativeColor = bloomBlur_applySample(
      textureSample(sourceTexture, sourceTextureSampler, texCoord - adjustedDelta * combinedOffset)
    );

    color += (positiveColor + negativeColor) * combinedWeight;
    totalWeight += combinedWeight * 2.0;
  }

  return color / totalWeight;
}
`,
  fs: /* glsl */ `
#define BLOOM_BLUR_MAX_RADIUS ${MAX_BLOOM_BLUR_RADIUS}.0
#define BLOOM_BLUR_MAX_PAIRS ${Math.ceil(MAX_BLOOM_BLUR_RADIUS / 2)}

layout(std140) uniform bloomBlurUniforms {
  float radius;
  vec2 delta;
} bloomBlur;

vec4 bloomBlur_applySample(vec4 color) {
  return color;
}

float bloomBlur_getEffectiveRadius() {
  return clamp(bloomBlur.radius, 0.0, BLOOM_BLUR_MAX_RADIUS);
}

float bloomBlur_getSigma(float radius) {
  return max(radius / 3.0, 0.00001);
}

float bloomBlur_getWeight(float offset, float sigma) {
  float normalizedOffset = offset / sigma;
  return exp(-0.5 * normalizedOffset * normalizedOffset);
}

vec4 bloomBlur_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  float effectiveRadius = bloomBlur_getEffectiveRadius();
  if (effectiveRadius <= 0.0) {
    return texture(sourceTexture, texCoord);
  }

  vec2 adjustedDelta = bloomBlur.delta / texSize;
  float sigma = bloomBlur_getSigma(effectiveRadius);
  float centerWeight = bloomBlur_getWeight(0.0, sigma);

  vec4 color = vec4(0.0);
  float totalWeight = centerWeight;

  vec4 centerColor = bloomBlur_applySample(texture(sourceTexture, texCoord));
  color += centerColor * centerWeight;

  for (int pairIndex = 0; pairIndex < BLOOM_BLUR_MAX_PAIRS; pairIndex++) {
    float firstOffset = float(pairIndex * 2 + 1);
    if (firstOffset > effectiveRadius) {
      continue;
    }

    float secondOffset = firstOffset + 1.0;
    float firstWeight = bloomBlur_getWeight(firstOffset, sigma);
    float secondWeight = secondOffset <= effectiveRadius ? bloomBlur_getWeight(secondOffset, sigma) : 0.0;
    float combinedWeight = firstWeight + secondWeight;
    float combinedOffset =
      (firstOffset * firstWeight + secondOffset * secondWeight) / max(combinedWeight, 0.00001);

    vec4 positiveColor = bloomBlur_applySample(texture(sourceTexture, texCoord + adjustedDelta * combinedOffset));
    vec4 negativeColor = bloomBlur_applySample(texture(sourceTexture, texCoord - adjustedDelta * combinedOffset));
    color += (positiveColor + negativeColor) * combinedWeight;
    totalWeight += combinedWeight * 2.0;
  }

  color /= totalWeight;
  return color;
}
`,
  uniformTypes: {
    radius: 'f32',
    delta: 'vec2<f32>'
  },
  propTypes: {
    radius: {value: 8, min: 0, max: MAX_BLOOM_BLUR_RADIUS, softMax: MAX_BLOOM_BLUR_RADIUS},
    delta: {value: [1, 0], private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Pick<BloomProps, 'radius'> & {delta?: [number, number]},
  Pick<BloomUniforms, 'radius'> & {delta?: [number, number]}
>;

type BloomUpsampleBindings = {
  higherResolutionGlow?: Texture;
};

const bloomUpsamplePass = {
  name: 'bloomUpsample',
  source: /* wgsl */ `
struct bloomUpsampleUniforms {
  scatter: f32,
  reconstruction: f32,
};

@group(0) @binding(auto) var<uniform> bloomUpsample: bloomUpsampleUniforms;
@group(0) @binding(auto) var higherResolutionGlow: texture_2d<f32>;
@group(0) @binding(auto) var higherResolutionGlowSampler: sampler;

fn bloomUpsample_sampleLowerGlow(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texCoord: vec2f
) -> vec4f {
  let texel = 1.0 / vec2f(textureDimensions(sourceTexture));
  let horizontalOffset = vec2f(texel.x, 0.0);
  let verticalOffset = vec2f(0.0, texel.y);
  let center = textureSample(sourceTexture, sourceTextureSampler, texCoord) * 4.0;
  let edges = (
    textureSample(sourceTexture, sourceTextureSampler, texCoord - horizontalOffset) +
    textureSample(sourceTexture, sourceTextureSampler, texCoord + horizontalOffset) +
    textureSample(sourceTexture, sourceTextureSampler, texCoord - verticalOffset) +
    textureSample(sourceTexture, sourceTextureSampler, texCoord + verticalOffset)
  ) * 2.0;
  let corners =
    textureSample(sourceTexture, sourceTextureSampler, texCoord - horizontalOffset - verticalOffset) +
    textureSample(sourceTexture, sourceTextureSampler, texCoord + horizontalOffset - verticalOffset) +
    textureSample(sourceTexture, sourceTextureSampler, texCoord - horizontalOffset + verticalOffset) +
    textureSample(sourceTexture, sourceTextureSampler, texCoord + horizontalOffset + verticalOffset);
  return (center + edges + corners) / 16.0;
}

fn bloomUpsample_sampleBicubicGlow(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texCoord: vec2f
) -> vec4f {
  let dimensions = vec2f(textureDimensions(sourceTexture));
  let texelPosition = texCoord * dimensions - vec2f(0.5);
  let basePosition = floor(texelPosition);
  let fraction = fract(texelPosition);
  let complement = vec2f(1.0) - fraction;
  let firstWeight = complement * complement * complement / 6.0;
  let secondWeight =
    (fraction * fraction * fraction * 3.0 - fraction * fraction * 6.0 + vec2f(4.0)) / 6.0;
  let thirdWeight =
    (-fraction * fraction * fraction * 3.0 + fraction * fraction * 3.0 + fraction * 3.0 +
      vec2f(1.0)) / 6.0;
  let fourthWeight = fraction * fraction * fraction / 6.0;
  let firstPairWeight = firstWeight + secondWeight;
  let secondPairWeight = thirdWeight + fourthWeight;
  let firstPosition =
    (basePosition - vec2f(1.0) + secondWeight / firstPairWeight + vec2f(0.5)) / dimensions;
  let secondPosition =
    (basePosition + vec2f(1.0) + fourthWeight / secondPairWeight + vec2f(0.5)) / dimensions;
  let topLeft = textureSampleLevel(
    sourceTexture,
    sourceTextureSampler,
    vec2f(firstPosition.x, firstPosition.y),
    0.0
  );
  let topRight = textureSampleLevel(
    sourceTexture,
    sourceTextureSampler,
    vec2f(secondPosition.x, firstPosition.y),
    0.0
  );
  let bottomLeft = textureSampleLevel(
    sourceTexture,
    sourceTextureSampler,
    vec2f(firstPosition.x, secondPosition.y),
    0.0
  );
  let bottomRight = textureSampleLevel(
    sourceTexture,
    sourceTextureSampler,
    vec2f(secondPosition.x, secondPosition.y),
    0.0
  );
  return topLeft * firstPairWeight.x * firstPairWeight.y +
    topRight * secondPairWeight.x * firstPairWeight.y +
    bottomLeft * firstPairWeight.x * secondPairWeight.y +
    bottomRight * secondPairWeight.x * secondPairWeight.y;
}

fn bloomUpsample_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  var lowerGlow: vec4f;
  if (bloomUpsample.reconstruction > 0.5) {
    lowerGlow = bloomUpsample_sampleBicubicGlow(sourceTexture, sourceTextureSampler, texCoord);
  } else {
    lowerGlow = bloomUpsample_sampleLowerGlow(sourceTexture, sourceTextureSampler, texCoord);
  }
  let higherGlow = textureSample(higherResolutionGlow, higherResolutionGlowSampler, texCoord);
  return mix(higherGlow, lowerGlow, clamp(bloomUpsample.scatter, 0.0, 1.0));
}
`,
  fs: /* glsl */ `
layout(std140) uniform bloomUpsampleUniforms {
  float scatter;
  float reconstruction;
} bloomUpsample;

uniform sampler2D higherResolutionGlow;

vec4 bloomUpsample_sampleLowerGlow(sampler2D sourceTexture, vec2 texCoord) {
  vec2 texel = 1.0 / vec2(textureSize(sourceTexture, 0));
  vec2 horizontalOffset = vec2(texel.x, 0.0);
  vec2 verticalOffset = vec2(0.0, texel.y);
  vec4 center = texture(sourceTexture, texCoord) * 4.0;
  vec4 edges = (
    texture(sourceTexture, texCoord - horizontalOffset) +
    texture(sourceTexture, texCoord + horizontalOffset) +
    texture(sourceTexture, texCoord - verticalOffset) +
    texture(sourceTexture, texCoord + verticalOffset)
  ) * 2.0;
  vec4 corners =
    texture(sourceTexture, texCoord - horizontalOffset - verticalOffset) +
    texture(sourceTexture, texCoord + horizontalOffset - verticalOffset) +
    texture(sourceTexture, texCoord - horizontalOffset + verticalOffset) +
    texture(sourceTexture, texCoord + horizontalOffset + verticalOffset);
  return (center + edges + corners) / 16.0;
}

vec4 bloomUpsample_sampleBicubicGlow(sampler2D sourceTexture, vec2 texCoord) {
  vec2 dimensions = vec2(textureSize(sourceTexture, 0));
  vec2 texelPosition = texCoord * dimensions - vec2(0.5);
  vec2 basePosition = floor(texelPosition);
  vec2 fraction = fract(texelPosition);
  vec2 complement = vec2(1.0) - fraction;
  vec2 firstWeight = complement * complement * complement / 6.0;
  vec2 secondWeight =
    (fraction * fraction * fraction * 3.0 - fraction * fraction * 6.0 + vec2(4.0)) / 6.0;
  vec2 thirdWeight =
    (-fraction * fraction * fraction * 3.0 + fraction * fraction * 3.0 + fraction * 3.0 +
      vec2(1.0)) / 6.0;
  vec2 fourthWeight = fraction * fraction * fraction / 6.0;
  vec2 firstPairWeight = firstWeight + secondWeight;
  vec2 secondPairWeight = thirdWeight + fourthWeight;
  vec2 firstPosition =
    (basePosition - vec2(1.0) + secondWeight / firstPairWeight + vec2(0.5)) / dimensions;
  vec2 secondPosition =
    (basePosition + vec2(1.0) + fourthWeight / secondPairWeight + vec2(0.5)) / dimensions;
  vec4 topLeft = textureLod(sourceTexture, vec2(firstPosition.x, firstPosition.y), 0.0);
  vec4 topRight = textureLod(sourceTexture, vec2(secondPosition.x, firstPosition.y), 0.0);
  vec4 bottomLeft = textureLod(sourceTexture, vec2(firstPosition.x, secondPosition.y), 0.0);
  vec4 bottomRight = textureLod(sourceTexture, vec2(secondPosition.x, secondPosition.y), 0.0);
  return topLeft * firstPairWeight.x * firstPairWeight.y +
    topRight * secondPairWeight.x * firstPairWeight.y +
    bottomLeft * firstPairWeight.x * secondPairWeight.y +
    bottomRight * secondPairWeight.x * secondPairWeight.y;
}

vec4 bloomUpsample_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec4 lowerGlow;
  if (bloomUpsample.reconstruction > 0.5) {
    lowerGlow = bloomUpsample_sampleBicubicGlow(sourceTexture, texCoord);
  } else {
    lowerGlow = bloomUpsample_sampleLowerGlow(sourceTexture, texCoord);
  }
  vec4 higherGlow = texture(higherResolutionGlow, texCoord);
  return mix(higherGlow, lowerGlow, clamp(bloomUpsample.scatter, 0.0, 1.0));
}
`,
  bindingLayout: [{name: 'higherResolutionGlow', group: 0}],
  uniforms: {} as {scatter?: number; reconstruction?: number},
  bindings: {} as BloomUpsampleBindings,
  uniformTypes: {scatter: 'f32', reconstruction: 'f32'},
  defaultUniforms: {scatter: 0.55, reconstruction: 0},
  propTypes: {
    scatter: {value: 0.55, min: 0, max: 1},
    reconstruction: {value: 0, min: 0, max: 1, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  {scatter?: number; reconstruction?: number} & BloomUpsampleBindings,
  {scatter?: number; reconstruction?: number},
  BloomUpsampleBindings
>;

type BloomCompositeBindings = {
  glowHalf?: Texture;
  glowQuarter?: Texture;
  glowEighth?: Texture;
};

const bloomCompositePass = {
  name: 'bloomComposite',
  source: /* wgsl */ `
struct bloomCompositeUniforms {
  intensity: f32,
};

@group(0) @binding(auto) var<uniform> bloomComposite: bloomCompositeUniforms;
@group(0) @binding(auto) var glowHalf: texture_2d<f32>;
@group(0) @binding(auto) var glowHalfSampler: sampler;
@group(0) @binding(auto) var glowQuarter: texture_2d<f32>;
@group(0) @binding(auto) var glowQuarterSampler: sampler;
@group(0) @binding(auto) var glowEighth: texture_2d<f32>;
@group(0) @binding(auto) var glowEighthSampler: sampler;

fn bloomComposite_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let halfGlow = textureSample(glowHalf, glowHalfSampler, texCoord).rgb;
  let quarterGlow = textureSample(glowQuarter, glowQuarterSampler, texCoord).rgb;
  let eighthGlow = textureSample(glowEighth, glowEighthSampler, texCoord).rgb;
  let glowColor = halfGlow * 0.50 + quarterGlow * 0.32 + eighthGlow * 0.18;
  return vec4f(sourceColor.rgb + glowColor * bloomComposite.intensity, sourceColor.a);
}
`,
  fs: /* glsl */ `
layout(std140) uniform bloomCompositeUniforms {
  float intensity;
} bloomComposite;

uniform sampler2D glowHalf;
uniform sampler2D glowQuarter;
uniform sampler2D glowEighth;

vec4 bloomComposite_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec4 sourceColor = texture(sourceTexture, texCoord);
  vec3 halfGlow = texture(glowHalf, texCoord).rgb;
  vec3 quarterGlow = texture(glowQuarter, texCoord).rgb;
  vec3 eighthGlow = texture(glowEighth, texCoord).rgb;
  vec3 glowColor = halfGlow * 0.50 + quarterGlow * 0.32 + eighthGlow * 0.18;
  return vec4(sourceColor.rgb + glowColor * bloomComposite.intensity, sourceColor.a);
}
`,
  bindingLayout: [
    {name: 'glowHalf', group: 0},
    {name: 'glowQuarter', group: 0},
    {name: 'glowEighth', group: 0}
  ],
  uniforms: {} as Pick<BloomUniforms, 'intensity'>,
  bindings: {} as BloomCompositeBindings,
  uniformTypes: {
    intensity: 'f32'
  },
  propTypes: {
    intensity: {value: 1, min: 0, softMax: 3}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Pick<BloomProps, 'intensity'> & BloomCompositeBindings,
  Pick<BloomUniforms, 'intensity'>,
  BloomCompositeBindings
>;

type BloomAdaptiveCompositeBindings = {
  glowTexture?: Texture;
};

type BloomAdaptiveCompositeUniforms = {
  tint?: [number, number, number];
  intensity?: number;
  energyConserving?: number;
};

const bloomAdaptiveCompositePass = {
  name: 'bloomComposite',
  source: /* wgsl */ `
struct bloomCompositeUniforms {
  tint: vec3f,
  intensity: f32,
  energyConserving: f32,
};

@group(0) @binding(auto) var<uniform> bloomComposite: bloomCompositeUniforms;
@group(0) @binding(auto) var glowTexture: texture_2d<f32>;
@group(0) @binding(auto) var glowTextureSampler: sampler;

fn bloomComposite_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let glowColor = textureSample(glowTexture, glowTextureSampler, texCoord).rgb;
  let tintedGlow = glowColor * bloomComposite.tint * bloomComposite.intensity;
  let additiveColor = sourceColor.rgb + tintedGlow;
  let physicalColor = mix(
    sourceColor.rgb,
    glowColor * bloomComposite.tint,
    clamp(bloomComposite.intensity, 0.0, 1.0)
  );
  return vec4f(
    select(additiveColor, physicalColor, bloomComposite.energyConserving > 0.5),
    sourceColor.a
  );
}
`,
  fs: /* glsl */ `
layout(std140) uniform bloomCompositeUniforms {
  vec3 tint;
  float intensity;
  float energyConserving;
} bloomComposite;

uniform sampler2D glowTexture;

vec4 bloomComposite_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec4 sourceColor = texture(sourceTexture, texCoord);
  vec3 glowColor = texture(glowTexture, texCoord).rgb;
  vec3 tintedGlow = glowColor * bloomComposite.tint * bloomComposite.intensity;
  vec3 additiveColor = sourceColor.rgb + tintedGlow;
  vec3 physicalColor = mix(
    sourceColor.rgb,
    glowColor * bloomComposite.tint,
    clamp(bloomComposite.intensity, 0.0, 1.0)
  );
  return vec4(
    bloomComposite.energyConserving > 0.5 ? physicalColor : additiveColor,
    sourceColor.a
  );
}
`,
  bindingLayout: [{name: 'glowTexture', group: 0}],
  uniforms: {} as BloomAdaptiveCompositeUniforms,
  bindings: {} as BloomAdaptiveCompositeBindings,
  uniformTypes: {
    tint: 'vec3<f32>',
    intensity: 'f32',
    energyConserving: 'f32'
  },
  defaultUniforms: {
    tint: [1, 1, 1] as [number, number, number],
    intensity: 1,
    energyConserving: 0
  },
  propTypes: {
    tint: {value: [1, 1, 1] as [number, number, number]},
    intensity: {value: 1, min: 0, softMax: 3},
    energyConserving: {value: 0, min: 0, max: 1, private: true}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  BloomAdaptiveCompositeUniforms & BloomAdaptiveCompositeBindings,
  BloomAdaptiveCompositeUniforms,
  BloomAdaptiveCompositeBindings
>;

/**
 * BloomCompositeShaderPass
 * Extracts bright pixels at half resolution, successively downsamples and blurs them, and
 * composites the multiscale glow over the preceding effect output.
 */
export const bloomCompositeShaderPass = {
  name: 'bloomCompositeShaderPass',
  renderTargets: {
    extractHalf: {scale: [0.5, 0.5], sampler: BLOOM_TARGET_SAMPLER},
    blurHalfScratch: {scale: [0.5, 0.5], sampler: BLOOM_TARGET_SAMPLER},
    blurHalf: {scale: [0.5, 0.5], sampler: BLOOM_TARGET_SAMPLER},
    extractQuarter: {scale: [0.25, 0.25], sampler: BLOOM_TARGET_SAMPLER},
    blurQuarterScratch: {scale: [0.25, 0.25], sampler: BLOOM_TARGET_SAMPLER},
    blurQuarter: {scale: [0.25, 0.25], sampler: BLOOM_TARGET_SAMPLER},
    extractEighth: {scale: [0.125, 0.125], sampler: BLOOM_TARGET_SAMPLER},
    blurEighthScratch: {scale: [0.125, 0.125], sampler: BLOOM_TARGET_SAMPLER},
    blurEighth: {scale: [0.125, 0.125], sampler: BLOOM_TARGET_SAMPLER}
  },
  steps: [
    {
      shaderPass: bloomExtractPass,
      inputs: {sourceTexture: 'previous'},
      output: 'extractHalf',
      uniforms: {threshold: 0.8}
    },
    {
      shaderPass: bloomBlurPass,
      inputs: {sourceTexture: 'extractHalf'},
      output: 'blurHalfScratch',
      uniforms: {radius: 8, delta: [1, 0]}
    },
    {
      shaderPass: bloomBlurPass,
      inputs: {sourceTexture: 'blurHalfScratch'},
      output: 'blurHalf',
      uniforms: {radius: 8, delta: [0, 1]}
    },
    {
      shaderPass: bloomDownsamplePass,
      inputs: {sourceTexture: 'extractHalf'},
      output: 'extractQuarter'
    },
    {
      shaderPass: bloomBlurPass,
      inputs: {sourceTexture: 'extractQuarter'},
      output: 'blurQuarterScratch',
      uniforms: {radius: 8, delta: [1, 0]}
    },
    {
      shaderPass: bloomBlurPass,
      inputs: {sourceTexture: 'blurQuarterScratch'},
      output: 'blurQuarter',
      uniforms: {radius: 8, delta: [0, 1]}
    },
    {
      shaderPass: bloomDownsamplePass,
      inputs: {sourceTexture: 'extractQuarter'},
      output: 'extractEighth'
    },
    {
      shaderPass: bloomBlurPass,
      inputs: {sourceTexture: 'extractEighth'},
      output: 'blurEighthScratch',
      uniforms: {radius: 8, delta: [1, 0]}
    },
    {
      shaderPass: bloomBlurPass,
      inputs: {sourceTexture: 'blurEighthScratch'},
      output: 'blurEighth',
      uniforms: {radius: 8, delta: [0, 1]}
    },
    {
      shaderPass: bloomCompositePass,
      inputs: {
        sourceTexture: 'previous',
        glowHalf: 'blurHalf',
        glowQuarter: 'blurQuarter',
        glowEighth: 'blurEighth'
      },
      output: 'previous',
      uniforms: {intensity: 1}
    }
  ]
} as const satisfies CompositeShaderPass<BloomTargetName>;

/** Creates configurable multiscale bloom that preserves high-dynamic-range radiance. */
export function createBloomCompositeShaderPass(
  options: BloomCompositeShaderPassOptions = {}
): CompositeShaderPass {
  const resolutionScale = options.resolutionScale ?? 1;
  const colorFormat = options.colorFormat ?? 'rgba16float';
  const energyConserving = options.energyConserving ?? false;
  const threshold = energyConserving ? 0 : (options.threshold ?? 0.8);
  const radius = options.radius ?? 8;
  const intensity = options.intensity ?? 1;
  const quality = options.quality ?? 'high';
  const scatter = options.scatter ?? 0.55;
  const softKnee = options.softKnee ?? 0.5;
  const fireflyReduction = options.fireflyReduction ?? 0;
  const exposure = Math.max(options.exposure ?? 1, 0.0001);
  const exposureCompensation = options.exposureCompensation ?? 0;
  const reconstruction = options.reconstruction === 'bicubic' ? 1 : 0;
  const downsample = options.downsample ?? 'auto';
  const reuseRenderTargets = options.reuseRenderTargets ?? true;
  const blurAlgorithm = options.blurAlgorithm ?? 'gaussian';
  const anamorphicRatio = Math.min(Math.max(options.anamorphicRatio ?? 0, -1), 1);
  const tint = options.tint ?? [1, 1, 1];
  const temporalStability = Math.min(Math.max(options.temporalStability ?? 0, 0), 0.95);
  const temporalReprojection = options.temporalReprojection ?? false;
  const temporalDepthThreshold = Math.max(options.temporalDepthThreshold ?? 0.01, 0.0001);
  const previousExposure = Math.max(options.previousExposure ?? exposure, 0.0001);
  const lens = options.lens;
  const starburstIntensity = Math.max(lens?.starburstIntensity ?? 0, 0);
  const starburstSpikes = Math.min(
    Math.max(Math.round((lens?.starburstSpikes ?? 4) / 2) * 2, 2),
    MAX_BLOOM_LENS_SPIKES
  );
  const starburstLength = Math.min(Math.max(lens?.starburstLength ?? 48, 0), 256);
  const starburstRotation = lens?.starburstRotation ?? 0;
  const ghostIntensity = Math.max(lens?.ghostIntensity ?? 0, 0);
  const ghostCount = Math.min(
    Math.max(Math.round(lens?.ghostCount ?? 3), 1),
    MAX_BLOOM_LENS_GHOSTS
  );
  const ghostSpacing = Math.min(Math.max(lens?.ghostSpacing ?? 0.32, 0), 1);
  const haloIntensity = Math.max(lens?.haloIntensity ?? 0, 0);
  const haloRadius = Math.min(Math.max(lens?.haloRadius ?? 0.34, 0), 1);
  const chromaticAberration = Math.min(Math.max(lens?.chromaticAberration ?? 0, 0), 1);
  const dirtIntensity = Math.max(lens?.dirtIntensity ?? 0, 0);
  const hasLensArtifacts = starburstIntensity > 0 || ghostIntensity > 0 || haloIntensity > 0;
  const hasLensDirt = dirtIntensity > 0;
  const anamorphicRadius = Math.min(
    radius,
    MAX_BLOOM_BLUR_RADIUS / (1 + Math.abs(anamorphicRatio))
  );
  const horizontalRadius = anamorphicRadius * (1 + Math.max(anamorphicRatio, 0));
  const verticalRadius = anamorphicRadius * (1 + Math.max(-anamorphicRatio, 0));
  const levels = BLOOM_PYRAMID_LEVELS.slice(0, BLOOM_QUALITY_LEVELS[quality]);
  const renderTargets: Record<string, ShaderPassRenderTarget> = {};
  const steps: CompositeShaderPassStep[] = [];
  const makeRenderTarget = (scale: number): ShaderPassRenderTarget => ({
    scale: [scale * resolutionScale, scale * resolutionScale],
    format: colorFormat,
    sampler: BLOOM_TARGET_SAMPLER
  });

  for (const [levelIndex, level] of levels.entries()) {
    const extractionTarget = `extract${level.name}`;
    const blurScratchTarget = `blur${level.name}Scratch`;
    const blurTarget = `blur${level.name}`;
    renderTargets[extractionTarget] = {
      ...makeRenderTarget(level.scale),
      ...(downsample !== 'render' ? {storage: true} : {})
    };
    if (blurAlgorithm === 'gaussian') {
      renderTargets[blurScratchTarget] = makeRenderTarget(level.scale);
      renderTargets[blurTarget] = makeRenderTarget(level.scale);
    }

    if (levelIndex === 0) {
      steps.push({
        shaderPass: bloomExtractPass,
        inputs: {sourceTexture: 'previous'},
        output: extractionTarget,
        uniforms: {threshold, softKnee, fireflyReduction, exposure, exposureCompensation}
      });
    } else {
      const previousLevel = levels[levelIndex - 1];
      steps.push({
        shaderPass: bloomDownsamplePass,
        inputs: {sourceTexture: `extract${previousLevel.name}`},
        output: extractionTarget
      });
    }

    if (blurAlgorithm === 'gaussian') {
      steps.push(
        {
          shaderPass: bloomBlurPass,
          inputs: {sourceTexture: extractionTarget},
          output: blurScratchTarget,
          uniforms: {radius: horizontalRadius, delta: [1, 0]}
        },
        {
          shaderPass: bloomBlurPass,
          inputs: {sourceTexture: blurScratchTarget},
          output: blurTarget,
          uniforms: {radius: verticalRadius, delta: [0, 1]}
        }
      );
    }
  }

  const getLevelGlow = (levelName: string): string =>
    `${blurAlgorithm === 'gaussian' ? 'blur' : 'extract'}${levelName}`;
  let reconstructedGlow = getLevelGlow(levels[levels.length - 1].name);
  for (let levelIndex = levels.length - 2; levelIndex >= 0; levelIndex--) {
    const level = levels[levelIndex];
    const upsampleTarget = `upsample${level.name}`;
    renderTargets[upsampleTarget] = {
      ...makeRenderTarget(level.scale),
      ...(reuseRenderTargets &&
      blurAlgorithm === 'gaussian' &&
      (!hasLensArtifacts || level.name !== 'Half')
        ? {aliasFor: `extract${level.name}`}
        : {})
    };
    steps.push({
      shaderPass: bloomUpsamplePass,
      inputs: {
        sourceTexture: reconstructedGlow,
        higherResolutionGlow: getLevelGlow(level.name)
      },
      output: upsampleTarget,
      uniforms: {scatter, reconstruction}
    });
    reconstructedGlow = upsampleTarget;
  }

  if (temporalStability > 0) {
    renderTargets['bloomGlowHistory'] = {
      ...makeRenderTarget(0.5),
      lifetime: 'history',
      initialize: {clearColor: [0, 0, 0, 0]}
    };
    steps.push({
      shaderPass: createBloomTemporalPass(temporalReprojection),
      inputs: {sourceTexture: reconstructedGlow, historyTexture: 'bloomGlowHistory'},
      output: 'bloomGlowHistory',
      uniforms: {
        stability: temporalStability,
        depthThreshold: temporalDepthThreshold,
        exposureScale: exposure / previousExposure
      }
    });
    reconstructedGlow = 'bloomGlowHistory';
  }

  if (hasLensArtifacts) {
    renderTargets['bloomLensArtifacts'] = makeRenderTarget(0.5);
    steps.push({
      shaderPass: bloomLensArtifactsPass,
      inputs: {sourceTexture: 'extractHalf', glowTexture: reconstructedGlow},
      output: 'bloomLensArtifacts',
      uniforms: {
        starburstIntensity,
        starburstSpikes,
        starburstLength,
        starburstRotation,
        ghostIntensity,
        ghostCount,
        ghostSpacing,
        haloIntensity,
        haloRadius,
        chromaticAberration
      }
    });
  }

  if (hasLensArtifacts || hasLensDirt) {
    steps.push({
      shaderPass: createBloomLensCompositePass(hasLensArtifacts, hasLensDirt),
      inputs: {
        sourceTexture: 'previous',
        glowTexture: reconstructedGlow,
        ...(hasLensArtifacts ? {lensTexture: 'bloomLensArtifacts'} : {})
      },
      output: 'previous',
      uniforms: {tint, intensity, dirtIntensity, energyConserving: Number(energyConserving)}
    });
  } else {
    steps.push({
      shaderPass: bloomAdaptiveCompositePass,
      inputs: {sourceTexture: 'previous', glowTexture: reconstructedGlow},
      output: 'previous',
      uniforms: {tint, intensity, energyConserving: Number(energyConserving)}
    });
  }

  return {
    name: bloomCompositeShaderPass.name,
    renderTargets,
    steps,
    ...(downsample !== 'render'
      ? {
          compute: createBloomComputePyramid({
            levelNames: levels.map(level => level.name),
            colorFormat,
            threshold,
            softKnee,
            fireflyReduction,
            exposure,
            exposureCompensation
          })
        }
      : {})
  };
}
