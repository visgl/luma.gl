// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  Device,
  type BufferAttributeLayout,
  type BufferLayout,
  type BufferProps
} from '@luma.gl/core';
import {DynamicBuffer, type DynamicBufferProps} from '@luma.gl/engine';
import {DataType, util} from 'apache-arrow';
import {GPUData} from './gpu-data';

/** Buffer creation props used by format-specific producers before wrapping storage in a GPUVector. */
export type GPUVectorBufferProps = Omit<BufferProps, 'byteLength' | 'data'>;
/** Dynamic buffer props used when creating appendable GPU vectors. */
export type GPUVectorDynamicBufferProps = Omit<DynamicBufferProps, 'byteLength' | 'data'>;
/** @deprecated Use {@link GPUVectorBufferProps}. */
export type GPUVectorProps = GPUVectorBufferProps;

/** Arrow upload props moved to `@luma.gl/arrow`; retained only as a typed migration sentinel. */
export type GPUVectorFromArrowProps<_T extends DataType = DataType> = never;

/** Constructor props that wrap an existing typed GPU buffer. */
export type GPUVectorFromBufferProps<T extends DataType = DataType> = {
  /** Discriminator for existing-buffer construction. */
  type: 'buffer';
  /** Stable vector name. */
  name: string;
  /** Existing GPU buffer. */
  buffer: Buffer | DynamicBuffer;
  /** Logical schema/type descriptor for values stored in the buffer. */
  dataType: T;
  /** Number of logical rows in the buffer. */
  length: number;
  /** Number of scalar values represented by one logical row. */
  stride?: number;
  /** Byte offset of the first logical row. */
  byteOffset?: number;
  /** Bytes between adjacent logical rows. */
  byteStride: number;
  /** Number of bytes occupied by one logical row payload. */
  rowByteLength?: number;
  /** Whether this vector should destroy the wrapped buffer. */
  ownsBuffer?: boolean;
};

/** Constructor props that wrap one interleaved GPU buffer. */
export type GPUVectorFromInterleavedProps<T extends DataType = DataType> = {
  /** Discriminator for interleaved-buffer construction. */
  type: 'interleaved';
  /** Stable vector name. */
  name: string;
  /** Existing interleaved GPU buffer. */
  buffer: Buffer | DynamicBuffer;
  /** Logical schema/type descriptor for the interleaved rows. */
  dataType: T;
  /** Number of logical rows in the buffer. */
  length: number;
  /** Byte offset of the first logical row. */
  byteOffset?: number;
  /** Bytes between adjacent logical rows. */
  byteStride: number;
  /** Attribute views stored in each interleaved row. */
  attributes: BufferAttributeLayout[];
  /** Whether this vector should destroy the wrapped buffer. */
  ownsBuffer?: boolean;
};

/** Constructor props that expose existing GPU data chunks as one logical vector. */
export type GPUVectorFromDataProps<T extends DataType = DataType> = {
  /** Discriminator for chunk-backed construction. */
  type: 'data';
  /** Stable vector name. */
  name: string;
  /** Logical schema/type descriptor shared by every chunk. */
  dataType: T;
  /** Existing GPU data chunks to expose through this vector. */
  data: GPUData<T>[];
  /** Optional concrete aggregate buffer shared by the supplied data chunks. */
  buffer?: Buffer | DynamicBuffer;
  /** Number of scalar values represented by one logical row. */
  stride?: number;
  /** Bytes between adjacent logical rows. Defaults to the first chunk stride when available. */
  byteStride?: number;
  /** Number of bytes occupied by one logical row payload. */
  rowByteLength?: number;
  /** Optional buffer layout retained for interleaved chunk collections. */
  bufferLayout?: BufferLayout;
  /** Whether this vector should destroy the supplied GPU data chunks. */
  ownsData?: boolean;
  /** Whether this vector should destroy the optional aggregate buffer. */
  ownsBuffer?: boolean;
};

