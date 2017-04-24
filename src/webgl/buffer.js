import GL from './api';
import {assertWebGL2Context} from './context';
import {getGLTypeFromTypedArray} from '../utils/typed-array-utils';
import Resource from './resource';
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

const PARAMETERS = [
  GL.BUFFER_SIZE, // GLint indicating the size of the buffer in bytes.
  GL.BUFFER_USAGE // GLenum indicating the usage pattern of the buffer.
];

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
    target = this.target || GL.ARRAY_BUFFER,
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
    if (!data) {
      bytes = bytes || 0;
    } else {
      type = type || getGLTypeFromTypedArray(data);
      assert(type, 'Unknown type in Buffer');
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

    this.bind({target});
    this.gl.bufferData(target, data || bytes, usage);
    this.unbind({target});

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
    assert(data, 'Buffer.updateData needs data');

    // WebGL2: subData supports additional srcOffset and length parameters
    if (srcOffset !== 0 || length !== undefined) {
      assertWebGL2Context(this.gl);
      this.bind({target: this.target});
      this.gl.bufferSubData(GL.ARRAY_BUFFER, offset, data, srcOffset, length || 0);
      this.unbind({target: this.target});
      return this;
    }

    this.bind({target: this.target});
    this.gl.bufferSubData(GL.ARRAY_BUFFER, offset, data);
    this.unbind({target: this.target});
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
    this.gl.getBufferSubData(this.target, srcByteOffset, dstData, dstOffset, length);
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

  getParameter(pname) {
    this.bind();
    const value = this.gl.getBufferParameter(this.target, pname);
    this.unbind();
    return value;
  }

  // PRIVATE METHODS

  _createHandle() {
    return this.gl.createBuffer();
  }

  _deleteHandle() {
    this.gl.deleteBuffer(this.handle);
  }
}

Buffer.PARAMETERS = PARAMETERS;
