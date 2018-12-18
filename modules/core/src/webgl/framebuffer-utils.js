
import Buffer from './buffer';
import GL from '../constants';
import {assert} from '../utils';
import {getTypedArrayFromGLType, getGLTypeFromTypedArray} from '../webgl-utils/typed-array-utils';
import {glFormatToComponents, glTypeToBytes} from '../webgl-utils/format-utils';
import {withParameters} from '../webgl-context';
import {assertWebGL2Context} from '../webgl-utils';
import {flipRows, scalePixels} from '../webgl-utils';


// NOTE: Slow requires roundtrip to GPU
// App can provide pixelArray or have it auto allocated by this method
// @returns {Uint8Array|Uint16Array|FloatArray} - pixel array,
//  newly allocated by this method unless provided by app.
export function copyFramebufferToArray({
  framebuffer,
  x = 0,
  y = 0,
  width,
  height,
  format = GL.RGBA,
  type, // Auto deduced from pixelArray or gl.UNSIGNED_BYTE
  pixelArray = null,
  attachment = GL.COLOR_ATTACHMENT0 // TODO - support gl.readBuffer
} = {}) {
  assert(framebuffer);
  const {gl, handle, attachments} = framebuffer;
  width = width || framebuffer.width;
  height = height || framebuffer.height;

  // TODO - Set and unset gl.readBuffer
  if (attachment === GL.COLOR_ATTACHMENT0 && handle === null) {
    attachment = GL.FRONT;
  }

  assert(attachments[attachment]);

  // Deduce the type from color attachment if not provided.
  type = type || attachments[attachment].type;

  // Deduce type and allocated pixelArray if needed
  if (!pixelArray) {
    // Allocate pixel array if not already available, using supplied type
    type = type || gl.UNSIGNED_BYTE;
    const ArrayType = getTypedArrayFromGLType(type, {clamped: false});
    const components = glFormatToComponents(format);
    // TODO - check for composite type (components = 1).
    pixelArray = pixelArray || new ArrayType(width * height * components);
  }

  // Pixel array available, if necessary, deduce type from it.
  type = type || getGLTypeFromTypedArray(pixelArray);

  const prevHandle = gl.bindFramebuffer(GL.FRAMEBUFFER, handle);
  gl.readPixels(x, y, width, height, format, type, pixelArray);
  gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);

  return pixelArray;
}

// Reads data into provided buffer object asynchronously
// This function doesn't wait for copy to be complete, it programs GPU to perform a DMA transffer.
export function copyFramebufferToBuffer({
  framebuffer,
  x = 0,
  y = 0,
  width ,
  height,
  format = GL.RGBA,
  type, // When not provided, auto deduced from buffer or GL.UNSIGNED_BYTE
  buffer = null, // A new Buffer object is created when not provided.
  byteOffset = 0 // byte offset in buffer object
}) {
  assert(framebuffer);
  const {gl} = framebuffer;
  width = width || framebuffer.width;
  height = height || framebuffer.height;

  // Asynchronus read (PIXEL_PACK_BUFFER) is WebGL2 only feature
  assertWebGL2Context(gl);

  // deduce type if not available.
  type = type || (buffer ? buffer.type : GL.UNSIGNED_BYTE);

  if (!buffer) {
    // Create new buffer with enough size
    const components = glFormatToComponents(format);
    const byteCount = glTypeToBytes(type);
    const bytes = byteOffset + (width * height * components * byteCount);
    buffer = new Buffer(gl, {
      bytes,
      type,
      size: components
    });
  }

  buffer.bind({target: GL.PIXEL_PACK_BUFFER});
  withParameters(gl, {framebuffer}, () => {
    gl.readPixels(x, y, width, height, format, type, byteOffset);
  });
  buffer.unbind({target: GL.PIXEL_PACK_BUFFER});

  return buffer;
}

// Reads pixels as a dataUrl
export function copyFramebufferToDataUrl({
  framebuffer,
  attachment = GL.COLOR_ATTACHMENT0, // TODO - support gl.readBuffer
  maxHeight = Number.MAX_SAFE_INTEGER
} = {}) {
  assert(framebuffer);
  let data = copyFramebufferToArray({framebuffer, attachment});

  // Scale down
  let {width, height} = framebuffer;
  while (height > maxHeight) {
    ({data, width, height} = scalePixels({data, width, height}));
  }

  // Flip to top down coordinate system
  flipRows({data, width, height});

  /* global document */
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  // Copy the pixels to a 2D canvas
  const imageData = context.createImageData(width, height);
  imageData.data.set(data);
  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}

