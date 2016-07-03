// WebGLRenderingContext related methods
/* eslint-disable no-try-catch, no-loop-func */
import WebGLDebug from 'webgl-debug';
import {WebGLRenderingContext} from './webgl-types';
import assert from 'assert';
import {log} from '../utils';

/* global window, document */

function isBrowserContext() {
  return typeof window !== 'undefined';
}

// Checks if WebGL is enabled and creates a context for using WebGL.
/* eslint-disable complexity, max-statements */
export function createGLContext({
  // Optional: Supply headless context creator
  // Done like this to avoid hard dependency on headless-gl
  headlessGL = null,
  // Force headless on/off
  headless,
  // BROWSER CONTEXT PARAMATERS: canvas is only used when in browser
  canvas,
  // HEADLESS CONTEXT PARAMETERS: width are height are only used by headless gl
  width = 800,
  height = 600,
  // COMMON CONTEXT PARAMETERS
  // Attempt to allocate WebGL2 context
  webgl2 = false,
  // Instrument context (at the expense of performance)
  // Note: defaults to true and needs to be explicitly turn off
  debug = true,
  // Other options are passed through to context creator
  ...opts
} = {}) {
  let gl;

  if (!isBrowserContext()) {

    // Create headless gl context
    if (!headlessGL) {
      throw new Error(
        `Cannot create headless WebGL context, headlessGL not available`);
    }
    gl = headlessGL(width, height, opts);
    if (!gl) {
      throw new Error('headlessGL failed to create headless WebGL context');
    }

  } else {

    // Create browser gl context
    canvas = typeof canvas === 'string' ?
      document.getElementById(canvas) : canvas;
    if (!canvas) {
      canvas = document.createElement('canvas');
    }

    canvas.addEventListener('webglcontextcreationerror', e => {
      log.log(0, e.statusMessage || 'Unknown error');
    }, false);

    // Prefer webgl2 over webgl1, prefer conformant over experimental
    if (webgl2) {
      gl = canvas.getContext('webgl2', opts);
      gl = gl || canvas.getContext('experimental-webgl2', opts);
    }
    gl = gl || canvas.getContext('webgl', opts);
    gl = gl || canvas.getContext('experimental-webgl', opts);

    assert(gl, 'Failed to create WebGLRenderingContext');
  }

  if (debug) {
    const debugGL =
      WebGLDebug.makeDebugContext(gl, throwOnError, validateArgsAndLog);
    class WebGLDebugContext {}
    Object.assign(WebGLDebugContext.prototype, debugGL);
    gl = debugGL;
    gl.debug = true;
    log.priority = log.priority < 1 ? 1 : log.priority;
  }

  return gl;
}

// alert(WebGLDebugUtils.glEnumToString(ctx.getError()));

// Resolve a WebGL enumeration name (returns itself if already a number)
export function glGet(gl, name) {
  // assertWebGLRenderingContext(gl);

  let value = name;
  if (typeof name === 'string') {
    value = gl[name];
    assert(value, `Accessing gl.${name}`);
  }
  return value;
}

// Returns the extension or throws an error
export function getGLExtension(gl, extensionName) {
  // assertWebGLRenderingContext(gl);

  const ERROR = 'Illegal arg to getExtension';
  assert(gl instanceof WebGLRenderingContext, ERROR);
  assert(typeof extensionName === 'string', ERROR);
  const extension = gl.getExtension(extensionName);
  assert(extension, `${extensionName} not supported!`);
  return extension;
}

// Executes a function with gl states temporarily set, exception safe
// Currently support scissor test and framebuffer binding
export function glContextWithState(gl, {scissorTest, frameBuffer}, func) {
  // assertWebGLRenderingContext(gl);

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

function throwOnError(err, functionName, args) {
  const errorMessage = WebGLDebug.glEnumToString(err);
  const functionArgs = WebGLDebug.glFunctionArgsToString(functionName, args);
  throw new Error(`${errorMessage} was caused by call to: ` +
    `gl.${functionName}(${functionArgs})`);
}

function validateArgsAndLog(functionName, args) {
  const functionArgs = WebGLDebug.glFunctionArgsToString(functionName, args);
  for (const arg of args) {
    if (arg === undefined) {
      throw new Error(
        `undefined argument: gl.${functionName}(${functionArgs})`);
    }
  }

  log.log(3, `gl.${functionName}(${functionArgs})`);
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
  if (gl.debug) {
    const error = glGetError(gl);
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
    return `WebGL unknown error ${glError}`;
  }
}

// Deprecated methods

export function getExtension(gl, extensionName) {
  log.warn(0, 'luma.gl: getExtension is deprecated');
  return getGLExtension(gl, extensionName);
}
