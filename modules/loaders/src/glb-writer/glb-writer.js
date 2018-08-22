import GLBBuilder from './glb-builder';
import packBinaryJson from './pack-binary-json';
import {toBuffer} from '../common/loader-utils/array-utils';

export function encodeGLB(appJson, options) {
  const glbBuilder = new GLBBuilder();
  const packedAppJson = packBinaryJson(appJson, glbBuilder, options);
  return glbBuilder.encode(packedAppJson, options);
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
