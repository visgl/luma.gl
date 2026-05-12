// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type BufferLayout, type Device, type ShaderLayout} from '@luma.gl/core';
import {DynamicBuffer, type DynamicBufferProps} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';
import {readArrowGPUVectorAsync} from './arrow-gpu-vector';
import {getArrowDataByPath, getArrowVectorByPath} from './arrow-paths';
import {getArrowVertexFormat, type ArrowVertexFormatOptions} from './arrow-shader-layout';
import {
  getSignedShaderType,
  isInstanceArrowType,
  isNumericArrowType,
  type ArrowColumnInfo,
  type AttributeArrowType,
  type NumericArrowType
} from './arrow-types';

/** Buffer props forwarded when creating streaming Arrow GPU buffers. */
export type StreamingArrowGPUVectorBufferProps = Omit<DynamicBufferProps, 'byteLength' | 'data'>;

/** Synchronous source of Arrow record batches to append into a streaming table. */
export type StreamingArrowRecordBatchSource =
  | Iterable<arrow.RecordBatch>
  | Iterator<arrow.RecordBatch>;

/** Asynchronous source of Arrow record batches to append into a streaming table. */
export type StreamingArrowAsyncRecordBatchSource =
  | AsyncIterable<arrow.RecordBatch>
  | AsyncIterator<arrow.RecordBatch>;

/** Constructor props for a streaming GPU vector backed by a DynamicBuffer. */
export type StreamingArrowGPUVectorProps<T extends AttributeArrowType = AttributeArrowType> = {
  /** Name used when this vector is added to a StreamingArrowGPUTable. */
  name: string;
  /** Device that creates the backing DynamicBuffer. */
  device: Device;
  /** Arrow type that describes source data appended to this vector. */
  arrowType: T;
  /** Initial row capacity. Defaults to 0. */
  initialCapacityRows?: number;
  /** Buffer capacity growth multiplier used when appends exceed capacity. */
  capacityGrowthFactor?: number;
  /** DynamicBuffer construction props forwarded to the backing buffer. */
  bufferProps?: StreamingArrowGPUVectorBufferProps;
};

/** Props for constructing an empty or initially populated StreamingArrowGPUTable. */
export type StreamingArrowGPUTableProps = ArrowVertexFormatOptions & {
  /** Device that creates streaming vector buffers. */
  device: Device;
  /** Schema used to select GPU columns for an initially empty streaming table. */
  schema?: arrow.Schema;
  /** Record batch to append after creating the selected GPU columns. */
  recordBatch?: arrow.RecordBatch;
  /** Table to append after creating the selected GPU columns. */
  table?: arrow.Table;
  /** Synchronous record batches to append after creating the selected GPU columns. */
  recordBatches?: StreamingArrowRecordBatchSource;
  /** Asynchronous record batches to append after creating the selected GPU columns. */
  asyncRecordBatches?: StreamingArrowAsyncRecordBatchSource;
  /** Shader layout that selects which Arrow columns should be uploaded. */
  shaderLayout: ShaderLayout;
  /** Maps shader attribute names to Arrow column paths. Defaults to using the attribute name. */
  arrowPaths?: Record<string, string>;
  /** Buffer props applied to every streaming Arrow GPU vector. */
  bufferProps?: StreamingArrowGPUVectorBufferProps;
  /** Initial row capacity for every streaming vector. Defaults to the initial source row count. */
  initialCapacityRows?: number;
  /** Buffer capacity growth multiplier used when appends exceed capacity. */
  capacityGrowthFactor?: number;
};

type SelectedStreamingColumn = {
  /** Shader-visible attribute name. */
  attributeName: string;
  /** Dot-separated Arrow column path. */
  arrowPath: string;
  /** Source Arrow field. */
  field: arrow.Field;
  /** Buffer layout entry for this selected attribute. */
  bufferLayout: BufferLayout;
};

type InitialStreamingSource = {
  /** Schema used to select streaming GPU columns. */
  schema: arrow.Schema;
  /** First record batch to append, if one was provided directly or read from a synchronous source. */
  recordBatch?: arrow.RecordBatch;
  /** Arrow table to append after vectors are created. */
  table?: arrow.Table;
  /** Remaining synchronous record batch iterator after any first batch was consumed. */
  recordBatches?: Iterator<arrow.RecordBatch>;
  /** Asynchronous record batch iterator to consume after vectors are created. */
  asyncRecordBatches?: AsyncIterator<arrow.RecordBatch>;
};

