// luma.gl, MIT license
import type Device from './device';
import Resource, {ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';

export type BufferProps = ResourceProps & {
  handle?: WebGLBuffer;

  byteLength?: number;
  data?: ArrayBuffer | ArrayBufferView;

  usage?: number;
  mappedAtCreation?: boolean;
  target?: number;

  accessor?: any; // AccessorObject;

  /** @deprecated */
  index?: number;
  /** @deprecated */
  offset?: number;
  /** @deprecated */
  size?: number;
  /** @deprecated */
  type?: number;
}

// @ts-expect-error
const DEFAULT_BUFFER_PROPS: Required<BufferProps> = {
  ...DEFAULT_RESOURCE_PROPS,
  byteLength: 0,
  data: undefined,
  usage: undefined, // GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
  mappedAtCreation: true
};

/** Abstract GPU buffer */
export default abstract class Buffer extends Resource<BufferProps> {
  // Usage Flags
  static MAP_READ = 0x01;
  static MAP_WRITE = 0x02;
  static COPY_SRC = 0x0004;
  static COPY_DST = 0x0008;
  static INDEX = 0x0010;
  static VERTEX = 0x0020;
  static UNIFORM = 0x0040;
  static STORAGE = 0x0080;
  static INDIRECT = 0x0100;
  static QUERY_RESOLVE = 0x0200;

  get [Symbol.toStringTag](): string { return 'Buffer'; }

  constructor(device: Device, props: BufferProps) {
    super(device, props, DEFAULT_BUFFER_PROPS);
  }

  // Mapped API (WebGPU)

  /** Maps the memory so that it can be read */
  // abstract mapAsync(mode, byteOffset, byteLength): Promise<void>

  /** Get the mapped range of data for reading or writing */
  // abstract getMappedRange(byteOffset, byteLength): ArrayBuffer;

  /** unmap makes the contents of the buffer available to the GPU again */
  // abstract unmap(): void;

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
}
