// Encapsulates a WebGLBuffer object

import {getExtension} from './context';
import assert from 'assert';

export default class Buffer {

  static getDefaultOpts(gl) {
    return {
      bufferType: gl.ARRAY_BUFFER,
      size: 1,
      dataType: gl.FLOAT,
      stride: 0,
      offset: 0,
      drawType: gl.STATIC_DRAW,
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
    this.glBuffer = gl.createBuffer();
    opts = Object.assign({}, Buffer.getDefaultOpts(gl), opts);
    this.update(opts);
  }

  /* Updates data in the buffer */
  update(opts = {}) {
    this.attribute = opts.attribute || this.attribute;
    this.bufferType = opts.bufferType || this.bufferType;
    this.size = opts.size || this.size;
    this.dataType = opts.dataType || this.dataType;
    this.stride = opts.stride || this.stride;
    this.offset = opts.offset || this.offset;
    this.drawType = opts.drawType || this.drawType;
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
    this.gl.bindBuffer(this.bufferType, this.glBuffer);
    this.gl.bufferData(this.bufferType, this.data, this.drawType);
    this.gl.bindBuffer(this.bufferType, null);
    return this;
  }

  attachToLocation(location) {
    const {gl} = this;
    // Bind the buffer so that we can operate on it
    gl.bindBuffer(this.bufferType, this.glBuffer);
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
    gl.bindBuffer(this.bufferType, this.glBuffer);
    return this;
  }

  unbind() {
    const {gl} = this;
    gl.bindBuffer(this.bufferType, null);
    return this;
  }

  destroy() {
    const {gl} = this;
    gl.deleteBuffer(this.glBuffer);
    this.glBuffer = null;
    return this;
  }

}
