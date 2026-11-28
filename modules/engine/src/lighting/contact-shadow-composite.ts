// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type ConfigurableEffectDefinition} from '../passes/effect-renderer';

import {
  contactShadowTrace,
  contactShadowBilateralBlur,
  contactShadowComposite
} from '@luma.gl/shaders';
import {SHADOW_QUALITY_SETTINGS} from './shadow-quality';

/** Builds the quality-scaled trace, bilateral cleanup, and direct-light composite pipeline. */
export type ContactShadowCompositeShaderPassOptions = {quality?: 'low' | 'balanced' | 'cinematic'};

/** Use the balanced contact shadow preset by default. */
const contactShadowOptionDefaults: Required<ContactShadowCompositeShaderPassOptions> = {
  quality: 'balanced'
};

/** Trace and filter contact visibility using the selected quality preset. */
export const contactShadows = {
  optionDefaults: contactShadowOptionDefaults,
  scaleResources: {
    option: 'quality',
    targets: ['contactShadowRaw', 'contactShadowScratch', 'contactShadowFiltered'],
    values: {
      low: SHADOW_QUALITY_SETTINGS.low.contactScale,
      balanced: SHADOW_QUALITY_SETTINGS.balanced.contactScale,
      cinematic: SHADOW_QUALITY_SETTINGS.cinematic.contactScale
    }
  },
  optionUniforms: {
    contactShadowTrace: {
      stepCount: {
        option: 'quality',
        values: {
          low: SHADOW_QUALITY_SETTINGS.low.contactStepCount,
          balanced: SHADOW_QUALITY_SETTINGS.balanced.contactStepCount,
          cinematic: SHADOW_QUALITY_SETTINGS.cinematic.contactStepCount
        }
      }
    }
  },
  name: 'contactShadowCompositeShaderPass',
  resources: {
    contactShadowRaw: {
      scale: [1, 1],
      format: 'rgba8unorm'
    },
    contactShadowScratch: {
      scale: [1, 1],
      format: 'rgba8unorm'
    },
    contactShadowFiltered: {
      scale: [1, 1],
      format: 'rgba8unorm'
    }
  },
  passes: [
    {
      kind: 'fullscreen' as const,
      shaderPass: contactShadowTrace,
      inputs: {sourceTexture: 'previous'},
      output: 'contactShadowRaw'
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
} as const satisfies ConfigurableEffectDefinition<
  ContactShadowCompositeShaderPassOptions,
  'contactShadowRaw' | 'contactShadowScratch' | 'contactShadowFiltered'
>;
