import {loadImage} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {assertWebGLContext} from '../context/context/webgl-checks';
import Texture, {TextureProps} from './texture';


export type Texture2DProps = TextureProps & {
};

export default class Texture2D extends Texture {
  static isSupported(gl: WebGLRenderingContext, opts?: object): boolean {
    // @ts-expect-error
    return Texture.isSupported(gl, opts);
  }

  constructor(gl: WebGLRenderingContext, props?: Texture2DProps | Promise<Texture2DProps>) {
      assertWebGLContext(gl);

    // Signature: new Texture2D(gl, url | Promise)
    if (props instanceof Promise || typeof props === 'string') {
      props = {data: props};
    }

    // Signature: new Texture2D(gl, {data: url})
    if (typeof props?.data === 'string') {
      props = Object.assign({}, props, {data: loadImage(props.data)});
    }

    super(gl, Object.assign({}, props, {target: GL.TEXTURE_2D}));

    this.initialize(props);

    Object.seal(this);
  }

  get [Symbol.toStringTag](): string {
    return 'Texture2D';
  }
}
