// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUData,
  GPUVector,
  getGPUVectorFormatInfo,
  type GPUVectorBufferProps
} from '@luma.gl/graph/gpu-data';
import {
  GPURecordBatch,
  GPUTable,
  isGPUTableIndexColumnName,
  type GPUField,
  type GPUTablePackBatchesOptions,
  type GPUTypeMap
} from '@luma.gl/graph/gpu-tables';
import {
  DataType,
  Dictionary,
  type FixedSizeList,
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
import {
  getArrowDataBufferSource,
  getArrowFixedSizeListRowValidity,
  getArrowGPUDataReadbackMetadata,
  type GPUDataReadbackMetadata
} from './arrow-gpu-data';
import {makeGPUDataFromArrowData} from '@luma.gl/graph/arrow';

/** Supported scalar and categorical index formats. */
type GPUAnalyticsScalarFormat = 'float32' | 'sint32' | 'uint32';
/** Logical 32-bit values, dictionary indices, or flattened fixed-size-list components. */
type GPUAnalyticsValues = Float32Array | Int32Array | Uint32Array;
/** Packed scalar and fixed-width numeric row formats accepted by the Arrow adapter. */
type GPUAnalyticsVectorFormat =
  | GPUAnalyticsScalarFormat
  | `${GPUAnalyticsScalarFormat}x${2 | 3 | 4}`;
/** Maps supported Arrow child types to the format of one packed component. */
type GPUAnalyticsListFormat<T> = T extends Float32
  ? 'float32'
  : T extends Int32
    ? 'sint32'
    : T extends Uint32
      ? 'uint32'
      : never;

/** Maps a typed Arrow schema to its exact portable GPU analytics column formats. */
export type GPUAnalyticsTypeMapForArrow<T extends TypeMap> = {
  [Name in keyof T & string]: T[Name] extends FixedSizeList<infer Child>
    ? `${GPUAnalyticsListFormat<Child>}x${2 | 3 | 4}`
    : T[Name] extends Float32
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
   * batches. `minBatchSize` is a lower target, not a size cap: source batches are never split,
   * groups can overshoot, and the final group can be smaller. A packed group whose column bytes
   * exceed `device.limits.maxStorageBufferBindingSize` throws before any GPU allocation.
   * Defaults to `false`, which preserves every source record batch.
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
  nullable: boolean;
  format: GPUAnalyticsVectorFormat;
  chunks: Data[];
  /** Validated logical values for each chunk, read before any GPU allocation. */
  values: GPUAnalyticsValues[];
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
 *
 * @example
 * ```ts
 * const uploaded = makeGPUAnalyticsTableFromArrowTable(device, arrowTable);
 * const frame = new GPUDataFrame({...uploaded, ownership: 'owned'});
 * ```
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
    validateGPUAnalyticsPackedBatchSizes(device, table, columns, batchGroups);
    let sourceRowIndexOffset = 0;
    const batches = batchGroups.map(sourceBatchIndices => {
      const recordBatches = sourceBatchIndices.map(batchIndex => table.batches[batchIndex]);
      const numRows = recordBatches.reduce((rowCount, batch) => rowCount + batch.numRows, 0);
      const gpuData: Record<string, GPUData> = {};

      for (const column of columns) {
        const data =
          sourceBatchIndices.length === 1
            ? makeGPUAnalyticsData(
                device,
                column.chunks[sourceBatchIndices[0]],
                column.format,
                requiredBufferProps
              )
            : makePackedGPUAnalyticsData(device, column, sourceBatchIndices, requiredBufferProps);
        allocatedData.push(data);
        gpuData[column.field.name] = data;
      }

      const batch = new GPURecordBatch<T>({
        gpuData,
        fields: columns.map(column => makeGPUAnalyticsField(column)),
        numRows,
        metadata: new Map(recordBatches[0].schema.metadata),
        // `null` marks a group spanning source batches, which has no single source identity.
        sourceInfo:
          sourceBatchIndices.length === 1
            ? {
                sourceBatchIndex: sourceBatchIndices[0],
                sourceRowIndexOffset,
                sourceRowCount: numRows
              }
            : null,
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
              byteStride: getGPUVectorFormatInfo(column.format).byteLength
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
      if (!column.nullable || batches.length === 0) {
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

/**
 * Rejects packed groups whose column bytes exceed one storage binding, before any allocation.
 * Validity sidecars use 4 bytes per row, never more than their column, so they need no check.
 * A zero limit means the device reports no storage binding limit (WebGL), so nothing is checked.
 */
function validateGPUAnalyticsPackedBatchSizes(
  device: Device,
  table: Table,
  columns: PreparedGPUAnalyticsColumn[],
  batchGroups: number[][]
): void {
  const maxBindingSize = device.limits.maxStorageBufferBindingSize;
  if (!maxBindingSize) {
    return;
  }
  for (const sourceBatchIndices of batchGroups) {
    if (sourceBatchIndices.length === 1) {
      continue;
    }
    const rowCount = sourceBatchIndices.reduce(
      (total, batchIndex) => total + table.batches[batchIndex].numRows,
      0
    );
    for (const column of columns) {
      const byteLength = rowCount * getGPUVectorFormatInfo(column.format).byteLength;
      if (byteLength > maxBindingSize) {
        throw new Error(
          `GPU analytics column "${column.field.name}" packs ${rowCount} rows into ${byteLength} bytes, above maxStorageBufferBindingSize (${maxBindingSize}); use a smaller packBatches.minBatchSize`
        );
      }
    }
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
      nullable:
        field.nullable || (DataType.isFixedSizeList(field.type) && field.type.children[0].nullable),
      format: getGPUAnalyticsVectorFormat(field.type, columnName),
      chunks: [],
      values: [],
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

      const parentValidity = getGPUAnalyticsValidity(data, field.nullable, columnName);
      const validity = DataType.isFixedSizeList(field.type)
        ? (getArrowFixedSizeListRowValidity(
            data as Data<FixedSizeList<Float32 | Int32 | Uint32>>
          ) ?? parentValidity)
        : parentValidity;
      const nullCount = validity.reduce((count, valid) => count + Number(!valid), 0);
      if (nullCount && !column.nullable) {
        throw new Error(
          `GPU analytics non-nullable vector "${columnName}" contains null components`
        );
      }
      if (DataType.isDictionary(field.type)) {
        const dictionary = getGPUAnalyticsDictionary(data, columnName);
        if (column.dictionary && !areGPUAnalyticsDictionariesEqual(column.dictionary, dictionary)) {
          throw new Error(`GPU analytics dictionary column "${columnName}" changes across batches`);
        }
        column.dictionary ??= dictionary;
        validateGPUAnalyticsDictionaryIndices(data, dictionary, validity, columnName);
      }

      column.chunks.push(data);
      column.values.push(getGPUAnalyticsValues(data, columnName));
      column.validity.push(validity);
      column.nullCounts.push(nullCount);
    }

    return column;
  });
}

/** Maps the intentionally limited portable Arrow analytics surface to canonical GPU formats. */
function getGPUAnalyticsVectorFormat(type: DataType, columnName: string): GPUAnalyticsVectorFormat {
  if (DataType.isFixedSizeList(type)) {
    const child = type.children[0].type;
    const width = type.listSize;
    if (
      (width === 2 || width === 3 || width === 4) &&
      ((DataType.isFloat(child) && child.precision === Precision.SINGLE) ||
        (DataType.isInt(child) && child.bitWidth === 32))
    ) {
      const scalar = DataType.isFloat(child) ? 'float32' : child.isSigned ? 'sint32' : 'uint32';
      return `${scalar}x${width}`;
    }
  }
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
 * Returns the logical values of one possibly sliced Arrow chunk, reading fixed-size-list
 * components from the child data. Packed uploads advance each write offset by these bytes, so a
 * short chunk would shift later chunks to the wrong rows; it is rejected here, before allocation.
 */
function getGPUAnalyticsValues(data: Data, columnName: string): GPUAnalyticsValues {
  if (data.length === 0) {
    return new Uint32Array(0);
  }
  try {
    return getArrowDataBufferSource(data as Data<Float32 | Int32 | Uint32>) as GPUAnalyticsValues;
  } catch {
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

  const layout = getGPUVectorFormatInfo(format);
  const buffer = device.createBuffer({...bufferProps, byteLength: layout.byteLength});
  try {
    return new GPUData({
      buffer,
      format,
      length: 0,

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
 * Every analytics component is 4 bytes wide, so each row (and each write offset) is a multiple of
 * 4 bytes and satisfies WebGPU's 4-byte `writeBuffer` alignment without padding between chunks.
 */
function makePackedGPUAnalyticsData(
  device: Device,
  column: PreparedGPUAnalyticsColumn,
  sourceBatchIndices: number[],
  bufferProps: GPUVectorBufferProps
): GPUData {
  const sources = sourceBatchIndices.map(batchIndex => column.chunks[batchIndex]);
  const validity = sourceBatchIndices.map(batchIndex => column.validity[batchIndex]);
  const nullBitmap = makePackedGPUAnalyticsNullBitmap(validity);
  const readbackMetadata = makePackedGPUAnalyticsReadbackMetadata(sources, nullBitmap);
  const formatInfo = getGPUVectorFormatInfo(column.format);
  const buffer = writePackedGPUAnalyticsBuffer(
    device,
    sourceBatchIndices.map(batchIndex => column.values[batchIndex]),
    bufferProps
  );
  try {
    return new GPUData({
      buffer,
      format: column.format,
      length: sources.reduce((length, source) => length + source.length, 0),
      stride: formatInfo.listSize ?? formatInfo.components,
      byteStride: formatInfo.byteLength,
      rowByteLength: formatInfo.byteLength,
      dataType: sources[0].type,
      ownsBuffer: true,
      ...(readbackMetadata ? {readbackMetadata} : {}),
      ...(nullBitmap ? {nullBitmap} : {})
    });
  } catch (error) {
    buffer.destroy();
    throw error;
  }
}

/** Merges per-chunk row validity into one Arrow bitmap, or returns `undefined` without nulls. */
function makePackedGPUAnalyticsNullBitmap(validity: Uint32Array[]): Uint8Array | undefined {
  if (validity.every(values => values.every(Boolean))) {
    return undefined;
  }
  return concatenateGPUAnalyticsBitmaps(
    validity.map(values => {
      const bitmap = new Uint8Array(Math.ceil(values.length / 8));
      for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
        if (values[rowIndex]) {
          bitmap[rowIndex >> 3] |= 1 << (rowIndex & 7);
        }
      }
      return bitmap;
    }),
    validity.map(values => values.length)
  );
}

/**
 * Merges per-chunk readback metadata so generic `readArrowGPUDataAsync()` restores nulls for packed
 * chunks exactly as it does for unpacked ones. Fixed-size lists keep separate parent and child
 * bitmaps. Unpacked dictionary chunks carry no readback metadata, so dictionaries are skipped.
 *
 * Alternative: skip these CPU bitmaps and document that packed chunks carry nulls only in the
 * validity sidecars read by `makeArrowTableFromGPUAnalyticsTable()`. Generic readback of packed
 * chunks would then return zero-filled payloads where unpacked chunks return nulls.
 */
function makePackedGPUAnalyticsReadbackMetadata(
  sources: Data[],
  rowNullBitmap: Uint8Array | undefined
): GPUDataReadbackMetadata | undefined {
  const type = sources[0].type;
  if (DataType.isDictionary(type)) {
    return undefined;
  }
  if (!DataType.isFixedSizeList(type)) {
    const nullCount = sources.reduce((total, source) => total + source.nullCount, 0);
    return rowNullBitmap && nullCount > 0
      ? {kind: 'numeric', nullCount, nullBitmap: rowNullBitmap}
      : undefined;
  }

  type FixedSizeListMetadata = Extract<GPUDataReadbackMetadata, {kind: 'fixed-size-list'}>;
  const metadata = sources.map(
    source => getArrowGPUDataReadbackMetadata(source) as FixedSizeListMetadata | undefined
  );
  const nullCount = metadata.reduce((total, chunk) => total + (chunk?.nullCount ?? 0), 0);
  const childNullCount = metadata.reduce((total, chunk) => total + (chunk?.childNullCount ?? 0), 0);
  if (nullCount === 0 && childNullCount === 0) {
    return undefined;
  }
  const rowCounts = sources.map(source => source.length);
  return {
    kind: 'fixed-size-list',
    nullCount,
    ...(nullCount > 0
      ? {
          nullBitmap: concatenateGPUAnalyticsBitmaps(
            metadata.map(chunk => chunk?.nullBitmap),
            rowCounts
          )
        }
      : {}),
    childNullCount,
    ...(childNullCount > 0
      ? {
          childNullBitmap: concatenateGPUAnalyticsBitmaps(
            metadata.map(chunk => chunk?.childNullBitmap),
            rowCounts.map(rowCount => rowCount * type.listSize)
          )
        }
      : {})
  };
}

/** Concatenates chunk-local Arrow bitmaps; a missing bitmap marks all of its bits valid. */
function concatenateGPUAnalyticsBitmaps(
  bitmaps: (Uint8Array | undefined)[],
  bitCounts: number[]
): Uint8Array {
  const totalBitCount = bitCounts.reduce((total, bitCount) => total + bitCount, 0);
  const result = new Uint8Array(Math.ceil(totalBitCount / 8));
  let targetBitIndex = 0;
  for (const [chunkIndex, bitmap] of bitmaps.entries()) {
    for (let bitIndex = 0; bitIndex < bitCounts[chunkIndex]; bitIndex++, targetBitIndex++) {
      if (!bitmap || (bitmap[bitIndex >> 3] & (1 << (bitIndex & 7))) !== 0) {
        result[targetBitIndex >> 3] |= 1 << (targetBitIndex & 7);
      }
    }
  }
  return result;
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
    nullable: column.nullable,
    metadata: new Map(column.field.metadata)
  };
}
