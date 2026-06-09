// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Binding, type BufferLayout} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUField, GPUSchema, GPUTypeMap} from './gpu-schema';
import type {GPUData} from './gpu-data';
import {GPUVector} from './gpu-vector';
import {GPURecordBatch, type GPURecordBatchSourceInfo} from './gpu-record-batch';
import {createGPUVectorCollection} from './gpu-vector-collection';
import {GPU_TABLE_INDEX_COLUMN_NAME} from './gpu-schema';

type GPUVectorMap<T extends GPUTypeMap = GPUTypeMap> = {
  [Name in keyof T & string]: GPUVector<T[Name]>;
};

/** Options for constructing a GPU table from existing GPU vectors. */
export type GPUTableFromVectorsProps<T extends GPUTypeMap = GPUTypeMap> = {
  /** GPU vectors keyed by name, or a list of named GPU vectors. */
  vectors: GPUVectorMap<T> | Record<string, GPUVector> | GPUVector[];
  /** Optional model-ready storage bindings keyed by shader binding name. */
  bindings?: Record<string, Binding | DynamicBuffer>;
  /** Optional table-level schema metadata. */
  metadata?: Map<string, string>;
  /** Optional source-row identity forwarded to the generated one-batch GPU table. */
  sourceInfo?: GPURecordBatchSourceInfo;
  /** Number of null rows in the generated GPU table. */
  nullCount?: number;
};

/** Options for constructing a GPU table from already-built record batches. */
export type GPUTableFromBatchesProps<T extends GPUTypeMap = GPUTypeMap> = {
  /** GPU batches preserved by the table. */
  batches: GPURecordBatch[];
  /** Selected schema fields and metadata for the table. */
  schema: GPUSchema<T>;
  /** Optional layout retained when `batches` is empty. */
  bufferLayout?: BufferLayout[];
  /** Explicit row count retained when `batches` is empty. */
  numRows?: number;
  /** Explicit null count retained when `batches` is empty. */
  nullCount?: number;
};

