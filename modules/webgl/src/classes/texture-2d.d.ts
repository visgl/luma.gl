import Texture from './texture';

export default class Texture2D extends Texture {
  static isSupported(gl: WebGLRenderingContext, opts?: object): boolean;

  constructor(gl: WebGLRenderingContext, props?: object);
}
