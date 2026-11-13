// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {Geometry, GroupNode} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {
  ANARIDevice,
  SceneMeshNode,
  makeANARIWorldFromScenegraph,
  makeScenegraphFromANARIWorld,
  ScenegraphSurfaces
} from '@luma.gl/anari';

test('scenegraph snapshots preserve world transforms, shared geometry, materials and independent arrays', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const geometry = new Geometry({
    topology: 'triangle-list',
    attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}}
  });
  const material = {
    id: 'red',
    uniforms: {
      baseColorFactor: [0.8, 0.1, 0.1, 1] as [number, number, number, number],
      metallicRoughnessValues: [0, 0.7] as [number, number]
    }
  };
  const root = new GroupNode({
    matrix: new Matrix4().translate([2, 0, 0]),
    children: [
      new SceneMeshNode({geometry, material}),
      new SceneMeshNode({geometry, material, matrix: new Matrix4().translate([0, 3, 0])})
    ]
  });
  const world = makeANARIWorldFromScenegraph(device, root);
  const snapshot = makeScenegraphFromANARIWorld(world);
  const adapter = new ScenegraphSurfaces();
  const surfaces = adapter.getSurfaces(snapshot.scene);
  expect(surfaces).toHaveLength(1);
  expect(surfaces[0].transforms.map(matrix => Array.from(matrix).slice(12, 15))).toEqual([
    [2, 0, 0],
    [2, 3, 0]
  ]);
  expect(surfaces[0].material.uniforms?.baseColorFactor).toEqual([0.8, 0.1, 0.1, 1]);
  geometry.attributes.POSITION.value[0] = 99;
  expect(surfaces[0].geometry.attributes.POSITION.value[0]).toBe(0);
  expect(snapshot.lights).toEqual([]);
  adapter.destroy();
  device.destroy();
});

test('unsupported nodes fail explicitly instead of disappearing from exported scenes', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const root = new GroupNode();
  root.children.push(root);
  expect(() => makeANARIWorldFromScenegraph(device, root)).toThrow('tree');
  device.destroy();
});
