import type {BufferProps} from '@luma.gl/api';
import {Buffer, assert} from '@luma.gl/api';
import GL from '@luma.gl/constants';
import {WebGLDevice} from '../webgl-device';

const DEBUG_DATA_LENGTH = 10;

/** WebGL Buffer interface */
export class WEBGLBuffer extends Buffer {
  readonly device: WebGLDevice;
  readonly gl: WebGLRenderingContext;
  readonly gl2: WebGL2RenderingContext | null;
  readonly handle: WebGLBuffer;
  readonly target: number;

  byteLength: number;
  bytesUsed: number;
  debugData: ArrayBuffer | null = null;

  webglUsage: number;

  // accessor: {};

  
  constructor(device: WebGLDevice, props: BufferProps = {}) {
    super(device, props);

    this.device = device;
    this.gl = this.device.gl;
    this.gl2 = this.device.gl2;

    const handle = typeof props === 'object' ? (props ).handle : undefined;
    this.handle = handle || this.gl.createBuffer();
    device.setSpectorMetadata(this.handle, {...this.props, data: typeof this.props.data});

    // In WebGL1, need to make sure we use GL.ELEMENT_ARRAY_BUFFER when initializing element buffers
    // otherwise buffer type will lock to generic (non-element) buffer
    // In WebGL2, we can use GL.COPY_READ_BUFFER which avoids locking the type here
    // @ts-expect-error Hack - Checking for subclass prop
    this.target = this.props.target || getWebGLTarget(this.props.usage);
    // @ts-expect-error Hack - Checking for subclass prop
    this.webglUsage = this.props.webglUsage || getWebGLUsage(this.props.usage);
    this.debugData = null;

    // Set data: (re)initializes the buffer
    if (props.data) {
      this._initWithData(props.data, props.byteOffset, props.byteLength);
    } else {
      this._initWithByteLength(props.byteLength || 0);
    }

    // Deprecated: Merge main props and accessor
    // this.accessor = {...props.accessor};

    // Object.seal(this);
  }

  // PRIVATE METHODS

  // Allocate a new buffer and initialize to contents of typed array
  _initWithData(data, byteOffset: number = 0, byteLength: number = data.byteLength + byteOffset): this {
    assert(ArrayBuffer.isView(data));

    const target = this._getWriteTarget();

    this.gl.bindBuffer(target, this.handle);
    this.gl.bufferData(target, byteLength, this.webglUsage);
    this.gl.bufferSubData(target, byteOffset, data);
    this.gl.bindBuffer(target, null);

    this.debugData = data.slice(0, DEBUG_DATA_LENGTH);
    this.bytesUsed = byteLength;
    this.byteLength = byteLength;
    this.trackAllocatedMemory(byteLength);

    return this;
  }

  // Allocate a GPU buffer of specified size.
  _initWithByteLength(byteLength: number): this {
    assert(byteLength >= 0);

    // Workaround needed for Safari (#291):
    // gl.bufferData with size equal to 0 crashes. Instead create zero sized array.
    let data = byteLength;
    if (byteLength === 0) {
      // @ts-expect-error
      data = new Float32Array(0);
    }

    const target = this._getWriteTarget();

    this.gl.bindBuffer(target, this.handle);
    this.gl.bufferData(target, data, this.webglUsage);
    this.gl.bindBuffer(target, null);

    this.debugData = null;
    this.bytesUsed = byteLength;
    this.byteLength = byteLength;

    return this;
  }

  override destroy(): void {
    if (!this.destroyed && this.handle) {
      this.removeStats();
      this.trackDeallocatedMemory();
      this.gl.deleteBuffer(this.handle);
      this.destroyed = true;
      // @ts-expect-error
      this.handle = null;
    }
  }

