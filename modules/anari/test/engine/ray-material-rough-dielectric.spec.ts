// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Matrix4} from '@math.gl/core/matrix';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('spreads transmitted radiance with roughness and preserves the smooth limit', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, readPixel, destroy} = await createMaterialFixture();
  try {
    Object.assign(options, {
      background: [0, 0, 0, 1],
      lights: [],
      transportMode: 'pbr',
      maxBounces: 1,
      samplesPerPixel: 16,
      historySampleLimit: 256,
      samplingSeed: 61,
      samplingFrameIndex: 0,
      progressive: false
    });
    const glass = {
      ...surface,
      material: {
        id: 'dielectric',
        uniforms: {
          baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
          metallicRoughnessValues: [0, 0] as [number, number],
          transmissionFactor: 1,
          ior: 1.5
        }
      }
    };
    const target = {
      ...surface,
      id: 'target',
      transforms: [new Matrix4().translate([0, 0, -2]).scale([0.4, 0.4, 1])],
      material: {id: 'target', uniforms: {unlit: true}}
    };
    options.surfaces = [glass, target];
    const smooth = await readPixel();
    expect(smooth[0]).toBeGreaterThan(60);
    options.roughDielectricTransmission = true;
    expect(await readPixel()).toEqual(smooth);

    glass.material.uniforms.metallicRoughnessValues[1] = 1;
    options.progressive = true;
    delete options.samplingFrameIndex;
    let rough = await readPixel();
    for (let frame = 1; frame < 16; frame++) rough = await readPixel();
    expect(rough[0]).toBeGreaterThan(3);
    expect(rough[0]).toBeLessThan(smooth[0] * 0.8);

    options.roughDielectricTransmission = false;
    options.progressive = false;
    options.samplingFrameIndex = 0;
    expect(await readPixel()).toEqual(smooth);

    // The near-smooth lobe should still follow the interpolated normal on a
    // triangle whose geometric normal would send rays past the small target.
    const tilted = new Geometry({
      topology: 'triangle-list',
      attributes: {
        ...surface.geometry.attributes,
        NORMAL: {size: 3, value: new Float32Array([-0.8, 0, 0.6, -0.8, 0, 0.6, -0.8, 0, 0.6])}
      }
    });
    target.transforms = [new Matrix4().translate([1.2, 0, -2]).scale([0.17, 0.17, 1])];
    options.surfaces = [{...glass, geometry: tilted}, target];
    glass.material.uniforms.metallicRoughnessValues[1] = 0;
    const tiltedSmooth = await readPixel();
    expect(tiltedSmooth[0]).toBeGreaterThan(35);
    options.roughDielectricTransmission = true;
    glass.material.uniforms.metallicRoughnessValues[1] = 0.05;
    const tiltedRough = await readPixel();
    expect(tiltedRough[0]).toBeGreaterThan(tiltedSmooth[0] * 0.8);
    // A rear directional light couples to rough transmission at an open interface.
    options.surfaces = [glass];
    options.lights = [
      {type: 'directional', direction: [0, 0, 1], color: [1, 1, 1], intensity: 0.1}
    ];
    glass.material.uniforms.metallicRoughnessValues[1] = 0.8;
    options.roughDielectricTransmission = false;
    expect(await readPixel()).toEqual([0, 0, 0]);
    options.roughDielectricTransmission = true;
    expect((await readPixel())[0]).toBeGreaterThan(10);
  } finally {
    destroy();
  }
}, 180_000);
