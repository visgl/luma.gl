// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {getDataTypeFromTypedArray, getTypedArrayFromDataType} from '../utils/vertex-data-types';
import {Device, Buffer, SignedDataType} from '@luma.gl/core';
import type {TypedArray, TypedArrayConstructor} from '@math.gl/types';
import {bufferPool} from '../utils/buffer-pool';
import type {Operation} from './operation';

/** Properties used to construct a {@link GPUTableEvaluator}. */
export type GPUTableEvaluatorProps = {
  /** Optional debug name used by {@link GPUTableEvaluator.toString}. */
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
  /** Whether integer values should be normalized when read as float vertex attributes. */
  normalized?: boolean;
  /** CPU buffer that initializes the table, required unless `source` is supplied. */
  value?: TypedArray;
  /** External GPU buffer that backs this table and is not owned by the evaluator. */
  buffer?: Buffer;
  /** Lazy operation or table whose output initializes this table, required unless `value` is supplied. */
  source?: Operation | GPUTableEvaluator | null;
  /** Whether every row should read the same value. */
  isConstant?: boolean;
  /** Number of logical rows, inferred for constants and CPU-backed tables when omitted. */
  length?: number;
};

/**
 * Device-agnostic, immutable 2D numeric table used as input and output for lazy GPGPU operations.
 *
 * A table describes row layout and a data source, but does not allocate or run GPU work until
 * {@link GPUTableEvaluator.evaluate} is called. Operation functions such as `add()` return new tables whose
 * `source` points at the deferred operation.
 */
export class GPUTableEvaluator {
  /** Scalar element type for each stored value. */
  readonly type: SignedDataType;
  /** Number of scalar elements in each logical row. */
  readonly size: number;
  /** Number of bytes to skip before reading the first element. */
  readonly offset: number;
  /** Number of bytes between the starts of adjacent rows. */
  readonly stride: number;
  /** Whether integer values should be normalized when read as float vertex attributes. */
  readonly normalized: boolean;
  /** Whether all rows share the same value. */
  readonly isConstant: boolean;
  /** Number of logical rows. */
  readonly length: number;
  /** Total bytes needed for the table storage. */
  readonly byteLength: number;
  /** TypedArray constructor for CPU representation, derived from {@link GPUTableEvaluator.type}. */
  readonly ValueType: TypedArrayConstructor;
  /** Operation whose output is used to fill the vector, required unless `value` is supplied */
  readonly source: Operation | GPUTableEvaluator | null = null;

  /** User-assigned id for easy debugging */
  protected _id?: string;
  /** destroy() has been called and no more resources should be created */
  protected _destroyed: boolean = false;

  /** CPU buffer, either provided by the user or read back from the GPU */
  protected _value?: TypedArray;
  /** GPU buffer */
  private _buffer?: Buffer;
  /** Whether the GPU buffer is externally owned and must not be recycled by the evaluator. */
  private _hasExternalBuffer: boolean = false;

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
      stride = 0,
      normalized = false
    }: Partial<Pick<GPUTableEvaluatorProps, 'type' | 'size' | 'offset' | 'stride' | 'normalized'>>
  ): GPUTableEvaluator {
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
    const id = `<${type} * ${size}>`;
    return new GPUTableEvaluator({
      id,
      type,
      size,
      offset,
      stride,
      normalized,
      value
    });
  }

  /**
   * Constructs a constant table whose single row is broadcast across non-constant inputs.
   *
   * @param value - Scalar or row value.
   * @param type - Scalar element type used for the CPU representation.
   */
  static fromConstant(
    value: number | number[],
    type: SignedDataType = 'float32'
  ): GPUTableEvaluator {
    const ArrayType = getTypedArrayFromDataType(type);
    let id: string;
    if (Array.isArray(value)) {
      id = `[${value.join(',')}]`;
    } else {
      id = String(value);
      value = [value];
    }
    return new GPUTableEvaluator({
      id,
      isConstant: true,
      type,
      size: value.length,
      value: new ArrayType(value)
    });
  }

  /** TODO - Construct a new GPUTableEvaluator from a loaders.gl Table/BatchedTable. */
  // static from(table: Table, columnName: string | number): GPUTableEvaluator

  /**
   * Creates a table from explicit row layout and source information.
   *
   * Prefer {@link GPUTableEvaluator.fromArray} or {@link GPUTableEvaluator.fromConstant} for CPU-backed tables.
   */
  constructor(props: GPUTableEvaluatorProps) {
    const {id, value, buffer, source = null, isConstant = false} = props;
    if (!source && !value && !buffer) {
      throw new Error('OperationResource must have a value source');
    }
    let {type, size, offset, stride, normalized, length} = props;
    if (source instanceof GPUTableEvaluator) {
      type = type ?? source.type;
      size = size ?? source.size;
      offset = offset ?? source.offset;
      stride = stride ?? source.stride;
      normalized = normalized ?? source.normalized;
      length = length ?? source.length;
    } else {
      size = size ?? 1;
      offset = offset ?? 0;
      normalized = normalized ?? false;
      length = isConstant ? 1 : length;
    }

    this._id = id;
    this.type = type;
    this.size = size;
    this.ValueType = getTypedArrayFromDataType(this.type);
    this.offset = offset;
    this.stride = stride || this.ValueType.BYTES_PER_ELEMENT * size;
    this.normalized = normalized;
    this.source = source;
    this._value = value;
    this._buffer = buffer;
    this._hasExternalBuffer = source instanceof GPUTableEvaluator || Boolean(buffer);

    if (length === undefined) {
      if (isConstant) {
        length = 1;
      } else {
        if (!value) {
          throw new Error('GPUTableEvaluator: length not defined');
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
    return (
      this._value || (this.source instanceof GPUTableEvaluator ? this.source.value : undefined)
    );
  }

  get evaluated(): boolean {
    return Boolean(this._buffer);
  }

  /** GPU buffer for the table. Only available after {@link GPUTableEvaluator.evaluate} resolves. */
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
      throw new Error(`GPUTableEvaluator ${this} already destroyed`);
    }
    if (!this._buffer) {
      let buffer: Buffer;
      if (this.source instanceof GPUTableEvaluator) {
        await this.source.evaluate(device);
        buffer = this.source.buffer;
      } else {
        buffer = bufferPool.createOrReuse(device, this.byteLength);
        if (this._value) {
          buffer.write(this._value);
        } else {
          const result = await this.source!.execute(device, buffer);
          if (!result.success) {
            throw result.error || new Error(`${this.source} evaluation failed`);
          }
          if (result.value) {
            this._value = result.value;
          }
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
    return this._id ?? this.source?.toString() ?? this.constructor.name;
  }

  /** Releases cached GPU storage and prevents future evaluation. */
  destroy() {
    if (this._buffer) {
      if (!this._hasExternalBuffer) {
        bufferPool.recycle(this._buffer);
      }
      this._buffer = undefined;
    }
    this._destroyed = true;
  }
}
