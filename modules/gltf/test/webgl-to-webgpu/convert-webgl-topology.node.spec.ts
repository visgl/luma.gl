// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {ModelNode} from '@luma.gl/engine';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test} from 'vitest';

import {GLEnum} from '../../src/webgl-to-webgpu/gltf-webgl-constants';
import {normalizeGLTFTopology} from '../../src/webgl-to-webgpu/convert-webgl-topology';

describe('normalizeGLTFTopology', () => {
  test('closes indexed LINE_LOOP primitives without changing source indices', () => {
    const sourceIndices = new Uint8Array([4, 1, 7]);
    const normalized = normalizeGLTFTopology(GLEnum.LINE_LOOP, sourceIndices, 8);

    expect(normalized.topology).toBe('line-list');
    expect(normalized.indices).toBeInstanceOf(Uint16Array);
    expect([...normalized.indices!]).toEqual([4, 1, 1, 7, 7, 4]);
    expect([...sourceIndices]).toEqual([4, 1, 7]);
  });

  test('expands non-indexed TRIANGLE_FAN primitives counter-clockwise', () => {
    const normalized = normalizeGLTFTopology(GLEnum.TRIANGLE_FAN, undefined, 5);

    expect(normalized.topology).toBe('triangle-list');
    expect([...normalized.indices!]).toEqual([0, 1, 2, 0, 2, 3, 0, 3, 4]);
  });

  test('preserves uint32 indices and leaves portable modes non-indexed', () => {
    const sourceIndices = new Uint32Array([70_000, 70_001, 70_002]);
    const normalizedFan = normalizeGLTFTopology(GLEnum.TRIANGLE_FAN, sourceIndices, 70_003);
    const normalizedTriangles = normalizeGLTFTopology(GLEnum.TRIANGLES, undefined, 3);

    expect(normalizedFan.indices).toBeInstanceOf(Uint32Array);
    expect([...normalizedFan.indices!]).toEqual([70_000, 70_001, 70_002]);
    expect(normalizedTriangles).toEqual({topology: 'triangle-list'});
  });

  test('handles incomplete portable primitives without creating invalid indices', () => {
    expect(normalizeGLTFTopology(GLEnum.LINE_LOOP, undefined, 1).indices).toHaveLength(0);
    expect(normalizeGLTFTopology(GLEnum.TRIANGLE_FAN, undefined, 2).indices).toHaveLength(0);
  });

  test('uploads normalized indices and draw count through the glTF scenegraph', async () => {
    const data = await readFile(new URL('../../../../test/data/box.glb', import.meta.url));
    const source = postProcessGLTF(await parse(data, GLTFLoader, {gltf: {loadImages: false}}));
    const primitive = source.meshes[0].primitives[0];
    const sourceIndices = primitive.indices!.value as Uint16Array;
    primitive.mode = GLEnum.LINE_LOOP;

    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source);
    try {
      let modelNode: ModelNode | undefined;
      scenegraphs.scenes[0].traverse(node => {
        if (node instanceof ModelNode) {
          modelNode = node;
        }
      });

      expect(modelNode?.model.topology).toBe('line-list');
      expect(modelNode?.model.vertexCount).toBe(sourceIndices.length * 2);
      const indexBuffer = modelNode?.model.indexBuffer;
      expect(indexBuffer?.indexType).toBe('uint16');
      const uploadedIndices = new Uint16Array(indexBuffer!.debugData);
      expect([...uploadedIndices.slice(0, 4)]).toEqual([
        sourceIndices[0],
        sourceIndices[1],
        sourceIndices[1],
        sourceIndices[2]
      ]);
      expect(primitive.indices!.value).toBe(sourceIndices);
    } finally {
      for (const scene of scenegraphs.scenes) {
        scene.destroy();
      }
      device.destroy();
    }
  });
});
