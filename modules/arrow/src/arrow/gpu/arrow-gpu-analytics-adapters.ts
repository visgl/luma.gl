// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUData,
  GPURecordBatch,
  GPUTable,
  GPUVector,
  isGPUTableIndexColumnName,
  type GPUField,
  type GPUTypeMap,
  type GPUVectorBufferProps
} from '@luma.gl/tables';
import {
  DataType,
  Dictionary,
  Precision,
  type Data,
  type Field,
  type Float32,
  type Int32,
  type Table,
  type TypeMap,
  type Uint32,
  type Utf8
} from 'apache-arrow';
import {makeGPUDataFromArrowData} from './arrow-gpu-table-adapters';

/** Supported WebGPU-native scalar and categorical index storage formats. */
type GPUAnalyticsVectorFormat = 'float32' | 'sint32' | 'uint32';

/** Maps a typed Arrow schema to its exact portable GPU analytics column formats. */
export type GPUAnalyticsTypeMapForArrow<T extends TypeMap> = {
  [Name in keyof T & string]: T[Name] extends Float32
    ? 'float32'
    : T[Name] extends Int32
      ? 'sint32'
      : T[Name] extends Uint32
        ? 'uint32'
        : T[Name] extends Dictionary<Utf8, infer IndexType>
          ? IndexType extends Int32
            ? 'sint32'
            : IndexType extends Uint32
              ? 'uint32'
              : never
          : never;
};

/** CPU-owned category labels associated with one GPU-resident dictionary-index column. */
export type GPUAnalyticsDictionary = {
  /** Dictionary labels in the exact order referenced by uploaded integer indices. */
  readonly values: readonly string[];
  /** Whether the Arrow source declares these category labels ordered. */
  readonly ordered: boolean;
};

/** Renderer-independent Arrow analytics upload options. */
export type GPUAnalyticsTableFromArrowTableProps<T extends GPUTypeMap = GPUTypeMap> = {
  /** Source columns to upload, in the desired order. Defaults to all source fields. */
  columns?: readonly (keyof T & string)[];
  /** Additional buffer properties; required storage and copy usage are always retained. */
  bufferProps?: GPUVectorBufferProps;
};

/** GPU table plus explicit analytical metadata retained outside generic GPU table storage. */
export type GPUAnalyticsTableFromArrowTableResult<T extends GPUTypeMap = GPUTypeMap> = {
  /** Existing generic GPU table primitives, preserving every source record batch. */
  table: GPUTable<T>;
  /** One source-row-aligned uint32 GPU validity vector for every nullable selected field. */
  validity: Partial<Record<keyof T & string, GPUVector<'uint32'>>>;
  /** Explicit adapter-owned labels for selected UTF-8 dictionary columns. */
  dictionaries: Partial<Record<keyof T & string, GPUAnalyticsDictionary>>;
  /** Per-field Arrow null counts in source record-batch order. */
  nullCounts: Partial<Record<keyof T & string, readonly number[]>>;
};

/** Fully validated source metadata collected before allocating any GPU resources. */
type PreparedGPUAnalyticsColumn = {
  field: Field;
  format: GPUAnalyticsVectorFormat;
  chunks: Data[];
  validity: Uint32Array[];
  nullCounts: number[];
  dictionary?: GPUAnalyticsDictionary;
};

const GPU_ANALYTICS_BUFFER_USAGE =
  Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC;

/**
 * Uploads Arrow columns for GPU analytics without requiring renderer-specific shader metadata.
 *
 * Numeric values and dictionary indices stay in existing `GPUData`, `GPURecordBatch`, `GPUVector`,
 * and `GPUTable` objects. Nullable rows receive separate batch-aligned uint32 validity vectors,
 * while dictionary labels and source null counts remain explicit adapter-owned metadata.
 */
