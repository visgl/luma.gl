// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {getDataTypeFromTypedArray, getTypedArrayFromDataType} from '../utils/vertex-data-types';
import {
  Device,
  Buffer,
  SignedDataType,
  type BufferAttributeLayout,
  type VertexFormat
} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {GPUVector} from '@luma.gl/tables';
import type {TypedArray, TypedArrayConstructor} from '@math.gl/types';
import * as arrow from 'apache-arrow';
import {bufferPool} from '../utils/buffer-pool';
import type {Operation} from './operation';

/** GPUVector materialization options for {@link GPUTableEvaluator.evaluateToGPUVector}. */
export type GPUTableEvaluatorGPUVectorOptions = {
  /** Output vector name. */
  name?: string;
  /** Logical data type for the output vector. Defaults to the evaluator's type and size. */
  dataType?: arrow.DataType;
  /** Whether to wrap the output as an interleaved vector. */
  interleaved?:
    | boolean
    | {
        /** Attribute views stored in each interleaved row. */
        attributes?: BufferAttributeLayout[];
      };
};

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
  /** CPU buffer that initializes the table, required unless `source` is supplied. */
  value?: TypedArray;
  /** External GPU buffer that backs this table and is not owned by the evaluator. */
  buffer?: Buffer;
  /** Optional logical schema/type metadata preserved for GPUVector interop. */
  dataType?: arrow.DataType;
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
  /** Optional logical schema/type metadata preserved for GPUVector interop. */
  readonly dataType?: arrow.DataType;

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
      stride = 0
    }: Partial<Pick<GPUTableEvaluatorProps, 'type' | 'size' | 'offset' | 'stride'>>
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
    return new GPUTableEvaluator({
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
  static fromConstant(
    value: number | number[],
    type: SignedDataType = 'float32'
  ): GPUTableEvaluator {
    const ArrayType = getTypedArrayFromDataType(type);
    if (!Array.isArray(value)) {
      value = [value];
    }
    return new GPUTableEvaluator({
      isConstant: true,
      type,
      size: value.length,
      value: new ArrayType(value)
    });
  }

  /** Creates a table evaluator view over an existing packed numeric GPUVector. */
  static fromGPUVector(vector: GPUVector): GPUTableEvaluator {
    validatePackedNumericGPUVector(vector);
    const {type, size} = getGPUTablePropsFromGPUVector(vector);

    return new GPUTableEvaluator({
      id: vector.name,
      type,
      size,
      offset: vector.byteOffset,
      stride: vector.byteStride,
      length: vector.length,
      buffer: resolveGPUVectorBuffer(vector),
      dataType: vector.type
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
    const {
      id,
      type,
      size = 1,
      offset = 0,
      stride,
      value,
      buffer,
      dataType,
      source = null,
      isConstant = false
    } = props;
    if (!source && !value && !buffer) {
      throw new Error('OperationResource must have a value source');
    }

    this._id = id;
    this.type = type;
    this.size = size;
    this.ValueType = getTypedArrayFromDataType(this.type);
    this.offset = offset;
    this.stride = stride || this.ValueType.BYTES_PER_ELEMENT * size;
    this.source = source;
    this.dataType = dataType;
    this._value = value;
    this._buffer = buffer;
    this._hasExternalBuffer = source instanceof GPUTableEvaluator || Boolean(buffer);

    let {length} = props;
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
    return this._value;
  }

  /** Optional debug id or source GPUVector name. */
  get id(): string | undefined {
    return this._id;
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
    if (this._hasExternalBuffer) {
      return;
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
          await this.source!.execute(device, buffer);
        }
      }
      // cache the result when successful
      this._buffer = buffer;
    }
  }

  /** Materializes this evaluator and returns its GPU buffer wrapped as a GPUVector. */
  async evaluateToGPUVector(
    device: Device,
    options: GPUTableEvaluatorGPUVectorOptions = {}
  ): Promise<GPUVector> {
    await this.evaluate(device);

    const name = options.name ?? this._id ?? 'vector';
    const dataType = options.dataType ?? this.dataType ?? getArrowDataType(this.type, this.size);
    const ownsBuffer = !this._hasExternalBuffer;

    if (options.interleaved) {
      const attributes =
        typeof options.interleaved === 'object' && options.interleaved.attributes
          ? options.interleaved.attributes
          : getInterleavedAttributes(this);
      const vector = new GPUVector({
        type: 'interleaved',
        name,
        buffer: this.buffer,
        dataType: new arrow.Binary(),
        length: this.length,
        byteStride: this.stride,
        attributes,
        ownsBuffer
      });
      this._hasExternalBuffer = true;
      return vector;
    }

    const vector = new GPUVector({
      type: 'buffer',
      name,
      buffer: this.buffer,
      dataType,
      length: this.length,
      stride: this.size,
      byteOffset: this.offset,
      byteStride: this.stride,
      rowByteLength: this.ValueType.BYTES_PER_ELEMENT * this.size,
      ownsBuffer
    });
    this._hasExternalBuffer = true;
    return vector;
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

/** Input accepted by operations that normalize GPUVectors into evaluators. */
export type GPUTableEvaluatorInput = GPUTableEvaluator | GPUVector;

/** Returns an evaluator, wrapping GPUVector inputs when needed. */
export function getGPUTableEvaluator(input: GPUTableEvaluatorInput): GPUTableEvaluator {
  return input instanceof GPUTableEvaluator ? input : GPUTableEvaluator.fromGPUVector(input);
}

function validatePackedNumericGPUVector(vector: GPUVector): void {
  if (vector.bufferLayout) {
    throw new Error(
      `GPUTableEvaluator.fromGPUVector() does not accept interleaved vector "${vector.name}"`
    );
  }

  const scalarType = getScalarArrowType(vector.type);
  if (!arrow.DataType.isFloat(scalarType) && !arrow.DataType.isInt(scalarType)) {
    throw new Error('GPUTableEvaluator.fromGPUVector() requires numeric GPUVector input');
  }
  if (arrow.DataType.isInt(scalarType) && scalarType.bitWidth === 64) {
    throw new Error('GPUTableEvaluator.fromGPUVector() does not support 64-bit integer input');
  }
  if (arrow.DataType.isFloat(scalarType) && scalarType.precision === arrow.Precision.HALF) {
    throw new Error('GPUTableEvaluator.fromGPUVector() does not support float16 input');
  }

  const expectedRowByteLength = getArrowScalarByteLength(scalarType) * vector.stride;
  if (vector.rowByteLength !== expectedRowByteLength) {
    throw new Error(
      `GPUTableEvaluator.fromGPUVector() requires rowByteLength ${expectedRowByteLength} for vector "${vector.name}"`
    );
  }
  if (vector.byteStride !== vector.rowByteLength) {
    throw new Error(`GPUTableEvaluator.fromGPUVector() requires packed vector "${vector.name}"`);
  }
}

function getGPUTablePropsFromGPUVector(vector: GPUVector): {type: SignedDataType; size: number} {
  const scalarType = getScalarArrowType(vector.type);
  if (arrow.DataType.isFloat(scalarType) && scalarType.precision === arrow.Precision.DOUBLE) {
    return {type: 'uint32', size: vector.stride * 2};
  }
  return {type: getSignedDataType(scalarType), size: vector.stride};
}

function resolveGPUVectorBuffer(vector: GPUVector): Buffer {
  const buffer = vector.buffer;
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

function getInterleavedAttributes(evaluator: GPUTableEvaluator): BufferAttributeLayout[] {
  const source = evaluator.source;
  if (!source || source instanceof GPUTableEvaluator || !('inputs' in source)) {
    return [
      {
        attribute: evaluator.toString(),
        format: getVertexFormat(evaluator.type, evaluator.size),
        byteOffset: 0
      }
    ];
  }

  const attributes: BufferAttributeLayout[] = [];
  let byteOffset = 0;
  for (const [name, input] of Object.entries(source.inputs)) {
    if (!(input instanceof GPUTableEvaluator)) {
      continue;
    }
    attributes.push({
      attribute: input.id ?? name,
      format: getVertexFormat(input.type, input.size),
      byteOffset
    });
    byteOffset += input.ValueType.BYTES_PER_ELEMENT * input.size;
  }
  return attributes;
}

function getVertexFormat(type: SignedDataType, size: number): VertexFormat {
  if (size < 1 || size > 4) {
    throw new Error(`Cannot synthesize a GPUVector vertex format with ${size} components`);
  }
  if (
    (type === 'uint8' || type === 'sint8' || type === 'uint16' || type === 'sint16') &&
    size === 3
  ) {
    return `${type}x3-webgl` as VertexFormat;
  }
  return `${type}${size === 1 ? '' : `x${size}`}` as VertexFormat;
}

function getArrowDataType(type: SignedDataType, size: number): arrow.DataType {
  const scalarType = getArrowScalarType(type);
  return size === 1
    ? scalarType
    : new arrow.FixedSizeList(size, new arrow.Field('value', scalarType, false));
}

function getArrowScalarType(type: SignedDataType): arrow.DataType {
  switch (type) {
    case 'uint8':
      return new arrow.Uint8();
    case 'sint8':
      return new arrow.Int8();
    case 'uint16':
      return new arrow.Uint16();
    case 'sint16':
      return new arrow.Int16();
    case 'uint32':
      return new arrow.Uint32();
    case 'sint32':
      return new arrow.Int32();
    case 'float32':
      return new arrow.Float32();
    default:
      throw new Error(`Cannot synthesize an Arrow type for ${type}`);
  }
}

function getScalarArrowType(type: arrow.DataType): arrow.DataType {
  return arrow.DataType.isFixedSizeList(type) ? type.children[0].type : type;
}

function getSignedDataType(type: arrow.DataType): SignedDataType {
  if (arrow.DataType.isInt(type)) {
    switch (type.bitWidth) {
      case 8:
        return type.isSigned ? 'sint8' : 'uint8';
      case 16:
        return type.isSigned ? 'sint16' : 'uint16';
      case 32:
        return type.isSigned ? 'sint32' : 'uint32';
    }
  }

  if (arrow.DataType.isFloat(type) && type.precision === arrow.Precision.SINGLE) {
    return 'float32';
  }

  throw new Error(`Unsupported GPUVector logical type ${type}`);
}

function getArrowScalarByteLength(type: arrow.DataType): number {
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
  throw new Error(`Unsupported GPUVector logical type ${type}`);
}
