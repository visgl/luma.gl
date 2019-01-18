import GL from '../constants';
import Resource from './resource';
import Accessor from './accessor';
import {assertWebGL2Context} from '../webgl-utils';
import {getGLTypeFromTypedArray, getTypedArrayFromGLType} from '../webgl-utils/typed-array-utils';
import {log} from '../utils';
import assert from '../utils/assert';

const DEBUG_DATA_LENGTH = 10;

export default class Buffer extends Resource {
  constructor(gl, props = {}) {
    super(gl, props);
    this.stubRemovedMethods('Buffer', 'v6.0', ['layout', 'setLayout', 'getIndexedParameter']);

    // In WebGL1, need to make sure we use GL.ELEMENT_ARRAY_BUFFER when initializing element buffers
    // otherwise buffer type will lock to generic (non-element) buffer
    // In WebGL2, we can use GL.COPY_READ_BUFFER which avoids locking the type here
    this.target = props.target || (this.gl.webgl2 ? GL.COPY_READ_BUFFER : GL.ARRAY_BUFFER);

    this._initialize(props);
    Object.seal(this);
  }

  // returns number of elements in the buffer (assuming that the full buffer is used)
  getElementCount(accessor = this.accessor) {
    return Math.round(this.byteLength / Accessor.getBytesPerElement(accessor));
  }

  // returns number of vertices in the buffer (assuming that the full buffer is used)
  getVertexCount(accessor = this.accessor) {
    return Math.round(this.byteLength / Accessor.getBytesPerVertex(accessor));
  }

  // Creates and initializes the buffer object's data store.
  initialize(props) {
    return this._initialize(props);
  }

  setProps(props) {
    if ('data' in props) {
      this.setData(props);
    }
    return this;
  }

  // Stores the accessor of data with the buffer, makes it easy to e.g. set it as an attribute later
  // {accessor,type,size = 1,offset = 0,stride = 0,normalized = false,integer = false,divisor = 0}
  setAccessor(opts) {
    this.accessor = opts;
    return this;
  }

  // Allocate a bigger GPU buffer (if the current buffer is not big enough).
  // If a reallocation is triggered it clears the buffer
  // Returns:
  //  `true`: buffer was reallocated, data was cleared
  //  `false`: buffer was big enough, data is intact
  reallocate(byteLength) {
    if (byteLength > this.byteLength) {
      this._setByteLength(byteLength);
      return true;
    }
    this.bytesUsed = byteLength;
    return false;
  }

  // Update with new data
  setData(opts) {
    return this.initialize(opts);
  }

  // Updates a subset of a buffer object's data store.
  // Data (Typed Array or ArrayBuffer), length is inferred unless provided
  // Offset into buffer
  // WebGL2 only: Offset into srcData
  // WebGL2 only: Number of bytes to be copied
  subData(props) {
    // Signature: buffer.subData(new Float32Array([...]))
    if (ArrayBuffer.isView(props)) {
      props = {data: props};
    }

    const {data, offset = 0, srcOffset = 0} = props;
    const byteLength = props.byteLength || props.length;

    // if (byteLength > this.byteLength) {
    //   byteLength = this.byteLength;
    // }

    assert(data);

    // Create the buffer - binding it here for the first time locks the type
    // In WebGL2, use GL.COPY_WRITE_BUFFER to avoid locking the type
    const target = this.gl.webgl2 ? GL.COPY_WRITE_BUFFER : this.target;
    this.gl.bindBuffer(target, this.handle);
    // WebGL2: subData supports additional srcOffset and length parameters
    if (srcOffset !== 0 || byteLength !== undefined) {
      assertWebGL2Context(this.gl);
      this.gl.bufferSubData(this.target, offset, data, srcOffset, byteLength);
    } else {
      this.gl.bufferSubData(target, offset, data);
    }
    this.gl.bindBuffer(target, null);

    // TODO - update local `data` if offsets are right
    this.debugData = null;

    if (!this.accessor.type) {
      this.setAccessor(new Accessor(this.accessor, {type: getGLTypeFromTypedArray(data)}));
    }

    return this;
  }

