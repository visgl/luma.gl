// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuDF.

import type {BufferLayout} from '@luma.gl/core';
import {
  GPUData,
  GPURecordBatch,
  GPUTable,
  GPUVector,
  type GPUColumn,
  type GPUField,
  type GPUSchema,
  type GPURecordBatchSourceInfo,
  type GPUTypeMap,
  type GPUVectorFormat
} from '@luma.gl/tables';
import {
  LuDataFrameQuery,
  type LuDataFrameDerivedColumnFormat,
  type LuDataFrameDerivedColumnFormatForExpression,
  type LuDataFrameDerivedColumnOptions
} from './lu-data-frame-query';
import type {LuExpression} from './lu-expression';
import type {
  LuDataFrameAggregationQuery,
  LuDataFrameGlobalAggregationDefinitions,
  LuDataFrameScalarColumnNames
} from './lu-global-aggregation-query';
import type {
  LuDataFrameColumnNamesOfFormat,
  LuDataFrameGroupByOptions,
  LuDataFrameGroupByQuery
} from './lu-group-by-query';
import type {LuDataFrameHistogramOptions, LuDataFrameHistogramQuery} from './lu-histogram-query';
import type {
  LuDataFrameJoinOptions,
  LuDataFrameJoinQuery,
  LuDataFrameLookupOptions,
  LuDataFrameLookupQuery
} from './lu-join-query';
import type {
  LuDataFrameGlobalSortQuery,
  LuDataFrameSortOptions,
  LuDataFrameSortQuery
} from './lu-sort-query';

/** Whether a dataframe borrows its source resources or releases them after its final view. */
export type LuDataFrameOwnership = 'borrowed' | 'owned';

/** One existing varying or constant GPU table column exposed by a dataframe. */
export type LuDataFrameColumn<Format extends GPUVectorFormat = GPUVectorFormat> = GPUColumn<Format>;

/** Source-row identity retained for one dataframe batch, when supplied by the source adapter. */
export type LuDataFrameSourceInfo = GPURecordBatchSourceInfo | undefined;

/** A source-row-aligned GPU validity mask for each explicitly nullable dataframe column. */
export type LuDataFrameValidity<T extends GPUTypeMap = GPUTypeMap> = Partial<{
  [Name in keyof T & string]: GPUVector<'uint32'>;
}>;

/** Adapter-owned categorical labels retained without depending on Apache Arrow. */
export type LuDataFrameDictionary =
  | readonly unknown[]
  | Readonly<{
      /** Dictionary values referenced by integer GPU column indices. */
      values: readonly unknown[];
      /** Whether the source dictionary establishes an explicit category order. */
      ordered?: boolean;
    }>;

/** Adapter-owned dictionary metadata keyed by existing dataframe column names. */
export type LuDataFrameDictionaries<T extends GPUTypeMap = GPUTypeMap> = Partial<{
  [Name in keyof T & string]: LuDataFrameDictionary;
}>;

/** Existing GPU table resources and optional explicit analytical sidecars. */
export type LuDataFrameProps<T extends GPUTypeMap = GPUTypeMap> = {
  /** Existing GPU table whose preserved batches provide dataframe storage. */
  table: GPUTable<T>;
  /** Optional, batch-aligned GPU validity masks. Missing masks remain explicitly unknown. */
  validity?: LuDataFrameValidity<T>;
  /** Optional source-adapter categorical labels. */
  dictionaries?: LuDataFrameDictionaries<T>;
  /** Ownership of the source table and supplied validity masks. Defaults to `borrowed`. */
  ownership?: LuDataFrameOwnership;
};

/** Keeps an owned source table alive until every borrowed dataframe projection is released. */
type LuDataFrameResourceLease = {
  table: Pick<GPUTable, 'destroy'>;
  validity: readonly GPUVector<'uint32'>[];
  ownsResources: boolean;
  referenceCount: number;
};

/**
 * Immutable analytical views over existing GPU-resident table columns and record batches.
 *
 * Constructing or projecting a dataframe creates only lightweight CPU metadata. Source buffers,
 * Arrow record-batch boundaries, explicit validity sidecars, and stable source-row identities are
 * retained without copying, repacking, submitting GPU work, or reading GPU data.
 */
