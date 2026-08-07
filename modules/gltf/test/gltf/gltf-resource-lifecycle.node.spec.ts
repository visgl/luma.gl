// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, type GLTFPostprocessed, postProcessGLTF} from '@loaders.gl/gltf';
import type {Buffer, Texture} from '@luma.gl/core';
import {ModelNode} from '@luma.gl/engine';
import {createScenegraphsFromGLTF, type PBREnvironment} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test} from 'vitest';

async function loadLifecycleFixture(
  name: 'CubeVisibility' | 'SimpleInstancing'
): Promise<GLTFPostprocessed> {
  const source = await readFile(new URL(`../data/${name}.glb`, import.meta.url));
  return postProcessGLTF(await parse(source, GLTFLoader, {gltf: {loadImages: false}}));
}

function getActiveResourceCount(device: NullDevice, resource: 'Buffers' | 'Textures'): number {
  return device.statsManager.getStats('Resource Counts').get(`${resource} Active`).count;
}

function makeSourceTexture(image: Record<string, unknown>): any {
  return {id: 'owned-image', texture: {source: {image}, sampler: {parameters: {}}}};
}

describe('glTF scenegraph resource lifecycle', () => {
  test('releases every source, primitive, and variant material texture exactly once', async () => {
    const source = await loadLifecycleFixture('CubeVisibility');
    const device = new NullDevice({});
    const image = {
      compressed: true,
      mipmaps: true,
      data: [{data: new Uint8Array(16), width: 4, height: 4, textureFormat: 'bc7-rgba-unorm'}]
    };

    for (const material of source.materials) {
      material.pbrMetallicRoughness = {
        ...material.pbrMetallicRoughness,
        baseColorTexture: makeSourceTexture(image)
      };
    }
    source.extensions = {
      ...source.extensions,
      KHR_materials_variants: {variants: [{name: 'Alternate'}]}
    } as GLTFPostprocessed['extensions'];
    source.meshes[0].primitives[0].extensions = {
      KHR_materials_variants: {mappings: [{material: 1, variants: [0]}]}
    };

    const initialTextureCount = getActiveResourceCount(device, 'Textures');
    const initialBufferCount = getActiveResourceCount(device, 'Buffers');
    const scenegraphs = createScenegraphsFromGLTF(device, source);
    const primitiveCount = source.meshes.reduce((count, mesh) => count + mesh.primitives.length, 0);
    const expectedTextureCount = source.materials.length + primitiveCount + 1;
    const materialTextures = scenegraphs.materials.map(
      material => material.getBindings().pbr_baseColorSampler as Texture
    );

    expect(getActiveResourceCount(device, 'Textures')).toBe(
      initialTextureCount + expectedTextureCount
    );
    expect(materialTextures.every(texture => !texture.destroyed)).toBe(true);
    scenegraphs.variants.selectVariant('Alternate');

    scenegraphs.destroy();
    scenegraphs.destroy();

    expect(materialTextures.every(texture => texture.destroyed)).toBe(true);
    expect(getActiveResourceCount(device, 'Textures')).toBe(initialTextureCount);
    expect(getActiveResourceCount(device, 'Buffers')).toBe(initialBufferCount);
    device.destroy();
  });

  test('releases hidden instancing and detached templates without destroying borrowed IBL', async () => {
    const source = await loadLifecycleFixture('SimpleInstancing');
    const device = new NullDevice({});
    const borrowedTexture = device.createTexture({width: 1, height: 1});
    const imageBasedLightingEnvironment = {
      diffuseEnvSampler: {texture: borrowedTexture},
      specularEnvSampler: {texture: borrowedTexture},
      brdfLutTexture: {texture: borrowedTexture}
    } as PBREnvironment;
    const initialBufferCount = getActiveResourceCount(device, 'Buffers');
    const initialTextureCount = getActiveResourceCount(device, 'Textures');
    const scenegraphs = createScenegraphsFromGLTF(device, source, {
      imageBasedLightingEnvironment
    });
    const instanceBuffers: Buffer[] = [];
    const detachedModelNodes: ModelNode[] = [];

    scenegraphs.scenes[0].preorderTraversal(node => {
      if (node instanceof ModelNode) {
        instanceBuffers.push(...(node.managedResources as Buffer[]));
      }
    });
    for (const sourceMesh of scenegraphs.gltfMeshIdToNodeMap.values()) {
      sourceMesh.preorderTraversal(node => {
        if (node instanceof ModelNode) {
          detachedModelNodes.push(node);
        }
      });
    }

    expect(instanceBuffers).toHaveLength(4);
    expect(instanceBuffers.every(buffer => !buffer.destroyed)).toBe(true);
    expect(detachedModelNodes).toHaveLength(1);
    scenegraphs.scenes[0].display = false;

    scenegraphs.destroy();

    expect(instanceBuffers.every(buffer => buffer.destroyed)).toBe(true);
    expect(detachedModelNodes.every(node => node.model === null)).toBe(true);
    expect(getActiveResourceCount(device, 'Buffers')).toBe(initialBufferCount);
    expect(getActiveResourceCount(device, 'Textures')).toBe(initialTextureCount);
    expect(borrowedTexture.destroyed).toBe(false);

    borrowedTexture.destroy();
    device.destroy();
  });
});
