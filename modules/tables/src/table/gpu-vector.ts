// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type Buffer,
  type Device,
  type BufferAttributeLayout,
  type BufferLayout,
  type BufferProps
} from '@luma.gl/core';
import {DynamicBuffer, type DynamicBufferProps} from '@luma.gl/engine';
import {GPUData} from './gpu-data';
import {
  getGPUVectorFormatInfo,
  type GPUVectorFormat,
  type GPUVectorType,
  type Interleaved,
  type InterleavedFields
} from './gpu-vector-format';

/** Buffer creation props used by format-specific producers before wrapping storage in a GPUVector. */
export type GPUVectorBufferProps = Omit<BufferProps, 'byteLength' | 'data'>;
/** Dynamic buffer props used when creating appendable GPU vectors. */
export type GPUVectorDynamicBufferProps = Omit<DynamicBufferProps, 'byteLength' | 'data'>;
/** @deprecated Use {@link GPUVectorBufferProps}. */
export type GPUVectorProps = GPUVectorBufferProps;

/** Arrow upload props moved to `@luma.gl/arrow`; retained only as a typed migration sentinel. */
export type GPUVectorFromArrowProps<_T extends GPUVectorType = GPUVectorType> = never;

/** Constructor props that wrap an existing typed GPU buffer. */
export type GPUVectorFromBufferProps<T extends GPUVectorFormat = GPUVectorFormat> = {
  /** Discriminator for existing-buffer construction. */
  type: 'buffer';
  /** Stable vector name. */
  name: string;
  /** Existing GPU buffer. */
  buffer: Buffer | DynamicBuffer;
  /** Canonical memory-layout descriptor for values stored in the buffer, when representable. */
  format?: T;
  /** Number of logical rows in the buffer. */
  length: number;
  /** Number of fixed rows or flattened vertex-list values in the buffer. */
  valueLength?: number;
  /** Number of scalar values represented by one fixed row or flattened element. */
  stride?: number;
  /** Byte offset of the first logical row. */
  byteOffset?: number;
  /** Bytes between adjacent fixed rows or flattened elements. */
  byteStride?: number;
  /** Number of bytes occupied by one fixed row or flattened element payload. */
  rowByteLength?: number;
  /** Whether this vector should destroy the wrapped buffer. */
  ownsBuffer?: boolean;
  /** @deprecated Adapter-owned legacy metadata; core tables do not inspect this value. */
  dataType?: unknown;
};

/** Constructor props that wrap one interleaved GPU buffer. */
export type GPUVectorFromInterleavedProps<_T extends GPUVectorType = GPUVectorType> = {
  /** Discriminator for interleaved-buffer construction. */
  type: 'interleaved';
  /** Stable vector name. */
  name: string;
  /** Existing interleaved GPU buffer. */
  buffer: Buffer | DynamicBuffer;
  /** Optional canonical memory-layout descriptor when the interleaved row also has one value view. */
  format?: GPUVectorFormat;
  /** Named field formats stored in this interleaved row. */
  interleavedFields?: InterleavedFields;
  /** Number of logical rows in the buffer. */
  length: number;
  /** Number of fixed rows or flattened vertex-list values in the buffer. */
  valueLength?: number;
  /** Byte offset of the first logical row. */
  byteOffset?: number;
  /** Bytes between adjacent logical rows. */
  byteStride: number;
  /** Attribute views stored in each interleaved row. */
  attributes: BufferAttributeLayout[];
  /** Whether this vector should destroy the wrapped buffer. */
  ownsBuffer?: boolean;
  /** @deprecated Adapter-owned legacy metadata; core tables do not inspect this value. */
  dataType?: unknown;
};

/** Constructor props that expose existing GPU data chunks as one logical vector. */
export type GPUVectorFromDataProps<T extends GPUVectorFormat = GPUVectorFormat> = {
  /** Discriminator for chunk-backed construction. */
  type: 'data';
  /** Stable vector name. */
  name: string;
  /** Canonical memory-layout descriptor shared by every chunk. Defaults to the first chunk format. */
  format?: T;
  /** Existing GPU data chunks to expose through this vector. */
  data: GPUData<T>[];
  /** Number of scalar values represented by one fixed row or flattened element. */
  stride?: number;
  /** Number of fixed rows or flattened vertex-list values across all chunks. */
  valueLength?: number;
  /** Bytes between adjacent fixed rows or flattened elements. Defaults to the first chunk stride. */
  byteStride?: number;
  /** Number of bytes occupied by one fixed row or flattened element payload. */
  rowByteLength?: number;
  /** Optional buffer layout retained for interleaved chunk collections. */
  bufferLayout?: BufferLayout;
  /** Whether this vector should destroy the supplied GPU data chunks. */
  ownsData?: boolean;
  /** @deprecated Adapter-owned legacy metadata; core tables do not inspect this value. */
  dataType?: unknown;
};

