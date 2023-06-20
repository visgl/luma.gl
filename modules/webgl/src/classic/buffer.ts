// luma.gl, MIT license

import type {Device, BufferProps, TypedArray} from '@luma.gl/api';
import {assert, checkProps} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {assertWebGL2Context} from '../context/context/webgl-checks';
import {AccessorObject} from '../types';
import {Accessor} from './accessor';
import {getGLTypeFromTypedArray, getTypedArrayFromGLType} from './typed-array-utils';

import {WebGLDevice} from '../adapter/webgl-device';
import {WEBGLBuffer} from '../adapter/resources/webgl-buffer';

const DEBUG_DATA_LENGTH = 10;

// Shared prop checks for constructor and setProps
const DEPRECATED_PROPS = {
  offset: 'accessor.offset',
  stride: 'accessor.stride',
  type: 'accessor.type',
  size: 'accessor.size',
  divisor: 'accessor.divisor',
  normalized: 'accessor.normalized',
  integer: 'accessor.integer',
  instanced: 'accessor.divisor',
  isInstanced: 'accessor.divisor'
};

// Prop checks for constructor
const PROP_CHECKS_INITIALIZE = {
  removedProps: {},
  replacedProps: {
    bytes: 'byteLength'
  },
  // new Buffer() with individual accessor props is still used in apps, emit warnings
  deprecatedProps: DEPRECATED_PROPS
};

// Prop checks for setProps
const PROP_CHECKS_SET_PROPS = {
  // Buffer.setProps() with individual accessor props is rare => emit errors
  removedProps: DEPRECATED_PROPS
};

function getWEBGLBufferProps(props: ClassicBufferProps | ArrayBufferView | number): BufferProps {
  // Signature `new Buffer(gl, new Float32Array(...)`
  if (ArrayBuffer.isView(props)) {
    return {data: props};
  }

  // Signature: `new Buffer(gl, 100)`
  else if (typeof props === 'number') {
    return {byteLength: props };
  }

  props = checkProps('Buffer', props, PROP_CHECKS_INITIALIZE);
  const bufferProps = {...props };
  if (bufferProps.offset) {
    bufferProps.byteOffset = bufferProps.offset;
  }
  return bufferProps;
}

/** WebGL Buffer interface */
export type ClassicBufferProps = BufferProps & {
  handle?: WebGLBuffer;

  target?: number;
  webglUsage?: number;

  accessor?: AccessorObject;

  /** @deprecated */
  index?: number;
  /** @deprecated */
  offset?: number;
  /** @deprecated */
  size?: number;
  /** @deprecated */
  type?: number
}

/** WebGL Buffer interface */
export class ClassicBuffer extends WEBGLBuffer {
  usage: number;
  accessor: Accessor;

  constructor(device: Device | WebGLRenderingContext, props?: ClassicBufferProps);
  constructor(device: Device | WebGLRenderingContext, data: ArrayBufferView | number[]);
  constructor(device: Device | WebGLRenderingContext, byteLength: number);

  constructor(device: Device | WebGLRenderingContext, props = {}) {
    super(WebGLDevice.attach(device), getWEBGLBufferProps(props));

    // Base class initializes
    // this.initialize(props);

    // Deprecated: Merge main props and accessor
    this.setAccessor(Object.assign({}, props, (props as ClassicBufferProps).accessor));

    // infer GL type from supplied typed array
    if (this.props.data) {
      const type = getGLTypeFromTypedArray(this.props.data as TypedArray);
      assert(type);
      this.setAccessor(new Accessor(this.accessor, {type}));
    }

    Object.seal(this);
  }

  // override write(data: TypedArray, byteOffset: number = 0): void {
  //   this.subData({data, offset: byteOffset});
  // }

  // returns number of elements in the buffer (assuming that the full buffer is used)
  getElementCount(accessor: AccessorObject = this.accessor): number {
    return Math.round(this.byteLength / Accessor.getBytesPerElement(accessor));
  }

