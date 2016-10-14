import GL from './webgl-constants';

// TYPED ARRAYS

export function glTypeFromArray(arrayOrType) {
  // If typed array, look up type name
  const type = ArrayBuffer.isView(arrayOrType) ?
    arrayOrType.constructor :
    arrayOrType;

  switch (type) {
  case Float32Array: return GL.FLOAT;
  case Uint16Array: return GL.UNSIGNED_SHORT;
  case Uint32Array: return GL.UNSIGNED_INT;
  case Uint8Array: return GL.UNSIGNED_BYTE;
  case Uint8ClampedArray: return GL.UNSIGNED_BYTE;
  case Int8Array: return GL.BYTE;
  case Int16Array: return GL.SHORT;
  case Int32Array: return GL.INT;
  default:
    throw new Error('Failed to deduce type from array/array type');
  }
}

/* eslint-disable complexity */
export function glTypeToArray(glType, {clamped = true} = {}) {
  // Sorted in some order of likelihood to reduce amount of comparisons
  switch (glType) {
  case GL.FLOAT:
    return Float32Array;
  case GL.UNSIGNED_SHORT:
  case GL.UNSIGNED_SHORT_5_6_5:
  case GL.UNSIGNED_SHORT_4_4_4_4:
  case GL.UNSIGNED_SHORT_5_5_5_1:
    return Uint16Array;
  case GL.UNSIGNED_INT:
    return Uint32Array;
  case GL.UNSIGNED_BYTE:
    return clamped ? Uint8ClampedArray : Uint8Array;
  case GL.BYTE:
    return Int8Array;
  case GL.SHORT:
    return Int16Array;
  case GL.INT:
    return Int32Array;
  default:
    throw new Error('Failed to deduce type from array');
  }
}
/* eslint-enable complexity */

// Deprecated
export {glTypeToArray as glArrayFromType};
