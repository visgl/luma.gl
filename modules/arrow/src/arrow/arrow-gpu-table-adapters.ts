// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Device, type ShaderLayout, type VertexFormat} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {
  GPUData,
  GPURecordBatch,
  GPUTable,
  GPUVector,
  type GPURecordBatchSourceInfo,
  type GPUVectorBufferProps,
  type GPUVectorFormat,
  type VertexList
} from '@luma.gl/tables';
import {
  Data,
  DataType,
  Dictionary,
  Field,
  FixedSizeList,
  Float32,
  Int16,
  Int32,
  Int8,
  List,
  RecordBatch,
  Schema,
  Table,
  Uint16,
  Uint32,
  Uint8,
  Utf8,
  Vector
} from 'apache-arrow';
import {getArrowFieldByPath, getArrowVectorByPath} from './arrow-paths';
import {getArrowBufferLayout, type ArrowVertexFormatOptions} from './arrow-shader-layout';
import {
  getArrowDataBufferSource,
  getArrowGPUDataReadbackMetadata,
  getArrowTypeByteStride,
  getArrowTypeStride,
  getArrowUtf8DataBufferSource,
  getArrowVariableLengthAttributeDataBufferSource,
  getArrowVectorBufferSource,
  readArrowGPUDataAsync as readArrowGPUDataChunkAsync,
  validateArrowGPUDataDirectUpload,
  type GPUDataReadbackMetadata
} from './arrow-gpu-data';
import {
  isInstanceArrowType,
  isVariableLengthAttributeArrowType,
  type AttributeArrowType,
  type VariableLengthAttributeArrowType
} from './arrow-types';
import {getArrowMatrixVectorInfo} from './arrow-matrix-vector';
import {getGPUVectorFormatFromArrowDataType} from './arrow-gpu-vector-format';

type ArrowUtf8DictionaryIndexType = Int8 | Int16 | Int32 | Uint8 | Uint16 | Uint32;
type ArrowUtf8Dictionary = Dictionary<Utf8, ArrowUtf8DictionaryIndexType>;
type VertexFormatForArrowScalarType<T extends DataType> = T extends Float32
  ? 'float32'
  : T extends Uint8
    ? 'uint8'
    : T extends Int8
      ? 'sint8'
      : T extends Uint16
        ? 'uint16'
        : T extends Int16
          ? 'sint16'
          : T extends Uint32
            ? 'uint32'
            : T extends Int32
              ? 'sint32'
              : never;
type VertexFormatForArrowFixedSizeListType<T extends DataType> =
  VertexFormatForArrowScalarType<T> extends infer Format extends string
    ? Extract<
        Format | `${Format}x2` | `${Format}x3` | `${Format}x3-webgl` | `${Format}x4`,
        VertexFormat
      >
    : never;
type VertexFormatForArrowType<T extends DataType> =
  T extends FixedSizeList<infer ChildType>
    ? VertexFormatForArrowFixedSizeListType<ChildType>
    : VertexFormatForArrowScalarType<T>;
export type GPUVectorFormatForArrowType<T extends DataType = DataType> = T extends Utf8
  ? 'uint8'
  : T extends Dictionary
    ? GPUVectorFormat
    : T extends List<infer ChildType>
      ? VertexFormatForArrowType<ChildType> extends never
        ? GPUVectorFormat
        : VertexList<VertexFormatForArrowType<ChildType>>
      : VertexFormatForArrowType<T> extends never
        ? GPUVectorFormat
        : VertexFormatForArrowType<T>;

/** Props for uploading one Arrow vector into GPU storage. */
export type GPUVectorFromArrowProps<Format extends GPUVectorFormat = GPUVectorFormat> =
  GPUVectorBufferProps & {
    /** Stable vector name. */
    name?: string;
    /** Canonical GPUVector memory-layout descriptor. */
    format?: Format;
    /** Upload each Arrow Data chunk into its own GPUData buffer instead of packing one buffer. */
    preserveDataChunks?: boolean;
  };

