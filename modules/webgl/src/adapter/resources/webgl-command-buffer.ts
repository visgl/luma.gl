// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  CopyBufferToBufferOptions,
  CopyBufferToTextureOptions,
  CopyTextureToBufferOptions,
  CopyTextureToTextureOptions
  // ClearTextureOptions,
  // ReadTextureOptions
} from '@luma.gl/core';
import {CommandBuffer, Texture, Framebuffer} from '@luma.gl/core';
import {
  GL,
  GLTextureTarget,
  GLTextureCubeMapTarget
  // GLTexelDataFormat,
  // GLPixelType,
  // GLDataType
} from '@luma.gl/constants';

import {WebGLDevice} from '../webgl-device';
import {WEBGLBuffer} from './webgl-buffer';
import {WEBGLTexture} from './webgl-texture';
import {WEBGLFramebuffer} from './webgl-framebuffer';
import {getTextureFormatWebGL} from '../converters/webgl-texture-table';

type CopyBufferToBufferCommand = {
  name: 'copy-buffer-to-buffer';
  options: CopyBufferToBufferOptions;
};

type CopyBufferToTextureCommand = {
  name: 'copy-buffer-to-texture';
  options: CopyBufferToTextureOptions;
};

type CopyTextureToBufferCommand = {
  name: 'copy-texture-to-buffer';
  options: CopyTextureToBufferOptions;
};

type CopyTextureToTextureCommand = {
  name: 'copy-texture-to-texture';
  options: CopyTextureToTextureOptions;
};

type ClearTextureCommand = {
  name: 'clear-texture';
  options: {}; // ClearTextureOptions;
};

type ReadTextureCommand = {
  name: 'read-texture';
  options: {}; // ReadTextureOptions;
};

type Command =
  | CopyBufferToBufferCommand
  | CopyBufferToTextureCommand
  | CopyTextureToBufferCommand
  | CopyTextureToTextureCommand
  | ClearTextureCommand
  | ReadTextureCommand;

export class WEBGLCommandBuffer extends CommandBuffer {
  device: WebGLDevice;
  commands: Command[] = [];

  constructor(device: WebGLDevice) {
    super(device, {});
    this.device = device;
  }

  submitCommands(commands: Command[] = this.commands) {
    for (const command of commands) {
      switch (command.name) {
        case 'copy-buffer-to-buffer':
          _copyBufferToBuffer(this.device, command.options);
          break;
        case 'copy-buffer-to-texture':
          _copyBufferToTexture(this.device, command.options);
          break;
        case 'copy-texture-to-buffer':
          _copyTextureToBuffer(this.device, command.options);
          break;
        case 'copy-texture-to-texture':
          _copyTextureToTexture(this.device, command.options);
          break;
        // case 'clear-texture':
        //   _clearTexture(this.device, command.options);
        //   break;
        default:
          throw new Error(command.name);
      }
    }
  }
}

function _copyBufferToBuffer(device: WebGLDevice, options: CopyBufferToBufferOptions): void {
  const source = options.sourceBuffer as WEBGLBuffer;
  const destination = options.destinationBuffer as WEBGLBuffer;

  // {In WebGL2 we can p}erform the copy on the GPU
  // Use GL.COPY_READ_BUFFER+GL.COPY_WRITE_BUFFER avoid disturbing other targets and locking type
  device.gl.bindBuffer(GL.COPY_READ_BUFFER, source.handle);
  device.gl.bindBuffer(GL.COPY_WRITE_BUFFER, destination.handle);
  device.gl.copyBufferSubData(
    GL.COPY_READ_BUFFER,
    GL.COPY_WRITE_BUFFER,
    options.sourceOffset ?? 0,
    options.destinationOffset ?? 0,
    options.size
  );
  device.gl.bindBuffer(GL.COPY_READ_BUFFER, null);
  device.gl.bindBuffer(GL.COPY_WRITE_BUFFER, null);
}

/**
 * Copies data from a Buffer object into a Texture object
 * NOTE: doesn't wait for copy to be complete
 */
function _copyBufferToTexture(device: WebGLDevice, options: CopyBufferToTextureOptions): void {
  throw new Error('Not implemented');
}

/**
 * Copies data from a Texture object into a Buffer object.
 * NOTE: doesn't wait for copy to be complete
 */
