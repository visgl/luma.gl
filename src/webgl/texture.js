import {GL, WebGL2RenderingContext, WebGLBuffer, glTypeFromArray}
  from './webgl';
import {assertWebGLContext} from './webgl-checks';
import Buffer from './buffer';
import {uid} from '../utils';
import assert from 'assert';

export default class Texture {

  constructor(gl, opts) {
    const {
      id = uid('texture'),
      unpackFlipY = true,
      magFilter = GL.NEAREST,
      minFilter = GL.NEAREST,
      wrapS = GL.CLAMP_TO_EDGE,
      wrapT = GL.CLAMP_TO_EDGE,
      target = GL.TEXTURE_2D,
      handle
    } = opts;

    assertWebGLContext(gl);

    this.handle = handle || gl.createTexture();
    this.id = id;
    this.gl = gl;
    this.target = target;
    this.hasFloatTexture = gl.getExtension('OES_texture_float');
    this.width = null;
    this.height = null;
    this.textureUnit = undefined;
    this.userData = {};

    this.setPixelStorageModes(Object.assign({}, opts, {unpackFlipY}));
    this.setParameters(Object.assign({}, opts, {magFilter, minFilter, wrapS, wrapT}));
  }

  delete() {
    if (this.handle) {
      this.gl.deleteTexture(this.handle);
      this.handle = null;
    }
    return this;
  }

  toString() {
    return `Texture(${this.id},${this.width}x${this.height})`;
  }

  generateMipmap() {
    this.gl.bindTexture(this.target, this.handle);
    this.gl.generateMipmap(this.target);
    this.gl.bindTexture(this.target, null);
    return this;
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
  /* eslint-disable max-len, max-statements, complexity */
  setImageData({
    target = this.target,
    pixels = null,
    data = null,
    width,
    height,
    mipmapLevel = 0,
    format = GL.RGBA,
    type,
    offset = 0,
    border = 0
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

    gl.bindTexture(this.target, this.handle);

    if (pixels === null) {

      // Create an minimal texture
      width = width || 1;
      height = height || 1;
      type = type || GL.UNSIGNED_BYTE;
      // pixels = new Uint8Array([255, 0, 0, 1]);
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
      type = type || GL.UNSIGNED_BYTE;
      // This texImage2D signature uses currently bound GL_PIXEL_UNPACK_BUFFER
      const buffer = Buffer.makeFrom(pixels);
      gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, buffer.handle);
      gl.texImage2D(target,
        mipmapLevel, format, width, height, border, format, type, offset);
      gl.bindBuffer(GL.GL_PIXEL_UNPACK_BUFFER, null);
      this.width = width;
      this.height = height;

    } else {

      const imageSize = this._deduceImageSize(pixels);
      // Assume pixels is a browser supported object (ImageData, Canvas, ...)
      assert(width === undefined && height === undefined,
        'Texture2D.setImageData: Width and height must not be provided');
      type = type || GL.UNSIGNED_BYTE;
      gl.texImage2D(target, mipmapLevel, format, format, type, pixels);
      this.width = imageSize.width;
      this.height = imageSize.height;
    }

    gl.bindTexture(this.target, null);

    return this;
  }
  /* eslint-enable max-len, max-statements, complexity */

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
    throw new Error('Unknown image data format. Failed to deduce image size');
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

    gl.bindTexture(this.target, this.handle);

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

    gl.bindTexture(this.target, null);
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
    gl.bindTexture(this.target, this.handle);

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

    gl.bindTexture(this.target, null);
    return this;
  }
  /* eslint-enable complexity, max-statements */

  getParameters() {
    const {gl} = this;
    gl.bindTexture(this.target, this.handle);
    const webglParams = {
      magFilter: gl.getTexParameter(this.target, gl.TEXTURE_MAG_FILTER),
      minFilter: gl.getTexParameter(this.target, gl.TEXTURE_MIN_FILTER),
      wrapS: gl.getTexParameter(this.target, gl.TEXTURE_WRAP_S),
      wrapT: gl.getTexParameter(this.target, gl.TEXTURE_WRAP_T)
    };
    gl.bindTexture(this.target, null);
    return webglParams;
  }

  // Deprecated methods

  image2D({
    pixels,
    format = GL.RGBA,
    type = GL.UNSIGNED_BYTE
  }) {
    // TODO - WebGL2 check?
    if (type === GL.FLOAT && !this.hasFloatTexture) {
      throw new Error('floating point textures are not supported.');
    }

    this.gl.bindTexture(this.target, this.handle);
    this.gl.texImage2D(GL.TEXTURE_2D, 0, format, format, type, pixels);
    this.gl.bindTexture(this.target, null);
    return this;
  }

  update(opts) {
    throw new Error('Texture.update() is deprecated()');
  }
}
