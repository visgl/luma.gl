// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  Device,
  type BufferAttributeLayout,
  type BufferLayout,
  type BufferProps,
  type BigTypedArray
} from '@luma.gl/core';
import * as arrow from 'apache-arrow';
import type {AttributeArrowType, NumericArrowType} from './arrow-types';
import {getArrowVectorBufferSource} from './arrow-fixed-size-list';

/** Buffer creation props forwarded when uploading Arrow vector memory to the GPU. */
export type ArrowGPUVectorBufferProps = Omit<BufferProps, 'byteLength' | 'data'>;

/** @deprecated Use {@link ArrowGPUVectorBufferProps}. */
export type ArrowGPUVectorProps = ArrowGPUVectorBufferProps;

/** Constructor props that upload an Arrow vector into a new GPU buffer. */
export type ArrowGPUVectorFromArrowProps<T extends AttributeArrowType = AttributeArrowType> = {
  /** Discriminator for Arrow-vector upload construction. */
  type: 'arrow';
  /** Name used when this vector is added to an {@link ArrowGPUTable}. */
  name: string;
  /** Device that creates the GPU buffer. */
  device: Device;
  /** Arrow vector whose value memory is uploaded. */
  vector: arrow.Vector<T>;
  /** Buffer creation props forwarded to the GPU buffer. */
  bufferProps?: ArrowGPUVectorBufferProps;
};

/** Constructor props that wrap an existing typed GPU buffer. */
export type ArrowGPUVectorFromBufferProps<T extends AttributeArrowType = AttributeArrowType> = {
  /** Discriminator for existing-buffer construction. */
  type: 'buffer';
  /** Name used when this vector is added to an {@link ArrowGPUTable}. */
  name: string;
  /** Existing GPU buffer. */
  buffer: Buffer;
  /** Arrow type that describes the values in the buffer. */
  arrowType: T;
  /** Number of logical rows in the buffer. */
  length: number;
  /** Byte offset of the first logical row. */
  byteOffset?: number;
  /** Bytes between adjacent logical rows. Defaults to the byte width of `arrowType`. */
  byteStride?: number;
  /**
   * Whether this vector should destroy the buffer.
   *
   * Defaults to `false` for wrapped buffers because ownership remains with the caller unless
   * explicitly transferred or opted in.
   */
  ownsBuffer?: boolean;
};

/** Constructor props that wrap one interleaved GPU buffer as opaque Arrow binary rows. */
export type ArrowGPUVectorFromInterleavedProps = {
  /** Discriminator for interleaved-buffer construction. */
  type: 'interleaved';
  /** Name used when this vector is added to an {@link ArrowGPUTable}. */
  name: string;
  /** Existing interleaved GPU buffer. */
  buffer: Buffer;
  /** Number of logical rows in the buffer. */
  length: number;
  /** Byte offset of the first logical row. */
  byteOffset?: number;
  /** Bytes between adjacent logical rows. */
  byteStride: number;
  /** Attribute views stored in each interleaved row. */
  attributes: BufferAttributeLayout[];
  /**
   * Whether this vector should destroy the buffer.
   *
   * Defaults to `false` for wrapped buffers because ownership remains with the caller unless
   * explicitly transferred or opted in.
   */
  ownsBuffer?: boolean;
};

/** Discriminated constructor props for {@link ArrowGPUVector}. */
export type ArrowGPUVectorCreateProps<T extends arrow.DataType = AttributeArrowType> =
  | (T extends AttributeArrowType
      ? ArrowGPUVectorFromArrowProps<T> | ArrowGPUVectorFromBufferProps<T>
      : never)
  | ArrowGPUVectorFromInterleavedProps;

type ArrowGPUVectorReadableBuffer = Pick<Buffer, 'readAsync'>;

