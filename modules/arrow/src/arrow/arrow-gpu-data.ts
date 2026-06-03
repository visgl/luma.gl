// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BigTypedArray, Buffer} from '@luma.gl/core';
import type {GPUData} from '@luma.gl/tables';
import {
  BufferType,
  Data,
  DataType,
  FixedSizeList,
  Precision,
  Utf8,
  Vector,
  makeData,
  makeVector
} from 'apache-arrow';
import {
  isVariableLengthAttributeArrowType,
  type AttributeArrowType,
  type NumericArrowType,
  type VariableLengthAttributeArrowType
} from './arrow-types';

/** Compact CPU metadata required to reconstruct variable-width Arrow chunks after GPU readback. */
export type GPUDataReadbackMetadata =
  | {
      /** Metadata variant for Arrow UTF-8 value bytes. */
      kind: 'utf8';
      /** Chunk-local Arrow value offsets normalized to the copied GPU byte range. */
      valueOffsets: Int32Array;
      /** Number of nullable rows in the source Arrow chunk. */
      nullCount: number;
      /** Optional copied null bitmap required for Arrow reconstruction. */
      nullBitmap?: Uint8Array;
      /** Number of value bytes to read back from the GPU buffer. */
      valueByteLength: number;
    }
  | {
      /** Metadata variant for nested variable-length numeric attribute payloads. */
      kind: 'variable-length-attribute';
      /** Chunk-local Arrow list offsets normalized to the copied GPU value range. */
      valueOffsets: Int32Array;
      /** Number of nullable rows in the source Arrow chunk. */
      nullCount: number;
      /** Optional copied null bitmap required for Arrow reconstruction. */
      nullBitmap?: Uint8Array;
      /** Number of flattened numeric value bytes to read back from the GPU buffer. */
      valueByteLength: number;
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

const makeNumericData = makeData as <T extends NumericArrowType>(props: {
  type: T;
  length: number;
  data: T['TArray'];
}) => Data<T>;

const makeFixedSizeListData = makeData as <T extends NumericArrowType>(props: {
  type: FixedSizeList<T>;
  length: number;
  nullCount: number;
  nullBitmap: null;
  child: Data<T>;
}) => Data<FixedSizeList<T>>;

/** Returns the uploadable typed-array view for one Arrow Data chunk. */
export function getArrowDataBufferSource<T extends NumericArrowType>(data: Data<T>): T['TArray'];
export function getArrowDataBufferSource<T extends NumericArrowType>(
  data: Data<FixedSizeList<T>>
): T['TArray'];
export function getArrowDataBufferSource<T extends AttributeArrowType>(
  data: Data<T>
): NumericArrowType['TArray'];
export function getArrowDataBufferSource(data: Data): NumericArrowType['TArray'] {
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

/** Return the UTF-8 value bytes referenced by one Arrow Utf8 data chunk. */
export function getArrowUtf8DataBufferSource(data: Data<Utf8>): Uint8Array {
  const valueOffsets = data.valueOffsets as Int32Array | undefined;
  const values = data.values as Uint8Array | undefined;
  if (!valueOffsets || !values) {
    return new Uint8Array(0);
  }
  const firstValueOffset = valueOffsets[0] ?? 0;
  const lastValueOffset = valueOffsets[data.length] ?? firstValueOffset;
  return values.subarray(firstValueOffset, lastValueOffset);
}

/** Return flattened numeric values referenced by one variable-length nested attribute chunk. */
export function getArrowVariableLengthAttributeDataBufferSource(
  data: Data<VariableLengthAttributeArrowType>
): NumericArrowType['TArray'] {
  const valueOffsets = data.valueOffsets as Int32Array | undefined;
  const elementData = data.children[0] as Data | undefined;
  if (!valueOffsets || !elementData) {
    return new Float32Array(0);
  }

  const firstElementOffset = valueOffsets[0] ?? 0;
  const lastElementOffset = valueOffsets[data.length] ?? firstElementOffset;

  if (DataType.isFixedSizeList(elementData.type)) {
    const numericData = elementData.children[0] as Data<NumericArrowType> | undefined;
    const values = numericData?.values as NumericArrowType['TArray'] | undefined;
    if (!numericData || !values) {
      return new Float32Array(0);
    }

    const elementStride = elementData.type.listSize;
    const numericValueOffset = numericData.offset ?? 0;
    const firstValueOffset = numericValueOffset + firstElementOffset * elementStride;
    const lastValueOffset = numericValueOffset + lastElementOffset * elementStride;
    return values.subarray(firstValueOffset, lastValueOffset) as NumericArrowType['TArray'];
  }

  const values = elementData.values as NumericArrowType['TArray'] | undefined;
  if (!values) {
    return new Float32Array(0);
  }
  const numericValueOffset = elementData.offset ?? 0;
  return values.subarray(
    numericValueOffset + firstElementOffset,
    numericValueOffset + lastElementOffset
  ) as NumericArrowType['TArray'];
}

/** Copy compact variable-width reconstruction metadata without retaining Arrow value buffers. */
export function getArrowGPUDataReadbackMetadata(data: Data): GPUDataReadbackMetadata | undefined {
  if (DataType.isUtf8(data.type)) {
    const values = getArrowUtf8DataBufferSource(data as Data<Utf8>);
    return {
      kind: 'utf8',
      valueOffsets: copyNormalizedArrowValueOffsets(data),
      nullCount: data.nullCount,
      nullBitmap: copyNormalizedArrowNullBitmap(data),
      valueByteLength: values.byteLength
    };
  }

  if (isVariableLengthAttributeArrowType(data.type)) {
    const values = getArrowVariableLengthAttributeDataBufferSource(
      data as Data<VariableLengthAttributeArrowType>
    );
    return {
      kind: 'variable-length-attribute',
      valueOffsets: copyNormalizedArrowValueOffsets(data),
      nullCount: data.nullCount,
      nullBitmap: copyNormalizedArrowNullBitmap(data),
      valueByteLength: values.byteLength
    };
  }

  return undefined;
}

/** Returns a typed array that can be passed directly to `device.createBuffer()`. */
export function getArrowVectorBufferSource<T extends NumericArrowType>(
  vector: Vector<T>
): T['TArray'];
export function getArrowVectorBufferSource<T extends NumericArrowType>(
  vector: Vector<FixedSizeList<T>>
): T['TArray'];
export function getArrowVectorBufferSource<T extends AttributeArrowType>(
  vector: Vector<T>
): NumericArrowType['TArray'];
export function getArrowVectorBufferSource(vector: Vector): NumericArrowType['TArray'] {
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
export function getArrowTypeStride(type: DataType): number {
  if (isVariableLengthAttributeArrowType(type)) {
    return getArrowVariableLengthAttributeElementStride(type);
  }
  return DataType.isFixedSizeList(type) ? type.listSize : 1;
}

/** Number of uploaded bytes in one logical Arrow row. */
export function getArrowTypeByteStride(type: DataType): number {
  if (isVariableLengthAttributeArrowType(type)) {
    return getArrowVariableLengthAttributeElementByteStride(type);
  }
  if (DataType.isFixedSizeList(type)) {
    return type.listSize * getArrowTypeByteStride(type.children[0].type);
  }
  if (DataType.isInt(type)) {
    return type.bitWidth / 8;
  }
  if (DataType.isFloat(type)) {
    switch (type.precision) {
      case Precision.HALF:
        return 2;
      case Precision.SINGLE:
        return 4;
      case Precision.DOUBLE:
        return 8;
    }
  }
  throw new Error(`Cannot determine byte stride for Arrow type ${type}`);
}

/** Reject nullable Arrow chunks that cannot be uploaded directly into GPU attribute buffers. */
export function validateArrowGPUDataDirectUpload(
  name: string,
  data: Data<AttributeArrowType | Utf8 | VariableLengthAttributeArrowType>
): void {
  if (data.nullCount > 0) {
    throw new Error(`GPUVector "${name}" does not support nullable data`);
  }
  if (DataType.isFixedSizeList(data.type) && (data.children[0]?.nullCount ?? 0) > 0) {
    throw new Error(`GPUVector "${name}" does not support nullable child data`);
  }
  if (isVariableLengthAttributeArrowType(data.type)) {
    const elementData = data.children[0];
    const nestedNumericData = DataType.isFixedSizeList(elementData?.type)
      ? elementData.children[0]
      : undefined;
    if ((elementData?.nullCount ?? 0) > 0 || (nestedNumericData?.nullCount ?? 0) > 0) {
      throw new Error(`GPUVector "${name}" does not support nullable nested list data`);
    }
  }
}

/** Read GPU bytes and reconstruct one non-null Arrow vector with the supplied Arrow type. */
export async function readArrowGPUVectorAsync<T extends AttributeArrowType>(
  props: GPUVectorReadProps<T>
): Promise<Vector<T>> {
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

/** Read one generic GPU data range back into one Arrow `Data` chunk. */
export async function readArrowGPUDataAsync<T extends DataType>(data: GPUData): Promise<Data<T>> {
  if (DataType.isUtf8(data.type)) {
    const metadata = data.readbackMetadata as GPUDataReadbackMetadata | undefined;
    if (metadata?.kind !== 'utf8') {
      throw new Error('readArrowGPUDataAsync() requires UTF-8 readback metadata');
    }
    const bytes =
      metadata.valueByteLength === 0
        ? new Uint8Array(0)
        : await data.buffer.readAsync(data.byteOffset, metadata.valueByteLength);
    return makeData({
      type: new Utf8(),
      length: data.length,
      nullCount: metadata.nullCount,
      nullBitmap: metadata.nullBitmap,
      valueOffsets: metadata.valueOffsets,
      data: bytes
    }) as Data<T>;
  }

  if (isVariableLengthAttributeArrowType(data.type)) {
    const metadata = data.readbackMetadata as GPUDataReadbackMetadata | undefined;
    if (metadata?.kind !== 'variable-length-attribute') {
      throw new Error(
        'readArrowGPUDataAsync() requires variable-length attribute readback metadata'
      );
    }
    const bytes =
      metadata.valueByteLength === 0
        ? new Uint8Array(0)
        : await data.buffer.readAsync(data.byteOffset, metadata.valueByteLength);
    return makeArrowVariableLengthAttributeDataFromPackedBytes(
      data.type,
      data.length,
      metadata,
      bytes
    ) as unknown as Data<T>;
  }

  const vector = await readArrowGPUVectorAsync({
    type: data.type as unknown as AttributeArrowType,
    buffer: data.buffer,
    length: data.length,
    byteOffset: data.byteOffset,
    byteStride: data.byteStride
  });
  return vector.data[0] as unknown as Data<T>;
}

function getArrowDataValueRange(data: Data): {
  values: NumericArrowType['TArray'];
  startElement: number;
  elementCount: number;
} {
  if (DataType.isFixedSizeList(data.type)) {
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
): Vector<T> {
  if (DataType.isFixedSizeList(type)) {
    const childType = type.children[0].type as NumericArrowType;
    const values = makeNumericTypedArray(childType, bytes, length * type.listSize);
    const childData = makeNumericData({
      type: childType,
      length: length * type.listSize,
      data: values as NumericArrowType['TArray']
    });
    const listData = makeFixedSizeListData({
      type: type as FixedSizeList<NumericArrowType>,
      length,
      nullCount: 0,
      nullBitmap: null,
      child: childData
    });
    return makeVector(listData) as Vector<T>;
  }

  const numericType = type as NumericArrowType;
  const values = makeNumericTypedArray(numericType, bytes, length);
  const data = makeNumericData({
    type: numericType,
    length,
    data: values as NumericArrowType['TArray']
  });
  return makeVector(data) as Vector<T>;
}

function makeArrowVariableLengthAttributeDataFromPackedBytes(
  type: VariableLengthAttributeArrowType,
  length: number,
  metadata: Extract<GPUDataReadbackMetadata, {kind: 'variable-length-attribute'}>,
  bytes: Uint8Array
): Data<VariableLengthAttributeArrowType> {
  const elementType = type.children[0].type;
  const elementData = DataType.isFixedSizeList(elementType)
    ? makeArrowFixedSizeListElementDataFromPackedBytes(elementType, bytes)
    : makeArrowNumericElementDataFromPackedBytes(elementType as NumericArrowType, bytes);

  return new Data<VariableLengthAttributeArrowType>(
    type,
    0,
    length,
    metadata.nullCount,
    {
      [BufferType.OFFSET]: metadata.valueOffsets,
      ...(metadata.nullBitmap ? {[BufferType.VALIDITY]: metadata.nullBitmap} : {})
    },
    [elementData]
  );
}

function copyNormalizedArrowValueOffsets(data: Data): Int32Array {
  const valueOffsets = data.valueOffsets as Int32Array | undefined;
  const copiedOffsets = new Int32Array(data.length + 1);
  if (!valueOffsets) {
    return copiedOffsets;
  }

  const firstValueOffset = valueOffsets[0] ?? 0;
  for (let offsetIndex = 0; offsetIndex <= data.length; offsetIndex++) {
    copiedOffsets[offsetIndex] = Math.max(
      0,
      (valueOffsets[offsetIndex] ?? firstValueOffset) - firstValueOffset
    );
  }
  return copiedOffsets;
}

function copyNormalizedArrowNullBitmap(data: Data): Uint8Array | undefined {
  if (data.nullCount === 0 || !data.nullBitmap) {
    return undefined;
  }

  const copiedBitmap = new Uint8Array(Math.ceil(data.length / 8));
  const sourceBitmap = data.nullBitmap as Uint8Array;
  const sourceRowOffset = data.offset ?? 0;
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const sourceBitIndex = sourceRowOffset + rowIndex;
    const sourceByte = sourceBitmap[sourceBitIndex >> 3] ?? 0;
    if ((sourceByte & (1 << (sourceBitIndex & 7))) !== 0) {
      copiedBitmap[rowIndex >> 3] |= 1 << (rowIndex & 7);
    }
  }
  return copiedBitmap;
}

function makeArrowFixedSizeListElementDataFromPackedBytes(
  type: FixedSizeList<NumericArrowType>,
  bytes: Uint8Array
): Data<FixedSizeList<NumericArrowType>> {
  const numericType = type.children[0].type as NumericArrowType;
  const values = makeNumericTypedArray(
    numericType,
    bytes,
    bytes.byteLength / getArrowTypeByteStride(numericType)
  ) as NumericArrowType['TArray'];
  const numericData = makeNumericData({
    type: numericType,
    length: values.length,
    data: values
  });
  return makeFixedSizeListData({
    type,
    length: type.listSize === 0 ? 0 : values.length / type.listSize,
    nullCount: 0,
    nullBitmap: null,
    child: numericData
  });
}

function makeArrowNumericElementDataFromPackedBytes(
  type: NumericArrowType,
  bytes: Uint8Array
): Data<NumericArrowType> {
  const values = makeNumericTypedArray(
    type,
    bytes,
    bytes.byteLength / getArrowTypeByteStride(type)
  ) as NumericArrowType['TArray'];
  return makeNumericData({
    type,
    length: values.length,
    data: values
  });
}

function getArrowVariableLengthAttributeElementStride(
  type: VariableLengthAttributeArrowType
): number {
  return getArrowTypeStride(type.children[0].type);
}

function getArrowVariableLengthAttributeElementByteStride(
  type: VariableLengthAttributeArrowType
): number {
  return getArrowTypeByteStride(type.children[0].type);
}

function makeNumericTypedArray(
  type: NumericArrowType,
  bytes: Uint8Array,
  length: number
): BigTypedArray {
  if (DataType.isInt(type)) {
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

  if (DataType.isFloat(type)) {
    switch (type.precision) {
      case Precision.HALF:
        return makeTypedArrayView(Uint16Array, bytes, length);
      case Precision.SINGLE:
        return makeTypedArrayView(Float32Array, bytes, length);
      case Precision.DOUBLE:
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
