// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('uses channel-dependent dielectric IOR during PBR continuation', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, readPixel, destroy} = await createMaterialFixture();
  try {
    options.background = [1, 1, 1, 1];
    options.lights = [];
    options.transportMode = 'pbr';
    options.maxBounces = 1;
    options.samplesPerPixel = 16;
    options.historySampleLimit = 256;
    options.samplingSeed = 117;
    const material = {
      id: 'glass',
      uniforms: {
        baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
        transmissionFactor: 1,
        ior: 1.5,
        dispersion: 0
      }
    };
    options.surfaces = [{...surface, material}];
    const neutral = await readPixel();
    expect(neutral[0]).toBeGreaterThan(0);
    expect(neutral).toEqual([neutral[0], neutral[0], neutral[0]]);

    // Deliberately widen the index range so the transport effect exceeds sampling noise.
    material.uniforms.dispersion = 40;
    let pixel = await readPixel();
    for (let frame = 1; frame < 16; frame++) pixel = await readPixel();
    expect(pixel[0]).toBeGreaterThan(pixel[1] + 30);
    expect(pixel[1]).toBeGreaterThan(pixel[2] + 15);
  } finally {
    destroy();
  }
}, 180_000);
