/* global window */
import {assert} from '@luma.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import createGLTFObjects from './create-gltf-objects';

async function parse(data, options, uri, loader) {
  assert(options.gl);

  const gltf = await GLTFLoader.parse(data, {
    ...options,
    uri,
    decompress: true
  });

  const gltfObjects = createGLTFObjects(options.gl, gltf, options);

  if (options.waitForFullLoad) {
    await waitForGLTFAssets(gltfObjects);
  }

  return Object.assign({gltf}, gltfObjects);
}

async function waitForGLTFAssets(gltfObjects) {
  const remaining = [];

  gltfObjects.scenes.forEach(scene => {
    scene.traverse(model => {
      Object.values(model.model.program.uniforms).forEach(uniform => {
        if (uniform.loaded === false) {
          remaining.push(uniform);
        }
      });
    });
  });

  return await waitWhileCondition(() => remaining.some(uniform => !uniform.loaded));
}

async function waitWhileCondition(condition) {
  while (condition()) {
    await new Promise(resolve => window.requestAnimationFrame(resolve));
  }
}

export default {
  name: 'GLTF Scenegraph Loader',
  extensions: ['gltf', 'glb'],
  parse
};
