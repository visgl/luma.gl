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

/** Token used to cancel stale Arrow record-batch streaming work. */
export type ArrowRecordBatchStreamingSession = {
  /** Monotonic stream version owned by the renderer. */
  version: number;
};

/** Common stream update fields emitted by Arrow record-batch renderers. */
export type ArrowRecordBatchStreamUpdate<Metrics> = {
  /** Number of loaded batches in the active stream. */
  loadedBatchCount: number;
  /** True when the first batch in the stream has been loaded. */
  isFirstBatch: boolean;
  /** Aggregated metrics after the loaded batch has been appended. */
  metrics: Metrics;
};

/** Source-position metadata for one record batch in an active Arrow stream. */
export type ArrowRecordBatchStreamContext = {
  /** Zero-based batch index within the active stream. */
  batchIndex: number;
  /** Zero-based row offset for the first row in this source batch. */
  rowIndexOffset: number;
  /** True when this is the first yielded record batch in the stream. */
  isFirstBatch: boolean;
};

type StreamArrowRecordBatchesProps<PreparedBatch, Metrics> = {
  recordBatchIterator: AsyncIterator<arrow.RecordBatch>;
  streamingSession: ArrowRecordBatchStreamingSession;
  isActive: (streamingSession: ArrowRecordBatchStreamingSession) => boolean;
  prepareBatch: (
    recordBatch: arrow.RecordBatch,
    context: ArrowRecordBatchStreamContext
  ) => Promise<PreparedBatch>;
  appendBatch: (preparedBatch: PreparedBatch) => void;
  destroyBatch: (preparedBatch: PreparedBatch) => void;
  getRowCount: (preparedBatch: PreparedBatch) => number;
  getMetrics: () => Metrics;
  onBatch?: (update: ArrowRecordBatchStreamUpdate<Metrics>) => void;
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
  data?: arrow.Table | null;
  selector?: ArrowColumnSelector<T>;
}): boolean {
  return Boolean(props.data) || Boolean(props.selector && typeof props.selector !== 'string');
}

/** Iterates active record batches and centralizes cancellation cleanup. */
export async function streamArrowRecordBatches<PreparedBatch, Metrics>({
  recordBatchIterator,
  streamingSession,
  isActive,
  prepareBatch,
  appendBatch,
  destroyBatch,
  getRowCount,
  getMetrics,
  onBatch
}: StreamArrowRecordBatchesProps<PreparedBatch, Metrics>): Promise<void> {
  let loadedBatchCount = 0;
  let rowIndexOffset = 0;

  if (!isActive(streamingSession)) {
    return;
  }

  for (
    let recordBatchResult = await recordBatchIterator.next();
    !recordBatchResult.done;
    recordBatchResult = await recordBatchIterator.next()
  ) {
    if (!isActive(streamingSession)) {
      return;
    }

    const context: ArrowRecordBatchStreamContext = {
      batchIndex: loadedBatchCount,
      rowIndexOffset,
      isFirstBatch: loadedBatchCount === 0
    };
    const preparedBatch = await prepareBatch(recordBatchResult.value, context);
    if (!isActive(streamingSession)) {
      destroyBatch(preparedBatch);
      return;
    }

    appendBatch(preparedBatch);
    loadedBatchCount++;
    rowIndexOffset += getRowCount(preparedBatch);
    onBatch?.({
      loadedBatchCount,
      isFirstBatch: context.isFirstBatch,
      metrics: getMetrics()
    });
  }
}
