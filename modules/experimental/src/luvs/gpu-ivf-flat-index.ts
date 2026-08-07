// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuVS.

import {
  createTransientView,
  doGraphDataViewsOverlap,
  getViewBindingRange,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from '../gpu-primitives/graph-data-view-utils';
import {
  GraphVectorView,
  type GPUCommandGraph,
  type GraphBufferUse,
  type GraphDataView
} from '../gpu-primitives/gpu-command-graph';
import {GPUScan} from '../gpu-primitives/gpu-scan';
import {
  GPU_CLUSTERING_WORKGROUP_SIZE,
  addGPUClusteringComputationPass,
  createGPUClusteringRowSubview,
  getGPUClusteringDispatchLayout,
  getGPUClusteringInvocationIndexSource,
  getGPUClusteringMatrixTiles,
  getGPUClusteringTileRowView,
  validateGPUClusteringEmbeddingMatrix,
  validateGPUClusteringRowViews,
  type GPUClusteringMatrixTile
} from './gpu-clustering-utils';
import {GPUKMeans, type GPUKMeansLabels} from './gpu-k-means';
import type {GPUEmbeddingFilterMask, GPUEmbeddingMetric, GraphEmbeddingMatrix} from './types';

const DEFAULT_TILE_ROW_COUNT = 256;
const MAXIMUM_UINT32 = 0xffffffff;

/** One query chunk slice plus binding-size-safe caller-owned query-major output windows. */
type IVFQueryTile = GPUClusteringMatrixTile & {
  outputIds: GraphDataView<'uint32'>;
  outputScores: GraphDataView<'float32'>;
  resultCounts: GraphDataView<'uint32'>;
  candidateCounts?: GraphDataView<'uint32'>;
};

/** Explicit caller-owned storage and training parameters for a non-graph IVF-flat index. */
export type GPUIVFFlatIndexProps = {
  /** Prefix shared by index training and reusable list-building passes. */
  id?: string;
  /** Source-preserving high-dimensional float32 candidate rows. */
  dataset: GraphEmbeddingMatrix;
  /** Positive number of k-means centroids and inverted lists. */
  listCount: number;
  /** Caller-owned `listCount * dimensions` flattened float32 centroid values. */
  centroids: GraphDataView<'float32'>;
  /** Caller-owned source-aligned centroid assignment, retaining chunks when desired. */
  labels: GPUKMeansLabels;
  /** Caller-owned valid candidate count for each inverted list. */
  listCounts: GraphDataView<'uint32'>;
  /** Caller-owned `listCount + 1` exclusive list boundaries. */
  listOffsets: GraphDataView<'uint32'>;
  /** Caller-owned stable source IDs grouped deterministically by list and source order. */
  listSourceIds: GraphDataView<'uint32'>;
  /** Caller-owned logical dataset row positions, parallel to `listSourceIds` and list offsets. */
  listRowIndices: GraphDataView<'uint32'>;
  /** Optional caller-owned `[executedIterations, changedLabels, converged]` training state. */
  status?: GraphDataView<'uint32'>;
  /** Maximum number of bounded k-means training iterations. */
  maxIterations?: number;
};

/** One bounded, filter-aware approximate IVF-flat query operation. */
export type GPUIVFFlatSearchProps = {
  /** Prefix shared by probe, eligibility, and exact-reranking graph passes. */
  id?: string;
  /** Flattened query rows with the same dimensionality as the indexed dataset. */
  queries: GraphEmbeddingMatrix;
  /** Caller-owned stable result IDs with at least `queryCount * k` slots. */
  outputIds: GraphDataView<'uint32'>;
  /** Caller-owned exact float32 distances or similarities. */
  outputScores: GraphDataView<'float32'>;
  /** Caller-owned actual result count for each query. */
  resultCounts: GraphDataView<'uint32'>;
  /** Optional caller-owned actual exact-reranking candidate count for each query. */
  candidateCounts?: GraphDataView<'uint32'>;
  /** Requested maximum number of deterministic results for each query. */
  k: number;
  /** Number of closest centroid lists examined before fallback. Defaults to one. */
  probeCount?: number;
  /** Distance/similarity metric. Defaults to squared Euclidean distance. */
  metric?: GPUEmbeddingMetric;
  /** Optional source-aligned WebGPU/LuxFilter selection; zero rejects a row. */
  filterMask?: GPUEmbeddingFilterMask;
  /** Expand to every list when fewer than `k` filtered candidates remain. Defaults to `expand`. */
  fallback?: 'expand' | 'none';
  /** Maximum source rows in one bounded query-by-tile eligibility buffer. Defaults to 256. */
  tileSize?: number;
};

/**
 * Builds and queries a deterministic, non-graph inverted-file flat vector index.
 *
 * Training uses bounded GPU k-means; list counts, exclusive offsets, and stable source IDs remain
 * GPU-resident. Search probes the closest centroids and exactly reranks only their valid selected
 * rows. Reduced probing is approximate. By default, restrictive filters automatically expand to
 * all lists when the probed lists contain fewer than `k` eligible rows.
 *
 * Build and search may be declared on one graph. To time or schedule them separately, import the
 * same caller-owned physical buffers into another graph, construct a second index descriptor, and
 * call `addSearchToGraph()` after the caller has submitted the original build.
 */
export class GPUIVFFlatIndex {
  readonly id: string;
  readonly dataset: GraphEmbeddingMatrix;
  readonly listCount: number;
  readonly centroids: GraphDataView<'float32'>;
  readonly labels: GPUKMeansLabels;
  readonly listCounts: GraphDataView<'uint32'>;
  readonly listOffsets: GraphDataView<'uint32'>;
  readonly listSourceIds: GraphDataView<'uint32'>;
  readonly listRowIndices: GraphDataView<'uint32'>;
  readonly status?: GraphDataView<'uint32'>;
  readonly maxIterations?: number;
  /** Index contents are rebuilt explicitly whenever source vectors or assignments change. */
  readonly updatePolicy = 'rebuild' as const;

  private buildRegistered = false;
  private searchCount = 0;

  /** Validates explicit index storage without uploading, reading, or submitting GPU work. */
  constructor(props: GPUIVFFlatIndexProps) {
    this.id = props.id ?? 'gpu-ivf-flat';
    this.dataset = props.dataset;
    this.listCount = props.listCount;
    this.centroids = props.centroids;
    this.labels = props.labels;
    this.listCounts = props.listCounts;
    this.listOffsets = props.listOffsets;
    this.listSourceIds = props.listSourceIds;
    this.listRowIndices = props.listRowIndices;
    this.status = props.status;
    this.maxIterations = props.maxIterations;

    validateGPUClusteringEmbeddingMatrix(this.dataset, `${this.id} dataset`);
    if (!Number.isSafeInteger(this.listCount) || this.listCount < 1) {
      throw new Error(`${this.id} listCount must be a positive integer`);
    }
    validatePackedView(this.centroids, ['float32'], `${this.id} centroids`);
    validateGPUClusteringRowViews(this.dataset, this.labels, `${this.id} labels`);
    validatePackedUint32View(this.listCounts, `${this.id} listCounts`);
    validatePackedUint32View(this.listOffsets, `${this.id} listOffsets`);
    validatePackedUint32View(this.listSourceIds, `${this.id} listSourceIds`);
    validatePackedUint32View(this.listRowIndices, `${this.id} listRowIndices`);
    if (this.centroids.length < this.listCount * this.dataset.dimensions) {
      throw new Error(`${this.id} centroids must contain listCount * dimensions values`);
    }
    if (this.listCounts.length !== this.listCount) {
      throw new Error(`${this.id} listCounts must contain exactly listCount values`);
    }
    if (this.listOffsets.length !== this.listCount + 1) {
      throw new Error(`${this.id} listOffsets must contain listCount + 1 values`);
    }
    if (this.listSourceIds.length < this.dataset.rowCount) {
      throw new Error(`${this.id} listSourceIds must have capacity for every source row`);
    }
    if (this.listRowIndices.length < this.dataset.rowCount) {
      throw new Error(`${this.id} listRowIndices must have capacity for every logical source row`);
    }
    validateDistinctIndexStorage(this);
  }

  /** Whether this index instance has already declared its explicit training/build lifecycle. */
  get isBuildRegistered(): boolean {
    return this.buildRegistered;
  }

  /** Adds k-means training, prefix-scanned offsets, and deterministic stable-ID list scatter. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.buildRegistered) {
      throw new Error(`${this.id} index build has already been added to a command graph`);
    }
    validateIndexGraphOwnership(graph, this);

    new GPUKMeans({
      id: `${this.id}-training`,
      dataset: this.dataset,
      clusterCount: this.listCount,
      centroids: this.centroids,
      labels: this.labels,
      counts: this.listCounts,
      ...(this.status ? {status: this.status} : {}),
      ...(this.maxIterations !== undefined ? {maxIterations: this.maxIterations} : {})
    }).addToGraph(graph);

    const offsetsWithoutTotal = createGPUClusteringRowSubview(
      graph,
      this.listOffsets,
      0,
      this.listCount
    );
    new GPUScan({
      id: `${this.id}-list-offsets`,
      input: this.listCounts,
      output: offsetsWithoutTotal,
      mode: 'exclusive'
    }).addToGraph(graph);
    addFinalizeListOffsetsPass(graph, this);

    const listCursors = createTransientView<'uint32', Parameters>(
      graph,
      `${this.id}-list-cursors`,
      'uint32',
      this.listCount
    );
    addClearListCursorsPass(graph, this, listCursors);
    const tiles = getGPUClusteringMatrixTiles(graph, this.dataset);
    for (const [tileIndex, tile] of tiles.entries()) {
      addStableListScatterPass(graph, this, tile, tileIndex, listCursors);
    }
    this.buildRegistered = true;
  }

  /** Alias emphasizing that IVF-flat construction is explicit, GPU-resident, and repeatable. */
  addBuildToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    this.addToGraph(graph);
  }

  /** Adds bounded centroid probing and exact source-vector reranking, without graph ANN edges. */
  addSearchToGraph<Parameters>(
    graph: GPUCommandGraph<Parameters>,
    props: GPUIVFFlatSearchProps
  ): void {
    validateIndexGraphOwnership(graph, this);
    validateIVFFlatSearch(this, props, graph);
    if (props.queries.rowCount === 0) return;

    const searchId = props.id ?? `${this.id}-search-${this.searchCount}`;
    this.searchCount++;
    const queryTiles = createIVFQueryTiles(graph, props);
    if (props.k === 0 && !props.candidateCounts) {
      for (const [queryTileIndex, queryTile] of queryTiles.entries()) {
        addClearZeroResultSearchPass(graph, `${searchId}-query-${queryTileIndex}`, queryTile);
      }
      return;
    }
    const queryCount = props.queries.rowCount;
    const probeCount = Math.min(props.probeCount ?? 1, this.listCount);
    const metric = props.metric ?? 'squared-euclidean';
    const fallback = props.fallback ?? 'expand';
    const requestedTileSize = props.tileSize ?? DEFAULT_TILE_ROW_COUNT;
    const maximumQueryTileRows = Math.max(...queryTiles.map(queryTile => queryTile.rowCount));
    const maximumCandidateWordsPerQuery = Math.floor(
      graph.device.limits.maxStorageBufferBindingSize /
        (maximumQueryTileRows * Uint32Array.BYTES_PER_ELEMENT)
    );
    const maximumTileRows = Math.floor((maximumCandidateWordsPerQuery - 1) / 2);
    if (maximumTileRows < 1) {
      throw new Error(`${searchId} query batch exceeds maxStorageBufferBindingSize`);
    }
    const tileSize = Math.min(requestedTileSize, maximumTileRows);
    const probeFlags = createTransientView<'uint32', Parameters>(
      graph,
      `${searchId}-probed-lists`,
      'uint32',
      queryCount * this.listCount
    );
    const probedCandidateCounts = createTransientView<'uint32', Parameters>(
      graph,
      `${searchId}-probed-counts`,
      'uint32',
      queryCount
    );
    const datasetTiles = getGPUClusteringMatrixTiles(graph, this.dataset, tileSize);

    for (const [queryTileIndex, queryTile] of queryTiles.entries()) {
      const queryProbedCandidateCounts = createGPUClusteringRowSubview(
        graph,
        probedCandidateCounts,
        queryTile.logicalRowOffset,
        queryTile.rowCount
      );
      if (props.k === 0) {
        addClearZeroResultSearchPass(
          graph,
          `${searchId}-query-${queryTileIndex}`,
          queryTile,
          queryProbedCandidateCounts
        );
      } else {
        addInitializeIVFSearchPass(
          graph,
          `${searchId}-query-${queryTileIndex}`,
          props,
          queryTile,
          metric,
          queryProbedCandidateCounts
        );
      }
      addProbeCentroidsPass(
        graph,
        this,
        queryTile,
        queryTileIndex,
        searchId,
        metric,
        probeCount,
        probeFlags
      );
    }

    for (const [datasetTileIndex, datasetTile] of datasetTiles.entries()) {
      for (const [queryTileIndex, queryTile] of queryTiles.entries()) {
        addCountProbedCandidatesPass(graph, this, {
          id: `${searchId}-count-query-${queryTileIndex}-tile-${datasetTileIndex}`,
          queryTile,
          datasetTile,
          probeFlags,
          probedCandidateCounts,
          filterMask: props.filterMask
        });
      }
    }

    if (props.k === 0) {
      for (const [queryTileIndex, queryTile] of queryTiles.entries()) {
        addPublishProbedCandidateCountsPass(
          graph,
          `${searchId}-query-${queryTileIndex}`,
          createGPUClusteringRowSubview(
            graph,
            probedCandidateCounts,
            queryTile.logicalRowOffset,
            queryTile.rowCount
          ),
          queryTile.candidateCounts!
        );
      }
      return;
    }

    const tileCandidates = createTransientView<'uint32', Parameters>(
      graph,
      `${searchId}-tile-candidates`,
      'uint32',
      maximumQueryTileRows * (tileSize * 2 + 1)
    );
    for (const [datasetTileIndex, datasetTile] of datasetTiles.entries()) {
      for (const [queryTileIndex, queryTile] of queryTiles.entries()) {
        addCollectIndexedCandidatesPass(graph, this, {
          id: `${searchId}-collect-query-${queryTileIndex}-tile-${datasetTileIndex}`,
          queryTile,
          datasetTile,
          probeFlags,
          probedCandidateCounts,
          tileCandidates,
          tileSize,
          filterMask: props.filterMask,
          fallback,
          k: props.k
        });
        addExactRerankingPass(graph, this, {
          id: `${searchId}-rerank-query-${queryTileIndex}-tile-${datasetTileIndex}`,
          queryTile,
          datasetTile,
          tileCandidates,
          tileSize,
          metric,
          search: props
        });
      }
    }
  }
}

