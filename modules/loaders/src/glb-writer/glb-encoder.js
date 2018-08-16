/* eslint-disable camelcase, max-statements */
import {padTo4Bytes, copyArrayBuffer, TextEncoder} from '../loader-utils';

const MAGIC_glTF = 0x676c5446; // glTF in Big-Endian ASCII

const LE = true; // Binary GLTF is little endian.
const BE = false; // Magic needs to be written as BE

const GLB_FILE_HEADER_SIZE = 12;
const GLB_CHUNK_HEADER_SIZE = 8;

// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification
export default class GLBEncoder {
  static createGlbBuffer(json, binChunk, options = {}) {
    const {magic = MAGIC_glTF} = options;

    if (!json.buffers) {
      json.buffers = [
        {
          byteLength: binChunk.byteLength
        }
      ];
    }

    const jsonChunkOffset = GLB_FILE_HEADER_SIZE + GLB_CHUNK_HEADER_SIZE; // First headers: 20 bytes

    const jsonChunk = convertObjectToJsonChunk(json);
    // As body is 4-byte aligned, the scene length must be padded to have a multiple of 4.
    const jsonChunkLength = padTo4Bytes(jsonChunk.byteLength);

    const binChunkOffset = jsonChunkLength + jsonChunkOffset;
    const fileLength = binChunkOffset + GLB_CHUNK_HEADER_SIZE + padTo4Bytes(binChunk.byteLength);

    // Length is know, we can create the GLB memory buffer!
    const glbArrayBuffer = new ArrayBuffer(fileLength);
    const dataView = new DataView(glbArrayBuffer);

    // GLB Header
    dataView.setUint32(0, magic, BE); // Magic number (the ASCII string 'glTF').
    dataView.setUint32(4, 2, LE); // Version 2 of binary glTF container format uint32
    dataView.setUint32(8, fileLength, LE); // Total byte length of generated file (uint32)

    // Write the JSON chunk
    dataView.setUint32(12, jsonChunk.byteLength, LE); // Byte length of json chunk (uint32)
    dataView.setUint32(16, 0, LE); // Chunk format as uint32 (JSON is 0)
    copyArrayBuffer(glbArrayBuffer, jsonChunk, jsonChunkOffset);

    // TODO - Add spaces as padding to ensure scene is a multiple of 4 bytes.
    // for (let i = jsonChunkLength + 20; i < binChunkOffset; ++i) {
    //   glbFileArray[i] = 0x20;
    // }

    // Write the BIN chunk
    const binChunkLengthPadded = padTo4Bytes(binChunk.byteLength);
    dataView.setUint32(binChunkOffset + 0, binChunkLengthPadded, LE); // Byte length BIN (uint32)
    dataView.setUint32(binChunkOffset + 4, 1, LE); // Chunk format as uint32 (BIN is 1)
    copyArrayBuffer(glbArrayBuffer, binChunk, binChunkOffset + GLB_CHUNK_HEADER_SIZE);

    return glbArrayBuffer;
  }
}

function convertObjectToJsonChunk(json) {
  const jsonChunkString = JSON.stringify(json);
  const textEncoder = new TextEncoder('utf8');
  return textEncoder.encode(jsonChunkString);
}