/** Constructor props for an appendable vector that accepts future GPUData chunks. */
export type GPUVectorFromAppendableProps<T extends GPUVectorFormat = GPUVectorFormat> = {
  /** Discriminator for appendable GPUData-backed construction. */
  type: 'appendable';
  /** Stable vector name. */
  name: string;
  /** Device that creates the DynamicBuffer. */
  device: Device;
  /** Canonical memory-layout descriptor for appended data. */
  format: T;
  /** Number of scalar values represented by one fixed row or flattened element. */
  stride?: number;
  /** Initial number of flattened vertex-list values. Defaults to `0`. */
  valueLength?: number;
  /** Bytes between adjacent fixed rows or flattened elements. */
  byteStride?: number;
  /** Number of bytes occupied by one fixed row or flattened element payload. */
  rowByteLength?: number;
  /** Initial row capacity. Defaults to `0`. */
  initialCapacityRows?: number;
  /** Capacity growth multiplier. Defaults to `1.5`. */
  capacityGrowthFactor?: number;
  /** Buffer props forwarded when adapter code creates appended GPUData buffers. */
  bufferProps?: GPUVectorDynamicBufferProps;
  /** @deprecated Adapter-owned legacy metadata; core tables do not inspect this value. */
  dataType?: unknown;
};

/** Discriminated constructor props for {@link GPUVector}. */
type NonInterleavedGPUVectorFormat<T extends GPUVectorType> =
  Extract<T, GPUVectorFormat> extends never ? GPUVectorFormat : Extract<T, GPUVectorFormat>;

type InterleavedGPUVectorFields<T extends GPUVectorType> =
  T extends Interleaved<infer Fields> ? Fields : InterleavedFields;

export type GPUVectorCreateProps<T extends GPUVectorType = GPUVectorType> =
  | GPUVectorFromBufferProps<NonInterleavedGPUVectorFormat<T>>
  | GPUVectorFromInterleavedProps<T>
  | GPUVectorFromDataProps<NonInterleavedGPUVectorFormat<T>>
  | GPUVectorFromAppendableProps<NonInterleavedGPUVectorFormat<T>>;

/**
 * GPU memory and format metadata for one vector-valued table column.
 *
 * Format-specific modules upload bytes and use these vectors to expose shared
 * lifecycle, chunking, batching, and ownership semantics.
 */
export class GPUVector<T extends GPUVectorType = GPUVectorType> {
  /** Stable vector name. */
  readonly name: string;
  /** @deprecated Adapter-owned legacy metadata; core tables do not inspect this value. */
  readonly type?: any;
  /** @deprecated Adapter-owned legacy metadata; core tables do not inspect this value. */
  readonly dataType?: unknown;
  /** Canonical memory-layout descriptor for the uploaded bytes. */
  readonly format?: NonInterleavedGPUVectorFormat<T>;
  /** Named field formats stored in this interleaved vector row, when applicable. */
  readonly interleavedFields?: InterleavedGPUVectorFields<T>;
  /** Number of logical rows represented by the vector. */
  length: number;
  /** Number of fixed rows or flattened vertex-list values represented by the vector. */
  valueLength: number;
  /** Number of scalar values represented by one fixed row or flattened element. */
  readonly stride: number;
  /** Byte offset of the first logical row when this vector has a single GPUData chunk. */
  readonly byteOffset: number;
  /** Bytes between adjacent fixed rows or flattened elements in {@link buffer}. */
  readonly byteStride: number;
  /** Bytes occupied by one fixed row or flattened element payload. */
  readonly rowByteLength: number;
  /** Optional GPU buffer layout described by this vector. */
  readonly bufferLayout?: BufferLayout;
  /** GPU data chunks preserved across table/batch aggregation. Each chunk owns or borrows its buffer. */
  readonly data: GPUData<NonInterleavedGPUVectorFormat<T>>[] = [];
  /** Device retained by appendable vectors so adapters can create future GPUData chunks. */
  readonly device?: Device;
  /** Buffer props retained by appendable vectors for future GPUData chunks. */
  readonly bufferProps?: GPUVectorDynamicBufferProps;
  private isAppendable = false;
  private ownsDataChunks = true;
  private readonly ownedVectors: GPUVector[] = [];
  private appendableByteLength = 0;

