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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztRQUtnQixLLEdBQUEsSztRQU9BLEksR0FBQSxJO1FBUUEsRyxHQUFBLEc7UUFXQSxLLEdBQUEsSztRQWlEQSxZLEdBQUEsWTtRQXNCQSxzQixHQUFBLHNCO1FBeUJBLGtCLEdBQUEsa0I7UUFLQSxzQixHQUFBLHNCOzs7Ozs7QUEvSFQsU0FBUyxLQUFULENBQWUsQ0FBZixFQUFrQjtBQUN2QixTQUFPLElBQUssTUFBTSxPQUFOLENBQWMsQ0FBZCxJQUFtQixDQUFuQixHQUF1QixDQUFDLENBQUQsQ0FBNUIsR0FBbUMsRUFBMUM7QUFDRDs7Ozs7QUFLTSxTQUFTLElBQVQsR0FBZ0IsQ0FBRTs7QUFFekIsSUFBTSxjQUFjLEVBQXBCOzs7Ozs7QUFNTyxTQUFTLEdBQVQsR0FBd0I7QUFBQSxNQUFYLEVBQVcseURBQU4sSUFBTTs7QUFDN0IsY0FBWSxFQUFaLElBQWtCLFlBQVksRUFBWixLQUFtQixDQUFyQztBQUNBLE1BQU0sUUFBUSxZQUFZLEVBQVosR0FBZDtBQUNBLFNBQVUsRUFBVixTQUFnQixLQUFoQjtBQUNEOzs7Ozs7O0FBT00sU0FBUyxLQUFULENBQWUsT0FBZixFQUF3QjtBQUM3QixNQUFNLE1BQU0sRUFBWjtBQUNBLE9BQUssSUFBSSxJQUFJLENBQVIsRUFBVyxJQUFJLFVBQVUsTUFBOUIsRUFBc0MsSUFBSSxDQUExQyxFQUE2QyxHQUE3QyxFQUFrRDtBQUNoRCxRQUFNLFNBQVMsVUFBVSxDQUFWLENBQWY7QUFDQSxRQUFJLENBQUMsTUFBRCxJQUFXLE9BQU8sV0FBUCxDQUFtQixJQUFuQixLQUE0QixRQUEzQyxFQUFxRDs7QUFFbkQ7QUFDRDtBQUNELFNBQUssSUFBTSxHQUFYLElBQWtCLE1BQWxCLEVBQTBCO0FBQ3hCLFVBQU0sS0FBSyxPQUFPLEdBQVAsQ0FBWDtBQUNBLFVBQU0sS0FBSyxJQUFJLEdBQUosQ0FBWDtBQUNBLFVBQUksTUFBTSxH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O0FBQ0UsYUFBTyxXQUFQO0FBQ0YsU0FBSyxjQUFMO0FBQ0UsYUFBTyxXQUFQO0FBQ0YsU0FBSyxlQUFMO0FBQ0UsYUFBTyxVQUFVLGlCQUFWLEdBQThCLFVBQXJDO0FBQ0YsU0FBSyxNQUFMO0FBQ0UsYUFBTyxTQUFQO0FBQ0YsU0FBSyxPQUFMO0FBQ0UsYUFBTyxVQUFQO0FBQ0YsU0FBSyxLQUFMO0FBQ0UsYUFBTyxVQUFQO0FBQ0Y7QUFDRSxZQUFNLElBQUksS0FBSixDQUFVLGtDQUFWLENBQU47QUFuQkY7QUFxQkQiLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFdyYXBzIHRoZSBhcmd1bWVudCBpbiBhbiBhcnJheSBpZiBpdCBpcyBub3Qgb25lLlxuICogQHBhcmFtIHtvYmplY3R9IGEgLSBUaGUgb2JqZWN0IHRvIHdyYXAuXG4gKiBAcmV0dXJuIHtBcnJheX0gYXJyYXlcbiAqKi9cbmV4cG9ydCBmdW5jdGlvbiBzcGxhdChhKSB7XG4gIHJldHVybiBhID8gKEFycmF5LmlzQXJyYXkoYSkgPyBhIDogW2FdKSA6IFtdO1xufVxuXG4vKipcbiogUHJvdmlkZXMgYSBzdGFuZGFyZCBub29wIGZ1bmN0aW9uLlxuKiovXG5leHBvcnQgZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmNvbnN0IHVpZENvdW50ZXJzID0ge307XG5cbi8qKlxuICogUmV0dXJucyBhIFVJRC5cbiAqIEByZXR1cm4ge251bWJlcn0gdWlkXG4gKiovXG5leHBvcnQgZnVuY3Rpb24gdWlkKGlkID0gJ2lkJykge1xuICB1aWRDb3VudGVyc1tpZF0gPSB1aWRDb3VudGVyc1tpZF0gfHwgMTtcbiAgY29uc3QgY291bnQgPSB1aWRDb3VudGVyc1tpZF0rKztcbiAgcmV0dXJuIGAke2lkfS0ke2NvdW50fWA7XG59XG5cbi8qKlxuICogTWVyZ2UgbXVsdGlwbGUgb2JqZWN0cyBpbnRvIG9uZS5cbiAqIEBwYXJhbSB7Li4ub2JqZWN0fSBvYmplY3RzIC0gVGhlIG9iamVjdHMgdG8gbWVyZ2UuXG4gKiBAcmV0dXJuIHtvYmplY3R9IG9iamVjdFxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlKG9iamVjdHMpIHtcbiAgY29uc3QgbWl4ID0ge307XG4gIGZvciAobGV0IGkgPSAwLCBsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IG9iamVjdCA9IGFyZ3VtZW50c1tpXTtcbiAgICBpZiAoIW9iamVjdCB8fCBvYmplY3QuY29uc3RydWN0b3IubmFtZSAhPT0gJ09iamVjdCcpIHtcbiAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnRpbnVlICovXG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICBjb25zdCBvcCA9IG9iamVjdFtrZXldO1xuICAgICAgY29uc3QgbXAgPSBtaXhba2V5XTtcbiAgICAgIGlmIChtcCAmJiBvcC5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0JyAmJlxuICAgICAgICBtcC5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0Jykge1xuICAgICAgICBtaXhba2V5XSA9IG1lcmdlKG1wLCBvcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtaXhba2V5XSA9IGRldGFjaChvcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtaXg7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGR1cGxpY2F0aW5nIGFuIG9iamVjdC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBlbGVtIC0gVGhlIG9iamVjdCB0byByZWN1cnNpdmVseSBkdXBsaWNhdGUuXG4gKiBAcmV0dXJuIHtvYmplY3R9IG9iamVjdFxuICoqL1xuZnVuY3Rpb24gZGV0YWNoKGVsZW0pIHtcbiAgY29uc3QgdCA9IGVsZW0uY29uc3RydWN0b3IubmFtZTtcbiAgbGV0IGFucztcbiAgaWYgKHQgPT09ICdPYmplY3QnKSB7XG4gICAgYW5zID0ge307XG4gICAgZm9yIChjb25zdCBwIGluIGVsZW0pIHtcbiAgICAgIGFuc1twXSA9IGRldGFjaChlbGVtW3BdKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodCA9PT0gJ0FycmF5Jykge1xuICAgIGFucyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwLCBsID0gZWxlbS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGFuc1tpXSA9IGRldGFjaChlbGVtW2ldKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgYW5zID0gZWxlbTtcbiAgfVxuXG4gIHJldHVybiBhbnM7XG59XG5cbi8vIFRZUEVEIEFSUkFZU1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXJyYXlUeXBlKGFycmF5KSB7XG4gIC8vIFNvcnRlZCBpbiBzb21lIG9yZGVyIG9mIGxpa2VsaWhvb2QgdG8gcmVkdWNlIGFtb3VudCBvZiBjb21wYXJpc29uc1xuICBpZiAoYXJyYXkgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICByZXR1cm4gRmxvYXQzMkFycmF5O1xuICB9IGVsc2UgaWYgKGFycmF5IGluc3RhbmNlb2YgVWludDE2QXJyYXkpIHtcbiAgICByZXR1cm4gVWludDE2QXJyYXk7XG4gIH0gZWxzZSBpZiAoYXJyYXkgaW5zdGFuY2VvZiBVaW50MzJBcnJheSkge1xuICAgIHJldHVybiBVaW50MzJBcnJheTtcbiAgfSBlbHNlIGlmIChhcnJheSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpIHtcbiAgICByZXR1cm4gVWludDhBcnJheTtcbiAgfSBlbHNlIGlmIChhcnJheSBpbnN0YW5jZW9mIFVpbnQ4Q2xhbXBlZEFycmF5KSB7XG4gICAgcmV0dXJuIFVpbnQ4Q2xhbXBlZEFycmF5O1xuICB9IGVsc2UgaWYgKGFycmF5IGluc3RhbmNlb2YgSW50OEFycmF5KSB7XG4gICAgcmV0dXJuIEludDhBcnJheTtcbiAgfSBlbHNlIGlmIChhcnJheSBpbnN0YW5jZW9mIEludDE2QXJyYXkpIHtcbiAgICByZXR1cm4gSW50MTZBcnJheTtcbiAgfSBlbHNlIGlmIChhcnJheSBpbnN0YW5jZW9mIEludDMyQXJyYXkpIHtcbiAgICByZXR1cm4gSW50MzJBcnJheTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBkZWR1Y2UgdHlwZSBmcm9tIGFycmF5Jyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRHTFR5cGVGcm9tQXJyYXlUeXBlKGFycmF5VHlwZSkge1xuICAvLyBTb3J0ZWQgaW4gc29tZSBvcmRlciBvZiBsaWtlbGlob29kIHRvIHJlZHVjZSBhbW91bnQgb2YgY29tcGFyaXNvbnNcbiAgc3dpdGNoIChhcnJheVR5cGUpIHtcbiAgY2FzZSBGbG9hdDMyQXJyYXk6XG4gICAgcmV0dXJuICdGTE9BVCc7XG4gIGNhc2UgVWludDE2QXJyYXk6XG4gICAgcmV0dXJuICdVTlNJR05FRF9TSE9SVCc7XG4gIGNhc2UgVWludDMyQXJyYXk6XG4gICAgcmV0dXJuICdVTlNJR05FRF9JTlQnO1xuICBjYXNlIFVpbnQ4QXJyYXk6XG4gICAgcmV0dXJuICdVTlNJR05FRF9CWVRFJztcbiAgY2FzZSBVaW50OENsYW1wZWRBcnJheTpcbiAgICByZXR1cm4gJ1VOU0lHTkVEX0JZVEUnO1xuICBjYXNlIEludDhBcnJheTpcbiAgICByZXR1cm4gJ0JZVEUnO1xuICBjYXNlIEludDE2QXJyYXk6XG4gICAgcmV0dXJuICdTSE9SVCc7XG4gIGNhc2UgSW50MzJBcnJheTpcbiAgICByZXR1cm4gJ0lOVCc7XG4gIGRlZmF1bHQ6XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gZGVkdWNlIHR5cGUgZnJvbSBhcnJheScpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0R0xUeXBlRnJvbUFycmF5KGFycmF5KSB7XG4gIHJldHVybiBnZXRHTFR5cGVGcm9tQXJyYXlUeXBlKGdldEFycmF5VHlwZShhcnJheSkpO1xufVxuXG4vKiBlc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5ICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXJyYXlUeXBlRnJvbUdMVHlwZShnbFR5cGVTdHJpbmcsIGNsYW1wZWQgPSBmYWxzZSkge1xuICAvLyBTb3J0ZWQgaW4gc29tZSBvcmRlciBvZiBsaWtlbGlob29kIHRvIHJlZHVjZSBhbW91bnQgb2YgY29tcGFyaXNvbnNcbiAgc3dpdGNoIChnbFR5cGVTdHJpbmcpIHtcbiAgY2FzZSAnRkxPQVQnOlxuICAgIHJldHVybiBGbG9hdDMyQXJyYXk7XG4gIGNhc2UgJ1VOU0lHTkVEX1NIT1JUJzpcbiAgY2FzZSAnVU5TSUdORURfU0hPUlRfNV82XzUnOlxuICBjYXNlICdVTlNJR05FRF9TSE9SVF80XzRfNF80JzpcbiAgY2FzZSAnVU5TSUdORURfU0hPUlRfNV81XzVfMSc6XG4gICAgcmV0dXJuIFVpbnQxNkFycmF5O1xuICBjYXNlICdVTlNJR05FRF9JTlQnOlxuICAgIHJldHVybiBVaW50MzJBcnJheTtcbiAgY2FzZSAnVU5TSUdORURfQllURSc6XG4gICAgcmV0dXJuIGNsYW1wZWQgPyBVaW50OENsYW1wZWRBcnJheSA6IFVpbnQ4QXJyYXk7XG4gIGNhc2UgJ0JZVEUnOlxuICAgIHJldHVybiBJbnQ4QXJyYXk7XG4gIGNhc2UgJ1NIT1JUJzpcbiAgICByZXR1cm4gSW50MTZBcnJheTtcbiAgY2FzZSAnSU5UJzpcbiAgICByZXR1cm4gSW50MzJBcnJheTtcbiAgZGVmYXVsdDpcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBkZWR1Y2UgdHlwZSBmcm9tIGFycmF5Jyk7XG4gIH1cbn1cbi8qIGVzbGludC1lbmFibGUgY29tcGxleGl0eSAqL1xuIl19