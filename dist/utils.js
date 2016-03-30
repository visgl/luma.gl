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
  var ans = undefined;
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
//# sourceMappingURL=data:application/json;base64,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OiJ1dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiAqL1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vKipcbiAqIFdyYXBzIHRoZSBhcmd1bWVudCBpbiBhbiBhcnJheSBpZiBpdCBpcyBub3Qgb25lLlxuICogQHBhcmFtIHtvYmplY3R9IGEgLSBUaGUgb2JqZWN0IHRvIHdyYXAuXG4gKiBAcmV0dXJuIHtBcnJheX0gYXJyYXlcbiAqKi9cbmV4cG9ydCBmdW5jdGlvbiBzcGxhdChhKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGEpICYmIGEgfHwgW2FdO1xufVxuXG4vKipcbiogUHJvdmlkZXMgYSBzdGFuZGFyZCBub29wIGZ1bmN0aW9uLlxuKiovXG5leHBvcnQgZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnZhciBfdWlkID0gRGF0ZS5ub3coKTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgVUlELlxuICogQHJldHVybiB7bnVtYmVyfSB1aWRcbiAqKi9cbmV4cG9ydCBmdW5jdGlvbiB1aWQoKSB7XG4gIHJldHVybiBfdWlkKys7XG59XG5cbi8qKlxuICogTWVyZ2UgbXVsdGlwbGUgb2JqZWN0cyBpbnRvIG9uZS5cbiAqIEBwYXJhbSB7Li4ub2JqZWN0fSBvYmplY3RzIC0gVGhlIG9iamVjdHMgdG8gbWVyZ2UuXG4gKiBAcmV0dXJuIHtvYmplY3R9IG9iamVjdFxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlKG9iamVjdHMpIHtcbiAgY29uc3QgbWl4ID0ge307XG4gIGZvciAobGV0IGkgPSAwLCBsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IG9iamVjdCA9IGFyZ3VtZW50c1tpXTtcbiAgICBpZiAob2JqZWN0LmNvbnN0cnVjdG9yLm5hbWUgIT09ICdPYmplY3QnKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgICAgY29uc3Qgb3AgPSBvYmplY3Rba2V5XTtcbiAgICAgIGNvbnN0IG1wID0gbWl4W2tleV07XG4gICAgICBpZiAobXAgJiYgb3AuY29uc3RydWN0b3IubmFtZSA9PT0gJ09iamVjdCcgJiZcbiAgICAgICAgbXAuY29uc3RydWN0b3IubmFtZSA9PT0gJ09iamVjdCcpIHtcbiAgICAgICAgbWl4W2tleV0gPSBtZXJnZShtcCwgb3ApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWl4W2tleV0gPSBkZXRhY2gob3ApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWl4O1xufVxuXG4vKipcbiAqIEludGVybmFsIGZ1bmN0aW9uIGZvciBkdXBsaWNhdGluZyBhbiBvYmplY3QuXG4gKiBAcGFyYW0ge29iamVjdH0gZWxlbSAtIFRoZSBvYmplY3QgdG8gcmVjdXJzaXZlbHkgZHVwbGljYXRlLlxuICogQHJldHVybiB7b2JqZWN0fSBvYmplY3RcbiAqKi9cbmZ1bmN0aW9uIGRldGFjaChlbGVtKSB7XG4gIGNvbnN0IHQgPSBlbGVtLmNvbnN0cnVjdG9yLm5hbWU7XG4gIGxldCBhbnM7XG4gIGlmICh0ID09PSAnT2JqZWN0Jykge1xuICAgIGFucyA9IHt9O1xuICAgIGZvciAodmFyIHAgaW4gZWxlbSkge1xuICAgICAgYW5zW3BdID0gZGV0YWNoKGVsZW1bcF0pO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0ID09PSAnQXJyYXknKSB7XG4gICAgYW5zID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBlbGVtLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgYW5zW2ldID0gZGV0YWNoKGVsZW1baV0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBhbnMgPSBlbGVtO1xuICB9XG5cbiAgcmV0dXJuIGFucztcbn1cblxuLy8gVFlQRUQgQVJSQVlTXG5cbmV4cG9ydCBmdW5jdGlvbiBpc1R5cGVkQXJyYXkodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlLkJZVEVTX1BFUl9FTEVNRU5UO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZVR5cGVkQXJyYXkoQXJyYXlUeXBlLCBzb3VyY2VBcnJheSkge1xuICBhc3NlcnQoQXJyYXkuaXNBcnJheShzb3VyY2VBcnJheSkpO1xuICBjb25zdCBhcnJheSA9IG5ldyBBcnJheVR5cGUoc291cmNlQXJyYXkubGVuZ3RoKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3VyY2VBcnJheS5sZW5ndGg7ICsraSkge1xuICAgIGFycmF5W2ldID0gc291cmNlQXJyYXlbaV07XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuIl19