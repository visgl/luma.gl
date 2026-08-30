// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import type {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import type {GPUTable, GPUTypeMap} from '@luma.gl/experimental/gpu-tables';
import {
  Dictionary,
  Field,
  Float32,
  Int32,
  RecordBatch,
  Schema,
  Struct,
  Table,
  Uint32,
  Utf8,
  makeData,
  vectorFromArray,
  type Data,
  type DataType
} from 'apache-arrow';
import type {GPUAnalyticsDictionary} from './arrow-gpu-analytics-adapters';

/** Explicit GPU analytics materialization controls; no readback occurs before invocation. */
export type ArrowTableFromGPUAnalyticsTableProps<T extends GPUTypeMap = GPUTypeMap> = {
  /** GPU-resident source or result table; original record batches remain individually addressable. */
  table: GPUTable<T>;
  /** Nullable source/result masks, aligned with the corresponding GPU table batches. */
  validity?: Readonly<Partial<Record<keyof T & string, GPUVector<'uint32'>>>>;
  /** Adapter-owned UTF-8 category labels and ordering metadata. */
  dictionaries?: Readonly<
    Partial<Record<keyof T & string, GPUAnalyticsDictionary | readonly string[]>>
  >;
  /** Stable compacted source-row identities, one chunk for every original source batch. */
  rowIndices?: GPUVector<'uint32'>;
  /** One published row count per original source batch; requires `rowIndices`. */
  selectedCounts?: GPUVector<'uint32'>;
  /** Explicit globally ordered source identities; materializes one reordered output batch. */
  globalRowIndices?: GPUVector<'uint32'>;
  /** One GPU-resident global selected count; requires `globalRowIndices`. */
  globalSelectedCount?: GPUVector<'uint32'>;
};

type ArrowAnalyticsRow = {batchIndex: number; rowIndex: number};

/**
 * Explicitly reads a GPU analytical table into Arrow without adding Arrow to generic GPU packages.
 *
 * Ordinary materialization preserves every source batch, including empty chunks. Optional
 * dataframe selection identities retain those batch boundaries, while explicitly requested global
 * identities produce one intentionally reordered Arrow result batch.
 */
export async function makeArrowTableFromGPUAnalyticsTable<T extends GPUTypeMap>(
  props: ArrowTableFromGPUAnalyticsTableProps<T>
): Promise<Table> {
  validateArrowGPUAnalyticsReadback(props);
  const fields = props.table.schema.fields.map((field, fieldIndex) => {
    const dictionary = props.dictionaries?.[field.name];
    const type = dictionary
      ? makeArrowAnalyticsDictionaryType(props.table, field.name, dictionary, fieldIndex)
      : makeArrowAnalyticsScalarType(field.format);
    return new Field(field.name, type, field.nullable, new Map(field.metadata));
  });
  const schema = new Schema(fields, new Map(props.table.schema.metadata));
  const rowGroups = await resolveArrowAnalyticsRows(props);
  const batches = await Promise.all(
    rowGroups.map(async rows => {
      const children = await Promise.all(
        fields.map((field, fieldIndex) => makeArrowAnalyticsColumn(props, field, fieldIndex, rows))
      );
      return new RecordBatch(
        schema,
        makeData({type: new Struct(schema.fields), length: rows.length, children})
      );
    })
  );
  return new Table(schema, batches);
}

/** Rejects ambiguous ordering contracts and malformed chunk metadata before any GPU readback. */
function validateArrowGPUAnalyticsReadback<T extends GPUTypeMap>(
  props: ArrowTableFromGPUAnalyticsTableProps<T>
): void {
  const local = Boolean(props.rowIndices || props.selectedCounts);
  const global = Boolean(props.globalRowIndices || props.globalSelectedCount);
  if (local && global) {
    throw new Error('Arrow analytics output cannot combine per-batch and global row ordering');
  }
  if (Boolean(props.rowIndices) !== Boolean(props.selectedCounts)) {
    throw new Error('Arrow analytics selected rows require both row indices and selected counts');
  }
  if (Boolean(props.globalRowIndices) !== Boolean(props.globalSelectedCount)) {
    throw new Error('Arrow analytics global rows require both global indices and selected count');
  }
  if (
    local &&
    (props.rowIndices!.data.length !== props.table.batches.length ||
      props.selectedCounts!.data.length !== props.table.batches.length)
  ) {
    throw new Error('Arrow analytics selected rows must preserve source batch topology');
  }
  if (
    global &&
    (props.globalRowIndices!.data.length !== 1 || props.globalSelectedCount!.length !== 1)
  ) {
    throw new Error('Arrow analytics global ordering requires one index chunk and one count');
  }
  for (const field of props.table.schema.fields) {
    const validity = props.validity?.[field.name];
    if (field.nullable && props.table.batches.length > 0 && !validity) {
      throw new Error(`Arrow analytics nullable column "${field.name}" requires GPU validity`);
    }
    if (
      validity &&
      (validity.data.length !== props.table.batches.length ||
        validity.data.some((chunk, index) => chunk.length !== props.table.batches[index].numRows))
    ) {
      throw new Error(`Arrow analytics validity for "${field.name}" must match source batches`);
    }
    makeArrowAnalyticsScalarType(field.format);
  }
}