/**
 * Streaming GPU memory and Arrow type metadata for one compatible Arrow column.
 *
 * A StreamingArrowGPUVector keeps a stable DynamicBuffer object while replacing
 * its backing GPU buffer as needed when appended Arrow batches exceed capacity.
 */
export class StreamingArrowGPUVector<T extends AttributeArrowType = AttributeArrowType> {
  /** Name used when this vector is added to a StreamingArrowGPUTable. */
  readonly name: string;
  /** Dynamic GPU buffer containing appended Arrow value memory. */
  readonly buffer: DynamicBuffer;
  /** Arrow type that describes the uploaded vector memory. */
  readonly type: T;
  /** Number of scalar values per logical vector row. */
  readonly stride: number;
  /** Byte offset of the first logical row in buffer. */
  readonly byteOffset = 0;
  /** Bytes between adjacent logical rows in buffer. */
  readonly byteStride: number;
  /** Number of logical rows appended into buffer. */
  length = 0;

  private readonly capacityGrowthFactor: number;

  /** Creates an empty streaming GPU vector. */
  constructor(props: StreamingArrowGPUVectorProps<T>) {
    if (!isInstanceArrowType(props.arrowType)) {
      throw new Error(`StreamingArrowGPUVector does not support Arrow type ${props.arrowType}`);
    }

    this.name = props.name;
    this.type = props.arrowType;
    this.stride = getArrowTypeStride(props.arrowType);
    this.byteStride = getArrowTypeByteStride(props.arrowType);
    this.capacityGrowthFactor = props.capacityGrowthFactor ?? 1.5;

    const initialCapacityRows = props.initialCapacityRows ?? 0;
    this.buffer = new DynamicBuffer(props.device, {
      usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
      ...props.bufferProps,
      id: props.bufferProps?.id ?? `${props.name}-streaming-arrow-vector`,
      byteLength: Math.max(1, initialCapacityRows * this.byteStride)
    });
  }

  /** Number of rows the current backing buffer can hold without reallocating. */
  get capacityRows(): number {
    return Math.floor(this.buffer.byteLength / this.byteStride);
  }

  /** Appends all data chunks from an Arrow vector. */
  appendVector(vector: arrow.Vector<T>): void {
    if (!arrow.util.compareTypes(vector.type, this.type)) {
      throw new Error(
        `StreamingArrowGPUVector "${this.name}" cannot append a different Arrow type`
      );
    }

    for (const data of vector.data) {
      this.appendData(data as arrow.Data<T>);
    }
  }

  /** Appends one Arrow data chunk with one GPU write. */
  appendData(data: arrow.Data<T>): void {
    this.validateData(data);

    const rowCount = data.length;
    const requiredRows = this.length + rowCount;
    this.ensureCapacityRows(requiredRows);

    const sourceView = getArrowDataValueView(data, this.stride);
    this.buffer.write(sourceView, this.length * this.byteStride);
    this.length = requiredRows;
  }

  /** Clears the logical row count while retaining the reusable DynamicBuffer allocation. */
  reset(): void {
    this.length = 0;
  }

  /** Reads appended GPU rows back into a single non-null Arrow vector. */
  async readAsync(): Promise<arrow.Vector<T>> {
    return readArrowGPUVectorAsync({
      type: this.type,
      buffer: this.buffer,
      length: this.length,
      byteOffset: this.byteOffset,
      byteStride: this.byteStride
    });
  }

  /** Destroys the backing DynamicBuffer. */
  destroy(): void {
    this.buffer.destroy();
  }

  private validateData(data: arrow.Data<T>): void {
    if (!arrow.util.compareTypes(data.type, this.type)) {
      throw new Error(
        `StreamingArrowGPUVector "${this.name}" cannot append a different Arrow type`
      );
    }
    if (data.nullCount > 0) {
      throw new Error(`StreamingArrowGPUVector "${this.name}" does not support nullable data`);
    }
    if (arrow.DataType.isFixedSizeList(data.type) && (data.children[0]?.nullCount ?? 0) > 0) {
      throw new Error(
        `StreamingArrowGPUVector "${this.name}" does not support nullable child data`
      );
    }
  }

