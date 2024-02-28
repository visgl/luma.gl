// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {assert, Buffer, Texture, Framebuffer, FramebufferProps} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';

import {WEBGLTextureView} from '../adapter/resources/webgl-texture-view';
import {WEBGLFramebuffer} from '../adapter/resources/webgl-framebuffer';
import {getGLTypeFromTypedArray, getTypedArrayFromGLType} from './typed-array-utils';
import {glFormatToComponents, glTypeToBytes} from './format-utils';
import {WEBGLBuffer} from '../adapter/resources/webgl-buffer';

/**
 * Copies data from a type  or a Texture object into ArrayBuffer object.
 * App can provide targetPixelArray or have it auto allocated by this method
 *  newly allocated by this method unless provided by app.
 * @deprecated Use CommandEncoder.copyTextureToBuffer and Buffer.read
 * @note Slow requires roundtrip to GPU
 *
 * @param source
 * @param options
 * @returns pixel array,
 */
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
): Uint8Array | Uint16Array | Float32Array {
  const {
    sourceX = 0,
    sourceY = 0,
    sourceFormat = GL.RGBA,
    sourceAttachment = GL.COLOR_ATTACHMENT0 // TODO - support gl.readBuffer
  } = options || {};
  let {
    target = null,
    // following parameters are auto deduced if not provided
    sourceWidth,
    sourceHeight,
    sourceType
  } = options || {};

  const {framebuffer, deleteFramebuffer} = getFramebuffer(source);
  assert(framebuffer);
  const {gl, handle} = framebuffer as WEBGLFramebuffer;
  sourceWidth = sourceWidth || framebuffer.width;
  sourceHeight = sourceHeight || framebuffer.height;

  // TODO - Set and unset gl.readBuffer
  // if (sourceAttachment === GL.COLOR_ATTACHMENT0 && handle === null) {
  //   sourceAttachment = GL.FRONT;
  // }

  const attachment = sourceAttachment - GL.COLOR_ATTACHMENT0;
  // assert(attachments[sourceAttachment]);

  // Deduce the type from color attachment if not provided.
  sourceType =
    sourceType ||
    (framebuffer.colorAttachments[attachment] as WEBGLTextureView)?.texture?.type ||
    GL.UNSIGNED_BYTE;

  // Deduce type and allocated pixelArray if needed
  target = getPixelArray(target, sourceType, sourceFormat, sourceWidth, sourceHeight);

  // Pixel array available, if necessary, deduce type from it.
  sourceType = sourceType || getGLTypeFromTypedArray(target);

  const prevHandle = gl.bindFramebuffer(GL.FRAMEBUFFER, handle);
  gl.readPixels(sourceX, sourceY, sourceWidth, sourceHeight, sourceFormat, sourceType, target);
  // @ts-expect-error
  gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);
  if (deleteFramebuffer) {
    framebuffer.destroy();
  }
  return target;
}

/**
 * Copies data from a Framebuffer or a Texture object into a Buffer object.
 * NOTE: doesn't wait for copy to be complete, it programs GPU to perform a DMA transffer.
 * @deprecated Use CommandEncoder
 * @param source
 * @param options
 */
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
): WEBGLBuffer {
  const {
    target,
    sourceX = 0,
    sourceY = 0,
    sourceFormat = GL.RGBA,
    targetByteOffset = 0
  } = options || {};
  // following parameters are auto deduced if not provided
  let {sourceWidth, sourceHeight, sourceType} = options || {};
  const {framebuffer, deleteFramebuffer} = getFramebuffer(source);
  assert(framebuffer);
  sourceWidth = sourceWidth || framebuffer.width;
  sourceHeight = sourceHeight || framebuffer.height;

  // Asynchronous read (PIXEL_PACK_BUFFER) is WebGL2 only feature
  const webglFramebuffer = framebuffer as WEBGLFramebuffer;

  // deduce type if not available.
  sourceType = sourceType || GL.UNSIGNED_BYTE;

  let webglBufferTarget = target as unknown as WEBGLBuffer | undefined;
  if (!webglBufferTarget) {
    // Create new buffer with enough size
    const components = glFormatToComponents(sourceFormat);
    const byteCount = glTypeToBytes(sourceType);
    const byteLength = targetByteOffset + sourceWidth * sourceHeight * components * byteCount;
    webglBufferTarget = webglFramebuffer.device.createBuffer({byteLength});
  }

  // TODO(donmccurdy): Do we have tests to confirm this is working?
  const commandEncoder = source.device.createCommandEncoder();
  commandEncoder.copyTextureToBuffer({
    source: source as Texture,
    width: sourceWidth,
    height: sourceHeight,
    origin: [sourceX, sourceY],
    destination: webglBufferTarget,
    byteOffset: targetByteOffset
  });
  commandEncoder.destroy();

  if (deleteFramebuffer) {
    framebuffer.destroy();
  }

  return webglBufferTarget;
}

