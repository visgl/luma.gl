import {GLTFParser} from '@loaders.gl/gltf';
import {DracoDecoder} from '@loaders.gl/draco';
import createGLTFObjects from './create-gltf-objects';

async function parse(data, options, uri, loader) {
  const gltfParser = new GLTFParser();
  const gltf = await gltfParser.parse(data, {
    uri,
    decompress: true,
    DracoDecoder
  });

  return Object.assign({gltfParser, gltf}, createGLTFObjects(options.gl, gltf, options));
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
