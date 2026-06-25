// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ShaderPassPipeline} from '@luma.gl/shadertools';
import {copyPass} from './copy-pass';
import {depthAwareBlur} from './depth-aware-blur';
import {motionBlurPass} from './motion-blur';
import {outlinePass} from './outlines';
import type {ScreenSpaceEffectOptions} from './screen-space-effect-types';
import {ssrComposite, ssrTrace} from './screen-space-reflections';
import {ssaoComposite, ssaoEvaluate} from './ssao';
import {depthHistoryCopy, taaResolve} from './temporal-antialiasing';
import {volumetricFogPass} from './volumetric-fog';

export const depthAwareBlurShaderPassPipeline = {
  name: 'depthAwareBlurShaderPassPipeline',
  renderTargets: {depthAwareBlurScratch: {}},
  steps: [
    {
      shaderPass: depthAwareBlur,
      inputs: {sourceTexture: 'previous'},
      output: 'depthAwareBlurScratch',
      uniforms: {direction: [1, 0]}
    },
    {
      shaderPass: depthAwareBlur,
      inputs: {sourceTexture: 'depthAwareBlurScratch'},
      output: 'previous',
      uniforms: {direction: [0, 1]}
    }
  ]
} satisfies ShaderPassPipeline<'depthAwareBlurScratch'>;

export function createSSAOShaderPassPipeline(
  options: ScreenSpaceEffectOptions = {}
): ShaderPassPipeline<'ssaoRaw' | 'ssaoScratch' | 'ssaoBlurred'> {
  const scale = options.resolutionScale || 0.5;
  const useNormalTexture = options.normalSource === 'normal-texture' ? 1 : 0;
  const evaluateInputs: Record<string, 'previous'> = {sourceTexture: 'previous'};
  if (!useNormalTexture) {
    evaluateInputs['normalTexture'] = 'previous';
  }
  return {
    name: 'ssaoShaderPassPipeline',
    renderTargets: {
      ssaoRaw: {scale: [scale, scale], format: 'rgba8unorm'},
      ssaoScratch: {scale: [scale, scale], format: 'rgba8unorm'},
      ssaoBlurred: {scale: [scale, scale], format: 'rgba8unorm'}
    },
    steps: [
      {
        shaderPass: ssaoEvaluate,
        inputs: evaluateInputs,
        output: 'ssaoRaw',
        uniforms: {useNormalTexture}
      },
      {
        shaderPass: depthAwareBlur,
        inputs: {sourceTexture: 'ssaoRaw'},
        output: 'ssaoScratch',
        uniforms: {direction: [1, 0]}
      },
      {
        shaderPass: depthAwareBlur,
        inputs: {sourceTexture: 'ssaoScratch'},
        output: 'ssaoBlurred',
        uniforms: {direction: [0, 1]}
      },
      {
        shaderPass: ssaoComposite,
        inputs: {sourceTexture: 'previous', ambientOcclusionTexture: 'ssaoBlurred'},
        output: 'previous'
      }
    ]
  };
}

export function createOutlineShaderPassPipeline(
  options: ScreenSpaceEffectOptions = {}
): ShaderPassPipeline {
  const useNormalTexture = options.normalSource === 'normal-texture' ? 1 : 0;
  const inputs: Record<string, 'previous'> = {sourceTexture: 'previous'};
  if (!useNormalTexture) {
    inputs['normalTexture'] = 'previous';
  }
  return {
    name: 'outlineShaderPassPipeline',
    steps: [{shaderPass: outlinePass, inputs, output: 'previous', uniforms: {useNormalTexture}}]
  };
}

export function createTAAShaderPassPipeline(): ShaderPassPipeline<
  'taaHistoryColor' | 'taaHistoryDepth'
> {
  return {
    name: 'taaShaderPassPipeline',
    renderTargets: {
      taaHistoryColor: {lifetime: 'history', initialize: 'original'},
      taaHistoryDepth: {
        format: 'rgba16float',
        lifetime: 'history',
        initialize: {clearColor: [1, 0, 0, 1]}
      }
    },
    steps: [
      {
        shaderPass: taaResolve,
        inputs: {
          sourceTexture: 'previous',
          historyTexture: 'taaHistoryColor',
          previousDepthTexture: 'taaHistoryDepth'
        },
        output: 'taaHistoryColor'
      },
      {shaderPass: copyPass, inputs: {sourceTexture: 'taaHistoryColor'}, output: 'previous'},
      {shaderPass: depthHistoryCopy, inputs: {sourceTexture: 'previous'}, output: 'taaHistoryDepth'}
    ]
  };
}

export function createMotionBlurShaderPassPipeline(): ShaderPassPipeline {
  return {
    name: 'motionBlurShaderPassPipeline',
    steps: [{shaderPass: motionBlurPass, output: 'previous'}]
  };
}

export function createSSRShaderPassPipeline(
  options: {resolutionScale?: number} = {}
): ShaderPassPipeline<'ssrReflection'> {
  const scale = options.resolutionScale || 0.5;
  return {
    name: 'ssrShaderPassPipeline',
    renderTargets: {ssrReflection: {scale: [scale, scale], format: 'rgba16float'}},
    steps: [
      {shaderPass: ssrTrace, inputs: {sourceTexture: 'previous'}, output: 'ssrReflection'},
      {
        shaderPass: ssrComposite,
        inputs: {sourceTexture: 'previous', reflectionTexture: 'ssrReflection'},
        output: 'previous'
      }
    ]
  };
}

export function createVolumetricFogShaderPassPipeline(): ShaderPassPipeline<'fogHistory'> {
  return {
    name: 'volumetricFogShaderPassPipeline',
    renderTargets: {fogHistory: {lifetime: 'history', initialize: 'original'}},
    steps: [
      {
        shaderPass: volumetricFogPass,
        inputs: {sourceTexture: 'previous', historyTexture: 'fogHistory'},
        output: 'fogHistory'
      },
      {shaderPass: copyPass, inputs: {sourceTexture: 'fogHistory'}, output: 'previous'}
    ]
  };
}
