import GLBBuilder from './glb-builder';
import {toBuffer} from '../common/loader-utils/binary-utils';

function encodeGLB(json, options) {
  return new GLBBuilder().encode(json, options);
}

export function writeGLBtoFile(filePath, options, json) {
  const glbFileBuffer = encodeGLB(json, options);
  const fs = module.require('fs');
  fs.writeFileSync(`${filePath}.glb`, toBuffer(glbFileBuffer), {flag: 'w'});
  // console.log(`Wrote ${filePath}.glb`);
  return glbFileBuffer;
}

export default {
  name: 'GLB',
  extension: 'glb',
  encodeToBinary: encodeGLB,
  writeToFile: writeGLBtoFile
};
