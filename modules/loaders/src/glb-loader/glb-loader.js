// Binary container format for glTF

import GLBParser from './glb-parser';
import unpackGLBBuffers from './unpack-glb-buffers';
import unpackJsonArrays from './unpack-json-arrays';

export function parseGLB(arrayBuffer, options = {}) {
  const {json, binaryByteOffset} = GLBParser.parseBinary(arrayBuffer, options);
  const unpackedBuffers = unpackGLBBuffers(arrayBuffer, json, binaryByteOffset);
  return unpackJsonArrays(json, unpackedBuffers);
}

export default {
  name: 'GLB',
  extension: 'glb',
  parseBinary: parseGLB
};
