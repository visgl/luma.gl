'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _webglConstants = require('./webgl-constants');

Object.defineProperty(exports, 'WebGL', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_webglConstants).default;
  }
});
Object.defineProperty(exports, 'GL', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_webglConstants).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// WEBGL BUILT-IN TYPES
// Enables app to "import" built-in WebGL types unknown to eslint
// Provides a hook for application to preimport headless gl

/* global window, global */
var glob = typeof window !== 'undefined' ? window : global.headlessGLTypes;
if (!glob) {
  throw new Error('No WebGL type definitions available');
}

var WebGLRenderingContext = glob.WebGLRenderingContext;
var WebGLBuffer = glob.WebGLBuffer;
var WebGLFramebuffer = glob.WebGLFramebuffer;
var WebGLRenderbuffer = glob.WebGLRenderbuffer;

// Ensures that WebGL2RenderingContext is defined in non-WebGL2 environments
// so that apps can test their gl contexts with instanceof
// E.g. if (gl instanceof WebGL2RenderingContext) { ... }

function getWebGL2RenderingContext() {
  var WebGL2RenderingContextNotSupported = function WebGL2RenderingContextNotSupported() {
    _classCallCheck(this, WebGL2RenderingContextNotSupported);
  };

  return glob.WebGL2RenderingContext || WebGL2RenderingContextNotSupported;
}

function getImage() {
  var ImageNotSupported = function ImageNotSupported() {
    _classCallCheck(this, ImageNotSupported);
  };

  return glob.Image || ImageNotSupported;
}

// const WebGL = getWebGLConstants();
var WebGL2RenderingContext = getWebGL2RenderingContext();
var Image = getImage();

exports.WebGL2RenderingContext = WebGL2RenderingContext;
exports.WebGLRenderingContext = WebGLRenderingContext;
exports.WebGLBuffer = WebGLBuffer;
exports.WebGLFramebuffer = WebGLFramebuffer;
exports.WebGLRenderbuffer = WebGLRenderbuffer;
exports.Image = Image;

// Convenience
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC93ZWJnbC10eXBlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OzttREE0Q1EsTzs7Ozs7O21EQUFrQixPOzs7Ozs7Ozs7Ozs7O0FBdkMxQixJQUFNLE9BQU8sT0FBTyxNQUFQLEtBQWtCLFdBQWxCLEdBQWdDLE1BQWhDLEdBQXlDLE9BQU8sZUFBN0Q7QUFDQSxJQUFJLENBQUMsSUFBTCxFQUFXO0FBQ1QsUUFBTSxJQUFJLEtBQUosQ0FBVSxxQ0FBVixDQUFOO0FBQ0Q7O0lBR0MscUIsR0FJRSxJLENBSkYscUI7SUFDQSxXLEdBR0UsSSxDQUhGLFc7SUFDQSxnQixHQUVFLEksQ0FGRixnQjtJQUNBLGlCLEdBQ0UsSSxDQURGLGlCOzs7Ozs7QUFNRixTQUFTLHlCQUFULEdBQXFDO0FBQUEsTUFDN0Isa0NBRDZCO0FBQUE7QUFBQTs7QUFFbkMsU0FBTyxLQUFLLHNCQUFMLElBQStCLGtDQUF0QztBQUNEOztBQUVELFNBQVMsUUFBVCxHQUFvQjtBQUFBLE1BQ1osaUJBRFk7QUFBQTtBQUFBOztBQUVsQixTQUFPLEtBQUssS0FBTCxJQUFjLGlCQUFyQjtBQUNEOzs7QUFHRCxJQUFNLHlCQUF5QiwyQkFBL0I7QUFDQSxJQUFNLFFBQVEsVUFBZDs7UUFHRSxzQixHQUFBLHNCO1FBQ0EscUIsR0FBQSxxQjtRQUNBLFcsR0FBQSxXO1FBQ0EsZ0IsR0FBQSxnQjtRQUNBLGlCLEdBQUEsaUI7UUFDQSxLLEdBQUEsSyIsImZpbGUiOiJ3ZWJnbC10eXBlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFdFQkdMIEJVSUxULUlOIFRZUEVTXG4vLyBFbmFibGVzIGFwcCB0byBcImltcG9ydFwiIGJ1aWx0LWluIFdlYkdMIHR5cGVzIHVua25vd24gdG8gZXNsaW50XG4vLyBQcm92aWRlcyBhIGhvb2sgZm9yIGFwcGxpY2F0aW9uIHRvIHByZWltcG9ydCBoZWFkbGVzcyBnbFxuXG4vKiBnbG9iYWwgd2luZG93LCBnbG9iYWwgKi9cbmNvbnN0IGdsb2IgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IGdsb2JhbC5oZWFkbGVzc0dMVHlwZXM7XG5pZiAoIWdsb2IpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdObyBXZWJHTCB0eXBlIGRlZmluaXRpb25zIGF2YWlsYWJsZScpO1xufVxuXG5jb25zdCB7XG4gIFdlYkdMUmVuZGVyaW5nQ29udGV4dCxcbiAgV2ViR0xCdWZmZXIsXG4gIFdlYkdMRnJhbWVidWZmZXIsXG4gIFdlYkdMUmVuZGVyYnVmZmVyXG59ID0gZ2xvYjtcblxuLy8gRW5zdXJlcyB0aGF0IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgaXMgZGVmaW5lZCBpbiBub24tV2ViR0wyIGVudmlyb25tZW50c1xuLy8gc28gdGhhdCBhcHBzIGNhbiB0ZXN0IHRoZWlyIGdsIGNvbnRleHRzIHdpdGggaW5zdGFuY2VvZlxuLy8gRS5nLiBpZiAoZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KSB7IC4uLiB9XG5mdW5jdGlvbiBnZXRXZWJHTDJSZW5kZXJpbmdDb250ZXh0KCkge1xuICBjbGFzcyBXZWJHTDJSZW5kZXJpbmdDb250ZXh0Tm90U3VwcG9ydGVkIHt9XG4gIHJldHVybiBnbG9iLldlYkdMMlJlbmRlcmluZ0NvbnRleHQgfHwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dE5vdFN1cHBvcnRlZDtcbn1cblxuZnVuY3Rpb24gZ2V0SW1hZ2UoKSB7XG4gIGNsYXNzIEltYWdlTm90U3VwcG9ydGVkIHt9XG4gIHJldHVybiBnbG9iLkltYWdlIHx8IEltYWdlTm90U3VwcG9ydGVkO1xufVxuXG4vLyBjb25zdCBXZWJHTCA9IGdldFdlYkdMQ29uc3RhbnRzKCk7XG5jb25zdCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0ID0gZ2V0V2ViR0wyUmVuZGVyaW5nQ29udGV4dCgpO1xuY29uc3QgSW1hZ2UgPSBnZXRJbWFnZSgpO1xuXG5leHBvcnQge1xuICBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LFxuICBXZWJHTFJlbmRlcmluZ0NvbnRleHQsXG4gIFdlYkdMQnVmZmVyLFxuICBXZWJHTEZyYW1lYnVmZmVyLFxuICBXZWJHTFJlbmRlcmJ1ZmZlcixcbiAgSW1hZ2Vcbn07XG5cbi8vIENvbnZlbmllbmNlXG5leHBvcnQge2RlZmF1bHQgYXMgV2ViR0wsIGRlZmF1bHQgYXMgR0x9IGZyb20gJy4vd2ViZ2wtY29uc3RhbnRzJztcbiJdfQ==