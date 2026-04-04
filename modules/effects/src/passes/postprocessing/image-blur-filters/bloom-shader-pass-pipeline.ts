// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';
import type {BloomProps, BloomUniforms} from './bloom';

const MAX_BLOOM_BLUR_RADIUS = 24;

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

const bloomExtractPass = {
  name: 'bloomExtract',
  source: /* wgsl */ `
struct bloomExtractUniforms {
  threshold: f32,
};

@group(0) @binding(auto) var<uniform> bloomExtract: bloomExtractUniforms;

fn bloomExtract_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceColor = textureSample(sourceTexture, sourceTextureSampler, texCoord);
  let luminance = dot(sourceColor.rgb, vec3f(0.2126, 0.7152, 0.0722));
  let knee = max(bloomExtract.threshold * 0.5, 0.00001);
  let soft = clamp((luminance - bloomExtract.threshold + knee) / (2.0 * knee), 0.0, 1.0);
  let softContribution = soft * soft * knee;
  let hardContribution = max(luminance - bloomExtract.threshold, 0.0);
  let bloomContribution = max(hardContribution, softContribution) / max(luminance, 0.00001);
  return vec4f(sourceColor.rgb * bloomContribution, sourceColor.a * bloomContribution);
}
`,
  fs: /* glsl */ `
layout(std140) uniform bloomExtractUniforms {
  float threshold;
} bloomExtract;

vec4 bloomExtract_sampleColor(sampler2D sourceTexture, vec2 texSize, vec2 texCoord) {
  vec4 sourceColor = texture(sourceTexture, texCoord);
  float luminance = dot(sourceColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float knee = max(bloomExtract.threshold * 0.5, 0.00001);
  float soft = clamp((luminance - bloomExtract.threshold + knee) / (2.0 * knee), 0.0, 1.0);
  float softContribution = soft * soft * knee;
  float hardContribution = max(luminance - bloomExtract.threshold, 0.0);
  float bloomContribution = max(hardContribution, softContribution) / max(luminance, 0.00001);
  return vec4(sourceColor.rgb * bloomContribution, sourceColor.a * bloomContribution);
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
  return vec4f(color.rgb * vec3f(color.a), color.a);
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

  color /= totalWeight;
  let unpremultipliedRgb = color.rgb / vec3f(color.a + 0.00001);

  return vec4f(unpremultipliedRgb, color.a);
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
  return vec4(color.rgb * color.a, color.a);
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
  color.rgb /= color.a + 0.00001;

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
  let renderTargetCoord = shaderPassRenderer_getRenderTargetUV(texCoord);
  let halfGlow = textureSample(glowHalf, glowHalfSampler, renderTargetCoord).rgb;
  let quarterGlow = textureSample(glowQuarter, glowQuarterSampler, renderTargetCoord).rgb;
  let eighthGlow = textureSample(glowEighth, glowEighthSampler, renderTargetCoord).rgb;
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
  vec2 renderTargetCoord = shaderPassRenderer_getRenderTargetUV(texCoord);
  vec3 halfGlow = texture(glowHalf, renderTargetCoord).rgb;
  vec3 quarterGlow = texture(glowQuarter, renderTargetCoord).rgb;
  vec3 eighthGlow = texture(glowEighth, renderTargetCoord).rgb;
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
 * Extracts bright pixels at multiple scales, blurs them, and composites the glow over the original.
 */
export const bloomShaderPassPipeline = {
  name: 'bloomShaderPassPipeline',
  renderTargets: {
    extractHalf: {scale: [0.5, 0.5]},
    blurHalfScratch: {scale: [0.5, 0.5]},
    blurHalf: {scale: [0.5, 0.5]},
    extractQuarter: {scale: [0.25, 0.25]},
    blurQuarterScratch: {scale: [0.25, 0.25]},
    blurQuarter: {scale: [0.25, 0.25]},
    extractEighth: {scale: [0.125, 0.125]},
    blurEighthScratch: {scale: [0.125, 0.125]},
    blurEighth: {scale: [0.125, 0.125]}
  },
  steps: [
    {
      shaderPass: bloomExtractPass,
      inputs: {sourceTexture: 'original'},
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
      shaderPass: bloomExtractPass,
      inputs: {sourceTexture: 'original'},
      output: 'extractQuarter',
      uniforms: {threshold: 0.8}
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
      shaderPass: bloomExtractPass,
      inputs: {sourceTexture: 'original'},
      output: 'extractEighth',
      uniforms: {threshold: 0.8}
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
