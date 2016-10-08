'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GL = exports.WebGL = exports.WebGL2RenderingContext = exports.WebGLShaderPrecisionFormat = exports.WebGLActiveInfo = exports.WebGLUniformLocation = exports.WebGLTexture = exports.WebGLRenderbuffer = exports.WebGLFramebuffer = exports.WebGLBuffer = exports.WebGLShader = exports.WebGLProgram = exports.WebGLRenderingContext = exports.Image = exports.webGLTypesAvailable = undefined;

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

var _globals = require('../globals');

var _globals2 = _interopRequireDefault(_globals);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } // WEBGL BUILT-IN TYPES
// Enables app to "import" built-in WebGL types unknown to eslint
// Provides a hook for application to preimport headless gl

var global = _globals2.default.global;

var DummyType = function DummyType() {
  _classCallCheck(this, DummyType);
};

var _ref = _globals2.default.globals.headlessTypes || global;

var _ref$WebGLRenderingCo = _ref.WebGLRenderingContext;
var WebGLRenderingContext = _ref$WebGLRenderingCo === undefined ? DummyType : _ref$WebGLRenderingCo;
var _ref$WebGLProgram = _ref.WebGLProgram;
var WebGLProgram = _ref$WebGLProgram === undefined ? DummyType : _ref$WebGLProgram;
var _ref$WebGLShader = _ref.WebGLShader;
var WebGLShader = _ref$WebGLShader === undefined ? DummyType : _ref$WebGLShader;
var _ref$WebGLBuffer = _ref.WebGLBuffer;
var WebGLBuffer = _ref$WebGLBuffer === undefined ? DummyType : _ref$WebGLBuffer;
var _ref$WebGLFramebuffer = _ref.WebGLFramebuffer;
var WebGLFramebuffer = _ref$WebGLFramebuffer === undefined ? DummyType : _ref$WebGLFramebuffer;
var _ref$WebGLRenderbuffe = _ref.WebGLRenderbuffer;
var WebGLRenderbuffer = _ref$WebGLRenderbuffe === undefined ? DummyType : _ref$WebGLRenderbuffe;
var _ref$WebGLTexture = _ref.WebGLTexture;
var WebGLTexture = _ref$WebGLTexture === undefined ? DummyType : _ref$WebGLTexture;
var _ref$WebGLUniformLoca = _ref.WebGLUniformLocation;
var WebGLUniformLocation = _ref$WebGLUniformLoca === undefined ? DummyType : _ref$WebGLUniformLoca;
var _ref$WebGLActiveInfo = _ref.WebGLActiveInfo;
var WebGLActiveInfo = _ref$WebGLActiveInfo === undefined ? DummyType : _ref$WebGLActiveInfo;
var _ref$WebGLShaderPreci = _ref.WebGLShaderPrecisionFormat;
var WebGLShaderPrecisionFormat = _ref$WebGLShaderPreci === undefined ? DummyType : _ref$WebGLShaderPreci;
var webGLTypesAvailable = exports.webGLTypesAvailable = WebGLRenderingContext !== DummyType && WebGLProgram !== DummyType && WebGLShader !== DummyType && WebGLBuffer !== DummyType && WebGLFramebuffer !== DummyType && WebGLRenderbuffer !== DummyType && WebGLTexture !== DummyType && WebGLUniformLocation !== DummyType && WebGLActiveInfo !== DummyType && WebGLShaderPrecisionFormat !== DummyType;

// Ensures that WebGL2RenderingContext is defined in non-WebGL2 environments
// so that apps can test their gl contexts with instanceof
// E.g. if (gl instanceof WebGL2RenderingContext) { ... }
function getWebGL2RenderingContext() {
  var WebGL2RenderingContextNotSupported = function WebGL2RenderingContextNotSupported() {
    _classCallCheck(this, WebGL2RenderingContextNotSupported);
  };

  return global.WebGL2RenderingContext || WebGL2RenderingContextNotSupported;
}

function getImage() {
  var ImageNotSupported = function ImageNotSupported() {
    _classCallCheck(this, ImageNotSupported);
  };

  return global.Image || ImageNotSupported;
}

