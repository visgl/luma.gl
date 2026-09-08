// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {GroupNode} from '@luma.gl/engine';
import {
  createScenegraphsFromGLTF,
  type GLTFAnimation,
  GLTFAnimator,
  GLTFSkinController
} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';

async function loadSimpleSkin() {
  const asset = await readFile(
    new URL('../../../../examples/showcase/scene/public/gltf/SimpleSkin.gltf', import.meta.url)
  );
  return postProcessGLTF(await parse(asset, GLTFLoader, {gltf: {loadImages: false}}));
}

it('glTF SimpleSkin automatically binds and animates existing primitive joint palettes', async () => {
  const source = await loadSimpleSkin();
  const device = new NullDevice({});
  const scenegraphs = createScenegraphsFromGLTF(device, source);
  const binding = scenegraphs.skins.getBinding(0);

  expect(scenegraphs.skins instanceof GLTFSkinController, 'exposes source-owned skins').toBe(true);
  expect(scenegraphs.skins.bindings.length, 'binds the authored skinned node').toBe(1);
  expect(binding?.skinIndex, 'resolves a postprocessed source skin').toBe(0);
  expect(binding?.joints.length, 'preserves both authored joints').toBe(2);
  expect(binding?.models.length, 'binds the existing primitive model').toBe(1);
  expect(binding?.jointMatrices.length, 'allocates only authored joint matrices').toBe(32);

  if (binding) {
    const startingPalette = Array.from(binding.jointMatrices);
    const storage = binding.jointMatrices;
    scenegraphs.animator.setTime(500);

    expect(binding.jointMatrices, 'reuses the same palette every frame').toBe(storage);
    expect(
      Array.from(binding.jointMatrices),
      'the existing imported clip updates its joint transforms'
    ).not.toEqual(startingPalette);

    const uniforms = binding.models[0].model.shaderInputs.getUniformValues();
    expect(
      uniforms['skin'],
      'the existing skin shader receives the automatic palette'
    ).toBeTruthy();
  }

  for (const scene of scenegraphs.scenes) {
    scene.destroy();
  }
  device.destroy();
});

it('GLTFSkinController preserves independent skins and mesh-local transforms', () => {
  const firstMeshNode = new GroupNode({id: 'mesh-node-a', position: [10, 0, 0]});
  const secondMeshNode = new GroupNode({id: 'mesh-node-b', position: [20, 0, 0]});
  const firstJoint = new GroupNode({id: 'joint-a', position: [12, 0, 0]});
  const secondJoint = new GroupNode({id: 'joint-b', position: [25, 0, 0]});
  const firstMesh = new GroupNode({id: 'mesh-a'});
  const secondMesh = new GroupNode({id: 'mesh-b'});
  firstMeshNode.add(firstMesh);
  secondMeshNode.add(secondMesh);
  const scene = new GroupNode({
    id: 'scene',
    children: [firstMeshNode, secondMeshNode, firstJoint, secondJoint]
  });
  const gltf = {
    nodes: [
      {id: 'mesh-node-a', mesh: {id: 'mesh-a'}, skin: 0},
      {id: 'mesh-node-b', mesh: {id: 'mesh-b'}, skin: 1},
      {id: 'joint-a'},
      {id: 'joint-b'}
    ],
    skins: [{joints: [2]}, {joints: [3]}],
    accessors: []
  } as any;
  const controller = new GLTFSkinController({
    gltf,
    scenes: [scene],
    gltfNodeIndexToNodeMap: new Map([
      [0, firstMeshNode],
      [1, secondMeshNode],
      [2, firstJoint],
      [3, secondJoint]
    ])
  });

  expect(controller.bindings.length, 'keeps both authored skins independent').toBe(2);
  expect(controller.getBinding(0)?.jointMatrices[12], 'localizes the first skin').toBe(2);
  expect(
    controller.getBinding(secondMeshNode)?.jointMatrices[12],
    'localizes the second skin'
  ).toBe(5);

  secondJoint.setPosition([28, 0, 0]).updateMatrix();
  controller.update();
  expect(controller.getBinding(1)?.jointMatrices[12], 'updates only authored transforms').toBe(8);
});

it('GLTFAnimator advances wall-clock crossfades and supports explicit clip selection', () => {
  const node = new GroupNode({id: 'animated'});
  let updateCount = 0;
  const makeAnimation = (name: string, position: number): GLTFAnimation => ({
    name,
    channels: [
      {
        type: 'node',
        path: 'translation',
        targetNodeId: node.id,
        sampler: {
          input: [0, 2],
          interpolation: 'LINEAR',
          output: [
            [position, 0, 0],
            [position, 0, 0]
          ]
        }
      }
    ]
  });
  const animator = new GLTFAnimator({
    animations: [makeAnimation('walk', 0), makeAnimation('run', 10)],
    gltfNodeIdToNodeMap: new Map([[node.id, node]]),
    autoplay: 'first',
    onUpdate: () => updateCount++
  });

  expect(animator.activeClip, 'initially selects the first authored clip').toBe('walk');
  expect(animator.clips[1].action.playing, 'does not blend unrelated authored clips').toBe(false);
  animator.setTime(0);
  animator.selectClip('run', {crossFadeDuration: 1});
  animator.setTime(500);

  expect(animator.activeClip, 'exposes the newly selected authored clip').toBe('run');
  expect(node.position[0], 'legacy millisecond playback advances both crossfade weights').toBe(5);
  expect(updateCount, 'runs dependent skin updates once per animation frame').toBe(2);

  animator.setTime(1000);
  expect(node.position[0], 'crossfades finish at the incoming clip').toBe(10);
  expect(updateCount, 'does not evaluate dependent skins twice').toBe(3);
  expect(() => animator.selectClip('missing'), 'unknown clip names remain explicit').toThrow();
});
