// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Device, type BufferLayout, type ShaderLayout} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';
import {getArrowFieldByPath, getArrowVectorByPath} from './arrow-paths';
import {getArrowBufferLayout, type ArrowVertexFormatOptions} from './arrow-shader-layout';
import type {AttributeArrowType} from './arrow-types';
import {GPUVector, type GPUVectorProps} from './arrow-gpu-vector';
import {GPURecordBatch, type GPURecordBatchAppendableProps} from './arrow-gpu-record-batch';
import {createGPUVectorCollection} from './arrow-gpu-vector-collection';
import {getArrowTypeByteStride} from './arrow-gpu-data';

/** Options for creating GPU buffers from shader-compatible Arrow table columns. */
export type GPUTableProps = ArrowVertexFormatOptions & {
  /** Shader layout that selects which Arrow columns should be uploaded. */
  shaderLayout: ShaderLayout;
  /** Maps shader attribute names to Arrow column paths. Defaults to using the attribute name. */
  arrowPaths?: Record<string, string>;
  /** Buffer props applied to every Arrow-backed GPU vector. */
  bufferProps?: GPUVectorProps;
};

/** Options for constructing an {@link GPUTable} from existing GPU vectors. */
export type GPUTableFromVectorsProps = {
  /** GPU vectors keyed by name, or a list of named GPU vectors. */
  vectors: Record<string, GPUVector> | GPUVector[];
  /** Optional table-level schema metadata. */
  metadata?: Map<string, string>;
  /** Number of null rows in the generated GPU table. */
  nullCount?: number;
};

/** Options for constructing a table with one appendable trailing GPU batch. */
export type GPUTableAppendableProps = Omit<GPURecordBatchAppendableProps, 'type'> & {
  /** Discriminator for appendable table construction. */
  type: 'appendable';
};

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

/**
 * GPU memory and Arrow schema metadata derived from selected Arrow table columns.
 *
 * The Arrow table is a construction input only. GPUTable does not retain
 * the source table; it owns GPU buffers, a BufferLayout, and a GPU-facing Arrow
 * schema that describes the selected columns.
 */
export class GPUTable {
  /** GPU-facing schema for the selected shader attribute columns. */
  schema: arrow.Schema;
  /** Number of rows in the source Arrow table at construction time. */
  numRows: number;
  /** Number of selected GPU columns in {@link schema}. */
  numCols: number;
  /** Number of null rows in the source Arrow table at construction time. */
  nullCount: number;
  /** Buffer layout derived from the selected Arrow columns and shader layout. */
  readonly bufferLayout: BufferLayout[] = [];
  /** GPU vectors keyed by shader attribute name. */
  readonly gpuVectors: Record<string, GPUVector> = {};
  /** Model-ready attribute buffers keyed by shader attribute name. */
  readonly attributes: Record<string, Buffer | DynamicBuffer> = {};
  /** GPU record batches preserving source Arrow table batch boundaries. */
  readonly batches: GPURecordBatch[] = [];

  /** Creates GPU buffers and a GPU-facing schema from an Arrow table. */
  constructor(device: Device, table: arrow.Table, props: GPUTableProps);
  /** Creates a GPU-facing table from existing named GPU vectors. */
  constructor(props: GPUTableFromVectorsProps);
  /** Creates an empty table with one appendable trailing GPU batch. */
  constructor(props: GPUTableAppendableProps);
  constructor(
    deviceOrProps: Device | GPUTableFromVectorsProps | GPUTableAppendableProps,
    table?: arrow.Table,
    props?: GPUTableProps
  ) {
    if (!(deviceOrProps instanceof Device)) {
      if ('type' in deviceOrProps && deviceOrProps.type === 'appendable') {
        const batch = new GPURecordBatch({
          ...deviceOrProps,
          type: 'appendable'
        });
        this.numRows = 0;
        this.nullCount = 0;
        this.schema = new arrow.Schema(batch.schema.fields, new Map(deviceOrProps.schema.metadata));
        this.numCols = batch.numCols;
        this.bufferLayout.push(...batch.bufferLayout);
        this.batches.push(batch);
        this.rebuildAggregateVectors();
        return;
      }

      const {vectors, metadata, nullCount = 0} = deviceOrProps;
      const vectorCollection = createGPUVectorCollection({
        ownerName: 'GPUTable',
        vectors
      });

      this.numRows = vectorCollection.numRows;
      this.nullCount = nullCount;
      Object.assign(this.gpuVectors, vectorCollection.gpuVectors);
      Object.assign(this.attributes, vectorCollection.attributes);
      this.bufferLayout.push(...vectorCollection.bufferLayout);

      this.schema = new arrow.Schema(vectorCollection.fields, metadata);
      this.numCols = vectorCollection.fields.length;
      this.batches.push(
        new GPURecordBatch({
          vectors: vectorCollection.gpuVectors,
          bufferLayout: this.bufferLayout,
          fields: vectorCollection.fields,
          metadata,
          nullCount
        })
      );
      return;
    }

    const device = deviceOrProps;
    props = props!;
    table = table!;
    this.numRows = table.numRows;
    this.nullCount = table.nullCount;
    this.bufferLayout = getArrowBufferLayout(props.shaderLayout, {
      arrowTable: table,
      arrowPaths: props.arrowPaths,
      allowWebGLOnlyFormats: props.allowWebGLOnlyFormats
    });

    const fields: arrow.Field[] = [];
    for (const bufferLayout of this.bufferLayout) {
      const arrowPath = props.arrowPaths?.[bufferLayout.name] || bufferLayout.name;
      const vector = getArrowVectorByPath(table, arrowPath);
      const sourceField = getArrowFieldByPath(table, arrowPath);
      const field = new arrow.Field(
        bufferLayout.name,
        vector.type,
        sourceField.nullable,
        new Map(sourceField.metadata)
      );
      fields.push(field);
    }

    this.schema = new arrow.Schema(fields, new Map(table.schema.metadata));
    this.numCols = this.schema.fields.length;
    for (const recordBatch of table.batches) {
      this.batches.push(new GPURecordBatch(device, recordBatch, props));
    }
    this.rebuildAggregateVectors();
  }

