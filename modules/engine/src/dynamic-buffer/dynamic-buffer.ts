// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BufferMapCallback, BufferProps, Device, Binding as CoreBinding} from '@luma.gl/core';
import {Buffer} from '@luma.gl/core';
import {uid} from '../utils/uid';

/** Controls whether a {@link DynamicBuffer} keeps a CPU-side debug mirror of recent writes. */
export type DynamicBufferDebugProps =
  | boolean
  | {
      /** Maximum number of bytes retained in {@link DynamicBuffer.debugData}. */
      maxByteLength?: number;
    };

/** Construction props for a {@link DynamicBuffer}. */
export type DynamicBufferProps = Omit<BufferProps, 'handle' | 'onMapped'> & {
  /** Enables and optionally sizes the CPU-side debug mirror. */
  debugData?: DynamicBufferDebugProps;
};

/** Buffer-like source accepted by dynamic buffer range helpers. */
export type DynamicBufferBindingSource = Buffer | DynamicBuffer;

/** Binding range that may point at either a {@link Buffer} or a {@link DynamicBuffer}. */
export type DynamicBufferRange = {
  /** Buffer source for the binding range. */
  buffer: DynamicBufferBindingSource;
  /** Byte offset into the current backing buffer. */
  offset?: number;
  /** Byte length of the binding range. */
  size?: number;
};

/** Generic buffer range binding accepted by engine binding resolution helpers. */
export type BufferRangeBinding = {
  /** Buffer source for the binding range. */
  buffer: DynamicBufferBindingSource;
  /** Byte offset into the current backing buffer. */
  offset?: number;
  /** Byte length of the binding range. */
  size?: number;
};

const DEFAULT_MAX_DEBUG_DATA_BYTE_LENGTH = Buffer.DEBUG_DATA_MAX_LENGTH;

/**
 * Mutable engine-level wrapper around an immutable core {@link Buffer}.
 *
 * `DynamicBuffer` keeps a stable application object while allowing the backing
 * GPU buffer to be replaced on resize. Engine classes such as {@link Model} and
 * {@link Material} resolve it to the current backing buffer at draw time and
 * invalidate cached bindings when {@link generation} changes.
 */
export class DynamicBuffer {
  /** Device that owns the backing buffer. */
  readonly device: Device;
  /** Application-provided or generated identifier. */
  readonly id: string;
  /** Ready promise provided for compatibility with other dynamic resources. */
  readonly ready: Promise<Buffer>;
  /** Usage flags applied to every backing buffer created by this wrapper. */
  readonly usage: number;
  /** Normalized buffer props reused when the backing buffer is recreated. */
  readonly props: Readonly<DynamicBufferProps>;

  /** Dynamic buffers are synchronously ready after construction. */
  isReady = true;
  /** Whether {@link destroy} has been called. */
  destroyed = false;
  /** Monotonic version that increments whenever the backing buffer is replaced. */
  generation = 0;
  /** Last update timestamp for writes, reads that populate debug data, or resize operations. */
  updateTimestamp: number;
  /** Token replaced whenever cache users need a new resource identity. */
  cacheToken: object = {};
  /** Optional CPU-side mirror of recent writes and readbacks for debugging. */
  debugData: ArrayBuffer = new ArrayBuffer(0);

  private readonly _debugDataEnabled: boolean;
  private readonly _maxDebugDataByteLength: number;
  private _buffer: Buffer;

  /** Current immutable core buffer backing this dynamic wrapper. */
  get buffer(): Buffer {
    return this._buffer;
  }

  /** Current byte length of the backing buffer. */
  get byteLength(): number {
    return this._buffer.byteLength;
  }

  /** String tag used by `Object.prototype.toString`. */
  get [Symbol.toStringTag](): string {
    return 'DynamicBuffer';
  }

  /** Human-readable debug string. */
  toString(): string {
    return `DynamicBuffer:"${this.id}":${this.byteLength}B`;
  }