// Reads pixels into an HTML Image
export function copyFramebufferToImage({
  framebuffer,
  image = null,
  attachment = GL.COLOR_ATTACHMENT0, // TODO - support gl.readBuffer
  maxHeight = Number.MAX_SAFE_INTEGER
} = {}) {
  assert(framebuffer);
  /* global Image */
  const dataUrl = copyFramebufferToDataUrl({framebuffer, attachment});
  image = image || new Image();
  image.src = dataUrl;
  return image;
}

// Copy a rectangle from a framebuffer attachment into a texture (at an offset)
// NOTE: assumes texture has enough storage allocated
// eslint-disable-next-line complexity
export function copyFramebufferToTexture({
  // Target
  texture,
  target, // for cubemaps
  xoffset = 0,
  yoffset = 0,
  zoffset = 0,
  mipmapLevel = 0,

  // Source
  framebuffer,
  attachment = GL.COLOR_ATTACHMENT0, // TODO - support gl.readBuffer
  x = 0,
  y = 0,
  width, // defaults to texture width
  height // defaults to texture height
}) {
  assert(framebuffer);
  const {gl, handle} = framebuffer;
  const prevHandle = gl.bindFramebuffer(GL.FRAMEBUFFER, handle);
  // TODO - support gl.readBuffer (WebGL2 only)
  // const prevBuffer = gl.readBuffer(attachment);
  assert(target || texture);
  // target
  if (texture) {
    width = Number.isFinite(width) ? width : texture.width;
    height = Number.isFinite(height) ? height : texture.height;
    texture.bind(0);
  }
  switch (texture.target) {
  case GL.TEXTURE_2D:
  case GL.TEXTURE_CUBE_MAP:
    gl.copyTexSubImage2D(
      target || texture.target,
      mipmapLevel,
      xoffset,
      yoffset,
      x,
      y,
      width,
      height
    );
    break;
  case GL.TEXTURE_2D_ARRAY:
  case GL.TEXTURE_3D:
    gl.copyTexSubImage3D(
      target || texture.target,
      mipmapLevel,
      xoffset,
      yoffset,
      zoffset,
      x,
      y,
      width,
      height
    );
    break;
  default:
  }
  if (texture) {
    texture.unbind();
  }
  gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);
  return texture;
}

// WEBGL2 INTERFACE

// Copies a rectangle of pixels between framebuffers
// eslint-disable-next-line complexity
export function blitFramebuffer({
  srcFramebuffer,
  dstFramebuffer,
  attachment = GL.COLOR_ATTACHMENT0,
  srcX0 = 0, srcY0 = 0, srcX1, srcY1,
  dstX0 = 0, dstY0 = 0, dstX1, dstY1,
  color = true,
  depth = false,
  stencil = false,
  mask = 0,
  filter = GL.NEAREST
}) {
  assert(dstFramebuffer);
  const {gl, handle, width, height, readBuffer} = dstFramebuffer;
  assertWebGL2Context(gl);

  if (!srcFramebuffer.handle && attachment === GL.COLOR_ATTACHMENT0) {
    attachment = GL.FRONT;
  }

  if (color) {
    mask |= GL.COLOR_BUFFER_BIT;
  }
  if (depth) {
    mask |= GL.DEPTH_BUFFER_BIT;
  }
  if (stencil) {
    mask |= GL.STENCIL_BUFFER_BIT;
  }
  assert(mask);

  srcX1 = srcX1 === undefined ? srcFramebuffer.width : srcX1;
  srcY1 = srcY1 === undefined ? srcFramebuffer.height : srcY1;
  dstX1 = dstX1 === undefined ? width : dstX1;
  dstY1 = dstY1 === undefined ? height : dstY1;

  const prevDrawHandle = gl.bindFramebuffer(GL.DRAW_FRAMEBUFFER, handle);
  const prevReadHandle = gl.bindFramebuffer(GL.READ_FRAMEBUFFER, srcFramebuffer.handle);
  gl.readBuffer(attachment);
  gl.blitFramebuffer(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter);
  gl.readBuffer(readBuffer);
  gl.bindFramebuffer(GL.READ_FRAMEBUFFER, prevReadHandle || null);
  gl.bindFramebuffer(GL.DRAW_FRAMEBUFFER, prevDrawHandle || null);

  return dstFramebuffer;
}
