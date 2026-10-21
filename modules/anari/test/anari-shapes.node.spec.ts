// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {TorusGeometry} from '@luma.gl/engine';
import {ANARIDevice} from '@luma.gl/anari';
import {ANARISceneSchema} from '@luma.gl/anari/schemas';
import {NullDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {expect, it} from 'vitest';
import {ANARISceneAdapter} from '../src/anari-scene-adapter';
import {makeChartShapesScene} from '../../../examples/anari/scenes/chart-baseline';

it('shape scenes share authored geometry and placement identities across renderers', () => {
  const raster = makeChartShapesScene('default');
  const ray = makeChartShapesScene('raytrace');
  expect(ANARISceneSchema.safeParse(raster).success).toBe(true);
  expect(ANARISceneSchema.safeParse(ray).success).toBe(true);
  expect(raster.geometries).toEqual(ray.geometries);
  expect(raster.instances).toEqual(ray.instances);
  expect(new Set(ray.instances!.map(instance => instance['@@id'])).size).toBe(19);
  for (const dimensions of [
    {majorRadius: 0.2},
    {minorRadius: 1},
    {majorRadius: 1, minorRadius: 2}
  ]) {
    ray.geometries.point = {'@@type': 'torus', ...dimensions};
    expect(ANARISceneSchema.safeParse(ray).success).toBe(false);
  }
  for (const arc of [0, -1, Math.PI * 3, Infinity]) {
    ray.geometries.point = {'@@type': 'torus', arc};
    expect(ANARISceneSchema.safeParse(ray).success).toBe(false);
  }
});

it('retained mesh shapes preserve semantics and rebuild only after committed dimensions', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const adapter = new ANARISceneAdapter();
  for (const subtype of ['hexPrism', 'torus'] as const) {
    const geometry = device.newGeometry(subtype, {
      radius: 1,
      height: 2,
      majorRadius: 1,
      minorRadius: 0.25
    });
    const surface = device.newSurface({geometry, material: device.newMaterial('matte')});
    const instance = device.newInstance({
      group: device.newGroup({surface: [surface]}),
      transform: new Matrix4().translate([2, 0, 0])
    });
    const world = device.newWorld({instance: [instance]});
    const frame = device.newFrame({
      world,
      camera: device.newCamera('perspective'),
      renderer: device.newRenderer('default'),
      size: [32, 32]
    });
    const initial = adapter.makeRenderOptions(frame)!;
    const mesh = initial.surfaces[0].geometry;
    expect(Object.keys(mesh.attributes)).toContain('POSITION');
    expect(Object.keys(mesh.attributes)).toContain('NORMAL');
    expect(Object.keys(mesh.attributes)).toContain('TEXCOORD_0');
    expect(adapter.getAnalyticPrimitives(world)[surface.id]).toBeUndefined();
    expect(initial.surfaces[0].instanceIds).toHaveLength(1);
    expect(adapter.makeRenderOptions(frame)!.surfaces[0].geometry).toBe(mesh);
    geometry.setParameter(subtype === 'hexPrism' ? 'radius' : 'majorRadius', 2);
    expect(adapter.makeRenderOptions(frame)!.surfaces[0].geometry).toBe(mesh);
    geometry.commitParameters();
    const updated = adapter.makeRenderOptions(frame)!;
    expect(updated.surfaces[0].geometry).not.toBe(mesh);
    expect(updated.surfaces[0].instanceIds).toEqual(initial.surfaces[0].instanceIds);
    if (subtype === 'hexPrism') expect(mesh.attributes.POSITION.value.length / 9).toBe(36);
  }
  adapter.destroy();
  device.destroy();
});

it('torus adapter keeps shared indexed normals and open partial sweeps', () => {
  const full = new TorusGeometry({
    majorRadius: 1,
    minorRadius: 0.25,
    majorSegments: 16,
    minorSegments: 8
  });
  const partial = new TorusGeometry({
    majorRadius: 1,
    minorRadius: 0.25,
    majorSegments: 16,
    minorSegments: 8,
    arc: Math.PI
  });
  expect(partial.indices!.value.length).toBe(full.indices!.value.length);
  const positions = partial.attributes.POSITION.value;
  for (let index = 2; index < positions.length; index += 3)
    expect(positions[index]).toBeLessThanOrEqual(0.000001);
  expect(full.attributes.NORMAL.value.length).toBe(full.attributes.POSITION.value.length);
  expect(() => new TorusGeometry({majorRadius: 1, minorRadius: 2})).toThrow();
});