/** Generic GPU table construction props. */
export type GPUTableProps<T extends GPUTypeMap = GPUTypeMap> =
  | GPUTableFromVectorsProps<T>
  | GPUTableFromBatchesProps<T>;

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
  /** Buffer layout shared by preserved record batches. */
  readonly bufferLayout: BufferLayout[] = [];
  /** GPU vectors keyed by table/shader column name. */
  readonly gpuVectors: Record<string, GPUVector> = {};
  /** Model-ready attribute buffers keyed by buffer layout name. */
  readonly attributes: Record<string, Buffer | DynamicBuffer> = {};
  /** Model-ready storage bindings keyed by shader binding name. */
  readonly bindings: Record<string, Binding | DynamicBuffer> = {};
  /** Preserved batch-local GPU storage. */
  readonly batches: GPURecordBatch[] = [];

  /** Creates one logical GPU table from vectors or already-preserved GPU record batches. */
  constructor(props: GPUTableProps<T>) {
    if ('batches' in props) {
      this.schema = props.schema;
      this.numCols = props.schema.fields.length;
      this.batches.push(...props.batches);
      this.bufferLayout.push(...(props.bufferLayout ?? props.batches[0]?.bufferLayout ?? []));
      this.numRows =
        props.numRows ?? props.batches.reduce((numRows, batch) => numRows + batch.numRows, 0);
      this.nullCount =
        props.nullCount ??
        props.batches.reduce((nullCount, batch) => nullCount + batch.nullCount, 0);
      this.rebuildAggregateVectors();
      return;
    }

    const {vectors, bindings = {}, metadata, sourceInfo, nullCount = 0} = props;
    const vectorCollection = createGPUVectorCollection<T>({
      ownerName: 'GPUTable',
      vectors
    });
    const batch: GPURecordBatch = new GPURecordBatch<GPUTypeMap>({
      vectors: vectorCollection.gpuVectors as GPUVectorMap<T>,
      bufferLayout: vectorCollection.bufferLayout,
      fields: vectorCollection.fields,
      bindings,
      metadata,
      sourceInfo,
      nullCount
    });

    this.numRows = vectorCollection.numRows;
    this.nullCount = nullCount;
    this.schema = {
      fields: vectorCollection.fields,
      metadata: metadata ?? new Map()
    };
    this.numCols = vectorCollection.fields.length;
    this.bufferLayout.push(...vectorCollection.bufferLayout);
    this.batches.push(batch);
    this.rebuildAggregateVectors();
  }

  /** Replaces preserved GPU batches with fewer packed batches. */
  packBatches(options: GPUTablePackBatchesOptions = {}): this {
    if (this.batches.length <= 1) {
      return this;
    }
    if (this.batches.some(batch => batch.gpuVectors[GPU_TABLE_INDEX_COLUMN_NAME])) {
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
        createPackedGPURecordBatch(batchGroup, this.bufferLayout, this.schema as GPUSchema)
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

  /** Clears only the trailing appendable GPU batch while retaining its allocations. */
  resetLastBatch(): this {
    const lastBatch = this.batches[this.batches.length - 1];
    if (!lastBatch) {
      throw new Error('GPUTable.resetLastBatch() requires an existing trailing batch');
    }
    lastBatch.resetLastBatch();
    return this.refreshFromBatches();
  }

  /** Keeps only the requested columns and destroys the dropped batch-local vectors. */
  select(...columnNames: string[]): this {
    const selectedColumnNames = normalizeSelectedColumnNames(this, columnNames);
    const selectedColumnSet = new Set(selectedColumnNames);

    for (const batch of this.batches) {
      const droppedVectors = Object.entries(batch.gpuVectors)
        .filter(([name]) => !selectedColumnSet.has(name))
        .map(([, vector]) => vector);
      for (const vector of droppedVectors) {
        vector.destroy();
      }
      rebuildGPURecordBatchColumns(batch, selectedColumnNames);
    }

    rebuildGPUTableColumns(this, selectedColumnNames);
    this.rebuildAggregateVectors();
    return this;
  }

  /** Removes one column and returns an aggregate GPU vector that owns detached batch vectors. */
  detachVector(columnName: string): GPUVector {
    assertGPUTableColumn(this, columnName);
    const detachedVectors = this.batches.map(batch => batch.gpuVectors[columnName]);
    const firstVector = detachedVectors[0];
    if (!firstVector) {
      throw new Error(`GPUTable.detachVector() column "${columnName}" has no GPU data`);
    }
    if (!firstVector.format) {
      throw new Error(`GPUTable.detachVector() column "${columnName}" has no GPUVector format`);
    }

    const detachedVector = new GPUVector({
      type: 'data',
      name: columnName,
      dataType: firstVector.dataType,
      format: firstVector.format,
      data: [...firstVector.data],
      stride: firstVector.stride,
      byteStride: firstVector.byteStride,
      rowByteLength: firstVector.rowByteLength,
      bufferLayout: firstVector.bufferLayout
    });
    for (const batchVector of detachedVectors.slice(1)) {
      for (const data of batchVector.data) {
        detachedVector.addData(data);
      }
    }
    detachedVector.retainOwnedVectors(detachedVectors);

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
    for (const name of Object.keys(this.attributes)) {
      delete this.attributes[name];
    }
    for (const name of Object.keys(this.bindings)) {
      delete this.bindings[name];
    }

    const firstBatch = this.batches[0];
    if (!firstBatch) {
      return;
    }
    if (this.batches.length === 1) {
      Object.assign(this.gpuVectors, firstBatch.gpuVectors);
      Object.assign(this.attributes, firstBatch.attributes);
      Object.assign(this.bindings, firstBatch.bindings);
      return;
    }

    for (const vectorName of Object.keys(firstBatch.gpuVectors)) {
      const batchVectors = this.batches.map(batch => batch.gpuVectors[vectorName]);
      const firstVector = batchVectors[0];
      if (!firstVector) {
        throw new Error(`GPUTable batch is missing GPU vector "${vectorName}"`);
      }
      if (!firstVector.format) {
        throw new Error(`GPUTable aggregate vector "${vectorName}" has no GPUVector format`);
      }
      const aggregateVector = new GPUVector({
        type: 'data',
        name: vectorName,
        dataType: firstVector.dataType,
        format: firstVector.format,
        data: [...firstVector.data],
        stride: firstVector.stride,
        byteStride: firstVector.byteStride,
        rowByteLength: firstVector.rowByteLength,
        bufferLayout: firstVector.bufferLayout
      });
      for (const batchVector of batchVectors.slice(1)) {
        for (const data of batchVector.data) {
          aggregateVector.addData(data);
        }
      }
      this.gpuVectors[vectorName] = aggregateVector;
    }

    Object.assign(this.attributes, firstBatch.attributes);
    Object.assign(this.bindings, firstBatch.bindings);
  }

  private trySynchronizeAggregateVectors(): boolean {
    const firstBatch = this.batches[0];
    if (!firstBatch) {
      return false;
    }

    for (const vectorName of Object.keys(firstBatch.gpuVectors)) {
      const aggregateVector = this.gpuVectors[vectorName];
      const batchVectors = this.batches.map(batch => batch.gpuVectors[vectorName]);
      if (
        !aggregateVector ||
        isBatchLocalAggregateVector(aggregateVector, vectorName, this.batches) ||
        !canSynchronizeAggregateVector(aggregateVector, batchVectors)
      ) {
        return false;
      }
    }

    for (const vectorName of Object.keys(firstBatch.gpuVectors)) {
      const aggregateVector = this.gpuVectors[vectorName];
      const batchData = getBatchVectorData(this.batches.map(batch => batch.gpuVectors[vectorName]));
      for (const data of batchData.slice(aggregateVector.data.length)) {
        aggregateVector.addData(data);
      }
    }

    for (const name of Object.keys(this.attributes)) {
      delete this.attributes[name];
    }
    for (const name of Object.keys(this.bindings)) {
      delete this.bindings[name];
    }
    Object.assign(this.attributes, firstBatch.attributes);
    Object.assign(this.bindings, firstBatch.bindings);
    return true;
  }
}

function isBatchLocalAggregateVector(
  aggregateVector: GPUVector,
  vectorName: string,
  batches: GPURecordBatch[]
): boolean {
  return batches.some(batch => batch.gpuVectors[vectorName] === aggregateVector);
}

function canSynchronizeAggregateVector(
  aggregateVector: GPUVector,
  batchVectors: Array<GPUVector | undefined>
): batchVectors is GPUVector[] {
  const firstVector = batchVectors[0];
  if (!firstVector) {
    return false;
  }
  if (
    aggregateVector.format !== firstVector.format ||
    aggregateVector.stride !== firstVector.stride ||
    aggregateVector.byteStride !== firstVector.byteStride ||
    aggregateVector.rowByteLength !== firstVector.rowByteLength ||
    aggregateVector.bufferLayout !== firstVector.bufferLayout
  ) {
    return false;
  }
  if (batchVectors.some(vector => !vector)) {
    return false;
  }

  const batchData = getBatchVectorData(batchVectors as GPUVector[]);
  if (aggregateVector.data.length > batchData.length) {
    return false;
  }
  return aggregateVector.data.every((data, index) => data === batchData[index]);
}

function getBatchVectorData(batchVectors: GPUVector[]): GPUData[] {
  return batchVectors.flatMap(vector => vector.data);
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
  schema: GPUSchema
): GPURecordBatch {
  const firstBatch = batchGroup[0];
  const device = getGPURecordBatchDevice(firstBatch);
  const commandEncoder = device.createCommandEncoder();
  const packedVectors: Record<string, GPUVector> = {};

  for (const layout of bufferLayout) {
    const sourceVectors = batchGroup.map(batch => batch.gpuVectors[layout.name]);
    const firstVector = sourceVectors[0];
    if (!firstVector) {
      throw new Error(`GPUTable batch is missing GPU vector "${layout.name}"`);
    }

    const byteLength = sourceVectors.reduce(
      (totalByteLength, vector) => totalByteLength + getGPUVectorPackedByteLength(vector),
      0
    );
    const buffer = device.createBuffer({
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      byteLength
    });
    let destinationOffset = 0;
    for (const vector of sourceVectors) {
      for (const data of vector.data) {
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
    }

    packedVectors[layout.name] = firstVector.bufferLayout
      ? new GPUVector({
          type: 'interleaved',
          name: firstVector.name,
          buffer,
          dataType: firstVector.dataType,
          format: firstVector.format,
          length: sourceVectors.reduce((length, vector) => length + vector.length, 0),
          byteStride: firstVector.byteStride,
          attributes: firstVector.bufferLayout.attributes ?? [],
          ownsBuffer: true
        })
      : new GPUVector({
          type: 'buffer',
          name: firstVector.name,
          buffer,
          dataType: firstVector.dataType,
          format: requireGPUVectorFormat(firstVector),
          length: sourceVectors.reduce((length, vector) => length + vector.length, 0),
          stride: firstVector.stride,
          byteStride: firstVector.byteStride,
          rowByteLength: firstVector.rowByteLength,
          ownsBuffer: true
        });
  }

  device.submit(commandEncoder.finish());
  return new GPURecordBatch({
    vectors: packedVectors,
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
  const firstVector = Object.values(batch.gpuVectors)[0];
  const firstData = firstVector?.data[0];
  if (!firstData) {
    throw new Error('GPUTable cannot pack an empty GPU record batch');
  }
  return firstData.buffer.device;
}

function getGPUVectorPackedByteLength(vector: GPUVector): number {
  return vector.data.reduce((byteLength, data) => byteLength + data.length * data.byteStride, 0);
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

function requireGPUVectorFormat(vector: GPUVector) {
  if (!vector.format) {
    throw new Error(`GPUVector "${vector.name}" requires a format`);
  }
  return vector.format;
}

function assertCompatibleGPURecordBatch<T extends GPUTypeMap>(
  table: GPUTable<T>,
  batch: GPURecordBatch<T>
): void {
  if (!deepEqualBufferLayouts(table.bufferLayout, batch.bufferLayout)) {
    throw new Error('GPUTable.addBatch() requires matching buffer layouts');
  }
  if (table.schema.fields.length !== batch.schema.fields.length) {
    throw new Error('GPUTable.addBatch() requires matching selected schema fields');
  }
  for (let fieldIndex = 0; fieldIndex < table.schema.fields.length; fieldIndex++) {
    const tableField = table.schema.fields[fieldIndex];
    const batchField = batch.schema.fields[fieldIndex];
    if (
      !batchField ||
      tableField.name !== batchField.name ||
      tableField.format !== batchField.format
    ) {
      throw new Error('GPUTable.addBatch() requires matching selected schema fields');
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

  for (const name of Object.keys(batch.gpuVectors)) {
    if (!selectedColumnSet.has(name)) {
      delete batch.gpuVectors[name];
    }
  }
  for (const name of Object.keys(batch.bindings)) {
    if (!selectedColumnSet.has(name)) {
      delete batch.bindings[name];
    }
  }
  for (const name of Object.keys(batch.attributes)) {
    delete batch.attributes[name];
  }
  for (const layout of selectedLayouts) {
    const vector = batch.gpuVectors[layout.name];
    if (!vector) {
      throw new Error(`GPURecordBatch column "${layout.name}" has no GPU vector`);
    }
    if (vector.data.length === 0) {
      continue;
    }
    batch.attributes[layout.name] = getSingleGPUVectorDataBuffer(vector, layout.name);
  }

  batch.bufferLayout.splice(0, batch.bufferLayout.length, ...selectedLayouts);
  batch.schema = {
    fields: selectedFields,
    metadata: new Map(batch.schema.metadata)
  };
  batch.numCols = selectedFields.length;
}

function getSingleGPUVectorDataBuffer(
  vector: GPUVector,
  attributeName: string
): Buffer | DynamicBuffer {
  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error(
      `GPURecordBatch attribute "${attributeName}" requires exactly one GPUData chunk`
    );
  }
  return data.buffer;
}
