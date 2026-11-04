// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {Vector} from 'apache-arrow';
import {getArrowVectorByPath} from '../arrow-utils/arrow-paths';
import {
  convertArrowColumnToGPUVector,
  type ArrowColumnGPUVectorOptions,
  type PreparedArrowColumnGPUVector
} from './arrow-column-gpu-vector';
import type {ArrowRecordBatchConversionSource} from './arrow-gpu-table-conversion';
import {
  convertArrowStream,
  validateArrowStreamFormats,
  type ArrowConversionSource,
  type ArrowConversionStreamOptions
} from './arrow-conversion-stream';

/** Arrow vector chunks accepted by column-stream conversion. */
export type ArrowColumnConversionSource = ArrowConversionSource<Vector>;

/** One column result with its position in the source stream. */
export type PreparedArrowGPUColumnChunk = PreparedArrowColumnGPUVector & {
  /** Zero-based input chunk index, including empty chunks. */
  sourceBatchIndex: number;
  /** Number of rows preceding this chunk. */
  sourceRowIndexOffset: number;
};

/** Named fixed-width column conversion within each source record batch. */
export type ArrowGPUColumnStreamColumn = ArrowColumnGPUVectorOptions & {
  /** Unique output column name. */
  name: string;
  /** Arrow field path; defaults to the output name. */
  source?: string;
};

/** Independently owned column results for one source record batch. */
export type PreparedArrowGPUColumnBatch = {
  /** Values and optional residual/validity vectors keyed by column name. */
  columns: Readonly<Record<string, PreparedArrowColumnGPUVector>>;
  /** Number of rows in this batch. */
  length: number;
  /** Zero-based input batch index. */
  sourceBatchIndex: number;
  /** Number of rows preceding this batch. */
  sourceRowIndexOffset: number;
  /** Releases all owned column outputs; safe to call more than once. */
  destroy(): void;
};

/**
 * Converts one Arrow vector per pull, preserving its chunks and companion vectors.
 * Consumers own yielded results. Abort releases unyielded results and interrupts pending reads.
 * Main, residual and validity formats/presence must remain stable throughout the stream.
 */
export async function* convertArrowColumnsToGPUVectors(
  device: Device,
  source: ArrowColumnConversionSource,
  columnOptions: ArrowColumnGPUVectorOptions,
  options: ArrowConversionStreamOptions = {}
): AsyncGenerator<PreparedArrowGPUColumnChunk> {
  const formats = new Map<string, string | undefined>();
  let sourceBatchIndex = 0;
  let sourceRowIndexOffset = 0;
  yield* convertArrowStream(
    source,
    vector => ({
      ...convertArrowColumnToGPUVector(device, vector, columnOptions),
      sourceBatchIndex,
      sourceRowIndexOffset
    }),
    (prepared, vector) => {
      validateColumnFormats(formats, '', prepared);
      sourceBatchIndex++;
      sourceRowIndexOffset += vector.length;
    },
    options
  );
}

/**
 * Converts selected fixed-width columns without imposing the generic table planner's schema.
 * Row transforms, residual-low values and validity outputs use the column converter's options.
 * Batches are pulled on demand and remain separate; yielded outputs are caller-owned.
 */
export async function* convertArrowRecordBatchesToGPUColumns(
  device: Device,
  source: ArrowRecordBatchConversionSource,
  columns: readonly ArrowGPUColumnStreamColumn[],
  options: ArrowConversionStreamOptions = {}
): AsyncGenerator<PreparedArrowGPUColumnBatch> {
  const names = new Set(columns.map(column => column.name));
  if (!columns.length || names.size !== columns.length || names.has('')) {
    throw new Error('Arrow columns require unique non-empty names');
  }
  const formats = new Map<string, string | undefined>();
  let sourceBatchIndex = 0;
  let sourceRowIndexOffset = 0;
  yield* convertArrowStream(
    source,
    batch => {
      const preparedColumns: Record<string, PreparedArrowColumnGPUVector> = Object.create(null);
      let destroyed = false;
      const destroy = () => {
        if (destroyed) return;
        destroyed = true;
        for (const column of Object.values(preparedColumns)) column.destroy();
      };
      try {
        for (const column of columns) {
          const vector = getArrowVectorByPath(batch, column.source ?? column.name);
          preparedColumns[column.name] = convertArrowColumnToGPUVector(device, vector, column);
        }
        return {
          columns: preparedColumns,
          length: batch.numRows,
          sourceBatchIndex,
          sourceRowIndexOffset,
          destroy
        };
      } catch (error) {
        destroy();
        throw error;
      }
    },
    (prepared, batch) => {
      for (const [name, column] of Object.entries(prepared.columns)) {
        validateColumnFormats(formats, name, column);
      }
      sourceBatchIndex++;
      sourceRowIndexOffset += batch.numRows;
    },
    options
  );
}

function validateColumnFormats(
  formats: Map<string, string | undefined>,
  name: string,
  column: PreparedArrowColumnGPUVector
): void {
  validateArrowStreamFormats(formats, {
    [JSON.stringify([name, 'value'])]: column.vector.format,
    [JSON.stringify([name, 'residual'])]: column.residualVector?.format,
    [JSON.stringify([name, 'validity'])]: column.validityVector?.format
  });
}
