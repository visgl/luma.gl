// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Matrix4} from '@math.gl/core/matrix';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('partially shadows an opaque receiver through a blended blocker', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, readPixel, destroy} = await createMaterialFixture();
  try {
    options.samplesPerPixel = 16;
    options.historySampleLimit = 256;
    options.samplingSeed = 109;
    options.shadows = true;
    options.lights = [
      {type: 'directional', direction: [-1, 0, -2], color: [1, 1, 1], intensity: 1}
    ];
    const receiver = {
      ...surface,
      material: {
        id: 'receiver',
        uniforms: {baseColorFactor: [1, 1, 1, 1] as [number, number, number, number]}
      }
    };
    options.surfaces = [receiver];
    const unshadowed = (await readPixel())[0];
    expect(unshadowed).toBeGreaterThan(30);
    options.surfaces = [
      receiver,
      {
        ...surface,
        id: 'blocker',
        transforms: [new Matrix4().translate([1, 0, 2]).scale([0.3, 0.3, 0.3])],
        material: {
          id: 'blocker',
          alphaMode: 'BLEND',
          uniforms: {baseColorFactor: [1, 1, 1, 0.5]}
        }
      }
    ];
    let pixel = await readPixel();
    for (let frame = 1; frame < 16; frame++) pixel = await readPixel();
    expect(Math.abs(pixel[0] / unshadowed - 0.5)).toBeLessThan(0.12);
  } finally {
    destroy();
  }
}, 180_000);
