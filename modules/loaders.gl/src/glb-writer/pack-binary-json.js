import {flattenToTypedArray} from '../common/loader-utils';

// Recursively packs (replaces) binary objects
// Replaces "typed arrays" with "JSON pointers" to binary chunks tracked by glbBuilder
//
export default function packBinaryJson(json, glbBuilder, options = {}) {
  const {flattenArrays = false} = options;
  let object = json;

  // Check if string has same syntax as our "JSON pointers", if so "escape it".
  if (typeof object === 'string' && object.indexOf('#/') === 0) {
    return `#${object}`;
  }

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

    if (glbBuilder.isImage(object)) {
      const imageIndex = glbBuilder.addImage(object);
      return `#/images/${imageIndex}`;
    }

    // if not an image, pack as accessor
    const bufferIndex = glbBuilder.addBuffer(object);
    return `#/accessors/${bufferIndex}`;
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