type ArrowGPUDataProps = GPUVectorBufferProps & {
  /** Canonical GPUVector memory-layout descriptor. */
  format?: GPUVectorFormat;
};

/** Props for uploading one Arrow record batch into a generic GPU record batch. */
export type GPURecordBatchFromArrowRecordBatchProps = ArrowVertexFormatOptions & {
  /** Shader layout that selects which Arrow columns should be uploaded. */
  shaderLayout: ShaderLayout;
  /** Maps shader attribute names to Arrow column paths. */
  arrowPaths?: Record<string, string>;
  /** Buffer props applied to Arrow-backed GPU vectors. */
  bufferProps?: GPUVectorBufferProps;
  /** Optional source-row identity retained for picking and diagnostics. */
  sourceInfo?: GPURecordBatchSourceInfo;
};

/** Props for uploading one Arrow table into a generic GPU table. */
export type GPUTableFromArrowTableProps = ArrowVertexFormatOptions & {
  /** Shader layout that selects which Arrow columns should be uploaded. */
  shaderLayout: ShaderLayout;
  /** Maps shader attribute names to Arrow column paths. */
  arrowPaths?: Record<string, string>;
  /** Buffer props applied to Arrow-backed GPU vectors. */
  bufferProps?: GPUVectorBufferProps;
};

/** Uploads one Arrow `Data` chunk into generic GPU storage. */
export function makeGPUDataFromArrowData<T extends DataType>(
  device: Device,
  data: Data<T>,
  props: ArrowGPUDataProps = {}
): GPUData {
  const arrowType = data.type as T;
  const {format = getGPUVectorFormatForArrowType(arrowType), ...bufferProps} = props;
  const readbackMetadata = getArrowGPUDataReadbackMetadata(data) as GPUDataReadbackMetadata;

  if (isArrowUtf8DictionaryType(arrowType)) {
    const byteStride = getArrowTypeByteStride(arrowType.indices);
    return new GPUData({
      buffer: new DynamicBuffer(device, {
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        ...bufferProps,
        data: getArrowDictionaryIndexBufferSource(data as unknown as Data<ArrowUtf8Dictionary>)
      }),
      dataType: arrowType,
      format,
      length: data.length,
      stride: 1,
      byteStride,
      rowByteLength: byteStride,
      ownsBuffer: true
    }) as GPUData;
  }

  if (DataType.isUtf8(arrowType)) {
    return new GPUData({
      buffer: new DynamicBuffer(device, {
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        ...bufferProps,
        data: getArrowUtf8DataBufferSource(data as Data<Utf8>)
      }),
      dataType: arrowType,
      format,
      length: data.length,
      stride: 1,
      byteStride: 1,
      rowByteLength: 1,
      ownsBuffer: true,
      readbackMetadata
    });
  }

  if (isVariableLengthAttributeArrowType(arrowType)) {
    validateArrowGPUDataDirectUpload(
      'makeGPUDataFromArrowData',
      data as unknown as Data<VariableLengthAttributeArrowType>
    );
    const byteStride = getArrowTypeByteStride(arrowType);
    return new GPUData({
      buffer: new DynamicBuffer(device, {
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        ...bufferProps,
        data: getArrowVariableLengthAttributeDataBufferSource(
          data as unknown as Data<VariableLengthAttributeArrowType>
        )
      }),
      dataType: arrowType,
      format,
      length: data.length,
      valueLength: getArrowDataValueLength(data),
      stride: getArrowTypeStride(arrowType),
      byteStride,
      rowByteLength: byteStride,
      ownsBuffer: true,
      readbackMetadata
    });
  }

  const byteStride = getArrowTypeByteStride(arrowType);
  return new GPUData({
    buffer: new DynamicBuffer(device, {
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      ...bufferProps,
      data: getArrowDataBufferSource(data as unknown as Data<AttributeArrowType>)
    }),
    dataType: arrowType,
    format,
    length: data.length,
    stride: getArrowTypeStride(arrowType),
    byteStride,
    rowByteLength: byteStride,
    ownsBuffer: true,
    readbackMetadata
  });
}

