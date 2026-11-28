// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {EffectRenderer} from '../src/passes/effect-renderer';
import {bloomLow, hdrBloom, sepiaEffect, ssaoEffect, ssr, volumetricFog} from '../src/effects';

/** Compile-time checks for heterogeneous inline effect configurations. */
export function checkEffectRendererOptions(device: Device): void {
  new EffectRenderer(device, {
    effects: [
      {effect: ssaoEffect, options: {normalSource: 'normal-texture', resolutionScale: 0.5}},
      {effect: sepiaEffect},
      bloomLow,
      {effect: volumetricFog, options: {mode: 'height'}},
      {effect: ssr, options: {quality: 'detailed', reprojection: 'camera'}},
      {effect: volumetricFog},
      {effect: hdrBloom, options: {quality: 'ultra'}}
    ]
  });

  new EffectRenderer(device, {
    effects: [
      // @ts-expect-error SSAO does not accept bloom quality options.
      {effect: ssaoEffect, options: {quality: 'ultra'}},
      // @ts-expect-error Sepia exposes uniforms and has no construction options.
      {effect: sepiaEffect, options: {amount: 0.5}},
      // @ts-expect-error Bloom does not accept an SSAO normal source.
      {effect: hdrBloom, options: {normalSource: 'normal-texture'}}
    ]
  });
}
