import GL from '@luma.gl/constants';
import Buffer from './buffer';
import Framebuffer from './framebuffer';
import Texture from './texture';
import {assertWebGL2Context, withParameters, log} from '@luma.gl/gltools';
import {flipRows, scalePixels} from '../webgl-utils/typed-array-utils';
import {getTypedArrayFromGLType, getGLTypeFromTypedArray} from '../webgl-utils/typed-array-utils';
import {glFormatToComponents, glTypeToBytes} from '../webgl-utils/format-utils';
import {toFramebuffer} from '../webgl-utils/texture-utils';
import {assert} from '../utils/assert';

// NOTE: Slow requires roundtrip to GPU
// Copies data from a Framebuffer or a Texture object into ArrayBuffer object.
// App can provide targetPixelArray or have it auto allocated by this method
// @returns {Uint8Array|Uint16Array|FloatArray} - pixel array,
//  newly allocated by this method unless provided by app.
export function readPixelsToArray(source, options = {}) {
  const {sourceX = 0, sourceY = 0, sourceFormat = GL.RGBA} = options;
  let {
    sourceAttachment = GL.COLOR_ATTACHMENT0, // TODO - support gl.readBuffer
    target = null,
    // following parameters are auto deduced if not provided
    sourceWidth,
    sourceHeight,
    sourceType
  } = options;

  const {framebuffer, deleteFramebuffer} = getFramebuffer(source);
  assert(framebuffer);
  const {gl, handle, attachments} = framebuffer;
  sourceWidth = sourceWidth || framebuffer.width;
  sourceHeight = sourceHeight || framebuffer.height;

  // TODO - Set and unset gl.readBuffer
  if (sourceAttachment === GL.COLOR_ATTACHMENT0 && handle === null) {
    sourceAttachment = GL.FRONT;
  }

  assert(attachments[sourceAttachment]);

  // Deduce the type from color attachment if not provided.
  sourceType = sourceType || attachments[sourceAttachment].type;

  // Deduce type and allocated pixelArray if needed
  target = getPixelArray(target, sourceType, sourceFormat, sourceWidth, sourceHeight);

  // Pixel array available, if necessary, deduce type from it.
  sourceType = sourceType || getGLTypeFromTypedArray(target);

  const prevHandle = gl.bindFramebuffer(GL.FRAMEBUFFER, handle);
  gl.readPixels(sourceX, sourceY, sourceWidth, sourceHeight, sourceFormat, sourceType, target);
  // @ts-ignore
  gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);
  if (deleteFramebuffer) {
    framebuffer.delete();
  }
  return target;
}

// NOTE: doesn't wait for copy to be complete, it programs GPU to perform a DMA transffer.
// Copies data from a Framebuffer or a Texture object into a Buffer object.
export function readPixelsToBuffer(
  source,
  {
    sourceX = 0,
    sourceY = 0,
    sourceFormat = GL.RGBA,
    target = null, // A new Buffer object is created when not provided.
    targetByteOffset = 0, // byte offset in buffer object
    // following parameters are auto deduced if not provided
    sourceWidth,
    sourceHeight,
    sourceType
  }
) {
  const {framebuffer, deleteFramebuffer} = getFramebuffer(source);
  assert(framebuffer);
  sourceWidth = sourceWidth || framebuffer.width;
  sourceHeight = sourceHeight || framebuffer.height;

  // Asynchronus read (PIXEL_PACK_BUFFER) is WebGL2 only feature
  const gl2 = assertWebGL2Context(framebuffer.gl);

  // deduce type if not available.
  sourceType = sourceType || (target ? target.type : GL.UNSIGNED_BYTE);

  if (!target) {
    // Create new buffer with enough size
    const components = glFormatToComponents(sourceFormat);
    const byteCount = glTypeToBytes(sourceType);
    const byteLength = targetByteOffset + sourceWidth * sourceHeight * components * byteCount;
    target = new Buffer(gl2, {byteLength, accessor: {type: sourceType, size: components}});
  }

  target.bind({target: GL.PIXEL_PACK_BUFFER});
  withParameters(gl2, {framebuffer}, () => {
    gl2.readPixels(
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      sourceFormat,
      sourceType,
      targetByteOffset
    );
  });
  target.unbind({target: GL.PIXEL_PACK_BUFFER});
  if (deleteFramebuffer) {
    framebuffer.delete();
  }

  return target;
}

