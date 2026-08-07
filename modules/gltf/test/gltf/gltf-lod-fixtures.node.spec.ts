// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, type GLTFPostprocessed, postProcessGLTF} from '@loaders.gl/gltf';
import type {RenderPass} from '@luma.gl/core';
import {createGLTFAnimatedCrowd} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test, vi} from 'vitest';

async function loadLODFixture(
  fixture: 'msft-lod.gltf' | 'SimpleSkinLOD.gltf'
): Promise<GLTFPostprocessed> {
  const data = await readFile(new URL(`../data/${fixture}`, import.meta.url));
  return postProcessGLTF(await parse(data, GLTFLoader, {gltf: {loadImages: false}}));
}

function getLODNodeIndices(gltf: GLTFPostprocessed, rootNodeIndex: number): number[] {
  const extension = gltf.nodes[rootNodeIndex].extensions?.['MSFT_lod'] as
    | {ids?: number[]}
    | undefined;
  return [rootNodeIndex, ...(extension?.ids || [])];
}

describe('self-contained MSFT_lod fixtures', () => {
  test('parses the upstream Babylon fixture with three authored geometry levels', async () => {
    const gltf = await loadLODFixture('msft-lod.gltf');
    const levelNodeIndices = getLODNodeIndices(gltf, 2);

    expect(gltf.extensionsUsed).toContain('MSFT_lod');
    expect(gltf.scenes[0].nodes?.map(node => node.id)).toEqual(['node-2']);
    expect(levelNodeIndices).toEqual([2, 1, 0]);
    expect(gltf.nodes[2].extras).toMatchObject({
      MSFT_screencoverage: [0.2, 0.05, 0.001]
    });
    expect(
      levelNodeIndices.map(nodeIndex => gltf.nodes[nodeIndex].mesh?.primitives[0].indices?.count)
    ).toEqual([5796, 324, 36]);
    expect(
      levelNodeIndices.map(
        nodeIndex => gltf.nodes[nodeIndex].mesh?.primitives[0].attributes['POSITION'].count
      )
    ).toEqual([3864, 216, 24]);
  });

  test('preserves three skinned LODs, the joint hierarchy, and its authored animation', async () => {
    const gltf = await loadLODFixture('SimpleSkinLOD.gltf');
    const levelNodeIndices = getLODNodeIndices(gltf, 0);

    expect(gltf.extensionsUsed).toContain('MSFT_lod');
    expect(levelNodeIndices).toEqual([0, 3, 4]);
    expect(gltf.nodes[0].extras).toMatchObject({
      MSFT_screencoverage: [0.5, 0.2, 0.01]
    });
    expect(gltf.scenes[0].nodes?.map(node => node.id)).toEqual(['node-0', 'node-1']);
    expect(gltf.scenes[0].nodes?.[1].children?.[0].id).toBe('node-2');
    expect(gltf.skins?.[0].joints).toEqual([1, 2]);
    expect(gltf.skins?.[0].inverseBindMatrices?.count).toBe(2);
    expect(gltf.animations).toHaveLength(1);
    expect(gltf.animations?.[0].name).toBe('Joint Bend');
    expect(gltf.animations?.[0].channels[0].target).toMatchObject({
      node: 2,
      path: 'rotation'
    });

    expect(
      levelNodeIndices.map(nodeIndex => gltf.nodes[nodeIndex].mesh?.primitives[0].indices?.count)
    ).toEqual([24, 12, 6]);
    for (const nodeIndex of levelNodeIndices) {
      const node = gltf.nodes[nodeIndex];
      expect(node.skin).toBeDefined();
      expect(node.mesh?.primitives[0].attributes).toHaveProperty('JOINTS_0');
      expect(node.mesh?.primitives[0].attributes).toHaveProperty('WEIGHTS_0');
    }
  });

  test('draws only the reachable animated base LOD while actor skin palettes stay independent', async () => {
    const gltf = await loadLODFixture('SimpleSkinLOD.gltf');
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, gltf, {capacity: 2});

    try {
      expect(crowd.primitiveGroups).toHaveLength(1);
      expect(crowd.models).toHaveLength(1);
      expect(crowd.primitiveGroups[0].nodeIndex).toBe(0);
      expect(crowd.primitiveGroups[0].jointCount).toBe(2);

      const [first, second] = crowd.addActors([
        {id: 'first', phase: 0},
        {id: 'second', phase: 0.25}
      ]);
      expect(first.root).not.toBe(second.root);
      expect(first.animator).not.toBe(second.animator);
      expect(first.skins).not.toBe(second.skins);
      expect(first.skins.bindings).toHaveLength(1);
      expect(second.skins.bindings).toHaveLength(1);
      expect(Array.from(first.skins.bindings[0].jointMatrices)).not.toEqual(
        Array.from(second.skins.bindings[0].jointMatrices)
      );

      const draw = vi.spyOn(crowd.models[0], 'draw').mockReturnValue(true);
      expect(crowd.models[0].instanceCount).toBe(2);
      expect(crowd.draw({} as RenderPass)).toBe(1);
      expect(draw).toHaveBeenCalledOnce();
      draw.mockRestore();
    } finally {
      crowd.destroy();
      device.destroy();
    }
  });
});
