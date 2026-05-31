// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {
  Device,
  Buffer,
  SignedDataType,
  type BufferAttributeLayout,
  type VertexFormat
} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {
  GPUVector,
  getDataTypeFromTypedArray,
  getGPUVectorFormatInfo,
  getTypedArrayFromDataType,
  isVertexListGPUVectorFormat,
  type GPUVectorFormat
} from '@luma.gl/tables';
import type {TypedArray, TypedArrayConstructor} from '@math.gl/types';
import {bufferPool} from '../utils/buffer-pool';
import type {Operation} from './operation';

type GPUTableEvaluatorBufferOwnership = 'owned' | 'borrowed';

/** Evaluation options for {@link GPUTableEvaluator.evaluate}. */
export type GPUTableEvaluatorEvaluateOptions = {
  /** Output vector name. */
  name?: string;
  /** Memory format for the materialized GPUVector. Defaults to the evaluator's type and size. */
  format?: GPUVectorFormat;
  /** Whether to materialize the GPUVector as an interleaved vector. */
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
  /** Whether integer values should be normalized when read as float vertex attributes. */
  normalized?: boolean;
  /** CPU buffer that initializes the table, required unless `source` or `buffer` is supplied. */
  value?: TypedArray;
  /** External GPU buffer that backs this table and is not owned by the evaluator. */
  buffer?: Buffer;
  /** External GPUVector resource that backs this evaluator and is not owned by it. */
  gpuVector?: GPUVector;
  /** Optional memory format preserved for GPUVector interop. */
  format?: GPUVectorFormat;
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
  /** Optional memory format preserved for GPUVector interop. */
  readonly format?: GPUVectorFormat;

  /** User-assigned id for easy debugging */
  protected _id?: string;
  /** destroy() has been called and no more resources should be created */
  protected _destroyed: boolean = false;

  /** CPU buffer, either provided by the user or read back from the GPU */
  protected _value?: TypedArray;
  /** Materialized GPU resource backing this evaluator. */
  private _gpuVector?: GPUVector;
  /** Whether this evaluator owns its backing GPU buffer or only borrows another resource's buffer. */
  private _bufferOwnership: GPUTableEvaluatorBufferOwnership = 'owned';

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
    let resolvedType = type;
    let typedValue: TypedArray;
    if (Array.isArray(value)) {
      resolvedType = resolvedType || 'float32';
      const ArrayType = getTypedArrayFromDataType(resolvedType);
      typedValue = new ArrayType(value) as TypedArray;
    } else if (value instanceof Float64Array) {
      // This is not really supported by GPU buffer, treat it as 2 uints
      resolvedType = 'uint32';
      size *= 2;
      offset *= 2;
      stride *= 2;
      typedValue = new Uint32Array(value.buffer);
    } else {
      resolvedType = resolvedType || getDataTypeFromTypedArray(value);
      typedValue = value;
    }
    const id = `<${resolvedType} * ${size}>`;
    return new GPUTableEvaluator({
      id,
      type: resolvedType,
      size,
      offset,
      stride,
      normalized,
      value: typedValue
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
    if (!Array.isArray(value)) {
      id = String(value);
      value = [value];
    } else {
      id = `[${value.join(',')}]`;
    }
    return new GPUTableEvaluator({
      id,
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
    const data = getSingleGPUVectorData(vector);

    return new GPUTableEvaluator({
      id: vector.name,
      type,
      size,
      offset: data.byteOffset,
      stride: vector.byteStride,
      length: vector.length,
      gpuVector: vector,
      format: vector.format
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
    const {id, value, buffer, gpuVector, format, source = null, isConstant = false} = props;
    if (!source && !value && !buffer && !gpuVector) {
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
    if (!type) {
      throw new Error('GPUTableEvaluator: type not defined');
    }

    this._id = id;
    this.type = type;
    this.size = size;
    this.ValueType = getTypedArrayFromDataType(this.type);
    this.offset = offset;
    this.stride = stride || this.ValueType.BYTES_PER_ELEMENT * size;
    this.normalized = normalized;
    this.source = source;
    this.format = format;
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
    this._value = value;
    this._bufferOwnership =
      source instanceof GPUTableEvaluator || buffer || gpuVector ? 'borrowed' : 'owned';
    if (gpuVector) {
      this._gpuVector = gpuVector;
    } else if (buffer) {
      this._gpuVector = this.createGPUVectorView({
        buffer,
        name: this._id,
        format: this.format
      });
    }
  }

  /** CPU-side typed array, when available. */
  get value(): TypedArray | undefined {
    return (
      this._value || (this.source instanceof GPUTableEvaluator ? this.source.value : undefined)
    );
  }

  /** Whether a GPUVector has been materialized for this evaluator. */
  get evaluated(): boolean {
    return Boolean(this._gpuVector);
  }

  /** Optional debug id or source GPUVector name. */
  get id(): string | undefined {
    return this._id;
  }

  /** Materialized GPUVector resource for the table. Only available after {@link GPUTableEvaluator.evaluate} resolves. */
  get gpuVector(): GPUVector {
    if (!this._gpuVector) {
      throw new Error(`${this} not evaluated`);
    }
    return this._gpuVector;
  }

  /**
   * Materializes the table on a device and returns the requested output format.
   *
   * If the table is operation-backed, dependencies are evaluated first and then the backend
   * operation writes into a cached GPU buffer.
   */
  async evaluate(
    device: Device,
    options: GPUTableEvaluatorEvaluateOptions = {}
  ): Promise<GPUVector> {
    if (this._destroyed) {
      throw new Error(`GPUTableEvaluator ${this} already destroyed`);
    }
    if (this._gpuVector) {
      return this._gpuVector;
    }

    let buffer: Buffer;
    if (this.source instanceof GPUTableEvaluator) {
      const sourceGPUVector = await this.source.evaluate(device);
      this._gpuVector = this.createGPUVectorView({
        ...options,
        buffer: getGPUVectorBuffer(sourceGPUVector)
      });
      return this._gpuVector;
    }

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
    this._gpuVector = this.createGPUVectorView({...options, buffer});
    return this._gpuVector;
  }

  /** Creates a GPUVector view over a materialized backing buffer. */
  private createGPUVectorView(
    options: GPUTableEvaluatorEvaluateOptions & {buffer: Buffer}
  ): GPUVector {
    const name = options.name ?? this._id ?? 'vector';
    const format =
      options.format ?? this.format ?? getVertexFormat(this.type, this.size, this.normalized);

    if (options.interleaved) {
      const attributes =
        typeof options.interleaved === 'object' && options.interleaved.attributes
          ? options.interleaved.attributes
          : getInterleavedAttributes(this);
      return new GPUVector({
        type: 'interleaved',
        name,
        buffer: options.buffer,
        format: options.format ?? this.format,
        length: this.length,
        byteOffset: this.offset,
        byteStride: this.stride,
        attributes,
        ownsBuffer: false
      });
    }

    return new GPUVector({
      type: 'buffer',
      name,
      buffer: options.buffer,
      format,
      length: this.length,
      stride: this.size,
      byteOffset: this.offset,
      byteStride: this.stride,
      rowByteLength: this.ValueType.BYTES_PER_ELEMENT * this.size,
      ownsBuffer: false
    });
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
      const bytes = await getGPUVectorBuffer(this.gpuVector).readAsync(
        this.offset,
        this.byteLength
      );
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
    if (this._gpuVector) {
      if (this._bufferOwnership === 'owned') {
        bufferPool.recycle(getGPUVectorBuffer(this._gpuVector));
      }
      this._gpuVector = undefined;
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

/** Returns source format only when it exactly matches the requested evaluator layout. */
export function getCompatibleGPUTableEvaluatorFormat(
  input: GPUTableEvaluator,
  type: SignedDataType,
  size: number,
  normalized: boolean = false
): GPUVectorFormat | undefined {
  const expectedFormat = getVertexFormat(type, size, normalized);
  return input.format === expectedFormat ? input.format : undefined;
}

function validatePackedNumericGPUVector(vector: GPUVector): void {
  if (vector.bufferLayout) {
    throw new Error(
      `GPUTableEvaluator.fromGPUVector() does not accept interleaved vector "${vector.name}"`
    );
  }
  getSingleGPUVectorData(vector);
  if (!vector.format) {
    throw new Error('GPUTableEvaluator.fromGPUVector() requires GPUVector format metadata');
  }
  if (isVertexListGPUVectorFormat(vector.format)) {
    throw new Error('GPUTableEvaluator.fromGPUVector() does not support vertex-list input');
  }
  const formatInfo = getGPUVectorFormatInfo(vector.format);
  const expectedRowByteLength = formatInfo.byteLength;
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
  if (!vector.format) {
    throw new Error('GPUTableEvaluator.fromGPUVector() requires GPUVector format metadata');
  }
  const formatInfo = getGPUVectorFormatInfo(vector.format);
  return {type: formatInfo.signedDataType, size: formatInfo.components};
}

/** Returns the concrete Buffer for a GPUVector, unwrapping DynamicBuffer when needed. */
export function getGPUVectorBuffer(vector: GPUVector): Buffer {
  const buffer = getSingleGPUVectorData(vector).buffer;
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

function getSingleGPUVectorData(vector: GPUVector) {
  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error(`GPUTableEvaluator requires exactly one GPUData chunk for "${vector.name}"`);
  }
  return data;
}

function getInterleavedAttributes(evaluator: GPUTableEvaluator): BufferAttributeLayout[] {
  const attributes: BufferAttributeLayout[] = [];
  collectInterleavedAttributes(evaluator, attributes, {byteOffset: 0});
  return attributes;
}

function collectInterleavedAttributes(
  evaluator: GPUTableEvaluator,
  attributes: BufferAttributeLayout[],
  state: {byteOffset: number}
): void {
  const source = evaluator.source;
  if (source && !(source instanceof GPUTableEvaluator) && source.name === 'interleave') {
    for (const input of Object.values(source.inputs)) {
      if (input instanceof GPUTableEvaluator) {
        collectInterleavedAttributes(input, attributes, state);
      }
    }
    return;
  }

  attributes.push({
    attribute: evaluator.id ?? evaluator.toString(),
    format: getVertexFormat(evaluator.type, evaluator.size, evaluator.normalized),
    byteOffset: state.byteOffset
  });
  state.byteOffset += evaluator.ValueType.BYTES_PER_ELEMENT * evaluator.size;
}

function getVertexFormat(
  type: SignedDataType,
  size: number,
  normalized: boolean = false
): VertexFormat {
  if (size < 1 || size > 4) {
    throw new Error(`Cannot synthesize a GPUVector vertex format with ${size} components`);
  }
  let baseFormat: string = type;
  if (normalized) {
    switch (type) {
      case 'uint8':
        baseFormat = 'unorm8';
        break;
      case 'sint8':
        baseFormat = 'snorm8';
        break;
      case 'uint16':
        baseFormat = 'unorm16';
        break;
      case 'sint16':
        baseFormat = 'snorm16';
        break;
      case 'float32':
        baseFormat = 'float32';
        break;
      default:
        throw new Error(`Unsupported normalized vertex format for ${type}`);
    }
  }
  if (
    (baseFormat === 'uint8' ||
      baseFormat === 'sint8' ||
      baseFormat === 'uint16' ||
      baseFormat === 'sint16' ||
      baseFormat === 'unorm8' ||
      baseFormat === 'snorm8' ||
      baseFormat === 'unorm16' ||
      baseFormat === 'snorm16') &&
    size === 3
  ) {
    return `${baseFormat}x3-webgl` as VertexFormat;
  }
  return `${baseFormat}${size === 1 ? '' : `x${size}`}` as VertexFormat;
}
