// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Geometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core/matrix';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('converges to linear over compositing for layered glTF blend materials', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, geometry, map, renderer, readPixel, destroy} =
    await createMaterialFixture();
  try {
    options.background = [0, 0, 1, 1];
    options.lights = [];
    options.samplesPerPixel = 16;
    options.historySampleLimit = 256;
    options.samplingSeed = 73;
    const front = {
      ...surface,
      id: 'front',
      geometry: new Geometry({
        topology: 'triangle-list',
        attributes: {
          ...geometry.attributes,
          COLOR_0: {size: 4, value: new Float32Array([1, 1, 1, 0.5, 1, 1, 1, 0.5, 1, 1, 1, 0.5])}
        }
      }),
      material: {
        ...surface.material,
        alphaMode: 'BLEND' as const,
        uniforms: {
          ...surface.material.uniforms,
          baseColorFactor: [1, 1, 1, 0.5] as [number, number, number, number],
          alphaCutoff: 1,
          unlit: true
        }
      }
    };
    const back = {
      ...surface,
      id: 'back',
      transforms: [new Matrix4().translate([0, 0, -1])],
      material: {
        id: 'green',
        alphaMode: 'BLEND' as const,
        uniforms: {
          unlit: true,
          baseColorFactor: [0, 1, 0, 0.5] as [number, number, number, number]
        }
      }
    };
    map.writeData(new Uint8Array([255, 0, 0, 128, 255, 0, 0, 128]));
    options.surfaces = [back, front];
    let pixel = await readPixel();
    for (let frame = 1; frame < 16; frame++) pixel = await readPixel();
    expect(Math.abs(pixel[0] / 255 - 0.125)).toBeLessThan(0.065);
    expect(Math.abs(pixel[1] / 255 - 0.4375)).toBeLessThan(0.09);
    expect(Math.abs(pixel[2] / 255 - 0.4375)).toBeLessThan(0.09);
    expect((await renderer.pick(options.id, 4, 4))?.surfaceId).toBe('front');

    map.writeData(new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0]));
    options.progressive = false;
    expect((await readPixel())[0]).toBe(0);
    expect((await renderer.pick(options.id, 4, 4))?.surfaceId).toBe('back');
    options.surfaces = [back, {...front, material: {...front.material, alphaMode: 'OPAQUE'}}];
    expect(await readPixel()).toEqual([255, 0, 0]);
    expect((await renderer.pick(options.id, 4, 4))?.surfaceId).toBe('front');
  } finally {
    destroy();
  }
}, 180_000);
