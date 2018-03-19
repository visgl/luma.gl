/* eslint-disable quotes, no-console */
/* global console */
import isBrowser from '../utils/is-browser';
import assert from '../utils/assert';

const ERR_HEADLESSGL_LOAD = `\
WebGL API not available: Failed to dynamically load headless gl. \
headless gl either not installed or not accessible from this directory. \
Try rerunning after doing "npm install gl".`;

const ERR_HEADLESSGL_NOT_AVAILABLE =
'Failed to create WebGL context in Node.js, headless gl not available';

const ERR_HEADLESSGL_FAILED =
'Failed to create WebGL context in Node.js, headless gl returned null';

export let headlessGL = null;
export let headlessTypes = null;

if (!isBrowser) {
  try {
    headlessGL = module.require('gl');
    headlessTypes = module.require('gl/wrap');
  } catch (error) {
    console.error(ERR_HEADLESSGL_LOAD);
    console.error(`Node error: ${error.message}`);
  }
  assert(headlessTypes && headlessTypes.WebGLRenderingContext);
}

export const isWebglAvailable = isBrowser || headlessGL;

// Create headless gl context (for running under Node.js)
export function createHeadlessContext({width, height, opts, onError}) {
  const {webgl1, webgl2} = opts;
  if (webgl2 && !webgl1) {
    return onError('headless-gl does not support WebGL2');
  }
  if (!headlessGL) {
    return onError(ERR_HEADLESSGL_NOT_AVAILABLE);
  }
  const gl = headlessGL(width, height, opts);
  if (!gl) {
    return onError(ERR_HEADLESSGL_FAILED);
  }
  return gl;
}
