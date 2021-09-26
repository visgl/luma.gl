import type {default as Framebuffer} from '../classes/framebuffer';
import type {default as VertexArrayObject} from '../classes/vertex-array-object';

/**
 * Data stored by luma.gl on the context
 */
export type LumaContextData = {
  defaultFramebuffer?: Framebuffer;
  defaultVertexArray?: VertexArrayObject;
  info: {[key: string]: any};
  caps: {[key: string]: any};
  limits: {[key: string]: any};
  webgl1MinLimits: {[key: string]: any};
  webgl2MinLimits: {[key: string]: any};
};

/**
 * 
 * @param gl 
 * @returns 
 */
export function getLumaContextData(gl: WebGLRenderingContext): LumaContextData {
  // @ts-expect-error
  gl.luma = gl.luma || {};
  // @ts-expect-error
  return gl.luma as LumaContextData;
}