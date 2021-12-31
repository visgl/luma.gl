import {Device, loadImage} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import Texture, {TextureProps, TextureSupportOptions} from './texture';


export type Texture2DProps = TextureProps & {
  format?: number;
};

export default class Texture2D extends Texture {
  // get [Symbol.toStringTag](): string {
  //   return 'Texture2D';
  // }

  static isSupported(device: Device | WebGLRenderingContext, opts?: TextureSupportOptions): boolean {
    return Texture.isSupported(device, opts);
  }

  constructor(device: Device | WebGLRenderingContext, props?: Texture2DProps | Promise<Texture2DProps>) {
    // // Signature: new Texture2D(gl, url | Promise)
    if (props instanceof Promise || typeof props === 'string') {
      props = {data: props};
    }

    // // Signature: new Texture2D(gl, {data: url})
    // if (typeof props?.data === 'string') {
    //   props = Object.assign({}, props, {data: loadImage(props.data)});
    // }

    super(device, {...props, dimension: '2d'}); // target: GL.TEXTURE_2D

    // this.initialize(props);

    // Object.seal(this);
  }
}