// const WebGL = getWebGLConstants();
var WebGL2RenderingContext = getWebGL2RenderingContext();
var Image = getImage();

exports.Image = Image;
exports.WebGLRenderingContext = WebGLRenderingContext;
exports.WebGLProgram = WebGLProgram;
exports.WebGLShader = WebGLShader;
exports.WebGLBuffer = WebGLBuffer;
exports.WebGLFramebuffer = WebGLFramebuffer;
exports.WebGLRenderbuffer = WebGLRenderbuffer;
exports.WebGLTexture = WebGLTexture;
exports.WebGLUniformLocation = WebGLUniformLocation;
exports.WebGLActiveInfo = WebGLActiveInfo;
exports.WebGLShaderPrecisionFormat = WebGLShaderPrecisionFormat;
exports.WebGL2RenderingContext = WebGL2RenderingContext;

// Convenience
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC93ZWJnbC10eXBlcy5qcyJdLCJuYW1lcyI6WyJkZWZhdWx0IiwiZ2xvYmFsIiwiRHVtbXlUeXBlIiwiZ2xvYmFscyIsImhlYWRsZXNzVHlwZXMiLCJXZWJHTFJlbmRlcmluZ0NvbnRleHQiLCJXZWJHTFByb2dyYW0iLCJXZWJHTFNoYWRlciIsIldlYkdMQnVmZmVyIiwiV2ViR0xGcmFtZWJ1ZmZlciIsIldlYkdMUmVuZGVyYnVmZmVyIiwiV2ViR0xUZXh0dXJlIiwiV2ViR0xVbmlmb3JtTG9jYXRpb24iLCJXZWJHTEFjdGl2ZUluZm8iLCJXZWJHTFNoYWRlclByZWNpc2lvbkZvcm1hdCIsIndlYkdMVHlwZXNBdmFpbGFibGUiLCJnZXRXZWJHTDJSZW5kZXJpbmdDb250ZXh0IiwiV2ViR0wyUmVuZGVyaW5nQ29udGV4dE5vdFN1cHBvcnRlZCIsIldlYkdMMlJlbmRlcmluZ0NvbnRleHQiLCJnZXRJbWFnZSIsIkltYWdlTm90U3VwcG9ydGVkIiwiSW1hZ2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OzttREFzRVFBLE87Ozs7OzttREFBa0JBLE87Ozs7QUFsRTFCOzs7Ozs7MEpBSkE7QUFDQTtBQUNBOztBQUlBLElBQU1DLFNBQVMsa0JBQUtBLE1BQXBCOztJQUVNQyxTOzs7O1dBYUYsa0JBQUtDLE9BQUwsQ0FBYUMsYUFBYixJQUE4QkgsTTs7aUNBVmhDSSxxQjtJQUFBQSxxQix5Q0FBd0JILFM7NkJBQ3hCSSxZO0lBQUFBLFkscUNBQWVKLFM7NEJBQ2ZLLFc7SUFBQUEsVyxvQ0FBY0wsUzs0QkFDZE0sVztJQUFBQSxXLG9DQUFjTixTO2lDQUNkTyxnQjtJQUFBQSxnQix5Q0FBbUJQLFM7aUNBQ25CUSxpQjtJQUFBQSxpQix5Q0FBb0JSLFM7NkJBQ3BCUyxZO0lBQUFBLFkscUNBQWVULFM7aUNBQ2ZVLG9CO0lBQUFBLG9CLHlDQUF1QlYsUztnQ0FDdkJXLGU7SUFBQUEsZSx3Q0FBa0JYLFM7aUNBQ2xCWSwwQjtJQUFBQSwwQix5Q0FBNkJaLFM7QUFHeEIsSUFBTWEsb0RBQ1hWLDBCQUEwQkgsU0FBMUIsSUFDQUksaUJBQWlCSixTQURqQixJQUVBSyxnQkFBZ0JMLFNBRmhCLElBR0FNLGdCQUFnQk4sU0FIaEIsSUFJQU8scUJBQXFCUCxTQUpyQixJQUtBUSxzQkFBc0JSLFNBTHRCLElBTUFTLGlCQUFpQlQsU0FOakIsSUFPQVUseUJBQXlCVixTQVB6QixJQVFBVyxvQkFBb0JYLFNBUnBCLElBU0FZLCtCQUErQlosU0FWMUI7O0FBWVA7QUFDQTtBQUNBO0FBQ0EsU0FBU2MseUJBQVQsR0FBcUM7QUFBQSxNQUM3QkMsa0NBRDZCO0FBQUE7QUFBQTs7QUFFbkMsU0FBT2hCLE9BQU9pQixzQkFBUCxJQUFpQ0Qsa0NBQXhDO0FBQ0Q7O0FBRUQsU0FBU0UsUUFBVCxHQUFvQjtBQUFBLE1BQ1pDLGlCQURZO0FBQUE7QUFBQTs7QUFFbEIsU0FBT25CLE9BQU9vQixLQUFQLElBQWdCRCxpQkFBdkI7QUFDRDs7QUFFRDtBQUNBLElBQU1GLHlCQUF5QkYsMkJBQS9CO0FBQ0EsSUFBTUssUUFBUUYsVUFBZDs7UUFHRUUsSyxHQUFBQSxLO1FBRUFoQixxQixHQUFBQSxxQjtRQUNBQyxZLEdBQUFBLFk7UUFDQUMsVyxHQUFBQSxXO1FBQ0FDLFcsR0FBQUEsVztRQUNBQyxnQixHQUFBQSxnQjtRQUNBQyxpQixHQUFBQSxpQjtRQUNBQyxZLEdBQUFBLFk7UUFDQUMsb0IsR0FBQUEsb0I7UUFDQUMsZSxHQUFBQSxlO1FBQ0FDLDBCLEdBQUFBLDBCO1FBRUFJLHNCLEdBQUFBLHNCOztBQUdGIiwiZmlsZSI6IndlYmdsLXR5cGVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gV0VCR0wgQlVJTFQtSU4gVFlQRVNcbi8vIEVuYWJsZXMgYXBwIHRvIFwiaW1wb3J0XCIgYnVpbHQtaW4gV2ViR0wgdHlwZXMgdW5rbm93biB0byBlc2xpbnRcbi8vIFByb3ZpZGVzIGEgaG9vayBmb3IgYXBwbGljYXRpb24gdG8gcHJlaW1wb3J0IGhlYWRsZXNzIGdsXG5cbmltcG9ydCBsdW1hIGZyb20gJy4uL2dsb2JhbHMnO1xuXG5jb25zdCBnbG9iYWwgPSBsdW1hLmdsb2JhbDtcblxuY2xhc3MgRHVtbXlUeXBlIHt9XG5cbmNvbnN0IHtcbiAgV2ViR0xSZW5kZXJpbmdDb250ZXh0ID0gRHVtbXlUeXBlLFxuICBXZWJHTFByb2dyYW0gPSBEdW1teVR5cGUsXG4gIFdlYkdMU2hhZGVyID0gRHVtbXlUeXBlLFxuICBXZWJHTEJ1ZmZlciA9IER1bW15VHlwZSxcbiAgV2ViR0xGcmFtZWJ1ZmZlciA9IER1bW15VHlwZSxcbiAgV2ViR0xSZW5kZXJidWZmZXIgPSBEdW1teVR5cGUsXG4gIFdlYkdMVGV4dHVyZSA9IER1bW15VHlwZSxcbiAgV2ViR0xVbmlmb3JtTG9jYXRpb24gPSBEdW1teVR5cGUsXG4gIFdlYkdMQWN0aXZlSW5mbyA9IER1bW15VHlwZSxcbiAgV2ViR0xTaGFkZXJQcmVjaXNpb25Gb3JtYXQgPSBEdW1teVR5cGVcbn0gPSBsdW1hLmdsb2JhbHMuaGVhZGxlc3NUeXBlcyB8fCBnbG9iYWw7XG5cbmV4cG9ydCBjb25zdCB3ZWJHTFR5cGVzQXZhaWxhYmxlID1cbiAgV2ViR0xSZW5kZXJpbmdDb250ZXh0ICE9PSBEdW1teVR5cGUgJiZcbiAgV2ViR0xQcm9ncmFtICE9PSBEdW1teVR5cGUgJiZcbiAgV2ViR0xTaGFkZXIgIT09IER1bW15VHlwZSAmJlxuICBXZWJHTEJ1ZmZlciAhPT0gRHVtbXlUeXBlICYmXG4gIFdlYkdMRnJhbWVidWZmZXIgIT09IER1bW15VHlwZSAmJlxuICBXZWJHTFJlbmRlcmJ1ZmZlciAhPT0gRHVtbXlUeXBlICYmXG4gIFdlYkdMVGV4dHVyZSAhPT0gRHVtbXlUeXBlICYmXG4gIFdlYkdMVW5pZm9ybUxvY2F0aW9uICE9PSBEdW1teVR5cGUgJiZcbiAgV2ViR0xBY3RpdmVJbmZvICE9PSBEdW1teVR5cGUgJiZcbiAgV2ViR0xTaGFkZXJQcmVjaXNpb25Gb3JtYXQgIT09IER1bW15VHlwZTtcblxuLy8gRW5zdXJlcyB0aGF0IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgaXMgZGVmaW5lZCBpbiBub24tV2ViR0wyIGVudmlyb25tZW50c1xuLy8gc28gdGhhdCBhcHBzIGNhbiB0ZXN0IHRoZWlyIGdsIGNvbnRleHRzIHdpdGggaW5zdGFuY2VvZlxuLy8gRS5nLiBpZiAoZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0KSB7IC4uLiB9XG5mdW5jdGlvbiBnZXRXZWJHTDJSZW5kZXJpbmdDb250ZXh0KCkge1xuICBjbGFzcyBXZWJHTDJSZW5kZXJpbmdDb250ZXh0Tm90U3VwcG9ydGVkIHt9XG4gIHJldHVybiBnbG9iYWwuV2ViR0wyUmVuZGVyaW5nQ29udGV4dCB8fCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0Tm90U3VwcG9ydGVkO1xufVxuXG5mdW5jdGlvbiBnZXRJbWFnZSgpIHtcbiAgY2xhc3MgSW1hZ2VOb3RTdXBwb3J0ZWQge31cbiAgcmV0dXJuIGdsb2JhbC5JbWFnZSB8fCBJbWFnZU5vdFN1cHBvcnRlZDtcbn1cblxuLy8gY29uc3QgV2ViR0wgPSBnZXRXZWJHTENvbnN0YW50cygpO1xuY29uc3QgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCA9IGdldFdlYkdMMlJlbmRlcmluZ0NvbnRleHQoKTtcbmNvbnN0IEltYWdlID0gZ2V0SW1hZ2UoKTtcblxuZXhwb3J0IHtcbiAgSW1hZ2UsXG5cbiAgV2ViR0xSZW5kZXJpbmdDb250ZXh0LFxuICBXZWJHTFByb2dyYW0sXG4gIFdlYkdMU2hhZGVyLFxuICBXZWJHTEJ1ZmZlcixcbiAgV2ViR0xGcmFtZWJ1ZmZlcixcbiAgV2ViR0xSZW5kZXJidWZmZXIsXG4gIFdlYkdMVGV4dHVyZSxcbiAgV2ViR0xVbmlmb3JtTG9jYXRpb24sXG4gIFdlYkdMQWN0aXZlSW5mbyxcbiAgV2ViR0xTaGFkZXJQcmVjaXNpb25Gb3JtYXQsXG5cbiAgV2ViR0wyUmVuZGVyaW5nQ29udGV4dFxufTtcblxuLy8gQ29udmVuaWVuY2VcbmV4cG9ydCB7ZGVmYXVsdCBhcyBXZWJHTCwgZGVmYXVsdCBhcyBHTH0gZnJvbSAnLi93ZWJnbC1jb25zdGFudHMnO1xuIl19