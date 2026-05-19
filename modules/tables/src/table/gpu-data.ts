// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DynamicBuffer} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';

/** Optional caller-owned metadata retained on a GPU data range. */
export type GPUDataReadbackMetadata = any;

/** Constructor props that wrap one existing GPU data buffer. */
export type GPUDataFromBufferProps<T extends arrow.DataType = arrow.DataType> = {
  /** Stable dynamic GPU buffer wrapper for this data range. */
  buffer: DynamicBuffer;
  /** Logical schema/type descriptor for the values in the data range. */
  dataType: T;
  /** Number of logical rows in the data range. */
  length: number;
  /** Number of scalar values represented by one logical row. */
  stride?: number;
  /** Byte offset of the first logical row. */
  byteOffset?: number;
  /** Bytes between adjacent logical rows. */
  byteStride: number;
  /** Number of bytes occupied by the logical row payload. */
  rowByteLength?: number;
  /** Whether this data view should destroy the buffer. */
  ownsBuffer?: boolean;
  /** Optional metadata owned by the producer, such as Arrow readback descriptors. */
  readbackMetadata?: GPUDataReadbackMetadata;
};

/**
 * GPU memory and logical type metadata for one contiguous data chunk.
 *
 * `GPUData` is format-agnostic. Format-specific upload and readback adapters
 * build these ranges and retain any extra metadata they need separately.
 */
export class GPUData<T extends arrow.DataType = arrow.DataType> {
  /** GPU buffer containing this chunk's bytes. */
  readonly buffer: DynamicBuffer;
  /** Logical schema/type descriptor for the bytes. */
  readonly type: T;
  /** Number of logical rows in this chunk. */
  readonly length: number;
  /** Number of scalar values represented by one logical row. */
  readonly stride: number;
  /** Byte offset of the first logical row in {@link buffer}. */
  readonly byteOffset: number;
  /** Bytes between adjacent logical rows in {@link buffer}. */
  readonly byteStride: number;
  /** Bytes occupied by one logical row payload. */
  readonly rowByteLength: number;
  /** Optional producer-owned metadata retained for adapter-level readback. */
  readonly readbackMetadata?: GPUDataReadbackMetadata;
  private ownsDataBuffer: boolean;

  constructor({
    buffer,
    dataType,
    length,
    stride = 1,
    byteOffset = 0,
    byteStride,
    rowByteLength = byteStride,
    ownsBuffer = false,
    readbackMetadata
  }: GPUDataFromBufferProps<T>) {
    this.buffer = buffer;
    this.type = dataType;
    this.length = length;
    this.stride = stride;
    this.byteOffset = byteOffset;
    this.byteStride = byteStride;
    this.rowByteLength = rowByteLength;
    this.readbackMetadata = readbackMetadata;
    this.ownsDataBuffer = ownsBuffer;
  }

  /** Whether this data range is responsible for destroying its backing buffer. */
  get ownsBuffer(): boolean {
    return this.ownsDataBuffer;
  }

  /** Releases the backing buffer when this data range owns it. */
  destroy(): void {
    if (this.ownsDataBuffer) {
      this.buffer.destroy();
      this.ownsDataBuffer = false;
    }
  }
}
