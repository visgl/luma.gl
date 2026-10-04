// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, type GLTFPostprocessed, postProcessGLTF} from '@loaders.gl/gltf';
import {GroupNode, ModelNode, AnimationTrack} from '@luma.gl/engine';
import {Texture} from '@luma.gl/core';
import {createScenegraphsFromGLTF, type GLTFScenegraphs} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {afterEach, describe, expect, test, vi} from 'vitest';

afterEach(() => vi.restoreAllMocks());
import type {GLTFCrowdModelResources} from '../../src/gltf/create-gltf-model';

async function loadFixture(
  name: 'SimpleSkin.gltf' | 'AnimatedMorphCube.glb' = 'SimpleSkin.gltf'
): Promise<GLTFPostprocessed> {
  return postProcessGLTF(
    await parse(
      await readFile(
        new URL(`../../../../examples/showcase/scene/public/gltf/${name}`, import.meta.url)
      ),
      GLTFLoader,
      {gltf: {loadImages: false}}
    )
  );
}

function getModelNode(scenegraphs: GLTFScenegraphs, nodeIndex = 0): ModelNode {
  const mesh = scenegraphs.gltfNodeIndexToNodeMap.get(nodeIndex)?.userData['gltfMesh'];
  expect(mesh).toBeInstanceOf(GroupNode);
  return (mesh as GroupNode).children.find((node): node is ModelNode => node instanceof ModelNode)!;
}

function getResources(modelNode: ModelNode): GLTFCrowdModelResources {
  return modelNode.userData['gltfAnimatedCrowd'] as GLTFCrowdModelResources;
}

function addTranslationClip(
  source: GLTFPostprocessed,
  nodeIndex: number,
  name: string,
  start: number[],
  end: number[]
): void {
  const sampler = source.animations![0].samplers[0];
  const input = source.accessors.length;
  source.accessors.push({
    ...source.accessors[sampler.input],
    id: `${name}-times`,
    count: 2,
    value: new Float32Array([0, 1])
  });
  const output = source.accessors.length;
  source.accessors.push({
    ...source.accessors[sampler.output],
    id: `${name}-translations`,
    type: 'VEC3',
    components: 3,
    count: 2,
    value: new Float32Array([...start, ...end])
  });
  source.animations!.push({
    name,
    samplers: [{input, output, interpolation: 'LINEAR'}],
    channels: [{sampler: 0, target: {node: nodeIndex, path: 'translation'}}]
  });
}