function validateDistinctIndexStorage(index: GPUIVFFlatIndex): void {
  const outputs = [
    index.centroids,
    index.listCounts,
    index.listOffsets,
    index.listSourceIds,
    index.listRowIndices,
    ...(index.status ? [index.status] : [])
  ];
  for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
    for (let comparison = outputIndex + 1; comparison < outputs.length; comparison++) {
      if (outputs[outputIndex].buffer === outputs[comparison].buffer) {
        throw new Error(`${index.id} IVF-flat outputs must use separate graph buffers`);
      }
    }
  }
  const labels = index.labels instanceof GraphVectorView ? index.labels.data : [index.labels];
  if (labels.some(label => outputs.some(output => label.buffer === output.buffer))) {
    throw new Error(`${index.id} labels and inverted-list outputs must use separate buffers`);
  }
  const inputs = index.dataset.chunks.flatMap(chunk => [
    chunk.values,
    ...(chunk.validity ? [chunk.validity] : []),
    ...(chunk.sourceRowIds ? [chunk.sourceRowIds] : [])
  ]);
  if (
    [...outputs, ...labels].some(output =>
      inputs.some(input => doGraphDataViewsOverlap(input, output))
    )
  ) {
    throw new Error(`${index.id} writable index outputs must not overlap source embedding data`);
  }
}

