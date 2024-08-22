// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

//
// WebGL... the texture API from hell... hopefully made simpler
//

import {TypedArray} from '@math.gl/types';
import type {ExternalImage} from '@luma.gl/core';
import {Buffer, Texture, Framebuffer, FramebufferProps} from '@luma.gl/core';
import {
  GL,
  GLTextureTarget,
  GLTextureCubeMapTarget,
  GLTexelDataFormat,
  GLPixelType,
  GLDataType
} from '@luma.gl/constants';

import {WEBGLFramebuffer} from '../resources/webgl-framebuffer';
import {getGLTypeFromTypedArray, getTypedArrayFromGLType} from './typed-array-utils';
import {glFormatToComponents, glTypeToBytes} from './format-utils';
import {WEBGLBuffer} from '../resources/webgl-buffer';
import {WEBGLTexture} from '../resources/webgl-texture';
import {withGLParameters} from '../../context/state-tracker/with-parameters';

/** A "border" parameter is required in many WebGL texture APIs, but must always be 0... */
const BORDER = 0;

/**
 * Options for setting data into a texture
 */
export type WebGLSetTextureOptions = {
  dimension: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  height: number;
  width: number;
  depth: number;
  mipLevel?: number;
  glTarget: GLTextureTarget;
  glInternalFormat: GL;
  glFormat: GLTexelDataFormat;
  glType: GLPixelType;
  compressed?: boolean;
  byteOffset?: number;
  byteLength?: number;
};

/**
 * Options for copying an image or data into a texture
 *
 * @param {GLenum} format - internal format of image data.
 * @param {GLenum} type
 *  - format of array (autodetect from type) or
 *  - (WEBGL2) format of buffer or ArrayBufferView
 * @param {GLenum} dataFormat - format of image data.
 * @param {Number} offset - (WEBGL2) offset from start of buffer
 * @parameters - temporary settings to be applied, can be used to supply pixel store settings.
 */
export type WebGLCopyTextureOptions = {
  dimension: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  /** mip level to be updated */
  mipLevel?: number;
  /** width of the sub image to be updated */
  width: number;
  /** height of the sub image to be updated */
  height: number;
  /** depth of texture to be updated */
  depth?: number;
  /** xOffset from where texture to be updated */
  x?: number;
  /** yOffset from where texture to be updated */
  y?: number;
  /** yOffset from where texture to be updated */
  z?: number;

  glTarget: GLTextureTarget;
  glInternalFormat: GL;
  glFormat: GL;
  glType: GL;
  compressed?: boolean;
  byteOffset?: number;
  byteLength?: number;
};

/**
 * Initializes a texture memory space
 * Clear all the textures and mip levels of a two-dimensional or array texture at the same time.
 * On some implementations faster than repeatedly setting levels
 *
 * @note From WebGL 2 spec section 3.7.6:
 * @see https://registry.khronos.org/webgl/specs/latest/2.0/
 * - The image contents are set as if a buffer of sufficient size initialized to 0 would be passed to each level's texImage2D/3D
 * - texStorage2D should be considered a preferred alternative to texImage2D. It may have lower memory costs than texImage2D in some implementations.
 * - Once texStorage*D has been called, the texture is immutable and can only be updated with texSubImage*(), not texImage()
 */
export function initializeTextureStorage(
  gl: WebGL2RenderingContext,
  levels: number,
  options: WebGLSetTextureOptions
): void {
  const {dimension, width, height, depth = 0} = options;
  const {glInternalFormat} = options;
  const glTarget = options.glTarget; // getWebGLCubeFaceTarget(options.glTarget, dimension, depth);
  switch (dimension) {
    case '2d-array':
    case '3d':
      gl.texStorage3D(glTarget, levels, glInternalFormat, width, height, depth);
      break;

    default:
      gl.texStorage2D(glTarget, levels, glInternalFormat, width, height);
  }
}

/**
 * Copy a region of compressed data from a GPU memory buffer into this texture.
 */
