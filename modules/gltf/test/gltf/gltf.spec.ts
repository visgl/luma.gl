// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {getWebGLTestDevice} from '@luma.gl/test-utils';

import '@loaders.gl/polyfills';
import {load} from '@loaders.gl/core';
import {GLTFLoader, GLTFPostprocessed, postProcessGLTF} from '@loaders.gl/gltf';

import {Texture} from '@luma.gl/core';
import {createScenegraphsFromGLTF, loadPBREnvironment} from '@luma.gl/gltf';

test('gltf#loading', async t => {
  const webglDevice = await getWebGLTestDevice();
  // path is relative to /test/index.html
  const gltf = await load('data/box.glb', GLTFLoader);

  const processedGLTF = gltf.json ? postProcessGLTF(gltf) : gltf;

  const result = createScenegraphsFromGLTF(webglDevice, processedGLTF);

  t.ok(result.hasOwnProperty('scenes'), 'Should contain scenes property');
  t.ok(result.hasOwnProperty('animator'), 'Should contain animator property');
  t.equals(result.scenes.length, 1, 'Should contain single scene');
  t.equals(result.animator, null, 'Should not contain animations');

  t.end();
});

test('gltf#animator', async t => {
  const webglDevice = await getWebGLTestDevice();

  const gltf = await load('data/BoxAnimated.glb', GLTFLoader);
  const processedGLTF = gltf.json ? postProcessGLTF(gltf) : gltf;

  const {scenes, animator} = createScenegraphsFromGLTF(webglDevice, processedGLTF);

  t.equals(scenes.length, 1, 'Should contain single scene');
  t.equals(animator.animations.length, 1, 'Should contain single animation');

  const {channels} = animator.animations[0];
  t.equals(channels.length, 2, 'Should contain two animation channels');
  const {target} = channels[0];
  t.ok(target._node, 'Should contain target node');

  t.ok(
    (processedGLTF as GLTFPostprocessed).nodes.every(node => !(node as any)._node),
    'GLTF object is not mutated'
  );

  t.end();
});

test.skip('gltf#environment', async t => {
  const webglDevice = await getWebGLTestDevice();

  const environment = loadPBREnvironment(webglDevice, {
    brdfLutUrl: 'data/webgl-logo-0.png',
    getTexUrl: (type, dir, mipLevel) => `test/data/webgl-logo-${mipLevel}.png`,
    specularMipLevels: 9
  });

  t.ok(environment.brdfLutTexture instanceof Texture, 'BRDF lookup texture created');
  t.ok(environment.diffuseEnvSampler instanceof Texture, 'Diffuse environment map created');
  t.ok(environment.specularEnvSampler instanceof Texture, 'Specular environment map created');

  t.end();
});
