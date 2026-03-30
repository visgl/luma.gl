// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BufferMapCallback, BufferProps, Device, Binding as CoreBinding} from '@luma.gl/core';
import {Buffer} from '@luma.gl/core';
import {uid} from '../utils/uid';

export type DynamicBufferDebugProps =
  | boolean
  | {
      maxByteLength?: number;
    };

export type DynamicBufferProps = Omit<BufferProps, 'handle' | 'onMapped'> & {
  debugData?: DynamicBufferDebugProps;
};

export type DynamicBufferBindingSource = Buffer | DynamicBuffer;

export type DynamicBufferRange = {
  buffer: DynamicBufferBindingSource;
  offset?: number;
  size?: number;
};

export type BufferRangeBinding = {
  buffer: DynamicBufferBindingSource;
  offset?: number;
  size?: number;
};

const DEFAULT_MAX_DEBUG_DATA_BYTE_LENGTH = Buffer.DEBUG_DATA_MAX_LENGTH;

export class DynamicBuffer {
  readonly device: Device;
  readonly id: string;
  readonly ready: Promise<Buffer>;
  readonly usage: number;
  readonly props: Readonly<DynamicBufferProps>;

  isReady = true;
  destroyed = false;
  generation = 0;
  updateTimestamp: number;
  cacheToken: object = {};
  debugData: ArrayBuffer = new ArrayBuffer(0);

  private readonly _debugDataEnabled: boolean;
  private readonly _maxDebugDataByteLength: number;
  private _buffer: Buffer;

  get buffer(): Buffer {
    return this._buffer;
  }

  get byteLength(): number {
    return this._buffer.byteLength;
  }

  get [Symbol.toStringTag](): string {
    return 'DynamicBuffer';
  }

  toString(): string {
    return `DynamicBuffer:"${this.id}":${this.byteLength}B`;
  }

  constructor(device: Device, props: DynamicBufferProps) {
    const {debugData: debugDataProps = false, ...bufferProps} = props;
    const id = props.id || uid('dynamic-buffer');

    this.device = device;
    this.id = id;
    this.props = {...bufferProps, id};
    this.usage = bufferProps.usage || 0;
    this._debugDataEnabled = Boolean(debugDataProps);
    this._maxDebugDataByteLength =
      typeof debugDataProps === 'object' && debugDataProps.maxByteLength !== undefined
        ? debugDataProps.maxByteLength
        : DEFAULT_MAX_DEBUG_DATA_BYTE_LENGTH;

    this._buffer = this.device.createBuffer(this.props);
    this.ready = Promise.resolve(this._buffer);
    this.updateTimestamp = this._buffer.updateTimestamp;

    this._resetDebugData(this._buffer.byteLength);
    if (bufferProps.data) {
      this._writeDebugData(bufferProps.data, bufferProps.byteOffset || 0);
    }
  }

  write(data: ArrayBuffer | SharedArrayBuffer | ArrayBufferView, byteOffset: number = 0): void {
    this._buffer.write(data, byteOffset);
    this._touch();
    this._writeDebugData(data, byteOffset);
  }

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
    const nextBuffer = this.device.createBuffer({
      ...this.props,
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

  ensureSize(byteLength: number, options?: {preserveData?: boolean}): boolean {
    if (byteLength <= this.byteLength) {
      return false;
    }

    return this.resize({
      byteLength,
      preserveData: options?.preserveData
    });
  }

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

export function isBufferRangeBinding(binding: unknown): binding is BufferRangeBinding {
  return (
    binding !== null &&
    typeof binding === 'object' &&
    'buffer' in (binding as Record<string, unknown>)
  );
}

export function isDynamicBufferRange(binding: unknown): binding is DynamicBufferRange {
  return isBufferRangeBinding(binding) && binding.buffer instanceof DynamicBuffer;
}

export function getDynamicBufferFromBinding(binding: unknown): DynamicBuffer | null {
  if (binding instanceof DynamicBuffer) {
    return binding;
  }

  if (isBufferRangeBinding(binding) && binding.buffer instanceof DynamicBuffer) {
    return binding.buffer;
  }

  return null;
}

export function resolveBufferBindingSource(buffer: DynamicBufferBindingSource): Buffer {
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

export function resolveDynamicBufferRangeBinding(binding: DynamicBufferRange): {
  buffer: Buffer;
  offset?: number;
  size?: number;
} {
  return resolveBufferRangeBinding(binding);
}

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
