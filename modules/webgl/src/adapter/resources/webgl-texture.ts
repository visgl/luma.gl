// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// @ts-nocheck

import {
  type Device,
  type TextureProps,
  type TextureViewProps,
  type Sampler,
  type SamplerProps,
  type CopyExternalImageOptions,
  type TextureReadOptions,
  type TextureWriteOptions,
  type TextureFormat,
  Buffer,
  getTypedArrayConstructor,
  Texture,
  log
} from '@luma.gl/core';

import {
  GLSamplerParameters,
  GLValueParameters,
  GL,
  GLTextureTarget,
  GLTextureCubeMapTarget,
  GLTexelDataFormat,
  GLPixelType
} from '@luma.gl/webgl/constants';

import {getTextureFormatWebGL} from '../converters/webgl-texture-table';
import {convertSamplerParametersToWebGL} from '../converters/sampler-parameters';
import {withGLParameters} from '../../context/state-tracker/with-parameters';
import {WebGLDevice} from '../webgl-device';
import {WEBGLBuffer} from './webgl-buffer';
import {WEBGLFramebuffer} from './webgl-framebuffer';
import {WEBGLSampler} from './webgl-sampler';
import {WEBGLTextureView} from './webgl-texture-view';
import {convertGLDataTypeToDataType} from '../converters/shader-formats';

/**
 * WebGL... the texture API from hell... hopefully made simpler
 */
export class WEBGLTexture extends Texture {
  // readonly MAX_ATTRIBUTES: number;
  readonly device: WebGLDevice;
  readonly gl: WebGL2RenderingContext;
  handle: WebGLTexture;

  // @ts-ignore TODO - currently unused in WebGL. Create dummy sampler?
  sampler: WEBGLSampler = undefined;
  view: WEBGLTextureView;

  /**
   * The WebGL target corresponding to the texture type
   * @note `target` cannot be modified by bind:
   * textures are special because when you first bind them to a target,
   * When you first bind a texture as a GL_TEXTURE_2D, you are saying that this texture is a 2D texture.
   * And it will always be a 2D texture; this state cannot be changed ever.
   * A texture that was first bound as a GL_TEXTURE_2D, must always be bound as a GL_TEXTURE_2D;
   * attempting to bind it as GL_TEXTURE_3D will give rise to a run-time error
   */
  glTarget: GLTextureTarget;
  /** The WebGL format - essentially channel structure */
  glFormat: GLTexelDataFormat;
  /** The WebGL data format - the type of each channel */
  glType: GLPixelType;
  /** The WebGL constant corresponding to the WebGPU style constant in format */
  glInternalFormat: GL;
  /** Whether the internal format is compressed */
  compressed: boolean;

  // state
  /** Texture binding slot - TODO - move to texture view? */
  _textureUnit: number = 0;
  /** Cached framebuffer reused for color texture readback. */
  _framebuffer: WEBGLFramebuffer | null = null;
  /** Cache key for the currently attached readback subresource `${mipLevel}:${layer}`. */
  _framebufferAttachmentKey: string | null = null;

  constructor(device: Device, props: TextureProps) {
    // const byteAlignment = this._getRowByteAlignment(props.format, props.width);
    super(device, props, {byteAlignment: 1});

    this.device = device as WebGLDevice;
    this.gl = this.device.gl;

    const formatInfo = getTextureFormatWebGL(this.props.format);

    // Note: In WebGL the texture target defines the type of texture on first bind.
    this.glTarget = getWebGLTextureTarget(this.props.dimension);
    this.glInternalFormat = formatInfo.internalFormat;
    this.glFormat = formatInfo.format;
    this.glType = formatInfo.type;
    this.compressed = formatInfo.compressed;

    this.handle = this.props.handle || this.gl.createTexture();
    this.device._setWebGLDebugMetadata(this.handle, this, {spector: this.props});

    /**
     * Use WebGL immutable texture storage to allocate and clear texture memory.
     * - texStorage2D should be considered a preferred alternative to texImage2D. It may have lower memory costs than texImage2D in some implementations.
     * - Once texStorage*D has been called, the texture is immutable and can only be updated with texSubImage*(), not texImage()
     * @see https://registry.khronos.org/webgl/specs/latest/2.0/ WebGL 2 spec section 3.7.6
     */
    this.gl.bindTexture(this.glTarget, this.handle);
    const {dimension, width, height, depth, mipLevels, glTarget, glInternalFormat} = this;
    if (!this.compressed) {
      switch (dimension) {
        case '2d':
        case 'cube':
          this.gl.texStorage2D(glTarget, mipLevels, glInternalFormat, width, height);
          break;
        case '2d-array':
        case '3d':
          this.gl.texStorage3D(glTarget, mipLevels, glInternalFormat, width, height, depth);
          break;
        default:
          throw new Error(dimension);
      }
    }
    this.gl.bindTexture(this.glTarget, null);

    // Set data
    this._initializeData(props.data);

    if (!this.props.handle) {
      this.trackAllocatedMemory(this.getAllocatedByteLength(), 'Texture');
    } else {
      this.trackReferencedMemory(this.getAllocatedByteLength(), 'Texture');
    }

    // Set texture sampler parameters
    this.setSampler(this.props.sampler);
    // @ts-ignore TODO - fix types
    this.view = new WEBGLTextureView(this.device, {...this.props, texture: this});

    Object.seal(this);
  }

