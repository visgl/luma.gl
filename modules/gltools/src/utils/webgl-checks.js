/* global WebGLRenderingContext, WebGL2RenderingContext */

import {assert} from './assert';

export const ERR_CONTEXT = 'Invalid WebGLRenderingContext';
export const ERR_WEBGL = ERR_CONTEXT;
export const ERR_WEBGL2 = 'Requires WebGL2';

export function isWebGL(gl) {
  if (typeof WebGLRenderingContext !== 'undefined' && gl instanceof WebGLRenderingContext) {
    return true;
  }
  // Look for debug contexts, headless gl etc
  return Boolean(gl && Number.isFinite(gl._version));
}

export function isWebGL2(gl) {
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return true;
  }
  // Look for debug contexts, headless gl etc
  return Boolean(gl && gl._version === 2);
}

export function assertWebGLContext(gl) {
  assert(isWebGL(gl), ERR_CONTEXT);
}

export function assertWebGL2Context(gl) {
  assert(isWebGL2(gl), ERR_WEBGL2);
}
