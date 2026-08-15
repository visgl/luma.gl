// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuVS.

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  type GPUCommandGraph,
  type GPUCommandGraphContributor,
  type GraphBufferUse,
  type GraphDataView,
  type GraphVectorView
} from '../gpu-primitives/gpu-command-graph';
import {
  createTransientView,
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewBindingRange,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from '../gpu-primitives/graph-data-view-utils';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../gpu-primitives/gpu-dispatch-utils';
import {GPUHashIndex} from '../gpu-primitives/gpu-hash-index';
import type {
  GPUEmbeddingFilterMask,
  GPUEmbeddingMetric,
  GPUSimilaritySearchProps,
  GraphEmbeddingMatrix,
  GraphEmbeddingMatrixChunk
} from './types';

const SEARCH_WORKGROUP_SIZE = 64;
const INVALID_SOURCE_ROW_ID = 0xffff_ffff;
const STORAGE_BINDING_ALIGNMENT = 256;
const SCALAR_BYTE_LENGTH = Uint32Array.BYTES_PER_ELEMENT;
const LINEAR_CANDIDATE_ALLOWLIST_LIMIT = 16;

type CandidateMembershipIndex = {
  keys: GraphDataView<'uint32'>;
  statistics: GraphDataView<'uint32'>;
  capacity: number;
};

type DatasetTile = {
  chunk: GraphEmbeddingMatrixChunk;
  chunkIndex: number;
  chunkRowOffset: number;
  sourceRowOffset: number;
  rowCount: number;
  values: GraphDataView<'float32'>;
  sourceRowIds?: GraphDataView<'uint32'>;
  validity?: GraphDataView<'uint32'>;
  filterMask?: GraphDataView<'uint32'>;
};

type QueryTile = {
  logicalRowOffset: number;
  rowCount: number;
  values: GraphDataView<'float32'>;
  rowStride: number;
  sourceRowOffset: number;
  sourceRowIds?: GraphDataView<'uint32'>;
  validity?: GraphDataView<'uint32'>;
  rowMetadata: GraphDataView<'uint32'>;
  outputIds: GraphDataView<'uint32'>;
  outputScores: GraphDataView<'float32'>;
  resultCounts: GraphDataView<'uint32'>;
  candidateCounts?: GraphDataView<'uint32'>;
};

/**
 * Exact, bounded, chunk-preserving WebGPU embedding similarity search.
 *
 * Squared Euclidean distance sorts ascending; inner product and cosine similarity sort descending.
 * Equal scores always sort by stable source-row ID. Non-finite rows are excluded. Cosine similarity
 * is one for two zero vectors and zero when exactly one vector is zero. Unfilled result slots use
 * source ID `0xffffffff` and the metric's worst infinite score.
 *
 * Original allocations are sharded at the device storage-binding limit. Each query invocation keeps
 * only its caller-owned top-K output, so no query-by-dataset distance matrix is materialized.
 */
export class GPUSimilaritySearch implements GPUCommandGraphContributor {
  /** Prefix shared by bounded graph passes and transient eligibility metadata. */
  readonly id: string;
  /** Caller-owned, chunk-preserving dataset embeddings. */
  readonly dataset: GraphEmbeddingMatrix;
  /** Caller-owned, chunk-preserving query embeddings. */
  readonly queries: GraphEmbeddingMatrix;
  /** Packed, query-major stable source IDs. */
  readonly outputIds: GraphDataView<'uint32'>;
  /** Packed, query-major float32 distance or similarity scores. */
  readonly outputScores: GraphDataView<'float32'>;
  /** Number of actual top-K results for each query row. */
  readonly resultCounts: GraphDataView<'uint32'>;
  /** Optional total eligible candidate count before top-K truncation. */
  readonly candidateCounts?: GraphDataView<'uint32'>;
  /** Maximum result count per query. */
  readonly k: number;
  /** Score metric and corresponding ordering direction. */
  readonly metric: GPUEmbeddingMetric;
  /** Optional source-row-aligned LuxFilter-compatible selection flags. */
  readonly filterMask?: GPUEmbeddingFilterMask;
  /** Optional stable-ID candidate allowlist. */
  readonly candidateIds?: GraphDataView<'uint32'>;
  /** Optional query-major, source-row-aligned selection flags. */
  readonly queryFilterMask?: GraphDataView<'uint32'>;
  /** Whether candidates sharing the query's stable ID are rejected. */
  readonly excludeSelf: boolean;
  /** Optional additional per-pass candidate-row ceiling. */
  readonly tileSize: number;

  private registered = false;

  /** Validates caller-owned resources without encoding, submitting, or reading GPU work. */
  constructor(props: GPUSimilaritySearchProps) {
    this.id = props.id ?? 'gpu-similarity-search';
    this.dataset = props.dataset;
    this.queries = props.queries;
    this.outputIds = props.outputIds;
    this.outputScores = props.outputScores;
    this.resultCounts = props.resultCounts;
    this.candidateCounts = props.candidateCounts;
    this.k = props.k;
    this.metric = props.metric ?? 'squared-euclidean';
    this.filterMask = props.filterMask;
    this.candidateIds = props.candidateIds;
    this.queryFilterMask = props.queryFilterMask;
    this.excludeSelf = props.excludeSelf ?? false;
    this.tileSize = props.tileSize ?? INVALID_SOURCE_ROW_ID;

    validateSearchConfiguration(this);
  }

  /**
   * Adds reusable bounded passes without implicit submission or hidden CPU synchronization.
   *
   * Every pass declares all physical source/destination dependencies. Imported buffer overrides are
   * resolved only during graph encoding, so one compiled search can run repeatedly with new inputs.
   */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.registered) {
      throw new Error(`${this.id} similarity search has already been added to a command graph`);
    }
    validateSearchGraphOwnership(this, graph);
    if (this.queries.rowCount === 0) {
      this.registered = true;
      return;
    }

    const sourceSpan = getSourceRowSpan(this.dataset);
    const queryTiles = createQueryTiles(graph, this, sourceSpan);
    for (const [queryTileIndex, queryTile] of queryTiles.entries()) {
      addInitializeQueryPass(graph, this, queryTile, queryTileIndex);
    }

    if (this.dataset.rowCount === 0 || (this.k === 0 && !this.candidateCounts)) {
      this.registered = true;
      return;
    }

    const candidateMembership = createCandidateMembershipIndex(graph, this);
    const datasetTiles = createDatasetTiles(graph, this);
    for (const [datasetTileIndex, datasetTile] of datasetTiles.entries()) {
      const eligibleSourceIds = createTransientView(
        graph,
        `${this.id}-eligible-source-ids-${datasetTileIndex}`,
        'uint32',
        datasetTile.rowCount
      );
      addPrepareDatasetTilePass(
        graph,
        this,
        datasetTile,
        datasetTileIndex,
        eligibleSourceIds,
        candidateMembership
      );

      for (const [queryTileIndex, queryTile] of queryTiles.entries()) {
        const queryFilterMask = this.queryFilterMask
          ? createQueryFilterTileView(
              graph,
              this.queryFilterMask,
              queryTile,
              datasetTile,
              sourceSpan
            )
          : undefined;
        if (queryTile.candidateCounts) {
          addCountCandidatesPass(
            graph,
            this,
            datasetTile,
            queryTile,
            datasetTileIndex,
            queryTileIndex,
            eligibleSourceIds,
            queryFilterMask,
            sourceSpan
          );
        }
        if (this.k > 0) {
          addSearchDatasetTilePass(
            graph,
            this,
            datasetTile,
            queryTile,
            datasetTileIndex,
            queryTileIndex,
            eligibleSourceIds,
            queryFilterMask,
            sourceSpan
          );
        }
      }
    }
    this.registered = true;
  }
}

