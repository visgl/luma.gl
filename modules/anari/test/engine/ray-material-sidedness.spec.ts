// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Geometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core/matrix';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('matches triangle sidedness across color, picking, and mirrored emitter sampling', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, geometry, surface, renderer, readPixel, destroy} = await createMaterialFixture();
  try {
    options.background = [0, 0, 1, 1];
    options.progressive = false;
    const material = {...surface.material, doubleSided: false};
    const reversedGeometry = new Geometry({
      topology: 'triangle-list',
      attributes: geometry.attributes,
      indices: new Uint16Array([0, 2, 1])
    });
    const reversed = {...surface, material, geometry: reversedGeometry};
    options.surfaces = [reversed];
    expect(await readPixel()).toEqual([0, 0, 255]);
    expect(await renderer.pick(options.id, 4, 4)).toBeNull();

    material.doubleSided = true;
    expect(await readPixel()).toEqual([255, 0, 0]);
    expect((await renderer.pick(options.id, 4, 4))?.surfaceId).toBe(surface.id);

    // A negative X scale must preserve the authored facing of a glTF instance.
    material.doubleSided = false;
    reversed.transforms = [new Matrix4().scale([-1, 1, 1])];
    expect(await readPixel()).toEqual([0, 0, 255]);
    expect(await renderer.pick(options.id, 4, 4)).toBeNull();

    options.background = [0, 0, 0, 1];
    options.lights = [];
    options.emitterSampling = true;
    options.samplesPerPixel = 16;
    options.samplingSeed = 31;
    const receiver = {...surface, material: {id: 'receiver'}};
    const emitter = {
      ...reversed,
      id: 'emitter',
      material: {
        id: 'emitter',
        doubleSided: false,
        uniforms: {emissiveFactor: [8, 8, 8] as [number, number, number]}
      },
      transforms: [new Matrix4().translate([1.2, 0, 2]).scale([-0.2, 0.2, 0.2])]
    };
    options.surfaces = [receiver, emitter];
    const fromFront = (await readPixel())[0];
    expect(fromFront).toBeGreaterThan(10);

    options.surfaces = [receiver, {...emitter, geometry}];
    expect((await readPixel())[0]).toBe(0);
  } finally {
    destroy();
  }
}, 180_000);
