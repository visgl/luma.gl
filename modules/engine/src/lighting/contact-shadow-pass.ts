// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, type Device, type Texture} from '@luma.gl/core';
import {
  contactShadowTrace,
  contactShadowBilateralBlur,
  type ContactTraceUniforms
} from '@luma.gl/shaders';
import {Matrix4} from '@math.gl/core/matrix';
import {type NumberArray3, type NumberArray16} from '@math.gl/core/types';
import {
  EffectRenderer,
  type ConfigurableEffectDefinition,
  type EffectDefinition
} from '../passes/effect-renderer';
import {SHADOW_QUALITY_SETTINGS} from './shadow-quality';

export type ContactShadowPassProps = {quality?: 'low' | 'balanced' | 'cinematic'};
export type ContactShadowRenderOptions = Partial<
  Omit<ContactTraceUniforms, 'projectionMatrix' | 'inverseProjectionMatrix' | 'lightDirectionView'>
> & {
  projectionMatrix: Readonly<Matrix4 | NumberArray16>;
  lightDirectionView: Readonly<NumberArray3>;
  depthTexture: Texture;
  normalTexture: Texture;
};

/** Produces an RGBA8 visibility texture for downstream lighting. */
export const contactShadowVisibilityEffect = {
  name: 'contactShadowVisibility',
  configure: configureContactShadowVisibility
} as const satisfies ConfigurableEffectDefinition<
  ContactShadowPassProps,
  'contactShadowRaw' | 'contactShadowScratch'
>;

function configureContactShadowVisibility(
  props: ContactShadowPassProps = {}
): EffectDefinition<'contactShadowRaw' | 'contactShadowScratch'> {
  const settings = SHADOW_QUALITY_SETTINGS[props.quality ?? 'balanced'];
  return {
    name: 'contactShadowVisibility',
    resources: {
      contactShadowRaw: {
        scale: [settings.contactScale, settings.contactScale],
        format: 'rgba8unorm'
      },
      contactShadowScratch: {
        scale: [settings.contactScale, settings.contactScale],
        format: 'rgba8unorm'
      }
    },
    passes: [
      {
        kind: 'fullscreen',
        shaderPass: contactShadowTrace,
        inputs: {sourceTexture: 'original'},
        output: 'contactShadowRaw',
        uniforms: {stepCount: settings.contactStepCount}
      },
      {
        kind: 'fullscreen',
        shaderPass: contactShadowBilateralBlur,
        inputs: {sourceTexture: 'contactShadowRaw'},
        output: 'contactShadowScratch',
        uniforms: {direction: [1, 0]}
      },
      {
        kind: 'fullscreen',
        shaderPass: contactShadowBilateralBlur,
        inputs: {sourceTexture: 'contactShadowScratch'},
        output: 'previous',
        uniforms: {direction: [0, 1]}
      }
    ]
  };
}

/** Prepares a screen-space visibility texture for one directional light. No history or submission. */
export class ContactShadowPass {
  readonly device: Device;
  private readonly renderer: EffectRenderer;
  private destroyed = false;

  constructor(device: Device, props: ContactShadowPassProps = {}) {
    this.device = device;
    this.renderer = new EffectRenderer(device, {
      effects: [{effect: contactShadowVisibilityEffect, options: props}],
      colorFormat: 'rgba8unorm'
    });
  }

  /** Uses the backend-native projection and view-space normals/direction of the same camera. */
  render(options: ContactShadowRenderOptions): Texture {
    // Inputs must be same-device, single-sample targets of the same camera and resolution.
    assert(
      !this.destroyed &&
        options.depthTexture.device === this.device &&
        options.normalTexture.device === this.device
    );
    assert(
      options.depthTexture.width === options.normalTexture.width &&
        options.depthTexture.height === options.normalTexture.height
    );
    this.renderer.resize([options.normalTexture.width, options.normalTexture.height]);
    const {depthTexture, normalTexture, ...traceProps} = options;
    const texture = this.renderer.renderToTexture({
      sourceTexture: normalTexture,
      bindings: {depthTexture, normalTexture},
      uniforms: {
        contactShadowTrace: {
          ...traceProps,
          inverseProjectionMatrix: new Matrix4(options.projectionMatrix).invert()
        }
      }
    });
    // Concrete texture inputs always produce an output; deferred uploads are not accepted here.
    assert(texture);
    return texture;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.renderer.destroy();
  }
}
