// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type BufferLayout, type VertexFormat} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUField, GPUSchema, GPUTypeMap} from './gpu-schema';
import {GPUConstant} from './gpu-constant';
import {GPUData} from './gpu-data';
import {GPUVector} from './gpu-vector';
import {GPURecordBatch, type GPURecordBatchSourceInfo} from './gpu-record-batch';
import {GPU_TABLE_INDEX_COLUMN_NAME, isGPUTableIndexColumnName} from './gpu-schema';
import {
  getGPUVectorElementFormat,
  type GPUVectorFormat,
  isValueListGPUVectorFormat,
  isVertexListGPUVectorFormat
} from './gpu-vector-format';

type GPUVectorMap<T extends GPUTypeMap = GPUTypeMap> = {
  [Name in keyof T & string]: GPUVector<T[Name]>;
};

/** One logical GPU table column with a format-preserving constant option for fixed-width rows. */
export type GPUColumn<T extends GPUVectorFormat = GPUVectorFormat> =
  | GPUVector<T>
  | (T extends VertexFormat ? GPUConstant<T> : never);

/** Typed logical GPU table columns keyed by schema field name. */
export type GPUColumnMap<T extends GPUTypeMap = GPUTypeMap> = {
  [Name in keyof T & string]: GPUColumn<T[Name]>;
};

/** Options for constructing a GPU table from logical varying and constant columns. */
export type GPUTableFromColumnsProps<T extends GPUTypeMap = GPUTypeMap> = {
  /** Logical columns keyed by table field name. */
  columns: GPUColumnMap<T> | Record<string, GPUVector | GPUConstant>;
  /** Required logical row count when every column is constant. */
  numRows?: number;
  /** Optional table-level schema metadata. */
  metadata?: Map<string, string>;
  /** Optional source-row identity forwarded when vectors contain one GPUData chunk. */
  sourceInfo?: GPURecordBatchSourceInfo;
  /** Number of null rows forwarded when vectors contain one GPUData chunk. */
  nullCount?: number;
};

/** Options for constructing a GPU table from existing GPU vectors. */
export type GPUTableFromVectorsProps<T extends GPUTypeMap = GPUTypeMap> = {
  /** GPU vectors keyed by name, or a list of named GPU vectors. */
  vectors: GPUVectorMap<T> | Record<string, GPUVector> | GPUVector[];
  /** Optional table-level schema metadata. */
  metadata?: Map<string, string>;
  /** Optional source-row identity forwarded when vectors contain one GPUData chunk. */
  sourceInfo?: GPURecordBatchSourceInfo;
  /** Number of null rows forwarded when vectors contain one GPUData chunk. */
  nullCount?: number;
};

/** Options for constructing a GPU table from already-built record batches. */
export type GPUTableFromBatchesProps<T extends GPUTypeMap = GPUTypeMap> = {
  /** GPU batches preserved by the table. */
  batches: GPURecordBatch<T>[];
  /** Immutable logical constant columns shared by every batch. */
  constants?: Record<string, GPUConstant>;
};

/** Options for constructing one typed table with no GPU record batches. */
export type GPUTableFromSchemaProps<T extends GPUTypeMap = GPUTypeMap> = {
  /** Selected schema retained by the empty table. */
  schema: GPUSchema<T>;
  /** Optional layout retained until the first batch is added. */
  bufferLayout?: BufferLayout[];
};

/** Generic GPU table construction props. */
export type GPUTableProps<T extends GPUTypeMap = GPUTypeMap> =
  | GPUTableFromColumnsProps<T>
  | GPUTableFromVectorsProps<T>
  | GPUTableFromBatchesProps<T>
  | GPUTableFromSchemaProps<T>;

/** Options for replacing preserved GPU batches with larger packed batches. */
export type GPUTablePackBatchesOptions = {
  /** Greedily merge adjacent batches until each emitted batch reaches this row count. */
  minBatchSize?: number;
};

/** Half-open batch index range used by {@link GPUTable.detachBatches}. */
export type GPUTableDetachBatchesOptions = {
  /** First batch index to detach. Defaults to `0`. */
  first?: number;
  /** Batch index after the last detached batch. Defaults to `batches.length`. */
  last?: number;
};