describe('GPU pose playback for ordinary glTF scenes', () => {
  test('moves keyframe evaluation and skin updates off the CPU during playback', async () => {
    const source = await loadFixture();
    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source, {gpuAnimation: {sampleRate: 12}});
    const resources = getResources(getModelNode(scenegraphs));
    const evaluate = vi.spyOn(AnimationTrack.prototype, 'evaluate');
    const updateSkins = vi.spyOn(scenegraphs.skins, 'update');
    const writeAtlas = vi.spyOn(Object.getPrototypeOf(resources.animationFrames), 'writeData');
    const writeFrames = vi.spyOn(
      Object.getPrototypeOf(resources.animationParameterBuffer),
      'write'
    );
    const initialPalette = Array.from(scenegraphs.skins.bindings[0].jointMatrices);
    try {
      expect(scenegraphs.animationStats.mode).toBe('gpu');
      expect(scenegraphs.animator.getAnimations()[0].clip.tracks).toHaveLength(0);
      expect(scenegraphs.animator.getAnimations()[0].clip.duration).toBeGreaterThan(0);
      scenegraphs.animator.setTime(500);
      expect(resources.animationParameters![0]).toBe(6);
      scenegraphs.animator.update(0.25);
      expect(resources.animationParameters![0]).toBe(9);
      expect(evaluate).not.toHaveBeenCalled();
      expect(updateSkins).not.toHaveBeenCalled();
      expect(writeAtlas).not.toHaveBeenCalled();
      expect(writeFrames).toHaveBeenCalledTimes(4);
      expect(writeFrames.mock.calls.every(([values]) => values.byteLength === 16)).toBe(true);
      expect(Array.from(scenegraphs.skins.bindings[0].jointMatrices)).toEqual(initialPalette);
      expect(getModelNode(scenegraphs).model.instanceCount).toBe(1);
    } finally {
      evaluate.mockRestore();
      scenegraphs.destroy();
      device.destroy();
    }
  });

  test('bakes mesh-local skin palettes and motion relative to the scene bind transform', async () => {
    const source = await loadFixture();
    const root = {
      id: 'translated-root',
      children: [...source.scenes[0].nodes],
      translation: [0.3, 0.2, 0],
      scale: [0.7, 0.7, 0.7]
    };
    const rootIndex = source.nodes.length;
    source.nodes.push(root);
    source.scenes[0].nodes = [root];
    addTranslationClip(source, rootIndex, 'Move', [0.3, 0.2, 0], [0.7, 0.4, 0]);
    const device = new NullDevice({});
    const cpu = createScenegraphsFromGLTF(device, source);
    const gpu = createScenegraphsFromGLTF(device, source, {gpuAnimation: {sampleRate: 12}});
    try {
      const clipName = gpu.animator.activeClip!;
      cpu.animator.selectClip(clipName);
      cpu.animator.setTime(500);
      gpu.animator.setTime(500);
      const resources = getResources(getModelNode(gpu));
      const frameOffset = resources.animationParameters![0] * resources.animationFrameStride! * 4;
      const palette = cpu.skins.bindings[0].jointMatrices;
      expect(
        Array.from(
          resources.animationFrameValues!.subarray(
            frameOffset + 16,
            frameOffset + 16 + palette.length
          )
        )
      ).toEqual(Array.from(palette));
      const initialMatrix = Array.from(new Matrix4());
      expect(
        Array.from(resources.animationFrameValues!.subarray(frameOffset, frameOffset + 16))
      ).toEqual(initialMatrix);

      cpu.animator.selectClip('Move');
      gpu.animator.selectClip('Move');
      cpu.animator.update(0.5);
      gpu.animator.update(0.5);
      const moveOffset = resources.animationParameters![0] * resources.animationFrameStride! * 4;
      const bindMatrix = gpu.gltfNodeIndexToNodeMap.get(rootIndex)!.matrix;
      const poseMatrix = cpu.gltfNodeIndexToNodeMap.get(rootIndex)!.matrix;
      const reconstructed = new Matrix4(bindMatrix).multiplyRight(
        resources.animationFrameValues!.subarray(moveOffset, moveOffset + 16)
      );
      reconstructed.forEach((value, index) => expect(value).toBeCloseTo(poseMatrix[index], 6));
    } finally {
      cpu.destroy();
      gpu.destroy();
      device.destroy();
    }
  });

  test('crossfades baked clips without evaluating tracks and resets disjoint clips to the authored pose', async () => {
    const source = await loadFixture();
    const output = source.accessors[source.animations![0].samplers[0].output].value!;
    output[output.length - 2] = Math.SQRT1_2;
    output[output.length - 1] = Math.SQRT1_2;
    const meshNodeIndex = source.nodes.findIndex(node => Boolean(node.mesh));
    addTranslationClip(source, meshNodeIndex, 'Move', [0, 0, 0], [0.4, 0, 0]);
    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source, {gpuAnimation: {sampleRate: 12}});
    const resources = getResources(getModelNode(scenegraphs));
    const initialPalette = scenegraphs.skins.bindings[0].jointMatrices;
    const firstClipName = scenegraphs.animator.activeClip!;
    scenegraphs.animator.selectClip('Move');
    scenegraphs.animator.update(0);
    const secondClipFrame = resources.animationParameters![0];
    const secondClipOffset = secondClipFrame * resources.animationFrameStride! * 4;
    scenegraphs.animator.selectClip(firstClipName);
    scenegraphs.animator.update(0);
    const evaluate = vi.spyOn(AnimationTrack.prototype, 'evaluate');
    try {
      // The second clip does not animate the joints; its baked palette starts at the bind pose.
      expect(
        Array.from(
          resources.animationFrameValues!.subarray(
            secondClipOffset + 16,
            secondClipOffset + 16 + initialPalette.length
          )
        )
      ).toEqual(Array.from(initialPalette));
      scenegraphs.animator.selectClip('Move', {crossFadeDuration: 0.25});
      scenegraphs.animator.update(0.125);
      expect(resources.animationBlend![3]).toBeCloseTo(0.5);
      expect(resources.animationParameters![0]).toBeGreaterThanOrEqual(secondClipFrame);
      expect(evaluate).not.toHaveBeenCalled();
    } finally {
      evaluate.mockRestore();
      scenegraphs.destroy();
      device.destroy();
    }
  });

  test('samples morph weights on the GPU while keeping vertex data and CPU weights unchanged', async () => {
    const source = await loadFixture('AnimatedMorphCube.glb');
    const nodeIndex = source.nodes.findIndex(node => Boolean(node.mesh));
    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source, {gpuAnimation: {sampleRate: 12}});
    const modelNode = getModelNode(scenegraphs, nodeIndex);
    const resources = getResources(modelNode);
    const vertexBuffer = modelNode.model._gpuGeometry.attributes['geometry'];
    const initialVertices = Array.from(await vertexBuffer.readAsync());
    const initialWeights = [
      ...(scenegraphs.gltfNodeIndexToNodeMap.get(nodeIndex)!.userData['morphWeights'] as number[])
    ];
    const evaluate = vi.spyOn(AnimationTrack.prototype, 'evaluate');
    try {
      scenegraphs.animator.setTime(500);
      expect(resources.morphTargetCount).toBe(2);
      expect(resources.morphWeights).toBeUndefined();
      expect(resources.morphTargetData).toBeInstanceOf(Texture);
      expect(Array.from(await vertexBuffer.readAsync())).toEqual(initialVertices);
      expect(scenegraphs.gltfNodeIndexToNodeMap.get(nodeIndex)!.userData['morphWeights']).toEqual(
        initialWeights
      );
      expect(evaluate).not.toHaveBeenCalled();
    } finally {
      evaluate.mockRestore();
      scenegraphs.destroy();
      device.destroy();
    }
  });

  test('keeps material and visibility channels on the CPU while pose tracks stay on the GPU', async () => {
    const source = await loadFixture();
    const material = {id: 'animated-material', pbrMetallicRoughness: {roughnessFactor: 0.2}};
    source.materials = [material];
    source.meshes[0].primitives[0].material = material;
    const animation = source.animations![0];
    const sourceSampler = animation.samplers[0];
    const input = source.accessors.length;
    source.accessors.push({
      ...source.accessors[sourceSampler.input],
      id: 'property-times',
      count: 2,
      value: new Float32Array([0, 1])
    });
    for (const [pointer, values, interpolation] of [
      ['/materials/0/pbrMetallicRoughness/roughnessFactor', [0.2, 0.8], 'LINEAR'],
      ['/nodes/0/extensions/KHR_node_visibility/visible', [1, 0], 'STEP']
    ] as const) {
      const output = source.accessors.length;
      source.accessors.push({
        ...source.accessors[sourceSampler.output],
        id: pointer,
        type: 'SCALAR',
        components: 1,
        count: 2,
        value: new Float32Array(values)
      });
      const sampler = animation.samplers.length;
      animation.samplers.push({input, output, interpolation});
      animation.channels.push({
        sampler,
        target: {path: 'pointer', extensions: {KHR_animation_pointer: {pointer}}}
      });
    }
    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source, {gpuAnimation: {sampleRate: 12}});
    const evaluate = vi.spyOn(AnimationTrack.prototype, 'evaluate');
    const updateSkins = vi.spyOn(scenegraphs.skins, 'update');
    try {
      expect(scenegraphs.animationStats.mode).toBe('gpu');
      scenegraphs.animator.setTime(500);
      expect(
        scenegraphs.materials[0].shaderInputs.getUniformValues()['pbrMaterial'][
          'metallicRoughnessValues'
        ][1]
      ).toBeCloseTo(0.5);
      expect(evaluate).toHaveBeenCalledTimes(2);
      expect(updateSkins).not.toHaveBeenCalled();
      scenegraphs.animator.setTime(1500);
      expect(scenegraphs.gltfNodeIndexToNodeMap.get(0)!.display).toBe(false);
    } finally {
      evaluate.mockRestore();
      scenegraphs.destroy();
      device.destroy();
    }
  });

  test('owns independent pose atlases for repeated rigid meshes and releases every resource', async () => {
    const source = await loadFixture();
    const primitive = source.meshes[0].primitives[0];
    delete primitive.attributes['JOINTS_0'];
    delete primitive.attributes['WEIGHTS_0'];
    delete source.nodes[0].skin;
    const second = {...source.nodes[0], id: 'second-rigid-mesh', translation: [0.5, 0, 0]};
    const secondIndex = source.nodes.length;
    source.nodes.push(second);
    source.scenes[0].nodes.push(second);
    addTranslationClip(source, 0, 'Move', [0, 0, 0], [0.4, 0, 0]);
    const device = new NullDevice({});
    const resourceCounts = device.statsManager.getStats('Resource Counts');
    const initialBuffers = resourceCounts.get('Buffers Active').count;
    const initialTextures = resourceCounts.get('Textures Active').count;
    const scenegraphs = createScenegraphsFromGLTF(device, source, {gpuAnimation: {sampleRate: 12}});
    try {
      const firstModel = getModelNode(scenegraphs, 0);
      const secondModel = getModelNode(scenegraphs, secondIndex);
      const firstResources = getResources(firstModel);
      const secondResources = getResources(secondModel);
      expect(firstModel).not.toBe(secondModel);
      expect(firstResources.animationFrames).not.toBe(secondResources.animationFrames);
      scenegraphs.animator.selectClip('Move');
      scenegraphs.animator.update(0.5);
      const frame = firstResources.animationParameters![0];
      const firstOffset = frame * firstResources.animationFrameStride! * 4;
      const secondOffset = frame * secondResources.animationFrameStride! * 4;
      expect(firstResources.animationFrameValues![firstOffset + 12]).toBeCloseTo(0.2);
      expect(secondResources.animationFrameValues![secondOffset + 12]).toBeCloseTo(0);
      scenegraphs.destroy();
      scenegraphs.destroy();
      expect(resourceCounts.get('Buffers Active').count).toBe(initialBuffers);
      expect(resourceCounts.get('Textures Active').count).toBe(initialTextures);
    } finally {
      scenegraphs.destroy();
      device.destroy();
    }
  });

  test('preserves CPU animation when a requested bake exceeds its budget', async () => {
    const source = await loadFixture();
    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source, {gpuAnimation: {maxBytes: 1}});
    const updateSkins = vi.spyOn(scenegraphs.skins, 'update');
    try {
      expect(scenegraphs.animationStats).toMatchObject({
        mode: 'cpu',
        fallbackReason: 'byte-budget'
      });
      expect(getModelNode(scenegraphs).userData['gltfAnimatedCrowd']).toBeUndefined();
      scenegraphs.animator.setTime(500);
      expect(updateSkins).toHaveBeenCalledOnce();
      expect(scenegraphs.animator.getAnimations()[0].clip.tracks.length).toBeGreaterThan(0);
    } finally {
      scenegraphs.destroy();
      device.destroy();
    }
  });

  test('keeps camera hierarchy transforms on the CPU instead of freezing camera motion', async () => {
    const source = await loadFixture();
    const jointIndex = source.skins![0].joints[1];
    const camera = {
      id: 'test-camera',
      type: 'perspective' as const,
      perspective: {yfov: 0.7, znear: 0.1}
    };
    source.cameras = [camera];
    const cameraNode = {id: 'camera-node', camera};
    source.nodes.push(cameraNode);
    source.nodes[jointIndex].children = [...(source.nodes[jointIndex].children || []), cameraNode];
    const device = new NullDevice({});
    const scenegraphs = createScenegraphsFromGLTF(device, source, {gpuAnimation: {}});
    try {
      expect(scenegraphs.animationStats).toMatchObject({
        mode: 'cpu',
        fallbackReason: 'unsupported-scene'
      });
      const initialMatrix = Array.from(scenegraphs.gltfNodeIndexToNodeMap.get(jointIndex)!.matrix);
      scenegraphs.animator.setTime(500);
      expect(Array.from(scenegraphs.gltfNodeIndexToNodeMap.get(jointIndex)!.matrix)).not.toEqual(
        initialMatrix
      );
    } finally {
      scenegraphs.destroy();
      device.destroy();
    }
  });
});
