// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

// Keep cheap, deterministic material integration checks on every PR. Extended
// UV/coat/transport permutations remain intact in the render-conformance group.
it('ray materials preserve texture coordinates, replacement, and normal response', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, replacement, readPixel, destroy} = await createMaterialFixture();
  try {
    expect(await readPixel()).toEqual([255, 0, 0]);
    surface.material.uniforms.baseColorUVSet = 1;
    expect(await readPixel()).toEqual([0, 0, 255]);
    surface.material.bindings.pbr_baseColorSampler = replacement;
    expect(await readPixel()).toEqual([0, 255, 0]);
    replacement.writeData(new Uint8Array([255, 128, 200, 255, 255, 128, 200, 255]));
    const normalSurface = {
      ...surface,
      geometry: new Geometry({
        topology: 'triangle-list',
        attributes: {
          ...surface.geometry.attributes,
          TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])}
        }
      }),
      material: {
        id: 'normal-smoke',
        uniforms: {
          baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
          normalScale: 0
        },
        bindings: {pbr_normalSampler: replacement}
      }
    };
    options.surfaces = [normalSurface];
    options.lights = [
      {type: 'directional', direction: [-1, 0, -0.4], color: [1, 1, 1], intensity: 1}
    ];
    const unmapped = (await readPixel())[0];
    normalSurface.material.uniforms.normalScale = 1;
    expect((await readPixel())[0]).toBeGreaterThan(unmapped + 20);
  } finally {
    destroy();
  }
}, 120_000);
