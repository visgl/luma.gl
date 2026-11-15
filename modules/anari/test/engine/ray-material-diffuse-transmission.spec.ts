// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('ray diffuse transmission tints backlighting and emissive bounces', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, map, replacement, readPixel, destroy} = await createMaterialFixture();
  try {
    map.writeData(new Uint8Array([0, 0, 0, 255, 255, 255, 255, 0]));
    const uniforms = {
      baseColorFactor: [0, 0, 0, 1] as [number, number, number, number],
      specularIntensityFactor: 0,
      clearcoatFactor: 0,
      sheenColorFactor: [0, 0, 0] as [number, number, number],
      diffuseTransmissionFactor: 1,
      diffuseTransmissionColorUVSet: 1,
      diffuseTransmissionUVSet: 0
    };
    const sheet = {
      ...surface,
      material: {
        id: 'translucent-sheet',
        uniforms,
        bindings: {
          pbr_diffuseTransmissionSampler: map,
          pbr_diffuseTransmissionColorSampler: replacement
        }
      }
    };
    options.samplingFrameIndex = 0;
    options.transportMode = 'pbr';
    options.surfaces = [sheet];
    options.lights = [{type: 'directional', direction: [0, 0, 1], color: [1, 1, 1], intensity: 2}];
    const backlit = await readPixel();
    expect(backlit[1]).toBeGreaterThan(80);
    expect([backlit[0], backlit[2]]).toEqual([0, 0]);
    uniforms.clearcoatFactor = 1;
    expect((await readPixel())[1]).toBeLessThan(backlit[1]);
    uniforms.clearcoatFactor = 0;
    uniforms.sheenColorFactor = [1, 1, 1];
    expect((await readPixel())[1]).toBeLessThan(backlit[1]);
    uniforms.sheenColorFactor = [0, 0, 0];
    options.lights = [{type: 'ambient', color: [1, 1, 1], intensity: 0.5}];
    const ambient = await readPixel();
    expect(ambient[1]).toBeGreaterThan(100);
    expect([ambient[0], ambient[2]]).toEqual([0, 0]);
    uniforms.diffuseTransmissionUVSet = 1;
    expect(await readPixel()).toEqual([0, 0, 0]);

    options.lights = [];
    options.surfaces = [
      sheet,
      {
        ...surface,
        id: 'backlight',
        transforms: [new Matrix4().translate([0, 0, -1])],
        material: {id: 'backlight-material', uniforms: {emissiveFactor: [2, 2, 2]}}
      }
    ];
    options.maxBounces = 1;
    options.samplesPerPixel = 16;
    options.samplingSeed = 17;
    expect(await readPixel()).toEqual([0, 0, 0]);
    uniforms.diffuseTransmissionUVSet = 0;
    const bounced = await readPixel();
    expect(bounced[1]).toBeGreaterThan(40);
    expect([bounced[0], bounced[2]]).toEqual([0, 0]);
    options.maxBounces = 0;
    options.emitterSampling = true;
    const sampled = await readPixel();
    expect(sampled[1]).toBeGreaterThan(20);
    expect([sampled[0], sampled[2]]).toEqual([0, 0]);
  } finally {
    destroy();
  }
}, 180_000);
