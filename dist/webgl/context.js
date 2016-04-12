'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createGLContext = createGLContext;
exports.hasWebGL = hasWebGL;
exports.hasExtension = hasExtension;
exports.getExtension = getExtension;
exports.glContextWithState = glContextWithState;
exports.glCheckError = glCheckError;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Checks if WebGL is enabled and creates a context for using WebGL.
function createGLContext(canvas) {
  var opt = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  if (!isBrowserContext()) {
    throw new Error('Can\'t create a WebGL context outside a browser context.');
  }
  canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

  canvas.addEventListener('webglcontextcreationerror', function (e) {
    console.log(e.statusMessage || 'Unknown error');
  }, false);

  // Prefer webgl2 over webgl1, prefer conformant over experimental
  var gl = canvas.getContext('webgl2', opt);
  gl = gl || canvas.getContext('experimental-webgl2', opt);
  gl = gl || canvas.getContext('webgl', opt);
  gl = gl || canvas.getContext('experimental-webgl', opt);

  (0, _assert2.default)(gl, 'Failed to create WebGLRenderingContext');

  // Set as debug handler
  gl = opt.debug ? createDebugContext(gl) : gl;

  // Add a safe get method
  gl.get = function glGet(name) {
    var value = name;
    if (typeof name === 'string') {
      value = this[name];
      (0, _assert2.default)(value, 'Accessing gl.' + name);
    }
    return value;
  };

  return gl;
} // WebGLRenderingContext related methods
/* eslint-disable no-try-catch, no-console, no-loop-func */
/* global window, document, console */


