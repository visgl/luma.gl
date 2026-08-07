// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF, type GLTFPostprocessed} from '@loaders.gl/gltf';
import {parseGLTFAnimations} from '@luma.gl/gltf';
import {describe, expect, test} from 'vitest';

import './parse-gltf-animations.spec';

describe('loader-owned animation accessor processing', () => {
  test('uses deinterleaved animation values produced by postProcessGLTF', async () => {
    const sourceValues = new Float32Array([0, 100, 1, 200, 1, 2, 3, 300, 4, 5, 6, 400]);
    const sourceBytes = new Uint8Array(sourceValues.buffer);
    const document = {
      asset: {version: '2.0'},
      scene: 0,
      scenes: [{nodes: [0]}],
      nodes: [{name: 'Animated node'}],
      buffers: [
        {
          byteLength: sourceBytes.byteLength,
          uri: `data:application/octet-stream;base64,${Buffer.from(sourceBytes).toString('base64')}`
        }
      ],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 16, byteStride: 8},
        {buffer: 0, byteOffset: 16, byteLength: 32, byteStride: 16}
      ],
      accessors: [
        {bufferView: 0, componentType: 5126, count: 2, type: 'SCALAR'},
        {bufferView: 1, componentType: 5126, count: 2, type: 'VEC3'}
      ],
      animations: [
        {
          samplers: [{input: 0, output: 1, interpolation: 'LINEAR'}],
          channels: [{sampler: 0, target: {node: 0, path: 'translation'}}]
        }
      ]
    };
    const source = new TextEncoder().encode(JSON.stringify(document));
    const gltf = postProcessGLTF(await parse(source, GLTFLoader, {gltf: {loadImages: false}}));

    expect(Array.from(gltf.accessors[0].value)).toEqual([0, 1]);
    expect(Array.from(gltf.accessors[1].value)).toEqual([1, 2, 3, 4, 5, 6]);

    const sampler = parseGLTFAnimations(gltf)[0].channels[0].sampler;

    expect(sampler.input).toEqual([0, 1]);
    expect(sampler.output).toEqual([
      [1, 2, 3],
      [4, 5, 6]
    ]);
  });

  test('accepts loader-decoded animation values without reconstructing a buffer view', () => {
    const gltf = {
      accessors: [
        {components: 1, count: 2, type: 'SCALAR', value: new Float32Array([0, 2])},
        {components: 3, count: 2, type: 'VEC3', value: new Float32Array([1, 2, 3, 4, 5, 6])}
      ],
      animations: [
        {
          samplers: [{input: 0, output: 1, interpolation: 'LINEAR'}],
          channels: [{sampler: 0, target: {node: 0, path: 'translation'}}]
        }
      ],
      nodes: [{id: 'decoded-node'}]
    } as GLTFPostprocessed;

    expect(parseGLTFAnimations(gltf)[0].channels[0].sampler).toMatchObject({
      input: [0, 2],
      output: [
        [1, 2, 3],
        [4, 5, 6]
      ]
    });
  });
});
