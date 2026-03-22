import {expect, test} from 'vitest';
import { getWebGLTestDevice } from '@luma.gl/test-utils';
import '@loaders.gl/polyfills';
import { load } from '@loaders.gl/core';
import { GLTFLoader, postProcessGLTF } from '@loaders.gl/gltf';
import { DynamicTexture } from '@luma.gl/engine';
import { createScenegraphsFromGLTF, loadPBREnvironment } from '@luma.gl/gltf';
test('gltf#loading', async () => {
  const webglDevice = await getWebGLTestDevice();
  const gltf = await load('test/data/box.glb', GLTFLoader);
  const processedGLTF = postProcessGLTF(gltf);
  const result = createScenegraphsFromGLTF(webglDevice, processedGLTF);
  expect(result.hasOwnProperty('scenes'), 'Should contain scenes property').toBeTruthy();
  expect(result.hasOwnProperty('animator'), 'Should contain animator property').toBeTruthy();
  expect(result.scenes.length, 'Should contain single scene').toBe(1);
  expect(result.animator.animations, 'Should not contain animations').toEqual([]);
});
test('gltf#animator', async () => {
  const webglDevice = await getWebGLTestDevice();
  const gltf = await load('test/data/BoxAnimated.glb', GLTFLoader);
  const processedGLTF = postProcessGLTF(gltf);
  const {
    scenes,
    animator,
    gltfNodeIdToNodeMap
  } = createScenegraphsFromGLTF(webglDevice, processedGLTF);
  expect(scenes.length, 'Should contain single scene').toBe(1);
  expect(animator.animations.length, 'Should contain single animation').toBe(1);
  const {
    channels
  } = animator.animations[0].animation;
  expect(channels.length, 'Should contain two animation channels').toBe(2);
  const {
    targetNodeId
  } = channels[0];
  const targetNode = gltfNodeIdToNodeMap.get(targetNodeId);
  expect(targetNode, 'Should contain target node').toBeTruthy();
  expect(processedGLTF.nodes.every(gltfNode => !(gltfNode as any)._node), 'GLTF object is not mutated').toBeTruthy();
});
test('gltf#environment', async () => {
  const webglDevice = await getWebGLTestDevice();
  const environment = loadPBREnvironment(webglDevice, {
    brdfLutUrl: 'test/data/webgl-logo-0.png',
    getTexUrl: (type, dir, mipLevel) => `test/data/webgl-logo-${mipLevel}.png`,
    specularMipLevels: 9
  });
  await Promise.all([environment.brdfLutTexture.ready, environment.diffuseEnvSampler.ready, environment.specularEnvSampler.ready]);
  expect(environment.brdfLutTexture instanceof DynamicTexture, 'BRDF lookup texture created').toBeTruthy();
  expect(environment.diffuseEnvSampler instanceof DynamicTexture, 'Diffuse environment map created').toBeTruthy();
  expect(environment.specularEnvSampler instanceof DynamicTexture, 'Specular environment map created').toBeTruthy();
});
