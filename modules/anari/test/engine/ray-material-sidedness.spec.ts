// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Geometry} from '@luma.gl/engine';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('updates ray color and picking when a retained triangle becomes double sided', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, geometry, surface, renderer, readPixel, destroy} = await createMaterialFixture();
  try {
    options.background = [0, 0, 1, 1];
    options.progressive = false;
    const material = {...surface.material, doubleSided: false};
    options.surfaces = [
      {
        ...surface,
        material,
        geometry: new Geometry({
          topology: 'triangle-list',
          attributes: geometry.attributes,
          indices: new Uint16Array([0, 2, 1])
        })
      }
    ];
    expect(await readPixel()).toEqual([0, 0, 255]);
    expect(await renderer.pick(options.id, 4, 4)).toBeNull();

    material.doubleSided = true;
    expect(await readPixel()).toEqual([255, 0, 0]);
    expect((await renderer.pick(options.id, 4, 4))?.surfaceId).toBe(surface.id);
  } finally {
    destroy();
  }
}, 180_000);
