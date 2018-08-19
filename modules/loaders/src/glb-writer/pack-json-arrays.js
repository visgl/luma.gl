import {flattenToTypedArray} from '../common/loader-utils';

const DEFAULT_TOKENIZE = index => `$$$${index}`;

// Recursively packs objects, replacing typed arrays with "JSON pointers" to binary data
export default function packJsonArrays(json, bufferPacker, options = {}) {
  const {tokenize = DEFAULT_TOKENIZE, flattenArrays = true} = options;
  let object = json;

  if (Array.isArray(object)) {
    // TODO - handle numeric arrays, flatten them etc.
    const typedArray = flattenArrays && flattenToTypedArray(object);
    if (typedArray) {
      object = typedArray;
    } else {
      return object.map(element => packJsonArrays(element, bufferPacker, options));
    }
  }

  // Typed arrays, pack them as binary
  if (ArrayBuffer.isView(object) && bufferPacker) {
    const bufferIndex = bufferPacker.addBuffer(object);
    return tokenize(bufferIndex);
  }

  if (object !== null && typeof object === 'object') {
    const newObject = {};
    for (const key in object) {
      newObject[key] = packJsonArrays(object[key], bufferPacker, options);
    }
    return newObject;
  }

  return object;
}
