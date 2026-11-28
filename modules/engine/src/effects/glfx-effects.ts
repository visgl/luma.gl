// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {copyPass} from './passes/screen-space/copy-pass';
import type {EffectDefinition} from '../passes/effect-renderer';
import {brightnessContrast} from './passes/postprocessing/image-adjust-filters/brightnesscontrast';
import {denoise} from './passes/postprocessing/image-adjust-filters/denoise';
import {hueSaturation} from './passes/postprocessing/image-adjust-filters/huesaturation';
import {noise} from './passes/postprocessing/image-adjust-filters/noise';
import {persistenceEffect} from './passes/postprocessing/image-adjust-filters/persistence';
import {sepia} from './passes/postprocessing/image-adjust-filters/sepia';
import {vibrance} from './passes/postprocessing/image-adjust-filters/vibrance';
import {vignette} from './passes/postprocessing/image-adjust-filters/vignette';
import {bloom} from './passes/postprocessing/image-blur-filters/bloom';
import {gaussianBlur} from './passes/postprocessing/image-blur-filters/gaussianblur';
import {tiltShift} from './passes/postprocessing/image-blur-filters/tiltshift';
import {triangleBlur} from './passes/postprocessing/image-blur-filters/triangleblur';
import {zoomBlur} from './passes/postprocessing/image-blur-filters/zoomblur';
import {colorHalftone} from './passes/postprocessing/image-fun-filters/colorhalftone';
import {dotScreen} from './passes/postprocessing/image-fun-filters/dotscreen';
import {edgeWork} from './passes/postprocessing/image-fun-filters/edgework';
import {hexagonalPixelate} from './passes/postprocessing/image-fun-filters/hexagonalpixelate';
import {ink} from './passes/postprocessing/image-fun-filters/ink';
import {magnify} from './passes/postprocessing/image-fun-filters/magnify';
import {bulgePinch} from './passes/postprocessing/image-warp-filters/bulgepinch';
import {swirl} from './passes/postprocessing/image-warp-filters/swirl';

export const brightnessContrastEffect = {
  name: brightnessContrast.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: brightnessContrast, output: 'previous'}]
} as const satisfies EffectDefinition<never>;

const denoiseSample = {...denoise, passes: [{sampler: true}]};

export const denoiseEffect = {
  name: denoise.name,
  resources: {},
  passes: [
    {kind: 'fullscreen', shaderPass: denoiseSample, output: 'previous'},
    {
      kind: 'fullscreen',
      shaderPass: denoiseSample,
      output: 'previous'
    }
  ]
} as const satisfies EffectDefinition<never>;

export const hueSaturationEffect = {
  name: hueSaturation.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: hueSaturation, output: 'previous'}]
} as const satisfies EffectDefinition<never>;

export const noiseEffect = {
  name: noise.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: noise, output: 'previous'}]
} as const satisfies EffectDefinition<never>;

/** Accumulates fading trails in a history texture owned by this effect. */
export const persistence = {
  name: persistenceEffect.name,
  resources: {
    accumulation: {lifetime: 'history', initialize: {clearColor: [0, 0, 0, 0]}}
  },
  passes: [
    {
      kind: 'fullscreen',
      shaderPass: persistenceEffect,
      inputs: {sourceTexture: 'previous', persistenceTexture: 'accumulation'},
      output: 'accumulation'
    },
    {
      kind: 'fullscreen',
      shaderPass: copyPass,
      inputs: {sourceTexture: 'accumulation'},
      output: 'previous'
    }
  ]
} as const satisfies EffectDefinition<'accumulation'>;

export const sepiaEffect = {
  name: sepia.name,
  passes: [{kind: 'filter', module: sepia}]
} as const satisfies EffectDefinition<never>;

export const vibranceEffect = {
  name: vibrance.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: vibrance, output: 'previous'}]
} as const satisfies EffectDefinition<never>;

export const vignetteEffect = {
  name: vignette.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: vignette, output: 'previous'}]
} as const satisfies EffectDefinition<never>;

export const bloomEffect = {
  name: bloom.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: bloom, output: 'previous'}]
} as const satisfies EffectDefinition<never>;

const gaussianBlurSample = {...gaussianBlur, passes: [{sampler: true}]};

export const gaussianBlurEffect = {
  name: gaussianBlur.name,
  resources: {},
  passes: [
    {
      kind: 'fullscreen',
      shaderPass: gaussianBlurSample,
      output: 'previous',
      uniforms: {delta: [1, 0]}
    },
    {
      kind: 'fullscreen',
      shaderPass: gaussianBlurSample,
      output: 'previous',
      uniforms: {delta: [0, 1]}
    }
  ]
} as const satisfies EffectDefinition<never>;

const tiltShiftSample = {...tiltShift, passes: [{sampler: true}]};

export const tiltShiftEffect = {
  name: tiltShift.name,
  resources: {},
  passes: [
    {kind: 'fullscreen', shaderPass: tiltShiftSample, output: 'previous', uniforms: {invert: 0}},
    {
      kind: 'fullscreen',
      shaderPass: tiltShiftSample,
      output: 'previous',
      uniforms: {invert: 1}
    }
  ]
} as const satisfies EffectDefinition<never>;

const triangleBlurSample = {...triangleBlur, passes: [{sampler: true}]};

export const triangleBlurEffect = {
  name: triangleBlur.name,
  resources: {},
  passes: [
    {
      kind: 'fullscreen',
      shaderPass: triangleBlurSample,
      output: 'previous',
      uniforms: {delta: [1, 0]}
    },
    {
      kind: 'fullscreen',
      shaderPass: triangleBlurSample,
      output: 'previous',
      uniforms: {delta: [0, 1]}
    }
  ]
} as const satisfies EffectDefinition<never>;

export const zoomBlurEffect = {
  name: zoomBlur.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: zoomBlur, output: 'previous'}]
} as const satisfies EffectDefinition<never>;

export const colorHalftoneEffect = {
  name: colorHalftone.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: colorHalftone, output: 'previous'}]
} as const satisfies EffectDefinition<never>;

export const dotScreenEffect = {
  name: dotScreen.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: dotScreen, output: 'previous'}]
} as const satisfies EffectDefinition<never>;

const edgeWorkSample = {...edgeWork, passes: [{sampler: true}]};

export const edgeWorkEffect = {
  name: edgeWork.name,
  resources: {},
  passes: [
    {kind: 'fullscreen', shaderPass: edgeWorkSample, output: 'previous', uniforms: {mode: 0}},
    {
      kind: 'fullscreen',
      shaderPass: edgeWorkSample,
      output: 'previous',
      uniforms: {mode: 1}
    }
  ]
} as const satisfies EffectDefinition<never>;

export const hexagonalPixelateEffect = {
  name: hexagonalPixelate.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: hexagonalPixelate, output: 'previous'}]
} as const satisfies EffectDefinition<never>;

export const inkEffect = {
  name: ink.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: ink, output: 'previous'}]
} as const satisfies EffectDefinition<never>;

export const magnifyEffect = {
  name: magnify.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: magnify, output: 'previous'}]
} as const satisfies EffectDefinition<never>;

export const bulgePinchEffect = {
  name: bulgePinch.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: bulgePinch, output: 'previous'}]
} as const satisfies EffectDefinition<never>;

export const swirlEffect = {
  name: swirl.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: swirl, output: 'previous'}]
} as const satisfies EffectDefinition<never>;
