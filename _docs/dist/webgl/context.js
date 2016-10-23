'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createGLContext = createGLContext;
exports.glGet = glGet;
exports.getGLExtension = getGLExtension;
exports.poll = poll;
exports.glContextWithState = glContextWithState;
exports.glGetDebugInfo = glGetDebugInfo;
exports.glGetError = glGetError;
exports.glCheckError = glCheckError;
exports.getExtension = getExtension;

var _webglDebug = require('webgl-debug');

var _webglDebug2 = _interopRequireDefault(_webglDebug);

var _webglTypes = require('./webgl-types');

var _webglChecks = require('./webgl-checks');

var _queryManager = require('./helpers/query-manager');

var _queryManager2 = _interopRequireDefault(_queryManager);

var _utils = require('../utils');

var _globals = require('../globals');

var _globals2 = _interopRequireDefault(_globals);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; } // WebGLRenderingContext related methods
/* eslint-disable no-try-catch, no-loop-func */


/* global document */

var GL_UNMASKED_VENDOR_WEBGL = 0x9245;
var GL_UNMASKED_RENDERER_WEBGL = 0x9246;

var ERR_WEBGL_MISSING_BROWSER = 'WebGL API is missing. Check your if your browser supports WebGL or\ninstall a recent version of a major browser.';

var ERR_WEBGL_MISSING_NODE = 'WebGL API is missing. To run luma.gl under Node.js, please "npm install gl"\nand import \'luma.gl/headless\' before importing \'luma.gl\'.';

var ERR_HEADLESSGL_NOT_AVAILABLE = 'Cannot create headless WebGL context, headlessGL not available';

var ERR_HEADLESSGL_FAILED = 'headlessGL failed to create headless WebGL context';

var STARTUP_MESSAGE = 'Assign luma.log.priority in console to control logging: 0: none, 1: minimal, 2: verbose, 3: attribute/uniforms, 4: gl logs\nluma.log.break[], set to gl funcs, luma.log.profile[] set to model names';

// Checks if WebGL is enabled and creates a context for using WebGL.
/* eslint-disable complexity, max-statements */
function createGLContext() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var canvas = _ref.canvas;
  var _ref$width = _ref.width;
  var width = _ref$width === undefined ? 800 : _ref$width;
  var _ref$height = _ref.height;
  var height = _ref$height === undefined ? 600 : _ref$height;
  var _ref$webgl = _ref.webgl2;
  var webgl2 = _ref$webgl === undefined ? false : _ref$webgl;
  var _ref$debug = _ref.debug;
  var debug = _ref$debug === undefined ? true : _ref$debug;

  var opts = _objectWithoutProperties(_ref, ['canvas', 'width', 'height', 'webgl2', 'debug']);

  var gl = void 0;

  if (!_utils.isBrowser) {
    // Create headless gl context
    if (!_webglTypes.webGLTypesAvailable) {
      throw new Error(ERR_WEBGL_MISSING_NODE);
    }
    if (!_globals2.default.globals.headlessGL) {
      throw new Error(ERR_HEADLESSGL_NOT_AVAILABLE);
    }
    gl = _globals2.default.globals.headlessGL(width, height, opts);
    if (!gl) {
      throw new Error(ERR_HEADLESSGL_FAILED);
    }
  } else {
    // Create browser gl context
    if (!_webglTypes.webGLTypesAvailable) {
      throw new Error(ERR_WEBGL_MISSING_BROWSER);
    }
    // Make sure we have a canvas
    if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas);
    }
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

  if (_utils.isBrowser && debug) {
    var debugGL = _webglDebug2.default.makeDebugContext(gl, throwOnError, validateArgsAndLog);

    var WebGLDebugContext = function WebGLDebugContext() {
      _classCallCheck(this, WebGLDebugContext);
    };

    Object.assign(WebGLDebugContext.prototype, debugGL);
    gl = debugGL;
    gl.debug = true;
    _utils.log.priority = _utils.log.priority < 1 ? 1 : _utils.log.priority;

    logInfo(gl);

    _utils.log.log(0, STARTUP_MESSAGE);
  }

  return gl;
}

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

// POLLING FOR PENDING QUERIES

// Calling this function checks all pending queries for completion
function poll(gl) {
  (0, _webglChecks.assertWebGLRenderingContext)(gl);
  _queryManager2.default.poll(gl);
}

// VERY LIMITED / BASIC GL STATE MANAGEMENT

