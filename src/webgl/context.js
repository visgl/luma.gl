// WebGLRenderingContext related methods

/* global document */
import GL from './api';
import {WebGLRenderingContext, WebGL2RenderingContext, webGLTypesAvailable} from './api';
import {makeDebugContext} from './context-debug';

import queryManager from './helpers/query-manager';
import {log, isBrowser, isPageLoaded, pageLoadPromise} from '../utils';
import luma from '../init';
import assert from 'assert';

const GL_UNMASKED_VENDOR_WEBGL = 0x9245; // vendor string of the graphics driver.
const GL_UNMASKED_RENDERER_WEBGL = 0x9246; // renderer string of the graphics driver.

// Heuristic testing of contexts (to indentify debug wrappers around gl contexts)
const GL_ARRAY_BUFFER = 0x8892;
const GL_TEXTURE_BINDING_3D = 0x806A;

export const ERR_CONTEXT = 'Invalid WebGLRenderingContext';
export const ERR_WEBGL = ERR_CONTEXT;
export const ERR_WEBGL2 = 'Requires WebGL2';

const ERR_WEBGL_MISSING_BROWSER = `\
WebGL API is missing. Check your if your browser supports WebGL or
install a recent version of a major browser.`;

const ERR_WEBGL_MISSING_NODE = `\
WebGL API is missing. To run luma.gl under Node.js, please "npm install gl"
and import 'luma.gl/headless' before importing 'luma.gl'.`;

const ERR_HEADLESSGL_NOT_AVAILABLE =
'Cannot create headless WebGL context, headlessGL not available';

const ERR_HEADLESSGL_FAILED = 'headlessGL failed to create headless WebGL context';

export function isWebGL(gl) {
  return gl && (gl instanceof WebGLRenderingContext ||
    gl.ARRAY_BUFFER === GL_ARRAY_BUFFER);
}

export function isWebGL2(gl) {
  return gl && (gl instanceof WebGL2RenderingContext ||
    gl.TEXTURE_BINDING_3D === GL_TEXTURE_BINDING_3D);
}

export function isWebGLContext(gl) {
  return isWebGL(gl);
}

export function isWebGL2Context(gl) {
  return isWebGL2(gl);
}

export function assertWebGLContext(gl) {
  // Need to handle debug context
  assert(isWebGLContext(gl), ERR_CONTEXT);
}

export function assertWebGL2Context(gl) {
  // Need to handle debug context
  assert(isWebGL2Context(gl), ERR_WEBGL2);
}

const contextDefaults = {
  // HEADLESS CONTEXT PARAMETERS: width are height are only used by headless gl
  width: 800,
  height: 600,
  // COMMON CONTEXT PARAMETERS
  // Attempt to allocate WebGL2 context
  webgl2: false,
  webgl1: true,
  throwOnFailure: true,
  // Instrument context (at the expense of performance)
  // Note: currently defaults to true and needs to be explicitly turned off
  debug: false
};

// Change default context creation parameters. Main use case is regression test suite.
export function setContextDefaults(opts = {}) {
  Object.assign(contextDefaults, {width: 1, height: 1}, opts);
}

// Checks if WebGL is enabled and creates a context for using WebGL.
/* eslint-disable complexity, max-statements */
export function createGLContext(opts = {}) {
  // BROWSER CONTEXT PARAMATERS: canvas is only used when in browser
  let {canvas} = opts;

  opts = Object.assign({}, contextDefaults, opts);
  const {
    // HEADLESS CONTEXT PARAMETERS: width are height are only used by headless gl
    width,
    height,
    // COMMON CONTEXT PARAMETERS
    // Attempt to allocate WebGL2 context
    webgl2,
    webgl1,
    throwOnError,
    // Instrument context (at the expense of performance)
    // Note: currently defaults to true and needs to be explicitly turned off
    debug
    // Other options are passed through to context creator
  } = opts;

  let gl;

  function error(message) {
    // log(0, error);
    console.error(error); // eslint-disable-line
    if (throwOnError) {
      throw new Error(message);
    }
    return null;
  }

  if (!isBrowser) {
    if (webgl2 && !webgl1) {
      return error('headless-gl does not support WebGL2');
    }
    gl = _createHeadlessContext(width, height, opts, error);
  } else {
    // Create browser gl context
    if (!webGLTypesAvailable) {
      return error(ERR_WEBGL_MISSING_BROWSER);
    }
    // Make sure we have a canvas
    canvas = canvas;
    if (typeof canvas === 'string') {
      if (!isPageLoaded) {
        return error(`createGLContext called on canvas '${canvas}' before page was loaded`);
      }
      canvas = document.getElementById(canvas);
    }
    if (!canvas) {
      canvas = _createCanvas({width, height});
    }

    canvas.addEventListener('webglcontextcreationerror', e => {
      log.log(0, e.statusMessage || 'Unknown error');
    }, false);

    // Prefer webgl2 over webgl1, prefer conformant over experimental
    if (webgl2) {
      gl = gl || canvas.getContext('webgl2', opts);
      gl = gl || canvas.getContext('experimental-webgl2', opts);
    }
    if (webgl1) {
      gl = gl || canvas.getContext('webgl', opts);
      gl = gl || canvas.getContext('experimental-webgl', opts);
    }
    if (!gl) {
      return error(`Failed to create ${webgl2 ? 'WebGL2' : 'WebGL'} context`);
    }
  }

  if (isBrowser && debug) {
    gl = makeDebugContext(gl);
    // Debug forces log level to at least 1
    log.priority = Math.max(log.priority, 1);
    // Log some debug info
    logInfo(gl);
  }

  return gl;
}

