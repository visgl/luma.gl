import {WebGL, WebGLRenderingContext, WebGL2RenderingContext, WebGLBuffer}
  from './webgl-types';
import {glTypeFromArray} from './webgl-checks';
import {glCheckError} from './context';
import Buffer from './buffer';
import Framebuffer from './framebuffer';
import assert from 'assert';

const ERR_CONTEXT = 'Invalid WebGLRenderingContext';
const ERR_WEBGL2 = 'WebGL2 required';

export class Texture {

  /* eslint-disable max-statements */
  constructor(gl, {
    unpackFlipY = true,
    magFilter = WebGL.NEAREST,
    minFilter = WebGL.NEAREST,
    wrapS = WebGL.CLAMP_TO_EDGE,
    wrapT = WebGL.CLAMP_TO_EDGE,
    target = WebGL.TEXTURE_2D,
    handle,
    ...opts
  }) {
    assert(gl instanceof WebGLRenderingContext, ERR_CONTEXT);

    this.handle = handle || gl.createTexture();
    if (!this.handle) {
      glCheckError(gl);
    }

    this.gl = gl;
    this.target = target;
    this.hasFloatTexture = gl.getExtension('OES_texture_float');
    this.width = null;
    this.height = null;
    this.userData = {};

    this.setPixelStorageModes({...opts, unpackFlipY});
    this.setParameters({...opts, magFilter, minFilter, wrapS, wrapT});
  }
  /* eslint-enable max-statements */

  delete() {
    const {gl} = this;
    if (this.handle) {
      gl.deleteTexture(this.handle);
      this.handle = null;
      glCheckError(gl);
    }
    return this;
  }

  generateMipmap() {
    const {gl} = this;
    this.bind();
    this.gl.generateMipmap(this.target);
    glCheckError(gl);
    return this.unbind();
  }

  /*
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
  /* eslint-disable max-len, max-statements */
  setImageData({
    target = this.target,
    pixels = null,
    data = null,
    width,
    height,
    mipmapLevel = 0,
    format = WebGL.RGBA,
    type,
    offset = 0,
    border = 0,
    ...opts
  }) {
    const {gl} = this;

    pixels = pixels || data;

    // Support ndarrays
    if (pixels && pixels.data) {
      const ndarray = pixels;
      pixels = ndarray.data;
      width = ndarray.shape[0];
      height = ndarray.shape[1];
    }

    this.bind();

    if (pixels === null) {

      // Create an minimal texture
      width = width || 1;
      height = height || 1;
      type = type || WebGL.UNSIGNED_BYTE;
      pixels = new Uint8Array([255, 0, 0, 1]);
      gl.texImage2D(target,
        mipmapLevel, format, width, height, border, format, type, pixels);
      this.width = width;
      this.height = height;

    } else if (ArrayBuffer.isView(pixels)) {

      // Create from a typed array
      assert(width > 0 && height > 0, 'Texture2D: Width and height required');
      type = type || glTypeFromArray(pixels);
      // TODO - WebGL2 check?
      if (type === gl.FLOAT && !this.hasFloatTexture) {
        throw new Error('floating point textures are not supported.');
      }
      gl.texImage2D(target,
        mipmapLevel, format, width, height, border, format, type, pixels);
      this.width = width;
      this.height = height;

    } else if (pixels instanceof WebGLBuffer || pixels instanceof Buffer) {

      // WebGL2 allows us to create texture directly from a WebGL buffer
      assert(gl instanceof WebGL2RenderingContext, 'Requires WebGL2');
      type = type || WebGL.UNSIGNED_BYTE;
      // This texImage2D signature uses currently bound GL_PIXEL_UNPACK_BUFFER
      const buffer = Buffer.makeFrom(pixels);
      gl.bindBuffer(WebGL.PIXEL_UNPACK_BUFFER, buffer.handle);
      gl.texImage2D(target,
        mipmapLevel, format, width, height, border, format, type, offset);
      gl.bindBuffer(WebGL.GL_PIXEL_UNPACK_BUFFER, null);
      this.width = width;
      this.height = height;

    } else {

      // Assume pixels is a browser supported object (ImageData, Canvas, ...)
      assert(width === undefined && height === undefined,
        'Texture2D.setImageData: Width and height must not be provided');
      type = type || WebGL.UNSIGNED_BYTE;
      const imageSize = this._deduceImageSize(pixels);
      gl.texImage2D(target, mipmapLevel, format, format, type, pixels);
      this.width = imageSize.width;
      this.height = imageSize.height;
    }

    glCheckError(gl);
    this.unbind();
    return this;
  }

