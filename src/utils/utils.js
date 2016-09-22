/**
 * Wraps the argument in an array if it is not one.
 * @param {object} a - The object to wrap.
 * @return {Array} array
 **/
export function splat(a) {
  return a ? (Array.isArray(a) ? a : [a]) : [];
}

/**
* Provides a standard noop function.
**/
export function noop() {}

const uidCounters = {};

/**
 * Returns a UID.
 * @param {String} id= - Identifier base name
 * @return {number} uid
 **/
export function uid(id = 'id') {
  uidCounters[id] = uidCounters[id] || 1;
  const count = uidCounters[id]++;
  return `${id}-${count}`;
}

/**
 * Merge multiple objects into one.
 * @param {...object} objects - The objects to merge.
 * @return {object} object
 **/
export function merge(objects) {
  const mix = {};
  for (let i = 0, l = arguments.length; i < l; i++) {
    const object = arguments[i];
    if (!object || object.constructor.name !== 'Object') {
      /* eslint-disable no-continue */
      continue;
    }
    for (const key in object) {
      const op = object[key];
      const mp = mix[key];
      if (mp && op.constructor.name === 'Object' &&
        mp.constructor.name === 'Object') {
        mix[key] = merge(mp, op);
      } else {
        mix[key] = detach(op);
      }
    }
  }
  return mix;
}

/**
 * Internal function for duplicating an object.
 * @param {object} elem - The object to recursively duplicate.
 * @return {object} object
 **/
function detach(elem) {
  const t = elem.constructor.name;
  let ans;
  if (t === 'Object') {
    ans = {};
    for (const p in elem) {
      ans[p] = detach(elem[p]);
    }
  } else if (t === 'Array') {
    ans = [];
    for (let i = 0, l = elem.length; i < l; i++) {
      ans[i] = detach(elem[i]);
    }
  } else {
    ans = elem;
  }

  return ans;
}

// TYPED ARRAYS

export function getArrayType(array) {
  // Sorted in some order of likelihood to reduce amount of comparisons
  if (array instanceof Float32Array) {
    return Float32Array;
  } else if (array instanceof Uint16Array) {
    return Uint16Array;
  } else if (array instanceof Uint32Array) {
    return Uint32Array;
  } else if (array instanceof Uint8Array) {
    return Uint8Array;
  } else if (array instanceof Uint8ClampedArray) {
    return Uint8ClampedArray;
  } else if (array instanceof Int8Array) {
    return Int8Array;
  } else if (array instanceof Int16Array) {
    return Int16Array;
  } else if (array instanceof Int32Array) {
    return Int32Array;
  }
  throw new Error('Failed to deduce type from array');
}

export function getGLTypeFromArrayType(arrayType) {
  // Sorted in some order of likelihood to reduce amount of comparisons
  switch (arrayType) {
  case Float32Array:
    return 'FLOAT';
  case Uint16Array:
    return 'UNSIGNED_SHORT';
  case Uint32Array:
    return 'UNSIGNED_INT';
  case Uint8Array:
    return 'UNSIGNED_BYTE';
  case Uint8ClampedArray:
    return 'UNSIGNED_BYTE';
  case Int8Array:
    return 'BYTE';
  case Int16Array:
    return 'SHORT';
  case Int32Array:
    return 'INT';
  default:
    throw new Error('Failed to deduce type from array');
  }
}

export function getGLTypeFromArray(array) {
  return getGLTypeFromArrayType(getArrayType(array));
}

/* eslint-disable complexity */
export function getArrayTypeFromGLType(glTypeString, clamped = false) {
  // Sorted in some order of likelihood to reduce amount of comparisons
  switch (glTypeString) {
  case 'FLOAT':
    return Float32Array;
  case 'UNSIGNED_SHORT':
  case 'UNSIGNED_SHORT_5_6_5':
  case 'UNSIGNED_SHORT_4_4_4_4':
  case 'UNSIGNED_SHORT_5_5_5_1':
    return Uint16Array;
  case 'UNSIGNED_INT':
    return Uint32Array;
  case 'UNSIGNED_BYTE':
    return clamped ? Uint8ClampedArray : Uint8Array;
  case 'BYTE':
    return Int8Array;
  case 'SHORT':
    return Int16Array;
  case 'INT':
    return Int32Array;
  default:
    throw new Error('Failed to deduce type from array');
  }
}
/* eslint-enable complexity */