export function makeGPUAnalyticsTableFromArrowTable<T extends TypeMap>(
  device: Device,
  table: Table<T>,
  options?: GPUAnalyticsTableFromArrowTableProps<GPUAnalyticsTypeMapForArrow<T>>
): GPUAnalyticsTableFromArrowTableResult<GPUAnalyticsTypeMapForArrow<T>>;
export function makeGPUAnalyticsTableFromArrowTable<T extends GPUTypeMap = GPUTypeMap>(
  device: Device,
  table: Table,
  options: GPUAnalyticsTableFromArrowTableProps<T> = {}
): GPUAnalyticsTableFromArrowTableResult<T> {
  validateGPUAnalyticsBufferProps(options.bufferProps);
  const columns = prepareGPUAnalyticsColumns(table, options.columns);
  const requiredBufferProps = {
    ...options.bufferProps,
    usage: (options.bufferProps?.usage ?? 0) | GPU_ANALYTICS_BUFFER_USAGE
  };
  const allocatedData: GPUData[] = [];
  const allocatedValidityData: GPUData<'uint32'>[] = [];
  const validity: GPUAnalyticsTableFromArrowTableResult<T>['validity'] = {};
  const dictionaries: GPUAnalyticsTableFromArrowTableResult<T>['dictionaries'] = {};
  const nullCounts: GPUAnalyticsTableFromArrowTableResult<T>['nullCounts'] = {};
  let gpuTable: GPUTable<T> | undefined;

  try {
    for (const column of columns) {
      const columnName = column.field.name as keyof T & string;
      nullCounts[columnName] = Object.freeze([...column.nullCounts]);
      if (column.dictionary) {
        dictionaries[columnName] = column.dictionary;
      }
    }

    let sourceRowIndexOffset = 0;
    const batches = table.batches.map((recordBatch, sourceBatchIndex) => {
      const gpuData: Record<string, GPUData> = {};

      for (const column of columns) {
        const sourceData = column.chunks[sourceBatchIndex];
        const data = makeGPUAnalyticsData(device, sourceData, column.format, requiredBufferProps);
        allocatedData.push(data);
        gpuData[column.field.name] = data;
      }

      const batch = new GPURecordBatch<T>({
        gpuData,
        fields: columns.map(column => makeGPUAnalyticsField(column)),
        numRows: recordBatch.numRows,
        metadata: new Map(recordBatch.schema.metadata),
        sourceInfo: {
          sourceBatchIndex,
          sourceRowIndexOffset,
          sourceRowCount: recordBatch.numRows
        },
        nullCount: recordBatch.nullCount
      });
      sourceRowIndexOffset += recordBatch.numRows;
      return batch;
    });

    gpuTable =
      batches.length > 0
        ? new GPUTable<T>({batches})
        : new GPUTable<T>({
            schema: {
              fields: columns.map(column => makeGPUAnalyticsField(column)) as GPUField<
                keyof T & string
              >[],
              metadata: new Map(table.schema.metadata)
            },
            bufferLayout: columns.map(column => ({
              name: column.field.name,
              format: column.format,
              byteStride: 4
            }))
          });

    if (batches.length > 0) {
      gpuTable.schema = {
        fields: columns.map(column => makeGPUAnalyticsField(column)) as GPUField<
          keyof T & string
        >[],
        metadata: new Map(table.schema.metadata)
      };
    }

    for (const column of columns) {
      if (!column.field.nullable || batches.length === 0) {
        continue;
      }

      const chunks = column.validity.map(values => {
        const data = makeGPUAnalyticsValidityData(device, values, requiredBufferProps);
        allocatedValidityData.push(data);
        return data;
      });
      validity[column.field.name as keyof T & string] = new GPUVector<'uint32'>({
        type: 'data',
        name: `${column.field.name}-validity`,
        format: 'uint32',
        data: chunks,
        ownsData: true
      });
    }

    return {table: gpuTable, validity, dictionaries, nullCounts};
  } catch (error) {
    gpuTable?.destroy();
    for (const data of allocatedData) {
      data.destroy();
    }
    for (const data of allocatedValidityData) {
      data.destroy();
    }
    throw error;
  }
}

/** Rejects caller props that would alias owned buffers or invalidate their logical layout. */
function validateGPUAnalyticsBufferProps(bufferProps: GPUVectorBufferProps | undefined): void {
  if (bufferProps?.handle !== undefined && bufferProps.handle !== null) {
    throw new Error('GPU analytics buffers cannot adopt an external buffer handle');
  }
  if (bufferProps?._isHandleBorrowed) {
    throw new Error('GPU analytics buffers cannot borrow an external buffer handle');
  }
  if (bufferProps?.byteOffset) {
    throw new Error('GPU analytics buffers cannot use a nonzero byte offset');
  }
  if (((bufferProps?.usage ?? 0) & (Buffer.MAP_READ | Buffer.MAP_WRITE)) !== 0) {
    throw new Error('GPU analytics storage buffers cannot declare mapped usage');
  }
}

