'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createGLContext = createGLContext;
exports.glGet = glGet;
exports.getGLExtension = getGLExtension;
exports.glGetDebugInfo = glGetDebugInfo;
exports.glContextWithState = glContextWithState;
exports.glGetError = glGetError;
exports.glCheckError = glCheckError;
exports.getExtension = getExtension;

var _webglDebug = require('webgl-debug');

var _webglDebug2 = _interopRequireDefault(_webglDebug);

var _webglTypes = require('./webgl-types');

var _webglChecks = require('./webgl-checks');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; } // WebGLRenderingContext related methods
/* eslint-disable no-try-catch, no-loop-func */


/* global document */

// Checks if WebGL is enabled and creates a context for using WebGL.
/* eslint-disable complexity, max-statements */
function createGLContext() {
  var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var _ref$headlessGL = _ref.headlessGL;
  var
  // Optional: Supply headless context creator
  // Done like this to avoid hard dependency on headless-gl
  headlessGL = _ref$headlessGL === undefined ? null : _ref$headlessGL;
  var
  // Force headless on/off
  headless = _ref.headless;
  var
  // BROWSER CONTEXT PARAMATERS: canvas is only used when in browser
  canvas = _ref.canvas;
  var _ref$width = _ref.width;
  var
  // HEADLESS CONTEXT PARAMETERS: width are height are only used by headless gl
  width = _ref$width === undefined ? 800 : _ref$width;
  var _ref$height = _ref.height;
  var height = _ref$height === undefined ? 600 : _ref$height;
  var _ref$webgl = _ref.webgl2;
  var
  // COMMON CONTEXT PARAMETERS
  // Attempt to allocate WebGL2 context
  webgl2 = _ref$webgl === undefined ? false : _ref$webgl;
  var _ref$debug = _ref.debug;
  var
  // Instrument context (at the expense of performance)
  // Note: defaults to true and needs to be explicitly turn off
  debug = _ref$debug === undefined ? false : _ref$debug;

  var opts = _objectWithoutProperties(_ref, ['headlessGL', 'headless', 'canvas', 'width', 'height', 'webgl2', 'debug']);

  var gl = void 0;

  if (!(0, _utils.isBrowser)()) {
    headlessGL = headlessGL || (0, _utils.getGlobal)().headlessGL;

    // Create headless gl context
    if (!headlessGL) {
      throw new Error('Cannot create headless WebGL context, headlessGL not available');
    }
    gl = headlessGL(width, height, opts);
    if (!gl) {
      throw new Error('headlessGL failed to create headless WebGL context');
    }
  } else {

    // Create browser gl context
    canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
    if (!canvas) {
      canvas = document.createElement('canvas');
    }

    canvas.addEventListener('webglcontextcreationerror', function (e) {
      _utils.log.log(0, e.statusMessage || 'Unknown error');
    }, false);

    // Prefer webgl2 over webgl1, prefer conformant over experimental
    if (webgl2) {
      gl = canvas.getContext('webgl2', opts);
      gl = gl || canvas.getContext('experimental-webgl2', opts);
    }
    gl = gl || canvas.getContext('webgl', opts);
    gl = gl || canvas.getContext('experimental-webgl', opts);

    (0, _assert2.default)(gl, 'Failed to create WebGLRenderingContext');
  }

  if ((0, _utils.isBrowser)() && debug) {
    var debugGL = _webglDebug2.default.makeDebugContext(gl, throwOnError, validateArgsAndLog);

    var WebGLDebugContext = function WebGLDebugContext() {
      _classCallCheck(this, WebGLDebugContext);
    };

    Object.assign(WebGLDebugContext.prototype, debugGL);
    gl = debugGL;
    gl.debug = true;
    _utils.log.priority = _utils.log.priority < 1 ? 1 : _utils.log.priority;

    logInfo(gl);

    _utils.log.log(0, 'Change lumaLog.priority in console to control logging (0-3, default 1)');
    _utils.log.log(0, 'Set lumaLog.break to array of matching strings to break on gl logs');
  }

  return gl;
}

function logInfo(gl) {
  var webGL = (0, _webglChecks.isWebGL2RenderingContext)(gl) ? 'WebGL2' : 'WebGL1';
  var info = glGetDebugInfo(gl);
  var driver = info ? 'using driver: ' + info.vendor + ' ' + info.renderer : '';
  var debug = gl.debug ? 'debug' : '';
  _utils.log.log(0, webGL + ' ' + debug + ' context created ' + driver, gl);

  // const extensions = gl.getSupportedExtensions();
  // log.log(0, `Supported extensions: [${extensions.join(', ')}]`);
}

