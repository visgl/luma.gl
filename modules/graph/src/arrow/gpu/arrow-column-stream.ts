// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {Vector} from 'apache-arrow';
import {getArrowVectorByPath} from '../arrow-utils/arrow-paths';
import {
  convertArrowColumnToGPUVector,
  getArrowConversionFormat,
  type ArrowColumnFormatOptions,
  type ArrowColumnGPUVectorOptions,
  type PreparedArrowColumnGPUVector
} from './arrow-column-gpu-vector';
import type {ArrowRecordBatchConversionSource} from './arrow-gpu-table-conversion';
import {
  convertArrowStream,
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

/** Fixed-width stream options with format inference from the Arrow schema. */
export type ArrowColumnStreamOptions = Partial<ArrowColumnGPUVectorOptions> &
  ArrowColumnFormatOptions;

/** Resolves the format and null handling before uploading a column. */
function convertStreamColumn(device: Device, vector: Vector, options: ArrowColumnStreamOptions) {
  const semantic = options.semantic ?? (options.color ? 'color' : 'auto');
  const format = getArrowConversionFormat(vector.type, {...options, semantic});
  return convertArrowColumnToGPUVector(device, vector, {
    ...options,
    format,
    color: options.color ?? (semantic === 'color' || format === 'unorm8x4'),
    preserveNulls: options.preserveNulls ?? false
  });
}

/** Named fixed-width column conversion within each source record batch. */
export type ArrowGPUColumnStreamColumn = ArrowColumnStreamOptions & {
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
  columnOptions: ArrowColumnStreamOptions = {},
  options: ArrowConversionStreamOptions = {}
): AsyncGenerator<PreparedArrowGPUColumnChunk> {
  const formats = new Map<string, ArrowColumnFormats>();
  let sourceBatchIndex = 0;
  let sourceRowIndexOffset = 0;
  yield* convertArrowStream(
    source,
    vector => ({
      ...convertStreamColumn(device, vector, columnOptions),
      sourceBatchIndex,
      sourceRowIndexOffset
    }),
    (prepared, vector) => {
      validateColumnFormats(formats, columnOptions.name ?? 'column', prepared);
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
  const formats = new Map<string, ArrowColumnFormats>();
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
          if (vector.length !== batch.numRows) {
            throw new Error(
              `Arrow column "${column.source ?? column.name}" rows do not match the batch`
            );
          }
          preparedColumns[column.name] = convertStreamColumn(device, vector, column);
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

/** GPU formats for a column and its optional companion vectors. */
type ArrowColumnFormats = {
  value: string | undefined;
  residual?: string;
  validity?: string;
};

/** Checks that subsequent chunks keep the first chunk's formats and companion vectors. */
function validateColumnFormats(
  formats: Map<string, ArrowColumnFormats>,
  name: string,
  column: PreparedArrowColumnGPUVector
): void {
  const actual = {
    value: column.vector.format,
    residual: column.residualVector?.format,
    validity: column.validityVector?.format
  };
  const expected = formats.get(name);
  if (!expected) {
    formats.set(name, actual);
    return;
  }
  for (const kind of ['value', 'residual', 'validity'] as const) {
    if (expected[kind] !== actual[kind]) {
      throw new Error(
        `Arrow stream column "${name}" ${kind} format changed: ${expected[kind] ?? 'missing'} -> ${actual[kind] ?? 'missing'}`
      );
    }
  }
}
