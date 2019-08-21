import '@loaders.gl/polyfills';
import {load} from '@loaders.gl/core';
import {Texture2D, TextureCube} from '@luma.gl/core';
import {GLTFScenegraphLoader, createGLTFObjects, GLTFEnvironment} from '@luma.gl/addons';
import test from 'tape-catch';
import {fixture} from 'test/setup';

test('gltf#loading', t => {
  const {gl} = fixture;

  load('test/data/box.glb', GLTFScenegraphLoader, {gl})
    .then(result => {
      t.ok(result.hasOwnProperty('gltf'), 'Should contain gltf property');
      t.ok(result.hasOwnProperty('scenes'), 'Should contain scenes property');
      t.ok(result.hasOwnProperty('animator'), 'Should contain animator property');

      const objects = createGLTFObjects(gl, result.gltf);

      t.ok(objects.hasOwnProperty('scenes'), 'Should contain scenes property');
      t.ok(objects.hasOwnProperty('animator'), 'Should contain animator property');

      t.end();
    })
    .catch(e => t.fail(e));
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
