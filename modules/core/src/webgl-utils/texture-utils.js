import Texture2D from '../webgl/texture-2d';
import TextureCube from '../webgl/texture-cube';
import Texture3D from '../webgl/texture-3d';
import assert from 'assert';

// Clone a new texture object from a reference texture object.
export function cloneTextureFrom(refTexture, overrides) {
  assert(
    refTexture instanceof Texture2D ||
      refTexture instanceof TextureCube ||
      refTexture instanceof Texture3D
  );

  const TextureType = refTexture.constructor;

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
  return new TextureType(gl, textureOptions);
}
