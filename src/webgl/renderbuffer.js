/* eslint-disable no-inline-comments */
import {assertWebGL2Context, isWebGL2Context} from './context';
import Resource from './resource';
import assert from 'assert';

const GL = {
  RENDERBUFFER: 0x8D41,
  SAMPLES: 0x80A9
};

export default class Renderbuffer extends Resource {
  constructor(gl, opts = {}) {
    super(gl, opts);
    this.initialize(opts);
    Object.seal(this);
  }

  initialize({format, width, height}) {
    this.opts = Object.assign({}, this.opts, {format, width, height});
    return this.storage({format, width, height});
  }

  // Accessors

  get format() {
    return this.opts.format;
  }

  get width() {
    return this.opts.width;
  }

  get height() {
    return this.opts.height;
  }

  // Modifiers

  bind() {
    this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.handle);
    return this;
  }

  unbind() {
    this.gl.bindRenderbuffer(GL.RENDERBUFFER, null);
    return this;
  }

  // Creates and initializes a renderbuffer object's data store
  storage({
    format,     // internal format of the renderbuffer (often GL.DEPTH_COMPONENT16)
    width,      // width of renderbuffer
    height,     // height of renderbuffer
    samples = 0 // WebGL2 only -  number of samples to be used for storage
  }) {
    assert(format, 'Needs format');
    this.bind();

    if (samples !== 0 && isWebGL2Context(this.gl)) {
      this.gl.renderbufferStorageMultisample(GL.RENDERBUFFER, samples, format, width, height);
    } else {
      this.gl.renderbufferStorage(GL.RENDERBUFFER, format, width, height);
    }

    this.unbind();
    return this;
  }

  // WEBGL2 METHODS

  getInternalformatParameter({format, pname = GL.SAMPLES}) {
    switch (pname) {
    case GL.SAMPLES:
      // Under WebGL1, return a [0] array. 0 is handled by WebGL1 in `storage`
      if (!isWebGL2Context(this.gl)) {
        return [0];
      }
      break;
    default: // fall through
    }

    assertWebGL2Context(this.gl);
    return this.gl.getInternalformatParameter(GL.RENDERBUFFER, format, pname);
  }

  // PRIVATE METHODS
  _createHandle() {
    return this.gl.createRenderbuffer();
  }

  _deleteHandle() {
    this.gl.deleteRenderbuffer(this.handle);
  }

  _syncHandle(handle) {
    this.gl.bindRenderbuffer(GL.RENDERBUFFER, handle);
    this.opts = {
      format: this.getParameter(this.gl.RENDERBUFFER_INTERNAL_FORMAT),
      width: this.getParameter(this.gl.RENDERBUFFER_WIDTH),
      height: this.getParameter(this.gl.RENDERBUFFER_HEIGHT)
    };
    this.gl.bindRenderbuffer(GL.RENDERBUFFER, null);
    this._format = this.opts.format;
    this._width = this.opts.width;
    this._height = this.opts.height;
  }

  // @param {Boolean} opt.autobind=true - method call will bind/unbind object
  // @returns {GLenum|GLint} - depends on pname
  _getParameter(pname) {
    this.gl.bindRenderbuffer(GL.RENDERBUFFER, this.handle);
    const value = this.gl.getRenderbufferParameter(GL.RENDERBUFFER, pname);
    this.gl.bindRenderbuffer(GL.RENDERBUFFER, null);
    return value;
  }
}
