/* eslint-disable no-inline-comments, max-len */
import GL, {WebGLBuffer, WebGL2RenderingContext} from './api';
import {withParameters, assertWebGL2Context} from './context';
import Resource from './resource';
import Buffer from './buffer';
import {uid} from '../utils';
import assert from 'assert';

// Legal combinations for internalFormat, format and type
const TEXTURE_FORMATS = {
  [GL.RGB]: {dataFormat: GL.RGB, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_5_6_5]},
  [GL.RGBA]: {dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_4_4_4_4, GL.UNSIGNED_SHORT_5_5_5_1]},
  [GL.LUMINANCE_ALPHA]: {dataFormat: GL.LUMINANCE_ALPHA, types: [GL.UNSIGNED_BYTE]},
  [GL.LUMINANCE]: {dataFormat: GL.LUMINANCE, types: [GL.UNSIGNED_BYTE]},
  [GL.ALPHA]: {dataFormat: GL.ALPHA, types: [GL.UNSIGNED_BYTE]},
  [GL.R8]: {dataFormat: GL.RED, types: [GL.UNSIGNED_BYTE]},
  [GL.R16F]: {dataFormat: GL.RED, types: [GL.HALF_FLOAT, GL.FLOAT]},
  [GL.R32F]: {dataFormat: GL.RED, types: [GL.FLOAT]},
  [GL.R8UI]: {dataFormat: GL.RED_INTEGER, types: [GL.UNSIGNED_BYTE]},
  [GL.RG8]: {dataFormat: GL.RG, types: [GL.UNSIGNED_BYTE]},
  [GL.RG16F]: {dataFormat: GL.RG, types: [GL.HALF_FLOAT, GL.FLOAT]},
  [GL.RG32F]: {dataFormat: GL.RG, types: [GL.FLOAT]},
  [GL.RG8UI]: {dataFormat: GL.RG_INTEGER, types: [GL.UNSIGNED_BYTE]},
  [GL.RGB8]: {dataFormat: GL.RGB, types: [GL.UNSIGNED_BYTE]},
  [GL.SRGB8]: {dataFormat: GL.RGB, types: [GL.UNSIGNED_BYTE]},
  [GL.RGB565]: {dataFormat: GL.RGB, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_5_6_5]},
  [GL.R11F_G11F_B10F]: {dataFormat: GL.RGB, types: [GL.UNSIGNED_INT_10F_11F_11F_REV, GL.HALF_FLOAT, GL.FLOAT]},
  [GL.RGB9_E5]: {dataFormat: GL.RGB, types: [GL.HALF_FLOAT, GL.FLOAT]},
  [GL.RGB16FG]: {dataFormat: GL.RGB, types: [GL.HALF_FLOAT, GL.FLOAT]},
  [GL.RGB32F]: {dataFormat: GL.RGB, types: [GL.FLOAT]},
  [GL.RGB8UI]: {dataFormat: GL.RGB_INTEGER, types: [GL.UNSIGNED_BYTE]},
  [GL.RGBA8]: {dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE]},
  [GL.SRGB8_ALPHA8]: {dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE]},
  [GL.RGB5_A1]: {dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_5_5_5_1]},
  [GL.RGBA4]: {dataFormat: GL.RGBA, types: [GL.UNSIGNED_BYTE, GL.UNSIGNED_SHORT_4_4_4_4]},
  [GL.RGBA16F]: {dataFormat: GL.RGBA, types: [GL.HALF_FLOAT, GL.FLOAT]},
  [GL.RGBA32F]: {dataFormat: GL.RGBA, types: [GL.FLOAT]},
  [GL.RGBA8UI]: {dataFormat: GL.RGBA_INTEGER, types: [GL.UNSIGNED_BYTE]},

  // WEBGL_compressed_texture_s3tc

  [GL.COMPRESSED_RGB_S3TC_DXT1_EXT]: {compressed: true},
  [GL.COMPRESSED_RGBA_S3TC_DXT1_EXT]: {compressed: true},
  [GL.COMPRESSED_RGBA_S3TC_DXT3_EXT]: {compressed: true},
  [GL.COMPRESSED_RGBA_S3TC_DXT5_EXT]: {compressed: true},

  // WEBGL_compressed_texture_es3

  [GL.COMPRESSED_R11_EAC]: {compressed: true},
  [GL.COMPRESSED_SIGNED_R11_EAC]: {compressed: true},
  [GL.COMPRESSED_RG11_EAC]: {compressed: true},
  [GL.COMPRESSED_SIGNED_RG11_EAC]: {compressed: true},
  [GL.COMPRESSED_RGB8_ETC2]: {compressed: true},
  [GL.COMPRESSED_RGBA8_ETC2_EAC]: {compressed: true},
  [GL.COMPRESSED_SRGB8_ETC2]: {compressed: true},
  [GL.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC]: {compressed: true},
  [GL.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2]: {compressed: true},
  [GL.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2]: {compressed: true},

  // WEBGL_compressed_texture_pvrtc

  [GL.COMPRESSED_RGB_PVRTC_4BPPV1_IMG]: {compressed: true},
  [GL.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG]: {compressed: true},
  [GL.COMPRESSED_RGB_PVRTC_2BPPV1_IMG]: {compressed: true},
  [GL.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG]: {compressed: true},

  // WEBGL_compressed_texture_etc1

  [GL.COMPRESSED_RGB_ETC1_WEBGL]: {compressed: true},

  // WEBGL_compressed_texture_atc

  [GL.COMPRESSED_RGB_ATC_WEBGL]: {compressed: true},
  [GL.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL]: {compressed: true},
  [GL.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL]: {compressed: true}
};