  private ensureCapacityRows(requiredRows: number): void {
    if (requiredRows <= this.capacityRows) {
      return;
    }

    const grownRows = Math.ceil(Math.max(this.capacityRows, 1) * this.capacityGrowthFactor);
    const nextCapacityRows = Math.max(requiredRows, grownRows);
    this.buffer.ensureSize(nextCapacityRows * this.byteStride, {preserveData: true});
  }
}

/**
 * Append-only GPU representation of selected Arrow table columns.
 *
 * StreamingArrowGPUTable mirrors ArrowGPUTable's column selection and metadata
 * model but keeps DynamicBuffer-backed vectors that can grow as record batches
 * arrive.
 */
export class StreamingArrowGPUTable {
  /** GPU-facing schema for the selected shader attribute columns. */
  readonly schema: arrow.Schema;
  /** Number of selected GPU columns in schema. */
  readonly numCols: number;
  /** Buffer layout derived from the selected Arrow columns and shader layout. */
  readonly bufferLayout: BufferLayout[];
  /** Streaming GPU vectors keyed by shader attribute name. */
  readonly gpuVectors: Record<string, StreamingArrowGPUVector> = {};
  /** Model-ready DynamicBuffer attributes keyed by shader attribute name. */
  readonly attributes: Record<string, DynamicBuffer> = {};
  /** Resolves after any constructor-provided async record batches have been appended. */
  readonly ready: Promise<void>;

  private readonly selectedColumns: SelectedStreamingColumn[];
  private readonly sourceSchema: arrow.Schema;
  private destroyed = false;
  private rowCount = 0;
  private nullableRowCount = 0;

  /** Creates an empty or initially populated streaming GPU table. */
  constructor(props: StreamingArrowGPUTableProps) {
    const initialSource = getInitialSource(props);
    this.sourceSchema = initialSource.schema;
    this.selectedColumns = getSelectedStreamingColumns({
      schema: this.sourceSchema,
      shaderLayout: props.shaderLayout,
      arrowPaths: props.arrowPaths,
      allowWebGLOnlyFormats: props.allowWebGLOnlyFormats
    });
    this.bufferLayout = this.selectedColumns.map(column => column.bufferLayout);
    this.schema = new arrow.Schema(
      this.selectedColumns.map(
        column =>
          new arrow.Field(
            column.attributeName,
            column.field.type,
            column.field.nullable,
            new Map(column.field.metadata)
          )
      ),
      new Map(this.sourceSchema.metadata)
    );
    this.numCols = this.schema.fields.length;

    const initialCapacityRows =
      props.initialCapacityRows ??
      getInitialSourceRowCount(initialSource.table, initialSource.recordBatch);
    for (const column of this.selectedColumns) {
      const vector = new StreamingArrowGPUVector({
        name: column.attributeName,
        device: props.device,
        arrowType: column.field.type as AttributeArrowType,
        initialCapacityRows,
        capacityGrowthFactor: props.capacityGrowthFactor,
        bufferProps: props.bufferProps
      });
      this.gpuVectors[column.attributeName] = vector;
      this.attributes[column.attributeName] = vector.buffer;
    }

    if (initialSource.recordBatch) {
      this.appendRecordBatch(initialSource.recordBatch);
    }
    if (initialSource.table) {
      this.appendTable(initialSource.table);
    }
    if (initialSource.recordBatches) {
      this.appendRecordBatches(initialSource.recordBatches);
    }

    this.ready = initialSource.asyncRecordBatches
      ? this.appendRecordBatchesAsync(initialSource.asyncRecordBatches)
      : Promise.resolve();
  }

  /** Number of appended rows currently represented by every selected vector. */
  get numRows(): number {
    return this.rowCount;
  }

  /** Number of null rows in appended sources. */
  get nullCount(): number {
    return this.nullableRowCount;
  }