  /**
   * Replaces preserved GPU batches with fewer packed batches.
   *
   * New packed batches own their destination buffers. Superseded source batches
   * are destroyed after GPU copies are submitted, which only releases buffers
   * owned by those source vectors.
   */
  packBatches(options: GPUTablePackBatchesOptions = {}): this {
    if (this.batches.length <= 1) {
      return this;
    }

    const batchGroups = createArrowGPUPackGroups(this.batches, options.minBatchSize);
    const nextBatches: GPURecordBatch[] = [];
    const supersededBatches: GPURecordBatch[] = [];

    for (const batchGroup of batchGroups) {
      if (batchGroup.length === 1) {
        nextBatches.push(batchGroup[0]);
        continue;
      }
      nextBatches.push(createPackedArrowGPURecordBatch(batchGroup, this.bufferLayout, this.schema));
      supersededBatches.push(...batchGroup);
    }

    if (supersededBatches.length === 0) {
      return this;
    }

    this.batches.splice(0, this.batches.length, ...nextBatches);
    this.rebuildAggregateVectors();
    for (const batch of supersededBatches) {
      batch.destroy();
    }
    return this;
  }

  /**
   * Adds one already-created GPU record batch to this table.
   *
   * Ownership remains on the supplied batch and its vectors. The table only
   * incorporates that batch into its aggregate metadata and will later call the
   * batch's regular `destroy()` path when the table itself is destroyed.
   */
  addBatch(batch: GPURecordBatch): this {
    assertCompatibleArrowGPURecordBatch(this, batch);
    this.batches.push(batch);
    this.numRows += batch.numRows;
    this.nullCount += batch.nullCount;
    this.rebuildAggregateVectors();
    return this;
  }

  /**
   * Appends Arrow rows into the current trailing appendable GPU batch.
   *
   * Arrow tables are consumed batch-by-batch so one mutable trailing GPU batch
   * can absorb synchronous incremental table arrivals without changing table
   * ownership.
   */
  addToLastBatch(recordBatchOrTable: arrow.RecordBatch | arrow.Table): this {
    if (recordBatchOrTable instanceof arrow.Table) {
      for (const recordBatch of recordBatchOrTable.batches) {
        this.addToLastBatch(recordBatch);
      }
      return this;
    }

    const lastBatch = this.batches[this.batches.length - 1];
    if (!lastBatch) {
      throw new Error('GPUTable.addToLastBatch() requires an existing trailing batch');
    }
    lastBatch.addToLastBatch(recordBatchOrTable);
    this.numRows += recordBatchOrTable.numRows;
    this.nullCount += recordBatchOrTable.nullCount;
    this.rebuildAggregateVectors();
    return this;
  }

  /** Clears only the current trailing appendable GPU batch while retaining its allocations. */
  resetLastBatch(): this {
    const lastBatch = this.batches[this.batches.length - 1];
    if (!lastBatch) {
      throw new Error('GPUTable.resetLastBatch() requires an existing trailing batch');
    }
    this.numRows -= lastBatch.numRows;
    this.nullCount -= lastBatch.nullCount;
    lastBatch.resetLastBatch();
    this.rebuildAggregateVectors();
    return this;
  }