function validateSearchConfiguration(search: GPUSimilaritySearch): void {
  if (
    !Number.isSafeInteger(search.dataset.dimensions) ||
    search.dataset.dimensions < 1 ||
    search.dataset.dimensions !== search.queries.dimensions
  ) {
    throw new Error(`${search.id} dataset and query embedding dimensions must match`);
  }
  if (
    !Number.isSafeInteger(search.k) ||
    search.k < 0 ||
    search.k > INVALID_SOURCE_ROW_ID ||
    !Number.isSafeInteger(search.k * search.queries.rowCount) ||
    search.k * search.queries.rowCount > INVALID_SOURCE_ROW_ID
  ) {
    throw new Error(`${search.id} result count and query-major output length must fit into uint32`);
  }
  if (!['squared-euclidean', 'inner-product', 'cosine'].includes(search.metric)) {
    throw new Error(`${search.id} metric must be squared-euclidean, inner-product, or cosine`);
  }
  if (!Number.isSafeInteger(search.tileSize) || search.tileSize < 1) {
    throw new Error(`${search.id} tileSize must be a positive safe integer`);
  }

  validateGraphEmbeddingMatrix(search.dataset, `${search.id} dataset`);
  validateGraphEmbeddingMatrix(search.queries, `${search.id} queries`);
  validatePackedUint32View(search.outputIds, `${search.id} output IDs`);
  validatePackedView(search.outputScores, ['float32'], `${search.id} output scores`);
  validatePackedUint32View(search.resultCounts, `${search.id} result counts`);
  const outputLength = search.queries.rowCount * search.k;
  if (search.outputIds.length < outputLength || search.outputScores.length < outputLength) {
    throw new Error(`${search.id} result destinations must contain queryCount * k values`);
  }
  if (search.resultCounts.length < search.queries.rowCount) {
    throw new Error(`${search.id} result counts must contain one value per query`);
  }
  if (search.candidateCounts) {
    validatePackedUint32View(search.candidateCounts, `${search.id} candidate counts`);
    if (search.candidateCounts.length < search.queries.rowCount) {
      throw new Error(`${search.id} candidate counts must contain one value per query`);
    }
  }
  if (search.candidateIds) {
    validatePackedUint32View(search.candidateIds, `${search.id} candidate IDs`);
  }
  const sourceSpan = getSourceRowSpan(search.dataset);
  if (search.filterMask) {
    validateSearchFilterMask(search, sourceSpan);
  }
  if (search.queryFilterMask) {
    validatePackedUint32View(search.queryFilterMask, `${search.id} query filter mask`);
    if (
      !Number.isSafeInteger(sourceSpan * search.queries.rowCount) ||
      search.queryFilterMask.length < sourceSpan * search.queries.rowCount
    ) {
      throw new Error(`${search.id} query filter mask must contain query-major source flags`);
    }
  }
  validateDistinctSearchOutputs(search);
}

function validateGraphEmbeddingMatrix(matrix: GraphEmbeddingMatrix, name: string): void {
  if (!Number.isSafeInteger(matrix.rowCount) || matrix.rowCount < 0) {
    throw new Error(`${name} row count must be a non-negative safe integer`);
  }
  let totalRowCount = 0;
  for (const chunk of matrix.chunks) {
    validatePackedView(chunk.values, ['float32'], `${name} flat values`);
    if (
      !Number.isSafeInteger(chunk.rowCount) ||
      chunk.rowCount < 0 ||
      !Number.isSafeInteger(chunk.rowStride) ||
      chunk.rowStride < matrix.dimensions ||
      chunk.byteOffset !== chunk.values.byteOffset ||
      !Number.isSafeInteger(chunk.sourceRowOffset) ||
      chunk.sourceRowOffset < 0 ||
      chunk.sourceRowOffset + chunk.rowCount > INVALID_SOURCE_ROW_ID ||
      (chunk.rowCount > 0 &&
        chunk.values.length < (chunk.rowCount - 1) * chunk.rowStride + matrix.dimensions)
    ) {
      throw new Error(`${name} chunk must preserve aligned, bounded float32 embedding rows`);
    }
    for (const rowView of [chunk.sourceRowIds, chunk.validity]) {
      if (rowView) {
        validatePackedUint32View(rowView, `${name} row metadata`);
        if (rowView.length < chunk.rowCount) {
          throw new Error(`${name} row metadata must align with its source chunk`);
        }
      }
    }
    totalRowCount += chunk.rowCount;
  }
  if (totalRowCount !== matrix.rowCount || totalRowCount > INVALID_SOURCE_ROW_ID) {
    throw new Error(`${name} row count must match its chunk rows and fit into uint32`);
  }
}

