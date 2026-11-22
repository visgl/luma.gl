// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Geometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core/matrix';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('renders glTF unlit base color independently of analytic and environment lighting', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, readPixel, destroy} = await createMaterialFixture();
  try {
    options.progressive = false;
    options.samplingFrameIndex = 0;
    options.lights = [];
    const unlitSurface = {
      ...surface,
      material: {
        ...surface.material,
        uniforms: {...surface.material.uniforms, unlit: true}
      }
    };
    options.surfaces = [unlitSurface];
    for (const transportMode of ['diffuse', 'pbr'] as const) {
      options.transportMode = transportMode;
      options.maxBounces = 2;
      options.lights = [];
      options.environmentRadiance = [0, 0, 0];
      expect(await readPixel()).toEqual([255, 0, 0]);
      options.lights = [{type: 'ambient', intensity: 10}];
      options.environmentRadiance = [0, 1, 1];
      expect(await readPixel()).toEqual([255, 0, 0]);
    }
    options.lights = [];
    options.environmentRadiance = [0, 0, 0];
    options.surfaces = [
      {
        ...surface,
        material: {
          id: 'clear-sheet',
          uniforms: {baseColorFactor: [1, 1, 1, 1], transmissionFactor: 1, ior: 1}
        }
      },
      {...unlitSurface, id: 'unlit-behind-glass', transforms: [new Matrix4().translate([0, 0, -2])]}
    ];
    expect(await readPixel()).toEqual([255, 0, 0]);
    options.surfaces = [unlitSurface];
    unlitSurface.material.uniforms.unlit = false;
    expect(await readPixel()).toEqual([0, 0, 0]);
  } finally {
    destroy();
  }
}, 180_000);

it('uses authored tangent handedness on a triangle with degenerate UVs', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, geometry, replacement, renderer, readPixel, destroy} =
    await createMaterialFixture();
  try {
    replacement.writeData(new Uint8Array([128, 255, 200, 255, 128, 255, 200, 255]));
    options.progressive = false;
    options.samplingFrameIndex = 0;
    options.lights = [{type: 'directional', direction: [0, -1, -0.4], intensity: 1}];
    const mapped = {
      ...surface,
      material: {
        id: 'authored-tangent-material',
        uniforms: {normalScale: 1},
        bindings: {pbr_normalSampler: replacement}
      }
    };
    options.surfaces = [mapped];
    const fallback = (await readPixel())[0];
    const values: number[] = [];
    for (const handedness of [1, -1]) {
      mapped.geometry = new Geometry({
        topology: 'triangle-list',
        attributes: {
          ...geometry.attributes,
          TANGENT: {
            size: 4,
            value: new Float32Array([1, 0, 0, handedness, 1, 0, 0, handedness, 1, 0, 0, handedness])
          }
        }
      });
      values.push((await readPixel())[0]);
    }
    expect(values[0]).toBeGreaterThan(fallback + 15);
    expect(values[1]).toBeLessThan(fallback);
    mapped.transforms = [new Matrix4().scale([-1, 1, 1])];
    expect(Math.abs((await readPixel())[0] - values[1])).toBeLessThanOrEqual(2);
    expect((await renderer.pick(options.id, 4, 4))?.normal.map(component => component + 0)).toEqual(
      [0, 0, 1]
    );
  } finally {
    destroy();
  }
}, 180_000);
