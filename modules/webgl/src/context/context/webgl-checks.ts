// luma.gl, MIT license
import {assert} from '@luma.gl/core';

const ERR_CONTEXT = 'Invalid WebGLRenderingContext';
export const ERR_WEBGL = ERR_CONTEXT;
export const ERR_WEBGL2 = 'Requires WebGL2';


/** Check if supplied parameter is a WebGLRenderingContext */
export function isWebGL(gl: any): boolean {
  if (typeof WebGLRenderingContext !== 'undefined' && gl instanceof WebGLRenderingContext) {
    return true;
  }
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return true;
  }
  // Look for debug contexts, headless gl etc
  return Boolean(gl && Number.isFinite(gl._version));
}


/** Check if supplied parameter is a WebGL2RenderingContext */
export function isWebGL2(gl: any): boolean {
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
    return true;
  }
  // Look for debug contexts, headless gl etc
  return Boolean(gl && gl._version === 2);
}


/** Returns a properly typed WebGL2RenderingContext from a WebGL1 context, or null */
export function getWebGL2Context(gl: WebGLRenderingContext): WebGL2RenderingContext | null {
  // @ts-expect-error
  return isWebGL2(gl) ? gl : null;
}


/** Throw if supplied parameter is not a WebGLRenderingContext, otherwise return properly typed value */
export function assertWebGLContext(gl: any): WebGLRenderingContext {
  assert(isWebGL(gl), ERR_CONTEXT);
  return gl;
}

/** Throw if supplied parameter is not a WebGL2RenderingContext, otherwise return properly typed value */
export function assertWebGL2Context(gl: any): WebGL2RenderingContext {
  assert(isWebGL2(gl), ERR_WEBGL2);
  return gl;
}
