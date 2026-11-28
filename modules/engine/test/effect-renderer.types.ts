// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {configureEffect, EffectRenderer} from '../src/passes/effect-renderer';
import {bloomLow, hdrBloom, sepiaEffect, ssaoEffect, volumetricFog} from '../src/effects';

/** Compile-time checks for heterogeneous inline effect configurations. */
export function checkEffectRendererOptions(device: Device): void {
  new EffectRenderer(device, {
    effects: [
      {effect: ssaoEffect, options: {normalSource: 'normal-texture', resolutionScale: 0.5}},
      {effect: sepiaEffect},
      bloomLow,
      configureEffect(volumetricFog, {mode: 'height'}),
      configureEffect(volumetricFog),
      {effect: hdrBloom, configuration: {quality: 'ultra'}}
    ]
  });

  new EffectRenderer(device, {
    effects: [
      // @ts-expect-error SSAO does not accept bloom quality options.
      {effect: ssaoEffect, options: {quality: 'ultra'}},
      // @ts-expect-error Sepia exposes uniforms and has no construction options.
      {effect: sepiaEffect, options: {amount: 0.5}},
      // @ts-expect-error Bloom does not accept an SSAO normal source.
      {effect: hdrBloom, configuration: {normalSource: 'normal-texture'}}
    ]
  });
}