  /** Creates a dynamic buffer and its initial backing {@link Buffer}. */
  constructor(device: Device, props: DynamicBufferProps) {
    const {debugData: debugDataProps = false, ...bufferProps} = props;
    const id = props.id || uid('dynamic-buffer');
    const normalizedBufferProps: DynamicBufferProps = {...bufferProps, id};

    if ((normalizedBufferProps.usage || 0) & Buffer.INDEX && !normalizedBufferProps.indexType) {
      if (bufferProps.data instanceof Uint32Array) {
        normalizedBufferProps.indexType = 'uint32';
      } else if (bufferProps.data instanceof Uint16Array) {
        normalizedBufferProps.indexType = 'uint16';
      } else if (bufferProps.data instanceof Uint8Array) {
        normalizedBufferProps.indexType = 'uint8';
      }
    }

    delete normalizedBufferProps.data;
    delete normalizedBufferProps.byteOffset;

    this.device = device;
    this.id = id;
    this.props = normalizedBufferProps;
    this.usage = bufferProps.usage || 0;
    this._debugDataEnabled = Boolean(debugDataProps);
    this._maxDebugDataByteLength =
      typeof debugDataProps === 'object' && debugDataProps.maxByteLength !== undefined
        ? debugDataProps.maxByteLength
        : DEFAULT_MAX_DEBUG_DATA_BYTE_LENGTH;

    this._buffer = this.device.createBuffer({...bufferProps, id});
    this.ready = Promise.resolve(this._buffer);
    this.updateTimestamp = this._buffer.updateTimestamp;

    this._resetDebugData(this._buffer.byteLength);
    if (bufferProps.data) {
      this._writeDebugData(bufferProps.data, bufferProps.byteOffset || 0);
    }
  }

  /**
   * Writes bytes into the current backing buffer.
   *
   * @param data - Bytes or typed-array view to upload.
   * @param byteOffset - Destination byte offset in the backing buffer.
   */
  write(data: ArrayBuffer | SharedArrayBuffer | ArrayBufferView, byteOffset: number = 0): void {
    this._buffer.write(data, byteOffset);
    this._touch();
    this._writeDebugData(data, byteOffset);
  }

  /**
   * Maps the current backing buffer for writing and mirrors the written range when debug data is enabled.
   *
   * @param callback - Callback invoked with the mapped range.
   * @param byteOffset - Byte offset of the mapped range.
   * @param byteLength - Byte length of the mapped range.
   */
  async mapAndWriteAsync(
    callback: BufferMapCallback<void | Promise<void>>,
    byteOffset: number = 0,
    byteLength: number = this.byteLength - byteOffset
  ): Promise<void> {
    let copiedBytes: Uint8Array | null = null;
    await this._buffer.mapAndWriteAsync(
      async (arrayBuffer, lifetime) => {
        await callback(arrayBuffer, lifetime);
        copiedBytes = new Uint8Array(arrayBuffer.slice(0, byteLength));
      },
      byteOffset,
      byteLength
    );
    this._touch();
    if (copiedBytes) {
      this._writeDebugData(copiedBytes, byteOffset);
    }
  }

  /**
   * Reads bytes from the current backing buffer.
   *
   * @param byteOffset - Source byte offset in the backing buffer.
   * @param byteLength - Number of bytes to read.
   */
  async readAsync(
    byteOffset: number = 0,
    byteLength = this.byteLength - byteOffset
  ): Promise<Uint8Array> {
    const data = await this._buffer.readAsync(byteOffset, byteLength);
    if (this._writeDebugData(data, byteOffset)) {
      this._touch();
    }
    return data;
  }

  /**
   * Maps the current backing buffer for reading.
   *
   * @param callback - Callback invoked with the mapped range.
   * @param byteOffset - Byte offset of the mapped range.
   * @param byteLength - Byte length of the mapped range.
   */
  async mapAndReadAsync<T>(
    callback: BufferMapCallback<T>,
    byteOffset: number = 0,
    byteLength: number = this.byteLength - byteOffset
  ): Promise<T> {
    let copiedBytes: Uint8Array | null = null;
    const result = await this._buffer.mapAndReadAsync(
      async (arrayBuffer, lifetime) => {
        copiedBytes = new Uint8Array(arrayBuffer.slice(0));
        return await callback(arrayBuffer, lifetime);
      },
      byteOffset,
      byteLength
    );
    if (copiedBytes && this._writeDebugData(copiedBytes, byteOffset)) {
      this._touch();
    }
    return result;
  }

  /**
   * Replaces the backing buffer with a new size.
   *
   * @param options.byteLength - New backing buffer byte length.
   * @param options.preserveData - Copies bytes from the old buffer into the new buffer.
   * @param options.copyByteLength - Maximum number of bytes to copy when preserving data.
   * @returns `true` when a new backing buffer was created.
   */
  resize(options: {byteLength: number; preserveData?: boolean; copyByteLength?: number}): boolean {
    const {byteLength, preserveData = false} = options;
    if (byteLength === this.byteLength) {
      return false;
    }

    const copyByteLength = Math.min(
      options.copyByteLength ?? Math.min(this.byteLength, byteLength),
      this.byteLength,
      byteLength
    );

    const previousBuffer = this._buffer;
    const previousDebugData = this.debugData.slice(0);
    const {
      data: _initialData,
      byteOffset: _initialByteOffset,
      ...resizableBufferProps
    } = this.props;
    const nextBuffer = this.device.createBuffer({
      ...resizableBufferProps,
      byteLength
    });

    if (preserveData && copyByteLength > 0) {
      this._copyBufferContents(previousBuffer, nextBuffer, copyByteLength);
    }

    this._buffer = nextBuffer;
    this._resetDebugData(byteLength);
    if (preserveData && previousDebugData.byteLength > 0) {
      this._writeDebugData(previousDebugData, 0);
    }

    previousBuffer.destroy();
    this.generation++;
    this.cacheToken = {};
    this._touch();
    return true;
  }