/** Uploads one Arrow vector into a generic GPU vector. */
export function makeGPUVectorFromArrow<
  Format extends GPUVectorFormat,
  T extends DataType = DataType
>(
  device: Device,
  vector: Vector<T>,
  props: GPUVectorFromArrowProps<Format> & {format: Format}
): GPUVector<Format>;
export function makeGPUVectorFromArrow<T extends DataType>(
  device: Device,
  vector: Vector<T>,
  props?: GPUVectorFromArrowProps
): GPUVector<GPUVectorFormatForArrowType<T>>;
export function makeGPUVectorFromArrow<T extends DataType>(
  device: Device,
  vector: Vector<T>,
  props: GPUVectorFromArrowProps = {}
): GPUVector {
  const {name = 'vector', format, preserveDataChunks = true, ...bufferProps} = props;
  const arrowType = vector.type as T;
  const matrixInfo = getArrowMatrixVectorInfo(vector);
  const isCanonicalFloat32Matrix = matrixInfo && isCanonicalFloat32ArrowMatrixInfo(matrixInfo);
  const requiresChunkedUpload =
    DataType.isUtf8(arrowType) ||
    isArrowUtf8DictionaryType(arrowType) ||
    isVariableLengthAttributeArrowType(arrowType);
  if (matrixInfo && !isCanonicalFloat32Matrix) {
    throw new Error(
      'GPUVector matrix columns require canonical Float32 column-major wgsl-storage values; use prepareArrowMatrixGPUVector() first'
    );
  }

  if (!isInstanceArrowType(arrowType) && !isCanonicalFloat32Matrix && !requiresChunkedUpload) {
    throw new Error(`GPUVector does not support Arrow type ${arrowType}`);
  }

  const vectorFormat =
    format ?? (matrixInfo ? 'float32x4' : getGPUVectorFormatForArrowType(arrowType));
  const byteStride = DataType.isUtf8(arrowType)
    ? 1
    : isArrowUtf8DictionaryType(arrowType)
      ? getArrowTypeByteStride(arrowType.indices)
      : getArrowTypeByteStride(arrowType);
  const stride =
    DataType.isUtf8(arrowType) || isArrowUtf8DictionaryType(arrowType)
      ? 1
      : getArrowTypeStride(arrowType);
  if (preserveDataChunks || requiresChunkedUpload) {
    return new GPUVector({
      type: 'data',
      name,
      dataType: arrowType,
      format: vectorFormat,
      data: vector.data.map(data =>
        makeGPUDataFromArrowData(device, data as Data<T>, {...bufferProps, format: vectorFormat})
      ),
      stride,
      byteStride,
      rowByteLength: byteStride,
      ownsData: true
    });
  }

  const buffer = device.createBuffer({
    usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    ...bufferProps,
    data: getArrowVectorBufferSource(vector as unknown as Vector<AttributeArrowType>)
  });
  return new GPUVector({
    type: 'data',
    name,
    dataType: arrowType,
    format: vectorFormat,
    data: [
      new GPUData({
        buffer,
        dataType: arrowType,
        format: vectorFormat,
        length: vector.length,
        valueLength: vector.data.reduce(
          (totalValueLength, chunk) => totalValueLength + getArrowDataValueLength(chunk),
          0
        ),
        stride,
        byteStride,
        rowByteLength: byteStride,
        ownsBuffer: true
      }) as GPUData
    ],
    stride,
    byteStride,
    rowByteLength: byteStride,
    ownsData: true
  });
}

