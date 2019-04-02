/* global window */
import {GLTFParser} from '@loaders.gl/gltf';
import {DracoDecoder} from '@loaders.gl/draco';
import createGLTFObjects from './create-gltf-objects';

async function waitWhileCondition(condition) {
  while (condition()) {
    await new Promise(resolve => window.requestAnimationFrame(resolve));
  }
}

async function parse(data, options, uri, loader) {
  const gltfParser = new GLTFParser();
  const gltf = await gltfParser.parse(data, {
    uri,
    decompress: true,
    DracoDecoder
  });

  const gltfObjects = createGLTFObjects(options.gl, gltf, options);

  if (options.waitForFullLoad) {
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

    await waitWhileCondition(() => remaining.some(uniform => !uniform.loaded));
  }

  return Object.assign({gltfParser, gltf}, gltfObjects);
}

export const GLBScenegraphLoader = {
  name: 'GLTF Binary Scenegraph Loader',
  extension: 'glb',
  parse
};

export const GLTFScenegraphLoader = {
  name: 'GLTF Scenegraph Loader',
  extension: 'gltf',
  parse
};
