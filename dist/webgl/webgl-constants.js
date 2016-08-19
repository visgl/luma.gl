'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _glConstants = require('gl-constants');

var _glConstants2 = _interopRequireDefault(_glConstants);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Extracts constants from WebGL prototype
function getWebGLConstants() {
  var constants = {};
  var WebGLContext = glob.WebGL2RenderingContext || WebGLRenderingContext;
  for (var key in WebGLContext.prototype) {
    if (typeof WebGLContext[key] !== 'function') {
      constants[key] = WebGLContext[key];
    }
  }
  Object.freeze(constants);
  return constants;
}

// const GL = getWebGLConstants();

// WEBGL BUILT-IN TYPES
exports.default = _glConstants2.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC93ZWJnbC1jb25zdGFudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0E7Ozs7OztBQUVBO0FBQ0EsU0FBUyxpQkFBVCxHQUE2QjtBQUMzQixNQUFNLFlBQVksRUFBbEI7QUFDQSxNQUFNLGVBQ0osS0FBSyxzQkFBTCxJQUErQixxQkFEakM7QUFFQSxPQUFLLElBQU0sR0FBWCxJQUFrQixhQUFhLFNBQS9CLEVBQTBDO0FBQ3hDLFFBQUksT0FBTyxhQUFhLEdBQWIsQ0FBUCxLQUE2QixVQUFqQyxFQUE2QztBQUMzQyxnQkFBVSxHQUFWLElBQWlCLGFBQWEsR0FBYixDQUFqQjtBQUNEO0FBQ0Y7QUFDRCxTQUFPLE1BQVAsQ0FBYyxTQUFkO0FBQ0EsU0FBTyxTQUFQO0FBQ0Q7O0FBRUQ7O0FBakJBIiwiZmlsZSI6IndlYmdsLWNvbnN0YW50cy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFdFQkdMIEJVSUxULUlOIFRZUEVTXG5pbXBvcnQgR0wgZnJvbSAnZ2wtY29uc3RhbnRzJztcblxuLy8gRXh0cmFjdHMgY29uc3RhbnRzIGZyb20gV2ViR0wgcHJvdG90eXBlXG5mdW5jdGlvbiBnZXRXZWJHTENvbnN0YW50cygpIHtcbiAgY29uc3QgY29uc3RhbnRzID0ge307XG4gIGNvbnN0IFdlYkdMQ29udGV4dCA9XG4gICAgZ2xvYi5XZWJHTDJSZW5kZXJpbmdDb250ZXh0IHx8IFdlYkdMUmVuZGVyaW5nQ29udGV4dDtcbiAgZm9yIChjb25zdCBrZXkgaW4gV2ViR0xDb250ZXh0LnByb3RvdHlwZSkge1xuICAgIGlmICh0eXBlb2YgV2ViR0xDb250ZXh0W2tleV0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnN0YW50c1trZXldID0gV2ViR0xDb250ZXh0W2tleV07XG4gICAgfVxuICB9XG4gIE9iamVjdC5mcmVlemUoY29uc3RhbnRzKTtcbiAgcmV0dXJuIGNvbnN0YW50cztcbn1cblxuLy8gY29uc3QgR0wgPSBnZXRXZWJHTENvbnN0YW50cygpO1xuXG5leHBvcnQgZGVmYXVsdCBHTDtcbiJdfQ==