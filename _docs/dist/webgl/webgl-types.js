'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GL = exports.WebGL = exports.WebGL2RenderingContext = exports.WebGLShaderPrecisionFormat = exports.WebGLActiveInfo = exports.WebGLUniformLocation = exports.WebGLTexture = exports.WebGLRenderbuffer = exports.WebGLFramebuffer = exports.WebGLBuffer = exports.WebGLShader = exports.WebGLProgram = exports.WebGLRenderingContext = exports.Image = undefined;

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

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// WEBGL BUILT-IN TYPES
// Enables app to "import" built-in WebGL types unknown to eslint
// Provides a hook for application to preimport headless gl

var ERR_WEBGL_MISSING = '\nWebGL API is missing. To run luma.gl under Node.js,\nplease install headless-gl and import \'luma.gl/headless\' instead of \'luma.gl\'.\n';

/* global window */

var _ref = _utils.lumaGlobals.headlessTypes || _utils.global;

var WebGLRenderingContext = _ref.WebGLRenderingContext;
var WebGLProgram = _ref.WebGLProgram;
var WebGLShader = _ref.WebGLShader;
var WebGLBuffer = _ref.WebGLBuffer;
var WebGLFramebuffer = _ref.WebGLFramebuffer;
var WebGLRenderbuffer = _ref.WebGLRenderbuffer;
var WebGLTexture = _ref.WebGLTexture;
var WebGLUniformLocation = _ref.WebGLUniformLocation;
var WebGLActiveInfo = _ref.WebGLActiveInfo;
var WebGLShaderPrecisionFormat = _ref.WebGLShaderPrecisionFormat;


var allWebGLTypesAvailable = WebGLRenderingContext && WebGLProgram && WebGLShader && WebGLBuffer && WebGLFramebuffer && WebGLRenderbuffer && WebGLTexture && WebGLUniformLocation && WebGLActiveInfo && WebGLShaderPrecisionFormat;

if (!allWebGLTypesAvailable) {
  throw new Error(ERR_WEBGL_MISSING);
}

// Ensures that WebGL2RenderingContext is defined in non-WebGL2 environments
// so that apps can test their gl contexts with instanceof
// E.g. if (gl instanceof WebGL2RenderingContext) { ... }
function getWebGL2RenderingContext() {
  var WebGL2RenderingContextNotSupported = function WebGL2RenderingContextNotSupported() {
    _classCallCheck(this, WebGL2RenderingContextNotSupported);
  };

  return _utils.global.WebGL2RenderingContext || WebGL2RenderingContextNotSupported;
}