/** Uploads one Arrow record batch into a generic GPU record batch. */
export function makeGPURecordBatchFromArrowRecordBatch(
  device: Device,
  recordBatch: RecordBatch,
  options: GPURecordBatchFromArrowRecordBatchProps
): GPURecordBatch {
  const table = new Table([recordBatch]);
  const bufferLayout = getArrowBufferLayout(options.shaderLayout, {
    arrowTable: table,
    arrowPaths: options.arrowPaths,
    allowWebGLOnlyFormats: options.allowWebGLOnlyFormats
  });
  const fields: Field[] = [];
  const vectors: Record<string, GPUVector> = {};
  const bindings: Record<string, Buffer | DynamicBuffer> = {};
  const selectedNames = new Set<string>();

  for (const layout of bufferLayout) {
    const arrowPath = options.arrowPaths?.[layout.name] || layout.name;
    const vector = getArrowVectorByPath(table, arrowPath);
    const sourceField = getArrowFieldByPath(table, arrowPath);
    const gpuVector = makeGPUVectorFromArrow(device, vector as Vector, {
      ...options.bufferProps,
      name: layout.name,
      format: layout.format
    });
    fields.push(
      new Field(layout.name, vector.type, sourceField.nullable, new Map(sourceField.metadata))
    );
    selectedNames.add(layout.name);
    vectors[layout.name] = gpuVector;
  }

  for (const storageBinding of getArrowStorageBindings(options.shaderLayout)) {
    if (selectedNames.has(storageBinding.name)) {
      throw new Error(
        `GPURecordBatch shader input "${storageBinding.name}" cannot be both an attribute and a storage binding`
      );
    }
    const arrowPath = options.arrowPaths?.[storageBinding.name] || storageBinding.name;
    const vector = tryGetArrowVectorByPath(table, arrowPath);
    const sourceField = tryGetArrowFieldByPath(table, arrowPath);
    if (!vector || !sourceField) {
      continue;
    }
    const gpuVector = makeGPUVectorFromArrow(device, vector as Vector, {
      ...options.bufferProps,
      name: storageBinding.name
    });
    fields.push(
      new Field(
        storageBinding.name,
        vector.type,
        sourceField.nullable,
        new Map(sourceField.metadata)
      )
    );
    selectedNames.add(storageBinding.name);
    vectors[storageBinding.name] = gpuVector;
    bindings[storageBinding.name] = getSingleGPUVectorDataBuffer(gpuVector, storageBinding.name);
  }

  return new GPURecordBatch({
    vectors,
    bufferLayout,
    fields,
    numRows: recordBatch.numRows,
    metadata: new Map(recordBatch.schema.metadata),
    sourceInfo: options.sourceInfo,
    nullCount: recordBatch.nullCount,
    bindings
  });
}

/** Uploads one Arrow table into a generic GPU table while preserving record-batch boundaries. */
export function makeGPUTableFromArrowTable(
  device: Device,
  table: Table,
  options: GPUTableFromArrowTableProps
): GPUTable {
  let sourceRowIndexOffset = 0;
  const batches = table.batches.map((recordBatch, sourceBatchIndex) => {
    const batch = makeGPURecordBatchFromArrowRecordBatch(device, recordBatch, {
      ...options,
      sourceInfo: {
        sourceBatchIndex,
        sourceRowIndexOffset,
        sourceRowCount: recordBatch.numRows
      }
    });
    sourceRowIndexOffset += recordBatch.numRows;
    return batch;
  });
  const firstBatch = batches[0];
  const bufferLayout =
    firstBatch?.bufferLayout ??
    getArrowBufferLayout(options.shaderLayout, {
      arrowTable: table,
      arrowPaths: options.arrowPaths,
      allowWebGLOnlyFormats: options.allowWebGLOnlyFormats
    });
  const schema =
    firstBatch?.schema ??
    new Schema(
      bufferLayout.map(layout => {
        const arrowPath = options.arrowPaths?.[layout.name] || layout.name;
        const vector = getArrowVectorByPath(table, arrowPath);
        const sourceField = getArrowFieldByPath(table, arrowPath);
        return new Field(
          layout.name,
          vector.type,
          sourceField.nullable,
          new Map(sourceField.metadata)
        );
      }),
      new Map(table.schema.metadata)
    );

  return new GPUTable({
    batches,
    schema,
    bufferLayout,
    numRows: table.numRows,
    nullCount: table.nullCount
  });
}

