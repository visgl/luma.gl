import {Texture, Framebuffer, FramebufferProps} from '@luma.gl/api';

/** 
 * Clone a new texture object from a reference texture object. 
 * @deprecated
 */
export function cloneTextureFrom(refTexture: Texture, overrides?: any): Texture {

  // @ts-expect-error WebGL texture fields
  const {width, height, format, type, dataFormat, mipmaps} = refTexture;

  // TODO: move this to `Texture` class as instance method and use this.constructor
  return refTexture.device.createTexture({
    width,
    height,
    format,
    type,
    dataFormat,
    mipmaps,
    ...overrides
  });
}

/**
 * Wraps a given texture into a framebuffer object, that can be further used
 * to read data from the texture object.
 */
export function toFramebuffer(texture: Texture, props?: FramebufferProps): Framebuffer {
  const {device, width, height, id} = texture;
  const framebuffer = device.createFramebuffer({
    ...props,
    id: `framebuffer-for-${id}`,
    width,
    height,
    colorAttachments: [
      texture
    ]
  }
  );
  return framebuffer;
}
