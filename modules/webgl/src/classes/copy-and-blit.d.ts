import Buffer from './buffer';
import Framebuffer from './framebuffer';
import Texture from './texture';

// NOTE: Slow requires roundtrip to GPU
// Copies data from a Framebuffer or a Texture object into ArrayBuffer object.
// App can provide targetPixelArray or have it auto allocated by this method
// @returns {Uint8Array|Uint16Array|FloatArray} - pixel array,
//  newly allocated by this method unless provided by app.
export function readPixelsToArray(
  source: Framebuffer | Texture,
  options?: {
    sourceX?: number;
    sourceY?: number;
    sourceFormat?: number;
    sourceAttachment?: number;
    target?: Uint8Array | Uint16Array | Float32Array;
    // following parameters are auto deduced if not provided
    sourceWidth?: number;
    sourceHeight?: number;
    sourceType?: number;
  }
): Uint8Array | Uint16Array | Float32Array;

// NOTE: doesn't wait for copy to be complete, it programs GPU to perform a DMA transffer.
// Copies data from a Framebuffer or a Texture object into a Buffer object.
export function readPixelsToBuffer(
  source: Framebuffer | Texture,
  options?: {
    sourceX?: number;
    sourceY?: number;
    sourceFormat?: number;
    target?: Buffer; // A new Buffer object is created when not provided.
    targetByteOffset?: number; // byte offset in buffer object
    // following parameters are auto deduced if not provided
    sourceWidth?: number;
    sourceHeight?: number;
    sourceType?: number;
  }
): Buffer;

// Reads pixels from a Framebuffer or Texture object to a dataUrl
export function copyToDataUrl(
  source,
  options?: {
    sourceAttachment?: number; // TODO - support gl.readBuffer
    targetMaxHeight?: number;
  }
): string;

// Reads pixels from a Framebuffer or Texture object into an HTML Image
export function copyToImage(
  source: Framebuffer | Texture,
  options?: {
    sourceAttachment?: number; // TODO - support gl.readBuffer
    targetImage?: typeof Image;
  }
): typeof Image;

// Copy a rectangle from a Framebuffer or Texture object into a texture (at an offset)
export function copyToTexture(
  source: Framebuffer | Texture,
  target: Texture,
  options?: {
    sourceX?: number;
    sourceY?: number;

    targetX?: number;
    targetY?: number;
    targetZ?: number;
    targetMipmaplevel?: number;
    targetInternalFormat?: number;

    width?: number; // defaults to target width
    height?: number; // defaults to target height
  }
): Texture;

// NOTE: WEBLG2 only
// Copies a rectangle of pixels between Framebuffer or Texture objects
// eslint-disable-next-line max-statements, complexity
export function blit(
  source,
  target,
  options: {
    sourceAttachment?: number;
    sourceX0?: number;
    sourceY0?: number;
    sourceX1?: number;
    sourceY1?: number;
    targetX0?: number;
    targetY0?: number;
    targetX1?: number;
    targetY1?: number;
    color?: boolean;
    depth?: boolean;
    stencil?: boolean;
    mask?: number;
    filter?: number;
  }
): void;
