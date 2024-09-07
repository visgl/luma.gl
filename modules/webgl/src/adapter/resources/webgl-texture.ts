// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Device,
  TextureProps,
  TextureViewProps,
  Sampler,
  SamplerProps,
  SamplerParameters,
  CopyExternalImageOptions,
  CopyImageDataOptions,
  TypedArray
} from '@luma.gl/core';
import {Texture, log} from '@luma.gl/core';
import {
  GL,
  GLTextureTarget,
  GLTextureCubeMapTarget,
  GLTexelDataFormat,
  GLPixelType,
  // GLDataType,
  GLSamplerParameters,
  GLValueParameters
} from '@luma.gl/constants';
import {getTextureFormatWebGL} from '../converters/webgl-texture-table';
import {convertSamplerParametersToWebGL} from '../converters/sampler-parameters';
import {withGLParameters} from '../../context/state-tracker/with-parameters';
import {WebGLDevice} from '../webgl-device';
import {WEBGLSampler} from './webgl-sampler';
import {WEBGLTextureView} from './webgl-texture-view';

/**
 * WebGL... the texture API from hell... hopefully made simpler
 */
export class WEBGLTexture extends Texture {
  // readonly MAX_ATTRIBUTES: number;
  readonly device: WebGLDevice;
  readonly gl: WebGL2RenderingContext;
  handle: WebGLTexture;

  sampler: WEBGLSampler = undefined; // TODO - currently unused in WebGL. Create dummy sampler?
  view: WEBGLTextureView = undefined; // TODO - currently unused in WebGL. Create dummy view?

  /** Whether mipmaps were requested for this texture */
  mipmaps: boolean;

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

  constructor(device: Device, props: TextureProps) {
    super(device, props);

    this.device = device as WebGLDevice;
    this.gl = this.device.gl;

    this.mipmaps = Boolean(this.props.mipmaps);

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
      // Can never happen in WebGL
    }
    this.gl.bindTexture(this.glTarget, null);

    // Set data
    this._initializeData(props.data);

    // Set texture sampler parameters
    this.setSampler(this.props.sampler);
    // @ts-ignore TODO - fix types
    this.view = new WEBGLTextureView(this.device, {...this.props, texture: this});