  // returns number of vertices in the buffer (assuming that the full buffer is used)
  getVertexCount(accessor: AccessorObject = this.accessor): number {
    return Math.round(this.byteLength / Accessor.getBytesPerVertex(accessor));
  }

  // Creates and initializes the buffer object's data store.
  // Signature: `new Buffer(gl, {data: new Float32Array(...)})`
  // Signature: `new Buffer(gl, new Float32Array(...))`
  // Signature: `new Buffer(gl, 100)`
  initialize(props: ClassicBufferProps = {}): this {
    // Signature `new Buffer(gl, new Float32Array(...)`
    if (ArrayBuffer.isView(props)) {
      props = {data: props};
    }

    // Signature: `new Buffer(gl, 100)`
    if (Number.isFinite(props)) {
      // @ts-expect-error
      props = {byteLength: props};
    }

    props = checkProps('Buffer', props, PROP_CHECKS_INITIALIZE);

    // Initialize member fields
    this.webglUsage = props.webglUsage || GL.STATIC_DRAW;
    this.debugData = null;

    // Deprecated: Merge main props and accessor
    this.setAccessor(Object.assign({}, props, props.accessor));

    // Set data: (re)initializes the buffer
    if (props.data) {
      this._setData(props.data, props.offset, props.byteLength);
    } else {
      this._setByteLength(props.byteLength || 0);
    }

    return this;
  }

  setProps(props: ClassicBufferProps): this {
    props = checkProps('Buffer', props, PROP_CHECKS_SET_PROPS);

    if ('accessor' in props) {
      this.setAccessor(props.accessor);
    }

    return this;
  }

  // Optionally stores an accessor with the buffer, makes it easier to use it as an attribute later
  // {type, size = 1, offset = 0, stride = 0, normalized = false, integer = false, divisor = 0}
  setAccessor(accessor: AccessorObject | Accessor): this {
    // NOTE: From luma.gl v7.0, Accessors have an optional `buffer `field
    // (mainly to support "interleaving")
    // To avoid confusion, ensure `buffer.accessor` does not have a `buffer.accessor.buffer` field:
    accessor = Object.assign({}, accessor);
    // @ts-expect-error
    delete accessor.buffer;

    // This new statement ensures that an "accessor object" is re-packaged as an Accessor instance
    this.accessor = new Accessor(accessor);
    return this;
  }

  // Allocate a bigger GPU buffer (if the current buffer is not big enough).
  // If a reallocation is triggered it clears the buffer
  // Returns:
  //  `true`: buffer was reallocated, data was cleared
  //  `false`: buffer was big enough, data is intact
  reallocate(byteLength: number): boolean {
    if (byteLength > this.byteLength) {
      this._setByteLength(byteLength);
      return true;
    }
    this.bytesUsed = byteLength;
    return false;
  }

  // Update with new data. Reinitializes the buffer
  setData(props: ClassicBufferProps) {
    return this.initialize(props);
  }

  // Updates a subset of a buffer object's data store.
  // Data (Typed Array or ArrayBuffer), length is inferred unless provided
  // Offset into buffer
  // WebGL2 only: Offset into srcData
  // WebGL2 only: Number of bytes to be copied
  subData(options: TypedArray | {data: TypedArray, offset?: number; srcOffset?: number; byteLength?: number, length?: number}) {
    // Signature: buffer.subData(new Float32Array([...]))
    if (ArrayBuffer.isView(options)) {
      options = {data: options};
    }

    const {data, offset = 0, srcOffset = 0} = options;
    const byteLength = options.byteLength || options.length;

    assert(data);

    // Create the buffer - binding it here for the first time locks the type
    // In WebGL2, use GL.COPY_WRITE_BUFFER to avoid locking the type
    // @ts-expect-error
    const target = this.gl.webgl2 ? GL.COPY_WRITE_BUFFER : this.target;
    this.gl.bindBuffer(target, this.handle);
    // WebGL2: subData supports additional srcOffset and length parameters
    if (srcOffset !== 0 || byteLength !== undefined) {
      assertWebGL2Context(this.gl);
      // @ts-expect-error
      this.gl.bufferSubData(this.target, offset, data, srcOffset, byteLength);
    } else {
      this.gl.bufferSubData(target, offset, data);
    }
    this.gl.bindBuffer(target, null);

    // TODO - update local `data` if offsets are right
    this.debugData = null;

    this._inferType(data);

    return this;
  }

