import Texture, {TextureProps} from './texture';

export type Texture2DProps = TextureProps & {
};

export default class Texture2D extends Texture {
  static isSupported(gl: WebGLRenderingContext, opts?: object): boolean;

  constructor(gl: WebGLRenderingContext, props?: Texture2DProps);
  constructor(gl: WebGLRenderingContext, props: Promise<Texture2DProps>);
}
