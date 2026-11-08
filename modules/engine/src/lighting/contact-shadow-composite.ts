// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CompositeShaderPass} from '@luma.gl/shaders';
import {
  contactShadowTrace,
  contactShadowBilateralBlur,
  contactShadowComposite
} from '@luma.gl/shaders';
import {SHADOW_QUALITY_SETTINGS} from './shadow-quality';

/** Builds the quality-scaled trace, bilateral cleanup, and direct-light composite pipeline. */
export function createContactShadowCompositeShaderPass(
  options: {quality?: 'low' | 'balanced' | 'cinematic'} = {}
): CompositeShaderPass<'contactShadowRaw' | 'contactShadowScratch' | 'contactShadowFiltered'> {
  const quality = options.quality || 'balanced';
  const settings = SHADOW_QUALITY_SETTINGS[quality];
  if (!settings) {
    throw new Error(`Unknown shadow quality: ${String(quality)}.`);
  }
  return {
    name: 'contactShadowCompositeShaderPass',
    renderTargets: {
      contactShadowRaw: {
        scale: [settings.contactScale, settings.contactScale],
        format: 'rgba8unorm'
      },
      contactShadowScratch: {
        scale: [settings.contactScale, settings.contactScale],
        format: 'rgba8unorm'
      },
      contactShadowFiltered: {
        scale: [settings.contactScale, settings.contactScale],
        format: 'rgba8unorm'
      }
    },
    steps: [
      {
        shaderPass: contactShadowTrace,
        inputs: {sourceTexture: 'previous'},
        output: 'contactShadowRaw',
        uniforms: {stepCount: settings.contactStepCount}
      },
      {
        shaderPass: contactShadowBilateralBlur,
        inputs: {sourceTexture: 'contactShadowRaw'},
        output: 'contactShadowScratch',
        uniforms: {direction: [1, 0]}
      },
      {
        shaderPass: contactShadowBilateralBlur,
        inputs: {sourceTexture: 'contactShadowScratch'},
        output: 'contactShadowFiltered',
        uniforms: {direction: [0, 1]}
      },
      {
        shaderPass: contactShadowComposite,
        inputs: {
          sourceTexture: 'previous',
          contactShadowTexture: 'contactShadowFiltered'
        },
        output: 'previous'
      }
    ]
  };
}