function getImage() {
  var ImageNotSupported = function ImageNotSupported() {
    _classCallCheck(this, ImageNotSupported);
  };

  return _utils.global.Image || ImageNotSupported;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC93ZWJnbC10eXBlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7bURBNEVRLE87Ozs7OzttREFBa0IsTzs7OztBQWxFMUI7Ozs7OztBQVZBO0FBQ0E7QUFDQTs7QUFFQSxJQUFNLGlLQUFOOztBQUtBOztXQWNJLG1CQUFZLGFBQVosaUI7O0lBVkYscUIsUUFBQSxxQjtJQUNBLFksUUFBQSxZO0lBQ0EsVyxRQUFBLFc7SUFDQSxXLFFBQUEsVztJQUNBLGdCLFFBQUEsZ0I7SUFDQSxpQixRQUFBLGlCO0lBQ0EsWSxRQUFBLFk7SUFDQSxvQixRQUFBLG9CO0lBQ0EsZSxRQUFBLGU7SUFDQSwwQixRQUFBLDBCOzs7QUFHRixJQUFNLHlCQUNKLHlCQUNBLFlBREEsSUFFQSxXQUZBLElBR0EsV0FIQSxJQUlBLGdCQUpBLElBS0EsaUJBTEEsSUFNQSxZQU5BLElBT0Esb0JBUEEsSUFRQSxlQVJBLElBU0EsMEJBVkY7O0FBWUEsSUFBSSxDQUFDLHNCQUFMLEVBQTZCO0FBQzNCLFFBQU0sSUFBSSxLQUFKLENBQVUsaUJBQVYsQ0FBTjtBQUNEOztBQUVEO0FBQ0E7QUFDQTtBQUNBLFNBQVMseUJBQVQsR0FBcUM7QUFBQSxNQUM3QixrQ0FENkI7QUFBQTtBQUFBOztBQUVuQyxTQUFPLGNBQU8sc0JBQVAsSUFBaUMsa0NBQXhDO0FBQ0Q7O0FBRUQsU0FBUyxRQUFULEdBQW9CO0FBQUEsTUFDWixpQkFEWTtBQUFBO0FBQUE7O0FBRWxCLFNBQU8sY0FBTyxLQUFQLElBQWdCLGlCQUF2QjtBQUNEOztBQUVEO0FBQ0EsSUFBTSx5QkFBeUIsMkJBQS9CO0FBQ0EsSUFBTSxRQUFRLFVBQWQ7O1FBR0UsSyxHQUFBLEs7UUFFQSxxQixHQUFBLHFCO1FBQ0EsWSxHQUFBLFk7UUFDQSxXLEdBQUEsVztRQUNBLFcsR0FBQSxXO1FBQ0EsZ0IsR0FBQSxnQjtRQUNBLGlCLEdBQUEsaUI7UUFDQSxZLEdBQUEsWTtRQUNBLG9CLEdBQUEsb0I7UUFDQSxlLEdBQUEsZTtRQUNBLDBCLEdBQUEsMEI7UUFFQSxzQixHQUFBLHNCOztBQUdGIiwiZmlsZSI6IndlYmdsLXR5cGVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gV0VCR0wgQlVJTFQtSU4gVFlQRVNcbi8vIEVuYWJsZXMgYXBwIHRvIFwiaW1wb3J0XCIgYnVpbHQtaW4gV2ViR0wgdHlwZXMgdW5rbm93biB0byBlc2xpbnRcbi8vIFByb3ZpZGVzIGEgaG9vayBmb3IgYXBwbGljYXRpb24gdG8gcHJlaW1wb3J0IGhlYWRsZXNzIGdsXG5cbmNvbnN0IEVSUl9XRUJHTF9NSVNTSU5HID0gYFxuV2ViR0wgQVBJIGlzIG1pc3NpbmcuIFRvIHJ1biBsdW1hLmdsIHVuZGVyIE5vZGUuanMsXG5wbGVhc2UgaW5zdGFsbCBoZWFkbGVzcy1nbCBhbmQgaW1wb3J0ICdsdW1hLmdsL2hlYWRsZXNzJyBpbnN0ZWFkIG9mICdsdW1hLmdsJy5cbmA7XG5cbi8qIGdsb2JhbCB3aW5kb3cgKi9cbmltcG9ydCB7Z2xvYmFsLCBsdW1hR2xvYmFsc30gZnJvbSAnLi4vdXRpbHMnO1xuXG5jb25zdCB7XG4gIFdlYkdMUmVuZGVyaW5nQ29udGV4dCxcbiAgV2ViR0xQcm9ncmFtLFxuICBXZWJHTFNoYWRlcixcbiAgV2ViR0xCdWZmZXIsXG4gIFdlYkdMRnJhbWVidWZmZXIsXG4gIFdlYkdMUmVuZGVyYnVmZmVyLFxuICBXZWJHTFRleHR1cmUsXG4gIFdlYkdMVW5pZm9ybUxvY2F0aW9uLFxuICBXZWJHTEFjdGl2ZUluZm8sXG4gIFdlYkdMU2hhZGVyUHJlY2lzaW9uRm9ybWF0XG59ID0gbHVtYUdsb2JhbHMuaGVhZGxlc3NUeXBlcyB8fCBnbG9iYWw7XG5cbmNvbnN0IGFsbFdlYkdMVHlwZXNBdmFpbGFibGUgPVxuICBXZWJHTFJlbmRlcmluZ0NvbnRleHQgJiZcbiAgV2ViR0xQcm9ncmFtICYmXG4gIFdlYkdMU2hhZGVyICYmXG4gIFdlYkdMQnVmZmVyICYmXG4gIFdlYkdMRnJhbWVidWZmZXIgJiZcbiAgV2ViR0xSZW5kZXJidWZmZXIgJiZcbiAgV2ViR0xUZXh0dXJlICYmXG4gIFdlYkdMVW5pZm9ybUxvY2F0aW9uICYmXG4gIFdlYkdMQWN0aXZlSW5mbyAmJlxuICBXZWJHTFNoYWRlclByZWNpc2lvbkZvcm1hdDtcblxuaWYgKCFhbGxXZWJHTFR5cGVzQXZhaWxhYmxlKSB7XG4gIHRocm93IG5ldyBFcnJvcihFUlJfV0VCR0xfTUlTU0lORyk7XG59XG5cbi8vIEVuc3VyZXMgdGhhdCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0IGlzIGRlZmluZWQgaW4gbm9uLVdlYkdMMiBlbnZpcm9ubWVudHNcbi8vIHNvIHRoYXQgYXBwcyBjYW4gdGVzdCB0aGVpciBnbCBjb250ZXh0cyB3aXRoIGluc3RhbmNlb2Zcbi8vIEUuZy4gaWYgKGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCkgeyAuLi4gfVxuZnVuY3Rpb24gZ2V0V2ViR0wyUmVuZGVyaW5nQ29udGV4dCgpIHtcbiAgY2xhc3MgV2ViR0wyUmVuZGVyaW5nQ29udGV4dE5vdFN1cHBvcnRlZCB7fVxuICByZXR1cm4gZ2xvYmFsLldlYkdMMlJlbmRlcmluZ0NvbnRleHQgfHwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dE5vdFN1cHBvcnRlZDtcbn1cblxuZnVuY3Rpb24gZ2V0SW1hZ2UoKSB7XG4gIGNsYXNzIEltYWdlTm90U3VwcG9ydGVkIHt9XG4gIHJldHVybiBnbG9iYWwuSW1hZ2UgfHwgSW1hZ2VOb3RTdXBwb3J0ZWQ7XG59XG5cbi8vIGNvbnN0IFdlYkdMID0gZ2V0V2ViR0xDb25zdGFudHMoKTtcbmNvbnN0IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgPSBnZXRXZWJHTDJSZW5kZXJpbmdDb250ZXh0KCk7XG5jb25zdCBJbWFnZSA9IGdldEltYWdlKCk7XG5cbmV4cG9ydCB7XG4gIEltYWdlLFxuXG4gIFdlYkdMUmVuZGVyaW5nQ29udGV4dCxcbiAgV2ViR0xQcm9ncmFtLFxuICBXZWJHTFNoYWRlcixcbiAgV2ViR0xCdWZmZXIsXG4gIFdlYkdMRnJhbWVidWZmZXIsXG4gIFdlYkdMUmVuZGVyYnVmZmVyLFxuICBXZWJHTFRleHR1cmUsXG4gIFdlYkdMVW5pZm9ybUxvY2F0aW9uLFxuICBXZWJHTEFjdGl2ZUluZm8sXG4gIFdlYkdMU2hhZGVyUHJlY2lzaW9uRm9ybWF0LFxuXG4gIFdlYkdMMlJlbmRlcmluZ0NvbnRleHRcbn07XG5cbi8vIENvbnZlbmllbmNlXG5leHBvcnQge2RlZmF1bHQgYXMgV2ViR0wsIGRlZmF1bHQgYXMgR0x9IGZyb20gJy4vd2ViZ2wtY29uc3RhbnRzJztcbiJdfQ==