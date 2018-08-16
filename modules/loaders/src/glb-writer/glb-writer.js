import GLBEncoder from './glb-encoder';
import GLBBufferPacker from './glb-buffer-packer';
import packJsonArrays from './pack-json-arrays';
import {toBuffer} from '../loader-utils/array-utils';

export function encodeGLB(inputJson, options) {
  const bufferPacker = new GLBBufferPacker();
  const glbJson = packJsonArrays(inputJson, bufferPacker, options);
  // TODO - avoid double array buffer creation
  const {arrayBuffer, jsonDescriptors} = bufferPacker.packBuffers();

  Object.assign(glbJson, jsonDescriptors);
  return GLBEncoder.createGlbBuffer(glbJson, arrayBuffer, options);
}

export function writeGLBtoFile(filePath, json, options) {
  const glbFileBuffer = encodeGLB(json, options);
  const fs = module.require('fs');
  fs.writeFileSync(`${filePath}.glb`, toBuffer(glbFileBuffer), {flag: 'w'});
  // console.log(`Wrote ${filePath}.glb`);
  return glbFileBuffer;
}
