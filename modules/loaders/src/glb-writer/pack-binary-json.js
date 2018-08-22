import {flattenToTypedArray} from '../common/loader-utils';

const DEFAULT_TOKENIZE = index => `$$$${index}`;

// Recursively packs (replaces) binary objects
// Replaces "typed arrays" with "JSON pointers" to binary chunks tracked by glbBuilder
//
export default function packBinaryJson(json, glbBuilder, options = {}) {
  const {tokenize = DEFAULT_TOKENIZE, flattenArrays = true} = options;
  let object = json;

  if (Array.isArray(object)) {
    // TODO - handle numeric arrays, flatten them etc.
    const typedArray = flattenArrays && flattenToTypedArray(object);
    if (typedArray) {
      object = typedArray;
    } else {
      return object.map(element => packBinaryJson(element, glbBuilder, options));
    }
  }

  // Typed arrays, pack them as binary
  if (ArrayBuffer.isView(object) && glbBuilder) {
    const bufferIndex = glbBuilder.addBuffer(object);
    return tokenize(bufferIndex);
  }

  if (object !== null && typeof object === 'object') {
    const newObject = {};
    for (const key in object) {
      newObject[key] = packBinaryJson(object[key], glbBuilder, options);
    }
    return newObject;
  }

  return object;
}