/** Constructor props for an appendable DynamicBuffer-backed vector. */
export type GPUVectorFromAppendableProps<T extends DataType = DataType> = {
  /** Discriminator for appendable DynamicBuffer-backed construction. */
  type: 'appendable';
  /** Stable vector name. */
  name: string;
  /** Device that creates the DynamicBuffer. */
  device: Device;
  /** Logical schema/type descriptor for appended data. */
  dataType: T;
  /** Number of scalar values represented by one logical row. */
  stride: number;
  /** Bytes between adjacent logical rows. */
  byteStride: number;
  /** Number of bytes occupied by one logical row payload. */
  rowByteLength?: number;
  /** Initial row capacity. Defaults to `0`. */
  initialCapacityRows?: number;
  /** Capacity growth multiplier. Defaults to `1.5`. */
  capacityGrowthFactor?: number;
  /** DynamicBuffer construction props. */
  bufferProps?: GPUVectorDynamicBufferProps;
};

/** Discriminated constructor props for {@link GPUVector}. */
export type GPUVectorCreateProps<T extends DataType = DataType> =
  | GPUVectorFromBufferProps<T>
  | GPUVectorFromInterleavedProps<T>
  | GPUVectorFromDataProps<T>
  | GPUVectorFromAppendableProps<T>;

/**
 * GPU memory and logical type metadata for one vector-valued table column.
 *
 * Format-specific modules upload bytes and use these vectors to expose shared
 * lifecycle, chunking, batching, and ownership semantics.
 */
export class GPUVector<T extends DataType = DataType> {
  /** Stable vector name. */
  readonly name: string;
  /** Logical schema/type descriptor for the uploaded bytes. */
  readonly type: T;
  /** Number of logical rows represented by the vector. */
  length: number;
  /** Number of scalar values represented by one logical row. */
  readonly stride: number;
  /** Byte offset of the first logical row in {@link buffer}. */
  readonly byteOffset: number;
  /** Bytes between adjacent logical rows in {@link buffer}. */
  readonly byteStride: number;
  /** Bytes occupied by one logical row payload. */
  readonly rowByteLength: number;
  /** Optional GPU buffer layout described by this vector. */
  readonly bufferLayout?: BufferLayout;
  /** GPU data chunk views preserved across table/batch aggregation. */
  readonly data: GPUData<T>[] = [];
  private concreteBuffer?: Buffer | DynamicBuffer;
  private ownsConcreteBuffer: boolean;
  private ownsDataChunks = false;
  private readonly ownedVectors: GPUVector[] = [];
  private readonly capacityGrowthFactor?: number;
  private appendableByteLength = 0;

