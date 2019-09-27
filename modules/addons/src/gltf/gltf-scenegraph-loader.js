import {assert} from '@luma.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import createGLTFObjects from './create-gltf-objects';

async function parse(data, options, uri, loader) {
  assert(options.gl);

  const gltf = await GLTFLoader.parse(data, {
    ...options,
    uri,
    gltf: {
      // By default, parser version 2 loads all linked assets,
      // including images, as part of the load promise
      parserVersion: 2
    }
  });

  const gltfObjects = createGLTFObjects(options.gl, gltf, options);

  return Object.assign({gltf}, gltfObjects);
}

export default {
  name: 'GLTF Scenegraph Loader',
  extensions: ['gltf', 'glb'],
  parse
};
