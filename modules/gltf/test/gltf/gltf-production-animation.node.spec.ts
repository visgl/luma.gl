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
import test from 'test/utils/vitest-tape';

async function loadSimpleSkin() {
  const asset = await readFile(
    new URL('../../../../examples/showcase/anari/public/gltf/SimpleSkin.gltf', import.meta.url)
  );
  return postProcessGLTF(await parse(asset, GLTFLoader, {gltf: {loadImages: false}}));
}

test('glTF SimpleSkin automatically binds and animates existing primitive joint palettes', async testContext => {
  const source = await loadSimpleSkin();
  const device = new NullDevice({});
  const scenegraphs = createScenegraphsFromGLTF(device, source);
  const binding = scenegraphs.skins.getBinding(0);

  testContext.ok(scenegraphs.skins instanceof GLTFSkinController, 'exposes source-owned skins');
  testContext.equal(scenegraphs.skins.bindings.length, 1, 'binds the authored skinned node');
  testContext.equal(binding?.skinIndex, 0, 'resolves a postprocessed source skin');
  testContext.equal(binding?.joints.length, 2, 'preserves both authored joints');
  testContext.equal(binding?.models.length, 1, 'binds the existing primitive model');
  testContext.equal(binding?.jointMatrices.length, 32, 'allocates only authored joint matrices');

  if (binding) {
    const startingPalette = Array.from(binding.jointMatrices);
    const storage = binding.jointMatrices;
    scenegraphs.animator.setTime(500);

    testContext.equal(binding.jointMatrices, storage, 'reuses the same palette every frame');
    testContext.notDeepEqual(
      Array.from(binding.jointMatrices),
      startingPalette,
      'the existing imported clip updates its joint transforms'
    );

    const uniforms = binding.models[0].model.shaderInputs.getUniformValues();
    testContext.ok(uniforms['skin'], 'the existing skin shader receives the automatic palette');
  }

  for (const scene of scenegraphs.scenes) {
    scene.destroy();
  }
  device.destroy();
  testContext.end();
});

test('GLTFSkinController preserves independent skins and mesh-local transforms', testContext => {
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

  testContext.equal(controller.bindings.length, 2, 'keeps both authored skins independent');
  testContext.equal(controller.getBinding(0)?.jointMatrices[12], 2, 'localizes the first skin');
  testContext.equal(
    controller.getBinding(secondMeshNode)?.jointMatrices[12],
    5,
    'localizes the second skin'
  );

  secondJoint.setPosition([28, 0, 0]).updateMatrix();
  controller.update();
  testContext.equal(
    controller.getBinding(1)?.jointMatrices[12],
    8,
    'updates only authored transforms'
  );
  testContext.end();
});

test('GLTFAnimator advances wall-clock crossfades and supports explicit clip selection', testContext => {
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

  testContext.equal(animator.activeClip, 'walk', 'initially selects the first authored clip');
  testContext.false(animator.clips[1].action.playing, 'does not blend unrelated authored clips');
  animator.setTime(0);
  animator.selectClip('run', {crossFadeDuration: 1});
  animator.setTime(500);

  testContext.equal(animator.activeClip, 'run', 'exposes the newly selected authored clip');
  testContext.equal(
    node.position[0],
    5,
    'legacy millisecond playback advances both crossfade weights'
  );
  testContext.equal(updateCount, 2, 'runs dependent skin updates once per animation frame');

  animator.setTime(1000);
  testContext.equal(node.position[0], 10, 'crossfades finish at the incoming clip');
  testContext.equal(updateCount, 3, 'does not evaluate dependent skins twice');
  testContext.throws(() => animator.selectClip('missing'), 'unknown clip names remain explicit');
  testContext.end();
});
