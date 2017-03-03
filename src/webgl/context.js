// WebGLRenderingContext related methods
/* eslint-disable no-try-catch, no-loop-func */
import WebGLDebug from 'webgl-debug';
import {WebGLRenderingContext, webGLTypesAvailable} from './webgl-types';
import {assertWebGLContext, isWebGL2Context}
  from './webgl-checks';
import queryManager from './helpers/query-manager';
import {log, isBrowser, isPageLoaded, pageLoadPromise} from '../utils';
import {global} from '../utils/globals';
import assert from 'assert';
/* global document */

const {luma} = global;

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

// Checks if WebGL is enabled and creates a context for using WebGL.
/* eslint-disable complexity, max-statements */
export function createGLContext(opts = {}) {
  let {
    // BROWSER CONTEXT PARAMATERS: canvas is only used when in browser
    canvas
  } = opts;

  const {
    // HEADLESS CONTEXT PARAMETERS: width are height are only used by headless gl
    width = 800,
    height = 600,
    // COMMON CONTEXT PARAMETERS
    // Attempt to allocate WebGL2 context
    webgl2 = false,
    // Instrument context (at the expense of performance)
    // Note: currently defaults to true and needs to be explicitly turned off
    debug = true
    // Other options are passed through to context creator
  } = opts;

  let gl;

  if (!isBrowser) {
    gl = _createHeadlessContext(width, height, opts);
  } else {
    // Create browser gl context
    if (!webGLTypesAvailable) {
      throw new Error(ERR_WEBGL_MISSING_BROWSER);
    }
    // Make sure we have a canvas
    canvas = canvas;
    if (typeof canvas === 'string') {
      if (!isPageLoaded) {
        throw new Error(
          `createGLContext called on canvas '${canvas}' before page was loaded`
        );
      }
      canvas = document.getElementById(canvas);
    }
    if (!canvas) {
      canvas = _createCanvas();
    }

    canvas.addEventListener('webglcontextcreationerror', e => {
      log.log(0, e.statusMessage || 'Unknown error');
    }, false);

    // Prefer webgl2 over webgl1, prefer conformant over experimental
    if (webgl2) {
      gl = gl || canvas.getContext('webgl2', opts);
      gl = gl || canvas.getContext('experimental-webgl2', opts);
    } else {
      gl = gl || canvas.getContext('webgl', opts);
      gl = gl || canvas.getContext('experimental-webgl', opts);
    }

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
  }

  return gl;
}

// Create a canvas set to 100%
// TODO - remove
function _createCanvas() {
  const canvas = document.createElement('canvas');
  canvas.id = 'lumagl-canvas';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  // adds the canvas to the body element
  pageLoadPromise.then(document => {
    const body = document.body;
    body.insertBefore(canvas, body.firstChild);
  });
  return canvas;
}

function _createHeadlessContext(width, height, opts) {
  // Create headless gl context
  if (!webGLTypesAvailable) {
    throw new Error(ERR_WEBGL_MISSING_NODE);
  }
  if (!luma.globals.headlessGL) {
    throw new Error(ERR_HEADLESSGL_NOT_AVAILABLE);
  }
  const gl = luma.globals.headlessGL(width, height, opts);
  if (!gl) {
    throw new Error(ERR_HEADLESSGL_FAILED);
  }
  return gl;
}

// Returns the extension or throws an error
export function getGLExtension(gl, extensionName) {
  // assertWebGLContext(gl);
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
  assertWebGLContext(gl);
  queryManager.poll(gl);
}

// VERY LIMITED / BASIC GL STATE MANAGEMENT

// Executes a function with gl states temporarily set, exception safe
// Currently support scissor test and framebuffer binding
export function glContextWithState(gl, {scissorTest, framebuffer}, func) {
  // assertWebGLContext(gl);

  let scissorTestWasEnabled;
  if (scissorTest) {
    scissorTestWasEnabled = gl.isEnabled(gl.SCISSOR_TEST);
    const {x, y, w, h} = scissorTest;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, y, w, h);
  }

  if (framebuffer) {
    // TODO - was there any previously set frame buffer we need to remember?
    framebuffer.bind();
  }

  let value;
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
export function glGetDebugInfo(gl) {
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  // We can't determine if 'WEBGL_debug_renderer_info' is supported by
  // checking whether info is null here. Firefox doesn't follow the
  // specs by returning null for unsupported extension. Instead,
  // it returns an object without GL_UNMASKED_VENDOR_WEBGL and GL_UNMASKED_RENDERER_WEBGL.
  return {
    vendor: (info && info.UNMASKED_VENDOR_WEBGL) ?
      gl.getParameter(info.UNMASKED_VENDOR_WEBGL) : 'unknown',
    renderer: (info && info.UNMASKED_RENDERER_WEBGL) ?
      gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown'
  };
}

function logInfo(gl) {
  const webGL = isWebGL2Context(gl) ? 'WebGL2' : 'WebGL1';
  const info = glGetDebugInfo(gl);
  const driver = info ? `(${info.vendor} ${info.renderer})` : '';
  const debug = gl.debug ? 'debug' : '';
  log.log(0, `luma.gl: Created ${webGL} ${debug} context ${driver}`, gl);

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
