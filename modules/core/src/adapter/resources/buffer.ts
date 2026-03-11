// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import {Resource, ResourceProps} from './resource';

/** Callback for Buffer.mapAndReadAsync */
export type BufferMapCallback<T> = (arrayBuffer: ArrayBuffer, lifetime: 'mapped' | 'copied') => T;

export type BufferProps = ResourceProps & {
  /** Supply a handle to connect to an existing device-specific buffer */
  handle?: WebGLBuffer;
  /** Specifies how this buffer can be used */
  usage?: number;
  /** Length in bytes of memory to be allocated. If not specified, `byteLength` of  `props.data` will be used. */
  byteLength?: number;
  /** Byte offset into the newly created Buffer to store data at */
  byteOffset?: number;
  /** If props.usage includes Buffer.INDEX. Note: uint8 indices are automatically converted to uint16 for WebGPU compatibility */
  indexType?: 'uint8' | 'uint16' | 'uint32';
  /** Data to initialize the buffer with. */
  data?: ArrayBuffer | ArrayBufferView | null;
  /** Callback to initialize data without copy */
  onMapped?: BufferMapCallback<void>;
};

/** Abstract GPU buffer */
export abstract class Buffer extends Resource<BufferProps> {
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

  // Usage Flags
  static MAP_READ = 0x01;
  static MAP_WRITE = 0x02;
  static COPY_SRC = 0x0004;
  static COPY_DST = 0x0008;

  override get [Symbol.toStringTag](): string {
    return 'Buffer';
  }

  /** The usage with which this buffer was created */
  readonly usage: number;
  /** For index buffers, whether indices are 8, 16 or 32 bit. Note: uint8 indices are automatically converted to uint16 for WebGPU compatibility */
  readonly indexType?: 'uint8' | 'uint16' | 'uint32';
  /** Length of buffer in bytes */
  abstract byteLength: number;
  /** "Time" of last update, can be used to check if redraw is needed */
  updateTimestamp: number;

  constructor(device: Device, props: BufferProps) {
    const deducedProps = {...props};

    // Deduce indexType
    if ((props.usage || 0) & Buffer.INDEX && !props.indexType) {
      if (props.data instanceof Uint32Array) {
        deducedProps.indexType = 'uint32';
      } else if (props.data instanceof Uint16Array) {
        deducedProps.indexType = 'uint16';
      } else if (props.data instanceof Uint8Array) {
        deducedProps.indexType = 'uint8';
      }
    }

    // Remove data from props before storing, we don't want to hold on to a big chunk of memory
    delete deducedProps.data;

    super(device, deducedProps, Buffer.defaultProps);

    this.usage = deducedProps.usage || 0;
    this.indexType = deducedProps.indexType;

    // TODO - perhaps this should be set on async write completion?
    this.updateTimestamp = device.incrementTimestamp();
  }

  /**
   * Create a copy of this Buffer with new byteLength, with same props but of the specified size.
   * @note Does not copy contents of the cloned Buffer.
   */
  clone(props: {byteLength: number}): Buffer {
    return this.device.createBuffer({...this.props, ...props});
  }

  /** Write data to buffer */
  abstract write(
    data: ArrayBufferLike | ArrayBufferView | SharedArrayBuffer,
    byteOffset?: number
  ): void;

  abstract mapAndWriteAsync(
    onMapped: BufferMapCallback<void | Promise<void>>,
    byteOffset?: number,
    byteLength?: number
  ): Promise<void>;

  /** Reads data asynchronously, returns a copy of the buffer data */
  abstract readAsync(byteOffset?: number, byteLength?: number): Promise<Uint8Array>;

  /** Maps buffer data to CPU memory. Mapped memory is only accessible in the callback */
  abstract mapAndReadAsync<T>(
    onMapped: BufferMapCallback<T>,
    byteOffset?: number,
    byteLength?: number
  ): Promise<T>;

  /** Read data synchronously. @note WebGL2 only */
  abstract readSyncWebGL(byteOffset?: number, byteLength?: number): Uint8Array;

  // PROTECTED METHODS (INTENDED FOR USE BY OTHER FRAMEWORK CODE ONLY)

  /** Max amount of debug data saved. Two vec4's */
  static DEBUG_DATA_MAX_LENGTH = 32;

  /** A partial CPU-side copy of the data in this buffer, for debugging purposes */
  debugData: ArrayBuffer = new ArrayBuffer(0);

  /** This doesn't handle partial non-zero offset updates correctly */
  protected _setDebugData(
    data: ArrayBufferView | ArrayBufferLike | null,
    byteOffset: number,
    byteLength: number
  ): void {
    const arrayBuffer: ArrayBufferLike | null = ArrayBuffer.isView(data) ? data.buffer : data;
    const debugDataLength = Math.min(
      data ? data.byteLength : byteLength,
      Buffer.DEBUG_DATA_MAX_LENGTH
    );
    if (arrayBuffer === null) {
      this.debugData = new ArrayBuffer(debugDataLength);
    } else if (byteOffset === 0 && byteLength === arrayBuffer.byteLength) {
      this.debugData = arrayBuffer.slice(0, debugDataLength);
    } else {
      this.debugData = arrayBuffer.slice(byteOffset, byteOffset + debugDataLength);
    }
  }

  static override defaultProps: Required<BufferProps> = {
    ...Resource.defaultProps,
    usage: 0, // Buffer.COPY_DST | Buffer.COPY_SRC
    byteLength: 0,
    byteOffset: 0,
    data: null,
    indexType: 'uint16',
    onMapped: undefined!
  };
}
