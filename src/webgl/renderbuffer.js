/* eslint-disable no-inline-comments */
import {isWebGL2Context} from './context';
import Resource from './resource';
import assert from 'assert';

// Local constants for optimal minification
const GL_RENDERBUFFER = 0x8D41;
const GL_SAMPLES = 0x80A9;
const GL_RENDERBUFFER_WIDTH = 0x8D42;
const GL_RENDERBUFFER_HEIGHT = 0x8D43;
const GL_RENDERBUFFER_INTERNAL_FORMAT = 0x8D44;
const GL_RENDERBUFFER_SAMPLES = 0x8CAB;

export default class Renderbuffer extends Resource {

  static getSamplesForFormat({format}) {
    return isWebGL2Context(this.gl) ?
      this.gl.getInternalformatParameter(GL_RENDERBUFFER, format, GL_SAMPLES) :
      [0];
  }

  constructor(gl, opts = {}) {
    super(gl, opts);
    this.initialize(opts);
    Object.seal(this);
  }

  // Creates and initializes a renderbuffer object's data store
  initialize({format, width = 1, height = 1, samples = 0}) {
    assert(format, 'Needs format');
    this.gl.bindRenderbuffer(GL_RENDERBUFFER, this.handle);

    if (samples !== 0 && isWebGL2Context(this.gl)) {
      this.gl.renderbufferStorageMultisample(GL_RENDERBUFFER, samples, format, width, height);
    } else {
      this.gl.renderbufferStorage(GL_RENDERBUFFER, format, width, height);
    }

    // this.gl.bindRenderbuffer(GL_RENDERBUFFER, null);

    this.format = format;
    this.width = width;
    this.height = height;
    this.samples = samples;

    return this;
  }

  resize({width, height}) {
    // Don't resize if width/height haven't changed
    if (width === this.width && height === this.height) {
      return this;
    }
    return this.initialize({format: this.format, width, height, samples: this.samples});
  }

  // PRIVATE METHODS
  _createHandle() {
    return this.gl.createRenderbuffer();
  }

  _deleteHandle() {
    this.gl.deleteRenderbuffer(this.handle);
  }

  _syncHandle(handle) {
    this.format = this.getParameter(GL_RENDERBUFFER_INTERNAL_FORMAT);
    this.width = this.getParameter(GL_RENDERBUFFER_WIDTH);
    this.height = this.getParameter(GL_RENDERBUFFER_HEIGHT);
    this.samples = this.getParameter(GL_RENDERBUFFER_SAMPLES);
  }

  // @param {Boolean} opt.autobind=true - method call will bind/unbind object
  // @returns {GLenum|GLint} - depends on pname
  _getParameter(pname) {
    this.gl.bindRenderbuffer(GL_RENDERBUFFER, this.handle);
    const value = this.gl.getRenderbufferParameter(GL_RENDERBUFFER, pname);
    // this.gl.bindRenderbuffer(GL_RENDERBUFFER, null);
    return value;
  }
}