export class LuDataFrame<T extends GPUTypeMap = GPUTypeMap> {
  /** Original table or a non-destructive table projection with borrowed GPU data chunks. */
  readonly table: GPUTable<T>;
  /** Explicit, GPU-resident validity masks retained for selected columns. */
  readonly validity: Readonly<LuDataFrameValidity<T>>;
  /** Adapter-owned categorical labels retained for selected columns. */
  readonly dictionaries: Readonly<LuDataFrameDictionaries<T>>;
  /** Whether this particular dataframe directly owns its source resources. */
  readonly ownership: LuDataFrameOwnership;

  private resourceLease: LuDataFrameResourceLease;
  private ownsProjectedTable = false;
  private destroyed = false;

  /** Wraps one existing GPU table without allocating or submitting any GPU work. */
  constructor({
    table,
    validity = {},
    dictionaries = {},
    ownership = 'borrowed'
  }: LuDataFrameProps<T>) {
    if (ownership !== 'borrowed' && ownership !== 'owned') {
      throw new Error('LuDataFrame ownership must be borrowed or owned');
    }

    assertValidDataFrameValidity(table, validity);
    assertValidDataFrameDictionaries(table, dictionaries);

    this.table = table;
    this.validity = Object.freeze({...validity});
    this.dictionaries = Object.freeze({...dictionaries});
    this.ownership = ownership;
    const ownedValidity = new Set<GPUVector<'uint32'>>();
    for (const vector of Object.values(this.validity)) {
      if (vector) {
        ownedValidity.add(vector);
      }
    }
    this.resourceLease = {
      table,
      validity: Array.from(ownedValidity),
      ownsResources: ownership === 'owned',
      referenceCount: 1
    };
  }

  /** GPU-facing fields and source-adapter schema metadata in dataframe column order. */
  get schema(): GPUSchema<T> {
    return this.table.schema;
  }

  /** Logical row count across preserved source record batches. */
  get numRows(): number {
    return this.table.numRows;
  }

  /** Number of selected varying and constant GPU table columns. */
  get numCols(): number {
    return this.table.numCols;
  }

  /** Selected column names in their requested logical order. */
  get columnNames(): readonly (keyof T & string)[] {
    return this.schema.fields.map(field => field.name);
  }

  /** Existing record-batch boundaries, including intentionally empty source batches. */
  get batches(): readonly GPURecordBatch[] {
    return this.table.batches;
  }

  /** Source-batch indices, stable source-row offsets, and source-row counts in batch order. */
  get sourceInfo(): readonly LuDataFrameSourceInfo[] {
    return this.batches.map(batch => batch.sourceInfo);
  }

  /** Returns one existing varying GPU vector or immutable logical constant by column name. */
  column<Name extends keyof T & string>(columnName: Name): LuDataFrameColumn<T[Name]> {
    this.assertAvailable();
    const column = this.table.gpuColumns[columnName];
    if (!column) {
      throw new Error(`LuDataFrame column "${columnName}" does not exist`);
    }
    return column as LuDataFrameColumn<T[Name]>;
  }

  /** Plans one immutable boolean filter without allocating buffers or submitting GPU work. */
  filter<ReferencedColumns extends keyof T & string>(
    predicate: LuExpression<boolean, ReferencedColumns>
  ): LuDataFrameQuery<T> {
    this.assertAvailable();
    return new LuDataFrameQuery(this, [predicate], this.columnNames);
  }

  /** Plans one selected numeric derived column without allocating or submitting GPU work. */
  withColumn<
    Name extends string,
    ReferencedColumns extends keyof T & string,
    Format extends LuDataFrameDerivedColumnFormat = LuDataFrameDerivedColumnFormatForExpression<
      T,
      ReferencedColumns
    >
  >(
    name: Name,
    expression: LuExpression<number | null, ReferencedColumns>,
    options: LuDataFrameDerivedColumnOptions<Format> = {}
  ): LuDataFrameQuery<T & Record<Name, Format>, (keyof T & string) | Name, T> {
    this.assertAvailable();
    const query = new LuDataFrameQuery<T, keyof T & string, T>(this, [], this.columnNames);
    return query.withColumn<Name, ReferencedColumns, Format>(name, expression, options);
  }

