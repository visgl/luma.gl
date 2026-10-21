// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {GLTFScenegraph} from '@loaders.gl/gltf';
import {makeGLTFPhysicsMeshResolver} from '../../src/physics/mesh-snapshot';

it('snapshots initial morphs before skinning with sparse deltas and normalized weights', () => {
  const data = [
    new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    new Uint8Array([0]),
    new Float32Array([1, 0, 0]),
    new Uint8Array(12),
    new Uint8Array([255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0])
  ];
  const scenegraph = new GLTFScenegraph({
    json: {
      asset: {version: '2.0'},
      buffers: data.map(buffer => ({byteLength: buffer.byteLength})),
      bufferViews: data.map((buffer, index) => ({buffer: index, byteLength: buffer.byteLength})),
      accessors: [
        {bufferView: 0, componentType: 5126, type: 'VEC3', count: 3},
        {
          componentType: 5126,
          type: 'VEC3',
          count: 3,
          sparse: {count: 1, indices: {bufferView: 1, componentType: 5121}, values: {bufferView: 2}}
        },
        {bufferView: 3, componentType: 5121, type: 'VEC4', count: 3},
        {bufferView: 4, componentType: 5121, type: 'VEC4', count: 3, normalized: true}
      ],
      meshes: [
        {
          weights: [0],
          primitives: [
            {attributes: {POSITION: 0, JOINTS_0: 2, WEIGHTS_0: 3}, targets: [{POSITION: 1}]}
          ]
        }
      ],
      skins: [{joints: [1]}],
      nodes: [{mesh: 0, skin: 0, weights: [1], translation: [10, 0, 0]}, {translation: [2, 0, 0]}]
    },
    buffers: data.map(buffer => ({
      arrayBuffer: buffer.buffer,
      byteOffset: buffer.byteOffset,
      byteLength: buffer.byteLength
    }))
  });
  const resolve = makeGLTFPhysicsMeshResolver(scenegraph);
  expect(resolve(0)).toEqual({positions: [-7, 0, 0, -7, 0, 0, -8, 1, 0], indices: [0, 1, 2]});
  expect(resolve(1)).toBeUndefined();
  expect(Array.from(data[0])).toEqual([0, 0, 0, 1, 0, 0, 0, 1, 0]);
});

it('reads strided initial positions and triangle indices without copying unrelated attributes', () => {
  const positions = new Float32Array([1, 2, 3, 99, 4, 5, 6, 99, 7, 8, 9, 99]);
  const indices = new Uint16Array([2, 0, 1]);
  const scenegraph = new GLTFScenegraph({
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: positions.byteLength}, {byteLength: indices.byteLength}],
      bufferViews: [
        {buffer: 0, byteLength: positions.byteLength, byteStride: 16},
        {buffer: 1, byteLength: indices.byteLength}
      ],
      accessors: [
        {bufferView: 0, componentType: 5126, type: 'VEC3', count: 3},
        {bufferView: 1, componentType: 5123, type: 'SCALAR', count: 3}
      ],
      nodes: [{mesh: 0}],
      meshes: [{primitives: [{attributes: {POSITION: 0}, indices: 1}]}]
    },
    buffers: [positions, indices].map(buffer => ({
      arrayBuffer: buffer.buffer,
      byteOffset: 0,
      byteLength: buffer.byteLength
    }))
  });
  expect(makeGLTFPhysicsMeshResolver(scenegraph)(0)).toEqual({
    positions: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    indices: [2, 0, 1]
  });
});
