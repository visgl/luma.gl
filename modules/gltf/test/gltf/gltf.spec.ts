// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

import '@loaders.gl/polyfills';
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';

import {DynamicTexture} from '@luma.gl/engine';
import {createScenegraphsFromGLTF, loadPBREnvironment} from '@luma.gl/gltf';

it('gltf#loading', async () => {
  const webglDevice = await getWebGLTestDevice();
  const gltf = await load('test/data/box.glb', GLTFLoader);

  const processedGLTF = postProcessGLTF(gltf);

  const result = createScenegraphsFromGLTF(webglDevice, processedGLTF);

  expect(Boolean(result.hasOwnProperty('scenes')), 'Should contain scenes property').toBe(true);
  expect(Boolean(result.hasOwnProperty('animator')), 'Should contain animator property').toBe(true);
  expect(
    Boolean(result.hasOwnProperty('extensionSupport')),
    'Should contain extensionSupport property'
  ).toBe(true);
  expect(Boolean(result.hasOwnProperty('sceneBounds')), 'Should contain sceneBounds property').toBe(
    true
  );
  expect(Boolean(result.hasOwnProperty('modelBounds')), 'Should contain modelBounds property').toBe(
    true
  );
  expect(result.scenes.length, 'Should contain single scene').toBe(1);
  expect(result.animator.animations, 'Should not contain animations').toEqual([]);
  expect(result.extensionSupport.size, 'Should contain empty extension support map for Box').toBe(
    0
  );
  expect(result.sceneBounds[0].center, 'scene bounds expose scene center').toEqual([0, 0, 0]);
  expect(
    Boolean(result.sceneBounds[0].recommendedOrbitDistance > 0),
    'scene bounds expose camera distance'
  ).toBe(true);
  expect(result.modelBounds.center, 'model bounds expose model center').toEqual([0, 0, 0]);

  void 0;
});

it('gltf#animator', async () => {
  const webglDevice = await getWebGLTestDevice();

  const gltf = await load('test/data/BoxAnimated.glb', GLTFLoader);
  const processedGLTF = postProcessGLTF(gltf);

  const {scenes, animator, gltfNodeIdToNodeMap} = createScenegraphsFromGLTF(
    webglDevice,
    processedGLTF
  );

  expect(scenes.length, 'Should contain single scene').toBe(1);
  expect(animator.animations.length, 'Should contain single animation').toBe(1);

  const {channels} = animator.animations[0].animation;
  expect(channels.length, 'Should contain two animation channels').toBe(2);
  const {targetNodeId} = channels[0];
  const targetNode = gltfNodeIdToNodeMap.get(targetNodeId);
  expect(Boolean(targetNode), 'Should contain target node').toBe(true);

  expect(
    Boolean(processedGLTF.nodes.every(gltfNode => !(gltfNode as any)._node)),
    'GLTF object is not mutated'
  ).toBe(true);

  void 0;
});

it('gltf#environment', async () => {
  const webglDevice = await getWebGLTestDevice();

  const environment = loadPBREnvironment(webglDevice, {
    brdfLutUrl: 'test/data/webgl-logo-0.png',
    getTexUrl: (type, dir, mipLevel) => `test/data/webgl-logo-${mipLevel}.png`,
    specularMipLevels: 9
  });

  await Promise.all([
    environment.brdfLutTexture.ready,
    environment.diffuseEnvSampler.ready,
    environment.specularEnvSampler.ready
  ]);

  expect(
    Boolean(environment.brdfLutTexture instanceof DynamicTexture),
    'BRDF lookup texture created'
  ).toBe(true);
  expect(
    Boolean(environment.diffuseEnvSampler instanceof DynamicTexture),
    'Diffuse environment map created'
  ).toBe(true);
  expect(
    Boolean(environment.specularEnvSampler instanceof DynamicTexture),
    'Specular environment map created'
  ).toBe(true);

  void 0;
});