  override destroy(): void {
    if (this.handle) {
      // Destroy any cached framebuffer
      this._framebuffer?.destroy();
      this._framebuffer = null;
      this._framebufferAttachmentKey = null;

      this.removeStats();
      if (!this.props.handle) {
        this.gl.deleteTexture(this.handle);
        this.trackDeallocatedMemory('Texture');
      } else {
        this.trackDeallocatedReferencedMemory('Texture');
      }
      // this.handle = null;
      this.destroyed = true;
    }
  }

  createView(props: TextureViewProps): WEBGLTextureView {
    return new WEBGLTextureView(this.device, {...props, texture: this});
  }

  override setSampler(sampler: Sampler | SamplerProps = {}): void {
    super.setSampler(sampler);
    // Apply sampler parameters to texture
    const parameters = convertSamplerParametersToWebGL(this.sampler.props);
    this._setSamplerParameters(parameters);
  }

  copyExternalImage(options_: CopyExternalImageOptions): {width: number; height: number} {
    const options = this._normalizeCopyExternalImageOptions(options_);

    if (options.sourceX || options.sourceY) {
      // requires copyTexSubImage2D from a framebuffer'
      throw new Error('WebGL does not support sourceX/sourceY)');
    }

    const {glFormat, glType} = this;
    const {image, depth, mipLevel, x, y, z, width, height} = options;

    // WebGL cube maps specify faces by overriding target instead of using the z parameter
    const glTarget = getWebGLCubeFaceTarget(this.glTarget, this.dimension, z);
    const glParameters: GLValueParameters = options.flipY ? {[GL.UNPACK_FLIP_Y_WEBGL]: true} : {};

    this.gl.bindTexture(this.glTarget, this.handle);

    withGLParameters(this.gl, glParameters, () => {
      switch (this.dimension) {
        case '2d':
        case 'cube':
          // biome-ignore format: preserve layout
          this.gl.texSubImage2D(glTarget, mipLevel, x, y, width, height, glFormat, glType, image);
          break;
        case '2d-array':
        case '3d':
          // biome-ignore format: preserve layout
          this.gl.texSubImage3D(glTarget, mipLevel, x, y, z, width, height, depth, glFormat, glType, image);
          break;
        default:
        // Can never happen in WebGL
      }
    });

    this.gl.bindTexture(this.glTarget, null);

    return {width: options.width, height: options.height};
  }

  override copyImageData(options_): void {
    super.copyImageData(options_);
  }

