'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.splat = splat;
exports.noop = noop;
exports.uid = uid;
exports.merge = merge;
exports.getArrayType = getArrayType;
exports.getGLTypeFromArrayType = getGLTypeFromArrayType;
exports.getGLTypeFromArray = getGLTypeFromArray;
exports.getArrayTypeFromGLType = getArrayTypeFromGLType;
/**
 * Wraps the argument in an array if it is not one.
 * @param {object} a - The object to wrap.
 * @return {Array} array
 **/
function splat(a) {
  return a ? Array.isArray(a) ? a : [a] : [];
}

/**
* Provides a standard noop function.
**/
function noop() {}

var uidCounters = {};

/**
 * Returns a UID.
 * @return {number} uid
 **/
function uid() {
  var id = arguments.length <= 0 || arguments[0] === undefined ? 'id' : arguments[0];

  uidCounters[id] = uidCounters[id] || 1;
  var count = uidCounters[id]++;
  return id + '-' + count;
}

/**
 * Merge multiple objects into one.
 * @param {...object} objects - The objects to merge.
 * @return {object} object
 **/
function merge(objects) {
  var mix = {};
  for (var i = 0, l = arguments.length; i < l; i++) {
    var object = arguments[i];
    if (!object || object.constructor.name !== 'Object') {
      /* eslint-disable no-continue */
      continue;
    }
    for (var key in object) {
      var op = object[key];
      var mp = mix[key];
      if (mp && op.constructor.name === 'Object' && mp.constructor.name === 'Object') {
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
  var t = elem.constructor.name;
  var ans = void 0;
  if (t === 'Object') {
    ans = {};
    for (var p in elem) {
      ans[p] = detach(elem[p]);
    }
  } else if (t === 'Array') {
    ans = [];
    for (var i = 0, l = elem.length; i < l; i++) {
      ans[i] = detach(elem[i]);
    }
  } else {
    ans = elem;
  }

  return ans;
}

// TYPED ARRAYS

function getArrayType(array) {
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

function getGLTypeFromArrayType(arrayType) {
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
      return null;
  }
  throw new Error('Failed to deduce type from array');
}

function getGLTypeFromArray(array) {
  return getGLTypeFromArrayType(getArrayType(array));
}

/* eslint-disable complexity */
function getArrayTypeFromGLType(glTypeString) {
  var clamped = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztRQUtnQixLLEdBQUEsSztRQU9BLEksR0FBQSxJO1FBUUEsRyxHQUFBLEc7UUFXQSxLLEdBQUEsSztRQWlEQSxZLEdBQUEsWTtRQXNCQSxzQixHQUFBLHNCO1FBeUJBLGtCLEdBQUEsa0I7UUFLQSxzQixHQUFBLHNCO0FBcEloQjs7Ozs7QUFLTyxTQUFTLEtBQVQsQ0FBZSxDQUFmLEVBQWtCO0FBQ3ZCLFNBQU8sSUFBSyxNQUFNLE9BQU4sQ0FBYyxDQUFkLElBQW1CLENBQW5CLEdBQXVCLENBQUMsQ0FBRCxDQUE1QixHQUFtQyxFQUExQztBQUNEOztBQUVEOzs7QUFHTyxTQUFTLElBQVQsR0FBZ0IsQ0FBRTs7QUFFekIsSUFBTSxjQUFjLEVBQXBCOztBQUVBOzs7O0FBSU8sU0FBUyxHQUFULEdBQXdCO0FBQUEsTUFBWCxFQUFXLHlEQUFOLElBQU07O0FBQzdCLGNBQVksRUFBWixJQUFrQixZQUFZLEVBQVosS0FBbUIsQ0FBckM7QUFDQSxNQUFNLFFBQVEsWUFBWSxFQUFaLEdBQWQ7QUFDQSxTQUFVLEVBQVYsU0FBZ0IsS0FBaEI7QUFDRDs7QUFFRDs7Ozs7QUFLTyxTQUFTLEtBQVQsQ0FBZSxPQUFmLEVBQXdCO0FBQzdCLE1BQU0sTUFBTSxFQUFaO0FBQ0EsT0FBSyxJQUFJLElBQUksQ0FBUixFQUFXLElBQUksVUFBVSxNQUE5QixFQUFzQyxJQUFJLENBQTFDLEVBQTZDLEdBQTdDLEVBQWtEO0FBQ2hELFFBQU0sU0FBUyxVQUFVLENBQVYsQ0FBZjtBQUNBLFFBQUksQ0FBQyxNQUFELElBQVcsT0FBTyxXQUFQLENBQW1CLElBQW5CLEtBQTRCLFFBQTNDLEVBQXFEO0FBQ25EO0FBQ0E7QUFDRDtBQUNELFNBQUssSUFBTSxHQUFYLElBQWtCLE1BQWxCLEVBQTBCO0FBQ3hCLFVBQU0sS0FBSyxPQUFPLEdBQVAsQ0FBWDtBQUNBLFVBQU0sS0FBSyxJQUFJLEdBQUos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Q0EsU0FBSyxzQkFBTDtBQUNBLFNBQUssd0JBQUw7QUFDQSxTQUFLLHdCQUFMO0FBQ0UsYUFBTyxXQUFQO0FBQ0YsU0FBSyxjQUFMO0FBQ0UsYUFBTyxXQUFQO0FBQ0YsU0FBSyxlQUFMO0FBQ0UsYUFBTyxVQUFVLGlCQUFWLEdBQThCLFVBQXJDO0FBQ0YsU0FBSyxNQUFMO0FBQ0UsYUFBTyxTQUFQO0FBQ0YsU0FBSyxPQUFMO0FBQ0UsYUFBTyxVQUFQO0FBQ0YsU0FBSyxLQUFMO0FBQ0UsYUFBTyxVQUFQO0FBQ0Y7QUFDRSxZQUFNLElBQUksS0FBSixDQUFVLGtDQUFWLENBQU47QUFuQkY7QUFxQkQ7QUFDRCIsImZpbGUiOiJ1dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogV3JhcHMgdGhlIGFyZ3VtZW50IGluIGFuIGFycmF5IGlmIGl0IGlzIG5vdCBvbmUuXG4gKiBAcGFyYW0ge29iamVjdH0gYSAtIFRoZSBvYmplY3QgdG8gd3JhcC5cbiAqIEByZXR1cm4ge0FycmF5fSBhcnJheVxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIHNwbGF0KGEpIHtcbiAgcmV0dXJuIGEgPyAoQXJyYXkuaXNBcnJheShhKSA/IGEgOiBbYV0pIDogW107XG59XG5cbi8qKlxuKiBQcm92aWRlcyBhIHN0YW5kYXJkIG5vb3AgZnVuY3Rpb24uXG4qKi9cbmV4cG9ydCBmdW5jdGlvbiBub29wKCkge31cblxuY29uc3QgdWlkQ291bnRlcnMgPSB7fTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgVUlELlxuICogQHJldHVybiB7bnVtYmVyfSB1aWRcbiAqKi9cbmV4cG9ydCBmdW5jdGlvbiB1aWQoaWQgPSAnaWQnKSB7XG4gIHVpZENvdW50ZXJzW2lkXSA9IHVpZENvdW50ZXJzW2lkXSB8fCAxO1xuICBjb25zdCBjb3VudCA9IHVpZENvdW50ZXJzW2lkXSsrO1xuICByZXR1cm4gYCR7aWR9LSR7Y291bnR9YDtcbn1cblxuLyoqXG4gKiBNZXJnZSBtdWx0aXBsZSBvYmplY3RzIGludG8gb25lLlxuICogQHBhcmFtIHsuLi5vYmplY3R9IG9iamVjdHMgLSBUaGUgb2JqZWN0cyB0byBtZXJnZS5cbiAqIEByZXR1cm4ge29iamVjdH0gb2JqZWN0XG4gKiovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2Uob2JqZWN0cykge1xuICBjb25zdCBtaXggPSB7fTtcbiAgZm9yIChsZXQgaSA9IDAsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY29uc3Qgb2JqZWN0ID0gYXJndW1lbnRzW2ldO1xuICAgIGlmICghb2JqZWN0IHx8IG9iamVjdC5jb25zdHJ1Y3Rvci5uYW1lICE9PSAnT2JqZWN0Jykge1xuICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tY29udGludWUgKi9cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBvYmplY3QpIHtcbiAgICAgIGNvbnN0IG9wID0gb2JqZWN0W2tleV07XG4gICAgICBjb25zdCBtcCA9IG1peFtrZXldO1xuICAgICAgaWYgKG1wICYmIG9wLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdPYmplY3QnICYmXG4gICAgICAgIG1wLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdPYmplY3QnKSB7XG4gICAgICAgIG1peFtrZXldID0gbWVyZ2UobXAsIG9wKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1peFtrZXldID0gZGV0YWNoKG9wKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1peDtcbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiBmb3IgZHVwbGljYXRpbmcgYW4gb2JqZWN0LlxuICogQHBhcmFtIHtvYmplY3R9IGVsZW0gLSBUaGUgb2JqZWN0IHRvIHJlY3Vyc2l2ZWx5IGR1cGxpY2F0ZS5cbiAqIEByZXR1cm4ge29iamVjdH0gb2JqZWN0XG4gKiovXG5mdW5jdGlvbiBkZXRhY2goZWxlbSkge1xuICBjb25zdCB0ID0gZWxlbS5jb25zdHJ1Y3Rvci5uYW1lO1xuICBsZXQgYW5zO1xuICBpZiAodCA9PT0gJ09iamVjdCcpIHtcbiAgICBhbnMgPSB7fTtcbiAgICBmb3IgKGNvbnN0IHAgaW4gZWxlbSkge1xuICAgICAgYW5zW3BdID0gZGV0YWNoKGVsZW1bcF0pO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0ID09PSAnQXJyYXknKSB7XG4gICAgYW5zID0gW107XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBlbGVtLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgYW5zW2ldID0gZGV0YWNoKGVsZW1baV0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBhbnMgPSBlbGVtO1xuICB9XG5cbiAgcmV0dXJuIGFucztcbn1cblxuLy8gVFlQRUQgQVJSQVlTXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBcnJheVR5cGUoYXJyYXkpIHtcbiAgLy8gU29ydGVkIGluIHNvbWUgb3JkZXIgb2YgbGlrZWxpaG9vZCB0byByZWR1Y2UgYW1vdW50IG9mIGNvbXBhcmlzb25zXG4gIGlmIChhcnJheSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgIHJldHVybiBGbG9hdDMyQXJyYXk7XG4gIH0gZWxzZSBpZiAoYXJyYXkgaW5zdGFuY2VvZiBVaW50MTZBcnJheSkge1xuICAgIHJldHVybiBVaW50MTZBcnJheTtcbiAgfSBlbHNlIGlmIChhcnJheSBpbnN0YW5jZW9mIFVpbnQzMkFycmF5KSB7XG4gICAgcmV0dXJuIFVpbnQzMkFycmF5O1xuICB9IGVsc2UgaWYgKGFycmF5IGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgIHJldHVybiBVaW50OEFycmF5O1xuICB9IGVsc2UgaWYgKGFycmF5IGluc3RhbmNlb2YgVWludDhDbGFtcGVkQXJyYXkpIHtcbiAgICByZXR1cm4gVWludDhDbGFtcGVkQXJyYXk7XG4gIH0gZWxzZSBpZiAoYXJyYXkgaW5zdGFuY2VvZiBJbnQ4QXJyYXkpIHtcbiAgICByZXR1cm4gSW50OEFycmF5O1xuICB9IGVsc2UgaWYgKGFycmF5IGluc3RhbmNlb2YgSW50MTZBcnJheSkge1xuICAgIHJldHVybiBJbnQxNkFycmF5O1xuICB9IGVsc2UgaWYgKGFycmF5IGluc3RhbmNlb2YgSW50MzJBcnJheSkge1xuICAgIHJldHVybiBJbnQzMkFycmF5O1xuICB9XG4gIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGRlZHVjZSB0eXBlIGZyb20gYXJyYXknKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEdMVHlwZUZyb21BcnJheVR5cGUoYXJyYXlUeXBlKSB7XG4gIC8vIFNvcnRlZCBpbiBzb21lIG9yZGVyIG9mIGxpa2VsaWhvb2QgdG8gcmVkdWNlIGFtb3VudCBvZiBjb21wYXJpc29uc1xuICBzd2l0Y2ggKGFycmF5VHlwZSkge1xuICBjYXNlIEZsb2F0MzJBcnJheTpcbiAgICByZXR1cm4gJ0ZMT0FUJztcbiAgY2FzZSBVaW50MTZBcnJheTpcbiAgICByZXR1cm4gJ1VOU0lHTkVEX1NIT1JUJztcbiAgY2FzZSBVaW50MzJBcnJheTpcbiAgICByZXR1cm4gJ1VOU0lHTkVEX0lOVCc7XG4gIGNhc2UgVWludDhBcnJheTpcbiAgICByZXR1cm4gJ1VOU0lHTkVEX0JZVEUnO1xuICBjYXNlIFVpbnQ4Q2xhbXBlZEFycmF5OlxuICAgIHJldHVybiAnVU5TSUdORURfQllURSc7XG4gIGNhc2UgSW50OEFycmF5OlxuICAgIHJldHVybiAnQllURSc7XG4gIGNhc2UgSW50MTZBcnJheTpcbiAgICByZXR1cm4gJ1NIT1JUJztcbiAgY2FzZSBJbnQzMkFycmF5OlxuICAgIHJldHVybiAnSU5UJztcbiAgZGVmYXVsdDpcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBkZWR1Y2UgdHlwZSBmcm9tIGFycmF5Jyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRHTFR5cGVGcm9tQXJyYXkoYXJyYXkpIHtcbiAgcmV0dXJuIGdldEdMVHlwZUZyb21BcnJheVR5cGUoZ2V0QXJyYXlUeXBlKGFycmF5KSk7XG59XG5cbi8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHkgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRBcnJheVR5cGVGcm9tR0xUeXBlKGdsVHlwZVN0cmluZywgY2xhbXBlZCA9IGZhbHNlKSB7XG4gIC8vIFNvcnRlZCBpbiBzb21lIG9yZGVyIG9mIGxpa2VsaWhvb2QgdG8gcmVkdWNlIGFtb3VudCBvZiBjb21wYXJpc29uc1xuICBzd2l0Y2ggKGdsVHlwZVN0cmluZykge1xuICBjYXNlICdGTE9BVCc6XG4gICAgcmV0dXJuIEZsb2F0MzJBcnJheTtcbiAgY2FzZSAnVU5TSUdORURfU0hPUlQnOlxuICBjYXNlICdVTlNJR05FRF9TSE9SVF81XzZfNSc6XG4gIGNhc2UgJ1VOU0lHTkVEX1NIT1JUXzRfNF80XzQnOlxuICBjYXNlICdVTlNJR05FRF9TSE9SVF81XzVfNV8xJzpcbiAgICByZXR1cm4gVWludDE2QXJyYXk7XG4gIGNhc2UgJ1VOU0lHTkVEX0lOVCc6XG4gICAgcmV0dXJuIFVpbnQzMkFycmF5O1xuICBjYXNlICdVTlNJR05FRF9CWVRFJzpcbiAgICByZXR1cm4gY2xhbXBlZCA/IFVpbnQ4Q2xhbXBlZEFycmF5IDogVWludDhBcnJheTtcbiAgY2FzZSAnQllURSc6XG4gICAgcmV0dXJuIEludDhBcnJheTtcbiAgY2FzZSAnU0hPUlQnOlxuICAgIHJldHVybiBJbnQxNkFycmF5O1xuICBjYXNlICdJTlQnOlxuICAgIHJldHVybiBJbnQzMkFycmF5O1xuICBkZWZhdWx0OlxuICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGRlZHVjZSB0eXBlIGZyb20gYXJyYXknKTtcbiAgfVxufVxuLyogZXNsaW50LWVuYWJsZSBjb21wbGV4aXR5ICovXG4iXX0=