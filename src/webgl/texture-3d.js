import GL from './api';
import {isWebGL2Context, assertWebGL2Context, withParameters} from './context';
import Texture from '../webgl/texture';
import Buffer from './buffer';

export default class Texture3D extends Texture {

  static isSupported(gl) {
    return isWebGL2Context(gl) || gl.getExtension('OES_vertex_array_object');
  }

  /**
   * @classdesc
   * 3D WebGL Texture
   * Note: Constructor will initialize your texture.
   *
   * @class
   * @param {WebGLRenderingContext} gl - gl context
   * @param {Image|ArrayBuffer|null} opts= - named options
   * @param {Image|ArrayBuffer|null} opts.data= - buffer
   * @param {GLint} width - width of texture
   * @param {GLint} height - height of texture
   */
  constructor(gl, opts = {}) {
    assertWebGL2Context(gl);
    super(gl, Object.assign({}, opts, {target: opts.target || GL.TEXTURE_3D}));

    this.width = null;
    this.height = null;
    this.depth = null;
    Object.seal(this);

    this.setImageData(opts);
    if (opts.generateMipmap) {
      this.generateMipmap();
    }
  }

  initialize(opts = {}) {
    this.opts = Object.assign({}, this.opts, opts);
    const {pixels, settings} = this.opts;
    if (settings) {
      withParameters(settings, () => {
        if (pixels) {
          this.setImage3D(this.opts);
        }
      });
      this.setParameters(opts);
    }
  }

  // WebGL2

  // Image 3D copies from Typed Array or WebGLBuffer
  setImage3D({
    level = 0,
    internalformat = GL.RGBA,
    width,
    height,
    depth = 1,
    border = 0,
    format,
    type = GL.UNSIGNED_BYTE,
    offset = 0,
    pixels
  }) {
    if (ArrayBuffer.isView(pixels)) {
      this.gl.texImage3D(
        this.target,
        level, internalformat,
        width, height, depth, border, format, type, pixels);
      return;
    }
    if (pixels instanceof Buffer) {
      this.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, pixels.handle);
      this.gl.texImage3D(
        this.target,
        level, internalformat,
        width, height, depth, border, format, type, offset);
      this.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, pixels.handle);
    }
  }

  _setImage2DFromBuffer({
    buffer,
    offset = 0,
    width = null,
    height = null,
    mipmapLevel = 0,
    internalFormat = GL.RGBA,
    format = GL.RGBA,
    type = GL.UNSIGNED_BYTE,
    border = 0
  }) {
    const {gl} = this;

    // This signature of texImage2D uses currently bound GL_PIXEL_UNPACK_BUFFER
    gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, buffer.target);
    // And as always, we must also bind the texture itself
    this.bind();

    gl.texImage2D(gl.TEXTURE_2D,
      mipmapLevel, format, width, height, border, format, type, buffer.target);

    this.unbind();
    gl.bindBuffer(GL.GL_PIXEL_UNPACK_BUFFER, null);
    return this;
  }

  setImageDataFromCompressedBuffer({
    buffer,
    offset = 0,
    width = null,
    height = null,
    mipmapLevel = 0,
    internalFormat = GL.RGBA,
    format = GL.RGBA,
    type = GL.UNSIGNED_BYTE,
    border = 0
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
  // TODO - include loop, move to framebuffer?
  copyImageFromFramebuffer({
    framebuffer,
    offset = 0,
    x,
    y,
    width,
    height,
    mipmapLevel = 0,
    internalFormat = GL.RGBA,
    type = GL.UNSIGNED_BYTE,
    border = 0
  }) {
    const {gl} = this;
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
    internalFormat = GL.RGBA,
    type = GL.UNSIGNED_BYTE,
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
