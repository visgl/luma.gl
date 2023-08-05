import test from 'tape-promise/tape';
import {webgl1Device} from '@luma.gl/test-utils';

import '@loaders.gl/polyfills';
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {Texture} from '@luma.gl/api';
import {createGLTFObjects, GLTFEnvironment} from '@luma.gl/gltf';

test.only('gltf#loading', async (t) => {
  // TODO - is gl argument used?
  const gltf = await load('test/data/box.glb', GLTFLoader);

  debugger
  const result = createGLTFObjects(webgl1Device, gltf);

  t.ok(result.hasOwnProperty('scenes'), 'Should contain scenes property');
  t.ok(result.hasOwnProperty('animator'), 'Should contain animator property');

  t.end();
});

test('gltf#environment', (t) => {
  const environment = new GLTFEnvironment(webgl1Device, {
    brdfLutUrl: 'test/data/webgl-logo-0.png',
    getTexUrl: (type, dir, mipLevel) => `test/data/webgl-logo-${mipLevel}.png`,
    specularMipLevels: 9
  });

  t.ok(environment.getBrdfTexture() instanceof Texture, 'BRDF lookup texture created');
  t.ok(
    environment.getDiffuseEnvSampler() instanceof Texture,
    'Diffuse environment map created'
  );
  t.ok(
    environment.getSpecularEnvSampler() instanceof Texture,
    'Specular environment map created'
  );

  t.end();
});