function validateIndexGraphOwnership<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUIVFFlatIndex
): void {
  const labels = index.labels instanceof GraphVectorView ? index.labels.data : [index.labels];
  const matrixViews = index.dataset.chunks.flatMap(chunk => [
    chunk.values,
    ...(chunk.sourceRowIds ? [chunk.sourceRowIds] : []),
    ...(chunk.validity ? [chunk.validity] : [])
  ]);
  const views = [
    ...matrixViews,
    ...labels,
    index.centroids,
    index.listCounts,
    index.listOffsets,
    index.listSourceIds,
    index.listRowIndices,
    ...(index.status ? [index.status] : [])
  ];
  if (views.some(view => view.buffer.graph !== graph)) {
    throw new Error(`${index.id} index resources must belong to the target graph`);
  }
  const boundedIndexViews = [
    {name: 'centroids', view: index.centroids},
    {name: 'listCounts', view: index.listCounts},
    {name: 'listOffsets', view: index.listOffsets},
    {name: 'listSourceIds', view: index.listSourceIds},
    {name: 'listRowIndices', view: index.listRowIndices},
    ...labels.map((view, labelIndex) => ({name: `labels chunk ${labelIndex}`, view}))
  ];
  for (const {name, view} of boundedIndexViews) {
    if (getViewBindingRange(view).size > graph.device.limits.maxStorageBufferBindingSize) {
      throw new Error(`${index.id} ${name} exceeds maxStorageBufferBindingSize`);
    }
  }
}

/** Prefix scans omit the trailing total; append it without CPU synchronization. */
function addFinalizeListOffsetsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUIVFFlatIndex
): void {
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read> listCounts: array<u32>;
@group(0) @binding(1) var<storage, read_write> listOffsets: array<u32>;
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalInvocationId: vec3<u32>
) {
  if (globalInvocationId.x == 0u) {
    listOffsets[${getViewElementOffset(index.listOffsets)}u + ${index.listCount}u] =
      listOffsets[${getViewElementOffset(index.listOffsets)}u + ${index.listCount - 1}u] +
      listCounts[${getViewElementOffset(index.listCounts)}u + ${index.listCount - 1}u];
  }
}`;
  addGPUClusteringComputationPass(graph, {
    id: `${index.id}-list-total`,
    source,
    resources: [
      {buffer: index.listCounts, usage: 'storage-read'},
      {buffer: index.listOffsets, usage: 'storage-read-write'}
    ],
    bindings: {listCounts: index.listCounts, listOffsets: index.listOffsets},
    elementCount: 1
  });
}

function addClearListCursorsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUIVFFlatIndex,
  cursors: GraphDataView<'uint32'>
): void {
  const dispatchLayout = getGPUClusteringDispatchLayout(
    index.id,
    index.listCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> listCursors: array<u32>;
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index < ${index.listCount}u) {
    listCursors[${getViewElementOffset(cursors)}u + index] = 0u;
  }
}`;
  addGPUClusteringComputationPass(graph, {
    id: `${index.id}-clear-list-cursors`,
    source,
    resources: [{buffer: cursors, usage: 'storage-write'}],
    bindings: {listCursors: cursors},
    elementCount: index.listCount
  });
}

