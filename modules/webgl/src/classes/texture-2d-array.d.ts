import Texture from "@luma.gl/webgl/classes/texture";

export default class Texture2D extends Texture {
  static isSupported(gl: WebGLRenderingContext, opts: any): boolean;
  constructor(gl: WebGLRenderingContext, props?: {});
}
