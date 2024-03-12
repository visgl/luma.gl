// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// @todo texture refactor
// - [ ] cube texture init params P1
// - [ ] 3d texture init params P1
// - [ ] GPU memory tracking
// - [ ] raw data inputs
// - [ ] video (external) textures

// import {TypedArray} from '@math.gl/types';
import type {
  Device,
  TextureProps,
  TextureViewProps,
  Sampler,
  SamplerProps,
  SamplerParameters,
  // TextureFormat,
  TextureCubeFace,
  ExternalImage,
  TextureLevelData,
  Texture1DData,
  Texture2DData,
  Texture3DData,
  TextureCubeData,
  TextureArrayData,
  TextureCubeArrayData
} from '@luma.gl/core';
// import {decodeTextureFormat} from '@luma.gl/core';
// import {Buffer, Texture, log} from '@luma.gl/core';
import {Texture, log} from '@luma.gl/core';
import {
  GL,
  GLPixelType,
  GLSamplerParameters,
  GLTexelDataFormat,
  GLTextureTarget
} from '@luma.gl/constants';
// import {GLPixelDataType} from '@luma.gl/constants';
import {withGLParameters} from '../../context/state-tracker/with-parameters';
// getTextureFormatBytesPerPixel
import {getTextureFormatWebGL} from '../converters/texture-formats';
import {convertSamplerParametersToWebGL} from '../converters/sampler-parameters';
import {WebGLDevice} from '../webgl-device';
// import {WEBGLBuffer} from './webgl-buffer';
import {WEBGLSampler} from './webgl-sampler';
import {WEBGLTextureView} from './webgl-texture-view';

// import type {WebGLSetTextureOptions, WebGLCopyTextureOptions} from '../helpers/webgl-texture-utils';
import {
  initializeTextureStorage,
  // clearMipLevel,
  copyCPUImageToMipLevel,
  copyCPUDataToMipLevel,
  // copyGPUBufferToMipLevel,
  getWebGLTextureTarget
} from '../helpers/webgl-texture-utils';

// PORTABLE HELPERS (Move to methods on Texture?)

/**
 * Normalize TextureData to an array of TextureLevelData / ExternalImages
 * @param data
 * @param options
 * @returns array of TextureLevelData / ExternalImages
 */
function normalizeTextureData(
  data: Texture2DData,
  options: {width: number; height: number; depth: number}
): (TextureLevelData | ExternalImage)[] {
  let lodArray: (TextureLevelData | ExternalImage)[];
  if (ArrayBuffer.isView(data)) {
    lodArray = [
      {
        // ts-expect-error does data really need to be Uint8ClampedArray?
        data,
        width: options.width,
        height: options.height
        // depth: options.depth
      }
    ];
  } else if (!Array.isArray(data)) {
    lodArray = [data];
  } else {
    lodArray = data;
  }
  return lodArray;
}

/**
 * WebGL... the texture API from hell... hopefully made simpler
 */
export class WEBGLTexture extends Texture {
  readonly MAX_ATTRIBUTES: number;
  readonly device: WebGLDevice;
  readonly gl: WebGL2RenderingContext;
  handle: WebGLTexture;

  sampler: WEBGLSampler = undefined; // TODO - currently unused in WebGL
  view: WEBGLTextureView = undefined;

  mipmaps: boolean = undefined;

  /**
   * @note `target` cannot be modified by bind:
   * textures are special because when you first bind them to a target,
   * When you first bind a texture as a GL_TEXTURE_2D, you are saying that this texture is a 2D texture.
   * And it will always be a 2D texture; this state cannot be changed ever.
   * A texture that was first bound as a GL_TEXTURE_2D, must always be bound as a GL_TEXTURE_2D;
   * attempting to bind it as GL_TEXTURE_3D will give rise to a run-time error
   */
  glTarget: GLTextureTarget;

  // Texture type

  /** The WebGL format - essentially channel structure */
  glFormat: GLTexelDataFormat;
  /** The WebGL data format - the type of each channel */
  glType: GLPixelType;
  /** The WebGL constant corresponding to the WebGPU style constant in format */
  glInternalFormat: GL;
  /** Whether the internal format is compressed */
  compressed: boolean;