  /**
   * Copies part of the data of another buffer into this buffer
   * @note WEBGL2 ONLY
   */
  copyData(options: {
    sourceBuffer: any;
    readOffset?: number;
    writeOffset?: number;
    size: any;
  }): this {
    const {sourceBuffer, readOffset = 0, writeOffset = 0, size} = options;
    const {gl, gl2} = this;
    assertWebGL2Context(gl);

    // Use GL.COPY_READ_BUFFER+GL.COPY_WRITE_BUFFER avoid disturbing other targets and locking type
    gl.bindBuffer(GL.COPY_READ_BUFFER, sourceBuffer.handle);
    gl.bindBuffer(GL.COPY_WRITE_BUFFER, this.handle);
    gl2?.copyBufferSubData(GL.COPY_READ_BUFFER, GL.COPY_WRITE_BUFFER, readOffset, writeOffset, size);
    gl.bindBuffer(GL.COPY_READ_BUFFER, null);
    gl.bindBuffer(GL.COPY_WRITE_BUFFER, null);

    // TODO - update local `data` if offsets are 0
    this.debugData = null;

    return this;
  }

  /**
   * Reads data from buffer into an ArrayBufferView or SharedArrayBuffer.
   * @note WEBGL2 ONLY
   */
  override getData(options?: {
    dstData?: any;
    srcByteOffset?: number;
    dstOffset?: number;
    length?: number;
  }): any {
    let {dstData = null, length = 0} = options || {};
    const {srcByteOffset = 0, dstOffset = 0} = options || {};
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
    this.gl2?.getBufferSubData(GL.COPY_READ_BUFFER, srcByteOffset, dstData, dstOffset, length);
    this.gl.bindBuffer(GL.COPY_READ_BUFFER, null);

    // TODO - update local `data` if offsets are 0
    return dstData;
  }

  /**
   * Binds a buffer to a given binding point (target).
   *   GL.TRANSFORM_FEEDBACK_BUFFER and GL.UNIFORM_BUFFER take an index, and optionally a range.
   *   - GL.TRANSFORM_FEEDBACK_BUFFER and GL.UNIFORM_BUFFER need an index to affect state
   *   - GL.UNIFORM_BUFFER: `offset` must be aligned to GL.UNIFORM_BUFFER_OFFSET_ALIGNMENT.
   *   - GL.UNIFORM_BUFFER: `size` must be a minimum of GL.UNIFORM_BLOCK_SIZE_DATA.
   */
  bind(options?: {target?: number; index?: any; offset?: number; size: any}): this {
    const {
      target = this.target, // target for the bind operation
      index = this.accessor && this.accessor.index, // index = index of target (indexed bind point)
      offset = 0,
      size
    } = options || {};
    // NOTE: While GL.TRANSFORM_FEEDBACK_BUFFER and GL.UNIFORM_BUFFER could
    // be used as direct binding points, they will not affect transform feedback or
    // uniform buffer state. Instead indexed bindings need to be made.
    if (target === GL.UNIFORM_BUFFER || target === GL.TRANSFORM_FEEDBACK_BUFFER) {
      if (size !== undefined) {
        this.gl2?.bindBufferRange(target, index, this.handle, offset, size);
      } else {
        assert(offset === 0); // Make sure offset wasn't supplied
        this.gl2?.bindBufferBase(target, index, this.handle);
      }
    } else {
      this.gl.bindBuffer(target, this.handle);
    }

    return this;
  }

