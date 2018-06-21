import GL from '../constants';
import Resource from './resource';
import {assertWebGL2Context} from '../webgl-utils';
import {getGLTypeFromTypedArray, getTypedArrayFromGLType} from '../webgl-utils/typed-array-utils';
import Accessor from './accessor';
import assert from '../utils/assert';

export default class Buffer extends Resource {

  constructor(gl, opts = {}) {
    super(gl, opts);
    // In WebGL1, we need to make sure we use GL.ELEMENT_ARRAY_BUFFER when
    // initializing element buffers, otherwise the buffer type will be locked
    // to a generic (non-element) buffer.
    // In WebGL2, we can use GL.COPY_READ_BUFFER which avoids locking the type here
    this.target = opts.target || (this.gl.webgl2 ? GL.COPY_READ_BUFFER : GL.ARRAY_BUFFER);
    this.setData(opts);
    Object.seal(this);
  }

  // Stores the accessor of data with the buffer, makes it easy to e.g. set it as an attribute later
  // {accessor,type,size = 1,offset = 0,stride = 0,normalized = false,integer = false,instanced = 0}
  setAccessor(opts) {
    this.accessor = opts;
    return this;
  }

  updateAccessor(opts) {
    this.accessor.update(opts);
    return this;
  }

  // Creates and initializes the buffer object's data store.
  initialize(opts = {}) {
    let {
      data,
      bytes
    } = opts;

    const {
      usage = GL.STATIC_DRAW
    } = opts;

    let type;
    if (data) {
      // infer type from typed array
      type = getGLTypeFromTypedArray(data);
      bytes = data.byteLength;
      assert(type);
    } else if (!bytes || bytes === 0) {
      // Workaround needed for Safari (#291):
      // gl.bufferData with size (second argument) equal to 0 crashes.
      // hence create zero sized array.
      bytes = 0;
      data = new Float32Array(0);
    }

    this.usage = usage;
    this.bytes = bytes;
    this.bytesUsed = bytes;
    this.data = data;

    // Call after type is determined
    this.setAccessor(new Accessor(type ? {type} : {}, opts));

    // Create the buffer - binding it here for the first time locks the type
    // In WebGL2, use GL.COPY_WRITE_BUFFER to avoid locking the type
    const target = this.gl.webgl2 ? GL.COPY_WRITE_BUFFER : this.target;
    this.gl.bindBuffer(target, this.handle);
    this.gl.bufferData(target, data || bytes, usage);
    this.gl.bindBuffer(target, null);

    return this;
  }

  // DEPRECATED - Can we change to call `subData`?
  setData(options) {
    return this.initialize(options);
  }

  // Updates a subset of a buffer object's data store.
  // Data (Typed Array or ArrayBuffer), length is inferred unless provided
  // Offset into buffer
  // WebGL2 only: Offset into srcData
  // WebGL2 only: Number of bytes to be copied
  subData({data, offset = 0, srcOffset = 0, length} = {}) {
    assert(data);

    // Create the buffer - binding it here for the first time locks the type
    // In WebGL2, use GL.COPY_WRITE_BUFFER to avoid locking the type
    const target = this.gl.webgl2 ? GL.COPY_WRITE_BUFFER : this.target;
    this.gl.bindBuffer(target, this.handle);
    // WebGL2: subData supports additional srcOffset and length parameters
    if (srcOffset !== 0 || length !== undefined) {
      assertWebGL2Context(this.gl);
      this.gl.bufferSubData(this.target, offset, data, srcOffset, length || 0);
    } else {
      this.gl.bufferSubData(target, offset, data);
    }
    this.gl.bindBuffer(target, null);
    return this;
  }

