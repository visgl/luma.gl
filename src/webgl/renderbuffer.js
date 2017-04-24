/* eslint-disable no-inline-comments */
import GL from './api';
import {assertWebGL2Context, isWebGL2Context} from './context';
import Resource from './resource';
import assert from 'assert';

// Renderbuffer parameters
const PARAMETERS = {
  // WebGL1 parameters
  [GL.RENDERBUFFER_WIDTH]: {webgl1: 0}, // {GLint} - height of the image of renderbuffer.
  [GL.RENDERBUFFER_HEIGHT]: {webgl1: 0}, // {GLint} - height of the image of renderbuffer.

  // Internal format of the currently bound renderbuffer.
  // The default is GL.RGBA4. Possible return values:
  // GL.RGBA4: 4 red bits, 4 green bits, 4 blue bits 4 alpha bits.
  // GL.RGB565: 5 red bits, 6 green bits, 5 blue bits.
  // GL.RGB5_A1: 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
  // GL.DEPTH_COMPONENT16: 16 depth bits.
  // GL.STENCIL_INDEX8: 8 stencil bits.
  [GL.RENDERBUFFER_INTERNAL_FORMAT]: {type: 'GLenum', webgl1: GL.RGBA4},

  [GL.RENDERBUFFER_GREEN_SIZE]: {webgl1: 0}, // {GLint} - resolution (bits) of green color
  [GL.RENDERBUFFER_BLUE_SIZE]: {webgl1: 0}, // {GLint} - resolution (bits) of blue color
  [GL.RENDERBUFFER_RED_SIZE]: {webgl1: 0}, // {GLint} - resolution (bits) of red color
  [GL.RENDERBUFFER_ALPHA_SIZE]: {webgl1: 0}, // {GLint} - resolution (bits) of alpha component
  [GL.RENDERBUFFER_DEPTH_SIZE]: {webgl1: 0}, // {GLint} - resolution (bits) of depth component
  [GL.RENDERBUFFER_STENCIL_SIZE]: {webgl1: 0}, // {GLint} - resolution (bits) of stencil component

  // When using a WebGL 2 context, the following value is available
  [GL.RENDERBUFFER_SAMPLES]: {webgl2: 1}
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

  // @returns {GLint} - width of the image of the currently bound renderbuffer.
  get width() {
    return this.getParameter(GL.RENDERBUFFER_WIDTH);
  }

  // @returns {GLint} - height of the image of the currently bound renderbuffer.
  get height() {
    return this.getParameter(GL.RENDERBUFFER_HEIGHT);
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

  /**
   * Creates and initializes a renderbuffer object's data store
   *
   * @param {GLenum} opt.format - format of the renderbuffer (often GL.DEPTH_COMPONENT16)
   * @param {GLint} opt.width - width of renderbuffer
   * @param {GLint} opt.height - height of renderbuffer
   * @param {GLint} opt.samples=0 - (WebGL2) number of samples to be used for storage.
   * @returns {Renderbuffer} returns itself to enable chaining
   */
  storage({
    format,
    width,
    height,
    samples = 0 // WebGL2 only
  }) {
    assert(format, 'Needs format');
    this.bind();

    if (samples !== 0 && isWebGL2Context(this.gl)) {
      // (OpenGL ES 3.0.4 §4.4.2)
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
    // (OpenGL ES 3.0.4 §6.1.15)
    return this.gl.getInternalformatParameter(GL.RENDERBUFFER, format, pname);
  }

  // PRIVATE METHODS
  _createHandle() {
    return this.gl.createRenderbuffer();
  }

  _deleteHandle() {
    this.gl.deleteRenderbuffer(this.handle);
  }

  _getOptsFromHandle() {
    return {
      format: this.getParameter(GL.RENDERBUFFER_INTERNAL_FORMAT),
      width: this.getParameter(GL.RENDERBUFFER_WIDTH),
      height: this.getParameter(GL.RENDERBUFFER_HEIGHT)
    };
  }

  // @param {Boolean} opt.autobind=true - method call will bind/unbind object
  // @returns {GLenum|GLint} - depends on pname
  _getParameter(pname) {
    this.bind();
    const value = this.gl.getRenderbufferParameter(GL.RENDERBUFFER, pname);
    this.unbind();
    return value;
  }
}

Renderbuffer.PARAMETERS = PARAMETERS;
