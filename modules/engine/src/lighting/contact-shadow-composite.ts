// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  resolveEffect,
  type ConfigurableEffectDefinition,
  type EffectDefinition
} from '../passes/effect-renderer';
import type {CompositeShaderPass} from '@luma.gl/shaders';
import {
  contactShadowTrace,
  contactShadowBilateralBlur,
  contactShadowComposite
} from '@luma.gl/shaders';
import {SHADOW_QUALITY_SETTINGS} from './shadow-quality';

/** Builds the quality-scaled trace, bilateral cleanup, and direct-light composite pipeline. */
export type ContactShadowCompositeShaderPassOptions = {quality?: 'low' | 'balanced' | 'cinematic'};

export const contactShadows = {
  name: 'contactShadowCompositeShaderPass',
  configure: configureContactShadow
} as const satisfies ConfigurableEffectDefinition<
  ContactShadowCompositeShaderPassOptions,
  'contactShadowRaw' | 'contactShadowScratch' | 'contactShadowFiltered'
>;

function configureContactShadow(
  options: ContactShadowCompositeShaderPassOptions = {}
): EffectDefinition<'contactShadowRaw' | 'contactShadowScratch' | 'contactShadowFiltered'> {
  const quality = options.quality || 'balanced';
  const settings = SHADOW_QUALITY_SETTINGS[quality];
  if (!settings) {
    throw new Error(`Unknown shadow quality: ${String(quality)}.`);
  }
  return {
    name: 'contactShadowCompositeShaderPass',
    resources: {
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
    passes: [
      {
        kind: 'fullscreen' as const,
        shaderPass: contactShadowTrace,
        inputs: {sourceTexture: 'previous'},
        output: 'contactShadowRaw',
        uniforms: {stepCount: settings.contactStepCount}
      },
      {
        kind: 'fullscreen' as const,
        shaderPass: contactShadowBilateralBlur,
        inputs: {sourceTexture: 'contactShadowRaw'},
        output: 'contactShadowScratch',
        uniforms: {direction: [1, 0]}
      },
      {
        kind: 'fullscreen' as const,
        shaderPass: contactShadowBilateralBlur,
        inputs: {sourceTexture: 'contactShadowScratch'},
        output: 'contactShadowFiltered',
        uniforms: {direction: [0, 1]}
      },
      {
        kind: 'fullscreen' as const,
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

export function createContactShadowCompositeShaderPass(
  options: ContactShadowCompositeShaderPassOptions = {}
): CompositeShaderPass<'contactShadowRaw' | 'contactShadowScratch' | 'contactShadowFiltered'> {
  return resolveEffect(contactShadows.configure(options));
}
