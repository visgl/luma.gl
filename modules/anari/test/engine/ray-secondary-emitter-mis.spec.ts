// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('preserves diffuse emitter radiance when explicit sampling is enabled', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, readPixel, destroy} = await createMaterialFixture();
  try {
    options.surfaces = [
      {...surface, material: {id: 'diffuse-receiver'}},
      {
        ...surface,
        id: 'large-emitter',
        transforms: [new Matrix4().translate([0, 0, 5]).scale([8, 8, 1])],
        material: {id: 'emitter', uniforms: {emissiveFactor: [0.5, 0, 0]}}
      }
    ];
    options.lights = [];
    options.transportMode = 'diffuse';
    options.maxBounces = 1;
    options.samplesPerPixel = 16;
    options.samplingFrameIndex = 0;
    const estimate = async () => {
      let sum = 0;
      for (let seed = 0; seed < 12; seed++) {
        options.samplingSeed = seed;
        sum += (await readPixel())[0];
      }
      return sum / 12;
    };
    const bsdfOnly = await estimate();
    expect(bsdfOnly).toBeGreaterThan(60);
    options.emitterSampling = true;
    for (const selection of ['uniform', 'power'] as const) {
      options.emitterSelection = selection;
      expect(Math.abs((await estimate()) - bsdfOnly)).toBeLessThan(12);
    }
  } finally {
    destroy();
  }
}, 180_000);
