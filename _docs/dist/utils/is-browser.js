'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

// This function is needed in initialization stages,
// make sure it can be imported in isolation
/* global process */
function isBrowser() {
  var isNode = (typeof process === 'undefined' ? 'undefined' : _typeof(process)) === 'object' && String(process) === '[object process]' && !process.browser;
  return !isNode;
};

function getGlobal() {
  return isBrowser() ? window : global;
}

module.exports = {
  isBrowser: isBrowser,
  getGlobal: getGlobal
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9pcy1icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFHQSxTQUFTLFNBQVQsR0FBcUI7QUFDbkIsTUFBTSxTQUNKLFFBQU8sT0FBUCx5Q0FBTyxPQUFQLE9BQW1CLFFBQW5CLElBQ0EsT0FBTyxPQUFQLE1BQW9CLGtCQURwQixJQUVBLENBQUMsUUFBUSxPQUhYO0FBSUEsU0FBTyxDQUFDLE1BQVI7QUFDRDs7QUFFRCxTQUFTLFNBQVQsR0FBcUI7QUFDbkIsU0FBTyxjQUFjLE1BQWQsR0FBdUIsTUFBOUI7QUFDRDs7QUFFRCxPQUFPLE9BQVAsR0FBaUI7QUFDZixhQUFXLFNBREk7QUFFZixhQUFXO0FBRkksQ0FBakIiLCJmaWxlIjoiaXMtYnJvd3Nlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFRoaXMgZnVuY3Rpb24gaXMgbmVlZGVkIGluIGluaXRpYWxpemF0aW9uIHN0YWdlcyxcbi8vIG1ha2Ugc3VyZSBpdCBjYW4gYmUgaW1wb3J0ZWQgaW4gaXNvbGF0aW9uXG4vKiBnbG9iYWwgcHJvY2VzcyAqL1xuZnVuY3Rpb24gaXNCcm93c2VyKCkge1xuICBjb25zdCBpc05vZGUgPVxuICAgIHR5cGVvZiBwcm9jZXNzID09PSAnb2JqZWN0JyAmJlxuICAgIFN0cmluZyhwcm9jZXNzKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nICYmXG4gICAgIXByb2Nlc3MuYnJvd3NlcjtcbiAgcmV0dXJuICFpc05vZGU7XG59O1xuXG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gIHJldHVybiBpc0Jyb3dzZXIoKSA/IHdpbmRvdyA6IGdsb2JhbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGlzQnJvd3NlcjogaXNCcm93c2VyLFxuICBnZXRHbG9iYWw6IGdldEdsb2JhbFxufTtcbiJdfQ==