  // WEBGL2 ONLY: Copies part of the data of another buffer into this buffer
  copyData({sourceBuffer, readOffset = 0, writeOffset = 0, size}) {
    const {gl} = this;
    assertWebGL2Context(gl);

    // Use GL.COPY_READ_BUFFER+GL.COPY_WRITE_BUFFER avoid disturbing other targets and locking type
    gl.bindBuffer(GL.COPY_READ_BUFFER, sourceBuffer.handle);
    gl.bindBuffer(GL.COPY_WRITE_BUFFER, this.handle);
    gl.copyBufferSubData(GL.COPY_READ_BUFFER, GL.COPY_WRITE_BUFFER, readOffset, writeOffset, size);
    gl.bindBuffer(GL.COPY_READ_BUFFER, null);
    gl.bindBuffer(GL.COPY_WRITE_BUFFER, null);

    // TODO - update local `data` if offsets are 0
    this.debugData = null;

    return this;
  }

  // WEBGL2 ONLY: Reads data from buffer into an ArrayBufferView or SharedArrayBuffer.
  getData({dstData = null, srcByteOffset = 0, dstOffset = 0, length = 0} = {}) {
    assertWebGL2Context(this.gl);

    const ArrayType = getTypedArrayFromGLType(this.accessor.type || GL.FLOAT, {clamped: false});
    const sourceAvailableElementCount = this._getAvailableElementCount(srcByteOffset);

    const dstElementOffset = dstOffset;

    let dstAvailableElementCount;
    let dstElementCount;
    if (dstData) {
      dstElementCount = dstData.length;
      dstAvailableElementCount = dstElementCount - dstElementOffset;
    } else {
      // Allocate ArrayBufferView with enough size to copy all eligible data.
      dstAvailableElementCount = Math.min(
        sourceAvailableElementCount,
        length || sourceAvailableElementCount
      );
      dstElementCount = dstElementOffset + dstAvailableElementCount;
    }

    const copyElementCount = Math.min(sourceAvailableElementCount, dstAvailableElementCount);
    length = length || copyElementCount;
    assert(length <= copyElementCount);
    dstData = dstData || new ArrayType(dstElementCount);

    // Use GL.COPY_READ_BUFFER to avoid disturbing other targets and locking type
    this.gl.bindBuffer(GL.COPY_READ_BUFFER, this.handle);
    this.gl.getBufferSubData(GL.COPY_READ_BUFFER, srcByteOffset, dstData, dstOffset, length);
    this.gl.bindBuffer(GL.COPY_READ_BUFFER, null);

    // TODO - update local `data` if offsets are 0

    return dstData;
  }

