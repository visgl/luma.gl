// Encapsulates a WebGLBuffer object

import {WebGLRenderingContext} from './types';
import {getExtension} from './context';
import glGet from './get';
import assert from 'assert';

export default class Buffer {

  /*
   * @classdesc
   * Set up a gl buffer once and repeatedly bind and unbind it.
   * Holds an attribute name as a convenience...
   *
   * @param{} opts.data - native array
   * @param{string} opts.attribute - name of attribute for matching
   * @param{} opts.bufferType - buffer type (called "target" in GL docs)
   */
  constructor(gl, {bufferType = this.gl.ARRAY_BUFFER} = {}) {
    assert(gl instanceof WebGLRenderingContext,
      'Buffer needs WebGLRenderingContext');
    this.gl = gl;
    this.handle = gl.createBuffer();
    if (!this.handle) {
      throw new Error('Failed to create WebGLBuffer');
    }
    this.bufferType = bufferType;
  }

  delete() {
    const {gl} = this;
    if (this.handle) {
      gl.deleteBuffer(this.handle);
    }
    this.handle = null;
    return this;
  }

  // todo - remove
  destroy() {
    this.delete();
  }

  bind({bufferType = this.bufferType, autobind = true} = {}) {
    const {gl} = this;
    if (autobind) {
      gl.bindBuffer(bufferType, this.handle);
    }
    return this;
  }

  unbind({bufferType = this.bufferType, autobind = true} = {}) {
    const {gl} = this;
    if (autobind) {
      gl.bindBuffer(bufferType, null);
    }
    return this;
  }

  /**
   * Creates and initializes the buffer object's data store.
   * @returns {Buffer} Returns itself for chaining.
   */
  setData({
    data,
    size,
    usage = this.gl.STATIC_DRAW,
    bufferType = this.bufferType,
    autobind = true
  } = {}) {
    assert(data || size >= 0, 'Buffer.setData needs data or size');
    this.bind({autobind});
    this.gl.bufferData(bufferType, data || size, usage);
    this.unbind({autobind});
    return this;
  }

  /**
   * Updates a subset of a buffer object's data store.
   * @returns {Buffer} Returns itself for chaining.
   */
  setSubData({
    data,
    offset = 0,
    bufferType = this.bufferType,
    autobind = true
  } = {}) {
    assert(data, 'Buffer.bufferData needs data');
    this.bind({autobind});
    this.gl.bufferSubData(bufferType, offset, data);
    this.unbind({autobind});
    return this;
  }

}

export default class BufferObject extends Buffer {

  constructor(gl, {
    bufferType,
    size = 1,
    dataType = gl.FLOAT,
    stride = 0,
    offset = 0,
    usage = gl.STATIC_DRAW,
    instanced = 0
  } = {}) {
    super(gl, {bufferType});
    this.update({
      bufferType,
      size,
      dataType,
      stride,
      offset,
      usage,
      instanced
    });
  }

  /* Updates data in the buffer */
  update({
    location,
    bufferType,
    data,
    size,
    stride,
    offset,
    drawMode,
    instanced
  } = {}) {
    const {gl} = this;
    assert(data, 'Buffer needs data argument');
    this.bufferType = glGet(gl, bufferType) || this.bufferType;
    this.size = size || this.size;
    this.stride = stride || this.stride;
    this.offset = offset || this.offset;
    this.drawMode = glGet(gl, drawMode) || this.drawMode;
    this.instanced = instanced || this.instanced;

    /* Updates data in the buffer */
    this.data = data || this.data;
    if (this.data !== undefined) {
      this.data({data});
    }
    return this;
  }

  /**
   * initializes and creates the buffer object's data store.
   * Updates data in the buffer
   * @returns {Buffer} Returns itself for chaining.
   */
  attachToLocation({location, size, dataType, stride, offset, instanced} = {}) {
    return new VertexAttributesArray(this.gl, {location})
      .enable()
      .pointer({size, dataType, stride, offset})
      .divisor(instanced ? 1 : 0);
  }

  detachFromLocation({location}) {
    return new VertexAttributesArray(this.gl, {location})
      .divisor(0)
      .disable();
  }
}
