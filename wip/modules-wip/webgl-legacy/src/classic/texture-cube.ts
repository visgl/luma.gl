import {Device} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import Texture, {TextureProps} from './texture';

/**
 * Cube Texture
 * @deprecated Use device.createTexture({dimension: 'cube'})
 */
export default class TextureCube extends Texture {
  static override FACES: number[] = [
    GL.TEXTURE_CUBE_MAP_POSITIVE_X,
    GL.TEXTURE_CUBE_MAP_NEGATIVE_X,
    GL.TEXTURE_CUBE_MAP_POSITIVE_Y,
    GL.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    GL.TEXTURE_CUBE_MAP_POSITIVE_Z,
    GL.TEXTURE_CUBE_MAP_NEGATIVE_Z
  ];

  constructor(device: Device | WebGLRenderingContext, props?: TextureProps) {
    super(device, Object.assign({}, props, {dimension: 'cube'}));
  }
}
