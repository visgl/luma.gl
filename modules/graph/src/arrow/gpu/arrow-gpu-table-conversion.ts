// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Device} from '@luma.gl/core';
import {GPUVector} from '@luma.gl/graph/gpu-data';
import {GPURecordBatch, GPUTable, type GPUField} from '@luma.gl/graph/gpu-tables';
import {iterateSource} from './arrow-conversion-stream';
import {RecordBatch, Table} from 'apache-arrow';
import {getArrowFieldByPath} from '@luma.gl/graph/_internal/arrow';
import {getArrowVectorByPath} from '@luma.gl/graph/arrow';
import {getArrowTemporalVectorInfo, TEMPORAL_ORIGIN_METADATA_KEY} from '@luma.gl/graph/arrow';
import {
  ArrowGPUConversionCost,
  ArrowGPUConversionOptions,
  ArrowGPUConversionPlan,
  PreparedArrowGPUVector,
  planArrowGPUConversion,
  convertArrowToGPUVector
} from '@luma.gl/graph/arrow';

/** One named source-to-target mapping in an Arrow table conversion schema. */
export type ArrowGPUTableConversionColumn = ArrowGPUConversionOptions & {
  /** Prepared GPU column name. */
  name: string;
  /** Source Arrow field path. Defaults to `name`. */
  source?: string;
};

/** Schema-driven selection and lowering contract for one Arrow table. */
export type ArrowGPUTableConversionSchema = {
  /** Ordered selected output columns. */
  columns: readonly ArrowGPUTableConversionColumn[];
};

/** Plan for every selected column in one Arrow table. */
export type ArrowGPUTableConversionPlan = {
  /** Ordered column plans with resolved source paths. */
  columns: readonly {
    name: string;
    source: string;
    plan: ArrowGPUConversionPlan;
  }[];
  /** Source rows shared by every selected column. */
  length: number;
  /** Aggregate cost across selected columns. */
  cost: ArrowGPUConversionCost;
  /** Estimated peak retained and temporary GPU bytes while converting columns serially. */
  estimatedPeakGPUBytes: number;
};

/** Prepared generic GPU table plus its inspectable conversion plan. */
export type PreparedArrowGPUTable = {
  /** Prepared generic GPU table. */
  table: GPUTable;
  /** Prepared vectors keyed by output column name. */
  vectors: Readonly<Record<string, GPUVector>>;
  /** Plan used to prepare the table. */
  plan: ArrowGPUTableConversionPlan;
  /** Releases table-owned GPU data exactly once. */
  destroy: () => void;
};

/** Iterable Arrow record-batch source accepted by streaming conversion. */
export type ArrowRecordBatchConversionSource =
  | Iterable<RecordBatch>
  | AsyncIterable<RecordBatch>
  | AsyncIterator<RecordBatch>;

/** Controls cancellation of incremental Arrow conversion. */
export type ArrowRecordBatchConversionOptions = {
  /** Stops pending reads and further conversion. Already yielded batches remain caller-owned. */
  signal?: AbortSignal;
  /** Maximum estimated GPU payload bytes per batch. Checked before conversion. */
  maxBatchPayloadBytes?: number;
  /** Maximum estimated peak GPU bytes per batch, including conversion scratch. */
  maxBatchGPUBytes?: number;
  /** Split an oversized batch into contiguous rows before uploading. Defaults to false. */
  splitOversizedBatches?: boolean;
};

/** One independently owned GPU record batch produced from an Arrow stream. */
export type PreparedArrowGPURecordBatch = {
  /** Prepared batch. */
  batch: GPURecordBatch;
  /** Prepared batch-local vectors keyed by output name. */
  vectors: Readonly<Record<string, GPUVector>>;
  /** Plan used for this batch. */
  plan: ArrowGPUTableConversionPlan;
  /** Releases batch-owned GPU data exactly once. */
  destroy: () => void;
};

/** Plans every selected column in an Arrow table using one explicit output schema. */
export function planArrowTableGPUConversion(
  device: Device,
  table: Table,
  schema: ArrowGPUTableConversionSchema
): ArrowGPUTableConversionPlan {
  validateTableConversionSchema(schema);
  const columns = schema.columns.map(column => {
    const sourcePath = column.source ?? column.name;
    const sourceVector = getArrowVectorByPath(table, sourcePath);
    const sourceField = getArrowFieldByPath(table, sourcePath);
    return {
      name: column.name,
      source: sourcePath,
      plan: planArrowGPUConversion(device, sourceVector, {
        ...column,
        name: column.name,
        field: column.field ?? sourceField
      })
    };
  });
  return {
    columns,
    length: table.numRows,
    cost: sumConversionCosts(columns.map(column => column.plan.cost)),
    estimatedPeakGPUBytes: estimatePeakGPUBytes(columns)
  };
}

