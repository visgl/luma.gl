import {GL, WebGLBuffer, glTypeFromArray} from './webgl';
import {assertWebGLContext, assertWebGL2Context, assertArrayTypeMatch} from './webgl-checks';
import assert from 'assert';

export class BufferLayout {
  /**
   * @classdesc
   * Store characteristics of a data layout
   * This data can be used when updating vertex attributes with
   * the associated buffer, freeing the application from keeping
   * track of this metadata.
   *
   * @class
   * @param {GLuint} size - number of values per element (1-4)
   * @param {GLuint} type - type of values (e.g. gl.FLOAT)
   * @param {GLbool} normalized=false - normalize integers to [-1,1] or [0,1]
   * @param {GLuint} integer=false - WebGL2 only, int-to-float conversion
   * @param {GLuint} stride=0 - supports strided arrays
   * @param {GLuint} offset=0 - supports strided arrays
   */
  constructor({
    // Characteristics of stored data
    type,
    size = 1,
    offset = 0,
    stride = 0,
    normalized = false,
    integer = false,
    instanced = 0
  } = {}) {
    this.type = type;
    this.size = size;
    this.offset = offset;
    this.stride = stride;
    this.normalized = normalized;
    this.integer = integer;
    this.instanced = instanced;
  }
}

// Encapsulates a WebGLBuffer object

export default class Buffer {

  /**
   * Returns a Buffer wrapped WebGLBuffer from a variety of inputs.
   * Allows other functions to transparently accept raw WebGLBuffers etc
   * and manipulate them using the methods in the `Buffer` class.
   * Checks for ".handle" (allows use of stack.gl's gl-buffer)
   *
   * @param {WebGLRenderingContext} gl - if a new buffer needs to be initialized
   * @param {*} object - candidate that will be coerced to a buffer
   * @returns {Buffer} - Buffer object that wraps the buffer parameter
   */
  static makeFrom(gl, object = {}) {
    return object instanceof Buffer ? object :
      // Use .handle (e.g from stack.gl's gl-buffer), else use buffer directly
      new Buffer(gl).setData({handle: object.handle || object});
  }

  /*
   * @classdesc
   * Can be used to store vertex data, pixel data retrieved from images
   * or the framebuffer, and a variety of other things.
   *
   * Mainly used for uploading VertexAttributes to GPU
   * Setting data on a buffers (arrays) uploads it to the GPU.
   *
   * Holds an attribute name as a convenience
   * setData - Initializes size of buffer and sets
   *
   * @param {WebGLRenderingContext} gl - gl context
   * @param {string} opt.id - id for debugging
   */
  constructor(gl = {}, {
    id,
    handle
  } = {}) {
    assertWebGLContext(gl);

    handle = handle || gl.createBuffer();
    if (!(handle instanceof WebGLBuffer)) {
      throw new Error('Failed to create WebGLBuffer');
    }

    this.gl = gl;
    this.handle = handle;
    this.id = id;
    this.bytes = undefined;
    this.data = null;
    this.target = GL.ARRAY_BUFFER;
    this.layout = null;

    this.userData = {};
    Object.seal(this);
  }

  delete() {
    const {gl} = this;
    if (this.handle) {
      gl.deleteBuffer(this.handle);
      this.handle = null;
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
  setData({
    data,
    bytes,
    target = GL.ARRAY_BUFFER,
    usage = GL.STATIC_DRAW,
    // Characteristics of stored data
    layout,
    type,
    size = 1,
    offset = 0,
    stride = 0,
    normalized = false,
    integer = false,
    instanced = 0
  } = {}) {
    const {gl} = this;
    assert(data || bytes >= 0, 'Buffer.setData needs data or bytes');
    type = type || glTypeFromArray(data);

    if (data) {
      assertArrayTypeMatch(data, type, 'in Buffer.setData');
    }

    this.bytes = bytes;
    this.data = data;
    this.target = target;
    this.layout = layout || new BufferLayout({
      type,
      size,
      offset,
      stride,
      normalized,
      integer,
      instanced
    });

    // Note: When we are just creating and/or filling the buffer with data,
    // the target we use doesn't technically matter, so use ARRAY_BUFFER
    // https://www.opengl.org/wiki/Buffer_Object
    this.bind({target});
    gl.bufferData(target, data || bytes, usage);
    this.unbind({target});

    return this;
  }

  /**
   * Updates a subset of a buffer object's data store.
   * @param {ArrayBufferView} opt.data - contents
   * @returns {Buffer} Returns itself for chaining.
   */
  subData({
    data,
    offset = 0
  } = {}) {
    const {gl} = this;
    assert(data, 'Buffer.updateData needs data');

    // Note: When we are just creating and/or filling the buffer with data,
    // the target we use doesn't technically matter, so use ARRAY_BUFFER
    // https://www.opengl.org/wiki/Buffer_Object
    this.bind({target: GL.ARRAY_BUFFER});
    gl.bufferSubData(GL.ARRAY_BUFFER, offset, data);
    this.unbind({target: GL.ARRAY_BUFFER});

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
  bind({target = this.target} = {}) {
    this.gl.bindBuffer(target, this.handle);
    return this;
  }

  unbind({target = this.target} = {}) {
    // this.gl.bindBuffer(target, null);
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
  bindBase({target = this.target, index} = {}) {
    assertWebGL2Context(this.gl);
    this.gl.bindBufferBase(target, index, this.handle);
    return this;
  }

  unbindBase({target = this.target, index} = {}) {
    assertWebGL2Context(this.gl);
    this.gl.bindBufferBase(target, index, null);
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
  bindRange({target = this.target, index, offset = 0, size} = {}) {
    assertWebGL2Context(this.gl);
    this.gl.bindBufferRange(target, index, this.handle, offset, size);
    return this;
  }

  unbindRange({target = this.target, index} = {}) {
    assertWebGL2Context(this.gl);
    this.gl.bindBufferBase(target, index, null);
    return this;
  }

}