  /** Appends one record batch into every selected streaming vector. */
  appendRecordBatch(recordBatch: arrow.RecordBatch): void {
    this.assertCompatibleSchema(recordBatch.schema);
    const pendingData = this.selectedColumns.map(column => ({
      column,
      data: getArrowDataByPath(recordBatch, column.arrowPath) as arrow.Data<AttributeArrowType>
    }));
    validateSelectedData(recordBatch.numRows, pendingData);

    for (const {column, data} of pendingData) {
      this.gpuVectors[column.attributeName].appendData(data);
    }
    this.rowCount += recordBatch.numRows;
    this.nullableRowCount += recordBatch.nullCount;
  }

  /** Appends all record batches from one Arrow table. */
  appendTable(table: arrow.Table): void {
    this.assertCompatibleSchema(table.schema);
    const pendingVectors = this.selectedColumns.map(column => ({
      column,
      vector: getArrowVectorByPath(table, column.arrowPath) as arrow.Vector<AttributeArrowType>
    }));
    validateSelectedVectors(table.numRows, pendingVectors);

    for (const {column, vector} of pendingVectors) {
      this.gpuVectors[column.attributeName].appendVector(vector);
    }
    this.rowCount += table.numRows;
    this.nullableRowCount += table.nullCount;
  }

  /** Appends all record batches from a synchronous source. */
  appendRecordBatches(recordBatches: StreamingArrowRecordBatchSource): void {
    const iterator = getRecordBatchIterator(recordBatches);
    for (let result = iterator.next(); !result.done; result = iterator.next()) {
      this.appendRecordBatch(result.value);
    }
  }

  /** Appends all record batches from an asynchronous source. */
  async appendRecordBatchesAsync(
    recordBatches: StreamingArrowAsyncRecordBatchSource
  ): Promise<void> {
    const iterator = getAsyncRecordBatchIterator(recordBatches);
    for (let result = await iterator.next(); !result.done; result = await iterator.next()) {
      this.appendRecordBatch(result.value);
    }
  }

  /** Clears all logical rows while retaining reusable vector buffers. */
  reset(): void {
    for (const vector of Object.values(this.gpuVectors)) {
      vector.reset();
    }
    this.rowCount = 0;
    this.nullableRowCount = 0;
  }

  /** Destroys all owned streaming vector buffers. */
  destroy(): void {
    if (!this.destroyed) {
      for (const vector of Object.values(this.gpuVectors)) {
        vector.destroy();
      }
      this.destroyed = true;
    }
  }

  private assertCompatibleSchema(schema: arrow.Schema): void {
    for (const column of this.selectedColumns) {
      const field = getFieldByPath(schema, column.arrowPath);
      if (!field || !arrow.util.compareTypes(field.type, column.field.type)) {
        throw new Error(
          `StreamingArrowGPUTable column "${column.arrowPath}" does not match the source schema`
        );
      }
    }
  }
}

function getInitialSource(props: StreamingArrowGPUTableProps): InitialStreamingSource {
  const dataSourceCount =
    Number(Boolean(props.recordBatch)) +
    Number(Boolean(props.table)) +
    Number(Boolean(props.recordBatches)) +
    Number(Boolean(props.asyncRecordBatches));
  if (dataSourceCount > 1) {
    throw new Error(
      'StreamingArrowGPUTable accepts at most one initial data source: recordBatch, table, recordBatches, or asyncRecordBatches'
    );
  }

  if (props.asyncRecordBatches && !props.schema) {
    throw new Error(
      'StreamingArrowGPUTable requires schema when initialized with asyncRecordBatches'
    );
  }

  if (props.schema) {
    return {
      schema: props.schema,
      recordBatch: props.recordBatch,
      table: props.table,
      recordBatches: props.recordBatches ? getRecordBatchIterator(props.recordBatches) : undefined,
      asyncRecordBatches: props.asyncRecordBatches
        ? getAsyncRecordBatchIterator(props.asyncRecordBatches)
        : undefined
    };
  }
  if (props.recordBatch) {
    return {schema: props.recordBatch.schema, recordBatch: props.recordBatch};
  }
  if (props.table) {
    return {schema: props.table.schema, table: props.table};
  }
  if (props.recordBatches) {
    const iterator = getRecordBatchIterator(props.recordBatches);
    const firstResult = iterator.next();
    if (firstResult.done) {
      throw new Error(
        'StreamingArrowGPUTable requires schema when initialized with empty recordBatches'
      );
    }
    return {
      schema: firstResult.value.schema,
      recordBatch: firstResult.value,
      recordBatches: iterator
    };
  }

  throw new Error(
    'StreamingArrowGPUTable requires schema, recordBatch, table, recordBatches, or asyncRecordBatches'
  );
}