/** Validates every selected field, batch, bitmap, and dictionary before allocating GPU resources. */
function prepareGPUAnalyticsColumns(
  table: Table,
  selectedNames: readonly string[] | undefined
): PreparedGPUAnalyticsColumn[] {
  const sourceFields = new Map<string, Field>();
  for (const field of table.schema.fields) {
    if (sourceFields.has(field.name)) {
      throw new Error(`GPU analytics source contains duplicate column "${field.name}"`);
    }
    sourceFields.set(field.name, field);
  }

  const columnNames = selectedNames ?? table.schema.fields.map(field => field.name);
  const encounteredNames = new Set<string>();
  return columnNames.map(columnName => {
    if (encounteredNames.has(columnName)) {
      throw new Error(`GPU analytics column "${columnName}" cannot be selected more than once`);
    }
    encounteredNames.add(columnName);

    const field = sourceFields.get(columnName);
    if (!field) {
      throw new Error(`GPU analytics column "${columnName}" does not exist`);
    }
    if (isGPUTableIndexColumnName(columnName)) {
      throw new Error(`GPU analytics column "${columnName}" is reserved for table indices`);
    }

    const column: PreparedGPUAnalyticsColumn = {
      field,
      format: getGPUAnalyticsVectorFormat(field.type, columnName),
      chunks: [],
      validity: [],
      nullCounts: []
    };

    for (const [batchIndex, batch] of table.batches.entries()) {
      const vector = batch.getChild(columnName);
      const data = vector?.data[0];
      if (!vector || !data || vector.data.length !== 1 || data.length !== batch.numRows) {
        throw new Error(
          `GPU analytics column "${columnName}" has an incompatible chunk in batch ${batchIndex}`
        );
      }

      if (getGPUAnalyticsVectorFormat(data.type, columnName) !== column.format) {
        throw new Error(`GPU analytics column "${columnName}" changes type between batches`);
      }

      const validity = getGPUAnalyticsValidity(data, field.nullable, columnName);
      if (DataType.isDictionary(field.type)) {
        const dictionary = getGPUAnalyticsDictionary(data, columnName);
        if (column.dictionary && !areGPUAnalyticsDictionariesEqual(column.dictionary, dictionary)) {
          throw new Error(`GPU analytics dictionary column "${columnName}" changes across batches`);
        }
        column.dictionary ??= dictionary;
        validateGPUAnalyticsDictionaryIndices(data, dictionary, validity, columnName);
      }

      column.chunks.push(data);
      column.validity.push(validity);
      column.nullCounts.push(data.nullCount);
    }

    return column;
  });
}

/** Maps the intentionally limited portable Arrow analytics surface to canonical GPU formats. */
function getGPUAnalyticsVectorFormat(type: DataType, columnName: string): GPUAnalyticsVectorFormat {
  if (DataType.isFloat(type) && type.precision === Precision.SINGLE) {
    return 'float32';
  }
  if (DataType.isInt(type) && type.bitWidth === 32) {
    return type.isSigned ? 'sint32' : 'uint32';
  }
  if (
    DataType.isDictionary(type) &&
    DataType.isUtf8(type.dictionary) &&
    DataType.isInt(type.indices) &&
    type.indices.bitWidth === 32
  ) {
    return type.indices.isSigned ? 'sint32' : 'uint32';
  }
  throw new Error(`GPU analytics column "${columnName}" has unsupported Arrow type ${type}`);
}

/** Expands sliced Arrow validity bits into one 0/1 uint32 value per logical source row. */
function getGPUAnalyticsValidity(data: Data, nullable: boolean, columnName: string): Uint32Array {
  const nullCount = data.nullCount;
  const sourceRowOffset = data.offset ?? 0;
  if (
    !Number.isSafeInteger(sourceRowOffset) ||
    sourceRowOffset < 0 ||
    !Number.isSafeInteger(nullCount) ||
    nullCount < 0 ||
    nullCount > data.length
  ) {
    throw new Error(`GPU analytics column "${columnName}" has malformed validity metadata`);
  }
  if (!nullable && nullCount > 0) {
    throw new Error(`GPU analytics non-nullable column "${columnName}" contains null values`);
  }

  const bitmap = data.nullBitmap;
  if (nullCount > 0 && (!bitmap || bitmap.byteLength === 0)) {
    throw new Error(`GPU analytics column "${columnName}" is missing its validity bitmap`);
  }
  if (bitmap && bitmap.byteLength > 0 && bitmap.byteLength * 8 < sourceRowOffset + data.length) {
    throw new Error(`GPU analytics column "${columnName}" has a truncated validity bitmap`);
  }

  const validity = new Uint32Array(data.length);
  let observedNullCount = 0;
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    const sourceBitIndex = sourceRowOffset + rowIndex;
    const valid =
      !bitmap || bitmap.byteLength === 0
        ? true
        : ((bitmap[sourceBitIndex >> 3] ?? 0) & (1 << (sourceBitIndex & 7))) !== 0;
    validity[rowIndex] = valid ? 1 : 0;
    if (!valid) {
      observedNullCount++;
    }
  }
  if (observedNullCount !== nullCount) {
    throw new Error(`GPU analytics column "${columnName}" has inconsistent validity bitmap`);
  }
  return validity;
}

