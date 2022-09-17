import Texture, {TextureProps} from './texture';

export type Texture3DProps = TextureProps & {
};

/**
 * Textures that have 3 dimensions: width, height, and depth. 
 * They are accessed by 3-dimensional texture coordinates.
 */
export default class Texture3D extends Texture {
  static isSupported(gl: WebGLRenderingContext): boolean;

  constructor(gl: WebGL2RenderingContext, props: Texture3DProps);

  /** Image 3D copies from Typed Array or WebGLBuffer */
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
