import GL from './api';
import {assertWebGL2Context} from './context';
import {getGLTypeFromTypedArray} from '../utils/typed-array-utils';
import Resource from './resource';
import assert from 'assert';

const ERR_BUFFER_PARAMS = 'Illegal or missing parameter to Buffer';

const PARAMETERS = {
  [GL.BUFFER_SIZE]: {webgl1: 0}, // GLint indicating the size of the buffer in bytes.
  [GL.BUFFER_USAGE]: {webgl1: 0} // GLenum indicating the usage pattern of the buffer.
};

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

export default class Buffer extends Resource {

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
  constructor(gl, opts = {}) {
    super(gl, opts);

    // luma.gl v4 - Fix the target at construction time:
    //
    // Differences between WebGL and OpenGL ES 2.0
    //
    // In the WebGL API, a given buffer object may only be bound to one of the
    // ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER binding points in its lifetime.
    // This restriction implies that a given buffer object may contain either
    // vertices or indices, but not both.
    //
    // The type of a WebGLBuffer is initialized the first time it is passed as
    // an argument to bindBuffer. A subsequent call to bindBuffer which attempts
    // to bind the same WebGLBuffer to the other binding point will generate an
    // INVALID_OPERATION error, and the state of the binding point will remain untouched.

    assert(opts.target, 'Buffer constructor now requires target to be specified');
    this.target = opts.target;
    this.setData(opts);
    Object.seal(this);
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
    usage = GL.STATIC_DRAW,
    // Characteristics of stored data
    layout,
    type,
    size = 1,
    offset = 0,
    stride = 0,
    normalized = false,
    integer = false,
    instanced = 0,
    target // No longer supported - must be supplied in constructor
  } = {}) {
    if (!data) {
      bytes = bytes || 0;
    } else {
      type = type || getGLTypeFromTypedArray(data);
      assert(type, ERR_BUFFER_PARAMS);
    }

    this.bytes = bytes;
    this.data = data;
    this.type = type;

    // Call after type is set
    const opts = arguments[0];
    this.setDataLayout(Object.assign(opts));

    // Create the buffer
    this.gl.bindBuffer(this.target, this.handle);
    this.gl.bufferData(this.target, data || bytes, usage);
    this.gl.bindBuffer(this.target, null);

    return this;
  }

  /*
   * Stores the layout of data with the buffer which makes it easy to
   * set it as an attribute later
   */
  setDataLayout({
    layout,
    type,
    size = 1,
    offset = 0,
    stride = 0,
    normalized = false,
    integer = false,
    instanced = 0
  }) {
    this.layout = layout || new BufferLayout({
      type: type || this.type,
      size,
      offset,
      stride,
      normalized,
      integer,
      instanced
    });
    return this;
  }

  /**
   * Updates a subset of a buffer object's data store.
   * @param {ArrayBufferView} opt.data - contents
   * @returns {Buffer} Returns itself for chaining.
   */
  subData({
    data,          // Data (Typed Array or ArrayBuffer), length is inferred unless provided
    offset = 0,    // Offset into buffer
    srcOffset = 0, // WebGL2 only: Offset into srcData
    length         // WebGL2 only: Number of bytes to be copied
  } = {}) {
    assert(data, ERR_BUFFER_PARAMS);

    // WebGL2: subData supports additional srcOffset and length parameters
    if (srcOffset !== 0 || length !== undefined) {
      assertWebGL2Context(this.gl);
      this.gl.bindBuffer(this.target, this.handle);
      this.gl.bufferSubData(this.target, offset, data, srcOffset, length || 0);
      this.gl.bindBuffer(this.target, null);
      return this;
    }

    this.gl.bindBuffer(this.target, this.handle);
    this.gl.bufferSubData(this.target, offset, data);
    this.gl.bindBuffer(this.target, null);
    return this;
  }

  /**
   * WEBGL2 ONLY
   * Copies part of the data of a buffer to another buffer.
   *
   * @param {Buffer} writeTarget
   * A GLenum specifying the binding point (target) from whose data store should be read or written.
   * Possible values:
   *   GL.ARRAY_BUFFER: Buffer containing vertex attributes, such as
   *     vertex coordinates, texture coordinate data, or vertex color data.
   *   GL.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
   *   GL.COPY_READ_BUFFER: Buffer for copying from one buffer object to another
   *     (provided specifically for copy operations).
   *   GL.COPY_WRITE_BUFFER: Buffer for copying from one buffer object to another
   *     (provided specifically for copy operations).
   *   GL.TRANSFORM_FEEDBACK_BUFFER: Buffer for transform feedback operations.
   *   GL.UNIFORM_BUFFER: Buffer used for storing uniform blocks.
   *   GL.PIXEL_PACK_BUFFER: Buffer used for pixel transfer operations.
   *   GL.PIXEL_UNPACK_BUFFER: Buffer used for pixel transfer operations.
   * @param {GLintptr} readOffset - byte offset from which to start reading from the buffer.
   * @param {GLintptr} writeOffset - byte offset from which to start writing to the buffer.
   * @param {GLsizei}  size - bytes specifying the size of the data to be copied
   */
  copySubData({
    readTarget,
    writeTarget,
    readOffset = 0,
    writeOffset = 0,
    size
  }) {
    assertWebGL2Context(this.gl);
    this.gl.copyBufferSubData(readTarget, writeTarget, readOffset, writeOffset, size);
  }

  /**
   * WEBGL2 ONLY
   * Reads data from a buffer binding point and writes them to an ArrayBuffer or SharedArrayBuffer.
   *
   * @param {GLenum} target - The binding point (target). Possible values:
   *   GL.ARRAY_BUFFER: Buffer containing vertex attributes, such as
   *     vertex coordinates, texture coordinate data, or vertex color data.
   *   GL.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
   *   GL.COPY_READ_BUFFER: Buffer for copying from one buffer object to another.
   *   GL.COPY_WRITE_BUFFER: Buffer for copying from one buffer object to another.
   *   GL.TRANSFORM_FEEDBACK_BUFFER: Buffer for transform feedback operations.
   *   GL.UNIFORM_BUFFER: Buffer used for storing uniform blocks.
   *   GL.PIXEL_PACK_BUFFER: Buffer used for pixel transfer operations.
   *   GL.PIXEL_UNPACK_BUFFER: Buffer used for pixel transfer operations.
   * @param {GLintptr} srcByteOffset - byte offset from which to start reading from the buffer.
   * @param {ArrayBufferView | ArrayBuffer | SharedArrayBuffer} dstData -
   *   memory to which to write the buffer data.
   * @param {GLuint} srcOffset=0 - element index offset where to start reading the buffer.
   * @param {GLuint} length=0  Optional, defaulting to 0.
   */
  getSubData({
    dstData,
    srcByteOffset = 0,
    dstOffset = 0,
    length = 0
  }) {
    // TODO optimize dstData according to offset and length
    dstData = dstData || new ArrayBuffer(this.bytes);
    this.gl.getBufferSubData(this.target, srcByteOffset, dstData, dstOffset, length);
    return dstData;
  }

  /**
   * Binds a buffer to a given binding point (target).
   *
   * @param {Glenum} target - target for the bind operation.
   *  Possible values: gl.TRANSFORM_FEEDBACK_BUFFER and gl.UNIFORM_BUFFER
   * @param {GLuint} index - the index of the target.
   * @returns {Buffer} - Returns itself for chaining.
   */
  bind() {
    this.gl.bindBuffer(this.target, this.handle);
    return this;
  }

  unbind() {
    this.gl.bindBuffer(this.target, null);
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
  bindBase({index} = {}) {
    assertWebGL2Context(this.gl);
    this.gl.bindBufferBase(this.target, index, this.handle);
    return this;
  }

  unbindBase({index} = {}) {
    assertWebGL2Context(this.gl);
    this.gl.bindBufferBase(this.target, index, null);
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
  bindRange({index, offset = 0, size} = {}) {
    assertWebGL2Context(this.gl);
    this.gl.bindBufferRange(this.target, index, this.handle, offset, size);
    return this;
  }

  unbindRange({index} = {}) {
    assertWebGL2Context(this.gl);
    this.gl.bindBufferBase(this.target, index, null);
    return this;
  }

  // PRIVATE METHODS

  _createHandle() {
    return this.gl.createBuffer();
  }

  _deleteHandle() {
    this.gl.deleteBuffer(this.handle);
  }

  _getParameter(pname) {
    this.bind();
    const value = this.gl.getBufferParameter(this.target, pname);
    this.unbind();
    return value;
  }
}

Buffer.PARAMETERS = PARAMETERS;
