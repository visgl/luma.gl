// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {GLTFScenegraph} from '@loaders.gl/scene/gltf';
import {parseGLTFPhysics} from '../../modules/gltf/src/physics';
import {makeLegacyMeshPositionResolver} from '../../examples/gltf/physics/legacy-mesh-positions';

function makeMeshScenegraph(): GLTFScenegraph {
  const buffer = new ArrayBuffer(176);
  const view = new DataView(buffer);
  for (let vertex = 0; vertex < 9; vertex++) {
    for (let axis = 0; axis < 3; axis++)
      view.setFloat32(
        8 + vertex * 16 + axis * 4,
        vertex === 8 ? 99 : vertex & (1 << axis) ? 0.5 : -0.5,
        true
      );
    if (vertex < 8) view.setUint16(160 + vertex * 2, vertex, true);
  }
  return new GLTFScenegraph({
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: buffer.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: 4, byteLength: 148, byteStride: 16},
        {buffer: 0, byteOffset: 160, byteLength: 16}
      ],
      accessors: [
        {bufferView: 0, byteOffset: 4, componentType: 5126, count: 9, type: 'VEC3'},
        {bufferView: 1, componentType: 5123, count: 8, type: 'SCALAR'}
      ],
      meshes: [{primitives: [{attributes: {POSITION: 0}, indices: 1}]}]
    },
    buffers: [{arrayBuffer: buffer, byteOffset: 0, byteLength: buffer.byteLength}]
  });
}

it('resolves indexed strided mesh vertices with accessor and buffer-view offsets', () => {
  const scenegraph = makeMeshScenegraph();
  const resolve = makeLegacyMeshPositionResolver(scenegraph);
  const positions = resolve(0);
  expect(positions).toHaveLength(24);
  expect(Math.max(...positions)).toBe(0.5);
  expect(Math.min(...positions)).toBe(-0.5);
  expect(resolve(0)).toBe(positions);
  const result = parseGLTFPhysics(
    {
      scenes: [{nodes: [0]}],
      nodes: [
        {
          extensions: {
            KHR_physics_rigid_bodies: {
              collider: {geometry: {mesh: 0, convexHull: true}}
            }
          }
        }
      ]
    },
    {resolveLegacyMeshPositions: resolve}
  );
  expect(result.issues).toEqual([]);
  expect(result.colliders[0].collider.shape).toEqual({type: 'box', halfExtents: [0.5, 0.5, 0.5]});
});

it('supports unindexed vertices and rejects sparse or out-of-range mesh inputs', () => {
  const scenegraph = makeMeshScenegraph();
  delete scenegraph.getMesh(0).primitives[0].indices;
  expect(makeLegacyMeshPositionResolver(scenegraph)(0)).toHaveLength(27);
  const indexed = makeMeshScenegraph();
  const buffer = indexed.gltf.buffers[0].arrayBuffer;
  new DataView(buffer).setUint16(160, 9, true);
  expect(() => makeLegacyMeshPositionResolver(indexed)(0)).toThrow('outside');
  const sparse = makeMeshScenegraph();
  sparse.getAccessor(0).sparse = {
    count: 1,
    indices: {bufferView: 1, componentType: 5123},
    values: {bufferView: 0}
  };
  expect(() => makeLegacyMeshPositionResolver(sparse)(0)).toThrow('dense');
  expect(() => makeLegacyMeshPositionResolver(scenegraph)(99)).toThrow();
});
