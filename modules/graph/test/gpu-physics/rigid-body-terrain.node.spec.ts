// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '@math.gl/geometry/primitives';
import {expect, it} from 'vitest';
import {GPURigidBodyWorld, makeStaticTriangleMeshGeometry} from '../../src/gpu-physics';

it('cooks only the authored terrain triangles and leaves CPU geometry untouched', () => {
  const positions = new Float64Array([0, 0, 0, 2, 0, 1, 0, 2, 0, 2, 2, 500]);
  const indices = new Uint16Array([0, 1, 2, 1, 3, 2]);
  const geometry = new Geometry({
    topology: 'triangle-list',
    vertexCount: 3,
    indices,
    attributes: {POSITION: {size: 3, value: positions}}
  });
  const surface = makeStaticTriangleMeshGeometry(geometry);
  expect(surface.positions).toEqual([0, 0, 0, 2, 0, 1, 0, 2, 0]);
  expect(surface.indices).toEqual([0, 1, 2]);
  expect(surface.maximum).toEqual([2, 2, 1]);
  expect(surface.volume).toBe(0);
  expect(surface.closed).toBe(false);
  expect(Array.from(positions)).toEqual([0, 0, 0, 2, 0, 1, 0, 2, 0, 2, 2, 500]);
  expect(Array.from(indices)).toEqual([0, 1, 2, 1, 3, 2]);
  expect(
    () =>
      new GPURigidBodyWorld({
        bodies: [{mass: 1, position: [0, 0, 0], shape: {type: 'triangle-mesh', geometry: surface}}]
      })
  ).toThrow('Dynamic meshes require closed positive-volume geometry');
});

it('supports unindexed surfaces and rejects geometry with no collision triangles', () => {
  const position = {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])};
  const attributes = {POSITION: position};
  expect(
    makeStaticTriangleMeshGeometry(new Geometry({topology: 'triangle-list', attributes})).indices
  ).toEqual([0, 1, 2]);
  expect(() =>
    makeStaticTriangleMeshGeometry(
      new Geometry({
        topology: 'triangle-list',
        attributes,
        indices: new Uint16Array()
      })
    )
  ).toThrow('Incomplete mesh geometry');
  expect(() =>
    makeStaticTriangleMeshGeometry(new Geometry({topology: 'line-list', attributes}))
  ).toThrow('Static surfaces require triangle-list POSITION geometry');
});