/** Uses one invocation per list so stable source ordering never depends on atomic scheduling. */
function addStableListScatterPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUIVFFlatIndex,
  tile: GPUClusteringMatrixTile,
  tileIndex: number,
  cursors: GraphDataView<'uint32'>
): void {
  const labels = getGPUClusteringTileRowView(graph, index.labels, tile);
  const dispatchLayout = getGPUClusteringDispatchLayout(
    index.id,
    index.listCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const sourceIdsBinding = tile.sourceRowIds
    ? '@group(0) @binding(5) var<storage, read> sourceRowIds: array<u32>;'
    : '';
  const sourceId = tile.sourceRowIds
    ? `sourceRowIds[${getViewElementOffset(tile.sourceRowIds)}u + row]`
    : `${tile.sourceRowOffset}u + row`;
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read> clusterLabels: array<u32>;
@group(0) @binding(1) var<storage, read> listOffsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> listCursors: array<u32>;
@group(0) @binding(3) var<storage, read_write> listSourceIds: array<u32>;
@group(0) @binding(4) var<storage, read_write> listRowIndices: array<u32>;
${sourceIdsBinding}
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index >= ${index.listCount}u) { return; }
  var cursor = listCursors[${getViewElementOffset(cursors)}u + index];
  let listStart = listOffsets[${getViewElementOffset(index.listOffsets)}u + index];
  for (var row = 0u; row < ${tile.rowCount}u; row++) {
    if (clusterLabels[${getViewElementOffset(labels)}u + row] == index) {
      let outputIndex = listStart + cursor;
      if (outputIndex < ${index.listSourceIds.length}u) {
        listSourceIds[${getViewElementOffset(index.listSourceIds)}u + outputIndex] = ${sourceId};
        listRowIndices[${getViewElementOffset(index.listRowIndices)}u + outputIndex] =
          ${tile.logicalRowOffset}u + row;
      }
      cursor++;
    }
  }
  listCursors[${getViewElementOffset(cursors)}u + index] = cursor;
}`;
  addGPUClusteringComputationPass(graph, {
    id: `${index.id}-scatter-tile-${tileIndex}`,
    source,
    resources: [
      {buffer: labels, usage: 'storage-read'},
      {buffer: index.listOffsets, usage: 'storage-read'},
      {buffer: cursors, usage: 'storage-read-write'},
      {buffer: index.listSourceIds, usage: 'storage-write'},
      {buffer: index.listRowIndices, usage: 'storage-write'},
      ...(tile.sourceRowIds
        ? ([{buffer: tile.sourceRowIds, usage: 'storage-read'}] as GraphBufferUse[])
        : [])
    ],
    bindings: {
      clusterLabels: labels,
      listOffsets: index.listOffsets,
      listCursors: cursors,
      listSourceIds: index.listSourceIds,
      listRowIndices: index.listRowIndices,
      ...(tile.sourceRowIds ? {sourceRowIds: tile.sourceRowIds} : {})
    },
    elementCount: index.listCount
  });
}

function validateIVFFlatSearch<Parameters>(
  index: GPUIVFFlatIndex,
  search: GPUIVFFlatSearchProps,
  graph: GPUCommandGraph<Parameters>
): void {
  const id = search.id ?? `${index.id}-search`;
  validateGPUClusteringEmbeddingMatrix(search.queries, `${id} queries`);
  if (search.queries.dimensions !== index.dataset.dimensions) {
    throw new Error(`${id} query and dataset embedding dimensions must match`);
  }
  if (!Number.isSafeInteger(search.k) || search.k < 0) {
    throw new Error(`${id} k must be a non-negative integer`);
  }
  if (
    search.probeCount !== undefined &&
    (!Number.isSafeInteger(search.probeCount) || search.probeCount < 1)
  ) {
    throw new Error(`${id} probeCount must be a positive integer`);
  }
  if (
    search.tileSize !== undefined &&
    (!Number.isSafeInteger(search.tileSize) || search.tileSize < 1)
  ) {
    throw new Error(`${id} tileSize must be a positive integer`);
  }
  if (search.metric && !['squared-euclidean', 'inner-product', 'cosine'].includes(search.metric)) {
    throw new Error(`${id} metric must be squared-euclidean, inner-product, or cosine`);
  }
  if (search.fallback && !['expand', 'none'].includes(search.fallback)) {
    throw new Error(`${id} fallback must be expand or none`);
  }
  const resultSlotCount = search.queries.rowCount * search.k;
  const probeSlotCount = search.queries.rowCount * index.listCount;
  if (
    !Number.isSafeInteger(resultSlotCount) ||
    resultSlotCount > MAXIMUM_UINT32 ||
    !Number.isSafeInteger(probeSlotCount) ||
    probeSlotCount > MAXIMUM_UINT32 ||
    probeSlotCount * Uint32Array.BYTES_PER_ELEMENT > graph.device.limits.maxStorageBufferBindingSize
  ) {
    throw new Error(`${id} query outputs or centroid probes exceed bounded GPU storage`);
  }
  validatePackedUint32View(search.outputIds, `${id} outputIds`);
  validatePackedView(search.outputScores, ['float32'], `${id} outputScores`);
  validatePackedUint32View(search.resultCounts, `${id} resultCounts`);
  if (search.outputIds.length < resultSlotCount || search.outputScores.length < resultSlotCount) {
    throw new Error(`${id} result buffers must contain queryCount * k slots`);
  }
  if (search.resultCounts.length < search.queries.rowCount) {
    throw new Error(`${id} resultCounts must contain one value per query`);
  }
  if (search.candidateCounts) {
    validatePackedUint32View(search.candidateCounts, `${id} candidateCounts`);
    if (search.candidateCounts.length < search.queries.rowCount) {
      throw new Error(`${id} candidateCounts must contain one value per query`);
    }
  }
  const outputViews = [
    search.outputIds,
    search.outputScores,
    search.resultCounts,
    ...(search.candidateCounts ? [search.candidateCounts] : [])
  ];
  for (let outputIndex = 0; outputIndex < outputViews.length; outputIndex++) {
    for (let comparison = outputIndex + 1; comparison < outputViews.length; comparison++) {
      if (outputViews[outputIndex].buffer === outputViews[comparison].buffer) {
        throw new Error(`${id} search outputs must use separate graph buffers`);
      }
    }
  }
  const queryViews = search.queries.chunks.flatMap(chunk => [
    chunk.values,
    ...(chunk.sourceRowIds ? [chunk.sourceRowIds] : []),
    ...(chunk.validity ? [chunk.validity] : [])
  ]);
  if ([...queryViews, ...outputViews].some(view => view.buffer.graph !== graph)) {
    throw new Error(`${id} queries and search outputs must belong to the target graph`);
  }
  if (search.filterMask) {
    const filterChunks =
      search.filterMask instanceof GraphVectorView ? search.filterMask.data : [search.filterMask];
    if (filterChunks.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${id} filterMask must belong to the target graph`);
    }
    if (search.filterMask instanceof GraphVectorView) {
      validateGPUClusteringRowViews(index.dataset, search.filterMask, `${id} filterMask`);
    } else {
      validatePackedUint32View(search.filterMask, `${id} filterMask`);
      if (
        index.dataset.chunks.some(
          chunk => chunk.sourceRowOffset + chunk.rowCount > search.filterMask!.length
        )
      ) {
        throw new Error(`${id} filterMask must cover every source-aligned dataset row`);
      }
    }
  }

  const datasetViews = index.dataset.chunks.flatMap(chunk => [
    chunk.values,
    ...(chunk.sourceRowIds ? [chunk.sourceRowIds] : []),
    ...(chunk.validity ? [chunk.validity] : [])
  ]);
  const labels = index.labels instanceof GraphVectorView ? index.labels.data : [index.labels];
  const filterViews = search.filterMask
    ? search.filterMask instanceof GraphVectorView
      ? search.filterMask.data
      : [search.filterMask]
    : [];
  const inputViews = [
    ...datasetViews,
    ...queryViews,
    ...labels,
    ...filterViews,
    index.centroids,
    index.listCounts,
    index.listOffsets,
    index.listSourceIds,
    index.listRowIndices,
    ...(index.status ? [index.status] : [])
  ];
  if (outputViews.some(output => inputViews.some(input => input.buffer === output.buffer))) {
    throw new Error(`${id} writable search outputs must not alias source or index buffers`);
  }
}

/** Subdivides query chunks so every query-major output binding stays within device limits. */
function createIVFQueryTiles<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  search: GPUIVFFlatSearchProps
): IVFQueryTile[] {
  const maximumBindingSize = graph.device.limits.maxStorageBufferBindingSize;
  const maximumOutputRows = Math.max(
    1,
    Math.floor((maximumBindingSize - 255) / (Math.max(search.k, 1) * Uint32Array.BYTES_PER_ELEMENT))
  );
  return getGPUClusteringMatrixTiles(graph, search.queries, maximumOutputRows).map(queryTile => {
    const outputRowOffset = queryTile.logicalRowOffset * search.k;
    const outputRowCount = queryTile.rowCount * search.k;
    const outputIds = createIVFScalarSubview(
      graph,
      search.outputIds,
      outputRowOffset,
      outputRowCount
    );
    const outputScores = createIVFScalarSubview(
      graph,
      search.outputScores,
      outputRowOffset,
      outputRowCount
    );
    const resultCounts = createIVFScalarSubview(
      graph,
      search.resultCounts,
      queryTile.logicalRowOffset,
      queryTile.rowCount
    );
    const candidateCounts = search.candidateCounts
      ? createIVFScalarSubview(
          graph,
          search.candidateCounts,
          queryTile.logicalRowOffset,
          queryTile.rowCount
        )
      : undefined;
    const outputViews = [
      ...(search.k > 0 ? [outputIds, outputScores] : []),
      resultCounts,
      ...(candidateCounts ? [candidateCounts] : [])
    ];
    if (outputViews.some(view => getViewBindingRange(view).size > maximumBindingSize)) {
      throw new Error('GPU IVF-flat query result row exceeds maxStorageBufferBindingSize');
    }
    return {
      ...queryTile,
      outputIds,
      outputScores,
      resultCounts,
      ...(candidateCounts ? {candidateCounts} : {})
    };
  });
}

/** Borrows a packed scalar range without concatenating or creating another graph handle. */
function createIVFScalarSubview<Format extends 'float32' | 'uint32', Parameters>(
  graph: GPUCommandGraph<Parameters>,
  view: GraphDataView<Format>,
  rowOffset: number,
  rowCount: number
): GraphDataView<Format> {
  return graph.createDataView<Format>(view.buffer, {
    format: view.format,
    length: rowCount,
    byteOffset: view.byteOffset + rowOffset * Uint32Array.BYTES_PER_ELEMENT
  });
}

