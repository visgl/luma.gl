
import GL from '@luma.gl/constants';
import Buffer from './buffer';
import Framebuffer from '../webgl/framebuffer';
import {assert, log} from '../utils';
import {getTypedArrayFromGLType, getGLTypeFromTypedArray} from '../webgl-utils/typed-array-utils';
import {glFormatToComponents, glTypeToBytes} from '../webgl-utils/format-utils';
import {withParameters} from '../webgl-context';
import {assertWebGL2Context} from '../webgl-utils';
import {flipRows, scalePixels} from '../webgl-utils';
import {toFramebuffer} from '../webgl-utils/texture-utils';

// NOTE: Slow requires roundtrip to GPU
// Copies data from a Framebuffer or a Texture object into ArrayBuffer object.
// App can provide targetPixelArray or have it auto allocated by this method
// @returns {Uint8Array|Uint16Array|FloatArray} - pixel array,
//  newly allocated by this method unless provided by app.
export function copyToArray({
  // Source
  source,
  x = 0,
  y = 0,
  width,
  height,
  format = GL.RGBA,
  type, // Auto deduced from source or targetPixelArray if not provided
  attachment = GL.COLOR_ATTACHMENT0, // TODO - support gl.readBuffer

  // Target
  targetPixelArray = null,
  pixelArray // deprecated
} = {}) {
  const {framebuffer, deleteFramebuffer} = getFramebuffer(source);
  if (pixelArray) {
    log.deprecated('pixelArray', 'targetPixelArray')();
    targetPixelArray = pixelArray;
  }
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
  targetPixelArray = getPixelArray(targetPixelArray, type, format, width, height);

  // Pixel array available, if necessary, deduce type from it.
  type = type || getGLTypeFromTypedArray(targetPixelArray);

  const prevHandle = gl.bindFramebuffer(GL.FRAMEBUFFER, handle);
  gl.readPixels(x, y, width, height, format, type, targetPixelArray);
  gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);
  if (deleteFramebuffer) { framebuffer.delete(); }
  return targetPixelArray;
}

// NOTE: doesn't wait for copy to be complete, it programs GPU to perform a DMA transffer.
// Copies data from a Framebuffer or a Texture object into a Buffer object.
export function copyToBuffer({
  source,
  x = 0,
  y = 0,
  width ,
  height,
  format = GL.RGBA,
  type, // When not provided, auto deduced from buffer or GL.UNSIGNED_BYTE
  buffer = null, // A new Buffer object is created when not provided.
  byteOffset = 0 // byte offset in buffer object
}) {
  const {framebuffer, deleteFramebuffer} = getFramebuffer(source);
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
  if (deleteFramebuffer) { framebuffer.delete(); }

  return buffer;
}

