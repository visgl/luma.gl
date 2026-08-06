// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuVS.

import {
  createTransientView,
  doGraphDataViewsOverlap,
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
import {GPUGroupAggregation} from '../gpu-primitives/gpu-group-aggregation';
import {
  GPU_CLUSTERING_WORKGROUP_SIZE,
  addGPUClusteringComputationPass,
  getGPUClusteringDispatchLayout,
  getGPUClusteringInvocationIndexSource,
  getGPUClusteringMatrixTiles,
  getGPUClusteringTileRowView,
  validateGPUClusteringEmbeddingMatrix,
  validateGPUClusteringRowViews,
  type GPUClusteringMatrixTile,
  type GPUClusteringRowViews
} from './gpu-clustering-utils';
import type {GraphEmbeddingMatrix} from './types';

const INVALID_CLUSTER_LABEL = 0xffffffff;
const DEFAULT_MAXIMUM_ITERATIONS = 10;

/** Caller-owned source-aligned labels, optionally retaining original embedding chunks. */
export type GPUKMeansLabels = GPUClusteringRowViews;

/** Properties for a reusable, graph-native high-dimensional k-means training pass. */
export type GPUKMeansProps = {
  /** Prefix shared by generated graph nodes and temporary reduction resources. */
  id?: string;
  /** Source-preserving flattened float32 embedding rows. */
  dataset: GraphEmbeddingMatrix;
  /** Positive number of cluster centroids and output categories. */
  clusterCount: number;
  /** Caller-owned flattened float32 centroids in cluster-major component order. */
  centroids: GraphDataView<'float32'>;
  /** Caller-owned uint32 labels; invalid rows receive `0xffffffff`. */
  labels: GPUKMeansLabels;
  /** Caller-owned number of valid rows assigned to each cluster. */
  counts: GraphDataView<'uint32'>;
  /** Optional caller-owned `[executedIterations, changedLabels, converged]` uint32 state. */
  status?: GraphDataView<'uint32'>;
  /** Maximum number of statically encoded Lloyd iterations. Defaults to ten. */
  maxIterations?: number;
  /** Deterministic cyclic search for valid rows nearest evenly spaced source positions. */
  seed?: 'evenly-spaced';
};

/**
 * Trains source-preserving high-dimensional k-means clusters entirely on WebGPU.
 *
 * Seeds are deterministic, evenly spaced valid rows. Invalid or non-finite rows receive the
 * sentinel label `0xffffffff`. Empty clusters retain their preceding centroid. Cluster sums are
 * accumulated by one invocation per centroid component in original chunk and row order: this uses
 * neither unsupported float32 atomics nor order-dependent compare-and-swap accumulation.
 *
 * Exactly `maxIterations` bounded iterations are encoded, but subsequent assignment and reduction
 * shaders become no-ops after labels converge. Optional GPU-resident status reports the executed
 * iteration count, last changed-label count, and a zero/nonzero convergence flag.
 */
export class GPUKMeans {
  readonly id: string;
  readonly dataset: GraphEmbeddingMatrix;
  readonly clusterCount: number;
  readonly centroids: GraphDataView<'float32'>;
  readonly labels: GPUKMeansLabels;
  readonly counts: GraphDataView<'uint32'>;
  readonly status?: GraphDataView<'uint32'>;
  readonly maxIterations: number;
  readonly seed: 'evenly-spaced';

  private registered = false;

  /** Validates clustering metadata and explicit caller-owned output storage. */
  constructor(props: GPUKMeansProps) {
    this.id = props.id ?? 'gpu-k-means';
    this.dataset = props.dataset;
    this.clusterCount = props.clusterCount;
    this.centroids = props.centroids;
    this.labels = props.labels;
    this.counts = props.counts;
    this.status = props.status;
    this.maxIterations = props.maxIterations ?? DEFAULT_MAXIMUM_ITERATIONS;
    this.seed = props.seed ?? 'evenly-spaced';

    validateGPUClusteringEmbeddingMatrix(this.dataset, `${this.id} dataset`);
    if (
      !Number.isSafeInteger(this.clusterCount) ||
      this.clusterCount < 1 ||
      this.clusterCount > INVALID_CLUSTER_LABEL ||
      !Number.isSafeInteger(this.clusterCount * this.dataset.dimensions) ||
      this.clusterCount * this.dataset.dimensions > INVALID_CLUSTER_LABEL
    ) {
      throw new Error(`${this.id} cluster count and centroid component count must fit in uint32`);
    }
    if (!Number.isSafeInteger(this.maxIterations) || this.maxIterations < 1) {
      throw new Error(`${this.id} maxIterations must be a positive integer`);
    }
    if (this.seed !== 'evenly-spaced') {
      throw new Error(`${this.id} seed strategy must be evenly-spaced`);
    }
    if (
      !Number.isSafeInteger(this.dataset.rowCount) ||
      this.dataset.rowCount > INVALID_CLUSTER_LABEL
    ) {
      throw new Error(`${this.id} dataset row count must fit in uint32`);
    }

    validatePackedView(this.centroids, ['float32'], `${this.id} centroids`);
    validateGPUClusteringRowViews(this.dataset, this.labels, `${this.id} labels`);
    validatePackedUint32View(this.counts, `${this.id} counts`);
    if (this.centroids.length < this.clusterCount * this.dataset.dimensions) {
      throw new Error(`${this.id} centroids must contain clusterCount * dimensions values`);
    }
    if (this.counts.length !== this.clusterCount) {
      throw new Error(`${this.id} counts must contain exactly clusterCount values`);
    }
    if (this.status) {
      validatePackedUint32View(this.status, `${this.id} status`);
      if (this.status.length < 3) {
        throw new Error(`${this.id} status must contain iteration, change, and convergence values`);
      }
    }
    validateDistinctKMeansOutputs(this);
  }

  /** Declares bounded initialization and Lloyd passes without implicit submit or CPU readback. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.registered) {
      throw new Error(`${this.id} clustering has already been added to a command graph`);
    }
    const inputViews = this.dataset.chunks.flatMap(chunk => [
      chunk.values,
      ...(chunk.validity ? [chunk.validity] : []),
      ...(chunk.sourceRowIds ? [chunk.sourceRowIds] : [])
    ]);
    const labelViews = this.labels instanceof GraphVectorView ? this.labels.data : [this.labels];
    const outputViews = [
      this.centroids,
      this.counts,
      ...labelViews,
      ...(this.status ? [this.status] : [])
    ];
    if ([...inputViews, ...outputViews].some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} inputs and outputs must belong to the target graph`);
    }

    const tiles = getGPUClusteringMatrixTiles(graph, this.dataset);
    const centroidComponentCount = this.clusterCount * this.dataset.dimensions;
    const status =
      this.status ??
      createTransientView<'uint32', Parameters>(graph, `${this.id}-status`, 'uint32', 3);
    const seedDistances = createTransientView<'uint32', Parameters>(
      graph,
      `${this.id}-seed-distances`,
      'uint32',
      this.clusterCount
    );
    const seedRows = createTransientView<'uint32', Parameters>(
      graph,
      `${this.id}-seed-rows`,
      'uint32',
      this.clusterCount
    );
    const sums = createTransientView<'float32', Parameters>(
      graph,
      `${this.id}-centroid-sums`,
      'float32',
      centroidComponentCount
    );

    addInitializeKMeansPass(graph, this, status, seedDistances, seedRows);
    for (const [tileIndex, tile] of tiles.entries()) {
      const labels = getGPUClusteringTileRowView(graph, this.labels, tile);
      addClearLabelsPass(graph, `${this.id}-labels-tile-${tileIndex}`, labels);
      addSeedSelectionPass(graph, this, tile, tileIndex, seedDistances, seedRows);
      addSeedCopyPass(graph, this, tile, tileIndex, seedRows);
    }

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      const iterationId = `${this.id}-iteration-${iteration}`;
      addResetChangedLabelsPass(graph, iterationId, status);
      for (const [tileIndex, tile] of tiles.entries()) {
        addAssignmentPass(
          graph,
          this,
          tile,
          getGPUClusteringTileRowView(graph, this.labels, tile),
          status,
          `${iterationId}-assign-tile-${tileIndex}`
        );
      }
      new GPUGroupAggregation({
        id: `${iterationId}-counts`,
        keys: this.labels,
        output: this.counts
      }).addToGraph(graph);
      addClearSumsPass(graph, `${iterationId}-clear-sums`, sums, status);
      for (const [tileIndex, tile] of tiles.entries()) {
        addAccumulateCentroidsPass(
          graph,
          this,
          tile,
          getGPUClusteringTileRowView(graph, this.labels, tile),
          sums,
          status,
          `${iterationId}-sum-tile-${tileIndex}`
        );
      }
      addFinalizeCentroidsPass(graph, this, sums, status, `${iterationId}-centroids`);
      addFinalizeIterationPass(graph, `${iterationId}-status`, status);
    }
    this.registered = true;
  }
}

/** Prevents labels, centroids, counts, and status from silently sharing writable storage. */
function validateDistinctKMeansOutputs(clustering: GPUKMeans): void {
  const labels =
    clustering.labels instanceof GraphVectorView ? clustering.labels.data : [clustering.labels];
  const outputs = [
    clustering.centroids,
    clustering.counts,
    ...(clustering.status ? [clustering.status] : [])
  ];
  for (let index = 0; index < outputs.length; index++) {
    for (let comparison = index + 1; comparison < outputs.length; comparison++) {
      if (outputs[index].buffer === outputs[comparison].buffer) {
        throw new Error(`${clustering.id} writable outputs must use separate graph buffers`);
      }
    }
  }
  if (labels.some(label => outputs.some(output => label.buffer === output.buffer))) {
    throw new Error(
      `${clustering.id} labels and aggregate outputs must use separate graph buffers`
    );
  }
  const inputs = clustering.dataset.chunks.flatMap(chunk => [
    chunk.values,
    ...(chunk.validity ? [chunk.validity] : []),
    ...(chunk.sourceRowIds ? [chunk.sourceRowIds] : [])
  ]);
  for (const output of [...outputs, ...labels]) {
    if (inputs.some(input => doGraphDataViewsOverlap(input, output))) {
      throw new Error(`${clustering.id} writable outputs must not overlap source embedding data`);
    }
  }
}

/** Clears centroids, deterministic seed candidates, and optional convergence reporting. */
function addInitializeKMeansPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  clustering: GPUKMeans,
  status: GraphDataView<'uint32'>,
  seedDistances: GraphDataView<'uint32'>,
  seedRows: GraphDataView<'uint32'>
): void {
  const componentCount = clustering.clusterCount * clustering.dataset.dimensions;
  const elementCount = Math.max(componentCount, clustering.clusterCount, 3);
  const dispatchLayout = getGPUClusteringDispatchLayout(
    clustering.id,
    elementCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> centroidValues: array<f32>;
@group(0) @binding(1) var<storage, read_write> convergenceState: array<u32>;
@group(0) @binding(2) var<storage, read_write> seedDistances: array<u32>;
@group(0) @binding(3) var<storage, read_write> seedRows: array<u32>;
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index < ${componentCount}u) {
    centroidValues[${getViewElementOffset(clustering.centroids)}u + index] = 0.0;
  }
  if (index < ${clustering.clusterCount}u) {
    seedDistances[${getViewElementOffset(seedDistances)}u + index] = 0xffffffffu;
    seedRows[${getViewElementOffset(seedRows)}u + index] = 0xffffffffu;
  }
  if (index < 3u) {
    convergenceState[${getViewElementOffset(status)}u + index] =
      select(0u, ${clustering.dataset.rowCount === 0 ? '1u' : '0u'}, index == 2u);
  }
}`;
  addGPUClusteringComputationPass(graph, {
    id: `${clustering.id}-initialize`,
    source,
    resources: [
      {buffer: clustering.centroids, usage: 'storage-write'},
      {buffer: status, usage: 'storage-write'},
      {buffer: seedDistances, usage: 'storage-write'},
      {buffer: seedRows, usage: 'storage-write'}
    ],
    bindings: {
      centroidValues: clustering.centroids,
      convergenceState: status,
      seedDistances,
      seedRows
    },
    elementCount
  });
}

/** Ensures nullable or non-finite rows never appear as valid cluster labels. */
function addClearLabelsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  labels: GraphDataView<'uint32'>
): void {
  const dispatchLayout = getGPUClusteringDispatchLayout(
    id,
    labels.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> clusterLabels: array<u32>;
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index < ${labels.length}u) {
    clusterLabels[${getViewElementOffset(labels)}u + index] = 0xffffffffu;
  }
}`;
  addGPUClusteringComputationPass(graph, {
    id,
    source,
    resources: [{buffer: labels, usage: 'storage-write'}],
    bindings: {clusterLabels: labels},
    elementCount: labels.length
  });
}