/** Clears count outputs without binding score/ID arrays that do not exist when K is zero. */
function addClearZeroResultSearchPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  queryTile: IVFQueryTile,
  probedCandidateCounts?: GraphDataView<'uint32'>
): void {
  const dispatchLayout = getGPUClusteringDispatchLayout(
    id,
    queryTile.rowCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  let nextBinding = 1;
  const candidateBinding = queryTile.candidateCounts
    ? `@group(0) @binding(${nextBinding++}) var<storage, read_write> candidateCounts: array<u32>;`
    : '';
  const probeBinding = probedCandidateCounts
    ? `@group(0) @binding(${nextBinding++}) var<storage, read_write> probedCandidateCounts: array<u32>;`
    : '';
  const candidateClear = queryTile.candidateCounts
    ? `candidateCounts[${getViewElementOffset(queryTile.candidateCounts)}u + index] = 0u;`
    : '';
  const probeClear = probedCandidateCounts
    ? `probedCandidateCounts[${getViewElementOffset(probedCandidateCounts)}u + index] = 0u;`
    : '';
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> resultCounts: array<u32>;
${candidateBinding}
${probeBinding}
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index < ${queryTile.rowCount}u) {
    resultCounts[${getViewElementOffset(queryTile.resultCounts)}u + index] = 0u;
    ${candidateClear}
    ${probeClear}
  }
}`;
  addGPUClusteringComputationPass(graph, {
    id: `${id}-initialize-empty-results`,
    source,
    resources: [
      {buffer: queryTile.resultCounts, usage: 'storage-write'},
      ...(queryTile.candidateCounts
        ? ([{buffer: queryTile.candidateCounts, usage: 'storage-write'}] as GraphBufferUse[])
        : []),
      ...(probedCandidateCounts
        ? ([{buffer: probedCandidateCounts, usage: 'storage-write'}] as GraphBufferUse[])
        : [])
    ],
    bindings: {
      resultCounts: queryTile.resultCounts,
      ...(queryTile.candidateCounts ? {candidateCounts: queryTile.candidateCounts} : {}),
      ...(probedCandidateCounts ? {probedCandidateCounts} : {})
    },
    elementCount: queryTile.rowCount
  });
}

/** Preserves eligible-candidate counts even when zero top-K result slots were requested. */
function addPublishProbedCandidateCountsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  probedCandidateCounts: GraphDataView<'uint32'>,
  candidateCounts: GraphDataView<'uint32'>
): void {
  const dispatchLayout = getGPUClusteringDispatchLayout(
    id,
    probedCandidateCounts.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read> probedCandidateCounts: array<u32>;
@group(0) @binding(1) var<storage, read_write> candidateCounts: array<u32>;
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index < ${probedCandidateCounts.length}u) {
    candidateCounts[${getViewElementOffset(candidateCounts)}u + index] =
      probedCandidateCounts[${getViewElementOffset(probedCandidateCounts)}u + index];
  }
}`;
  addGPUClusteringComputationPass(graph, {
    id: `${id}-publish-candidate-counts`,
    source,
    resources: [
      {buffer: probedCandidateCounts, usage: 'storage-read'},
      {buffer: candidateCounts, usage: 'storage-write'}
    ],
    bindings: {probedCandidateCounts, candidateCounts},
    elementCount: probedCandidateCounts.length
  });
}

/** Reinitializes every output and actual candidate count on each graph encoding. */
function addInitializeIVFSearchPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  search: GPUIVFFlatSearchProps,
  queryTile: IVFQueryTile,
  metric: GPUEmbeddingMetric,
  probedCandidateCounts: GraphDataView<'uint32'>
): void {
  const resultSlotCount = queryTile.rowCount * search.k;
  const elementCount = Math.max(resultSlotCount, queryTile.rowCount);
  const dispatchLayout = getGPUClusteringDispatchLayout(
    id,
    elementCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const candidateBinding = queryTile.candidateCounts
    ? '@group(0) @binding(4) var<storage, read_write> candidateCounts: array<u32>;'
    : '';
  const candidateClear = queryTile.candidateCounts
    ? `candidateCounts[${getViewElementOffset(queryTile.candidateCounts)}u + index] = 0u;`
    : '';
  const infinityBits = metric === 'squared-euclidean' ? '0x7f800000u' : '0xff800000u';
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> outputIds: array<u32>;
@group(0) @binding(1) var<storage, read_write> outputScores: array<u32>;
@group(0) @binding(2) var<storage, read_write> resultCounts: array<u32>;
@group(0) @binding(3) var<storage, read_write> probedCandidateCounts: array<u32>;
${candidateBinding}
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index < ${resultSlotCount}u) {
    outputIds[${getViewElementOffset(queryTile.outputIds)}u + index] = 0xffffffffu;
    outputScores[${getViewElementOffset(queryTile.outputScores)}u + index] = ${infinityBits};
  }
  if (index < ${queryTile.rowCount}u) {
    resultCounts[${getViewElementOffset(queryTile.resultCounts)}u + index] = 0u;
    probedCandidateCounts[${getViewElementOffset(probedCandidateCounts)}u + index] = 0u;
    ${candidateClear}
  }
}`;
  addGPUClusteringComputationPass(graph, {
    id: `${id}-initialize`,
    source,
    resources: [
      {buffer: queryTile.outputIds, usage: 'storage-write'},
      {buffer: queryTile.outputScores, usage: 'storage-write'},
      {buffer: queryTile.resultCounts, usage: 'storage-write'},
      {buffer: probedCandidateCounts, usage: 'storage-write'},
      ...(queryTile.candidateCounts
        ? ([{buffer: queryTile.candidateCounts, usage: 'storage-write'}] as GraphBufferUse[])
        : [])
    ],
    bindings: {
      outputIds: queryTile.outputIds,
      outputScores: queryTile.outputScores,
      resultCounts: queryTile.resultCounts,
      probedCandidateCounts,
      ...(queryTile.candidateCounts ? {candidateCounts: queryTile.candidateCounts} : {})
    },
    elementCount
  });
}

/** Marks the nearest deterministic centroid IDs using only query-by-list GPU scratch. */
function addProbeCentroidsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUIVFFlatIndex,
  queryTile: GPUClusteringMatrixTile,
  queryTileIndex: number,
  searchId: string,
  metric: GPUEmbeddingMetric,
  probeCount: number,
  probeFlags: GraphDataView<'uint32'>
): void {
  const elementCount = queryTile.rowCount * index.listCount;
  const dispatchLayout = getGPUClusteringDispatchLayout(
    searchId,
    elementCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const validityBinding = queryTile.validity
    ? '@group(0) @binding(3) var<storage, read> queryValidity: array<u32>;'
    : '';
  const validityCheck = queryTile.validity
    ? `if (queryValidity[${getViewElementOffset(queryTile.validity)}u + queryRow] == 0u) {
    probedLists[${getViewElementOffset(probeFlags)}u + queryIndex * ${index.listCount}u + listIndex] = 0u;
    return;
  }`
    : '';
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read> queryValues: array<f32>;
@group(0) @binding(1) var<storage, read> centroidValues: array<f32>;
@group(0) @binding(2) var<storage, read_write> probedLists: array<u32>;
${validityBinding}

fn centroidScore(queryRow: u32, listIndex: u32) -> f32 {
  var total = 0.0;
  var queryNorm = 0.0;
  var centroidNorm = 0.0;
  var queryScale = 0.0;
  var centroidScale = 0.0;
  for (var dimension = 0u; dimension < ${index.dataset.dimensions}u; dimension++) {
    let queryValue = queryValues[
      ${getViewElementOffset(queryTile.values)}u + queryRow * ${queryTile.chunk.rowStride}u + dimension
    ];
    let centroidValue = centroidValues[
      ${getViewElementOffset(index.centroids)}u + listIndex * ${index.dataset.dimensions}u + dimension
    ];
    if (!(queryValue == queryValue && abs(queryValue) <= 3.402823466e+38) ||
        !(centroidValue == centroidValue && abs(centroidValue) <= 3.402823466e+38)) {
      return bitcast<f32>(0x7fc00000u | (queryRow & 1u));
    }
    ${
      metric === 'squared-euclidean'
        ? 'let difference = queryValue - centroidValue; total += difference * difference;'
        : metric === 'inner-product'
          ? 'total += queryValue * centroidValue;'
          : 'queryScale = max(queryScale, abs(queryValue)); centroidScale = max(centroidScale, abs(centroidValue));'
    }
  }
  ${
    metric === 'cosine'
      ? `if (queryScale == 0.0 && centroidScale == 0.0) { return 1.0; }
  if (queryScale == 0.0 || centroidScale == 0.0) { return 0.0; }
  let minimumDivisor = bitcast<f32>(0x00800000u);
  let maximumDivisor = bitcast<f32>(0x7e800000u);
  let queryDivisor = clamp(queryScale, minimumDivisor, maximumDivisor);
  let centroidDivisor = clamp(centroidScale, minimumDivisor, maximumDivisor);
  for (var dimension = 0u; dimension < ${index.dataset.dimensions}u; dimension++) {
    let normalizedQuery = queryValues[
      ${getViewElementOffset(queryTile.values)}u + queryRow * ${queryTile.chunk.rowStride}u + dimension
    ] / queryDivisor;
    let normalizedCentroid = centroidValues[
      ${getViewElementOffset(index.centroids)}u + listIndex * ${index.dataset.dimensions}u + dimension
    ] / centroidDivisor;
    total += normalizedQuery * normalizedCentroid;
    queryNorm += normalizedQuery * normalizedQuery;
    centroidNorm += normalizedCentroid * normalizedCentroid;
  }
  return total / (sqrt(queryNorm) * sqrt(centroidNorm));`
      : metric === 'inner-product'
        ? 'return clamp(total, -3.402823466e+38, 3.402823466e+38);'
        : 'return total;'
  }
}

@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index >= ${elementCount}u) { return; }
  let queryRow = index / ${index.listCount}u;
  let listIndex = index % ${index.listCount}u;
  let queryIndex = ${queryTile.logicalRowOffset}u + queryRow;
  ${validityCheck}
  let score = centroidScore(queryRow, listIndex);
  if ((bitcast<u32>(score) & 0x7fffffffu) > 0x7f800000u) {
    probedLists[${getViewElementOffset(probeFlags)}u + queryIndex * ${index.listCount}u + listIndex] = 0u;
    return;
  }
  var rank = 0u;
  for (var comparison = 0u; comparison < ${index.listCount}u; comparison++) {
    let otherScore = centroidScore(queryRow, comparison);
    if ((bitcast<u32>(otherScore) & 0x7fffffffu) <= 0x7f800000u &&
        (${metric === 'squared-euclidean' ? 'otherScore < score' : 'otherScore > score'} ||
        (otherScore == score && comparison < listIndex))) {
      rank++;
    }
  }
  probedLists[${getViewElementOffset(probeFlags)}u + queryIndex * ${index.listCount}u + listIndex] =
    select(0u, 1u, rank < ${probeCount}u);
}`;
  addGPUClusteringComputationPass(graph, {
    id: `${searchId}-probe-query-${queryTileIndex}`,
    source,
    resources: [
      {buffer: queryTile.values, usage: 'storage-read'},
      {buffer: index.centroids, usage: 'storage-read'},
      {buffer: probeFlags, usage: 'storage-write'},
      ...(queryTile.validity
        ? ([{buffer: queryTile.validity, usage: 'storage-read'}] as GraphBufferUse[])
        : [])
    ],
    bindings: {
      queryValues: queryTile.values,
      centroidValues: index.centroids,
      probedLists: probeFlags,
      ...(queryTile.validity ? {queryValidity: queryTile.validity} : {})
    },
    elementCount
  });
}