it('gltf#createScenegraphsFromGLTF wires supported KHR_animation_pointer material channels', async () => {
  const webglDevice = await getWebGLTestDevice();
  const gltf: GLTFPostprocessed = {
    id: 'pointer-gltf',
    accessors: [
      {
        componentType: 5126,
        count: 2,
        type: 'SCALAR',
        components: 1,
        value: new Float32Array([0, 1]),
        bufferView: {
          data: {
            buffer: new Float32Array([0, 1]).buffer
          }
        }
      },
      {
        componentType: 5126,
        count: 2,
        type: 'VEC4',
        components: 4,
        value: new Float32Array([1, 0, 0, 1, 0, 1, 0, 1]),
        bufferView: {
          data: {
            buffer: new Float32Array([1, 0, 0, 1, 0, 1, 0, 1]).buffer
          }
        }
      }
    ] as any,
    animations: [
      {
        channels: [
          {
            sampler: 0,
            target: {
              path: 'pointer',
              extensions: {
                KHR_animation_pointer: {
                  pointer: '/materials/0/pbrMetallicRoughness/baseColorFactor'
                }
              }
            }
          }
        ],
        samplers: [{input: 0, interpolation: 'LINEAR', output: 1}]
      }
    ] as any,
    asset: {version: '2.0'},
    buffers: [],
    bufferViews: [],
    cameras: [],
    images: [],
    materials: [{id: 'material-0', pbrMetallicRoughness: {baseColorFactor: [1, 0, 0, 1]}}] as any,
    meshes: [],
    nodes: [{id: 'node-0'}] as any,
    samplers: [],
    scenes: [{id: 'scene-0', nodes: [{id: 'node-0'}]}] as any,
    skins: [],
    textures: []
  };

  const {animator, materials} = createScenegraphsFromGLTF(webglDevice, gltf);

  animator.setTime(500);

  const uniforms = materials[0].shaderInputs.getUniformValues() as Record<string, any>;
  expect(
    uniforms.pbrMaterial.baseColorFactor,
    'material pointer animation updates the real luma.gl material state'
  ).toEqual([0.5, 0.5, 0, 1]);

  void 0;
});

it('gltf#createScenegraphsFromGLTF wires texture-transform KHR_animation_pointer channels', async () => {
  const webglDevice = await getWebGLTestDevice();
  const gltf: GLTFPostprocessed = {
    id: 'texture-pointer-gltf',
    accessors: [
      {
        componentType: 5126,
        count: 2,
        type: 'SCALAR',
        components: 1,
        value: new Float32Array([0, 1]),
        bufferView: {
          data: {
            buffer: new Float32Array([0, 1]).buffer
          }
        }
      },
      {
        componentType: 5126,
        count: 2,
        type: 'SCALAR',
        components: 1,
        value: new Float32Array([0.2, 1.2]),
        bufferView: {
          data: {
            buffer: new Float32Array([0.2, 1.2]).buffer
          }
        }
      }
    ] as any,
    animations: [
      {
        channels: [
          {
            sampler: 0,
            target: {
              path: 'pointer',
              extensions: {
                KHR_animation_pointer: {
                  pointer: '/materials/0/normalTexture/extensions/KHR_texture_transform/rotation'
                }
              }
            }
          }
        ],
        samplers: [{input: 0, interpolation: 'LINEAR', output: 1}]
      }
    ] as any,
    asset: {version: '2.0'},
    buffers: [],
    bufferViews: [],
    cameras: [],
    images: [],
    materials: [
      {
        id: 'material-0',
        normalTexture: {
          id: 'normal-0',
          texture: {},
          extensions: {
            KHR_texture_transform: {
              rotation: 0.2
            }
          }
        }
      }
    ] as any,
    meshes: [],
    nodes: [{id: 'node-0'}] as any,
    samplers: [],
    scenes: [{id: 'scene-0', nodes: [{id: 'node-0'}]}] as any,
    skins: [],
    textures: []
  };

  const {animator, materials} = createScenegraphsFromGLTF(webglDevice, gltf);

  animator.setTime(500);

  const uniforms = materials[0].shaderInputs.getUniformValues() as Record<string, any>;
  expect(
    uniforms.pbrMaterial.normalUVTransform.map((value: number) => Number(value.toFixed(6))),
    'texture-transform pointer animation updates the runtime UV delta matrix'
  ).toEqual([0.877583, 0.479426, 0, -0.479426, 0.877583, 0, 0, 0, 1]);

  void 0;
});