  /**
   * Binds a buffer to a given binding point (target).
   *   GL.TRANSFORM_FEEDBACK_BUFFER and GL.UNIFORM_BUFFER take an index, and optionally a range.
   * @param {Glenum} target - target for the bind operation.
   * @param {GLuint} index= - the index of the target.
   *   - GL.TRANSFORM_FEEDBACK_BUFFER and GL.UNIFORM_BUFFER need an index to affect state
   * @param {GLuint} offset=0 - the index of the target.
   *   - GL.UNIFORM_BUFFER: `offset` must be aligned to GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT.
   * @param {GLuint} size= - the index of the target.
   *   - GL.UNIFORM_BUFFER: `size` must be a minimum of GL.UNIFORM_BLOCK_SIZE_DATA.
   * @returns {Buffer} - Returns itself for chaining.
   */
  bind({
    target = this.target,
    index = this.accessor && this.accessor.index,
    offset = 0,
    size
  } = {}) {
    // NOTE: While GL.TRANSFORM_FEEDBACK_BUFFER and GL.UNIFORM_BUFFER could
    // be used as direct binding points, they will not affect transform feedback or
    // uniform buffer state. Instead indexed bindings need to be made.
    if (target === GL.UNIFORM_BUFFER || target === GL.TRANSFORM_FEEDBACK_BUFFER) {
      if (size !== undefined) {
        this.gl.bindBufferRange(target, index, this.handle, offset, size);
      } else {
        assert(offset === 0); // Make sure offset wasn't supplied
        this.gl.bindBufferBase(target, index, this.handle);
      }
    } else {
      this.gl.bindBuffer(target, this.handle);
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

  // DEPRECATED/REMOVED METHODS

  get data() {
    log.removed('Buffer.data', 'N/A', 'v6.0');
  }

  get bytes() {
    log.deprecated('Buffer.bytes', 'Buffer.byteLength', 'v6.1');
    return this.byteLength;
  }

  // PROTECTED METHODS (INTENDED FOR USE BY OTHER FRAMEWORK CODE ONLY)

  // Returns a short initial data array
  getDebugData() {
    if (!this.debugData) {
      this.debugData = this.getData({length: DEBUG_DATA_LENGTH});
      return {data: this.debugData, changed: true};
    }
    return {data: this.debugData, changed: false};
  }

  invalidateDebugData() {
    this.debugData = null;
  }

  // PRIVATE METHODS

  // Signature: `new Buffer(gl, {data: new Float32Array(...)})`
  // Signature: `new Buffer(gl, new Float32Array(...))`
  // Signature: `new Buffer(gl, 100)`
  _initialize(props = {}) {
    // Signature `new Buffer(gl, new Float32Array(...)`
    if (ArrayBuffer.isView(props)) {
      props = {data: props};
    }

    // Signature: `new Buffer(gl, 100)`
    if (Number.isFinite(props)) {
      props = {byteLength: props};
    }

    if (props.bytes) {
      log.deprecated('bytes', 'byteLength');
    }

    const byteLength = props.byteLength || props.bytes || 0;
    // assert(props.data || byteLength);

    this.usage = props.usage || GL.STATIC_DRAW;

    // DEPRECATE - remove `props` from this list in next major release
    this.setAccessor(new Accessor(props, props.accessor));

    return props.data ? this._setData(props.data) : this._setByteLength(byteLength);
  }

  // Allocate a new buffer and initialize to contents of typed array
  _setData(data, usage = this.usage) {
    assert(ArrayBuffer.isView(data));

    const target = this._getTarget();
    this.gl.bindBuffer(target, this.handle);
    this.gl.bufferData(target, data, usage);
    this.gl.bindBuffer(target, null);

    this.usage = usage;
    this.debugData = data.slice(0, DEBUG_DATA_LENGTH);
    this.byteLength = data.byteLength;
    this.bytesUsed = data.byteLength;

    // infer GL type from supplied typed array
    const type = getGLTypeFromTypedArray(data);
    assert(type);
    this.setAccessor(new Accessor(this.accessor, {type}));
    return this;
  }

  // Allocate a GPU buffer of specified size.
  _setByteLength(byteLength, usage = this.usage) {
    assert(byteLength >= 0);

    // Workaround needed for Safari (#291):
    // gl.bufferData with size equal to 0 crashes. Instead create zero sized array.
    let data = byteLength;
    if (byteLength === 0) {
      data = new Float32Array(0);
    }

    const target = this._getTarget();
    this.gl.bindBuffer(target, this.handle);
    this.gl.bufferData(target, data, usage);
    this.gl.bindBuffer(target, null);

    this.usage = usage;
    this.debugData = null;
    this.byteLength = byteLength;
    this.bytesUsed = byteLength;
    return this;
  }

  // Binding a buffer for the first time locks the type
  // In WebGL2, use GL.COPY_WRITE_BUFFER to avoid locking the type
  _getTarget() {
    return this.gl.webgl2 ? GL.COPY_WRITE_BUFFER : this.target;
  }

  _getAvailableElementCount(srcByteOffset) {
    const ArrayType = getTypedArrayFromGLType(this.accessor.type || GL.FLOAT, {clamped: false});
    const sourceElementOffset = srcByteOffset / ArrayType.BYTES_PER_ELEMENT;
    return this.getElementCount() - sourceElementOffset;
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

  // DEPRECATED

  updateAccessor(opts) {
    log.deprecated('updateAccessor(...)', 'setAccessor(new Accessor(buffer.accessor, ...)');
    this.accessor = new Accessor(this.accessor, opts);
    return this;
  }

  setByteLength(byteLength) {
    log.deprecated('setByteLength', 'reallocate');
    return this.reallocate(byteLength);
  }
}
