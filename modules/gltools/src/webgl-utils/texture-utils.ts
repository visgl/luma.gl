// TODO: Two subdirectories must not depend on each other (classes vs utils)!
import {assert} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import Texture from '../classic/texture';
import Texture2D from '../classic/texture-2d';
import TextureCube from '../classic/texture-cube';
import Texture3D from '../classic/texture-3d';
import Framebuffer, {ClassicFramebufferProps} from '../classic/framebuffer';

type TextureType = Texture2D | TextureCube | Texture3D;

/** 
 * Clone a new texture object from a reference texture object. 
 * @deprecated
 */
export function cloneTextureFrom<T extends TextureType>(refTexture: T, overrides?: any): T {
  assert(
    refTexture instanceof Texture2D ||
      refTexture instanceof TextureCube ||
      refTexture instanceof Texture3D
  );

  const TextureType = refTexture.constructor;

  const {gl, width, height, format, type, dataFormat, mipmaps} = refTexture;

  const textureOptions = {
    width,
    height,
    format,
    type,
    dataFormat,
    mipmaps,
    ...overrides
  };

  // TODO: move this to `Texture` class as instance method and use this.constructor
  // @ts-expect-error
  return new TextureType(gl, textureOptions);
}

/**
 * Wraps a given texture into a framebuffer object, that can be further used
 * to read data from the texture object.
 */
export function toFramebuffer(texture: Texture, props?: ClassicFramebufferProps): Framebuffer {
  const {gl, width, height, id} = texture;
  const framebuffer = new Framebuffer(
    gl,
    {
      ...props,
      id: `framebuffer-for-${id}`,
      width,
      height,
      attachments: {
        [GL.COLOR_ATTACHMENT0]: texture
      }
    }
  );
  return framebuffer;
}
