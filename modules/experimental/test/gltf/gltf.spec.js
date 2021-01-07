import '@loaders.gl/polyfills';
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {Texture2D, TextureCube} from '@luma.gl/webgl';
import {createGLTFObjects, GLTFEnvironment} from '@luma.gl/experimental';
import test from 'tape-catch';
import {fixture} from 'test/setup';

test('gltf#loading', async t => {
  const {gl} = fixture;

  try {
    const gltf = await load('test/data/box.glb', GLTFLoader, {gl});
    const result = createGLTFObjects(gl, gltf);

    t.ok(result.hasOwnProperty('scenes'), 'Should contain scenes property');
    t.ok(result.hasOwnProperty('animator'), 'Should contain animator property');
  } catch (e) {
    t.fail(e);
  }

  t.end();
});

test('gltf#environment', t => {
  const {gl} = fixture;

  const environment = new GLTFEnvironment(gl, {
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
