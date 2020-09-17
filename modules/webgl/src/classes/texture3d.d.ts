import Texture from "@luma.gl/webgl/classes/texture";

export default class Texture3D extends Texture {
  static isSupported(gl: WebGLRenderingContext): boolean;
  constructor(gl: WebGLRenderingContext, props?: {});
  setImageData(options: {
    level?: number;
    dataFormat?: any;
    width: any;
    height: any;
    depth?: number;
    border?: number;
    format: any;
    type?: any;
    offset?: number;
    data: any;
    parameters?: {};
  }): this;
}