  // data;
  // inherited props
  // dimension: ...
  // format: GLTextureTarget;
  // width: number = undefined;
  // height: number = undefined;
  // depth: number = undefined;

  // state
  /** Texture binding slot */
  textureUnit: number = 0;
  /** For automatically updating video */
  _video: {
    video: HTMLVideoElement;
    parameters: any;
    lastTime: number;
  };

  constructor(device: Device, props: TextureProps) {
    // Note: Clear out `props.data` so that we don't hold a reference to any big memory chunks
    super(device, {...Texture.defaultProps, ...props, data: undefined});

    this.device = device as WebGLDevice;
    this.gl = this.device.gl;

    // Note: In WebGL the texture target defines the type of texture on first bind.
    this.glTarget = getWebGLTextureTarget(this.props.dimension);

    // The target format of this texture
    const format = getTextureFormatWebGL(this.props.format);
    this.glInternalFormat = format.internalFormat;
    this.glFormat = format.format;
    this.glType = format.type;
    this.compressed = format.compressed;

    if (
      typeof HTMLVideoElement !== 'undefined' &&
      props.data instanceof HTMLVideoElement &&
      // @ts-expect-error
      props.data.readyState < HTMLVideoElement.HAVE_METADATA
    ) {
      const video = props.data;
      this._video = null; // Declare member before the object is sealed
      video.addEventListener('loadeddata', () => this.initialize(props));
    }

    // We removed data, we need to add it again.
    // @ts-expect-error
    this.initialize({...this.props, data: props.data});

    Object.seal(this);
  }

  /**
   * Initialize texture with supplied props
   */
  // eslint-disable-next-line max-statements
  initialize(props: TextureProps = {}): void {
    this.handle = this.props.handle || this.gl.createTexture();
    this.device.setSpectorMetadata(this.handle, {...this.props, data: typeof this.props.data});

    const data = props.data;

    // const {parameters = {}  as Record<GL, any>} = props;

    let {width, height} = props;

    if (!width || !height) {
      const textureSize = this.getTextureDataSize(data);
      width = textureSize?.width || 1;
      height = textureSize?.height || 1;
    }

    // Store opts for accessors
    this.width = width;
    this.height = height;
    this.depth = props.depth;

    // Set texture sampler parameters
    this.setSampler(props.sampler);
    // @ts-ignore
    this.view = new WEBGLTextureView(this.device, {...this.props, texture: this});

    this.bind();
    if (!this.props.data) {
      initializeTextureStorage(this.gl, this.mipLevels, this);
    }

    if (props.data) {
      // prettier-ignore
      switch (props.dimension) {
        case '1d': this.setTexture1DData(props.data); break;
        case '2d': this.setTexture2DData(props.data); break;
        case '3d': this.setTexture3DData(props.data); break;
        case 'cube': this.setTextureCubeData(props.data); break;
        case '2d-array': this.setTextureArrayData(props.data); break;
        case 'cube-array': this.setTextureCubeArrayData(props.data); break;
        // @ts-expect-error
        default: throw new Error(props.dimension);
      }
    }

    this.mipmaps = props.mipmaps;

    if (this.mipmaps) {
      this.generateMipmap();
    }

    // if (isVideo) {
    //   this._video = {
    //     video: data,
    //     // TODO  - should we be using the sampler parameters here?
    //     parameters: {},
    //     // @ts-expect-error HTMLVideoElement.HAVE_CURRENT_DATA is not declared
    //     lastTime: data.readyState >= HTMLVideoElement.HAVE_CURRENT_DATA ? data.currentTime : -1
    //   };
    // }
  }

  /*
  initializeCube(props?: TextureProps): void {
    const {mipmaps = true} = props; // , parameters = {} as Record<GL, any>} = props;

    // Store props for accessors
    // this.props = props;

    // @ts-expect-error
    this.setCubeMapData(props).then(() => {
      // TODO - should genMipmap() be called on the cubemap or on the faces?
      // TODO - without generateMipmap() cube textures do not work at all!!! Why?
      if (mipmaps) {
        this.generateMipmap(props);
      }

      this.setSampler(props.sampler);

      // v8 compatibility?
      // const {parameters = {} as Record<GL, any>} = props;
      // this._setSamplerParameters(parameters);
    });
  }
  */

