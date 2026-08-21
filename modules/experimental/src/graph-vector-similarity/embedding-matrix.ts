// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuVS.

import {
  GPURecordBatch,
  GPU_TABLE_INDEX_COLUMN_NAME,
  getGPUVectorFormatInfo,
  isFixedSizeListGPUVectorFormat,
  type FixedSizeList,
  type GPUData,
  type GPUTable,
  type GPUVector
} from '@luma.gl/tables';
import type {GPUCommandGraph, GraphDataView} from '../gpu-primitives/gpu-command-graph';
import type {GraphEmbeddingMatrix, GraphEmbeddingMatrixChunk} from './types';

const FLOAT32_BYTE_LENGTH = Float32Array.BYTES_PER_ELEMENT;
const INVALID_SOURCE_ROW_ID = 0xffff_ffff;

/** Optional row-aligned metadata for importing a caller-owned embedding column. */
export type ImportGPUEmbeddingVectorOptions = {
  /** Prefix shared by the imported caller-owned graph buffers. */
  id?: string;
  /** Optional meaningful feature count when trailing fixed-list coordinates are padding. */
  dimensions?: number;
  /** Optional chunk-preserving stable identifiers for the embedding rows. */
  sourceRowIds?: GPUVector<'uint32'>;
  /** Optional chunk-preserving validity flags; zero rejects a row. */
  validity?: GPUVector<'uint32'>;
  /** Position of the first source row when chunk offsets are consecutive. */
  sourceRowOffset?: number;
  /** Explicit first source-row position for each preserved embedding chunk. */
  sourceRowOffsets?: readonly number[];
};

/** Selects one caller-owned embedding column and optional row-aligned table columns. */
export type ImportGPUEmbeddingTableOptions = {
  /** Name of the fixed-size-list<float32,N> table or record-batch column. */
  column: string;
  /** Prefix shared by the imported caller-owned graph buffers. */
  id?: string;
  /** Optional meaningful feature count when trailing fixed-list coordinates are padding. */
  dimensions?: number;
  /** Optional name of the uint32 column providing stable source-row identifiers. */
  sourceRowIds?: string;
  /** Optional name of the uint32 column providing nonzero-valid row flags. */
  validity?: string;
};

/** Caller-owned batch data that becomes one non-owning command-graph embedding chunk. */
type GPUEmbeddingChunkSource = {
  data: GPUData<FixedSizeList<'float32'>>;
  sourceRowOffset: number;
  sourceRowIds?: GPUData<'uint32'>;
  validity?: GPUData<'uint32'>;
};

/**
 * Borrows one first-class fixed-size-list<float32,N> GPU table column for graph-native search.
 *
 * GPUData chunks remain caller-owned and keep their logical row counts, byte offsets, physical
 * padding, optional row metadata, and ordered batch boundaries. No GPU memory is allocated.
 */
export function importGPUEmbeddingVector<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  vector: GPUVector<FixedSizeList<'float32'>>,
  options: ImportGPUEmbeddingVectorOptions = {}
): GraphEmbeddingMatrix {
  const dimensions = getEmbeddingDimensions(vector.format, 'Embedding vector', options.dimensions);
  if (!Number.isSafeInteger(vector.length) || vector.length < 0) {
    throw new Error('Embedding vector row count must be a non-negative safe integer');
  }
  validateOptionalRowVector(options.sourceRowIds, vector, 'source-row IDs');
  validateOptionalRowVector(options.validity, vector, 'validity flags');
  if (options.sourceRowOffsets && options.sourceRowOffsets.length !== vector.data.length) {
    throw new Error('Embedding source-row offsets must preserve the vector chunk topology');
  }

  let nextSourceRowOffset = options.sourceRowOffset ?? 0;
  const sources = vector.data.map((data, chunkIndex): GPUEmbeddingChunkSource => {
    const sourceRowOffset = options.sourceRowOffsets?.[chunkIndex] ?? nextSourceRowOffset;
    nextSourceRowOffset = sourceRowOffset + data.length;
    return {
      data,
      sourceRowOffset,
      ...(options.sourceRowIds ? {sourceRowIds: options.sourceRowIds.data[chunkIndex]} : {}),
      ...(options.validity ? {validity: options.validity.data[chunkIndex]} : {})
    };
  });

  return importEmbeddingChunks(
    graph,
    dimensions,
    vector.length,
    sources,
    options.id ?? vector.name ?? 'embedding-vector'
  );
}

/**
 * Borrows one first-class embedding column from an existing GPU table or record batch.
 *
 * Existing GPURecordBatch.sourceInfo preserves source-row positions. Explicit stable identifiers
 * and validity remain ordinary caller-selected uint32 sibling columns owned by the source table.
 */
