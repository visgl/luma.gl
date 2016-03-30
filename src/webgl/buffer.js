// Encapsulates a WebGLBuffer object

import {getExtension, glCheckError} from './context';
import assert from 'assert';

export default class Buffer {

  static getDefaultOpts(gl) {
    return {
      bufferType: gl.ARRAY_BUFFER,
      size: 1,
      dataType: gl.FLOAT,
      stride: 0,
      offset: 0,
      drawMode: gl.STATIC_DRAW,
      instanced: 0
    };
  }

  /*
   * @classdesc
   * Set up a gl buffer once and repeatedly bind and unbind it.
   * Holds an attribute name as a convenience...
   *
   * @param{} opts.data - native array
   * @param{string} opts.attribute - name of attribute for matching
   * @param{} opts.bufferType - buffer type (called "target" in GL docs)
   */
  constructor(gl, opts) {
    assert(gl, 'Buffer needs WebGLRenderingContext');
    this.gl = gl;
    this.handle = gl.createBuffer();
    glCheckError(gl);
    opts = Object.assign({}, Buffer.getDefaultOpts(gl), opts);
    this.update(opts);
  }

  delete() {
    const {gl} = this;
    gl.deleteBuffer(this.handle);
    this.handle = null;
    glCheckError(gl);
    return this;
  }

  // todo - remove
  destroy() {
    this.delete();
  }

  /* Updates data in the buffer */
  update(opts = {}) {
    assert(opts.data, 'Buffer needs data argument');
    this.attribute = opts.attribute || this.attribute;
    this.bufferType = opts.bufferType || this.bufferType;
    this.size = opts.size || this.size;
    this.dataType = opts.dataType || this.dataType;
    this.stride = opts.stride || this.stride;
    this.offset = opts.offset || this.offset;
    this.drawMode = opts.drawMode || this.drawMode;
    this.instanced = opts.instanced || this.instanced;

    this.data = opts.data || this.data;
    if (this.data !== undefined) {
      this.bufferData(this.data);
    }
    return this;
  }

  /* Updates data in the buffer */
  bufferData(data) {
    assert(data, 'Buffer.bufferData needs data');
    this.data = data;
    this.gl.bindBuffer(this.bufferType, this.handle);
    this.gl.bufferData(this.bufferType, this.data, this.drawMode);
    this.gl.bindBuffer(this.bufferType, null);
    return this;
  }

  attachToLocation(location) {
    const {gl} = this;
    // Bind the buffer so that we can operate on it
    gl.bindBuffer(this.bufferType, this.handle);
    if (location === undefined) {
      return this;
    }
    // Enable the attribute
    gl.enableVertexAttribArray(location);
    // Specify buffer format
    gl.vertexAttribPointer(
      location,
      this.size, this.dataType, false, this.stride, this.offset
    );
    if (this.instanced) {
      const extension = getExtension(gl, 'ANGLE_instanced_arrays');
      // This makes it an instanced attribute
      extension.vertexAttribDivisorANGLE(location, 1);
    }
    return this;
  }

  detachFromLocation(location) {
    const {gl} = this;
    if (this.instanced) {
      const extension = getExtension(gl, 'ANGLE_instanced_arrays');
      // Clear instanced flag
      extension.vertexAttribDivisorANGLE(location, 0);
    }
    // Disable the attribute
    gl.disableVertexAttribArray(location);
    // Unbind the buffer per webgl recommendations
    gl.bindBuffer(this.bufferType, null);
    return this;
  }

  bind() {
    const {gl} = this;
    gl.bindBuffer(this.bufferType, this.handle);
    return this;
  }

  unbind() {
    const {gl} = this;
    gl.bindBuffer(this.bufferType, null);
    return this;
  }

}
