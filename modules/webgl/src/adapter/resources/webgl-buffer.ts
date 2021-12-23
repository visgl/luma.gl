
/**
 * import {Buffer as LumaBuffer} from '@luma.gl/webgl';
import {Buffer, BufferProps} from '@luma.gl/api';
import type WebGLDevice from './webgl-device';

const DEFAULT_BUFFER_PROPS = {
  byteLength: 0,
  usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
  mappedAtCreation: true
}

export default class WEBGLBuffer extends Buffer {
  readonly device: WebGLDevice;
  readonly handle: WebGLBuffer;

  readonly buffer: LumaBuffer;
  readonly arrayBuffer: ArrayBuffer | null = null;

  constructor(device: WebGLDevice, props: BufferProps) {
    super(props);

    this.handle = this.props.handle || this.device.gl.createBuffer();
  }

  protected createBuffer() {
    return new LumaBuffer(this.device.handle);
  }

  destroy() {
    this.buffer.delete();
  }

  async writeAsync(offset, size, data) {
    // return this.buffer.setData();
  }

  async readAsync(offset, size) {
    return new ArrayBuffer(0)
  }

  /** Maps the memory so that it can be read *
  async mapAsync(mode, byteOffset, byteLength): Promise<void> {
  }

  /** Get the mapped range of data for reading or writing *
  getMappedRange(byteOffset, byteLength): ArrayBuffer {
    return new ArrayBuffer(0)
  }

  /** unmap makes the contents of the buffer available to the GPU again *
  unmap(): void {}

  // Convenience API

  /* Read data from the buffer *
  async readAsync(options: {
    byteOffset?: number,
    byteLength?: number,
    map?: boolean,
    unmap?: boolean
  }): Promise<ArrayBuffer> {
    if (options.map ?? true) {
      await this.mapAsync(Buffer.MAP_READ, options.byteOffset, options.byteLength);
    }
    const arrayBuffer = this.getMappedRange(options.byteOffset, options.byteLength);
    if (options.unmap ?? true) {
      this.unmap();
    }
    return arrayBuffer;
  }
  */

  /* Write data to the buffer *
  async writeAsync(options: {
    data: ArrayBuffer,
    byteOffset?: number,
    byteLength?: number,
    map?: boolean,
    unmap?: boolean
  }): Promise<void> {
    if (options.map ?? true) {
      await this.mapAsync(Buffer.MAP_WRITE, options.byteOffset, options.byteLength);
    }
    const arrayBuffer = this.getMappedRange(options.byteOffset, options.byteLength);
    const destArray = new Uint8Array(arrayBuffer);
    const srcArray = new Uint8Array(options.data);
    destArray.set(srcArray);
    if (options.unmap ?? true) {
      this.unmap();
    }
  }
  */

  /*
  subData(props) {
    // Signature: buffer.subData(new Float32Array([...]))
    if (ArrayBuffer.isView(props)) {
      props = {data: props};
    }

    const {data, offset = 0, srcOffset = 0} = props;
    const byteLength = props.byteLength || props.length;

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

    this._inferType(data);

    return this;
  }
  */

  /*
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
  *
}
*/