function getInitialSourceRowCount(table?: arrow.Table, recordBatch?: arrow.RecordBatch): number {
  return table?.numRows ?? recordBatch?.numRows ?? 0;
}

function getRecordBatchIterator(
  source: StreamingArrowRecordBatchSource
): Iterator<arrow.RecordBatch> {
  const iterable = source as Partial<Iterable<arrow.RecordBatch>>;
  const getIterator = iterable[Symbol.iterator];
  return getIterator ? getIterator.call(iterable) : (source as Iterator<arrow.RecordBatch>);
}

function getAsyncRecordBatchIterator(
  source: StreamingArrowAsyncRecordBatchSource
): AsyncIterator<arrow.RecordBatch> {
  const iterable = source as Partial<AsyncIterable<arrow.RecordBatch>>;
  const getIterator = iterable[Symbol.asyncIterator];
  return getIterator ? getIterator.call(iterable) : (source as AsyncIterator<arrow.RecordBatch>);
}

function getSelectedStreamingColumns(props: {
  schema: arrow.Schema;
  shaderLayout: ShaderLayout;
  arrowPaths?: Record<string, string>;
  allowWebGLOnlyFormats?: boolean;
}): SelectedStreamingColumn[] {
  const schemaPaths = new Set(getSchemaPaths(props.schema));
  const columns: SelectedStreamingColumn[] = [];

  for (const attribute of props.shaderLayout.attributes) {
    const hasExplicitPath = Boolean(
      props.arrowPaths && Object.prototype.hasOwnProperty.call(props.arrowPaths, attribute.name)
    );
    const arrowPath = props.arrowPaths?.[attribute.name] || attribute.name;
    if (!hasExplicitPath && !schemaPaths.has(arrowPath)) {
      continue;
    }

    const field = getFieldByPath(props.schema, arrowPath);
    if (!field) {
      throw new Error(`Arrow table schema does not contain column "${arrowPath}"`);
    }
    if (!isInstanceArrowType(field.type)) {
      throw new Error(`Arrow column "${arrowPath}" is not compatible with shader attributes`);
    }
    const columnInfo = getArrowColumnInfoFromType(field.type);
    const format = getArrowVertexFormat(columnInfo, attribute.type, {
      allowWebGLOnlyFormats: props.allowWebGLOnlyFormats
    });
    columns.push({
      attributeName: attribute.name,
      arrowPath,
      field,
      bufferLayout: {
        name: attribute.name,
        format,
        ...(attribute.stepMode ? {stepMode: attribute.stepMode} : {})
      }
    });
  }

  return columns;
}

function getSchemaPaths(schema: arrow.Schema): string[] {
  return getSchemaPathsRecursive(schema.fields, []);
}

function getSchemaPathsRecursive(fields: arrow.Field[], currentPath: string[]): string[] {
  const paths: string[] = [];
  for (const field of fields) {
    const fieldPath = [...currentPath, field.name];
    if (arrow.DataType.isStruct(field.type)) {
      paths.push(...getSchemaPathsRecursive(field.type.children, fieldPath));
    } else {
      paths.push(fieldPath.join('.'));
    }
  }
  return paths;
}

function getFieldByPath(schema: arrow.Schema, columnPath: string): arrow.Field | null {
  const path = columnPath.split('.');
  let fields = schema.fields;
  let resolvedField: arrow.Field | null = null;

  for (let pathIndex = 0; pathIndex < path.length; pathIndex++) {
    const key = path[pathIndex];
    const isLeafField = pathIndex === path.length - 1;
    resolvedField = fields.find(field => field.name === key) ?? null;
    if (!resolvedField) {
      return null;
    }
    if (!isLeafField) {
      if (!arrow.DataType.isStruct(resolvedField.type)) {
        return null;
      }
      fields = resolvedField.type.children;
    }
  }

  return resolvedField && !arrow.DataType.isStruct(resolvedField.type) ? resolvedField : null;
}