  /** Plans dense unsigned grouping without allocating GPU resources or retaining source leases. */
  groupBy<Key extends LuDataFrameColumnNamesOfFormat<T, keyof T & string, 'uint32'>>(
    key: Key,
    options: LuDataFrameGroupByOptions = {}
  ): LuDataFrameGroupByQuery<T, keyof T & string, Key, T> {
    this.assertAvailable();
    return new LuDataFrameQuery<T, keyof T & string, T>(this, [], this.columnNames).groupBy(
      key,
      options
    );
  }

  /** Plans global numeric reductions without allocating or retaining any GPU resources. */
  aggregate<Definitions extends LuDataFrameGlobalAggregationDefinitions<T>>(
    definitions: Definitions
  ): LuDataFrameAggregationQuery<T, keyof T & string, Definitions, T> {
    this.assertAvailable();
    return new LuDataFrameQuery<T, keyof T & string, T>(this, [], this.columnNames).aggregate(
      definitions
    );
  }

  /** Plans fixed-domain or irregular-edge histogram binning entirely on the CPU. */
  histogram<Column extends LuDataFrameScalarColumnNames<T, keyof T & string>>(
    column: Column,
    options: LuDataFrameHistogramOptions
  ): LuDataFrameHistogramQuery<T, keyof T & string, Column, T> {
    this.assertAvailable();
    return new LuDataFrameQuery<T, keyof T & string, T>(this, [], this.columnNames).histogram(
      column,
      options
    );
  }

  /** Plans stable scalar ordering independently within every existing source record batch. */
  sortBy<Column extends LuDataFrameScalarColumnNames<T, keyof T & string>>(
    column: Column,
    options: LuDataFrameSortOptions = {}
  ): LuDataFrameSortQuery<T, keyof T & string, Column, T> {
    this.assertAvailable();
    return new LuDataFrameQuery<T, keyof T & string, T>(this, [], this.columnNames).sortBy(
      column,
      options
    );
  }

  /** Plans descending stable top-K selection without concatenating source record batches. */
  topK<Column extends LuDataFrameScalarColumnNames<T, keyof T & string>>(
    column: Column,
    limit: number,
    options: LuDataFrameSortOptions = {}
  ): LuDataFrameSortQuery<T, keyof T & string, Column, T> {
    this.assertAvailable();
    return new LuDataFrameQuery<T, keyof T & string, T>(this, [], this.columnNames).topK(
      column,
      limit,
      options
    );
  }

  /** Plans explicit stable ordering across every source batch without copying source columns. */
  sortByGlobal<Column extends LuDataFrameScalarColumnNames<T, keyof T & string>>(
    column: Column,
    options: LuDataFrameSortOptions = {}
  ): LuDataFrameGlobalSortQuery<T, keyof T & string, Column, T> {
    this.assertAvailable();
    return new LuDataFrameQuery<T, keyof T & string, T>(this, [], this.columnNames).sortByGlobal(
      column,
      options
    );
  }

  /** Plans one descending top-K result across all original source record batches. */
  topKGlobal<Column extends LuDataFrameScalarColumnNames<T, keyof T & string>>(
    column: Column,
    limit: number,
    options: LuDataFrameSortOptions = {}
  ): LuDataFrameGlobalSortQuery<T, keyof T & string, Column, T> {
    this.assertAvailable();
    return new LuDataFrameQuery<T, keyof T & string, T>(this, [], this.columnNames).topKGlobal(
      column,
      limit,
      options
    );
  }

  /** Plans a stable unique-right unsigned inner join without materializing either dataframe. */
  innerJoin<
    Right extends GPUTypeMap,
    LeftKey extends LuDataFrameColumnNamesOfFormat<T, keyof T & string, 'uint32'>,
    RightKey extends LuDataFrameColumnNamesOfFormat<Right, keyof Right & string, 'uint32'>
  >(
    right: LuDataFrame<Right>,
    options: LuDataFrameJoinOptions<LeftKey, RightKey>
  ): LuDataFrameJoinQuery<T, keyof T & string, Right, LeftKey, RightKey, T> {
    this.assertAvailable();
    return new LuDataFrameQuery<T, keyof T & string, T>(this, [], this.columnNames).innerJoin(
      right,
      options
    );
  }

