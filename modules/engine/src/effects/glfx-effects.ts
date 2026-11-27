// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

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

export const brightnessContrastEffect: EffectDefinition<never> = {
  name: brightnessContrast.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: brightnessContrast, output: 'previous'}]
};

const denoiseSample = {...denoise, passes: [{sampler: true}]};

export const denoiseEffect: EffectDefinition<never> = {
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
};

export const hueSaturationEffect: EffectDefinition<never> = {
  name: hueSaturation.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: hueSaturation, output: 'previous'}]
};

export const noiseEffect: EffectDefinition<never> = {
  name: noise.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: noise, output: 'previous'}]
};

export const persistence: EffectDefinition<never> = {
  name: persistenceEffect.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: persistenceEffect, output: 'previous'}]
};

export const sepiaEffect: EffectDefinition<never> = {
  name: sepia.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: sepia, output: 'previous'}]
};

export const vibranceEffect: EffectDefinition<never> = {
  name: vibrance.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: vibrance, output: 'previous'}]
};

export const vignetteEffect: EffectDefinition<never> = {
  name: vignette.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: vignette, output: 'previous'}]
};

export const bloomEffect: EffectDefinition<never> = {
  name: bloom.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: bloom, output: 'previous'}]
};

const gaussianBlurSample = {...gaussianBlur, passes: [{sampler: true}]};

export const gaussianBlurEffect: EffectDefinition<never> = {
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
};

const tiltShiftSample = {...tiltShift, passes: [{sampler: true}]};

export const tiltShiftEffect: EffectDefinition<never> = {
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
};

const triangleBlurSample = {...triangleBlur, passes: [{sampler: true}]};

export const triangleBlurEffect: EffectDefinition<never> = {
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
};

export const zoomBlurEffect: EffectDefinition<never> = {
  name: zoomBlur.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: zoomBlur, output: 'previous'}]
};

export const colorHalftoneEffect: EffectDefinition<never> = {
  name: colorHalftone.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: colorHalftone, output: 'previous'}]
};

export const dotScreenEffect: EffectDefinition<never> = {
  name: dotScreen.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: dotScreen, output: 'previous'}]
};

const edgeWorkSample = {...edgeWork, passes: [{sampler: true}]};

export const edgeWorkEffect: EffectDefinition<never> = {
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
};

export const hexagonalPixelateEffect: EffectDefinition<never> = {
  name: hexagonalPixelate.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: hexagonalPixelate, output: 'previous'}]
};

export const inkEffect: EffectDefinition<never> = {
  name: ink.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: ink, output: 'previous'}]
};

export const magnifyEffect: EffectDefinition<never> = {
  name: magnify.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: magnify, output: 'previous'}]
};

export const bulgePinchEffect: EffectDefinition<never> = {
  name: bulgePinch.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: bulgePinch, output: 'previous'}]
};

export const swirlEffect: EffectDefinition<never> = {
  name: swirl.name,
  resources: {},
  passes: [{kind: 'fullscreen', shaderPass: swirl, output: 'previous'}]
};