// These are sampler parameters
const PARAMETERS = {
  // WEBGL1
  [GL.TEXTURE_MAG_FILTER]: {type: 'GLenum', webgl1: GL.LINEAR}, // texture magnification filter
  [GL.TEXTURE_MIN_FILTER]: {type: 'GLenum', webgl1: GL.NEAREST_MIPMAP_LINEAR}, // texture minification filter
  [GL.TEXTURE_WRAP_S]: {type: 'GLenum', webgl1: GL.REPEAT}, // texture wrapping function for texture coordinate s
  [GL.TEXTURE_WRAP_T]: {type: 'GLenum', webgl1: GL.REPEAT}, // texture wrapping function for texture coordinate t

  // Emulated parameters - These OpenGL parameters are not supported by OpenGL ES
  [GL.TEXTURE_WIDTH]: {webgl1: 0},
  [GL.TEXTURE_HEIGHT]: {webgl1: 0},

  // WebGL Extensions
  [GL.TEXTURE_MAX_ANISOTROPY_EXT]: {webgl1: 1.0, extension: 'EXT_texture_filter_anisotropic'},

  // WEBGL2
  [GL.TEXTURE_WRAP_R]: {type: 'GLenum', webgl2: GL.REPEAT}, // texture wrapping function for texture coordinate r
  [GL.TEXTURE_BASE_LEVEL]: {webgl2: 0}, // Texture mipmap level
  [GL.TEXTURE_MAX_LEVEL]: {webgl2: 1000}, // Maximum texture mipmap array level
  [GL.TEXTURE_COMPARE_FUNC]: {type: 'GLenum', webgl2: GL.LEQUAL}, // texture comparison function
  [GL.TEXTURE_COMPARE_MODE]: {type: 'GLenum', webgl2: GL.NONE}, // texture comparison mode
  [GL.TEXTURE_MIN_LOD]: {webgl2: -1000}, // minimum level-of-detail value
  [GL.TEXTURE_MAX_LOD]: {webgl2: 1000} // maximum level-of-detail value
};

export default class Texture extends Resource {

