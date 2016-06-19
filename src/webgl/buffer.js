// Encapsulates a WebGLBuffer object

import {WebGLRenderingContext} from './types';
import {glCheckError} from './context';
import glGet from './get';
import assert from 'assert';

export default class Buffer {

  /*
   * @classdesc
   * Can be used to store vertex data, pixel data retrieved from images
   * or the framebuffer, and a variety of other things.
   *
   * Mainly used for uploading VertexAttributes to GPU
   * Setting data on a buffers (arrays) uploads it to the GPU.
   *
   * Holds an attribute name as a convenience...
   * setData - Initializes size of buffer and sets
   *
   * @param {WebGLRenderingContext} gl - gl context
   * @param {string} opt.id - id for debugging
   */
  constructor(gl, {id} = {}) {
    assert(gl instanceof WebGLRenderingContext,
      'Buffer needs WebGLRenderingContext');
    this.handle = gl.createBuffer();
    if (!this.handle) {
      throw new Error('Failed to create WebGLBuffer');
    }
    this.gl = gl;
    this.id = id;
    this.name = name;
    this.target = undefined;
    this.type = undefined;
    this.size = undefined;
    this.userData = {};
    Object.seal(this);
  }

  delete() {
    const {gl} = this;
    if (this.handle) {
      gl.deleteBuffer(this.handle);
      this.handle = null;
      glCheckError(gl);
    }
    return this;
  }

  /**
   * Creates and initializes the buffer object's data store.
   *
   * @param {ArrayBufferView} opt.data - contents
   * @param {GLsizeiptr} opt.bytes - the size of the buffer object's data store.
   * @param {GLenum} opt.usage=gl.STATIC_DRAW - Allocation hint for GPU driver
   *
   * Characteristics of stored data, hints for vertex attribute
   *
   * @param {GLenum} opt.dataType=gl.FLOAT - type of data stored in buffer
   * @param {GLuint} opt.size=1 - number of values per vertex
   * @returns {Buffer} Returns itself for chaining.
   */
  initializeData({
    data,
    bytes,
    usage = this.gl.STATIC_DRAW,

    // Characteristics of stored data
    target = this.gl.ARRAY_BUFFER,
    type = this.gl.FLOAT,
    size = 1
  } = {}) {
    const {gl} = this;
    assert(data || bytes >= 0, 'Buffer.setData needs data or bytes');

    // Note: When we are just creating and/or filling the buffer with data,
    // the target we use doesn't technically matter, so use ARRAY_BUFFER
    // https://www.opengl.org/wiki/Buffer_Object
    gl.bindBuffer(gl.ARRAY_BUFFER, this.handle);
    glCheckError(gl);
    gl.bufferData(gl.ARRAY_BUFFER, data || bytes, usage);
    glCheckError(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    glCheckError(gl);

    // On initialization we store characteristics of the data, if supplied
    // This is intended to be used when updating attributes with this buffer
    this.target = target;
    this.type = type;
    this.size = size;

    return this;
  }

  /**
   * Updates a subset of a buffer object's data store.
   * @param {ArrayBufferView} opt.data - contents
   * @returns {Buffer} Returns itself for chaining.
   */
  updateData({
    data,
    offset = 0
  } = {}) {
    const {gl} = this;
    assert(data, 'Buffer.bufferData needs data');

    // Note: When we are just creating and/or filling the buffer with data,
    // the target we use doesn't technically matter, so use ARRAY_BUFFER
    // https://www.opengl.org/wiki/Buffer_Object
    gl.bindBuffer(gl.ARRAY_BUFFER, this.handle);
    glCheckError(gl);
    gl.bufferSubData(gl.ARRAY_BUFFER, offset, data);
    glCheckError(gl);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    glCheckError(gl);

    return this;
  }

  /**
   * Binds a buffer to a given binding point (target).
   *
   * @param {Glenum} target - target for the bind operation.
   *  Possible values: gl.TRANSFORM_FEEDBACK_BUFFER and gl.UNIFORM_BUFFER
   * @param {GLuint} index - the index of the target.
   * @returns {Buffer} - Returns itself for chaining.
   */
  bind(target = this.target) {
    const {gl} = this;
    gl.bindBuffer(target, this.handle);
    glCheckError(gl);
    return this;
  }

  unbind({target = this.target}) {
    const {gl} = this;
    gl.bindBuffer(target, null);
    glCheckError(gl);
    return this;
  }

  /**
   * Note: WEBGL2
   * Binds a buffer to a given binding point (target) at a given index.
   *
   * @param {Glenum} target - target for the bind operation.
   *  Possible values: gl.TRANSFORM_FEEDBACK_BUFFER and gl.UNIFORM_BUFFER
   * @param {GLuint} index - the index of the target.
   * @returns {Buffer} - Returns itself for chaining.
   */
  bindBase({target = this.target, index, autobind = true} = {}) {
    const {gl} = this;
    if (autobind) {
      gl.bindBufferBase(target, index, this.handle);
      glCheckError(gl);
    }
    return this;
  }

  unbindBase({target = this.target, index, autobind = true} = {}) {
    const {gl} = this;
    if (autobind) {
      gl.bindBufferBase(target, index, null);
      glCheckError(gl);
    }
    return this;
  }

  /**
   * Note: WEBGL2
   * binds a range of a given WebGLBuffer to a given binding point (target)
   * at a given index.
   *
   * @param {Glenum} target - target for the bind operation.
   *  Possible values: gl.TRANSFORM_FEEDBACK_BUFFER and gl.UNIFORM_BUFFER
   * @param {GLuint} index - the index of the target.
   * @returns {Buffer} - Returns itself for chaining.
   */
  bindRange({
    target = this.target,
    index,
    offset = 0,
    size,
    autobind = true
  } = {}) {
    const {gl} = this;
    if (autobind) {
      gl.bindBufferRange(target, index, this.handle, offset, size);
      glCheckError(gl);
    }
    return this;
  }

  unbindRange({target = this.target, index, autobind = true} = {}) {
    const {gl} = this;
    if (autobind) {
      gl.bindBufferBase(target, index, null);
      glCheckError(gl);
    }
    return this;
  }

}

export class BufferObject extends Buffer {

  constructor(gl, {
    target,
    size = 1,
    dataType = gl.FLOAT,
    stride = 0,
    offset = 0,
    usage = gl.STATIC_DRAW,
    instanced = 0
  } = {}) {
    super(gl, {target});
    this.update({
      target,
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
    target,
    data,
    size,
    stride,
    offset,
    drawMode,
    instanced
  } = {}) {
    const {gl} = this;
    assert(data, 'Buffer needs data argument');
    this.target = glGet(gl, target) || this.target;
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
