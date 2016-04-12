/* eslint-disable guard-for-in */
import assert from 'assert';

/**
 * Wraps the argument in an array if it is not one.
 * @param {object} a - The object to wrap.
 * @return {Array} array
 **/
export function splat(a) {
  return Array.isArray(a) && a || [a];
}

/**
* Provides a standard noop function.
**/
export function noop() {}

let _uid = Date.now();

/**
 * Returns a UID.
 * @return {number} uid
 **/
export function uid() {
  return _uid++;
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

export function isTypedArray(value) {
  return value.BYTES_PER_ELEMENT;
}

export function makeTypedArray(ArrayType, sourceArray) {
  assert(Array.isArray(sourceArray));
  const array = new ArrayType(sourceArray.length);
  for (let i = 0; i < sourceArray.length; ++i) {
    array[i] = sourceArray[i];
  }
  return array;
}
