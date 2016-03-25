
import {Texture2D} from './texture';

export default class Framebuffer {

  constructor(gl, opts = {}) {
    this.gl = gl;

    this.width = opts.width ? opts.width : 1;
    this.height = opts.height ? opts.height : 1;
    this.depth = opts.depth === undefined ? true : opts.depth;
    this.minFilter = opts.minFilter || gl.NEAREST;
    this.magFilter = opts.magFilter || gl.NEAREST;
    this.format = opts.format || gl.RGBA;
    this.type = opts.type || gl.UNSIGNED_BYTE;
    this.fbo = gl.createFramebuffer();
    this.bind();

    this.texture = new Texture2D(gl, {
      width: this.width,
      height: this.height,
      minFilter: this.minFilter,
      magFilter: this.magFilter,
      type: this.type,
      format: this.format
    });

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture.texture, 0
    );

    if (this.depth) {
      this.depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
      gl.renderbufferStorage(
        gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height
      );
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth
      );
    }

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Framebuffer creation failed.');
    }

    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  }

  bind() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
  }

}