/** GPU memory and schema metadata for one logical table. */
export class GPUTable<T extends GPUTypeMap = GPUTypeMap> {
  /** GPU-facing schema for the selected columns. */
  schema: GPUSchema<T>;
  /** Number of logical rows in the table. */
  numRows: number;
  /** Number of selected GPU columns in {@link schema}. */
  numCols: number;
  /** Number of null rows retained in table metadata. */
  nullCount: number;
  /** GPU vectors keyed by table/shader column name. */
  readonly gpuVectors: Record<string, GPUVector> = {};
  /** Immutable logical constants keyed by table/shader column name. */
  readonly gpuConstants: Record<string, GPUConstant> = {};
  /** Canonical logical columns keyed by table/shader column name. */
  readonly gpuColumns: Record<string, GPUVector | GPUConstant> = {};
  /** Preserved batch-local GPU storage. */
  readonly batches: GPURecordBatch[] = [];

  /** Buffer layout shared by preserved record batches. */
  readonly bufferLayout: BufferLayout[] = [];

  /** Creates one logical GPU table from a schema, batches, or batch-aligned vectors. */
  constructor(props: GPUTableProps<T>) {
    if ('batches' in props) {
      const firstBatch = props.batches[0];
      if (!firstBatch) {
        throw new Error('GPUTable batches constructor requires at least one GPURecordBatch');
      }
      assertCompatibleGPURecordBatches(props.batches);
      Object.assign(this.gpuConstants, props.constants ?? {});
      for (const constantName of Object.keys(this.gpuConstants)) {
        if (firstBatch.gpuData[constantName]) {
          throw new Error(
            `GPUTable constant column "${constantName}" conflicts with batch GPUData`
          );
        }
        if (isGPUTableIndexColumnName(constantName)) {
          throw new Error('GPUTable reserved index column "indices" cannot be constant');
        }
      }
      const constantFields = getGPUConstantFields(this.gpuConstants);
      this.schema =
        constantFields.length === 0
          ? (firstBatch.schema as GPUSchema<T>)
          : {
              fields: [...firstBatch.schema.fields, ...constantFields] as GPUField<
                keyof T & string
              >[],
              metadata: new Map(firstBatch.schema.metadata)
            };
      this.numCols = this.schema.fields.length;
      this.batches.push(...(props.batches as GPURecordBatch[]));
      this.bufferLayout.push(...firstBatch.bufferLayout);
      this.numRows = props.batches.reduce((numRows, batch) => numRows + batch.numRows, 0);
      this.nullCount = props.batches.reduce((nullCount, batch) => nullCount + batch.nullCount, 0);
      this.rebuildAggregateVectors();
      return;
    }

    if ('schema' in props) {
      this.schema = props.schema;
      this.numCols = props.schema.fields.length;
      this.numRows = 0;
      this.nullCount = 0;
      this.bufferLayout.push(...(props.bufferLayout ?? []));
      return;
    }

    const {metadata, sourceInfo, nullCount = 0} = props;
    const columns = 'columns' in props ? props.columns : props.vectors;
    const normalizedColumns = normalizeGPUColumns(columns);
    const gpuVectors = Object.fromEntries(
      Object.entries(normalizedColumns).filter(
        (entry): entry is [string, GPUVector] => entry[1] instanceof GPUVector
      )
    );
    Object.assign(
      this.gpuConstants,
      Object.fromEntries(
        Object.entries(normalizedColumns).filter(
          (entry): entry is [string, GPUConstant] => entry[1] instanceof GPUConstant
        )
      )
    );
    const hasGPUData = Object.values(gpuVectors).some(vector => vector.data.length > 0);
    const bufferLayout = getGPUVectorBufferLayout(gpuVectors, !hasGPUData);
    const vectorFields = getGPUVectorFields(gpuVectors);
    const fields = getGPUColumnFields(normalizedColumns, vectorFields);
    const batches = createGPURecordBatchesFromVectors(
      gpuVectors,
      bufferLayout,
      vectorFields,
      metadata,
      sourceInfo,
      nullCount
    );

    this.schema = {fields, metadata: metadata ?? new Map()};
    this.numCols = fields.length;
    const inferredNumRows = batches.reduce((numRows, batch) => numRows + batch.numRows, 0);
    const explicitNumRows = 'columns' in props ? props.numRows : undefined;
    this.numRows = getGPUTableRowCount(inferredNumRows, gpuVectors, explicitNumRows);
    this.nullCount = batches.reduce((totalNullCount, batch) => totalNullCount + batch.nullCount, 0);
    this.bufferLayout.push(...bufferLayout);
    this.batches.push(...batches);
    if (this.batches.length === 0 && Object.keys(this.gpuConstants).length > 0) {
      this.batches.push(
        new GPURecordBatch({gpuData: {}, fields: [], numRows: this.numRows, metadata})
      );
    }
    this.rebuildAggregateVectors();
  }