// Create a canvas set to 100%
// TODO - remove
function _createCanvas({width, height}) {
  const canvas = document.createElement('canvas');
  canvas.id = 'lumagl-canvas';
  canvas.style.width = Number.isFinite(width) ? `${width}px` : '100%';
  canvas.style.height = Number.isFinite(height) ? `${height}px` : '100%';
  // adds the canvas to the body element
  pageLoadPromise.then(document => {
    const body = document.body;
    body.insertBefore(canvas, body.firstChild);
  });
  return canvas;
}

function _createHeadlessContext(width, height, opts, error) {
  // Create headless gl context
  if (!webGLTypesAvailable) {
    return error(ERR_WEBGL_MISSING_NODE);
  }
  if (!luma.globals.headlessGL) {
    return error(ERR_HEADLESSGL_NOT_AVAILABLE);
  }
  const gl = luma.globals.headlessGL(width, height, opts);
  if (!gl) {
    return error(ERR_HEADLESSGL_FAILED);
  }
  return gl;
}

// VERY LIMITED / BASIC GL STATE MANAGEMENT

// Executes a function with gl states temporarily set, exception safe
// Currently support scissor test and framebuffer binding
export function withParameters(gl, {scissorTest, framebuffer, nocatch = true}, func) {
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

  function finalize() {
    if (!scissorTestWasEnabled) {
      gl.disable(gl.SCISSOR_TEST);
    }
    if (framebuffer) {
      // TODO - was there any previously set frame buffer?
      // TODO - delegate "unbind" to Framebuffer object?
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }

  let value;
  if (nocatch) {
    value = func(gl);
    finalize();
  } else {
    try {
      value = func(gl);
    } finally {
      finalize();
    }
  }
  return value;
}

export function getGLContextInfo(gl) {
  const vendorMasked = gl.getParameter(GL.VENDOR);
  const rendererMasked = gl.getParameter(GL.RENDERER);
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const vendorUnmasked = info && gl.getParameter(GL_UNMASKED_VENDOR_WEBGL);
  const rendererUnmasked = info && gl.getParameter(GL_UNMASKED_RENDERER_WEBGL);
  return {
    vendor: vendorUnmasked || vendorMasked,
    renderer: rendererUnmasked || rendererMasked,
    vendorMasked,
    rendererMasked,
    version: gl.getParameter(GL.VERSION),
    shadingLanguageVersion: gl.getParameter(GL.SHADING_LANGUAGE_VERSION)
  };
}

// POLLING FOR PENDING QUERIES
// Calling this function checks all pending queries for completion
export function pollContext(gl) {
  queryManager.poll(gl);
}

// DEBUG INFO

/**
 * Provides strings identifying the GPU vendor and driver.
 * https://www.khronos.org/registry/webgl/extensions/WEBGL_debug_renderer_info/
 * @param {WebGLRenderingContext} gl - context
 * @return {Object} - 'vendor' and 'renderer' string fields.
 */
export function glGetDebugInfo(gl) {
  return getGLContextInfo(gl);
  // const info = gl.getExtension('WEBGL_debug_renderer_info');
  // // We can't determine if 'WEBGL_debug_renderer_info' is supported by
  // // checking whether info is null here. Firefox doesn't follow the
  // // specs by returning null for unsupported extension. Instead,
  // // it returns an object without GL_UNMASKED_VENDOR_WEBGL and GL_UNMASKED_RENDERER_WEBGL.
  // return {
  //   vendor: (info && info.UNMASKED_VENDOR_WEBGL) ?
  //     gl.getParameter(info.UNMASKED_VENDOR_WEBGL) : 'unknown',
  //   renderer: (info && info.UNMASKED_RENDERER_WEBGL) ?
  //     gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown'
  // };
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

// DEPRECATED

export function glContextWithState(...args) {
  return withParameters(...args);
}