/** Resolves a single global mask or the corresponding original LuxFilter vector chunk. */
function getIVFFilterTile<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  filterMask: GPUEmbeddingFilterMask | undefined,
  tile: GPUClusteringMatrixTile
): GraphDataView<'uint32'> | undefined {
  if (!filterMask) return undefined;
  if (filterMask instanceof GraphVectorView) {
    return createGPUClusteringRowSubview(
      graph,
      filterMask.data[tile.chunkIndex],
      tile.chunkRowOffset,
      tile.rowCount
    );
  }
  return createGPUClusteringRowSubview(graph, filterMask, tile.sourceRowOffset, tile.rowCount);
}

/** Counts only persistent row references in probed inverted-list ranges. */
function addCountProbedCandidatesPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUIVFFlatIndex,
  props: {
    id: string;
    queryTile: GPUClusteringMatrixTile;
    datasetTile: GPUClusteringMatrixTile;
    probeFlags: GraphDataView<'uint32'>;
    probedCandidateCounts: GraphDataView<'uint32'>;
    filterMask?: GPUEmbeddingFilterMask;
  }
): void {
  const filter = getIVFFilterTile(graph, props.filterMask, props.datasetTile);
  const dispatchLayout = getGPUClusteringDispatchLayout(
    props.id,
    props.queryTile.rowCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  let nextBinding = 5;
  const filterBinding = filter
    ? `@group(0) @binding(${nextBinding++}) var<storage, read> filterValues: array<u32>;`
    : '';
  const validityBinding = props.datasetTile.validity
    ? `@group(0) @binding(${nextBinding++}) var<storage, read> rowValidity: array<u32>;`
    : '';
  const filterCheck = filter
    ? `if (filterValues[${getViewElementOffset(filter)}u + row] == 0u) { continue; }`
    : '';
  const validityCheck = props.datasetTile.validity
    ? `if (rowValidity[${getViewElementOffset(props.datasetTile.validity)}u + row] == 0u) { continue; }`
    : '';
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read> listOffsets: array<u32>;
@group(0) @binding(1) var<storage, read> listRowIndices: array<u32>;
@group(0) @binding(2) var<storage, read> listSourceIds: array<u32>;
@group(0) @binding(3) var<storage, read> probedLists: array<u32>;
@group(0) @binding(4) var<storage, read_write> probedCandidateCounts: array<u32>;
${filterBinding}
${validityBinding}

fn lowerBoundRow(start: u32, end: u32, logicalRow: u32) -> u32 {
  var first = start;
  var last = end;
  loop {
    if (first >= last) { break; }
    let middle = first + (last - first) / 2u;
    let candidate = listRowIndices[${getViewElementOffset(index.listRowIndices)}u + middle];
    if (candidate < logicalRow) {
      first = middle + 1u;
    } else {
      last = middle;
    }
  }
  return first;
}

@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index >= ${props.queryTile.rowCount}u) { return; }
  let queryIndex = ${props.queryTile.logicalRowOffset}u + index;
  var accepted = 0u;
  for (var listIndex = 0u; listIndex < ${index.listCount}u; listIndex++) {
    if (probedLists[
      ${getViewElementOffset(props.probeFlags)}u + queryIndex * ${index.listCount}u + listIndex
    ] == 0u) { continue; }
    let listStart = listOffsets[${getViewElementOffset(index.listOffsets)}u + listIndex];
    let listEnd = listOffsets[${getViewElementOffset(index.listOffsets)}u + listIndex + 1u];
    let start = lowerBoundRow(listStart, listEnd, ${props.datasetTile.logicalRowOffset}u);
    let end = lowerBoundRow(
      start,
      listEnd,
      ${props.datasetTile.logicalRowOffset + props.datasetTile.rowCount}u
    );
    for (var entry = start; entry < end; entry++) {
      let logicalRow = listRowIndices[${getViewElementOffset(index.listRowIndices)}u + entry];
      let row = logicalRow - ${props.datasetTile.logicalRowOffset}u;
      if (listSourceIds[${getViewElementOffset(index.listSourceIds)}u + entry] == 0xffffffffu) {
        continue;
      }
      ${filterCheck}
      ${validityCheck}
      accepted++;
    }
  }
  probedCandidateCounts[${getViewElementOffset(props.probedCandidateCounts)}u + queryIndex] += accepted;
}`;
  addGPUClusteringComputationPass(graph, {
    id: props.id,
    source,
    resources: [
      {buffer: index.listOffsets, usage: 'storage-read'},
      {buffer: index.listRowIndices, usage: 'storage-read'},
      {buffer: index.listSourceIds, usage: 'storage-read'},
      {buffer: props.probeFlags, usage: 'storage-read'},
      {buffer: props.probedCandidateCounts, usage: 'storage-read-write'},
      ...(filter ? ([{buffer: filter, usage: 'storage-read'}] as GraphBufferUse[]) : []),
      ...(props.datasetTile.validity
        ? ([{buffer: props.datasetTile.validity, usage: 'storage-read'}] as GraphBufferUse[])
        : [])
    ],
    bindings: {
      listOffsets: index.listOffsets,
      listRowIndices: index.listRowIndices,
      listSourceIds: index.listSourceIds,
      probedLists: props.probeFlags,
      probedCandidateCounts: props.probedCandidateCounts,
      ...(filter ? {filterValues: filter} : {}),
      ...(props.datasetTile.validity ? {rowValidity: props.datasetTile.validity} : {})
    },
    elementCount: props.queryTile.rowCount
  });
}

/** Collects only probed index entries into bounded per-query candidate rows. */
function addCollectIndexedCandidatesPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUIVFFlatIndex,
  props: {
    id: string;
    queryTile: GPUClusteringMatrixTile;
    datasetTile: GPUClusteringMatrixTile;
    probeFlags: GraphDataView<'uint32'>;
    probedCandidateCounts: GraphDataView<'uint32'>;
    tileCandidates: GraphDataView<'uint32'>;
    tileSize: number;
    filterMask?: GPUEmbeddingFilterMask;
    fallback: 'expand' | 'none';
    k: number;
  }
): void {
  const filter = getIVFFilterTile(graph, props.filterMask, props.datasetTile);
  const elementCount = props.queryTile.rowCount;
  const dispatchLayout = getGPUClusteringDispatchLayout(
    props.id,
    elementCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const usesFallbackExpansion = props.fallback === 'expand';
  const probedCountsBinding = usesFallbackExpansion
    ? '@group(0) @binding(5) var<storage, read> probedCandidateCounts: array<u32>;'
    : '';
  let nextBinding = usesFallbackExpansion ? 6 : 5;
  const filterBinding = filter
    ? `@group(0) @binding(${nextBinding++}) var<storage, read> filterValues: array<u32>;`
    : '';
  const rowValidityBinding = props.datasetTile.validity
    ? `@group(0) @binding(${nextBinding++}) var<storage, read> rowValidity: array<u32>;`
    : '';
  const filterCondition = filter
    ? ` && filterValues[${getViewElementOffset(filter)}u + row] != 0u`
    : '';
  const rowValidityCondition = props.datasetTile.validity
    ? ` && rowValidity[${getViewElementOffset(props.datasetTile.validity)}u + row] != 0u`
    : '';
  const fallbackCondition =
    props.fallback === 'expand'
      ? ` || probedCandidateCounts[
      ${getViewElementOffset(props.probedCandidateCounts)}u + queryIndex
    ] < ${props.k}u`
      : '';
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read> listOffsets: array<u32>;
@group(0) @binding(1) var<storage, read> listRowIndices: array<u32>;
@group(0) @binding(2) var<storage, read> listSourceIds: array<u32>;
@group(0) @binding(3) var<storage, read> probedLists: array<u32>;
@group(0) @binding(4) var<storage, read_write> tileCandidates: array<u32>;
${probedCountsBinding}
${filterBinding}
${rowValidityBinding}

fn lowerBoundRow(start: u32, end: u32, logicalRow: u32) -> u32 {
  var first = start;
  var last = end;
  loop {
    if (first >= last) { break; }
    let middle = first + (last - first) / 2u;
    let candidate = listRowIndices[${getViewElementOffset(index.listRowIndices)}u + middle];
    if (candidate < logicalRow) {
      first = middle + 1u;
    } else {
      last = middle;
    }
  }
  return first;
}

@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index >= ${elementCount}u) { return; }
  let queryIndex = ${props.queryTile.logicalRowOffset}u + index;
  let candidateStart = ${getViewElementOffset(props.tileCandidates)}u +
    index * ${props.tileSize * 2 + 1}u;
  var hasProbedList = false;
  for (var listIndex = 0u; listIndex < ${index.listCount}u; listIndex++) {
    if (probedLists[
      ${getViewElementOffset(props.probeFlags)}u + queryIndex * ${index.listCount}u + listIndex
    ] != 0u) {
      hasProbedList = true;
      break;
    }
  }
  if (!hasProbedList) {
    tileCandidates[candidateStart] = 0u;
    return;
  }
  var accepted = 0u;
  for (var listIndex = 0u; listIndex < ${index.listCount}u; listIndex++) {
    let includeList = probedLists[
      ${getViewElementOffset(props.probeFlags)}u + queryIndex * ${index.listCount}u + listIndex
    ] != 0u${fallbackCondition};
    if (!includeList) { continue; }
    let listStart = listOffsets[${getViewElementOffset(index.listOffsets)}u + listIndex];
    let listEnd = listOffsets[${getViewElementOffset(index.listOffsets)}u + listIndex + 1u];
    let start = lowerBoundRow(listStart, listEnd, ${props.datasetTile.logicalRowOffset}u);
    let end = lowerBoundRow(
      start,
      listEnd,
      ${props.datasetTile.logicalRowOffset + props.datasetTile.rowCount}u
    );
    for (var entry = start; entry < end; entry++) {
      let logicalRow = listRowIndices[${getViewElementOffset(index.listRowIndices)}u + entry];
      let row = logicalRow - ${props.datasetTile.logicalRowOffset}u;
      let sourceId = listSourceIds[${getViewElementOffset(index.listSourceIds)}u + entry];
      if (sourceId != 0xffffffffu${filterCondition}${rowValidityCondition}) {
        let candidateOffset = candidateStart + 1u + accepted * 2u;
        tileCandidates[candidateOffset] = row;
        tileCandidates[candidateOffset + 1u] = sourceId;
        accepted++;
      }
    }
  }
  tileCandidates[candidateStart] = accepted;
}`;
  addGPUClusteringComputationPass(graph, {
    id: props.id,
    source,
    resources: [
      {buffer: index.listOffsets, usage: 'storage-read'},
      {buffer: index.listRowIndices, usage: 'storage-read'},
      {buffer: index.listSourceIds, usage: 'storage-read'},
      {buffer: props.probeFlags, usage: 'storage-read'},
      {buffer: props.tileCandidates, usage: 'storage-write'},
      ...(usesFallbackExpansion
        ? ([{buffer: props.probedCandidateCounts, usage: 'storage-read'}] as GraphBufferUse[])
        : []),
      ...(filter ? ([{buffer: filter, usage: 'storage-read'}] as GraphBufferUse[]) : []),
      ...(props.datasetTile.validity
        ? ([{buffer: props.datasetTile.validity, usage: 'storage-read'}] as GraphBufferUse[])
        : [])
    ],
    bindings: {
      listOffsets: index.listOffsets,
      listRowIndices: index.listRowIndices,
      listSourceIds: index.listSourceIds,
      probedLists: props.probeFlags,
      tileCandidates: props.tileCandidates,
      ...(usesFallbackExpansion ? {probedCandidateCounts: props.probedCandidateCounts} : {}),
      ...(filter ? {filterValues: filter} : {}),
      ...(props.datasetTile.validity ? {rowValidity: props.datasetTile.validity} : {})
    },
    elementCount
  });
}