  constructor(props: GPUVectorCreateProps<T>) {
    switch (props.type) {
      case 'buffer': {
        const {
          name,
          buffer,
          format,
          length,
          valueLength = length,
          byteOffset = 0,
          ownsBuffer = false
        } = props;
        const {stride, byteStride, rowByteLength} = getResolvedGPUVectorLayout(props);
        this.name = name;
        this.type = props.dataType ?? format;
        this.dataType = props.dataType;
        this.format = format as NonInterleavedGPUVectorFormat<T> | undefined;
        this.length = length;
        this.valueLength = valueLength;
        this.stride = stride;
        this.byteOffset = byteOffset;
        this.byteStride = byteStride;
        this.rowByteLength = rowByteLength;
        this.data.push(
          new GPUData<NonInterleavedGPUVectorFormat<T>>({
            buffer,
            format: format as NonInterleavedGPUVectorFormat<T> | undefined,
            length,
            valueLength,
            stride,
            byteOffset,
            byteStride,
            rowByteLength,
            ownsBuffer,
            dataType: props.dataType
          })
        );
        return;
      }

      case 'interleaved': {
        const {
          name,
          buffer,
          format,
          interleavedFields,
          length,
          valueLength = length,
          byteOffset = 0,
          byteStride,
          attributes,
          ownsBuffer = false
        } = props;
        this.name = name;
        this.type = props.dataType ?? format;
        this.dataType = props.dataType;
        this.format = format as NonInterleavedGPUVectorFormat<T> | undefined;
        this.interleavedFields = interleavedFields as InterleavedGPUVectorFields<T> | undefined;
        this.length = length;
        this.valueLength = valueLength;
        this.stride = byteStride;
        this.byteOffset = byteOffset;
        this.byteStride = byteStride;
        this.rowByteLength = byteStride;
        this.bufferLayout = {name, byteStride, attributes};
        this.data.push(
          new GPUData<NonInterleavedGPUVectorFormat<T>>({
            buffer,
            format: format as NonInterleavedGPUVectorFormat<T> | undefined,
            length,
            valueLength,
            stride: byteStride,
            byteOffset,
            byteStride,
            rowByteLength: byteStride,
            ownsBuffer,
            dataType: props.dataType
          })
        );
        return;
      }

      case 'data': {
        const {
          name,
          format = getFirstGPUVectorDataFormat(props.data),
          data,
          stride = data[0]?.stride ?? getGPUVectorFormatInfo(format).components,
          valueLength = data.reduce(
            (totalValueLength, chunk) => totalValueLength + chunk.valueLength,
            0
          ),
          byteStride = data[0]?.byteStride ?? getGPUVectorFormatInfo(format).byteLength,
          rowByteLength = data[0]?.rowByteLength ?? getGPUVectorFormatInfo(format).byteLength,
          bufferLayout,
          ownsData = false
        } = props;
        validateGPUVectorDataFormats(data, format);
        this.name = name;
        this.type = props.dataType ?? format;
        this.dataType = props.dataType;
        this.format = format;
        this.length = data.reduce((totalLength, chunk) => totalLength + chunk.length, 0);
        this.valueLength = valueLength;
        this.stride = stride;
        this.byteOffset = data.length === 1 ? data[0].byteOffset : 0;
        this.byteStride = byteStride;
        this.rowByteLength = rowByteLength;
        this.bufferLayout = bufferLayout;
        this.ownsDataChunks = ownsData;
        this.data.push(...data);
        return;
      }

      case 'appendable': {
        const {name, device, format, valueLength = 0, bufferProps} = props;
        const {stride, byteStride, rowByteLength} = getResolvedGPUVectorLayout(props);
        this.name = name;
        this.type = props.dataType ?? format;
        this.dataType = props.dataType;
        this.format = format;
        this.length = 0;
        this.valueLength = valueLength;
        this.stride = stride;
        this.byteOffset = 0;
        this.byteStride = byteStride;
        this.rowByteLength = rowByteLength;
        this.device = device;
        this.bufferProps = bufferProps;
        this.isAppendable = true;
        return;
      }
    }
  }

  /** Whether destroying this vector releases any retained GPU storage. */
  get ownsBuffer(): boolean {
    return (
      (this.ownsDataChunks && this.data.some(data => data.ownsBuffer)) ||
      this.ownedVectors.some(vector => vector.ownsBuffer)
    );
  }

