// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Texture class.
// @todo
// - [ ] cube texture init params
// - [ ] video (external) textures

import {
  Device,
  TextureProps,
  TextureViewProps,
  Sampler,
  SamplerProps,
  SamplerParameters,
  TypedArray
} from '@luma.gl/core';
import {Texture, log, assert, loadImage, isObjectEmpty} from '@luma.gl/core';
import {GL, GLSamplerParameters} from '@luma.gl/constants';
import {withGLParameters} from '../../context/state-tracker/with-parameters';
import {
  convertTextureFormatToGL,
  getWebGLTextureParameters,
  getTextureFormatBytesPerPixel
} from '../converters/texture-formats';
import {convertSamplerParametersToWebGL} from '../converters/sampler-parameters';
import {WebGLDevice} from '../webgl-device';
import {WEBGLBuffer} from './webgl-buffer';
import {WEBGLSampler} from './webgl-sampler';
import {WEBGLTextureView} from './webgl-texture-view';

export type WEBGLTextureProps = TextureProps & {
  /** @deprecated use props.sampler */
  parameters?: Record<number, number>;
  /** @deprecated use props.data */
  pixels?: any;
  /** @deprecated use props.format */
  dataFormat?: number | null;
  /** @deprecated rarely supported */
  border?: number;
  /** @deprecated WebGL only. */
  pixelStore?: object;
  /** @deprecated WebGL only. */
  textureUnit?: number;
  /** @deprecated WebGL only. Use dimension. */
  target?: number;
};

export const DEFAULT_WEBGL_TEXTURE_PROPS = {
  // deprecated
  parameters: {},
  pixelStore: {},
  pixels: null,
  border: 0,
  dataFormat: undefined!,
  textureUnit: undefined!,
  target: undefined!
};

export type TextureSourceData =
  | TypedArray
  | ImageData
  | HTMLImageElement
  | HTMLCanvasElement
  | ImageBitmap
  | HTMLVideoElement;

type SetImageDataOptions = {
  target?: number;
  level?: number;
  dataFormat?: any;
  width?: number;
  height?: number;
  depth?: number;
  glFormat?: GL;
  type?: any;
  offset?: number;
  data: any; // TextureSourceData;
  compressed?: boolean;
  parameters?: Record<GL, any>;
  /** @deprecated */
  pixels?: any;
};

/**
 * @param {*} pixels, data -
 *  null - create empty texture of specified format
 *  Typed array - init from image data in typed array
 *  Buffer|WebGLBuffer - (WEBGL2) init from image data in WebGLBuffer
 *  HTMLImageElement|Image - Inits with content of image. Auto width/height
 *  HTMLCanvasElement - Inits with contents of canvas. Auto width/height
 *  HTMLVideoElement - Creates video texture. Auto width/height
 *
 * @param  x - xOffset from where texture to be updated
 * @param  y - yOffset from where texture to be updated
 * @param  width - width of the sub image to be updated
 * @param  height - height of the sub image to be updated
 * @param  level - mip level to be updated
 * @param {GLenum} format - internal format of image data.
 * @param {GLenum} type
 *  - format of array (autodetect from type) or
 *  - (WEBGL2) format of buffer or ArrayBufferView
 * @param {GLenum} dataFormat - format of image data.
 * @param {Number} offset - (WEBGL2) offset from start of buffer
 * @parameters - temporary settings to be applied, can be used to supply pixel store settings.
 */
type SetSubImageDataOptions = {
  target?: number;
  level?: number;
  dataFormat?: any;
  width?: number;
  height?: number;
  depth?: number;
  glFormat?: any;
  type?: any;
  offset?: number;
  data: any;
  parameters?: Record<GL, any>;
  compressed?: boolean;
  x?: number;
  y?: number;
  /** @deprecated */
  pixels?: any;
};

type SetImageData3DOptions = {
  level?: number;
  dataFormat?: any;
  width?: number;
  height?: number;
  depth?: number;
  format?: any;
  type?: any;
  offset?: number;
  data: any;
  parameters?: Record<GL, any>;
};

// Polyfill
export class WEBGLTexture extends Texture<WEBGLTextureProps> {
  // TODO - remove?
  static FACES: number[] = [
    GL.TEXTURE_CUBE_MAP_POSITIVE_X,
    GL.TEXTURE_CUBE_MAP_NEGATIVE_X,
    GL.TEXTURE_CUBE_MAP_POSITIVE_Y,
    GL.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    GL.TEXTURE_CUBE_MAP_POSITIVE_Z,
    GL.TEXTURE_CUBE_MAP_NEGATIVE_Z
  ];

