// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {ANARIDevice, type ANARIGeometry, ANARIGroup, type ANARIInstance} from '@luma.gl/scene';
import {ANARISceneSchema} from '@luma.gl/scene/schemas';
import {ModelNode} from '@luma.gl/engine';
import {createScenegraphsFromGLTF} from '@luma.gl/gltf';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, it} from 'vitest';
import {makeANARIJSONSceneFromGLTF} from '../../../examples/showcase/scene/gltf-to-anari';
import {createANARIJSONScene} from '../../../examples/showcase/scene/playground-scene';

async function loadAnimatedMorphCube() {
  const assetData = await readFile(
    new URL('../../../examples/showcase/scene/public/gltf/AnimatedMorphCube.glb', import.meta.url)
  );
  return postProcessGLTF(await parse(assetData, GLTFLoader, {gltf: {loadImages: false}}));
}

it('glTF AnimatedMorphCube changes existing packed geometry through the existing animator', async () => {
  const source = await loadAnimatedMorphCube();
  const device = new NullDevice({});
  const scenegraphs = createScenegraphsFromGLTF(device, source);
  const weightChannel = scenegraphs.animations[0]?.channels.find(
    channel => channel.type === 'node' && channel.path === 'weights'
  );
  let modelNode: ModelNode | undefined;
  scenegraphs.scenes[0].traverse(node => {
    if (node instanceof ModelNode && node.userData['morphTargets']) {
      modelNode = node;
    }
  });

  expect(weightChannel?.sampler.input.length, 'all authored keyframes are decoded').toBe(127);
  expect(weightChannel?.sampler.output.length, 'scalar weights become 127 vectors').toBe(127);
  expect(
    Boolean(weightChannel?.sampler.output.every(weights => weights.length === 2)),
    'both authored morph weights remain grouped at every keyframe'
  ).toBe(true);
  expect(Boolean(modelNode), 'the existing glTF scenegraph retains its morph-capable model').toBe(
    true
  );

  if (modelNode && weightChannel && weightChannel.type === 'node') {
    const model = modelNode.model;
    const vertexBuffer = model._gpuGeometry!.attributes['geometry'];
    const initialBytes = new Uint8Array(await vertexBuffer.readAsync());
    const initialWeights = weightChannel.sampler.output[0];
    const changedKeyframe = weightChannel.sampler.output.findIndex(weights =>
      weights.some((weight, index) => weight !== initialWeights[index])
    );

    expect(Boolean(changedKeyframe > 0), 'the real asset provides changing morph weights').toBe(
      true
    );
    scenegraphs.animator.setTime(weightChannel.sampler.input[changedKeyframe] * 1000);
    const morphedBytes = await vertexBuffer.readAsync();

    expect(
      Array.from(morphedBytes),
      'existing interleaved GPU vertices change without recreating the model'
    ).not.toEqual(Array.from(initialBytes));
    expect(modelNode.model, 'the authored model and vertex layout remain stable').toBe(model);
  }

  for (const scene of scenegraphs.scenes) {
    scene.destroy();
  }
  device.destroy();
});

