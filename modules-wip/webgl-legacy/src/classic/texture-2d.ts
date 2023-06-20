import {Device, TextureData, TextureFormat} from '@luma.gl/api';
import Texture, {TextureProps} from './texture';

export type Texture2DProps = Omit<TextureProps, 'format'> & {
  format?: TextureFormat | number;
};

/**
 * Standard 2D Texture
 * @deprecated Use device.createTexture()
 */
export default class Texture2D extends Texture {
  // get [Symbol.toStringTag](): string {
  //   return 'Texture2D';
  // }

  static override isSupported(device: Device | WebGLRenderingContext, opts?): boolean { // : TextureSupportOptions
    return Texture.isSupported(device, opts);
  }

  constructor(device: Device | WebGLRenderingContext, props?: Texture2DProps | Promise<TextureData>) {
    // Signature: new Texture2D(gl, url | Promise)
    if (props instanceof Promise || typeof props === 'string') {
      props = {data: props};
    }

    // Signature: new Texture2D(gl, {data: url}):
    // Handled by `WEBGLTexture` constructor

    super(device, {
      ...props, 
      dimension: '2d'
    });
  }
}
