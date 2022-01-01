import {Device, log} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import WebGLDevice from '../adapter/webgl-device';
import {assertWebGLContext} from '../context/context/webgl-checks';
import Texture, {TextureProps} from './texture';

export default class TextureCube extends Texture {
  static FACES: number[] = [
    GL.TEXTURE_CUBE_MAP_POSITIVE_X,
    GL.TEXTURE_CUBE_MAP_NEGATIVE_X,
    GL.TEXTURE_CUBE_MAP_POSITIVE_Y,
    GL.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    GL.TEXTURE_CUBE_MAP_POSITIVE_Z,
    GL.TEXTURE_CUBE_MAP_NEGATIVE_Z
  ];

  constructor(device: Device | WebGLRenderingContext, props?: TextureProps) {
    super(device, Object.assign({}, props, {
      dimension: 'cube',
      target: GL.TEXTURE_CUBE_MAP
    }));

    this.initializeCube(props);
}

  // TODO - this method likely doesn't work
  subImage(options: {face: any; data: any; x?: number; y?: number; mipmapLevel?: number}): any {
    const {face, data, x = 0, y = 0, mipmapLevel = 0} = options;
    // @ts-expect-error TODO - is this a bug?
    return this._subImage({target: face, data, x, y, mipmapLevel});
  }
}