  /* global ImageData, HTMLImageElement, HTMLCanvasElement, HTMLVideoElement */
  _deduceImageSize(image) {
    if (typeof ImageData !== 'undefined' && image instanceof ImageData) {
      return {width: image.width, height: image.height};
    } else if (typeof HTMLImageElement !== 'undefined' &&
      image instanceof HTMLImageElement) {
      return {width: image.naturalWidth, height: image.naturalHeight};
    } else if (typeof HTMLCanvasElement !== 'undefined' &&
      image instanceof HTMLCanvasElement) {
      return {width: image.width, height: image.height};
    } else if (typeof HTMLVideoElement !== 'undefined' &&
      image instanceof HTMLVideoElement) {
      return {width: image.videoWidth, height: image.videoHeight};
    }
    throw new Error('Failed to deduce image size');
  }
  /**
   * Batch update pixel storage modes
   * @param {GLint} packAlignment - Packing of pixel data in memory (1,2,4,8)
   * @param {GLint} unpackAlignment - Unpacking pixel data from memory(1,2,4,8)
   * @param {GLboolean} unpackFlipY -  Flip source data along its vertical axis
   * @param {GLboolean} unpackPremultiplyAlpha -
   *   Multiplies the alpha channel into the other color channels
   * @param {GLenum} unpackColorspaceConversion -
   *   Default color space conversion or no color space conversion.
   *
   * @param {GLint} packRowLength -
   *  Number of pixels in a row.
   * @param {} packSkipPixels -
   *   Number of pixels skipped before the first pixel is written into memory.
   * @param {} packSkipRows -
   *   Number of rows of pixels skipped before first pixel is written to memory.
   * @param {} unpackRowLength -
   *   Number of pixels in a row.
   * @param {} unpackImageHeight -
   *   Image height used for reading pixel data from memory
   * @param {} unpackSkipPixels -
   *   Number of pixel images skipped before first pixel is read from memory
   * @param {} unpackSkipRows -
   *   Number of rows of pixels skipped before first pixel is read from memory
   * @param {} unpackSkipImages -
   *   Number of pixel images skipped before first pixel is read from memory
   */
  /* eslint-disable complexity, max-statements */
  setPixelStorageModes({
    packAlignment,
    unpackAlignment,
    unpackFlipY,
    unpackPremultiplyAlpha,
    unpackColorspaceConversion,
    // WEBGL2
    packRowLength,
    packSkipPixels,
    packSkipRows,
    unpackRowLength,
    unpackImageHeight,
    unpackSkipPixels,
    unpackSkipRows,
    unpackSkipImages
  } = {}) {
    const {gl} = this;

    this.bind();

    if (packAlignment) {
      gl.pixelStorei(gl.PACK_ALIGNMENT, packAlignment);
    }
    if (unpackAlignment) {
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, unpackAlignment);
    }
    if (unpackFlipY) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, unpackFlipY);
    }
    if (unpackPremultiplyAlpha) {
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, unpackPremultiplyAlpha);
    }
    if (unpackColorspaceConversion) {
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,
        unpackColorspaceConversion);
    }

    // WEBGL2
    if (packRowLength) {
      gl.pixelStorei(gl.PACK_ROW_LENGTH, packRowLength);
    }
    if (packSkipPixels) {
      gl.pixelStorei(gl.PACK_SKIP_PIXELS, packSkipPixels);
    }
    if (packSkipRows) {
      gl.pixelStorei(gl.PACK_SKIP_ROWS, packSkipRows);
    }
    if (unpackRowLength) {
      gl.pixelStorei(gl.UNPACK_ROW_LENGTH, unpackRowLength);
    }
    if (unpackImageHeight) {
      gl.pixelStorei(gl.UNPACK_IMAGE_HEIGHT, unpackImageHeight);
    }
    if (unpackSkipPixels) {
      gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, unpackSkipPixels);
    }
    if (unpackSkipRows) {
      gl.pixelStorei(gl.UNPACK_SKIP_ROWS, unpackSkipRows);
    }
    if (unpackSkipImages) {
      gl.pixelStorei(gl.UNPACK_SKIP_IMAGES, unpackSkipImages);
    }

    this.unbind();
    return this;
  }
  /* eslint-enable complexity, max-statements */

  /**
   * Batch update sampler settings
   *
   * @param {GLenum} magFilter - texture magnification filter.
   * @param {GLenum} minFilter - texture minification filter
   * @param {GLenum} wrapS - texture wrapping function for texture coordinate s.
   * @param {GLenum} wrapT - texture wrapping function for texture coordinate t.
   * WEBGL2 only:
   * @param {GLenum} wrapR - texture wrapping function for texture coordinate r.
   * @param {GLenum} compareFunc - texture comparison function.
   * @param {GLenum} compareMode - texture comparison mode.
   * @param {GLfloat} minLOD - minimum level-of-detail value.
   * @param {GLfloat} maxLOD - maximum level-of-detail value.
   * @param {GLfloat} baseLevel - Texture mipmap level
   * @param {GLfloat} maxLevel - Maximum texture mipmap array level
   */
  /* eslint-disable complexity, max-statements */
  setParameters({
    magFilter,
    minFilter,
    wrapS,
    wrapT,
    // WEBGL2
    wrapR,
    baseLevel,
    maxLevel,
    minLOD,
    maxLOD,
    compareFunc,
    compareMode
  }) {
    const {gl} = this;
    this.bind();

    if (magFilter) {
      gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, magFilter);
    }
    if (minFilter) {
      gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, minFilter);
    }
    if (wrapS) {
      gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, wrapS);
    }
    if (wrapT) {
      gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, wrapT);
    }
    // WEBGL2
    if (wrapR) {
      gl.texParameteri(this.target, gl.TEXTURE_WRAP_R, wrapR);
    }
    if (baseLevel) {
      gl.texParameteri(this.target, gl.TEXTURE_BASE_LEVEL, baseLevel);
    }
    if (maxLevel) {
      gl.texParameteri(this.target, gl.TEXTURE_MAX_LEVEL, maxLevel);
    }
    if (compareFunc) {
      gl.texParameteri(this.target, gl.TEXTURE_COMPARE_FUNC, compareFunc);
    }
    if (compareMode) {
      gl.texParameteri(this.target, gl.TEXTURE_COMPARE_MODE, compareMode);
    }
    if (minLOD) {
      gl.texParameterf(this.target, gl.TEXTURE_MIN_LOD, minLOD);
    }
    if (maxLOD) {
      gl.texParameterf(this.target, gl.TEXTURE_MAX_LOD, maxLOD);
    }

    this.unbind();
    return this;
  }
  /* eslint-enable complexity, max-statements */

  getParameters() {
    const {gl} = this;
    this.bind();
    const webglParams = {
      magFilter: gl.getTexParameter(this.target, gl.TEXTURE_MAG_FILTER),
      minFilter: gl.getTexParameter(this.target, gl.TEXTURE_MIN_FILTER),
      wrapS: gl.getTexParameter(this.target, gl.TEXTURE_WRAP_S),
      wrapT: gl.getTexParameter(this.target, gl.TEXTURE_WRAP_T)
    };
    this.unbind();
    return webglParams;
  }

  // Deprecated methods

  image2D({
    pixels,
    format = WebGL.RGBA,
    type = WebGL.UNSIGNED_BYTE
  }) {
    const {gl} = this;

    // TODO - WebGL2 check?
    if (type === gl.FLOAT && !this.hasFloatTexture) {
      throw new Error('floating point textures are not supported.');
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, format, format, type, pixels);
    glCheckError(gl);
    return this;
  }

  update(opts) {
    throw new Error('Texture.update() is deprecated()');
  }
}

