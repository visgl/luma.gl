// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Texture} from '@luma.gl/core';
import type {ShaderPass, ShaderPassPipeline} from '@luma.gl/shadertools';

/** Construction options for GPU-resident HDR luminance metering and adaptation. */
export type HDRAutoExposureShaderPassPipelineOptions = {
  /** Initial luminance-metering resolution. Defaults to one quarter of the drawing buffer. */
  meteringScale?: number;
};

type HDRAutoExposureAdaptUniforms = {
  keyValue: number;
  minimumExposure: number;
  maximumExposure: number;
  brightenSpeed: number;
  darkenSpeed: number;
  deltaTime: number;
  enabled: number;
};

type HDRAutoExposureAdaptBindings = {
  historyTexture?: Texture;
};

type HDRAutoExposureApplyUniforms = {
  debugMode: number;
};

type HDRAutoExposureApplyBindings = {
  exposureTexture?: Texture;
};

/** Captures perceptual, center-weighted log luminance from HDR scene color. */
export const hdrLuminanceExtract = {
  name: 'hdrLuminanceExtract',
  source: /* wgsl */ `\
fn hdrLuminanceExtract_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceTexel = 1.0 / vec2f(textureDimensions(sourceTexture));
  var weightedLogLuminance = 0.0;
  var totalWeight = 0.0;

  for (var sampleY: i32 = 0; sampleY < 4; sampleY++) {
    for (var sampleX: i32 = 0; sampleX < 4; sampleX++) {
      let sampleOffset = vec2f(f32(sampleX) - 1.5, f32(sampleY) - 1.5);
      let sampleCoord = clamp(texCoord + sampleOffset * sourceTexel, vec2f(0.0), vec2f(1.0));
      let sourceColor = textureSampleLevel(sourceTexture, sourceTextureSampler, sampleCoord, 0).rgb;
      let luminance = max(dot(max(sourceColor, vec3f(0.0)), vec3f(0.2126, 0.7152, 0.0722)), 0.0001);
      let distanceFromCenter = distance(sampleCoord, vec2f(0.5));
      let centerWeight = mix(1.0, 0.35, smoothstep(0.18, 0.72, distanceFromCenter));
      weightedLogLuminance += log(luminance) * centerWeight;
      totalWeight += centerWeight;
    }
  }

  return vec4f(weightedLogLuminance / max(totalWeight, 0.0001), 0.0, 0.0, 1.0);
}`,
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

/** Reduces one luminance pyramid level while preserving geometric-mean metering. */
export const hdrLuminanceReduce = {
  name: 'hdrLuminanceReduce',
  source: /* wgsl */ `\
fn hdrLuminanceReduce_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let sourceTexel = 1.0 / vec2f(textureDimensions(sourceTexture));
  var logLuminance = 0.0;

  for (var sampleY: i32 = 0; sampleY < 4; sampleY++) {
    for (var sampleX: i32 = 0; sampleX < 4; sampleX++) {
      let sampleOffset = vec2f(f32(sampleX) - 1.5, f32(sampleY) - 1.5);
      let sampleCoord = clamp(texCoord + sampleOffset * sourceTexel, vec2f(0.0), vec2f(1.0));
      logLuminance += textureSampleLevel(sourceTexture, sourceTextureSampler, sampleCoord, 0).r;
    }
  }

  return vec4f(logLuminance / 16.0, 0.0, 0.0, 1.0);
}`,
  passes: [{sampler: true}]
} as const satisfies ShaderPass;

/** Adapts exposure over time entirely on the GPU without luminance readback. */
export const hdrAutoExposureAdapt = {
  name: 'hdrAutoExposureAdapt',
  source: /* wgsl */ `\
struct HDRAutoExposureAdaptUniforms {
  keyValue: f32,
  minimumExposure: f32,
  maximumExposure: f32,
  brightenSpeed: f32,
  darkenSpeed: f32,
  deltaTime: f32,
  enabled: f32,
};

@group(0) @binding(auto) var<uniform> hdrAutoExposureAdapt: HDRAutoExposureAdaptUniforms;
@group(0) @binding(auto) var historyTexture: texture_2d<f32>;
@group(0) @binding(auto) var historyTextureSampler: sampler;

fn hdrAutoExposureAdapt_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  if (hdrAutoExposureAdapt.enabled < 0.5) {
    return vec4f(1.0, 0.0, 0.0, 1.0);
  }

  let logLuminance = textureSampleLevel(sourceTexture, sourceTextureSampler, vec2f(0.5), 0).r;
  let averageLuminance = max(exp(logLuminance), 0.0001);
  let targetExposure = clamp(
    hdrAutoExposureAdapt.keyValue / averageLuminance,
    hdrAutoExposureAdapt.minimumExposure,
    hdrAutoExposureAdapt.maximumExposure
  );
  let previousExposure = max(
    textureSampleLevel(historyTexture, historyTextureSampler, vec2f(0.5), 0).r,
    0.0001
  );
  let adaptationSpeed = select(
    hdrAutoExposureAdapt.darkenSpeed,
    hdrAutoExposureAdapt.brightenSpeed,
    targetExposure > previousExposure
  );
  let adaptationWeight = 1.0 - exp(-adaptationSpeed * max(hdrAutoExposureAdapt.deltaTime, 0.0));
  let exposure = mix(previousExposure, targetExposure, adaptationWeight);
  return vec4f(exposure, averageLuminance, targetExposure, 1.0);
}`,
  bindingLayout: [{name: 'historyTexture', group: 0}],
  props: {} as Partial<HDRAutoExposureAdaptUniforms> & HDRAutoExposureAdaptBindings,
  uniforms: {} as HDRAutoExposureAdaptUniforms,
  bindings: {} as HDRAutoExposureAdaptBindings,
  uniformTypes: {
    keyValue: 'f32',
    minimumExposure: 'f32',
    maximumExposure: 'f32',
    brightenSpeed: 'f32',
    darkenSpeed: 'f32',
    deltaTime: 'f32',
    enabled: 'f32'
  },
  propTypes: {
    keyValue: {value: 0.48, min: 0.05, softMax: 2},
    minimumExposure: {value: 0.45, min: 0.01, softMax: 2},
    maximumExposure: {value: 2.4, min: 0.1, softMax: 8},
    brightenSpeed: {value: 1.6, min: 0.05, softMax: 8},
    darkenSpeed: {value: 2.8, min: 0.05, softMax: 8},
    deltaTime: {value: 0.016, min: 0, max: 0.25, private: true},
    enabled: {value: 1, min: 0, max: 1}
  },
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<HDRAutoExposureAdaptUniforms> & HDRAutoExposureAdaptBindings,
  HDRAutoExposureAdaptUniforms,
  HDRAutoExposureAdaptBindings
>;

/** Applies adapted HDR exposure or visualizes scene-luminance metering. */
export const hdrAutoExposureApply = {
  name: 'hdrAutoExposureApply',
  source: /* wgsl */ `\
struct HDRAutoExposureApplyUniforms {
  debugMode: f32,
};

@group(0) @binding(auto) var<uniform> hdrAutoExposureApply: HDRAutoExposureApplyUniforms;
@group(0) @binding(auto) var exposureTexture: texture_2d<f32>;
@group(0) @binding(auto) var exposureTextureSampler: sampler;

fn hdrAutoExposureApply_sampleColor(
  sourceTexture: texture_2d<f32>,
  sourceTextureSampler: sampler,
  texSize: vec2f,
  texCoord: vec2f
) -> vec4f {
  let source = textureSampleLevel(sourceTexture, sourceTextureSampler, texCoord, 0);
  let exposureState = textureSampleLevel(exposureTexture, exposureTextureSampler, vec2f(0.5), 0);
  if (hdrAutoExposureApply.debugMode > 0.5) {
    let sceneLuminance = max(dot(source.rgb, vec3f(0.2126, 0.7152, 0.0722)), 0.0001);
    let normalizedLuminance = clamp((log2(sceneLuminance) + 5.0) / 10.0, 0.0, 1.0);
    let shadows = vec3f(0.06, 0.10, 0.40);
    let midtones = vec3f(0.15, 0.82, 0.58);
    let highlights = vec3f(1.0, 0.63, 0.08);
    let heatMap = mix(
      mix(shadows, midtones, smoothstep(0.0, 0.5, normalizedLuminance)),
      highlights,
      smoothstep(0.5, 1.0, normalizedLuminance)
    );
    return vec4f(heatMap, source.a);
  }

  return vec4f(source.rgb * exposureState.r, source.a);
}`,
  bindingLayout: [{name: 'exposureTexture', group: 0}],
  props: {} as Partial<HDRAutoExposureApplyUniforms> & HDRAutoExposureApplyBindings,
  uniforms: {} as HDRAutoExposureApplyUniforms,
  bindings: {} as HDRAutoExposureApplyBindings,
  uniformTypes: {debugMode: 'f32'},
  propTypes: {debugMode: {value: 0, min: 0, max: 1, private: true}},
  passes: [{sampler: true}]
} as const satisfies ShaderPass<
  Partial<HDRAutoExposureApplyUniforms> & HDRAutoExposureApplyBindings,
  HDRAutoExposureApplyUniforms,
  HDRAutoExposureApplyBindings
>;

/** Builds a logarithmic luminance pyramid, persistent adaptation, and HDR exposure resolve. */
export function createHDRAutoExposureShaderPassPipeline(
  options: HDRAutoExposureShaderPassPipelineOptions = {}
): ShaderPassPipeline<
  | 'hdrLuminanceQuarter'
  | 'hdrLuminanceSixteenth'
  | 'hdrLuminanceSixtyFourth'
  | 'hdrLuminanceTwoFiftySixth'
  | 'hdrLuminanceThousandth'
  | 'hdrExposureHistory'
> {
  const meteringScale = options.meteringScale ?? 0.25;
  const sixteenthScale = meteringScale / 4;
  const sixtyFourthScale = sixteenthScale / 4;
  const twoFiftySixthScale = sixtyFourthScale / 4;
  const thousandthScale = twoFiftySixthScale / 4;

  return {
    name: 'hdrAutoExposureShaderPassPipeline',
    renderTargets: {
      hdrLuminanceQuarter: {
        scale: [meteringScale, meteringScale],
        format: 'rgba16float'
      },
      hdrLuminanceSixteenth: {
        scale: [sixteenthScale, sixteenthScale],
        format: 'rgba16float'
      },
      hdrLuminanceSixtyFourth: {
        scale: [sixtyFourthScale, sixtyFourthScale],
        format: 'rgba16float'
      },
      hdrLuminanceTwoFiftySixth: {
        scale: [twoFiftySixthScale, twoFiftySixthScale],
        format: 'rgba16float'
      },
      hdrLuminanceThousandth: {
        scale: [thousandthScale, thousandthScale],
        format: 'rgba16float'
      },
      hdrExposureHistory: {
        scale: [thousandthScale, thousandthScale],
        format: 'rgba16float',
        lifetime: 'history',
        initialize: {clearColor: [1, 1, 1, 1]}
      }
    },
    steps: [
      {
        shaderPass: hdrLuminanceExtract,
        inputs: {sourceTexture: 'previous'},
        output: 'hdrLuminanceQuarter'
      },
      {
        shaderPass: hdrLuminanceReduce,
        inputs: {sourceTexture: 'hdrLuminanceQuarter'},
        output: 'hdrLuminanceSixteenth'
      },
      {
        shaderPass: hdrLuminanceReduce,
        inputs: {sourceTexture: 'hdrLuminanceSixteenth'},
        output: 'hdrLuminanceSixtyFourth'
      },
      {
        shaderPass: hdrLuminanceReduce,
        inputs: {sourceTexture: 'hdrLuminanceSixtyFourth'},
        output: 'hdrLuminanceTwoFiftySixth'
      },
      {
        shaderPass: hdrLuminanceReduce,
        inputs: {sourceTexture: 'hdrLuminanceTwoFiftySixth'},
        output: 'hdrLuminanceThousandth'
      },
      {
        shaderPass: hdrAutoExposureAdapt,
        inputs: {
          sourceTexture: 'hdrLuminanceThousandth',
          historyTexture: 'hdrExposureHistory'
        },
        output: 'hdrExposureHistory'
      },
      {
        shaderPass: hdrAutoExposureApply,
        inputs: {sourceTexture: 'previous', exposureTexture: 'hdrExposureHistory'},
        output: 'previous'
      }
    ]
  };
}
