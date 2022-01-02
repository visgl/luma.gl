import {Device} from '@luma.gl/api';
import WebGLDevice from '../adapter/webgl-device';
import {assertWebGL2Context} from '../context/context/webgl-checks';
import Texture, {TextureProps} from './texture';

/**
 * Textures that have 3 dimensions: width, height, and depth.
 * They are accessed by 3-dimensional texture coordinates.
 * @deprecated Use device.createTexture({dimension: '3d'})
 */
export default class Texture3D extends Texture {
  static isSupported(device: Device | WebGLRenderingContext): boolean {
    try {
      const webglDevice = WebGLDevice.attach(device);
      return webglDevice.isWebGL2;
    } catch {
      return false;
    }
  }

  constructor(device: Device | WebGL2RenderingContext, props: TextureProps = {}) {
    // @ts-expect-error
    super(device, {depth: 1, ...props, dimension: '3d', unpackFlipY: false}); // target: GL.TEXTURE_3D});
    assertWebGL2Context(this.gl2);
    Object.seal(this);
  }
}