// Copy a rectangle from a Framebuffer or Texture object into a texture (at an offset)
// eslint-disable-next-line complexity, max-statements
export function copyToTexture({
  // Source
  source,
  x = 0,
  y = 0,
  // attachment = GL.COLOR_ATTACHMENT0, // TODO - support gl.readBuffer

  // Target
  texture,
  target, // for cubemaps
  xoffset,
  yoffset,
  zoffset,
  width, // defaults to texture width
  height, // defaults to texture height
  level = 0,
  internalFormat = GL.RGBA,
  border = 0,

  mipmapLevel // deprecated
}) {
  const {framebuffer, deleteFramebuffer} = getFramebuffer(source);
  assert(framebuffer);
  const {gl, handle} = framebuffer;
  const isSubCopy = (typeof xoffset !== 'undefined' || typeof yoffset !== 'undefined' || typeof zoffset !== 'undefined');
  xoffset = xoffset || 0;
  yoffset = yoffset || 0;
  zoffset = zoffset || 0;
  if (mipmapLevel) {
    log.deprecated('mipmapLevel', 'level')();
    level = mipmapLevel;
  }
  const prevHandle = gl.bindFramebuffer(GL.FRAMEBUFFER, handle);
  // TODO - support gl.readBuffer (WebGL2 only)
  // const prevBuffer = gl.readBuffer(attachment);
  assert(target || texture);
  target = target || texture.target;
  if (texture) {
    width = Number.isFinite(width) ? width : texture.width;
    height = Number.isFinite(height) ? height : texture.height;
    texture.bind(0);
  }

  if (!isSubCopy) {
    gl.copyTexImage2D(
      target || texture.target, level, internalFormat, x, y, width, height, border);
  } else {
    switch (target) {
    case GL.TEXTURE_2D:
    case GL.TEXTURE_CUBE_MAP:
      gl.copyTexSubImage2D(
        target || texture.target,
        level,
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
        level,
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
  }
  if (texture) {
    texture.unbind();
  }
  gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);
  if (deleteFramebuffer) { framebuffer.delete(); }
  return texture;
}

// Reads pixels from a Framebuffer or Texture object to a dataUrl
export function copyToDataUrl({
  source,
  attachment = GL.COLOR_ATTACHMENT0, // TODO - support gl.readBuffer
  maxHeight = Number.MAX_SAFE_INTEGER
} = {}) {
  const {framebuffer, deleteFramebuffer} = getFramebuffer(source);
  assert(framebuffer);
  let data = copyToArray({framebuffer, attachment});

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
  if (deleteFramebuffer) { framebuffer.delete(); }

  return canvas.toDataURL();
}

// Reads pixels from a Framebuffer or Texture object into an HTML Image
export function copyToImage({
  // Source
  source,
  attachment = GL.COLOR_ATTACHMENT0, // TODO - support gl.readBuffer

  // Target
  targetImage = null,
  image, // deprecated
} = {}) {
  if (image) {
    log.deprecated('image', 'targetImage')();
    targetImage = image;
  }
  const {framebuffer, deleteFramebuffer} = getFramebuffer(source);
  assert(framebuffer);
  /* global Image */
  const dataUrl = copyToDataUrl({framebuffer, attachment});
  targetImage = targetImage || new Image();
  targetImage.src = dataUrl;
  if (deleteFramebuffer) { framebuffer.delete(); }
  return targetImage;
}

// NOTE: WEBLG2 only
// Copies a rectangle of pixels between Framebuffer or Texture objects
// eslint-disable-next-line max-statements, complexity
export function blit({
  source,
  destination,
  attachment = GL.COLOR_ATTACHMENT0,
  srcX0 = 0, srcY0 = 0, srcX1, srcY1,
  dstX0 = 0, dstY0 = 0, dstX1, dstY1,
  color = true,
  depth = false,
  stencil = false,
  mask = 0,
  filter = GL.NEAREST
}) {
  const {framebuffer: srcFramebuffer, deleteFramebuffer: deleteSrcFramebuffer} = getFramebuffer(source);
  const {framebuffer: dstFramebuffer, deleteFramebuffer: deleteDstFramebuffer} = getFramebuffer(destination);

  assert(srcFramebuffer);
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

  if (deleteSrcFramebuffer || deleteDstFramebuffer) {
    // Either source or destiantion was a texture object, which is wrapped in a Framebuffer objecgt as color attachment.
    // Overwrite the mask to `COLOR_BUFFER_BIT`
    if (mask & (GL.DEPTH_BUFFER_BIT | GL.STENCIL_BUFFER_BIT)) {
      mask = GL.COLOR_BUFFER_BIT;
      log.warn('Blitting from or into a Texture object, forcing mask to GL.COLOR_BUFFER_BIT')();
    }
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
  if (deleteSrcFramebuffer) { srcFramebuffer.delete(); }
  if (deleteDstFramebuffer) { dstFramebuffer.delete(); }

  return dstFramebuffer;
}

// Helper methods

function getFramebuffer(source) {
  if (!(source instanceof Framebuffer)) {
    return {framebuffer: toFramebuffer(source), deleteFramebuffer: true};
  }
  return {framebuffer: source, deleteFramebuffer: false};
}

function getPixelArray(pixelArray, type, format, width, height) {
  if (pixelArray) {
    return pixelArray;
  }
  // Allocate pixel array if not already available, using supplied type
  type = type || GL.UNSIGNED_BYTE;
  const ArrayType = getTypedArrayFromGLType(type, {clamped: false});
  const components = glFormatToComponents(format);
  // TODO - check for composite type (components = 1).
  return new ArrayType(width * height * components);
}