/**
 * Copy a rectangle from a Framebuffer or Texture object into a texture (at an offset)
 * @deprecated Use CommandEncoder
 */
// eslint-disable-next-line complexity, max-statements
export function copyToTexture(
  source: Framebuffer | Texture,
  target: Texture | GL,
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
): Texture {
  const {
    sourceX = 0,
    sourceY = 0,
    // attachment = GL.COLOR_ATTACHMENT0, // TODO - support gl.readBuffer
    targetMipmaplevel = 0,
    targetInternalFormat = GL.RGBA
  } = options || {};
  let {
    targetX,
    targetY,
    targetZ,
    width, // defaults to target width
    height // defaults to target height
  } = options || {};

  const {framebuffer, deleteFramebuffer} = getFramebuffer(source);
  assert(framebuffer);
  const webglFramebuffer = framebuffer as WEBGLFramebuffer;
  const {device, handle} = webglFramebuffer;
  const isSubCopy =
    typeof targetX !== 'undefined' ||
    typeof targetY !== 'undefined' ||
    typeof targetZ !== 'undefined';
  targetX = targetX || 0;
  targetY = targetY || 0;
  targetZ = targetZ || 0;
  const prevHandle = device.gl.bindFramebuffer(GL.FRAMEBUFFER, handle);
  // TODO - support gl.readBuffer (WebGL2 only)
  // const prevBuffer = gl.readBuffer(attachment);
  assert(target);
  let texture = null;
  let textureTarget: GL;
  if (target instanceof Texture) {
    texture = target;
    width = Number.isFinite(width) ? width : texture.width;
    height = Number.isFinite(height) ? height : texture.height;
    texture.bind(0);
    textureTarget = texture.target;
  } else {
    textureTarget = target;
  }

  if (!isSubCopy) {
    device.gl.copyTexImage2D(
      textureTarget,
      targetMipmaplevel,
      targetInternalFormat,
      sourceX,
      sourceY,
      width,
      height,
      0 /* border must be 0 */
    );
  } else {
    switch (textureTarget) {
      case GL.TEXTURE_2D:
      case GL.TEXTURE_CUBE_MAP:
        device.gl.copyTexSubImage2D(
          textureTarget,
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
        device.gl.copyTexSubImage3D(
          textureTarget,
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
  // @ts-expect-error
  device.gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);
  if (deleteFramebuffer) {
    framebuffer.destroy();
  }
  return texture;
}

function getFramebuffer(source: Texture | Framebuffer): {
  framebuffer: Framebuffer;
  deleteFramebuffer: boolean;
} {
  if (!(source instanceof Framebuffer)) {
    return {framebuffer: toFramebuffer(source), deleteFramebuffer: true};
  }
  return {framebuffer: source, deleteFramebuffer: false};
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
    colorAttachments: [texture]
  });
  return framebuffer;
}

function getPixelArray(
  pixelArray,
  type,
  format,
  width: number,
  height: number
): Uint8Array | Uint16Array | Float32Array {
  if (pixelArray) {
    return pixelArray;
  }
  // Allocate pixel array if not already available, using supplied type
  type = type || GL.UNSIGNED_BYTE;
  const ArrayType = getTypedArrayFromGLType(type, {clamped: false});
  const components = glFormatToComponents(format);
  // TODO - check for composite type (components = 1).
  return new ArrayType(width * height * components) as Uint8Array | Uint16Array | Float32Array;
}
