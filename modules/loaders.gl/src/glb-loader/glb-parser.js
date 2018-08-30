/* eslint-disable camelcase, max-statements */
import unpackGLBBuffers from './unpack-glb-buffers';
import unpackBinaryJson from './unpack-binary-json';
import {padTo4Bytes} from '../common/loader-utils/array-utils';
import TextDecoder from '../common/loader-utils/text-decoder';
import assert from '../common/loader-utils/assert';

// glTF CONSTANTS

const MAGIC_glTF = 0x676c5446; // glTF in Big-Endian ASCII

const GLB_FILE_HEADER_SIZE = 12;
const GLB_CHUNK_HEADER_SIZE = 8;

const GLB_CHUNK_TYPE_JSON = 0x4E4F534A;
const GLB_CHUNK_TYPE_BIN = 0x004E4942;

const LE = true; // Binary GLTF is little endian.
const BE = false; // Magic needs to be written as BE

// glTF ACCESSOR CONSTANTS

/*
const TYPE_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

const COMPONENT_TYPE_BYTE_SIZE = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4
};

const COMPONENT_TYPE_ARRAY = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
};
*/

function getMagicString(dataView) {
  return `\
${String.fromCharCode(dataView.getUint8(0))}\
${String.fromCharCode(dataView.getUint8(1))}\
${String.fromCharCode(dataView.getUint8(2))}\
${String.fromCharCode(dataView.getUint8(3))}`;
}

// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#glb-file-format-specification
export default class GLBParser {
  constructor(glbArrayBuffer) {
    this.glbArrayBuffer = glbArrayBuffer;
  }

  // Only returns application JSON
  parse(options = {}) {
    const {json, binaryByteOffset} = this._parseBinary(this.glbArrayBuffer, options);
    const unpackedBuffers = unpackGLBBuffers(this.glbArrayBuffer, json, binaryByteOffset);
    const unpackedJson = unpackBinaryJson(json, unpackedBuffers);
    return this._getApplicationJSON(unpackedJson, options);
  }

  // Returns both application JSON and glTF JSON, separated
  parseWithMetadata(options = {}) {
    const {json, binaryByteOffset} = this._parseBinary(this.glbArrayBuffer, options);
    const unpackedBuffers = unpackGLBBuffers(this.glbArrayBuffer, json, binaryByteOffset);
    const unpackedJson = unpackBinaryJson(json, unpackedBuffers);
    return unpackedJson;
  }

  // PRIVATE

  // Get JSON from json key
  _getApplicationJSON(json, options) {
    const jsonKey = options.jsonKey || 'json';
    // Create glTF metadata object, with deleted application json key
    const glTF = Object.assign({}, json);
    delete glTF[jsonKey];
    return {json: json[jsonKey], glTF};
  }

  _parseBinary(options = {}) {
    const {magic = MAGIC_glTF} = options;

    // GLB Header
    const dataView = new DataView(this.glbArrayBuffer);
    const magic1 = dataView.getUint32(0, BE); // Magic number (the ASCII string 'glTF').
    const version = dataView.getUint32(4, LE); // Version 2 of binary glTF container format
    const fileLength = dataView.getUint32(8, LE); // Total byte length of generated file

    let valid = magic1 === MAGIC_glTF || magic1 === magic;
    if (!valid) {
      console.warn(`Invalid GLB magic string ${getMagicString(dataView)}`); // eslint-disable-line
    }

    assert(version === 2, `Invalid GLB version ${version}. Only .glb v2 supported`);
    assert(fileLength > 20);

    // Write the JSON chunk
    const jsonChunkLength = dataView.getUint32(12, LE); // Byte length of json chunk
    const jsonChunkFormat = dataView.getUint32(16, LE); // Chunk format as uint32

    valid = jsonChunkFormat === GLB_CHUNK_TYPE_JSON || jsonChunkFormat === 0; // Back compat
    assert(valid, `JSON chunk format ${jsonChunkFormat}`);

    // Create a "view" of the binary encoded JSON data
    const jsonChunkOffset = GLB_FILE_HEADER_SIZE + GLB_CHUNK_HEADER_SIZE; // First headers: 20 bytes
    const jsonChunk = new Uint8Array(this.glbArrayBuffer, jsonChunkOffset, jsonChunkLength);

    // Decode the JSON binary array into clear text
    const textDecoder = new TextDecoder('utf8');
    const jsonText = textDecoder.decode(jsonChunk);

    // Parse the JSON text into a JavaScript data structure
    const json = JSON.parse(jsonText);

    // TODO - BIN chunk can be optional
    const binaryChunkStart = jsonChunkOffset + padTo4Bytes(jsonChunkLength);
    const binaryByteOffset = binaryChunkStart + GLB_CHUNK_HEADER_SIZE;

    const binChunkFormat = dataView.getUint32(binaryChunkStart + 4, LE); // Chunk format as uint32
    valid = binChunkFormat === GLB_CHUNK_TYPE_BIN || binChunkFormat === 1; // Back compat
    assert(valid, `BIN chunk format ${binChunkFormat}`);

    return {arrayBuffer: this.glbArrayBuffer, binaryByteOffset, json};
  }

  /*
  unpackBinaryObjects() {
    const unpackedBinaryObjects = {
      images: [],
      accessors: []
    };

    const images = this.json.images || [];
    for (const glTFImage of images) {
      unpackedBinaryObjects.images.push(this.unpackImage(glTFImage));
    }

    const accessors = this.json.accessors || [];
    for (const glTFAccessor of accessors) {
      unpackedBinaryObjects.accessors.push(this.unpackAccessor(glTFAccessor));
    }

    return unpackedBinaryObjects;
  }

  unpackImage(glTFImage) {
    /* global window, Blob, Image *
    const arrayBufferView = this.unpackBufferView(glTFImage.bufferView);
    const mimeType = glTFImage.mimeType || 'image/jpeg';
    const blob = new Blob([arrayBufferView], {type: mimeType});
    const urlCreator = window.URL || window.webkitURL;
    const imageUrl = urlCreator.createObjectURL(blob);
    const img = new Image();
    img.src = imageUrl;
    return img;
  }

  unpackAccessor(glTFAccessor) {
    // Decode the glTF accessor format
    const ArrayType = COMPONENT_TYPE_ARRAY[glTFAccessor.componentType];
    const components = TYPE_COMPONENTS[glTFAccessor.type];
    const bytesPerComponent = COMPONENT_TYPE_BYTE_SIZE[glTFAccessor.componentType];
    const length = glTFAccessor.count * components;
    const byteLength = glTFAccessor.count * components * bytesPerComponent;

    // Get the boundaries of the binary sub-chunk for this bufferView
    const glTFBufferView = this.json.bufferViews[glTFAccessor.bufferView];
    assert(byteLength >= 0 && byteLength <= glTFBufferView.byteLength);

    const byteOffset = glTFBufferView.byteOffset + this.binaryByteOffset;
    return new ArrayType(this.arrayBuffer, byteOffset, length);
  }

  // Create a new typed array as a view into the binary chunk
  unpackBufferView(glTFBufferView) {
    const byteOffset = glTFBufferView.byteOffset + this.binaryByteOffset;
    return new Uint8Array(byteOffset, glTFBufferView.byteLength);
  }
  */
}