it('ANARI imports AnimatedMorphCube and commits each changed retained geometry once', async () => {
  const source = await loadAnimatedMorphCube();
  const description = await makeANARIJSONSceneFromGLTF(source, 'ANIMATED MORPH CUBE');
  const weightTrack = description.clips?.[0]?.tracks.find(
    track => track.target.type === 'node' && track.target.path === 'weights'
  );
  const geometryDescription = Object.values(description.geometries).find(
    geometry => geometry.morphTargets?.length
  );

  expect(weightTrack?.times.length, 'all source morph keyframes remain editable').toBe(127);
  expect(weightTrack?.values[0].length, 'both animated target weights survive').toBe(2);
  expect(geometryDescription?.morphTargets?.length, 'both authored targets survive').toBe(2);
  expect(
    Boolean(
      geometryDescription?.morphTargets?.every(
        target => target.POSITION && target.NORMAL && target.TANGENT
      )
    ),
    'POSITION, NORMAL, and TANGENT deltas remain source-faithful'
  ).toBe(true);
  expect(
    (geometryDescription?.['vertex.tangent']?.length || 0) * 3,
    'base tangent handedness is retained alongside three-component tangent deltas'
  ).toBe((geometryDescription?.morphTargets?.[0].TANGENT?.length || 0) * 4);
  expect(
    Boolean(ANARISceneSchema.safeParse(description).success),
    'the retained JSON remains valid'
  ).toBe(true);

  const device = new ANARIDevice(new NullDevice({}));
  if (description.renderer) {
    description.renderer.bloomIntensity = 0;
  }
  const scene = createANARIJSONScene(device, description);
  const instances = scene.frame
    .getParameter('world')!
    .getParameter('instance') as readonly ANARIInstance[];
  let retainedGeometry: ANARIGeometry | undefined;
  for (const instance of instances) {
    const group = instance.getParameter('group');
    if (!(group instanceof ANARIGroup)) {
      continue;
    }
    const surfaces = group.getParameter('surface');
    if (!Array.isArray(surfaces)) {
      continue;
    }
    for (const surface of surfaces) {
      const geometry = surface.getParameter('geometry');
      if (geometry?.getParameter('morphTargets')?.length) {
        retainedGeometry = geometry;
      }
    }
  }

  expect(
    Boolean(retainedGeometry),
    'the imported morph geometry becomes a retained ANARI handle'
  ).toBe(true);
  expect(Boolean(scene.animations), 'authored morph tracks use the shared animation scene').toBe(
    true
  );
  if (retainedGeometry && weightTrack && scene.animations) {
    const startingWeights = retainedGeometry.getParameter('morphWeights') || [];
    const changedKeyframe = weightTrack.values.findIndex(weights =>
      weights.some((weight, index) => weight !== startingWeights[index])
    );
    const originalVersion = retainedGeometry.version;

    expect(
      Boolean(changedKeyframe >= 0),
      'the authored clip changes its initial retained weights'
    ).toBe(true);
    scene.animations.seek(weightTrack.times[changedKeyframe]);
    expect(
      retainedGeometry.getParameter('morphWeights'),
      'scrubbing updates both retained target weights through the shared mixer'
    ).toEqual(weightTrack.values[changedKeyframe]);
    expect(
      retainedGeometry.version,
      'the changed geometry commits once for the entire animation frame'
    ).toBe(originalVersion + 1);
    expect(
      Boolean(scene.frame.render().drawCount > 0),
      'the imported retained morph scene renders'
    ).toBe(true);
  }

  scene.destroy();
  device.destroy();
});

it('ANARI converts normalized glTF integer joint weights into retained float weights', async () => {
  for (const [ArrayType, maximumWeight] of [
    [Uint8Array, 255],
    [Uint16Array, 65535]
  ] as const) {
    const source = await loadAnimatedMorphCube();
    const primitive = source.meshes[0].primitives[0];
    const positionAccessor = primitive.attributes['POSITION'];
    const weights = new ArrayType(positionAccessor.count * 4);
    for (let vertexIndex = 0; vertexIndex < positionAccessor.count; vertexIndex++) {
      weights[vertexIndex * 4] = maximumWeight;
    }
    Object.assign(primitive.attributes, {
      JOINTS_0: {
        ...positionAccessor,
        value: new Uint8Array(positionAccessor.count * 4),
        components: 4,
        normalized: false
      },
      WEIGHTS_0: {...positionAccessor, value: weights, components: 4, normalized: true}
    });

    const description = await makeANARIJSONSceneFromGLTF(source, 'NORMALIZED SKIN');
    const geometry = Object.values(description.geometries).find(
      candidate => candidate['vertex.weight']?.length
    );

    expect(
      geometry?.['vertex.weight']?.[0],
      `${ArrayType.name} maximum weights normalize to 1`
    ).toBe(1);
    expect(geometry?.['vertex.weight']?.[1], `${ArrayType.name} zero weights remain 0`).toBe(0);
    expect(
      Boolean(geometry?.['vertex.joint']?.length),
      `${ArrayType.name} joint accessors remain retained`
    ).toBe(true);
  }
});