  /** Number of rows available in retained GPUData chunks. */
  get capacityRows(): number | undefined {
    return this.isAppendable ? this.length : undefined;
  }

  /** Bytes occupied by already-appended payloads in appendable storage. */
  get appendedByteLength(): number {
    return this.appendableByteLength;
  }

  /** Adds one already-materialized GPU data chunk to this logical vector. */
  addData(data: GPUData<NonInterleavedGPUVectorFormat<T>>): this {
    if (this.format && data.format !== this.format) {
      throw new Error('GPUVector.addData() requires matching formats');
    }
    if (data.byteStride !== this.byteStride) {
      throw new Error('GPUVector.addData() requires matching byteStride');
    }
    if (data.rowByteLength !== this.rowByteLength) {
      throw new Error('GPUVector.addData() requires matching rowByteLength');
    }

    this.data.push(data);
    this.length += data.length;
    this.valueLength += data.valueLength;
    return this;
  }

  /** Adds one adapter-created GPUData chunk to an appendable logical vector. */
  appendDataChunk(
    data: GPUData<NonInterleavedGPUVectorFormat<T>>,
    appendedByteLength = this.appendableByteLength + data.buffer.byteLength
  ): this {
    if (!this.isAppendable) {
      throw new Error('GPUVector.appendDataChunk() requires appendable vector storage');
    }
    if (this.format && data.format !== this.format) {
      throw new Error('GPUVector.appendDataChunk() requires matching formats');
    }
    if (data.byteStride !== this.byteStride || data.rowByteLength !== this.rowByteLength) {
      throw new Error('GPUVector.appendDataChunk() requires matching byte layout metadata');
    }
    this.data.push(data);
    this.length += data.length;
    this.valueLength += data.valueLength;
    this.appendableByteLength = appendedByteLength;
    return this;
  }

  /** Clears appendable logical rows and releases appended GPUData buffers. */
  resetLastBatch(): this {
    if (!this.isAppendable) {
      throw new Error('GPUVector.resetLastBatch() requires appendable vector storage');
    }
    for (const data of this.data.splice(0)) {
      data.destroy();
    }
    this.length = 0;
    this.valueLength = 0;
    this.appendableByteLength = 0;
    return this;
  }

  /** @internal Retains detached batch-local vector ownership under this aggregate vector. */
  retainOwnedVectors(vectors: GPUVector[]): this {
    this.ownedVectors.push(...vectors);
    return this;
  }

  /** Transfers same-buffer ownership to another vector view. */
  transferBufferOwnership(target: GPUVector): void {
    const sourceData = this.data[0];
    const targetData = target.data[0];
    if (!sourceData || !targetData || sourceData.buffer !== targetData.buffer) {
      throw new Error('GPUVector ownership can only be transferred to the same buffer');
    }
    sourceData.transferBufferOwnership(targetData);
  }

  /** Releases owned GPU data and detached ownership handles. */
  destroy(): void {
    if (this.ownsDataChunks) {
      for (const data of this.data) {
        data.destroy();
      }
    }
    for (const vector of this.ownedVectors.splice(0)) {
      vector.destroy();
    }
  }
}

function getResolvedGPUVectorLayout<T extends GPUVectorFormat>(props: {
  format?: T;
  stride?: number;
  byteStride?: number;
  rowByteLength?: number;
}): {stride: number; byteStride: number; rowByteLength: number} {
  const formatInfo = props.format ? getGPUVectorFormatInfo(props.format) : undefined;
  const rowByteLength = props.rowByteLength ?? props.byteStride ?? formatInfo?.byteLength;
  if (rowByteLength === undefined) {
    throw new Error('GPUVector requires format or explicit rowByteLength');
  }
  return {
    stride: props.stride ?? formatInfo?.components ?? 1,
    byteStride: props.byteStride ?? rowByteLength,
    rowByteLength
  };
}

function getFirstGPUVectorDataFormat<T extends GPUVectorFormat>(data: GPUData<T>[]): T {
  const format = data[0]?.format;
  if (!format) {
    throw new Error('GPUVector requires format or at least one GPUData chunk');
  }
  return format;
}

function validateGPUVectorDataFormats<T extends GPUVectorFormat>(
  data: GPUData<T>[],
  format: T
): void {
  const mismatchedChunk = data.find(chunk => chunk.format !== format);
  if (mismatchedChunk) {
    throw new Error('GPUVector data chunks must share the declared format');
  }
}
