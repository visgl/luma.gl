import test from 'tape-promise/tape';
import {webgl1TestDevice} from '@luma.gl/test-utils';

import '@loaders.gl/polyfills';
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {Texture2D, TextureCube} from '@luma.gl/gltools';
import {createGLTFObjects, GLTFEnvironment} from '@luma.gl/experimental';

test('gltf#loading', async (t) => {
  // TODO - is gl argument used?
  const gltf = await load('test/data/box.glb', GLTFLoader, {gl: webgl1TestDevice.gl});
  const result = createGLTFObjects(webgl1TestDevice, gltf);

  t.ok(result.hasOwnProperty('scenes'), 'Should contain scenes property');
  t.ok(result.hasOwnProperty('animator'), 'Should contain animator property');

  t.end();
});

test('gltf#environment', (t) => {
  const environment = new GLTFEnvironment(webgl1TestDevice, {
    brdfLutUrl: 'test/data/webgl-logo-0.png',
    getTexUrl: (type, dir, mipLevel) => `test/data/webgl-logo-${mipLevel}.png`,
    specularMipLevels: 9
  });

  t.ok(environment.getBrdfTexture() instanceof Texture2D, 'BRDF lookup texture created');
  t.ok(
    environment.getDiffuseEnvSampler() instanceof TextureCube,
    'Diffuse environment map created'
  );
  t.ok(
    environment.getSpecularEnvSampler() instanceof TextureCube,
    'Specular environment map created'
  );

  t.end();
});
