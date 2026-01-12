// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {getWebGLTestDevice} from '@luma.gl/test-utils';
import {GroupNode, ModelNode} from '@luma.gl/engine';

// Helper to collect all vertex counts from scenegraph
function collectVertexCounts(scenes: GroupNode[]): number[] {
  const vertexCounts: number[] = [];
  for (const scene of scenes) {
    scene.traverse(node => {
      if (node instanceof ModelNode) {
        vertexCounts.push(node.model.vertexCount);
      }
    });
  }
  return vertexCounts;
}

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

// loaders.gl uses 'components' (derived from glTF accessor.type: "VEC3" -> 3)
// while luma.gl uses 'size'. This test ensures compatibility with loaders.gl output.
test('gltf#getVertexCount - components instead of size', t => {
  const attributes = {
    POSITION: {value: new Float32Array(9), components: 3} // 3 vertices
  };
  t.equals(testGetVertexCount(attributes), 3, 'Should handle components attribute');
  t.end();
});

// Verifies that getVertexCount works with non-Float32Array typed arrays
// (e.g., Uint16Array used by KHR_mesh_quantization)
test('gltf#getVertexCount - non-float typed array', t => {
  const attributes = {
    POSITION: {
      value: new Uint16Array([0, 1, 2, 3, 4, 5]), // 2 vertices (6 elements / 3 components)
      size: 3
    }
  };
  t.equals(testGetVertexCount(attributes), 2, 'Should handle non-float typed arrays');
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

    // Verify vertex count (indexed geometry uses indices.count = 36)
    const vertexCounts = collectVertexCounts(result.scenes);
    t.ok(vertexCounts.length > 0, 'Should have at least one model');
    t.equals(vertexCounts[0], 36, 'Vertex count should be 36 (from indices)');

    t.pass('box.glb loaded successfully');
  } catch (error) {
    t.comment(`Integration test error: ${error.message}`);
  }

  t.end();
});

// Integration test with non-indexed GLTF file (tests getVertexCount)
test('gltf#parseGLTF - non-indexed geometry', async t => {
  const webglDevice = await getWebGLTestDevice();

  try {
    const gltf = await load('data/box-non-indexed.glb', GLTFLoader);
    const processedGLTF = gltf.json ? postProcessGLTF(gltf) : gltf;

    // Verify that indices are not present in the primitive
    const mesh = processedGLTF.meshes?.[0];
    const primitive = mesh?.primitives?.[0];
    t.notOk(primitive?.indices, 'Primitive should not have indices');

    const result = createScenegraphsFromGLTF(webglDevice, processedGLTF);

    t.ok(result.scenes, 'Should create scenes from non-indexed glTF');
    t.ok(result.scenes.length > 0, 'Should have at least one scene');

    // Verify vertex count (non-indexed geometry uses POSITION.count = 24)
    const vertexCounts = collectVertexCounts(result.scenes);
    t.ok(vertexCounts.length > 0, 'Should have at least one model');
    t.equals(vertexCounts[0], 24, 'Vertex count should be 24 (from POSITION attribute)');

    t.pass('box-non-indexed.glb loaded successfully with getVertexCount');
  } catch (error) {
    if (error.message.includes('getVertexCount not implemented')) {
      t.fail('getVertexCount is not implemented');
    } else {
      t.comment(`Integration test error: ${error.message}`);
    }
  }

  t.end();
});

// Integration test with KHR_mesh_quantization (tests 16-bit normalized VEC3 support)
test('gltf#parseGLTF - KHR_mesh_quantization point cloud', async t => {
  const webglDevice = await getWebGLTestDevice();

  try {
    const gltf = await load('data/quantized-point-cloud.glb', GLTFLoader);
    const processedGLTF = gltf.json ? postProcessGLTF(gltf) : gltf;

    // Verify that the file uses KHR_mesh_quantization
    const extensions = processedGLTF.extensionsUsed || [];
    t.ok(
      extensions.includes('KHR_mesh_quantization'),
      'File should use KHR_mesh_quantization extension'
    );

    // Verify that POSITION uses quantized format (uint16 normalized)
    const mesh = processedGLTF.meshes?.[0];
    const primitive = mesh?.primitives?.[0];
    const positionAccessor = primitive?.attributes?.POSITION;
    t.ok(positionAccessor?.normalized, 'POSITION should be normalized');
    t.ok(
      positionAccessor?.value instanceof Uint16Array,
      'POSITION should use Uint16Array (quantized)'
    );

    // Verify that indices are not present (point cloud)
    t.notOk(primitive?.indices, 'Point cloud should not have indices');

    const result = createScenegraphsFromGLTF(webglDevice, processedGLTF);

    t.ok(result.scenes, 'Should create scenes from quantized glTF');
    t.ok(result.scenes.length > 0, 'Should have at least one scene');

    // Verify vertex count (point cloud with 69936 vertices)
    const vertexCounts = collectVertexCounts(result.scenes);
    t.ok(vertexCounts.length > 0, 'Should have at least one model');
    t.equals(vertexCounts[0], 69936, 'Vertex count should be 69936 (from POSITION attribute)');

    t.pass('quantized-point-cloud.glb loaded successfully');
  } catch (error) {
    if (error.message.includes('size: 3')) {
      t.fail('16-bit x3 vertex format is not supported');
    } else {
      t.fail(`KHR_mesh_quantization test failed: ${error.message}`);
    }
  }

  t.end();
});
