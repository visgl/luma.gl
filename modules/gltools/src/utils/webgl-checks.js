import {assert} from './assert';

const ERR_CONTEXT = 'Invalid WebGLRenderingContext';
export const ERR_WEBGL = ERR_CONTEXT;
export const ERR_WEBGL2 = 'Requires WebGL2';

export function isWebGL(gl) {
  if (typeof WebGLRenderingContext !== 'undefined' && gl instanceof WebGLRenderingContext) {
    return true;
  }
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
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

export function getWebGL2Context(gl) {
  return isWebGL2(gl) ? gl : null;
}

export function assertWebGLContext(gl) {
  assert(isWebGL(gl), ERR_CONTEXT);
  return gl;
}

export function assertWebGL2Context(gl) {
  assert(isWebGL2(gl), ERR_WEBGL2);
  return gl;
}