  constructor(props: GPUVectorCreateProps<T>) {
    switch (props.type) {
      case 'buffer': {
        const {
          name,
          buffer,
          dataType,
          length,
          stride = 1,
          byteOffset = 0,
          byteStride,
          rowByteLength = byteStride,
          ownsBuffer = false
        } = props;
        this.name = name;
        this.type = dataType;
        this.length = length;
        this.stride = stride;
        this.byteOffset = byteOffset;
        this.byteStride = byteStride;
        this.rowByteLength = rowByteLength;
        this.concreteBuffer = buffer;
        this.ownsConcreteBuffer = ownsBuffer;
        this.data.push(
          new GPUData({
            buffer: createGPUDataBuffer(buffer),
            dataType,
            length,
            stride,
            byteOffset,
            byteStride,
            rowByteLength,
            ownsBuffer: false
          }) as GPUData<T>
        );
        return;
      }

      case 'interleaved': {
        const {
          name,
          buffer,
          dataType,
          length,
          byteOffset = 0,
          byteStride,
          attributes,
          ownsBuffer = false
        } = props;
        this.name = name;
        this.type = dataType;
        this.length = length;
        this.stride = byteStride;
        this.byteOffset = byteOffset;
        this.byteStride = byteStride;
        this.rowByteLength = byteStride;
        this.bufferLayout = {name, byteStride, attributes};
        this.concreteBuffer = buffer;
        this.ownsConcreteBuffer = ownsBuffer;
        this.data.push(
          new GPUData({
            buffer: createGPUDataBuffer(buffer),
            dataType,
            length,
            stride: byteStride,
            byteOffset,
            byteStride,
            rowByteLength: byteStride,
            ownsBuffer: false
          }) as GPUData<T>
        );
        return;
      }

      case 'data': {
        const {
          name,
          dataType,
          data,
          buffer,
          stride = data[0]?.stride ?? 1,
          byteStride = data[0]?.byteStride ?? 0,
          rowByteLength = data[0]?.rowByteLength ?? byteStride,
          bufferLayout,
          ownsData = false,
          ownsBuffer = false
        } = props;
        if (data.some(chunk => !util.compareTypes(chunk.type, dataType))) {
          throw new Error('GPUVector data chunks must share the declared logical type');
        }
        this.name = name;
        this.type = dataType;
        this.length = data.reduce((totalLength, chunk) => totalLength + chunk.length, 0);
        this.stride = stride;
        this.byteOffset = data.length === 1 ? data[0].byteOffset : 0;
        this.byteStride = byteStride;
        this.rowByteLength = rowByteLength;
        this.bufferLayout = bufferLayout;
        this.data.push(...data);
        this.concreteBuffer = buffer ?? (data.length === 1 ? data[0].buffer : undefined);
        this.ownsConcreteBuffer = ownsBuffer;
        this.ownsDataChunks = ownsData;
        return;
      }

      case 'appendable': {
        const {
          name,
          device,
          dataType,
          stride,
          byteStride,
          rowByteLength = byteStride,
          initialCapacityRows = 0,
          capacityGrowthFactor = 1.5,
          bufferProps
        } = props;
        this.name = name;
        this.type = dataType;
        this.length = 0;
        this.stride = stride;
        this.byteOffset = 0;
        this.byteStride = byteStride;
        this.rowByteLength = rowByteLength;
        this.concreteBuffer = new DynamicBuffer(device, {
          usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
          ...bufferProps,
          id: bufferProps?.id ?? `${name}-appendable-gpu-vector`,
          byteLength: Math.max(1, initialCapacityRows * byteStride)
        });
        this.capacityGrowthFactor = capacityGrowthFactor;
        this.ownsConcreteBuffer = true;
        return;
      }
    }
  }

  /** Directly bindable GPU buffer when this vector has one concrete backing buffer. */
  get buffer(): Buffer | DynamicBuffer {
    if (!this.concreteBuffer) {
      throw new Error('GPUVector.buffer is unavailable for multi-buffer vectors; use data[]');
    }
    return this.concreteBuffer;
  }

  /** Whether destroying this vector releases any retained GPU storage. */
  get ownsBuffer(): boolean {
    return this.ownsConcreteBuffer || this.ownedVectors.some(vector => vector.ownsBuffer);
  }

  /** Number of rows the appendable backing DynamicBuffer can hold without reallocating. */
  get capacityRows(): number | undefined {
    return this.concreteBuffer instanceof DynamicBuffer
      ? Math.floor(this.concreteBuffer.byteLength / this.byteStride)
      : undefined;
  }

  /** Bytes occupied by already-appended payloads in appendable storage. */
  get appendedByteLength(): number {
    return this.appendableByteLength;
  }

  /** Adds one already-materialized GPU data chunk to this logical vector. */
  addData(data: GPUData<T>): this {
    if (!util.compareTypes(data.type, this.type)) {
      throw new Error('GPUVector.addData() requires matching logical types');
    }
    if (data.byteStride !== this.byteStride) {
      throw new Error('GPUVector.addData() requires matching byteStride');
    }
    if (data.rowByteLength !== this.rowByteLength) {
      throw new Error('GPUVector.addData() requires matching rowByteLength');
    }

    this.data.push(data);
    this.length += data.length;
    if (this.data.length > 1) {
      this.concreteBuffer = undefined;
    }
    return this;
  }

