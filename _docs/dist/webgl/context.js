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

var _globals = require('../globals');

var _globals2 = _interopRequireDefault(_globals);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; } // WebGLRenderingContext related methods
/* eslint-disable no-try-catch, no-loop-func */


/* global document */

var ERR_WEBGL_MISSING_BROWSER = 'WebGL API is missing. Check your if your browser supports WebGL or\ninstall a recent version of a major browser.';

var ERR_WEBGL_MISSING_NODE = 'WebGL API is missing. To run luma.gl under Node.js, please "npm install gl"\nand import \'luma.gl/headless\' before importing \'luma.gl\'.';

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
      throw new Error('Cannot create headless WebGL context, headlessGL not available');
    }
    gl = _globals2.default.globals.headlessGL(width, height, opts);
    if (!gl) {
      throw new Error('headlessGL failed to create headless WebGL context');
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

function logInfo(gl) {
  var webGL = (0, _webglChecks.isWebGL2RenderingContext)(gl) ? 'WebGL2' : 'WebGL1';
  var info = glGetDebugInfo(gl);
  var driver = info ? 'using driver: ' + info.vendor + ' ' + info.renderer : '';
  var debug = gl.debug ? 'debug' : '';
  _utils.log.log(0, 'luma.gl ' + _globals2.default.VERSION + ': ' + webGL + ' ' + debug + ' context ' + driver, gl);

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9jb250ZXh0LmpzIl0sIm5hbWVzIjpbImNyZWF0ZUdMQ29udGV4dCIsImdsR2V0IiwiZ2V0R0xFeHRlbnNpb24iLCJnbEdldERlYnVnSW5mbyIsImdsQ29udGV4dFdpdGhTdGF0ZSIsImdsR2V0RXJyb3IiLCJnbENoZWNrRXJyb3IiLCJnZXRFeHRlbnNpb24iLCJFUlJfV0VCR0xfTUlTU0lOR19CUk9XU0VSIiwiRVJSX1dFQkdMX01JU1NJTkdfTk9ERSIsIlNUQVJUVVBfTUVTU0FHRSIsImNhbnZhcyIsIndpZHRoIiwiaGVpZ2h0Iiwid2ViZ2wyIiwiZGVidWciLCJvcHRzIiwiZ2wiLCJFcnJvciIsImdsb2JhbHMiLCJoZWFkbGVzc0dMIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsImNyZWF0ZUVsZW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwibG9nIiwiZSIsInN0YXR1c01lc3NhZ2UiLCJnZXRDb250ZXh0IiwiZGVidWdHTCIsIm1ha2VEZWJ1Z0NvbnRleHQiLCJ0aHJvd09uRXJyb3IiLCJ2YWxpZGF0ZUFyZ3NBbmRMb2ciLCJXZWJHTERlYnVnQ29udGV4dCIsIk9iamVjdCIsImFzc2lnbiIsInByb3RvdHlwZSIsInByaW9yaXR5IiwibG9nSW5mbyIsIndlYkdMIiwiaW5mbyIsImRyaXZlciIsInZlbmRvciIsInJlbmRlcmVyIiwiVkVSU0lPTiIsIm5hbWUiLCJ2YWx1ZSIsInVuZGVmaW5lZCIsImV4dGVuc2lvbk5hbWUiLCJFUlJPUiIsImV4dGVuc2lvbiIsIlVOTUFTS0VEX1ZFTkRPUl9XRUJHTCIsIlVOTUFTS0VEX1JFTkRFUkVSX1dFQkdMIiwiZ2V0UGFyYW1ldGVyIiwiZnVuYyIsInNjaXNzb3JUZXN0IiwiZnJhbWVCdWZmZXIiLCJzY2lzc29yVGVzdFdhc0VuYWJsZWQiLCJpc0VuYWJsZWQiLCJTQ0lTU09SX1RFU1QiLCJ4IiwieSIsInciLCJoIiwiZW5hYmxlIiwic2Npc3NvciIsImJpbmQiLCJkaXNhYmxlIiwiYmluZEZyYW1lYnVmZmVyIiwiRlJBTUVCVUZGRVIiLCJnZXRGdW5jdGlvblN0cmluZyIsImZ1bmN0aW9uTmFtZSIsImZ1bmN0aW9uQXJncyIsImFyZ3MiLCJnbEZ1bmN0aW9uQXJnc1RvU3RyaW5nIiwic2xpY2UiLCJsZW5ndGgiLCJlcnIiLCJlcnJvck1lc3NhZ2UiLCJnbEVudW1Ub1N0cmluZyIsImZ1bmN0aW9uU3RyaW5nIiwiYXJnIiwiYnJlYWsiLCJpc0JyZWFrcG9pbnQiLCJldmVyeSIsImluZGV4T2YiLCJicmVha1N0cmluZyIsImVycm9yU3RhY2siLCJnbEVycm9yIiwiZ2V0RXJyb3IiLCJOT19FUlJPUiIsInB1c2giLCJnbEdldEVycm9yTWVzc2FnZSIsImpvaW4iLCJlcnJvciIsIkNPTlRFWFRfTE9TVF9XRUJHTCIsIklOVkFMSURfRU5VTSIsIklOVkFMSURfVkFMVUUiLCJJTlZBTElEX09QRVJBVElPTiIsIklOVkFMSURfRlJBTUVCVUZGRVJfT1BFUkFUSU9OIiwiT1VUX09GX01FTU9SWSIsIndhcm4iXSwibWFwcGluZ3MiOiI7Ozs7O1FBeUJnQkEsZSxHQUFBQSxlO1FBMEZBQyxLLEdBQUFBLEs7UUFZQUMsYyxHQUFBQSxjO1FBV0FDLGMsR0FBQUEsYztRQWNBQyxrQixHQUFBQSxrQjtRQTJFQUMsVSxHQUFBQSxVO1FBV0FDLFksR0FBQUEsWTtRQXVDQUMsWSxHQUFBQSxZOztBQW5SaEI7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOztBQUNBOzs7Ozs7Ozs2TkFQQTtBQUNBOzs7QUFPQTs7QUFFQSxJQUFNQyw4SUFBTjs7QUFJQSxJQUFNQyxxS0FBTjs7QUFJQSxJQUFNQyx3TkFBTjs7QUFLQTtBQUNBO0FBQ08sU0FBU1YsZUFBVCxHQWNDO0FBQUEsaUZBQUosRUFBSTs7QUFBQSxNQVpOVyxNQVlNLFFBWk5BLE1BWU07QUFBQSx3QkFWTkMsS0FVTTtBQUFBLE1BVk5BLEtBVU0sOEJBVkUsR0FVRjtBQUFBLHlCQVROQyxNQVNNO0FBQUEsTUFUTkEsTUFTTSwrQkFURyxHQVNIO0FBQUEsd0JBTk5DLE1BTU07QUFBQSxNQU5OQSxNQU1NLDhCQU5HLEtBTUg7QUFBQSx3QkFITkMsS0FHTTtBQUFBLE1BSE5BLEtBR00sOEJBSEUsSUFHRjs7QUFBQSxNQURIQyxJQUNHOztBQUNOLE1BQUlDLFdBQUo7O0FBRUEsTUFBSSxpQkFBSixFQUFnQjtBQUNkO0FBQ0EsUUFBSSxnQ0FBSixFQUEwQjtBQUN4QixZQUFNLElBQUlDLEtBQUosQ0FBVVQsc0JBQVYsQ0FBTjtBQUNEO0FBQ0QsUUFBSSxDQUFDLGtCQUFLVSxPQUFMLENBQWFDLFVBQWxCLEVBQThCO0FBQzVCLFlBQU0sSUFBSUYsS0FBSixDQUNKLGdFQURJLENBQU47QUFFRDtBQUNERCxTQUFLLGtCQUFLRSxPQUFMLENBQWFDLFVBQWIsQ0FBd0JSLEtBQXhCLEVBQStCQyxNQUEvQixFQUF1Q0csSUFBdkMsQ0FBTDtBQUNBLFFBQUksQ0FBQ0MsRUFBTCxFQUFTO0FBQ1AsWUFBTSxJQUFJQyxLQUFKLENBQVUsb0RBQVYsQ0FBTjtBQUNEO0FBQ0YsR0FiRCxNQWFPO0FBQ0w7QUFDQSxRQUFJLGdDQUFKLEVBQTBCO0FBQ3hCLFlBQU0sSUFBSUEsS0FBSixDQUFVVix5QkFBVixDQUFOO0FBQ0Q7QUFDRDtBQUNBLFFBQUksT0FBT0csTUFBUCxLQUFrQixRQUF0QixFQUFnQztBQUM5QkEsZUFBU1UsU0FBU0MsY0FBVCxDQUF3QlgsTUFBeEIsQ0FBVDtBQUNEO0FBQ0QsUUFBSSxDQUFDQSxNQUFMLEVBQWE7QUFDWEEsZUFBU1UsU0FBU0UsYUFBVCxDQUF1QixRQUF2QixDQUFUO0FBQ0Q7O0FBRURaLFdBQU9hLGdCQUFQLENBQXdCLDJCQUF4QixFQUFxRCxhQUFLO0FBQ3hELGlCQUFJQyxHQUFKLENBQVEsQ0FBUixFQUFXQyxFQUFFQyxhQUFGLElBQW1CLGVBQTlCO0FBQ0QsS0FGRCxFQUVHLEtBRkg7O0FBSUE7QUFDQSxRQUFJYixNQUFKLEVBQVk7QUFDVkcsV0FBS04sT0FBT2lCLFVBQVAsQ0FBa0IsUUFBbEIsRUFBNEJaLElBQTVCLENBQUw7QUFDQUMsV0FBS0EsTUFBTU4sT0FBT2lCLFVBQVAsQ0FBa0IscUJBQWxCLEVBQXlDWixJQUF6QyxDQUFYO0FBQ0Q7QUFDREMsU0FBS0EsTUFBTU4sT0FBT2lCLFVBQVAsQ0FBa0IsT0FBbEIsRUFBMkJaLElBQTNCLENBQVg7QUFDQUMsU0FBS0EsTUFBTU4sT0FBT2lCLFVBQVAsQ0FBa0Isb0JBQWxCLEVBQXdDWixJQUF4QyxDQUFYOztBQUVBLDBCQUFPQyxFQUFQLEVBQVcsd0NBQVg7QUFDRDs7QUFFRCxNQUFJLG9CQUFhRixLQUFqQixFQUF3QjtBQUN0QixRQUFNYyxVQUNKLHFCQUFXQyxnQkFBWCxDQUE0QmIsRUFBNUIsRUFBZ0NjLFlBQWhDLEVBQThDQyxrQkFBOUMsQ0FERjs7QUFEc0IsUUFHaEJDLGlCQUhnQjtBQUFBO0FBQUE7O0FBSXRCQyxXQUFPQyxNQUFQLENBQWNGLGtCQUFrQkcsU0FBaEMsRUFBMkNQLE9BQTNDO0FBQ0FaLFNBQUtZLE9BQUw7QUFDQVosT0FBR0YsS0FBSCxHQUFXLElBQVg7QUFDQSxlQUFJc0IsUUFBSixHQUFlLFdBQUlBLFFBQUosR0FBZSxDQUFmLEdBQW1CLENBQW5CLEdBQXVCLFdBQUlBLFFBQTFDOztBQUVBQyxZQUFRckIsRUFBUjs7QUFFQSxlQUFJUSxHQUFKLENBQVEsQ0FBUixFQUFXZixlQUFYO0FBQ0Q7O0FBRUQsU0FBT08sRUFBUDtBQUNEOztBQUVELFNBQVNxQixPQUFULENBQWlCckIsRUFBakIsRUFBcUI7QUFDbkIsTUFBTXNCLFFBQVEsMkNBQXlCdEIsRUFBekIsSUFBK0IsUUFBL0IsR0FBMEMsUUFBeEQ7QUFDQSxNQUFNdUIsT0FBT3JDLGVBQWVjLEVBQWYsQ0FBYjtBQUNBLE1BQU13QixTQUFTRCwwQkFBd0JBLEtBQUtFLE1BQTdCLFNBQXVDRixLQUFLRyxRQUE1QyxHQUF5RCxFQUF4RTtBQUNBLE1BQU01QixRQUFRRSxHQUFHRixLQUFILEdBQVcsT0FBWCxHQUFxQixFQUFuQztBQUNBLGFBQUlVLEdBQUosQ0FBUSxDQUFSLGVBQ2Esa0JBQUttQixPQURsQixVQUM4QkwsS0FEOUIsU0FDdUN4QixLQUR2QyxpQkFDd0QwQixNQUR4RCxFQUNrRXhCLEVBRGxFOztBQUdBO0FBQ0E7QUFDRDs7QUFFRDs7QUFFQTtBQUNPLFNBQVNoQixLQUFULENBQWVnQixFQUFmLEVBQW1CNEIsSUFBbkIsRUFBeUI7QUFDOUI7O0FBRUEsTUFBSUMsUUFBUUQsSUFBWjtBQUNBLE1BQUksT0FBT0EsSUFBUCxLQUFnQixRQUFwQixFQUE4QjtBQUM1QkMsWUFBUTdCLEdBQUc0QixJQUFILENBQVI7QUFDQSwwQkFBT0MsVUFBVUMsU0FBakIsb0JBQTRDRixJQUE1QztBQUNEO0FBQ0QsU0FBT0MsS0FBUDtBQUNEOztBQUVEO0FBQ08sU0FBUzVDLGNBQVQsQ0FBd0JlLEVBQXhCLEVBQTRCK0IsYUFBNUIsRUFBMkM7QUFDaEQ7O0FBRUEsTUFBTUMsUUFBUSw2QkFBZDtBQUNBLHdCQUFPaEMsK0NBQVAsRUFBNENnQyxLQUE1QztBQUNBLHdCQUFPLE9BQU9ELGFBQVAsS0FBeUIsUUFBaEMsRUFBMENDLEtBQTFDO0FBQ0EsTUFBTUMsWUFBWWpDLEdBQUdWLFlBQUgsQ0FBZ0J5QyxhQUFoQixDQUFsQjtBQUNBLHdCQUFPRSxTQUFQLEVBQXFCRixhQUFyQjtBQUNBLFNBQU9FLFNBQVA7QUFDRDs7QUFFTSxTQUFTL0MsY0FBVCxDQUF3QmMsRUFBeEIsRUFBNEI7QUFDakMsTUFBTXVCLE9BQU92QixHQUFHVixZQUFILENBQWdCLDJCQUFoQixDQUFiO0FBQ0E7QUFDQSxNQUFJaUMsUUFBUUEsS0FBS1cscUJBQWIsSUFBc0NYLEtBQUtZLHVCQUEvQyxFQUF3RTtBQUN0RSxXQUFPO0FBQ0xWLGNBQVF6QixHQUFHb0MsWUFBSCxDQUFnQmIsS0FBS1cscUJBQXJCLENBREg7QUFFTFIsZ0JBQVUxQixHQUFHb0MsWUFBSCxDQUFnQmIsS0FBS1ksdUJBQXJCO0FBRkwsS0FBUDtBQUlEO0FBQ0QsU0FBTyxJQUFQO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNPLFNBQVNoRCxrQkFBVCxDQUE0QmEsRUFBNUIsU0FBNERxQyxJQUE1RCxFQUFrRTtBQUFBLE1BQWpDQyxXQUFpQyxTQUFqQ0EsV0FBaUM7QUFBQSxNQUFwQkMsV0FBb0IsU0FBcEJBLFdBQW9COztBQUN2RTs7QUFFQSxNQUFJQyw4QkFBSjtBQUNBLE1BQUlGLFdBQUosRUFBaUI7QUFDZkUsNEJBQXdCeEMsR0FBR3lDLFNBQUgsQ0FBYXpDLEdBQUcwQyxZQUFoQixDQUF4QjtBQURlLFFBRVJDLENBRlEsR0FFTUwsV0FGTixDQUVSSyxDQUZRO0FBQUEsUUFFTEMsQ0FGSyxHQUVNTixXQUZOLENBRUxNLENBRks7QUFBQSxRQUVGQyxDQUZFLEdBRU1QLFdBRk4sQ0FFRk8sQ0FGRTtBQUFBLFFBRUNDLENBRkQsR0FFTVIsV0FGTixDQUVDUSxDQUZEOztBQUdmOUMsT0FBRytDLE1BQUgsQ0FBVS9DLEdBQUcwQyxZQUFiO0FBQ0ExQyxPQUFHZ0QsT0FBSCxDQUFXTCxDQUFYLEVBQWNDLENBQWQsRUFBaUJDLENBQWpCLEVBQW9CQyxDQUFwQjtBQUNEOztBQUVELE1BQUlQLFdBQUosRUFBaUI7QUFDZjtBQUNBQSxnQkFBWVUsSUFBWjtBQUNEOztBQUVELE1BQUk7QUFDRlosU0FBS3JDLEVBQUw7QUFDRCxHQUZELFNBRVU7QUFDUixRQUFJLENBQUN3QyxxQkFBTCxFQUE0QjtBQUMxQnhDLFNBQUdrRCxPQUFILENBQVdsRCxHQUFHMEMsWUFBZDtBQUNEO0FBQ0QsUUFBSUgsV0FBSixFQUFpQjtBQUNmO0FBQ0E7QUFDQXZDLFNBQUdtRCxlQUFILENBQW1CbkQsR0FBR29ELFdBQXRCLEVBQW1DLElBQW5DO0FBQ0Q7QUFDRjtBQUNGOztBQUVELFNBQVNDLGlCQUFULENBQTJCQyxZQUEzQixFQUF5Q0MsWUFBekMsRUFBdUQ7QUFDckQsTUFBSUMsT0FBTyxxQkFBV0Msc0JBQVgsQ0FBa0NILFlBQWxDLEVBQWdEQyxZQUFoRCxDQUFYO0FBQ0FDLGNBQVVBLEtBQUtFLEtBQUwsQ0FBVyxDQUFYLEVBQWMsR0FBZCxDQUFWLElBQStCRixLQUFLRyxNQUFMLEdBQWMsR0FBZCxHQUFvQixLQUFwQixHQUE0QixFQUEzRDtBQUNBLGlCQUFhTCxZQUFiLFNBQTZCRSxJQUE3QjtBQUNEOztBQUVELFNBQVMxQyxZQUFULENBQXNCOEMsR0FBdEIsRUFBMkJOLFlBQTNCLEVBQXlDRSxJQUF6QyxFQUErQztBQUM3QyxNQUFNSyxlQUFlLHFCQUFXQyxjQUFYLENBQTBCRixHQUExQixDQUFyQjtBQUNBLE1BQU1MLGVBQWUscUJBQVdFLHNCQUFYLENBQWtDSCxZQUFsQyxFQUFnREUsSUFBaEQsQ0FBckI7QUFDQSxRQUFNLElBQUl2RCxLQUFKLENBQWE0RCxZQUFILHlDQUNSUCxZQURRLFNBQ1FDLFlBRFIsT0FBVixDQUFOO0FBRUQ7O0FBRUQ7QUFDQSxTQUFTeEMsa0JBQVQsQ0FBNEJ1QyxZQUE1QixFQUEwQ0MsWUFBMUMsRUFBd0Q7QUFDdEQsTUFBSVEsdUJBQUo7QUFDQSxNQUFJLFdBQUkzQyxRQUFKLElBQWdCLENBQXBCLEVBQXVCO0FBQ3JCMkMscUJBQWlCVixrQkFBa0JDLFlBQWxCLEVBQWdDQyxZQUFoQyxDQUFqQjtBQUNBLGVBQUloQyxJQUFKLENBQVMsQ0FBVCxPQUFld0MsY0FBZjtBQUNEOztBQUxxRDtBQUFBO0FBQUE7O0FBQUE7QUFPdEQseUJBQWtCUixZQUFsQiw4SEFBZ0M7QUFBQSxVQUFyQlMsR0FBcUI7O0FBQzlCLFVBQUlBLFFBQVFsQyxTQUFaLEVBQXVCO0FBQ3JCaUMseUJBQWlCQSxrQkFDZlYsa0JBQWtCQyxZQUFsQixFQUFnQ0MsWUFBaEMsQ0FERjtBQUVBLGNBQU0sSUFBSXRELEtBQUosMEJBQWlDOEQsY0FBakMsQ0FBTjtBQUNEO0FBQ0Y7QUFicUQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFldEQsTUFBSSxXQUFJRSxLQUFSLEVBQWU7QUFDYkYscUJBQWlCQSxrQkFDZlYsa0JBQWtCQyxZQUFsQixFQUFnQ0MsWUFBaEMsQ0FERjtBQUVBLFFBQU1XLGVBQWUsV0FBSUQsS0FBSixJQUFhLFdBQUlBLEtBQUosQ0FBVUUsS0FBVixDQUNoQztBQUFBLGFBQWVKLGVBQWVLLE9BQWYsQ0FBdUJDLFdBQXZCLE1BQXdDLENBQUMsQ0FBeEQ7QUFBQSxLQURnQyxDQUFsQzs7QUFJQTtBQUNBLFFBQUlILFlBQUosRUFBa0I7QUFDaEI7QUFDRDtBQUNEO0FBQ0Q7QUFDRjs7QUFFRDtBQUNPLFNBQVM5RSxVQUFULENBQW9CWSxFQUFwQixFQUF3QjtBQUM3QjtBQUNBLE1BQU1zRSxhQUFhLEVBQW5CO0FBQ0EsTUFBSUMsVUFBVXZFLEdBQUd3RSxRQUFILEVBQWQ7QUFDQSxTQUFPRCxZQUFZdkUsR0FBR3lFLFFBQXRCLEVBQWdDO0FBQzlCSCxlQUFXSSxJQUFYLENBQWdCQyxrQkFBa0IzRSxFQUFsQixFQUFzQnVFLE9BQXRCLENBQWhCO0FBQ0FBLGNBQVV2RSxHQUFHd0UsUUFBSCxFQUFWO0FBQ0Q7QUFDRCxTQUFPRixXQUFXWCxNQUFYLEdBQW9CLElBQUkxRCxLQUFKLENBQVVxRSxXQUFXTSxJQUFYLENBQWdCLElBQWhCLENBQVYsQ0FBcEIsR0FBdUQsSUFBOUQ7QUFDRDs7QUFFTSxTQUFTdkYsWUFBVCxDQUFzQlcsRUFBdEIsRUFBMEI7QUFDL0IsTUFBSUEsR0FBR0YsS0FBUCxFQUFjO0FBQ1osUUFBTStFLFFBQVF6RixXQUFXWSxFQUFYLENBQWQ7QUFDQSxRQUFJNkUsS0FBSixFQUFXO0FBQ1QsWUFBTUEsS0FBTjtBQUNEO0FBQ0Y7QUFDRjs7QUFFRCxTQUFTRixpQkFBVCxDQUEyQjNFLEVBQTNCLEVBQStCdUUsT0FBL0IsRUFBd0M7QUFDdEMsVUFBUUEsT0FBUjtBQUNBLFNBQUt2RSxHQUFHOEUsa0JBQVI7QUFDRTtBQUNBO0FBQ0E7QUFDQSxhQUFPLG9CQUFQO0FBQ0YsU0FBSzlFLEdBQUcrRSxZQUFSO0FBQ0U7QUFDQSxhQUFPLG1DQUFQO0FBQ0YsU0FBSy9FLEdBQUdnRixhQUFSO0FBQ0U7QUFDQSxhQUFPLHFCQUFQO0FBQ0YsU0FBS2hGLEdBQUdpRixpQkFBUjtBQUNFO0FBQ0EsYUFBTyx5QkFBUDtBQUNGLFNBQUtqRixHQUFHa0YsNkJBQVI7QUFDRTtBQUNBO0FBQ0EsYUFBTyxxQ0FBUDtBQUNGLFNBQUtsRixHQUFHbUYsYUFBUjtBQUNFO0FBQ0EsYUFBTyxxQkFBUDtBQUNGO0FBQ0Usc0NBQThCWixPQUE5QjtBQXZCRjtBQXlCRDs7QUFFRDs7QUFFTyxTQUFTakYsWUFBVCxDQUFzQlUsRUFBdEIsRUFBMEIrQixhQUExQixFQUF5QztBQUM5QyxhQUFJcUQsSUFBSixDQUFTLENBQVQsRUFBWSxxQ0FBWjtBQUNBLFNBQU9uRyxlQUFlZSxFQUFmLEVBQW1CK0IsYUFBbkIsQ0FBUDtBQUNEIiwiZmlsZSI6ImNvbnRleHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgcmVsYXRlZCBtZXRob2RzXG4vKiBlc2xpbnQtZGlzYWJsZSBuby10cnktY2F0Y2gsIG5vLWxvb3AtZnVuYyAqL1xuaW1wb3J0IFdlYkdMRGVidWcgZnJvbSAnd2ViZ2wtZGVidWcnO1xuaW1wb3J0IHtXZWJHTFJlbmRlcmluZ0NvbnRleHQsIHdlYkdMVHlwZXNBdmFpbGFibGV9IGZyb20gJy4vd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHtpc1dlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtY2hlY2tzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7bG9nLCBpc0Jyb3dzZXJ9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBsdW1hIGZyb20gJy4uL2dsb2JhbHMnO1xuLyogZ2xvYmFsIGRvY3VtZW50ICovXG5cbmNvbnN0IEVSUl9XRUJHTF9NSVNTSU5HX0JST1dTRVIgPSBgXFxcbldlYkdMIEFQSSBpcyBtaXNzaW5nLiBDaGVjayB5b3VyIGlmIHlvdXIgYnJvd3NlciBzdXBwb3J0cyBXZWJHTCBvclxuaW5zdGFsbCBhIHJlY2VudCB2ZXJzaW9uIG9mIGEgbWFqb3IgYnJvd3Nlci5gO1xuXG5jb25zdCBFUlJfV0VCR0xfTUlTU0lOR19OT0RFID0gYFxcXG5XZWJHTCBBUEkgaXMgbWlzc2luZy4gVG8gcnVuIGx1bWEuZ2wgdW5kZXIgTm9kZS5qcywgcGxlYXNlIFwibnBtIGluc3RhbGwgZ2xcIlxuYW5kIGltcG9ydCAnbHVtYS5nbC9oZWFkbGVzcycgYmVmb3JlIGltcG9ydGluZyAnbHVtYS5nbCcuYDtcblxuY29uc3QgU1RBUlRVUF9NRVNTQUdFID0gYFxcXG5Bc3NpZ24gbHVtYS5sb2cucHJpb3JpdHkgaW4gY29uc29sZSB0byBjb250cm9sIGxvZ2dpbmc6IFxcXG4wOiBub25lLCAxOiBtaW5pbWFsLCAyOiB2ZXJib3NlLCAzOiBhdHRyaWJ1dGUvdW5pZm9ybXMsIDQ6IGdsIGxvZ3Ncbmx1bWEubG9nLmJyZWFrW10sIHNldCB0byBnbCBmdW5jcywgbHVtYS5sb2cucHJvZmlsZVtdIHNldCB0byBtb2RlbCBuYW1lc2A7XG5cbi8vIENoZWNrcyBpZiBXZWJHTCBpcyBlbmFibGVkIGFuZCBjcmVhdGVzIGEgY29udGV4dCBmb3IgdXNpbmcgV2ViR0wuXG4vKiBlc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5LCBtYXgtc3RhdGVtZW50cyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdMQ29udGV4dCh7XG4gIC8vIEJST1dTRVIgQ09OVEVYVCBQQVJBTUFURVJTOiBjYW52YXMgaXMgb25seSB1c2VkIHdoZW4gaW4gYnJvd3NlclxuICBjYW52YXMsXG4gIC8vIEhFQURMRVNTIENPTlRFWFQgUEFSQU1FVEVSUzogd2lkdGggYXJlIGhlaWdodCBhcmUgb25seSB1c2VkIGJ5IGhlYWRsZXNzIGdsXG4gIHdpZHRoID0gODAwLFxuICBoZWlnaHQgPSA2MDAsXG4gIC8vIENPTU1PTiBDT05URVhUIFBBUkFNRVRFUlNcbiAgLy8gQXR0ZW1wdCB0byBhbGxvY2F0ZSBXZWJHTDIgY29udGV4dFxuICB3ZWJnbDIgPSBmYWxzZSxcbiAgLy8gSW5zdHJ1bWVudCBjb250ZXh0IChhdCB0aGUgZXhwZW5zZSBvZiBwZXJmb3JtYW5jZSlcbiAgLy8gTm90ZTogZGVmYXVsdHMgdG8gdHJ1ZSBhbmQgbmVlZHMgdG8gYmUgZXhwbGljaXRseSB0dXJuIG9mZlxuICBkZWJ1ZyA9IHRydWUsXG4gIC8vIE90aGVyIG9wdGlvbnMgYXJlIHBhc3NlZCB0aHJvdWdoIHRvIGNvbnRleHQgY3JlYXRvclxuICAuLi5vcHRzXG59ID0ge30pIHtcbiAgbGV0IGdsO1xuXG4gIGlmICghaXNCcm93c2VyKSB7XG4gICAgLy8gQ3JlYXRlIGhlYWRsZXNzIGdsIGNvbnRleHRcbiAgICBpZiAoIXdlYkdMVHlwZXNBdmFpbGFibGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihFUlJfV0VCR0xfTUlTU0lOR19OT0RFKTtcbiAgICB9XG4gICAgaWYgKCFsdW1hLmdsb2JhbHMuaGVhZGxlc3NHTCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnQ2Fubm90IGNyZWF0ZSBoZWFkbGVzcyBXZWJHTCBjb250ZXh0LCBoZWFkbGVzc0dMIG5vdCBhdmFpbGFibGUnKTtcbiAgICB9XG4gICAgZ2wgPSBsdW1hLmdsb2JhbHMuaGVhZGxlc3NHTCh3aWR0aCwgaGVpZ2h0LCBvcHRzKTtcbiAgICBpZiAoIWdsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2hlYWRsZXNzR0wgZmFpbGVkIHRvIGNyZWF0ZSBoZWFkbGVzcyBXZWJHTCBjb250ZXh0Jyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIENyZWF0ZSBicm93c2VyIGdsIGNvbnRleHRcbiAgICBpZiAoIXdlYkdMVHlwZXNBdmFpbGFibGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihFUlJfV0VCR0xfTUlTU0lOR19CUk9XU0VSKTtcbiAgICB9XG4gICAgLy8gTWFrZSBzdXJlIHdlIGhhdmUgYSBjYW52YXNcbiAgICBpZiAodHlwZW9mIGNhbnZhcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhcyk7XG4gICAgfVxuICAgIGlmICghY2FudmFzKSB7XG4gICAgICBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB9XG5cbiAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignd2ViZ2xjb250ZXh0Y3JlYXRpb25lcnJvcicsIGUgPT4ge1xuICAgICAgbG9nLmxvZygwLCBlLnN0YXR1c01lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InKTtcbiAgICB9LCBmYWxzZSk7XG5cbiAgICAvLyBQcmVmZXIgd2ViZ2wyIG92ZXIgd2ViZ2wxLCBwcmVmZXIgY29uZm9ybWFudCBvdmVyIGV4cGVyaW1lbnRhbFxuICAgIGlmICh3ZWJnbDIpIHtcbiAgICAgIGdsID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsMicsIG9wdHMpO1xuICAgICAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsMicsIG9wdHMpO1xuICAgIH1cbiAgICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcsIG9wdHMpO1xuICAgIGdsID0gZ2wgfHwgY2FudmFzLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcsIG9wdHMpO1xuXG4gICAgYXNzZXJ0KGdsLCAnRmFpbGVkIHRvIGNyZWF0ZSBXZWJHTFJlbmRlcmluZ0NvbnRleHQnKTtcbiAgfVxuXG4gIGlmIChpc0Jyb3dzZXIgJiYgZGVidWcpIHtcbiAgICBjb25zdCBkZWJ1Z0dMID1cbiAgICAgIFdlYkdMRGVidWcubWFrZURlYnVnQ29udGV4dChnbCwgdGhyb3dPbkVycm9yLCB2YWxpZGF0ZUFyZ3NBbmRMb2cpO1xuICAgIGNsYXNzIFdlYkdMRGVidWdDb250ZXh0IHt9XG4gICAgT2JqZWN0LmFzc2lnbihXZWJHTERlYnVnQ29udGV4dC5wcm90b3R5cGUsIGRlYnVnR0wpO1xuICAgIGdsID0gZGVidWdHTDtcbiAgICBnbC5kZWJ1ZyA9IHRydWU7XG4gICAgbG9nLnByaW9yaXR5ID0gbG9nLnByaW9yaXR5IDwgMSA/IDEgOiBsb2cucHJpb3JpdHk7XG5cbiAgICBsb2dJbmZvKGdsKTtcblxuICAgIGxvZy5sb2coMCwgU1RBUlRVUF9NRVNTQUdFKTtcbiAgfVxuXG4gIHJldHVybiBnbDtcbn1cblxuZnVuY3Rpb24gbG9nSW5mbyhnbCkge1xuICBjb25zdCB3ZWJHTCA9IGlzV2ViR0wyUmVuZGVyaW5nQ29udGV4dChnbCkgPyAnV2ViR0wyJyA6ICdXZWJHTDEnO1xuICBjb25zdCBpbmZvID0gZ2xHZXREZWJ1Z0luZm8oZ2wpO1xuICBjb25zdCBkcml2ZXIgPSBpbmZvID8gYHVzaW5nIGRyaXZlcjogJHtpbmZvLnZlbmRvcn0gJHtpbmZvLnJlbmRlcmVyfWAgOiAnJztcbiAgY29uc3QgZGVidWcgPSBnbC5kZWJ1ZyA/ICdkZWJ1ZycgOiAnJztcbiAgbG9nLmxvZygwLFxuICAgIGBsdW1hLmdsICR7bHVtYS5WRVJTSU9OfTogJHt3ZWJHTH0gJHtkZWJ1Z30gY29udGV4dCAke2RyaXZlcn1gLCBnbCk7XG5cbiAgLy8gY29uc3QgZXh0ZW5zaW9ucyA9IGdsLmdldFN1cHBvcnRlZEV4dGVuc2lvbnMoKTtcbiAgLy8gbG9nLmxvZygwLCBgU3VwcG9ydGVkIGV4dGVuc2lvbnM6IFske2V4dGVuc2lvbnMuam9pbignLCAnKX1dYCk7XG59XG5cbi8vIGFsZXJ0KFdlYkdMRGVidWdVdGlscy5nbEVudW1Ub1N0cmluZyhjdHguZ2V0RXJyb3IoKSkpO1xuXG4vLyBSZXNvbHZlIGEgV2ViR0wgZW51bWVyYXRpb24gbmFtZSAocmV0dXJucyBpdHNlbGYgaWYgYWxyZWFkeSBhIG51bWJlcilcbmV4cG9ydCBmdW5jdGlvbiBnbEdldChnbCwgbmFtZSkge1xuICAvLyBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuXG4gIGxldCB2YWx1ZSA9IG5hbWU7XG4gIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWx1ZSA9IGdsW25hbWVdO1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkLCBgQWNjZXNzaW5nIGdsLiR7bmFtZX1gKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8vIFJldHVybnMgdGhlIGV4dGVuc2lvbiBvciB0aHJvd3MgYW4gZXJyb3JcbmV4cG9ydCBmdW5jdGlvbiBnZXRHTEV4dGVuc2lvbihnbCwgZXh0ZW5zaW9uTmFtZSkge1xuICAvLyBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuXG4gIGNvbnN0IEVSUk9SID0gJ0lsbGVnYWwgYXJnIHRvIGdldEV4dGVuc2lvbic7XG4gIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMUmVuZGVyaW5nQ29udGV4dCwgRVJST1IpO1xuICBhc3NlcnQodHlwZW9mIGV4dGVuc2lvbk5hbWUgPT09ICdzdHJpbmcnLCBFUlJPUik7XG4gIGNvbnN0IGV4dGVuc2lvbiA9IGdsLmdldEV4dGVuc2lvbihleHRlbnNpb25OYW1lKTtcbiAgYXNzZXJ0KGV4dGVuc2lvbiwgYCR7ZXh0ZW5zaW9uTmFtZX0gbm90IHN1cHBvcnRlZCFgKTtcbiAgcmV0dXJuIGV4dGVuc2lvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdsR2V0RGVidWdJbmZvKGdsKSB7XG4gIGNvbnN0IGluZm8gPSBnbC5nZXRFeHRlbnNpb24oJ1dFQkdMX2RlYnVnX3JlbmRlcmVyX2luZm8nKTtcbiAgLyogQXZvaWQgRmlyZWZveCBpc3N1ZXMgd2l0aCBkZWJ1ZyBjb250ZXh0IGFuZCBleHRlbnNpb25zICovXG4gIGlmIChpbmZvICYmIGluZm8uVU5NQVNLRURfVkVORE9SX1dFQkdMICYmIGluZm8uVU5NQVNLRURfUkVOREVSRVJfV0VCR0wpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdmVuZG9yOiBnbC5nZXRQYXJhbWV0ZXIoaW5mby5VTk1BU0tFRF9WRU5ET1JfV0VCR0wpLFxuICAgICAgcmVuZGVyZXI6IGdsLmdldFBhcmFtZXRlcihpbmZvLlVOTUFTS0VEX1JFTkRFUkVSX1dFQkdMKVxuICAgIH07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8vIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2l0aCBnbCBzdGF0ZXMgdGVtcG9yYXJpbHkgc2V0LCBleGNlcHRpb24gc2FmZVxuLy8gQ3VycmVudGx5IHN1cHBvcnQgc2Npc3NvciB0ZXN0IGFuZCBmcmFtZWJ1ZmZlciBiaW5kaW5nXG5leHBvcnQgZnVuY3Rpb24gZ2xDb250ZXh0V2l0aFN0YXRlKGdsLCB7c2Npc3NvclRlc3QsIGZyYW1lQnVmZmVyfSwgZnVuYykge1xuICAvLyBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuXG4gIGxldCBzY2lzc29yVGVzdFdhc0VuYWJsZWQ7XG4gIGlmIChzY2lzc29yVGVzdCkge1xuICAgIHNjaXNzb3JUZXN0V2FzRW5hYmxlZCA9IGdsLmlzRW5hYmxlZChnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGNvbnN0IHt4LCB5LCB3LCBofSA9IHNjaXNzb3JUZXN0O1xuICAgIGdsLmVuYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGdsLnNjaXNzb3IoeCwgeSwgdywgaCk7XG4gIH1cblxuICBpZiAoZnJhbWVCdWZmZXIpIHtcbiAgICAvLyBUT0RPIC0gd2FzIHRoZXJlIGFueSBwcmV2aW91c2x5IHNldCBmcmFtZSBidWZmZXIgd2UgbmVlZCB0byByZW1lbWJlcj9cbiAgICBmcmFtZUJ1ZmZlci5iaW5kKCk7XG4gIH1cblxuICB0cnkge1xuICAgIGZ1bmMoZ2wpO1xuICB9IGZpbmFsbHkge1xuICAgIGlmICghc2Npc3NvclRlc3RXYXNFbmFibGVkKSB7XG4gICAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgfVxuICAgIGlmIChmcmFtZUJ1ZmZlcikge1xuICAgICAgLy8gVE9ETyAtIHdhcyB0aGVyZSBhbnkgcHJldmlvdXNseSBzZXQgZnJhbWUgYnVmZmVyP1xuICAgICAgLy8gVE9ETyAtIGRlbGVnYXRlIFwidW5iaW5kXCIgdG8gRnJhbWVidWZmZXIgb2JqZWN0P1xuICAgICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0RnVuY3Rpb25TdHJpbmcoZnVuY3Rpb25OYW1lLCBmdW5jdGlvbkFyZ3MpIHtcbiAgbGV0IGFyZ3MgPSBXZWJHTERlYnVnLmdsRnVuY3Rpb25BcmdzVG9TdHJpbmcoZnVuY3Rpb25OYW1lLCBmdW5jdGlvbkFyZ3MpO1xuICBhcmdzID0gYCR7YXJncy5zbGljZSgwLCAxMDApfSR7YXJncy5sZW5ndGggPiAxMDAgPyAnLi4uJyA6ICcnfWA7XG4gIHJldHVybiBgZ2wuJHtmdW5jdGlvbk5hbWV9KCR7YXJnc30pYDtcbn1cblxuZnVuY3Rpb24gdGhyb3dPbkVycm9yKGVyciwgZnVuY3Rpb25OYW1lLCBhcmdzKSB7XG4gIGNvbnN0IGVycm9yTWVzc2FnZSA9IFdlYkdMRGVidWcuZ2xFbnVtVG9TdHJpbmcoZXJyKTtcbiAgY29uc3QgZnVuY3Rpb25BcmdzID0gV2ViR0xEZWJ1Zy5nbEZ1bmN0aW9uQXJnc1RvU3RyaW5nKGZ1bmN0aW9uTmFtZSwgYXJncyk7XG4gIHRocm93IG5ldyBFcnJvcihgJHtlcnJvck1lc3NhZ2V9IHdhcyBjYXVzZWQgYnkgY2FsbCB0bzogYCArXG4gICAgYGdsLiR7ZnVuY3Rpb25OYW1lfSgke2Z1bmN0aW9uQXJnc30pYCk7XG59XG5cbi8vIERvbid0IGdlbmVyYXRlIGZ1bmN0aW9uIHN0cmluZyB1bnRpbCBpdCBpcyBuZWVkZWRcbmZ1bmN0aW9uIHZhbGlkYXRlQXJnc0FuZExvZyhmdW5jdGlvbk5hbWUsIGZ1bmN0aW9uQXJncykge1xuICBsZXQgZnVuY3Rpb25TdHJpbmc7XG4gIGlmIChsb2cucHJpb3JpdHkgPj0gNCkge1xuICAgIGZ1bmN0aW9uU3RyaW5nID0gZ2V0RnVuY3Rpb25TdHJpbmcoZnVuY3Rpb25OYW1lLCBmdW5jdGlvbkFyZ3MpO1xuICAgIGxvZy5pbmZvKDQsIGAke2Z1bmN0aW9uU3RyaW5nfWApO1xuICB9XG5cbiAgZm9yIChjb25zdCBhcmcgb2YgZnVuY3Rpb25BcmdzKSB7XG4gICAgaWYgKGFyZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBmdW5jdGlvblN0cmluZyA9IGZ1bmN0aW9uU3RyaW5nIHx8XG4gICAgICAgIGdldEZ1bmN0aW9uU3RyaW5nKGZ1bmN0aW9uTmFtZSwgZnVuY3Rpb25BcmdzKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5kZWZpbmVkIGFyZ3VtZW50OiAke2Z1bmN0aW9uU3RyaW5nfWApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChsb2cuYnJlYWspIHtcbiAgICBmdW5jdGlvblN0cmluZyA9IGZ1bmN0aW9uU3RyaW5nIHx8XG4gICAgICBnZXRGdW5jdGlvblN0cmluZyhmdW5jdGlvbk5hbWUsIGZ1bmN0aW9uQXJncyk7XG4gICAgY29uc3QgaXNCcmVha3BvaW50ID0gbG9nLmJyZWFrICYmIGxvZy5icmVhay5ldmVyeShcbiAgICAgIGJyZWFrU3RyaW5nID0+IGZ1bmN0aW9uU3RyaW5nLmluZGV4T2YoYnJlYWtTdHJpbmcpICE9PSAtMVxuICAgICk7XG5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1kZWJ1Z2dlciAqL1xuICAgIGlmIChpc0JyZWFrcG9pbnQpIHtcbiAgICAgIGRlYnVnZ2VyO1xuICAgIH1cbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWRlYnVnZ2VyICovXG4gIH1cbn1cblxuLy8gUmV0dXJucyBhbiBFcnJvciByZXByZXNlbnRpbmcgdGhlIExhdGVzdCB3ZWJHbCBlcnJvciBvciBudWxsXG5leHBvcnQgZnVuY3Rpb24gZ2xHZXRFcnJvcihnbCkge1xuICAvLyBMb29wIHRvIGVuc3VyZSBhbGwgZXJyb3JzIGFyZSBjbGVhcmVkXG4gIGNvbnN0IGVycm9yU3RhY2sgPSBbXTtcbiAgbGV0IGdsRXJyb3IgPSBnbC5nZXRFcnJvcigpO1xuICB3aGlsZSAoZ2xFcnJvciAhPT0gZ2wuTk9fRVJST1IpIHtcbiAgICBlcnJvclN0YWNrLnB1c2goZ2xHZXRFcnJvck1lc3NhZ2UoZ2wsIGdsRXJyb3IpKTtcbiAgICBnbEVycm9yID0gZ2wuZ2V0RXJyb3IoKTtcbiAgfVxuICByZXR1cm4gZXJyb3JTdGFjay5sZW5ndGggPyBuZXcgRXJyb3IoZXJyb3JTdGFjay5qb2luKCdcXG4nKSkgOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2xDaGVja0Vycm9yKGdsKSB7XG4gIGlmIChnbC5kZWJ1Zykge1xuICAgIGNvbnN0IGVycm9yID0gZ2xHZXRFcnJvcihnbCk7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2xHZXRFcnJvck1lc3NhZ2UoZ2wsIGdsRXJyb3IpIHtcbiAgc3dpdGNoIChnbEVycm9yKSB7XG4gIGNhc2UgZ2wuQ09OVEVYVF9MT1NUX1dFQkdMOlxuICAgIC8vICBJZiB0aGUgV2ViR0wgY29udGV4dCBpcyBsb3N0LCB0aGlzIGVycm9yIGlzIHJldHVybmVkIG9uIHRoZVxuICAgIC8vIGZpcnN0IGNhbGwgdG8gZ2V0RXJyb3IuIEFmdGVyd2FyZHMgYW5kIHVudGlsIHRoZSBjb250ZXh0IGhhcyBiZWVuXG4gICAgLy8gcmVzdG9yZWQsIGl0IHJldHVybnMgZ2wuTk9fRVJST1IuXG4gICAgcmV0dXJuICdXZWJHTCBjb250ZXh0IGxvc3QnO1xuICBjYXNlIGdsLklOVkFMSURfRU5VTTpcbiAgICAvLyBBbiB1bmFjY2VwdGFibGUgdmFsdWUgaGFzIGJlZW4gc3BlY2lmaWVkIGZvciBhbiBlbnVtZXJhdGVkIGFyZ3VtZW50LlxuICAgIHJldHVybiAnV2ViR0wgaW52YWxpZCBlbnVtZXJhdGVkIGFyZ3VtZW50JztcbiAgY2FzZSBnbC5JTlZBTElEX1ZBTFVFOlxuICAgIC8vIEEgbnVtZXJpYyBhcmd1bWVudCBpcyBvdXQgb2YgcmFuZ2UuXG4gICAgcmV0dXJuICdXZWJHTCBpbnZhbGlkIHZhbHVlJztcbiAgY2FzZSBnbC5JTlZBTElEX09QRVJBVElPTjpcbiAgICAvLyBUaGUgc3BlY2lmaWVkIGNvbW1hbmQgaXMgbm90IGFsbG93ZWQgZm9yIHRoZSBjdXJyZW50IHN0YXRlLlxuICAgIHJldHVybiAnV2ViR0wgaW52YWxpZCBvcGVyYXRpb24nO1xuICBjYXNlIGdsLklOVkFMSURfRlJBTUVCVUZGRVJfT1BFUkFUSU9OOlxuICAgIC8vIFRoZSBjdXJyZW50bHkgYm91bmQgZnJhbWVidWZmZXIgaXMgbm90IGZyYW1lYnVmZmVyIGNvbXBsZXRlXG4gICAgLy8gd2hlbiB0cnlpbmcgdG8gcmVuZGVyIHRvIG9yIHRvIHJlYWQgZnJvbSBpdC5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgZnJhbWVidWZmZXIgb3BlcmF0aW9uJztcbiAgY2FzZSBnbC5PVVRfT0ZfTUVNT1JZOlxuICAgIC8vIE5vdCBlbm91Z2ggbWVtb3J5IGlzIGxlZnQgdG8gZXhlY3V0ZSB0aGUgY29tbWFuZC5cbiAgICByZXR1cm4gJ1dlYkdMIG91dCBvZiBtZW1vcnknO1xuICBkZWZhdWx0OlxuICAgIHJldHVybiBgV2ViR0wgdW5rbm93biBlcnJvciAke2dsRXJyb3J9YDtcbiAgfVxufVxuXG4vLyBEZXByZWNhdGVkIG1ldGhvZHNcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEV4dGVuc2lvbihnbCwgZXh0ZW5zaW9uTmFtZSkge1xuICBsb2cud2FybigwLCAnbHVtYS5nbDogZ2V0RXh0ZW5zaW9uIGlzIGRlcHJlY2F0ZWQnKTtcbiAgcmV0dXJuIGdldEdMRXh0ZW5zaW9uKGdsLCBleHRlbnNpb25OYW1lKTtcbn1cbiJdfQ==