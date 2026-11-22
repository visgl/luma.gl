// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('ray sheen samples color RGB and roughness alpha independently', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, map, replacement, readPixel, destroy} = await createMaterialFixture();
  try {
    const uniforms = {
      baseColorFactor: [0, 0, 0, 1] as [number, number, number, number],
      specularIntensityFactor: 0,
      sheenColorFactor: [1, 1, 1] as [number, number, number],
      sheenColorUVSet: 0,
      sheenRoughnessFactor: 1,
      sheenRoughnessUVSet: 0
    };
    replacement.writeData(new Uint8Array([0, 0, 0, 255, 255, 255, 255, 0]));
    options.surfaces = [
      {
        ...surface,
        material: {
          id: 'sheen-material',
          uniforms,
          bindings: {pbr_sheenColorSampler: map, pbr_sheenRoughnessSampler: replacement}
        }
      }
    ];
    options.samplingFrameIndex = 0;
    options.lights = [
      {
        type: 'directional',
        direction: [-1, 0, -0.25],
        color: [1, 1, 1],
        intensity: 8
      }
    ];
    const red = await readPixel();
    expect(red[0]).toBeGreaterThan(20);
    expect(red.slice(1)).toEqual([0, 0]);
    uniforms.sheenColorUVSet = 1;
    expect(await readPixel()).toEqual([0, 0, red[0]]);
    uniforms.sheenRoughnessUVSet = 1;
    expect(await readPixel()).toEqual([0, 0, 0]);
  } finally {
    destroy();
  }
}, 180_000);
