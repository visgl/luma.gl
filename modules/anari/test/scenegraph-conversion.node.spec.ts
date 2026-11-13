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

test('snapshot conversion preserves colors and both UV sets without borrowing CPU arrays', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const colors = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  const coordinates = new Float32Array([0, 0, 1, 0, 0, 1]);
  const secondCoordinates = new Float32Array([0.2, 0.2, 0.4, 0.2, 0.2, 0.4]);
  const world = device.newWorld({
    surfaces: [
      device.newSurface({
        geometry: device.newGeometry('triangle', {
          'vertex.position': positions,
          'vertex.attribute0': colors,
          'vertex.attribute1': coordinates,
          'vertex.attribute2': secondCoordinates
        }),
        material: device.newMaterial('physicallyBased', {
          sheenColor: [0.3, 0.2, 0.1],
          diffuseTransmission: 0.4
        })
      })
    ]
  });
  const snapshot = makeScenegraphFromANARIWorld(world);
  const adapter = new ScenegraphSurfaces();
  const first = adapter.getSurfaces(snapshot.scene)[0];
  expect(first.geometry.attributes.COLOR_0.value).toEqual(colors);
  expect(first.geometry.attributes.TEXCOORD_0.value).toEqual(coordinates);
  expect(first.geometry.attributes.TEXCOORD_1.value).toEqual(secondCoordinates);
  positions[0] = 25;
  colors[0] = 0;
  expect(first.geometry.attributes.POSITION.value[0]).toBe(0);
  expect(first.geometry.attributes.COLOR_0.value[0]).toBe(1);
  const roundtrip = makeScenegraphFromANARIWorld(
    makeANARIWorldFromScenegraph(device, snapshot.scene)
  );
  const second = adapter.getSurfaces(roundtrip.scene)[0];
  expect(second.geometry.attributes.TEXCOORD_0.value).toEqual(coordinates);
  expect(second.geometry.attributes.TEXCOORD_1.value).toEqual(secondCoordinates);
  expect(second.material.uniforms?.sheenColorFactor).toEqual([0.3, 0.2, 0.1]);
  expect(second.material.uniforms?.diffuseTransmissionFactor).toBe(0.4);
  adapter.destroy();
  device.destroy();
});

test('scenegraph light snapshots preserve point attenuation and independent vectors', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const position: [number, number, number] = [1, 2, 3];
  const world = makeANARIWorldFromScenegraph(device, new GroupNode(), [
    {type: 'point', position, color: [1, 0.5, 0.2], intensity: 4, attenuation: [0, 0, 1]},
    {type: 'directional', direction: [0, -1, 0], intensity: 2}
  ]);
  position[0] = 90;
  const snapshot = makeScenegraphFromANARIWorld(world);
  expect(snapshot.lights[0]).toEqual({
    type: 'point',
    position: [1, 2, 3],
    color: [1, 0.5, 0.2],
    intensity: 4,
    attenuation: [0, 0, 1]
  });
  expect(snapshot.lights[1].type).toBe('directional');
  device.destroy();
});

test('indexed triangle snapshots generate finite shared-vertex normals', () => {
  const device = new ANARIDevice(new NullDevice({}));
  const world = device.newWorld({
    surfaces: [
      device.newSurface({
        geometry: device.newGeometry('triangle', {
          'vertex.position': new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]),
          'primitive.index': new Uint16Array([0, 1, 2, 0, 2, 3])
        }),
        material: device.newMaterial('matte')
      })
    ]
  });
  const snapshot = makeScenegraphFromANARIWorld(world);
  const adapter = new ScenegraphSurfaces();
  expect(
    Array.from(adapter.getSurfaces(snapshot.scene)[0].geometry.attributes.NORMAL.value)
  ).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
  adapter.destroy();
  device.destroy();
});