export function copyExternalImageToMipLevel(
  gl: WebGL2RenderingContext,
  handle: WebGLTexture,
  image: ExternalImage,
  options: WebGLCopyTextureOptions & {flipY?: boolean}
): void {
  const {width, height} = options;
  const {dimension, depth = 0, mipLevel = 0} = options;
  const {x = 0, y = 0, z = 0} = options;
  const {glFormat, glType} = options;

  const glTarget = getWebGLCubeFaceTarget(options.glTarget, dimension, depth);

  const glParameters = options.flipY ? {[GL.UNPACK_FLIP_Y_WEBGL]: true} : {};
  withGLParameters(gl, glParameters, () => {
    switch (dimension) {
      case '2d-array':
      case '3d':
        gl.bindTexture(glTarget, handle);
        // prettier-ignore
        gl.texSubImage3D(glTarget, mipLevel, x, y, z, width, height, depth, glFormat, glType, image);
        gl.bindTexture(glTarget, null);
        break;

      case '2d':
      case 'cube':
        gl.bindTexture(glTarget, handle);
        // prettier-ignore
        gl.texSubImage2D(glTarget, mipLevel, x, y, width, height, glFormat, glType, image);
        gl.bindTexture(glTarget, null);
        break;

      default:
        throw new Error(dimension);
    }
  });
}

/**
 * Copy a region of data from a CPU memory buffer into this texture.
 */
export function copyCPUDataToMipLevel(
  gl: WebGL2RenderingContext,
  typedArray: TypedArray,
  options: WebGLCopyTextureOptions
): void {
  const {dimension, width, height, depth = 0, mipLevel = 0, byteOffset = 0} = options;
  const {x = 0, y = 0, z = 0} = options;
  const {glFormat, glType, compressed} = options;
  const glTarget = getWebGLCubeFaceTarget(options.glTarget, dimension, depth);

  // gl.bindTexture(glTarget, null);

  switch (dimension) {
    case '2d-array':
    case '3d':
      if (compressed) {
        // prettier-ignore
        gl.compressedTexSubImage3D(glTarget, mipLevel, x, y, z, width, height, depth, glFormat, typedArray, byteOffset); // , byteLength
      } else {
        // prettier-ignore
        gl.texSubImage3D(glTarget, mipLevel, x, y, z, width, height, depth, glFormat, glType, typedArray, byteOffset); // , byteLength
      }
      break;

    case '2d':
    case 'cube':
      if (compressed) {
        // prettier-ignore
        gl.compressedTexSubImage2D(glTarget, mipLevel, x, y, width, height, glFormat, typedArray, byteOffset); // , byteLength
      } else {
        // prettier-ignore
        gl.texSubImage2D(glTarget, mipLevel, x, y, width, height, glFormat, glType, typedArray, byteOffset); // , byteLength
      }
      break;

    default:
      throw new Error(dimension);
  }
}

/**
 * Copy a region of compressed data from a GPU memory buffer into this texture.
 */
export function copyGPUBufferToMipLevel(
  gl: WebGL2RenderingContext,
  webglBuffer: WebGLBuffer,
  byteLength: number,
  options: WebGLCopyTextureOptions
): void {
  const {dimension, width, height, depth = 0, mipLevel = 0, byteOffset = 0} = options;
  const {x = 0, y = 0, z = 0} = options;
  const {glFormat, glType, compressed} = options;
  const glTarget = getWebGLCubeFaceTarget(options.glTarget, dimension, depth);

  gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, webglBuffer);

  switch (dimension) {
    case '2d-array':
    case '3d':
      // 3 dimensional textures requires 3D texture functions
      if (compressed) {
        // TODO enable extension?
        // prettier-ignore
        gl.compressedTexSubImage3D(glTarget, mipLevel, x, y, z, width, height, depth, glFormat, byteLength, byteOffset);
      } else {
        // prettier-ignore
        gl.texSubImage3D(glTarget, mipLevel, x, y, z, width, height, depth, glFormat, glType, byteOffset);
      }
      break;

    case '2d':
    case 'cube':
      if (compressed) {
        // prettier-ignore
        gl.compressedTexSubImage2D(glTarget, mipLevel, x, y, width, height, glFormat, byteLength, byteOffset);
      } else {
        // prettier-ignore
        gl.texSubImage2D(glTarget, mipLevel, x, y, width, height, BORDER, glFormat, byteOffset);
      }
      break;

    default:
      throw new Error(dimension);
  }
}

// INTERNAL HELPERS

/** Convert a WebGPU style texture constant to a WebGL style texture constant */
export function getWebGLTextureTarget(
  dimension: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d'
): GLTextureTarget {
  // prettier-ignore
  switch (dimension) {
    case '1d': break; // not supported in any WebGL version
    case '2d': return GL.TEXTURE_2D; // supported in WebGL1
    case '3d': return GL.TEXTURE_3D; // supported in WebGL2
    case 'cube': return GL.TEXTURE_CUBE_MAP; // supported in WebGL1
    case '2d-array': return GL.TEXTURE_2D_ARRAY; // supported in WebGL2
    case 'cube-array': break; // not supported in any WebGL version
  }
  throw new Error(dimension);
}