  readonly MAX_ATTRIBUTES: number;
  readonly device: WebGLDevice;
  readonly gl: WebGL2RenderingContext;
  readonly handle: WebGLTexture;

  // (TODO - currently unused in WebGL, but WebGL 2 does support sampler objects) */
  sampler: WEBGLSampler = undefined;

  view: WEBGLTextureView = undefined;

  // data;

  glFormat: GL = undefined;
  type: GL = undefined;
  dataFormat: GL = undefined;
  mipmaps: boolean = undefined;

  /**
   * @note `target` cannot be modified by bind:
   * textures are special because when you first bind them to a target,
   * they get special information. When you first bind a texture as a
   * GL_TEXTURE_2D, you are saying that this texture is a 2D texture.
   * And it will always be a 2D texture; this state cannot be changed ever.
   * A texture that was first bound as a GL_TEXTURE_2D, must always be bound as a GL_TEXTURE_2D;
   * attempting to bind it as GL_TEXTURE_3D will give rise to a run-time error
   * */
  target: GL;
  textureUnit: number = undefined;

  /**
   * Program.draw() checks the loaded flag of all textures to avoid
   * Textures that are still loading from promises
   * Set to true as soon as texture has been initialized with valid data
   */
  loaded: boolean = false;
  _video: {
    video: HTMLVideoElement;
    parameters: any;
    lastTime: number;
  };