// alert(WebGLDebugUtils.glEnumToString(ctx.getError()));

// Resolve a WebGL enumeration name (returns itself if already a number)
function glGet(gl, name) {
  // assertWebGLRenderingContext(gl);

  var value = name;
  if (typeof name === 'string') {
    value = gl[name];
    (0, _assert2.default)(value !== undefined, 'Accessing gl.' + name);
  }
  return value;
}

// Returns the extension or throws an error
function getGLExtension(gl, extensionName) {
  // assertWebGLRenderingContext(gl);

  var ERROR = 'Illegal arg to getExtension';
  (0, _assert2.default)(gl instanceof _webglTypes.WebGLRenderingContext, ERROR);
  (0, _assert2.default)(typeof extensionName === 'string', ERROR);
  var extension = gl.getExtension(extensionName);
  (0, _assert2.default)(extension, extensionName + ' not supported!');
  return extension;
}

function glGetDebugInfo(gl) {
  var info = gl.getExtension('WEBGL_debug_renderer_info');
  /* Avoid Firefox issues with debug context and extensions */
  if (info && info.UNMASKED_VENDOR_WEBGL && info.UNMASKED_RENDERER_WEBGL) {
    return {
      vendor: gl.getParameter(info.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL)
    };
  }
  return null;
}

// Executes a function with gl states temporarily set, exception safe
// Currently support scissor test and framebuffer binding
function glContextWithState(gl, _ref2, func) {
  var scissorTest = _ref2.scissorTest;
  var frameBuffer = _ref2.frameBuffer;

  // assertWebGLRenderingContext(gl);

  var scissorTestWasEnabled = void 0;
  if (scissorTest) {
    scissorTestWasEnabled = gl.isEnabled(gl.SCISSOR_TEST);
    var x = scissorTest.x;
    var y = scissorTest.y;
    var w = scissorTest.w;
    var h = scissorTest.h;

    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, w, h);
  }

  if (frameBuffer) {
    // TODO - was there any previously set frame buffer we need to remember?
    frameBuffer.bind();
  }

  try {
    func(gl);
  } finally {
    if (!scissorTestWasEnabled) {
      gl.disable(gl.SCISSOR_TEST);
    }
    if (frameBuffer) {
      // TODO - was there any previously set frame buffer?
      // TODO - delegate "unbind" to Framebuffer object?
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }
}

function getFunctionString(functionName, functionArgs) {
  var args = _webglDebug2.default.glFunctionArgsToString(functionName, functionArgs);
  args = '' + args.slice(0, 100) + (args.length > 100 ? '...' : '');
  return 'gl.' + functionName + '(' + args + ')';
}

function throwOnError(err, functionName, args) {
  var errorMessage = _webglDebug2.default.glEnumToString(err);
  var functionArgs = _webglDebug2.default.glFunctionArgsToString(functionName, args);
  throw new Error(errorMessage + ' was caused by call to: ' + ('gl.' + functionName + '(' + functionArgs + ')'));
}

