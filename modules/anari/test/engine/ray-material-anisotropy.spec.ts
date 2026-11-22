// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('ray anisotropy rotates the highlight and uses the map blue channel for strength', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, map, readPixel, destroy} = await createMaterialFixture();
  try {
    const geometry = new Geometry({
      topology: 'triangle-list',
      attributes: {
        ...surface.geometry.attributes,
        TEXCOORD_0: {size: 2, value: new Float32Array([0.5, 0, 1, 0, 0.75, 1])},
        TEXCOORD_1: {size: 2, value: new Float32Array([0, 0, 0.5, 0, 0.25, 1])}
      }
    });
    const uniforms = {
      baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
      metallicRoughnessValues: [1, 0.35] as [number, number],
      anisotropyStrength: 0,
      anisotropyRotation: 0,
      anisotropyUVSet: 0,
      anisotropyMapEnabled: false
    };
    map.writeData(new Uint8Array([255, 128, 0, 255, 255, 128, 255, 255]));
    options.surfaces = [
      {
        ...surface,
        geometry,
        material: {id: 'brushed-metal', uniforms, bindings: {pbr_anisotropySampler: map}}
      }
    ];
    options.samplingFrameIndex = 0;
    options.lights = [
      {type: 'directional', direction: [-0.7, 0, -1], color: [1, 1, 1], intensity: 1}
    ];
    const isotropic = await readPixel();
    uniforms.anisotropyStrength = 0.9;
    const tangent = await readPixel();
    uniforms.anisotropyRotation = Math.PI / 2;
    expect(tangent[0] - (await readPixel())[0]).toBeGreaterThan(5);
    uniforms.anisotropyRotation = 0;
    uniforms.anisotropyMapEnabled = true;
    expect((await readPixel())[0]).toBeCloseTo(tangent[0], -1);
    uniforms.anisotropyUVSet = 1;
    expect(await readPixel()).toEqual(isotropic);
  } finally {
    destroy();
  }
}, 180_000);
