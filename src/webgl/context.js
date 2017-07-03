// WebGLRenderingContext related methods
import {WebGLRenderingContext, WebGL2RenderingContext, webGLTypesAvailable} from './api';
import trackContextState from '../webgl-utils/track-context-state';
import {createCanvas, getCanvas, createContext} from '../webgl-utils';

import {makeDebugContext} from './context-debug';
import {glGetDebugInfo} from './context-limits';
import queryManager from './helpers/query-manager';

import {log, isBrowser} from '../utils';
import luma from '../init';
import assert from 'assert';

// Heuristic testing of contexts (to indentify debug wrappers around gl contexts)
const GL_ARRAY_BUFFER = 0x8892;
const GL_TEXTURE_BINDING_3D = 0x806A;

export const ERR_CONTEXT = 'Invalid WebGLRenderingContext';
export const ERR_WEBGL = ERR_CONTEXT;
export const ERR_WEBGL2 = 'Requires WebGL2';

const ERR_WEBGL_MISSING_NODE = `\
WebGL API is missing. To run luma.gl under Node.js, please "npm install gl"
and import 'luma.gl/headless' before importing 'luma.gl'.`;

const ERR_HEADLESSGL_NOT_AVAILABLE =
'Cannot create headless WebGL context, headlessGL not available';

const ERR_HEADLESSGL_FAILED = 'headlessGL failed to create headless WebGL context';

export function isWebGL(gl) {
  return Boolean(gl && (
    gl instanceof WebGLRenderingContext ||
    gl.ARRAY_BUFFER === GL_ARRAY_BUFFER
  ));
}

export function isWebGL2(gl) {
  return Boolean(gl && (
    gl instanceof WebGL2RenderingContext ||
    gl.TEXTURE_BINDING_3D === GL_TEXTURE_BINDING_3D
  ));
}

export function isWebGLContext(gl) {
  log.deprecated('isWebGLContext', 'isWebGL');
  return isWebGL(gl);
}

export function isWebGL2Context(gl) {
  log.deprecated('isWebGL2Context', 'isWebGL2');
  return isWebGL2(gl);
}

export function assertWebGLContext(gl) {
  // Need to handle debug context
  assert(isWebGL(gl), ERR_CONTEXT);
}

export function assertWebGL2Context(gl) {
  // Need to handle debug context
  assert(isWebGL2(gl), ERR_WEBGL2);
}

const contextDefaults = {
  // COMMON CONTEXT PARAMETERS
  // Attempt to allocate WebGL2 context
  webgl2: true, // Attempt to create a WebGL2 context (false to force webgl1)
  webgl1: true,  // Attempt to create a WebGL1 context (false to fail if webgl2 not available)
  throwOnFailure: true,
  manageState: true,
  // BROWSER CONTEXT PARAMETERS
  canvas: null, // A canvas element or a canvas string id
  debug: false, // Instrument context (at the expense of performance)
  // HEADLESS CONTEXT PARAMETERS
  width: 800, // width are height are only used by headless gl
  height: 600
  // WEBGL/HEADLESS CONTEXT PARAMETERS
  // Remaining options are passed through to context creator
};

/*
 * Change default context creation parameters.
 * Main use case is regression test suite.
 */
export function setContextDefaults(opts = {}) {
  Object.assign(contextDefaults, {width: 1, height: 1}, opts);
}

/*
 * Creates a context giving access to the WebGL API
 */
/* eslint-disable complexity, max-statements */
export function createGLContext(opts = {}) {
  opts = Object.assign({}, contextDefaults, opts);
  const {canvas, width, height, throwOnError, manageState, debug} = opts;

  // Error reporting function, enables exceptions to be disabled
  function onError(message) {
    if (throwOnError) {
      throw new Error(message);
    }
    // log.log(0, message);
    return null;
  }

  let gl;
  if (isBrowser) {
    // Make sure we have a real canvas ("canvas" can a string, a canvas or null)
    let realCanvas;
    if (!canvas) {
      realCanvas = createCanvas({id: 'lumagl-canvas', width, height, onError});
    } else if (typeof canvas === 'string') {
      realCanvas = getCanvas({id: canvas});
    } else {
      realCanvas = canvas;
    }
    // Create a WebGL context in the canvas
    gl = createContext({canvas: realCanvas, opts});
  } else {
    // Create a headless-gl context under Node.js
    gl = _createHeadlessContext({width, height, opts, onError});
  }
  if (!gl) {
    return null;
  }

  // Install context state tracking
  if (manageState) {
    trackContextState(gl, {
      copyState: false,
      log: (...args) => log.log(1, ...args)
    });
  }

  // Add debug instrumentation to the context
  if (isBrowser && debug) {
    gl = makeDebugContext(gl, {debug});
    // Debug forces log level to at least 1
    log.priority = Math.max(log.priority, 1);
    // Log some debug info about the context
    logInfo(gl);
  }

  // Add to seer integration

  return gl;
}

export function deleteGLContext(gl) {
  // Remove from seer integration
}

// POLLING FOR PENDING QUERIES
// Calling this function checks all pending queries for completion
export function pollContext(gl) {
  queryManager.poll(gl);
}

function logInfo(gl) {
  const webGL = isWebGL2(gl) ? 'WebGL2' : 'WebGL1';
  const info = glGetDebugInfo(gl);
  const driver = info ? `(${info.vendor} ${info.renderer})` : '';
  const debug = gl.debug ? 'debug' : '';
  log.log(0, `luma.gl: Created ${webGL} ${debug} context ${driver}`, gl);
}

// Create headless gl context (for running under Node.js)
function _createHeadlessContext({width, height, opts, onError}) {
  const {webgl1, webgl2} = opts;
  if (webgl2 && !webgl1) {
    return onError('headless-gl does not support WebGL2');
  }
  if (!webGLTypesAvailable) {
    return onError(ERR_WEBGL_MISSING_NODE);
  }
  if (!luma.globals.headlessGL) {
    return onError(ERR_HEADLESSGL_NOT_AVAILABLE);
  }
  const gl = luma.globals.headlessGL(width, height, opts);
  if (!gl) {
    return onError(ERR_HEADLESSGL_FAILED);
  }
  return gl;
}