  /**
   * Reads a color texture subresource into a GPU buffer using `PIXEL_PACK_BUFFER`.
   *
   * @note Only first-pass color readback is supported. Unsupported formats and aspects throw
   * before any WebGL calls are issued.
   */
  readBuffer(options: TextureReadOptions & {byteOffset?: number} = {}, buffer?: Buffer): Buffer {
    if (!buffer) {
      throw new Error(`${this} readBuffer requires a destination buffer`);
    }
    const normalizedOptions = this._getSupportedColorReadOptions(options);
    const byteOffset = options.byteOffset ?? 0;
    const memoryLayout = this.computeMemoryLayout(normalizedOptions);

    if (buffer.byteLength < byteOffset + memoryLayout.byteLength) {
      throw new Error(
        `${this} readBuffer target is too small (${buffer.byteLength} < ${byteOffset + memoryLayout.byteLength})`
      );
    }

    const webglBuffer = buffer as WEBGLBuffer;
    this.gl.bindBuffer(GL.PIXEL_PACK_BUFFER, webglBuffer.handle);
    try {
      this._readColorTextureLayers(normalizedOptions, memoryLayout, destinationByteOffset => {
        this.gl.readPixels(
          normalizedOptions.x,
          normalizedOptions.y,
          normalizedOptions.width,
          normalizedOptions.height,
          this.glFormat,
          this.glType,
          byteOffset + destinationByteOffset
        );
      });
    } finally {
      this.gl.bindBuffer(GL.PIXEL_PACK_BUFFER, null);
    }

    return buffer;
  }

  async readDataAsync(options: TextureReadOptions = {}): Promise<ArrayBuffer> {
    throw new Error(
      `${this} readDataAsync is deprecated; use readBuffer() with an explicit destination buffer or DynamicTexture.readAsync()`
    );
  }

  writeBuffer(buffer: Buffer, options_: TextureWriteOptions = {}) {
    const options = this._normalizeTextureWriteOptions(options_);
    const {width, height, depthOrArrayLayers, mipLevel, byteOffset, x, y, z} = options;
    const {glFormat, glType, compressed} = this;
    const glTarget = getWebGLCubeFaceTarget(this.glTarget, this.dimension, z);

    if (compressed) {
      throw new Error('writeBuffer for compressed textures is not implemented in WebGL');
    }

    const {bytesPerPixel} = this.device.getTextureFormatInfo(this.format);
    const unpackRowLength = bytesPerPixel ? options.bytesPerRow / bytesPerPixel : undefined;
    const glParameters: GLValueParameters = {
      [GL.UNPACK_ALIGNMENT]: this.byteAlignment,
      ...(unpackRowLength !== undefined ? {[GL.UNPACK_ROW_LENGTH]: unpackRowLength} : {}),
      [GL.UNPACK_IMAGE_HEIGHT]: options.rowsPerImage
    };

    this.gl.bindTexture(this.glTarget, this.handle);
    this.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, buffer.handle);

    withGLParameters(this.gl, glParameters, () => {
      switch (this.dimension) {
        case '2d':
        case 'cube':
          this.gl.texSubImage2D(
            glTarget,
            mipLevel,
            x,
            y,
            width,
            height,
            glFormat,
            glType,
            byteOffset
          );
          break;
        case '2d-array':
        case '3d':
          this.gl.texSubImage3D(
            glTarget,
            mipLevel,
            x,
            y,
            z,
            width,
            height,
            depthOrArrayLayers,
            glFormat,
            glType,
            byteOffset
          );
          break;
        default:
      }
    });