function validateSearchFilterMask(search: GPUSimilaritySearch, sourceSpan: number): void {
  const filterMask = search.filterMask;
  if (!filterMask) return;
  if (isGraphVectorView(filterMask)) {
    if (
      filterMask.data.length !== search.dataset.chunks.length ||
      filterMask.data.some(
        (chunk, chunkIndex) => chunk.length !== search.dataset.chunks[chunkIndex].rowCount
      )
    ) {
      throw new Error(`${search.id} filter mask must preserve the dataset chunk topology`);
    }
    for (const chunk of filterMask.data) {
      validatePackedUint32View(chunk, `${search.id} filter mask`);
    }
  } else {
    validatePackedUint32View(filterMask, `${search.id} filter mask`);
    if (filterMask.length < sourceSpan) {
      throw new Error(`${search.id} filter mask must contain source-aligned selection flags`);
    }
  }
}

function validateDistinctSearchOutputs(search: GPUSimilaritySearch): void {
  const inputs: GraphDataView[] = [
    ...search.dataset.chunks.flatMap(getEmbeddingChunkViews),
    ...search.queries.chunks.flatMap(getEmbeddingChunkViews),
    ...(search.filterMask
      ? isGraphVectorView(search.filterMask)
        ? search.filterMask.data
        : [search.filterMask]
      : []),
    ...(search.candidateIds ? [search.candidateIds] : []),
    ...(search.queryFilterMask ? [search.queryFilterMask] : [])
  ];
  const outputs: GraphDataView[] = [
    search.outputIds,
    search.outputScores,
    search.resultCounts,
    ...(search.candidateCounts ? [search.candidateCounts] : [])
  ];
  for (const [outputIndex, output] of outputs.entries()) {
    if (
      inputs.some(input => doGraphDataViewsOverlap(input, output)) ||
      outputs.slice(0, outputIndex).some(previous => doGraphDataViewsOverlap(previous, output))
    ) {
      throw new Error(`${search.id} writable outputs must not overlap source or destination data`);
    }
  }
}

function validateSearchGraphOwnership<Parameters>(
  search: GPUSimilaritySearch,
  graph: GPUCommandGraph<Parameters>
): void {
  const views = [
    ...search.dataset.chunks.flatMap(getEmbeddingChunkViews),
    ...search.queries.chunks.flatMap(getEmbeddingChunkViews),
    search.outputIds,
    search.outputScores,
    search.resultCounts,
    ...(search.candidateCounts ? [search.candidateCounts] : []),
    ...(search.candidateIds ? [search.candidateIds] : []),
    ...(search.queryFilterMask ? [search.queryFilterMask] : []),
    ...(search.filterMask
      ? isGraphVectorView(search.filterMask)
        ? search.filterMask.data
        : [search.filterMask]
      : [])
  ];
  if (views.some(view => view.buffer.graph !== graph)) {
    throw new Error(`${search.id} inputs and outputs must belong to their target command graph`);
  }
}

function getEmbeddingChunkViews(chunk: GraphEmbeddingMatrixChunk): GraphDataView[] {
  return [
    chunk.values,
    ...(chunk.sourceRowIds ? [chunk.sourceRowIds] : []),
    ...(chunk.validity ? [chunk.validity] : [])
  ];
}

function createDatasetTiles<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  search: GPUSimilaritySearch
): DatasetTile[] {
  const maximumBindingSize = graph.device.limits.maxStorageBufferBindingSize;
  const tiles: DatasetTile[] = [];
  for (const [chunkIndex, chunk] of search.dataset.chunks.entries()) {
    let chunkRowOffset = 0;
    while (chunkRowOffset < chunk.rowCount) {
      const rowCount = Math.min(
        chunk.rowCount - chunkRowOffset,
        search.tileSize,
        getMaximumEmbeddingTileRows(
          chunk,
          chunkRowOffset,
          search.dataset.dimensions,
          maximumBindingSize
        ),
        Math.max(
          1,
          Math.floor((maximumBindingSize - STORAGE_BINDING_ALIGNMENT + 1) / SCALAR_BYTE_LENGTH)
        )
      );
      const values = createEmbeddingTileView(
        graph,
        chunk,
        chunkRowOffset,
        rowCount,
        search.dataset.dimensions
      );
      const tile: DatasetTile = {
        chunk,
        chunkIndex,
        chunkRowOffset,
        sourceRowOffset: chunk.sourceRowOffset + chunkRowOffset,
        rowCount,
        values,
        ...(chunk.sourceRowIds
          ? {sourceRowIds: createScalarSubview(graph, chunk.sourceRowIds, chunkRowOffset, rowCount)}
          : {}),
        ...(chunk.validity
          ? {validity: createScalarSubview(graph, chunk.validity, chunkRowOffset, rowCount)}
          : {})
      };
      const filterMask = createDatasetFilterTileView(graph, search.filterMask, tile);
      if (filterMask) {
        tile.filterMask = filterMask;
      }
      tiles.push(tile);
      chunkRowOffset += rowCount;
    }
  }
  return tiles;
}

function createQueryTiles<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  search: GPUSimilaritySearch,
  sourceSpan: number
): QueryTile[] {
  const maximumBindingSize = graph.device.limits.maxStorageBufferBindingSize;
  const maximumOutputRows = Math.max(
    1,
    Math.floor(
      (maximumBindingSize - STORAGE_BINDING_ALIGNMENT + 1) /
        (Math.max(search.k, 1) * SCALAR_BYTE_LENGTH)
    )
  );
  const maximumFilterRows = search.queryFilterMask
    ? Math.max(
        1,
        Math.floor(
          (maximumBindingSize - STORAGE_BINDING_ALIGNMENT + 1) /
            (Math.max(sourceSpan, 1) * SCALAR_BYTE_LENGTH)
        )
      )
    : INVALID_SOURCE_ROW_ID;
  const maximumRows = Math.min(maximumOutputRows, maximumFilterRows);
  const queryTiles: QueryTile[] = [];
  let logicalRowOffset = 0;
  for (const chunk of search.queries.chunks) {
    let chunkRowOffset = 0;
    while (chunkRowOffset < chunk.rowCount) {
      const rowCount = Math.min(
        chunk.rowCount - chunkRowOffset,
        maximumRows,
        getMaximumEmbeddingTileRows(
          chunk,
          chunkRowOffset,
          search.queries.dimensions,
          maximumBindingSize
        )
      );
      const queryOffset = logicalRowOffset + chunkRowOffset;
      const outputOffset = queryOffset * search.k;
      const queryTile: QueryTile = {
        logicalRowOffset: queryOffset,
        rowCount,
        values: createEmbeddingTileView(
          graph,
          chunk,
          chunkRowOffset,
          rowCount,
          search.queries.dimensions
        ),
        rowStride: chunk.rowStride,
        sourceRowOffset: chunk.sourceRowOffset + chunkRowOffset,
        rowMetadata: createTransientView(
          graph,
          `${search.id}-query-metadata-${queryTiles.length}`,
          'uint32',
          rowCount
        ),
        outputIds: createScalarSubview(graph, search.outputIds, outputOffset, rowCount * search.k),
        outputScores: createScalarSubview(
          graph,
          search.outputScores,
          outputOffset,
          rowCount * search.k
        ),
        resultCounts: createScalarSubview(graph, search.resultCounts, queryOffset, rowCount),
        ...(search.candidateCounts
          ? {
              candidateCounts: createScalarSubview(
                graph,
                search.candidateCounts,
                queryOffset,
                rowCount
              )
            }
          : {}),
        ...(chunk.sourceRowIds
          ? {sourceRowIds: createScalarSubview(graph, chunk.sourceRowIds, chunkRowOffset, rowCount)}
          : {}),
        ...(chunk.validity
          ? {validity: createScalarSubview(graph, chunk.validity, chunkRowOffset, rowCount)}
          : {})
      };
      queryTiles.push(queryTile);
      chunkRowOffset += rowCount;
    }
    logicalRowOffset += chunk.rowCount;
  }
  return queryTiles;
}