  override destroy(): void {
    if (this.handle) {
      this.gl.deleteTexture(this.handle);
      this.removeStats();
      this.trackDeallocatedMemory('Texture');
      // this.handle = null;
      this.destroyed = true;
    }
  }

  override toString(): string {
    return `Texture(${this.id},${this.width}x${this.height})`;
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

  /** Update external texture (video frame or canvas) */
  update(): void {
    log.warn('Texture.update() not implemented');
    // if (this._video) {
    //   const {video, parameters, lastTime} = this._video;
    //   // @ts-expect-error
    //   if (lastTime === video.currentTime || video.readyState < HTMLVideoElement.HAVE_CURRENT_DATA) {
    //     return;
    //   }
    //   this.setSubImageData({
    //     data: video,
    //     parameters
    //   });
    //   if (this.mipmaps) {
    //     this.generateMipmap();
    //   }
    //   this._video.lastTime = video.currentTime;
    // }
  }

  // Call to regenerate mipmaps after modifying texture(s)
  generateMipmap(params = {}): void {
    if (!this.props.data) {
      return;
    }
    this.mipmaps = true;
    this.gl.bindTexture(this.glTarget, this.handle);
    withGLParameters(this.gl, params, () => {
      this.gl.generateMipmap(this.glTarget);
    });
    this.gl.bindTexture(this.glTarget, null);
  }

  // Image Data Setters

  setTexture1DData(data: Texture1DData): void {
    throw new Error('setTexture1DData not supported in WebGL.');
  }

  /** Set a simple texture */
  setTexture2DData(lodData: Texture2DData, depth = 0, glTarget = this.glTarget): void {
    this.bind();

    const lodArray = normalizeTextureData(lodData, this);

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
      copyCPUDataToMipLevel(this.device.gl, data, this);
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
    // for (const face of Texture.CubeFaces) {
    //   // this.setTextureCubeFaceData(face, data[face]);
    // }
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

    // const glFace = GL.TEXTURE_CUBE_MAP_POSITIVE_X + Texture.CubeFaces.indexOf(face);
    // const glType = GL.UNSIGNED_BYTE;
    // const {width, height, format = GL.RGBA, type = GL.UNSIGNED_BYTE} = this;
    // const {width, height, format = GL.RGBA, type = GL.UNSIGNED_BYTE} = this;

    this.bind();
    // for (let lodLevel = 0; lodLevel < lodData.length; lodLevel++) {
    //   const imageData = lodData[lodLevel];
    //   if (imageData instanceof ArrayBuffer) {
    //     // const imageData = image instanceof ArrayBuffer ? new ImageData(new Uint8ClampedArray(image), this.width) : image;
    //     this.device.gl.texImage2D?.(
    //       glFace,
    //       lodLevel,
    //       this.glInternalFormat,
    //       this.glInternalFormat,
    //       glType,
    //       imageData
    //     );
    //   }
    // }
    this.unbind();
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
    log.log(1, 'texture sampler parameters', parameters)();

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

  // CLASSIC

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

  // INTERNAL SETTERS

  /**
   * Copy a region of data from a CPU memory buffer into this texture.
   * @todo -   GLUnpackParameters parameters
   */
  protected _setMipLevel(depth: number, level: number, textureData: Texture2DData, offset = 0) {
    // if (!textureData) {
    //   clearMipLevel(this.device.gl, {...this, depth, level});
    //   return;
    // }

    if (Texture.isExternalImage(textureData)) {
      copyCPUImageToMipLevel(this.device.gl, textureData, {...this, depth, level});
      return;
    }

    // @ts-expect-error
    if (this.isTextureLevelData(textureData)) {
      copyCPUDataToMipLevel(this.device.gl, textureData.data, {
        ...this,
        depth,
        level
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

  unbind(textureUnit?: number): number {
    const {gl} = this;

    if (textureUnit !== undefined) {
      this.textureUnit = textureUnit;
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
    }

    gl.bindTexture(this.glTarget, null);
    return textureUnit;
  }
}
