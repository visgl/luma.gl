// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Matrix4} from '@math.gl/core/matrix';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it.each([
  'diffuse',
  'pbr'
] as const)('preserves %s emitter radiance when explicit sampling is enabled', async transportMode => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, geometry, mipMap, readPixel, destroy} = await createMaterialFixture();
  try {
    options.surfaces = [
      {
        ...surface,
        material: {
          id: 'mis-receiver',
          uniforms: transportMode === 'pbr' ? {metallicRoughnessValues: [0.65, 0.45]} : {}
        }
      },
      {
        ...surface,
        id: 'large-emitter',
        transforms: [new Matrix4().translate([0, 0, 5]).scale([8, 8, 1])],
        material: {id: 'emitter', uniforms: {emissiveFactor: [0.5, 0, 0]}}
      }
    ];
    options.lights = [];
    options.transportMode = transportMode;
    options.maxBounces = 1;
    options.samplesPerPixel = 16;
    options.samplingFrameIndex = 0;
    const estimate = async () => {
      let sum = 0;
      for (let seed = 0; seed < 12; seed++) {
        options.samplingSeed = seed;
        sum += (await readPixel())[0];
      }
      return sum / 12;
    };
    const bsdfOnly = await estimate();
    expect(bsdfOnly).toBeGreaterThan(60);
    options.emitterSampling = true;
    for (const selection of ['uniform', 'power'] as const) {
      options.emitterSelection = selection;
      expect(Math.abs((await estimate()) - bsdfOnly)).toBeLessThan(12);
    }

    mipMap.writeData(new Uint8Array(32 * 32 * 4), {width: 32, height: 32});
    const emitter = options.surfaces[1];
    emitter.geometry = new Geometry({
      topology: 'triangle-list',
      attributes: {
        ...geometry.attributes,
        TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 128, 0, 64, 128])}
      }
    });
    emitter.material = {
      ...emitter.material,
      alphaMode: 'MASK',
      uniforms: {...emitter.material.uniforms, alphaCutoff: 0.5},
      bindings: {pbr_baseColorSampler: mipMap}
    };
    expect(await estimate()).toBe(0);
    options.filteredCutouts = true;
    expect(Math.abs((await estimate()) - bsdfOnly)).toBeLessThan(12);
    options.maxBounces = 0;
    expect(await estimate()).toBeGreaterThan(0);
    options.filteredCutouts = false;
    expect(await estimate()).toBe(0);
  } finally {
    destroy();
  }
}, 180_000);