function createEmbeddingTileView<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  chunk: GraphEmbeddingMatrixChunk,
  rowOffset: number,
  rowCount: number,
  dimensions: number
): GraphDataView<'float32'> {
  return graph.createDataView(chunk.values.buffer, {
    format: 'float32',
    length: rowCount === 0 ? 0 : (rowCount - 1) * chunk.rowStride + dimensions,
    byteOffset: chunk.byteOffset + rowOffset * chunk.rowStride * Float32Array.BYTES_PER_ELEMENT
  });
}

function createScalarSubview<Format extends 'float32' | 'uint32', Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: GraphDataView<Format>,
  rowOffset: number,
  rowCount: number
): GraphDataView<Format> {
  return graph.createDataView(view.buffer, {
    format: view.format,
    length: rowCount,
    byteOffset: view.byteOffset + rowOffset * SCALAR_BYTE_LENGTH
  });
}

function createDatasetFilterTileView<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  filterMask: GPUEmbeddingFilterMask | undefined,
  tile: DatasetTile
): GraphDataView<'uint32'> | undefined {
  if (!filterMask) return undefined;
  if (isGraphVectorView(filterMask)) {
    return createScalarSubview(
      graph,
      filterMask.data[tile.chunkIndex],
      tile.chunkRowOffset,
      tile.rowCount
    );
  }
  return createScalarSubview(graph, filterMask, tile.sourceRowOffset, tile.rowCount);
}

function createQueryFilterTileView<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  queryFilterMask: GraphDataView<'uint32'>,
  queryTile: QueryTile,
  datasetTile: DatasetTile,
  sourceSpan: number
): GraphDataView<'uint32'> {
  const firstRowOffset = queryTile.logicalRowOffset * sourceSpan + datasetTile.sourceRowOffset;
  const rowCount = (queryTile.rowCount - 1) * sourceSpan + datasetTile.rowCount;
  const view = createScalarSubview(graph, queryFilterMask, firstRowOffset, rowCount);
  if (getViewBindingRange(view).size > graph.device.limits.maxStorageBufferBindingSize) {
    throw new Error('GPU embedding query filter tile exceeds maxStorageBufferBindingSize');
  }
  return view;
}

function getMaximumEmbeddingTileRows(
  chunk: GraphEmbeddingMatrixChunk,
  rowOffset: number,
  dimensions: number,
  maximumBindingSize: number
): number {
  const byteOffset = chunk.byteOffset + rowOffset * chunk.rowStride * SCALAR_BYTE_LENGTH;
  const alignmentPrefix = byteOffset % STORAGE_BINDING_ALIGNMENT;
  const requiredRowBytes = dimensions * SCALAR_BYTE_LENGTH;
  const availableBytes = maximumBindingSize - alignmentPrefix;
  if (availableBytes < requiredRowBytes) {
    throw new Error('GPU embedding row exceeds maxStorageBufferBindingSize');
  }
  return (
    Math.floor((availableBytes - requiredRowBytes) / (chunk.rowStride * SCALAR_BYTE_LENGTH)) + 1
  );
}

function getSourceRowSpan(matrix: GraphEmbeddingMatrix): number {
  return matrix.chunks.reduce(
    (maximum, chunk) => Math.max(maximum, chunk.sourceRowOffset + chunk.rowCount),
    0
  );
}

function isGraphVectorView(view: GPUEmbeddingFilterMask): view is GraphVectorView<'uint32'> {
  return Array.isArray((view as GraphVectorView<'uint32'>).data);
}

/** Builds bounded GPU membership for substantial allowlists without O(datasetRows * ID count). */
function createCandidateMembershipIndex<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  search: GPUSimilaritySearch
): CandidateMembershipIndex | undefined {
  if (!search.candidateIds) return undefined;
  const maximumBindingSize = graph.device.limits.maxStorageBufferBindingSize;
  if (getViewBindingRange(search.candidateIds).size > maximumBindingSize) {
    throw new Error(`${search.id} candidate IDs exceed maxStorageBufferBindingSize`);
  }
  if (search.candidateIds.length <= LINEAR_CANDIDATE_ALLOWLIST_LIMIT) {
    return undefined;
  }

  let capacity = 2;
  const requestedCapacity = search.candidateIds.length * 2;
  while (capacity < requestedCapacity) {
    capacity *= 2;
  }
  if (capacity * SCALAR_BYTE_LENGTH > maximumBindingSize) {
    throw new Error(
      `${search.id} candidate-ID membership exceeds maxStorageBufferBindingSize; use a source-aligned filter mask`
    );
  }

  const tableKeys = createTransientView(
    graph,
    `${search.id}-candidate-index-keys`,
    'uint32',
    capacity
  );
  const tableValues = createTransientView(
    graph,
    `${search.id}-candidate-index-values`,
    'uint32',
    capacity
  );
  const statistics = createTransientView(
    graph,
    `${search.id}-candidate-index-statistics`,
    'uint32',
    6
  );
  new GPUHashIndex({
    id: `${search.id}-candidate-index`,
    keys: search.candidateIds,
    tableKeys,
    tableValues,
    statistics
  }).addToGraph(graph);
  return {keys: tableKeys, statistics, capacity};
}

function addInitializeQueryPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  search: GPUSimilaritySearch,
  tile: QueryTile,
  tileIndex: number
): void {
  const id = `${search.id}-initialize-query-tile-${tileIndex}`;
  const bindings: Record<string, GraphDataView> = {
    queryValues: tile.values,
    queryMetadata: tile.rowMetadata,
    outputIds: tile.outputIds,
    outputScores: tile.outputScores,
    resultCounts: tile.resultCounts,
    ...(tile.candidateCounts ? {candidateCounts: tile.candidateCounts} : {}),
    ...(tile.validity ? {queryValidity: tile.validity} : {}),
    ...(tile.sourceRowIds ? {querySourceIds: tile.sourceRowIds} : {})
  };
  const source = /* wgsl */ `
${getCommonWGSLConstants(search, tile.rowCount)}
const QUERY_OFFSET: u32 = ${getViewElementOffset(tile.values)}u;
const QUERY_STRIDE: u32 = ${tile.rowStride}u;
const QUERY_SOURCE_OFFSET: u32 = ${tile.sourceRowOffset}u;
const QUERY_METADATA_OFFSET: u32 = ${getViewElementOffset(tile.rowMetadata)}u;
const OUTPUT_ID_OFFSET: u32 = ${getViewElementOffset(tile.outputIds)}u;
const OUTPUT_SCORE_OFFSET: u32 = ${getViewElementOffset(tile.outputScores)}u;
const RESULT_COUNT_OFFSET: u32 = ${getViewElementOffset(tile.resultCounts)}u;
${tile.candidateCounts ? `const CANDIDATE_COUNT_OFFSET: u32 = ${getViewElementOffset(tile.candidateCounts)}u;` : ''}
${tile.validity ? `const QUERY_VALIDITY_OFFSET: u32 = ${getViewElementOffset(tile.validity)}u;` : ''}
${tile.sourceRowIds ? `const QUERY_SOURCE_ID_OFFSET: u32 = ${getViewElementOffset(tile.sourceRowIds)}u;` : ''}
@group(0) @binding(auto) var<storage, read> queryValues: array<f32>;
@group(0) @binding(auto) var<storage, read_write> queryMetadata: array<u32>;
@group(0) @binding(auto) var<storage, read_write> outputIds: array<u32>;
@group(0) @binding(auto) var<storage, read_write> outputScores: array<u32>;
@group(0) @binding(auto) var<storage, read_write> resultCounts: array<u32>;
${tile.candidateCounts ? '@group(0) @binding(auto) var<storage, read_write> candidateCounts: array<u32>;' : ''}
${tile.validity ? '@group(0) @binding(auto) var<storage, read> queryValidity: array<u32>;' : ''}
${tile.sourceRowIds ? '@group(0) @binding(auto) var<storage, read> querySourceIds: array<u32>;' : ''}

${getFiniteFloatWGSL()}

@compute @workgroup_size(${SEARCH_WORKGROUP_SIZE})
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getInvocationIndexSource(id, tile.rowCount, graph)}
  if (index >= QUERY_COUNT) { return; }
  var valid = ${tile.validity ? 'queryValidity[QUERY_VALIDITY_OFFSET + index] != 0u' : 'true'};
  for (var dimension = 0u; dimension < DIMENSIONS; dimension++) {
    if (!isFiniteFloat(queryValues[QUERY_OFFSET + index * QUERY_STRIDE + dimension])) {
      valid = false;
    }
  }
  let sourceId = ${tile.sourceRowIds ? 'querySourceIds[QUERY_SOURCE_ID_OFFSET + index]' : 'QUERY_SOURCE_OFFSET + index'};
  queryMetadata[QUERY_METADATA_OFFSET + index] = select(INVALID_ID, sourceId, valid && sourceId != INVALID_ID);
  resultCounts[RESULT_COUNT_OFFSET + index] = 0u;
  ${tile.candidateCounts ? 'candidateCounts[CANDIDATE_COUNT_OFFSET + index] = 0u;' : ''}
  for (var resultIndex = 0u; resultIndex < MAX_RESULTS; resultIndex++) {
    let outputIndex = index * MAX_RESULTS + resultIndex;
    outputIds[OUTPUT_ID_OFFSET + outputIndex] = INVALID_ID;
    outputScores[OUTPUT_SCORE_OFFSET + outputIndex] = ${search.metric === 'squared-euclidean' ? '0x7f800000u' : '0xff800000u'};
  }
}`;
  addSearchComputationPass(
    graph,
    id,
    source,
    bindings,
    tile.rowCount,
    new Set(['queryValues', 'queryValidity', 'querySourceIds'])
  );
}

function addPrepareDatasetTilePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  search: GPUSimilaritySearch,
  tile: DatasetTile,
  tileIndex: number,
  eligibleSourceIds: GraphDataView<'uint32'>,
  candidateMembership: CandidateMembershipIndex | undefined
): void {
  const id = `${search.id}-prepare-dataset-tile-${tileIndex}`;
  const bindings: Record<string, GraphDataView> = {
    datasetValues: tile.values,
    eligibleSourceIds,
    ...(tile.sourceRowIds ? {sourceRowIds: tile.sourceRowIds} : {}),
    ...(tile.validity ? {sourceValidity: tile.validity} : {}),
    ...(tile.filterMask ? {selectionMask: tile.filterMask} : {}),
    ...(candidateMembership
      ? {
          candidateIndexKeys: candidateMembership.keys,
          candidateIndexStatistics: candidateMembership.statistics,
          candidateIds: search.candidateIds!
        }
      : search.candidateIds
        ? {candidateIds: search.candidateIds}
        : {})
  };
  const source = /* wgsl */ `
${getCommonWGSLConstants(search, tile.rowCount)}
const ROW_COUNT: u32 = ${tile.rowCount}u;
const DATASET_OFFSET: u32 = ${getViewElementOffset(tile.values)}u;
const DATASET_STRIDE: u32 = ${tile.chunk.rowStride}u;
const SOURCE_ROW_OFFSET: u32 = ${tile.sourceRowOffset}u;
const ELIGIBLE_OFFSET: u32 = ${getViewElementOffset(eligibleSourceIds)}u;
${tile.sourceRowIds ? `const SOURCE_ID_OFFSET: u32 = ${getViewElementOffset(tile.sourceRowIds)}u;` : ''}
${tile.validity ? `const VALIDITY_OFFSET: u32 = ${getViewElementOffset(tile.validity)}u;` : ''}
${tile.filterMask ? `const SELECTION_OFFSET: u32 = ${getViewElementOffset(tile.filterMask)}u;` : ''}
${
  candidateMembership
    ? `const CANDIDATE_INDEX_OFFSET: u32 = ${getViewElementOffset(candidateMembership.keys)}u;\nconst CANDIDATE_INDEX_MASK: u32 = ${candidateMembership.capacity - 1}u;\nconst CANDIDATE_INDEX_CAPACITY: u32 = ${candidateMembership.capacity}u;\nconst CANDIDATE_STATISTICS_OFFSET: u32 = ${getViewElementOffset(candidateMembership.statistics)}u;\nconst CANDIDATE_ID_OFFSET: u32 = ${getViewElementOffset(search.candidateIds!)}u;\nconst CANDIDATE_ID_COUNT: u32 = ${search.candidateIds!.length}u;`
    : search.candidateIds
      ? `const CANDIDATE_ID_OFFSET: u32 = ${getViewElementOffset(search.candidateIds)}u;\nconst CANDIDATE_ID_COUNT: u32 = ${search.candidateIds.length}u;`
      : ''
}
@group(0) @binding(auto) var<storage, read> datasetValues: array<f32>;
@group(0) @binding(auto) var<storage, read_write> eligibleSourceIds: array<u32>;
${tile.sourceRowIds ? '@group(0) @binding(auto) var<storage, read> sourceRowIds: array<u32>;' : ''}
${tile.validity ? '@group(0) @binding(auto) var<storage, read> sourceValidity: array<u32>;' : ''}
${tile.filterMask ? '@group(0) @binding(auto) var<storage, read> selectionMask: array<u32>;' : ''}
${
  candidateMembership
    ? '@group(0) @binding(auto) var<storage, read> candidateIndexKeys: array<u32>;\n@group(0) @binding(auto) var<storage, read> candidateIndexStatistics: array<u32>;\n@group(0) @binding(auto) var<storage, read> candidateIds: array<u32>;'
    : search.candidateIds
      ? '@group(0) @binding(auto) var<storage, read> candidateIds: array<u32>;'
      : ''
}

${getFiniteFloatWGSL()}
${
  candidateMembership
    ? `fn hashCandidateKey(key: u32) -> u32 {\n  var value = key;\n  value = (value ^ (value >> 16u)) * 0x7feb352du;\n  value = (value ^ (value >> 15u)) * 0x846ca68bu;\n  return value ^ (value >> 16u);\n}`
    : ''
}

@compute @workgroup_size(${SEARCH_WORKGROUP_SIZE})
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getInvocationIndexSource(id, tile.rowCount, graph)}
  if (index >= ROW_COUNT) { return; }
  let sourceId = ${tile.sourceRowIds ? 'sourceRowIds[SOURCE_ID_OFFSET + index]' : 'SOURCE_ROW_OFFSET + index'};
  var eligible = sourceId != INVALID_ID;
  ${tile.validity ? 'eligible = eligible && sourceValidity[VALIDITY_OFFSET + index] != 0u;' : ''}
  ${tile.filterMask ? 'eligible = eligible && selectionMask[SELECTION_OFFSET + index] != 0u;' : ''}
  for (var dimension = 0u; dimension < DIMENSIONS; dimension++) {
    if (!isFiniteFloat(datasetValues[DATASET_OFFSET + index * DATASET_STRIDE + dimension])) {
      eligible = false;
    }
  }
  ${
    candidateMembership
      ? `var allowed = false;\n  if (candidateIndexStatistics[CANDIDATE_STATISTICS_OFFSET + 2u] == 0u) {\n    let firstSlot = hashCandidateKey(sourceId) & CANDIDATE_INDEX_MASK;\n    for (var probe = 0u; probe < CANDIDATE_INDEX_CAPACITY; probe++) {\n      let stored = candidateIndexKeys[CANDIDATE_INDEX_OFFSET + ((firstSlot + probe) & CANDIDATE_INDEX_MASK)];\n      if (stored == INVALID_ID) { break; }\n      if (stored == sourceId) { allowed = true; break; }\n    }\n  } else {\n    for (var candidateIndex = 0u; candidateIndex < CANDIDATE_ID_COUNT; candidateIndex++) {\n      allowed = allowed || candidateIds[CANDIDATE_ID_OFFSET + candidateIndex] == sourceId;\n    }\n  }\n  eligible = eligible && allowed;`
      : search.candidateIds
        ? `var allowed = false;\n  for (var candidateIndex = 0u; candidateIndex < CANDIDATE_ID_COUNT; candidateIndex++) {\n    allowed = allowed || candidateIds[CANDIDATE_ID_OFFSET + candidateIndex] == sourceId;\n  }\n  eligible = eligible && allowed;`
        : ''
  }
  eligibleSourceIds[ELIGIBLE_OFFSET + index] = select(INVALID_ID, sourceId, eligible);
}`;
  addSearchComputationPass(
    graph,
    id,
    source,
    bindings,
    tile.rowCount,
    new Set(Object.keys(bindings).filter(name => name !== 'eligibleSourceIds'))
  );
}

function addCountCandidatesPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  search: GPUSimilaritySearch,
  datasetTile: DatasetTile,
  queryTile: QueryTile,
  datasetTileIndex: number,
  queryTileIndex: number,
  eligibleSourceIds: GraphDataView<'uint32'>,
  queryFilterMask: GraphDataView<'uint32'> | undefined,
  sourceSpan: number
): void {
  if (!queryTile.candidateCounts) return;
  const id = `${search.id}-count-candidates-${datasetTileIndex}-${queryTileIndex}`;
  const bindings: Record<string, GraphDataView> = {
    eligibleSourceIds,
    queryMetadata: queryTile.rowMetadata,
    candidateCounts: queryTile.candidateCounts,
    ...(queryFilterMask ? {queryFilterMask} : {})
  };
  const source = /* wgsl */ `
${getCommonWGSLConstants(search, queryTile.rowCount)}
const ROW_COUNT: u32 = ${datasetTile.rowCount}u;
const ELIGIBLE_OFFSET: u32 = ${getViewElementOffset(eligibleSourceIds)}u;
const QUERY_METADATA_OFFSET: u32 = ${getViewElementOffset(queryTile.rowMetadata)}u;
const CANDIDATE_COUNT_OFFSET: u32 = ${getViewElementOffset(queryTile.candidateCounts)}u;
${queryFilterMask ? `const QUERY_FILTER_OFFSET: u32 = ${getViewElementOffset(queryFilterMask)}u;\nconst SOURCE_SPAN: u32 = ${sourceSpan}u;` : ''}
@group(0) @binding(auto) var<storage, read> eligibleSourceIds: array<u32>;
@group(0) @binding(auto) var<storage, read> queryMetadata: array<u32>;
@group(0) @binding(auto) var<storage, read_write> candidateCounts: array<u32>;
${queryFilterMask ? '@group(0) @binding(auto) var<storage, read> queryFilterMask: array<u32>;' : ''}

@compute @workgroup_size(${SEARCH_WORKGROUP_SIZE})
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getInvocationIndexSource(id, queryTile.rowCount, graph)}
  if (index >= QUERY_COUNT) { return; }
  let querySourceId = queryMetadata[QUERY_METADATA_OFFSET + index];
  if (querySourceId == INVALID_ID) { return; }
  var count = candidateCounts[CANDIDATE_COUNT_OFFSET + index];
  for (var candidateIndex = 0u; candidateIndex < ROW_COUNT; candidateIndex++) {
    let sourceId = eligibleSourceIds[ELIGIBLE_OFFSET + candidateIndex];
    var accepted = sourceId != INVALID_ID;
    ${search.excludeSelf ? 'accepted = accepted && sourceId != querySourceId;' : ''}
    ${queryFilterMask ? 'accepted = accepted && queryFilterMask[QUERY_FILTER_OFFSET + index * SOURCE_SPAN + candidateIndex] != 0u;' : ''}
    if (accepted) { count++; }
  }
  candidateCounts[CANDIDATE_COUNT_OFFSET + index] = count;
}`;
  addSearchComputationPass(
    graph,
    id,
    source,
    bindings,
    queryTile.rowCount,
    new Set(['eligibleSourceIds', 'queryMetadata', 'queryFilterMask'])
  );
}

function addSearchDatasetTilePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  search: GPUSimilaritySearch,
  datasetTile: DatasetTile,
  queryTile: QueryTile,
  datasetTileIndex: number,
  queryTileIndex: number,
  eligibleSourceIds: GraphDataView<'uint32'>,
  queryFilterMask: GraphDataView<'uint32'> | undefined,
  sourceSpan: number
): void {
  const id = `${search.id}-search-dataset-${datasetTileIndex}-queries-${queryTileIndex}`;
  const bindings: Record<string, GraphDataView> = {
    queryValues: queryTile.values,
    datasetValues: datasetTile.values,
    eligibleSourceIds,
    queryMetadata: queryTile.rowMetadata,
    outputIds: queryTile.outputIds,
    outputScores: queryTile.outputScores,
    resultCounts: queryTile.resultCounts,
    ...(queryFilterMask ? {queryFilterMask} : {})
  };
  const source = /* wgsl */ `
${getCommonWGSLConstants(search, queryTile.rowCount)}
const ROW_COUNT: u32 = ${datasetTile.rowCount}u;
const QUERY_OFFSET: u32 = ${getViewElementOffset(queryTile.values)}u;
const QUERY_STRIDE: u32 = ${queryTile.rowStride}u;
const DATASET_OFFSET: u32 = ${getViewElementOffset(datasetTile.values)}u;
const DATASET_STRIDE: u32 = ${datasetTile.chunk.rowStride}u;
const ELIGIBLE_OFFSET: u32 = ${getViewElementOffset(eligibleSourceIds)}u;
const QUERY_METADATA_OFFSET: u32 = ${getViewElementOffset(queryTile.rowMetadata)}u;
const OUTPUT_ID_OFFSET: u32 = ${getViewElementOffset(queryTile.outputIds)}u;
const OUTPUT_SCORE_OFFSET: u32 = ${getViewElementOffset(queryTile.outputScores)}u;
const RESULT_COUNT_OFFSET: u32 = ${getViewElementOffset(queryTile.resultCounts)}u;
${queryFilterMask ? `const QUERY_FILTER_OFFSET: u32 = ${getViewElementOffset(queryFilterMask)}u;\nconst SOURCE_SPAN: u32 = ${sourceSpan}u;` : ''}
@group(0) @binding(auto) var<storage, read> queryValues: array<f32>;
@group(0) @binding(auto) var<storage, read> datasetValues: array<f32>;
@group(0) @binding(auto) var<storage, read> eligibleSourceIds: array<u32>;
@group(0) @binding(auto) var<storage, read> queryMetadata: array<u32>;
@group(0) @binding(auto) var<storage, read_write> outputIds: array<u32>;
@group(0) @binding(auto) var<storage, read_write> outputScores: array<f32>;
@group(0) @binding(auto) var<storage, read_write> resultCounts: array<u32>;
${queryFilterMask ? '@group(0) @binding(auto) var<storage, read> queryFilterMask: array<u32>;' : ''}

${getFiniteFloatWGSL()}

fn candidateScore(queryIndex: u32, candidateIndex: u32) -> f32 {
  var dotProduct = 0.0;
  var queryNorm = 0.0;
  var candidateNorm = 0.0;
  var squaredDistance = 0.0;
  var queryScale = 0.0;
  var candidateScale = 0.0;
  for (var dimension = 0u; dimension < DIMENSIONS; dimension++) {
    let queryValue = queryValues[QUERY_OFFSET + queryIndex * QUERY_STRIDE + dimension];
    let candidateValue = datasetValues[DATASET_OFFSET + candidateIndex * DATASET_STRIDE + dimension];
    ${
      search.metric === 'squared-euclidean'
        ? 'let delta = queryValue - candidateValue;\n    squaredDistance += delta * delta;'
        : search.metric === 'inner-product'
          ? 'dotProduct += queryValue * candidateValue;'
          : 'queryScale = max(queryScale, abs(queryValue));\n    candidateScale = max(candidateScale, abs(candidateValue));'
    }
  }
  ${
    search.metric === 'squared-euclidean'
      ? 'return squaredDistance;'
      : search.metric === 'inner-product'
        ? 'return dotProduct;'
        : `if (queryScale == 0.0 && candidateScale == 0.0) { return 1.0; }\n  if (queryScale == 0.0 || candidateScale == 0.0) { return 0.0; }\n  // Clamp divisors so reciprocal-lowering GPU backends never flush them to zero.\n  let minimumDivisor = bitcast<f32>(0x00800000u);\n  let maximumDivisor = bitcast<f32>(0x7e800000u);\n  let queryDivisor = clamp(queryScale, minimumDivisor, maximumDivisor);\n  let candidateDivisor = clamp(candidateScale, minimumDivisor, maximumDivisor);\n  for (var dimension = 0u; dimension < DIMENSIONS; dimension++) {\n    let normalizedQuery = queryValues[QUERY_OFFSET + queryIndex * QUERY_STRIDE + dimension] / queryDivisor;\n    let normalizedCandidate = datasetValues[DATASET_OFFSET + candidateIndex * DATASET_STRIDE + dimension] / candidateDivisor;\n    dotProduct += normalizedQuery * normalizedCandidate;\n    queryNorm += normalizedQuery * normalizedQuery;\n    candidateNorm += normalizedCandidate * normalizedCandidate;\n  }\n  return dotProduct / (sqrt(queryNorm) * sqrt(candidateNorm));`
  }
}