/** Picks the nearest cyclic valid source row to each evenly spaced deterministic seed. */
function addSeedSelectionPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  clustering: GPUKMeans,
  tile: GPUClusteringMatrixTile,
  tileIndex: number,
  seedDistances: GraphDataView<'uint32'>,
  seedRows: GraphDataView<'uint32'>
): void {
  const dispatchLayout = getGPUClusteringDispatchLayout(
    clustering.id,
    clustering.clusterCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  let nextBinding = 3;
  const validityBinding = tile.validity
    ? `@group(0) @binding(${nextBinding++}) var<storage, read> rowValidity: array<u32>;`
    : '';
  const sourceIdsBinding = tile.sourceRowIds
    ? `@group(0) @binding(${nextBinding++}) var<storage, read> sourceRowIds: array<u32>;`
    : '';
  const validityCheck = tile.validity
    ? `if (rowValidity[${getViewElementOffset(tile.validity)}u + row] == 0u) { continue; }`
    : '';
  const sourceIdCheck = tile.sourceRowIds
    ? `if (sourceRowIds[${getViewElementOffset(tile.sourceRowIds)}u + row] == 0xffffffffu) { continue; }`
    : '';
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read> embeddingValues: array<f32>;
@group(0) @binding(1) var<storage, read_write> seedDistances: array<u32>;
@group(0) @binding(2) var<storage, read_write> seedRows: array<u32>;
${validityBinding}
${sourceIdsBinding}
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index >= ${clustering.clusterCount}u) { return; }
  let targetRow = min(
    u32(floor(f32(index) * f32(${clustering.dataset.rowCount}u) / f32(${clustering.clusterCount}u))),
    ${clustering.dataset.rowCount - 1}u
  );
  var bestDistance = seedDistances[${getViewElementOffset(seedDistances)}u + index];
  var bestRow = seedRows[${getViewElementOffset(seedRows)}u + index];
  for (var row = 0u; row < ${tile.rowCount}u; row++) {
    ${validityCheck}
    ${sourceIdCheck}
    var finiteRow = true;
    for (var dimension = 0u; dimension < ${clustering.dataset.dimensions}u; dimension++) {
      let value = embeddingValues[
        ${getViewElementOffset(tile.values)}u + row * ${tile.chunk.rowStride}u + dimension
      ];
      if (!(value == value && abs(value) <= 3.402823466e+38)) { finiteRow = false; break; }
    }
    if (!finiteRow) { continue; }
    let logicalRow = ${tile.logicalRowOffset}u + row;
    let cyclicDistance = select(
      logicalRow - targetRow,
      ${clustering.dataset.rowCount}u - targetRow + logicalRow,
      logicalRow < targetRow
    );
    if (cyclicDistance < bestDistance) {
      bestDistance = cyclicDistance;
      bestRow = logicalRow;
    }
  }
  seedDistances[${getViewElementOffset(seedDistances)}u + index] = bestDistance;
  seedRows[${getViewElementOffset(seedRows)}u + index] = bestRow;
}`;
  addGPUClusteringComputationPass(graph, {
    id: `${clustering.id}-seed-select-tile-${tileIndex}`,
    source,
    resources: [
      {buffer: tile.values, usage: 'storage-read'},
      {buffer: seedDistances, usage: 'storage-read-write'},
      {buffer: seedRows, usage: 'storage-read-write'},
      ...(tile.validity
        ? ([{buffer: tile.validity, usage: 'storage-read'}] as GraphBufferUse[])
        : []),
      ...(tile.sourceRowIds
        ? ([{buffer: tile.sourceRowIds, usage: 'storage-read'}] as GraphBufferUse[])
        : [])
    ],
    bindings: {
      embeddingValues: tile.values,
      seedDistances,
      seedRows,
      ...(tile.validity ? {rowValidity: tile.validity} : {}),
      ...(tile.sourceRowIds ? {sourceRowIds: tile.sourceRowIds} : {})
    },
    elementCount: clustering.clusterCount
  });
}

/** Copies newly selected seed rows component-by-component without packing source chunks. */
function addSeedCopyPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  clustering: GPUKMeans,
  tile: GPUClusteringMatrixTile,
  tileIndex: number,
  seedRows: GraphDataView<'uint32'>
): void {
  const componentCount = clustering.clusterCount * clustering.dataset.dimensions;
  const dispatchLayout = getGPUClusteringDispatchLayout(
    clustering.id,
    componentCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read> embeddingValues: array<f32>;
@group(0) @binding(1) var<storage, read> seedRows: array<u32>;
@group(0) @binding(2) var<storage, read_write> centroidValues: array<f32>;
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index >= ${componentCount}u) { return; }
  let clusterIndex = index / ${clustering.dataset.dimensions}u;
  let sourceRow = seedRows[${getViewElementOffset(seedRows)}u + clusterIndex];
  if (sourceRow < ${tile.logicalRowOffset}u ||
      sourceRow >= ${tile.logicalRowOffset + tile.rowCount}u) { return; }
  let tileRow = sourceRow - ${tile.logicalRowOffset}u;
  let dimension = index % ${clustering.dataset.dimensions}u;
  centroidValues[${getViewElementOffset(clustering.centroids)}u + index] =
    embeddingValues[${getViewElementOffset(tile.values)}u + tileRow * ${tile.chunk.rowStride}u + dimension];
}`;
  addGPUClusteringComputationPass(graph, {
    id: `${clustering.id}-seed-copy-tile-${tileIndex}`,
    source,
    resources: [
      {buffer: tile.values, usage: 'storage-read'},
      {buffer: seedRows, usage: 'storage-read'},
      {buffer: clustering.centroids, usage: 'storage-write'}
    ],
    bindings: {
      embeddingValues: tile.values,
      seedRows,
      centroidValues: clustering.centroids
    },
    elementCount: componentCount
  });
}

