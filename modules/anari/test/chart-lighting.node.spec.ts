// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ANARIDevice} from '@luma.gl/anari';
import {ANARISceneSchema} from '@luma.gl/anari/schemas';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';
import {makeChartLightingScene} from '../../../examples/showcase/scene/chart-baseline';
import {createANARIJSONScene} from '../../../examples/showcase/scene/playground-scene';
import {ANARISceneAdapter} from '../src/anari-scene-adapter';

it('chart lighting keeps authored masks, retained ring identities and explicit emitter settings', () => {
  const description = makeChartLightingScene();
  expect(ANARISceneSchema.safeParse(description).success).toBe(true);
  expect(description.renderer?.emitterSampling).toBe(true);
  expect(description.materials.mask.alphaMode).toBe('mask');
  expect(description.geometries.bar['@@type']).toBe('ring');
  const device = new ANARIDevice(new NullDevice({}));
  const adapter = new ANARISceneAdapter();
  const scene = createANARIJSONScene(device, description);
  try {
    const surfaces = adapter.makeRenderOptions(scene.frame)!.surfaces;
    expect(surfaces).toHaveLength(6);
    expect(new Set(scene.instanceIdentifiers.values()).size).toBe(21);
    const mask = surfaces.find(surface => surface.material.alphaMode === 'MASK')!;
    expect(mask.material.alphaMode).toBe('MASK');
    expect(mask.material.uniforms?.baseColorFactor?.[3]).toBe(0);
    expect(mask.material.uniforms?.alphaCutoff).toBe(0.5);
  } finally {
    adapter.destroy();
    scene.destroy();
    device.destroy();
  }
  description.geometries.bar = {'@@type': 'ring', innerRadius: 1, outerRadius: 0.5};
  expect(ANARISceneSchema.safeParse(description).success).toBe(false);
});