export function importGPUEmbeddingTable<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  source: GPUTable | GPURecordBatch,
  options: ImportGPUEmbeddingTableOptions
): GraphEmbeddingMatrix {
  const field = source.schema.fields.find(candidate => candidate.name === options.column);
  if (!field) {
    throw new Error(`Embedding table does not contain column "${options.column}"`);
  }
  const dimensions = getEmbeddingDimensions(
    field.format,
    `Embedding column "${options.column}"`,
    options.dimensions
  );
  const batches = source instanceof GPURecordBatch ? [source] : source.batches;
  let nextSourceRowOffset = 0;

  const sources = batches.map((batch, batchIndex): GPUEmbeddingChunkSource => {
    const data = batch.gpuData[options.column];
    assertEmbeddingData(data, field.format, options.column);
    const sourceRowOffset = batch.sourceInfo?.sourceRowIndexOffset ?? nextSourceRowOffset;
    nextSourceRowOffset = sourceRowOffset + batch.numRows;
    const sourceIdsName =
      options.sourceRowIds ??
      (batch.gpuData[GPU_TABLE_INDEX_COLUMN_NAME]?.format === 'uint32'
        ? GPU_TABLE_INDEX_COLUMN_NAME
        : undefined);
    const sourceRowIds = sourceIdsName
      ? getBatchRowData(batch, sourceIdsName, 'source-row IDs', batchIndex)
      : undefined;
    const validity = options.validity
      ? getBatchRowData(batch, options.validity, 'validity flags', batchIndex)
      : undefined;
    return {
      data,
      sourceRowOffset,
      ...(sourceRowIds ? {sourceRowIds} : {}),
      ...(validity ? {validity} : {})
    };
  });

  return importEmbeddingChunks(
    graph,
    dimensions,
    source.numRows,
    sources,
    options.id ?? options.column
  );
}

function getEmbeddingDimensions(
  format: string | undefined,
  name: string,
  requestedDimensions?: number
): number {
  if (!format || !isFixedSizeListGPUVectorFormat(format)) {
    throw new Error(`${name} must use a fixed-size-list<float32,N> GPU vector format`);
  }
  const formatInfo = getGPUVectorFormatInfo(format);
  if (formatInfo.elementFormat !== 'float32' || !formatInfo.listSize) {
    throw new Error(`${name} must use a fixed-size-list<float32,N> GPU vector format`);
  }
  const dimensions = requestedDimensions ?? formatInfo.listSize;
  if (!Number.isSafeInteger(dimensions) || dimensions < 1 || dimensions > formatInfo.listSize) {
    throw new Error(`${name} dimensions must be positive and fit within its fixed-size-list rows`);
  }
  return dimensions;
}

function assertEmbeddingData(
  data: GPUData | undefined,
  expectedFormat: string | undefined,
  column: string
): asserts data is GPUData<FixedSizeList<'float32'>> {
  if (!data || data.format !== expectedFormat) {
    throw new Error(`Embedding column "${column}" must retain the same format in every batch`);
  }
}

function validateOptionalRowVector(
  metadata: GPUVector<'uint32'> | undefined,
  embeddings: GPUVector<FixedSizeList<'float32'>>,
  name: string
): void {
  if (!metadata) return;
  if (
    metadata.format !== 'uint32' ||
    metadata.length !== embeddings.length ||
    metadata.data.length !== embeddings.data.length ||
    metadata.data.some((data, chunkIndex) => data.length !== embeddings.data[chunkIndex].length)
  ) {
    throw new Error(`Embedding ${name} must be a chunk-aligned uint32 GPU vector`);
  }
}

function getBatchRowData(
  batch: GPURecordBatch,
  column: string,
  name: string,
  batchIndex: number
): GPUData<'uint32'> {
  const data = batch.gpuData[column];
  assertBatchRowData(data, batch.numRows, name, batchIndex);
  return data;
}

function assertBatchRowData(
  data: GPUData | undefined,
  rowCount: number,
  name: string,
  batchIndex: number
): asserts data is GPUData<'uint32'> {
  if (!data || data.format !== 'uint32' || data.length !== rowCount) {
    throw new Error(`Embedding ${name} must be a row-aligned uint32 column in batch ${batchIndex}`);
  }
}

function importEmbeddingChunks<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  dimensions: number,
  rowCount: number,
  sources: readonly GPUEmbeddingChunkSource[],
  identifier: string
): GraphEmbeddingMatrix {
  let totalRowCount = 0;
  for (const source of sources) {
    validateEmbeddingChunk(source, dimensions);
    totalRowCount += source.data.length;
  }
  if (totalRowCount !== rowCount || totalRowCount > INVALID_SOURCE_ROW_ID) {
    throw new Error('Embedding row count must equal its source chunk rows and fit into uint32');
  }
  const chunks = sources.map((source, chunkIndex) =>
    importEmbeddingChunk(graph, source, dimensions, `${identifier}-chunk-${chunkIndex}`)
  );
  return {dimensions, rowCount, chunks};
}