/**
 * In WebGL, cube maps specify faces by overriding target instead of using the depth parameter.
 * @note We still bind the texture using GL.TEXTURE_CUBE_MAP, but we need to use the face-specific target when setting mip levels.
 * @returns glTarget unchanged, if dimension !== 'cube'.
 */
export function getWebGLCubeFaceTarget(
  glTarget: GLTextureTarget,
  dimension: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d',
  level: number
): GLTextureTarget | GLTextureCubeMapTarget {
  return dimension === 'cube' ? GL.TEXTURE_CUBE_MAP_POSITIVE_X + level : glTarget;
}

// texImage methods

/**
 * Clear a texture mip level.
 * Wrapper for the messy WebGL texture API
 *
export function clearMipLevel(gl: WebGL2RenderingContext, options: WebGLSetTextureOptions): void {
  const {dimension, width, height, depth = 0, mipLevel = 0} = options;
  const {glInternalFormat, glFormat, glType, compressed} = options;
  const glTarget = getWebGLCubeFaceTarget(options.glTarget, dimension, depth);

  switch (dimension) {
    case '2d-array':
    case '3d':
      if (compressed) {
        // prettier-ignore
        gl.compressedTexImage3D(glTarget, mipLevel, glInternalFormat, width, height, depth, BORDER, null);
      } else {
        // prettier-ignore
        gl.texImage3D( glTarget, mipLevel, glInternalFormat, width, height, depth, BORDER, glFormat, glType, null);
      }
      break;

    case '2d':
    case 'cube':
      if (compressed) {
        // prettier-ignore
        gl.compressedTexImage2D(glTarget, mipLevel, glInternalFormat, width, height, BORDER, null);
      } else {
        // prettier-ignore
        gl.texImage2D(glTarget, mipLevel, glInternalFormat, width, height, BORDER, glFormat, glType, null);
      }
      break;

    default:
      throw new Error(dimension);
  }
}
  */

