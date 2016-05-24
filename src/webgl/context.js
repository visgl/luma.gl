// WebGLRenderingContext related methods
/* eslint-disable no-try-catch, no-console, no-loop-func */
import assert from 'assert';
import log from '../log';

import headlessGL from 'gl';
/* global window, document, console */
/* global WebGLRenderingContext */

function isBrowserContext() {
  return typeof window !== 'undefined';
}

// Check if WebGL is available
// TODO Remove? - Kind of expensive since it creates and disposes of a context
export function hasWebGL() {
  if (!isBrowserContext()) {
    // Assumes headless-gl has been set up per https://www.npmjs.com/package/gl
    return true;
  }
  // Feature test WebGL
  try {
    const canvas = document.createElement('canvas');
    // TODO - can we destroy context immediately rather than rely on GC?
    return Boolean(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (error) {
    return false;
  }
}

// Checks if WebGL is enabled and creates a context for using WebGL.
export function createGLContext(canvas, {
  // Note, width&height only used by headless gl
  width = 800,
  height = 600,
  debug = true,
  // Override default since this is a gotcha for most apps
  preserveDrawingBuffer = true,
  ...opts
}) {
  const glOpts = {
    preserveDrawingBuffer,
    ...opts
  };

  if (!isBrowserContext()) {
    return headlessGL(width, height, glOpts);
  }
  canvas = typeof canvas === 'string' ?
    document.getElementById(canvas) : canvas;

  canvas.addEventListener('webglcontextcreationerror', e => {
    console.log(e.statusMessage || 'Unknown error');
  }, false);

  // Prefer webgl2 over webgl1, prefer conformant over experimental
  let gl = canvas.getContext('webgl2', glOpts);
  gl = gl || canvas.getContext('experimental-webgl2', glOpts);
  gl = gl || canvas.getContext('webgl', glOpts);
  gl = gl || canvas.getContext('experimental-webgl', glOpts);

  assert(gl, 'Failed to create WebGLRenderingContext');

  return debug ? createDebugContext(gl) : gl;
}

// Returns the extension or throws an error
export function getExtension(gl, extensionName) {
  const ERROR = 'Illegal arg to getExtension';
  assert(gl instanceof WebGLRenderingContext, ERROR);
  assert(typeof extensionName === 'string', ERROR);
  const extension = gl.getExtension(extensionName);
  assert(extension, `${extensionName} not supported!`);
  return extension;
}

// Returns the extension or throws an error
export function hasExtension(gl, extensionName) {
  const ERROR = 'Illegal arg to hasExtension';
  assert(gl instanceof WebGLRenderingContext, ERROR);
  assert(typeof extensionName === 'string', ERROR);
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

// Returns an Error representing the Latest webGl error or null
export function glGetError(gl) {
  // Loop to ensure all errors are cleared
  const errorStack = [];
  let glError = gl.getError();
  while (glError !== gl.NO_ERROR) {
    errorStack.push(glGetErrorMessage(gl, glError));
    glError = gl.getError();
  }
  return errorStack.length ? new Error(errorStack.join('\n')) : null;
}

export function glCheckError(gl) {
  const error = glGetError(gl);
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

// Replace each gl function with a wrapper that traces and
// throws JavaScript errors on problems
function createDebugContext(gl) {
  const debugContext = {};
  for (const functionName in gl) {
    const func = gl[functionName];
    if (typeof func === 'function') {
      debugContext[functionName] = getDebugFunction(gl, functionName, func);
    } else {
      debugContext[functionName] = func;
    }
  }
  return debugContext;
}

function getDebugFunction(gl, functionName, func) {
  return (...args) => {
    log.log(2, `gl.${functionName}`, ...args);
    const result = gl[functionName](...args);
    glCheckError(gl);
    return result;
  };
}