export class Texture2D extends Texture {

  static makeFrom(gl, object = {}) {
    return object instanceof Texture2D ? object :
      // Use .handle (e.g from stack.gl's gl-buffer), else use buffer directly
      new Texture2D(gl, {handle: object.handle || object});
  }

  static makeFromSolidColor(gl, [r = 0, g = 0, b = 0, a = 1]) {
    return new Texture2D(gl, {
      pixels: new Uint8Array([r, g, b, a]),
      width: 1,
      format: gl.RGBA,
      magFilter: gl.NEAREST,
      minFilter: gl.NEAREST
    });
  }

  static makeFromPixelArray(gl, {dataArray, format, width, height, ...opts}) {
    // Don't need to do this if the data is already in a typed array
    const dataTypedArray = new Uint8Array(dataArray);
    return new Texture2D(gl, {
      pixels: dataTypedArray,
      width: 1,
      format: gl.RGBA,
      ...opts
    });
  }

  /**
   * @classdesc
   * 2D WebGL Texture
   *
   * @class
   * Constructor will initialize your texture.
   * @param {WebGLRenderingContext} gl - gl context
   * @param {Image||ArrayBuffer||null} opts.data=
   * @param {GLint} width - width of texture
   * @param {GLint} height - height of texture
   */
  constructor(gl, opts = {}) {
    assert(gl instanceof WebGLRenderingContext, ERR_CONTEXT);

    super(gl, {...opts, target: gl.TEXTURE_2D});

    this.width = null;
    this.height = null;
    Object.seal(this);

    this.setImageData(opts);
    if (opts.generateMipmap) {
      this.generateMipmap();
    }
  }