/**
 * Set a texture mip level to the contents of an external image.
 * Wrapper for the messy WebGL texture API
 * @note Corresponds to WebGPU device.queue.copyExternalImageToTexture()
 *
export function setMipLevelFromExternalImage(
  gl: WebGL2RenderingContext,
  image: ExternalImage,
  options: WebGLSetTextureOptions
): void {
  const {dimension, width, height, depth = 0, level = 0} = options;
  const {glInternalFormat, glType} = options;

  const glTarget = getWebGLCubeFaceTarget(options.glTarget, dimension, depth);

  // TODO - we can't change texture width (due to WebGPU limitations) -
  // and the width/heigh of an external image is implicit, so why do we need to extract it?
  // So what width height do we supply? The image size or the texture size?
  // const {width, height} = Texture.getExternalImageSize(image);

  switch (dimension) {
    case '2d-array':
    case '3d':
      // prettier-ignore
      gl.texImage3D(glTarget, level, glInternalFormat, width, height, depth, BORDER, glInternalFormat, glType, image);
      break;

    case '2d':
    case 'cube':
      // prettier-ignore
      gl.texImage2D(glTarget, level, glInternalFormat, width, height, BORDER, glInternalFormat, glType, image);
      break;

    default:
      throw new Error(dimension);
  }
}

/**
 * Set a texture mip level from CPU memory
 * Wrapper for the messy WebGL texture API
 * @note Not available (directly) in WebGPU
 *
export function setMipLevelFromTypedArray(
  gl: WebGL2RenderingContext,
  data: TypedArray,
  parameters: {},
  options: {
    dimension: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
    height: number;
    width: number;
    depth?: number;
    level?: number;
    offset?: number;
    glTarget: GLTextureTarget;
    glInternalFormat: GL;
    glFormat: GL;
    glType: GL;
    compressed?: boolean;
  }
): void {
  const {dimension, width, height, depth = 0, level = 0, offset = 0} = options;
  const {glInternalFormat, glFormat, glType, compressed} = options;

  const glTarget = getWebGLCubeFaceTarget(options.glTarget, dimension, depth);

  withGLParameters(gl, parameters, () => {
    switch (dimension) {
      case '2d-array':
      case '3d':
        if (compressed) {
          // prettier-ignore
          gl.compressedTexImage3D(glTarget, level, glInternalFormat, width, height, depth, BORDER, data);
        } else {
          // prettier-ignore
          gl.texImage3D( glTarget, level, glInternalFormat, width, height, depth, BORDER, glFormat, glType, data);
        }
        break;

      case '2d':
        if (compressed) {
          // prettier-ignore
          gl.compressedTexImage2D(glTarget, level, glInternalFormat, width, height, BORDER, data);
        } else {
          // prettier-ignore
          gl.texImage2D( glTarget, level, glInternalFormat, width, height, BORDER, glFormat, glType, data, offset);
        }
        break;

      default:
        throw new Error(dimension);
    }
  });
}

/**
   * Set a texture level from CPU memory
   * @note Not available (directly) in WebGPU
  _setMipLevelFromTypedArray(
    depth: number,
    level: number,
    data: TextureLevelData,
    offset = 0,
    parameters
  ): void {
    withGLParameters(this.gl, parameters, () => {
      switch (this.props.dimension) {
        case '2d-array':
        case '3d':
          if (this.compressed) {
            // prettier-ignore
            this.device.gl.compressedTexImage3D(this.glTarget, level, this.glInternalFormat, data.width, data.height, depth, BORDER, data.data);
          } else {
            // prettier-ignore
            this.gl.texImage3D( this.glTarget, level, this.glInternalFormat, this.width, this.height, depth, BORDER, this.glFormat, this.glType, data.data);
          }
          break;

        case '2d':
          if (this.compressed) {
            // prettier-ignore
            this.device.gl.compressedTexImage2D(this.glTarget, level, this.glInternalFormat, data.width, data.height, BORDER, data.data);
          } else {
            // prettier-ignore
            this.device.gl.texImage2D( this.glTarget, level, this.glInternalFormat, this.width, this.height, BORDER, this.glFormat, this.glType, data.data, offset);
          }
          break;

        default:
          throw new Error(this.props.dimension);
      }
    });
  }

 * Set a texture level from a GPU buffer
 *
export function setMipLevelFromGPUBuffer(
  gl: WebGL2RenderingContext,
  buffer: Buffer,
  options: WebGLSetTextureOptions
): void {
  const {dimension, width, height, depth = 0, level = 0, byteOffset = 0} = options;
  const {glInternalFormat, glFormat, glType, compressed} = options;
  const glTarget = getWebGLCubeFaceTarget(options.glTarget, dimension, depth);

  const webglBuffer = buffer as WEBGLBuffer;
  const imageSize = buffer.byteLength;

  // In WebGL the source buffer is not a parameter. Instead it needs to be bound to a special bind point
  gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, webglBuffer.handle);

  switch (dimension) {
    case '2d-array':
    case '3d':
      if (compressed) {
        // prettier-ignore
        gl.compressedTexImage3D(glTarget, level, glInternalFormat, width, height, depth, BORDER, imageSize, byteOffset);
      } else {
        // prettier-ignore
        gl.texImage3D(glTarget, level, glInternalFormat, width, height, depth, BORDER, glFormat, glType, byteOffset);
      }
      break;

    case '2d':
      if (compressed) {
        // prettier-ignore
        gl.compressedTexImage2D(glTarget, level, glInternalFormat, width, height, BORDER, imageSize, byteOffset);
      } else {
        // prettier-ignore
        gl.texImage2D(glTarget, level, glInternalFormat, width, height, BORDER, glFormat, glType, byteOffset);
      }
      break;

    default:
      throw new Error(dimension);
  }

  gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, null);
}
*/
export type ReadPixelsToArrayOptions = {
  sourceX?: number;
  sourceY?: number;
  sourceFormat?: number;
  sourceAttachment?: number;
  target?: Uint8Array | Uint16Array | Float32Array;
  // following parameters are auto deduced if not provided
  sourceWidth?: number;
  sourceHeight?: number;
  sourceDepth?: number;
  sourceType?: number;
};

