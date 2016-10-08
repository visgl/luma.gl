// WebGLRenderingContext related methods
/* eslint-disable no-try-catch, no-loop-func */
import WebGLDebug from 'webgl-debug';
import {WebGLRenderingContext, webGLTypesAvailable} from './webgl-types';
import {assertWebGLRenderingContext, isWebGL2RenderingContext}
  from './webgl-checks';
import queryManager from './helpers/query-manager';
import {log, isBrowser} from '../utils';
import luma from '../globals';
import assert from 'assert';
/* global document */

const GL_UNMASKED_VENDOR_WEBGL = 0x9245;
const GL_UNMASKED_RENDERER_WEBGL = 0x9246;

const ERR_WEBGL_MISSING_BROWSER = `\
WebGL API is missing. Check your if your browser supports WebGL or
install a recent version of a major browser.`;

const ERR_WEBGL_MISSING_NODE = `\
WebGL API is missing. To run luma.gl under Node.js, please "npm install gl"
and import 'luma.gl/headless' before importing 'luma.gl'.`;

const ERR_HEADLESSGL_NOT_AVAILABLE =
'Cannot create headless WebGL context, headlessGL not available';

const ERR_HEADLESSGL_FAILED =
'headlessGL failed to create headless WebGL context';

const STARTUP_MESSAGE = `\
Assign luma.log.priority in console to control logging: \
0: none, 1: minimal, 2: verbose, 3: attribute/uniforms, 4: gl logs
luma.log.break[], set to gl funcs, luma.log.profile[] set to model names`;

// Checks if WebGL is enabled and creates a context for using WebGL.
/* eslint-disable complexity, max-statements */
export function createGLContext({
  // BROWSER CONTEXT PARAMATERS: canvas is only used when in browser
  canvas,
  // HEADLESS CONTEXT PARAMETERS: width are height are only used by headless gl
  width = 800,
  height = 600,
  // COMMON CONTEXT PARAMETERS
  // Attempt to allocate WebGL2 context
  webgl2 = false,
  // Instrument context (at the expense of performance)
  // Note: currently defaults to true and needs to be explicitly turned off
  debug = true,
  // Other options are passed through to context creator
  ...opts
} = {}) {
  let gl;

  if (!isBrowser) {
    // Create headless gl context
    if (!webGLTypesAvailable) {
      throw new Error(ERR_WEBGL_MISSING_NODE);
    }
    if (!luma.globals.headlessGL) {
      throw new Error(ERR_HEADLESSGL_NOT_AVAILABLE);
    }
    gl = luma.globals.headlessGL(width, height, opts);
    if (!gl) {
      throw new Error(ERR_HEADLESSGL_FAILED);
    }
  } else {
    // Create browser gl context
    if (!webGLTypesAvailable) {
      throw new Error(ERR_WEBGL_MISSING_BROWSER);
    }
    // Make sure we have a canvas
    if (typeof canvas === 'string') {
      canvas = document.getElementById(canvas);
    }
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

  if (isBrowser && debug) {
    const debugGL =
      WebGLDebug.makeDebugContext(gl, throwOnError, validateArgsAndLog);
    class WebGLDebugContext {}
    Object.assign(WebGLDebugContext.prototype, debugGL);
    gl = debugGL;
    gl.debug = true;
    log.priority = log.priority < 1 ? 1 : log.priority;

    logInfo(gl);

    log.log(0, STARTUP_MESSAGE);
  }

  return gl;
}

// Resolve a WebGL enumeration name (returns itself if already a number)
export function glGet(gl, name) {
  // assertWebGLRenderingContext(gl);
  let value = name;
  if (typeof name === 'string') {
    value = gl[name];
    assert(value !== undefined, `Accessing gl.${name}`);
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

// POLLING FOR PENDING QUERIES

// Calling this function checks all pending queries for completion
export function poll(gl) {
  assertWebGLRenderingContext(gl);
  queryManager.poll(gl);
}

// VERY LIMITED / BASIC GL STATE MANAGEMENT

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

// DEBUG INFO

/**
 * Provides strings identifying the GPU vendor and driver.
 * https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/
 * @param {WebGLRenderingContext} gl - context
 * @return {Object} - 'vendor' and 'renderer' string fields.
 */
export function glGetDebugInfo(gl) {
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  return {
    vendor: info ? gl.getParameter(GL_UNMASKED_VENDOR_WEBGL) : 'unknown',
    renderer: info ? gl.getParameter(GL_UNMASKED_RENDERER_WEBGL) : 'unknown'
  };
}

function logInfo(gl) {
  const webGL = isWebGL2RenderingContext(gl) ? 'WebGL2' : 'WebGL1';
  const info = glGetDebugInfo(gl);
  const driver = info ? `using driver: ${info.vendor} ${info.renderer}` : '';
  const debug = gl.debug ? 'debug' : '';
  log.log(0,
    `luma.gl ${luma.VERSION}: ${webGL} ${debug} context ${driver}`, gl);

  // const extensions = gl.getSupportedExtensions();
  // log.log(0, `Supported extensions: [${extensions.join(', ')}]`);
}

// DEBUG TRACING

function getFunctionString(functionName, functionArgs) {
  let args = WebGLDebug.glFunctionArgsToString(functionName, functionArgs);
  args = `${args.slice(0, 100)}${args.length > 100 ? '...' : ''}`;
  return `gl.${functionName}(${args})`;
}

function throwOnError(err, functionName, args) {
  const errorMessage = WebGLDebug.glEnumToString(err);
  const functionArgs = WebGLDebug.glFunctionArgsToString(functionName, args);
  throw new Error(`${errorMessage} was caused by call to: ` +
    `gl.${functionName}(${functionArgs})`);
}

// Don't generate function string until it is needed
function validateArgsAndLog(functionName, functionArgs) {
  let functionString;
  if (log.priority >= 4) {
    functionString = getFunctionString(functionName, functionArgs);
    log.info(4, `${functionString}`);
  }

  for (const arg of functionArgs) {
    if (arg === undefined) {
      functionString = functionString ||
        getFunctionString(functionName, functionArgs);
      throw new Error(`Undefined argument: ${functionString}`);
    }
  }

  if (log.break) {
    functionString = functionString ||
      getFunctionString(functionName, functionArgs);
    const isBreakpoint = log.break && log.break.every(
      breakString => functionString.indexOf(breakString) !== -1
    );

    /* eslint-disable no-debugger */
    if (isBreakpoint) {
      debugger;
    }
    /* eslint-enable no-debugger */
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