/** Clears only the per-iteration label-change counter while training remains active. */
function addResetChangedLabelsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  status: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> convergenceState: array<u32>;
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalInvocationId: vec3<u32>
) {
  if (globalInvocationId.x == 0u &&
      convergenceState[${getViewElementOffset(status)}u + 2u] == 0u) {
    convergenceState[${getViewElementOffset(status)}u + 1u] = 0u;
  }
}`;
  addGPUClusteringComputationPass(graph, {
    id: `${id}-reset-changes`,
    source,
    resources: [{buffer: status, usage: 'storage-read-write'}],
    bindings: {convergenceState: status},
    elementCount: 1
  });
}

/** Assigns finite source rows to the nearest centroid, breaking ties by cluster index. */
function addAssignmentPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  clustering: GPUKMeans,
  tile: GPUClusteringMatrixTile,
  labels: GraphDataView<'uint32'>,
  status: GraphDataView<'uint32'>,
  id: string
): void {
  const dispatchLayout = getGPUClusteringDispatchLayout(
    id,
    tile.rowCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  let nextBinding = 4;
  const validityBinding = tile.validity
    ? `@group(0) @binding(${nextBinding++}) var<storage, read> rowValidity: array<u32>;`
    : '';
  const sourceIdsBinding = tile.sourceRowIds
    ? `@group(0) @binding(${nextBinding++}) var<storage, read> sourceRowIds: array<u32>;`
    : '';
  const validityCheck = tile.validity
    ? `if (rowValidity[${getViewElementOffset(tile.validity)}u + index] == 0u) { return; }`
    : '';
  const sourceIdCheck = tile.sourceRowIds
    ? `if (sourceRowIds[${getViewElementOffset(tile.sourceRowIds)}u + index] == 0xffffffffu) { return; }`
    : '';
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read> embeddingValues: array<f32>;
@group(0) @binding(1) var<storage, read> centroidValues: array<f32>;
@group(0) @binding(2) var<storage, read_write> clusterLabels: array<u32>;
@group(0) @binding(3) var<storage, read_write> convergenceState: array<atomic<u32>>;
${validityBinding}
${sourceIdsBinding}
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index >= ${tile.rowCount}u ||
      atomicLoad(&convergenceState[${getViewElementOffset(status)}u + 2u]) != 0u) { return; }
  ${validityCheck}
  ${sourceIdCheck}
  var bestDistance = 3.402823466e+38;
  var bestCluster = 0xffffffffu;
  for (var clusterIndex = 0u; clusterIndex < ${clustering.clusterCount}u; clusterIndex++) {
    var distance = 0.0;
    var finiteRow = true;
    for (var dimension = 0u; dimension < ${clustering.dataset.dimensions}u; dimension++) {
      let sourceValue = embeddingValues[
        ${getViewElementOffset(tile.values)}u + index * ${tile.chunk.rowStride}u + dimension
      ];
      let centroidValue = centroidValues[
        ${getViewElementOffset(clustering.centroids)}u +
        clusterIndex * ${clustering.dataset.dimensions}u + dimension
      ];
      if (!(sourceValue == sourceValue && abs(sourceValue) <= 3.402823466e+38) ||
          !(centroidValue == centroidValue && abs(centroidValue) <= 3.402823466e+38)) {
        finiteRow = false;
        break;
      }
      let difference = sourceValue - centroidValue;
      distance += difference * difference;
    }
    if (finiteRow && (bestCluster == 0xffffffffu || distance < bestDistance)) {
      bestDistance = distance;
      bestCluster = clusterIndex;
    }
  }
  let previous = clusterLabels[${getViewElementOffset(labels)}u + index];
  clusterLabels[${getViewElementOffset(labels)}u + index] = bestCluster;
  if (previous != bestCluster) {
    atomicAdd(&convergenceState[${getViewElementOffset(status)}u + 1u], 1u);
  }
}`;
  addGPUClusteringComputationPass(graph, {
    id,
    source,
    resources: [
      {buffer: tile.values, usage: 'storage-read'},
      {buffer: clustering.centroids, usage: 'storage-read'},
      {buffer: labels, usage: 'storage-read-write'},
      {buffer: status, usage: 'storage-read-write'},
      ...(tile.validity
        ? ([{buffer: tile.validity, usage: 'storage-read'}] as GraphBufferUse[])
        : []),
      ...(tile.sourceRowIds
        ? ([{buffer: tile.sourceRowIds, usage: 'storage-read'}] as GraphBufferUse[])
        : [])
    ],
    bindings: {
      embeddingValues: tile.values,
      centroidValues: clustering.centroids,
      clusterLabels: labels,
      convergenceState: status,
      ...(tile.validity ? {rowValidity: tile.validity} : {}),
      ...(tile.sourceRowIds ? {sourceRowIds: tile.sourceRowIds} : {})
    },
    elementCount: tile.rowCount
  });
}

