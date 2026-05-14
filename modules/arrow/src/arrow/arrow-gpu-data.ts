// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Device, type BigTypedArray} from '@luma.gl/core';
import {DynamicBuffer, type DynamicBufferProps} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';
import type {AttributeArrowType, NumericArrowType} from './arrow-types';

type GPUDataBufferProps = Omit<DynamicBufferProps, 'byteLength' | 'data' | 'buffer' | 'ownsBuffer'>;

/** Constructor props that wrap one existing typed GPU data buffer. */
export type GPUDataFromBufferProps<T extends arrow.DataType = AttributeArrowType> = {
  /** Stable dynamic GPU buffer wrapper for this data range. */
  buffer: DynamicBuffer;
  /** Arrow type that describes the values in the data chunk. */
  arrowType: T;
  /** Number of logical rows in the data chunk. */
  length: number;
  /** Byte offset of the first logical row. */
  byteOffset?: number;
  /** Bytes between adjacent logical rows. Defaults to the byte width of `arrowType`. */
  byteStride?: number;
  /** Whether this data view should destroy the buffer. */
  ownsBuffer?: boolean;
};

type GPUVectorReadableBuffer = Pick<Buffer, 'readAsync'>;

type GPUVectorReadProps<T extends AttributeArrowType> = {
  type: T;
  buffer: GPUVectorReadableBuffer;
  length: number;
  byteOffset: number;
  byteStride: number;
};

type NumericTypedArrayConstructor = {
  readonly BYTES_PER_ELEMENT: number;
  new (buffer: ArrayBufferLike, byteOffset?: number, length?: number): BigTypedArray;
};

const makeNumericData = arrow.makeData as <T extends NumericArrowType>(props: {
  type: T;
  length: number;
  data: T['TArray'];
}) => arrow.Data<T>;

const makeFixedSizeListData = arrow.makeData as <T extends NumericArrowType>(props: {
  type: arrow.FixedSizeList<T>;
  length: number;
  nullCount: number;
  nullBitmap: null;
  child: arrow.Data<T>;
}) => arrow.Data<arrow.FixedSizeList<T>>;

/**
 * GPU memory and Arrow type metadata for one Arrow Data chunk.
 *
 * GPUData can own a dedicated buffer when constructed from Arrow Data, or
 * describe a byte-range view into a shared static or dynamic GPU buffer.
 */
export class GPUData<T extends arrow.DataType = AttributeArrowType> {
  /** GPU buffer containing the Arrow data chunk's attribute-compatible value memory. */
  readonly buffer: DynamicBuffer;
  /** Arrow type that describes the uploaded data chunk. */
  readonly type: T;
  /** Number of logical Arrow rows in this chunk. */
  readonly length: number;
  /** Number of scalar values per logical row. */
  readonly stride: number;
  /** Byte offset of the first logical row in {@link buffer}. */
  readonly byteOffset: number;
  /** Bytes between adjacent logical rows in {@link buffer}. */
  readonly byteStride: number;
  /** Whether this data view is responsible for destroying {@link buffer}. */
  private _ownsBuffer: boolean;

  /** Creates a GPU representation from one Arrow Data chunk. */
  constructor(device: Device, data: arrow.Data<T & AttributeArrowType>, props?: GPUDataBufferProps);
  /** Creates a data view over an existing GPU buffer. */
  constructor(props: GPUDataFromBufferProps<T>);
  constructor(
    deviceOrProps: Device | GPUDataFromBufferProps<any>,
    data?: arrow.Data<T & AttributeArrowType>,
    props: GPUDataBufferProps = {}
  ) {
    if (deviceOrProps instanceof Device) {
      const arrowData = data!;
      this.type = arrowData.type as T;
      this.length = arrowData.length;
      this.stride = getArrowTypeStride(arrowData.type);
      this.byteOffset = 0;
      this.byteStride = getArrowTypeByteStride(arrowData.type);
      this.buffer = new DynamicBuffer(deviceOrProps, {
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        ...props,
        data: getArrowDataBufferSource(arrowData as any)
      });
      this._ownsBuffer = true;
      return;
    }

    const {
      buffer,
      arrowType,
      length,
      byteOffset = 0,
      byteStride = getArrowTypeByteStride(arrowType),
      ownsBuffer = false
    } = deviceOrProps;
    this.buffer = buffer;
    this.type = arrowType as T;
    this.length = length;
    this.stride = getArrowTypeStride(arrowType);
    this.byteOffset = byteOffset;
    this.byteStride = byteStride;
    this._ownsBuffer = ownsBuffer;
  }

  get ownsBuffer(): boolean {
    return this._ownsBuffer;
  }

  /** Reads this GPU chunk back into a single non-null Arrow Data chunk. */
  async readAsync(): Promise<arrow.Data<T>> {
    const vector = await readArrowGPUVectorAsync({
      type: this.type as unknown as AttributeArrowType,
      buffer: this.buffer,
      length: this.length,
      byteOffset: this.byteOffset,
      byteStride: this.byteStride
    });
    return vector.data[0] as unknown as arrow.Data<T>;
  }

