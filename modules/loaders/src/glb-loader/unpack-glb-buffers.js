import assert from '../loader-utils/assert';

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

export default function unpackGLBBuffers(arrayBuffer, json, binaryByteOffset) {
  // TODO - really inefficient, should just use the offset into the original array buffer
  if (binaryByteOffset) {
    arrayBuffer = getArrayBufferAtOffset(arrayBuffer, binaryByteOffset);
  }

  const bufferViews = json.bufferViews || [];
  const accessors = json.accessors || [];

  for (let i = 0; i < bufferViews.length; ++i) {
    const bufferView = bufferViews[i];
    assert(bufferView.byteLength >= 0);
  }

  const sourceBuffers = [];

  for (let i = 0; i < accessors.length; ++i) {
    const accessor = accessors[i];
    assert(accessor);

    const bufferView = bufferViews[accessor.bufferView];
    assert(bufferView);

    // Create a new typed array as a view into the combined buffer
    const {ArrayType, length} = getArrayTypeAndLength(accessor, bufferView);
    const array = new ArrayType(arrayBuffer, bufferView.byteOffset, length);
    sourceBuffers.push(array);
  }

  return sourceBuffers;
}

// Helper methods

function getArrayTypeAndLength(accessor, bufferView) {
  const ArrayType = COMPONENT_TYPE_ARRAY[accessor.componentType];
  const components = TYPE_COMPONENTS[accessor.type];
  const bytesPerComponent = COMPONENT_TYPE_BYTE_SIZE[accessor.componentType];
  const length = accessor.count * components;
  const byteLength = accessor.count * components * bytesPerComponent;
  assert(byteLength >= 0 && byteLength <= bufferView.byteLength);
  return {ArrayType, length, byteLength};
}

// json.accessors = json.accessors || [];
// json.bufferViews = json.bufferViews || [];

// Creates a new ArrayBuffer starting at the offset, containing all remaining bytes
// TODO - should not be needed, see above
function getArrayBufferAtOffset(arrayBuffer, byteOffset) {
  const length = arrayBuffer.byteLength - byteOffset;
  const binaryBuffer = new ArrayBuffer(length);
  const sourceArray = new Uint8Array(arrayBuffer);
  const binaryArray = new Uint8Array(binaryBuffer);
  for (let i = 0; i < length; i++) {
    binaryArray[i] = sourceArray[byteOffset + i];
  }
  return binaryBuffer;
}
