import {padTo4Bytes} from '../loader-utils';
import assert from '../loader-utils/assert';

export default class GLBBufferPacker {
  constructor() {
    this.sourceBuffers = [];
  }

  addBuffer(data, {target, byteStride, byteOffset} = {}) {
    const bufferIndex = this.sourceBuffers.length;
    this.sourceBuffers.push({data, target});
    return bufferIndex;
  }

  packBuffers(buffers = [], addJsonDescriptor = addglTFBufferDescriptors) {
    buffers.forEach(buffer => this.addBuffer(buffer));

    // Allocate total array
    const totalByteLength = this._calculateBINBufferLength();
    const arrayBuffer = new ArrayBuffer(totalByteLength);
    const targetArray = new Uint8Array(arrayBuffer);

    // Allocate JSON descriptors object
    const jsonDescriptors = {};
    this._initJSONDescriptors(jsonDescriptors, totalByteLength);

    // Copy each array into
    let dstByteOffset = 0;
    for (let i = 0; i < this.sourceBuffers.length; i++) {
      const sourceBuffer = this.sourceBuffers[i];
      const srcByteOffset = sourceBuffer.data.byteOffset;
      const srcByteLength = sourceBuffer.data.byteLength;

      // Pack buffer onto the big target array
      //
      // 'sourceBuffer.data.buffer' could be a view onto a larger buffer.
      // We MUST use this constructor to ensure the byteOffset and byteLength is
      // set to correct values from 'sourceBuffer.data' and not the underlying
      // buffer for set() to work properly.
      const sourceArray = new Uint8Array(sourceBuffer.data.buffer, srcByteOffset, srcByteLength);
      targetArray.set(sourceArray, dstByteOffset);

      // Add the JSON descriptor to the jsonDescriptors chunk
      addJsonDescriptor(sourceBuffer, jsonDescriptors, targetArray, dstByteOffset, srcByteLength);

      dstByteOffset += padTo4Bytes(srcByteLength);
    }

    return {arrayBuffer, jsonDescriptors};
  }

  _calculateBINBufferLength() {
    // Calculate total length
    let byteLength = 0;
    for (let i = 0; i < this.sourceBuffers.length; i++) {
      const sourceBuffer = this.sourceBuffers[i];
      byteLength += padTo4Bytes(sourceBuffer.data.byteLength);
    }
    return padTo4Bytes(byteLength);
  }

  _initJSONDescriptors(jsonDescriptors, byteLength) {
    // TODO - this is glFF syntax. Does little harm, do we need top make this configurable?
    jsonDescriptors.buffers = [{byteLength}];
  }
}

const ARRAY_TO_COMPONENT_TYPE = new Map([
  [Int8Array, 5120],
  [Uint8Array, 5121],
  [Int16Array, 5122],
  [Uint16Array, 5123],
  [Uint32Array, 5125],
  [Float32Array, 5126]
]);

// Adds glTF compatible accessors for an data buffer to a json payload
// Note: glTF buffer descriptors are somewhat verbose and not to the most optimal choice
// when dealing with many small buffers
function addglTFBufferDescriptors(sourceBuffer, json, targetArray, byteOffset, byteLength) {
  json.bufferViews = json.bufferViews || [];
  json.accessors = json.accessors || [];

  const bufferViewIndex = json.bufferViews.length;
  const bufferView = {
    buffer: 0,
    byteLength,
    byteOffset
  };
  if (sourceBuffer.target !== undefined) {
    bufferView.target = sourceBuffer.target;
  }
  json.bufferViews.push(bufferView);

  const componentType = ARRAY_TO_COMPONENT_TYPE.get(sourceBuffer.data.constructor);
  assert(componentType);
  const accessor = {
    bufferView: bufferViewIndex,
    type: 'SCALAR', // 'VEC2', 'VEC3', 'VEC4' TODO - input argument needed
    componentType,
    count: sourceBuffer.data.length
  };
  json.accessors.push(accessor);
}
