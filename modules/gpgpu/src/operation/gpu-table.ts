// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getDataTypeFromTypedArray, getTypedArrayFromDataType, Device, Buffer, SignedDataType} from '@luma.gl/core';
import type {TypedArray, TypedArrayConstructor} from '@math.gl/types';
import { bufferPool } from '../utils/buffer-pool';
import type { Operation } from './operation';

export type GPUTableProps = {
  id?: string;
  /** Element type */
  type: SignedDataType;
  /** Number of elements */
  size: number;
  /** Number of bytes to skip before reading the first element, @default 0 */
  offset?: number;
  /** Number of bytes in each row, @default byte_per_element*size */
  stride?: number;
  /** CPU buffer to fill the vector with, required unless `source` is supplied */
  value?: TypedArray;
  /** Operation whose output is used to fill the vector, required unless `value` is supplied */
  source?: Operation | GPUTable | null;
  /** If all rows share the same value */
  isConstant?: boolean;
  /** Number of rows, can be omitted if `isConstant:true` or if `value` is supplied */
  length?: number;
};

/** A device-agnostic, immutable 2D data table used as input/output of GPU operations */
export class GPUTable {
  /** Element type */
  readonly type: SignedDataType;
  /** Number of elements */
  readonly size: number;
  /** Number of bytes to skip before reading the first element */
  readonly offset: number;
  /** Number of bytes in each row */
  readonly stride: number;
  /** true if all rows share the same value */
  readonly isConstant: boolean;
  /** Number of rows */
  readonly length: number;
  /** Bytes needed for storage */
  readonly byteLength: number;
  /** TypedArray constructor for CPU representation, derived from `type` */
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

  /** Construct a new GPUTable from a CPU buffer */
  static fromArray(value: number[], props: Partial<Pick<GPUTableProps, 'type' | 'size' | 'offset' | 'stride'>>): GPUTable;
  static fromArray(value: TypedArray, props: Partial<Pick<GPUTableProps, 'type' | 'size' | 'offset' | 'stride'>>): GPUTable;
  static fromArray(value: TypedArray | number[], {type, size = 1, offset = 0, stride = 0}: Partial<Pick<GPUTableProps, 'type' | 'size' | 'offset' | 'stride'>>): GPUTable {
    if (Array.isArray(value)) {
      type = type || 'float32';
      const ArrayType = getTypedArrayFromDataType(type);
      value = new ArrayType(value);
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

  /** Construct a new GPUConstant from a constant of the specified type */
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

  /** TODO - Construct a new GPUTable from a loaders.gl Table/BatchedTable */
  // static from(table: Table, columnName: string | number): GPUTable

  constructor(props: GPUTableProps) {
    const {id, type, size = 1, offset = 0, stride, value, source = null, isConstant = false} = props;
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

  get value(): TypedArray | undefined {
    return this._value;
  }

  /** Get the GPU Buffer. Only available after `evaluate()` is called */
  get buffer(): Buffer {
    if (!this._buffer) {
      throw new Error(`${this} not evaluated`);
    }
    return this._buffer;
  }

  /** Resolve the buffer content on the given device */
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

  /** Warning: performance degrade, use for debugging only */
  async readValue(startRow: number = 0, endRow?: number): Promise<TypedArray> {
    const {ValueType} = this;
    if (!this._value) {
      const bytes = await this.buffer.readAsync(this.offset, this.byteLength);
      this._value = new ValueType(bytes.buffer);
    }

    const {size, offset, stride, length} = this;
    const width = ValueType.BYTES_PER_ELEMENT * size;
    endRow = endRow ?? length;

    if (stride === width) {
      const buffer = this._value!.buffer;
      // @ts-expect-error TypedArrayConstructor type does not have (buffer, offset, length) signature
      return new ValueType(buffer, offset + stride * startRow, (endRow - startRow) * size);
    }
    
    const bytes = new Uint8Array(width * (endRow - startRow));
    let i0 = offset + startRow * stride, i1 = 0;
    for (let y = startRow; y < endRow; y++) {
      for (let x = 0; x < width; x++) {
        bytes[i1++] = bytes[i0 + x];
      }
      i0 += stride;
    }
    return new ValueType(bytes.buffer);
  }

  toString(): string {
    return this._id ?? this._source?.toString() ?? this.constructor.name;
  }

  destroy() {
    if (this._buffer) {
      bufferPool.recycle(this._buffer);
      this._buffer = undefined;
    }
    this._destroyed = true;
    this._source = null;
  }
}