/** Converts selected Arrow table columns into a batch-preserving generic GPU table. */
export async function convertArrowTableToGPUTable(
  device: Device,
  table: Table,
  schema: ArrowGPUTableConversionSchema
): Promise<PreparedArrowGPUTable> {
  const plan = planArrowTableGPUConversion(device, table, schema);
  const preparedColumns: PreparedArrowGPUVector[] = [];
  try {
    for (const column of schema.columns) {
      const sourcePath = column.source ?? column.name;
      const sourceVector = getArrowVectorByPath(table, sourcePath);
      const sourceField = getArrowFieldByPath(table, sourcePath);
      preparedColumns.push(
        await convertArrowToGPUVector(device, sourceVector, {
          ...column,
          name: column.name,
          field: column.field ?? sourceField
        })
      );
    }
    validatePreparedTableColumns(preparedColumns, table.numRows);
    const vectors = Object.fromEntries(
      schema.columns.map((column, index) => [column.name, preparedColumns[index].vector])
    );
    const fields = schema.columns.map((column, index): GPUField => {
      const sourcePath = column.source ?? column.name;
      const sourceField = getArrowFieldByPath(table, sourcePath);
      const preparedField = preparedColumns[index].field;
      return {
        name: column.name,
        format: preparedColumns[index].vector.format,
        nullable: sourceField.nullable,
        metadata: new Map(preparedField?.metadata ?? sourceField.metadata)
      };
    });
    const gpuBatches = table.batches.map((batch, batchIndex) => {
      const gpuData = Object.fromEntries(
        schema.columns.map((column, columnIndex) => [
          column.name,
          preparedColumns[columnIndex].vector.data[batchIndex]
        ])
      );
      return new GPURecordBatch({
        gpuData,
        fields,
        metadata: new Map(batch.schema.metadata),
        numRows: batch.numRows,
        nullCount: batch.nullCount,
        sourceInfo: {
          sourceBatchIndex: batchIndex,
          sourceRowIndexOffset: table.batches
            .slice(0, batchIndex)
            .reduce((rowCount, sourceBatch) => rowCount + sourceBatch.numRows, 0),
          sourceRowCount: batch.numRows
        }
      });
    });
    const gpuTable = new GPUTable({batches: gpuBatches});
    let destroyed = false;
    return {
      table: gpuTable,
      vectors,
      plan,
      destroy: () => {
        if (destroyed) return;
        destroyed = true;
        gpuTable.destroy();
      }
    };
  } catch (error) {
    for (const prepared of preparedColumns) prepared.destroy();
    throw error;
  }
}

/** Converts one Arrow record batch without combining it with earlier or later batches. */
export async function convertArrowRecordBatchToGPURecordBatch(
  device: Device,
  recordBatch: RecordBatch,
  schema: ArrowGPUTableConversionSchema,
  options: {sourceBatchIndex?: number; sourceRowIndexOffset?: number} = {}
): Promise<PreparedArrowGPURecordBatch> {
  const preparedTable = await convertArrowTableToGPUTable(device, new Table([recordBatch]), schema);
  const [batch] = preparedTable.table.detachBatches();
  if (!batch) {
    preparedTable.destroy();
    throw new Error('Arrow record-batch conversion did not produce a GPU batch');
  }
  Object.assign(batch.sourceInfo!, {
    sourceBatchIndex: options.sourceBatchIndex ?? 0,
    sourceRowIndexOffset: options.sourceRowIndexOffset ?? 0,
    sourceRowCount: recordBatch.numRows
  });
  let destroyed = false;
  return {
    batch,
    vectors: preparedTable.vectors,
    plan: preparedTable.plan,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      batch.destroy();
    }
  };
}

/**
 * Converts an Arrow record-batch stream incrementally while preserving batch ownership.
 *
 * Temporal columns reuse the first prepared origin in later batches unless the schema supplies an
 * explicit origin. Consumers own each yielded batch and should destroy it after use.
 * Output GPU formats must match the first batch. Cancellation or validation failure destroys
 * unyielded results; an in-flight conversion finishes before its result can be released.
 */