  /** Preserves selected left rows and publishes explicit validity for unmatched right partners. */
  leftJoin<
    Right extends GPUTypeMap,
    LeftKey extends LuDataFrameColumnNamesOfFormat<T, keyof T & string, 'uint32'>,
    RightKey extends LuDataFrameColumnNamesOfFormat<Right, keyof Right & string, 'uint32'>
  >(
    right: LuDataFrame<Right>,
    options: LuDataFrameJoinOptions<LeftKey, RightKey>
  ): LuDataFrameJoinQuery<T, keyof T & string, Right, LeftKey, RightKey, T> {
    this.assertAvailable();
    return new LuDataFrameQuery<T, keyof T & string, T>(this, [], this.columnNames).leftJoin(
      right,
      options
    );
  }

  /** Preserves selected left rows that match one unique right key. */
  semiJoin<
    Right extends GPUTypeMap,
    LeftKey extends LuDataFrameColumnNamesOfFormat<T, keyof T & string, 'uint32'>,
    RightKey extends LuDataFrameColumnNamesOfFormat<Right, keyof Right & string, 'uint32'>
  >(
    right: LuDataFrame<Right>,
    options: LuDataFrameJoinOptions<LeftKey, RightKey>
  ): LuDataFrameJoinQuery<T, keyof T & string, Right, LeftKey, RightKey, T> {
    this.assertAvailable();
    return new LuDataFrameQuery<T, keyof T & string, T>(this, [], this.columnNames).semiJoin(
      right,
      options
    );
  }

  /** Preserves selected unmatched left rows, including nullable left keys. */
  antiJoin<
    Right extends GPUTypeMap,
    LeftKey extends LuDataFrameColumnNamesOfFormat<T, keyof T & string, 'uint32'>,
    RightKey extends LuDataFrameColumnNamesOfFormat<Right, keyof Right & string, 'uint32'>
  >(
    right: LuDataFrame<Right>,
    options: LuDataFrameJoinOptions<LeftKey, RightKey>
  ): LuDataFrameJoinQuery<T, keyof T & string, Right, LeftKey, RightKey, T> {
    this.assertAvailable();
    return new LuDataFrameQuery<T, keyof T & string, T>(this, [], this.columnNames).antiJoin(
      right,
      options
    );
  }

  /** Plans bounded, source-aligned unique-right lookups without flattening source batches. */
  lookup<
    Right extends GPUTypeMap,
    LeftKey extends LuDataFrameColumnNamesOfFormat<T, keyof T & string, 'uint32'>,
    RightKey extends LuDataFrameColumnNamesOfFormat<Right, keyof Right & string, 'uint32'>
  >(
    right: LuDataFrame<Right>,
    options: LuDataFrameLookupOptions<LeftKey, RightKey>
  ): LuDataFrameLookupQuery<T, keyof T & string, Right, LeftKey, RightKey, T> {
    this.assertAvailable();
    return new LuDataFrameQuery<T, keyof T & string, T>(this, [], this.columnNames).lookup(
      right,
      options
    );
  }

  /**
   * Returns an independent borrowed projection without mutating or destroying source columns.
   *
   * Every selected batch receives fresh, non-owning `GPUData` wrappers around the exact source
   * buffers. Selecting no columns still preserves every batch, row count, and source-row identity.
   */
  select<ColumnName extends keyof T & string>(
    columnNames: readonly ColumnName[]
  ): LuDataFrame<Pick<T, ColumnName>> {
    this.assertAvailable();
    assertSelectedDataFrameColumns(this.table, columnNames);

    const projectedTable = createProjectedDataFrameTable(this.table, columnNames);
    const projectedValidity = selectDataFrameMetadata(this.validity, columnNames);
    const projectedDictionaries = selectDataFrameMetadata(this.dictionaries, columnNames);
    const projection = new LuDataFrame<Pick<T, ColumnName>>({
      table: projectedTable,
      validity: projectedValidity,
      dictionaries: projectedDictionaries,
      ownership: 'borrowed'
    });

    projection.resourceLease = this.resourceLease;
    projection.ownsProjectedTable = true;
    this.resourceLease.referenceCount++;
    return projection;
  }

  /**
   * Releases this view once, deferring owned source destruction until sibling views are released.
   *
   * Borrowed source tables and borrowed validity masks remain caller-owned. Projection-local table
   * wrappers can always be destroyed safely because every projected `GPUData` borrows its buffer.
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;

    if (this.ownsProjectedTable) {
      this.table.destroy();
    }

    this.resourceLease.referenceCount--;
    if (this.resourceLease.referenceCount === 0 && this.resourceLease.ownsResources) {
      this.resourceLease.table.destroy();
      for (const validity of this.resourceLease.validity) {
        validity.destroy();
      }
    }
  }

  /** Prevents new queries or column access after this dataframe view has been released. */
  private assertAvailable(): void {
    if (this.destroyed) {
      throw new Error('LuDataFrame has been destroyed');
    }
  }
}