  /** Replaces preserved GPU batches with fewer packed batches. */
  packBatches(options: GPUTablePackBatchesOptions = {}): this {
    if (this.batches.length <= 1) {
      return this;
    }
    if (this.batches.some(batch => batch.gpuData[GPU_TABLE_INDEX_COLUMN_NAME])) {
      throw new Error('GPUTable.packBatches() does not support indexed tables');
    }

    const batchGroups = createGPUPackGroups(this.batches, options.minBatchSize);
    const nextBatches: GPURecordBatch[] = [];
    const supersededBatches: GPURecordBatch[] = [];

    for (const batchGroup of batchGroups) {
      if (batchGroup.length === 1) {
        nextBatches.push(batchGroup[0]);
        continue;
      }
      nextBatches.push(
        createPackedGPURecordBatch(batchGroup, this.bufferLayout, getGPUTableVaryingSchema(this))
      );
      supersededBatches.push(...batchGroup);
    }

    if (supersededBatches.length === 0) {
      return this;
    }

    this.batches.splice(0, this.batches.length, ...nextBatches);
    this.refreshFromBatches();
    for (const batch of supersededBatches) {
      batch.destroy();
    }
    return this;
  }

  /** Adds one already-created GPU record batch to this table. */
  addBatch(batch: GPURecordBatch): this {
    if (this.batches.length === 0) {
      assertMatchingGPURecordBatchSchema(
        getGPUTableVaryingSchema(this),
        batch.schema,
        'GPUTable.addBatch()'
      );
      if (this.bufferLayout.length === 0) {
        this.bufferLayout.push(...batch.bufferLayout);
      } else if (!deepEqualBufferLayouts(this.bufferLayout, batch.bufferLayout)) {
        throw new Error('GPUTable.addBatch() requires matching buffer layouts');
      }
      this.batches.push(batch);
      return this.refreshFromBatches();
    }
    assertCompatibleGPURecordBatch(this, batch);
    this.batches.push(batch);
    return this.refreshFromBatches();
  }

  /** Recomputes aggregate row counts and vector views from preserved batches. */
  refreshFromBatches(): this {
    this.numRows = this.batches.reduce((numRows, batch) => numRows + batch.numRows, 0);
    this.nullCount = this.batches.reduce((nullCount, batch) => nullCount + batch.nullCount, 0);
    if (this.batches.length <= 1 || !this.trySynchronizeAggregateVectors()) {
      this.rebuildAggregateVectors();
    }
    return this;
  }

  /** Keeps only the requested columns and destroys the dropped batch-local data. */
  select(...columnNames: string[]): this {
    const selectedColumnNames = normalizeSelectedColumnNames(this, columnNames);
    const selectedColumnSet = new Set(selectedColumnNames);

    for (const batch of this.batches) {
      const droppedData = Object.entries(batch.gpuData)
        .filter(([name]) => !selectedColumnSet.has(name))
        .map(([, data]) => data);
      for (const data of droppedData) {
        data.destroy();
      }
      rebuildGPURecordBatchColumns(batch, selectedColumnNames);
    }

    rebuildGPUTableColumns(this, selectedColumnNames);
    this.rebuildAggregateVectors();
    return this;
  }

  /** Removes one column and returns an aggregate GPU vector that owns detached batch data. */
  detachVector(columnName: string): GPUVector {
    assertGPUTableColumn(this, columnName);
    const detachedData = this.batches.map(batch => batch.gpuData[columnName]);
    const firstData = detachedData[0];
    if (!firstData) {
      throw new Error(`GPUTable.detachVector() column "${columnName}" has no GPU data`);
    }
    const detachedVector = new GPUVector({
      type: 'data',
      name: columnName,
      dataType: firstData.dataType,
      format: firstData.format,
      data: detachedData,
      stride: firstData.stride,
      byteStride: firstData.byteStride,
      rowByteLength: firstData.rowByteLength,
      bufferLayout: getColumnBufferLayout(this.bufferLayout, columnName),
      ownsData: true
    });
    const remainingColumnNames = this.schema.fields
      .map(field => field.name)
      .filter(name => name !== columnName);
    for (const batch of this.batches) {
      rebuildGPURecordBatchColumns(batch, remainingColumnNames);
    }
    rebuildGPUTableColumns(this, remainingColumnNames);
    this.rebuildAggregateVectors();
    return detachedVector;
  }

