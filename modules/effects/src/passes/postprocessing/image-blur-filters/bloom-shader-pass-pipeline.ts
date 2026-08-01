// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderPass, ShaderPassPipeline, ShaderPassRenderTarget} from '@luma.gl/shadertools';
import type {BloomProps, BloomUniforms} from './bloom';

const MAX_BLOOM_BLUR_RADIUS = 24;
const BLOOM_TARGET_SAMPLER = {minFilter: 'linear', magFilter: 'linear'} as const;

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
export type BloomShaderPassPipelineOptions = {
  /** Fractional size multiplier applied to the half, quarter, and eighth-resolution pyramid. */
  resolutionScale?: number;
  /** Filterable RGBA intermediate format. Defaults to rgba16float for HDR highlight energy. */
  colorFormat?: 'rgba8unorm' | 'rgba16float';
};

const bloomExtractPass = {
  name: 'bloomExtract',
  source: /* wgsl */ `
struct bloomExtractUniforms {
  threshold: f32,
};

@group(0) @binding(auto) var<uniform> bloomExtract: bloomExtractUniforms;

fn bloomExtract_applyThreshold(sourceColor: vec4f) -> vec4f {
  let luminance = dot(sourceColor.rgb, vec3f(0.2126, 0.7152, 0.0722));
  let knee = max(bloomExtract.threshold * 0.5, 0.00001);
  let soft = clamp((luminance - bloomExtract.threshold + knee) / (2.0 * knee), 0.0, 1.0);
  let softContribution = soft * soft * knee;
  let hardContribution = max(luminance - bloomExtract.threshold, 0.0);
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
  let centerTexel = vec2i(floor(sourceCenter));
  var color = vec4f(0.0);

  // A normalized 4x4 tent covers every source texel while attenuating frequencies that would
  // alias at half resolution. Thresholding each source sample keeps isolated HDR highlights.
  for (var offsetY = -1; offsetY <= 2; offsetY += 1) {
    let weightY = select(3.0, 1.0, offsetY == -1 || offsetY == 2);
    for (var offsetX = -1; offsetX <= 2; offsetX += 1) {
      let weightX = select(3.0, 1.0, offsetX == -1 || offsetX == 2);
      let sourceColor = bloomExtract_loadColor(
        sourceTexture,
        centerTexel + vec2i(offsetX, offsetY)
      );
      color += bloomExtract_applyThreshold(sourceColor) * weightX * weightY;
    }
  }

  return color / 64.0;
}
`,
  fs: /* glsl */ `
layout(std140) uniform bloomExtractUniforms {
  float threshold;
} bloomExtract;

vec4 bloomExtract_applyThreshold(vec4 sourceColor) {
  float luminance = dot(sourceColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float knee = max(bloomExtract.threshold * 0.5, 0.00001);
  float soft = clamp((luminance - bloomExtract.threshold + knee) / (2.0 * knee), 0.0, 1.0);
  float softContribution = soft * soft * knee;
  float hardContribution = max(luminance - bloomExtract.threshold, 0.0);
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
  ivec2 centerTexel = ivec2(floor(sourceCenter));
  vec4 color = vec4(0.0);

  // Keep this kernel identical to the WGSL path so WebGL and WebGPU conserve the same energy.
  for (int offsetY = -1; offsetY <= 2; offsetY++) {
    float weightY = offsetY == -1 || offsetY == 2 ? 1.0 : 3.0;
    for (int offsetX = -1; offsetX <= 2; offsetX++) {
      float weightX = offsetX == -1 || offsetX == 2 ? 1.0 : 3.0;
      vec4 sourceColor = bloomExtract_loadColor(
        sourceTexture,
        centerTexel + ivec2(offsetX, offsetY)
      );
      color += bloomExtract_applyThreshold(sourceColor) * weightX * weightY;
    }
  }

  return color / 64.0;
}
`,
  uniformTypes: {
    threshold: 'f32'
  },
  propTypes: {
    threshold: {value: 0.8, min: 0, max: 1}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<Pick<BloomProps, 'threshold'>, Pick<BloomUniforms, 'threshold'>>;

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
  let centerTexel = vec2i(floor(sourceCenter));
  var color = vec4f(0.0);

  for (var offsetY = -1; offsetY <= 2; offsetY += 1) {
    let weightY = select(3.0, 1.0, offsetY == -1 || offsetY == 2);
    for (var offsetX = -1; offsetX <= 2; offsetX += 1) {
      let weightX = select(3.0, 1.0, offsetX == -1 || offsetX == 2);
      color += bloomDownsample_loadColor(
        sourceTexture,
        centerTexel + vec2i(offsetX, offsetY)
      ) * weightX * weightY;
    }
  }

  return color / 64.0;
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
  ivec2 centerTexel = ivec2(floor(sourceCenter));
  vec4 color = vec4(0.0);

  for (int offsetY = -1; offsetY <= 2; offsetY++) {
    float weightY = offsetY == -1 || offsetY == 2 ? 1.0 : 3.0;
    for (int offsetX = -1; offsetX <= 2; offsetX++) {
      float weightX = offsetX == -1 || offsetX == 2 ? 1.0 : 3.0;
      color += bloomDownsample_loadColor(
        sourceTexture,
        centerTexel + ivec2(offsetX, offsetY)
      ) * weightX * weightY;
    }
  }

  return color / 64.0;
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

/**
 * BloomShaderPassPipeline
 * Extracts bright pixels at half resolution, successively downsamples and blurs them, and
 * composites the multiscale glow over the preceding effect output.
 */
export const bloomShaderPassPipeline = {
  name: 'bloomShaderPassPipeline',
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
} as const satisfies ShaderPassPipeline<BloomTargetName>;

/** Creates configurable multiscale bloom that preserves high-dynamic-range radiance. */
export function createBloomShaderPassPipeline(
  options: BloomShaderPassPipelineOptions = {}
): ShaderPassPipeline<BloomTargetName> {
  const resolutionScale = options.resolutionScale ?? 1;
  const colorFormat = options.colorFormat ?? 'rgba16float';
  const makeRenderTarget = (scale: number): ShaderPassRenderTarget => ({
    scale: [scale * resolutionScale, scale * resolutionScale],
    format: colorFormat,
    sampler: BLOOM_TARGET_SAMPLER
  });

  return {
    ...bloomShaderPassPipeline,
    renderTargets: {
      extractHalf: makeRenderTarget(0.5),
      blurHalfScratch: makeRenderTarget(0.5),
      blurHalf: makeRenderTarget(0.5),
      extractQuarter: makeRenderTarget(0.25),
      blurQuarterScratch: makeRenderTarget(0.25),
      blurQuarter: makeRenderTarget(0.25),
      extractEighth: makeRenderTarget(0.125),
      blurEighthScratch: makeRenderTarget(0.125),
      blurEighth: makeRenderTarget(0.125)
    }
  };
}