// Don't generate function string until it is needed
function validateArgsAndLog(functionName, functionArgs) {
  var functionString = void 0;
  if (_utils.log.priority >= 3) {
    functionString = getFunctionString(functionName, functionArgs);
    _utils.log.info(3, '' + functionString);
  }

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = functionArgs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var arg = _step.value;

      if (arg === undefined) {
        functionString = functionString || getFunctionString(functionName, functionArgs);
        throw new Error('Undefined argument: ' + functionString);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var breaks = _utils.log.break;
  if (_utils.log.break) {
    functionString = functionString || getFunctionString(functionName, functionArgs);
    var isBreakpoint = _utils.log.break && _utils.log.break.every(function (breakString) {
      return functionString.indexOf(breakString) !== -1;
    });

    if (isBreakpoint) {
      debugger;
    }
  }
}

// Returns an Error representing the Latest webGl error or null
function glGetError(gl) {
  // Loop to ensure all errors are cleared
  var errorStack = [];
  var glError = gl.getError();
  while (glError !== gl.NO_ERROR) {
    errorStack.push(glGetErrorMessage(gl, glError));
    glError = gl.getError();
  }
  return errorStack.length ? new Error(errorStack.join('\n')) : null;
}

function glCheckError(gl) {
  if (gl.debug) {
    var error = glGetError(gl);
    if (error) {
      throw error;
    }
  }
}

function glGetErrorMessage(gl, glError) {
  switch (glError) {
    case gl.CONTEXT_LOST_WEBGL:
      //  If the WebGL context is lost, this error is returned on the
      // first call to getError. Afterwards and until the context has been
      // restored, it returns gl.NO_ERROR.
      return 'WebGL context lost';
    case gl.INVALID_ENUM:
      // An unacceptable value has been specified for an enumerated argument.
      return 'WebGL invalid enumerated argument';
    case gl.INVALID_VALUE:
      // A numeric argument is out of range.
      return 'WebGL invalid value';
    case gl.INVALID_OPERATION:
      // The specified command is not allowed for the current state.
      return 'WebGL invalid operation';
    case gl.INVALID_FRAMEBUFFER_OPERATION:
      // The currently bound framebuffer is not framebuffer complete
      // when trying to render to or to read from it.
      return 'WebGL invalid framebuffer operation';
    case gl.OUT_OF_MEMORY:
      // Not enough memory is left to execute the command.
      return 'WebGL out of memory';
    default:
      return 'WebGL unknown error ' + glError;
  }
}

// Deprecated methods

function getExtension(gl, extensionName) {
  _utils.log.warn(0, 'luma.gl: getExtension is deprecated');
  return getGLExtension(gl, extensionName);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9jb250ZXh0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O1FBV2dCLGUsR0FBQSxlO1FBNkZBLEssR0FBQSxLO1FBWUEsYyxHQUFBLGM7UUFXQSxjLEdBQUEsYztRQWNBLGtCLEdBQUEsa0I7UUEwRUEsVSxHQUFBLFU7UUFXQSxZLEdBQUEsWTtRQXVDQSxZLEdBQUEsWTs7QUF2UWhCOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7QUFLTyxTQUFTLGVBQVQsR0FtQkM7QUFBQSxtRUFBSixFQUFJOztBQUFBLDZCQWhCTixVQWdCTTtBQUFBOzs7QUFoQk4sWUFnQk0sbUNBaEJPLElBZ0JQO0FBQUE7O0FBZE4sVUFjTSxRQWROLFFBY007QUFBQTs7QUFaTixRQVlNLFFBWk4sTUFZTTtBQUFBLHdCQVZOLEtBVU07QUFBQTs7QUFWTixPQVVNLDhCQVZFLEdBVUY7QUFBQSx5QkFUTixNQVNNO0FBQUEsTUFUTixNQVNNLCtCQVRHLEdBU0g7QUFBQSx3QkFOTixNQU1NO0FBQUE7OztBQU5OLFFBTU0sOEJBTkcsS0FNSDtBQUFBLHdCQUhOLEtBR007QUFBQTs7O0FBSE4sT0FHTSw4QkFIRSxLQUdGOztBQUFBLE1BREgsSUFDRzs7QUFDTixNQUFJLFdBQUo7O0FBRUEsTUFBSSxDQUFDLHVCQUFMLEVBQWtCO0FBQ2hCLGlCQUFhLGNBQWMsd0JBQVksVUFBdkM7OztBQUdBLFFBQUksQ0FBQyxVQUFMLEVBQWlCO0FBQ2YsWUFBTSxJQUFJLEtBQUosa0VBQU47QUFFRDtBQUNELFNBQUssV0FBVyxLQUFYLEVBQWtCLE1BQWxCLEVBQTBCLElBQTFCLENBQUw7QUFDQSxRQUFJLENBQUMsRUFBTCxFQUFTO0FBQ1AsWUFBTSxJQUFJLEtBQUosQ0FBVSxvREFBVixDQUFOO0FBQ0Q7QUFFRixHQWJELE1BYU87OztBQUdMLGFBQVMsT0FBTyxNQUFQLEtBQWtCLFFBQWxCLEdBQ1AsU0FBUyxjQUFULENBQXdCLE1BQXhC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OUMsYUFBSSxJQUFKLENBQVMsQ0FBVCxFQUFZLHFDQUFaO0FBQ0EsU0FBTyxlQUFlLEVBQWYsRUFBbUIsYUFBbkIsQ0FBUDtBQUNEIiwiZmlsZSI6ImNvbnRleHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgcmVsYXRlZCBtZXRob2RzXG4vKiBlc2xpbnQtZGlzYWJsZSBuby10cnktY2F0Y2gsIG5vLWxvb3AtZnVuYyAqL1xuaW1wb3J0IFdlYkdMRGVidWcgZnJvbSAnd2ViZ2wtZGVidWcnO1xuaW1wb3J0IHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHtpc1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtY2hlY2tzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7bG9nLCBpc0Jyb3dzZXIsIGdldEdsb2JhbH0gZnJvbSAnLi4vdXRpbHMnO1xuLyogZ2xvYmFsIGRvY3VtZW50ICovXG5cbi8vIENoZWNrcyBpZiBXZWJHTCBpcyBlbmFibGVkIGFuZCBjcmVhdGVzIGEgY29udGV4dCBmb3IgdXNpbmcgV2ViR0wuXG4vKiBlc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5LCBtYXgtc3RhdGVtZW50cyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdMQ29udGV4dCh7XG4gIC8vIE9wdGlvbmFsOiBTdXBwbHkgaGVhZGxlc3MgY29udGV4dCBjcmVhdG9yXG4gIC8vIERvbmUgbGlrZSB0aGlzIHRvIGF2b2lkIGhhcmQgZGVwZW5kZW5jeSBvbiBoZWFkbGVzcy1nbFxuICBoZWFkbGVzc0dMID0gbnVsbCxcbiAgLy8gRm9yY2UgaGVhZGxlc3Mgb24vb2ZmXG4gIGhlYWRsZXNzLFxuICAvLyBCUk9XU0VSIENPTlRFWFQgUEFSQU1BVEVSUzogY2FudmFzIGlzIG9ubHkgdXNlZCB3aGVuIGluIGJyb3dzZXJcbiAgY2FudmFzLFxuICAvLyBIRUFETEVTUyBDT05URVhUIFBBUkFNRVRFUlM6IHdpZHRoIGFyZSBoZWlnaHQgYXJlIG9ubHkgdXNlZCBieSBoZWFkbGVzcyBnbFxuICB3aWR0aCA9IDgwMCxcbiAgaGVpZ2h0ID0gNjAwLFxuICAvLyBDT01NT04gQ09OVEVYVCBQQVJBTUVURVJTXG4gIC8vIEF0dGVtcHQgdG8gYWxsb2NhdGUgV2ViR0wyIGNvbnRleHRcbiAgd2ViZ2wyID0gZmFsc2UsXG4gIC8vIEluc3RydW1lbnQgY29udGV4dCAoYXQgdGhlIGV4cGVuc2Ugb2YgcGVyZm9ybWFuY2UpXG4gIC8vIE5vdGU6IGRlZmF1bHRzIHRvIHRydWUgYW5kIG5lZWRzIHRvIGJlIGV4cGxpY2l0bHkgdHVybiBvZmZcbiAgZGVidWcgPSBmYWxzZSxcbiAgLy8gT3RoZXIgb3B0aW9ucyBhcmUgcGFzc2VkIHRocm91Z2ggdG8gY29udGV4dCBjcmVhdG9yXG4gIC4uLm9wdHNcbn0gPSB7fSkge1xuICBsZXQgZ2w7XG5cbiAgaWYgKCFpc0Jyb3dzZXIoKSkge1xuICAgIGhlYWRsZXNzR0wgPSBoZWFkbGVzc0dMIHx8IGdldEdsb2JhbCgpLmhlYWRsZXNzR0w7XG5cbiAgICAvLyBDcmVhdGUgaGVhZGxlc3MgZ2wgY29udGV4dFxuICAgIGlmICghaGVhZGxlc3NHTCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgQ2Fubm90IGNyZWF0ZSBoZWFkbGVzcyBXZWJHTCBjb250ZXh0LCBoZWFkbGVzc0dMIG5vdCBhdmFpbGFibGVgKTtcbiAgICB9XG4gICAgZ2wgPSBoZWFkbGVzc0dMKHdpZHRoLCBoZWlnaHQsIG9wdHMpO1xuICAgIGlmICghZ2wpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaGVhZGxlc3NHTCBmYWlsZWQgdG8gY3JlYXRlIGhlYWRsZXNzIFdlYkdMIGNvbnRleHQnKTtcbiAgICB9XG5cbiAgfSBlbHNlIHtcblxuICAgIC8vIENyZWF0ZSBicm93c2VyIGdsIGNvbnRleHRcbiAgICBjYW52YXMgPSB0eXBlb2YgY2FudmFzID09PSAnc3RyaW5nJyA/XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjYW52YXMpIDogY2FudmFzO1xuICAgIGlmICghY2FudmFzKSB7XG4gICAgICBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB9XG5cbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignd2ViZ2xjb250ZXh0Y3JlYXRpb25lcnJvcicsIGUgPT4ge1xuICAgICAgbG9nLmxvZygwLCBlLnN0YXR1c01lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InKTtcbiAgICB9LCBmYWxzZSk7XG5cbiAgICAvLyBQcmVmZXIgd2ViZ2wyIG92ZXIgd2ViZ2wxLCBwcmVmZXIgY29uZm9ybWFudCBvdmVyIGV4cGVyaW1lbnRhbFxuICAgIGlmICh3ZWJnbDIpIHtcbiAgICAgIGdsID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsMicsIG9wdHMpO1xuICAgICAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsMicsIG9wdHMpO1xuICAgIH1cbiAgICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcsIG9wdHMpO1xuICAgIGdsID0gZ2wgfHwgY2FudmFzLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcsIG9wdHMpO1xuXG4gICAgYXNzZXJ0KGdsLCAnRmFpbGVkIHRvIGNyZWF0ZSBXZWJHTFJlbmRlcmluZ0NvbnRleHQnKTtcbiAgfVxuXG4gIGlmIChpc0Jyb3dzZXIoKSAmJiBkZWJ1Zykge1xuICAgIGNvbnN0IGRlYnVnR0wgPVxuICAgICAgV2ViR0xEZWJ1Zy5tYWtlRGVidWdDb250ZXh0KGdsLCB0aHJvd09uRXJyb3IsIHZhbGlkYXRlQXJnc0FuZExvZyk7XG4gICAgY2xhc3MgV2ViR0xEZWJ1Z0NvbnRleHQge31cbiAgICBPYmplY3QuYXNzaWduKFdlYkdMRGVidWdDb250ZXh0LnByb3RvdHlwZSwgZGVidWdHTCk7XG4gICAgZ2wgPSBkZWJ1Z0dMO1xuICAgIGdsLmRlYnVnID0gdHJ1ZTtcbiAgICBsb2cucHJpb3JpdHkgPSBsb2cucHJpb3JpdHkgPCAxID8gMSA6IGxvZy5wcmlvcml0eTtcblxuICAgIGxvZ0luZm8oZ2wpO1xuXG4gICAgbG9nLmxvZygwLFxuICAgICAgJ0NoYW5nZSBsdW1hTG9nLnByaW9yaXR5IGluIGNvbnNvbGUgdG8gY29udHJvbCBsb2dnaW5nICgwLTMsIGRlZmF1bHQgMSknKTtcbiAgICBsb2cubG9nKDAsXG4gICAgICAnU2V0IGx1bWFMb2cuYnJlYWsgdG8gYXJyYXkgb2YgbWF0Y2hpbmcgc3RyaW5ncyB0byBicmVhayBvbiBnbCBsb2dzJyk7XG4gIH1cblxuICByZXR1cm4gZ2w7XG59XG5cbmZ1bmN0aW9uIGxvZ0luZm8oZ2wpIHtcbiAgY29uc3Qgd2ViR0wgPSBpc1dlYkdMMlJlbmRlcmluZ0NvbnRleHQoZ2wpID8gJ1dlYkdMMicgOiAnV2ViR0wxJztcbiAgY29uc3QgaW5mbyA9IGdsR2V0RGVidWdJbmZvKGdsKTtcbiAgY29uc3QgZHJpdmVyID0gaW5mbyA/IGB1c2luZyBkcml2ZXI6ICR7aW5mby52ZW5kb3J9ICR7aW5mby5yZW5kZXJlcn1gIDogYGA7XG4gIGNvbnN0IGRlYnVnID0gZ2wuZGVidWcgPyAnZGVidWcnIDogJyc7XG4gIGxvZy5sb2coMCwgYCR7d2ViR0x9ICR7ZGVidWd9IGNvbnRleHQgY3JlYXRlZCAke2RyaXZlcn1gLCBnbCk7XG5cbiAgLy8gY29uc3QgZXh0ZW5zaW9ucyA9IGdsLmdldFN1cHBvcnRlZEV4dGVuc2lvbnMoKTtcbiAgLy8gbG9nLmxvZygwLCBgU3VwcG9ydGVkIGV4dGVuc2lvbnM6IFske2V4dGVuc2lvbnMuam9pbignLCAnKX1dYCk7XG59XG5cbi8vIGFsZXJ0KFdlYkdMRGVidWdVdGlscy5nbEVudW1Ub1N0cmluZyhjdHguZ2V0RXJyb3IoKSkpO1xuXG4vLyBSZXNvbHZlIGEgV2ViR0wgZW51bWVyYXRpb24gbmFtZSAocmV0dXJucyBpdHNlbGYgaWYgYWxyZWFkeSBhIG51bWJlcilcbmV4cG9ydCBmdW5jdGlvbiBnbEdldChnbCwgbmFtZSkge1xuICAvLyBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuXG4gIGxldCB2YWx1ZSA9IG5hbWU7XG4gIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWx1ZSA9IGdsW25hbWVdO1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkLCBgQWNjZXNzaW5nIGdsLiR7bmFtZX1gKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8vIFJldHVybnMgdGhlIGV4dGVuc2lvbiBvciB0aHJvd3MgYW4gZXJyb3JcbmV4cG9ydCBmdW5jdGlvbiBnZXRHTEV4dGVuc2lvbihnbCwgZXh0ZW5zaW9uTmFtZSkge1xuICAvLyBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuXG4gIGNvbnN0IEVSUk9SID0gJ0lsbGVnYWwgYXJnIHRvIGdldEV4dGVuc2lvbic7XG4gIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMUmVuZGVyaW5nQ29udGV4dCwgRVJST1IpO1xuICBhc3NlcnQodHlwZW9mIGV4dGVuc2lvbk5hbWUgPT09ICdzdHJpbmcnLCBFUlJPUik7XG4gIGNvbnN0IGV4dGVuc2lvbiA9IGdsLmdldEV4dGVuc2lvbihleHRlbnNpb25OYW1lKTtcbiAgYXNzZXJ0KGV4dGVuc2lvbiwgYCR7ZXh0ZW5zaW9uTmFtZX0gbm90IHN1cHBvcnRlZCFgKTtcbiAgcmV0dXJuIGV4dGVuc2lvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdsR2V0RGVidWdJbmZvKGdsKSB7XG4gIGNvbnN0IGluZm8gPSBnbC5nZXRFeHRlbnNpb24oJ1dFQkdMX2RlYnVnX3JlbmRlcmVyX2luZm8nKTtcbiAgLyogQXZvaWQgRmlyZWZveCBpc3N1ZXMgd2l0aCBkZWJ1ZyBjb250ZXh0IGFuZCBleHRlbnNpb25zICovXG4gIGlmIChpbmZvICYmIGluZm8uVU5NQVNLRURfVkVORE9SX1dFQkdMICYmIGluZm8uVU5NQVNLRURfUkVOREVSRVJfV0VCR0wpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdmVuZG9yOiBnbC5nZXRQYXJhbWV0ZXIoaW5mby5VTk1BU0tFRF9WRU5ET1JfV0VCR0wpLFxuICAgICAgcmVuZGVyZXI6IGdsLmdldFBhcmFtZXRlcihpbmZvLlVOTUFTS0VEX1JFTkRFUkVSX1dFQkdMKVxuICAgIH07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8vIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2l0aCBnbCBzdGF0ZXMgdGVtcG9yYXJpbHkgc2V0LCBleGNlcHRpb24gc2FmZVxuLy8gQ3VycmVudGx5IHN1cHBvcnQgc2Npc3NvciB0ZXN0IGFuZCBmcmFtZWJ1ZmZlciBiaW5kaW5nXG5leHBvcnQgZnVuY3Rpb24gZ2xDb250ZXh0V2l0aFN0YXRlKGdsLCB7c2Npc3NvclRlc3QsIGZyYW1lQnVmZmVyfSwgZnVuYykge1xuICAvLyBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuXG4gIGxldCBzY2lzc29yVGVzdFdhc0VuYWJsZWQ7XG4gIGlmIChzY2lzc29yVGVzdCkge1xuICAgIHNjaXNzb3JUZXN0V2FzRW5hYmxlZCA9IGdsLmlzRW5hYmxlZChnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGNvbnN0IHt4LCB5LCB3LCBofSA9IHNjaXNzb3JUZXN0O1xuICAgIGdsLmVuYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGdsLnNjaXNzb3IoeCwgeSwgdywgaCk7XG4gIH1cblxuICBpZiAoZnJhbWVCdWZmZXIpIHtcbiAgICAvLyBUT0RPIC0gd2FzIHRoZXJlIGFueSBwcmV2aW91c2x5IHNldCBmcmFtZSBidWZmZXIgd2UgbmVlZCB0byByZW1lbWJlcj9cbiAgICBmcmFtZUJ1ZmZlci5iaW5kKCk7XG4gIH1cblxuICB0cnkge1xuICAgIGZ1bmMoZ2wpO1xuICB9IGZpbmFsbHkge1xuICAgIGlmICghc2Npc3NvclRlc3RXYXNFbmFibGVkKSB7XG4gICAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgfVxuICAgIGlmIChmcmFtZUJ1ZmZlcikge1xuICAgICAgLy8gVE9ETyAtIHdhcyB0aGVyZSBhbnkgcHJldmlvdXNseSBzZXQgZnJhbWUgYnVmZmVyP1xuICAgICAgLy8gVE9ETyAtIGRlbGVnYXRlIFwidW5iaW5kXCIgdG8gRnJhbWVidWZmZXIgb2JqZWN0P1xuICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0RnVuY3Rpb25TdHJpbmcoZnVuY3Rpb25OYW1lLCBmdW5jdGlvbkFyZ3MpIHtcbiAgbGV0IGFyZ3MgPSBXZWJHTERlYnVnLmdsRnVuY3Rpb25BcmdzVG9TdHJpbmcoZnVuY3Rpb25OYW1lLCBmdW5jdGlvbkFyZ3MpO1xuICBhcmdzID0gYCR7YXJncy5zbGljZSgwLCAxMDApfSR7YXJncy5sZW5ndGggPiAxMDAgPyAnLi4uJyA6ICcnfWA7XG4gIHJldHVybiBgZ2wuJHtmdW5jdGlvbk5hbWV9KCR7YXJnc30pYDtcbn1cblxuZnVuY3Rpb24gdGhyb3dPbkVycm9yKGVyciwgZnVuY3Rpb25OYW1lLCBhcmdzKSB7XG4gIGNvbnN0IGVycm9yTWVzc2FnZSA9IFdlYkdMRGVidWcuZ2xFbnVtVG9TdHJpbmcoZXJyKTtcbiAgY29uc3QgZnVuY3Rpb25BcmdzID0gV2ViR0xEZWJ1Zy5nbEZ1bmN0aW9uQXJnc1RvU3RyaW5nKGZ1bmN0aW9uTmFtZSwgYXJncyk7XG4gIHRocm93IG5ldyBFcnJvcihgJHtlcnJvck1lc3NhZ2V9IHdhcyBjYXVzZWQgYnkgY2FsbCB0bzogYCArXG4gICAgYGdsLiR7ZnVuY3Rpb25OYW1lfSgke2Z1bmN0aW9uQXJnc30pYCk7XG59XG5cbi8vIERvbid0IGdlbmVyYXRlIGZ1bmN0aW9uIHN0cmluZyB1bnRpbCBpdCBpcyBuZWVkZWRcbmZ1bmN0aW9uIHZhbGlkYXRlQXJnc0FuZExvZyhmdW5jdGlvbk5hbWUsIGZ1bmN0aW9uQXJncykge1xuICBsZXQgZnVuY3Rpb25TdHJpbmc7XG4gIGlmIChsb2cucHJpb3JpdHkgPj0gMykge1xuICAgIGZ1bmN0aW9uU3RyaW5nID0gZ2V0RnVuY3Rpb25TdHJpbmcoZnVuY3Rpb25OYW1lLCBmdW5jdGlvbkFyZ3MpO1xuICAgIGxvZy5pbmZvKDMsIGAke2Z1bmN0aW9uU3RyaW5nfWApO1xuICB9XG5cbiAgZm9yIChjb25zdCBhcmcgb2YgZnVuY3Rpb25BcmdzKSB7XG4gICAgaWYgKGFyZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBmdW5jdGlvblN0cmluZyA9IGZ1bmN0aW9uU3RyaW5nIHx8XG4gICAgICAgIGdldEZ1bmN0aW9uU3RyaW5nKGZ1bmN0aW9uTmFtZSwgZnVuY3Rpb25BcmdzKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5kZWZpbmVkIGFyZ3VtZW50OiAke2Z1bmN0aW9uU3RyaW5nfWApO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGJyZWFrcyA9IGxvZy5icmVhaztcbiAgaWYgKGxvZy5icmVhaykge1xuICAgIGZ1bmN0aW9uU3RyaW5nID0gZnVuY3Rpb25TdHJpbmcgfHxcbiAgICAgIGdldEZ1bmN0aW9uU3RyaW5nKGZ1bmN0aW9uTmFtZSwgZnVuY3Rpb25BcmdzKTtcbiAgICBjb25zdCBpc0JyZWFrcG9pbnQgPSBsb2cuYnJlYWsgJiYgbG9nLmJyZWFrLmV2ZXJ5KFxuICAgICAgYnJlYWtTdHJpbmcgPT4gZnVuY3Rpb25TdHJpbmcuaW5kZXhPZihicmVha1N0cmluZykgIT09IC0xXG4gICAgKTtcblxuICAgIGlmIChpc0JyZWFrcG9pbnQpIHtcbiAgICAgIGRlYnVnZ2VyO1xuICAgIH1cbiAgfVxufVxuXG4vLyBSZXR1cm5zIGFuIEVycm9yIHJlcHJlc2VudGluZyB0aGUgTGF0ZXN0IHdlYkdsIGVycm9yIG9yIG51bGxcbmV4cG9ydCBmdW5jdGlvbiBnbEdldEVycm9yKGdsKSB7XG4gIC8vIExvb3AgdG8gZW5zdXJlIGFsbCBlcnJvcnMgYXJlIGNsZWFyZWRcbiAgY29uc3QgZXJyb3JTdGFjayA9IFtdO1xuICBsZXQgZ2xFcnJvciA9IGdsLmdldEVycm9yKCk7XG4gIHdoaWxlIChnbEVycm9yICE9PSBnbC5OT19FUlJPUikge1xuICAgIGVycm9yU3RhY2sucHVzaChnbEdldEVycm9yTWVzc2FnZShnbCwgZ2xFcnJvcikpO1xuICAgIGdsRXJyb3IgPSBnbC5nZXRFcnJvcigpO1xuICB9XG4gIHJldHVybiBlcnJvclN0YWNrLmxlbmd0aCA/IG5ldyBFcnJvcihlcnJvclN0YWNrLmpvaW4oJ1xcbicpKSA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnbENoZWNrRXJyb3IoZ2wpIHtcbiAgaWYgKGdsLmRlYnVnKSB7XG4gICAgY29uc3QgZXJyb3IgPSBnbEdldEVycm9yKGdsKTtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnbEdldEVycm9yTWVzc2FnZShnbCwgZ2xFcnJvcikge1xuICBzd2l0Y2ggKGdsRXJyb3IpIHtcbiAgY2FzZSBnbC5DT05URVhUX0xPU1RfV0VCR0w6XG4gICAgLy8gIElmIHRoZSBXZWJHTCBjb250ZXh0IGlzIGxvc3QsIHRoaXMgZXJyb3IgaXMgcmV0dXJuZWQgb24gdGhlXG4gICAgLy8gZmlyc3QgY2FsbCB0byBnZXRFcnJvci4gQWZ0ZXJ3YXJkcyBhbmQgdW50aWwgdGhlIGNvbnRleHQgaGFzIGJlZW5cbiAgICAvLyByZXN0b3JlZCwgaXQgcmV0dXJucyBnbC5OT19FUlJPUi5cbiAgICByZXR1cm4gJ1dlYkdMIGNvbnRleHQgbG9zdCc7XG4gIGNhc2UgZ2wuSU5WQUxJRF9FTlVNOlxuICAgIC8vIEFuIHVuYWNjZXB0YWJsZSB2YWx1ZSBoYXMgYmVlbiBzcGVjaWZpZWQgZm9yIGFuIGVudW1lcmF0ZWQgYXJndW1lbnQuXG4gICAgcmV0dXJuICdXZWJHTCBpbnZhbGlkIGVudW1lcmF0ZWQgYXJndW1lbnQnO1xuICBjYXNlIGdsLklOVkFMSURfVkFMVUU6XG4gICAgLy8gQSBudW1lcmljIGFyZ3VtZW50IGlzIG91dCBvZiByYW5nZS5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgdmFsdWUnO1xuICBjYXNlIGdsLklOVkFMSURfT1BFUkFUSU9OOlxuICAgIC8vIFRoZSBzcGVjaWZpZWQgY29tbWFuZCBpcyBub3QgYWxsb3dlZCBmb3IgdGhlIGN1cnJlbnQgc3RhdGUuXG4gICAgcmV0dXJuICdXZWJHTCBpbnZhbGlkIG9wZXJhdGlvbic7XG4gIGNhc2UgZ2wuSU5WQUxJRF9GUkFNRUJVRkZFUl9PUEVSQVRJT046XG4gICAgLy8gVGhlIGN1cnJlbnRseSBib3VuZCBmcmFtZWJ1ZmZlciBpcyBub3QgZnJhbWVidWZmZXIgY29tcGxldGVcbiAgICAvLyB3aGVuIHRyeWluZyB0byByZW5kZXIgdG8gb3IgdG8gcmVhZCBmcm9tIGl0LlxuICAgIHJldHVybiAnV2ViR0wgaW52YWxpZCBmcmFtZWJ1ZmZlciBvcGVyYXRpb24nO1xuICBjYXNlIGdsLk9VVF9PRl9NRU1PUlk6XG4gICAgLy8gTm90IGVub3VnaCBtZW1vcnkgaXMgbGVmdCB0byBleGVjdXRlIHRoZSBjb21tYW5kLlxuICAgIHJldHVybiAnV2ViR0wgb3V0IG9mIG1lbW9yeSc7XG4gIGRlZmF1bHQ6XG4gICAgcmV0dXJuIGBXZWJHTCB1bmtub3duIGVycm9yICR7Z2xFcnJvcn1gO1xuICB9XG59XG5cbi8vIERlcHJlY2F0ZWQgbWV0aG9kc1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uKGdsLCBleHRlbnNpb25OYW1lKSB7XG4gIGxvZy53YXJuKDAsICdsdW1hLmdsOiBnZXRFeHRlbnNpb24gaXMgZGVwcmVjYXRlZCcpO1xuICByZXR1cm4gZ2V0R0xFeHRlbnNpb24oZ2wsIGV4dGVuc2lvbk5hbWUpO1xufVxuIl19