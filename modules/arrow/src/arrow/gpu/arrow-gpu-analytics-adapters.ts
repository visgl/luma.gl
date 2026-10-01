// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData, GPUVector, type GPUVectorBufferProps} from '@luma.gl/gpgpu/gpu-data';
import {
  GPURecordBatch,
  GPUTable,
  isGPUTableIndexColumnName,
  type GPUField,
  type GPUTablePackBatchesOptions,
  type GPUTypeMap
} from '@luma.gl/experimental/gpu-tables';
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
  /**
   * Uploads adjacent source record batches into shared per-column buffers instead of one buffer
   * per source batch. `true` packs every source batch into one GPU record batch; `minBatchSize`
   * greedily groups adjacent source batches until each group reaches that row count. Each source
   * chunk is written directly at its byte offset, so packing needs no JavaScript concatenation,
   * no GPU copy pass, and no transient second allocation. Validity sidecars follow the packed
   * batches. Defaults to `false`, which preserves every source record batch.
   */
  packBatches?: boolean | GPUTablePackBatchesOptions;
};

/** GPU table plus explicit analytical metadata retained outside generic GPU table storage. */
export type GPUAnalyticsTableFromArrowTableResult<T extends GPUTypeMap = GPUTypeMap> = {
  /** Existing generic GPU table primitives, preserving source record batches unless packed. */
  table: GPUTable<T>;
  /** One batch-aligned uint32 GPU validity vector for every nullable selected field. */
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

    const batchGroups = getGPUAnalyticsBatchGroups(table, options.packBatches);
    let sourceRowIndexOffset = 0;
    const batches = batchGroups.map(sourceBatchIndices => {
      const recordBatches = sourceBatchIndices.map(batchIndex => table.batches[batchIndex]);
      const numRows = recordBatches.reduce((rowCount, batch) => rowCount + batch.numRows, 0);
      const gpuData: Record<string, GPUData> = {};

      for (const column of columns) {
        const sourceData = sourceBatchIndices.map(batchIndex => column.chunks[batchIndex]);
        const data =
          sourceData.length === 1
            ? makeGPUAnalyticsData(device, sourceData[0], column.format, requiredBufferProps)
            : makePackedGPUAnalyticsData(
                device,
                sourceData,
                sourceBatchIndices.map(batchIndex => column.validity[batchIndex]),
                column.format,
                requiredBufferProps
              );
        allocatedData.push(data);
        gpuData[column.field.name] = data;
      }

      const batch = new GPURecordBatch<T>({
        gpuData,
        fields: columns.map(column => makeGPUAnalyticsField(column)),
        numRows,
        metadata: new Map(recordBatches[0].schema.metadata),
        // A packed batch identifies its first source batch and the contiguous source rows it spans.
        sourceInfo: {
          sourceBatchIndex: sourceBatchIndices[0],
          sourceRowIndexOffset,
          sourceRowCount: numRows
        },
        nullCount: recordBatches.reduce((nullCount, batch) => nullCount + batch.nullCount, 0)
      });
      sourceRowIndexOffset += numRows;
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

      const chunks = batchGroups.map(sourceBatchIndices => {
        const data = makeGPUAnalyticsValidityData(
          device,
          sourceBatchIndices.map(batchIndex => column.validity[batchIndex]),
          requiredBufferProps
        );
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

/** Returns adjacent source batch indices that share one output GPU record batch. */
function getGPUAnalyticsBatchGroups(
  table: Table,
  packBatches: GPUAnalyticsTableFromArrowTableProps['packBatches']
): number[][] {
  const batchIndices = table.batches.map((_batch, batchIndex) => batchIndex);
  if (!packBatches || batchIndices.length === 0) {
    return batchIndices.map(batchIndex => [batchIndex]);
  }
  const minBatchSize = packBatches === true ? undefined : packBatches.minBatchSize;
  if (minBatchSize === undefined) {
    return [batchIndices];
  }
  if (!Number.isFinite(minBatchSize) || minBatchSize <= 0) {
    throw new Error('GPU analytics packBatches.minBatchSize must be a positive number');
  }

  const batchGroups: number[][] = [];
  let batchGroup: number[] = [];
  let rowCount = 0;
  for (const batchIndex of batchIndices) {
    batchGroup.push(batchIndex);
    rowCount += table.batches[batchIndex].numRows;
    if (rowCount >= minBatchSize) {
      batchGroups.push(batchGroup);
      batchGroup = [];
      rowCount = 0;
    }
  }
  if (batchGroup.length > 0) {
    batchGroups.push(batchGroup);
  }
  return batchGroups;
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
      } else {
        validateGPUAnalyticsValues(data, columnName);
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

/**
 * Ensures numeric values cover every logical row. Packed uploads advance each write offset by the
 * chunk's value bytes, so a short chunk would shift later chunks to the wrong rows.
 *
 * Alternative: reuse `getArrowDataBufferSource()` in `getGPUAnalyticsValues()`, which throws the
 * same error at upload time, after earlier columns have already allocated (and then destroyed)
 * their GPU buffers.
 */
function validateGPUAnalyticsValues(data: Data, columnName: string): void {
  const values = data.values as Float32Array | Int32Array | Uint32Array | undefined;
  const startIndex = values?.length === data.length ? 0 : (data.offset ?? 0);
  if (data.length > 0 && (!values || startIndex + data.length > values.length)) {
    throw new Error(`GPU analytics column "${columnName}" has truncated values`);
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

/**
 * Writes adjacent Arrow chunks into one owned buffer at their row offsets.
 *
 * Every analytics format is 4 bytes wide, so each write offset satisfies WebGPU's 4-byte
 * `writeBuffer` alignment without padding between source chunks.
 */
function makePackedGPUAnalyticsData(
  device: Device,
  sources: Data[],
  validity: Uint32Array[],
  format: GPUAnalyticsVectorFormat,
  bufferProps: GPUVectorBufferProps
): GPUData {
  const readbackMetadata = makePackedGPUAnalyticsReadbackMetadata(sources, validity);
  const buffer = writePackedGPUAnalyticsBuffer(
    device,
    sources.map(source => getGPUAnalyticsValues(source)),
    bufferProps
  );
  try {
    return new GPUData({
      buffer,
      format,
      length: sources.reduce((length, source) => length + source.length, 0),
      stride: 1,
      byteStride: 4,
      rowByteLength: 4,
      dataType: sources[0].type,
      ownsBuffer: true,
      ...(readbackMetadata ? {readbackMetadata, nullBitmap: readbackMetadata.nullBitmap} : {})
    });
  } catch (error) {
    buffer.destroy();
    throw error;
  }
}

/**
 * Merges per-chunk validity into one Arrow bitmap so generic `readArrowGPUDataAsync()` restores
 * nulls for packed chunks exactly as it does for unpacked ones. Unpacked dictionary chunks carry
 * no numeric readback metadata, so dictionary columns are skipped here too.
 *
 * Alternative: skip this CPU bitmap (one bit per row) and document that packed chunks carry nulls
 * only in the validity sidecars read by `makeArrowTableFromGPUAnalyticsTable()`. Generic readback
 * of packed chunks would then return zero-filled payloads where unpacked chunks return nulls.
 */
function makePackedGPUAnalyticsReadbackMetadata(
  sources: Data[],
  validity: Uint32Array[]
): {kind: 'numeric'; nullCount: number; nullBitmap: Uint8Array} | undefined {
  const nullCount = sources.reduce((total, source) => total + source.nullCount, 0);
  if (nullCount === 0 || DataType.isDictionary(sources[0].type)) {
    return undefined;
  }

  const rowCount = validity.reduce((total, values) => total + values.length, 0);
  const nullBitmap = new Uint8Array(Math.ceil(rowCount / 8));
  let rowIndex = 0;
  for (const values of validity) {
    for (let valueIndex = 0; valueIndex < values.length; valueIndex++, rowIndex++) {
      if (values[valueIndex]) {
        nullBitmap[rowIndex >> 3] |= 1 << (rowIndex & 7);
      }
    }
  }
  return {kind: 'numeric', nullCount, nullBitmap};
}

/** Returns the logical 32-bit values or dictionary indices of one possibly sliced Arrow chunk. */
function getGPUAnalyticsValues(data: Data): Float32Array | Int32Array | Uint32Array {
  if (data.length === 0) {
    return new Uint32Array(0);
  }
  const values = data.values as Float32Array | Int32Array | Uint32Array;
  const startIndex = values.length === data.length ? 0 : (data.offset ?? 0);
  return values.subarray(startIndex, startIndex + data.length);
}

/** Stores row-aligned validity in a separate owned GPU buffer for each output record batch. */
function makeGPUAnalyticsValidityData(
  device: Device,
  validity: Uint32Array[],
  bufferProps: GPUVectorBufferProps
): GPUData<'uint32'> {
  const buffer =
    validity.length === 1
      ? device.createBuffer({
          ...bufferProps,
          data: validity[0].length > 0 ? validity[0] : new Uint32Array(1)
        })
      : writePackedGPUAnalyticsBuffer(device, validity, bufferProps);
  try {
    return new GPUData({
      buffer,
      format: 'uint32',
      length: validity.reduce((length, values) => length + values.length, 0),
      ownsBuffer: true
    });
  } catch (error) {
    buffer.destroy();
    throw error;
  }
}

/** Allocates one bindable buffer and writes each 32-bit chunk after the previous one. */
function writePackedGPUAnalyticsBuffer(
  device: Device,
  chunks: ArrayBufferView[],
  bufferProps: GPUVectorBufferProps
): Buffer {
  const byteLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  // Zero-row batches still need a bindable nonzero allocation.
  const buffer = device.createBuffer({...bufferProps, byteLength: Math.max(byteLength, 4)});
  try {
    let byteOffset = 0;
    for (const chunk of chunks) {
      if (chunk.byteLength > 0) {
        buffer.write(chunk, byteOffset);
        byteOffset += chunk.byteLength;
      }
    }
    return buffer;
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