/** Resolves explicit selected/global identities without implicitly concatenating source columns. */
async function resolveArrowAnalyticsRows<T extends GPUTypeMap>(
  props: ArrowTableFromGPUAnalyticsTableProps<T>
): Promise<ArrowAnalyticsRow[][]> {
  if (props.globalRowIndices && props.globalSelectedCount) {
    const [count] = await readArrowAnalyticsWords(props.globalSelectedCount.data[0]);
    if (count > props.globalRowIndices.data[0].length) {
      throw new Error('Arrow analytics global selected count exceeds the available row identities');
    }
    const sourceRows = await readArrowAnalyticsWords(props.globalRowIndices.data[0], count);
    return [
      Array.from(sourceRows, sourceRow => resolveArrowAnalyticsSourceRow(props.table, sourceRow))
    ];
  }
  return Promise.all(
    props.table.batches.map(async (batch, batchIndex) => {
      if (!props.rowIndices || !props.selectedCounts) {
        return Array.from({length: batch.numRows}, (_, rowIndex) => ({batchIndex, rowIndex}));
      }
      const [count] = await readArrowAnalyticsWords(props.selectedCounts.data[batchIndex]);
      const identities = props.rowIndices.data[batchIndex];
      if (count > identities.length || count > batch.numRows) {
        throw new Error('Arrow analytics selected count exceeds its original source batch');
      }
      const sourceRows = await readArrowAnalyticsWords(identities, count);
      const sourceOffset = getArrowAnalyticsBatchOffset(props.table, batchIndex);
      return Array.from(sourceRows, sourceRow => {
        const rowIndex = sourceRow - sourceOffset;
        if (rowIndex < 0 || rowIndex >= batch.numRows) {
          throw new Error('Arrow analytics selected row does not belong to its source batch');
        }
        return {batchIndex, rowIndex};
      });
    })
  );
}

function resolveArrowAnalyticsSourceRow<T extends GPUTypeMap>(
  table: GPUTable<T>,
  sourceRow: number
): ArrowAnalyticsRow {
  for (const [batchIndex, batch] of table.batches.entries()) {
    const firstRow = getArrowAnalyticsBatchOffset(table, batchIndex);
    if (sourceRow >= firstRow && sourceRow < firstRow + batch.numRows) {
      return {batchIndex, rowIndex: sourceRow - firstRow};
    }
  }
  throw new Error('Arrow analytics global row does not belong to any original source batch');
}

function getArrowAnalyticsBatchOffset<T extends GPUTypeMap>(
  table: GPUTable<T>,
  batchIndex: number
): number {
  const explicitOffset = table.batches[batchIndex].sourceInfo?.sourceRowIndexOffset;
  if (explicitOffset !== undefined) return explicitOffset;
  return table.batches.slice(0, batchIndex).reduce((total, batch) => total + batch.numRows, 0);
}