export type ReadPixelsToBufferOptions = {
  sourceX?: number;
  sourceY?: number;
  sourceFormat?: number;
  target?: Buffer; // A new Buffer object is created when not provided.
  targetByteOffset?: number; // byte offset in buffer object
  // following parameters are auto deduced if not provided
  sourceWidth?: number;
  sourceHeight?: number;
  sourceType?: number;
};

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
  options?: ReadPixelsToArrayOptions
): Uint8Array | Uint16Array | Float32Array {
  const {
    sourceX = 0,
    sourceY = 0,
    sourceAttachment = 0 // TODO - support gl.readBuffer
  } = options || {};
  let {
    target = null,
    // following parameters are auto deduced if not provided
    sourceWidth,
    sourceHeight,
    sourceDepth,
    sourceFormat,
    sourceType
  } = options || {};

  const {framebuffer, deleteFramebuffer} = getFramebuffer(source);
  // assert(framebuffer);
  const {gl, handle} = framebuffer;

  sourceWidth ||= framebuffer.width;
  sourceHeight ||= framebuffer.height;

  const texture = framebuffer.colorAttachments[sourceAttachment]?.texture;
  if (!texture) {
    throw new Error(`Invalid framebuffer attachment ${sourceAttachment}`);
  }
  sourceDepth = texture?.depth || 1;

  sourceFormat ||= texture?.glFormat || GL.RGBA;
  // Deduce the type from color attachment if not provided.
  sourceType ||= texture?.glType || GL.UNSIGNED_BYTE;

  // Deduce type and allocated pixelArray if needed
  target = getPixelArray(target, sourceType, sourceFormat, sourceWidth, sourceHeight, sourceDepth);

  // Pixel array available, if necessary, deduce type from it.
  sourceType = sourceType || getGLTypeFromTypedArray(target);

  // Note: luma.gl overrides bindFramebuffer so that we can reliably restore the previous framebuffer (this is the only function for which we do that)
  const prevHandle = gl.bindFramebuffer(
    GL.FRAMEBUFFER,
    handle
  ) as unknown as WebGLFramebuffer | null;

  // Select the color attachment to read from
  gl.readBuffer(gl.COLOR_ATTACHMENT0 + sourceAttachment);

  // There is a lot of hedging in the WebGL2 spec about what formats are guaranteed to be readable
  // (It should always be possible to read RGBA/UNSIGNED_BYTE, but most other combinations are not guaranteed)
  // Querying is possible but expensive:
  // const {device} = framebuffer;
  // texture.glReadFormat ||= gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
  // texture.glReadType ||= gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
  // console.log('params', device.getGLKey(texture.glReadFormat), device.getGLKey(texture.glReadType));

  gl.readPixels(sourceX, sourceY, sourceWidth, sourceHeight, sourceFormat, sourceType, target);
  gl.readBuffer(gl.COLOR_ATTACHMENT0);
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
  options?: ReadPixelsToBufferOptions
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
  // assert(framebuffer);
  sourceWidth = sourceWidth || framebuffer.width;
  sourceHeight = sourceHeight || framebuffer.height;

  // Asynchronous read (PIXEL_PACK_BUFFER) is WebGL2 only feature
  const webglFramebuffer = framebuffer;

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
    sourceTexture: source as Texture,
    width: sourceWidth,
    height: sourceHeight,
    origin: [sourceX, sourceY],
    destinationBuffer: webglBufferTarget,
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
  sourceTexture: Framebuffer | Texture,
  destinationTexture: Texture | GL,
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

  const {framebuffer, deleteFramebuffer} = getFramebuffer(sourceTexture);
  // assert(framebuffer);
  const webglFramebuffer = framebuffer;
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
  // assert(target);
  let texture: WEBGLTexture | null = null;
  let textureTarget: GL;
  if (destinationTexture instanceof WEBGLTexture) {
    texture = destinationTexture;
    width = Number.isFinite(width) ? width : texture.width;
    height = Number.isFinite(height) ? height : texture.height;
    texture?.bind(0);
    // @ts-ignore
    textureTarget = texture.target;
  } else {
    // @ts-ignore
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
  framebuffer: WEBGLFramebuffer;
  deleteFramebuffer: boolean;
} {
  if (!(source instanceof Framebuffer)) {
    return {framebuffer: toFramebuffer(source), deleteFramebuffer: true};
  }
  return {framebuffer: source as WEBGLFramebuffer, deleteFramebuffer: false};
}

/**
 * Wraps a given texture into a framebuffer object, that can be further used
 * to read data from the texture object.
 */
export function toFramebuffer(texture: Texture, props?: FramebufferProps): WEBGLFramebuffer {
  const {device, width, height, id} = texture;
  const framebuffer = device.createFramebuffer({
    ...props,
    id: `framebuffer-for-${id}`,
    width,
    height,
    colorAttachments: [texture]
  });
  return framebuffer as WEBGLFramebuffer;
}

// eslint-disable-next-line max-params
function getPixelArray(
  pixelArray,
  glType: GLDataType | GLPixelType,
  glFormat: GL,
  width: number,
  height: number,
  depth?: number
): Uint8Array | Uint16Array | Float32Array {
  if (pixelArray) {
    return pixelArray;
  }
  // const formatInfo = decodeTextureFormat(format);
  // Allocate pixel array if not already available, using supplied type
  glType ||= GL.UNSIGNED_BYTE;
  const ArrayType = getTypedArrayFromGLType(glType, {clamped: false});
  const components = glFormatToComponents(glFormat);
  // TODO - check for composite type (components = 1).
  return new ArrayType(width * height * components) as Uint8Array | Uint16Array | Float32Array;
}