  /** Removes and returns a half-open range of GPU record batches. */
  detachBatches(options: GPUTableDetachBatchesOptions = {}): GPURecordBatch[] {
    const first = options.first ?? 0;
    const last = options.last ?? this.batches.length;
    if (
      !Number.isInteger(first) ||
      !Number.isInteger(last) ||
      first < 0 ||
      last < first ||
      last > this.batches.length
    ) {
      throw new Error('GPUTable.detachBatches() requires a valid half-open batch range');
    }

    const detachedBatches = this.batches.splice(first, last - first);
    if (detachedBatches.length === 0) {
      return detachedBatches;
    }
    this.refreshFromBatches();
    return detachedBatches;
  }

  /** Destroys retained GPU batches and follows their vector-level ownership graphs. */
  destroy(): void {
    for (const batch of this.batches) {
      batch.destroy();
    }
  }

  private rebuildAggregateVectors(): void {
    for (const name of Object.keys(this.gpuVectors)) {
      delete this.gpuVectors[name];
    }
    const firstBatch = this.batches[0];
    if (firstBatch) {
      for (const columnName of Object.keys(firstBatch.gpuData)) {
        const batchData = getBatchColumnData(this.batches, columnName);
        this.gpuVectors[columnName] = createAggregateGPUVector(
          columnName,
          batchData,
          getColumnBufferLayout(this.bufferLayout, columnName)
        );
      }
    }
    synchronizeGPUColumns(this);
  }

  private trySynchronizeAggregateVectors(): boolean {
    const firstBatch = this.batches[0];
    if (!firstBatch) {
      return false;
    }

    for (const columnName of Object.keys(firstBatch.gpuData)) {
      const aggregateVector = this.gpuVectors[columnName];
      const batchData = getBatchColumnData(this.batches, columnName);
      if (!aggregateVector || !canSynchronizeAggregateVector(aggregateVector, batchData)) {
        return false;
      }
    }

    for (const columnName of Object.keys(firstBatch.gpuData)) {
      const aggregateVector = this.gpuVectors[columnName];
      const batchData = getBatchColumnData(this.batches, columnName);
      for (const data of batchData.slice(aggregateVector.data.length)) {
        aggregateVector.addData(data);
      }
    }

    return true;
  }
}

function canSynchronizeAggregateVector(aggregateVector: GPUVector, batchData: GPUData[]): boolean {
  const firstData = batchData[0];
  if (!firstData) {
    return false;
  }
  if (
    aggregateVector.format !== firstData.format ||
    aggregateVector.stride !== firstData.stride ||
    aggregateVector.byteStride !== firstData.byteStride ||
    aggregateVector.rowByteLength !== firstData.rowByteLength
  ) {
    return false;
  }
  if (aggregateVector.data.length > batchData.length) {
    return false;
  }
  return aggregateVector.data.every((data, index) => data === batchData[index]);
}

function getBatchColumnData(batches: GPURecordBatch[], columnName: string): GPUData[] {
  return batches.map(batch => {
    const data = batch.gpuData[columnName];
    if (!data) {
      throw new Error(`GPUTable batch is missing GPUData "${columnName}"`);
    }
    return data;
  });
}

function createAggregateGPUVector(
  columnName: string,
  data: GPUData[],
  bufferLayout?: BufferLayout
): GPUVector {
  const firstData = data[0];
  if (!firstData) {
    throw new Error(`GPUTable aggregate vector "${columnName}" requires GPUData`);
  }
  return new GPUVector({
    type: 'data',
    name: columnName,
    dataType: firstData.dataType,
    format: firstData.format,
    data,
    stride: firstData.stride,
    byteStride: firstData.byteStride,
    rowByteLength: firstData.rowByteLength,
    bufferLayout
  });
}

