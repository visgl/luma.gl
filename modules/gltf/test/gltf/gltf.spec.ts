// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

import '@loaders.gl/polyfills';
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import type {GLTFPostprocessed} from '@loaders.gl/gltf';

import {DynamicTexture} from '@luma.gl/engine';
import {createScenegraphsFromGLTF, loadPBREnvironment} from '@luma.gl/gltf';

test('gltf#loading', async t => {
  const webglDevice = await getWebGLTestDevice();
  const gltf = await load('test/data/box.glb', GLTFLoader);

  const processedGLTF = postProcessGLTF(gltf);

  const result = createScenegraphsFromGLTF(webglDevice, processedGLTF);

  t.ok(result.hasOwnProperty('scenes'), 'Should contain scenes property');
  t.ok(result.hasOwnProperty('animator'), 'Should contain animator property');
  t.ok(result.hasOwnProperty('extensionSupport'), 'Should contain extensionSupport property');
  t.ok(result.hasOwnProperty('sceneBounds'), 'Should contain sceneBounds property');
  t.ok(result.hasOwnProperty('modelBounds'), 'Should contain modelBounds property');
  t.equals(result.scenes.length, 1, 'Should contain single scene');
  t.deepEquals(result.animator.animations, [], 'Should not contain animations');
  t.equal(result.extensionSupport.size, 0, 'Should contain empty extension support map for Box');
  t.deepEqual(result.sceneBounds[0].center, [0, 0, 0], 'scene bounds expose scene center');
  t.ok(result.sceneBounds[0].recommendedOrbitDistance > 0, 'scene bounds expose camera distance');
  t.deepEqual(result.modelBounds.center, [0, 0, 0], 'model bounds expose model center');

  t.end();
});

test('gltf#animator', async t => {
  const webglDevice = await getWebGLTestDevice();

  const gltf = await load('test/data/BoxAnimated.glb', GLTFLoader);
  const processedGLTF = postProcessGLTF(gltf);

  const {scenes, animator, gltfNodeIdToNodeMap} = createScenegraphsFromGLTF(
    webglDevice,
    processedGLTF
  );

  t.equals(scenes.length, 1, 'Should contain single scene');
  t.equals(animator.animations.length, 1, 'Should contain single animation');

  const {channels} = animator.animations[0].animation;
  t.equals(channels.length, 2, 'Should contain two animation channels');
  const {targetNodeId} = channels[0];
  const targetNode = gltfNodeIdToNodeMap.get(targetNodeId);
  t.ok(targetNode, 'Should contain target node');

  t.ok(
    processedGLTF.nodes.every(gltfNode => !(gltfNode as any)._node),
    'GLTF object is not mutated'
  );

  t.end();
});

test('gltf#environment', async t => {
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

  t.ok(environment.brdfLutTexture instanceof DynamicTexture, 'BRDF lookup texture created');
  t.ok(environment.diffuseEnvSampler instanceof DynamicTexture, 'Diffuse environment map created');
  t.ok(
    environment.specularEnvSampler instanceof DynamicTexture,
    'Specular environment map created'
  );

  t.end();
});

test('gltf#createScenegraphsFromGLTF wires supported KHR_animation_pointer material channels', async t => {
  const webglDevice = await getWebGLTestDevice();
  const gltf: GLTFPostprocessed = {
    id: 'pointer-gltf',
    accessors: [
      {
        componentType: 5126,
        count: 2,
        type: 'SCALAR',
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
  t.deepEqual(
    uniforms.pbrMaterial.baseColorFactor,
    [0.5, 0.5, 0, 1],
    'material pointer animation updates the real luma.gl material state'
  );

  t.end();
});

test('gltf#createScenegraphsFromGLTF wires texture-transform KHR_animation_pointer channels', async t => {
  const webglDevice = await getWebGLTestDevice();
  const gltf: GLTFPostprocessed = {
    id: 'texture-pointer-gltf',
    accessors: [
      {
        componentType: 5126,
        count: 2,
        type: 'SCALAR',
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
  t.deepEqual(
    uniforms.pbrMaterial.normalUVTransform.map((value: number) => Number(value.toFixed(6))),
    [0.877583, 0.479426, 0, -0.479426, 0.877583, 0, 0, 0, 1],
    'texture-transform pointer animation updates the runtime UV delta matrix'
  );

  t.end();
});
