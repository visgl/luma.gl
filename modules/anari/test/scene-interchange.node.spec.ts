// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFile} from 'node:fs/promises';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {describe, expect, test} from 'vitest';
import {makeANARIJSONSceneFromGLTF} from '../../../examples/showcase/anari/gltf-to-anari';
import {PLAYGROUND_PRESETS} from '../../../examples/showcase/anari/playground-presets';
import {exportANARIJSONSceneToGLTF} from '../../../examples/showcase/anari/scene-export';

describe('retained ANARI to glTF animated interchange', () => {
  test('round-trips the real AnimatedMorphCube hierarchy, 127 keyframes, and both targets', async () => {
    const asset = await readFile(
      new URL('../../../examples/showcase/anari/public/gltf/AnimatedMorphCube.glb', import.meta.url)
    );
    const source = postProcessGLTF(await parse(asset, GLTFLoader, {gltf: {loadImages: false}}));
    const scene = await makeANARIJSONSceneFromGLTF(source, 'Animated morph interchange');
    const exported = JSON.parse(await exportANARIJSONSceneToGLTF(scene));

    expect(exported.animations).toHaveLength(source.animations.length);
    expect(exported.nodes.some(node => node.children?.length)).toBe(true);
    expect(exported.nodes.some(node => node.weights?.length === 2)).toBe(true);

    const weightChannel = exported.animations[0].channels.find(
      channel => channel.target.path === 'weights'
    );
    const weightSampler = exported.animations[0].samplers[weightChannel.sampler];
    expect(exported.accessors[weightSampler.input].count).toBe(127);
    expect(exported.accessors[weightSampler.output].count).toBe(254);
    expect(exported.accessors[weightSampler.output].type).toBe('SCALAR');

    const primitive = exported.meshes.find(mesh => mesh.primitives[0].targets)?.primitives[0];
    expect(primitive.targets).toHaveLength(2);
    expect(Object.keys(primitive.targets[0])).toEqual(['POSITION', 'NORMAL', 'TANGENT']);
    expect(exported.accessors[primitive.attributes.TANGENT].type).toBe('VEC4');
    expect(exported.accessors[primitive.targets[0].TANGENT].type).toBe('VEC3');

    const binary = await exportANARIJSONSceneToGLTF(scene, {binary: true});
    const roundTripped = postProcessGLTF(
      await parse(binary, GLTFLoader, {gltf: {loadImages: false}})
    );
    expect(roundTripped.animations).toHaveLength(1);
    expect(roundTripped.meshes.some(mesh => mesh.primitives[0].targets?.length === 2)).toBe(true);
  });

  test('preserves RGBA colors, tangent handedness, joints, weights, and explicit opacity', async () => {
    const scene = structuredClone(PLAYGROUND_PRESETS[0].scene);
    scene.geometries.halo = {
      '@@type': 'triangle',
      'vertex.position': [0, 0, 0, 1, 0, 0, 0, 1, 0],
      'vertex.tangent': [1, 0, 0, -1, 1, 0, 0, 1, 1, 0, 0, -1],
      'vertex.attribute0': [1, 0, 0, 0.25, 0, 1, 0, 0.5, 0, 0, 1, 0.75],
      'vertex.joint': [0, 0, 0, 0, 257, 0, 0, 0, 0, 0, 0, 0],
      'vertex.weight': [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      'primitive.index': [0, 1, 2]
    };
    scene.materials.halo.baseColor = [0.2, 0.4, 0.6, 0.9];
    scene.materials.halo.opacity = 0.35;

    const document = JSON.parse(await exportANARIJSONSceneToGLTF(scene));
    const primitive = document.meshes.find(mesh => mesh.name === 'halo').primitives[0];
    const material = document.materials.find(candidate => candidate.name === 'halo');

    expect(document.accessors[primitive.attributes.COLOR_0].type).toBe('VEC4');
    expect(document.accessors[primitive.attributes.TANGENT].type).toBe('VEC4');
    expect(document.accessors[primitive.attributes.JOINTS_0].componentType).toBe(5123);
    expect(document.accessors[primitive.attributes.WEIGHTS_0].type).toBe('VEC4');
    expect(material.pbrMetallicRoughness.baseColorFactor[3]).toBe(0.35);
  });

  test('round-trips source skin palettes and authored material-animation pointers', async () => {
    const scene = structuredClone(PLAYGROUND_PRESETS[0].scene);
    const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    scene.nodes = {
      root: {},
      joint: {parent: 'root'},
      mesh: {
        parent: 'root',
        instances: [scene.instances?.find(instance => instance.surface === 'halo')?.['@@id'] || '']
      }
    };
    (
      scene.surfaces.halo as typeof scene.surfaces.halo & {
        skin?: {node: string; joints: string[]; inverseBindMatrices: number[]};
      }
    ).skin = {node: 'mesh', joints: ['joint'], inverseBindMatrices: identity};
    scene.clips = [
      {
        name: 'Material pointer',
        tracks: [
          {
            target: {type: 'material', identifier: 'halo', path: 'roughness'},
            times: [0, 1],
            values: [[0.2], [0.8]],
            interpolation: 'LINEAR'
          }
        ]
      }
    ];

    const document = JSON.parse(await exportANARIJSONSceneToGLTF(scene));
    expect(document.skins).toHaveLength(1);
    expect(document.nodes.find(node => node.name === 'mesh').skin).toBe(0);
    expect(document.skins[0].joints).toEqual([
      document.nodes.findIndex(node => node.name === 'joint')
    ]);
    expect(document.accessors[document.skins[0].inverseBindMatrices].type).toBe('MAT4');
    expect(document.animations[0].channels[0].target).toEqual({
      path: 'pointer',
      extensions: {
        KHR_animation_pointer: {
          pointer: '/materials/0/pbrMetallicRoughness/roughnessFactor'
        }
      }
    });
    expect(document.extensionsUsed).toContain('KHR_animation_pointer');
  });
});