  unbind(options?: {target?: any; index?: any}): this {
    const {target = this.target, index = this.accessor && this.accessor.index} = options || {};
    const isIndexedBuffer = target === GL.UNIFORM_BUFFER || target === GL.TRANSFORM_FEEDBACK_BUFFER;
    if (isIndexedBuffer) {
      this.gl2?.bindBufferBase(target, index, null);
    } else {
      this.gl.bindBuffer(target, null);
    }
    return this;
  }

  // PROTECTED METHODS (INTENDED FOR USE BY OTHER FRAMEWORK CODE ONLY)

  // Returns a short initial data array
  getDebugData(): {
    data: any;
    changed: boolean;
    } {
    if (!this.debugData) {
      this.debugData = this.getData({length: Math.min(DEBUG_DATA_LENGTH, this.byteLength)});
      return {data: this.debugData, changed: true};
    }
    return {data: this.debugData, changed: false};
  }

  invalidateDebugData() {
    this.debugData = null;
  }

  // PRIVATE METHODS

  // Allocate a new buffer and initialize to contents of typed array
  _setData(data, offset: number = 0, byteLength: number = data.byteLength + offset): this {
    assert(ArrayBuffer.isView(data));

    this.trackDeallocatedMemory();

    const target = this._getTarget();
    this.gl.bindBuffer(target, this.handle);
    this.gl.bufferData(target, byteLength, this.webglUsage);
    this.gl.bufferSubData(target, offset, data);
    this.gl.bindBuffer(target, null);

    this.debugData = data.slice(0, DEBUG_DATA_LENGTH);
    this.bytesUsed = byteLength;
    this.byteLength = byteLength;
    this.trackAllocatedMemory(byteLength);

    // infer GL type from supplied typed array
    const type = getGLTypeFromTypedArray(data);
    assert(type);
    this.setAccessor(new Accessor(this.accessor, {type}));
    return this;
  }

  // Allocate a GPU buffer of specified size.
  _setByteLength(byteLength: number, webglUsage = this.webglUsage): this {
    assert(byteLength >= 0);

    this.trackDeallocatedMemory();

    // Workaround needed for Safari (#291):
    // gl.bufferData with size equal to 0 crashes. Instead create zero sized array.
    let data = byteLength;
    if (byteLength === 0) {
      // @ts-expect-error
      data = new Float32Array(0);
    }

    const target = this._getTarget();
    this.gl.bindBuffer(target, this.handle);
    this.gl.bufferData(target, data, webglUsage);
    this.gl.bindBuffer(target, null);

    this.webglUsage = webglUsage;
    this.debugData = null;
    this.bytesUsed = byteLength;
    this.byteLength = byteLength;

    this.trackAllocatedMemory(byteLength);

    return this;
  }

  // Binding a buffer for the first time locks the type
  // In WebGL2, use GL.COPY_WRITE_BUFFER to avoid locking the type
  _getTarget() {
    // @ts-expect-error
    return this.gl.webgl2 ? GL.COPY_WRITE_BUFFER : this.target;
  }

  _getAvailableElementCount(srcByteOffset: number) {
    const ArrayType = getTypedArrayFromGLType(this.accessor.type || GL.FLOAT, {clamped: false});
    const sourceElementOffset = srcByteOffset / ArrayType.BYTES_PER_ELEMENT;
    return this.getElementCount() - sourceElementOffset;
  }

  // Automatically infers type from typed array passed to setData
  // Note: No longer that useful, since type is now autodeduced from the compiled shaders
  _inferType(data) {
    if (!this.accessor.type) {
      this.setAccessor(new Accessor(this.accessor, {type: getGLTypeFromTypedArray(data)}));
    }
  }

  // RESOURCE METHODS

  getParameter(pname: GL): any {
    this.gl.bindBuffer(this.target, this.handle);
    const value = this.gl.getBufferParameter(this.target, pname);
    this.gl.bindBuffer(this.target, null);
    return value;
  }

  // DEPRECATIONS - v7.0
  /** @deprecated Use Buffer.accessor.type */
  get type() {
    return this.accessor.type;
  }
}