function validateEmbeddingChunk(source: GPUEmbeddingChunkSource, dimensions: number): void {
  const data = source.data;
  const formatInfo = data.format ? getGPUVectorFormatInfo(data.format) : undefined;
  const listSize = formatInfo?.listSize ?? 0;
  const expectedValueLength = data.length * listSize;
  if (
    !Number.isSafeInteger(data.length) ||
    data.length < 0 ||
    !formatInfo?.fixedSizeList ||
    formatInfo.elementFormat !== 'float32' ||
    dimensions > listSize ||
    !Number.isSafeInteger(expectedValueLength) ||
    data.valueLength !== expectedValueLength ||
    !Number.isSafeInteger(data.byteOffset) ||
    data.byteOffset < 0 ||
    data.byteOffset % FLOAT32_BYTE_LENGTH !== 0 ||
    !Number.isSafeInteger(data.byteStride) ||
    data.byteStride < listSize * FLOAT32_BYTE_LENGTH ||
    data.byteStride % FLOAT32_BYTE_LENGTH !== 0 ||
    !Number.isSafeInteger(data.rowByteLength) ||
    data.rowByteLength < listSize * FLOAT32_BYTE_LENGTH ||
    data.rowByteLength > data.byteStride ||
    !Number.isSafeInteger(source.sourceRowOffset) ||
    source.sourceRowOffset < 0 ||
    source.sourceRowOffset + data.length > INVALID_SOURCE_ROW_ID
  ) {
    throw new Error('Embedding chunk must describe aligned, bounded fixed-size float32 rows');
  }
  const byteLength =
    data.length === 0 ? 0 : (data.length - 1) * data.byteStride + dimensions * FLOAT32_BYTE_LENGTH;
  if (
    !Number.isSafeInteger(byteLength) ||
    !Number.isSafeInteger(data.byteOffset + byteLength) ||
    data.byteOffset + byteLength > data.buffer.byteLength
  ) {
    throw new Error('Embedding chunk rows exceed their declared GPUData byte range');
  }
  for (const metadata of [source.sourceRowIds, source.validity]) {
    if (
      metadata &&
      (metadata.format !== 'uint32' ||
        metadata.length !== data.length ||
        metadata.byteStride !== Uint32Array.BYTES_PER_ELEMENT ||
        metadata.rowByteLength !== Uint32Array.BYTES_PER_ELEMENT)
    ) {
      throw new Error('Embedding row metadata must be packed, row-aligned uint32 GPUData');
    }
  }
  if (source.sourceRowIds && hasNullEmbeddingRows(source.sourceRowIds)) {
    throw new Error('Embedding source-row IDs must not contain null values');
  }
  if (!source.validity && hasNullEmbeddingRows(data)) {
    throw new Error('Embedding rows containing null values require explicit GPU validity flags');
  }
}

function hasNullEmbeddingRows(data: GPUData): boolean {
  const nullBitmap = data.nullBitmap;
  if (!nullBitmap) return false;
  for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
    if ((nullBitmap[rowIndex >>> 3] & (1 << (rowIndex & 7))) === 0) {
      return true;
    }
  }
  return false;
}

function importEmbeddingChunk<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  source: GPUEmbeddingChunkSource,
  dimensions: number,
  identifier: string
): GraphEmbeddingMatrixChunk {
  const importedData = graph.importGPUData(`${identifier}-values`, source.data);
  const rowStride = source.data.byteStride / FLOAT32_BYTE_LENGTH;
  const valueLength =
    source.data.length === 0 ? 0 : (source.data.length - 1) * rowStride + dimensions;
  const values = graph.createDataView(importedData.buffer, {
    format: 'float32',
    length: valueLength,
    byteOffset: source.data.byteOffset
  });
  const sourceRowIds = importOptionalRowData(
    graph,
    source.sourceRowIds,
    `${identifier}-source-row-ids`
  );
  const validity = importOptionalRowData(graph, source.validity, `${identifier}-validity`);

  return {
    values,
    rowCount: source.data.length,
    rowStride,
    byteOffset: source.data.byteOffset,
    sourceRowOffset: source.sourceRowOffset,
    ...(sourceRowIds ? {sourceRowIds} : {}),
    ...(validity ? {validity} : {})
  };
}

function importOptionalRowData<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  data: GPUData<'uint32'> | undefined,
  identifier: string
): GraphDataView<'uint32'> | undefined {
  return data ? graph.importGPUData(identifier, data) : undefined;
}