export async function* convertArrowRecordBatchesToGPURecordBatches(
  device: Device,
  source: ArrowRecordBatchConversionSource,
  schema: ArrowGPUTableConversionSchema,
  {
    signal,
    maxBatchPayloadBytes,
    maxBatchGPUBytes,
    splitOversizedBatches
  }: ArrowRecordBatchConversionOptions = {}
): AsyncGenerator<PreparedArrowGPURecordBatch> {
  if (
    maxBatchPayloadBytes !== undefined &&
    (!Number.isSafeInteger(maxBatchPayloadBytes) || maxBatchPayloadBytes < 0)
  ) {
    throw new Error('Arrow GPU stream payload budget must be a nonnegative safe integer');
  }
  if (
    maxBatchGPUBytes !== undefined &&
    (!Number.isSafeInteger(maxBatchGPUBytes) || maxBatchGPUBytes < 0)
  ) {
    throw new Error('Arrow GPU stream peak budget must be a nonnegative safe integer');
  }
  const temporalOrigins = new Map<string, number | bigint>();
  const formats = new Map<string, string | undefined>();
  let sourceBatchIndex = 0;
  let sourceRowIndexOffset = 0;
  for await (const recordBatch of iterateSource(source, signal)) {
    let rowOffset = 0;
    do {
      signal?.throwIfAborted();
      const batchSchema: ArrowGPUTableConversionSchema = {
        columns: schema.columns.map(column => {
          const origin = temporalOrigins.get(column.name);
          return origin === undefined || column.temporal?.origin !== undefined
            ? column
            : {...column, temporal: {...column.temporal, origin}};
        })
      };
      let slice = rowOffset === 0 ? recordBatch : recordBatch.slice(rowOffset);
      if (maxBatchPayloadBytes !== undefined || maxBatchGPUBytes !== undefined) {
        while (true) {
          const plan = planArrowTableGPUConversion(device, new Table([slice]), batchSchema);
          const payload = plan.cost.targetByteLength;
          const peak = plan.estimatedPeakGPUBytes;
          const exceedsPayload =
            maxBatchPayloadBytes !== undefined && payload > maxBatchPayloadBytes;
          const exceedsPeak = maxBatchGPUBytes !== undefined && peak > maxBatchGPUBytes;
          if (!exceedsPayload && !exceedsPeak) break;
          if (!splitOversizedBatches || slice.numRows <= 1) {
            const location = splitOversizedBatches ? ' at row ' + sourceRowIndexOffset : '';
            const requirement = exceedsPayload
              ? payload + ' payload bytes, exceeding the ' + maxBatchPayloadBytes
              : 'an estimated ' + peak + ' peak GPU bytes, exceeding the ' + maxBatchGPUBytes;
            throw new Error(
              'Arrow GPU stream batch ' +
                sourceBatchIndex +
                location +
                ' needs ' +
                requirement +
                ' byte budget'
            );
          }
          slice = recordBatch.slice(rowOffset, rowOffset + Math.floor(slice.numRows / 2));
        }
      }
      const prepared = await convertArrowRecordBatchToGPURecordBatch(device, slice, batchSchema, {
        sourceBatchIndex,
        sourceRowIndexOffset
      });
      try {
        signal?.throwIfAborted();
        for (const [name, vector] of Object.entries(prepared.vectors)) {
          const expected = formats.get(name);
          if (formats.has(name) && vector.format !== expected) {
            throw new Error(
              `Arrow stream column "${name}" format changed: ${expected} -> ${vector.format}`
            );
          }
          formats.set(name, vector.format);
        }
        captureStreamingTemporalOrigins(slice, schema, prepared.batch, temporalOrigins);
      } catch (error) {
        prepared.destroy();
        throw error;
      }
      yield prepared;
      sourceRowIndexOffset += slice.numRows;
      rowOffset += slice.numRows;
    } while (rowOffset < recordBatch.numRows);
    sourceBatchIndex++;
  }
}

/**
 * Consumes prepared GPU batches one at a time and releases them before reading the next batch.
 * The callback borrows the batch until its returned promise settles. Await any GPU work that
 * still uses the batch before returning. Cancellation is observed between callbacks and is
 * available to an in-flight callback through the supplied signal.
 */
