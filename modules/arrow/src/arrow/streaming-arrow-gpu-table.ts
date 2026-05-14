// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, ShaderLayout} from '@luma.gl/core';
import * as arrow from 'apache-arrow';
import type {ArrowVertexFormatOptions} from './arrow-shader-layout';
import {
  GPUVector,
  type GPUVectorDynamicBufferProps,
  type GPUVectorFromAppendableProps
} from './arrow-gpu-vector';
import {GPUTable} from './plain-gpu-table';
import type {AttributeArrowType} from './arrow-types';

/** Buffer props forwarded when creating streaming Arrow GPU buffers. */
export type StreamingArrowGPUVectorBufferProps = GPUVectorDynamicBufferProps;

/** Synchronous source of Arrow record batches to append into a streaming table. */
export type StreamingArrowRecordBatchSource =
  | Iterable<arrow.RecordBatch>
  | Iterator<arrow.RecordBatch>;

/** Asynchronous source of Arrow record batches to append into a streaming table. */
export type StreamingArrowAsyncRecordBatchSource =
  | AsyncIterable<arrow.RecordBatch>
  | AsyncIterator<arrow.RecordBatch>;

/** Constructor props for the legacy streaming GPU vector façade. */
export type StreamingArrowGPUVectorProps<T extends AttributeArrowType = AttributeArrowType> = Omit<
  GPUVectorFromAppendableProps<T>,
  'type'
>;

/** Props for constructing an empty or initially populated streaming GPU table façade. */
export type StreamingArrowGPUTableProps = ArrowVertexFormatOptions & {
  /** Device that creates appendable vector buffers. */
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
  /** Buffer props applied to every appendable Arrow GPU vector. */
  bufferProps?: StreamingArrowGPUVectorBufferProps;
  /** Initial row capacity for every streaming vector. Defaults to the initial source row count. */
  initialCapacityRows?: number;
  /** Buffer capacity growth multiplier used when appends exceed capacity. */
  capacityGrowthFactor?: number;
};

type InitialStreamingSource = {
  schema: arrow.Schema;
  recordBatch?: arrow.RecordBatch;
  table?: arrow.Table;
  recordBatches?: Iterator<arrow.RecordBatch>;
  asyncRecordBatches?: AsyncIterator<arrow.RecordBatch>;
};

/**
 * Backwards-compatible appendable vector façade.
 *
 * The mutable storage path now lives entirely in {@link GPUVector}. This class
 * retains the old streaming method names while delegating every operation to
 * the regular appendable vector implementation.
 */
export class StreamingArrowGPUVector<
  T extends AttributeArrowType = AttributeArrowType
> extends GPUVector<T> {
  constructor(props: StreamingArrowGPUVectorProps<T>) {
    super({...props, type: 'appendable'} as any);
  }

  appendVector(vector: arrow.Vector<T>): void {
    this.addVectorToLastBatch(vector);
  }

  appendData(data: arrow.Data<T>): void {
    this.addToLastData(data);
  }

  reset(): void {
    this.resetLastBatch();
  }
}

/**
 * Backwards-compatible appendable table façade.
 *
 * The mutable table implementation now lives entirely in {@link GPUTable} and
 * its appendable trailing batch. This wrapper keeps the legacy constructor and
 * iterator conveniences while delegating uploads and validation to `GPUTable`.
 */
export class StreamingArrowGPUTable extends GPUTable {
  /** Resolves after any constructor-provided async record batches have been appended. */
  readonly ready: Promise<void>;

  constructor(props: StreamingArrowGPUTableProps) {
    const initialSource = getInitialSource(props);
    super({
      type: 'appendable',
      device: props.device,
      schema: initialSource.schema,
      shaderLayout: props.shaderLayout,
      arrowPaths: props.arrowPaths,
      allowWebGLOnlyFormats: props.allowWebGLOnlyFormats,
      bufferProps: props.bufferProps,
      initialCapacityRows:
        props.initialCapacityRows ??
        getInitialSourceRowCount(initialSource.table, initialSource.recordBatch),
      capacityGrowthFactor: props.capacityGrowthFactor
    });

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

  appendRecordBatch(recordBatch: arrow.RecordBatch): void {
    this.addToLastBatch(recordBatch);
  }

  appendTable(table: arrow.Table): void {
    this.addToLastBatch(table);
  }

  appendRecordBatches(recordBatches: StreamingArrowRecordBatchSource): void {
    const iterator = getRecordBatchIterator(recordBatches);
    for (let result = iterator.next(); !result.done; result = iterator.next()) {
      this.appendRecordBatch(result.value);
    }
  }

  async appendRecordBatchesAsync(
    recordBatches: StreamingArrowAsyncRecordBatchSource
  ): Promise<void> {
    const iterator = getAsyncRecordBatchIterator(recordBatches);
    for (let result = await iterator.next(); !result.done; result = await iterator.next()) {
      this.appendRecordBatch(result.value);
    }
  }

  reset(): void {
    this.resetLastBatch();
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
