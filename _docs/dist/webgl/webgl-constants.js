'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _glConstants = require('gl-constants');

var _glConstants2 = _interopRequireDefault(_glConstants);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Extracts constants from WebGL prototype
// function getWebGLConstants() {
//   const constants = {};
//   const WebGLContext =
//     glob.WebGL2RenderingContext || WebGLRenderingContext;
//   for (const key in WebGLContext.prototype) {
//     if (typeof WebGLContext[key] !== 'function') {
//       constants[key] = WebGLContext[key];
//     }
//   }
//   Object.freeze(constants);
//   return constants;
// }

// const GL = getWebGLConstants();

exports.default = _glConstants2.default; // WEBGL BUILT-IN TYPES
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC93ZWJnbC1jb25zdGFudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0E7Ozs7OztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzt5Q0FqQkEiLCJmaWxlIjoid2ViZ2wtY29uc3RhbnRzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gV0VCR0wgQlVJTFQtSU4gVFlQRVNcbmltcG9ydCBHTCBmcm9tICdnbC1jb25zdGFudHMnO1xuXG4vLyBFeHRyYWN0cyBjb25zdGFudHMgZnJvbSBXZWJHTCBwcm90b3R5cGVcbi8vIGZ1bmN0aW9uIGdldFdlYkdMQ29uc3RhbnRzKCkge1xuLy8gICBjb25zdCBjb25zdGFudHMgPSB7fTtcbi8vICAgY29uc3QgV2ViR0xDb250ZXh0ID1cbi8vICAgICBnbG9iLldlYkdMMlJlbmRlcmluZ0NvbnRleHQgfHwgV2ViR0xSZW5kZXJpbmdDb250ZXh0O1xuLy8gICBmb3IgKGNvbnN0IGtleSBpbiBXZWJHTENvbnRleHQucHJvdG90eXBlKSB7XG4vLyAgICAgaWYgKHR5cGVvZiBXZWJHTENvbnRleHRba2V5XSAhPT0gJ2Z1bmN0aW9uJykge1xuLy8gICAgICAgY29uc3RhbnRzW2tleV0gPSBXZWJHTENvbnRleHRba2V5XTtcbi8vICAgICB9XG4vLyAgIH1cbi8vICAgT2JqZWN0LmZyZWV6ZShjb25zdGFudHMpO1xuLy8gICByZXR1cm4gY29uc3RhbnRzO1xuLy8gfVxuXG4vLyBjb25zdCBHTCA9IGdldFdlYkdMQ29uc3RhbnRzKCk7XG5cbmV4cG9ydCBkZWZhdWx0IEdMO1xuIl19