/** Reads one generic GPU data range back into Arrow `Data`. */
export async function readArrowGPUDataAsync<T extends DataType>(data: GPUData): Promise<Data<T>> {
  return readArrowGPUDataChunkAsync(data) as Promise<Data<T>>;
}

/** Reads one generic GPU vector back into an Arrow vector. */
export async function readArrowGPUVectorAsync<T extends DataType>(
  vector: GPUVector
): Promise<Vector<T>> {
  if (vector.bufferLayout) {
    throw new Error('readArrowGPUVectorAsync() does not support interleaved vectors');
  }
  const data = await Promise.all(vector.data.map(chunk => readArrowGPUDataAsync<T>(chunk)));
  return new Vector(data) as Vector<T>;
}

function getSingleGPUVectorDataBuffer(
  vector: GPUVector,
  bindingName: string
): Buffer | DynamicBuffer {
  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error(
      `GPURecordBatch storage binding "${bindingName}" requires exactly one GPUData chunk`
    );
  }
  return data.buffer;
}

function getArrowStorageBindings(shaderLayout: ShaderLayout): Array<{name: string}> {
  return shaderLayout.bindings.filter(
    binding =>
      (binding.type === 'storage' || binding.type === 'read-only-storage') && !('format' in binding)
  );
}

function tryGetArrowVectorByPath(table: Table, path: string): Vector | null {
  try {
    return getArrowVectorByPath(table, path);
  } catch {
    return null;
  }
}

function tryGetArrowFieldByPath(table: Table, path: string): Field | null {
  try {
    return getArrowFieldByPath(table, path);
  } catch {
    return null;
  }
}

function isArrowUtf8DictionaryType(type: DataType): type is ArrowUtf8Dictionary {
  return (
    DataType.isDictionary(type) &&
    type.dictionary instanceof Utf8 &&
    DataType.isInt(type.indices) &&
    type.indices.bitWidth <= 32
  );
}

function getGPUVectorFormatForArrowType(type: DataType): GPUVectorFormat {
  const matrixInfo = getArrowMatrixVectorInfo({type});
  if (matrixInfo) {
    if (!isCanonicalFloat32ArrowMatrixInfo(matrixInfo)) {
      throw new Error(
        'GPUVector matrix columns require canonical Float32 column-major wgsl-storage values; use prepareArrowMatrixGPUVector() first'
      );
    }
    return 'float32x4';
  }
  if (DataType.isUtf8(type)) {
    return 'uint8';
  }
  if (isArrowUtf8DictionaryType(type)) {
    return getGPUVectorFormatFromArrowDataType(type.indices);
  }
  return getGPUVectorFormatFromArrowDataType(type);
}

function isCanonicalFloat32ArrowMatrixInfo(
  matrixInfo: NonNullable<ReturnType<typeof getArrowMatrixVectorInfo>>
): boolean {
  return (
    matrixInfo.valueType === 'float32' &&
    matrixInfo.order === 'column-major' &&
    matrixInfo.layout === 'wgsl-storage'
  );
}

function getArrowDataValueLength(data: Data): number {
  if (!isVariableLengthAttributeArrowType(data.type)) {
    return data.length;
  }

  const valueOffsets = data.valueOffsets as Int32Array | undefined;
  if (!valueOffsets) {
    return 0;
  }

  const firstValueOffset = valueOffsets[0] ?? 0;
  const lastValueOffset = valueOffsets[data.length] ?? firstValueOffset;
  return Math.max(0, lastValueOffset - firstValueOffset);
}

function getArrowDictionaryIndexBufferSource(data: Data<ArrowUtf8Dictionary>): ArrayBufferView {
  const values = data.values as ArrayBufferView & {
    subarray: (start?: number, end?: number) => ArrayBufferView;
    length: number;
  };
  const startIndex = values.length === data.length ? 0 : (data.offset ?? 0);
  return values.subarray(startIndex, startIndex + data.length);
}
