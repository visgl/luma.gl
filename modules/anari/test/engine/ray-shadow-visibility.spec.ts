// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Geometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core/matrix';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('uses triangle alpha mips consistently for color and picking when enabled', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const fixture = await createMaterialFixture();
  const {options, surface, geometry, renderer, readPixel, destroy} = fixture;
  try {
    const texture = fixture.mipMap;
    texture.writeData(new Uint8Array(32 * 32 * 4), {width: 32, height: 32});
    const triangle = new Geometry({
      topology: 'triangle-list',
      attributes: {
        ...geometry.attributes,
        TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])}
      }
    });
    options.background = [0, 0, 0, 1];
    options.surfaces = [
      {
        ...surface,
        geometry: triangle,
        material: {
          id: 'cutout',
          alphaMode: 'MASK',
          uniforms: {baseColorFactor: [1, 1, 1, 1], alphaCutoff: 0.5},
          bindings: {pbr_baseColorSampler: texture}
        }
      }
    ];
    expect(await readPixel()).toEqual([0, 0, 0]);
    expect(await renderer.pick(options.id, 4, 4)).toBeNull();
    options.filteredCutouts = true;
    expect((await readPixel()).some(channel => channel > 0)).toBe(true);
    expect(await renderer.pick(options.id, 4, 4)).not.toBeNull();
  } finally {
    destroy();
  }
}, 180_000);

it('tints an analytic shadow through a thin layer and retains opaque blocking', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, readPixel, destroy} = await createMaterialFixture();
  try {
    options.transportMode = 'pbr';
    options.progressive = false;
    options.samplingFrameIndex = 0;
    options.lights = [
      {type: 'directional', direction: [-1, 0, -1], color: [1, 1, 1], intensity: 2}
    ];
    const receiver = {
      ...surface,
      material: {
        id: 'receiver',
        uniforms: {baseColorFactor: [1, 1, 1, 1] as [number, number, number, number]}
      }
    };
    const sheet = {
      ...surface,
      id: 'sheet',
      transforms: [new Matrix4().translate([1.5, 0, 1.5]).scale([0.22, 0.22, 0.22])],
      material: {
        id: 'thin-sheet',
        uniforms: {
          diffuseTransmissionFactor: 0.5,
          diffuseTransmissionColorFactor: [1, 0, 0] as [number, number, number]
        }
      }
    };
    options.surfaces = [receiver];
    const [unoccluded] = await readPixel();
    expect(unoccluded).toBeGreaterThan(30);
    options.surfaces = [receiver, sheet];
    expect(await readPixel()).toEqual([0, 0, 0]);
    options.transmissiveShadows = true;
    const [red, green, blue] = await readPixel();
    expect(red).toBeGreaterThan(unoccluded * 0.35);
    expect(red).toBeLessThan(unoccluded * 0.55);
    expect([green, blue]).toEqual([0, 0]);
    sheet.material.uniforms.diffuseTransmissionFactor = 0;
    expect(await readPixel()).toEqual([0, 0, 0]);
  } finally {
    destroy();
  }
}, 180_000);