    Object.seal(this);
  }

  /** Initialize texture with supplied props */
  // eslint-disable-next-line max-statements
  _initializeData(data: TextureProps['data']): void {
    // Store opts for accessors

    if (this.device.isExternalImage(data)) {
      this.copyExternalImage({
        image: data,
        width: this.width,
        height: this.height,
        depth: this.depth,
        mipLevel: 0,
        x: 0,
        y: 0,
        z: 0,
        aspect: 'all',
        colorSpace: 'srgb',
        premultipliedAlpha: false,
        flipY: false
      });
    } else if (data) {
      this.copyImageData({
        data,
        // width: this.width,
        // height: this.height,
        // depth: this.depth,
        mipLevel: 0,
        x: 0,
        y: 0,
        z: 0,
        aspect: 'all'
      });
    }

    // Do we need to generate mipmaps?
    if (this.mipmaps) {
      this.generateMipmaps();
    }
  }

  override destroy(): void {
    if (this.handle) {
      this.gl.deleteTexture(this.handle);
      this.removeStats();
      this.trackDeallocatedMemory('Texture');
      // this.handle = null;
      this.destroyed = true;
    }
  }

  createView(props: TextureViewProps): WEBGLTextureView {
    return new WEBGLTextureView(this.device, {...props, texture: this});
  }

  setSampler(sampler: Sampler | SamplerProps = {}): void {
    let samplerProps: SamplerParameters;
    if (sampler instanceof WEBGLSampler) {
      this.sampler = sampler;
      samplerProps = sampler.props;
    } else {
      this.sampler = new WEBGLSampler(this.device, sampler);
      samplerProps = sampler as SamplerProps;
    }

    const parameters = convertSamplerParametersToWebGL(samplerProps);
    this._setSamplerParameters(parameters);
  }

  generateMipmaps(options?: {force?: boolean}): void {
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

  // Image Data Setters

  copyImageData(options_: CopyImageDataOptions): void {
    const options = this._normalizeCopyImageDataOptions(options_);

    const typedArray = options.data as TypedArray;
    const {width, height, depth} = this;
    const {mipLevel = 0, byteOffset = 0, x = 0, y = 0, z = 0} = options;
    const {glFormat, glType, compressed} = this;
    const glTarget = getWebGLCubeFaceTarget(this.glTarget, this.dimension, depth);

    const glParameters: GLValueParameters = {
      [GL.UNPACK_ROW_LENGTH]: options.bytesPerRow,
      [GL.UNPACK_IMAGE_HEIGHT]: options.rowsPerImage
    };

    this.gl.bindTexture(glTarget, this.handle);

    withGLParameters(this.gl, glParameters, () => {
      switch (this.dimension) {
        case '2d':
        case 'cube':
          if (compressed) {
            // prettier-ignore
            this.gl.compressedTexSubImage2D(glTarget, mipLevel, x, y, width, height, glFormat, typedArray, byteOffset); // , byteLength
          } else {
            // prettier-ignore
            this.gl.texSubImage2D(glTarget, mipLevel, x, y, width, height, glFormat, glType, typedArray, byteOffset); // , byteLength
          }
          break;
        case '2d-array':
        case '3d':
          if (compressed) {
            // prettier-ignore
            this.gl.compressedTexSubImage3D(glTarget, mipLevel, x, y, z, width, height, depth, glFormat, typedArray, byteOffset); // , byteLength
          } else {
            // prettier-ignore
            this.gl.texSubImage3D(glTarget, mipLevel, x, y, z, width, height, depth, glFormat, glType, typedArray, byteOffset); // , byteLength
          }
          break;
        default:
        // Can never happen in WebGL
      }
    });

    this.gl.bindTexture(glTarget, null);
  }

  copyExternalImage(options_: CopyExternalImageOptions): {width: number; height: number} {
    const options = this._normalizeCopyExternalImageOptions(options_);

    if (options.sourceX || options.sourceY) {
      // requires copyTexSubImage2D from a framebuffer'
      throw new Error('WebGL does not support sourceX/sourceY)');
    }

    const {glFormat, glType} = this;
    const {image, depth, mipLevel, x, y, z, width, height} = options;

    // WebGL cube maps specify faces by overriding target instead of using the depth parameter
    const glTarget = getWebGLCubeFaceTarget(this.glTarget, this.dimension, depth);
    const glParameters: GLValueParameters = options.flipY ? {[GL.UNPACK_FLIP_Y_WEBGL]: true} : {};

    this.gl.bindTexture(glTarget, this.handle);

    withGLParameters(this.gl, glParameters, () => {
      switch (this.dimension) {
        case '2d':
        case 'cube':
          // prettier-ignore
          this.gl.texSubImage2D(glTarget, mipLevel, x, y, width, height, glFormat, glType, image);
          break;
        case '2d-array':
        case '3d':
          // prettier-ignore
          this.gl.texSubImage3D(glTarget, mipLevel, x, y, z, width, height, depth, glFormat, glType, image);
          break;
        default:
        // Can never happen in WebGL
      }
    });

    this.gl.bindTexture(glTarget, null);

    return {width: options.width, height: options.height};
  }

  // RESOURCE METHODS

  /**
   * Sets sampler parameters on texture
   */
  _setSamplerParameters(parameters: GLSamplerParameters): void {
    log.log(1, `${this.id} sampler parameters`, this.device.getGLKeys(parameters))();

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

        case GL.TEXTURE_MIN_FILTER:
          this.gl.texParameteri(this.glTarget, param, value);
          break;

        case GL.TEXTURE_WRAP_S:
        case GL.TEXTURE_WRAP_T:
          this.gl.texParameteri(this.glTarget, param, value);
          break;
        case GL.TEXTURE_MAX_ANISOTROPY_EXT:
          // We have to query feature before using it
          if (this.device.features.has('texture-filterable-anisotropic-webgl')) {
            this.gl.texParameteri(this.glTarget, param, value);
          }
          break;
        default:
          this.gl.texParameteri(this.glTarget, param, value);
          break;
      }
    }

    this.gl.bindTexture(this.glTarget, null);
  }

  // INTERNAL SETTERS

  // HELPERS

  getActiveUnit(): number {
    return this.gl.getParameter(GL.ACTIVE_TEXTURE) - GL.TEXTURE0;
  }

  bind(_textureUnit?: number): number {
    const {gl} = this;

    if (_textureUnit !== undefined) {
      this._textureUnit = _textureUnit;
      gl.activeTexture(gl.TEXTURE0 + _textureUnit);
    }

    gl.bindTexture(this.glTarget, this.handle);
    return _textureUnit;
  }

  unbind(_textureUnit?: number): number | undefined {
    const {gl} = this;

    if (_textureUnit !== undefined) {
      this._textureUnit = _textureUnit;
      gl.activeTexture(gl.TEXTURE0 + _textureUnit);
    }

    gl.bindTexture(this.glTarget, null);
    return _textureUnit;
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
