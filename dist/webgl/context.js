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
  return;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9jb250ZXh0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O1FBTWdCO1FBb0NBO1FBY0E7UUFZQTtRQVlBO1FBNEJBOztBQXpHaEI7Ozs7Ozs7QUFHTyxTQUFTLGVBQVQsQ0FBeUIsTUFBekIsRUFBMkM7TUFBViw0REFBTSxrQkFBSTs7QUFDaEQsTUFBSSxDQUFDLGtCQUFELEVBQXFCO0FBQ3ZCLFVBQU0sSUFBSSxLQUFKLDREQUFOLENBRHVCO0dBQXpCO0FBR0EsV0FBUyxPQUFPLE1BQVAsS0FBa0IsUUFBbEIsR0FDUCxTQUFTLGNBQVQsQ0FBd0IsTUFBeEIsQ0FETyxHQUMyQixNQUQzQixDQUp1Qzs7QUFPaEQsU0FBTyxnQkFBUCxDQUF3QiwyQkFBeEIsRUFBcUQsYUFBSztBQUN4RCxZQUFRLEdBQVIsQ0FBWSxFQUFFLGFBQUYsSUFBbUIsZUFBbkIsQ0FBWixDQUR3RDtHQUFMLEVBRWxELEtBRkg7OztBQVBnRCxNQVk1QyxLQUFLLE9BQU8sVUFBUCxDQUFrQixRQUFsQixFQUE0QixHQUE1QixDQUFMLENBWjRDO0FBYWhELE9BQUssTUFBTSxPQUFPLFVBQVAsQ0FBa0IscUJBQWxCLEVBQXlDLEdBQXpDLENBQU4sQ0FiMkM7QUFjaEQsT0FBSyxNQUFNLE9BQU8sVUFBUCxDQUFrQixPQUFsQixFQUEyQixHQUEzQixDQUFOLENBZDJDO0FBZWhELE9BQUssTUFBTSxPQUFPLFVBQVAsQ0FBa0Isb0JBQWxCLEVBQXdDLEdBQXhDLENBQU4sQ0FmMkM7O0FBaUJoRCx3QkFBTyxFQUFQLEVBQVcsd0NBQVg7OztBQWpCZ0QsSUFvQmhELEdBQUssSUFBSSxLQUFKLEdBQVksbUJBQW1CLEVBQW5CLENBQVosR0FBcUMsRUFBckM7OztBQXBCMkMsSUF1QmhELENBQUcsR0FBSCxHQUFTLFNBQVMsS0FBVCxDQUFlLElBQWYsRUFBcUI7QUFDNUIsUUFBSSxRQUFRLElBQVIsQ0FEd0I7QUFFNUIsUUFBSSxPQUFPLElBQVAsS0FBZ0IsUUFB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REU7V0FBSixDQUVFLE9BQU8sQ0FBUCxFQUFVO0FBQ1Ysa0JBQU0sSUFBSSxLQUFKLENBQWEsVUFBSyxDQUFsQixDQUFOLENBRFU7V0FBVjtBQUdGLGNBQU0sYUFBYSxFQUFiLENBWks7QUFhWCxjQUFJLGNBQUosQ0FiVztBQWNYLGlCQUFPLENBQUMsUUFBUSxJQUFJLFFBQUosRUFBUixDQUFELEtBQTZCLElBQUksUUFBSixFQUFjO0FBQ2hELHVCQUFXLElBQVgsQ0FBZ0IsS0FBaEIsRUFEZ0Q7V0FBbEQ7QUFHQSxjQUFJLFdBQVcsTUFBWCxFQUFtQjtBQUNyQixrQkFBTSxXQUFXLElBQVgsRUFBTixDQURxQjtXQUF2QjtBQUdBLGlCQUFPLEdBQVAsQ0FwQlc7U0FBTixDQURVO09BQVYsQ0F1Qk4sQ0F2QkssRUF1QkYsQ0F2QkUsQ0FBUixDQUQyQjtLQUE3QixNQXlCTztBQUNMLFNBQUcsQ0FBSCxJQUFRLENBQVIsQ0FESztLQXpCUDtHQUZGOztBQWdDQSxTQUFPLEVBQVAsQ0FsQytCO0NBQWpDIiwiZmlsZSI6ImNvbnRleHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBXZWJHTFJlbmRlcmluZ0NvbnRleHQgcmVsYXRlZCBtZXRob2RzXG4vKiBlc2xpbnQtZGlzYWJsZSBuby10cnktY2F0Y2gsIG5vLWNvbnNvbGUsIG5vLWxvb3AtZnVuYyAqL1xuLyogZ2xvYmFsIHdpbmRvdywgZG9jdW1lbnQsIGNvbnNvbGUgKi9cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gQ2hlY2tzIGlmIFdlYkdMIGlzIGVuYWJsZWQgYW5kIGNyZWF0ZXMgYSBjb250ZXh0IGZvciB1c2luZyBXZWJHTC5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVHTENvbnRleHQoY2FudmFzLCBvcHQgPSB7fSkge1xuICBpZiAoIWlzQnJvd3NlckNvbnRleHQoKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2FuJ3QgY3JlYXRlIGEgV2ViR0wgY29udGV4dCBvdXRzaWRlIGEgYnJvd3NlciBjb250ZXh0LmApO1xuICB9XG4gIGNhbnZhcyA9IHR5cGVvZiBjYW52YXMgPT09ICdzdHJpbmcnID9cbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjYW52YXMpIDogY2FudmFzO1xuXG4gIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCd3ZWJnbGNvbnRleHRjcmVhdGlvbmVycm9yJywgZSA9PiB7XG4gICAgY29uc29sZS5sb2coZS5zdGF0dXNNZXNzYWdlIHx8ICdVbmtub3duIGVycm9yJyk7XG4gIH0sIGZhbHNlKTtcblxuICAvLyBQcmVmZXIgd2ViZ2wyIG92ZXIgd2ViZ2wxLCBwcmVmZXIgY29uZm9ybWFudCBvdmVyIGV4cGVyaW1lbnRhbFxuICBsZXQgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wyJywgb3B0KTtcbiAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsMicsIG9wdCk7XG4gIGdsID0gZ2wgfHwgY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJywgb3B0KTtcbiAgZ2wgPSBnbCB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJywgb3B0KTtcblxuICBhc3NlcnQoZ2wsICdGYWlsZWQgdG8gY3JlYXRlIFdlYkdMUmVuZGVyaW5nQ29udGV4dCcpO1xuXG4gIC8vIFNldCBhcyBkZWJ1ZyBoYW5kbGVyXG4gIGdsID0gb3B0LmRlYnVnID8gY3JlYXRlRGVidWdDb250ZXh0KGdsKSA6IGdsO1xuXG4gIC8vIEFkZCBhIHNhZmUgZ2V0IG1ldGhvZFxuICBnbC5nZXQgPSBmdW5jdGlvbiBnbEdldChuYW1lKSB7XG4gICAgbGV0IHZhbHVlID0gbmFtZTtcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICB2YWx1ZSA9IHRoaXNbbmFtZV07XG4gICAgICBhc3NlcnQodmFsdWUsIGBBY2Nlc3NpbmcgZ2wuJHtuYW1lfWApO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgcmV0dXJuIGdsO1xuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNXZWJHTCgpIHtcbiAgaWYgKCFpc0Jyb3dzZXJDb250ZXh0KCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy8gRmVhdHVyZSB0ZXN0IFdlYkdMXG4gIHRyeSB7XG4gICAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgcmV0dXJuIEJvb2xlYW4od2luZG93LldlYkdMUmVuZGVyaW5nQ29udGV4dCAmJlxuICAgICAgKGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcpIHx8IGNhbnZhcy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnKSkpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzRXh0ZW5zaW9uKG5hbWUpIHtcbiAgaWYgKCFoYXNXZWJHTCgpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICBjb25zdCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJykgfHxcbiAgICBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJyk7XG4gIC8vIFNob3VsZCBtYXliZSBiZSByZXR1cm4gISFjb250ZXh0LmdldEV4dGVuc2lvbihuYW1lKTtcbiAgcmV0dXJuIGNvbnRleHQuZ2V0RXh0ZW5zaW9uKG5hbWUpO1xufVxuXG4vLyBSZXR1cm5zIHRoZSBleHRlbnNpb24gb3IgdGhyb3dzIGFuIGVycm9yXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXh0ZW5zaW9uKGdsLCBleHRlbnNpb25OYW1lKSB7XG4gIGNvbnN0IGV4dGVuc2lvbiA9IGdsLmdldEV4dGVuc2lvbihleHRlbnNpb25OYW1lKTtcbiAgYXNzZXJ0KGV4dGVuc2lvbiwgYCR7ZXh0ZW5zaW9uTmFtZX0gbm90IHN1cHBvcnRlZCFgKTtcbiAgcmV0dXJuIGV4dGVuc2lvbjtcbn1cblxuZnVuY3Rpb24gaXNCcm93c2VyQ29udGV4dCgpIHtcbiAgcmV0dXJuIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnO1xufVxuXG4vLyBFeGVjdXRlcyBhIGZ1bmN0aW9uIHdpdGggZ2wgc3RhdGVzIHRlbXBvcmFyaWx5IHNldCwgZXhjZXB0aW9uIHNhZmVcbi8vIEN1cnJlbnRseSBzdXBwb3J0IHNjaXNzb3IgdGVzdCBhbmQgZnJhbWVidWZmZXIgYmluZGluZ1xuZXhwb3J0IGZ1bmN0aW9uIGdsQ29udGV4dFdpdGhTdGF0ZShnbCwge3NjaXNzb3JUZXN0LCBmcmFtZUJ1ZmZlcn0sIGZ1bmMpIHtcbiAgbGV0IHNjaXNzb3JUZXN0V2FzRW5hYmxlZDtcbiAgaWYgKHNjaXNzb3JUZXN0KSB7XG4gICAgc2Npc3NvclRlc3RXYXNFbmFibGVkID0gZ2wuaXNFbmFibGVkKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgY29uc3Qge3gsIHksIHcsIGh9ID0gc2Npc3NvclRlc3Q7XG4gICAgZ2wuZW5hYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgZ2wuc2Npc3Nvcih4LCB5LCB3LCBoKTtcbiAgfVxuXG4gIGlmIChmcmFtZUJ1ZmZlcikge1xuICAgIC8vIFRPRE8gLSB3YXMgdGhlcmUgYW55IHByZXZpb3VzbHkgc2V0IGZyYW1lIGJ1ZmZlciB3ZSBuZWVkIHRvIHJlbWVtYmVyP1xuICAgIGZyYW1lQnVmZmVyLmJpbmQoKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgZnVuYyhnbCk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKCFzY2lzc29yVGVzdFdhc0VuYWJsZWQpIHtcbiAgICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICB9XG4gICAgaWYgKGZyYW1lQnVmZmVyKSB7XG4gICAgICAvLyBUT0RPIC0gd2FzIHRoZXJlIGFueSBwcmV2aW91c2x5IHNldCBmcmFtZSBidWZmZXI/XG4gICAgICAvLyBUT0RPIC0gZGVsZWdhdGUgXCJ1bmJpbmRcIiB0byBGcmFtZWJ1ZmZlciBvYmplY3Q/XG4gICAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2xDaGVja0Vycm9yKGdsKSB7XG4gIHJldHVybjtcbiAgLy8gRW5zdXJlIGFsbCBlcnJvcnMgYXJlIGNsZWFyZWRcbiAgbGV0IGVycm9yO1xuICBsZXQgZ2xFcnJvciA9IGdsLmdldEVycm9yKCk7XG4gIHdoaWxlIChnbEVycm9yICE9PSBnbC5OT19FUlJPUikge1xuICAgIGlmIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9yID0gbmV3IEVycm9yKGdsR2V0RXJyb3JNZXNzYWdlKGdsLCBnbEVycm9yKSk7XG4gICAgfVxuICAgIGdsRXJyb3IgPSBnbC5nZXRFcnJvcigpO1xuICB9XG4gIGlmIChlcnJvcikge1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdsR2V0RXJyb3JNZXNzYWdlKGdsLCBnbEVycm9yKSB7XG4gIHN3aXRjaCAoZ2xFcnJvcikge1xuICBjYXNlIGdsLkNPTlRFWFRfTE9TVF9XRUJHTDpcbiAgICAvLyAgSWYgdGhlIFdlYkdMIGNvbnRleHQgaXMgbG9zdCwgdGhpcyBlcnJvciBpcyByZXR1cm5lZCBvbiB0aGVcbiAgICAvLyBmaXJzdCBjYWxsIHRvIGdldEVycm9yLiBBZnRlcndhcmRzIGFuZCB1bnRpbCB0aGUgY29udGV4dCBoYXMgYmVlblxuICAgIC8vIHJlc3RvcmVkLCBpdCByZXR1cm5zIGdsLk5PX0VSUk9SLlxuICAgIHJldHVybiAnV2ViR0wgY29udGV4dCBsb3N0JztcblxuICBjYXNlIGdsLklOVkFMSURfRU5VTTpcbiAgICAvLyBBbiB1bmFjY2VwdGFibGUgdmFsdWUgaGFzIGJlZW4gc3BlY2lmaWVkIGZvciBhbiBlbnVtZXJhdGVkIGFyZ3VtZW50LlxuICAgIHJldHVybiAnV2ViR0wgaW52YWxpZCBlbnVtZXJhdGVkIGFyZ3VtZW50JztcblxuICBjYXNlIGdsLklOVkFMSURfVkFMVUU6XG4gICAgLy8gQSBudW1lcmljIGFyZ3VtZW50IGlzIG91dCBvZiByYW5nZS5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgdmFsdWUnO1xuXG4gIGNhc2UgZ2wuSU5WQUxJRF9PUEVSQVRJT046XG4gICAgLy8gVGhlIHNwZWNpZmllZCBjb21tYW5kIGlzIG5vdCBhbGxvd2VkIGZvciB0aGUgY3VycmVudCBzdGF0ZS5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgb3BlcmF0aW9uJztcblxuICBjYXNlIGdsLklOVkFMSURfRlJBTUVCVUZGRVJfT1BFUkFUSU9OOlxuICAgIC8vIFRoZSBjdXJyZW50bHkgYm91bmQgZnJhbWVidWZmZXIgaXMgbm90IGZyYW1lYnVmZmVyIGNvbXBsZXRlXG4gICAgLy8gd2hlbiB0cnlpbmcgdG8gcmVuZGVyIHRvIG9yIHRvIHJlYWQgZnJvbSBpdC5cbiAgICByZXR1cm4gJ1dlYkdMIGludmFsaWQgZnJhbWVidWZmZXIgb3BlcmF0aW9uJztcblxuICBjYXNlIGdsLk9VVF9PRl9NRU1PUlk6XG4gICAgLy8gTm90IGVub3VnaCBtZW1vcnkgaXMgbGVmdCB0byBleGVjdXRlIHRoZSBjb21tYW5kLlxuICAgIHJldHVybiAnV2ViR0wgb3V0IG9mIG1lbW9yeSc7XG5cbiAgZGVmYXVsdDpcbiAgICAvLyBOb3QgZW5vdWdoIG1lbW9yeSBpcyBsZWZ0IHRvIGV4ZWN1dGUgdGhlIGNvbW1hbmQuXG4gICAgcmV0dXJuICdXZWJHTCB1bmtub3duIGVycm9yJztcbiAgfVxufVxuXG4vLyBUT0RPIC0gZG9jdW1lbnQgb3IgcmVtb3ZlXG5mdW5jdGlvbiBjcmVhdGVEZWJ1Z0NvbnRleHQoY3R4KSB7XG4gIGNvbnN0IGdsID0ge307XG4gIGZvciAodmFyIG0gaW4gY3R4KSB7XG4gICAgdmFyIGYgPSBjdHhbbV07XG4gICAgaWYgKHR5cGVvZiBmID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBnbFttXSA9ICgoaywgdikgPT4ge1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5qb2luLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cylcbiAgICAgICAgICApO1xuICAgICAgICAgIGxldCBhbnM7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGFucyA9IHYuYXBwbHkoY3R4LCBhcmd1bWVudHMpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtrfSAke2V9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IGVycm9yU3RhY2sgPSBbXTtcbiAgICAgICAgICBsZXQgZXJyb3I7XG4gICAgICAgICAgd2hpbGUgKChlcnJvciA9IGN0eC5nZXRFcnJvcigpKSAhPT0gY3R4Lk5PX0VSUk9SKSB7XG4gICAgICAgICAgICBlcnJvclN0YWNrLnB1c2goZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoZXJyb3JTdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yU3RhY2suam9pbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYW5zO1xuICAgICAgICB9O1xuICAgICAgfSkobSwgZik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdsW21dID0gZjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZ2w7XG59XG4iXX0=