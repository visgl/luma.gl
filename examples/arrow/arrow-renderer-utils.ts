// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

/** Arrow table column selector accepted by the core Arrow examples. */
export type ArrowColumnSelector<T extends arrow.DataType> = string | arrow.Vector<T>;

/** Optional Arrow table column selector. `null` explicitly disables the column. */
export type OptionalArrowColumnSelector<T extends arrow.DataType> =
  | ArrowColumnSelector<T>
  | null
  | undefined;

/**
 * Arrow record-batch source accepted by the core Arrow example renderers.
 *
 * Renderers do not replay a previous source on prop-only changes. Pass a fresh source, or pass the
 * same replayable table/iterable again, whenever changed props require data preparation.
 */
export type ArrowRecordBatchSource =
  | arrow.Table
  | Iterable<arrow.RecordBatch>
  | AsyncIterator<arrow.RecordBatch>
  | AsyncIterable<arrow.RecordBatch>;

/** Common update fields emitted after one renderer-owned Arrow batch load. */
export type ArrowRecordBatchLoadUpdate<Metrics, PreparedBatch = unknown> = {
  /** Number of loaded batches in the active stream. */
  loadedBatchCount: number;
  /** True when the first batch in the stream has been loaded. */
  isFirstBatch: boolean;
  /** Aggregated metrics after the loaded batch has been appended. */
  metrics: Metrics;
  /** Prepared GPU batch that was just appended. */
  preparedBatch: PreparedBatch;
};

/** Source-position metadata for one loaded Arrow record batch. */
export type ArrowRecordBatchLoadContext = {
  /** Zero-based batch index within the active stream. */
  batchIndex: number;
  /** Zero-based row offset for the first row in this source batch. */
  rowIndexOffset: number;
  /** True when this is the first yielded record batch in the stream. */
  isFirstBatch: boolean;
};

type LoadArrowRecordBatchesProps<PreparedBatch, Metrics> = {
  data: ArrowRecordBatchSource;
  isActive: () => boolean;
  prepareBatch: (
    recordBatch: arrow.RecordBatch,
    context: ArrowRecordBatchLoadContext
  ) => Promise<PreparedBatch>;
  appendBatch: (preparedBatch: PreparedBatch) => void;
  destroyBatch: (preparedBatch: PreparedBatch) => void;
  getRowCount: (preparedBatch: PreparedBatch) => number;
  getMetrics: () => Metrics;
  onBatch?: (update: ArrowRecordBatchLoadUpdate<Metrics, PreparedBatch>) => void;
  onError?: (error: unknown) => void;
};

/** Resolves a required Arrow vector from either an explicit vector or a table column selector. */
export function getRequiredArrowColumn<T extends arrow.DataType>(props: {
  data?: arrow.Table | null;
  selector?: ArrowColumnSelector<T>;
  defaultColumnName: string;
  ownerName: string;
}): arrow.Vector<T> {
  const {data, selector, defaultColumnName, ownerName} = props;
  if (typeof selector !== 'string' && selector) {
    return selector;
  }

  const columnName = typeof selector === 'string' ? selector : defaultColumnName;
  const vector = data?.getChild(columnName);
  if (!vector) {
    throw new Error(`${ownerName} data is missing Arrow column "${columnName}"`);
  }
  return vector as arrow.Vector<T>;
}

/** Resolves an optional Arrow vector from an explicit vector, table column selector, or null. */
export function getOptionalArrowColumn<T extends arrow.DataType>(props: {
  data?: arrow.Table | null;
  selector?: OptionalArrowColumnSelector<T>;
  defaultColumnName: string;
}): arrow.Vector<T> | null {
  const {data, selector, defaultColumnName} = props;
  if (selector === null) {
    return null;
  }
  if (typeof selector !== 'string' && selector) {
    return selector;
  }

  const columnName = typeof selector === 'string' ? selector : defaultColumnName;
  return (data?.getChild(columnName) as arrow.Vector<T> | null | undefined) ?? null;
}

/** Returns true when props contain a table or an explicit non-string vector selector. */
export function hasArrowTableOrVectorSource<T extends arrow.DataType>(props: {
  data?: ArrowRecordBatchSource | null;
  selector?: ArrowColumnSelector<T>;
}): boolean {
  return Boolean(props.data) || Boolean(props.selector && typeof props.selector !== 'string');
}

/** Normalizes Arrow table, iterable, async iterable, and bare async iterator sources. */
export function getArrowRecordBatchAsyncIterator(
  data: ArrowRecordBatchSource
): AsyncIterator<arrow.RecordBatch> {
  if (data instanceof arrow.Table) {
    return getAsyncIterator(data.batches[Symbol.iterator]());
  }
  if (Symbol.asyncIterator in data) {
    return data[Symbol.asyncIterator]();
  }
  if (Symbol.iterator in data) {
    return getAsyncIterator(data[Symbol.iterator]());
  }
  return data;
}

/** Iterates an active Arrow source and centralizes stale-load cleanup. */
export async function loadArrowRecordBatches<PreparedBatch, Metrics>({
  data,
  isActive,
  prepareBatch,
  appendBatch,
  destroyBatch,
  getRowCount,
  getMetrics,
  onBatch,
  onError
}: LoadArrowRecordBatchesProps<PreparedBatch, Metrics>): Promise<void> {
  let loadedBatchCount = 0;
  let rowIndexOffset = 0;

  if (!isActive()) {
    return;
  }

  try {
    const recordBatchIterator = getArrowRecordBatchAsyncIterator(data);
    for (
      let recordBatchResult = await recordBatchIterator.next();
      !recordBatchResult.done;
      recordBatchResult = await recordBatchIterator.next()
    ) {
      if (!isActive()) {
        return;
      }

      const context: ArrowRecordBatchLoadContext = {
        batchIndex: loadedBatchCount,
        rowIndexOffset,
        isFirstBatch: loadedBatchCount === 0
      };
      const preparedBatch = await prepareBatch(recordBatchResult.value, context);
      if (!isActive()) {
        destroyBatch(preparedBatch);
        return;
      }

      appendBatch(preparedBatch);
      loadedBatchCount++;
      rowIndexOffset += getRowCount(preparedBatch);
      onBatch?.({
        loadedBatchCount,
        isFirstBatch: context.isFirstBatch,
        metrics: getMetrics(),
        preparedBatch
      });
    }
  } catch (error) {
    if (isActive()) {
      onError?.(error);
    }
  }
}

function getAsyncIterator(iterator: Iterator<arrow.RecordBatch>): AsyncIterator<arrow.RecordBatch> {
  return {
    async next(): Promise<IteratorResult<arrow.RecordBatch>> {
      return iterator.next();
    }
  };
}
