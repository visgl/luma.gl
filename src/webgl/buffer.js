import GL from './api';
import {assertWebGL2Context} from './context';
import {getGLTypeFromTypedArray} from '../utils/typed-array-utils';
import Resource from './resource';
import assert from 'assert';

const ERR_BUFFER_PARAMS = 'Illegal or missing parameter to Buffer';

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
    // Characteristics of stored data,
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
  constructor(gl, opts = {}) {
    super(gl, opts);
    // In WebGL1, we need to make sure we use GL.ELEMENT_ARRAY_BUFFER when
    // initializing element buffers, otherwise the buffer type will be locked
    // to a generic (non-element) buffer.
    // In WebGL2, we can use GL.COPY_READ_BUFFER which avoids locking the type
    this.target = opts.target || (this.gl.webgl2 ? GL.COPY_READ_BUFFER : GL.ARRAY_BUFFER);
    this.index = null;
    this.setData(opts);
    Object.seal(this);
  }

  /*
   * Stores the layout of data with the buffer which makes it easy to
   * e.g. set it as an attribute later
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
      type: type || this.type, // Use autodeduced type if available
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
    // Layout of stored data
    layout,
    type,
    size = 1,
    offset = 0,
    stride = 0,
    normalized = false,
    integer = false,
    instanced = 0
  } = {}) {
    const opts = arguments[0];

    if (!data) {
      bytes = bytes || 0;
    } else {
      type = type || getGLTypeFromTypedArray(data);
      bytes = data.byteLength;
      assert(type, ERR_BUFFER_PARAMS);
    }

    this.bytes = bytes;
    this.bytesUsed = bytes;
    this.data = data;
    this.type = type;
    this.usage = usage;

    // Call after type is set
    this.setDataLayout(Object.assign(opts));

    // Create the buffer - binding it here for the first time locks the type
    // In WebGL2, use GL.COPY_WRITE_BUFFER to avoid locking the type
    const target = this.gl.webgl2 ? GL.COPY_WRITE_BUFFER : this.target;
    this.gl.bindBuffer(target, this.handle);
    this.gl.bufferData(target, data || bytes, usage);
    this.gl.bindBuffer(target, null);

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

    // Create the buffer - binding it here for the first time locks the type
    // In WebGL2, use GL.COPY_WRITE_BUFFER to avoid locking the type
    const target = this.gl.webgl2 ? GL.COPY_WRITE_BUFFER : this.target;
    this.gl.bindBuffer(target, this.handle);
    this.gl.bufferSubData(target, offset, data);
    this.gl.bindBuffer(target, null);
    return this;
  }

  /**
   * WEBGL2 ONLY: Copies part of the data of another buffer into this buffer
   *
   * Note: readOffset, writeOffset and size must all be greater than or equal to zero.
   * Furthermore, readOffset+sizereadOffset+size must not exceeed the size of
   * the source buffer object, and writeOffset+sizewriteOffset+size must not
   * exceeed the size of the buffer bound to writeTarget. If the source and
   * destination are the same buffer object, then the source and destination
   * ranges must not overlap.
   *
   * @param {GLintptr} readOffset - byte offset from which to start reading from the buffer.
   * @param {GLintptr} writeOffset - byte offset from which to start writing to the buffer.
   * @param {GLsizei}  size - bytes specifying the size of the data to be copied
   */
  copySubData({
    sourceBuffer,
    readOffset = 0,
    writeOffset = 0,
    size
  }) {
    assertWebGL2Context(this.gl);

    // Use GL.COPY_READ_BUFFER+GL.COPY_WRITE_BUFFER avoid disturbing other targets and locking type
    this.gl.bindBuffer(GL.COPY_READ_BUFFER, sourceBuffer.handle);
    this.gl.bindBuffer(GL.COPY_WRITE_BUFFER, this.handle);

    this.gl.copyBufferSubData(
      GL.COPY_READ_BUFFER, GL.COPY_WRITE_BUFFER,
      readOffset, writeOffset, size);

    this.gl.bindBuffer(GL.COPY_READ_BUFFER, null);
    this.gl.bindBuffer(GL.COPY_WRITE_BUFFER, null);
  }

  /**
   * WEBGL2 ONLY: Reads data from buffer into an ArrayBuffer or SharedArrayBuffer.
   *
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
    this.gl.bindBuffer(GL.COPY_READ_BUFFER, this.handle);
    this.gl.getBufferSubData(this.target, srcByteOffset, dstData, dstOffset, length);
    this.gl.bindBuffer(GL.COPY_READ_BUFFER, null);
    return dstData;
  }

  /**
   * Binds a buffer to a given binding point (target).
   *   GL.TRANSFORM_FEEDBACK_BUFFER and GL.UNIFORM_BUFFER take an index, and optionally a range.
   *
   * @param {Glenum} target - target for the bind operation.
   *
   * @param {GLuint} index= - the index of the target.
   *   - GL.TRANSFORM_FEEDBACK_BUFFER and GL.UNIFORM_BUFFER need an index to affect state
   * @param {GLuint} offset=0 - the index of the target.
   *   - GL.UNIFORM_BUFFER: `offset` must be aligned to GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT.
   * @param {GLuint} size= - the index of the target.
   *   - GL.UNIFORM_BUFFER: `size` must be a minimum of GL.UNIFORM_BLOCK_SIZE_DATA.
   * @returns {Buffer} - Returns itself for chaining.
   */
  bind({target = this.target, index = this.index, offset = 0, size} = {}) {
    // NOTE: While GL.TRANSFORM_FEEDBACK_BUFFER and GL.UNIFORM_BUFFER could
    // be used as direct binding points, they will not affect transform feedback or
    // uniform buffer state. Instead indexed bindings need to be made.
    const type = (target === GL.UNIFORM_BUFFER || target === GL.TRANSFORM_FEEDBACK_BUFFER) ?
      (size !== undefined ? 'ranged' : ' indexed') : 'non-indexed';

    switch (type) {
    case 'non-indexed':
      this.gl.bindBuffer(target, this.handle);
      break;
    case 'indexed':
      assertWebGL2Context(this.gl);
      assert(offset === 0, ERR_BUFFER_PARAMS); // Make sure offset wasn't supplied
      this.gl.bindBufferBase(target, index, this.handle);
      break;
    case 'ranged':
      assertWebGL2Context(this.gl);
      this.gl.bindBufferRange(target, index, this.handle, offset, size);
      break;
    default:
      throw new Error(ERR_BUFFER_PARAMS);
    }

    return this;
  }

  unbind({target = this.target, index = this.index} = {}) {
    const isIndexedBuffer = target === GL.UNIFORM_BUFFER || target === GL.TRANSFORM_FEEDBACK_BUFFER;
    if (isIndexedBuffer) {
      this.gl.bindBufferBase(target, index, null);
    } else {
      this.gl.bindBuffer(target, null);
    }
    return this;
  }

  // gl.TRANSFORM_FEEDBACK_BUFFER_BINDING: Returns a WebGLBuffer.
  // gl.TRANSFORM_FEEDBACK_BUFFER_SIZE: Returns a GLsizeiptr.
  // gl.TRANSFORM_FEEDBACK_BUFFER_START: Returns a GLintptr.
  // gl.UNIFORM_BUFFER_BINDING: Returns a WebGLBuffer.
  // gl.UNIFORM_BUFFER_SIZE: Returns a GLsizeiptr.
  // gl.UNIFORM_BUFFER_START: Returns a GLintptr.
  getIndexedParameter(binding, index) {
    // Create the buffer - if binding it here for the first time, this locks the type
    // In WebGL2, use GL.COPY_READ_BUFFER to avoid locking the type
    const target = this.gl.webgl2 ? GL.COPY_READ_BUFFER : this.target;
    this.gl.bindBuffer(target, index);
    return this.gl.getIndexedParameter(binding, index);
  }

  // RESOURCE METHODS

  _createHandle() {
    return this.gl.createBuffer();
  }

  _deleteHandle() {
    this.gl.deleteBuffer(this.handle);
  }

  _getParameter(pname) {
    this.gl.bindBuffer(this.target, this.handle);
    const value = this.gl.getBufferParameter(this.target, pname);
    this.gl.bindBuffer(this.target, null);
    return value;
  }
}