function _copyTextureToBuffer(device: WebGLDevice, options: CopyTextureToBufferOptions): void {
  const {
    /** Texture to copy to/from. */
    sourceTexture,
    /**  Mip-map level of the texture to copy to/from. (Default 0) */
    mipLevel = 0,
    /** Defines which aspects of the texture to copy to/from. */
    aspect = 'all',

    /** Width to copy */
    width = options.sourceTexture.width,
    /** Height to copy */
    height = options.sourceTexture.height,
    depthOrArrayLayers = 0,
    /** Defines the origin of the copy - the minimum corner of the texture sub-region to copy to/from. */
    origin = [0, 0],

    /** Destination buffer */
    destinationBuffer,
    /** Offset, in bytes, from the beginning of the buffer to the start of the image data (default 0) */
    byteOffset = 0,
    /**
     * The stride, in bytes, between the beginning of each block row and the subsequent block row.
     * Required if there are multiple block rows (i.e. the copy height or depth is more than one block).
     */
    bytesPerRow,
    /**
     * Number of block rows per single image of the texture.
     * rowsPerImage &times; bytesPerRow is the stride, in bytes, between the beginning of each image of data and the subsequent image.
     * Required if there are multiple images (i.e. the copy depth is more than one).
     */
    rowsPerImage
  } = options;

  // TODO - Not possible to read just stencil or depth part in WebGL?
  if (aspect !== 'all') {
    throw new Error('aspect not supported in WebGL');
  }

  // TODO - mipLevels are set when attaching texture to framebuffer
  if (mipLevel !== 0 || depthOrArrayLayers !== 0 || bytesPerRow || rowsPerImage) {
    throw new Error('not implemented');
  }

  // Asynchronous read (PIXEL_PACK_BUFFER) is WebGL2 only feature
  const {framebuffer, destroyFramebuffer} = getFramebuffer(sourceTexture);
  let prevHandle: WebGLFramebuffer | null | undefined;
  try {
    const webglBuffer = destinationBuffer as WEBGLBuffer;
    const sourceWidth = width || framebuffer.width;
    const sourceHeight = height || framebuffer.height;
    const sourceParams = getTextureFormatWebGL(
      framebuffer.colorAttachments[0].texture.props.format
    );
    const sourceFormat = sourceParams.format;
    const sourceType = sourceParams.type;

    // if (!target) {
    //   // Create new buffer with enough size
    //   const components = glFormatToComponents(sourceFormat);
    //   const byteCount = glTypeToBytes(sourceType);
    //   const byteLength = byteOffset + sourceWidth * sourceHeight * components * byteCount;
    //   target = device.createBuffer({byteLength});
    // }

    device.gl.bindBuffer(GL.PIXEL_PACK_BUFFER, webglBuffer.handle);
    // @ts-expect-error native bindFramebuffer is overridden by our state tracker
    prevHandle = device.gl.bindFramebuffer(GL.FRAMEBUFFER, framebuffer.handle);

    device.gl.readPixels(
      origin[0],
      origin[1],
      sourceWidth,
      sourceHeight,
      sourceFormat,
      sourceType,
      byteOffset
    );
  } finally {
    device.gl.bindBuffer(GL.PIXEL_PACK_BUFFER, null);
    // prevHandle may be unassigned if the try block failed before binding
    if (prevHandle !== undefined) {
      device.gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle);
    }

    if (destroyFramebuffer) {
      framebuffer.destroy();
    }
  }
}

/**
 * Copies data from a Framebuffer or a Texture object into a Buffer object.
 * NOTE: doesn't wait for copy to be complete, it programs GPU to perform a DMA transfer.
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
): Buffer
 */

/**
 * Copy a rectangle from a Framebuffer or Texture object into a texture (at an offset)
 */
