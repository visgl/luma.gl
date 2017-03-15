import {GL} from './webgl';
import {assertWebGLContext} from './webgl-checks';
import Texture from './texture';

export default class Texture2D extends Texture {

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

  static makeFromPixelArray(gl, opts) {
    const {dataArray, format = GL.RGBA, width = 1, height} = opts;
    // Don't need to do this if the data is already in a typed array
    const dataTypedArray = new Uint8Array(dataArray);
    return new Texture2D(gl, Object.assign({
      pixels: dataTypedArray,
      width,
      height,
      format
    }, opts));
  }

  /**
   * @classdesc
   * 2D WebGL Texture
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
    assertWebGLContext(gl);

    super(gl, Object.assign({}, opts, {target: gl.TEXTURE_2D}));

    this.width = null;
    this.height = null;
    Object.seal(this);

    this.setImageData(opts);
    if (opts.generateMipmap) {
      this.generateMipmap();
    }
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
    const {gl} = this;
    if (textureUnit === undefined) {
      throw new Error('Texture.bind: must specify texture unit');
    }
    this.textureUnit = textureUnit;
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(this.target, this.handle);
    return textureUnit;
  }

  unbind() {
    const {gl} = this;
    if (this.textureUnit === undefined) {
      throw new Error('Texture.unbind: texture unit not specified');
    }
    gl.activeTexture(gl.TEXTURE0 + this.textureUnit);
    gl.bindTexture(this.target, null);
    return this.textureUnit;
  }

  getActiveUnit() {
    return this.gl.getParameter(GL.ACTIVE_TEXTURE) - GL.TEXTURE0;
  }

  // WebGL2
  setPixels(opts = {}) {
    const {
      buffer,
      width = null,
      height = null,
      mipmapLevel = 0,
      format = GL.RGBA,
      type = GL.UNSIGNED_BYTE,
      border = 0
    } = opts;

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

  setImageDataFromCompressedBuffer(opts) {
    const {
      buffer,
      // offset = 0,
      width = null,
      height = null,
      mipmapLevel = 0,
      internalFormat = GL.RGBA,
      // format = GL.RGBA,
      // type = GL.UNSIGNED_BYTE,
      border = 0
    } = opts;

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
  copyImageFromFramebuffer(opts) {
    const {
      framebuffer,
      // offset = 0,
      x,
      y,
      width,
      height,
      mipmapLevel = 0,
      internalFormat = GL.RGBA,
      // type = GL.UNSIGNED_BYTE,
      border = 0
    } = opts;

    const {gl} = this;
    framebuffer.bind();

    // target
    this.bind();
    gl.copyTexImage2D(
      this.target, mipmapLevel, internalFormat, x, y, width, height, border);
    this.unbind();

    framebuffer.unbind();
  }

  copySubImage(opts) {
    const {
      // pixels,
      // offset = 0,
      // x,
      // y,
      // width,
      // height,
      // mipmapLevel = 0,
      // internalFormat = GL.RGBA,
      // type = GL.UNSIGNED_BYTE,
      // border = 0
    } = opts;

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