  /**
   * Keeps only the requested columns and destroys the dropped batch-local vectors.
   *
   * Use {@link detachVector} first when a removed column should stay alive.
   */
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
      rebuildArrowGPURecordBatchColumns(batch, selectedColumnNames);
    }

    rebuildArrowGPUTableColumns(this, selectedColumnNames);
    this.rebuildAggregateVectors();
    return this;
  }

  /**
   * Removes one column and returns an aggregate GPU vector that now owns its detached batch vectors.
   */
  detachVector(columnName: string): GPUVector {
    assertArrowGPUTableColumn(this, columnName);
    const detachedVectors = this.batches.map(batch => batch.gpuVectors[columnName]);
    const firstVector = detachedVectors[0];
    if (!firstVector) {
      throw new Error(`GPUTable.detachVector() column "${columnName}" has no GPU data`);
    }

    const detachedVector = new GPUVector({
      type: 'data',
      name: columnName,
      arrowType: firstVector.type,
      data: [...firstVector.data],
      byteStride: firstVector.byteStride,
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
      rebuildArrowGPURecordBatchColumns(batch, remainingColumnNames);
    }
    rebuildArrowGPUTableColumns(this, remainingColumnNames);
    this.rebuildAggregateVectors();
    return detachedVector;
  }

  /**
   * Removes and returns a half-open range of GPU record batches.
   *
   * Detached batches retain their own vector ownership and are no longer
   * destroyed by this table.
   */
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
    this.numRows -= detachedBatches.reduce((numRows, batch) => numRows + batch.numRows, 0);
    this.nullCount -= detachedBatches.reduce((nullCount, batch) => nullCount + batch.nullCount, 0);
    this.rebuildAggregateVectors();
    return detachedBatches;
  }

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

    const firstBatch = this.batches[0];
    if (!firstBatch) {
      return;
    }
    if (this.batches.length === 1) {
      Object.assign(this.gpuVectors, firstBatch.gpuVectors);
      Object.assign(this.attributes, firstBatch.attributes);
      return;
    }

    for (const bufferLayout of this.bufferLayout) {
      const batchVectors = this.batches.map(batch => batch.gpuVectors[bufferLayout.name]);
      const firstVector = batchVectors[0];
      if (!firstVector) {
        throw new Error(`GPUTable batch is missing GPU vector "${bufferLayout.name}"`);
      }
      const aggregateVector = new GPUVector({
        type: 'data',
        name: bufferLayout.name,
        arrowType: firstVector.type,
        data: [...firstVector.data],
        byteStride: firstVector.byteStride,
        bufferLayout: firstVector.bufferLayout
      });
      for (const batchVector of batchVectors.slice(1)) {
        for (const data of batchVector.data) {
          aggregateVector.addData(data);
        }
      }
      this.gpuVectors[bufferLayout.name] = aggregateVector;
    }

    Object.assign(this.attributes, firstBatch.attributes);
  }
}

function createArrowGPUPackGroups(
  batches: GPURecordBatch[],
  minBatchSize?: number
): GPURecordBatch[][] {
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

function createPackedArrowGPURecordBatch(
  batchGroup: GPURecordBatch[],
  bufferLayout: BufferLayout[],
  schema: arrow.Schema
): GPURecordBatch {
  const firstBatch = batchGroup[0];
  const device = getArrowGPURecordBatchDevice(firstBatch);
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
      const copyByteLength = getArrowGPUVectorCopyByteLength(vector);
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
          length: sourceVectors.reduce((length, vector) => length + vector.length, 0),
          byteStride: firstVector.byteStride,
          attributes: firstVector.bufferLayout.attributes ?? [],
          ownsBuffer: true
        })
      : new GPUVector({
          type: 'buffer',
          name: firstVector.name,
          buffer,
          arrowType: firstVector.type as AttributeArrowType,
          length: sourceVectors.reduce((length, vector) => length + vector.length, 0),
          byteStride: firstVector.byteStride,
          ownsBuffer: true
        } as any);
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

function getArrowGPURecordBatchDevice(batch: GPURecordBatch): Device {
  const firstVector = Object.values(batch.gpuVectors)[0];
  if (!firstVector) {
    throw new Error('GPUTable cannot pack an empty GPU record batch');
  }
  return firstVector.buffer.device;
}

function getArrowGPUVectorCopyByteLength(vector: GPUVector): number {
  if (vector.length === 0) {
    return 0;
  }
  const rowByteWidth = vector.bufferLayout
    ? vector.byteStride
    : getArrowTypeByteStride(vector.type);
  return (vector.length - 1) * vector.byteStride + rowByteWidth;
}

function assertCompatibleArrowGPURecordBatch(table: GPUTable, batch: GPURecordBatch): void {
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

function assertArrowGPUTableColumn(table: GPUTable, columnName: string): void {
  if (!table.bufferLayout.some(layout => layout.name === columnName)) {
    throw new Error(`GPUTable column "${columnName}" does not exist`);
  }
}

function rebuildArrowGPUTableColumns(table: GPUTable, columnNames: string[]): void {
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

function rebuildArrowGPURecordBatchColumns(batch: GPURecordBatch, columnNames: string[]): void {
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
