// TODO: Two subdirectories must not depend on each other (classes vs utils)!
import Texture2D from '../classes/texture-2d';
import TextureCube from '../classes/texture-cube';
import Texture3D from '../classes/texture-3d';
import Framebuffer from '../classes/framebuffer';
import GL from '@luma.gl/constants';
import {assert} from '../utils/assert';

// Clone a new texture object from a reference texture object.
/** @type {import('./texture-utils').cloneTextureFrom} */
export function cloneTextureFrom(refTexture, overrides) {
  assert(
    refTexture instanceof Texture2D ||
      refTexture instanceof TextureCube ||
      refTexture instanceof Texture3D
  );

  const TextureType = refTexture.constructor;

  // @ts-expect-error
  const {gl, width, height, format, type, dataFormat, border, mipmaps} = refTexture;

  const textureOptions = Object.assign(
    {
      width,
      height,
      format,
      type,
      dataFormat,
      border,
      mipmaps
    },
    overrides
  );

  // TODO: move this to `Texture` class as instance method and use this.constructor
  // @ts-expect-error
  return new TextureType(gl, textureOptions);
}

// Wraps a given texture into a framebuffer object, that can be further used
// to read data from the texture object.
/** @type {import('./texture-utils').toFramebuffer} */
export function toFramebuffer(texture, opts) {
  const {gl, width, height, id} = texture;
  const framebuffer = new Framebuffer(
    gl,
    Object.assign({}, opts, {
      id: `framebuffer-for-${id}`,
      width,
      height,
      attachments: {
        [GL.COLOR_ATTACHMENT0]: texture
      }
    })
  );
  return framebuffer;
}