function createGPUPackGroups(batches: GPURecordBatch[], minBatchSize?: number): GPURecordBatch[][] {
  if (minBatchSize === undefined) {
    return [batches];
  }
  if (!Number.isFinite(minBatchSize) || minBatchSize <= 0) {
    throw new Error('GPUTable.packBatches() minBatchSize must be a positive number');
  }

  const batchGroups: GPURecordBatch[][] = [];
  let currentGroup: GPURecordBatch[] = [];
  let currentRowCount = 0;

  for (const batch of batches) {
    currentGroup.push(batch);
    currentRowCount += batch.numRows;
    if (currentRowCount >= minBatchSize) {
      batchGroups.push(currentGroup);
      currentGroup = [];
      currentRowCount = 0;
    }
  }

  if (currentGroup.length > 0) {
    batchGroups.push(currentGroup);
  }
  return batchGroups;
}

function createPackedGPURecordBatch(
  batchGroup: GPURecordBatch[],
  bufferLayout: BufferLayout[],
  schema: GPUSchema<any>
): GPURecordBatch {
  const firstBatch = batchGroup[0];
  const device = getGPURecordBatchDevice(firstBatch);
  const commandEncoder = device.createCommandEncoder();
  const packedData: Record<string, GPUData> = {};

  for (const columnName of Object.keys(firstBatch.gpuData)) {
    const sourceData = batchGroup.map(batch => batch.gpuData[columnName]);
    const firstData = sourceData[0];
    if (!firstData) {
      throw new Error(`GPUTable batch is missing GPUData "${columnName}"`);
    }
    if (
      sourceData.some(
        data =>
          data.format &&
          (isValueListGPUVectorFormat(data.format) || isVertexListGPUVectorFormat(data.format))
      )
    ) {
      throw new Error(
        `GPUTable.packBatches() does not support variable-length GPUData "${columnName}"`
      );
    }

    const byteLength = sourceData.reduce(
      (totalByteLength, data) => totalByteLength + data.length * data.byteStride,
      0
    );
    const buffer = device.createBuffer({
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      byteLength
    });
    let destinationOffset = 0;
    for (const data of sourceData) {
      const copyByteLength = getGPUDataCopyByteLength(data);
      if (copyByteLength === 0) {
        continue;
      }
      commandEncoder.copyBufferToBuffer({
        sourceBuffer: getGPUDataConcreteBuffer(data),
        sourceOffset: data.byteOffset,
        destinationBuffer: buffer,
        destinationOffset,
        size: copyByteLength
      });
      destinationOffset += data.length * data.byteStride;
    }

    packedData[columnName] = new GPUData({
      buffer,
      dataType: firstData.dataType,
      format: firstData.format,
      length: sourceData.reduce((length, data) => length + data.length, 0),
      valueLength: sourceData.reduce((length, data) => length + data.valueLength, 0),
      stride: firstData.stride,
      byteStride: firstData.byteStride,
      rowByteLength: firstData.rowByteLength,
      ownsBuffer: true
    });
  }

  device.submit(commandEncoder.finish());
  return new GPURecordBatch({
    gpuData: packedData,
    bufferLayout,
    fields: schema.fields,
    metadata: new Map(schema.metadata),
    sourceInfo: getPackedGPURecordBatchSourceInfo(batchGroup),
    nullCount: batchGroup.reduce((nullCount, batch) => nullCount + batch.nullCount, 0)
  });
}

function getPackedGPURecordBatchSourceInfo(
  batchGroup: GPURecordBatch[]
): GPURecordBatchSourceInfo | undefined {
  const firstSourceInfo = batchGroup[0]?.sourceInfo;
  if (!firstSourceInfo) {
    return undefined;
  }

  let sourceRowCount = firstSourceInfo.sourceRowCount;
  let nextSourceRowIndex = firstSourceInfo.sourceRowIndexOffset + firstSourceInfo.sourceRowCount;
  for (const batch of batchGroup.slice(1)) {
    const sourceInfo = batch.sourceInfo;
    if (
      !sourceInfo ||
      sourceInfo.sourceBatchIndex !== firstSourceInfo.sourceBatchIndex ||
      sourceInfo.sourceRowIndexOffset !== nextSourceRowIndex
    ) {
      return undefined;
    }
    sourceRowCount += sourceInfo.sourceRowCount;
    nextSourceRowIndex += sourceInfo.sourceRowCount;
  }

  return {
    sourceBatchIndex: firstSourceInfo.sourceBatchIndex,
    sourceRowIndexOffset: firstSourceInfo.sourceRowIndexOffset,
    sourceRowCount
  };
}