  bind(index) {
    const {gl} = this;
    if (index !== undefined) {
      gl.activeTexture(gl.TEXTURE0 + index);
    }
    // Textures are special because when you first bind them to a target,
    // they get special information. When you first bind a texture as a
    // GL_TEXTURE_2D, you are actually setting special state in the texture.
    // You are saying that this texture is a 2D texture.
    // And it will always be a 2D texture; this state cannot be changed ever.
    // If you have a texture that was first bound as a GL_TEXTURE_2D,
    // you must always bind it as a GL_TEXTURE_2D;
    // attempting to bind it as GL_TEXTURE_1D will give rise to an error
    // (while run-time).
    gl.bindTexture(this.target, this.handle);
    glCheckError(gl);
    if (index === undefined) {
      const result = gl.getParameter(gl.ACTIVE_TEXTURE) - gl.TEXTURE0;
      return result;
    }
    return index;
  }

  unbind() {
    const {gl} = this;
    gl.bindTexture(this.target, null);
  }

  // WebGL2
  setPixels({
    buffer,
    offset = 0,
    width = null,
    height = null,
    mipmapLevel = 0,
    internalFormat = WebGL.RGBA,
    format = WebGL.RGBA,
    type = WebGL.UNSIGNED_BYTE,
    border = 0,
    ...opts
  }) {
    const {gl} = this;

    // This signature of texImage2D uses currently bound GL_PIXEL_UNPACK_BUFFER
    buffer = Buffer.makeFrom(buffer);
    gl.bindBuffer(WebGL.PIXEL_UNPACK_BUFFER, buffer.target);
    // And as always, we must also bind the texture itself
    this.bind();

    gl.texImage2D(gl.TEXTURE_2D,
      mipmapLevel, format, width, height, border, format, type, buffer.target);

    this.unbind();
    gl.bindBuffer(WebGL.GL_PIXEL_UNPACK_BUFFER, null);
    return this;
  }

  setImageDataFromCompressedBuffer({
    buffer,
    offset = 0,
    width = null,
    height = null,
    mipmapLevel = 0,
    internalFormat = WebGL.RGBA,
    format = WebGL.RGBA,
    type = WebGL.UNSIGNED_BYTE,
    border = 0,
    ...opts
  }) {
    const {gl} = this;
    gl.compressedTexImage2D(this.target,
      mipmapLevel, internalFormat, width, height, border, buffer);
    // gl.compressedTexSubImage2D(target,
    //   level, xoffset, yoffset, width, height, format, ArrayBufferView? pixels);
    return this;
  }