  /**
   * Grows the backing buffer when the requested size exceeds the current size.
   *
   * @param byteLength - Minimum required byte length.
   * @param options.preserveData - Copies existing bytes when growth is required.
   * @returns `true` when the backing buffer grew.
   */
  ensureSize(byteLength: number, options?: {preserveData?: boolean}): boolean {
    if (byteLength <= this.byteLength) {
      return false;
    }

    return this.resize({
      byteLength,
      preserveData: options?.preserveData
    });
  }

  /**
   * Returns the current backing buffer or a range binding over it.
   *
   * @param range - Optional byte range for uniform/storage buffer bindings.
   */
  getBinding(range?: {offset?: number; size?: number}): CoreBinding {
    if (range?.offset === undefined && range?.size === undefined) {
      return this._buffer;
    }

    return {
      buffer: this._buffer,
      offset: range?.offset,
      size: range?.size
    };
  }

  /** Destroys the current backing buffer and clears debug data. */
  destroy(): void {
    if (!this.destroyed) {
      this._buffer.destroy();
      this.destroyed = true;
      this.debugData = new ArrayBuffer(0);
    }
  }

  private _copyBufferContents(
    sourceBuffer: Buffer,
    destinationBuffer: Buffer,
    byteLength: number
  ): void {
    if (this.device.type === 'null') {
      throw new Error(`${this} resize({preserveData: true}) is not supported on NullDevice`);
    }

    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyBufferToBuffer({
      sourceBuffer,
      destinationBuffer,
      size: byteLength
    });
    this.device.submit(commandEncoder.finish());
  }

  private _touch(): void {
    this.updateTimestamp = this.device.incrementTimestamp();
  }

  private _resetDebugData(byteLength: number): void {
    if (!this._debugDataEnabled) {
      this.debugData = new ArrayBuffer(0);
      return;
    }

    this.debugData = new ArrayBuffer(Math.min(byteLength, this._maxDebugDataByteLength));
  }

  private _writeDebugData(
    data: ArrayBuffer | SharedArrayBuffer | ArrayBufferView,
    byteOffset: number
  ): boolean {
    if (
      !this._debugDataEnabled ||
      this.debugData.byteLength === 0 ||
      byteOffset >= this.debugData.byteLength
    ) {
      return false;
    }

    const source = ArrayBuffer.isView(data)
      ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
      : new Uint8Array(data);
    const target = new Uint8Array(this.debugData);
    const copyByteLength = Math.min(source.byteLength, target.byteLength - byteOffset);
    target.set(source.subarray(0, copyByteLength), byteOffset);
    return copyByteLength > 0;
  }
}

/** Returns `true` when a value has the structural shape of a buffer range binding. */
export function isBufferRangeBinding(binding: unknown): binding is BufferRangeBinding {
  return (
    binding !== null &&
    typeof binding === 'object' &&
    'buffer' in (binding as Record<string, unknown>)
  );
}

/** Returns `true` when a range binding points at a {@link DynamicBuffer}. */
export function isDynamicBufferRange(binding: unknown): binding is DynamicBufferRange {
  return isBufferRangeBinding(binding) && binding.buffer instanceof DynamicBuffer;
}

/** Extracts a {@link DynamicBuffer} from a direct binding or range binding. */
export function getDynamicBufferFromBinding(binding: unknown): DynamicBuffer | null {
  if (binding instanceof DynamicBuffer) {
    return binding;
  }

  if (isBufferRangeBinding(binding) && binding.buffer instanceof DynamicBuffer) {
    return binding.buffer;
  }

  return null;
}

/** Resolves a static or dynamic buffer source to the current core {@link Buffer}. */
export function resolveBufferBindingSource(buffer: DynamicBufferBindingSource): Buffer {
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

/** Resolves a dynamic buffer range to a core buffer range over the current backing buffer. */
export function resolveDynamicBufferRangeBinding(binding: DynamicBufferRange): {
  buffer: Buffer;
  offset?: number;
  size?: number;
} {
  return resolveBufferRangeBinding(binding);
}

/** Resolves a buffer range to a core buffer range over the current backing buffer. */
export function resolveBufferRangeBinding(binding: BufferRangeBinding): {
  buffer: Buffer;
  offset?: number;
  size?: number;
} {
  return {
    buffer: resolveBufferBindingSource(binding.buffer),
    offset: binding.offset,
    size: binding.size
  };
}