function getGPURecordBatchDevice<T extends GPUTypeMap>(batch: GPURecordBatch<T>) {
  const firstData = Object.values(batch.gpuData)[0];
  if (!firstData) {
    throw new Error('GPUTable cannot pack an empty GPU record batch');
  }
  return firstData.buffer.device;
}

function getGPUDataCopyByteLength(data: GPUData): number {
  if (data.length === 0) {
    return 0;
  }
  return (data.length - 1) * data.byteStride + data.rowByteLength;
}

function getGPUDataConcreteBuffer(data: GPUData): Buffer {
  return data.buffer instanceof DynamicBuffer ? data.buffer.buffer : data.buffer;
}

function assertCompatibleGPURecordBatch<T extends GPUTypeMap>(
  table: GPUTable<T>,
  batch: GPURecordBatch<T>
): void {
  if (!deepEqualBufferLayouts(table.bufferLayout, batch.bufferLayout)) {
    throw new Error('GPUTable.addBatch() requires matching buffer layouts');
  }
  assertMatchingGPURecordBatchSchema(
    getGPUTableVaryingSchema(table),
    batch.schema,
    'GPUTable.addBatch()'
  );
}

function assertCompatibleGPURecordBatches<T extends GPUTypeMap>(
  batches: GPURecordBatch<T>[]
): void {
  const firstBatch = batches[0];
  if (!firstBatch) {
    return;
  }
  for (const batch of batches.slice(1)) {
    if (!deepEqualBufferLayouts(firstBatch.bufferLayout, batch.bufferLayout)) {
      throw new Error('GPUTable batches constructor requires matching buffer layouts');
    }
    assertMatchingGPURecordBatchSchema(
      firstBatch.schema,
      batch.schema,
      'GPUTable batches constructor'
    );
  }
}

function assertMatchingGPURecordBatchSchema<T extends GPUTypeMap>(
  expectedSchema: GPUSchema<T>,
  candidateSchema: GPUSchema<T>,
  ownerName: string
): void {
  if (expectedSchema.fields.length !== candidateSchema.fields.length) {
    throw new Error(ownerName + ' requires matching selected schema fields');
  }
  for (let fieldIndex = 0; fieldIndex < expectedSchema.fields.length; fieldIndex++) {
    const tableField = expectedSchema.fields[fieldIndex];
    const batchField = candidateSchema.fields[fieldIndex];
    if (
      !batchField ||
      tableField.name !== batchField.name ||
      tableField.format !== batchField.format
    ) {
      throw new Error(ownerName + ' requires matching selected schema fields');
    }
  }
}

function deepEqualBufferLayouts(
  expectedBufferLayout: BufferLayout[],
  candidateBufferLayout: BufferLayout[]
): boolean {
  return JSON.stringify(expectedBufferLayout) === JSON.stringify(candidateBufferLayout);
}

function normalizeSelectedColumnNames<T extends GPUTypeMap>(
  table: GPUTable<T>,
  columnNames: string[]
): string[] {
  const knownColumnNames = new Set(table.schema.fields.map(field => field.name));
  const selectedColumnNames = Array.from(new Set(columnNames));
  for (const columnName of selectedColumnNames) {
    if (!knownColumnNames.has(columnName)) {
      throw new Error(`GPUTable column "${columnName}" does not exist`);
    }
  }
  return selectedColumnNames;
}

function assertGPUTableColumn<T extends GPUTypeMap>(table: GPUTable<T>, columnName: string): void {
  if (!table.schema.fields.some(field => field.name === columnName)) {
    throw new Error(`GPUTable column "${columnName}" does not exist`);
  }
}

function rebuildGPUTableColumns<T extends GPUTypeMap>(
  table: GPUTable<T>,
  columnNames: string[]
): void {
  const selectedColumnSet = new Set(columnNames);
  const selectedLayouts = columnNames
    .map(columnName => table.bufferLayout.find(layout => layout.name === columnName))
    .filter((layout): layout is BufferLayout => Boolean(layout));
  const selectedFields = columnNames
    .map(columnName => table.schema.fields.find(field => field.name === columnName))
    .filter((field): field is GPUField => Boolean(field));

  table.bufferLayout.splice(0, table.bufferLayout.length, ...selectedLayouts);
  table.schema = {
    fields: selectedFields,
    metadata: new Map(table.schema.metadata)
  };
  table.numCols = selectedFields.length;

  for (const name of Object.keys(table.gpuVectors)) {
    if (!selectedColumnSet.has(name)) {
      delete table.gpuVectors[name];
    }
  }
  for (const name of Object.keys(table.gpuConstants)) {
    if (!selectedColumnSet.has(name)) {
      delete table.gpuConstants[name];
    }
  }
  synchronizeGPUColumns(table);
}

