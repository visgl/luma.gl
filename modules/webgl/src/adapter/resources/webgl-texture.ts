// luma.gl, MIT license
// Texture class.
// @todo
// - [ ] `compare` sampler params
// - [ ] `anisotropy` sampler param
// - [ ] 3d texture example broken
// - [ ] cube texture init params
// - [ ] video (external) textures
// - [ ] renderbuffers
// - [ ] https://developer.mozilla.org/en-US/docs/Web/API/EXT_texture_norm16

import {Device, TextureProps, Sampler, SamplerProps, SamplerParameters, isObjectEmpty} from '@luma.gl/api';
import {Texture, cast, log, assert, isPowerOfTwo, loadImage} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import type {WebGLSamplerParameters} from '../../types/webgl';
import {withParameters} from '../../context/state-tracker/with-parameters';
import {
  convertTextureFormatToWebGL,
  WEBGL_TEXTURE_FORMATS,
  DATA_FORMAT_CHANNELS,
  TYPE_SIZES
} from '../converters/texture-formats';
import {convertSamplerParametersToWebGL, updateSamplerParametersForNPOT} from '../converters/sampler-parameters';
import WEBGLSampler from './webgl-sampler';
import WebGLDevice from '../webgl-device';
import Buffer from '../../classes/webgl-buffer';

export type {TextureProps};

type SetImageData3DOptions = {
  level?: number;
  dataFormat?: any;
  width: number;
  height: number;
  depth?: number;
  border?: number;
  format: any;
  type?: any;
  offset?: number;
  data: any;
  parameters?: {};
};

// Polyfill
export default class WEBGLTexture extends Texture {
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
  readonly gl: WebGLRenderingContext;
  readonly gl2: WebGL2RenderingContext | null;
  readonly handle: WebGLTexture;

  data;

  width: number = undefined;
  height: number = undefined;
  depth: number = undefined;

  format = undefined;
  type = undefined;
  dataFormat = undefined;
  border = undefined;
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

  /** Sampler object (currently unused) */
  sampler: WEBGLSampler;

  /**
   * Program.draw() checks the loaded flag of all textures to avoid
   * Textures that are still loading from promises
   * Set to true as soon as texture has been initialized with valid data
   */
  loaded = false;
  _video;