// Executes a function with gl states temporarily set, exception safe
// Currently support scissor test and framebuffer binding
function glContextWithState(gl, _ref2, func) {
  var scissorTest = _ref2.scissorTest;
  var framebuffer = _ref2.framebuffer;

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

  if (framebuffer) {
    // TODO - was there any previously set frame buffer we need to remember?
    framebuffer.bind();
  }

  var value = void 0;
  try {
    value = func(gl);
  } finally {
    if (!scissorTestWasEnabled) {
      gl.disable(gl.SCISSOR_TEST);
    }
    if (framebuffer) {
      // TODO - was there any previously set frame buffer?
      // TODO - delegate "unbind" to Framebuffer object?
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }

  return value;
}

// DEBUG INFO

/**
 * Provides strings identifying the GPU vendor and driver.
 * https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/
 * @param {WebGLRenderingContext} gl - context
 * @return {Object} - 'vendor' and 'renderer' string fields.
 */
function glGetDebugInfo(gl) {
  var info = gl.getExtension('WEBGL_debug_renderer_info');
  return {
    vendor: info ? gl.getParameter(GL_UNMASKED_VENDOR_WEBGL) : 'unknown',
    renderer: info ? gl.getParameter(GL_UNMASKED_RENDERER_WEBGL) : 'unknown'
  };
}

function logInfo(gl) {
  var webGL = (0, _webglChecks.isWebGL2RenderingContext)(gl) ? 'WebGL2' : 'WebGL1';
  var info = glGetDebugInfo(gl);
  var driver = info ? 'using driver: ' + info.vendor + ' ' + info.renderer : '';
  var debug = gl.debug ? 'debug' : '';
  _utils.log.log(0, 'luma.gl ' + _globals2.default.VERSION + ': ' + webGL + ' ' + debug + ' context ' + driver, gl);

  // const extensions = gl.getSupportedExtensions();
  // log.log(0, `Supported extensions: [${extensions.join(', ')}]`);
}

// DEBUG TRACING

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
  if (_utils.log.priority >= 4) {
    functionString = getFunctionString(functionName, functionArgs);
    _utils.log.info(4, '' + functionString);
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

  if (_utils.log.break) {
    functionString = functionString || getFunctionString(functionName, functionArgs);
    var isBreakpoint = _utils.log.break && _utils.log.break.every(function (breakString) {
      return functionString.indexOf(breakString) !== -1;
    });

    /* eslint-disable no-debugger */
    if (isBreakpoint) {
      debugger;
    }
    /* eslint-enable no-debugger */
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9jb250ZXh0LmpzIl0sIm5hbWVzIjpbImNyZWF0ZUdMQ29udGV4dCIsImdsR2V0IiwiZ2V0R0xFeHRlbnNpb24iLCJwb2xsIiwiZ2xDb250ZXh0V2l0aFN0YXRlIiwiZ2xHZXREZWJ1Z0luZm8iLCJnbEdldEVycm9yIiwiZ2xDaGVja0Vycm9yIiwiZ2V0RXh0ZW5zaW9uIiwiR0xfVU5NQVNLRURfVkVORE9SX1dFQkdMIiwiR0xfVU5NQVNLRURfUkVOREVSRVJfV0VCR0wiLCJFUlJfV0VCR0xfTUlTU0lOR19CUk9XU0VSIiwiRVJSX1dFQkdMX01JU1NJTkdfTk9ERSIsIkVSUl9IRUFETEVTU0dMX05PVF9BVkFJTEFCTEUiLCJFUlJfSEVBRExFU1NHTF9GQUlMRUQiLCJTVEFSVFVQX01FU1NBR0UiLCJjYW52YXMiLCJ3aWR0aCIsImhlaWdodCIsIndlYmdsMiIsImRlYnVnIiwib3B0cyIsImdsIiwiRXJyb3IiLCJnbG9iYWxzIiwiaGVhZGxlc3NHTCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJjcmVhdGVFbGVtZW50IiwiYWRkRXZlbnRMaXN0ZW5lciIsImxvZyIsImUiLCJzdGF0dXNNZXNzYWdlIiwiZ2V0Q29udGV4dCIsImRlYnVnR0wiLCJtYWtlRGVidWdDb250ZXh0IiwidGhyb3dPbkVycm9yIiwidmFsaWRhdGVBcmdzQW5kTG9nIiwiV2ViR0xEZWJ1Z0NvbnRleHQiLCJPYmplY3QiLCJhc3NpZ24iLCJwcm90b3R5cGUiLCJwcmlvcml0eSIsImxvZ0luZm8iLCJuYW1lIiwidmFsdWUiLCJ1bmRlZmluZWQiLCJleHRlbnNpb25OYW1lIiwiRVJST1IiLCJleHRlbnNpb24iLCJmdW5jIiwic2Npc3NvclRlc3QiLCJmcmFtZWJ1ZmZlciIsInNjaXNzb3JUZXN0V2FzRW5hYmxlZCIsImlzRW5hYmxlZCIsIlNDSVNTT1JfVEVTVCIsIngiLCJ5IiwidyIsImgiLCJlbmFibGUiLCJzY2lzc29yIiwiYmluZCIsImRpc2FibGUiLCJiaW5kRnJhbWVidWZmZXIiLCJGUkFNRUJVRkZFUiIsImluZm8iLCJ2ZW5kb3IiLCJnZXRQYXJhbWV0ZXIiLCJyZW5kZXJlciIsIndlYkdMIiwiZHJpdmVyIiwiVkVSU0lPTiIsImdldEZ1bmN0aW9uU3RyaW5nIiwiZnVuY3Rpb25OYW1lIiwiZnVuY3Rpb25BcmdzIiwiYXJncyIsImdsRnVuY3Rpb25BcmdzVG9TdHJpbmciLCJzbGljZSIsImxlbmd0aCIsImVyciIsImVycm9yTWVzc2FnZSIsImdsRW51bVRvU3RyaW5nIiwiZnVuY3Rpb25TdHJpbmciLCJhcmciLCJicmVhayIsImlzQnJlYWtwb2ludCIsImV2ZXJ5IiwiaW5kZXhPZiIsImJyZWFrU3RyaW5nIiwiZXJyb3JTdGFjayIsImdsRXJyb3IiLCJnZXRFcnJvciIsIk5PX0VSUk9SIiwicHVzaCIsImdsR2V0RXJyb3JNZXNzYWdlIiwiam9pbiIsImVycm9yIiwiQ09OVEVYVF9MT1NUX1dFQkdMIiwiSU5WQUxJRF9FTlVNIiwiSU5WQUxJRF9WQUxVRSIsIklOVkFMSURfT1BFUkFUSU9OIiwiSU5WQUxJRF9GUkFNRUJVRkZFUl9PUEVSQVRJT04iLCJPVVRfT0ZfTUVNT1JZIiwid2FybiJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFvQ2dCQSxlLEdBQUFBLGU7UUEyRUFDLEssR0FBQUEsSztRQVdBQyxjLEdBQUFBLGM7UUFhQUMsSSxHQUFBQSxJO1FBU0FDLGtCLEdBQUFBLGtCO1FBeUNBQyxjLEdBQUFBLGM7UUFtRUFDLFUsR0FBQUEsVTtRQVdBQyxZLEdBQUFBLFk7UUF1Q0FDLFksR0FBQUEsWTs7QUE1U2hCOzs7O0FBQ0E7O0FBQ0E7O0FBRUE7Ozs7QUFDQTs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs2TkFUQTtBQUNBOzs7QUFTQTs7QUFFQSxJQUFNQywyQkFBMkIsTUFBakM7QUFDQSxJQUFNQyw2QkFBNkIsTUFBbkM7O0FBRUEsSUFBTUMsOElBQU47O0FBSUEsSUFBTUMscUtBQU47O0FBSUEsSUFBTUMsK0JBQ04sZ0VBREE7O0FBR0EsSUFBTUMsd0JBQ04sb0RBREE7O0FBR0EsSUFBTUMsd05BQU47O0FBS0E7QUFDQTtBQUNPLFNBQVNmLGVBQVQsR0FjQztBQUFBLGlGQUFKLEVBQUk7O0FBQUEsTUFaTmdCLE1BWU0sUUFaTkEsTUFZTTtBQUFBLHdCQVZOQyxLQVVNO0FBQUEsTUFWTkEsS0FVTSw4QkFWRSxHQVVGO0FBQUEseUJBVE5DLE1BU007QUFBQSxNQVROQSxNQVNNLCtCQVRHLEdBU0g7QUFBQSx3QkFOTkMsTUFNTTtBQUFBLE1BTk5BLE1BTU0sOEJBTkcsS0FNSDtBQUFBLHdCQUhOQyxLQUdNO0FBQUEsTUFITkEsS0FHTSw4QkFIRSxJQUdGOztBQUFBLE1BREhDLElBQ0c7O0FBQ04sTUFBSUMsV0FBSjs7QUFFQSxNQUFJLGlCQUFKLEVBQWdCO0FBQ2Q7QUFDQSxRQUFJLGdDQUFKLEVBQTBCO0FBQ3hCLFlBQU0sSUFBSUMsS0FBSixDQUFVWCxzQkFBVixDQUFOO0FBQ0Q7QUFDRCxRQUFJLENBQUMsa0JBQUtZLE9BQUwsQ0FBYUMsVUFBbEIsRUFBOEI7QUFDNUIsWUFBTSxJQUFJRixLQUFKLENBQVVWLDRCQUFWLENBQU47QUFDRDtBQUNEUyxTQUFLLGtCQUFLRSxPQUFMLENBQWFDLFVBQWIsQ0FBd0JSLEtBQXhCLEVBQStCQyxNQUEvQixFQUF1Q0csSUFBdkMsQ0FBTDtBQUNBLFFBQUksQ0FBQ0MsRUFBTCxFQUFTO0FBQ1AsWUFBTSxJQUFJQyxLQUFKLENBQVVULHFCQUFWLENBQU47QUFDRDtBQUNGLEdBWkQsTUFZTztBQUNMO0FBQ0EsUUFBSSxnQ0FBSixFQUEwQjtBQUN4QixZQUFNLElBQUlTLEtBQUosQ0FBVVoseUJBQVYsQ0FBTjtBQUNEO0FBQ0Q7QUFDQSxRQUFJLE9BQU9LLE1BQVAsS0FBa0IsUUFBdEIsRUFBZ0M7QUFDOUJBLGVBQVNVLFNBQVNDLGNBQVQsQ0FBd0JYLE1BQXhCLENBQVQ7QUFDRDtBQUNELFFBQUksQ0FBQ0EsTUFBTCxFQUFhO0FBQ1hBLGVBQVNVLFNBQVNFLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBVDtBQUNEOztBQUVEWixXQUFPYSxnQkFBUCxDQUF3QiwyQkFBeEIsRUFBcUQsYUFBSztBQUN4RCxpQkFBSUMsR0FBSixDQUFRLENBQVIsRUFBV0MsRUFBRUMsYUFBRixJQUFtQixlQUE5QjtBQUNELEtBRkQsRUFFRyxLQUZIOztBQUlBO0FBQ0EsUUFBSWIsTUFBSixFQUFZO0FBQ1ZHLFdBQUtOLE9BQU9pQixVQUFQLENBQWtCLFFBQWxCLEVBQTRCWixJQUE1QixDQUFMO0FBQ0FDLFdBQUtBLE1BQU1OLE9BQU9pQixVQUFQLENBQWtCLHFCQUFsQixFQUF5Q1osSUFBekMsQ0FBWDtBQUNEO0FBQ0RDLFNBQUtBLE1BQU1OLE9BQU9pQixVQUFQLENBQWtCLE9BQWxCLEVBQTJCWixJQUEzQixDQUFYO0FBQ0FDLFNBQUtBLE1BQU1OLE9BQU9pQixVQUFQLENBQWtCLG9CQUFsQixFQUF3Q1osSUFBeEMsQ0FBWDs7QUFFQSwwQkFBT0MsRUFBUCxFQUFXLHdDQUFYO0FBQ0Q7O0FBRUQsTUFBSSxvQkFBYUYsS0FBakIsRUFBd0I7QUFDdEIsUUFBTWMsVUFDSixxQkFBV0MsZ0JBQVgsQ0FBNEJiLEVBQTVCLEVBQWdDYyxZQUFoQyxFQUE4Q0Msa0JBQTlDLENBREY7O0FBRHNCLFFBR2hCQyxpQkFIZ0I7QUFBQTtBQUFBOztBQUl0QkMsV0FBT0MsTUFBUCxDQUFjRixrQkFBa0JHLFNBQWhDLEVBQTJDUCxPQUEzQztBQUNBWixTQUFLWSxPQUFMO0FBQ0FaLE9BQUdGLEtBQUgsR0FBVyxJQUFYO0FBQ0EsZUFBSXNCLFFBQUosR0FBZSxXQUFJQSxRQUFKLEdBQWUsQ0FBZixHQUFtQixDQUFuQixHQUF1QixXQUFJQSxRQUExQzs7QUFFQUMsWUFBUXJCLEVBQVI7O0FBRUEsZUFBSVEsR0FBSixDQUFRLENBQVIsRUFBV2YsZUFBWDtBQUNEOztBQUVELFNBQU9PLEVBQVA7QUFDRDs7QUFFRDtBQUNPLFNBQVNyQixLQUFULENBQWVxQixFQUFmLEVBQW1Cc0IsSUFBbkIsRUFBeUI7QUFDOUI7QUFDQSxNQUFJQyxRQUFRRCxJQUFaO0FBQ0EsTUFBSSxPQUFPQSxJQUFQLEtBQWdCLFFBQXBCLEVBQThCO0FBQzVCQyxZQUFRdkIsR0FBR3NCLElBQUgsQ0FBUjtBQUNBLDBCQUFPQyxVQUFVQyxTQUFqQixvQkFBNENGLElBQTVDO0FBQ0Q7QUFDRCxTQUFPQyxLQUFQO0FBQ0Q7O0FBRUQ7QUFDTyxTQUFTM0MsY0FBVCxDQUF3Qm9CLEVBQXhCLEVBQTRCeUIsYUFBNUIsRUFBMkM7QUFDaEQ7QUFDQSxNQUFNQyxRQUFRLDZCQUFkO0FBQ0Esd0JBQU8xQiwrQ0FBUCxFQUE0QzBCLEtBQTVDO0FBQ0Esd0JBQU8sT0FBT0QsYUFBUCxLQUF5QixRQUFoQyxFQUEwQ0MsS0FBMUM7QUFDQSxNQUFNQyxZQUFZM0IsR0FBR2QsWUFBSCxDQUFnQnVDLGFBQWhCLENBQWxCO0FBQ0Esd0JBQU9FLFNBQVAsRUFBcUJGLGFBQXJCO0FBQ0EsU0FBT0UsU0FBUDtBQUNEOztBQUVEOztBQUVBO0FBQ08sU0FBUzlDLElBQVQsQ0FBY21CLEVBQWQsRUFBa0I7QUFDdkIsZ0RBQTRCQSxFQUE1QjtBQUNBLHlCQUFhbkIsSUFBYixDQUFrQm1CLEVBQWxCO0FBQ0Q7O0FBRUQ7O0FBRUE7QUFDQTtBQUNPLFNBQVNsQixrQkFBVCxDQUE0QmtCLEVBQTVCLFNBQTRENEIsSUFBNUQsRUFBa0U7QUFBQSxNQUFqQ0MsV0FBaUMsU0FBakNBLFdBQWlDO0FBQUEsTUFBcEJDLFdBQW9CLFNBQXBCQSxXQUFvQjs7QUFDdkU7O0FBRUEsTUFBSUMsOEJBQUo7QUFDQSxNQUFJRixXQUFKLEVBQWlCO0FBQ2ZFLDRCQUF3Qi9CLEdBQUdnQyxTQUFILENBQWFoQyxHQUFHaUMsWUFBaEIsQ0FBeEI7QUFEZSxRQUVSQyxDQUZRLEdBRU1MLFdBRk4sQ0FFUkssQ0FGUTtBQUFBLFFBRUxDLENBRkssR0FFTU4sV0FGTixDQUVMTSxDQUZLO0FBQUEsUUFFRkMsQ0FGRSxHQUVNUCxXQUZOLENBRUZPLENBRkU7QUFBQSxRQUVDQyxDQUZELEdBRU1SLFdBRk4sQ0FFQ1EsQ0FGRDs7QUFHZnJDLE9BQUdzQyxNQUFILENBQVV0QyxHQUFHaUMsWUFBYjtBQUNBakMsT0FBR3VDLE9BQUgsQ0FBV0wsQ0FBWCxFQUFjQyxDQUFkLEVBQWlCQyxDQUFqQixFQUFvQkMsQ0FBcEI7QUFDRDs7QUFFRCxNQUFJUCxXQUFKLEVBQWlCO0FBQ2Y7QUFDQUEsZ0JBQVlVLElBQVo7QUFDRDs7QUFFRCxNQUFJakIsY0FBSjtBQUNBLE1BQUk7QUFDRkEsWUFBUUssS0FBSzVCLEVBQUwsQ0FBUjtBQUNELEdBRkQsU0FFVTtBQUNSLFFBQUksQ0FBQytCLHFCQUFMLEVBQTRCO0FBQzFCL0IsU0FBR3lDLE9BQUgsQ0FBV3pDLEdBQUdpQyxZQUFkO0FBQ0Q7QUFDRCxRQUFJSCxXQUFKLEVBQWlCO0FBQ2Y7QUFDQTtBQUNBOUIsU0FBRzBDLGVBQUgsQ0FBbUIxQyxHQUFHMkMsV0FBdEIsRUFBbUMsSUFBbkM7QUFDRDtBQUNGOztBQUVELFNBQU9wQixLQUFQO0FBQ0Q7O0FBRUQ7O0FBRUE7Ozs7OztBQU1PLFNBQVN4QyxjQUFULENBQXdCaUIsRUFBeEIsRUFBNEI7QUFDakMsTUFBTTRDLE9BQU81QyxHQUFHZCxZQUFILENBQWdCLDJCQUFoQixDQUFiO0FBQ0EsU0FBTztBQUNMMkQsWUFBUUQsT0FBTzVDLEdBQUc4QyxZQUFILENBQWdCM0Qsd0JBQWhCLENBQVAsR0FBbUQsU0FEdEQ7QUFFTDRELGNBQVVILE9BQU81QyxHQUFHOEMsWUFBSCxDQUFnQjFELDBCQUFoQixDQUFQLEdBQXFEO0FBRjFELEdBQVA7QUFJRDs7QUFFRCxTQUFTaUMsT0FBVCxDQUFpQnJCLEVBQWpCLEVBQXFCO0FBQ25CLE1BQU1nRCxRQUFRLDJDQUF5QmhELEVBQXpCLElBQStCLFFBQS9CLEdBQTBDLFFBQXhEO0FBQ0EsTUFBTTRDLE9BQU83RCxlQUFlaUIsRUFBZixDQUFiO0FBQ0EsTUFBTWlELFNBQVNMLDBCQUF3QkEsS0FBS0MsTUFBN0IsU0FBdUNELEtBQUtHLFFBQTVDLEdBQXlELEVBQXhFO0FBQ0EsTUFBTWpELFFBQVFFLEdBQUdGLEtBQUgsR0FBVyxPQUFYLEdBQXFCLEVBQW5DO0FBQ0EsYUFBSVUsR0FBSixDQUFRLENBQVIsZUFDYSxrQkFBSzBDLE9BRGxCLFVBQzhCRixLQUQ5QixTQUN1Q2xELEtBRHZDLGlCQUN3RG1ELE1BRHhELEVBQ2tFakQsRUFEbEU7O0FBR0E7QUFDQTtBQUNEOztBQUVEOztBQUVBLFNBQVNtRCxpQkFBVCxDQUEyQkMsWUFBM0IsRUFBeUNDLFlBQXpDLEVBQXVEO0FBQ3JELE1BQUlDLE9BQU8scUJBQVdDLHNCQUFYLENBQWtDSCxZQUFsQyxFQUFnREMsWUFBaEQsQ0FBWDtBQUNBQyxjQUFVQSxLQUFLRSxLQUFMLENBQVcsQ0FBWCxFQUFjLEdBQWQsQ0FBVixJQUErQkYsS0FBS0csTUFBTCxHQUFjLEdBQWQsR0FBb0IsS0FBcEIsR0FBNEIsRUFBM0Q7QUFDQSxpQkFBYUwsWUFBYixTQUE2QkUsSUFBN0I7QUFDRDs7QUFFRCxTQUFTeEMsWUFBVCxDQUFzQjRDLEdBQXRCLEVBQTJCTixZQUEzQixFQUF5Q0UsSUFBekMsRUFBK0M7QUFDN0MsTUFBTUssZUFBZSxxQkFBV0MsY0FBWCxDQUEwQkYsR0FBMUIsQ0FBckI7QUFDQSxNQUFNTCxlQUFlLHFCQUFXRSxzQkFBWCxDQUFrQ0gsWUFBbEMsRUFBZ0RFLElBQWhELENBQXJCO0FBQ0EsUUFBTSxJQUFJckQsS0FBSixDQUFhMEQsWUFBSCx5Q0FDUlAsWUFEUSxTQUNRQyxZQURSLE9BQVYsQ0FBTjtBQUVEOztBQUVEO0FBQ0EsU0FBU3RDLGtCQUFULENBQTRCcUMsWUFBNUIsRUFBMENDLFlBQTFDLEVBQXdEO0FBQ3RELE1BQUlRLHVCQUFKO0FBQ0EsTUFBSSxXQUFJekMsUUFBSixJQUFnQixDQUFwQixFQUF1QjtBQUNyQnlDLHFCQUFpQlYsa0JBQWtCQyxZQUFsQixFQUFnQ0MsWUFBaEMsQ0FBakI7QUFDQSxlQUFJVCxJQUFKLENBQVMsQ0FBVCxPQUFlaUIsY0FBZjtBQUNEOztBQUxxRDtBQUFBO0FBQUE7O0FBQUE7QUFPdEQseUJBQWtCUixZQUFsQiw4SEFBZ0M7QUFBQSxVQUFyQlMsR0FBcUI7O0FBQzlCLFVBQUlBLFFBQVF0QyxTQUFaLEVBQXVCO0FBQ3JCcUMseUJBQWlCQSxrQkFDZlYsa0JBQWtCQyxZQUFsQixFQUFnQ0MsWUFBaEMsQ0FERjtBQUVBLGNBQU0sSUFBSXBELEtBQUosMEJBQWlDNEQsY0FBakMsQ0FBTjtBQUNEO0FBQ0Y7QUFicUQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFldEQsTUFBSSxXQUFJRSxLQUFSLEVBQWU7QUFDYkYscUJBQWlCQSxrQkFDZlYsa0JBQWtCQyxZQUFsQixFQUFnQ0MsWUFBaEMsQ0FERjtBQUVBLFFBQU1XLGVBQWUsV0FBSUQsS0FBSixJQUFhLFdBQUlBLEtBQUosQ0FBVUUsS0FBVixDQUNoQztBQUFBLGFBQWVKLGVBQWVLLE9BQWYsQ0FBdUJDLFdBQXZCLE1BQXdDLENBQUMsQ0FBeEQ7QUFBQSxLQURnQyxDQUFsQzs7QUFJQTtBQUNBLFFBQUlILFlBQUosRUFBa0I7QUFDaEI7QUFDRDtBQUNEO0FBQ0Q7QUFDRjs7QUFFRDtBQUNPLFNBQVNoRixVQUFULENBQW9CZ0IsRUFBcEIsRUFBd0I7QUFDN0I7QUFDQSxNQUFNb0UsYUFBYSxFQUFuQjtBQUNBLE1BQUlDLFVBQVVyRSxHQUFHc0UsUUFBSCxFQUFkO0FBQ0EsU0FBT0QsWUFBWXJFLEdBQUd1RSxRQUF0QixFQUFnQztBQUM5QkgsZUFBV0ksSUFBWCxDQUFnQkMsa0JBQWtCekUsRUFBbEIsRUFBc0JxRSxPQUF0QixDQUFoQjtBQUNBQSxjQUFVckUsR0FBR3NFLFFBQUgsRUFBVjtBQUNEO0FBQ0QsU0FBT0YsV0FBV1gsTUFBWCxHQUFvQixJQUFJeEQsS0FBSixDQUFVbUUsV0FBV00sSUFBWCxDQUFnQixJQUFoQixDQUFWLENBQXBCLEdBQXVELElBQTlEO0FBQ0Q7O0FBRU0sU0FBU3pGLFlBQVQsQ0FBc0JlLEVBQXRCLEVBQTBCO0FBQy9CLE1BQUlBLEdBQUdGLEtBQVAsRUFBYztBQUNaLFFBQU02RSxRQUFRM0YsV0FBV2dCLEVBQVgsQ0FBZDtBQUNBLFFBQUkyRSxLQUFKLEVBQVc7QUFDVCxZQUFNQSxLQUFOO0FBQ0Q7QUFDRjtBQUNGOztBQUVELFNBQVNGLGlCQUFULENBQTJCekUsRUFBM0IsRUFBK0JxRSxPQUEvQixFQUF3QztBQUN0QyxVQUFRQSxPQUFSO0FBQ0EsU0FBS3JFLEdBQUc0RSxrQkFBUjtBQUNFO0FBQ0E7QUFDQTtBQUNBLGFBQU8sb0JBQVA7QUFDRixTQUFLNUUsR0FBRzZFLFlBQVI7QUFDRTtBQUNBLGFBQU8sbUNBQVA7QUFDRixTQUFLN0UsR0FBRzhFLGFBQVI7QUFDRTtBQUNBLGFBQU8scUJBQVA7QUFDRixTQUFLOUUsR0FBRytFLGlCQUFSO0FBQ0U7QUFDQSxhQUFPLHlCQUFQO0FBQ0YsU0FBSy9FLEdBQUdnRiw2QkFBUjtBQUNFO0FBQ0E7QUFDQSxhQUFPLHFDQUFQO0FBQ0YsU0FBS2hGLEdBQUdpRixhQUFSO0FBQ0U7QUFDQSxhQUFPLHFCQUFQO0FBQ0Y7QUFDRSxzQ0FBOEJaLE9BQTlCO0FBdkJGO0FBeUJEOztBQUVEOztBQUVPLFNBQVNuRixZQUFULENBQXNCYyxFQUF0QixFQUEwQnlCLGFBQTFCLEVBQXlDO0FBQzlDLGFBQUl5RCxJQUFKLENBQVMsQ0FBVCxFQUFZLHFDQUFaO0FBQ0EsU0FBT3RHLGVBQWVvQixFQUFmLEVBQW1CeUIsYUFBbkIsQ0FBUDtBQUNEIiwiZmlsZSI6ImNvbnRleHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgcmVsYXRlZCBtZXRob2RzXG4vKiBlc2xpbnQtZGlzYWJsZSBuby10cnktY2F0Y2gsIG5vLWxvb3AtZnVuYyAqL1xuaW1wb3J0IFdlYkdMRGVidWcgZnJvbSAnd2ViZ2wtZGVidWcnO1xuaW1wb3J0IHtXZWJHTFJlbmRlcmluZ0NvbnRleHQsIHdlYkdMVHlwZXNBdmFpbGFibGV9IGZyb20gJy4vd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHthc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQsIGlzV2ViR0wyUmVuZGVyaW5nQ29udGV4dH1cbiAgZnJvbSAnLi93ZWJnbC1jaGVja3MnO1xuaW1wb3J0IHF1ZXJ5TWFuYWdlciBmcm9tICcuL2hlbHBlcnMvcXVlcnktbWFuYWdlcic7XG5pbXBvcnQge2xvZywgaXNCcm93c2VyfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgbHVtYSBmcm9tICcuLi9nbG9iYWxzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0Jztcbi8qIGdsb2JhbCBkb2N1bWVudCAqL1xuXG5jb25zdCBHTF9VTk1BU0tFRF9WRU5ET1JfV0VCR0wgPSAweDkyNDU7XG5jb25zdCBHTF9VTk1BU0tFRF9SRU5ERVJFUl9XRUJHTCA9IDB4OTI0NjtcblxuY29uc3QgRVJSX1dFQkdMX01JU1NJTkdfQlJPV1NFUiA9IGBcXFxuV2ViR0wgQVBJIGlzIG1pc3NpbmcuIENoZWNrIHlvdXIgaWYgeW91ciBicm93c2VyIHN1cHBvcnRzIFdlYkdMIG9yXG5pbnN0YWxsIGEgcmVjZW50IHZlcnNpb24gb2YgYSBtYWpvciBicm93c2VyLmA7XG5cbmNvbnN0IEVSUl9XRUJHTF9NSVNTSU5HX05PREUgPSBgXFxcbldlYkdMIEFQSSBpcyBtaXNzaW5nLiBUbyBydW4gbHVtYS5nbCB1bmRlciBOb2RlLmpzLCBwbGVhc2UgXCJucG0gaW5zdGFsbCBnbFwiXG5hbmQgaW1wb3J0ICdsdW1hLmdsL2hlYWRsZXNzJyBiZWZvcmUgaW1wb3J0aW5nICdsdW1hLmdsJy5gO1xuXG5jb25zdCBFUlJfSEVBRExFU1NHTF9OT1RfQVZBSUxBQkxFID1cbidDYW5ub3QgY3JlYXRlIGhlYWRsZXNzIFdlYkdMIGNvbnRleHQsIGhlYWRsZXNzR0wgbm90IGF2YWlsYWJsZSc7XG5cbmNvbnN0IEVSUl9IRUFETEVTU0dMX0ZBSUxFRCA9XG4naGVhZGxlc3NHTCBmYWlsZWQgdG8gY3JlYXRlIGhlYWRsZXNzIFdlYkdMIGNvbnRleHQnO1xuXG5jb25zdCBTVEFSVFVQX01FU1NBR0UgPSBgXFxcbkFzc2lnbiBsdW1hLmxvZy5wcmlvcml0eSBpbiBjb25zb2xlIHRvIGNvbnRyb2wgbG9nZ2luZzogXFxcbjA6IG5vbmUsIDE6IG1pbmltYWwsIDI6IHZlcmJvc2UsIDM6IGF0dHJpYnV0ZS91bmlmb3JtcywgNDogZ2wgbG9nc1xubHVtYS5sb2cuYnJlYWtbXSwgc2V0IHRvIGdsIGZ1bmNzLCBsdW1hLmxvZy5wcm9maWxlW10gc2V0IHRvIG1vZGVsIG5hbWVzYDtcblxuLy8gQ2hlY2tzIGlmIFdlYkdMIGlzIGVuYWJsZWQgYW5kIGNyZWF0ZXMgYSBjb250ZXh0IGZvciB1c2luZyBXZWJHTC5cbi8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHksIG1heC1zdGF0ZW1lbnRzICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlR0xDb250ZXh0KHtcbiAgLy8gQlJPV1NFUiBDT05URVhUIFBBUkFNQVRFUlM6IGNhbnZhcyBpcyBvbmx5IHVzZWQgd2hlbiBpbiBicm93c2VyXG4gIGNhbnZhcyxcbiAgLy8gSEVBRExFU1MgQ09OVEVYVCBQQVJBTUVURVJTOiB3aWR0aCBhcmUgaGVpZ2h0IGFyZSBvbmx5IHVzZWQgYnkgaGVhZGxlc3MgZ2xcbiAgd2lkdGggPSA4MDAsXG4gIGhlaWdodCA9IDYwMCxcbiAgLy8gQ09NTU9OIENPTlRFWFQgUEFSQU1FVEVSU1xuICAvLyBBdHRlbXB0IHRvIGFsbG9jYXRlIFdlYkdMMiBjb250ZXh0XG4gIHdlYmdsMiA9IGZhbHNlLFxuICAvLyBJbnN0cnVtZW50IGNvbnRleHQgKGF0IHRoZSBleHBlbnNlIG9mIHBlcmZvcm1hbmNlKVxuICAvLyBOb3RlOiBjdXJyZW50bHkgZGVmYXVsdHMgdG8gdHJ1ZSBhbmQgbmVlZHMgdG8gYmUgZXhwbGljaXRseSB0dXJuZWQgb2ZmXG4gIGRlYnVnID0gdHJ1ZSxcbiAgLy8gT3RoZXIgb3B0aW9ucyBhcmUgcGFzc2VkIHRocm91Z2ggdG8gY29udGV4dCBjcmVhdG9yXG4gIC4uLm9wdHNcbn0gPSB7fSkge1xuICBsZXQgZ2w7XG5cbiAgaWYgKCFpc0Jyb3dzZXIpIHtcbiAgICAvLyBDcmVhdGUgaGVhZGxlc3MgZ2wgY29udGV4dFxuICAgIGlmICghd2ViR0xUeXBlc0F2YWlsYWJsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKEVSUl9XRUJHTF9NSVNTSU5HX05PREUpO1xuICAgIH1cbiAgICBpZiAoIWx1bWEuZ2xvYmFscy5oZWFkbGVzc0dMKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoRVJSX0hFQURMRVNTR0xfTk9UX0FWQUlMQUJMRSk7XG4gICAgfVxuICAgIGdsID0gbHVtYS5nbG9iYWxzLmhlYWRsZXNzR0wod2lkdGgsIGhlaWdodCwgb3B0cyk7XG4gICAgaWYgKCFnbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKEVSUl9IRUFETEVTU0dMX0ZBSUxFRCk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIENyZWF0ZSBicm93c2VyIGdsIGNvbnRleHRcbiAgICBpZiAoIXdlYkdMVHlwZXNBdmFpbGFibGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihFUlJfV0VCR0xfTUlTU0lOR19CUk9XU0VSKTtcbiAgICB9XG4gICAgLy8gTWFrZSBzdXJlIHdlIGhhdmUgYSBjYW52YXNcbiAgICBpZiAodHlwZW9mIGNhbnZhcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhcyk7XG4gICAgfVxuICAgIGlmICghY2FudmFzKSB7XG4gICAgICBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB9XG5cbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignd2ViZ2xjb250ZXh0Y3JlYXRpb25lcnJvcicsIGUgPT4ge1xuICAgICAgbG9nLmxvZygwLCBlLnN0YXR1c01lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InKTtcbiAgICB9LCBmYWxzZSk7XG5cbiAgICAvLyBQcmVmZXIgd2ViZ2wyIG92ZXIgd2ViZ2wxLCBwcmVmZXIgY29uZm9ybWFudCBvdmVyIGV4cGVyaW1lbnRhbFxuICAgIGlmICh3ZWJnbDIpIHtcbiAgICAgIGdsID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsMicsIG9wdHMpO1xuICAgICAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsMicsIG9wdHMpO1xuICAgIH1cbiAgICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcsIG9wdHMpO1xuICAgIGdsID0gZ2wgfHwgY2FudmFzLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcsIG9wdHMpO1xuXG4gICAgYXNzZXJ0KGdsLCAnRmFpbGVkIHRvIGNyZWF0ZSBXZWJHTFJlbmRlcmluZ0NvbnRleHQnKTtcbiAgfVxuXG4gIGlmIChpc0Jyb3dzZXIgJiYgZGVidWcpIHtcbiAgICBjb25zdCBkZWJ1Z0dMID1cbiAgICAgIFdlYkdMRGVidWcubWFrZURlYnVnQ29udGV4dChnbCwgdGhyb3dPbkVycm9yLCB2YWxpZGF0ZUFyZ3NBbmRMb2cpO1xuICAgIGNsYXNzIFdlYkdMRGVidWdDb250ZXh0IHt9XG4gICAgT2JqZWN0LmFzc2lnbihXZWJHTERlYnVnQ29udGV4dC5wcm90b3R5cGUsIGRlYnVnR0wpO1xuICAgIGdsID0gZGVidWdHTDtcbiAgICBnbC5kZWJ1ZyA9IHRydWU7XG4gICAgbG9nLnByaW9yaXR5ID0gbG9nLnByaW9yaXR5IDwgMSA/IDEgOiBsb2cucHJpb3JpdHk7XG5cbiAgICBsb2dJbmZvKGdsKTtcblxuICAgIGxvZy5sb2coMCwgU1RBUlRVUF9NRVNTQUdFKTtcbiAgfVxuXG4gIHJldHVybiBnbDtcbn1cblxuLy8gUmVzb2x2ZSBhIFdlYkdMIGVudW1lcmF0aW9uIG5hbWUgKHJldHVybnMgaXRzZWxmIGlmIGFscmVhZHkgYSBudW1iZXIpXG5leHBvcnQgZnVuY3Rpb24gZ2xHZXQoZ2wsIG5hbWUpIHtcbiAgLy8gYXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0KGdsKTtcbiAgbGV0IHZhbHVlID0gbmFtZTtcbiAgaWYgKHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykge1xuICAgIHZhbHVlID0gZ2xbbmFtZV07XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQsIGBBY2Nlc3NpbmcgZ2wuJHtuYW1lfWApO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLy8gUmV0dXJucyB0aGUgZXh0ZW5zaW9uIG9yIHRocm93cyBhbiBlcnJvclxuZXhwb3J0IGZ1bmN0aW9uIGdldEdMRXh0ZW5zaW9uKGdsLCBleHRlbnNpb25OYW1lKSB7XG4gIC8vIGFzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dChnbCk7XG4gIGNvbnN0IEVSUk9SID0gJ0lsbGVnYWwgYXJnIHRvIGdldEV4dGVuc2lvbic7XG4gIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMUmVuZGVyaW5nQ29udGV4dCwgRVJST1IpO1xuICBhc3NlcnQodHlwZW9mIGV4dGVuc2lvbk5hbWUgPT09ICdzdHJpbmcnLCBFUlJPUik7XG4gIGNvbnN0IGV4dGVuc2lvbiA9IGdsLmdldEV4dGVuc2lvbihleHRlbnNpb25OYW1lKTtcbiAgYXNzZXJ0KGV4dGVuc2lvbiwgYCR7ZXh0ZW5zaW9uTmFtZX0gbm90IHN1cHBvcnRlZCFgKTtcbiAgcmV0dXJuIGV4dGVuc2lvbjtcbn1cblxuLy8gUE9MTElORyBGT1IgUEVORElORyBRVUVSSUVTXG5cbi8vIENhbGxpbmcgdGhpcyBmdW5jdGlvbiBjaGVja3MgYWxsIHBlbmRpbmcgcXVlcmllcyBmb3IgY29tcGxldGlvblxuZXhwb3J0IGZ1bmN0aW9uIHBvbGwoZ2wpIHtcbiAgYXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0KGdsKTtcbiAgcXVlcnlNYW5hZ2VyLnBvbGwoZ2wpO1xufVxuXG4vLyBWRVJZIExJTUlURUQgLyBCQVNJQyBHTCBTVEFURSBNQU5BR0VNRU5UXG5cbi8vIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2l0aCBnbCBzdGF0ZXMgdGVtcG9yYXJpbHkgc2V0LCBleGNlcHRpb24gc2FmZVxuLy8gQ3VycmVudGx5IHN1cHBvcnQgc2Npc3NvciB0ZXN0IGFuZCBmcmFtZWJ1ZmZlciBiaW5kaW5nXG5leHBvcnQgZnVuY3Rpb24gZ2xDb250ZXh0V2l0aFN0YXRlKGdsLCB7c2Npc3NvclRlc3QsIGZyYW1lYnVmZmVyfSwgZnVuYykge1xuICAvLyBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuXG4gIGxldCBzY2lzc29yVGVzdFdhc0VuYWJsZWQ7XG4gIGlmIChzY2lzc29yVGVzdCkge1xuICAgIHNjaXNzb3JUZXN0V2FzRW5hYmxlZCA9IGdsLmlzRW5hYmxlZChnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGNvbnN0IHt4LCB5LCB3LCBofSA9IHNjaXNzb3JUZXN0O1xuICAgIGdsLmVuYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGdsLnNjaXNzb3IoeCwgeSwgdywgaCk7XG4gIH1cblxuICBpZiAoZnJhbWVidWZmZXIpIHtcbiAgICAvLyBUT0RPIC0gd2FzIHRoZXJlIGFueSBwcmV2aW91c2x5IHNldCBmcmFtZSBidWZmZXIgd2UgbmVlZCB0byByZW1lbWJlcj9cbiAgICBmcmFtZWJ1ZmZlci5iaW5kKCk7XG4gIH1cblxuICBsZXQgdmFsdWU7XG4gIHRyeSB7XG4gICAgdmFsdWUgPSBmdW5jKGdsKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoIXNjaXNzb3JUZXN0V2FzRW5hYmxlZCkge1xuICAgICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIH1cbiAgICBpZiAoZnJhbWVidWZmZXIpIHtcbiAgICAgIC8vIFRPRE8gLSB3YXMgdGhlcmUgYW55IHByZXZpb3VzbHkgc2V0IGZyYW1lIGJ1ZmZlcj9cbiAgICAgIC8vIFRPRE8gLSBkZWxlZ2F0ZSBcInVuYmluZFwiIHRvIEZyYW1lYnVmZmVyIG9iamVjdD9cbiAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vLyBERUJVRyBJTkZPXG5cbi8qKlxuICogUHJvdmlkZXMgc3RyaW5ncyBpZGVudGlmeWluZyB0aGUgR1BVIHZlbmRvciBhbmQgZHJpdmVyLlxuICogaHR0cHM6Ly93d3cua2hyb25vcy5vcmcvcmVnaXN0cnkvd2ViZ2wvZXh0ZW5zaW9ucy9XRUJHTF9kZWJ1Z19yZW5kZXJlcl9pbmZvL1xuICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsIC0gY29udGV4dFxuICogQHJldHVybiB7T2JqZWN0fSAtICd2ZW5kb3InIGFuZCAncmVuZGVyZXInIHN0cmluZyBmaWVsZHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnbEdldERlYnVnSW5mbyhnbCkge1xuICBjb25zdCBpbmZvID0gZ2wuZ2V0RXh0ZW5zaW9uKCdXRUJHTF9kZWJ1Z19yZW5kZXJlcl9pbmZvJyk7XG4gIHJldHVybiB7XG4gICAgdmVuZG9yOiBpbmZvID8gZ2wuZ2V0UGFyYW1ldGVyKEdMX1VOTUFTS0VEX1ZFTkRPUl9XRUJHTCkgOiAndW5rbm93bicsXG4gICAgcmVuZGVyZXI6IGluZm8gPyBnbC5nZXRQYXJhbWV0ZXIoR0xfVU5NQVNLRURfUkVOREVSRVJfV0VCR0wpIDogJ3Vua25vd24nXG4gIH07XG59XG5cbmZ1bmN0aW9uIGxvZ0luZm8oZ2wpIHtcbiAgY29uc3Qgd2ViR0wgPSBpc1dlYkdMMlJlbmRlcmluZ0NvbnRleHQoZ2wpID8gJ1dlYkdMMicgOiAnV2ViR0wxJztcbiAgY29uc3QgaW5mbyA9IGdsR2V0RGVidWdJbmZvKGdsKTtcbiAgY29uc3QgZHJpdmVyID0gaW5mbyA/IGB1c2luZyBkcml2ZXI6ICR7aW5mby52ZW5kb3J9ICR7aW5mby5yZW5kZXJlcn1gIDogJyc7XG4gIGNvbnN0IGRlYnVnID0gZ2wuZGVidWcgPyAnZGVidWcnIDogJyc7XG4gIGxvZy5sb2coMCxcbiAgICBgbHVtYS5nbCAke2x1bWEuVkVSU0lPTn06ICR7d2ViR0x9ICR7ZGVidWd9IGNvbnRleHQgJHtkcml2ZXJ9YCwgZ2wpO1xuXG4gIC8vIGNvbnN0IGV4dGVuc2lvbnMgPSBnbC5nZXRTdXBwb3J0ZWRFeHRlbnNpb25zKCk7XG4gIC8vIGxvZy5sb2coMCwgYFN1cHBvcnRlZCBleHRlbnNpb25zOiBbJHtleHRlbnNpb25zLmpvaW4oJywgJyl9XWApO1xufVxuXG4vLyBERUJVRyBUUkFDSU5HXG5cbmZ1bmN0aW9uIGdldEZ1bmN0aW9uU3RyaW5nKGZ1bmN0aW9uTmFtZSwgZnVuY3Rpb25BcmdzKSB7XG4gIGxldCBhcmdzID0gV2ViR0xEZWJ1Zy5nbEZ1bmN0aW9uQXJnc1RvU3RyaW5nKGZ1bmN0aW9uTmFtZSwgZnVuY3Rpb25BcmdzKTtcbiAgYXJncyA9IGAke2FyZ3Muc2xpY2UoMCwgMTAwKX0ke2FyZ3MubGVuZ3RoID4gMTAwID8gJy4uLicgOiAnJ31gO1xuICByZXR1cm4gYGdsLiR7ZnVuY3Rpb25OYW1lfSgke2FyZ3N9KWA7XG59XG5cbmZ1bmN0aW9uIHRocm93T25FcnJvcihlcnIsIGZ1bmN0aW9uTmFtZSwgYXJncykge1xuICBjb25zdCBlcnJvck1lc3NhZ2UgPSBXZWJHTERlYnVnLmdsRW51bVRvU3RyaW5nKGVycik7XG4gIGNvbnN0IGZ1bmN0aW9uQXJncyA9IFdlYkdMRGVidWcuZ2xGdW5jdGlvbkFyZ3NUb1N0cmluZyhmdW5jdGlvbk5hbWUsIGFyZ3MpO1xuICB0aHJvdyBuZXcgRXJyb3IoYCR7ZXJyb3JNZXNzYWdlfSB3YXMgY2F1c2VkIGJ5IGNhbGwgdG86IGAgK1xuICAgIGBnbC4ke2Z1bmN0aW9uTmFtZX0oJHtmdW5jdGlvbkFyZ3N9KWApO1xufVxuXG4vLyBEb24ndCBnZW5lcmF0ZSBmdW5jdGlvbiBzdHJpbmcgdW50aWwgaXQgaXMgbmVlZGVkXG5mdW5jdGlvbiB2YWxpZGF0ZUFyZ3NBbmRMb2coZnVuY3Rpb25OYW1lLCBmdW5jdGlvbkFyZ3MpIHtcbiAgbGV0IGZ1bmN0aW9uU3RyaW5nO1xuICBpZiAobG9nLnByaW9yaXR5ID49IDQpIHtcbiAgICBmdW5jdGlvblN0cmluZyA9IGdldEZ1bmN0aW9uU3RyaW5nKGZ1bmN0aW9uTmFtZSwgZnVuY3Rpb25BcmdzKTtcbiAgICBsb2cuaW5mbyg0LCBgJHtmdW5jdGlvblN0cmluZ31gKTtcbiAgfVxuXG4gIGZvciAoY29uc3QgYXJnIG9mIGZ1bmN0aW9uQXJncykge1xuICAgIGlmIChhcmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZnVuY3Rpb25TdHJpbmcgPSBmdW5jdGlvblN0cmluZyB8fFxuICAgICAgICBnZXRGdW5jdGlvblN0cmluZyhmdW5jdGlvbk5hbWUsIGZ1bmN0aW9uQXJncyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZGVmaW5lZCBhcmd1bWVudDogJHtmdW5jdGlvblN0cmluZ31gKTtcbiAgICB9XG4gIH1cblxuICBpZiAobG9nLmJyZWFrKSB7XG4gICAgZnVuY3Rpb25TdHJpbmcgPSBmdW5jdGlvblN0cmluZyB8fFxuICAgICAgZ2V0RnVuY3Rpb25TdHJpbmcoZnVuY3Rpb25OYW1lLCBmdW5jdGlvbkFyZ3MpO1xuICAgIGNvbnN0IGlzQnJlYWtwb2ludCA9IGxvZy5icmVhayAmJiBsb2cuYnJlYWsuZXZlcnkoXG4gICAgICBicmVha1N0cmluZyA9PiBmdW5jdGlvblN0cmluZy5pbmRleE9mKGJyZWFrU3RyaW5nKSAhPT0gLTFcbiAgICApO1xuXG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tZGVidWdnZXIgKi9cbiAgICBpZiAoaXNCcmVha3BvaW50KSB7XG4gICAgICBkZWJ1Z2dlcjtcbiAgICB9XG4gICAgLyogZXNsaW50LWVuYWJsZSBuby1kZWJ1Z2dlciAqL1xuICB9XG59XG5cbi8vIFJldHVybnMgYW4gRXJyb3IgcmVwcmVzZW50aW5nIHRoZSBMYXRlc3Qgd2ViR2wgZXJyb3Igb3IgbnVsbFxuZXhwb3J0IGZ1bmN0aW9uIGdsR2V0RXJyb3IoZ2wpIHtcbiAgLy8gTG9vcCB0byBlbnN1cmUgYWxsIGVycm9ycyBhcmUgY2xlYXJlZFxuICBjb25zdCBlcnJvclN0YWNrID0gW107XG4gIGxldCBnbEVycm9yID0gZ2wuZ2V0RXJyb3IoKTtcbiAgd2hpbGUgKGdsRXJyb3IgIT09IGdsLk5PX0VSUk9SKSB7XG4gICAgZXJyb3JTdGFjay5wdXNoKGdsR2V0RXJyb3JNZXNzYWdlKGdsLCBnbEVycm9yKSk7XG4gICAgZ2xFcnJvciA9IGdsLmdldEVycm9yKCk7XG4gIH1cbiAgcmV0dXJuIGVycm9yU3RhY2subGVuZ3RoID8gbmV3IEVycm9yKGVycm9yU3RhY2suam9pbignXFxuJykpIDogbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdsQ2hlY2tFcnJvcihnbCkge1xuICBpZiAoZ2wuZGVidWcpIHtcbiAgICBjb25zdCBlcnJvciA9IGdsR2V0RXJyb3IoZ2wpO1xuICAgIGlmIChlcnJvcikge1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdsR2V0RXJyb3JNZXNzYWdlKGdsLCBnbEVycm9yKSB7XG4gIHN3aXRjaCAoZ2xFcnJvcikge1xuICBjYXNlIGdsLkNPTlRFWFRfTE9TVF9XRUJHTDpcbiAgICAvLyAgSWYgdGhlIFdlYkdMIGNvbnRleHQgaXMgbG9zdCwgdGhpcyBlcnJvciBpcyByZXR1cm5lZCBvbiB0aGVcbiAgICAvLyBmaXJzdCBjYWxsIHRvIGdldEVycm9yLiBBZnRlcndhcmRzIGFuZCB1bnRpbCB0aGUgY29udGV4dCBoYXMgYmVlblxuICAgIC8vIHJlc3RvcmVkLCBpdCByZXR1cm5zIGdsLk5PX0VSUk9SLlxuICAgIHJldHVybiAnV2ViR0wgY29udGV4dCBsb3N0JztcbiAgY2FzZSBnbC5JTlZBTElEX0VOVU06XG4gICAgLy8gQW4gdW5hY2NlcHRhYmxlIHZhbHVlIGhhcyBiZWVuIHNwZWNpZmllZCBmb3IgYW4gZW51bWVyYXRlZCBhcmd1bWVudC5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgZW51bWVyYXRlZCBhcmd1bWVudCc7XG4gIGNhc2UgZ2wuSU5WQUxJRF9WQUxVRTpcbiAgICAvLyBBIG51bWVyaWMgYXJndW1lbnQgaXMgb3V0IG9mIHJhbmdlLlxuICAgIHJldHVybiAnV2ViR0wgaW52YWxpZCB2YWx1ZSc7XG4gIGNhc2UgZ2wuSU5WQUxJRF9PUEVSQVRJT046XG4gICAgLy8gVGhlIHNwZWNpZmllZCBjb21tYW5kIGlzIG5vdCBhbGxvd2VkIGZvciB0aGUgY3VycmVudCBzdGF0ZS5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgb3BlcmF0aW9uJztcbiAgY2FzZSBnbC5JTlZBTElEX0ZSQU1FQlVGRkVSX09QRVJBVElPTjpcbiAgICAvLyBUaGUgY3VycmVudGx5IGJvdW5kIGZyYW1lYnVmZmVyIGlzIG5vdCBmcmFtZWJ1ZmZlciBjb21wbGV0ZVxuICAgIC8vIHdoZW4gdHJ5aW5nIHRvIHJlbmRlciB0byBvciB0byByZWFkIGZyb20gaXQuXG4gICAgcmV0dXJuICdXZWJHTCBpbnZhbGlkIGZyYW1lYnVmZmVyIG9wZXJhdGlvbic7XG4gIGNhc2UgZ2wuT1VUX09GX01FTU9SWTpcbiAgICAvLyBOb3QgZW5vdWdoIG1lbW9yeSBpcyBsZWZ0IHRvIGV4ZWN1dGUgdGhlIGNvbW1hbmQuXG4gICAgcmV0dXJuICdXZWJHTCBvdXQgb2YgbWVtb3J5JztcbiAgZGVmYXVsdDpcbiAgICByZXR1cm4gYFdlYkdMIHVua25vd24gZXJyb3IgJHtnbEVycm9yfWA7XG4gIH1cbn1cblxuLy8gRGVwcmVjYXRlZCBtZXRob2RzXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHRlbnNpb24oZ2wsIGV4dGVuc2lvbk5hbWUpIHtcbiAgbG9nLndhcm4oMCwgJ2x1bWEuZ2w6IGdldEV4dGVuc2lvbiBpcyBkZXByZWNhdGVkJyk7XG4gIHJldHVybiBnZXRHTEV4dGVuc2lvbihnbCwgZXh0ZW5zaW9uTmFtZSk7XG59XG4iXX0=