function rebuildGPURecordBatchColumns<T extends GPUTypeMap>(
  batch: GPURecordBatch<T>,
  columnNames: string[]
): void {
  const selectedColumnSet = new Set(columnNames);
  const selectedLayouts = columnNames
    .map(columnName => batch.bufferLayout.find(layout => layout.name === columnName))
    .filter((layout): layout is BufferLayout => Boolean(layout));
  const selectedFields = columnNames
    .map(columnName => batch.schema.fields.find(field => field.name === columnName))
    .filter((field): field is GPUField => Boolean(field));

  for (const name of Object.keys(batch.gpuData)) {
    if (!selectedColumnSet.has(name)) {
      delete batch.gpuData[name];
    }
  }
  batch.bufferLayout.splice(0, batch.bufferLayout.length, ...selectedLayouts);
  batch.schema = {
    fields: selectedFields,
    metadata: new Map(batch.schema.metadata)
  };
  batch.numCols = selectedFields.length;
}

function normalizeGPUColumns(
  columns: Record<string, GPUVector | GPUConstant> | GPUVector[]
): Record<string, GPUVector | GPUConstant> {
  const normalizedColumns = Array.isArray(columns)
    ? Object.fromEntries(columns.map(vector => [vector.name, vector]))
    : columns;
  for (const [columnName, column] of Object.entries(normalizedColumns)) {
    if (column instanceof GPUVector && column.name !== columnName) {
      throw new Error(
        `GPUTable column name "${columnName}" does not match GPUVector.name "${column.name}"`
      );
    }
    if (isGPUTableIndexColumnName(columnName) && column instanceof GPUConstant) {
      throw new Error('GPUTable reserved index column "indices" cannot be constant');
    }
  }
  return normalizedColumns;
}

function getGPUColumnFields(
  columns: Record<string, GPUVector | GPUConstant>,
  vectorFields: GPUField[]
): GPUField[] {
  const vectorFieldMap = new Map(vectorFields.map(field => [field.name, field]));
  return Object.entries(columns).map(([columnName, column]) => {
    if (column instanceof GPUConstant) {
      return {
        name: columnName,
        format: column.format,
        nullable: false,
        metadata: new Map()
      };
    }
    const field = vectorFieldMap.get(columnName);
    if (!field) {
      throw new Error(`GPUTable cannot synthesize field "${columnName}"`);
    }
    return field;
  });
}

function getGPUConstantFields(constants: Record<string, GPUConstant>): GPUField[] {
  return getGPUColumnFields(constants, []);
}

function getGPUTableRowCount(
  inferredNumRows: number,
  gpuVectors: Record<string, GPUVector>,
  explicitNumRows?: number
): number {
  if (
    explicitNumRows !== undefined &&
    (!Number.isInteger(explicitNumRows) || explicitNumRows < 0)
  ) {
    throw new Error('GPUTable columns constructor requires numRows to be a non-negative integer');
  }
  if (Object.keys(gpuVectors).length === 0) {
    if (explicitNumRows === undefined) {
      throw new Error('GPUTable columns constructor requires numRows for an all-constant table');
    }
    return explicitNumRows;
  }
  if (explicitNumRows !== undefined && explicitNumRows !== inferredNumRows) {
    throw new Error('GPUTable columns constructor numRows must match varying columns');
  }
  return inferredNumRows;
}

function synchronizeGPUColumns<T extends GPUTypeMap>(table: GPUTable<T>): void {
  for (const name of Object.keys(table.gpuColumns)) {
    delete table.gpuColumns[name];
  }
  Object.assign(table.gpuColumns, table.gpuVectors, table.gpuConstants);
}

function getGPUTableVaryingSchema<T extends GPUTypeMap>(table: GPUTable<T>): GPUSchema<T> {
  return {
    fields: table.schema.fields.filter(field => !table.gpuConstants[field.name]),
    metadata: new Map(table.schema.metadata)
  };
}

