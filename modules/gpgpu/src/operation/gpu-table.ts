// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {getDataTypeFromTypedArray, getTypedArrayFromDataType} from '../utils/vertex-data-types';
import {Device, Buffer, SignedDataType} from '@luma.gl/core';
import type {TypedArray, TypedArrayConstructor} from '@math.gl/types';
import {bufferPool} from '../utils/buffer-pool';
import type {Operation} from './operation';

/** Properties used to construct a {@link GPUTable}. */
export type GPUTableProps = {
  /** Optional debug name used by {@link GPUTable.toString}. */
  id?: string;
  /** Scalar element type for every stored value. */
  type: SignedDataType;
  /** Number of scalar elements in each logical row. */
  size: number;
  /** Number of bytes to skip before reading the first element.
   * @default 0
   */
  offset?: number;
  /** Number of bytes between the starts of adjacent rows.
   * @default ValueType.BYTES_PER_ELEMENT * size
   */
  stride?: number;
  /** CPU buffer that initializes the table, required unless `source` is supplied. */
  value?: TypedArray;
  /** Lazy operation or table whose output initializes this table, required unless `value` is supplied. */
  source?: Operation | GPUTable | null;
  /** Whether every row should read the same value. */
  isConstant?: boolean;
  /** Number of logical rows, inferred for constants and CPU-backed tables when omitted. */
  length?: number;
};

/**
 * Device-agnostic, immutable 2D numeric table used as input and output for lazy GPGPU operations.
 *
 * A table describes row layout and a data source, but does not allocate or run GPU work until
 * {@link GPUTable.evaluate} is called. Operation functions such as `add()` return new tables whose
 * `source` points at the deferred operation.
 */
export class GPUTable {
  /** Scalar element type for each stored value. */
  readonly type: SignedDataType;
  /** Number of scalar elements in each logical row. */
  readonly size: number;
  /** Number of bytes to skip before reading the first element. */
  readonly offset: number;
  /** Number of bytes between the starts of adjacent rows. */
  readonly stride: number;
  /** Whether all rows share the same value. */
  readonly isConstant: boolean;
  /** Number of logical rows. */
  readonly length: number;
  /** Total bytes needed for the table storage. */
  readonly byteLength: number;
  /** TypedArray constructor for CPU representation, derived from {@link GPUTable.type}. */
  readonly ValueType: TypedArrayConstructor;

  /** User-assigned id for easy debugging */
  protected _id?: string;
  /** destroy() has been called and no more resources should be created */
  protected _destroyed: boolean = false;

  /** CPU buffer, either provided by the user or read back from the GPU */
  protected _value?: TypedArray;
  /** Operation whose output is used to fill the vector, required unless `value` is supplied */
  protected _source: Operation | GPUTable | null = null;
  /** GPU buffer */
  private _buffer?: Buffer;

  /**
   * Constructs a table from a CPU array.
   *
   * Plain JavaScript arrays are converted to typed arrays using `type` or `float32` by default.
   * `Float64Array` inputs are reinterpreted as `uint32` pairs so they can be consumed by GPU
   * operations such as {@link fround}.
   */
  static fromArray(
    value: TypedArray | number[],
    {
      type,
      size = 1,
      offset = 0,
      stride = 0
    }: Partial<Pick<GPUTableProps, 'type' | 'size' | 'offset' | 'stride'>>
  ): GPUTable {
    if (Array.isArray(value)) {
      type = type || 'float32';
      const ArrayType = getTypedArrayFromDataType(type);
      value = new ArrayType(value);
    } else if (value instanceof Float64Array) {
      // This is not really supported by GPU buffer, treat it as 2 uints
      type = 'uint32';
      size *= 2;
      offset *= 2;
      stride *= 2;
      value = new Uint32Array(value.buffer);
    } else {
      type = type || getDataTypeFromTypedArray(value);
    }
    return new GPUTable({
      type,
      size,
      offset,
      stride,
      value
    });
  }

  /**
   * Constructs a constant table whose single row is broadcast across non-constant inputs.
   *
   * @param value - Scalar or row value.
   * @param type - Scalar element type used for the CPU representation.
   */
  static fromConstant(value: number | number[], type: SignedDataType = 'float32'): GPUTable {
    const ArrayType = getTypedArrayFromDataType(type);
    if (!Array.isArray(value)) {
      value = [value];
    }
    return new GPUTable({
      isConstant: true,
      type,
      size: value.length,
      value: new ArrayType(value)
    });
  }