  override write(data: ArrayBufferView, byteOffset: number = 0): void {
    const srcOffset = 0;
    const byteLength = undefined; // data.byteLength;

    // Create the buffer - binding it here for the first time locks the type
    // In WebGL2, use GL.COPY_WRITE_BUFFER to avoid locking the type
    const target = this.device.isWebGL2 ? GL.COPY_WRITE_BUFFER : this.target;
    this.gl.bindBuffer(target, this.handle);
    // WebGL2: subData supports additional srcOffset and length parameters
    if (srcOffset !== 0 || byteLength !== undefined) {
      this.device.assertWebGL2();
      this.gl2.bufferSubData(target, byteOffset, data, srcOffset, byteLength);
    } else {
      this.gl.bufferSubData(target, byteOffset, data);
    }
    this.gl.bindBuffer(target, null);

    // TODO - update local `data` if offsets are right
    // this.debugData = data.slice(byteOffset, 40);
  }

  /** Read data from the buffer */
  override async readAsync(
    byteOffset: number = 0,
    byteLength?: number
  ): Promise<ArrayBuffer> {
    this.device.assertWebGL2();

    const data = new Uint8Array(byteLength);
    const dstOffset = 0;

    // Use GL.COPY_READ_BUFFER to avoid disturbing other targets and locking type
    this.gl.bindBuffer(GL.COPY_READ_BUFFER, this.handle);
    this.gl2.getBufferSubData(GL.COPY_READ_BUFFER, byteOffset, data, dstOffset, byteLength);
    this.gl.bindBuffer(GL.COPY_READ_BUFFER, null);

    // TODO - update local `data` if offsets are 0
    // this.debugData = null;

    return data;
  }

  // PROTECTED METHODS (INTENDED FOR USE BY OTHER FRAMEWORK CODE ONLY)

  _invalidateDebugData() {
    this.debugData = null;
  }

  _getWriteTarget() {
    return this.target;
    // return this.device.isWebGL2 ? GL.COPY_WRITE_BUFFER : this.target;
  }

  _getReadTarget() {
    return this.target;
    // return this.device.isWebGL2 ? GL.COPY_READ_BUFFER : this.target;
  }
}

// static MAP_READ = 0x01;
// static MAP_WRITE = 0x02;
// static COPY_SRC = 0x0004;
// static COPY_DST = 0x0008;
// static INDEX = 0x0010;
// static VERTEX = 0x0020;
// static UNIFORM = 0x0040;
// static STORAGE = 0x0080;
// static INDIRECT = 0x0100;
// static QUERY_RESOLVE = 0x0200;

function getWebGLTarget(usage: number): GL {
  if (usage & Buffer.INDEX) {
    return GL.ELEMENT_ARRAY_BUFFER;
  }
  if (usage & Buffer.VERTEX) {
    return GL.ARRAY_BUFFER;
  }
  if (usage & Buffer.UNIFORM) {
    return GL.UNIFORM_BUFFER;
  }

  // gl.COPY_READ_BUFFER: Buffer for copying from one buffer object to another.
  // gl.COPY_WRITE_BUFFER: Buffer for copying from one buffer object to another.
  // gl.TRANSFORM_FEEDBACK_BUFFER: Buffer for transform feedback operations.
  // gl.PIXEL_PACK_BUFFER: Buffer used for pixel transfer operations.
  // gl.PIXEL_UNPACK_BUFFER: Buffer used for pixel transfer operations.

  // Binding a buffer for the first time locks the type
  // In WebGL2, use GL.COPY_WRITE_BUFFER to avoid locking the type
  return GL.ARRAY_BUFFER;
}

function getWebGLUsage(usage: number): GL {
  if (usage & Buffer.INDEX) {
    return GL.STATIC_DRAW;
  }
  if (usage & Buffer.VERTEX) {
    return GL.STATIC_DRAW;
  }
  if (usage & Buffer.UNIFORM) {
    return GL.DYNAMIC_DRAW;
  }
  return GL.DYNAMIC_DRAW;
}
