// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parseCornellScene} from '../../../../examples/api/lightmap-baking/cornell-scene';
import {createLightmapAtlas, validateLightmapAtlas} from '@luma.gl/engine/lighting';
import {expect, test} from 'vitest';

test('packs a two-mesh glTF beyond the old triangle-per-chart limit', async () => {
  const positions: number[] = [];
  const normals: number[] = [];
  const coordinates: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= 24; row++) {
    for (let column = 0; column <= 24; column++) {
      positions.push(column, row, 0);
      normals.push(0, 0, 1);
      coordinates.push(column / 24, row / 24);
      if (row < 24 && column < 24) {
        const corner = row * 25 + column;
        indices.push(corner, corner + 1, corner + 26, corner, corner + 26, corner + 25);
      }
    }
  }
  const arrays = [
    new Float32Array(positions),
    new Float32Array(normals),
    new Float32Array(coordinates),
    new Uint16Array(indices)
  ];
  const buffers = arrays.map(data => Buffer.from(data.buffer));
  let byteOffset = 0;
  const bufferViews = buffers.map(buffer => {
    const view = {buffer: 0, byteOffset, byteLength: buffer.length};
    byteOffset += buffer.length;
    return view;
  });
  const primitive = {attributes: {POSITION: 0, NORMAL: 1, TEXCOORD_0: 2}, indices: 3};
  const gltf = {
    asset: {version: '2.0'},
    scene: 0,
    scenes: [{nodes: [0, 1]}],
    nodes: [{mesh: 0}, {mesh: 1, translation: [0, 0, 2]}],
    meshes: [{primitives: [primitive]}, {primitives: [primitive]}],
    buffers: [
      {
        byteLength: byteOffset,
        uri: `data:application/octet-stream;base64,${Buffer.concat(buffers).toString('base64')}`
      }
    ],
    bufferViews,
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 625,
        type: 'VEC3',
        min: [0, 0, 0],
        max: [24, 24, 0]
      },
      {bufferView: 1, componentType: 5126, count: 625, type: 'VEC3'},
      {bufferView: 2, componentType: 5126, count: 625, type: 'VEC2'},
      {bufferView: 3, componentType: 5123, count: indices.length, type: 'SCALAR'}
    ]
  };
  const {placements: inputs} = await parseCornellScene(
    new TextEncoder().encode(JSON.stringify(gltf)).buffer
  );
  expect(inputs).toHaveLength(2);
  expect(inputs.reduce((total, {geometry}) => total + geometry.vertexCount / 3, 0)).toBe(2304);
  expect(inputs[1].geometry.attributes.POSITION.value[2]).toBe(2);
  const options = {width: 512, height: 512, texelsPerUnit: 4};
  expect(() => createLightmapAtlas(inputs, options)).toThrow();
  const atlas = createLightmapAtlas(inputs, {...options, mergeCoplanarPairs: true});
  expect(atlas.charts).toHaveLength(1152);
  expect(atlas.charts.every(chart => chart.vertexCount === 6 && chart.worldArea === 1)).toBe(true);
  expect(validateLightmapAtlas(atlas)).toEqual([]);
  const uv = atlas.meshes[0].geometry.attributes.TEXCOORD_1.value;
  expect(uv.slice(0, 2)).toEqual(uv.slice(6, 8));
  expect(uv.slice(4, 6)).toEqual(uv.slice(8, 10));
  expect(inputs[0].geometry.attributes.TEXCOORD_1).toBeUndefined();
});