async function makeArrowAnalyticsColumn<T extends GPUTypeMap>(
  props: ArrowTableFromGPUAnalyticsTableProps<T>,
  field: Field,
  fieldIndex: number,
  rows: readonly ArrowAnalyticsRow[]
): Promise<Data> {
  const format = props.table.schema.fields[fieldIndex].format;
  const sourceValues = new Map<number, Float32Array | Int32Array | Uint32Array>();
  const sourceValidity = new Map<number, Uint32Array>();
  await Promise.all(
    Array.from(new Set(rows.map(row => row.batchIndex))).map(async batchIndex => {
      const data = props.table.batches[batchIndex].gpuData[field.name];
      const bytes = await readArrowAnalyticsBytes(data);
      const Constructor =
        format === 'float32' ? Float32Array : format === 'sint32' ? Int32Array : Uint32Array;
      sourceValues.set(
        batchIndex,
        new Constructor(bytes.buffer as ArrayBuffer, bytes.byteOffset, data.length)
      );
      const validity = props.validity?.[field.name]?.data[batchIndex];
      if (validity) sourceValidity.set(batchIndex, await readArrowAnalyticsWords(validity));
    })
  );
  const Constructor =
    format === 'float32' ? Float32Array : format === 'sint32' ? Int32Array : Uint32Array;
  const values = new Constructor(rows.length);
  const nullBitmap = new Uint8Array(Math.ceil(rows.length / 8));
  let nullCount = 0;
  for (const [outputIndex, row] of rows.entries()) {
    values[outputIndex] = sourceValues.get(row.batchIndex)![row.rowIndex];
    const valid = sourceValidity.get(row.batchIndex)?.[row.rowIndex] !== 0;
    if (valid) {
      nullBitmap[outputIndex >> 3] |= 1 << (outputIndex & 7);
    } else {
      nullCount++;
    }
  }
  if (field.type instanceof Dictionary) {
    const metadata = props.dictionaries?.[field.name];
    if (!metadata) throw new Error(`Arrow analytics dictionary "${field.name}" is missing`);
    const labels: readonly string[] = isArrowAnalyticsDictionary(metadata)
      ? metadata.values
      : (metadata as readonly string[]);
    return makeData({
      type: field.type,
      length: rows.length,
      data: values as Int32Array | Uint32Array,
      dictionary: vectorFromArray(labels, new Utf8()),
      nullBitmap,
      nullCount
    });
  }
  return makeData({type: field.type, length: rows.length, data: values, nullBitmap, nullCount});
}

function makeArrowAnalyticsDictionaryType<T extends GPUTypeMap>(
  table: GPUTable<T>,
  name: keyof T & string,
  metadata: GPUAnalyticsDictionary | readonly string[],
  fieldIndex: number
): Dictionary<Utf8, Int32 | Uint32> {
  const existingType = table.gpuVectors[name]?.dataType;
  if (existingType instanceof Dictionary) return existingType as Dictionary<Utf8, Int32 | Uint32>;
  const format = table.schema.fields[fieldIndex].format;
  if (format !== 'sint32' && format !== 'uint32') {
    throw new Error(`Arrow analytics dictionary "${name}" requires 32-bit integer indices`);
  }
  return new Dictionary(
    new Utf8(),
    format === 'sint32' ? new Int32() : new Uint32(),
    fieldIndex,
    isArrowAnalyticsDictionary(metadata) ? metadata.ordered : false
  );
}

function isArrowAnalyticsDictionary(
  value: GPUAnalyticsDictionary | readonly string[]
): value is GPUAnalyticsDictionary {
  return !Array.isArray(value);
}

function makeArrowAnalyticsScalarType(format: string | undefined): DataType {
  switch (format) {
    case 'float32':
      return new Float32();
    case 'sint32':
      return new Int32();
    case 'uint32':
      return new Uint32();
    default:
      throw new Error(`Arrow analytics output does not support GPU format "${format}"`);
  }
}

async function readArrowAnalyticsWords(
  data: GPUData<'uint32'>,
  length = data.length
): Promise<Uint32Array> {
  const bytes = await readArrowAnalyticsBytes(data, length);
  return new Uint32Array(bytes.buffer, bytes.byteOffset, length);
}

async function readArrowAnalyticsBytes(data: GPUData, length = data.length): Promise<Uint8Array> {
  if (data.byteStride !== 4 || data.rowByteLength !== 4 || data.byteOffset % 4 !== 0) {
    throw new Error('Arrow analytics output requires packed 32-bit GPU scalar data');
  }
  if (length === 0) return new Uint8Array(0);
  const buffer = data.buffer instanceof Buffer ? data.buffer : data.buffer.buffer;
  return buffer.readAsync(data.byteOffset, length * Uint32Array.BYTES_PER_ELEMENT);
}