// Reads pixels from a Framebuffer or Texture object to a dataUrl
export function copyToDataUrl(
  source,
  {
    sourceAttachment = GL.COLOR_ATTACHMENT0, // TODO - support gl.readBuffer
    targetMaxHeight = Number.MAX_SAFE_INTEGER
  } = {}
) {
  let data = readPixelsToArray(source, {sourceAttachment});

  // Scale down
  let {width, height} = source;
  while (height > targetMaxHeight) {
    ({data, width, height} = scalePixels({data, width, height}));
  }

  // Flip to top down coordinate system
  flipRows({data, width, height});

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

// Reads pixels from a Framebuffer or Texture object into an HTML Image
export function copyToImage(
  source,
  {
    sourceAttachment = GL.COLOR_ATTACHMENT0, // TODO - support gl.readBuffer
    targetImage = null
  } = {}
) {
  const dataUrl = copyToDataUrl(source, {sourceAttachment});
  targetImage = targetImage || new Image();
  targetImage.src = dataUrl;
  return targetImage;
}

// Copy a rectangle from a Framebuffer or Texture object into a texture (at an offset)
// eslint-disable-next-line complexity, max-statements
export function copyToTexture(source, target, options = {}) {
  const {
    sourceX = 0,
    sourceY = 0,
    // attachment = GL.COLOR_ATTACHMENT0, // TODO - support gl.readBuffer
    targetMipmaplevel = 0,
    targetInternalFormat = GL.RGBA
  } = options;
  let {
    targetX,
    targetY,
    targetZ,
    width, // defaults to target width
    height // defaults to target height
  } = options;

  const {framebuffer, deleteFramebuffer} = getFramebuffer(source);
  assert(framebuffer);
  const {gl, handle} = framebuffer;
  const isSubCopy =
    typeof targetX !== 'undefined' ||
    typeof targetY !== 'undefined' ||
    typeof targetZ !== 'undefined';
  targetX = targetX || 0;
  targetY = targetY || 0;
  targetZ = targetZ || 0;
  const prevHandle = gl.bindFramebuffer(GL.FRAMEBUFFER, handle);
  // TODO - support gl.readBuffer (WebGL2 only)
  // const prevBuffer = gl.readBuffer(attachment);
  assert(target);
  let texture = null;
  if (target instanceof Texture) {
    texture = target;
    width = Number.isFinite(width) ? width : texture.width;
    height = Number.isFinite(height) ? height : texture.height;
    texture.bind(0);
    target = texture.target;
  }

  if (!isSubCopy) {
    gl.copyTexImage2D(
      target,
      targetMipmaplevel,
      targetInternalFormat,
      sourceX,
      sourceY,
      width,
      height,
      0 /* border must be 0 */
    );
  } else {
    switch (target) {
      case GL.TEXTURE_2D:
      case GL.TEXTURE_CUBE_MAP:
        gl.copyTexSubImage2D(
          target,
          targetMipmaplevel,
          targetX,
          targetY,
          sourceX,
          sourceY,
          width,
          height
        );
        break;
      case GL.TEXTURE_2D_ARRAY:
      case GL.TEXTURE_3D:
        const gl2 = assertWebGL2Context(gl);
        gl2.copyTexSubImage3D(
          target,
          targetMipmaplevel,
          targetX,
          targetY,
          targetZ,
          sourceX,
          sourceY,
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
  // @ts-ignore
  gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);
  if (deleteFramebuffer) {
    framebuffer.delete();
  }
  return texture;
}

// NOTE: WEBLG2 only
// Copies a rectangle of pixels between Framebuffer or Texture objects
// eslint-disable-next-line max-statements, complexity
export function blit(source, target, options = {}) {
  const {
    sourceX0 = 0,
    sourceY0 = 0,
    targetX0 = 0,
    targetY0 = 0,
    color = true,
    depth = false,
    stencil = false,
    filter = GL.NEAREST
  } = options;

  let {
    sourceX1,
    sourceY1,
    targetX1,
    targetY1,
    sourceAttachment = GL.COLOR_ATTACHMENT0,
    mask = 0
  } = options;

  const {framebuffer: srcFramebuffer, deleteFramebuffer: deleteSrcFramebuffer} = getFramebuffer(
    source
  );
  const {framebuffer: dstFramebuffer, deleteFramebuffer: deleteDstFramebuffer} = getFramebuffer(
    target
  );

  assert(srcFramebuffer);
  assert(dstFramebuffer);
  // @ts-ignore
  const {gl, handle, width, height, readBuffer} = dstFramebuffer;
  const gl2 = assertWebGL2Context(gl);

  if (!srcFramebuffer.handle && sourceAttachment === GL.COLOR_ATTACHMENT0) {
    sourceAttachment = GL.FRONT;
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

  sourceX1 = sourceX1 === undefined ? srcFramebuffer.width : sourceX1;
  sourceY1 = sourceY1 === undefined ? srcFramebuffer.height : sourceY1;
  targetX1 = targetX1 === undefined ? width : targetX1;
  targetY1 = targetY1 === undefined ? height : targetY1;

  const prevDrawHandle = gl.bindFramebuffer(GL.DRAW_FRAMEBUFFER, handle);
  const prevReadHandle = gl.bindFramebuffer(GL.READ_FRAMEBUFFER, srcFramebuffer.handle);
  gl2.readBuffer(sourceAttachment);
  gl2.blitFramebuffer(
    sourceX0,
    sourceY0,
    sourceX1,
    sourceY1,
    targetX0,
    targetY0,
    targetX1,
    targetY1,
    mask,
    filter
  );
  gl2.readBuffer(readBuffer);
  // @ts-ignore
  gl2.bindFramebuffer(GL.READ_FRAMEBUFFER, prevReadHandle || null);
  // @ts-ignore
  gl2.bindFramebuffer(GL.DRAW_FRAMEBUFFER, prevDrawHandle || null);
  if (deleteSrcFramebuffer) {
    srcFramebuffer.delete();
  }
  if (deleteDstFramebuffer) {
    dstFramebuffer.delete();
  }

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