  // target cannot be modified by bind:
  // textures are special because when you first bind them to a target,
  // they get special information. When you first bind a texture as a
  // GL_TEXTURE_2D, you are actually setting special state in the texture.
  // You are saying that this texture is a 2D texture.
  // And it will always be a 2D texture; this state cannot be changed ever.
  // If you have a texture that was first bound as a GL_TEXTURE_2D,
  // you must always bind it as a GL_TEXTURE_2D;
  // attempting to bind it as GL_TEXTURE_1D will give rise to an error
  // (while run-time).
  constructor(gl, opts) {
    const {
      id = uid('texture'),
      handle,
      target
      // , magFilter, minFilter, wrapS, wrapT
    } = opts;

    super(gl, {id, handle});

    this.target = target;
    this.hasFloatTexture = gl.getExtension('OES_texture_float');
    this.textureUnit = undefined;
  }

  toString() {
    return `Texture(${this.id},${this.width}x${this.height})`;
  }

  /* eslint-disable brace-style */
  get width() { return this.opts.width; }
  get height() { return this.opts.width; }
  get format() { return this.opts.format; }
  get type() { return this.opts.type; }
  get dataFormat() { return this.opts.dataFormat; }
  get border() { return this.opts.border; }
  get mipmaps() { return this.opts.mipmaps; }

  /* eslint-disable max-len, max-statements */
  initialize(opts = {}) {
    const {
      data = null,
      format = GL.RGBA,
      type = GL.UNSIGNED_BYTE,
      dataFormat,
      border = 0,
      mipmaps = false,
      recreate = false,
      parameters = {},
      pixelStore = {}
    } = opts;

    let {
      width = 1,
      height = 1
    } = opts;

    // Deduce width and height
    ({width, height} = this._deduceParameters({data, width, height}));

    // Temporarily apply any pixel store settings and build textures
    withParameters(this.gl, pixelStore, () => {
      this.setImageData({data, width, height, format, type, dataFormat, border, mipmaps});

      if (mipmaps) {
        this.generateMipmap();
      }
    });

    // Set texture sampler parameters
    this.setParameters(parameters);

    // Store opts for accessors
    this.opts.width = width;
    this.opts.height = height;
    this.opts.format = format;
    this.opts.type = type;
    this.opts.dataFormat = dataFormat;
    this.opts.border = border;

    // TODO - Store data to enable auto recreate on context loss
    if (recreate) {
      this.opts.data = data;
    }
  }

  // Call to regenerate mipmaps after modifying texture(s)
  generateMipmap(params = {}) {
    this.gl.bindTexture(this.target, this.handle);
    withParameters(this.gl, params, () => {
      this.gl.generateMipmap(this.target);
    });
    this.gl.bindTexture(this.target, null);
    return this;
  }

  /**
   * Redefines an area of an existing texture
   * Note: does not allocate storage
   */
  subImage({
    target = this.target,
    pixels = null,
    data = null,
    x = 0,
    y = 0,
    width,
    height,
    level = 0,
    format = GL.RGBA,
    type,
    dataFormat,
    compressed = false,
    offset = 0,
    border = 0
  }) {
    ({type, dataFormat, compressed, width, height} = this._deduceParameters({
      format, type, dataFormat, compressed, data, width, height}));

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

    // TODO - x,y parameters
    if (compressed) {
      this.gl.compressedTexSubImage2D(target,
        level, x, y, width, height, format, data);
    } else if (data === null) {
      this.gl.texSubImage2D(target,
        level, format, width, height, border, dataFormat, type, null);
    } else if (ArrayBuffer.isView(data)) {
      this.gl.texSubImage2D(target,
        level, format, width, height, border, dataFormat, type, data);
    } else if (data instanceof WebGLBuffer) {
      // WebGL2 allows us to create texture directly from a WebGL buffer
      assertWebGL2Context(this.gl);
      // This texImage2D signature uses currently bound GL_PIXEL_UNPACK_BUFFER
      this.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, data);
      this.gl.texSubImage2D(target,
        level, format, width, height, border, format, type, offset);
      this.gl.bindBuffer(GL.GL_PIXEL_UNPACK_BUFFER, null);
    } else {
      // Assume data is a browser supported object (ImageData, Canvas, ...)
      this.gl.texSubImage2D(target, level, x, y, format, type, data);
    }

