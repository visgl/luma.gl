// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it.each([
  'diffuse',
  'pbr'
] as const)('preserves constant environment energy across %s sampling techniques', async transportMode => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, readPixel, destroy} = await createMaterialFixture();
  try {
    options.surfaces = [
      {
        ...surface,
        material: {
          id: 'environment-receiver',
          uniforms: {
            baseColorFactor: [1, 1, 1, 1],
            metallicRoughnessValues: [0.65, 0.45]
          }
        }
      }
    ];
    options.lights = [];
    options.exposure = 1;
    options.progressive = false;
    options.transportMode = transportMode;
    options.samplingFrameIndex = 0;
    options.samplesPerPixel = 16;
    options.environmentRadiance = [0.5, 0, 0];

    const estimate = async () => {
      let radiance = 0;
      for (let seed = 0; seed < 32; seed++) {
        options.samplingSeed = seed;
        radiance += (await readPixel())[0] / 255;
      }
      return radiance / 32;
    };
    options.maxBounces = 0;
    const direct = await estimate();
    if (transportMode === 'diffuse') {
      // The test fixture uses a 65% metallic receiver and linear output.
      expect(direct).toBeCloseTo(0.5 * 0.96 * 0.35, 1);
    }
    options.maxBounces = 1;
    expect(direct).toBeGreaterThan(0.1);
    const combined = await estimate();
    expect(Math.abs(combined - direct)).toBeLessThan(0.06);

    const lit = await readPixel();
    options.background = [0, 1, 0, 1];
    expect(await readPixel()).toEqual(lit);
    options.environmentRadiance = [0, 0, 0];
    expect(await readPixel()).toEqual([0, 0, 0]);
  } finally {
    destroy();
  }
}, 180_000);
