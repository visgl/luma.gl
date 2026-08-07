// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, type GLTFPostprocessed, postProcessGLTF} from '@loaders.gl/gltf';
import {
  assertSupportedGLTFExtensions,
  generateGLTFLODLevels,
  getGLTFExtensionSupport,
  getGLTFNodeLODs
} from '@luma.gl/gltf';
import {describe, expect, test} from 'vitest';

async function loadGLTF(url: URL): Promise<GLTFPostprocessed> {
  const bytes = await readFile(url);
  return postProcessGLTF(await parse(bytes, GLTFLoader, {gltf: {loadImages: false}}));
}

describe('authored and automatically generated glTF node levels of detail', () => {
  test('resolves ordered, skinned authored levels and their exact screen-coverage hints', async () => {
    const gltf = await loadGLTF(new URL('../data/SimpleSkinLOD.gltf', import.meta.url));
    const levels = getGLTFNodeLODs(gltf, 0)!;

    expect(levels.map(level => level.nodeIndex)).toEqual([0, 3, 4]);
    expect(levels.map(level => level.screenCoverage)).toEqual([0.5, 0.2, 0.01]);
    expect(levels.map(level => level.node.mesh?.primitives[0].indices?.count)).toEqual([24, 12, 6]);
    expect(getGLTFNodeLODs(gltf, gltf.nodes[0])).toEqual(levels);
    expect(getGLTFNodeLODs(gltf, gltf.nodes[1])).toBeNull();
  });

  test('resolves the unmodified Babylon three-level interoperability reference', async () => {
    const gltf = await loadGLTF(new URL('../data/msft-lod.gltf', import.meta.url));
    const levels = getGLTFNodeLODs(gltf, 2)!;

    expect(levels.map(level => level.nodeIndex)).toEqual([2, 1, 0]);
    expect(levels.map(level => level.screenCoverage)).toEqual([0.2, 0.05, 0.001]);
    expect(levels.map(level => level.node.mesh?.primitives[0].indices?.count)).toEqual([
      5796, 324, 36
    ]);
  });

  test.each([
    {description: 'empty alternatives', ids: []},
    {description: 'a self-reference', ids: [0]},
    {description: 'a duplicated alternative', ids: [3, 3]},
    {description: 'a missing node', ids: [999]},
    {description: 'a fractional node', ids: [1.5]}
  ])('rejects invalid authored extensions containing $description', async ({ids}) => {
    const gltf = await loadGLTF(new URL('../data/SimpleSkinLOD.gltf', import.meta.url));
    gltf.nodes[0].extensions!['MSFT_lod'] = {ids};

    expect(() => getGLTFNodeLODs(gltf, 0)).toThrow();
  });

  test('registers authored node LOD as supported while preserving strict extension checks', async () => {
    const gltf = await loadGLTF(new URL('../data/SimpleSkinLOD.gltf', import.meta.url));
    gltf.extensionsRequired = ['MSFT_lod'];

    expect(getGLTFExtensionSupport(gltf).get('MSFT_lod')).toMatchObject({
      required: true,
      supported: true,
      supportLevel: 'parsed-and-wired'
    });
    expect(() => assertSupportedGLTFExtensions(gltf)).not.toThrow();
  });

  test('generates immutable index-only alternatives while preserving skins and animations', async () => {
    const gltf = await loadGLTF(
      new URL('../../../../examples/showcase/anari/public/gltf/SimpleSkin.gltf', import.meta.url)
    );
    const originalNodeCount = gltf.nodes.length;
    const originalMeshCount = gltf.meshes.length;
    const originalRoot = gltf.nodes[0];
    const originalPrimitive = originalRoot.mesh!.primitives[0];
    const originalIndices = originalPrimitive.indices!.value.slice();

    const generated = generateGLTFLODLevels(gltf, {
      ratios: [0.5, 0.25],
      screenCoverage: [0.6, 0.25, 0.03]
    });
    const levels = getGLTFNodeLODs(generated, 0)!;

    expect(generated).not.toBe(gltf);
    expect(gltf.nodes).toHaveLength(originalNodeCount);
    expect(gltf.meshes).toHaveLength(originalMeshCount);
    expect(gltf.extensionsUsed || []).not.toContain('MSFT_lod');
    expect(originalRoot.extensions?.['MSFT_lod']).toBeUndefined();
    expect(originalPrimitive.indices!.value).toEqual(originalIndices);
    expect(generated.animations).toBe(gltf.animations);
    expect(generated.skins).toBe(gltf.skins);
    expect(generated.extensionsUsed).toContain('MSFT_lod');
    expect(levels.map(level => level.screenCoverage)).toEqual([0.6, 0.25, 0.03]);
    expect(levels[0].node.mesh?.primitives[0].indices?.count).toBe(24);

    for (const level of levels.slice(1)) {
      const primitive = level.node.mesh!.primitives[0];
      expect(primitive.indices!.count).toBeLessThan(originalPrimitive.indices!.count);
      expect(primitive.attributes['POSITION']).toBe(originalPrimitive.attributes['POSITION']);
      expect(primitive.attributes['JOINTS_0']).toBe(originalPrimitive.attributes['JOINTS_0']);
      expect(primitive.attributes['WEIGHTS_0']).toBe(originalPrimitive.attributes['WEIGHTS_0']);
      expect(level.node.skin).toBe(originalRoot.skin);
      expect(generated.scenes[0].nodes).not.toContain(level.node);
    }
    expect(generated.scenes[0].nodes?.[1].children?.[0]).toBe(generated.nodes[2]);
  });

  test('does not generate additional meshes for detached authored alternatives', async () => {
    const gltf = await loadGLTF(new URL('../data/SimpleSkinLOD.gltf', import.meta.url));

    expect(generateGLTFLODLevels(gltf)).toBe(gltf);
  });

  test('returns the original document for an intentionally empty generated-level list', async () => {
    const gltf = await loadGLTF(new URL('../data/SimpleSkinLOD.gltf', import.meta.url));

    expect(generateGLTFLODLevels(gltf, {ratios: []})).toBe(gltf);
  });
});