/** Ensures every provided GPU validity vector follows the source table's exact batch topology. */
function assertValidDataFrameValidity<T extends GPUTypeMap>(
  table: GPUTable<T>,
  validity: LuDataFrameValidity<T>
): void {
  for (const [columnName, vector] of Object.entries(validity)) {
    if (!table.schema.fields.some(field => field.name === columnName)) {
      throw new Error(`LuDataFrame validity column "${columnName}" does not exist`);
    }
    if (!table.gpuVectors[columnName]) {
      throw new Error(`LuDataFrame validity column "${columnName}" must contain GPU vector data`);
    }
    if (!vector || !(vector instanceof GPUVector) || vector.format !== 'uint32') {
      throw new Error(`LuDataFrame validity column "${columnName}" requires a uint32 GPUVector`);
    }
    if (vector.length !== table.numRows) {
      throw new Error(`LuDataFrame validity column "${columnName}" must match the table row count`);
    }
    if (vector.data.length !== table.batches.length) {
      throw new Error(`LuDataFrame validity column "${columnName}" must match source batch chunks`);
    }
    for (const [batchIndex, batch] of table.batches.entries()) {
      if (vector.data[batchIndex]?.length !== batch.numRows) {
        throw new Error(
          `LuDataFrame validity column "${columnName}" must match source batch ${batchIndex}`
        );
      }
    }
  }
}

/** Ensures dictionary labels describe columns already present in the existing GPU table. */
function assertValidDataFrameDictionaries<T extends GPUTypeMap>(
  table: GPUTable<T>,
  dictionaries: LuDataFrameDictionaries<T>
): void {
  for (const columnName of Object.keys(dictionaries)) {
    if (!table.schema.fields.some(field => field.name === columnName)) {
      throw new Error(`LuDataFrame dictionary column "${columnName}" does not exist`);
    }
  }
}

/** Rejects missing and repeated columns before allocating any projection metadata. */
function assertSelectedDataFrameColumns<T extends GPUTypeMap>(
  table: GPUTable<T>,
  columnNames: readonly (keyof T & string)[]
): void {
  const selectedNames = new Set<string>();
  for (const columnName of columnNames) {
    if (!table.schema.fields.some(field => field.name === columnName)) {
      throw new Error(`LuDataFrame column "${columnName}" does not exist`);
    }
    if (selectedNames.has(columnName)) {
      throw new Error(`LuDataFrame column "${columnName}" cannot be selected more than once`);
    }
    selectedNames.add(columnName);
  }
}

/** Creates projected batches and constants without borrowing the source table's ownership handles. */
function createProjectedDataFrameTable<T extends GPUTypeMap, ColumnName extends keyof T & string>(
  source: GPUTable<T>,
  columnNames: readonly ColumnName[]
): GPUTable<Pick<T, ColumnName>> {
  const projectedFields = columnNames.map(columnName =>
    copyDataFrameField(getRequiredDataFrameField(source.schema.fields, columnName))
  );
  const projectedSchema: GPUSchema<Pick<T, ColumnName>> = {
    fields: projectedFields as GPUSchema<Pick<T, ColumnName>>['fields'],
    metadata: new Map(source.schema.metadata)
  };
  const projectedLayouts = selectDataFrameBufferLayouts(source.bufferLayout, columnNames);

  if (source.batches.length === 0) {
    return new GPUTable<Pick<T, ColumnName>>({
      schema: projectedSchema,
      bufferLayout: projectedLayouts
    });
  }

  const projectedBatches = source.batches.map(batch =>
    createProjectedDataFrameBatch<T, ColumnName>(batch, columnNames)
  );
  const projectedConstants = Object.fromEntries(
    columnNames.flatMap(columnName => {
      const constant = source.gpuConstants[columnName];
      return constant ? [[columnName, constant]] : [];
    })
  );
  const projectedTable = new GPUTable<Pick<T, ColumnName>>({
    batches: projectedBatches,
    constants: projectedConstants
  });

  // GPUTable appends constant fields after varying fields; dataframe selection preserves caller order.
  projectedTable.schema = projectedSchema;
  projectedTable.numCols = projectedFields.length;
  synchronizeProjectedDataFrameColumns(projectedTable, columnNames);
  return projectedTable;
}

