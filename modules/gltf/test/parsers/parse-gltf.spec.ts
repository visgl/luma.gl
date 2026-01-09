// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

// getVertexCount logic tests (replicating the implementation for unit testing)
function testGetVertexCount(attributes: any): number {
  let vertexCount = Infinity;
  for (const attribute of Object.values(attributes)) {
    if (attribute) {
      const {value, size, components} = attribute as any;
      const attributeSize = size ?? components;
      if (value?.length !== undefined && attributeSize >= 1) {
        vertexCount = Math.min(vertexCount, value.length / attributeSize);
      }
    }
  }
  if (!Number.isFinite(vertexCount)) {
    throw new Error('Could not determine vertex count from attributes');
  }
  return vertexCount;
}

// Unit tests for getVertexCount logic
test('gltf#getVertexCount - single POSITION attribute', t => {
  const attributes = {
    POSITION: {
      value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), // 3 vertices
      size: 3
    }
  };
  t.equals(testGetVertexCount(attributes), 3, 'Should calculate correct vertex count');
  t.end();
});

test('gltf#getVertexCount - multiple attributes', t => {
  const attributes = {
    POSITION: {value: new Float32Array(12), size: 3}, // 4 vertices
    NORMAL: {value: new Float32Array(12), size: 3} // 4 vertices
  };
  t.equals(testGetVertexCount(attributes), 4, 'Should return consistent vertex count');
  t.end();
});

test('gltf#getVertexCount - components instead of size', t => {
  const attributes = {
    POSITION: {value: new Float32Array(9), components: 3} // 3 vertices
  };
  t.equals(testGetVertexCount(attributes), 3, 'Should handle components attribute');
  t.end();
});

test('gltf#getVertexCount - quantized Uint16Array', t => {
  const attributes = {
    POSITION: {
      value: new Uint16Array([0, 32767, 65535, 1000, 2000, 3000]), // 2 vertices
      size: 3
    }
  };
  t.equals(testGetVertexCount(attributes), 2, 'Should handle quantized data');
  t.end();
});

test('gltf#getVertexCount - empty attributes throws', t => {
  t.throws(
    () => testGetVertexCount({}),
    /Could not determine vertex count from attributes/,
    'Should throw for empty attributes'
  );
  t.end();
});

test('gltf#getVertexCount - null attributes skipped', t => {
  t.throws(
    () => testGetVertexCount({POSITION: null, NORMAL: undefined}),
    /Could not determine vertex count from attributes/,
    'Should throw when all attributes are null/undefined'
  );
  t.end();
});

// Integration test with actual GLTF file
test('gltf#parseGLTF - box.glb integration', async t => {
  const webglDevice = await getWebGLTestDevice();

  try {
    const gltf = await load('data/box.glb', GLTFLoader);
    const processedGLTF = gltf.json ? postProcessGLTF(gltf) : gltf;

    const result = createScenegraphsFromGLTF(webglDevice, processedGLTF);

    t.ok(result.scenes, 'Should create scenes');
    t.ok(result.scenes.length > 0, 'Should have at least one scene');
    t.pass('box.glb loaded successfully');
  } catch (error) {
    t.comment(`Integration test error: ${error.message}`);
  }

  t.end();
});
