// luma.gl, MIT license
import {TypedArray} from '../..';
import type {Device} from '../device';
import {Resource, ResourceProps} from './resource';

export type BufferProps = ResourceProps & {
  /** Supply a handle to connect to an existing device-specific buffer */
  handle?: WebGLBuffer;
  /** Specifies how this buffer can be used */
  usage?: number;
  /** Length in bytes of memory to be allocated. If not specified, `byteLength` of  `props.data` will be used. */
  byteLength?: number;
  /** Data to initialize the buffer with. */
  data?: ArrayBuffer | ArrayBufferView | null;
  /** Byte offset into the newly created Buffer to store data at */
  byteOffset?: number;
  /** If props.usage includes Buffer.INDEX */
  indexType?: 'uint16' | 'uint32';

  // TBD
  mappedAtCreation?: boolean;
}

/** Abstract GPU buffer */
export abstract class Buffer extends Resource<BufferProps> {
  static override defaultProps: Required<BufferProps> = {
    ...Resource.defaultProps,
    usage: 0, // Buffer.COPY_DST | Buffer.COPY_SRC
    byteLength: 0,
    byteOffset: 0,
    data: null,
    indexType: 'uint16',
    mappedAtCreation: false
  };

  // Usage Flags
  static MAP_READ = 0x01;
  static MAP_WRITE = 0x02;
  static COPY_SRC = 0x0004;
  static COPY_DST = 0x0008;
  /** Index buffer */
  static INDEX = 0x0010;
  /** Vertex buffer */
  static VERTEX = 0x0020;
  /** Uniform buffer */
  static UNIFORM = 0x0040;
  /** Storage buffer */
  static STORAGE = 0x0080;
  static INDIRECT = 0x0100;
  static QUERY_RESOLVE = 0x0200;

  override get [Symbol.toStringTag](): string { return 'Buffer'; }

  /** The usage with which this buffer was created */
  readonly usage: number;
  /** For index buffers, whether indices are 16 or 32 bit */
  readonly indexType?: 'uint16' | 'uint32';
  /** Length of buffer in bytes */
  abstract byteLength: number;

  constructor(device: Device, props: BufferProps) {
    const deducedProps = {...props};

    // Deduce indexType
    if ((props.usage || 0) & Buffer.INDEX && !props.indexType) {
      if (props.data instanceof Uint32Array) {
        deducedProps.indexType = 'uint32';
      } else if (props.data instanceof Uint16Array) {
        deducedProps.indexType = 'uint16';
      }
    }

    super(device, deducedProps, Buffer.defaultProps);

    this.usage = props.usage || 0;
    this.indexType = deducedProps.indexType;
  }

  write(data: ArrayBufferView, byteOffset?: number): void { throw new Error('not implemented'); }
  readAsync(byteOffset?: number, byteLength?: number): Promise<Uint8Array>  { throw new Error('not implemented'); }
  // TODO - can sync read be supported in WebGPU?
  getData(): TypedArray { throw new Error('not implemented'); }

  // Convenience API

  /** Read data from the buffer *
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

  /** Write data to the buffer *
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

  // Mapped API (WebGPU)

  /** Maps the memory so that it can be read */
  // abstract mapAsync(mode, byteOffset, byteLength): Promise<void>

  /** Get the mapped range of data for reading or writing */
  // abstract getMappedRange(byteOffset, byteLength): ArrayBuffer;

  /** unmap makes the contents of the buffer available to the GPU again */
  // abstract unmap(): void;
}
