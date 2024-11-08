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
  TextureCubeFace,
  ExternalImage,
  Texture1DData,
  Texture2DData,
  Texture3DData,
  TextureCubeData,
  TextureArrayData,
  TextureCubeArrayData
} from '@luma.gl/core';
import {Texture, log} from '@luma.gl/core';
import {
  GL,
  GLPixelType,
  GLSamplerParameters,
  GLTexelDataFormat,
  GLTextureTarget
} from '@luma.gl/constants';
import {getTextureFormatWebGL} from '../converters/webgl-texture-table';
import {convertSamplerParametersToWebGL} from '../converters/sampler-parameters';
import {WebGLDevice} from '../webgl-device';
import {WEBGLSampler} from './webgl-sampler';
import {WEBGLTextureView} from './webgl-texture-view';

import {
  initializeTextureStorage,
  // clearMipLevel,
  copyExternalImageToMipLevel,
  copyCPUDataToMipLevel,
  // copyGPUBufferToMipLevel,
  getWebGLTextureTarget
} from '../helpers/webgl-texture-utils';

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

  mipmaps: boolean;

  // Texture type
  /** Whether the internal format is compressed */
  compressed: boolean;

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

  // state
  /** Texture binding slot - TODO - move to texture view? */
  textureUnit: number = 0;

  constructor(device: Device, props: TextureProps) {
    super(device, props);

    // Texture base class strips out the data prop, so we need to add it back in
    const propsWithData = {...this.props};
    propsWithData.data = props.data;

    this.device = device as WebGLDevice;
    this.gl = this.device.gl;

    // Note: In WebGL the texture target defines the type of texture on first bind.
    this.glTarget = getWebGLTextureTarget(this.props.dimension);

    // The target format of this texture
    const formatInfo = getTextureFormatWebGL(this.props.format);
    this.glInternalFormat = formatInfo.internalFormat;
    this.glFormat = formatInfo.format;
    this.glType = formatInfo.type;
    this.compressed = formatInfo.compressed;
    this.mipmaps = Boolean(this.props.mipmaps);

    this._initialize(propsWithData);

    Object.seal(this);
  }

  /** Initialize texture with supplied props */
  // eslint-disable-next-line max-statements
  _initialize(propsWithData: TextureProps): void {
    this.handle = this.props.handle || this.gl.createTexture();
    this.device.setSpectorMetadata(this.handle, {...this.props, data: propsWithData.data});

    let {width, height} = propsWithData;

    if (!width || !height) {
      const textureSize = Texture.getTextureDataSize(propsWithData.data);
      width = textureSize?.width || 1;
      height = textureSize?.height || 1;
    }

    // Store opts for accessors
    this.width = width;
    this.height = height;
    this.depth = propsWithData.depth;

    // Set texture sampler parameters
    this.setSampler(propsWithData.sampler);
    // @ts-ignore TODO - fix types
    this.view = new WEBGLTextureView(this.device, {...this.props, texture: this});

    this.bind();
    initializeTextureStorage(this.gl, this.mipLevels, this);

    if (propsWithData.data) {
      // prettier-ignore
      switch (propsWithData.dimension) {
        case '1d': this.setTexture1DData(propsWithData.data); break;
        case '2d': this.setTexture2DData(propsWithData.data); break;
        case '3d': this.setTexture3DData(propsWithData.data); break;
        case 'cube': this.setTextureCubeData(propsWithData.data); break;
        case '2d-array': this.setTextureArrayData(propsWithData.data); break;
        case 'cube-array': this.setTextureCubeArrayData(propsWithData.data); break;
        // @ts-expect-error
        default: throw new Error(propsWithData.dimension);
      }
    }

    if (this.mipmaps) {
      this.generateMipmap();
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

  // Call to regenerate mipmaps after modifying texture(s)
  generateMipmap(options?: {force?: boolean}): void {
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
  copyExternalImage(options: {
    image: ExternalImage;
    sourceX?: number;
    sourceY?: number;
    width?: number;
    height?: number;
    depth?: number;
    mipLevel?: number;
    x?: number;
    y?: number;
    z?: number;
    aspect?: 'all' | 'stencil-only' | 'depth-only';
    colorSpace?: 'srgb';
    premultipliedAlpha?: boolean;
    flipY?: boolean;
  }): {width: number; height: number} {
    const size = Texture.getExternalImageSize(options.image);
    const opts = {...Texture.defaultCopyExternalImageOptions, ...size, ...options};

    const {image, depth, mipLevel, x, y, z, flipY} = opts;
    let {width, height} = opts;
    const {dimension, glTarget, glFormat, glInternalFormat, glType} = this;

    // WebGL will error if we try to copy outside the bounds of the texture
    width = Math.min(width, this.width - x);
    height = Math.min(height, this.height - y);

    if (options.sourceX || options.sourceY) {
      // requires copyTexSubImage2D from a framebuffer'
      throw new Error('WebGL does not support sourceX/sourceY)');
    }

    copyExternalImageToMipLevel(this.device.gl, this.handle, image, {
      dimension,
      mipLevel,
      x,
      y,
      z,
      width,
      height,
      depth,
      glFormat,
      glInternalFormat,
      glType,
      glTarget,
      flipY
    });

    return {width: opts.width, height: opts.height};
  }

  setTexture1DData(data: Texture1DData): void {
    throw new Error('setTexture1DData not supported in WebGL.');
  }

  /** Set a simple texture */
  setTexture2DData(lodData: Texture2DData, depth = 0): void {
    this.bind();

    const lodArray = Texture.normalizeTextureData(lodData, this);

    // If the user provides multiple LODs, then automatic mipmap
    // generation generateMipmap() should be disabled to avoid overwriting them.
    if (lodArray.length > 1 && this.props.mipmaps !== false) {
      log.warn(`Texture ${this.id} mipmap and multiple LODs.`)();
    }

    for (let lodLevel = 0; lodLevel < lodArray.length; lodLevel++) {
      const imageData = lodArray[lodLevel];
      this._setMipLevel(depth, lodLevel, imageData);
    }

    this.unbind();
  }

  /**
   * Sets a 3D texture
   * @param data
   */
  setTexture3DData(data: Texture3DData): void {
    if (this.props.dimension !== '3d') {
      throw new Error(this.id);
    }
    if (ArrayBuffer.isView(data)) {
      this.bind();
      copyCPUDataToMipLevel(this.device.gl, data, this);
      this.unbind();
    }
  }

  /**
   * Set a Texture Cube Data
   * @todo - could support TextureCubeArray with depth
   * @param data
   * @param index
   */
  setTextureCubeData(data: TextureCubeData, depth: number = 0): void {
    if (this.props.dimension !== 'cube') {
      throw new Error(this.id);
    }
    for (const face of Texture.CubeFaces) {
      this.setTextureCubeFaceData(data[face], face);
    }
  }

  /**
   * Sets an entire texture array
   * @param data
   */
  setTextureArrayData(data: TextureArrayData): void {
    if (this.props.dimension !== '2d-array') {
      throw new Error(this.id);
    }
    throw new Error('setTextureArrayData not implemented.');
  }

  /**
   * Sets an entire texture cube array
   * @param data
   */
  setTextureCubeArrayData(data: TextureCubeArrayData): void {
    throw new Error('setTextureCubeArrayData not supported in WebGL2.');
  }

  setTextureCubeFaceData(lodData: Texture2DData, face: TextureCubeFace, depth: number = 0): void {
    // assert(this.props.dimension === 'cube');

    // If the user provides multiple LODs, then automatic mipmap
    // generation generateMipmap() should be disabled to avoid overwriting them.
    if (Array.isArray(lodData) && lodData.length > 1 && this.props.mipmaps !== false) {
      log.warn(`${this.id} has mipmap and multiple LODs.`)();
    }

    const faceDepth = Texture.CubeFaces.indexOf(face);

    this.setTexture2DData(lodData, faceDepth);
  }

  // DEPRECATED METHODS

  /** Update external texture (video frame or canvas) @deprecated Use ExternalTexture */
  update(): void {
    throw new Error('Texture.update() not implemented. Use ExternalTexture');
  }

  // INTERNAL METHODS

  /** @todo update this method to accept LODs */
  setImageDataForFace(options): void {
    const {
      face,
      width,
      height,
      pixels,
      data,
      format = GL.RGBA,
      type = GL.UNSIGNED_BYTE
      // generateMipmap = false // TODO
    } = options;

    const {gl} = this;

    const imageData = pixels || data;

    this.bind();
    if (imageData instanceof Promise) {
      imageData.then(resolvedImageData =>
        this.setImageDataForFace(
          Object.assign({}, options, {
            face,
            data: resolvedImageData,
            pixels: resolvedImageData
          })
        )
      );
    } else if (this.width || this.height) {
      gl.texImage2D(face, 0, format, width, height, 0 /* border*/, format, type, imageData);
    } else {
      gl.texImage2D(face, 0, format, format, type, imageData);
    }
  }

  _getImageDataMap(faceData: Record<string | GL, any>): Record<GL, any> {
    for (let i = 0; i < Texture.CubeFaces.length; ++i) {
      const faceName = Texture.CubeFaces[i];
      if (faceData[faceName]) {
        faceData[GL.TEXTURE_CUBE_MAP_POSITIVE_X + i] = faceData[faceName];
        delete faceData[faceName];
      }
    }
    return faceData;
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

  /**
   * Copy a region of data from a CPU memory buffer into this texture.
   * @todo -   GLUnpackParameters parameters
   */
  protected _setMipLevel(
    depth: number,
    mipLevel: number,
    textureData: Texture2DData,
    glTarget: GL = this.glTarget
  ) {
    // if (!textureData) {
    //   clearMipLevel(this.device.gl, {...this, depth, level});
    //   return;
    // }

    if (Texture.isExternalImage(textureData)) {
      copyExternalImageToMipLevel(this.device.gl, this.handle, textureData, {
        ...this,
        depth,
        mipLevel,
        glTarget,
        flipY: this.props.flipY
      });
      return;
    }

    // @ts-expect-error
    if (Texture.isTextureLevelData(textureData)) {
      copyCPUDataToMipLevel(this.device.gl, textureData.data, {
        ...this,
        depth,
        mipLevel,
        glTarget
      });
      return;
    }

    throw new Error('Texture: invalid image data');
  }
  // HELPERS

  getActiveUnit(): number {
    return this.gl.getParameter(GL.ACTIVE_TEXTURE) - GL.TEXTURE0;
  }

  bind(textureUnit?: number): number {
    const {gl} = this;

    if (textureUnit !== undefined) {
      this.textureUnit = textureUnit;
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
    }

    gl.bindTexture(this.glTarget, this.handle);
    return textureUnit;
  }

  unbind(textureUnit?: number): number | undefined {
    const {gl} = this;

    if (textureUnit !== undefined) {
      this.textureUnit = textureUnit;
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
    }

    gl.bindTexture(this.glTarget, null);
    return textureUnit;
  }
}

// TODO - Remove when texture refactor is complete

/*
setCubeMapData(options: {
  width: number;
  height: number;
  data: Record<GL, Texture2DData> | Record<TextureCubeFace, Texture2DData>;
  format?: any;
  type?: any;
  /** @deprecated Use .data *
  pixels: any;
}): void {
  const {gl} = this;

  const {width, height, pixels, data, format = GL.RGBA, type = GL.UNSIGNED_BYTE} = options;

  // pixel data (imageDataMap) is an Object from Face to Image or Promise.
  // For example:
  // {
  // GL.TEXTURE_CUBE_MAP_POSITIVE_X : Image-or-Promise,
  // GL.TEXTURE_CUBE_MAP_NEGATIVE_X : Image-or-Promise,
  // ... }
  // To provide multiple level-of-details (LODs) this can be Face to Array
  // of Image or Promise, like this
  // {
  // GL.TEXTURE_CUBE_MAP_POSITIVE_X : [Image-or-Promise-LOD-0, Image-or-Promise-LOD-1],
  // GL.TEXTURE_CUBE_MAP_NEGATIVE_X : [Image-or-Promise-LOD-0, Image-or-Promise-LOD-1],
  // ... }

  const imageDataMap = this._getImageDataMap(pixels || data);

  const resolvedFaces = WEBGLTexture.FACES.map(face => {
    const facePixels = imageDataMap[face];
    return Array.isArray(facePixels) ? facePixels : [facePixels];
  });
  this.bind();

  WEBGLTexture.FACES.forEach((face, index) => {
    if (resolvedFaces[index].length > 1 && this.props.mipmaps !== false) {
      // If the user provides multiple LODs, then automatic mipmap
      // generation generateMipmap() should be disabled to avoid overwritting them.
      log.warn(`${this.id} has mipmap and multiple LODs.`)();
    }
    resolvedFaces[index].forEach((image, lodLevel) => {
      // TODO: adjust width & height for LOD!
      if (width && height) {
        gl.texImage2D(face, lodLevel, format, width, height, 0 /* border*, format, type, image);
      } else {
        gl.texImage2D(face, lodLevel, format, format, type, image);
      }
    });
  });

  this.unbind();
}
*/
