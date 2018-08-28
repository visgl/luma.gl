// Binary container format for glTF

import GLBParser from './glb-parser';

export function parseGLB(arrayBuffer, options = {}) {
  return GLBParser.parseBinary(arrayBuffer, options);
}

export default {
  name: 'GLB',
  extension: 'glb',
  parseBinary: parseGLB
};