/** Rebuilds one record batch with non-owning data wrappers and its original source-row identity. */
function createProjectedDataFrameBatch<T extends GPUTypeMap, ColumnName extends keyof T & string>(
  source: GPURecordBatch,
  columnNames: readonly ColumnName[]
): GPURecordBatch<Pick<T, ColumnName>> {
  const projectedData: Record<string, GPUData> = {};
  const projectedFields: GPUField[] = [];

  for (const columnName of columnNames) {
    const sourceData = source.gpuData[columnName];
    if (!sourceData) {
      continue;
    }
    projectedData[columnName] = createBorrowedDataFrameData(sourceData);
    projectedFields.push(
      copyDataFrameField(getRequiredDataFrameField(source.schema.fields, columnName))
    );
  }

  const projectedLayouts = selectDataFrameBufferLayouts(source.bufferLayout, columnNames);
  return new GPURecordBatch<Pick<T, ColumnName>>({
    gpuData: projectedData,
    bufferLayout: projectedLayouts,
    fields: projectedFields,
    numRows: source.numRows,
    metadata: new Map(source.schema.metadata),
    sourceInfo: source.sourceInfo,
    nullCount: source.nullCount
  });
}

/** Copies one chunk's complete logical layout while borrowing its existing physical GPU buffer. */
function createBorrowedDataFrameData(source: GPUData): GPUData {
  return new GPUData({
    buffer: source.buffer,
    format: source.format,
    length: source.length,
    valueLength: source.valueLength,
    stride: source.stride,
    byteOffset: source.byteOffset,
    byteStride: source.byteStride,
    rowByteLength: source.rowByteLength,
    ownsBuffer: false,
    readbackMetadata: source.readbackMetadata,
    valueOffsets: source.valueOffsets,
    nullBitmap: source.nullBitmap,
    valueByteLength: source.valueByteLength,
    dataType: source.dataType
  });
}

/** Finds an existing source schema field without silently synthesizing analytical type metadata. */
function getRequiredDataFrameField(fields: GPUField[], columnName: string): GPUField {
  const field = fields.find(candidate => candidate.name === columnName);
  if (!field) {
    throw new Error(`LuDataFrame source schema is missing column "${columnName}"`);
  }
  return field;
}

/** Copies field metadata maps so editing a projection cannot mutate source-adapter schema metadata. */
function copyDataFrameField(field: GPUField): GPUField {
  return {
    ...field,
    ...(field.metadata ? {metadata: new Map(field.metadata)} : {})
  };
}

/** Copies selected buffer and attribute layouts so logical projection metadata remains independent. */
function selectDataFrameBufferLayouts(
  layouts: readonly BufferLayout[],
  columnNames: readonly string[]
): BufferLayout[] {
  return columnNames.flatMap(columnName =>
    layouts
      .filter(layout => layout.name === columnName)
      .map(layout => ({
        ...layout,
        ...(layout.attributes
          ? {attributes: layout.attributes.map(attribute => ({...attribute}))}
          : {})
      }))
  );
}

/** Keeps physical column maps in requested order even when constants and vectors are interleaved. */
function synchronizeProjectedDataFrameColumns<T extends GPUTypeMap>(
  table: GPUTable<T>,
  columnNames: readonly string[]
): void {
  for (const columnName of Object.keys(table.gpuColumns)) {
    delete table.gpuColumns[columnName];
  }
  for (const columnName of columnNames) {
    const column = table.gpuVectors[columnName] ?? table.gpuConstants[columnName];
    if (column) {
      table.gpuColumns[columnName] = column;
    }
  }
}

/** Selects explicitly supplied metadata without copying GPU vectors or adapter-owned dictionaries. */
function selectDataFrameMetadata<Value, ColumnName extends string>(
  metadata: Readonly<Partial<Record<string, Value>>>,
  columnNames: readonly ColumnName[]
): Partial<Record<ColumnName, Value>> {
  const selected: Partial<Record<ColumnName, Value>> = {};
  for (const columnName of columnNames) {
    const value = metadata[columnName];
    if (value !== undefined) {
      selected[columnName] = value;
    }
  }
  return selected;
}