  destroy(): void {
    if (this._ownsBuffer) {
      this.buffer.destroy();
      this._ownsBuffer = false;
    }
  }
}

export function getArrowDataBufferSource<T extends NumericArrowType>(
  data: arrow.Data<T>
): T['TArray'];
export function getArrowDataBufferSource<T extends NumericArrowType>(
  data: arrow.Data<arrow.FixedSizeList<T>>
): T['TArray'];
export function getArrowDataBufferSource<T extends AttributeArrowType>(
  data: arrow.Data<T>
): NumericArrowType['TArray'];
/** Return the uploadable typed-array view for one Arrow Data chunk. */
export function getArrowDataBufferSource(data: arrow.Data): NumericArrowType['TArray'] {
  const {values, startElement, elementCount} = getArrowDataValueRange(data);
  if (values.length < elementCount) {
    throw new Error('Arrow data values are shorter than the logical upload length');
  }
  if (values.length === elementCount) {
    return values;
  }

  const endElement = startElement + elementCount;
  if (endElement > values.length) {
    throw new Error('Arrow data values are shorter than the logical upload length');
  }
  return values.subarray(startElement, endElement) as NumericArrowType['TArray'];
}

export function getArrowVectorBufferSource<T extends NumericArrowType>(
  vector: arrow.Vector<T>
): T['TArray'];
export function getArrowVectorBufferSource<T extends NumericArrowType>(
  vector: arrow.Vector<arrow.FixedSizeList<T>>
): T['TArray'];
export function getArrowVectorBufferSource<T extends AttributeArrowType>(
  vector: arrow.Vector<T>
): NumericArrowType['TArray'];
/** Return a typed array that can be passed directly to `device.createBuffer()`. */
export function getArrowVectorBufferSource(vector: arrow.Vector): NumericArrowType['TArray'] {
  const dataSources = vector.data.map(data => getArrowDataBufferSource(data));
  if (dataSources.length === 0) {
    throw new Error('Arrow vector has no data');
  }
  if (dataSources.length === 1) {
    return dataSources[0];
  }

  const totalLength = dataSources.reduce((length, dataSource) => length + dataSource.length, 0);
  const values = createTypedArrayLike(dataSources[0], totalLength);
  let targetOffset = 0;
  for (const dataSource of dataSources) {
    values.set(dataSource as never, targetOffset);
    targetOffset += dataSource.length;
  }
  return values;
}

/** Number of scalar values in one logical Arrow row. */
export function getArrowTypeStride(type: arrow.DataType): number {
  return arrow.DataType.isFixedSizeList(type) ? type.listSize : 1;
}

/** Number of uploaded bytes in one logical Arrow row. */
export function getArrowTypeByteStride(type: arrow.DataType): number {
  if (arrow.DataType.isFixedSizeList(type)) {
    return type.listSize * getArrowTypeByteStride(type.children[0].type);
  }
  if (arrow.DataType.isInt(type)) {
    return type.bitWidth / 8;
  }
  if (arrow.DataType.isFloat(type)) {
    switch (type.precision) {
      case arrow.Precision.HALF:
        return 2;
      case arrow.Precision.SINGLE:
        return 4;
      case arrow.Precision.DOUBLE:
        return 8;
    }
  }
  throw new Error(`Cannot determine byte stride for Arrow type ${type}`);
}

/** Reject nullable Arrow chunks that cannot be uploaded directly into GPU attribute buffers. */
export function validateArrowGPUDataDirectUpload(
  name: string,
  data: arrow.Data<AttributeArrowType>
): void {
  if (data.nullCount > 0) {
    throw new Error(`GPUVector "${name}" does not support nullable data`);
  }
  if (arrow.DataType.isFixedSizeList(data.type) && (data.children[0]?.nullCount ?? 0) > 0) {
    throw new Error(`GPUVector "${name}" does not support nullable child data`);
  }
}

/** Read GPU bytes and reconstruct one non-null Arrow vector with the supplied Arrow type. */
export async function readArrowGPUVectorAsync<T extends AttributeArrowType>(
  props: GPUVectorReadProps<T>
): Promise<arrow.Vector<T>> {
  const {buffer, type, length, byteOffset, byteStride} = props;
  const rowByteWidth = getArrowTypeByteStride(type);
  if (byteStride < rowByteWidth) {
    throw new Error(
      `GPUVector.readAsync() byteStride ${byteStride} is smaller than row byte width ${rowByteWidth}`
    );
  }

  const readByteLength = length === 0 ? 0 : (length - 1) * byteStride + rowByteWidth;
  const bytes =
    readByteLength === 0 ? new Uint8Array(0) : await buffer.readAsync(byteOffset, readByteLength);
  const packedBytes =
    byteStride === rowByteWidth
      ? bytes
      : compactStridedRows(bytes, length, byteStride, rowByteWidth);

  return makeArrowVectorFromPackedBytes(type, length, packedBytes);
}