type ArrowGPUVectorReadProps<T extends AttributeArrowType> = {
  type: T;
  buffer: ArrowGPUVectorReadableBuffer;
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

/** Read GPU bytes and reconstruct one non-null Arrow vector with the supplied Arrow type. */
export async function readArrowGPUVectorAsync<T extends AttributeArrowType>(
  props: ArrowGPUVectorReadProps<T>
): Promise<arrow.Vector<T>> {
  const {buffer, type, length, byteOffset, byteStride} = props;
  const rowByteWidth = getArrowTypeByteStride(type);
  if (byteStride < rowByteWidth) {
    throw new Error(
      `ArrowGPUVector.readAsync() byteStride ${byteStride} is smaller than row byte width ${rowByteWidth}`
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

/**
 * GPU memory and Arrow type metadata derived from one Arrow vector.
 *
 * The Arrow vector is a construction input only. ArrowGPUVector does not retain
 * the source vector; it keeps a GPU buffer plus the type, length, and stride that
 * describe the uploaded memory.
 *
 * Ownership is tracked separately from the buffer reference. Vectors constructed
 * from Arrow data allocate and own their buffers. Vectors wrapping an existing
 * buffer default to non-owning unless `ownsBuffer` is supplied. In-place
 * operations can use {@link transferBufferOwnership} to consume one logical
 * vector and return another view that becomes responsible for destroying the
 * shared buffer.
 */
export class ArrowGPUVector<T extends arrow.DataType = AttributeArrowType> {
  /** Name used when this vector is added to an {@link ArrowGPUTable}. */
  readonly name: string;
  /** GPU buffer containing the Arrow vector's attribute-compatible value memory. */
  readonly buffer: Buffer;
  /** Arrow type that describes the uploaded vector memory. */
  readonly type: T;
  /** Number of logical Arrow vector rows uploaded into the GPU buffer. */
  readonly length: number;
  /** Number of scalar values per logical vector row. */
  readonly stride: number;
  /** Byte offset of the first logical row in {@link buffer}. */
  readonly byteOffset: number;
  /** Bytes between adjacent logical rows in {@link buffer}. */
  readonly byteStride: number;
  /** Optional GPU buffer layout described by this vector. */
  readonly bufferLayout?: BufferLayout;
  /** Whether this vector is responsible for destroying {@link buffer}. */
  private _ownsBuffer: boolean;

  /** Creates a GPU representation from an Arrow vector without retaining the source vector. */
  constructor(
    device: Device,
    vector: arrow.Vector<T & AttributeArrowType>,
    props?: ArrowGPUVectorBufferProps
  );
  /** Creates a GPU representation using discriminated construction props. */
  constructor(props: ArrowGPUVectorCreateProps<T>);
  constructor(
    deviceOrProps: Device | ArrowGPUVectorCreateProps<any>,
    vector?: arrow.Vector<T & AttributeArrowType>,
    props: ArrowGPUVectorBufferProps = {}
  ) {
    const constructionProps =
      deviceOrProps instanceof Device
        ? ({
            type: 'arrow',
            name: 'vector',
            device: deviceOrProps,
            vector: vector!,
            bufferProps: props
          } satisfies ArrowGPUVectorFromArrowProps)
        : deviceOrProps;

    switch (constructionProps.type) {
      case 'arrow': {
        const {name, device, vector: arrowVector, bufferProps = {}} = constructionProps;
        this.name = name;
        this.type = arrowVector.type;
        this.length = arrowVector.length;
        this.stride = getArrowVectorStride(arrowVector);
        this.byteOffset = 0;
        this.byteStride = getArrowTypeByteStride(arrowVector.type);
        this.buffer = device.createBuffer({
          usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
          ...bufferProps,
          data: getArrowVectorBufferSource(arrowVector as any)
        });
        this._ownsBuffer = true;
        return;
      }

      case 'buffer': {
        const {
          name,
          buffer,
          arrowType,
          length,
          byteOffset = 0,
          byteStride = getArrowTypeByteStride(arrowType),
          ownsBuffer = false
        } = constructionProps;
        this.name = name;
        this.buffer = buffer;
        this.type = arrowType;
        this.length = length;
        this.stride = getArrowTypeStride(arrowType);
        this.byteOffset = byteOffset;
        this.byteStride = byteStride;
        this._ownsBuffer = ownsBuffer;
        return;
      }

      case 'interleaved': {
        const {
          name,
          buffer,
          length,
          byteOffset = 0,
          byteStride,
          attributes,
          ownsBuffer = false
        } = constructionProps;
        this.name = name;
        this.buffer = buffer;
        this.type = new arrow.Binary() as T;
        this.length = length;
        this.stride = byteStride;
        this.byteOffset = byteOffset;
        this.byteStride = byteStride;
        this.bufferLayout = {name, byteStride, attributes};
        this._ownsBuffer = ownsBuffer;
        return;
      }
    }
  }

  /**
   * Whether this vector is responsible for destroying {@link buffer}.
   *
   * `destroy()` only releases the buffer when this is `true`. This value can
   * change when ownership is transferred to another same-buffer view.
   */
  get ownsBuffer(): boolean {
    return this._ownsBuffer;
  }

  /**
   * Transfers buffer ownership to another vector that views the same GPU buffer.
   *
   * This is intended for in-place operations that consume one logical vector and
   * return a new logical interpretation of the same bytes. After transfer,
   * destroying this vector will not destroy the buffer; destroying `target` will
   * destroy it if this vector previously owned it.
   */
  transferBufferOwnership(target: ArrowGPUVector): void {
    if (target.buffer !== this.buffer) {
      throw new Error('ArrowGPUVector ownership can only be transferred to the same buffer');
    }
    target._ownsBuffer = this._ownsBuffer;
    this._ownsBuffer = false;
  }

  /** Reads the GPU buffer contents back into a single non-null Arrow vector. */
  async readAsync(): Promise<arrow.Vector<T>> {
    if (this.bufferLayout) {
      throw new Error('ArrowGPUVector.readAsync() does not support interleaved vectors');
    }

    return readArrowGPUVectorAsync({
      type: this.type as unknown as AttributeArrowType,
      buffer: this.buffer,
      length: this.length,
      byteOffset: this.byteOffset,
      byteStride: this.byteStride
    }) as unknown as Promise<arrow.Vector<T>>;
  }

  destroy(): void {
    if (this._ownsBuffer) {
      this.buffer.destroy();
      this._ownsBuffer = false;
    }
  }
}

function getArrowVectorStride(vector: arrow.Vector<AttributeArrowType>): number {
  return arrow.DataType.isFixedSizeList(vector.type) ? vector.type.listSize : 1;
}

function getArrowTypeStride(type: arrow.DataType): number {
  return arrow.DataType.isFixedSizeList(type) ? type.listSize : 1;
}

function getArrowTypeByteStride(type: arrow.DataType): number {
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

  throw new Error(`ArrowGPUVector.readAsync() does not support Arrow type ${type}`);
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
