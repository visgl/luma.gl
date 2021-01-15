import Texture, {TextureProps} from './texture';

export type Texture2DArrayProps = TextureProps & {
};

export default class Texture2DArray extends Texture {
  static isSupported(gl: WebGLRenderingContext, opts?: object): boolean;

  constructor(gl: WebGLRenderingContext, props?: Texture2DArrayProps);
}
