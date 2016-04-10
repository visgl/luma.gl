'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.splat = splat;
exports.noop = noop;
exports.uid = uid;
exports.merge = merge;
exports.isTypedArray = isTypedArray;
exports.makeTypedArray = makeTypedArray;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Wraps the argument in an array if it is not one.
 * @param {object} a - The object to wrap.
 * @return {Array} array
 **/
function splat(a) {
  return Array.isArray(a) && a || [a];
}

/**
* Provides a standard noop function.
**/
/* eslint-disable guard-for-in */
function noop() {}

var _uid = Date.now();

/**
 * Returns a UID.
 * @return {number} uid
 **/
function uid() {
  return _uid++;
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
    if (object.constructor.name !== 'Object') {
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

function isTypedArray(value) {
  return value.BYTES_PER_ELEMENT;
}

function makeTypedArray(ArrayType, sourceArray) {
  (0, _assert2.default)(Array.isArray(sourceArray));
  var array = new ArrayType(sourceArray.length);
  for (var i = 0; i < sourceArray.length; ++i) {
    array[i] = sourceArray[i];
  }
  return array;
}
//# sourceMappingURL=data:application/json;base64,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ZmlsZSI6InV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluICovXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbi8qKlxuICogV3JhcHMgdGhlIGFyZ3VtZW50IGluIGFuIGFycmF5IGlmIGl0IGlzIG5vdCBvbmUuXG4gKiBAcGFyYW0ge29iamVjdH0gYSAtIFRoZSBvYmplY3QgdG8gd3JhcC5cbiAqIEByZXR1cm4ge0FycmF5fSBhcnJheVxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIHNwbGF0KGEpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYSkgJiYgYSB8fCBbYV07XG59XG5cbi8qKlxuKiBQcm92aWRlcyBhIHN0YW5kYXJkIG5vb3AgZnVuY3Rpb24uXG4qKi9cbmV4cG9ydCBmdW5jdGlvbiBub29wKCkge31cblxudmFyIF91aWQgPSBEYXRlLm5vdygpO1xuXG4vKipcbiAqIFJldHVybnMgYSBVSUQuXG4gKiBAcmV0dXJuIHtudW1iZXJ9IHVpZFxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIHVpZCgpIHtcbiAgcmV0dXJuIF91aWQrKztcbn1cblxuLyoqXG4gKiBNZXJnZSBtdWx0aXBsZSBvYmplY3RzIGludG8gb25lLlxuICogQHBhcmFtIHsuLi5vYmplY3R9IG9iamVjdHMgLSBUaGUgb2JqZWN0cyB0byBtZXJnZS5cbiAqIEByZXR1cm4ge29iamVjdH0gb2JqZWN0XG4gKiovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2Uob2JqZWN0cykge1xuICBjb25zdCBtaXggPSB7fTtcbiAgZm9yIChsZXQgaSA9IDAsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY29uc3Qgb2JqZWN0ID0gYXJndW1lbnRzW2ldO1xuICAgIGlmIChvYmplY3QuY29uc3RydWN0b3IubmFtZSAhPT0gJ09iamVjdCcpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICBjb25zdCBvcCA9IG9iamVjdFtrZXldO1xuICAgICAgY29uc3QgbXAgPSBtaXhba2V5XTtcbiAgICAgIGlmIChtcCAmJiBvcC5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0JyAmJlxuICAgICAgICBtcC5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0Jykge1xuICAgICAgICBtaXhba2V5XSA9IG1lcmdlKG1wLCBvcCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtaXhba2V5XSA9IGRldGFjaChvcCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtaXg7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gZm9yIGR1cGxpY2F0aW5nIGFuIG9iamVjdC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBlbGVtIC0gVGhlIG9iamVjdCB0byByZWN1cnNpdmVseSBkdXBsaWNhdGUuXG4gKiBAcmV0dXJuIHtvYmplY3R9IG9iamVjdFxuICoqL1xuZnVuY3Rpb24gZGV0YWNoKGVsZW0pIHtcbiAgY29uc3QgdCA9IGVsZW0uY29uc3RydWN0b3IubmFtZTtcbiAgbGV0IGFucztcbiAgaWYgKHQgPT09ICdPYmplY3QnKSB7XG4gICAgYW5zID0ge307XG4gICAgZm9yICh2YXIgcCBpbiBlbGVtKSB7XG4gICAgICBhbnNbcF0gPSBkZXRhY2goZWxlbVtwXSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHQgPT09ICdBcnJheScpIHtcbiAgICBhbnMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGVsZW0ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBhbnNbaV0gPSBkZXRhY2goZWxlbVtpXSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGFucyA9IGVsZW07XG4gIH1cblxuICByZXR1cm4gYW5zO1xufVxuXG4vLyBUWVBFRCBBUlJBWVNcblxuZXhwb3J0IGZ1bmN0aW9uIGlzVHlwZWRBcnJheSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUuQllURVNfUEVSX0VMRU1FTlQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWtlVHlwZWRBcnJheShBcnJheVR5cGUsIHNvdXJjZUFycmF5KSB7XG4gIGFzc2VydChBcnJheS5pc0FycmF5KHNvdXJjZUFycmF5KSk7XG4gIGNvbnN0IGFycmF5ID0gbmV3IEFycmF5VHlwZShzb3VyY2VBcnJheS5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNvdXJjZUFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgYXJyYXlbaV0gPSBzb3VyY2VBcnJheVtpXTtcbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG4iXX0=