// Binary container format for glTF

import GLBParser from './glb-parser';

export function parseGLB(arrayBuffer, options = {}) {
  return new GLBParser(arrayBuffer).parse(options);
}

export function parseWithMetadata(arrayBuffer, options = {}) {
  return new GLBParser(arrayBuffer).parseWithMetadata(options);
}

export default {
  name: 'GLB',
  extension: 'glb',
  parseBinary: parseGLB,
  parseWithMetadata
};