  /**
   * Defines a two-dimensional texture image or cube-map texture image with
   * pixels from the current framebuffer (rather than from client memory).
   * (gl.copyTexImage2D wrapper)
   */
  copyImageFromFramebuffer({
    framebuffer,
    offset = 0,
    x,
    y,
    width,
    height,
    mipmapLevel = 0,
    internalFormat = WebGL.RGBA,
    type = WebGL.UNSIGNED_BYTE,
    border = 0,
    ...opts
  }) {
    const {gl} = this;
    framebuffer = Framebuffer.makeFrom(framebuffer);
    framebuffer.bind();

    // target
    this.bind();
    gl.copyTexImage2D(
      this.target, mipmapLevel, internalFormat, x, y, width, height, border);
    this.unbind();

    framebuffer.unbind();
  }

  copySubImage({
    pixels,
    offset = 0,
    x,
    y,
    width,
    height,
    mipmapLevel = 0,
    internalFormat = WebGL.RGBA,
    type = WebGL.UNSIGNED_BYTE,
    border = 0
  }) {
    // if (pixels instanceof ArrayBufferView) {
    //   gl.texSubImage2D(target, level, x, y, width, height, format, type, pixels);
    // }
    // gl.texSubImage2D(target, level, x, y, format, type, ? pixels);
    // gl.texSubImage2D(target, level, x, y, format, type, HTMLImageElement pixels);
    // gl.texSubImage2D(target, level, x, y, format, type, HTMLCanvasElement pixels);
    // gl.texSubImage2D(target, level, x, y, format, type, HTMLVideoElement pixels);
    // // Additional signature in a WebGL 2 context:
    // gl.texSubImage2D(target, level, x, y, format, type, GLintptr offset);
  }
}

export class TextureCube extends Texture {

  static makeFrom(gl, object = {}) {
    return object instanceof TextureCube ? object :
      // Use .handle (e.g from stack.gl's gl-buffer), else use buffer directly
      new TextureCube(gl, {handle: object.handle || object});
  }

  constructor(gl, opts = {}) {
    assert(gl instanceof WebGLRenderingContext, ERR_CONTEXT);

    super(gl, {...opts, target: gl.TEXTURE_CUBE_MAP});
    this.setCubeMapImageData(opts);
  }

  bind(index) {
    const {gl} = this;
    if (index !== undefined) {
      gl.activeTexture(gl.TEXTURE0 + index);
      glCheckError(gl);
    }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.handle);
    glCheckError(gl);
    if (index === undefined) {
      const result = gl.getParameter(gl.ACTIVE_TEXTURE) - gl.TEXTURE0;
      glCheckError(gl);
      return result;
    }
    return index;
  }

  unbind() {
    const {gl} = this;
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  }

  /* eslint-disable max-statements, max-len */
  setCubeMapImageData({
    width,
    height,
    pixels,
    border = 0,
    format = WebGL.RGBA,
    type = WebGL.UNSIGNED_BYTE,
    generateMipmap = false,
    ...opts
  }) {
    const {gl} = this;
    this.bind();
    if (this.width || this.height) {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        0, format, width, height, border, format, type, pixels.pos.x);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        0, format, width, height, border, format, type, pixels.pos.y);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        0, format, width, height, border, format, type, pixels.pos.z);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        0, format, width, height, border, format, type, pixels.neg.x);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        0, format, width, height, border, format, type, pixels.neg.y);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        0, format, width, height, border, format, type, pixels.neg.z);
    } else {
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        0, format, format, type, pixels.pos.x);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        0, format, format, type, pixels.pos.y);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        0, format, format, type, pixels.pos.z);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        0, format, format, type, pixels.neg.x);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        0, format, format, type, pixels.neg.y);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        0, format, format, type, pixels.neg.z);
    }
    glCheckError(gl);

    this.unbind();

    if (generateMipmap) {
      this.generateMipmap();
    }
    return this;
  }
}
