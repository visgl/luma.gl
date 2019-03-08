import GL from '@luma.gl/constants';
import Texture from './texture';
import Buffer from './buffer';
import {withParameters} from '../context';
import {isWebGL2, assertWebGL2Context} from '../utils';

export default class Texture3D extends Texture {
  static isSupported(gl) {
    return isWebGL2(gl);
  }

  constructor(gl, opts = {}) {
    assertWebGL2Context(gl);
    super(gl, Object.assign({}, opts, {target: opts.target || GL.TEXTURE_3D, is3D: true }));

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
        level,
        internalformat,
        width,
        height,
        depth,
        border,
        format,
        type,
        pixels
      );
      return;
    }
    if (pixels instanceof Buffer) {
      this.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, pixels.handle);
      this.gl.texImage3D(
        this.target,
        level,
        internalformat,
        width,
        height,
        depth,
        border,
        format,
        type,
        offset
      );
      this.gl.bindBuffer(GL.PIXEL_UNPACK_BUFFER, pixels.handle);
    }
  }
}
