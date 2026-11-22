// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('ray occlusion maps attenuate ambient light without changing directional lighting', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, map, readPixel, destroy} = await createMaterialFixture();
  try {
    const occludedSurface = {
      ...surface,
      material: {
        id: 'occlusion-material',
        uniforms: {
          baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
          occlusionStrength: 1,
          occlusionUVSet: 1,
          occlusionMapEnabled: true
        },
        bindings: {pbr_occlusionSampler: map}
      }
    };
    options.surfaces = [occludedSurface];
    options.samplingFrameIndex = 0;
    expect(await readPixel()).toEqual([0, 0, 0]);
    occludedSurface.material.uniforms.occlusionStrength = 0.5;
    expect((await readPixel())[0]).toBeCloseTo(128, -1);
    occludedSurface.material.uniforms.occlusionUVSet = 0;
    expect(await readPixel()).toEqual([255, 255, 255]);
    occludedSurface.material.uniforms.occlusionUVSet = 1;
    occludedSurface.material.uniforms.occlusionStrength = 1;
    options.lights = [{type: 'directional', direction: [0, 0, -1], color: [1, 1, 1], intensity: 1}];
    const directWithOcclusion = await readPixel();
    expect(directWithOcclusion[0]).toBeGreaterThan(20);
    occludedSurface.material.uniforms.occlusionMapEnabled = false;
    expect(await readPixel()).toEqual(directWithOcclusion);
  } finally {
    destroy();
  }
}, 180_000);
