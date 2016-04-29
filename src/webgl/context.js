// WebGLRenderingContext related methods
/* eslint-disable no-try-catch, no-console, no-loop-func */
/* global window, document, console */
import assert from 'assert';

function isBrowserContext() {
  return typeof window !== 'undefined';
}

// Checks if WebGL is enabled and creates a context for using WebGL.
export function createGLContext(canvas, opt = {}) {
  if (!isBrowserContext()) {
    throw new Error(`Can't create a WebGL context outside a browser context.`);
  }
  canvas = typeof canvas === 'string' ?
    document.getElementById(canvas) : canvas;

  canvas.addEventListener('webglcontextcreationerror', e => {
    console.log(e.statusMessage || 'Unknown error');
  }, false);

  // Prefer webgl2 over webgl1, prefer conformant over experimental
  let gl = canvas.getContext('webgl2', opt);
  gl = gl || canvas.getContext('experimental-webgl2', opt);
  gl = gl || canvas.getContext('webgl', opt);
  gl = gl || canvas.getContext('experimental-webgl', opt);

  assert(gl, 'Failed to create WebGLRenderingContext');

  // Set as debug handler
  gl = opt.debug ? createDebugContext(gl) : gl;

  // Add a safe get method
  gl.get = function glGet(name) {
    let value = name;
    if (typeof name === 'string') {
      value = this[name];
      assert(value, `Accessing gl.${name}`);
    }
    return value;
  };

  return gl;

}

export function hasWebGL() {
  if (!isBrowserContext()) {
    return false;
  }
  // Feature test WebGL
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (error) {
    return false;
  }
}

export function hasExtension(name) {
  if (!hasWebGL()) {
    return false;
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl') ||
    canvas.getContext('experimental-webgl');
  // Should maybe be return !!context.getExtension(name);
  return context.getExtension(name);
}

// Returns the extension or throws an error
export function getExtension(gl, extensionName) {
  const extension = gl.getExtension(extensionName);
  assert(extension, `${extensionName} not supported!`);
  return extension;
}

// Executes a function with gl states temporarily set, exception safe
// Currently support scissor test and framebuffer binding
export function glContextWithState(gl, {scissorTest, frameBuffer}, func) {
  let scissorTestWasEnabled;
  if (scissorTest) {
    scissorTestWasEnabled = gl.isEnabled(gl.SCISSOR_TEST);
    const {x, y, w, h} = scissorTest;
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

export function glCheckError(gl) {
  // Ensure all errors are cleared
  let error;
  let glError = gl.getError();
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
  const gl = {};
  for (const m in ctx) {
    const f = ctx[m];
    if (typeof f === 'function') {
      gl[m] = ((k, v) => {
        return () => {
          console.log(
            k,
            Array.prototype.join.call(arguments),
            Array.prototype.slice.call(arguments)
          );
          let ans;
          try {
            ans = v.apply(ctx, arguments);
          } catch (e) {
            throw new Error(`${k} ${e}`);
          }
          const errorStack = [];
          let error;
          while ((error = ctx.getError()) !== ctx.NO_ERROR) {
            errorStack.push(error);
          }
          if (errorStack.length) {
            throw errorStack.join();
          }
          return ans;
        };
      })(m, f);
    } else {
      gl[m] = f;
    }
  }

  return gl;
}