/** Clears deterministic component sums only while another Lloyd iteration is required. */
function addClearSumsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  sums: GraphDataView<'float32'>,
  status: GraphDataView<'uint32'>
): void {
  const dispatchLayout = getGPUClusteringDispatchLayout(
    id,
    sums.length,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> centroidSums: array<f32>;
@group(0) @binding(1) var<storage, read> convergenceState: array<u32>;
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index < ${sums.length}u &&
      convergenceState[${getViewElementOffset(status)}u + 2u] == 0u) {
    centroidSums[${getViewElementOffset(sums)}u + index] = 0.0;
  }
}`;
  addGPUClusteringComputationPass(graph, {
    id,
    source,
    resources: [
      {buffer: sums, usage: 'storage-write'},
      {buffer: status, usage: 'storage-read'}
    ],
    bindings: {centroidSums: sums, convergenceState: status},
    elementCount: sums.length
  });
}

/** Accumulates one ordered tile serially per centroid component, with no float atomics. */
function addAccumulateCentroidsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  clustering: GPUKMeans,
  tile: GPUClusteringMatrixTile,
  labels: GraphDataView<'uint32'>,
  sums: GraphDataView<'float32'>,
  status: GraphDataView<'uint32'>,
  id: string
): void {
  const componentCount = clustering.clusterCount * clustering.dataset.dimensions;
  const dispatchLayout = getGPUClusteringDispatchLayout(
    id,
    componentCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read> embeddingValues: array<f32>;
@group(0) @binding(1) var<storage, read> clusterLabels: array<u32>;
@group(0) @binding(2) var<storage, read_write> centroidSums: array<f32>;
@group(0) @binding(3) var<storage, read> convergenceState: array<u32>;
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index >= ${componentCount}u ||
      convergenceState[${getViewElementOffset(status)}u + 2u] != 0u) { return; }
  let clusterIndex = index / ${clustering.dataset.dimensions}u;
  let dimension = index % ${clustering.dataset.dimensions}u;
  var total = centroidSums[${getViewElementOffset(sums)}u + index];
  for (var row = 0u; row < ${tile.rowCount}u; row++) {
    if (clusterLabels[${getViewElementOffset(labels)}u + row] == clusterIndex) {
      total += embeddingValues[
        ${getViewElementOffset(tile.values)}u + row * ${tile.chunk.rowStride}u + dimension
      ];
    }
  }
  centroidSums[${getViewElementOffset(sums)}u + index] = total;
}`;
  addGPUClusteringComputationPass(graph, {
    id,
    source,
    resources: [
      {buffer: tile.values, usage: 'storage-read'},
      {buffer: labels, usage: 'storage-read'},
      {buffer: sums, usage: 'storage-read-write'},
      {buffer: status, usage: 'storage-read'}
    ],
    bindings: {
      embeddingValues: tile.values,
      clusterLabels: labels,
      centroidSums: sums,
      convergenceState: status
    },
    elementCount: componentCount
  });
}

