import assert from 'assert';

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

/**
 * Verifies if a given number is power of two or not.
 * @param {object} n - The number to check.
 * @return {Array} Returns true if the given number is power of 2, false otherwise.
 **/
export function isPowerOfTwo(n) {
  assert((typeof n === 'number'), 'Input must be a number');
  return n && ((n & (n - 1)) === 0);
}