function getArrowDataValueRange(data: arrow.Data): {
  values: NumericArrowType['TArray'];
  startElement: number;
  elementCount: number;
} {
  if (arrow.DataType.isFixedSizeList(data.type)) {
    const childData = data.children[0];
    const values = childData?.values;
    if (!values) {
      throw new Error('Arrow FixedSizeList data has no child values');
    }
    const elementCount = data.length * data.type.listSize;
    const startElement = (childData.offset ?? 0) + data.offset * data.type.listSize;
    return {values: values as NumericArrowType['TArray'], startElement, elementCount};
  }

  const values = data.values;
  if (!values) {
    throw new Error('Arrow data has no values');
  }
  return {
    values: values as NumericArrowType['TArray'],
    startElement: data.offset,
    elementCount: data.length
  };
}

function createTypedArrayLike(
  source: NumericArrowType['TArray'],
  length: number
): NumericArrowType['TArray'] {
  const TypedArrayConstructor = source.constructor as {
    new (length: number): NumericArrowType['TArray'];
  };
  return new TypedArrayConstructor(length);
}

function compactStridedRows(
  bytes: Uint8Array,
  length: number,
  byteStride: number,
  rowByteWidth: number
): Uint8Array {
  const packedBytes = new Uint8Array(length * rowByteWidth);
  for (let rowIndex = 0; rowIndex < length; rowIndex++) {
    const sourceOffset = rowIndex * byteStride;
    const targetOffset = rowIndex * rowByteWidth;
    packedBytes.set(bytes.subarray(sourceOffset, sourceOffset + rowByteWidth), targetOffset);
  }
  return packedBytes;
}

function makeArrowVectorFromPackedBytes<T extends AttributeArrowType>(
  type: T,
  length: number,
  bytes: Uint8Array
): arrow.Vector<T> {
  if (arrow.DataType.isFixedSizeList(type)) {
    const childType = type.children[0].type as NumericArrowType;
    const values = makeNumericTypedArray(childType, bytes, length * type.listSize);
    const childData = makeNumericData({
      type: childType,
      length: length * type.listSize,
      data: values as NumericArrowType['TArray']
    });
    const listData = makeFixedSizeListData({
      type: type as arrow.FixedSizeList<NumericArrowType>,
      length,
      nullCount: 0,
      nullBitmap: null,
      child: childData
    });
    return arrow.makeVector(listData) as arrow.Vector<T>;
  }

  const numericType = type as NumericArrowType;
  const values = makeNumericTypedArray(numericType, bytes, length);
  const data = makeNumericData({
    type: numericType,
    length,
    data: values as NumericArrowType['TArray']
  });
  return arrow.makeVector(data) as arrow.Vector<T>;
}

function makeNumericTypedArray(
  type: NumericArrowType,
  bytes: Uint8Array,
  length: number
): BigTypedArray {
  if (arrow.DataType.isInt(type)) {
    if (type.isSigned) {
      switch (type.bitWidth) {
        case 8:
          return makeTypedArrayView(Int8Array, bytes, length);
        case 16:
          return makeTypedArrayView(Int16Array, bytes, length);
        case 32:
          return makeTypedArrayView(Int32Array, bytes, length);
        case 64:
          return makeTypedArrayView(BigInt64Array, bytes, length);
      }
    }

    switch (type.bitWidth) {
      case 8:
        return makeTypedArrayView(Uint8Array, bytes, length);
      case 16:
        return makeTypedArrayView(Uint16Array, bytes, length);
      case 32:
        return makeTypedArrayView(Uint32Array, bytes, length);
      case 64:
        return makeTypedArrayView(BigUint64Array, bytes, length);
    }
  }

  if (arrow.DataType.isFloat(type)) {
    switch (type.precision) {
      case arrow.Precision.HALF:
        return makeTypedArrayView(Uint16Array, bytes, length);
      case arrow.Precision.SINGLE:
        return makeTypedArrayView(Float32Array, bytes, length);
      case arrow.Precision.DOUBLE:
        return makeTypedArrayView(Float64Array, bytes, length);
    }
  }

  throw new Error(`GPUVector.readAsync() does not support Arrow type ${type}`);
}

function makeTypedArrayView<T extends BigTypedArray>(
  TypedArrayConstructor: NumericTypedArrayConstructor,
  bytes: Uint8Array,
  length: number
): T {
  const byteLength = length * TypedArrayConstructor.BYTES_PER_ELEMENT;
  if (bytes.byteOffset % TypedArrayConstructor.BYTES_PER_ELEMENT === 0) {
    return new TypedArrayConstructor(bytes.buffer, bytes.byteOffset, length) as T;
  }

  const alignedBytes = new Uint8Array(byteLength);
  alignedBytes.set(bytes.subarray(0, byteLength));
  return new TypedArrayConstructor(alignedBytes.buffer, 0, length) as T;
}
