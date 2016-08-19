'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

// This function is needed in initialization stages,
// make sure it can be imported in isolation
/* global process */
function isBrowser() {
  var isNode = (typeof process === 'undefined' ? 'undefined' : _typeof(process)) === 'object' && String(process) === '[object process]' && !process.browser;
  return !isNode;
};

var glob = isBrowser() ? window : global;

// Export lumagl symbols as luma, lumagl and LumaGL on global context
if (glob.lumagl) {
  throw new Error('lumagl multiple copies detected');
}
glob.lumagl = {};
glob.luma = glob.lumagl;
glob.LumaGL = glob.lumagl;

// Keep luma globals in a globals sub-object
glob.lumagl.globals = {
  headlessGL: null,
  headlessTypes: null,
  modules: {},
  nodeIO: {}
};

module.exports = {
  isBrowser: isBrowser,
  global: glob,
  lumagl: glob.lumagl,
  lumaGlobals: glob.lumagl.globals
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9pcy1icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQSxTQUFTLFNBQVQsR0FBcUI7QUFDbkIsTUFBTSxTQUNKLFFBQU8sT0FBUCx5Q0FBTyxPQUFQLE9BQW1CLFFBQW5CLElBQ0EsT0FBTyxPQUFQLE1BQW9CLGtCQURwQixJQUVBLENBQUMsUUFBUSxPQUhYO0FBSUEsU0FBTyxDQUFDLE1BQVI7QUFDRDs7QUFFRCxJQUFNLE9BQU8sY0FBYyxNQUFkLEdBQXVCLE1BQXBDOztBQUVBO0FBQ0EsSUFBSSxLQUFLLE1BQVQsRUFBaUI7QUFDZixRQUFNLElBQUksS0FBSixDQUFVLGlDQUFWLENBQU47QUFDRDtBQUNELEtBQUssTUFBTCxHQUFjLEVBQWQ7QUFDQSxLQUFLLElBQUwsR0FBWSxLQUFLLE1BQWpCO0FBQ0EsS0FBSyxNQUFMLEdBQWMsS0FBSyxNQUFuQjs7QUFFQTtBQUNBLEtBQUssTUFBTCxDQUFZLE9BQVosR0FBc0I7QUFDcEIsY0FBWSxJQURRO0FBRXBCLGlCQUFlLElBRks7QUFHcEIsV0FBUyxFQUhXO0FBSXBCLFVBQVE7QUFKWSxDQUF0Qjs7QUFPQSxPQUFPLE9BQVAsR0FBaUI7QUFDZixzQkFEZTtBQUVmLFVBQVEsSUFGTztBQUdmLFVBQVEsS0FBSyxNQUhFO0FBSWYsZUFBYSxLQUFLLE1BQUwsQ0FBWTtBQUpWLENBQWpCIiwiZmlsZSI6ImlzLWJyb3dzZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUaGlzIGZ1bmN0aW9uIGlzIG5lZWRlZCBpbiBpbml0aWFsaXphdGlvbiBzdGFnZXMsXG4vLyBtYWtlIHN1cmUgaXQgY2FuIGJlIGltcG9ydGVkIGluIGlzb2xhdGlvblxuLyogZ2xvYmFsIHByb2Nlc3MgKi9cbmZ1bmN0aW9uIGlzQnJvd3NlcigpIHtcbiAgY29uc3QgaXNOb2RlID1cbiAgICB0eXBlb2YgcHJvY2VzcyA9PT0gJ29iamVjdCcgJiZcbiAgICBTdHJpbmcocHJvY2VzcykgPT09ICdbb2JqZWN0IHByb2Nlc3NdJyAmJlxuICAgICFwcm9jZXNzLmJyb3dzZXI7XG4gIHJldHVybiAhaXNOb2RlO1xufTtcblxuY29uc3QgZ2xvYiA9IGlzQnJvd3NlcigpID8gd2luZG93IDogZ2xvYmFsO1xuXG4vLyBFeHBvcnQgbHVtYWdsIHN5bWJvbHMgYXMgbHVtYSwgbHVtYWdsIGFuZCBMdW1hR0wgb24gZ2xvYmFsIGNvbnRleHRcbmlmIChnbG9iLmx1bWFnbCkge1xuICB0aHJvdyBuZXcgRXJyb3IoJ2x1bWFnbCBtdWx0aXBsZSBjb3BpZXMgZGV0ZWN0ZWQnKTtcbn1cbmdsb2IubHVtYWdsID0ge307XG5nbG9iLmx1bWEgPSBnbG9iLmx1bWFnbDtcbmdsb2IuTHVtYUdMID0gZ2xvYi5sdW1hZ2w7XG5cbi8vIEtlZXAgbHVtYSBnbG9iYWxzIGluIGEgZ2xvYmFscyBzdWItb2JqZWN0XG5nbG9iLmx1bWFnbC5nbG9iYWxzID0ge1xuICBoZWFkbGVzc0dMOiBudWxsLFxuICBoZWFkbGVzc1R5cGVzOiBudWxsLFxuICBtb2R1bGVzOiB7fSxcbiAgbm9kZUlPOiB7fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGlzQnJvd3NlcixcbiAgZ2xvYmFsOiBnbG9iLFxuICBsdW1hZ2w6IGdsb2IubHVtYWdsLFxuICBsdW1hR2xvYmFsczogZ2xvYi5sdW1hZ2wuZ2xvYmFsc1xufTtcbiJdfQ==