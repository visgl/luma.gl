// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, it} from 'vitest';
import {CubeGeometry, Geometry, GroupNode} from '@luma.gl/engine';
import {Matrix4} from '@math.gl/core';
import {PhysicsGeometryNode, makePhysicsScenegraph} from '../../src/gpu-physics';

it('keeps visual transforms separate from overridden body frames and bounds', () => {
  const node = new PhysicsGeometryNode({
    id: 'visual',
    geometry: new CubeGeometry(),
    matrix: new Matrix4().translate([2, 0, 0]).scale([2, 1, 1]),
    collision: {position: [1, 0, 0], shape: {type: 'sphere', radius: 0.5}}
  });
  const snapshot = makePhysicsScenegraph(new GroupNode({children: [node]}));
  expect(snapshot.bodies[0]).toEqual(node.physics.collision);
  expect(snapshot.publicationBounds).toEqual([
    [
      [-1, -1, -1],
      [3, 1, 1]
    ]
  ]);
  expect(snapshot.bindings[0].localMatrix.transformAsPoint([1, 0, 0])).toEqual([3, 0, 0]);
  expect(node.matrix[12]).toBe(2);
});

it('preserves a single open triangle when triangle mesh cooking is explicit', () => {
  const geometry = new Geometry({
    attributes: {POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}}
  });
  const snapshot = makePhysicsScenegraph(
    new GroupNode({
      children: [new PhysicsGeometryNode({id: 'triangle', geometry, geometryMode: 'triangle-mesh'})]
    })
  );
  expect(snapshot.bodies[0].shape?.type).toBe('triangle-mesh');
  expect(snapshot.publicationBounds).toEqual([
    [
      [0, 0, 0],
      [1, 1, 0]
    ]
  ]);
});

it('rejects ambiguous duplicate node identities', () => {
  const geometry = new CubeGeometry();
  const root = new GroupNode({
    children: [
      new PhysicsGeometryNode({id: 'same', geometry}),
      new PhysicsGeometryNode({id: 'same', geometry})
    ]
  });
  expect(() => makePhysicsScenegraph(root)).toThrow();
});
