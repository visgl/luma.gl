// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Geometry} from '@luma.gl/engine';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('interpolates glTF vertex color and applies vertex alpha to ray masks', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, geometry, surface, renderer, readPixel, destroy} = await createMaterialFixture();
  try {
    options.background = [0, 0, 0, 1];
    options.progressive = false;
    options.samplingFrameIndex = 0;
    const colored = {
      ...surface,
      geometry: new Geometry({
        topology: 'triangle-list',
        attributes: {
          ...geometry.attributes,
          COLOR_0: {
            size: 4,
            normalized: true,
            value: new Uint8Array([255, 0, 0, 63, 0, 255, 0, 63, 0, 0, 255, 63])
          }
        }
      }),
      material: {
        id: 'vertex-color',
        alphaMode: 'OPAQUE' as const,
        uniforms: {
          baseColorFactor: [1, 1, 1, 1] as [number, number, number, number],
          alphaCutoff: 0.5
        }
      }
    };
    options.surfaces = [colored];
    const rgb = await readPixel();
    expect(rgb.every(channel => channel > 30 && channel < 200)).toBe(true);
    expect(rgb.reduce((sum, channel) => sum + channel, 0)).toBeCloseTo(255, -1);
    expect(await renderer.pick(options.id, 4, 4)).not.toBeNull();

    options.surfaces = [{...colored, material: {...colored.material, alphaMode: 'MASK'}}];
    expect(await readPixel()).toEqual([0, 0, 0]);
    expect(await renderer.pick(options.id, 4, 4)).toBeNull();
  } finally {
    destroy();
  }
}, 180_000);

it('updates packed triangle geometry and picking after retained morph weight changes', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, surface, renderer, readPixel, destroy} = await createMaterialFixture();
  try {
    options.background = [0, 0, 0, 1];
    options.progressive = false;
    options.samplingFrameIndex = 0;
    options.sceneRevisions = {
      identity: 'morph',
      topology: 0,
      transforms: 0,
      materials: 0,
      lights: 0
    };
    const posed = {
      ...surface,
      morphTargets: [{POSITION: new Float32Array([12, 0, 0, 12, 0, 0, 12, 0, 0])}],
      morphWeights: [0]
    };
    options.surfaces = [posed];
    const before = await readPixel();
    expect(before[0]).toBeGreaterThan(100);
    expect(await renderer.pick(options.id, 4, 4)).not.toBeNull();

    posed.morphWeights[0] = 1;
    expect(await readPixel()).toEqual([0, 0, 0]);
    expect(await renderer.pick(options.id, 4, 4)).toBeNull();

    posed.morphWeights[0] = 0;
    expect(await readPixel()).toEqual(before);
    expect(await renderer.pick(options.id, 4, 4)).not.toBeNull();
  } finally {
    destroy();
  }
}, 180_000);
