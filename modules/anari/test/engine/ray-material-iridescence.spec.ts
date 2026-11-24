// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core/matrix';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('ray iridescence uses red strength and green film thickness in direct and bounce lighting', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, map, replacement, readPixel, destroy} = await createMaterialFixture();
  try {
    const uniforms = {
      baseColorFactor: [0, 0, 0, 1] as [number, number, number, number],
      iridescenceFactor: 1,
      iridescenceUVSet: 0,
      iridescenceThicknessUVSet: 1,
      iridescenceThicknessRange: [0, 200] as [number, number]
    };
    replacement.writeData(new Uint8Array([255, 0, 255, 255, 0, 255, 0, 255]));
    const receiver = {
      ...surface,
      material: {
        id: 'film-material',
        uniforms,
        bindings: {pbr_iridescenceSampler: map, pbr_iridescenceThicknessSampler: replacement}
      }
    };
    options.surfaces = [receiver];
    options.samplingFrameIndex = 0;
    options.lights = [{type: 'directional', direction: [0, 0, -1], color: [1, 1, 1], intensity: 3}];
    const coated = await readPixel();
    expect(Math.max(...coated) - Math.min(...coated)).toBeGreaterThan(5);
    uniforms.iridescenceThicknessUVSet = 0;
    const bare = await readPixel();
    expect(bare[1]).toBe(bare[0]);
    expect(bare[2]).toBe(bare[0]);
    uniforms.iridescenceThicknessUVSet = 1;
    uniforms.iridescenceUVSet = 1;
    expect(await readPixel()).toEqual(bare);

    options.surfaces = [
      receiver,
      {
        ...surface,
        id: 'film-emitter',
        transforms: [new Matrix4().translate([0, 0, 5])],
        material: {id: 'film-emitter-material', uniforms: {emissiveFactor: [16, 16, 16]}}
      }
    ];
    options.lights = [];
    options.transportMode = 'pbr';
    options.maxBounces = 1;
    options.samplesPerPixel = 16;
    options.samplingSeed = 17;
    const bareBounce = await readPixel();
    expect(bareBounce[0]).toBeGreaterThan(0);
    expect(bareBounce[1]).toBe(bareBounce[0]);
    expect(bareBounce[2]).toBe(bareBounce[0]);
    uniforms.iridescenceUVSet = 0;
    const coatedBounce = await readPixel();
    expect(Math.max(...coatedBounce) - Math.min(...coatedBounce)).toBeGreaterThan(5);
  } finally {
    destroy();
  }
}, 180_000);