// eslint-disable-next-line complexity, max-statements
function _copyTextureToTexture(device: WebGLDevice, options: CopyTextureToTextureOptions): void {
  const {
    /** Texture to copy to/from. */
    sourceTexture,
    /**  Mip-map level of the texture to copy to (Default 0) */
    destinationMipLevel = 0,
    /** Defines which aspects of the texture to copy to/from. */
    // aspect = 'all',
    /** Defines the origin of the copy - the minimum corner of the texture sub-region to copy from. */
    origin = [0, 0],

    /** Defines the origin of the copy - the minimum corner of the texture sub-region to copy to. */
    destinationOrigin = [0, 0],

    /** Texture to copy to/from. */
    destinationTexture
    /**  Mip-map level of the texture to copy to/from. (Default 0) */
    // destinationMipLevel = options.mipLevel,
    /** Defines the origin of the copy - the minimum corner of the texture sub-region to copy to/from. */
    // destinationOrigin = [0, 0],
    /** Defines which aspects of the texture to copy to/from. */
    // destinationAspect = options.aspect,
  } = options;

  let {
    width = options.destinationTexture.width,
    height = options.destinationTexture.height
    // depthOrArrayLayers = 0
  } = options;

  const {framebuffer, destroyFramebuffer} = getFramebuffer(sourceTexture);
  const [sourceX, sourceY] = origin;
  const [destinationX, destinationY, destinationZ] = destinationOrigin;

  // @ts-expect-error native bindFramebuffer is overridden by our state tracker
  const prevHandle: WebGLFramebuffer | null = device.gl.bindFramebuffer(
    GL.FRAMEBUFFER,
    framebuffer.handle
  );
  // TODO - support gl.readBuffer (WebGL2 only)
  // const prevBuffer = gl.readBuffer(attachment);

  let texture: WEBGLTexture = null;
  let textureTarget: GL;
  if (destinationTexture instanceof WEBGLTexture) {
    texture = destinationTexture;
    width = Number.isFinite(width) ? width : texture.width;
    height = Number.isFinite(height) ? height : texture.height;
    texture.bind(0);
    textureTarget = texture.glTarget;
  } else {
    throw new Error('invalid destination');
  }

  switch (textureTarget) {
    case GL.TEXTURE_2D:
    case GL.TEXTURE_CUBE_MAP:
      device.gl.copyTexSubImage2D(
        textureTarget,
        destinationMipLevel,
        destinationX,
        destinationY,
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
        destinationMipLevel,
        destinationX,
        destinationY,
        destinationZ,
        sourceX,
        sourceY,
        width,
        height
      );
      break;
    default:
  }

  if (texture) {
    texture.unbind();
  }
  device.gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle);
  if (destroyFramebuffer) {
    framebuffer.destroy();
  }
}

/** Clear one mip level of a texture *
function _clearTexture(device: WebGLDevice, options: ClearTextureOptions) {
  const BORDER = 0;
  const {dimension, width, height, depth = 0, mipLevel = 0} = options;
  const {glInternalFormat, glFormat, glType, compressed} = options;
  const glTarget = getWebGLCubeFaceTarget(options.glTarget, dimension, depth);

  switch (dimension) {
    case '2d-array':
    case '3d':
      if (compressed) {
        // prettier-ignore
        device.gl.compressedTexImage3D(glTarget, mipLevel, glInternalFormat, width, height, depth, BORDER, null);
      } else {
        // prettier-ignore
        device.gl.texImage3D( glTarget, mipLevel, glInternalFormat, width, height, depth, BORDER, glFormat, glType, null);
      }
      break;

    case '2d':
    case 'cube':
      if (compressed) {
        // prettier-ignore
        device.gl.compressedTexImage2D(glTarget, mipLevel, glInternalFormat, width, height, BORDER, null);
      } else {
        // prettier-ignore
        device.gl.texImage2D(glTarget, mipLevel, glInternalFormat, width, height, BORDER, glFormat, glType, null);
      }
      break;

    default:
      throw new Error(dimension);
  }
}
  */

// function _readTexture(device: WebGLDevice, options: CopyTextureToBufferOptions) {}

// HELPERS

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

/** Wrap a texture in a framebuffer so that we can use WebGL APIs that work on framebuffers */
function getFramebuffer(source: Texture | Framebuffer): {
  framebuffer: WEBGLFramebuffer;
  destroyFramebuffer: boolean;
} {
  if (source instanceof Texture) {
    const {width, height, id} = source;
    const framebuffer = source.device.createFramebuffer({
      id: `framebuffer-for-${id}`,
      width,
      height,
      colorAttachments: [source]
    }) as unknown as WEBGLFramebuffer;

    return {framebuffer, destroyFramebuffer: true};
  }
  return {framebuffer: source as unknown as WEBGLFramebuffer, destroyFramebuffer: false};
}

/**
 * Returns number of components in a specific readPixels WebGL format
 * @todo use shadertypes utils instead?
 */
export function glFormatToComponents(format): 1 | 2 | 3 | 4 {
  switch (format) {
    case GL.ALPHA:
    case GL.R32F:
    case GL.RED:
      return 1;
    case GL.RG32F:
    case GL.RG:
      return 2;
    case GL.RGB:
    case GL.RGB32F:
      return 3;
    case GL.RGBA:
    case GL.RGBA32F:
      return 4;
    // TODO: Add support for additional WebGL2 formats
    default:
      throw new Error('GLFormat');
  }
}

/**
 * Return byte count for given readPixels WebGL type
 * @todo use shadertypes utils instead?
 */
export function glTypeToBytes(type: GL): 1 | 2 | 4 {
  switch (type) {
    case GL.UNSIGNED_BYTE:
      return 1;
    case GL.UNSIGNED_SHORT_5_6_5:
    case GL.UNSIGNED_SHORT_4_4_4_4:
    case GL.UNSIGNED_SHORT_5_5_5_1:
      return 2;
    case GL.FLOAT:
      return 4;
    // TODO: Add support for additional WebGL2 types
    default:
      throw new Error('GLType');
  }
}
