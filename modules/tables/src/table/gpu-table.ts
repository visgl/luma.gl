// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type BufferLayout} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';
import {GPUVector} from './gpu-vector';
import {GPURecordBatch} from './gpu-record-batch';
import {createGPUVectorCollection} from './gpu-vector-collection';

/** Props retained as a migration alias for Arrow appendable-table adapters. */
export type GPUTableAppendableProps = never;

/** Options for constructing a GPU table from existing GPU vectors. */
export type GPUTableFromVectorsProps = {
  /** GPU vectors keyed by name, or a list of named GPU vectors. */
  vectors: Record<string, GPUVector> | GPUVector[];
  /** Optional table-level schema metadata. */
  metadata?: Map<string, string>;
  /** Number of null rows in the generated GPU table. */
  nullCount?: number;
};

/** Options for constructing a GPU table from already-built record batches. */
export type GPUTableFromBatchesProps = {
  /** GPU batches preserved by the table. */
  batches: GPURecordBatch[];
  /** Selected schema fields and metadata for the table. */
  schema: arrow.Schema;
  /** Optional layout retained when `batches` is empty. */
  bufferLayout?: BufferLayout[];
  /** Explicit row count retained when `batches` is empty. */
  numRows?: number;
  /** Explicit null count retained when `batches` is empty. */
  nullCount?: number;
};

/** Generic GPU table construction props. */
export type GPUTableProps = GPUTableFromVectorsProps | GPUTableFromBatchesProps;

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
export class GPUTable {
  /** GPU-facing schema for the selected columns. */
  schema: arrow.Schema;
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
  /** Model-ready attribute buffers keyed by shader attribute name. */
  readonly attributes: Record<string, Buffer | DynamicBuffer> = {};
  /** Model-ready storage bindings keyed by shader binding name. */
  readonly bindings: Record<string, Buffer | DynamicBuffer> = {};
  /** Preserved batch-local GPU storage. */
  readonly batches: GPURecordBatch[] = [];

