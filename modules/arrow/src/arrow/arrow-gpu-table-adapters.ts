// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  Device,
  type BufferLayout,
  type ShaderLayout,
  type VertexFormat
} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {
  GPUData,
  GPURecordBatch,
  GPUTable,
  GPUVector,
  type GPUVectorBufferProps,
  type GPUVectorDynamicBufferProps,
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
  Vector,
  util
} from 'apache-arrow';
import {getArrowFieldByPath, getArrowVectorByPath} from './arrow-paths';
import {getArrowBufferLayout, type ArrowVertexFormatOptions} from './arrow-shader-layout';
import {
  getAppendableGPUColumnData,
  getAppendableGPUColumns,
  type AppendableGPUColumn
} from './arrow-gpu-appendable';
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

type AppendableArrowGPURecordBatch = GPURecordBatch & {
  __arrowAppendableColumns?: AppendableGPUColumn[];
};

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
  schema: Schema;
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
export function makeArrowGPUData<T extends DataType>(
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
      'makeArrowGPUData',
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
  const {name = 'vector', format, preserveDataChunks = false, ...bufferProps} = props;
  const arrowType = vector.type as T;
  const vectorFormat = format ?? getGPUVectorFormatForArrowType(arrowType);

  if (
    DataType.isUtf8(arrowType) ||
    isArrowUtf8DictionaryType(arrowType) ||
    isVariableLengthAttributeArrowType(arrowType)
  ) {
    const byteStride = DataType.isUtf8(arrowType)
      ? 1
      : isArrowUtf8DictionaryType(arrowType)
        ? getArrowTypeByteStride(arrowType.indices)
        : getArrowTypeByteStride(arrowType);
    const stride =
      DataType.isUtf8(arrowType) || isArrowUtf8DictionaryType(arrowType)
        ? 1
        : getArrowTypeStride(arrowType);
    return new GPUVector({
      type: 'data',
      name,
      dataType: arrowType,
      format: vectorFormat,
      data: vector.data.map(data =>
        makeArrowGPUData(device, data as Data<T>, {...bufferProps, format: vectorFormat})
      ),
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
  if (preserveDataChunks && !matrixInfo) {
    return new GPUVector({
      type: 'data',
      name,
      dataType: arrowType,
      format: vectorFormat,
      data: vector.data.map(data =>
        makeArrowGPUData(device, data as Data<T>, {...bufferProps, format: vectorFormat})
      ),
      stride: getArrowTypeStride(arrowType),
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
        stride: getArrowTypeStride(arrowType),
        byteStride,
        rowByteLength: byteStride,
        ownsBuffer: true
      }) as GPUData
    ],
    stride: getArrowTypeStride(arrowType),
    byteStride,
    rowByteLength: byteStride,
    ownsData: true
  });
}

/** Creates one empty appendable Arrow-backed GPU vector. */
export function makeAppendableArrowGPUVector<T extends DataType>(
  device: Device,
  dataType: T,
  props: AppendableArrowGPUVectorProps = {}
): GPUVector {
  const isUtf8Type = DataType.isUtf8(dataType);
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
    format: getGPUVectorFormatForArrowType(dataType),
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
  recordBatch: RecordBatch,
  options: ArrowGPURecordBatchProps
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
    nullCount: recordBatch.nullCount,
    bindings
  });
}