  constructor(device: Device, props: TextureProps) {
    super(device, {format: GL.RGBA, ...props});

    this.device = cast<WebGLDevice>(device);
    this.gl = this.device.gl;
    this.gl2 = this.device.gl2;
    this.handle = this.props.handle || this.gl.createTexture();
    // @ts-expect-error Per SPECTOR docs
    this.handle.__SPECTOR_Metadata = {...this.props, data: typeof this.props.data}; // {name: this.props.id};

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

  destroy(): void {
    if (this.handle) {
      this.gl.deleteTexture(this.handle);
      this.removeStats();
      this.trackDeallocatedMemory('Texture');
      // @ts-expect-error
      this.handle = null;
    }
  }

  toString(): string {
    return `Texture(${this.id},${this.width}x${this.height})`;
  }

  // eslint-disable-next-line max-statements
  initialize(props: TextureProps = {}): this {
    // Cube textures
    if (this.props.dimension === 'cube') {
      return this.initializeCube(props);
    }

    let data = props.data;

    if (data instanceof Promise) {
      data.then((resolvedImageData) =>
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

    let {parameters = {}} = props;

    const {
      pixels = null,
      border = 0,
      recreate = false,
      pixelStore = {},
      textureUnit = undefined
    } = props;

    const format = convertTextureFormatToWebGL(props.format);

    // pixels variable is for API compatibility purpose
    if (!data) {
      // TODO - This looks backwards? Commenting out for now until we decide
      // which prop to use
      // log.deprecated('data', 'pixels')();
      data = pixels;
    }

    let {width, height, dataFormat, type, compressed = false, mipmaps = true} = props;
    const {depth = 0} = props;

    // Deduce width and height
    ({width, height, compressed, dataFormat, type} = this._deduceParameters({
      format,
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
    this.depth = depth;
    this.format = format;
    this.type = type;
    this.dataFormat = dataFormat;
    this.border = border;
    this.textureUnit = textureUnit;

    if (Number.isFinite(this.textureUnit)) {
      this.gl.activeTexture(GL.TEXTURE0 + this.textureUnit);
      this.gl.bindTexture(this.target, this.handle);
    }

    if (mipmaps && this.device.isWebGL1 && isNPOT(this.width, this.height)) {
      log.warn(`texture: ${this} is Non-Power-Of-Two, disabling mipmaps`)();
      mipmaps = false;
    }

    this.mipmaps = mipmaps;

    this.setImageData({
      data,
      width,
      height,
      depth,
      format,
      type,
      dataFormat,
      border,
      mipmaps,
      parameters: pixelStore,
      compressed
    });

    // Set texture sampler parameters
    this.setSampler(props.sampler);
    this._setSamplerParameters(parameters);

    if (mipmaps) {
      this.generateMipmap();
    }

    // TODO - Store data to enable auto recreate on context loss
    if (recreate) {
      this.data = data;
    }
    if (isVideo) {
      this._video = {
        video: data,
        parameters,
        // @ts-expect-error
        lastTime: data.readyState >= HTMLVideoElement.HAVE_CURRENT_DATA ? data.currentTime : -1
      };
    }

    return this;
  }

  initializeCube(props?: TextureProps): this {
    const {mipmaps = true, parameters = {}} = props;

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

    // TODO - technically, this is only needed in WebGL1. In WebGL2 we could always use the sampler.
    const parameters = convertSamplerParametersToWebGL(samplerProps);
    this._setSamplerParameters(parameters);
    return this;
  }

  /**
   * If size has changed, reinitializes with current format
   * @note note clears image and mipmaps
   */
  resize({height, width, mipmaps = false}): this {
    if (width !== this.width || height !== this.height) {
      return this.initialize({
        width,
        height,
        format: this.format,
        type: this.type,
        dataFormat: this.dataFormat,
        border: this.border,
        mipmaps
      });
    }
    return this;
  }

  /** Update external texture (video frame) */
  update(): this {
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
    if (this.device.isWebGL1 && isNPOT(this.width, this.height)) {
      log.warn(`texture: ${this} is Non-Power-Of-Two, disabling mipmaping`)();
      return this;
    }

    this.mipmaps = true;

    this.gl.bindTexture(this.target, this.handle);
    withParameters(this.gl, params, () => {
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
   * @param  border - must be 0.
   * @parameters - temporary settings to be applied, can be used to supply pixel store settings.
   */
  // eslint-disable-next-line max-statements, complexity
  setImageData(options) {
    if (this.props.dimension === '3d') {
      return this.setImageData3D(options);
    }

    this.trackDeallocatedMemory('Texture');

    const {
      target = this.target,
      pixels = null,
      level = 0,
      format = this.format,
      border = this.border,
      offset = 0,
      parameters = {}
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
      format,
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

    let gl2;

    withParameters(this.gl, parameters, () => {
      switch (dataType) {
        case 'null':
          gl.texImage2D(target, level, format, width, height, border, dataFormat, type, data);
          break;
        case 'typed-array':
          // Looks like this assert is not necessary, as offset is ignored under WebGL1
          // assert((offset === 0 || this.device.isWebGL2), 'offset supported in WebGL2 only');
          gl.texImage2D(
            target,
            level,
            format,
            width,
            height,
            border,
            dataFormat,
            type,
            data,
            // @ts-expect-error
            offset
          );
          break;
        case 'buffer':
          // WebGL2 enables creating textures directly from a WebGL buffer
          gl2 = this.device.assertWebGL2();
          gl2.bindBuffer(GL.PIXEL_UNPACK_BUFFER, data.handle || data);
          gl2.texImage2D(target, level, format, width, height, border, dataFormat, type, offset);
          gl2.bindBuffer(GL.PIXEL_UNPACK_BUFFER, null);
          break;
        case 'browser-object':
          if (this.device.isWebGL2) {
            gl.texImage2D(target, level, format, width, height, border, dataFormat, type, data);
          } else {
            gl.texImage2D(target, level, format, dataFormat, type, data);
          }
          break;
        case 'compressed':
          for (const [levelIndex, levelData] of data.entries()) {
            gl.compressedTexImage2D(
              target,
              levelIndex,
              levelData.format,
              levelData.width,
              levelData.height,
              border,
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
      // NOTE(Tarek): Default to RGBA bytes
      const channels = DATA_FORMAT_CHANNELS[this.dataFormat] || 4;
      const channelSize = TYPE_SIZES[this.type] || 1;

      this.trackAllocatedMemory(this.width * this.height * channels * channelSize, 'Texture');
    }

    this.loaded = true;

    return this;
  }

  /**
   * Redefines an area of an existing texture
   * Note: does not allocate storage
   * Redefines an area of an existing texture
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
   * @param  border - must be 0.
   * @parameters - temporary settings to be applied, can be used to supply pixel store settings.
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
    format = this.format,
    type = this.type,
    dataFormat = this.dataFormat,
    compressed = false,
    offset = 0,
    border = this.border,
    parameters = {}
  }) {
    ({type, dataFormat, compressed, width, height} = this._deduceParameters({
      format,
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
    if (data instanceof Buffer) {
      data = data.handle;
    }

    this.gl.bindTexture(this.target, this.handle);

    withParameters(this.gl, parameters, () => {
      // TODO - x,y parameters
      if (compressed) {
        this.gl.compressedTexSubImage2D(target, level, x, y, width, height, format, data);
      } else if (data === null) {
        this.gl.texSubImage2D(target, level, x, y, width, height, dataFormat, type, null);
      } else if (ArrayBuffer.isView(data)) {
        // const gl2 = this.device.assertWebGL2();
        // @ts-expect-error last offset parameter is ignored under WebGL1
        this.gl.texSubImage2D(target, level, x, y, width, height, dataFormat, type, data, offset);
      } else if (typeof WebGLBuffer !== 'undefined' && data instanceof WebGLBuffer) {
        // WebGL2 allows us to create texture directly from a WebGL buffer
        const gl2 = this.device.assertWebGL2();
        // This texImage2D signature uses currently bound GL.PIXEL_UNPACK_BUFFER
        gl2.bindBuffer(GL.PIXEL_UNPACK_BUFFER, data);
        gl2.texSubImage2D(target, level, x, y, width, height, dataFormat, type, offset);
        gl2.bindBuffer(GL.PIXEL_UNPACK_BUFFER, null);
      } else if (this.device.isWebGL2) {
        // Assume data is a browser supported object (ImageData, Canvas, ...)
        const gl2 = this.device.assertWebGL2();
        gl2.texSubImage2D(target, level, x, y, width, height, dataFormat, type, data);
      } else {
        this.gl.texSubImage2D(target, level, x, y, dataFormat, type, data);
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
    if (data instanceof Buffer) {
      return {data: data.handle, dataType: 'buffer'};
    }
    if (typeof WebGLBuffer !== 'undefined' && data instanceof WebGLBuffer) {
      return {data, dataType: 'buffer'};
    }
    // Assume data is a browser supported object (ImageData, Canvas, ...)
    return {data, dataType: 'browser-object'};
  }

  // HELPER METHODS

  _deduceParameters(opts) {
    const {format, data} = opts;
    let {width, height, dataFormat, type, compressed} = opts;

    // Deduce format and type from format
    const textureFormat = WEBGL_TEXTURE_FORMATS[format];
    dataFormat = dataFormat || (textureFormat && textureFormat.dataFormat);
    type = type || (textureFormat && textureFormat.types[0]);

    // Deduce compression from format
    compressed = compressed || (textureFormat && textureFormat.compressed);

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
    border?: number;
    format?: any;
    type?: any;
  }): Promise<void> {
    const {gl} = this;

    const {
      width,
      height,
      pixels,
      data,
      border = 0,
      format = GL.RGBA,
      type = GL.UNSIGNED_BYTE
    } = options;
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
      WEBGLTexture.FACES.map((face) => {
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
          gl.texImage2D(face, lodLevel, format, width, height, border, format, type, image);
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
      border = 0,
      format = GL.RGBA,
      type = GL.UNSIGNED_BYTE
      // generateMipmap = false // TODO
    } = options;

    const {gl} = this;

    const imageData = pixels || data;

    this.bind();
    if (imageData instanceof Promise) {
      imageData.then((resolvedImageData) =>
        this.setImageDataForFace(
          Object.assign({}, options, {
            face,
            data: resolvedImageData,
            pixels: resolvedImageData
          })
        )
      );
    } else if (this.width || this.height) {
      gl.texImage2D(face, 0, format, width, height, border, format, type, imageData);
    } else {
      gl.texImage2D(face, 0, format, format, type, imageData);
    }

    return this;
  }

  /** Image 3D copies from Typed Array or WebGLBuffer */
  setImageData3D({
    level = 0,
    dataFormat = GL.RGBA,
    width,
    height,
    depth = 1,
    border = 0,
    format,
    type = GL.UNSIGNED_BYTE,
    offset = 0,
    data,
    parameters = {}
  }: SetImageData3DOptions) {
    this.trackDeallocatedMemory('Texture');

    this.gl.bindTexture(this.target, this.handle);

    withParameters(this.gl, parameters, () => {
      if (ArrayBuffer.isView(data)) {
        // @ts-expect-error
        this.gl.texImage3D(
          this.target,
          level,
          dataFormat,
          width,
          height,
          depth,
          border,
          format,
          type,
          data
        );
      }

      if (data instanceof Buffer) {
        this.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, data.handle);
        // @ts-expect-error
        this.gl.texImage3D(
          this.target,
          level,
          dataFormat,
          width,
          height,
          depth,
          border,
          format,
          type,
          offset
        );
      }
    });

    if (data && data.byteLength) {
      this.trackAllocatedMemory(data.byteLength, 'Texture');
    } else {
      // NOTE(Tarek): Default to RGBA bytes
      const channels = DATA_FORMAT_CHANNELS[this.dataFormat] || 4;
      const channelSize = TYPE_SIZES[this.type] || 1;

      this.trackAllocatedMemory(
        this.width * this.height * this.depth * channels * channelSize,
        'Texture'
      );
    }

    this.loaded = true;

    return this;
  }

  // RESOURCE METHODS

  /**
   * Sets sampler parameters on texture
   * @note: Applies NPOT workaround if appropriate
   */
  _setSamplerParameters(parameters: WebGLSamplerParameters) {
    // Work around WebGL1 sampling restrictions on NPOT textures
    if (this.device.isWebGL1 && isNPOT(this.width, this.height)) {
      parameters = updateSamplerParametersForNPOT(parameters);
    }

    // NPOT parameters may populate an empty object
    if (isObjectEmpty(parameters)) {
      return;
    }

    logParameters(parameters);

    this.gl.bindTexture(this.target, this.handle);
    for (const [pname, pvalue] of Object.entries(parameters)) {
      const param = Number(pname);
      let value = pvalue;

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
    return this;
  }

  /** @deprecated For LegacyTexture subclass */
  protected _getWebGL1NPOTParameterOverride(pname: number, value: number): number {
    // NOTE: Apply NPOT workaround
    const npot = this.device.isWebGL1 && isNPOT(this.width, this.height);
    if (npot) {
      switch (pname) {
        case GL.TEXTURE_MIN_FILTER:
          if (value !== GL.LINEAR && value !== GL.NEAREST) {
            // log.warn(`texture: ${this} is Non-Power-Of-Two, forcing TEXTURE_MIN_FILTER to LINEAR`)();
            return GL.LINEAR;
          }
          break;
        case GL.TEXTURE_WRAP_S:
        case GL.TEXTURE_WRAP_T:
          // if (value !== GL.CLAMP_TO_EDGE) { log.warn(`texture: ${this} is Non-Power-Of-Two, ${getKey(this.gl, pname)} to CLAMP_TO_EDGE`)(); }
          return GL.CLAMP_TO_EDGE;
        default:
          break;
      }
    }
    return value;
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

function isNPOT(width: number, height: number): boolean {
  // Width and height not available, avoid classifying as NPOT texture
  if (!width || !height) {
    return false;
  }
  return !isPowerOfTwo(width) || !isPowerOfTwo(height);
}

function logParameters(parameters: Record<number, GL | number>) {
  log.log(1, 'texture sampler parameters', parameters)();
  for (const [pname, pvalue] of Object.entries(parameters)) {
  }
}
