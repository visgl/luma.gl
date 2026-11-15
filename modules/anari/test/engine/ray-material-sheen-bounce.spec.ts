// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('ray PBR bounces carry sheen reflection from an emissive surface', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, readPixel, destroy} = await createMaterialFixture();
  try {
    const uniforms = {
      baseColorFactor: [0, 0, 0, 1] as [number, number, number, number],
      specularIntensityFactor: 0,
      sheenColorFactor: [1, 0, 0] as [number, number, number],
      sheenRoughnessFactor: 1
    };
    options.surfaces = [
      {...surface, material: {id: 'sheen-receiver-material', uniforms}},
      {
        ...surface,
        id: 'sheen-emitter',
        transforms: [new Matrix4().translate([0, 0, 5])],
        material: {id: 'sheen-emitter-material', uniforms: {emissiveFactor: [12, 12, 12]}}
      }
    ];
    options.lights = [];
    options.transportMode = 'pbr';
    options.maxBounces = 1;
    options.samplesPerPixel = 16;
    options.samplingFrameIndex = 0;
    options.samplingSeed = 17;
    const reflected = await readPixel();
    expect(reflected[0]).toBeGreaterThan(8);
    expect(reflected.slice(1)).toEqual([0, 0]);
    uniforms.sheenColorFactor = [0, 0, 0];
    expect(await readPixel()).toEqual([0, 0, 0]);
  } finally {
    destroy();
  }
}, 180_000);