function getGPUVectorBufferLayout(
  gpuVectors: Record<string, GPUVector>,
  allowVariableLengthWithoutLayout = false
): BufferLayout[] {
  return Object.values(gpuVectors).flatMap(vector =>
    isGPUTableIndexColumnName(vector.name)
      ? []
      : synthesizeGPUVectorBufferLayout(vector, allowVariableLengthWithoutLayout)
  );
}

function synthesizeGPUVectorBufferLayout(
  vector: GPUVector,
  allowVariableLengthWithoutLayout: boolean
): BufferLayout[] {
  if (vector.bufferLayout) {
    return [vector.bufferLayout];
  }
  if (!vector.format) {
    throw new Error(
      'GPUTable cannot synthesize a buffer layout for vector "' + vector.name + '" without a format'
    );
  }
  if (isVertexListGPUVectorFormat(vector.format)) {
    if (allowVariableLengthWithoutLayout) {
      return [];
    }
    throw new Error(
      'GPUTable cannot synthesize a generic buffer layout for vertex-list vector "' +
        vector.name +
        '"'
    );
  }
  if (isValueListGPUVectorFormat(vector.format)) {
    if (allowVariableLengthWithoutLayout) {
      return [];
    }
    throw new Error(
      'GPUTable cannot synthesize a generic buffer layout for value-list vector "' +
        vector.name +
        '"'
    );
  }
  return [
    {
      name: vector.name,
      byteStride: vector.byteStride,
      format: getGPUVectorElementFormat(vector.format) as VertexFormat
    }
  ];
}

function getGPUVectorFields(gpuVectors: Record<string, GPUVector>): GPUField[] {
  return Object.values(gpuVectors).map(vector => {
    if (!vector.format) {
      if (vector.bufferLayout) {
        return {name: vector.name, nullable: false, metadata: new Map()};
      }
      throw new Error(
        'GPUTable cannot synthesize a schema field for vector "' +
          vector.name +
          '" without a format'
      );
    }
    return {
      name: vector.name,
      format: vector.format,
      nullable: false,
      metadata: new Map()
    };
  });
}

function createGPURecordBatchesFromVectors(
  gpuVectors: Record<string, GPUVector>,
  bufferLayout: BufferLayout[],
  fields: GPUField[],
  metadata: Map<string, string> | undefined,
  sourceInfo: GPURecordBatchSourceInfo | undefined,
  nullCount: number
): GPURecordBatch[] {
  const vectors = Object.values(gpuVectors);
  const batchCount = vectors[0]?.data.length ?? 0;
  for (const vector of vectors) {
    validateGPUVectorChunks(vector);
    if (vector.data.length !== batchCount) {
      throw new Error('GPUTable vectors constructor requires matching GPUData chunk counts');
    }
  }
  if (batchCount !== 1 && (sourceInfo || nullCount > 0)) {
    throw new Error(
      'GPUTable vectors constructor supports sourceInfo and nullCount only with one GPUData chunk'
    );
  }

  const batches: GPURecordBatch[] = [];
  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const gpuData: Record<string, GPUData> = {};
    let numRows: number | undefined;
    for (const [columnName, vector] of Object.entries(gpuVectors)) {
      const data = vector.data[batchIndex];
      if (!data) {
        throw new Error(
          'GPUTable vectors constructor is missing GPUData chunk for "' + columnName + '"'
        );
      }
      if (numRows === undefined) {
        numRows = data.length;
      } else if (data.length !== numRows) {
        throw new Error(
          'GPUTable vectors constructor requires matching row counts in batch ' + batchIndex
        );
      }
      gpuData[columnName] = data;
    }
    batches.push(
      new GPURecordBatch({
        gpuData,
        bufferLayout,
        fields,
        metadata,
        ...(sourceInfo ? {sourceInfo} : {}),
        nullCount
      })
    );
  }
  return batches;
}

function validateGPUVectorChunks(vector: GPUVector): void {
  for (const data of vector.data) {
    if (
      data.format !== vector.format ||
      data.stride !== vector.stride ||
      data.byteStride !== vector.byteStride ||
      data.rowByteLength !== vector.rowByteLength
    ) {
      throw new Error(
        'GPUTable vectors constructor requires compatible GPUData chunks for "' + vector.name + '"'
      );
    }
  }
}

function getColumnBufferLayout(
  bufferLayout: BufferLayout[],
  columnName: string
): BufferLayout | undefined {
  const layout = bufferLayout.find(candidateLayout => candidateLayout.name === columnName);
  return layout?.attributes ? layout : undefined;
}