  /** TODO - Construct a new GPUTable from a loaders.gl Table/BatchedTable. */
  // static from(table: Table, columnName: string | number): GPUTable

  /**
   * Creates a table from explicit row layout and source information.
   *
   * Prefer {@link GPUTable.fromArray} or {@link GPUTable.fromConstant} for CPU-backed tables.
   */
  constructor(props: GPUTableProps) {
    const {
      id,
      type,
      size = 1,
      offset = 0,
      stride,
      value,
      source = null,
      isConstant = false
    } = props;
    if (!source && !value) {
      throw new Error('OperationResource must have a value source');
    }

    this._id = id;
    this.type = type;
    this.size = size;
    this.ValueType = getTypedArrayFromDataType(this.type);
    this.offset = offset;
    this.stride = stride || this.ValueType.BYTES_PER_ELEMENT * size;
    this._value = value;
    this._source = source;

    let {length} = props;
    if (length === undefined) {
      if (isConstant) {
        length = 1;
      } else {
        if (!value) {
          throw new Error('GPUTable: length not defined');
        }
        length = Math.ceil(value.byteLength / this.stride);
      }
    }
    this.isConstant = isConstant;
    this.length = length;
    this.byteLength = this.stride * length;
  }

  /** CPU-side typed array, when available. */
  get value(): TypedArray | undefined {
    return this._value;
  }

  /** GPU buffer for the table. Only available after {@link GPUTable.evaluate} resolves. */
  get buffer(): Buffer {
    if (!this._buffer) {
      throw new Error(`${this} not evaluated`);
    }
    return this._buffer;
  }

  /**
   * Materializes the table on a device.
   *
   * If the table is operation-backed, dependencies are evaluated first and then the backend
   * operation writes into a cached GPU buffer.
   */
  async evaluate(device: Device): Promise<void> {
    if (this._destroyed) {
      throw new Error(`GPUTable ${this} already destroyed`);
    }
    if (!this._buffer) {
      let buffer: Buffer;
      if (this._source instanceof GPUTable) {
        await this._source.evaluate(device);
        buffer = this._source.buffer;
      } else {
        buffer = bufferPool.createOrReuse(device, this.byteLength);
        if (this._value) {
          buffer.write(this._value);
        } else {
          await this._source!.execute(device, buffer);
        }
      }
      // cache the result when successful
      this._buffer = buffer;
    }
  }

  /**
   * Reads table data back to the CPU.
   *
   * This is intended for debugging and validation. Tightly packed rows return a typed-array view;
   * strided rows are copied into a compact typed array.
   */
  async readValue(startRow: number = 0, endRow?: number): Promise<TypedArray> {
    const {ValueType} = this;
    if (!this._value) {
      const bytes = await this.buffer.readAsync(this.offset, this.byteLength);
      this._value = new ValueType(bytes.buffer as ArrayBuffer);
    }

    const {size, offset, stride, length} = this;
    const width = ValueType.BYTES_PER_ELEMENT * size;
    endRow = endRow ?? length;

    if (stride === width) {
      const buffer = this._value!.buffer as ArrayBuffer;
      return new ValueType(buffer, offset + stride * startRow, (endRow - startRow) * size);
    }

    const bytes = new Uint8Array(width * (endRow - startRow));
    let i0 = offset + startRow * stride,
      i1 = 0;
    for (let y = startRow; y < endRow; y++) {
      for (let x = 0; x < width; x++) {
        bytes[i1++] = bytes[i0 + x];
      }
      i0 += stride;
    }
    return new ValueType(bytes.buffer);
  }

  /** Returns the debug id, source description, or class name. */
  toString(): string {
    return this._id ?? this._source?.toString() ?? this.constructor.name;
  }

  /** Releases cached GPU storage and prevents future evaluation. */
  destroy() {
    if (this._buffer) {
      bufferPool.recycle(this._buffer);
      this._buffer = undefined;
    }
    this._destroyed = true;
    this._source = null;
  }
}
