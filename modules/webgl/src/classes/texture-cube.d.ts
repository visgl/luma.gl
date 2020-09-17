
import Texture from "@luma.gl/webgl/classes/texture";
export default class TextureCube extends Texture {
  constructor(gl: WebGLRenderingContext, props?: {});
  initialize(props?: {}): void;
  subImage(options: {
    face: any;
    data: any;
    x?: number;
    y?: number;
    mipmapLevel?: number;
  }): any;
  setCubeMapImageData(options: {
    width: any;
    height: any;
    pixels: any;
    data: any;
    border?: number;
    format?: any;
    type?: any;
  }): Promise<void>;
  setImageDataForFace(options: any): this;
}
