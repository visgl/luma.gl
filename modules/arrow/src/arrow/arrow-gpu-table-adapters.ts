// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Device, type BufferLayout, type ShaderLayout} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {
  GPUData,
  GPURecordBatch,
  GPUTable,
  GPUVector,
  type GPUVectorBufferProps,
  type GPUVectorDynamicBufferProps
} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {getArrowFieldByPath, getArrowVectorByPath} from './arrow-paths';
import {getArrowBufferLayout, type ArrowVertexFormatOptions} from './arrow-shader-layout';
import {
  getAppendableGPUColumnData,
  getAppendableGPUColumns,
  type AppendableGPUColumn
} from './arrow-gpu-appendable';
import {
  GPUData as LegacyArrowGPUData,
  getArrowDataBufferSource,
  getArrowGPUDataReadbackMetadata,
  getArrowTypeByteStride,
  getArrowTypeStride,
  getArrowUtf8DataBufferSource,
  getArrowVariableLengthAttributeDataBufferSource,
  getArrowVectorBufferSource,
  readArrowGPUVectorAsync as readPackedArrowGPUVectorAsync,
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

const appendableColumnsByBatch = new WeakMap<GPURecordBatch, AppendableGPUColumn[]>();

type ArrowUtf8DictionaryIndexType =
  | arrow.Int8
  | arrow.Int16
  | arrow.Int32
  | arrow.Uint8
  | arrow.Uint16
  | arrow.Uint32;
type ArrowUtf8Dictionary = arrow.Dictionary<arrow.Utf8, ArrowUtf8DictionaryIndexType>;

/** Props for uploading one Arrow record batch into a generic GPU record batch. */
export type ArrowGPURecordBatchProps = ArrowVertexFormatOptions & {
  /** Shader layout that selects which Arrow columns should be uploaded. */
  shaderLayout: ShaderLayout;
  /** Maps shader attribute names to Arrow column paths. */
  arrowPaths?: Record<string, string>;
  /** Buffer props applied to Arrow-backed GPU vectors. */
  bufferProps?: GPUVectorBufferProps;
};

/** Props for uploading one Arrow table into a generic GPU table. */
export type ArrowGPUTableProps = ArrowGPURecordBatchProps;

/** Props for constructing appendable Arrow GPU storage from an Arrow schema. */
export type AppendableArrowGPURecordBatchProps = ArrowVertexFormatOptions & {
  /** Device that creates appendable vector storage. */
  device: Device;
  /** Source schema used to select shader-compatible columns. */
  schema: arrow.Schema;
  /** Shader layout that selects which Arrow columns should be uploaded. */
  shaderLayout: ShaderLayout;
  /** Maps shader attribute names to Arrow column paths. */
  arrowPaths?: Record<string, string>;
  /** Initial row capacity for each appendable vector. */
  initialCapacityRows?: number;
  /** Appendable vector capacity growth multiplier. */
  capacityGrowthFactor?: number;
  /** Dynamic buffer props forwarded to appendable vectors. */
  bufferProps?: GPUVectorDynamicBufferProps;
};

/** Props for constructing one appendable Arrow GPU table. */
export type AppendableArrowGPUTableProps = AppendableArrowGPURecordBatchProps;

/** Props for constructing one appendable Arrow-backed GPU vector. */
export type AppendableArrowGPUVectorProps = {
  /** Stable vector name. */
  name?: string;
  /** Initial row capacity for appendable storage. */
  initialCapacityRows?: number;
  /** Appendable vector capacity growth multiplier. */
  capacityGrowthFactor?: number;
  /** Dynamic buffer props forwarded to the appendable vector. */
  bufferProps?: GPUVectorDynamicBufferProps;
};

/** Uploads one Arrow `Data` chunk into generic GPU storage. */
export function makeArrowGPUData<T extends arrow.DataType>(
  device: Device,
  data: arrow.Data<T>,
  props: GPUVectorBufferProps = {}
): GPUData<T> {
  const arrowType = data.type as T;
  const readbackMetadata = getArrowGPUDataReadbackMetadata(data) as GPUDataReadbackMetadata;

  if (isArrowUtf8DictionaryType(arrowType)) {
    const byteStride = getArrowTypeByteStride(arrowType.indices);
    return new GPUData({
      buffer: new DynamicBuffer(device, {
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        ...props,
        data: getArrowDictionaryIndexBufferSource(
          data as unknown as arrow.Data<ArrowUtf8Dictionary>
        )
      }),
      dataType: arrowType,
      length: data.length,
      stride: 1,
      byteStride,
      rowByteLength: byteStride,
      ownsBuffer: true
    }) as GPUData<T>;
  }

  if (arrow.DataType.isUtf8(arrowType)) {
    return new GPUData({
      buffer: new DynamicBuffer(device, {
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        ...props,
        data: getArrowUtf8DataBufferSource(data as arrow.Data<arrow.Utf8>)
      }),
      dataType: arrowType,
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
      'makeArrowGPUData',
      data as unknown as arrow.Data<VariableLengthAttributeArrowType>
    );
    const byteStride = getArrowTypeByteStride(arrowType);
    return new GPUData({
      buffer: new DynamicBuffer(device, {
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        ...props,
        data: getArrowVariableLengthAttributeDataBufferSource(
          data as unknown as arrow.Data<VariableLengthAttributeArrowType>
        )
      }),
      dataType: arrowType,
      length: data.length,
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
      ...props,
      data: getArrowDataBufferSource(data as unknown as arrow.Data<AttributeArrowType>)
    }),
    dataType: arrowType,
    length: data.length,
    stride: getArrowTypeStride(arrowType),
    byteStride,
    rowByteLength: byteStride,
    ownsBuffer: true,
    readbackMetadata
  });
}

/** Uploads one Arrow vector into a generic GPU vector. */
export function makeArrowGPUVector<T extends arrow.DataType>(
  device: Device,
  vector: arrow.Vector<T>,
  props: GPUVectorBufferProps & {name?: string} = {}
): GPUVector<T> {
  const {name = 'vector', ...bufferProps} = props;
  const arrowType = vector.type as T;

  if (
    arrow.DataType.isUtf8(arrowType) ||
    isArrowUtf8DictionaryType(arrowType) ||
    isVariableLengthAttributeArrowType(arrowType)
  ) {
    const byteStride = arrow.DataType.isUtf8(arrowType)
      ? 1
      : isArrowUtf8DictionaryType(arrowType)
        ? getArrowTypeByteStride(arrowType.indices)
        : getArrowTypeByteStride(arrowType);
    const stride =
      arrow.DataType.isUtf8(arrowType) || isArrowUtf8DictionaryType(arrowType)
        ? 1
        : getArrowTypeStride(arrowType);
    return new GPUVector({
      type: 'data',
      name,
      dataType: arrowType,
      data: vector.data.map(data => makeArrowGPUData(device, data as arrow.Data<T>, bufferProps)),
      stride,
      byteStride,
      rowByteLength: byteStride,
      ownsData: true
    });
  }

  const matrixInfo = getArrowMatrixVectorInfo(vector);
  const isCanonicalFloat32Matrix =
    matrixInfo?.valueType === 'float32' &&
    matrixInfo.order === 'column-major' &&
    matrixInfo.layout === 'wgsl-storage';
  if (matrixInfo && !isCanonicalFloat32Matrix) {
    throw new Error(
      'GPUVector matrix columns require canonical Float32 column-major wgsl-storage values; use prepareArrowMatrixGPUVector() first'
    );
  }

  if (!isInstanceArrowType(arrowType) && !isCanonicalFloat32Matrix) {
    throw new Error(`GPUVector does not support Arrow type ${arrowType}`);
  }

  const byteStride = getArrowTypeByteStride(arrowType);
  const buffer = device.createBuffer({
    usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    ...bufferProps,
    data: getArrowVectorBufferSource(vector as unknown as arrow.Vector<AttributeArrowType>)
  });
  const dynamicBuffer = createDynamicBufferView(buffer);
  let byteOffset = 0;
  const data = vector.data.map(chunk => {
    const gpuData = new GPUData({
      buffer: dynamicBuffer,
      dataType: chunk.type as T,
      length: chunk.length,
      stride: getArrowTypeStride(chunk.type),
      byteOffset,
      byteStride,
      rowByteLength: byteStride,
      ownsBuffer: false
    }) as GPUData<T>;
    byteOffset += chunk.length * byteStride;
    return gpuData;
  });
  return new GPUVector({
    type: 'data',
    name,
    dataType: arrowType,
    data,
    buffer,
    stride: getArrowTypeStride(arrowType),
    byteStride,
    rowByteLength: byteStride,
    ownsBuffer: true
  });
}

/** Creates one empty appendable Arrow-backed GPU vector. */
export function makeAppendableArrowGPUVector<T extends arrow.DataType>(
  device: Device,
  dataType: T,
  props: AppendableArrowGPUVectorProps = {}
): GPUVector<T> {
  const isUtf8Type = arrow.DataType.isUtf8(dataType);
  const isUtf8DictionaryType = isArrowUtf8DictionaryType(dataType);
  const byteStride = isUtf8Type
    ? 1
    : isUtf8DictionaryType
      ? getArrowTypeByteStride(dataType.indices)
      : getArrowTypeByteStride(dataType);
  return new GPUVector({
    type: 'appendable',
    name: props.name ?? 'vector',
    device,
    dataType,
    stride: isUtf8Type || isUtf8DictionaryType ? 1 : getArrowTypeStride(dataType),
    byteStride,
    rowByteLength: byteStride,
    initialCapacityRows: props.initialCapacityRows,
    capacityGrowthFactor: props.capacityGrowthFactor,
    bufferProps: props.bufferProps
  });
}

/** Uploads one Arrow record batch into a generic GPU record batch. */
export function makeArrowGPURecordBatch(
  device: Device,
  recordBatch: arrow.RecordBatch,
  options: ArrowGPURecordBatchProps
): GPURecordBatch {
  const table = new arrow.Table([recordBatch]);
  const bufferLayout = getArrowBufferLayout(options.shaderLayout, {
    arrowTable: table,
    arrowPaths: options.arrowPaths,
    allowWebGLOnlyFormats: options.allowWebGLOnlyFormats
  });
  const fields: arrow.Field[] = [];
  const vectors: Record<string, GPUVector> = {};
  const bindings: Record<string, Buffer | DynamicBuffer> = {};
  const selectedNames = new Set<string>();

  for (const layout of bufferLayout) {
    const arrowPath = options.arrowPaths?.[layout.name] || layout.name;
    const vector = getArrowVectorByPath(table, arrowPath);
    const sourceField = getArrowFieldByPath(table, arrowPath);
    const gpuVector = makeArrowGPUVector(device, vector as arrow.Vector, {
      ...options.bufferProps,
      name: layout.name
    });
    fields.push(
      new arrow.Field(layout.name, vector.type, sourceField.nullable, new Map(sourceField.metadata))
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
    const gpuVector = makeArrowGPUVector(device, vector as arrow.Vector, {
      ...options.bufferProps,
      name: storageBinding.name
    });
    fields.push(
      new arrow.Field(
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
    nullCount: recordBatch.nullCount,
    bindings
  });
}

/** Uploads one Arrow table into a generic GPU table while preserving record-batch boundaries. */
export function makeArrowGPUTable(
  device: Device,
  table: arrow.Table,
  options: ArrowGPUTableProps
): GPUTable {
  const batches = table.batches.map(recordBatch =>
    makeArrowGPURecordBatch(device, recordBatch, options)
  );
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
    new arrow.Schema(
      bufferLayout.map(layout => {
        const arrowPath = options.arrowPaths?.[layout.name] || layout.name;
        const vector = getArrowVectorByPath(table, arrowPath);
        const sourceField = getArrowFieldByPath(table, arrowPath);
        return new arrow.Field(
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

/** Creates one empty appendable GPU record batch from an Arrow schema. */
export function makeAppendableArrowGPURecordBatch(
  options: AppendableArrowGPURecordBatchProps
): GPURecordBatch {
  const appendableColumns = getAppendableGPUColumns(options);
  const fields: arrow.Field[] = [];
  const vectors: Record<string, GPUVector> = {};
  const bufferLayout: BufferLayout[] = [];
  const bindings: Record<string, Buffer | DynamicBuffer> = {};

  for (const column of appendableColumns) {
    const {attributeName, field, bufferLayout: columnLayout} = column;
    const isUtf8Type = arrow.DataType.isUtf8(field.type);
    const isUtf8DictionaryType = isArrowUtf8DictionaryType(field.type);
    const byteStride = isUtf8Type
      ? 1
      : isUtf8DictionaryType
        ? getArrowTypeByteStride(field.type.indices)
        : getArrowTypeByteStride(field.type);
    const gpuVector = new GPUVector({
      type: 'appendable',
      name: attributeName,
      device: options.device,
      dataType: field.type,
      stride: isUtf8Type || isUtf8DictionaryType ? 1 : getArrowTypeStride(field.type),
      byteStride,
      rowByteLength: byteStride,
      initialCapacityRows: options.initialCapacityRows,
      capacityGrowthFactor: options.capacityGrowthFactor,
      bufferProps: options.bufferProps
    });

    fields.push(
      new arrow.Field(attributeName, field.type, field.nullable, new Map(field.metadata))
    );
    vectors[attributeName] = gpuVector;
    if (columnLayout) {
      bufferLayout.push(columnLayout);
    } else {
      bindings[attributeName] = gpuVector.buffer;
    }
  }

  const batch = new GPURecordBatch({
    vectors,
    bufferLayout,
    fields,
    numRows: 0,
    metadata: new Map(options.schema.metadata),
    bindings
  });
  appendableColumnsByBatch.set(batch, appendableColumns);
  return batch;
}

/** Creates one empty appendable GPU table from an Arrow schema. */
export function makeAppendableArrowGPUTable(options: AppendableArrowGPUTableProps): GPUTable {
  const batch = makeAppendableArrowGPURecordBatch(options);
  return new GPUTable({
    batches: [batch],
    schema: new arrow.Schema(batch.schema.fields, new Map(options.schema.metadata)),
    bufferLayout: batch.bufferLayout,
    numRows: 0,
    nullCount: 0
  });
}

/** Appends one Arrow `Data` chunk into appendable GPU vector storage. */
export function appendArrowDataToGPUVector<T extends arrow.DataType>(
  vector: GPUVector<T>,
  data: arrow.Data<T>
): GPUVector<T> {
  if (!(vector.buffer instanceof DynamicBuffer)) {
    throw new Error('appendArrowDataToGPUVector() requires appendable DynamicBuffer storage');
  }
  if (!arrow.util.compareTypes(data.type, vector.type)) {
    throw new Error('appendArrowDataToGPUVector() requires matching Arrow data types');
  }
  const isUtf8DictionaryData = isArrowUtf8DictionaryType(data.type);
  if (!isUtf8DictionaryData) {
    validateArrowGPUDataDirectUpload(
      vector.name,
      data as unknown as arrow.Data<
        AttributeArrowType | VariableLengthAttributeArrowType | arrow.Utf8
      >
    );
  }

  const isUtf8Data = arrow.DataType.isUtf8(data.type);
  const isVariableLengthData = isVariableLengthAttributeArrowType(data.type);
  const uploadData = isUtf8Data
    ? getArrowUtf8DataBufferSource(data as arrow.Data<arrow.Utf8>)
    : isUtf8DictionaryData
      ? getArrowDictionaryIndexBufferSource(data as unknown as arrow.Data<ArrowUtf8Dictionary>)
      : isVariableLengthData
        ? getArrowVariableLengthAttributeDataBufferSource(
            data as unknown as arrow.Data<VariableLengthAttributeArrowType>
          )
        : getArrowDataBufferSource(data as unknown as arrow.Data<AttributeArrowType>);
  const byteOffset = isUtf8Data
    ? alignAppendableByteLength(vector.appendedByteLength)
    : vector.appendedByteLength;
  const writeData = isUtf8Data ? padAppendableUtf8UploadData(uploadData as Uint8Array) : uploadData;
  const requiredByteLength = byteOffset + writeData.byteLength;
  vector.writeAppendableBytes(writeData, byteOffset, requiredByteLength);
  vector.appendDataChunk(
    new GPUData({
      buffer: vector.buffer,
      dataType: data.type as T,
      length: data.length,
      stride: vector.stride,
      byteOffset,
      byteStride: vector.byteStride,
      rowByteLength: vector.rowByteLength,
      ownsBuffer: false,
      readbackMetadata: getArrowGPUDataReadbackMetadata(data)
    }) as GPUData<T>,
    requiredByteLength
  );
  return vector;
}

/** Appends every Arrow chunk in a vector into appendable GPU vector storage. */
export function appendArrowVectorToGPUVector<T extends arrow.DataType>(
  gpuVector: GPUVector<T>,
  vector: arrow.Vector<T>
): GPUVector<T> {
  if (!arrow.util.compareTypes(vector.type, gpuVector.type)) {
    throw new Error('appendArrowVectorToGPUVector() requires matching Arrow data types');
  }
  for (const data of vector.data) {
    appendArrowDataToGPUVector(gpuVector, data as arrow.Data<T>);
  }
  return gpuVector;
}

/** Appends one Arrow record batch into an appendable generic GPU record batch. */
export function appendArrowRecordBatchToGPURecordBatch(
  batch: GPURecordBatch,
  recordBatch: arrow.RecordBatch
): GPURecordBatch {
  const appendableColumns = appendableColumnsByBatch.get(batch);
  if (!appendableColumns) {
    throw new Error(
      'appendArrowRecordBatchToGPURecordBatch() requires an appendable Arrow GPU record batch'
    );
  }
  const pendingData = getAppendableGPUColumnData(
    recordBatch,
    appendableColumns,
    'appendArrowRecordBatchToGPURecordBatch()'
  );
  for (const {column, data} of pendingData) {
    appendArrowDataToGPUVector(batch.gpuVectors[column.attributeName], data as arrow.Data);
  }
  return batch.appendRows(recordBatch.numRows, recordBatch.nullCount);
}

/** Appends one Arrow record batch or table into the trailing appendable table batch. */
export function appendArrowBatchToGPUTable(
  table: GPUTable,
  recordBatchOrTable: arrow.RecordBatch | arrow.Table
): GPUTable {
  if (recordBatchOrTable instanceof arrow.Table) {
    for (const recordBatch of recordBatchOrTable.batches) {
      appendArrowBatchToGPUTable(table, recordBatch);
    }
    return table;
  }
  const lastBatch = table.batches[table.batches.length - 1];
  if (!lastBatch) {
    throw new Error('appendArrowBatchToGPUTable() requires an existing trailing batch');
  }
  appendArrowRecordBatchToGPURecordBatch(lastBatch, recordBatchOrTable);
  return table.refreshFromBatches();
}

/** Reads one generic GPU data range back into Arrow `Data`. */
export async function readArrowGPUDataAsync<T extends arrow.DataType>(
  data: GPUData<T>
): Promise<arrow.Data<T>> {
  const legacyData = new LegacyArrowGPUData({
    buffer: data.buffer,
    arrowType: data.type,
    length: data.length,
    byteOffset: data.byteOffset,
    byteStride: data.byteStride,
    ownsBuffer: false,
    readbackMetadata: data.readbackMetadata as GPUDataReadbackMetadata
  });
  return legacyData.readAsync() as Promise<arrow.Data<T>>;
}

/** Reads one generic GPU vector back into an Arrow vector. */
export async function readArrowGPUVectorAsync<T extends arrow.DataType>(
  vector: GPUVector<T>
): Promise<arrow.Vector<T>> {
  if (vector.bufferLayout) {
    throw new Error('readArrowGPUVectorAsync() does not support interleaved vectors');
  }
  if (
    arrow.DataType.isUtf8(vector.type) ||
    isVariableLengthAttributeArrowType(vector.type) ||
    vector.data.length > 1
  ) {
    const data = await Promise.all(vector.data.map(chunk => readArrowGPUDataAsync(chunk)));
    return new arrow.Vector(data) as arrow.Vector<T>;
  }
  return readPackedArrowGPUVectorAsync({
    type: vector.type as unknown as AttributeArrowType,
    buffer: vector.buffer,
    length: vector.length,
    byteOffset: vector.byteOffset,
    byteStride: vector.byteStride
  }) as unknown as Promise<arrow.Vector<T>>;
}

function createDynamicBufferView(buffer: Buffer | DynamicBuffer): DynamicBuffer {
  return buffer instanceof DynamicBuffer
    ? buffer
    : new DynamicBuffer(buffer.device, {
        buffer,
        ownsBuffer: false
      });
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

function tryGetArrowVectorByPath(table: arrow.Table, path: string): arrow.Vector | null {
  try {
    return getArrowVectorByPath(table, path);
  } catch {
    return null;
  }
}

function tryGetArrowFieldByPath(table: arrow.Table, path: string): arrow.Field | null {
  try {
    return getArrowFieldByPath(table, path);
  } catch {
    return null;
  }
}

function alignAppendableByteLength(byteLength: number): number {
  return Math.ceil(byteLength / 4) * 4;
}

function padAppendableUtf8UploadData(uploadData: Uint8Array): Uint8Array {
  const paddedByteLength = alignAppendableByteLength(uploadData.byteLength);
  if (paddedByteLength === uploadData.byteLength) {
    return uploadData;
  }
  const paddedUploadData = new Uint8Array(paddedByteLength);
  paddedUploadData.set(uploadData);
  return paddedUploadData;
}

function isArrowUtf8DictionaryType(type: arrow.DataType): type is ArrowUtf8Dictionary {
  return (
    arrow.DataType.isDictionary(type) &&
    type.dictionary instanceof arrow.Utf8 &&
    arrow.DataType.isInt(type.indices) &&
    type.indices.bitWidth <= 32
  );
}

function getArrowDictionaryIndexBufferSource(
  data: arrow.Data<ArrowUtf8Dictionary>
): ArrayBufferView {
  const values = data.values as ArrayBufferView & {
    subarray: (start?: number, end?: number) => ArrayBufferView;
    length: number;
  };
  const startIndex = values.length === data.length ? 0 : (data.offset ?? 0);
  return values.subarray(startIndex, startIndex + data.length);
}
