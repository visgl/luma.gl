// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('selects a coarser mip for emission seen through a dielectric bounce', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, geometry, mipMap, readPixel, destroy} = await createMaterialFixture();
  try {
    const receiver = {
      ...surface,
      id: 'emissive-target',
      geometry: new Geometry({
        topology: 'triangle-list',
        attributes: {
          ...geometry.attributes,
          TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 64, 0, 32, 64])}
        }
      }),
      transforms: [new Matrix4().translate([0, 0, -2])],
      material: {
        id: 'mip-emitter',
        uniforms: {emissiveFactor: [1, 1, 1] as [number, number, number]},
        bindings: {pbr_emissiveSampler: mipMap}
      }
    };
    options.samplingFrameIndex = 0;
    options.transportMode = 'pbr';
    options.maxBounces = 1;
    options.lights = [];
    options.surfaces = [
      {
        ...surface,
        material: {id: 'clear-sheet', uniforms: {transmissionFactor: 1, ior: 1}}
      },
      receiver
    ];
    const filtered = await readPixel();
    expect(filtered[2]).toBeGreaterThan(100);
    expect(filtered.slice(0, 2)).toEqual([0, 0]);
    receiver.geometry = geometry;
    expect(await readPixel()).toEqual([filtered[2], 0, 0]);
  } finally {
    destroy();
  }
}, 180_000);