function getArrowColumnInfoFromType(type: AttributeArrowType): ArrowColumnInfo {
  let numericType = type as NumericArrowType;
  let components: 1 | 2 | 3 | 4 = 1;
  if (arrow.DataType.isFixedSizeList(type)) {
    numericType = type.children[0].type as NumericArrowType;
    if (type.listSize < 1 || type.listSize > 4) {
      throw new Error('Attribute column fixed list size must be between 1 and 4');
    }
    components = type.listSize as 1 | 2 | 3 | 4;
  }
  if (!isNumericArrowType(numericType)) {
    throw new Error('Attribute column must be numeric or fixed list of numeric');
  }
  return {
    signedDataType: getSignedShaderType(numericType, components),
    components,
    stepMode: 'instance',
    values: [],
    offsets: []
  };
}

function validateSelectedData(
  expectedRows: number,
  pendingData: {column: SelectedStreamingColumn; data: arrow.Data<AttributeArrowType>}[]
): void {
  for (const {column, data} of pendingData) {
    if (data.length !== expectedRows) {
      throw new Error(`StreamingArrowGPUTable column "${column.arrowPath}" row count mismatch`);
    }
    validateDataForDirectUpload(column.attributeName, data);
  }
}

function validateSelectedVectors(
  expectedRows: number,
  pendingVectors: {column: SelectedStreamingColumn; vector: arrow.Vector<AttributeArrowType>}[]
): void {
  for (const {column, vector} of pendingVectors) {
    if (vector.length !== expectedRows) {
      throw new Error(`StreamingArrowGPUTable column "${column.arrowPath}" row count mismatch`);
    }
    for (const data of vector.data) {
      validateDataForDirectUpload(column.attributeName, data as arrow.Data<AttributeArrowType>);
    }
  }
}

function validateDataForDirectUpload(name: string, data: arrow.Data<AttributeArrowType>): void {
  if (data.nullCount > 0) {
    throw new Error(`StreamingArrowGPUVector "${name}" does not support nullable data`);
  }
  if (arrow.DataType.isFixedSizeList(data.type) && (data.children[0]?.nullCount ?? 0) > 0) {
    throw new Error(`StreamingArrowGPUVector "${name}" does not support nullable child data`);
  }
}

function getArrowDataValueView<T extends AttributeArrowType>(
  data: arrow.Data<T>,
  stride: number
): ArrayBufferView {
  const values = getArrowDataValues(data);
  const childOffset = arrow.DataType.isFixedSizeList(data.type)
    ? (data.children[0]?.offset ?? 0)
    : 0;
  const startElement = childOffset + data.offset * stride;
  const endElement = startElement + data.length * stride;
  return values.subarray(startElement, endElement);
}

function getArrowDataValues(data: arrow.Data<AttributeArrowType>): NumericArrowType['TArray'] {
  if (arrow.DataType.isFixedSizeList(data.type)) {
    const childValues = data.children[0]?.values;
    if (!childValues) {
      throw new Error('Arrow FixedSizeList data has no child values');
    }
    return childValues as NumericArrowType['TArray'];
  }

  const values = data.values;
  if (!values) {
    throw new Error('Arrow data has no values');
  }
  return values as NumericArrowType['TArray'];
}

function getArrowTypeStride(type: arrow.DataType): number {
  return arrow.DataType.isFixedSizeList(type) ? type.listSize : 1;
}

function getArrowTypeByteStride(type: arrow.DataType): number {
  if (arrow.DataType.isFixedSizeList(type)) {
    return type.listSize * getArrowTypeByteStride(type.children[0].type);
  }
  if (arrow.DataType.isInt(type)) {
    return type.bitWidth / 8;
  }
  if (arrow.DataType.isFloat(type)) {
    switch (type.precision) {
      case arrow.Precision.HALF:
        return 2;
      case arrow.Precision.SINGLE:
        return 4;
      case arrow.Precision.DOUBLE:
        return 8;
    }
  }
  throw new Error(`Cannot determine byte stride for Arrow type ${type}`);
}