/** Exactly scores only selected tile candidates and merges deterministic top-K across chunks. */
function addExactRerankingPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  index: GPUIVFFlatIndex,
  props: {
    id: string;
    queryTile: IVFQueryTile;
    datasetTile: GPUClusteringMatrixTile;
    tileCandidates: GraphDataView<'uint32'>;
    tileSize: number;
    metric: GPUEmbeddingMetric;
    search: GPUIVFFlatSearchProps;
  }
): void {
  const dispatchLayout = getGPUClusteringDispatchLayout(
    props.id,
    props.queryTile.rowCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const candidateCountsBinding = props.queryTile.candidateCounts
    ? '@group(0) @binding(6) var<storage, read_write> candidateCounts: array<u32>;'
    : '';
  const candidateCountIncrement = props.queryTile.candidateCounts
    ? `candidateCounts[${getViewElementOffset(props.queryTile.candidateCounts)}u + index] += 1u;`
    : '';
  const scoreComparison =
    props.metric === 'squared-euclidean' ? 'score < previousScore' : 'score > previousScore';
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read> queryValues: array<f32>;
@group(0) @binding(1) var<storage, read> embeddingValues: array<f32>;
@group(0) @binding(2) var<storage, read> tileCandidates: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputIds: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputScores: array<f32>;
@group(0) @binding(5) var<storage, read_write> resultCounts: array<u32>;
${candidateCountsBinding}

fn candidateScore(queryRow: u32, row: u32) -> f32 {
  var total = 0.0;
  var queryNorm = 0.0;
  var candidateNorm = 0.0;
  var queryScale = 0.0;
  var candidateScale = 0.0;
  for (var dimension = 0u; dimension < ${index.dataset.dimensions}u; dimension++) {
    let queryValue = queryValues[
      ${getViewElementOffset(props.queryTile.values)}u +
      queryRow * ${props.queryTile.chunk.rowStride}u + dimension
    ];
    let candidateValue = embeddingValues[
      ${getViewElementOffset(props.datasetTile.values)}u +
      row * ${props.datasetTile.chunk.rowStride}u + dimension
    ];
    if (!(queryValue == queryValue && abs(queryValue) <= 3.402823466e+38) ||
        !(candidateValue == candidateValue && abs(candidateValue) <= 3.402823466e+38)) {
      return bitcast<f32>(0x7fc00000u | (queryRow & 1u));
    }
    ${
      props.metric === 'squared-euclidean'
        ? 'let difference = queryValue - candidateValue; total += difference * difference;'
        : props.metric === 'inner-product'
          ? 'total += queryValue * candidateValue;'
          : 'queryScale = max(queryScale, abs(queryValue)); candidateScale = max(candidateScale, abs(candidateValue));'
    }
  }
  ${
    props.metric === 'cosine'
      ? `if (queryScale == 0.0 && candidateScale == 0.0) { return 1.0; }
  if (queryScale == 0.0 || candidateScale == 0.0) { return 0.0; }
  let minimumDivisor = bitcast<f32>(0x00800000u);
  let maximumDivisor = bitcast<f32>(0x7e800000u);
  let queryDivisor = clamp(queryScale, minimumDivisor, maximumDivisor);
  let candidateDivisor = clamp(candidateScale, minimumDivisor, maximumDivisor);
  for (var dimension = 0u; dimension < ${index.dataset.dimensions}u; dimension++) {
    let normalizedQuery = queryValues[
      ${getViewElementOffset(props.queryTile.values)}u +
      queryRow * ${props.queryTile.chunk.rowStride}u + dimension
    ] / queryDivisor;
    let normalizedCandidate = embeddingValues[
      ${getViewElementOffset(props.datasetTile.values)}u +
      row * ${props.datasetTile.chunk.rowStride}u + dimension
    ] / candidateDivisor;
    total += normalizedQuery * normalizedCandidate;
    queryNorm += normalizedQuery * normalizedQuery;
    candidateNorm += normalizedCandidate * normalizedCandidate;
  }
  return total / (sqrt(queryNorm) * sqrt(candidateNorm));`
      : 'return total;'
  }
}

@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index >= ${props.queryTile.rowCount}u) { return; }
  let queryIndex = ${props.queryTile.logicalRowOffset}u + index;
  var resultCount = resultCounts[${getViewElementOffset(props.queryTile.resultCounts)}u + index];
  let candidateStart = ${getViewElementOffset(props.tileCandidates)}u +
    index * ${props.tileSize * 2 + 1}u;
  let candidateCount = tileCandidates[candidateStart];
  for (var candidateIndex = 0u; candidateIndex < candidateCount; candidateIndex++) {
    let candidateOffset = candidateStart + 1u + candidateIndex * 2u;
    let row = tileCandidates[candidateOffset];
    let sourceId = tileCandidates[candidateOffset + 1u];
    let score = candidateScore(index, row);
    // Finite source embeddings can legitimately overflow their Float32 score.
    if ((bitcast<u32>(score) & 0x7fffffffu) > 0x7f800000u) { continue; }
    ${candidateCountIncrement}
    if (${props.search.k}u == 0u) { continue; }
    let outputStart = index * ${props.search.k}u;
    var insertionIndex = resultCount;
    for (var rank = 0u; rank < resultCount; rank++) {
      let previousScore = outputScores[
        ${getViewElementOffset(props.queryTile.outputScores)}u + outputStart + rank
      ];
      let previousId = outputIds[
        ${getViewElementOffset(props.queryTile.outputIds)}u + outputStart + rank
      ];
      if (${scoreComparison} || (score == previousScore && sourceId < previousId)) {
        insertionIndex = rank;
        break;
      }
    }
    if (insertionIndex >= ${props.search.k}u) { continue; }
    var destination = min(resultCount, ${Math.max(props.search.k - 1, 0)}u);
    loop {
      if (destination <= insertionIndex) { break; }
      outputIds[${getViewElementOffset(props.queryTile.outputIds)}u + outputStart + destination] =
        outputIds[${getViewElementOffset(props.queryTile.outputIds)}u + outputStart + destination - 1u];
      outputScores[${getViewElementOffset(props.queryTile.outputScores)}u + outputStart + destination] =
        outputScores[${getViewElementOffset(props.queryTile.outputScores)}u + outputStart + destination - 1u];
      destination--;
    }
    outputIds[${getViewElementOffset(props.queryTile.outputIds)}u + outputStart + insertionIndex] = sourceId;
    outputScores[${getViewElementOffset(props.queryTile.outputScores)}u + outputStart + insertionIndex] = score;
    if (resultCount < ${props.search.k}u) { resultCount++; }
  }
  resultCounts[${getViewElementOffset(props.queryTile.resultCounts)}u + index] = resultCount;
}`;
  addGPUClusteringComputationPass(graph, {
    id: props.id,
    source,
    resources: [
      {buffer: props.queryTile.values, usage: 'storage-read'},
      {buffer: props.datasetTile.values, usage: 'storage-read'},
      {buffer: props.tileCandidates, usage: 'storage-read'},
      {buffer: props.queryTile.outputIds, usage: 'storage-read-write'},
      {buffer: props.queryTile.outputScores, usage: 'storage-read-write'},
      {buffer: props.queryTile.resultCounts, usage: 'storage-read-write'},
      ...(props.queryTile.candidateCounts
        ? ([
            {buffer: props.queryTile.candidateCounts, usage: 'storage-read-write'}
          ] as GraphBufferUse[])
        : [])
    ],
    bindings: {
      queryValues: props.queryTile.values,
      embeddingValues: props.datasetTile.values,
      tileCandidates: props.tileCandidates,
      outputIds: props.queryTile.outputIds,
      outputScores: props.queryTile.outputScores,
      resultCounts: props.queryTile.resultCounts,
      ...(props.queryTile.candidateCounts ? {candidateCounts: props.queryTile.candidateCounts} : {})
    },
    elementCount: props.queryTile.rowCount
  });
}