fn isBetter(score: f32, sourceId: u32, previousScore: f32, previousId: u32) -> bool {
  if (previousId == INVALID_ID) { return true; }
  if (score == previousScore) { return sourceId < previousId; }
  return score ${search.metric === 'squared-euclidean' ? '<' : '>'} previousScore;
}

@compute @workgroup_size(${SEARCH_WORKGROUP_SIZE})
fn main(@builtin(workgroup_id) workgroupId: vec3u, @builtin(local_invocation_index) localInvocationIndex: u32) {
  ${getInvocationIndexSource(id, queryTile.rowCount, graph)}
  if (index >= QUERY_COUNT) { return; }
  let querySourceId = queryMetadata[QUERY_METADATA_OFFSET + index];
  if (querySourceId == INVALID_ID) { return; }
  let queryResultOffset = index * MAX_RESULTS;
  var resultCount = resultCounts[RESULT_COUNT_OFFSET + index];
  for (var candidateIndex = 0u; candidateIndex < ROW_COUNT; candidateIndex++) {
    let sourceId = eligibleSourceIds[ELIGIBLE_OFFSET + candidateIndex];
    if (sourceId == INVALID_ID) { continue; }
    ${search.excludeSelf ? 'if (sourceId == querySourceId) { continue; }' : ''}
    ${queryFilterMask ? 'if (queryFilterMask[QUERY_FILTER_OFFSET + index * SOURCE_SPAN + candidateIndex] == 0u) { continue; }' : ''}
    let score = candidateScore(index, candidateIndex);
    // Finite source values may legitimately overflow a Float32 distance or inner product.
    if ((bitcast<u32>(score) & 0x7fffffffu) > 0x7f800000u) { continue; }

    var insertionIndex = min(resultCount, MAX_RESULTS);
    for (var resultIndex = 0u; resultIndex < resultCount; resultIndex++) {
      let currentId = outputIds[OUTPUT_ID_OFFSET + queryResultOffset + resultIndex];
      let currentScore = outputScores[OUTPUT_SCORE_OFFSET + queryResultOffset + resultIndex];
      if (isBetter(score, sourceId, currentScore, currentId)) {
        insertionIndex = resultIndex;
        break;
      }
    }
    if (insertionIndex >= MAX_RESULTS) { continue; }
    var destinationIndex = min(resultCount, MAX_RESULTS - 1u);
    while (destinationIndex > insertionIndex) {
      let destination = queryResultOffset + destinationIndex;
      let previous = destination - 1u;
      outputIds[OUTPUT_ID_OFFSET + destination] = outputIds[OUTPUT_ID_OFFSET + previous];
      outputScores[OUTPUT_SCORE_OFFSET + destination] = outputScores[OUTPUT_SCORE_OFFSET + previous];
      destinationIndex--;
    }
    outputIds[OUTPUT_ID_OFFSET + queryResultOffset + insertionIndex] = sourceId;
    outputScores[OUTPUT_SCORE_OFFSET + queryResultOffset + insertionIndex] = score;
    resultCount = min(resultCount + 1u, MAX_RESULTS);
  }
  resultCounts[RESULT_COUNT_OFFSET + index] = resultCount;
}`;
  addSearchComputationPass(
    graph,
    id,
    source,
    bindings,
    queryTile.rowCount,
    new Set([
      'queryValues',
      'datasetValues',
      'eligibleSourceIds',
      'queryMetadata',
      'queryFilterMask'
    ])
  );
}

function addSearchComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  source: string,
  views: Record<string, GraphDataView>,
  elementCount: number,
  readOnlyBindings: ReadonlySet<string>
): void {
  const resources: GraphBufferUse[] = Object.entries(views).map(([name, buffer]) => ({
    buffer,
    usage: readOnlyBindings.has(name) ? 'storage-read' : 'storage-read-write'
  }));
  const layout = getBoundedDispatchLayout(
    id,
    elementCount,
    SEARCH_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  graph.addComputePass({
    id,
    resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id,
        source,
        shaderLayout: {
          bindings: Object.keys(views).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(views)) {
            if (getViewBindingRange(view).size > device.limits.maxStorageBufferBindingSize) {
              throw new Error(`${id} storage binding exceeds maxStorageBufferBindingSize`);
            }
            bindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, layout.x, layout.y, layout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function getInvocationIndexSource<Parameters>(
  operationName: string,
  elementCount: number,
  graph: GPUCommandGraph<Parameters>
): string {
  const layout = getBoundedDispatchLayout(
    operationName,
    elementCount,
    SEARCH_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  return getBoundedInvocationIndexSource(layout, SEARCH_WORKGROUP_SIZE);
}

function getCommonWGSLConstants(search: GPUSimilaritySearch, queryCount: number): string {
  return `const INVALID_ID: u32 = 0xffffffffu;
const DIMENSIONS: u32 = ${search.dataset.dimensions}u;
const QUERY_COUNT: u32 = ${queryCount}u;
const MAX_RESULTS: u32 = ${search.k}u;`;
}

function getFiniteFloatWGSL(): string {
  return `fn isFiniteFloat(value: f32) -> bool {
  return (bitcast<u32>(value) & 0x7f800000u) != 0x7f800000u;
}`;
}
