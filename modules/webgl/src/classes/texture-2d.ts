import GL from '@luma.gl/constants';
import {assertWebGLContext} from '@luma.gl/gltools';
import Texture, {TextureProps} from './texture';
import {loadImage} from '../utils/load-file';


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
      // @ts-expect-error
      props = Object.assign({}, props, {data: loadImage(props.data)});
    }

    super(gl, Object.assign({}, props, {target: GL.TEXTURE_2D}));

    this.initialize(props);

    Object.seal(this);
  }
}