  // WEBGL2 ONLY: Copies part of the data of another buffer into this buffer
  copyData({sourceBuffer, readOffset = 0, writeOffset = 0, size}) {
    assertWebGL2Context(this.gl);

    // Use GL.COPY_READ_BUFFER+GL.COPY_WRITE_BUFFER avoid disturbing other targets and locking type
    this.gl.bindBuffer(GL.COPY_READ_BUFFER, sourceBuffer.handle);
    this.gl.bindBuffer(GL.COPY_WRITE_BUFFER, this.handle);

    this.gl.copyBufferSubData(
      GL.COPY_READ_BUFFER, GL.COPY_WRITE_BUFFER,
      readOffset, writeOffset, size);

    this.gl.bindBuffer(GL.COPY_READ_BUFFER, null);
    this.gl.bindBuffer(GL.COPY_WRITE_BUFFER, null);

    return this;
  }

  // WEBGL2 ONLY: Reads data from buffer into an ArrayBufferView or SharedArrayBuffer.
  getData({dstData = null, srcByteOffset = 0, dstOffset = 0, length = 0} = {}) {
    assertWebGL2Context(this.gl);

    const ArrayType = getTypedArrayFromGLType(this.accessor.type || GL.FLOAT, {clamped: false});
    const sourceAvailableElementCount = this._getAvailableElementCount(srcByteOffset);
    let dstAvailableElementCount;
    let dstElementCount;
    const dstElementOffset = dstOffset;
    if (dstData) {
      dstElementCount = dstData.length;
      dstAvailableElementCount = dstElementCount - dstElementOffset;
    } else {
      // Allocate ArrayBufferView with enough size to copy all eligible data.
      dstAvailableElementCount = Math.min(
        sourceAvailableElementCount,
        length || sourceAvailableElementCount);
      dstElementCount = dstElementOffset + dstAvailableElementCount;
    }

    const copyElementCount = Math.min(
      sourceAvailableElementCount,
      dstAvailableElementCount);
    length = length || copyElementCount;
    assert(length <= copyElementCount,
      'Invalid srcByteOffset, dstOffset and length combination');
    dstData = dstData || new ArrayType(dstElementCount);
    // Use GL.COPY_READ_BUFFER to avoid disturbing other targets and locking type
    this.gl.bindBuffer(GL.COPY_READ_BUFFER, this.handle);
    this.gl.getBufferSubData(GL.COPY_READ_BUFFER, srcByteOffset, dstData, dstOffset, length);
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
  bind({
    target = this.target, index = this.accessor && this.accessor.index, offset = 0, size
  } = {}) {
    // NOTE: While GL.TRANSFORM_FEEDBACK_BUFFER and GL.UNIFORM_BUFFER could
    // be used as direct binding points, they will not affect transform feedback or
    // uniform buffer state. Instead indexed bindings need to be made.
    const type = (target === GL.UNIFORM_BUFFER || target === GL.TRANSFORM_FEEDBACK_BUFFER) ?
      (size !== undefined ? 'ranged' : 'indexed') : 'non-indexed';

    switch (type) {
    case 'non-indexed':
      this.gl.bindBuffer(target, this.handle);
      break;
    case 'indexed':
      assertWebGL2Context(this.gl);
      assert(offset === 0); // Make sure offset wasn't supplied
      this.gl.bindBufferBase(target, index, this.handle);
      break;
    case 'ranged':
      assertWebGL2Context(this.gl);
      this.gl.bindBufferRange(target, index, this.handle, offset, size);
      break;
    default:
      assert(false);
    }

    return this;
  }

  unbind({target = this.target, index = this.accessor && this.accessor.index} = {}) {
    const isIndexedBuffer = target === GL.UNIFORM_BUFFER || target === GL.TRANSFORM_FEEDBACK_BUFFER;
    if (isIndexedBuffer) {
      this.gl.bindBufferBase(target, index, null);
    } else {
      this.gl.bindBuffer(target, null);
    }
    return this;
  }

  // TODO - is this the right place?
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

  _getAvailableElementCount(srcByteOffset) {
    const ArrayType = getTypedArrayFromGLType(this.accessor.type || GL.FLOAT, {clamped: false});
    const sourceElementCount = this.bytes / ArrayType.BYTES_PER_ELEMENT;
    const sourceElementOffset = srcByteOffset / ArrayType.BYTES_PER_ELEMENT;
    return sourceElementCount - sourceElementOffset;
  }

  // DEPRECATED

  get layout() {
    return this.accessor;
  }
}