/** Divides serial component sums by group counts while retaining empty-cluster centroids. */
function addFinalizeCentroidsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  clustering: GPUKMeans,
  sums: GraphDataView<'float32'>,
  status: GraphDataView<'uint32'>,
  id: string
): void {
  const componentCount = clustering.clusterCount * clustering.dataset.dimensions;
  const dispatchLayout = getGPUClusteringDispatchLayout(
    id,
    componentCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read> centroidSums: array<f32>;
@group(0) @binding(1) var<storage, read> clusterCounts: array<u32>;
@group(0) @binding(2) var<storage, read_write> centroidValues: array<f32>;
@group(0) @binding(3) var<storage, read> convergenceState: array<u32>;
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getGPUClusteringInvocationIndexSource(dispatchLayout)}
  if (index >= ${componentCount}u ||
      convergenceState[${getViewElementOffset(status)}u + 2u] != 0u) { return; }
  let clusterIndex = index / ${clustering.dataset.dimensions}u;
  let count = clusterCounts[${getViewElementOffset(clustering.counts)}u + clusterIndex];
  if (count != 0u) {
    centroidValues[${getViewElementOffset(clustering.centroids)}u + index] =
      centroidSums[${getViewElementOffset(sums)}u + index] / f32(count);
  }
}`;
  addGPUClusteringComputationPass(graph, {
    id,
    source,
    resources: [
      {buffer: sums, usage: 'storage-read'},
      {buffer: clustering.counts, usage: 'storage-read'},
      {buffer: clustering.centroids, usage: 'storage-write'},
      {buffer: status, usage: 'storage-read'}
    ],
    bindings: {
      centroidSums: sums,
      clusterCounts: clustering.counts,
      centroidValues: clustering.centroids,
      convergenceState: status
    },
    elementCount: componentCount
  });
}

/** Records deterministic convergence after every completed label assignment. */
function addFinalizeIterationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  status: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
@group(0) @binding(0) var<storage, read_write> convergenceState: array<u32>;
@compute @workgroup_size(${GPU_CLUSTERING_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalInvocationId: vec3<u32>
) {
  if (globalInvocationId.x != 0u ||
      convergenceState[${getViewElementOffset(status)}u + 2u] != 0u) { return; }
  convergenceState[${getViewElementOffset(status)}u] += 1u;
  if (convergenceState[${getViewElementOffset(status)}u + 1u] == 0u) {
    convergenceState[${getViewElementOffset(status)}u + 2u] = 1u;
  }
}`;
  addGPUClusteringComputationPass(graph, {
    id,
    source,
    resources: [{buffer: status, usage: 'storage-read-write'}],
    bindings: {convergenceState: status},
    elementCount: 1
  });
}
