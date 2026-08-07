// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, type GLTFPostprocessed, postProcessGLTF} from '@loaders.gl/gltf';
import {Texture, type RenderPass} from '@luma.gl/core';
import {ModelNode} from '@luma.gl/engine';
import {createGLTFAnimatedCrowd} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {Matrix4} from '@math.gl/core';
import {describe, expect, test, vi} from 'vitest';

async function loadCrowdFixture(
  fixture: 'SimpleSkin.gltf' | 'AnimatedMorphCube.glb'
): Promise<GLTFPostprocessed> {
  const data = await readFile(
    new URL(`../../../../examples/showcase/anari/public/gltf/${fixture}`, import.meta.url)
  );
  return postProcessGLTF(await parse(data, GLTFLoader, {gltf: {loadImages: false}}));
}

function getActiveResourceCount(device: NullDevice, resource: 'Buffers' | 'Textures'): number {
  return device.statsManager.getStats('Resource Counts').get(`${resource} Active`).count;
}

describe('GPU-instanced glTF animation crowds', () => {
  test('shares one parsed skinned primitive while keeping actor poses and joint palettes independent', async () => {
    const source = await loadCrowdFixture('SimpleSkin.gltf');
    const sourceNodeTransforms = source.nodes.map(node => ({
      translation: node.translation ? [...node.translation] : undefined,
      rotation: node.rotation ? [...node.rotation] : undefined
    }));
    const device = new NullDevice({});
    const initialBuffers = getActiveResourceCount(device, 'Buffers');
    const initialTextures = getActiveResourceCount(device, 'Textures');
    const crowd = createGLTFAnimatedCrowd(device, source, {capacity: 8});

    expect(crowd.primitiveGroups).toHaveLength(1);
    expect(crowd.models).toHaveLength(1);
    expect(crowd.models[0].isInstanced).toBe(true);
    expect(crowd.primitiveGroups[0].jointCount).toBe(2);
    expect(crowd.primitiveGroups[0].skinJointMatrices).toBeInstanceOf(Texture);
    const allocatedBuffers = getActiveResourceCount(device, 'Buffers');
    const allocatedTextures = getActiveResourceCount(device, 'Textures');

    const buffer = crowd.primitiveGroups[0].transformBuffers[0];
    const write = vi.spyOn(Object.getPrototypeOf(buffer), 'write');
    let first;
    let second;
    try {
      [first, second] = crowd.addActors([
        {
          id: 'left',
          phase: 0,
          speed: 1,
          transform: new Matrix4().translate([-3, 0, 0])
        },
        {
          id: 'right',
          phase: 0.25,
          speed: 2,
          transform: new Matrix4().translate([6, 0, 0])
        }
      ]);
      expect(write).toHaveBeenCalledTimes(4);
      expect(write.mock.calls.every(([data]) => data.byteLength === 2 * 4 * 4)).toBe(true);
    } finally {
      write.mockRestore();
    }

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (!first || !second) {
      throw new Error('Missing crowd actors');
    }

    expect(crowd.actorCount).toBe(2);
    expect(crowd.getActor('left')).toBe(first);
    expect(crowd.getActor('right')).toBe(second);
    expect(first.root).not.toBe(second.root);
    expect(first.animator).not.toBe(second.animator);
    expect(first.skins).not.toBe(second.skins);
    expect(first.skins.bindings).toHaveLength(1);
    expect(second.skins.bindings).toHaveLength(1);
    expect(first.skins.bindings[0].models).toHaveLength(0);
    expect(second.skins.bindings[0].models).toHaveLength(0);
    expect(Array.from(first.skins.bindings[0].jointMatrices)).not.toEqual(
      Array.from(second.skins.bindings[0].jointMatrices)
    );
    expect(getActiveResourceCount(device, 'Buffers')).toBe(allocatedBuffers);
    expect(getActiveResourceCount(device, 'Textures')).toBe(allocatedTextures);
    expect(crowd.models[0].instanceCount).toBe(2);

    for (const actor of crowd.actors) {
      actor.root.preorderTraversal(node => expect(node).not.toBeInstanceOf(ModelNode));
    }

    const positionBytes = await crowd.primitiveGroups[0].transformBuffers[3].readAsync();
    const positions = new Float32Array(
      positionBytes.buffer,
      positionBytes.byteOffset,
      positionBytes.byteLength / Float32Array.BYTES_PER_ELEMENT
    );
    expect(positions[0]).toBeCloseTo(-3);
    expect(positions[4]).toBeCloseTo(6);

    const packedJointMatrices = crowd.primitiveGroups[0].jointMatrices;
    expect(packedJointMatrices).toBeDefined();
    if (packedJointMatrices) {
      expect(Array.from(packedJointMatrices.subarray(0, 32))).not.toEqual(
        Array.from(packedJointMatrices.subarray(32, 64))
      );
    }

    const firstTime = first.time;
    const secondTime = second.time;
    crowd.update(0.1);
    expect(first.time - firstTime).toBeCloseTo(0.1);
    expect(second.time - secondTime).toBeCloseTo(0.2);
    expect(
      source.nodes.map(node => ({
        translation: node.translation ? [...node.translation] : undefined,
        rotation: node.rotation ? [...node.rotation] : undefined
      }))
    ).toEqual(sourceNodeTransforms);

    first.pause();
    const pausedTime = first.time;
    crowd.update(0.1);
    expect(first.time).toBe(pausedTime);
    expect(second.time).toBeGreaterThan(secondTime);

    expect(crowd.removeActors(['left', 'missing'])).toBe(1);
    expect(first.destroyed).toBe(true);
    expect(second.destroyed).toBe(false);
    expect(crowd.models[0].instanceCount).toBe(1);

    crowd.destroy();
    crowd.destroy();
    expect(second.destroyed).toBe(true);
    expect(getActiveResourceCount(device, 'Buffers')).toBe(initialBuffers);
    expect(getActiveResourceCount(device, 'Textures')).toBe(initialTextures);
    device.destroy();
  });

  test('evaluates private morph weights without rewriting shared immutable primitive geometry', async () => {
    const source = await loadCrowdFixture('AnimatedMorphCube.glb');
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, source, {capacity: 3});
    const nodeIndex = source.nodes.findIndex(node =>
      node.mesh?.primitives.some(primitive => Boolean(primitive.targets?.length))
    );
    const group = crowd.primitiveGroups.find(candidate => candidate.nodeIndex === nodeIndex);
    expect(group).toBeDefined();
    if (!group) {
      throw new Error('Missing morph primitive');
    }

    const geometryBuffer = group.model._gpuGeometry.attributes['geometry'];
    const initialGeometry = Array.from(await geometryBuffer.readAsync());
    const [first, second] = crowd.addActors([
      {id: 'first', phase: 0.1},
      {id: 'second', phase: 0.6}
    ]);

    expect(first.getNode(nodeIndex)?.userData['morphWeights']).not.toEqual(
      second.getNode(nodeIndex)?.userData['morphWeights']
    );
    expect(first.getNode(nodeIndex)?.userData['morphMeshes']).toBeUndefined();
    expect(second.getNode(nodeIndex)?.userData['morphMeshes']).toBeUndefined();
    crowd.update(0.25);
    expect(Array.from(await geometryBuffer.readAsync())).toEqual(initialGeometry);
    expect(group.model.instanceCount).toBe(2);

    crowd.destroy();
    device.destroy();
  });

  test('plays different named actions through the same shared instanced draw', async () => {
    const source = await loadCrowdFixture('SimpleSkin.gltf');
    const sourceAnimation = source.animations?.[0];
    expect(sourceAnimation).toBeDefined();
    if (!sourceAnimation) {
      throw new Error('Missing source animation');
    }
    source.animations = [
      {...sourceAnimation, name: 'Walking'},
      {...sourceAnimation, name: 'Wave'}
    ];

    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, source, {capacity: 2});
    const [walker, waver] = crowd.addActors([
      {id: 'walker', clip: 'Walking', phase: 0},
      {id: 'waver', clip: 'Wave', phase: 0.25}
    ]);
    const draw = vi.spyOn(crowd.models[0], 'draw').mockReturnValue(true);

    expect(walker.activeClip).toBe('Walking');
    expect(waver.activeClip).toBe('Wave');
    expect(crowd.models).toHaveLength(1);
    expect(crowd.models[0].instanceCount).toBe(2);
    expect(crowd.draw({} as RenderPass)).toBe(1);
    expect(draw).toHaveBeenCalledOnce();

    draw.mockRestore();
    crowd.destroy();
    device.destroy();
  });

  test('keeps fixed capacity and rejects duplicate actor identifiers', async () => {
    const source = await loadCrowdFixture('SimpleSkin.gltf');
    const device = new NullDevice({});
    const crowd = createGLTFAnimatedCrowd(device, source, {capacity: 2});

    crowd.addActor({id: 'first'});
    expect(() => crowd.addActor({id: 'first'})).toThrow();
    expect(() => crowd.addActors([{id: 'second'}, {id: 'third'}])).toThrow();
    expect(crowd.actorCount).toBe(1);
    crowd.addActor({id: 'second'});
    expect(crowd.actorCount).toBe(2);
    expect(() => crowd.addActor({id: 'third'})).toThrow();

    crowd.destroy();
    expect(() => crowd.addActor()).toThrow();
    device.destroy();
  });
});
