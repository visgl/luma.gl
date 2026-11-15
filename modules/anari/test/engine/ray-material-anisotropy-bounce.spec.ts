// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('ray anisotropic PBR bounces respond to a rotated brushed-metal axis', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, readPixel, destroy} = await createMaterialFixture();
  try {
    const geometry = new Geometry({
      topology: 'triangle-list',
      attributes: {
        ...surface.geometry.attributes,
        TEXCOORD_0: {size: 2, value: new Float32Array([0, 0, 1, 0, 0.5, 1])}
      }
    });
    const uniforms = {
      baseColorFactor: [0.7, 0.7, 0.7, 1] as [number, number, number, number],
      metallicRoughnessValues: [1, 0.35] as [number, number],
      anisotropyStrength: 0.9,
      anisotropyRotation: 0
    };
    options.surfaces = [
      {...surface, geometry, material: {id: 'brushed-metal-bounce', uniforms}},
      {
        ...surface,
        id: 'strip-emitter',
        transforms: [new Matrix4().translate([0, 0, 5]).scale([1, 0.15, 1])],
        material: {id: 'strip-emitter-material', uniforms: {emissiveFactor: [1, 1, 1]}}
      }
    ];
    options.lights = [];
    options.transportMode = 'pbr';
    options.maxBounces = 1;
    options.samplesPerPixel = 32;
    options.samplingFrameIndex = 0;
    options.samplingSeed = 17;
    const alongStrip = (await readPixel())[0];
    uniforms.anisotropyRotation = Math.PI / 2;
    const acrossStrip = (await readPixel())[0];
    expect(alongStrip - acrossStrip).toBeGreaterThan(10);
  } finally {
    destroy();
  }
}, 180_000);
