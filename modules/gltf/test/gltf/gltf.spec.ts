import test from 'tape-promise/tape';
import {webglDevice} from '@luma.gl/test-utils';

import '@loaders.gl/polyfills';
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';

import {Texture} from '@luma.gl/core';
import {createScenegraphsFromGLTF, loadPBREnvironment} from '@luma.gl/gltf';

test('gltf#loading', async (t) => {
  // TODO - is gl argument used?
  const gltf = await load('test/data/box.glb', GLTFLoader);

  const result = createScenegraphsFromGLTF(webglDevice, gltf);

  t.ok(result.hasOwnProperty('scenes'), 'Should contain scenes property');
  t.ok(result.hasOwnProperty('animator'), 'Should contain animator property');

  t.end();
});

test.skip('gltf#environment', (t) => {
  const environment = loadPBREnvironment(webglDevice, {
    brdfLutUrl: 'test/data/webgl-logo-0.png',
    getTexUrl: (type, dir, mipLevel) => `test/data/webgl-logo-${mipLevel}.png`,
    specularMipLevels: 9
  });

  t.ok(environment.brdfLutTexture instanceof Texture, 'BRDF lookup texture created');
  t.ok(
    environment.diffuseEnvSampler instanceof Texture,
    'Diffuse environment map created'
  );
  t.ok(
    environment.specularEnvSampler instanceof Texture,
    'Specular environment map created'
  );

  t.end();
});