  constructor(device: Device, props: WEBGLTextureProps) {
    super(device, {...DEFAULT_WEBGL_TEXTURE_PROPS, format: 'rgba8unorm', ...props});

    this.device = device as WebGLDevice;
    this.gl = this.device.gl;
    this.handle = this.props.handle || this.gl.createTexture();
    this.device.setSpectorMetadata(this.handle, {...this.props, data: typeof this.props.data}); // {name: this.props.id};

    this.glFormat = GL.RGBA;
    this.target = getWebGLTextureTarget(this.props);

    // Program.draw() checks the loaded flag of all textures
    this.loaded = false;

    // Signature: new Texture2D(gl, {data: url})
    if (typeof this.props?.data === 'string') {
      Object.assign(this.props, {data: loadImage(this.props.data)});
    }

    this.initialize(this.props);

    Object.seal(this);
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

  override toString(): string {
    return `Texture(${this.id},${this.width}x${this.height})`;
  }

  createView(props: TextureViewProps): WEBGLTextureView {
    return new WEBGLTextureView(this.device, {...props, texture: this});
  }

  // eslint-disable-next-line max-statements
  initialize(props: WEBGLTextureProps = {}): this {
    // Cube textures
    if (this.props.dimension === 'cube') {
      return this.initializeCube(props);
    }

    let data = props.data;

    if (data instanceof Promise) {
      data.then(resolvedImageData =>
        this.initialize(
          Object.assign({}, props, {
            pixels: resolvedImageData,
            data: resolvedImageData
          })
        )
      );
      return this;
    }

    const isVideo = typeof HTMLVideoElement !== 'undefined' && data instanceof HTMLVideoElement;
    // @ts-expect-error
    if (isVideo && data.readyState < HTMLVideoElement.HAVE_METADATA) {
      this._video = null; // Declare member before the object is sealed
      // @ts-expect-error
      data.addEventListener('loadeddata', () => this.initialize(props));
      return this;
    }

    const {parameters = {} as Record<GL, any>} = props;

    const {pixels = null, pixelStore = {}, textureUnit = undefined, mipmaps = true} = props;

    // pixels variable is for API compatibility purpose
    if (!data) {
      // TODO - This looks backwards? Commenting out for now until we decide
      // which prop to use
      // log.deprecated('data', 'pixels')();
      data = pixels;
    }

    let {width, height, dataFormat, type, compressed = false} = props;
    const {depth = 0} = props;

    const glFormat = convertTextureFormatToGL(props.format);

    // Deduce width and height
    ({width, height, compressed, dataFormat, type} = this._deduceParameters({
      format: props.format,
      type,
      dataFormat,
      compressed,
      data,
      width,
      height
    }));

    // Store opts for accessors
    this.width = width;
    this.height = height;
    // this.depth = depth;
    this.glFormat = glFormat;
    this.type = type;
    this.dataFormat = dataFormat;
    this.textureUnit = textureUnit;

    if (Number.isFinite(this.textureUnit)) {
      this.gl.activeTexture(GL.TEXTURE0 + this.textureUnit);
      this.gl.bindTexture(this.target, this.handle);
    }

    this.mipmaps = mipmaps;

    this.setImageData({
      data,
      width,
      height,
      depth,
      format: glFormat,
      type,
      dataFormat,
      // @ts-expect-error
      parameters: pixelStore,
      compressed
    });

    // Set texture sampler parameters
    this.setSampler(props.sampler);
    this._setSamplerParameters(parameters);

    this.view = this.createView({...this.props, mipLevelCount: 1, arrayLayerCount: 1});

    if (mipmaps && this.device.isTextureFormatFilterable(props.format)) {
      this.generateMipmap();
    }

    if (isVideo) {
      this._video = {
        video: data as HTMLVideoElement,
        parameters,
        // @ts-expect-error
        lastTime: data.readyState >= HTMLVideoElement.HAVE_CURRENT_DATA ? data.currentTime : -1
      };
    }

    return this;
  }

  initializeCube(props?: WEBGLTextureProps): this {
    const {mipmaps = true, parameters = {} as Record<GL, any>} = props;

    // Store props for accessors
    // this.props = props;

    // @ts-expect-error
    this.setCubeMapImageData(props).then(() => {
      this.loaded = true;

      // TODO - should genMipmap() be called on the cubemap or on the faces?
      // TODO - without generateMipmap() cube textures do not work at all!!! Why?
      if (mipmaps) {
        this.generateMipmap(props);
      }

      this.setSampler(props.sampler);
      this._setSamplerParameters(parameters);
    });
    return this;
  }

  setSampler(sampler: Sampler | SamplerProps = {}): this {
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
    return this;
  }

  /**
   * If size has changed, reinitializes with current format
   * @note note clears image and mipmaps
   */
  resize(options: {height: number; width: number; mipmaps?: boolean}): this {
    const {height, width, mipmaps = false} = options;
    if (width !== this.width || height !== this.height) {
      return this.initialize({
        width,
        height,
        format: this.format,
        type: this.type,
        dataFormat: this.dataFormat,
        mipmaps
      });
    }
    return this;
  }

  /** Update external texture (video frame) */
  update(): void {
    if (this._video) {
      const {video, parameters, lastTime} = this._video;
      // @ts-expect-error
      if (lastTime === video.currentTime || video.readyState < HTMLVideoElement.HAVE_CURRENT_DATA) {
        return;
      }
      this.setSubImageData({
        data: video,
        parameters
      });
      if (this.mipmaps) {
        this.generateMipmap();
      }
      this._video.lastTime = video.currentTime;
    }
  }

  // Call to regenerate mipmaps after modifying texture(s)
  generateMipmap(params = {}): this {
    this.mipmaps = true;

    this.gl.bindTexture(this.target, this.handle);
    withGLParameters(this.gl, params, () => {
      this.gl.generateMipmap(this.target);
    });
    this.gl.bindTexture(this.target, null);
    return this;
  }

  /*
   * Allocates storage
   * @param {*} pixels -
   *  null - create empty texture of specified format
   *  Typed array - init from image data in typed array
   *  Buffer|WebGLBuffer - (WEBGL2) init from image data in WebGLBuffer
   *  HTMLImageElement|Image - Inits with content of image. Auto width/height
   *  HTMLCanvasElement - Inits with contents of canvas. Auto width/height
   *  HTMLVideoElement - Creates video texture. Auto width/height
   *
   * @param  width -
   * @param  height -
   * @param  mipMapLevel -
   * @param {GLenum} format - format of image data.
   * @param {GLenum} type
   *  - format of array (autodetect from type) or
   *  - (WEBGL2) format of buffer
   * @param {Number} offset - (WEBGL2) offset from start of buffer
   * @parameters - temporary settings to be applied, can be used to supply pixel store settings.
   */
  // eslint-disable-next-line max-statements, complexity
  setImageData(options: SetImageDataOptions) {
    if (this.props.dimension === '3d' || this.props.dimension === '2d-array') {
      return this.setImageData3D(options);
    }

    this.trackDeallocatedMemory('Texture');

    const {
      target = this.target,
      pixels = null,
      level = 0,
      glFormat = this.glFormat,
      offset = 0,
      parameters = {} as Record<GL, any>
    } = options;

    let {
      data = null,
      type = this.type,
      width = this.width,
      height = this.height,
      dataFormat = this.dataFormat,
      compressed = false
    } = options;

    // pixels variable is  for API compatibility purpose
    if (!data) {
      data = pixels;
    }

    ({type, dataFormat, compressed, width, height} = this._deduceParameters({
      format: this.props.format,
      type,
      dataFormat,
      compressed,
      data,
      width,
      height
    }));

    const {gl} = this;
    gl.bindTexture(this.target, this.handle);

    let dataType = null;
    ({data, dataType} = this._getDataType({data, compressed}));

    withGLParameters(this.gl, parameters, () => {
      switch (dataType) {
        case 'null':
          gl.texImage2D(
            target,
            level,
            glFormat,
            width,
            height,
            0 /* border*/,
            dataFormat,
            type,
            data
          );
          break;
        case 'typed-array':
          gl.texImage2D(
            target,
            level,
            glFormat,
            width,
            height,
            0, // border (must be 0)
            dataFormat,
            type,
            data,
            offset
          );
          break;
        case 'buffer':
          // WebGL2 enables creating textures directly from a WebGL buffer
          this.device.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, data.handle || data);
          this.device.gl.texImage2D(
            target,
            level,
            glFormat,
            width,
            height,
            0 /* border*/,
            dataFormat,
            type,
            offset
          );
          this.device.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, null);
          break;
        case 'browser-object':
          gl.texImage2D(
            target,
            level,
            glFormat,
            width,
            height,
            0 /* border*/,
            dataFormat,
            type,
            data
          );
          break;
        case 'compressed':
          for (const [levelIndex, levelData] of data.entries()) {
            gl.compressedTexImage2D(
              target,
              levelIndex,
              levelData.format,
              levelData.width,
              levelData.height,
              0 /* border, must be 0 */,
              levelData.data
            );
          }

          break;
        default:
          assert(false, 'Unknown image data type');
      }
    });