/** Copies dictionary labels into explicit CPU metadata without retaining the Arrow source vector. */
function getGPUAnalyticsDictionary(data: Data, columnName: string): GPUAnalyticsDictionary {
  if (!(data.type instanceof Dictionary) || !DataType.isUtf8(data.type.dictionary)) {
    throw new Error(`GPU analytics column "${columnName}" requires a UTF-8 dictionary`);
  }
  if (!data.dictionary) {
    throw new Error(`GPU analytics dictionary column "${columnName}" has no dictionary labels`);
  }

  const values: string[] = [];
  for (const value of data.dictionary) {
    if (typeof value !== 'string') {
      throw new Error(`GPU analytics dictionary column "${columnName}" contains a null label`);
    }
    values.push(value);
  }
  return Object.freeze({values: Object.freeze(values), ordered: data.type.isOrdered});
}

/** Ensures every non-null dictionary row references an existing category label. */
function validateGPUAnalyticsDictionaryIndices(
  data: Data,
  dictionary: GPUAnalyticsDictionary,
  validity: Uint32Array,
  columnName: string
): void {
  const indices = data.values as Int32Array | Uint32Array;
  const sourceOffset = indices.length === data.length ? 0 : (data.offset ?? 0);
  if (sourceOffset + data.length > indices.length) {
    throw new Error(`GPU analytics dictionary column "${columnName}" has truncated indices`);
  }
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    if (!validity[rowIndex]) {
      continue;
    }
    const categoryIndex = indices[sourceOffset + rowIndex];
    if (categoryIndex < 0 || categoryIndex >= dictionary.values.length) {
      throw new Error(`GPU analytics dictionary column "${columnName}" has an invalid index`);
    }
  }
}

/** Verifies independently supplied record batches use the same category encoding. */
function areGPUAnalyticsDictionariesEqual(
  first: GPUAnalyticsDictionary,
  second: GPUAnalyticsDictionary
): boolean {
  return (
    first.ordered === second.ordered &&
    first.values.length === second.values.length &&
    first.values.every((value, index) => value === second.values[index])
  );
}

/** Reuses the existing Arrow GPU uploader while giving zero-row chunks usable storage capacity. */
function makeGPUAnalyticsData(
  device: Device,
  source: Data,
  format: GPUAnalyticsVectorFormat,
  bufferProps: GPUVectorBufferProps
): GPUData {
  if (source.length > 0) {
    return makeGPUDataFromArrowData(device, source, {...bufferProps, format});
  }

  const buffer = device.createBuffer({...bufferProps, byteLength: 4});
  try {
    return new GPUData({
      buffer,
      format,
      length: 0,
      stride: 1,
      byteStride: 4,
      rowByteLength: 4,
      dataType: source.type,
      ownsBuffer: true
    });
  } catch (error) {
    buffer.destroy();
    throw error;
  }
}

/** Stores row-aligned validity in a separate owned GPU buffer for each source record batch. */
function makeGPUAnalyticsValidityData(
  device: Device,
  validity: Uint32Array,
  bufferProps: GPUVectorBufferProps
): GPUData<'uint32'> {
  const values = validity.length > 0 ? validity : new Uint32Array(1);
  const buffer = device.createBuffer({...bufferProps, data: values});
  try {
    return new GPUData({
      buffer,
      format: 'uint32',
      length: validity.length,
      ownsBuffer: true
    });
  } catch (error) {
    buffer.destroy();
    throw error;
  }
}

/** Copies source field nullability and metadata into the generic Arrow-free GPU schema. */
function makeGPUAnalyticsField(column: PreparedGPUAnalyticsColumn): GPUField {
  return {
    name: column.field.name,
    format: column.format,
    nullable: column.field.nullable,
    metadata: new Map(column.field.metadata)
  };
}
