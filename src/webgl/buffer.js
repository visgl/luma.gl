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
  update({
    attribute,
    bufferType,
    data,
    size,
    dataType,
    stride,
    offset,
    drawMode,
    instanced
  } = {}) {
    const {gl} = this;
    assert(data, 'Buffer needs data argument');
    this.attribute = attribute || this.attribute;
    this.bufferType = gl.get(bufferType) || this.bufferType;
    this.size = size || this.size;
    this.dataType = gl.get(dataType) || this.dataType;
    this.stride = stride || this.stride;
    this.offset = offset || this.offset;
    this.drawMode = gl.get(drawMode) || this.drawMode;
    this.instanced = instanced || this.instanced;

    this.data = data || this.data;
    if (this.data !== undefined) {
      this.bufferData(this.data);
    }
    return this;
  }

  /* Updates data in the buffer */
  bufferData(data) {
    const {gl} = this;
    assert(data, 'Buffer.bufferData needs data');
    this.data = data;
    this.gl.bindBuffer(this.bufferType, this.handle);
    glCheckError(gl);
    this.gl.bufferData(this.bufferType, this.data, this.drawMode);
    glCheckError(gl);
    this.gl.bindBuffer(this.bufferType, null);
    glCheckError(gl);
    return this;
  }

  attachToLocation(location) {
    const {gl} = this;
    // Bind the buffer so that we can operate on it
    gl.bindBuffer(this.bufferType, this.handle);
    glCheckError(gl);
    if (location === undefined) {
      return this;
    }
    // Enable the attribute
    gl.enableVertexAttribArray(location);
    glCheckError(gl);
    // Specify buffer format
    gl.vertexAttribPointer(
      location,
      this.size, this.dataType, false, this.stride, this.offset
    );
    glCheckError(gl);
    if (this.instanced) {
      const extension = getExtension(gl, 'ANGLE_instanced_arrays');
      // This makes it an instanced attribute
      extension.vertexAttribDivisorANGLE(location, 1);
      glCheckError(gl);
    }
    return this;
  }

  detachFromLocation(location) {
    const {gl} = this;
    if (this.instanced) {
      const extension = getExtension(gl, 'ANGLE_instanced_arrays');
      // Clear instanced flag
      extension.vertexAttribDivisorANGLE(location, 0);
      glCheckError(gl);
    }
    // Disable the attribute
    gl.disableVertexAttribArray(location);
    glCheckError(gl);
    // Unbind the buffer per webgl recommendations
    gl.bindBuffer(this.bufferType, null);
    glCheckError(gl);
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
