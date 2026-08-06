// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF, type GLTFPostprocessed} from '@loaders.gl/gltf';
import {ModelNode} from '@luma.gl/engine';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {describe, expect, test} from 'vitest';

async function loadFixture(name: 'SimpleSkin.gltf' | 'AnimatedMorphCube.glb') {
  const source = await readFile(
    new URL(`../../../../examples/showcase/anari/public/gltf/${name}`, import.meta.url)
  );
  return postProcessGLTF(await parse(source, GLTFLoader, {gltf: {loadImages: false}}));
}

function destroyScenes(scenegraphs: ReturnType<typeof createScenegraphsFromGLTF>): void {
  for (const scene of scenegraphs.scenes) {
    scene.destroy();
  }
}

describe('reviewed glTF deformation edge cases', () => {
  test('gives every source node sharing a skinned SimpleSkin mesh its own model and palette', async () => {
    const source = await loadFixture('SimpleSkin.gltf');
    const originalNode = source.nodes[0];
    const alternateSkin = {
      ...source.skins![0],
      id: 'independent-source-skin',
      joints: [...source.skins![0].joints].reverse()
    };
    source.skins!.push(alternateSkin);
    const duplicateNode = {
      ...originalNode,
      id: 'independently-skinned-mesh',
      name: 'independently-skinned-mesh',
      translation: [3, 0, 0],
      skin: alternateSkin
    } as GLTFPostprocessed['nodes'][number];
    const duplicateNodeIndex = source.nodes.push(duplicateNode) - 1;
    source.scenes[0].nodes.push(duplicateNode);

    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source);
    try {
      const originalSkin = scenegraphs.skins.getBinding(0);
      const duplicateSkin = scenegraphs.skins.getBinding(duplicateNodeIndex);
      expect(originalSkin?.models).toHaveLength(1);
      expect(duplicateSkin?.models).toHaveLength(1);
      expect(duplicateSkin?.skinIndex).toBe(1);
      expect(duplicateSkin?.models[0]).not.toBe(originalSkin?.models[0]);
      expect(duplicateSkin?.jointMatrices).not.toBe(originalSkin?.jointMatrices);
      expect(duplicateSkin?.jointMatrices[12]).not.toBe(originalSkin?.jointMatrices[12]);

      const originalUniforms =
        originalSkin!.models[0].model.shaderInputs.getUniformValues()['skin'];
      const duplicateUniforms =
        duplicateSkin!.models[0].model.shaderInputs.getUniformValues()['skin'];
      expect(originalUniforms.jointMatrix[12]).not.toBe(duplicateUniforms.jointMatrix[12]);

      scenegraphs.animator.setTime(500);
      expect(
        originalSkin!.models[0].model.shaderInputs.getUniformValues()['skin'].jointMatrix[12]
      ).not.toBe(
        duplicateSkin!.models[0].model.shaderInputs.getUniformValues()['skin'].jointMatrix[12]
      );
    } finally {
      destroyScenes(scenegraphs);
      device.destroy();
    }
  });

  test('binds the generated SimpleSkin mesh when a source child has the same display name', async () => {
    const source = await loadFixture('SimpleSkin.gltf');
    const mesh = source.nodes[0].mesh!;
    const duplicateNameChild = {
      id: 'same-name-source-node',
      name: mesh.name || mesh.id,
      children: []
    } as GLTFPostprocessed['nodes'][number];
    source.nodes.push(duplicateNameChild);
    source.nodes[0].children = [duplicateNameChild];

    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source);
    try {
      const binding = scenegraphs.skins.getBinding(0);
      expect(binding?.models).toHaveLength(1);
      expect(binding?.models[0]).toBeInstanceOf(ModelNode);
      expect(binding?.node.children[0].id).toBe(mesh.name || mesh.id);
      expect(binding?.models[0].model.shaderInputs.getUniformValues()['skin']).toBeDefined();
    } finally {
      destroyScenes(scenegraphs);
      device.destroy();
    }
  });

  test('decodes quantized AnimatedMorphCube bases before creating animated GPU geometry', async () => {
    const source = await loadFixture('AnimatedMorphCube.glb');
    const primitive = source.meshes[0].primitives[0];
    const positionAccessor = primitive.attributes['POSITION'];
    const normalAccessor = primitive.attributes['NORMAL'];
    const tangentAccessor = primitive.attributes['TANGENT'];
    const sourcePositions = Uint16Array.from(positionAccessor.value, component =>
      Math.round(Math.max(0, Math.min(1, component * 0.25 + 0.5)) * 65535)
    );
    const sourceNormals = Int8Array.from(normalAccessor.value, component =>
      Math.round(Math.max(-1, Math.min(1, component)) * 127)
    );
    const sourceTangents = Int16Array.from(tangentAccessor.value, component =>
      Math.round(Math.max(-1, Math.min(1, component)) * 32767)
    );
    Object.assign(positionAccessor, {value: sourcePositions, normalized: true});
    Object.assign(normalAccessor, {value: sourceNormals, normalized: true});
    Object.assign(tangentAccessor, {value: sourceTangents, normalized: true});

    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source);
    try {
      let modelNode: ModelNode | undefined;
      scenegraphs.scenes[0].traverse(node => {
        if (node instanceof ModelNode && node.userData['morphTargets']) {
          modelNode = node;
        }
      });
      expect(modelNode).toBeDefined();
      const state = modelNode!.userData['morphTargets'] as {
        geometry: {attributes: Record<string, {value: ArrayBufferView; normalized?: boolean}>};
      };
      for (const attributeName of ['POSITION', 'NORMAL', 'TANGENT']) {
        expect(state.geometry.attributes[attributeName].value).toBeInstanceOf(Float32Array);
        expect(state.geometry.attributes[attributeName].normalized).toBe(false);
      }
      expect((state.geometry.attributes['POSITION'].value as Float32Array)[0]).toBeCloseTo(
        sourcePositions[0] / 65535,
        5
      );

      const vertexBuffer = modelNode!.model._gpuGeometry!.attributes['geometry'];
      const previousBytes = new Uint8Array(await vertexBuffer.readAsync());
      const weightChannel = scenegraphs.animations[0].channels.find(
        channel => channel.type === 'node' && channel.path === 'weights'
      );
      expect(weightChannel).toBeDefined();
      if (weightChannel?.type === 'node') {
        const firstValues = weightChannel.sampler.output[0];
        const changedKeyframe = weightChannel.sampler.output.findIndex(values =>
          values.some((value, index) => value !== firstValues[index])
        );
        scenegraphs.animator.setTime(weightChannel.sampler.input[changedKeyframe] * 1000);
      }
      expect(Array.from(await vertexBuffer.readAsync())).not.toEqual(Array.from(previousBytes));
      expect(positionAccessor.value).toBe(sourcePositions);
      expect(normalAccessor.value).toBe(sourceNormals);
      expect(tangentAccessor.value).toBe(sourceTangents);
    } finally {
      destroyScenes(scenegraphs);
      device.destroy();
    }
  });
});
