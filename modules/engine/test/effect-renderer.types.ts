// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {EffectRenderer} from '../src/passes/effect-renderer';
import {bloomLow, hdrBloom, ssaoEffect} from '../src/effects';

/** Compile-time checks for heterogeneous inline effect configurations. */
export function checkEffectRendererOptions(device: Device): void {
  new EffectRenderer(device, {
    effects: [
      {effect: ssaoEffect, configuration: {normalSource: 'normal-texture', resolutionScale: 0.5}},
      bloomLow,
      {effect: hdrBloom, configuration: {quality: 'ultra'}}
    ]
  });

  new EffectRenderer(device, {
    effects: [
      // @ts-expect-error SSAO does not accept bloom quality options.
      {effect: ssaoEffect, configuration: {quality: 'ultra'}},
      // @ts-expect-error Bloom does not accept an SSAO normal source.
      {effect: hdrBloom, configuration: {normalSource: 'normal-texture'}}
    ]
  });
}
