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
    this.target = null;
    this.index = null;
    this.setData(opts);
    Object.seal(this);
  }

  /**
   * Updates a data buffer, reallocating if necessary
   */
  update({data}) {
    if (data.byteLength > this.bytes) {
      this.setData({data});
    } else {
      this.subData({data});
    }
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
    target,
    index,
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

    this.setDefaultTarget(opts);

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
    target = this.target || GL.ARRAY_BUFFER;
    this.gl.bindBuffer(target, this.handle);
    this.gl.bufferData(target, data || bytes, usage);
    this.gl.bindBuffer(target, null);

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
    // GL.COPY_READ_BUFFER GL.COPY_WRITE_BUFFER exist to avoid disturbing other targets, so use them
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
   * Sets the default target of the buffer for bind operations
   *
   * Note: Cannot change between ELEMENT_ARRAY_BUFFER and other targets:
   * In the WebGL API, a given buffer object may only be bound to one of the
   * other data or ELEMENT_ARRAY_BUFFER binding points in its lifetime.
   * This restriction implies that a given buffer object may contain either
   * vertices/data or indices, but not both.
   */
  setDefaultTarget({target, index}) {
    // If target is supplied, overwrite it
    if (target) {
      this.target = target;
      this.index = index;
    }
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
    if (!isIndexedBuffer) {
      this.gl.bindBuffer(target, null);
    } else {
      this.gl.bindBufferBase(target, index, null);
    }
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

export class ElementArrayBuffer extends Buffer {
  constructor(gl, opts) {
    super(gl, Object.assign(opts, {target: GL.ELEMENT_ARRAY_BUFFER}));
  }
}

Buffer.PARAMETERS = PARAMETERS;

/*
export class Attribute {
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
   *
  constructor({
    // Characteristics of stored data
    buffer,
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
  */
