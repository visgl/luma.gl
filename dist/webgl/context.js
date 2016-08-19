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
  var headlessGL = _ref$headlessGL === undefined ? null : _ref$headlessGL;
  var headless = _ref.headless;
  var canvas = _ref.canvas;
  var _ref$width = _ref.width;
  var width = _ref$width === undefined ? 800 : _ref$width;
  var _ref$height = _ref.height;
  var height = _ref$height === undefined ? 600 : _ref$height;
  var _ref$webgl = _ref.webgl2;
  var webgl2 = _ref$webgl === undefined ? false : _ref$webgl;
  var _ref$debug = _ref.debug;
  var debug = _ref$debug === undefined ? true : _ref$debug;

  var opts = _objectWithoutProperties(_ref, ['headlessGL', 'headless', 'canvas', 'width', 'height', 'webgl2', 'debug']);

  var gl = void 0;

  if (!(0, _utils.isBrowser)()) {
    headlessGL = headlessGL || _utils.lumaGlobals.headlessGL;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9jb250ZXh0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O1FBV2dCLGUsR0FBQSxlO1FBNkZBLEssR0FBQSxLO1FBWUEsYyxHQUFBLGM7UUFXQSxjLEdBQUEsYztRQWNBLGtCLEdBQUEsa0I7UUEwRUEsVSxHQUFBLFU7UUFXQSxZLEdBQUEsWTtRQXVDQSxZLEdBQUEsWTs7QUF2UWhCOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7Ozs7OzZOQU5BO0FBQ0E7OztBQU1BOztBQUVBO0FBQ0E7QUFDTyxTQUFTLGVBQVQsR0FtQkM7QUFBQSxtRUFBSixFQUFJOztBQUFBLDZCQWhCTixVQWdCTTtBQUFBLE1BaEJOLFVBZ0JNLG1DQWhCTyxJQWdCUDtBQUFBLE1BZE4sUUFjTSxRQWROLFFBY007QUFBQSxNQVpOLE1BWU0sUUFaTixNQVlNO0FBQUEsd0JBVk4sS0FVTTtBQUFBLE1BVk4sS0FVTSw4QkFWRSxHQVVGO0FBQUEseUJBVE4sTUFTTTtBQUFBLE1BVE4sTUFTTSwrQkFURyxHQVNIO0FBQUEsd0JBTk4sTUFNTTtBQUFBLE1BTk4sTUFNTSw4QkFORyxLQU1IO0FBQUEsd0JBSE4sS0FHTTtBQUFBLE1BSE4sS0FHTSw4QkFIRSxJQUdGOztBQUFBLE1BREgsSUFDRzs7QUFDTixNQUFJLFdBQUo7O0FBRUEsTUFBSSxDQUFDLHVCQUFMLEVBQWtCO0FBQ2hCLGlCQUFhLGNBQWMsbUJBQVksVUFBdkM7O0FBRUE7QUFDQSxRQUFJLENBQUMsVUFBTCxFQUFpQjtBQUNmLFlBQU0sSUFBSSxLQUFKLGtFQUFOO0FBRUQ7QUFDRCxTQUFLLFdBQVcsS0FBWCxFQUFrQixNQUFsQixFQUEwQixJQUExQixDQUFMO0FBQ0EsUUFBSSxDQUFDLEVBQUwsRUFBUztBQUNQLFlBQU0sSUFBSSxLQUFKLENBQVUsb0RBQVYsQ0FBTjtBQUNEO0FBRUYsR0FiRCxNQWFPOztBQUVMO0FBQ0EsYUFBUyxPQUFPLE1BQVAsS0FBa0IsUUFBbEIsR0FDUCxT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O0FBQ0YsU0FBSyxHQUFHLGFBQVI7QUFDRTtBQUNBLGFBQU8scUJBQVA7QUFDRjtBQUNFLHNDQUE4QixPQUE5QjtBQXZCRjtBQXlCRDs7QUFFRDs7QUFFTyxTQUFTLFlBQVQsQ0FBc0IsRUFBdEIsRUFBMEIsYUFBMUIsRUFBeUM7QUFDOUMsYUFBSSxJQUFKLENBQVMsQ0FBVCxFQUFZLHFDQUFaO0FBQ0EsU0FBTyxlQUFlLEVBQWYsRUFBbUIsYUFBbkIsQ0FBUDtBQUNEIiwiZmlsZSI6ImNvbnRleHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgcmVsYXRlZCBtZXRob2RzXG4vKiBlc2xpbnQtZGlzYWJsZSBuby10cnktY2F0Y2gsIG5vLWxvb3AtZnVuYyAqL1xuaW1wb3J0IFdlYkdMRGVidWcgZnJvbSAnd2ViZ2wtZGVidWcnO1xuaW1wb3J0IHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHtpc1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtY2hlY2tzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7bG9nLCBpc0Jyb3dzZXIsIGx1bWFHbG9iYWxzfSBmcm9tICcuLi91dGlscyc7XG4vKiBnbG9iYWwgZG9jdW1lbnQgKi9cblxuLy8gQ2hlY2tzIGlmIFdlYkdMIGlzIGVuYWJsZWQgYW5kIGNyZWF0ZXMgYSBjb250ZXh0IGZvciB1c2luZyBXZWJHTC5cbi8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHksIG1heC1zdGF0ZW1lbnRzICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlR0xDb250ZXh0KHtcbiAgLy8gT3B0aW9uYWw6IFN1cHBseSBoZWFkbGVzcyBjb250ZXh0IGNyZWF0b3JcbiAgLy8gRG9uZSBsaWtlIHRoaXMgdG8gYXZvaWQgaGFyZCBkZXBlbmRlbmN5IG9uIGhlYWRsZXNzLWdsXG4gIGhlYWRsZXNzR0wgPSBudWxsLFxuICAvLyBGb3JjZSBoZWFkbGVzcyBvbi9vZmZcbiAgaGVhZGxlc3MsXG4gIC8vIEJST1dTRVIgQ09OVEVYVCBQQVJBTUFURVJTOiBjYW52YXMgaXMgb25seSB1c2VkIHdoZW4gaW4gYnJvd3NlclxuICBjYW52YXMsXG4gIC8vIEhFQURMRVNTIENPTlRFWFQgUEFSQU1FVEVSUzogd2lkdGggYXJlIGhlaWdodCBhcmUgb25seSB1c2VkIGJ5IGhlYWRsZXNzIGdsXG4gIHdpZHRoID0gODAwLFxuICBoZWlnaHQgPSA2MDAsXG4gIC8vIENPTU1PTiBDT05URVhUIFBBUkFNRVRFUlNcbiAgLy8gQXR0ZW1wdCB0byBhbGxvY2F0ZSBXZWJHTDIgY29udGV4dFxuICB3ZWJnbDIgPSBmYWxzZSxcbiAgLy8gSW5zdHJ1bWVudCBjb250ZXh0IChhdCB0aGUgZXhwZW5zZSBvZiBwZXJmb3JtYW5jZSlcbiAgLy8gTm90ZTogZGVmYXVsdHMgdG8gdHJ1ZSBhbmQgbmVlZHMgdG8gYmUgZXhwbGljaXRseSB0dXJuIG9mZlxuICBkZWJ1ZyA9IHRydWUsXG4gIC8vIE90aGVyIG9wdGlvbnMgYXJlIHBhc3NlZCB0aHJvdWdoIHRvIGNvbnRleHQgY3JlYXRvclxuICAuLi5vcHRzXG59ID0ge30pIHtcbiAgbGV0IGdsO1xuXG4gIGlmICghaXNCcm93c2VyKCkpIHtcbiAgICBoZWFkbGVzc0dMID0gaGVhZGxlc3NHTCB8fCBsdW1hR2xvYmFscy5oZWFkbGVzc0dMO1xuXG4gICAgLy8gQ3JlYXRlIGhlYWRsZXNzIGdsIGNvbnRleHRcbiAgICBpZiAoIWhlYWRsZXNzR0wpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYENhbm5vdCBjcmVhdGUgaGVhZGxlc3MgV2ViR0wgY29udGV4dCwgaGVhZGxlc3NHTCBub3QgYXZhaWxhYmxlYCk7XG4gICAgfVxuICAgIGdsID0gaGVhZGxlc3NHTCh3aWR0aCwgaGVpZ2h0LCBvcHRzKTtcbiAgICBpZiAoIWdsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2hlYWRsZXNzR0wgZmFpbGVkIHRvIGNyZWF0ZSBoZWFkbGVzcyBXZWJHTCBjb250ZXh0Jyk7XG4gICAgfVxuXG4gIH0gZWxzZSB7XG5cbiAgICAvLyBDcmVhdGUgYnJvd3NlciBnbCBjb250ZXh0XG4gICAgY2FudmFzID0gdHlwZW9mIGNhbnZhcyA9PT0gJ3N0cmluZycgP1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY2FudmFzKSA6IGNhbnZhcztcbiAgICBpZiAoIWNhbnZhcykge1xuICAgICAgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgfVxuXG4gICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmdsY29udGV4dGNyZWF0aW9uZXJyb3InLCBlID0+IHtcbiAgICAgIGxvZy5sb2coMCwgZS5zdGF0dXNNZXNzYWdlIHx8ICdVbmtub3duIGVycm9yJyk7XG4gICAgfSwgZmFsc2UpO1xuXG4gICAgLy8gUHJlZmVyIHdlYmdsMiBvdmVyIHdlYmdsMSwgcHJlZmVyIGNvbmZvcm1hbnQgb3ZlciBleHBlcmltZW50YWxcbiAgICBpZiAod2ViZ2wyKSB7XG4gICAgICBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbDInLCBvcHRzKTtcbiAgICAgIGdsID0gZ2wgfHwgY2FudmFzLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbDInLCBvcHRzKTtcbiAgICB9XG4gICAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnLCBvcHRzKTtcbiAgICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnLCBvcHRzKTtcblxuICAgIGFzc2VydChnbCwgJ0ZhaWxlZCB0byBjcmVhdGUgV2ViR0xSZW5kZXJpbmdDb250ZXh0Jyk7XG4gIH1cblxuICBpZiAoaXNCcm93c2VyKCkgJiYgZGVidWcpIHtcbiAgICBjb25zdCBkZWJ1Z0dMID1cbiAgICAgIFdlYkdMRGVidWcubWFrZURlYnVnQ29udGV4dChnbCwgdGhyb3dPbkVycm9yLCB2YWxpZGF0ZUFyZ3NBbmRMb2cpO1xuICAgIGNsYXNzIFdlYkdMRGVidWdDb250ZXh0IHt9XG4gICAgT2JqZWN0LmFzc2lnbihXZWJHTERlYnVnQ29udGV4dC5wcm90b3R5cGUsIGRlYnVnR0wpO1xuICAgIGdsID0gZGVidWdHTDtcbiAgICBnbC5kZWJ1ZyA9IHRydWU7XG4gICAgbG9nLnByaW9yaXR5ID0gbG9nLnByaW9yaXR5IDwgMSA/IDEgOiBsb2cucHJpb3JpdHk7XG5cbiAgICBsb2dJbmZvKGdsKTtcblxuICAgIGxvZy5sb2coMCxcbiAgICAgICdDaGFuZ2UgbHVtYUxvZy5wcmlvcml0eSBpbiBjb25zb2xlIHRvIGNvbnRyb2wgbG9nZ2luZyAoMC0zLCBkZWZhdWx0IDEpJyk7XG4gICAgbG9nLmxvZygwLFxuICAgICAgJ1NldCBsdW1hTG9nLmJyZWFrIHRvIGFycmF5IG9mIG1hdGNoaW5nIHN0cmluZ3MgdG8gYnJlYWsgb24gZ2wgbG9ncycpO1xuICB9XG5cbiAgcmV0dXJuIGdsO1xufVxuXG5mdW5jdGlvbiBsb2dJbmZvKGdsKSB7XG4gIGNvbnN0IHdlYkdMID0gaXNXZWJHTDJSZW5kZXJpbmdDb250ZXh0KGdsKSA/ICdXZWJHTDInIDogJ1dlYkdMMSc7XG4gIGNvbnN0IGluZm8gPSBnbEdldERlYnVnSW5mbyhnbCk7XG4gIGNvbnN0IGRyaXZlciA9IGluZm8gPyBgdXNpbmcgZHJpdmVyOiAke2luZm8udmVuZG9yfSAke2luZm8ucmVuZGVyZXJ9YCA6IGBgO1xuICBjb25zdCBkZWJ1ZyA9IGdsLmRlYnVnID8gJ2RlYnVnJyA6ICcnO1xuICBsb2cubG9nKDAsIGAke3dlYkdMfSAke2RlYnVnfSBjb250ZXh0IGNyZWF0ZWQgJHtkcml2ZXJ9YCwgZ2wpO1xuXG4gIC8vIGNvbnN0IGV4dGVuc2lvbnMgPSBnbC5nZXRTdXBwb3J0ZWRFeHRlbnNpb25zKCk7XG4gIC8vIGxvZy5sb2coMCwgYFN1cHBvcnRlZCBleHRlbnNpb25zOiBbJHtleHRlbnNpb25zLmpvaW4oJywgJyl9XWApO1xufVxuXG4vLyBhbGVydChXZWJHTERlYnVnVXRpbHMuZ2xFbnVtVG9TdHJpbmcoY3R4LmdldEVycm9yKCkpKTtcblxuLy8gUmVzb2x2ZSBhIFdlYkdMIGVudW1lcmF0aW9uIG5hbWUgKHJldHVybnMgaXRzZWxmIGlmIGFscmVhZHkgYSBudW1iZXIpXG5leHBvcnQgZnVuY3Rpb24gZ2xHZXQoZ2wsIG5hbWUpIHtcbiAgLy8gYXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0KGdsKTtcblxuICBsZXQgdmFsdWUgPSBuYW1lO1xuICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsdWUgPSBnbFtuYW1lXTtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCwgYEFjY2Vzc2luZyBnbC4ke25hbWV9YCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vLyBSZXR1cm5zIHRoZSBleHRlbnNpb24gb3IgdGhyb3dzIGFuIGVycm9yXG5leHBvcnQgZnVuY3Rpb24gZ2V0R0xFeHRlbnNpb24oZ2wsIGV4dGVuc2lvbk5hbWUpIHtcbiAgLy8gYXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0KGdsKTtcblxuICBjb25zdCBFUlJPUiA9ICdJbGxlZ2FsIGFyZyB0byBnZXRFeHRlbnNpb24nO1xuICBhc3NlcnQoZ2wgaW5zdGFuY2VvZiBXZWJHTFJlbmRlcmluZ0NvbnRleHQsIEVSUk9SKTtcbiAgYXNzZXJ0KHR5cGVvZiBleHRlbnNpb25OYW1lID09PSAnc3RyaW5nJywgRVJST1IpO1xuICBjb25zdCBleHRlbnNpb24gPSBnbC5nZXRFeHRlbnNpb24oZXh0ZW5zaW9uTmFtZSk7XG4gIGFzc2VydChleHRlbnNpb24sIGAke2V4dGVuc2lvbk5hbWV9IG5vdCBzdXBwb3J0ZWQhYCk7XG4gIHJldHVybiBleHRlbnNpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnbEdldERlYnVnSW5mbyhnbCkge1xuICBjb25zdCBpbmZvID0gZ2wuZ2V0RXh0ZW5zaW9uKCdXRUJHTF9kZWJ1Z19yZW5kZXJlcl9pbmZvJyk7XG4gIC8qIEF2b2lkIEZpcmVmb3ggaXNzdWVzIHdpdGggZGVidWcgY29udGV4dCBhbmQgZXh0ZW5zaW9ucyAqL1xuICBpZiAoaW5mbyAmJiBpbmZvLlVOTUFTS0VEX1ZFTkRPUl9XRUJHTCAmJiBpbmZvLlVOTUFTS0VEX1JFTkRFUkVSX1dFQkdMKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHZlbmRvcjogZ2wuZ2V0UGFyYW1ldGVyKGluZm8uVU5NQVNLRURfVkVORE9SX1dFQkdMKSxcbiAgICAgIHJlbmRlcmVyOiBnbC5nZXRQYXJhbWV0ZXIoaW5mby5VTk1BU0tFRF9SRU5ERVJFUl9XRUJHTClcbiAgICB9O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vLyBFeGVjdXRlcyBhIGZ1bmN0aW9uIHdpdGggZ2wgc3RhdGVzIHRlbXBvcmFyaWx5IHNldCwgZXhjZXB0aW9uIHNhZmVcbi8vIEN1cnJlbnRseSBzdXBwb3J0IHNjaXNzb3IgdGVzdCBhbmQgZnJhbWVidWZmZXIgYmluZGluZ1xuZXhwb3J0IGZ1bmN0aW9uIGdsQ29udGV4dFdpdGhTdGF0ZShnbCwge3NjaXNzb3JUZXN0LCBmcmFtZUJ1ZmZlcn0sIGZ1bmMpIHtcbiAgLy8gYXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0KGdsKTtcblxuICBsZXQgc2Npc3NvclRlc3RXYXNFbmFibGVkO1xuICBpZiAoc2Npc3NvclRlc3QpIHtcbiAgICBzY2lzc29yVGVzdFdhc0VuYWJsZWQgPSBnbC5pc0VuYWJsZWQoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBjb25zdCB7eCwgeSwgdywgaH0gPSBzY2lzc29yVGVzdDtcbiAgICBnbC5lbmFibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5zY2lzc29yKHgsIHksIHcsIGgpO1xuICB9XG5cbiAgaWYgKGZyYW1lQnVmZmVyKSB7XG4gICAgLy8gVE9ETyAtIHdhcyB0aGVyZSBhbnkgcHJldmlvdXNseSBzZXQgZnJhbWUgYnVmZmVyIHdlIG5lZWQgdG8gcmVtZW1iZXI/XG4gICAgZnJhbWVCdWZmZXIuYmluZCgpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBmdW5jKGdsKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoIXNjaXNzb3JUZXN0V2FzRW5hYmxlZCkge1xuICAgICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIH1cbiAgICBpZiAoZnJhbWVCdWZmZXIpIHtcbiAgICAgIC8vIFRPRE8gLSB3YXMgdGhlcmUgYW55IHByZXZpb3VzbHkgc2V0IGZyYW1lIGJ1ZmZlcj9cbiAgICAgIC8vIFRPRE8gLSBkZWxlZ2F0ZSBcInVuYmluZFwiIHRvIEZyYW1lYnVmZmVyIG9iamVjdD9cbiAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldEZ1bmN0aW9uU3RyaW5nKGZ1bmN0aW9uTmFtZSwgZnVuY3Rpb25BcmdzKSB7XG4gIGxldCBhcmdzID0gV2ViR0xEZWJ1Zy5nbEZ1bmN0aW9uQXJnc1RvU3RyaW5nKGZ1bmN0aW9uTmFtZSwgZnVuY3Rpb25BcmdzKTtcbiAgYXJncyA9IGAke2FyZ3Muc2xpY2UoMCwgMTAwKX0ke2FyZ3MubGVuZ3RoID4gMTAwID8gJy4uLicgOiAnJ31gO1xuICByZXR1cm4gYGdsLiR7ZnVuY3Rpb25OYW1lfSgke2FyZ3N9KWA7XG59XG5cbmZ1bmN0aW9uIHRocm93T25FcnJvcihlcnIsIGZ1bmN0aW9uTmFtZSwgYXJncykge1xuICBjb25zdCBlcnJvck1lc3NhZ2UgPSBXZWJHTERlYnVnLmdsRW51bVRvU3RyaW5nKGVycik7XG4gIGNvbnN0IGZ1bmN0aW9uQXJncyA9IFdlYkdMRGVidWcuZ2xGdW5jdGlvbkFyZ3NUb1N0cmluZyhmdW5jdGlvbk5hbWUsIGFyZ3MpO1xuICB0aHJvdyBuZXcgRXJyb3IoYCR7ZXJyb3JNZXNzYWdlfSB3YXMgY2F1c2VkIGJ5IGNhbGwgdG86IGAgK1xuICAgIGBnbC4ke2Z1bmN0aW9uTmFtZX0oJHtmdW5jdGlvbkFyZ3N9KWApO1xufVxuXG4vLyBEb24ndCBnZW5lcmF0ZSBmdW5jdGlvbiBzdHJpbmcgdW50aWwgaXQgaXMgbmVlZGVkXG5mdW5jdGlvbiB2YWxpZGF0ZUFyZ3NBbmRMb2coZnVuY3Rpb25OYW1lLCBmdW5jdGlvbkFyZ3MpIHtcbiAgbGV0IGZ1bmN0aW9uU3RyaW5nO1xuICBpZiAobG9nLnByaW9yaXR5ID49IDMpIHtcbiAgICBmdW5jdGlvblN0cmluZyA9IGdldEZ1bmN0aW9uU3RyaW5nKGZ1bmN0aW9uTmFtZSwgZnVuY3Rpb25BcmdzKTtcbiAgICBsb2cuaW5mbygzLCBgJHtmdW5jdGlvblN0cmluZ31gKTtcbiAgfVxuXG4gIGZvciAoY29uc3QgYXJnIG9mIGZ1bmN0aW9uQXJncykge1xuICAgIGlmIChhcmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZnVuY3Rpb25TdHJpbmcgPSBmdW5jdGlvblN0cmluZyB8fFxuICAgICAgICBnZXRGdW5jdGlvblN0cmluZyhmdW5jdGlvbk5hbWUsIGZ1bmN0aW9uQXJncyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZGVmaW5lZCBhcmd1bWVudDogJHtmdW5jdGlvblN0cmluZ31gKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBicmVha3MgPSBsb2cuYnJlYWs7XG4gIGlmIChsb2cuYnJlYWspIHtcbiAgICBmdW5jdGlvblN0cmluZyA9IGZ1bmN0aW9uU3RyaW5nIHx8XG4gICAgICBnZXRGdW5jdGlvblN0cmluZyhmdW5jdGlvbk5hbWUsIGZ1bmN0aW9uQXJncyk7XG4gICAgY29uc3QgaXNCcmVha3BvaW50ID0gbG9nLmJyZWFrICYmIGxvZy5icmVhay5ldmVyeShcbiAgICAgIGJyZWFrU3RyaW5nID0+IGZ1bmN0aW9uU3RyaW5nLmluZGV4T2YoYnJlYWtTdHJpbmcpICE9PSAtMVxuICAgICk7XG5cbiAgICBpZiAoaXNCcmVha3BvaW50KSB7XG4gICAgICBkZWJ1Z2dlcjtcbiAgICB9XG4gIH1cbn1cblxuLy8gUmV0dXJucyBhbiBFcnJvciByZXByZXNlbnRpbmcgdGhlIExhdGVzdCB3ZWJHbCBlcnJvciBvciBudWxsXG5leHBvcnQgZnVuY3Rpb24gZ2xHZXRFcnJvcihnbCkge1xuICAvLyBMb29wIHRvIGVuc3VyZSBhbGwgZXJyb3JzIGFyZSBjbGVhcmVkXG4gIGNvbnN0IGVycm9yU3RhY2sgPSBbXTtcbiAgbGV0IGdsRXJyb3IgPSBnbC5nZXRFcnJvcigpO1xuICB3aGlsZSAoZ2xFcnJvciAhPT0gZ2wuTk9fRVJST1IpIHtcbiAgICBlcnJvclN0YWNrLnB1c2goZ2xHZXRFcnJvck1lc3NhZ2UoZ2wsIGdsRXJyb3IpKTtcbiAgICBnbEVycm9yID0gZ2wuZ2V0RXJyb3IoKTtcbiAgfVxuICByZXR1cm4gZXJyb3JTdGFjay5sZW5ndGggPyBuZXcgRXJyb3IoZXJyb3JTdGFjay5qb2luKCdcXG4nKSkgOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2xDaGVja0Vycm9yKGdsKSB7XG4gIGlmIChnbC5kZWJ1Zykge1xuICAgIGNvbnN0IGVycm9yID0gZ2xHZXRFcnJvcihnbCk7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2xHZXRFcnJvck1lc3NhZ2UoZ2wsIGdsRXJyb3IpIHtcbiAgc3dpdGNoIChnbEVycm9yKSB7XG4gIGNhc2UgZ2wuQ09OVEVYVF9MT1NUX1dFQkdMOlxuICAgIC8vICBJZiB0aGUgV2ViR0wgY29udGV4dCBpcyBsb3N0LCB0aGlzIGVycm9yIGlzIHJldHVybmVkIG9uIHRoZVxuICAgIC8vIGZpcnN0IGNhbGwgdG8gZ2V0RXJyb3IuIEFmdGVyd2FyZHMgYW5kIHVudGlsIHRoZSBjb250ZXh0IGhhcyBiZWVuXG4gICAgLy8gcmVzdG9yZWQsIGl0IHJldHVybnMgZ2wuTk9fRVJST1IuXG4gICAgcmV0dXJuICdXZWJHTCBjb250ZXh0IGxvc3QnO1xuICBjYXNlIGdsLklOVkFMSURfRU5VTTpcbiAgICAvLyBBbiB1bmFjY2VwdGFibGUgdmFsdWUgaGFzIGJlZW4gc3BlY2lmaWVkIGZvciBhbiBlbnVtZXJhdGVkIGFyZ3VtZW50LlxuICAgIHJldHVybiAnV2ViR0wgaW52YWxpZCBlbnVtZXJhdGVkIGFyZ3VtZW50JztcbiAgY2FzZSBnbC5JTlZBTElEX1ZBTFVFOlxuICAgIC8vIEEgbnVtZXJpYyBhcmd1bWVudCBpcyBvdXQgb2YgcmFuZ2UuXG4gICAgcmV0dXJuICdXZWJHTCBpbnZhbGlkIHZhbHVlJztcbiAgY2FzZSBnbC5JTlZBTElEX09QRVJBVElPTjpcbiAgICAvLyBUaGUgc3BlY2lmaWVkIGNvbW1hbmQgaXMgbm90IGFsbG93ZWQgZm9yIHRoZSBjdXJyZW50IHN0YXRlLlxuICAgIHJldHVybiAnV2ViR0wgaW52YWxpZCBvcGVyYXRpb24nO1xuICBjYXNlIGdsLklOVkFMSURfRlJBTUVCVUZGRVJfT1BFUkFUSU9OOlxuICAgIC8vIFRoZSBjdXJyZW50bHkgYm91bmQgZnJhbWVidWZmZXIgaXMgbm90IGZyYW1lYnVmZmVyIGNvbXBsZXRlXG4gICAgLy8gd2hlbiB0cnlpbmcgdG8gcmVuZGVyIHRvIG9yIHRvIHJlYWQgZnJvbSBpdC5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgZnJhbWVidWZmZXIgb3BlcmF0aW9uJztcbiAgY2FzZSBnbC5PVVRfT0ZfTUVNT1JZOlxuICAgIC8vIE5vdCBlbm91Z2ggbWVtb3J5IGlzIGxlZnQgdG8gZXhlY3V0ZSB0aGUgY29tbWFuZC5cbiAgICByZXR1cm4gJ1dlYkdMIG91dCBvZiBtZW1vcnknO1xuICBkZWZhdWx0OlxuICAgIHJldHVybiBgV2ViR0wgdW5rbm93biBlcnJvciAke2dsRXJyb3J9YDtcbiAgfVxufVxuXG4vLyBEZXByZWNhdGVkIG1ldGhvZHNcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEV4dGVuc2lvbihnbCwgZXh0ZW5zaW9uTmFtZSkge1xuICBsb2cud2FybigwLCAnbHVtYS5nbDogZ2V0RXh0ZW5zaW9uIGlzIGRlcHJlY2F0ZWQnKTtcbiAgcmV0dXJuIGdldEdMRXh0ZW5zaW9uKGdsLCBleHRlbnNpb25OYW1lKTtcbn1cbiJdfQ==