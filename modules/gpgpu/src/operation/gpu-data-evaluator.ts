// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {
  Device,
  Buffer,
  type SignedDataType,
  type BufferAttributeLayout,
  type TypedArraySignedDataTypeT,
  type VertexFormat
} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {
  GPUData,
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
import type {DoubleComponentCount, GPUVectorFormatFromTypeAndSize} from './gpu-table-format-types';

type GPUDataEvaluatorBufferOwnership = 'owned' | 'borrowed';

/** Options for materializing one {@link GPUDataEvaluator}. */
export type GPUDataEvaluatorEvaluateOptions<FormatT extends GPUVectorFormat = GPUVectorFormat> = {
  /** Name assigned to the materialized single-chunk `GPUVector`. */
  name?: string;
  /** Memory format for the materialized `GPUVector`. Defaults to the evaluator layout. */
  format?: FormatT;
  /** Whether to expose the materialized buffer through an interleaved `GPUVector` view. */
  interleaved?:
    | boolean
    | {
        /** Attribute views stored in each interleaved row. */
        attributes?: BufferAttributeLayout[];
      };
};

/** Options for adapting one existing `GPUData` chunk into a {@link GPUDataEvaluator}. */
export type GPUDataEvaluatorFromGPUDataOptions = {
  /** Optional debug name used by {@link GPUDataEvaluator.toString}. */
  id?: string;
};

/** Properties used to construct one {@link GPUDataEvaluator}. */
export type GPUDataEvaluatorProps<FormatT extends GPUVectorFormat = GPUVectorFormat> = {
  /** Optional debug name used by {@link GPUDataEvaluator.toString}. */
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
  /** CPU buffer that initializes the evaluator, required unless another source is supplied. */
  value?: TypedArray;
  /** External GPU buffer that backs this evaluator and is not owned by it. */
  buffer?: Buffer;
  /** External GPUData chunk that backs this evaluator and is not owned by it. */
  gpuData?: GPUData<FormatT>;
  /** Optional memory format preserved for GPUVector interop. */
  format?: FormatT;
  /** Lazy operation or evaluator whose output initializes this evaluator. */
  source?: Operation<any, GPUDataEvaluator<FormatT>> | GPUDataEvaluator<FormatT> | null;
  /** Whether every row should read the same value. */
  isConstant?: boolean;
  /** Number of logical rows, inferred for constants and CPU-backed tables when omitted. */
  length?: number;
};

/**
 * Device-agnostic, immutable 2D numeric evaluator used by lazy GPGPU operations.
 *
 * @remarks
 * A `GPUDataEvaluator` describes exactly one logical `GPUData` chunk, a CPU value source, or a
 * deferred operation output. It does not allocate or run GPU work until
 * {@link GPUDataEvaluator.evaluate} is called. Use `GPUVectorEvaluator` when one transform should
 * be applied independently across every `GPUData` chunk in a `GPUVector`.
 */
export class GPUDataEvaluator<FormatT extends GPUVectorFormat = GPUVectorFormat> {
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
  /** TypedArray constructor for CPU representation, derived from {@link GPUDataEvaluator.type}. */
  readonly ValueType: TypedArrayConstructor;
  /** Operation or evaluator whose output initializes this evaluator. */
  readonly source: Operation<any, GPUDataEvaluator<FormatT>> | GPUDataEvaluator<FormatT> | null =
    null;
  /** Optional memory format preserved for GPUVector interop. */
  readonly format?: FormatT;

  /** User-assigned id for easy debugging. */
  protected _id?: string;
  /** Whether {@link GPUDataEvaluator.destroy} has been called. */
  protected _destroyed: boolean = false;

  /** CPU buffer, either provided by the user or read back from the GPU. */
  protected _value?: TypedArray;
  /** Materialized GPU resource backing this evaluator. */
  private _gpuVector?: GPUVector<FormatT>;
  /** Whether this evaluator owns its backing GPU buffer or only borrows another resource's buffer. */
  private _bufferOwnership: GPUDataEvaluatorBufferOwnership = 'owned';

  /**
   * Constructs one evaluator from a CPU array.
   *
   * Plain JavaScript arrays are converted to typed arrays using `type` or `float32` by default.
   * `Float64Array` inputs are reinterpreted as `uint32` pairs so they can be consumed by GPU
   * operations such as {@link fround}.
   *
   * @param value - CPU values laid out as contiguous rows.
   * @param props - Scalar type and row layout metadata for `value`.
   * @returns One lazy evaluator backed by the provided CPU values.
   */
  static fromArray(
    value: number[],
    options: Partial<Pick<GPUDataEvaluatorProps<'float32'>, 'offset' | 'stride'>> & {
      type?: 'float32';
      size?: 1;
      normalized?: false;
    }
  ): GPUDataEvaluator<GPUVectorFormatFromTypeAndSize<'float32', 1, false>>;
  static fromArray<const SizeT extends number>(
    value: number[],
    options: Partial<Pick<GPUDataEvaluatorProps<'float32'>, 'offset' | 'stride'>> & {
      type?: 'float32';
      size: SizeT;
      normalized?: false;
    }
  ): GPUDataEvaluator<GPUVectorFormatFromTypeAndSize<'float32', SizeT, false>>;
  static fromArray<
    const TypeT extends SignedDataType,
    const SizeT extends number = 1,
    const NormalizedT extends boolean = false
  >(
    value: number[],
    options: Partial<Pick<GPUDataEvaluatorProps, 'offset' | 'stride'>> & {
      type: TypeT;
      size?: SizeT;
      normalized?: NormalizedT;
    }
  ): GPUDataEvaluator<GPUVectorFormatFromTypeAndSize<TypeT, SizeT, NormalizedT>>;
  static fromArray<const SizeT extends number = 1>(
    value: Float64Array,
    options: Partial<Pick<GPUDataEvaluatorProps, 'offset' | 'stride'>> & {
      size?: SizeT;
      normalized?: false;
    }
  ): GPUDataEvaluator<GPUVectorFormatFromTypeAndSize<'uint32', DoubleComponentCount<SizeT>, false>>;
  static fromArray<
    const TypeT extends SignedDataType,
    const SizeT extends number = 1,
    const NormalizedT extends boolean = false
  >(
    value: TypedArray,
    options: Partial<Pick<GPUDataEvaluatorProps, 'offset' | 'stride'>> & {
      type: TypeT;
      size?: SizeT;
      normalized?: NormalizedT;
    }
  ): GPUDataEvaluator<GPUVectorFormatFromTypeAndSize<TypeT, SizeT, NormalizedT>>;
  static fromArray<
    const ArrayT extends TypedArray,
    const SizeT extends number = 1,
    const NormalizedT extends boolean = false
  >(
    value: ArrayT,
    options: Partial<Pick<GPUDataEvaluatorProps, 'offset' | 'stride'>> & {
      size?: SizeT;
      normalized?: NormalizedT;
    }
  ): GPUDataEvaluator<
    GPUVectorFormatFromTypeAndSize<TypedArraySignedDataTypeT<ArrayT>, SizeT, NormalizedT>
  >;
  static fromArray(
    value: TypedArray | number[],
    {
      type,
      size = 1,
      offset = 0,
      stride = 0,
      normalized = false
    }: Partial<Pick<GPUDataEvaluatorProps, 'type' | 'size' | 'offset' | 'stride' | 'normalized'>>
  ): GPUDataEvaluator {
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
    return new GPUDataEvaluator({
      id,
      type: resolvedType,
      size,
      offset,
      stride,
      normalized,
      format: tryGetVertexFormat(resolvedType, size, normalized),
      value: typedValue
    });
  }

  /**
   * Constructs one constant evaluator whose single row is broadcast across non-constant inputs.
   *
   * @param value - Scalar or row value.
   * @param type - Scalar element type used for the CPU representation.
   * @returns One lazy evaluator backed by the constant CPU row.
   */
  static fromConstant(
    value: number,
    type?: 'float32'
  ): GPUDataEvaluator<GPUVectorFormatFromTypeAndSize<'float32', 1>>;
  static fromConstant<const TypeT extends SignedDataType = 'float32'>(
    value: number,
    type?: TypeT
  ): GPUDataEvaluator<GPUVectorFormatFromTypeAndSize<TypeT, 1>>;
  static fromConstant<
    const ValueT extends readonly number[],
    const TypeT extends SignedDataType = 'float32'
  >(
    value: ValueT,
    type?: TypeT
  ): GPUDataEvaluator<GPUVectorFormatFromTypeAndSize<TypeT, ValueT['length']>>;
  static fromConstant(
    value: number | readonly number[],
    type: SignedDataType = 'float32'
  ): GPUDataEvaluator {
    const ArrayType = getTypedArrayFromDataType(type);
    const rowValue = Array.isArray(value) ? value : [value];
    const id = Array.isArray(value) ? `[${value.join(',')}]` : String(value);
    return new GPUDataEvaluator({
      id,
      isConstant: true,
      type,
      size: rowValue.length,
      format: tryGetVertexFormat(type, rowValue.length),
      value: new ArrayType(rowValue)
    });
  }

  /**
   * Creates one evaluator view over an existing packed numeric `GPUData` chunk.
   *
   * @param data - Packed fixed-width `GPUData` chunk to borrow.
   * @param options - Optional debug metadata for the borrowed chunk.
   * @returns One lazy evaluator that borrows `data.buffer`.
   */
  static fromGPUData<FormatT extends GPUVectorFormat>(
    data: GPUData<FormatT>,
    options: GPUDataEvaluatorFromGPUDataOptions = {}
  ): GPUDataEvaluator<FormatT> {
    validatePackedNumericGPUData(data);
    const {type, size, normalized} = getGPUDataEvaluatorPropsFromGPUData(data);

    return new GPUDataEvaluator<FormatT>({
      id: options.id,
      type,
      size,
      normalized,
      offset: data.byteOffset,
      stride: data.byteStride,
      length: data.length,
      gpuData: data,
      format: data.format
    });
  }

  /**
   * Creates one evaluator from explicit row layout and source information.
   *
   * Prefer {@link GPUDataEvaluator.fromArray} or {@link GPUDataEvaluator.fromConstant} for CPU-backed tables.
   *
   * @param props - Row layout and one value, buffer, GPUData, or deferred source.
   */
  constructor(props: GPUDataEvaluatorProps<FormatT>) {
    const {id, value, buffer, gpuData, source = null, isConstant = false} = props;
    if (!source && !value && !buffer && !gpuData) {
      throw new Error('GPUDataEvaluator must have a value source');
    }
    let {type, size, offset, stride, normalized, length} = props;
    let {format} = props;
    if (source instanceof GPUDataEvaluator) {
      type = type ?? source.type;
      size = size ?? source.size;
      offset = offset ?? source.offset;
      stride = stride ?? source.stride;
      normalized = normalized ?? source.normalized;
      length = length ?? source.length;
      format = format ?? source.format;
    } else {
      size = size ?? 1;
      offset = offset ?? 0;
      normalized = normalized ?? false;
      length = isConstant ? 1 : length;
    }
    if (!type) {
      throw new Error('GPUDataEvaluator: type not defined');
    }

    this._id = id;
    this.type = type;
    this.size = size;
    this.ValueType = getTypedArrayFromDataType(this.type);
    this.offset = offset;
    this.stride = stride || this.ValueType.BYTES_PER_ELEMENT * size;
    this.normalized = normalized;
    this.source = source;
    this.format = (format ?? tryGetVertexFormat(this.type, this.size, this.normalized)) as
      | FormatT
      | undefined;
    if (length === undefined) {
      if (isConstant) {
        length = 1;
      } else {
        if (!value) {
          throw new Error('GPUDataEvaluator: length not defined');
        }
        length = Math.ceil(value.byteLength / this.stride);
      }
    }
    this.isConstant = isConstant;
    this.length = length;
    this.byteLength = this.stride * length;
    this._value = value;
    this._bufferOwnership =
      source instanceof GPUDataEvaluator || buffer || gpuData ? 'borrowed' : 'owned';
    if (gpuData) {
      this._gpuVector = new GPUVector({
        type: 'data',
        name: this._id ?? 'data',
        format: gpuData.format,
        data: [gpuData],
        stride: gpuData.stride,
        byteStride: gpuData.byteStride,
        rowByteLength: gpuData.rowByteLength
      });
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
    return this._value || (this.source instanceof GPUDataEvaluator ? this.source.value : undefined);
  }

  /** Whether a single-chunk `GPUVector` has been materialized for this evaluator. */
  get evaluated(): boolean {
    return Boolean(this._gpuVector);
  }

  /** Optional debug id. */
  get id(): string | undefined {
    return this._id;
  }

  /** Materialized single-chunk `GPUVector` for this evaluator. */
  get gpuVector(): GPUVector<FormatT> {
    if (!this._gpuVector) {
      throw new Error(`${this} not evaluated`);
    }
    return this._gpuVector;
  }

  /** Materialized GPU buffer backing this evaluator. */
  get buffer(): Buffer {
    return getBufferFromGPUVector(this.gpuVector);
  }

  /**
   * Materializes this evaluator on a device and returns the requested output format.
   *
   * If the evaluator is operation-backed, dependencies are evaluated first and then the backend
   * operation writes into a cached GPU buffer.
   *
   * @param device - Device used to materialize the evaluator.
   * @param options - Output view metadata for the materialized single-chunk `GPUVector`.
   * @returns The cached or newly materialized single-chunk `GPUVector`.
   */
  async evaluate(device: Device): Promise<GPUVector<FormatT>>;
  async evaluate(
    device: Device,
    options: GPUDataEvaluatorEvaluateOptions & {
      interleaved: NonNullable<GPUDataEvaluatorEvaluateOptions['interleaved']>;
    }
  ): Promise<GPUVector>;
  async evaluate<ExplicitFormatT extends GPUVectorFormat>(
    device: Device,
    options: GPUDataEvaluatorEvaluateOptions<ExplicitFormatT> & {format: ExplicitFormatT}
  ): Promise<GPUVector<ExplicitFormatT>>;
  async evaluate(device: Device, options: GPUDataEvaluatorEvaluateOptions): Promise<GPUVector>;
  async evaluate(
    device: Device,
    options: GPUDataEvaluatorEvaluateOptions = {}
  ): Promise<GPUVector> {
    if (this._destroyed) {
      throw new Error(`GPUDataEvaluator ${this} already destroyed`);
    }
    if (this._gpuVector) {
      return this._gpuVector;
    }

    let buffer: Buffer;
    if (this.source instanceof GPUDataEvaluator) {
      const sourceGPUVector = await this.source.evaluate(device);
      this._gpuVector = this.createGPUVectorView<FormatT>({
        ...(options as GPUDataEvaluatorEvaluateOptions<FormatT>),
        buffer: getBufferFromGPUVector(sourceGPUVector)
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
    this._gpuVector = this.createGPUVectorView<FormatT>({
      ...(options as GPUDataEvaluatorEvaluateOptions<FormatT>),
      buffer
    });
    return this._gpuVector;
  }

  /** Creates a single-chunk `GPUVector` view over a materialized backing buffer. */
  private createGPUVectorView<OutputFormatT extends GPUVectorFormat = FormatT>(
    options: GPUDataEvaluatorEvaluateOptions<OutputFormatT> & {buffer: Buffer}
  ): GPUVector<OutputFormatT> {
    const name = options.name ?? this._id ?? 'vector';
    const format =
      options.format ?? this.format ?? tryGetVertexFormat(this.type, this.size, this.normalized);

    if (options.interleaved) {
      const attributes =
        typeof options.interleaved === 'object' && options.interleaved.attributes
          ? options.interleaved.attributes
          : getInterleavedAttributes(this);
      return new GPUVector<OutputFormatT>({
        type: 'interleaved',
        name,
        buffer: options.buffer,
        format: options.format,
        length: this.length,
        byteOffset: this.offset,
        byteStride: this.stride,
        attributes,
        ownsBuffer: false
      });
    }

    return new GPUVector<OutputFormatT>({
      type: 'buffer',
      name,
      buffer: options.buffer,
      format: format as OutputFormatT | undefined,
      length: this.length,
      stride: this.size,
      byteOffset: this.offset,
      byteStride: this.stride,
      rowByteLength: this.ValueType.BYTES_PER_ELEMENT * this.size,
      ownsBuffer: false
    });
  }

  /**
   * Reads evaluator data back to the CPU.
   *
   * This is intended for debugging and validation. Tightly packed rows return a typed-array view;
   * strided rows are copied into a compact typed array.
   *
   * @param startRow - Inclusive first row to read.
   * @param endRow - Exclusive last row to read.
   * @returns CPU values for the requested row range.
   */
  async readValue(startRow: number = 0, endRow?: number): Promise<TypedArray> {
    const {ValueType} = this;
    const {size, offset, stride, length} = this;
    const width = ValueType.BYTES_PER_ELEMENT * size;
    endRow = endRow ?? length;
    startRow = Math.max(0, Math.min(length, startRow));
    endRow = Math.max(startRow, Math.min(length, endRow));

    if (this._value) {
      return getRowsFromValue(this, this._value, startRow, endRow);
    }

    const rowCount = endRow - startRow;
    if (rowCount === 0) {
      return new ValueType(0) as TypedArray;
    }

    const byteOffset = offset + startRow * stride;
    const byteLength = stride === width ? rowCount * width : (rowCount - 1) * stride + width;
    const bytes = await this.buffer.readAsync(byteOffset, byteLength);
    const value = new ValueType(
      bytes.buffer as ArrayBuffer,
      bytes.byteOffset,
      bytes.byteLength / ValueType.BYTES_PER_ELEMENT
    );

    if (stride === width) {
      return value;
    }

    const compactBytes = new Uint8Array(width * rowCount);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const sourceByteOffset = rowIndex * stride;
      compactBytes.set(
        bytes.subarray(sourceByteOffset, sourceByteOffset + width),
        rowIndex * width
      );
    }
    return new ValueType(compactBytes.buffer);
  }

  /** Returns the debug id, source description, or class name. */
  toString(): string {
    return this._id ?? this.source?.toString() ?? this.constructor.name;
  }

  /** Releases cached GPU storage owned by this evaluator and prevents future evaluation. */
  destroy(): void {
    if (this._gpuVector) {
      if (this._bufferOwnership === 'owned') {
        bufferPool.recycle(getBufferFromGPUVector(this._gpuVector));
      }
      this._gpuVector = undefined;
    }
    this._destroyed = true;
  }
}

function getRowsFromValue(
  table: GPUDataEvaluator,
  value: TypedArray,
  startRow: number,
  endRow: number
): TypedArray {
  const {ValueType, size, offset, stride} = table;
  const valueStride = stride / ValueType.BYTES_PER_ELEMENT;
  const valueOffset = offset / ValueType.BYTES_PER_ELEMENT;
  const rowCount = endRow - startRow;

  if (valueStride === size) {
    const startIndex = valueOffset + startRow * valueStride;
    return value.subarray(startIndex, startIndex + rowCount * size) as TypedArray;
  }

  const result = new ValueType(rowCount * size) as TypedArray;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const sourceStart = valueOffset + (startRow + rowIndex) * valueStride;
    result.set(value.subarray(sourceStart, sourceStart + size), rowIndex * size);
  }
  return result;
}

/** Input accepted by leaf operations that normalize one `GPUData` chunk into an evaluator. */
export type GPUDataEvaluatorInput<FormatT extends GPUVectorFormat = GPUVectorFormat> =
  | GPUDataEvaluator<FormatT>
  | GPUData<FormatT>;

/**
 * Returns one evaluator, adapting `GPUData` inputs when needed.
 *
 * @param input - Existing evaluator or one packed fixed-width `GPUData` chunk.
 * @returns One `GPUDataEvaluator` for leaf GPGPU operations.
 */
export function getGPUDataEvaluator<FormatT extends GPUVectorFormat>(
  input: GPUDataEvaluatorInput<FormatT>
): GPUDataEvaluator<FormatT> {
  if (input instanceof GPUDataEvaluator) {
    return input;
  }
  if (input instanceof GPUData) {
    return GPUDataEvaluator.fromGPUData(input);
  }
  throw new Error('getGPUDataEvaluator() requires GPUDataEvaluator or GPUData');
}

/**
 * Returns the source format when it exactly matches a requested evaluator layout.
 *
 * @param input - Evaluator whose preserved format should be checked.
 * @param type - Required scalar element type.
 * @param size - Required scalar component count.
 * @param normalized - Required normalized integer interpretation.
 * @returns The compatible source format, or `undefined` when the layout changes.
 */
export function getCompatibleGPUDataEvaluatorFormat<FormatT extends GPUVectorFormat>(
  input: GPUDataEvaluator<FormatT>,
  type: SignedDataType,
  size: number,
  normalized: boolean = false
): FormatT | undefined {
  const expectedFormat = tryGetVertexFormat(type, size, normalized);
  return input.format === expectedFormat ? input.format : undefined;
}

function validatePackedNumericGPUData(data: GPUData): void {
  if (!data.format) {
    throw new Error('GPUDataEvaluator.fromGPUData() requires GPUData format metadata');
  }
  if (isVertexListGPUVectorFormat(data.format)) {
    throw new Error('GPUDataEvaluator.fromGPUData() does not support vertex-list input');
  }
  const formatInfo = getGPUVectorFormatInfo(data.format);
  const expectedRowByteLength = formatInfo.byteLength;
  if (data.rowByteLength !== expectedRowByteLength) {
    throw new Error(
      `GPUDataEvaluator.fromGPUData() requires rowByteLength ${expectedRowByteLength} for GPUData`
    );
  }
  if (data.byteStride !== data.rowByteLength) {
    throw new Error('GPUDataEvaluator.fromGPUData() requires packed GPUData');
  }
}

function getGPUDataEvaluatorPropsFromGPUData(data: GPUData): {
  type: SignedDataType;
  size: number;
  normalized: boolean;
} {
  if (!data.format) {
    throw new Error('GPUDataEvaluator.fromGPUData() requires GPUData format metadata');
  }
  const formatInfo = getGPUVectorFormatInfo(data.format);
  return {
    type: formatInfo.signedDataType,
    size: formatInfo.components,
    normalized: formatInfo.normalized
  };
}

/** Returns the concrete Buffer for a GPUVector, unwrapping DynamicBuffer when needed. */
function getBufferFromGPUVector(vector: GPUVector): Buffer {
  const buffer = getSingleGPUVectorData(vector).buffer;
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

function getSingleGPUVectorData(vector: GPUVector) {
  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error(`GPUDataEvaluator requires exactly one GPUData chunk for "${vector.name}"`);
  }
  return data;
}

function getInterleavedAttributes(evaluator: GPUDataEvaluator): BufferAttributeLayout[] {
  const attributes: BufferAttributeLayout[] = [];
  collectInterleavedAttributes(evaluator, attributes, {byteOffset: 0});
  return attributes;
}

function collectInterleavedAttributes(
  evaluator: GPUDataEvaluator,
  attributes: BufferAttributeLayout[],
  state: {byteOffset: number}
): void {
  const source = evaluator.source;
  if (source && !(source instanceof GPUDataEvaluator) && source.name === 'interleave') {
    for (const input of Object.values(source.inputs)) {
      if (input instanceof GPUDataEvaluator) {
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

function tryGetVertexFormat(
  type: SignedDataType,
  size: number,
  normalized: boolean = false
): VertexFormat | undefined {
  return size >= 1 && size <= 4 ? getVertexFormat(type, size, normalized) : undefined;
}
