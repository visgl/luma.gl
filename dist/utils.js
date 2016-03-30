'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.splat = splat;
exports.noop = noop;
exports.uid = uid;
exports.merge = merge;
/* eslint-disable guard-for-in */

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztRQU9nQjtRQU9BO1FBUUE7UUFTQTs7Ozs7Ozs7QUF4QlQsU0FBUyxLQUFULENBQWUsQ0FBZixFQUFrQjtBQUN2QixTQUFPLE1BQU0sT0FBTixDQUFjLENBQWQsS0FBb0IsQ0FBcEIsSUFBeUIsQ0FBQyxDQUFELENBQXpCLENBRGdCO0NBQWxCOzs7OztBQU9BLFNBQVMsSUFBVCxHQUFnQixFQUFoQjs7QUFFUCxJQUFJLE9BQU8sS0FBSyxHQUFMLEVBQVA7Ozs7OztBQU1HLFNBQVMsR0FBVCxHQUFlO0FBQ3BCLFNBQU8sTUFBUCxDQURvQjtDQUFmOzs7Ozs7O0FBU0EsU0FBUyxLQUFULENBQWUsT0FBZixFQUF3QjtBQUM3QixNQUFNLE1BQU0sRUFBTixDQUR1QjtBQUU3QixPQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sSUFBSSxVQUFVLE1BQVYsRUFBa0IsSUFBSSxDQUFKLEVBQU8sR0FBN0MsRUFBa0Q7QUFDaEQsUUFBTSxTQUFTLFVBQVUsQ0FBVixDQUFULENBRDBDO0FBRWhELFFBQUksT0FBTyxXQUFQLENBQW1CLElBQW5CLEtBQTRCLFFBQTVCLEVBQXNDO0FBQ3hDLGVBRHdDO0tBQTFDO0FBR0EsU0FBSyxJQUFJLEdBQUosSUFBVyxNQUFoQixFQUF3QjtBQUN0QixVQUFNLEtBQUssT0FBTyxHQUFQLENBQUwsQ0FEZ0I7QUFFdEIsVUFBTSxLQUFLLElBQUksR0FBSixDQUFMLENBRmdCO0FBR3RCLFVBQUksTUFBTSxHQUFHLFdBQUgsQ0FBZSxJQUFmLEtBQXdCLFFBQXhCLElBQ1IsR0FBRyxXQUFILENBQWUsSUFBZixLQUF3QixRQUF4QixFQUFrQztBQUNsQyxZQUFJLEdBQUosSUFBVyxNQUFNLEVBQU4sRUFBVSxFQUFWLENBQVgsQ0FEa0M7T0FEcEMsTUFHTztBQUNMLFlBQUksR0FBSixJQUFXLE9BQU8sRUFBUCxDQUFYLENBREs7T0FIUDtLQUhGO0dBTEY7QUFnQkEsU0FBTyxHQUFQLENBbEI2QjtDQUF4Qjs7Ozs7OztBQTBCUCxTQUFTLE1BQVQsQ0FBZ0IsSUFBaEIsRUFBc0I7QUFDcEIsTUFBTSxJQUFJLEtBQUssV0FBTCxDQUFpQixJQUFqQixDQURVO0FBRXBCLE1BQUksZUFBSixDQUZvQjtBQUdwQixNQUFJLE1BQU0sUUFBTixFQUFnQjtBQUNsQixVQUFNLEVBQU4sQ0FEa0I7QUFFbEIsU0FBSyxJQUFJLENBQUosSUFBUyxJQUFkLEVBQW9CO0FBQ2xCLFVBQUksQ0FBSixJQUFTLE9BQU8sS0FBSyxDQUFMLENBQVAsQ0FBVCxDQURrQjtLQUFwQjtHQUZGLE1BS08sSUFBSSxNQUFNLE9BQU4sRUFBZTtBQUN4QixVQUFNLEVBQU4sQ0FEd0I7QUFFeEIsU0FBSyxJQUFJLElBQUksQ0FBSixFQUFPLElBQUksS0FBSyxNQUFMLEVBQWEsSUFBSSxDQUFKLEVBQU8sR0FBeEMsRUFBNkM7QUFDM0MsVUFBSSxDQUFKLElBQVMsT0FBTyxLQUFLLENBQUwsQ0FBUCxDQUFULENBRDJDO0tBQTdDO0dBRkssTUFLQTtBQUNMLFVBQU0sSUFBTixDQURLO0dBTEE7O0FBU1AsU0FBTyxHQUFQLENBakJvQjtDQUF0QiIsImZpbGUiOiJ1dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiAqL1xuXG4vKipcbiAqIFdyYXBzIHRoZSBhcmd1bWVudCBpbiBhbiBhcnJheSBpZiBpdCBpcyBub3Qgb25lLlxuICogQHBhcmFtIHtvYmplY3R9IGEgLSBUaGUgb2JqZWN0IHRvIHdyYXAuXG4gKiBAcmV0dXJuIHtBcnJheX0gYXJyYXlcbiAqKi9cbmV4cG9ydCBmdW5jdGlvbiBzcGxhdChhKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGEpICYmIGEgfHwgW2FdO1xufVxuXG4vKipcbiogUHJvdmlkZXMgYSBzdGFuZGFyZCBub29wIGZ1bmN0aW9uLlxuKiovXG5leHBvcnQgZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnZhciBfdWlkID0gRGF0ZS5ub3coKTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgVUlELlxuICogQHJldHVybiB7bnVtYmVyfSB1aWRcbiAqKi9cbmV4cG9ydCBmdW5jdGlvbiB1aWQoKSB7XG4gIHJldHVybiBfdWlkKys7XG59XG5cbi8qKlxuICogTWVyZ2UgbXVsdGlwbGUgb2JqZWN0cyBpbnRvIG9uZS5cbiAqIEBwYXJhbSB7Li4ub2JqZWN0fSBvYmplY3RzIC0gVGhlIG9iamVjdHMgdG8gbWVyZ2UuXG4gKiBAcmV0dXJuIHtvYmplY3R9IG9iamVjdFxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlKG9iamVjdHMpIHtcbiAgY29uc3QgbWl4ID0ge307XG4gIGZvciAobGV0IGkgPSAwLCBsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGNvbnN0IG9iamVjdCA9IGFyZ3VtZW50c1tpXTtcbiAgICBpZiAob2JqZWN0LmNvbnN0cnVjdG9yLm5hbWUgIT09ICdPYmplY3QnKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgICAgY29uc3Qgb3AgPSBvYmplY3Rba2V5XTtcbiAgICAgIGNvbnN0IG1wID0gbWl4W2tleV07XG4gICAgICBpZiAobXAgJiYgb3AuY29uc3RydWN0b3IubmFtZSA9PT0gJ09iamVjdCcgJiZcbiAgICAgICAgbXAuY29uc3RydWN0b3IubmFtZSA9PT0gJ09iamVjdCcpIHtcbiAgICAgICAgbWl4W2tleV0gPSBtZXJnZShtcCwgb3ApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWl4W2tleV0gPSBkZXRhY2gob3ApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWl4O1xufVxuXG4vKipcbiAqIEludGVybmFsIGZ1bmN0aW9uIGZvciBkdXBsaWNhdGluZyBhbiBvYmplY3QuXG4gKiBAcGFyYW0ge29iamVjdH0gZWxlbSAtIFRoZSBvYmplY3QgdG8gcmVjdXJzaXZlbHkgZHVwbGljYXRlLlxuICogQHJldHVybiB7b2JqZWN0fSBvYmplY3RcbiAqKi9cbmZ1bmN0aW9uIGRldGFjaChlbGVtKSB7XG4gIGNvbnN0IHQgPSBlbGVtLmNvbnN0cnVjdG9yLm5hbWU7XG4gIGxldCBhbnM7XG4gIGlmICh0ID09PSAnT2JqZWN0Jykge1xuICAgIGFucyA9IHt9O1xuICAgIGZvciAodmFyIHAgaW4gZWxlbSkge1xuICAgICAgYW5zW3BdID0gZGV0YWNoKGVsZW1bcF0pO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0ID09PSAnQXJyYXknKSB7XG4gICAgYW5zID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBlbGVtLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgYW5zW2ldID0gZGV0YWNoKGVsZW1baV0pO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBhbnMgPSBlbGVtO1xuICB9XG5cbiAgcmV0dXJuIGFucztcbn1cbiJdfQ==