/** Uploads one Arrow table into a generic GPU table while preserving record-batch boundaries. */
export function makeArrowGPUTable(
  device: Device,
  table: Table,
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

/** Creates one empty appendable GPU record batch from an Arrow schema. */
export function makeAppendableArrowGPURecordBatch(
  options: AppendableArrowGPURecordBatchProps
): GPURecordBatch {
  const appendableColumns = getAppendableGPUColumns(options);
  const fields: Field[] = [];
  const vectors: Record<string, GPUVector> = {};
  const bufferLayout: BufferLayout[] = [];
  const bindings: Record<string, Buffer | DynamicBuffer> = {};

  for (const column of appendableColumns) {
    const {attributeName, field, bufferLayout: columnLayout} = column;
    const isUtf8Type = DataType.isUtf8(field.type);
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
      format: columnLayout?.format ?? getGPUVectorFormatForArrowType(field.type),
      stride: isUtf8Type || isUtf8DictionaryType ? 1 : getArrowTypeStride(field.type),
      byteStride,
      rowByteLength: byteStride,
      initialCapacityRows: options.initialCapacityRows,
      capacityGrowthFactor: options.capacityGrowthFactor,
      bufferProps: options.bufferProps
    });

    fields.push(new Field(attributeName, field.type, field.nullable, new Map(field.metadata)));
    vectors[attributeName] = gpuVector;
    if (columnLayout) {
      bufferLayout.push(columnLayout);
    } else if (gpuVector.data.length > 0) {
      bindings[attributeName] = getSingleGPUVectorDataBuffer(gpuVector, attributeName);
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
  (batch as AppendableArrowGPURecordBatch).__arrowAppendableColumns = appendableColumns;
  return batch;
}

/** Creates one empty appendable GPU table from an Arrow schema. */
export function makeAppendableArrowGPUTable(options: AppendableArrowGPUTableProps): GPUTable {
  const batch = makeAppendableArrowGPURecordBatch(options);
  return new GPUTable({
    batches: [batch],
    schema: new Schema(batch.schema.fields as Field[], new Map(options.schema.metadata)),
    bufferLayout: batch.bufferLayout,
    numRows: 0,
    nullCount: 0
  });
}

/** Appends one Arrow `Data` chunk into appendable GPU vector storage. */
export function appendArrowDataToGPUVector<T extends DataType>(
  vector: GPUVector,
  data: Data<T>
): GPUVector {
  if (!vector.device) {
    throw new Error('appendArrowDataToGPUVector() requires appendable GPUVector device metadata');
  }
  if (!util.compareTypes(data.type, vector.type)) {
    throw new Error('appendArrowDataToGPUVector() requires matching Arrow data types');
  }
  if (!vector.format) {
    throw new Error('appendArrowDataToGPUVector() requires GPUVector format metadata');
  }
  vector.appendDataChunk(
    makeArrowGPUData(vector.device, data, {
      ...(vector.bufferProps ?? {}),
      format: vector.format
    }) as GPUData
  );
  return vector;
}

/** Appends every Arrow chunk in a vector into appendable GPU vector storage. */
export function appendArrowVectorToGPUVector<T extends DataType>(
  gpuVector: GPUVector,
  vector: Vector<T>
): GPUVector {
  if (!util.compareTypes(vector.type, gpuVector.type)) {
    throw new Error('appendArrowVectorToGPUVector() requires matching Arrow data types');
  }
  for (const data of vector.data) {
    appendArrowDataToGPUVector(gpuVector, data as Data<T>);
  }
  return gpuVector;
}

/** Appends one Arrow record batch into an appendable generic GPU record batch. */
export function appendArrowRecordBatchToGPURecordBatch(
  batch: GPURecordBatch,
  recordBatch: RecordBatch
): GPURecordBatch {
  const appendableColumns = (batch as AppendableArrowGPURecordBatch).__arrowAppendableColumns;
  if (!appendableColumns) {
    throw new Error(
      'appendArrowRecordBatchToGPURecordBatch() requires an appendable Arrow GPU record batch'
    );
  }
  if (batch.numRows > 0) {
    throw new Error(
      'appendArrowRecordBatchToGPURecordBatch() does not combine record batches; append a new GPURecordBatch instead'
    );
  }
  const pendingData = getAppendableGPUColumnData(
    recordBatch,
    appendableColumns,
    'appendArrowRecordBatchToGPURecordBatch()'
  );
  for (const {column, data} of pendingData) {
    appendArrowDataToGPUVector(batch.gpuVectors[column.attributeName], data as Data);
  }
  refreshAppendableGPURecordBatchBindings(batch, appendableColumns);
  return batch.appendRows(recordBatch.numRows, recordBatch.nullCount);
}

/** Appends one Arrow record batch or table into the trailing appendable table batch. */
export function appendArrowBatchToGPUTable(
  table: GPUTable,
  recordBatchOrTable: RecordBatch | Table
): GPUTable {
  if (recordBatchOrTable instanceof Table) {
    for (const recordBatch of recordBatchOrTable.batches) {
      appendArrowBatchToGPUTable(table, recordBatch);
    }
    return table;
  }
  const lastBatch = table.batches[table.batches.length - 1];
  if (!lastBatch) {
    throw new Error('appendArrowBatchToGPUTable() requires an existing trailing batch');
  }
  if (lastBatch.numRows === 0) {
    appendArrowRecordBatchToGPURecordBatch(lastBatch, recordBatchOrTable);
    return table.refreshFromBatches();
  }
  const nextBatch = createAppendableGPURecordBatchFromTemplate(lastBatch);
  appendArrowRecordBatchToGPURecordBatch(nextBatch, recordBatchOrTable);
  return table.addBatch(nextBatch);
}

function createAppendableGPURecordBatchFromTemplate(templateBatch: GPURecordBatch): GPURecordBatch {
  const appendableColumns = (templateBatch as AppendableArrowGPURecordBatch)
    .__arrowAppendableColumns;
  if (!appendableColumns) {
    throw new Error('appendArrowBatchToGPUTable() requires an appendable trailing batch');
  }
  const device = getAppendableGPURecordBatchDevice(templateBatch);
  const vectors: Record<string, GPUVector> = {};
  const bufferLayout: BufferLayout[] = [];

  for (const column of appendableColumns) {
    const templateVector = templateBatch.gpuVectors[column.attributeName];
    if (!templateVector?.format) {
      throw new Error(
        `appendArrowBatchToGPUTable() cannot append column "${column.attributeName}" without GPUVector format metadata`
      );
    }
    vectors[column.attributeName] = new GPUVector({
      type: 'appendable',
      name: column.attributeName,
      device,
      dataType: templateVector.dataType,
      format: templateVector.format,
      stride: templateVector.stride,
      byteStride: templateVector.byteStride,
      rowByteLength: templateVector.rowByteLength,
      bufferProps: templateVector.bufferProps
    });
    if (column.bufferLayout) {
      bufferLayout.push(column.bufferLayout);
    }
  }

  const batch = new GPURecordBatch({
    vectors,
    bufferLayout,
    fields: templateBatch.schema.fields,
    metadata: new Map(templateBatch.schema.metadata),
    numRows: 0
  });
  (batch as AppendableArrowGPURecordBatch).__arrowAppendableColumns = appendableColumns;
  return batch;
}

function getAppendableGPURecordBatchDevice(batch: GPURecordBatch): Device {
  const vector = Object.values(batch.gpuVectors)[0];
  const device = vector?.device ?? vector?.data[0]?.buffer.device;
  if (!device) {
    throw new Error('appendArrowBatchToGPUTable() requires appendable GPUVector device metadata');
  }
  return device;
}

function refreshAppendableGPURecordBatchBindings(
  batch: GPURecordBatch,
  appendableColumns: AppendableGPUColumn[]
): void {
  for (const column of appendableColumns) {
    const vector = batch.gpuVectors[column.attributeName];
    if (!vector || vector.data.length !== 1) {
      continue;
    }
    if (column.bufferLayout) {
      batch.attributes[column.attributeName] = getSingleGPUVectorDataBuffer(
        vector,
        column.attributeName
      );
    } else {
      batch.bindings[column.attributeName] = getSingleGPUVectorDataBuffer(
        vector,
        column.attributeName
      );
    }
  }
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
  if (DataType.isUtf8(type)) {
    return 'uint8';
  }
  if (isArrowUtf8DictionaryType(type)) {
    return getGPUVectorFormatFromArrowDataType(type.indices);
  }
  return getGPUVectorFormatFromArrowDataType(type);
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
