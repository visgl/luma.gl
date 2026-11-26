// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {webgpuAdapter} from '@luma.gl/core/webgpu';
import {Geometry} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core/matrix';
import {expect, it} from 'vitest';
import {createMaterialFixture} from './ray-material-fixture';

it('updates skinned ray geometry after an in-place joint edit and composes morphs', async () => {
  if (!webgpuAdapter.isSupported()) return;
  const {options, geometry, surface, renderer, readPixel, getStatistics, destroy} =
    await createMaterialFixture();
  try {
    options.background = [0, 0, 0, 1];
    options.progressive = false;
    options.samplingFrameIndex = 0;
    options.sceneRevisions = {
      identity: 'skin',
      topology: 0,
      transforms: 0,
      materials: 0,
      lights: 0
    };
    const jointMatrices = new Float32Array([...new Matrix4(), ...new Matrix4()]);
    const skinned = {
      ...surface,
      geometry: new Geometry({
        topology: 'triangle-list',
        attributes: {
          ...geometry.attributes,
          JOINTS_0: {size: 4, value: new Uint16Array([0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0])},
          WEIGHTS_0: {
            size: 4,
            normalized: true,
            value: new Uint8Array([128, 127, 0, 0, 128, 127, 0, 0, 128, 127, 0, 0])
          }
        }
      }),
      morphTargets: [{POSITION: new Float32Array([-8, 0, 0, -8, 0, 0, -8, 0, 0])}],
      morphWeights: [0],
      skin: {jointMatrices}
    };
    options.surfaces = [skinned];
    const before = await readPixel();
    expect(before).toEqual([255, 0, 0]);
    expect(getStatistics()?.rayTracing?.graph?.acceleration).toBeDefined();
    const buildNodeCount = getStatistics()?.rayTracing?.graph?.topology?.nodeCount ?? 0;
    expect((await renderer.pick(options.id, 4, 4))?.surfaceId).toBe(skinned.id);

    jointMatrices.set(new Matrix4().translate([16, 0, 0]), 16);
    expect(await readPixel()).toEqual([0, 0, 0]);
    expect(getStatistics()?.rayTracing?.graph?.topology?.nodeCount).toBeLessThan(buildNodeCount);
    expect(getStatistics()?.rayTracing?.graph?.refit).toBeDefined();
    expect(getStatistics()?.rayTracing?.graph?.acceleration).toBeUndefined();
    expect(await renderer.pick(options.id, 4, 4)).toBeNull();

    options.surfaces = [
      skinned,
      {
        ...skinned,
        id: 'other-pose',
        skin: {jointMatrices: new Float32Array([...new Matrix4(), ...new Matrix4()])}
      }
    ];
    options.sceneRevisions.topology++;
    expect(await readPixel()).toEqual(before);
    expect((await renderer.pick(options.id, 4, 4))?.surfaceId).toBe('other-pose');
    expect(getStatistics()?.rayTracing?.graph?.acceleration).toBeDefined();

    options.surfaces = [skinned];
    options.sceneRevisions.topology++;
    expect(await readPixel()).toEqual([0, 0, 0]);
    skinned.morphWeights[0] = 1;
    options.sceneRevisions.topology++;
    expect(await readPixel()).toEqual(before);
    expect(getStatistics()?.rayTracing?.graph?.refit).toBeDefined();
    expect((await renderer.pick(options.id, 4, 4))?.surfaceId).toBe(skinned.id);

    expect(await readPixel()).toEqual(before);
    expect(getStatistics()?.rayTracing?.graph?.topology).toBeUndefined();
    expect(getStatistics()?.rayTracing?.graph?.refit).toBeUndefined();
  } finally {
    destroy();
  }
}, 180_000);
