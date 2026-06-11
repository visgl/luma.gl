// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {getGPUVectorFormatInfo, type GPUVectorFormat} from './gpu-vector-format';

/** Optional caller-owned metadata retained on a GPU data range. */
export type GPUDataReadbackMetadata = any;

/** Constructor props that wrap one existing GPU data buffer. */
export type GPUDataFromBufferProps<T extends GPUVectorFormat = GPUVectorFormat> = {
  /** Stable dynamic GPU buffer wrapper for this data range. */
  buffer: Buffer | DynamicBuffer;
  /** Canonical memory-layout descriptor for this data range, when this chunk has one value view. */
  format?: T;
  /** Number of logical rows in the data range. */
  length: number;
  /** Number of fixed rows or flattened vertex-list values in the data range. */
  valueLength?: number;
  /** Number of scalar values represented by one fixed row or flattened element. */
  stride?: number;
  /** Byte offset of the first logical row. */
  byteOffset?: number;
  /** Bytes between adjacent fixed rows or flattened elements. */
  byteStride?: number;
  /** Number of bytes occupied by the fixed row or flattened element payload. */
  rowByteLength?: number;
  /** Whether this data view should destroy the buffer. */
  ownsBuffer?: boolean;
  /** Optional metadata owned by the producer, such as Arrow readback descriptors. */
  readbackMetadata?: GPUDataReadbackMetadata;
  /** Optional row offsets for variable-length values normalized to this data chunk. */
  valueOffsets?: Int32Array;
  /** Optional row validity bitmap normalized to this data chunk. */
  nullBitmap?: Uint8Array;
  /** Optional number of uploaded value bytes referenced by this data chunk. */
  valueByteLength?: number;
  /** Optional adapter-owned metadata; core tables do not inspect this value. */
  dataType?: unknown;
};

/**
 * GPU memory and format metadata for one contiguous data chunk.
 *
 * `GPUData` is Arrow-agnostic. Format-specific adapters upload bytes and retain
 * any extra schema/readback metadata outside table core.
 */
export class GPUData<T extends GPUVectorFormat = GPUVectorFormat> {
  /** GPU buffer containing this chunk's bytes. */
  readonly buffer: Buffer | DynamicBuffer;
  /** Optional adapter-owned metadata; core tables do not inspect this value. */
  readonly dataType?: unknown;
  /** Canonical memory-layout descriptor for this data range, when this chunk has one value view. */
  readonly format?: T;
  /** Number of logical rows in this chunk. */
  readonly length: number;
  /** Number of fixed rows or flattened vertex-list values in this chunk. */
  readonly valueLength: number;
  /** Number of scalar values represented by one fixed row or flattened element. */
  readonly stride: number;
  /** Byte offset of the first logical row in {@link buffer}. */
  readonly byteOffset: number;
  /** Bytes between adjacent fixed rows or flattened elements in {@link buffer}. */
  readonly byteStride: number;
  /** Bytes occupied by one fixed row or flattened element payload. */
  readonly rowByteLength: number;
  /** Optional producer-owned metadata retained for adapter-level readback. */
  readonly readbackMetadata?: GPUDataReadbackMetadata;
  /** Optional row offsets for variable-length values normalized to this data chunk. */
  readonly valueOffsets?: Int32Array;
  /** Optional row validity bitmap normalized to this data chunk. */
  readonly nullBitmap?: Uint8Array;
  /** Optional number of uploaded value bytes referenced by this data chunk. */
  readonly valueByteLength?: number;
  private ownsDataBuffer: boolean;

  constructor({
    buffer,
    format,
    length,
    valueLength,
    stride,
    byteOffset = 0,
    byteStride,
    rowByteLength,
    ownsBuffer = false,
    readbackMetadata,
    valueOffsets,
    nullBitmap,
    valueByteLength,
    dataType
  }: GPUDataFromBufferProps<T>) {
    const formatInfo = format ? getGPUVectorFormatInfo(format) : undefined;
    this.buffer = buffer;
    this.dataType = dataType;
    this.format = format;
    this.length = length;
    this.valueLength = valueLength ?? length;
    this.stride = stride ?? formatInfo?.components ?? byteStride ?? rowByteLength ?? 1;
    this.byteOffset = byteOffset;
    this.rowByteLength = rowByteLength ?? formatInfo?.byteLength ?? byteStride ?? this.stride;
    this.byteStride = byteStride ?? this.rowByteLength;
    this.readbackMetadata = readbackMetadata;
    this.valueOffsets = valueOffsets;
    this.nullBitmap = nullBitmap;
    this.valueByteLength = valueByteLength;
    this.ownsDataBuffer = ownsBuffer;
  }

  /** Whether this data range is responsible for destroying its backing buffer. */
  get ownsBuffer(): boolean {
    return this.ownsDataBuffer;
  }

  /** Transfers backing-buffer ownership to another GPUData chunk over the same buffer. */
  transferBufferOwnership(target: GPUData): void {
    if (target.buffer !== this.buffer) {
      throw new Error('GPUData ownership can only be transferred to the same buffer');
    }
    target.ownsDataBuffer = this.ownsDataBuffer;
    this.ownsDataBuffer = false;
  }

  /** Releases the backing buffer when this data range owns it. */
  destroy(): void {
    if (this.ownsDataBuffer) {
      this.buffer.destroy();
      this.ownsDataBuffer = false;
    }
  }
}