export async function consumeArrowGPURecordBatches(
  device: Device,
  source: ArrowRecordBatchConversionSource,
  schema: ArrowGPUTableConversionSchema,
  consume: (batch: PreparedArrowGPURecordBatch, signal?: AbortSignal) => void | Promise<void>,
  options: ArrowRecordBatchConversionOptions = {}
): Promise<void> {
  for await (const prepared of convertArrowRecordBatchesToGPURecordBatches(
    device,
    source,
    schema,
    options
  )) {
    try {
      options.signal?.throwIfAborted();
      await consume(prepared, options.signal);
      options.signal?.throwIfAborted();
    } finally {
      prepared.destroy();
    }
  }
}

function validateTableConversionSchema(schema: ArrowGPUTableConversionSchema): void {
  if (schema.columns.length === 0) {
    throw new Error('Arrow GPU table conversion schema requires at least one column');
  }
  const names = new Set<string>();
  for (const column of schema.columns) {
    if (!column.name || names.has(column.name)) {
      throw new Error(`Arrow GPU table conversion requires unique non-empty column names`);
    }
    names.add(column.name);
  }
}

function validatePreparedTableColumns(
  preparedColumns: readonly PreparedArrowGPUVector[],
  rowCount: number
): void {
  const first = preparedColumns[0];
  if (!first) throw new Error('Arrow GPU table conversion produced no columns');
  const chunkCount = first.vector.data.length;
  const chunkLengths = first.vector.data.map(data => data.length);
  for (const prepared of preparedColumns) {
    if (prepared.vector.length !== rowCount) {
      throw new Error('Arrow GPU table conversion requires source-aligned row counts');
    }
    if (
      prepared.vector.data.length !== chunkCount ||
      prepared.vector.data.some((data, index) => data.length !== chunkLengths[index])
    ) {
      throw new Error('Arrow GPU table conversion requires preserved, aligned chunk boundaries');
    }
  }
}

function captureStreamingTemporalOrigins(
  recordBatch: RecordBatch,
  schema: ArrowGPUTableConversionSchema,
  gpuBatch: GPURecordBatch,
  temporalOrigins: Map<string, number | bigint>
): void {
  for (const column of schema.columns) {
    if (column.temporal?.origin !== undefined || temporalOrigins.has(column.name)) continue;
    const sourcePath = column.source ?? column.name;
    const sourceVector = getArrowVectorByPath(recordBatch, sourcePath);
    const sourceField = getArrowFieldByPath(recordBatch, sourcePath);
    const temporalInfo = getArrowTemporalVectorInfo(sourceVector, column.field ?? sourceField);
    if (!temporalInfo) continue;
    const outputField = gpuBatch.schema.fields.find(field => field.name === column.name);
    const origin = outputField?.metadata?.get(TEMPORAL_ORIGIN_METADATA_KEY);
    if (origin !== undefined) {
      temporalOrigins.set(
        column.name,
        temporalInfo.bitWidth === 64 ? BigInt(origin) : Number(origin)
      );
    }
  }
}

/** Estimates peak bytes from previously retained outputs and one active column conversion. */
function estimatePeakGPUBytes(columns: ArrowGPUTableConversionPlan['columns']): number {
  let retained = 0;
  let peak = 0;
  for (const {plan} of columns) {
    if (!plan.cost.allocatesGPUStorage) continue;
    // Reserve padding and minimum-sized allocations for each destination chunk.
    retained += plan.cost.targetByteLength + plan.chunkCount * 8;
    peak = Math.max(peak, retained + plan.cost.temporaryGPUByteLength);
  }
  return peak;
}

function sumConversionCosts(costs: readonly ArrowGPUConversionCost[]): ArrowGPUConversionCost {
  return costs.reduce<ArrowGPUConversionCost>(
    (sum, cost) => ({
      sourceByteLength: sum.sourceByteLength + cost.sourceByteLength,
      targetByteLength: sum.targetByteLength + cost.targetByteLength,
      temporaryGPUByteLength: sum.temporaryGPUByteLength + cost.temporaryGPUByteLength,
      uploadCount: sum.uploadCount + cost.uploadCount,
      cpuPassCount: sum.cpuPassCount + cost.cpuPassCount,
      gpuPassCount: sum.gpuPassCount + cost.gpuPassCount,
      allocatesGPUStorage: sum.allocatesGPUStorage || cost.allocatesGPUStorage
    }),
    {
      sourceByteLength: 0,
      targetByteLength: 0,
      temporaryGPUByteLength: 0,
      uploadCount: 0,
      cpuPassCount: 0,
      gpuPassCount: 0,
      allocatesGPUStorage: false
    }
  );
}