function hasWebGL() {
  if (!isBrowserContext()) {
    return false;
  }
  // Feature test WebGL
  try {
    var canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (error) {
    return false;
  }
}

function hasExtension(name) {
  if (!hasWebGL()) {
    return false;
  }
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  // Should maybe be return !!context.getExtension(name);
  return context.getExtension(name);
}

// Returns the extension or throws an error
function getExtension(gl, extensionName) {
  var extension = gl.getExtension(extensionName);
  (0, _assert2.default)(extension, extensionName + ' not supported!');
  return extension;
}

function isBrowserContext() {
  return typeof window !== 'undefined';
}

// Executes a function with gl states temporarily set, exception safe
// Currently support scissor test and framebuffer binding
function glContextWithState(gl, _ref, func) {
  var scissorTest = _ref.scissorTest;
  var frameBuffer = _ref.frameBuffer;

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

function glCheckError(gl) {
  // Ensure all errors are cleared
  var error = void 0;
  var glError = gl.getError();
  while (glError !== gl.NO_ERROR) {
    if (error) {
      console.error(error);
    } else {
      error = new Error(glGetErrorMessage(gl, glError));
    }
    glError = gl.getError();
  }
  if (error) {
    throw error;
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
      // Not enough memory is left to execute the command.
      return 'WebGL unknown error';
  }
}

// TODO - document or remove
function createDebugContext(ctx) {
  var _arguments = arguments;

  var gl = {};
  for (var m in ctx) {
    var f = ctx[m];
    if (typeof f === 'function') {
      gl[m] = function (k, v) {
        return function () {
          console.log(k, Array.prototype.join.call(_arguments), Array.prototype.slice.call(_arguments));
          var ans = void 0;
          try {
            ans = v.apply(ctx, _arguments);
          } catch (e) {
            throw new Error(k + ' ' + e);
          }
          var errorStack = [];
          var error = void 0;
          while ((error = ctx.getError()) !== ctx.NO_ERROR) {
            errorStack.push(error);
          }
          if (errorStack.length) {
            throw errorStack.join();
          }
          return ans;
        };
      }(m, f);
    } else {
      gl[m] = f;
    }
  }

  return gl;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9jb250ZXh0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O1FBTWdCO1FBb0NBO1FBY0E7UUFZQTtRQVlBO1FBNEJBOztBQXpHaEI7Ozs7Ozs7QUFHTyxTQUFTLGVBQVQsQ0FBeUIsTUFBekIsRUFBMkM7TUFBViw0REFBTSxrQkFBSTs7QUFDaEQsTUFBSSxDQUFDLGtCQUFELEVBQXFCO0FBQ3ZCLFVBQU0sSUFBSSxLQUFKLDREQUFOLENBRHVCO0dBQXpCO0FBR0EsV0FBUyxPQUFPLE1BQVAsS0FBa0IsUUFBbEIsR0FDUCxTQUFTLGNBQVQsQ0FBd0IsTUFBeEIsQ0FETyxHQUMyQixNQUQzQixDQUp1Qzs7QUFPaEQsU0FBTyxnQkFBUCxDQUF3QiwyQkFBeEIsRUFBcUQsYUFBSztBQUN4RCxZQUFRLEdBQVIsQ0FBWSxFQUFFLGFBQUYsSUFBbUIsZUFBbkIsQ0FBWixDQUR3RDtHQUFMLEVBRWxELEtBRkg7OztBQVBnRCxNQVk1QyxLQUFLLE9BQU8sVUFBUCxDQUFrQixRQUFsQixFQUE0QixHQUE1QixDQUFMLENBWjRDO0FBYWhELE9BQUssTUFBTSxPQUFPLFVBQVAsQ0FBa0IscUJBQWxCLEVBQXlDLEdBQXpDLENBQU4sQ0FiMkM7QUFjaEQsT0FBSyxNQUFNLE9BQU8sVUFBUCxDQUFrQixPQUFsQixFQUEyQixHQUEzQixDQUFOLENBZDJDO0FBZWhELE9BQUssTUFBTSxPQUFPLFVBQVAsQ0FBa0Isb0JBQWxCLEVBQXdDLEdBQXhDLENBQU4sQ0FmMkM7O0FBaUJoRCx3QkFBTyxFQUFQLEVBQVcsd0NBQVg7OztBQWpCZ0QsSUFvQmhELEdBQUssSUFBSSxLQUFKLEdBQVksbUJBQW1CLEVBQW5CLENBQVosR0FBcUMsRUFBckM7OztBQXBCMkMsSUF1QmhELENBQUcsR0FBSCxHQUFTLFNBQVMsS0FBVCxDQUFlLElBQWYsRUFBcUI7QUFDNUIsUUFBSSxRQUFRLElBQVIsQ0FEd0I7QUFFNUIsUUFBSSxPQUFPLElBQVAsS0FBZ0IsUUFB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LENBRUUsT0FBTyxDQUFQLEVBQVU7QUFDVixrQkFBTSxJQUFJLEtBQUosQ0FBYSxVQUFLLENBQWxCLENBQU4sQ0FEVTtXQUFWO0FBR0YsY0FBTSxhQUFhLEVBQWIsQ0FaSztBQWFYLGNBQUksY0FBSixDQWJXO0FBY1gsaUJBQU8sQ0FBQyxRQUFRLElBQUksUUFBSixFQUFSLENBQUQsS0FBNkIsSUFBSSxRQUFKLEVBQWM7QUFDaEQsdUJBQVcsSUFBWCxDQUFnQixLQUFoQixFQURnRDtXQUFsRDtBQUdBLGNBQUksV0FBVyxNQUFYLEVBQW1CO0FBQ3JCLGtCQUFNLFdBQVcsSUFBWCxFQUFOLENBRHFCO1dBQXZCO0FBR0EsaUJBQU8sR0FBUCxDQXBCVztTQUFOLENBRFU7T0FBVixDQXVCTixDQXZCSyxFQXVCRixDQXZCRSxDQUFSLENBRDJCO0tBQTdCLE1BeUJPO0FBQ0wsU0FBRyxDQUFILElBQVEsQ0FBUixDQURLO0tBekJQO0dBRkY7O0FBZ0NBLFNBQU8sRUFBUCxDQWxDK0I7Q0FBakMiLCJmaWxlIjoiY29udGV4dC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFdlYkdMUmVuZGVyaW5nQ29udGV4dCByZWxhdGVkIG1ldGhvZHNcbi8qIGVzbGludC1kaXNhYmxlIG5vLXRyeS1jYXRjaCwgbm8tY29uc29sZSwgbm8tbG9vcC1mdW5jICovXG4vKiBnbG9iYWwgd2luZG93LCBkb2N1bWVudCwgY29uc29sZSAqL1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vLyBDaGVja3MgaWYgV2ViR0wgaXMgZW5hYmxlZCBhbmQgY3JlYXRlcyBhIGNvbnRleHQgZm9yIHVzaW5nIFdlYkdMLlxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdMQ29udGV4dChjYW52YXMsIG9wdCA9IHt9KSB7XG4gIGlmICghaXNCcm93c2VyQ29udGV4dCgpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW4ndCBjcmVhdGUgYSBXZWJHTCBjb250ZXh0IG91dHNpZGUgYSBicm93c2VyIGNvbnRleHQuYCk7XG4gIH1cbiAgY2FudmFzID0gdHlwZW9mIGNhbnZhcyA9PT0gJ3N0cmluZycgP1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGNhbnZhcykgOiBjYW52YXM7XG5cbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmdsY29udGV4dGNyZWF0aW9uZXJyb3InLCBlID0+IHtcbiAgICBjb25zb2xlLmxvZyhlLnN0YXR1c01lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InKTtcbiAgfSwgZmFsc2UpO1xuXG4gIC8vIFByZWZlciB3ZWJnbDIgb3ZlciB3ZWJnbDEsIHByZWZlciBjb25mb3JtYW50IG92ZXIgZXhwZXJpbWVudGFsXG4gIGxldCBnbCA9IGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbDInLCBvcHQpO1xuICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wyJywgb3B0KTtcbiAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnLCBvcHQpO1xuICBnbCA9IGdsIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnLCBvcHQpO1xuXG4gIGFzc2VydChnbCwgJ0ZhaWxlZCB0byBjcmVhdGUgV2ViR0xSZW5kZXJpbmdDb250ZXh0Jyk7XG5cbiAgLy8gU2V0IGFzIGRlYnVnIGhhbmRsZXJcbiAgZ2wgPSBvcHQuZGVidWcgPyBjcmVhdGVEZWJ1Z0NvbnRleHQoZ2wpIDogZ2w7XG5cbiAgLy8gQWRkIGEgc2FmZSBnZXQgbWV0aG9kXG4gIGdsLmdldCA9IGZ1bmN0aW9uIGdsR2V0KG5hbWUpIHtcbiAgICBsZXQgdmFsdWUgPSBuYW1lO1xuICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gdGhpc1tuYW1lXTtcbiAgICAgIGFzc2VydCh2YWx1ZSwgYEFjY2Vzc2luZyBnbC4ke25hbWV9YCk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfTtcblxuICByZXR1cm4gZ2w7XG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1dlYkdMKCkge1xuICBpZiAoIWlzQnJvd3NlckNvbnRleHQoKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBGZWF0dXJlIHRlc3QgV2ViR0xcbiAgdHJ5IHtcbiAgICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICByZXR1cm4gQm9vbGVhbih3aW5kb3cuV2ViR0xSZW5kZXJpbmdDb250ZXh0ICYmXG4gICAgICAoY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJykgfHwgY2FudmFzLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcpKSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNFeHRlbnNpb24obmFtZSkge1xuICBpZiAoIWhhc1dlYkdMKCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIGNvbnN0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnKSB8fFxuICAgIGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKTtcbiAgLy8gU2hvdWxkIG1heWJlIGJlIHJldHVybiAhIWNvbnRleHQuZ2V0RXh0ZW5zaW9uKG5hbWUpO1xuICByZXR1cm4gY29udGV4dC5nZXRFeHRlbnNpb24obmFtZSk7XG59XG5cbi8vIFJldHVybnMgdGhlIGV4dGVuc2lvbiBvciB0aHJvd3MgYW4gZXJyb3JcbmV4cG9ydCBmdW5jdGlvbiBnZXRFeHRlbnNpb24oZ2wsIGV4dGVuc2lvbk5hbWUpIHtcbiAgY29uc3QgZXh0ZW5zaW9uID0gZ2wuZ2V0RXh0ZW5zaW9uKGV4dGVuc2lvbk5hbWUpO1xuICBhc3NlcnQoZXh0ZW5zaW9uLCBgJHtleHRlbnNpb25OYW1lfSBub3Qgc3VwcG9ydGVkIWApO1xuICByZXR1cm4gZXh0ZW5zaW9uO1xufVxuXG5mdW5jdGlvbiBpc0Jyb3dzZXJDb250ZXh0KCkge1xuICByZXR1cm4gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCc7XG59XG5cbi8vIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2l0aCBnbCBzdGF0ZXMgdGVtcG9yYXJpbHkgc2V0LCBleGNlcHRpb24gc2FmZVxuLy8gQ3VycmVudGx5IHN1cHBvcnQgc2Npc3NvciB0ZXN0IGFuZCBmcmFtZWJ1ZmZlciBiaW5kaW5nXG5leHBvcnQgZnVuY3Rpb24gZ2xDb250ZXh0V2l0aFN0YXRlKGdsLCB7c2Npc3NvclRlc3QsIGZyYW1lQnVmZmVyfSwgZnVuYykge1xuICBsZXQgc2Npc3NvclRlc3RXYXNFbmFibGVkO1xuICBpZiAoc2Npc3NvclRlc3QpIHtcbiAgICBzY2lzc29yVGVzdFdhc0VuYWJsZWQgPSBnbC5pc0VuYWJsZWQoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBjb25zdCB7eCwgeSwgdywgaH0gPSBzY2lzc29yVGVzdDtcbiAgICBnbC5lbmFibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5zY2lzc29yKHgsIHksIHcsIGgpO1xuICB9XG5cbiAgaWYgKGZyYW1lQnVmZmVyKSB7XG4gICAgLy8gVE9ETyAtIHdhcyB0aGVyZSBhbnkgcHJldmlvdXNseSBzZXQgZnJhbWUgYnVmZmVyIHdlIG5lZWQgdG8gcmVtZW1iZXI/XG4gICAgZnJhbWVCdWZmZXIuYmluZCgpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBmdW5jKGdsKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoIXNjaXNzb3JUZXN0V2FzRW5hYmxlZCkge1xuICAgICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIH1cbiAgICBpZiAoZnJhbWVCdWZmZXIpIHtcbiAgICAgIC8vIFRPRE8gLSB3YXMgdGhlcmUgYW55IHByZXZpb3VzbHkgc2V0IGZyYW1lIGJ1ZmZlcj9cbiAgICAgIC8vIFRPRE8gLSBkZWxlZ2F0ZSBcInVuYmluZFwiIHRvIEZyYW1lYnVmZmVyIG9iamVjdD9cbiAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnbENoZWNrRXJyb3IoZ2wpIHtcbiAgLy8gRW5zdXJlIGFsbCBlcnJvcnMgYXJlIGNsZWFyZWRcbiAgbGV0IGVycm9yO1xuICBsZXQgZ2xFcnJvciA9IGdsLmdldEVycm9yKCk7XG4gIHdoaWxlIChnbEVycm9yICE9PSBnbC5OT19FUlJPUikge1xuICAgIGlmIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKGdsR2V0RXJyb3JNZXNzYWdlKGdsLCBnbEVycm9yKSk7XG4gICAgfVxuICAgIGdsRXJyb3IgPSBnbC5nZXRFcnJvcigpO1xuICB9XG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdsR2V0RXJyb3JNZXNzYWdlKGdsLCBnbEVycm9yKSB7XG4gIHN3aXRjaCAoZ2xFcnJvcikge1xuICBjYXNlIGdsLkNPTlRFWFRfTE9TVF9XRUJHTDpcbiAgICAvLyAgSWYgdGhlIFdlYkdMIGNvbnRleHQgaXMgbG9zdCwgdGhpcyBlcnJvciBpcyByZXR1cm5lZCBvbiB0aGVcbiAgICAvLyBmaXJzdCBjYWxsIHRvIGdldEVycm9yLiBBZnRlcndhcmRzIGFuZCB1bnRpbCB0aGUgY29udGV4dCBoYXMgYmVlblxuICAgIC8vIHJlc3RvcmVkLCBpdCByZXR1cm5zIGdsLk5PX0VSUk9SLlxuICAgIHJldHVybiAnV2ViR0wgY29udGV4dCBsb3N0JztcblxuICBjYXNlIGdsLklOVkFMSURfRU5VTTpcbiAgICAvLyBBbiB1bmFjY2VwdGFibGUgdmFsdWUgaGFzIGJlZW4gc3BlY2lmaWVkIGZvciBhbiBlbnVtZXJhdGVkIGFyZ3VtZW50LlxuICAgIHJldHVybiAnV2ViR0wgaW52YWxpZCBlbnVtZXJhdGVkIGFyZ3VtZW50JztcblxuICBjYXNlIGdsLklOVkFMSURfVkFMVUU6XG4gICAgLy8gQSBudW1lcmljIGFyZ3VtZW50IGlzIG91dCBvZiByYW5nZS5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgdmFsdWUnO1xuXG4gIGNhc2UgZ2wuSU5WQUxJRF9PUEVSQVRJT046XG4gICAgLy8gVGhlIHNwZWNpZmllZCBjb21tYW5kIGlzIG5vdCBhbGxvd2VkIGZvciB0aGUgY3VycmVudCBzdGF0ZS5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgb3BlcmF0aW9uJztcblxuICBjYXNlIGdsLklOVkFMSURfRlJBTUVCVUZGRVJfT1BFUkFUSU9OOlxuICAgIC8vIFRoZSBjdXJyZW50bHkgYm91bmQgZnJhbWVidWZmZXIgaXMgbm90IGZyYW1lYnVmZmVyIGNvbXBsZXRlXG4gICAgLy8gd2hlbiB0cnlpbmcgdG8gcmVuZGVyIHRvIG9yIHRvIHJlYWQgZnJvbSBpdC5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgZnJhbWVidWZmZXIgb3BlcmF0aW9uJztcblxuICBjYXNlIGdsLk9VVF9PRl9NRU1PUlk6XG4gICAgLy8gTm90IGVub3VnaCBtZW1vcnkgaXMgbGVmdCB0byBleGVjdXRlIHRoZSBjb21tYW5kLlxuICAgIHJldHVybiAnV2ViR0wgb3V0IG9mIG1lbW9yeSc7XG5cbiAgZGVmYXVsdDpcbiAgICAvLyBOb3QgZW5vdWdoIG1lbW9yeSBpcyBsZWZ0IHRvIGV4ZWN1dGUgdGhlIGNvbW1hbmQuXG4gICAgcmV0dXJuICdXZWJHTCB1bmtub3duIGVycm9yJztcbiAgfVxufVxuXG4vLyBUT0RPIC0gZG9jdW1lbnQgb3IgcmVtb3ZlXG5mdW5jdGlvbiBjcmVhdGVEZWJ1Z0NvbnRleHQoY3R4KSB7XG4gIGNvbnN0IGdsID0ge307XG4gIGZvciAodmFyIG0gaW4gY3R4KSB7XG4gICAgdmFyIGYgPSBjdHhbbV07XG4gICAgaWYgKHR5cGVvZiBmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBnbFttXSA9ICgoaywgdikgPT4ge1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5qb2luLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICAgICAgICApO1xuICAgICAgICAgIGxldCBhbnM7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFucyA9IHYuYXBwbHkoY3R4LCBhcmd1bWVudHMpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtrfSAke2V9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGVycm9yU3RhY2sgPSBbXTtcbiAgICAgICAgICBsZXQgZXJyb3I7XG4gICAgICAgICAgd2hpbGUgKChlcnJvciA9IGN0eC5nZXRFcnJvcigpKSAhPT0gY3R4Lk5PX0VSUk9SKSB7XG4gICAgICAgICAgICBlcnJvclN0YWNrLnB1c2goZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZXJyb3JTdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yU3RhY2suam9pbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYW5zO1xuICAgICAgICB9O1xuICAgICAgfSkobSwgZik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsW21dID0gZjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZ2w7XG59XG4iXX0=