    this.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, null);
    this.gl.bindTexture(this.glTarget, null);
  }

  writeData(
    data: ArrayBuffer | SharedArrayBuffer | ArrayBufferView,
    options_: TextureWriteOptions = {}
  ): void {
    const options = this._normalizeTextureWriteOptions(options_);

    const typedArray = ArrayBuffer.isView(data) ? data : new Uint8Array(data);
    const {width, height, depthOrArrayLayers, mipLevel, x, y, z, byteOffset} = options;
    const {glFormat, glType, compressed} = this;
    const glTarget = getWebGLCubeFaceTarget(this.glTarget, this.dimension, z);

    let unpackRowLength: number | undefined;
    if (!compressed) {
      const {bytesPerPixel} = this.device.getTextureFormatInfo(this.format);
      if (bytesPerPixel) {
        unpackRowLength = options.bytesPerRow / bytesPerPixel;
      }
    }

    const glParameters: GLValueParameters = !this.compressed
      ? {
          [GL.UNPACK_ALIGNMENT]: this.byteAlignment,
          ...(unpackRowLength !== undefined ? {[GL.UNPACK_ROW_LENGTH]: unpackRowLength} : {}),
          [GL.UNPACK_IMAGE_HEIGHT]: options.rowsPerImage
        }
      : {};
    const sourceElementOffset = getWebGLTextureSourceElementOffset(typedArray, byteOffset);
    const compressedData = compressed ? getArrayBufferView(typedArray, byteOffset) : typedArray;
    const mipLevelSize = this._getMipLevelSize(mipLevel);
    const isFullMipUpload =
      x === 0 &&
      y === 0 &&
      z === 0 &&
      width === mipLevelSize.width &&
      height === mipLevelSize.height &&
      depthOrArrayLayers === mipLevelSize.depthOrArrayLayers;

    this.gl.bindTexture(this.glTarget, this.handle);
    this.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, null);

    withGLParameters(this.gl, glParameters, () => {
      switch (this.dimension) {
        case '2d':
        case 'cube':
          if (compressed) {
            if (isFullMipUpload) {
              // biome-ignore format: preserve layout
              this.gl.compressedTexImage2D(glTarget, mipLevel, glFormat, width, height, 0, compressedData);
            } else {
              // biome-ignore format: preserve layout
              this.gl.compressedTexSubImage2D(glTarget, mipLevel, x, y, width, height, glFormat, compressedData);
            }
          } else {
            // biome-ignore format: preserve layout
            this.gl.texSubImage2D(glTarget, mipLevel, x, y, width, height, glFormat, glType, typedArray, sourceElementOffset);
          }
          break;
        case '2d-array':
        case '3d':
          if (compressed) {
            if (isFullMipUpload) {
              // biome-ignore format: preserve layout
              this.gl.compressedTexImage3D(
                glTarget,
                mipLevel,
                glFormat,
                width,
                height,
                depthOrArrayLayers,
                0,
                compressedData
              );
            } else {
              // biome-ignore format: preserve layout
              this.gl.compressedTexSubImage3D(
                glTarget,
                mipLevel,
                x,
                y,
                z,
                width,
                height,
                depthOrArrayLayers,
                glFormat,
                compressedData
              );
            }
          } else {
            // biome-ignore format: preserve layout
            this.gl.texSubImage3D(glTarget, mipLevel, x, y, z, width, height, depthOrArrayLayers, glFormat, glType, typedArray, sourceElementOffset);
          }
          break;
        default:
        // Can never happen in WebGL
      }
    });

    this.gl.bindTexture(this.glTarget, null);
  }

  // IMPLEMENTATION SPECIFIC

  /** @todo - for now we always use 1 for maximum compatibility, we can fine tune later */
  private _getRowByteAlignment(format: TextureFormat, width: number): 1 | 2 | 4 | 8 {
    // For best texture data read/write performance, calculate the biggest pack/unpack alignment
    // that fits with the provided texture row byte length
    // Note: Any RGBA or 32 bit type will be at least 4 bytes, which should result in good performance.
    // const info = this.device.getTextureFormatInfo(format);
    // const rowByteLength = width * info.bytesPerPixel;
    // if (rowByteLength % 8 === 0) return 8;
    // if (rowByteLength % 4 === 0) return 4;
    // if (rowByteLength % 2 === 0) return 2;
    return 1;
  }

  /**
   * Wraps a given texture into a framebuffer object, that can be further used
   * to read data from the texture object.
   */
  _getFramebuffer() {
    this._framebuffer ||= this.device.createFramebuffer({
      id: `framebuffer-for-${this.id}`,
      width: this.width,
      height: this.height,
      colorAttachments: [this]
    });
    return this._framebuffer;
  }

  // WEBGL SPECIFIC

  override readDataSyncWebGL(options_: TextureReadOptions = {}): ArrayBuffer {
    const options = this._getSupportedColorReadOptions(options_);
    const memoryLayout = this.computeMemoryLayout(options);

    // const formatInfo = getTextureFormatInfo(format);
    // Allocate pixel array if not already available, using supplied type
    const shaderType = convertGLDataTypeToDataType(this.glType);
    const ArrayType = getTypedArrayConstructor(shaderType);
    const targetArray = new ArrayType(memoryLayout.byteLength / ArrayType.BYTES_PER_ELEMENT) as
      | Uint8Array
      | Uint16Array
      | Float32Array
      | Int8Array
      | Int16Array
      | Int32Array
      | Uint32Array;

    this._readColorTextureLayers(options, memoryLayout, destinationByteOffset => {
      const layerView = new ArrayType(
        targetArray.buffer,
        targetArray.byteOffset + destinationByteOffset,
        memoryLayout.bytesPerImage / ArrayType.BYTES_PER_ELEMENT
      );
      this.gl.readPixels(
        options.x,
        options.y,
        options.width,
        options.height,
        this.glFormat,
        this.glType,
        layerView
      );
    });

    return targetArray.buffer as ArrayBuffer;
  }

  /**
   * Iterates the requested mip/layer/slice range, reattaching the cached read framebuffer as
   * needed before delegating the actual `readPixels()` call to the supplied callback.
   */
  private _readColorTextureLayers(
    options: Required<TextureReadOptions>,
    memoryLayout: ReturnType<Texture['computeMemoryLayout']>,
    readLayer: (destinationByteOffset: number) => void
  ): void {
    const framebuffer = this._getFramebuffer();
    const packRowLength = memoryLayout.bytesPerRow / memoryLayout.bytesPerPixel;
    const glParameters: GLValueParameters = {
      [GL.PACK_ALIGNMENT]: this.byteAlignment,
      ...(packRowLength !== options.width ? {[GL.PACK_ROW_LENGTH]: packRowLength} : {})
    };

    // Note: luma.gl overrides bindFramebuffer so that we can reliably restore the previous framebuffer.
    const prevReadBuffer = this.gl.getParameter(GL.READ_BUFFER) as GL;
    const prevHandle = this.gl.bindFramebuffer(
      GL.FRAMEBUFFER,
      framebuffer.handle
    ) as unknown as WebGLFramebuffer | null;

    try {
      this.gl.readBuffer(GL.COLOR_ATTACHMENT0);
      withGLParameters(this.gl, glParameters, () => {
        for (let layerIndex = 0; layerIndex < options.depthOrArrayLayers; layerIndex++) {
          this._attachReadSubresource(framebuffer, options.mipLevel, options.z + layerIndex);
          readLayer(layerIndex * memoryLayout.bytesPerImage);
        }
      });
    } finally {
      this.gl.bindFramebuffer(GL.FRAMEBUFFER, prevHandle || null);
      this.gl.readBuffer(prevReadBuffer);
    }
  }

  /**
   * Attaches a single color subresource to the cached read framebuffer.
   *
   * @note Repeated attachments of the same `(mipLevel, layer)` tuple are skipped.
   */
  private _attachReadSubresource(
    framebuffer: WEBGLFramebuffer,
    mipLevel: number,
    layer: number
  ): void {
    const attachmentKey = `${mipLevel}:${layer}`;
    if (this._framebufferAttachmentKey === attachmentKey) {
      return;
    }

    switch (this.dimension) {
      case '2d':
        this.gl.framebufferTexture2D(
          GL.FRAMEBUFFER,
          GL.COLOR_ATTACHMENT0,
          GL.TEXTURE_2D,
          this.handle,
          mipLevel
        );
        break;

      case 'cube':
        this.gl.framebufferTexture2D(
          GL.FRAMEBUFFER,
          GL.COLOR_ATTACHMENT0,
          getWebGLCubeFaceTarget(this.glTarget, this.dimension, layer),
          this.handle,
          mipLevel
        );
        break;

      case '2d-array':
      case '3d':
        this.gl.framebufferTextureLayer(
          GL.FRAMEBUFFER,
          GL.COLOR_ATTACHMENT0,
          this.handle,
          mipLevel,
          layer
        );
        break;

      default:
        throw new Error(`${this} color readback does not support ${this.dimension} textures`);
    }

    if (this.device.props.debug) {
      const status = Number(this.gl.checkFramebufferStatus(GL.FRAMEBUFFER));
      if (status !== Number(GL.FRAMEBUFFER_COMPLETE)) {
        throw new Error(`${framebuffer} incomplete for ${this} readback (${status})`);
      }
    }

    this._framebufferAttachmentKey = attachmentKey;
  }

  /**
   * @note - this is used by the DynamicTexture class to generate mipmaps on WebGL
   */
  override generateMipmapsWebGL(options?: {force?: boolean}): void {
    const isFilterableAndRenderable =
      this.device.isTextureFormatRenderable(this.props.format) &&
      this.device.isTextureFormatFilterable(this.props.format);
    if (!isFilterableAndRenderable) {
      log.warn(`${this} is not renderable or filterable, may not be able to generate mipmaps`)();
      if (!options?.force) {
        return;
      }
    }

    try {
      this.gl.bindTexture(this.glTarget, this.handle);
      this.gl.generateMipmap(this.glTarget);
    } catch (error) {
      log.warn(`Error generating mipmap for ${this}: ${(error as Error).message}`)();
    } finally {
      this.gl.bindTexture(this.glTarget, null);
    }
  }

  // INTERNAL

  /**
   * Sets sampler parameters on texture
   */
  _setSamplerParameters(parameters: GLSamplerParameters): void {
    log.log(2, `${this.id} sampler parameters`, this.device.getGLKeys(parameters))();

    this.gl.bindTexture(this.glTarget, this.handle);

    for (const [pname, pvalue] of Object.entries(parameters)) {
      const param = Number(pname) as keyof GLSamplerParameters;
      const value = pvalue;

      // Apparently integer/float issues require two different texture parameter setting functions in JavaScript.
      // For now, pick the float version for parameters specified as GLfloat.
      switch (param) {
        case GL.TEXTURE_MIN_LOD:
        case GL.TEXTURE_MAX_LOD:
          this.gl.texParameterf(this.glTarget, param, value);
          break;

        case GL.TEXTURE_MAG_FILTER:
        case GL.TEXTURE_MIN_FILTER:
          this.gl.texParameteri(this.glTarget, param, value);
          break;

        case GL.TEXTURE_WRAP_S:
        case GL.TEXTURE_WRAP_T:
        case GL.TEXTURE_WRAP_R:
          this.gl.texParameteri(this.glTarget, param, value);
          break;

        case GL.TEXTURE_MAX_ANISOTROPY_EXT:
          // We have to query feature before using it
          if (this.device.features.has('texture-filterable-anisotropic-webgl')) {
            this.gl.texParameteri(this.glTarget, param, value);
          }
          break;

        case GL.TEXTURE_COMPARE_MODE:
        case GL.TEXTURE_COMPARE_FUNC:
          this.gl.texParameteri(this.glTarget, param, value);
          break;
      }
    }

    this.gl.bindTexture(this.glTarget, null);
  }

  _getActiveUnit(): number {
    return this.gl.getParameter(GL.ACTIVE_TEXTURE) - GL.TEXTURE0;
  }

  _bind(_textureUnit?: number): number {
    const {gl} = this;

    if (_textureUnit !== undefined) {
      this._textureUnit = _textureUnit;
      gl.activeTexture(gl.TEXTURE0 + _textureUnit);
    }

    gl.bindTexture(this.glTarget, this.handle);
    // @ts-ignore TODO fix types
    return _textureUnit;
  }

  _unbind(_textureUnit?: number): number | undefined {
    const {gl} = this;

    if (_textureUnit !== undefined) {
      this._textureUnit = _textureUnit;
      gl.activeTexture(gl.TEXTURE0 + _textureUnit);
    }

    gl.bindTexture(this.glTarget, null);
    return _textureUnit;
  }
}

function getArrayBufferView(typedArray: ArrayBufferView, byteOffset = 0): ArrayBufferView {
  if (!byteOffset) {
    return typedArray;
  }

  return new typedArray.constructor(
    typedArray.buffer,
    typedArray.byteOffset + byteOffset,
    (typedArray.byteLength - byteOffset) / typedArray.BYTES_PER_ELEMENT
  ) as ArrayBufferView;
}

function getWebGLTextureSourceElementOffset(
  typedArray: ArrayBufferView,
  byteOffset: number
): number {
  if (byteOffset % typedArray.BYTES_PER_ELEMENT !== 0) {
    throw new Error(
      `Texture byteOffset ${byteOffset} must align to typed array element size ${typedArray.BYTES_PER_ELEMENT}`
    );
  }

  return byteOffset / typedArray.BYTES_PER_ELEMENT;
}

// INTERNAL HELPERS

/** Convert a WebGPU style texture constant to a WebGL style texture constant */
export function getWebGLTextureTarget(
  dimension: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d'
): GLTextureTarget {
  // biome-ignore format: preserve layout
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