    if (data && data.byteLength) {
      this.trackAllocatedMemory(data.byteLength, 'Texture');
    } else {
      const bytesPerPixel = getTextureFormatBytesPerPixel(this.props.format);
      this.trackAllocatedMemory(this.width * this.height * bytesPerPixel, 'Texture');
    }

    this.loaded = true;

    return this;
  }

  /**
   * Redefines an area of an existing texture
   * Note: does not allocate storage
   * Redefines an area of an existing texture
   */
  setSubImageData({
    target = this.target,
    pixels = null,
    data = null,
    x = 0,
    y = 0,
    width = this.width,
    height = this.height,
    level = 0,
    glFormat = this.glFormat,
    type = this.type,
    dataFormat = this.dataFormat,
    compressed = false,
    offset = 0,
    parameters = {} as Record<GL, any>
  }: SetSubImageDataOptions) {
    ({type, dataFormat, compressed, width, height} = this._deduceParameters({
      format: this.props.format,
      type,
      dataFormat,
      compressed,
      data,
      width,
      height
    }));

    assert(this.depth === 1, 'texSubImage not supported for 3D textures');

    // pixels variable is  for API compatibility purpose
    if (!data) {
      data = pixels;
    }

    // Support ndarrays
    if (data && data.data) {
      const ndarray = data;
      data = ndarray.data;
      width = ndarray.shape[0];
      height = ndarray.shape[1];
    }

    // Support buffers
    if (data instanceof WEBGLBuffer) {
      data = data.handle;
    }

    this.gl.bindTexture(this.target, this.handle);

    withGLParameters(this.gl, parameters, () => {
      // TODO - x,y parameters
      if (compressed) {
        this.gl.compressedTexSubImage2D(target, level, x, y, width, height, glFormat, data);
      } else if (data === null) {
        this.gl.texSubImage2D(target, level, x, y, width, height, dataFormat, type, null);
      } else if (ArrayBuffer.isView(data)) {
        this.gl.texSubImage2D(target, level, x, y, width, height, dataFormat, type, data, offset);
      } else if (typeof WebGLBuffer !== 'undefined' && data instanceof WebGLBuffer) {
        // WebGL2 allows us to create texture directly from a WebGL buffer
        // This texImage2D signature uses currently bound GL.PIXEL_UNPACK_BUFFER
        this.device.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, data);
        this.device.gl.texSubImage2D(target, level, x, y, width, height, dataFormat, type, offset);
        this.device.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, null);
      } else {
        // Assume data is a browser supported object (ImageData, Canvas, ...)
        this.device.gl.texSubImage2D(target, level, x, y, width, height, dataFormat, type, data);
      }
    });

    this.gl.bindTexture(this.target, null);
  }

  /**
   * Defines a two-dimensional texture image or cube-map texture image with
   * pixels from the current framebuffer (rather than from client memory).
   * (gl.copyTexImage2D wrapper)
   *
   * Note that binding a texture into a Framebuffer's color buffer and
   * rendering can be faster.
   */
  copyFramebuffer(opts = {}) {
    log.error(
      'Texture.copyFramebuffer({...}) is no logner supported, use copyToTexture(source, target, opts})'
    )();
    return null;
  }

  getActiveUnit(): number {
    return this.gl.getParameter(GL.ACTIVE_TEXTURE) - GL.TEXTURE0;
  }

  bind(textureUnit = this.textureUnit) {
    const {gl} = this;

    if (textureUnit !== undefined) {
      this.textureUnit = textureUnit;
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
    }

    gl.bindTexture(this.target, this.handle);
    return textureUnit;
  }

  unbind(textureUnit = this.textureUnit) {
    const {gl} = this;

    if (textureUnit !== undefined) {
      this.textureUnit = textureUnit;
      gl.activeTexture(gl.TEXTURE0 + textureUnit);
    }

    gl.bindTexture(this.target, null);
    return textureUnit;
  }

  // PRIVATE METHODS

  _getDataType({data, compressed = false}) {
    if (compressed) {
      return {data, dataType: 'compressed'};
    }
    if (data === null) {
      return {data, dataType: 'null'};
    }
    if (ArrayBuffer.isView(data)) {
      return {data, dataType: 'typed-array'};
    }
    if (data instanceof WEBGLBuffer) {
      return {data: data.handle, dataType: 'buffer'};
    }
    // Raw WebGL handle (not a luma wrapper)
    if (typeof WebGLBuffer !== 'undefined' && data instanceof WebGLBuffer) {
      return {data, dataType: 'buffer'};
    }
    // Assume data is a browser supported object (ImageData, Canvas, ...)
    return {data, dataType: 'browser-object'};
  }

  // HELPER METHODS

  _deduceParameters(opts: WEBGLTextureProps) {
    const {format, data} = opts;
    let {width, height, dataFormat, type, compressed} = opts;

    // Deduce format and type from format
    const parameters = getWebGLTextureParameters(format);
    dataFormat = dataFormat || parameters.dataFormat;
    type = type || parameters.type;
    compressed = compressed || parameters.compressed;

    ({width, height} = this._deduceImageSize(data, width, height));

    return {dataFormat, type, compressed, width, height, format, data};
  }

  // eslint-disable-next-line complexity
  _deduceImageSize(data, width, height): {width: number; height: number} {
    let size;

    if (typeof ImageData !== 'undefined' && data instanceof ImageData) {
      size = {width: data.width, height: data.height};
    } else if (typeof HTMLImageElement !== 'undefined' && data instanceof HTMLImageElement) {
      size = {width: data.naturalWidth, height: data.naturalHeight};
    } else if (typeof HTMLCanvasElement !== 'undefined' && data instanceof HTMLCanvasElement) {
      size = {width: data.width, height: data.height};
    } else if (typeof ImageBitmap !== 'undefined' && data instanceof ImageBitmap) {
      size = {width: data.width, height: data.height};
    } else if (typeof HTMLVideoElement !== 'undefined' && data instanceof HTMLVideoElement) {
      size = {width: data.videoWidth, height: data.videoHeight};
    } else if (!data) {
      size = {width: width >= 0 ? width : 1, height: height >= 0 ? height : 1};
    } else {
      size = {width, height};
    }

    assert(size, 'Could not deduced texture size');
    assert(
      width === undefined || size.width === width,
      'Deduced texture width does not match supplied width'
    );
    assert(
      height === undefined || size.height === height,
      'Deduced texture height does not match supplied height'
    );

    return size;
  }

  // CUBE MAP METHODS

  /* eslint-disable max-statements, max-len */
  async setCubeMapImageData(options: {
    width: any;
    height: any;
    pixels: any;
    data: any;
    format?: any;
    type?: any;
  }): Promise<void> {
    const {gl} = this;

    const {width, height, pixels, data, format = GL.RGBA, type = GL.UNSIGNED_BYTE} = options;
    const imageDataMap = pixels || data;

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

    const resolvedFaces = await Promise.all(
      WEBGLTexture.FACES.map(face => {
        const facePixels = imageDataMap[face];
        return Promise.all(Array.isArray(facePixels) ? facePixels : [facePixels]);
      })
    );

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
          gl.texImage2D(face, lodLevel, format, width, height, 0 /* border*/, format, type, image);
        } else {
          gl.texImage2D(face, lodLevel, format, format, type, image);
        }
      });
    });

    this.unbind();
  }

  /** @todo update this method to accept LODs */
  setImageDataForFace(options) {
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

    return this;
  }

  /** Image 3D copies from Typed Array or WebGLBuffer */
  setImageData3D(options: SetImageData3DOptions) {
    const {
      level = 0,
      dataFormat,
      format,
      type, // = GL.UNSIGNED_BYTE,
      width,
      height,
      depth = 1,
      offset = 0,
      data,
      parameters = {}
    } = options;

    this.trackDeallocatedMemory('Texture');

    this.gl.bindTexture(this.target, this.handle);

    const webglTextureFormat = getWebGLTextureParameters(format);

    withGLParameters(this.gl, parameters, () => {
      if (ArrayBuffer.isView(data)) {
        this.gl.texImage3D(
          this.target,
          level,
          webglTextureFormat.format,
          width,
          height,
          depth,
          0 /* border, must be 0 */,
          webglTextureFormat.dataFormat,
          webglTextureFormat.type, // dataType: getWebGL,
          data
        );
      }

      if (data instanceof WEBGLBuffer) {
        this.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, data.handle);
        this.gl.texImage3D(
          this.target,
          level,
          dataFormat,
          width,
          height,
          depth,
          0 /* border, must be 0 */,
          format,
          type,
          offset
        );
      }
    });

    if (data && data.byteLength) {
      this.trackAllocatedMemory(data.byteLength, 'Texture');
    } else {
      const bytesPerPixel = getTextureFormatBytesPerPixel(this.props.format);
      this.trackAllocatedMemory(this.width * this.height * this.depth * bytesPerPixel, 'Texture');
    }

    this.loaded = true;

    return this;
  }

  // RESOURCE METHODS

  /**
   * Sets sampler parameters on texture
   */
  _setSamplerParameters(parameters: GLSamplerParameters): void {
    // NPOT parameters may populate an empty object
    if (isObjectEmpty(parameters)) {
      return;
    }

    logParameters(parameters);

    this.gl.bindTexture(this.target, this.handle);
    for (const [pname, pvalue] of Object.entries(parameters)) {
      const param = Number(pname) as GL.TEXTURE_MIN_LOD | GL.TEXTURE_MAX_LOD;
      const value = pvalue;

      // Apparently there are integer/float conversion issues requires two parameter setting functions in JavaScript.
      // For now, pick the float version for parameters specified as GLfloat.
      switch (param) {
        case GL.TEXTURE_MIN_LOD:
        case GL.TEXTURE_MAX_LOD:
          this.gl.texParameterf(this.target, param, value);
          break;

        default:
          this.gl.texParameteri(this.target, param, value);
          break;
      }
    }
    this.gl.bindTexture(this.target, null);
    return;
  }
}

// HELPERS

function getWebGLTextureTarget(props: TextureProps) {
  switch (props.dimension) {
    // supported in WebGL
    case '2d':
      return GL.TEXTURE_2D;
    case 'cube':
      return GL.TEXTURE_CUBE_MAP;
    // supported in WebGL2
    case '2d-array':
      return GL.TEXTURE_2D_ARRAY;
    case '3d':
      return GL.TEXTURE_3D;
    // not supported in any WebGL version
    case '1d':
    case 'cube-array':
    default:
      throw new Error(props.dimension);
  }
}

function logParameters(parameters: Record<number, GL | number>) {
  log.log(1, 'texture sampler parameters', parameters)();
}