  /**
   * Reserves appendable storage and writes raw bytes supplied by a format-specific adapter.
   */
  writeAppendableBytes(
    data: ArrayBufferView,
    byteOffset: number,
    requiredByteLength: number
  ): void {
    if (!(this.concreteBuffer instanceof DynamicBuffer)) {
      throw new Error('GPUVector append writes require appendable DynamicBuffer storage');
    }
    this.ensureAppendableByteCapacity(requiredByteLength);
    if (data.byteLength > 0) {
      this.concreteBuffer.write(data, byteOffset);
    }
  }

  /**
   * Adds one appendable data view while preserving the concrete backing buffer.
   */
  appendDataChunk(data: GPUData<T>, appendedByteLength: number): this {
    if (!(this.concreteBuffer instanceof DynamicBuffer)) {
      throw new Error('GPUVector append views require appendable DynamicBuffer storage');
    }
    if (!util.compareTypes(data.type, this.type)) {
      throw new Error('GPUVector.appendDataChunk() requires matching logical types');
    }
    if (data.byteStride !== this.byteStride || data.rowByteLength !== this.rowByteLength) {
      throw new Error('GPUVector.appendDataChunk() requires matching byte layout metadata');
    }
    this.data.push(data);
    this.length += data.length;
    this.appendableByteLength = appendedByteLength;
    return this;
  }

  /** Clears appendable logical rows while retaining the DynamicBuffer allocation. */
  resetLastBatch(): this {
    if (!(this.concreteBuffer instanceof DynamicBuffer)) {
      throw new Error('GPUVector.resetLastBatch() requires appendable vector storage');
    }
    this.length = 0;
    this.appendableByteLength = 0;
    this.data.length = 0;
    return this;
  }

  /** @internal Retains detached batch-local vector ownership under this aggregate vector. */
  retainOwnedVectors(vectors: GPUVector[]): this {
    this.ownedVectors.push(...vectors);
    return this;
  }

  /** Transfers same-buffer ownership to another vector view. */
  transferBufferOwnership(target: GPUVector): void {
    if (
      !this.concreteBuffer ||
      !target.concreteBuffer ||
      target.concreteBuffer !== this.concreteBuffer
    ) {
      throw new Error('GPUVector ownership can only be transferred to the same buffer');
    }
    target.ownsConcreteBuffer = this.ownsConcreteBuffer;
    this.ownsConcreteBuffer = false;
  }

  /** Releases owned GPU data, detached ownership handles, and appendable storage. */
  destroy(): void {
    if (this.ownsConcreteBuffer && this.concreteBuffer) {
      this.concreteBuffer.destroy();
      this.ownsConcreteBuffer = false;
    }
    for (const vector of this.ownedVectors.splice(0)) {
      vector.destroy();
    }
    if (this.ownsDataChunks) {
      for (const data of this.data) {
        data.destroy();
      }
      this.ownsDataChunks = false;
    }
  }

  private ensureAppendableByteCapacity(requiredByteLength: number): void {
    if (!(this.concreteBuffer instanceof DynamicBuffer)) {
      throw new Error('GPUVector append capacity requires DynamicBuffer storage');
    }
    const capacityByteLength = this.concreteBuffer.byteLength;
    if (requiredByteLength <= capacityByteLength) {
      return;
    }
    const grownByteLength = Math.ceil(
      Math.max(capacityByteLength, 1) * (this.capacityGrowthFactor ?? 1.5)
    );
    const nextCapacityByteLength = Math.max(requiredByteLength, grownByteLength);
    this.concreteBuffer.resize({
      byteLength: nextCapacityByteLength,
      preserveData: this.appendableByteLength > 0,
      copyByteLength: this.appendableByteLength
    });
  }
}

function createGPUDataBuffer(buffer: Buffer | DynamicBuffer): DynamicBuffer {
  return buffer instanceof DynamicBuffer
    ? buffer
    : new DynamicBuffer(buffer.device, {
        buffer,
        ownsBuffer: false
      });
}