  constructor(props: GPUTableProps) {
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

    const {vectors, metadata, nullCount = 0} = props;
    const vectorCollection = createGPUVectorCollection({
      ownerName: 'GPUTable',
      vectors
    });
    const batch = new GPURecordBatch({
      vectors: vectorCollection.gpuVectors,
      bufferLayout: vectorCollection.bufferLayout,
      fields: vectorCollection.fields,
      metadata,
      nullCount
    });

    this.numRows = vectorCollection.numRows;
    this.nullCount = nullCount;
    this.schema = new arrow.Schema(vectorCollection.fields, metadata);
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

    const batchGroups = createGPUPackGroups(this.batches, options.minBatchSize);
    const nextBatches: GPURecordBatch[] = [];
    const supersededBatches: GPURecordBatch[] = [];

    for (const batchGroup of batchGroups) {
      if (batchGroup.length === 1) {
        nextBatches.push(batchGroup[0]);
        continue;
      }
      nextBatches.push(createPackedGPURecordBatch(batchGroup, this.bufferLayout, this.schema));
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
    this.rebuildAggregateVectors();
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

    const detachedVector = new GPUVector({
      type: 'data',
      name: columnName,
      dataType: firstVector.type,
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

    const remainingColumnNames = this.bufferLayout
      .map(layout => layout.name)
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
      const aggregateVector = new GPUVector({
        type: 'data',
        name: vectorName,
        dataType: firstVector.type,
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
  schema: arrow.Schema
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
      (totalByteLength, vector) => totalByteLength + vector.length * vector.byteStride,
      0
    );
    const buffer = device.createBuffer({
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      byteLength
    });
    let destinationOffset = 0;
    for (const vector of sourceVectors) {
      const copyByteLength = getGPUVectorCopyByteLength(vector);
      if (copyByteLength > 0) {
        commandEncoder.copyBufferToBuffer({
          sourceBuffer:
            vector.buffer instanceof DynamicBuffer ? vector.buffer.buffer : vector.buffer,
          sourceOffset: vector.byteOffset,
          destinationBuffer: buffer,
          destinationOffset,
          size: copyByteLength
        });
      }
      destinationOffset += vector.length * vector.byteStride;
    }

    packedVectors[layout.name] = firstVector.bufferLayout
      ? new GPUVector({
          type: 'interleaved',
          name: firstVector.name,
          buffer,
          dataType: firstVector.type,
          length: sourceVectors.reduce((length, vector) => length + vector.length, 0),
          byteStride: firstVector.byteStride,
          attributes: firstVector.bufferLayout.attributes ?? [],
          ownsBuffer: true
        })
      : new GPUVector({
          type: 'buffer',
          name: firstVector.name,
          buffer,
          dataType: firstVector.type,
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
    nullCount: batchGroup.reduce((nullCount, batch) => nullCount + batch.nullCount, 0)
  });
}

function getGPURecordBatchDevice(batch: GPURecordBatch) {
  const firstVector = Object.values(batch.gpuVectors)[0];
  if (!firstVector) {
    throw new Error('GPUTable cannot pack an empty GPU record batch');
  }
  return firstVector.buffer.device;
}

function getGPUVectorCopyByteLength(vector: GPUVector): number {
  if (vector.length === 0) {
    return 0;
  }
  return (vector.length - 1) * vector.byteStride + vector.rowByteLength;
}

function assertCompatibleGPURecordBatch(table: GPUTable, batch: GPURecordBatch): void {
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
      !arrow.util.compareTypes(tableField.type, batchField.type)
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

function normalizeSelectedColumnNames(table: GPUTable, columnNames: string[]): string[] {
  const knownColumnNames = new Set(table.bufferLayout.map(layout => layout.name));
  const selectedColumnNames = Array.from(new Set(columnNames));
  for (const columnName of selectedColumnNames) {
    if (!knownColumnNames.has(columnName)) {
      throw new Error(`GPUTable column "${columnName}" does not exist`);
    }
  }
  return selectedColumnNames;
}

function assertGPUTableColumn(table: GPUTable, columnName: string): void {
  if (!table.bufferLayout.some(layout => layout.name === columnName)) {
    throw new Error(`GPUTable column "${columnName}" does not exist`);
  }
}

function rebuildGPUTableColumns(table: GPUTable, columnNames: string[]): void {
  const selectedColumnSet = new Set(columnNames);
  const selectedLayouts = columnNames
    .map(columnName => table.bufferLayout.find(layout => layout.name === columnName))
    .filter((layout): layout is BufferLayout => Boolean(layout));
  const selectedFields = columnNames
    .map(columnName => table.schema.fields.find(field => field.name === columnName))
    .filter((field): field is arrow.Field => Boolean(field));

  table.bufferLayout.splice(0, table.bufferLayout.length, ...selectedLayouts);
  table.schema = new arrow.Schema(selectedFields, new Map(table.schema.metadata));
  table.numCols = selectedFields.length;

  for (const name of Object.keys(table.gpuVectors)) {
    if (!selectedColumnSet.has(name)) {
      delete table.gpuVectors[name];
    }
  }
}

function rebuildGPURecordBatchColumns(batch: GPURecordBatch, columnNames: string[]): void {
  const selectedColumnSet = new Set(columnNames);
  const selectedLayouts = columnNames
    .map(columnName => batch.bufferLayout.find(layout => layout.name === columnName))
    .filter((layout): layout is BufferLayout => Boolean(layout));
  const selectedFields = columnNames
    .map(columnName => batch.schema.fields.find(field => field.name === columnName))
    .filter((field): field is arrow.Field => Boolean(field));

  for (const name of Object.keys(batch.gpuVectors)) {
    if (!selectedColumnSet.has(name)) {
      delete batch.gpuVectors[name];
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
    if (layout.attributes) {
      for (const attribute of layout.attributes) {
        batch.attributes[attribute.attribute] = vector.buffer;
      }
    } else {
      batch.attributes[layout.name] = vector.buffer;
    }
  }

  batch.bufferLayout.splice(0, batch.bufferLayout.length, ...selectedLayouts);
  batch.schema = new arrow.Schema(selectedFields, new Map(batch.schema.metadata));
  batch.numCols = selectedFields.length;
}