    this.gl.bindTexture(this.target, null);
  }
  /* eslint-enable max-len, max-statements, complexity */

  /**
   * Defines a two-dimensional texture image or cube-map texture image with
   * pixels from the current framebuffer (rather than from client memory).
   * (gl.copyTexImage2D wrapper)
   *
   * Note that binding a texture into a Framebuffer's color buffer and
   * rendering can be faster.
   */
  copyFramebuffer({
    target = this.target,
    framebuffer,
    offset = 0,
    x = 0,
    y = 0,
    width,
    height,
    level = 0,
    internalFormat = GL.RGBA,
    border = 0
  }) {
    if (framebuffer) {
      framebuffer.bind();
    }

    // target
    this.bind();
    this.gl.copyTexImage2D(
      this.target, level, internalFormat, x, y, width, height, border);
    this.unbind();

    if (framebuffer) {
      framebuffer.unbind();
    }
  }

  getActiveUnit() {
    return this.gl.getParameter(GL.ACTIVE_TEXTURE) - GL.TEXTURE0;
  }

  // target cannot be modified by bind:
  // textures are special because when you first bind them to a target,
  // they get special information. When you first bind a texture as a
  // GL_TEXTURE_2D, you are actually setting special state in the texture.
  // You are saying that this texture is a 2D texture.
  // And it will always be a 2D texture; this state cannot be changed ever.
  // If you have a texture that was first bound as a GL_TEXTURE_2D,
  // you must always bind it as a GL_TEXTURE_2D;
  // attempting to bind it as GL_TEXTURE_1D will give rise to an error
  // (while run-time).

  bind(textureUnit = this.textureUnit) {
    if (textureUnit === undefined) {
      throw new Error('Texture.bind: must specify texture unit');
    }
    this.textureUnit = textureUnit;
    this.gl.activeTexture(GL.TEXTURE0 + textureUnit);
    this.gl.bindTexture(this.target, this.handle);
    return textureUnit;
  }

  unbind() {
    if (this.textureUnit === undefined) {
      throw new Error('Texture.unbind: texture unit not specified');
    }
    this.gl.activeTexture(GL.TEXTURE0 + this.textureUnit);
    this.gl.bindTexture(this.target, null);
    return this.textureUnit;
  }

  // PRIVATE METHODS

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
   * @param {GLint} width -
   * @param {GLint} height -
   * @param {GLint} mipMapLevel -
   * @param {GLenum} format - format of image data.
   * @param {GLenum} type
   *  - format of array (autodetect from type) or
   *  - (WEBGL2) format of buffer
   * @param {Number} offset - (WEBGL2) offset from start of buffer
   * @param {GLint} border - must be 0.
   */
  /* eslint-disable max-len, max-statements, complexity */
  setImageData({
    target = this.target,
    pixels = null,
    data = null,
    width,
    height,
    level = 0,
    format = GL.RGBA,
    type,
    dataFormat,
    offset = 0,
    border = 0,
    compressed = false
  }) {
    ({type, dataFormat, compressed, width, height} = this._deduceParameters({
      format, type, dataFormat, compressed, data, width, height}));

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

    const {gl} = this;
    gl.bindTexture(this.target, this.handle);

    if (compressed) {
      gl.compressedTexImage2D(this.target,
        level, format, width, height, border, data);
    } else if (data === null) {
      gl.texImage2D(target,
        level, format, width, height, border, dataFormat, type, null);
    } else if (ArrayBuffer.isView(data)) {
      gl.texImage2D(target,
        level, format, width, height, border, dataFormat, type, data);
    } else if (data instanceof WebGLBuffer) {
      // WebGL2 allows us to create texture directly from a WebGL buffer
      assert(gl instanceof WebGL2RenderingContext, 'Requires WebGL2');
      // This texImage2D signature uses currently bound GL_PIXEL_UNPACK_BUFFER
      gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, data);
      gl.texImage2D(target,
        level, format, width, height, border, format, type, offset);
      gl.bindBuffer(GL.GL_PIXEL_UNPACK_BUFFER, null);
    } else {
      // Assume data is a browser supported object (ImageData, Canvas, ...)
      gl.texImage2D(target, level, format, format, type, data);
    }

    gl.bindTexture(this.target, null);
  }
  /* eslint-enable max-len, max-statements, complexity */

  // HELPER METHODS

  _deduceParameters(opts) {
    const {format, data} = opts;
    let {width, height, dataFormat, type, compressed} = opts;

    // Deduce format and type from format
    const textureFormat = TEXTURE_FORMATS[format];
    dataFormat = dataFormat || (textureFormat && textureFormat.dataFormat);
    type = type || (textureFormat && textureFormat.types[0]);

    // Deduce compression from format
    compressed = compressed || (textureFormat && textureFormat.compressed);

    ({width, height} = this._deduceImageSize({data, width, height}));

    return {dataFormat, type, compressed, width, height, format, data};
  }

  /* global ImageData, HTMLImageElement, HTMLCanvasElement, HTMLVideoElement */
  _deduceImageSize({data, width, height}) {
    let size;
    if (typeof ImageData !== 'undefined' && data instanceof ImageData) {
      size = {width: data.width, height: data.height};
    }
    else if (typeof HTMLImageElement !== 'undefined' && data instanceof HTMLImageElement) {
      size = {width: data.naturalWidth, height: data.naturalHeight};
    }
    else if (typeof HTMLCanvasElement !== 'undefined' && data instanceof HTMLCanvasElement) {
      size = {width: data.width, height: data.height};
    }
    else if (typeof HTMLVideoElement !== 'undefined' && data instanceof HTMLVideoElement) {
      size = {width: data.videoWidth, height: data.videoHeight};
    }
    if (width !== undefined || height !== undefined) {
      if (size && (size.width !== width || size.height !== height)) {
        throw new Error('Deduced size does not match supplied data element size');
      }
      size = {width, height};
    }
    assert(size && Number.isFinite(size.width) && Number.isFinite(size.height),
      'Failed to deduce texture size');

    return size;
  }

  // RESOURCE METHODS

  _createHandle() {
    return this.gl.createTexture();
  }

  _deleteHandle() {
    this.gl.deleteTexture(this.handle);
  }

  _getParameter(pname) {
    switch (pname) {
    case GL.TEXTURE_WIDTH:
      return this.opts.width;
    case GL.TEXTURE_HEIGHT:
      return this.opts.height;
    default:
      this.gl.bindTexture(this.target, this.handle);
      const value = this.gl.getTexParameter(this.target, pname);
      this.gl.bindTexture(this.target, null);
      return value;
    }
  }

  _setParameter(pname, param) {
    this.gl.bindTexture(this.target, this.handle);

    // Apparently there are some integer/float conversion rules that made
    // the WebGL committe expose two parameter setting functions in JavaScript.
    // For now, pick the float version for parameters specified as GLfloat.
    switch (pname) {
    case GL.TEXTURE_MIN_LOD:
    case GL.TEXTURE_MAX_LOD:
      this.gl.texParameterf(this.handle, pname, param);
      break;

    case GL.TEXTURE_WIDTH:
    case GL.TEXTURE_HEIGHT:
      throw new Error('Cannot set emulated parameter');

    default:
      this.gl.texParameteri(this.handle, pname, param);
      break;
    }

    this.gl.bindTexture(this.target, null);
    return this;
  }
}

Texture.PARAMETERS = PARAMETERS;
