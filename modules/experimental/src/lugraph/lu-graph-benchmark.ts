// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device, type QuerySet} from '@luma.gl/core';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {
  GPUCommandGraph,
  type CompiledGPUCommandGraph,
  type GPUCommandGraphContributor
} from '../gpu-primitives/gpu-command-graph';
import {GPUGridIndex} from '../gpu-primitives/gpu-grid-index';
import {LuGraph} from './lu-graph';
import {
  LU_GRAPH_BENCHMARK_BOUNDS,
  LU_GRAPH_BENCHMARK_FORCE_PROPS,
  getLuGraphBenchmarkTime,
  prepareLuGraphBenchmark,
  summarizeLuGraphBenchmarkSamples,
  type LuGraphBenchmarkAlgorithm,
  type LuGraphBenchmarkContext,
  type LuGraphBenchmarkDataset,
  type LuGraphBenchmarkDistribution,
  type LuGraphBenchmarkOptions,
  type LuGraphBenchmarkPathReport,
  type LuGraphBenchmarkReport
} from './lu-graph-benchmark-data';
import {LuGraphBreadthFirstSearch} from './lu-graph-breadth-first-search';
import {LuGraphConnectedComponents} from './lu-graph-connected-components';
import {LuGraphForceLayout} from './lu-graph-force-layout';
import {LuGraphPageRank} from './lu-graph-page-rank';
import {LuGraphSpatialForceLayout} from './lu-graph-spatial-force-layout';
import {LuGraphTopology, type LuGraphAdjacency} from './lu-graph-topology';

const SCALAR_BYTE_LENGTH = 4;
const PAGE_RANK_TOLERANCE = 0.0001;
const FORCE_LAYOUT_TOLERANCE = 0.0005;

type BenchmarkScalarFormat = 'uint32' | 'float32';

type CompiledBenchmarkPath = {
  algorithm: LuGraphBenchmarkAlgorithm;
  compiled: CompiledGPUCommandGraph<void>;
};

type BenchmarkExecution = {
  cpuEncodeTimeMilliseconds: number;
  synchronizedTimeMilliseconds: number;
  gpuTimeMilliseconds?: number;
};

type BenchmarkValidation = {
  maxAbsoluteError: number;
  approximationMaxAbsoluteError?: number;
  readbackTimeMilliseconds: number;
};

/**
 * Runs actual CPU and fence-synchronized WebGPU graph algorithms on identical source rows.
 *
 * Source upload, command-graph compilation, result validation/readback, and spatial-index
 * construction are reported separately. An independently evaluated CPU near/far implementation
 * validates the accelerated path before its approximation error against exact forces is exposed.
 * No work starts until an application explicitly calls this optional benchmark entry point.
 */
export async function runLuGraphBenchmark(
  device: Device,
  options: LuGraphBenchmarkOptions
): Promise<LuGraphBenchmarkReport> {
  if (device.type !== 'webgpu') {
    throw new Error('luGraph benchmarks require a WebGPU device');
  }

  const context = prepareLuGraphBenchmark(options);
  let resources: LuGraphBenchmarkResources | undefined;
  const compiledPaths: CompiledBenchmarkPath[] = [];
  let compiledIndex: CompiledGPUCommandGraph<void> | undefined;

  try {
    const uploadStartTime = getLuGraphBenchmarkTime();
    resources = new LuGraphBenchmarkResources(device, context);
    await waitForBenchmarkFence(device);
    const uploadTimeMilliseconds = getLuGraphBenchmarkTime() - uploadStartTime;

    let compilationTimeMilliseconds = 0;
    const contributors: [LuGraphBenchmarkAlgorithm, GPUCommandGraphContributor][] = [
      ['topology', resources.topology],
      ['breadth-first-search', resources.search],
      ['connected-components', resources.components],
      ['page-rank', resources.pageRank],
      ['exact-layout', resources.exactLayout],
      ['spatial-layout', resources.spatialLayout]
    ];
    for (const [algorithm, contributor] of contributors) {
      const startTime = getLuGraphBenchmarkTime();
      const graph = new GPUCommandGraph(device, {id: `lugraph-benchmark-${algorithm}`});
      contributor.addToGraph(graph);
      const compiled = graph.compile();
      compilationTimeMilliseconds += getLuGraphBenchmarkTime() - startTime;
      compiledPaths.push({algorithm, compiled});
    }

    const indexCompilationStartTime = getLuGraphBenchmarkTime();
    compiledIndex = resources.compileSpatialIndex();
    compilationTimeMilliseconds += getLuGraphBenchmarkTime() - indexCompilationStartTime;

    let readbackTimeMilliseconds = 0;
    let approximationMaxAbsoluteError = 0;
    const paths: LuGraphBenchmarkPathReport[] = [];

    for (const path of compiledPaths) {
      const initialValidation = await validateBenchmarkPath(device, resources, context, path);
      readbackTimeMilliseconds += initialValidation.readbackTimeMilliseconds;

      for (let iteration = 0; iteration < context.options.warmupIterations; iteration++) {
        await resetBenchmarkPath(device, resources, path.algorithm);
        await executeBenchmarkPath(device, path.compiled, `${path.algorithm}-warmup-${iteration}`);
      }

      const executions: BenchmarkExecution[] = [];
      for (let iteration = 0; iteration < context.options.measuredIterations; iteration++) {
        await resetBenchmarkPath(device, resources, path.algorithm);
        executions.push(
          await executeBenchmarkPath(
            device,
            path.compiled,
            `${path.algorithm}-measured-${iteration}`,
            device.features.has('timestamp-query')
          )
        );
      }

      const finalValidation = await readBenchmarkPath(resources, context, path.algorithm);
      readbackTimeMilliseconds += finalValidation.readbackTimeMilliseconds;
      approximationMaxAbsoluteError = Math.max(
        approximationMaxAbsoluteError,
        initialValidation.approximationMaxAbsoluteError ?? 0,
        finalValidation.approximationMaxAbsoluteError ?? 0
      );

      const gpuSamples = executions.flatMap(execution =>
        execution.gpuTimeMilliseconds === undefined ? [] : [execution.gpuTimeMilliseconds]
      );
      paths.push({
        algorithm: path.algorithm,
        cpuTimeMilliseconds: context.cpuTimeMilliseconds[path.algorithm],
        cpuEncodeTimeMilliseconds: summarizeLuGraphBenchmarkSamples(
          executions.map(execution => execution.cpuEncodeTimeMilliseconds)
        ),
        synchronizedTimeMilliseconds: summarizeLuGraphBenchmarkSamples(
          executions.map(execution => execution.synchronizedTimeMilliseconds)
        ),
        ...(gpuSamples.length > 0
          ? {gpuTimeMilliseconds: summarizeLuGraphBenchmarkSamples(gpuSamples)}
          : {}),
        maxAbsoluteError: Math.max(
          initialValidation.maxAbsoluteError,
          finalValidation.maxAbsoluteError
        ),
        importedBufferBytes: path.compiled.stats.importedBufferBytes,
        transientBufferBytes: path.compiled.stats.physicalTransientBytes
      });
    }

    const spatialIndexBuildTimeMilliseconds = await measureSpatialIndexBuild(
      device,
      resources,
      context,
      compiledIndex
    );

    return {
      datasetKind: context.dataset.kind,
      vertexCount: context.dataset.vertexCount,
      edgeCount: context.dataset.edgeCount,
      warmupIterations: context.options.warmupIterations,
      measuredIterations: context.options.measuredIterations,
      timestampQueries: device.features.has('timestamp-query'),
      uploadTimeMilliseconds,
      compilationTimeMilliseconds,
      readbackTimeMilliseconds,
      spatialIndexBuildTimeMilliseconds,
      indexMemoryBytes: resources.indexMemoryBytes,
      approximationMaxAbsoluteError,
      paths
    };
  } finally {
    compiledIndex?.destroy();
    for (const path of compiledPaths.reverse()) path.compiled.destroy();
    resources?.destroy();
  }
}

/** Caller-owned benchmark allocations, vectors, topology, and reusable algorithm contributors. */
class LuGraphBenchmarkResources {
  readonly device: Device;
  readonly dataset: LuGraphBenchmarkDataset;
  readonly buffers: Buffer[] = [];
  readonly vectors: GPUVector[] = [];
  readonly graph: LuGraph;
  readonly topology: LuGraphTopology;
  readonly search: LuGraphBreadthFirstSearch;
  readonly components: LuGraphConnectedComponents;
  readonly pageRank: LuGraphPageRank;
  readonly exactLayout: LuGraphForceLayout;
  readonly spatialLayout: LuGraphSpatialForceLayout;
  readonly indexMemoryBytes: number;

  constructor(device: Device, context: LuGraphBenchmarkContext) {
    this.device = device;
    this.dataset = context.dataset;
    const vertexCount = context.dataset.vertexCount;
    const edgeCount = context.dataset.edgeCount;

    this.graph = new LuGraph({
      vertexCount,
      directed: true,
      sourceVertices: this.createChunkedVector('sources', context.dataset.sourceChunks),
      targetVertices: this.createChunkedVector('targets', context.dataset.targetChunks)
    });
    const forward = this.createAdjacency('forward', vertexCount, edgeCount);
    const reverse = this.createAdjacency('reverse', vertexCount, edgeCount);
    this.topology = new LuGraphTopology({
      id: 'lugraph-benchmark-topology',
      graph: this.graph,
      forward,
      reverse,
      invalidEdgeCount: this.createScalarVector('invalid-edges', 'uint32', 1)
    });
    this.search = new LuGraphBreadthFirstSearch({
      id: 'lugraph-benchmark-search',
      topology: this.topology,
      seeds: this.createScalarVector('seeds', 'uint32', 1, new Uint32Array([0])),
      distances: this.createScalarVector('distances', 'uint32', vertexCount),
      predecessors: this.createScalarVector('predecessors', 'uint32', vertexCount),
      maxDepth: context.options.maxDepth,
      direction: 'outgoing'
    });
    this.components = new LuGraphConnectedComponents({
      id: 'lugraph-benchmark-components',
      topology: this.topology,
      output: this.createScalarVector('component-labels', 'uint32', vertexCount),
      converged: this.createScalarVector('component-convergence', 'uint32', 1)
    });
    this.pageRank = new LuGraphPageRank({
      id: 'lugraph-benchmark-page-rank',
      topology: this.topology,
      output: this.createScalarVector('page-rank', 'float32', vertexCount),
      residual: this.createScalarVector('page-rank-residual', 'float32', 1),
      iterations: context.options.pageRankIterations
    });

    this.exactLayout = this.createForceLayout('exact', context);
    const approximateLayout = this.createForceLayout('spatial', context);
    const cellCount = context.options.gridSize[0] * context.options.gridSize[1];
    const cellOffsets = this.createScalarVector('cell-offsets', 'uint32', cellCount + 1);
    const vertexIds = this.createScalarVector('spatial-vertex-ids', 'uint32', vertexCount);
    const cellCenters = this.createCoordinateVector(
      'cell-centers',
      new Float32Array(cellCount * 2)
    );
    const count = this.createScalarVector('spatial-count', 'uint32', 1);
    const overflow = this.createScalarVector('spatial-overflow', 'uint32', 1);
    this.spatialLayout = new LuGraphSpatialForceLayout({
      id: 'lugraph-benchmark-spatial-layout',
      layout: approximateLayout,
      gridSize: context.options.gridSize,
      bounds: LU_GRAPH_BENCHMARK_BOUNDS,
      theta: context.options.theta,
      cellOffsets,
      vertexIds,
      cellCenters,
      count,
      overflow
    });
    this.indexMemoryBytes = [cellOffsets, vertexIds, cellCenters, count, overflow].reduce(
      (byteLength, vector) => byteLength + vector.data[0].buffer.byteLength,
      0
    );
  }

  /** Independently rebuilds the exact same explicit spatial grid for honest construction timing. */
  compileSpatialIndex(): CompiledGPUCommandGraph<void> {
    const graph = new GPUCommandGraph(this.device, {id: 'lugraph-benchmark-spatial-index'});
    const importVector = <Format extends 'uint32' | 'float32x2'>(
      identifier: string,
      vector: GPUVector<Format>
    ) => graph.importGPUVector(identifier, vector).data[0];
    const index = new GPUGridIndex({
      id: 'lugraph-benchmark-independent-grid',
      positions: importVector('spatial-positions', this.spatialLayout.layout.positions),
      gridSize: this.spatialLayout.gridSize,
      bounds: this.spatialLayout.bounds,
      cellOffsets: importVector('spatial-cell-offsets', this.spatialLayout.cellOffsets),
      objectIds: importVector('spatial-vertex-ids', this.spatialLayout.vertexIds),
      count: importVector('spatial-count', this.spatialLayout.count),
      overflow: importVector('spatial-overflow', this.spatialLayout.overflow)
    });
    index.addToGraph(graph);
    return graph.compile();
  }

  /** Restores identical source positions and zero velocity without polluting measured execution. */
  resetLayout(layout: LuGraphForceLayout): void {
    getVectorBuffer(layout.positions).write(this.dataset.positions);
    getVectorBuffer(layout.velocities).write(new Float32Array(this.dataset.vertexCount * 2));
  }

  /** Destroys only explicit benchmark-owned resources; aggregate vectors merely borrow buffers. */
  destroy(): void {
    for (const vector of this.vectors.reverse()) vector.destroy();
    for (const buffer of this.buffers.reverse()) buffer.destroy();
  }

  /** Preserves aligned original source batches, including the deterministic empty middle chunk. */
  private createChunkedVector(name: string, chunks: Uint32Array[]): GPUVector<'uint32'> {
    const data = chunks.map((values, chunkIndex) => {
      const buffer = this.device.createBuffer({
        id: `lugraph-benchmark-${name}-${chunkIndex}`,
        data: values.length === 0 ? new Uint32Array(1) : values,
        usage: Buffer.STORAGE | Buffer.COPY_DST
      });
      this.buffers.push(buffer);
      return new GPUData<'uint32'>({
        buffer,
        format: 'uint32',
        length: values.length,
        ownsBuffer: false
      });
    });
    const vector = new GPUVector<'uint32'>({
      type: 'data',
      name,
      format: 'uint32',
      data,
      ownsData: false
    });
    this.vectors.push(vector);
    return vector;
  }

  /** Creates independently allocated packed topology, output, seed, or status vectors. */
  private createScalarVector<Format extends BenchmarkScalarFormat>(
    name: string,
    format: Format,
    length: number,
    values?: Uint32Array | Float32Array
  ): GPUVector<Format> {
    const buffer = this.device.createBuffer({
      id: `lugraph-benchmark-${name}`,
      byteLength: Math.max(length, 1) * SCALAR_BYTE_LENGTH,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    if (values && values.length > 0) buffer.write(values);
    this.buffers.push(buffer);
    const vector = new GPUVector<Format>({
      type: 'buffer',
      name,
      format,
      buffer,
      length,
      ownsBuffer: false
    });
    this.vectors.push(vector);
    return vector;
  }

  /** Creates render-ready packed coordinate state while preserving explicit validation readback. */
  private createCoordinateVector(name: string, values: Float32Array): GPUVector<'float32x2'> {
    const buffer = this.device.createBuffer({
      id: `lugraph-benchmark-${name}`,
      data: values.length === 0 ? new Float32Array(2) : values,
      usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    this.buffers.push(buffer);
    const vector = new GPUVector<'float32x2'>({
      type: 'buffer',
      name,
      format: 'float32x2',
      buffer,
      length: values.length / 2,
      ownsBuffer: false
    });
    this.vectors.push(vector);
    return vector;
  }

  /** Allocates complete caller-owned, non-truncated directed CSR storage. */
  private createAdjacency(name: string, vertexCount: number, edgeCount: number): LuGraphAdjacency {
    return {
      offsets: this.createScalarVector(`${name}-offsets`, 'uint32', vertexCount + 1),
      neighbors: this.createScalarVector(`${name}-neighbors`, 'uint32', edgeCount),
      edgeIds: this.createScalarVector(`${name}-edge-ids`, 'uint32', edgeCount),
      count: this.createScalarVector(`${name}-count`, 'uint32', 1),
      overflow: this.createScalarVector(`${name}-overflow`, 'uint32', 1)
    };
  }

  /** Gives exact and accelerated paths distinct render-ready positions and progressive velocity. */
  private createForceLayout(name: string, context: LuGraphBenchmarkContext): LuGraphForceLayout {
    return new LuGraphForceLayout({
      id: `lugraph-benchmark-${name}-force`,
      topology: this.topology,
      positions: this.createCoordinateVector(`${name}-positions`, context.dataset.positions),
      velocities: this.createCoordinateVector(
        `${name}-velocities`,
        new Float32Array(context.dataset.vertexCount * 2)
      ),
      iterationsPerFrame: context.options.forceIterations,
      ...LU_GRAPH_BENCHMARK_FORCE_PROPS
    });
  }
}

/** Validates before timings so an incorrect or incomplete implementation never claims a speedup. */
async function validateBenchmarkPath(
  device: Device,
  resources: LuGraphBenchmarkResources,
  context: LuGraphBenchmarkContext,
  path: CompiledBenchmarkPath
): Promise<BenchmarkValidation> {
  await resetBenchmarkPath(device, resources, path.algorithm);
  await executeBenchmarkPath(device, path.compiled, `${path.algorithm}-correctness`);
  return readBenchmarkPath(resources, context, path.algorithm);
}

/** Keeps source restores and their queue completion outside every timed submission interval. */
async function resetBenchmarkPath(
  device: Device,
  resources: LuGraphBenchmarkResources,
  algorithm: LuGraphBenchmarkAlgorithm | 'spatial-index'
): Promise<void> {
  if (algorithm === 'exact-layout') {
    resources.resetLayout(resources.exactLayout);
  } else if (algorithm === 'spatial-layout' || algorithm === 'spatial-index') {
    resources.resetLayout(resources.spatialLayout.layout);
  } else {
    return;
  }
  await waitForBenchmarkFence(device);
}

/** Times queue submission through a real completion fence; GPU query readback stays outside it. */
async function executeBenchmarkPath(
  device: Device,
  compiled: CompiledGPUCommandGraph<void>,
  identifier: string,
  requestTimestamps = false
): Promise<BenchmarkExecution> {
  const querySet: QuerySet | undefined = requestTimestamps
    ? device.createQuerySet({
        id: `lugraph-benchmark-${identifier}-timestamps`,
        type: 'timestamp',
        count: compiled.stats.nodeOrder.length * 2
      })
    : undefined;
  const commandEncoder = device.createCommandEncoder({
    id: `lugraph-benchmark-${identifier}`,
    ...(querySet ? {timeProfilingQuerySet: querySet} : {})
  });
  let submitted = false;

  try {
    const encoding = compiled.encode(commandEncoder, {parameters: undefined});
    const startTime = getLuGraphBenchmarkTime();
    device.submit(commandEncoder.finish());
    submitted = true;
    await waitForBenchmarkFence(device);
    const synchronizedTimeMilliseconds = getLuGraphBenchmarkTime() - startTime;
    const timing = await encoding.readTimings();
    return {
      cpuEncodeTimeMilliseconds: timing.cpuEncodeTimeMilliseconds,
      synchronizedTimeMilliseconds,
      ...(timing.gpuTimeMilliseconds === undefined
        ? {}
        : {gpuTimeMilliseconds: timing.gpuTimeMilliseconds})
    };
  } catch (error) {
    if (!submitted) commandEncoder.destroy();
    throw error;
  } finally {
    querySet?.destroy();
  }
}

/** Uses the portable device fence rather than assuming command submission is GPU completion. */
async function waitForBenchmarkFence(device: Device): Promise<void> {
  const fence = device.createFence();
  try {
    await fence.signaled;
  } finally {
    fence.destroy();
  }
}

/** Rebuilds the same explicit uniform-grid buffers in a separate, fully synchronized graph. */
async function measureSpatialIndexBuild(
  device: Device,
  resources: LuGraphBenchmarkResources,
  context: LuGraphBenchmarkContext,
  compiled: CompiledGPUCommandGraph<void>
): Promise<LuGraphBenchmarkDistribution> {
  for (let iteration = 0; iteration < context.options.warmupIterations; iteration++) {
    await resetBenchmarkPath(device, resources, 'spatial-index');
    await executeBenchmarkPath(device, compiled, `spatial-index-warmup-${iteration}`);
  }
  const samples: number[] = [];
  for (let iteration = 0; iteration < context.options.measuredIterations; iteration++) {
    await resetBenchmarkPath(device, resources, 'spatial-index');
    const execution = await executeBenchmarkPath(
      device,
      compiled,
      `spatial-index-measured-${iteration}`
    );
    samples.push(execution.synchronizedTimeMilliseconds);
  }
  return summarizeLuGraphBenchmarkSamples(samples);
}

/** Reads and compares observable outputs only after the synchronized execution window closes. */
async function readBenchmarkPath(
  resources: LuGraphBenchmarkResources,
  context: LuGraphBenchmarkContext,
  algorithm: LuGraphBenchmarkAlgorithm
): Promise<BenchmarkValidation> {
  let readbackTimeMilliseconds = 0;
  let maxAbsoluteError = 0;
  let approximationMaxAbsoluteError: number | undefined;
  const readOutputs = async (
    ...vectors: (GPUVector<'uint32'> | GPUVector<'float32'> | GPUVector<'float32x2'>)[]
  ): Promise<number[][]> => {
    const startTime = getLuGraphBenchmarkTime();
    const values = await Promise.all(vectors.map(vector => readBenchmarkVector(vector)));
    readbackTimeMilliseconds += getLuGraphBenchmarkTime() - startTime;
    return values;
  };

  switch (algorithm) {
    case 'topology': {
      const [forwardOffsets, forwardNeighbors, reverseOffsets, reverseNeighbors, invalid] =
        await readOutputs(
          resources.topology.forward.offsets,
          resources.topology.forward.neighbors,
          resources.topology.reverse!.offsets,
          resources.topology.reverse!.neighbors,
          resources.topology.invalidEdgeCount
        );
      maxAbsoluteError = Math.max(
        getMaximumAbsoluteError(forwardOffsets, context.reference.forwardOffsets),
        getMaximumAbsoluteError(reverseOffsets, context.reference.reverseOffsets),
        getMaximumAdjacencyError(
          forwardOffsets,
          forwardNeighbors,
          context.reference.forwardOffsets,
          context.reference.forwardNeighbors
        ),
        getMaximumAdjacencyError(
          reverseOffsets,
          reverseNeighbors,
          context.reference.reverseOffsets,
          context.reference.reverseNeighbors
        ),
        invalid[0]
      );
      break;
    }
    case 'breadth-first-search': {
      const [distances, predecessors] = await readOutputs(
        resources.search.distances,
        resources.search.predecessors
      );
      maxAbsoluteError = Math.max(
        getMaximumAbsoluteError(distances, context.reference.distances),
        getMaximumAbsoluteError(predecessors, context.reference.predecessors)
      );
      break;
    }
    case 'connected-components': {
      const [components, converged] = await readOutputs(
        resources.components.output,
        resources.components.converged!
      );
      maxAbsoluteError = Math.max(
        getMaximumAbsoluteError(components, context.reference.components),
        Math.abs(converged[0] - 1)
      );
      break;
    }
    case 'page-rank': {
      const [values] = await readOutputs(resources.pageRank.output);
      maxAbsoluteError = Math.max(
        getMaximumAbsoluteError(values, context.reference.pageRank),
        Math.abs(values.reduce((sum, value) => sum + value, 0) - 1)
      );
      break;
    }
    case 'exact-layout': {
      const [positions, velocities] = await readOutputs(
        resources.exactLayout.positions,
        resources.exactLayout.velocities
      );
      maxAbsoluteError = Math.max(
        getMaximumAbsoluteError(positions, context.reference.exactPositions),
        getMaximumAbsoluteError(velocities, context.reference.exactVelocities)
      );
      break;
    }
    case 'spatial-layout': {
      const [positions, velocities, count, overflow] = await readOutputs(
        resources.spatialLayout.layout.positions,
        resources.spatialLayout.layout.velocities,
        resources.spatialLayout.count,
        resources.spatialLayout.overflow
      );
      maxAbsoluteError = Math.max(
        getMaximumAbsoluteError(positions, context.reference.spatialPositions),
        getMaximumAbsoluteError(velocities, context.reference.spatialVelocities),
        Math.abs(count[0] - context.dataset.vertexCount),
        overflow[0]
      );
      approximationMaxAbsoluteError = getMaximumAbsoluteError(
        positions,
        context.reference.exactPositions
      );
      break;
    }
  }

  const tolerance =
    algorithm === 'page-rank'
      ? PAGE_RANK_TOLERANCE
      : algorithm === 'exact-layout' || algorithm === 'spatial-layout'
        ? FORCE_LAYOUT_TOLERANCE
        : 0;
  if (!Number.isFinite(maxAbsoluteError) || maxAbsoluteError > tolerance) {
    throw new Error(
      `luGraph benchmark ${algorithm} disagrees with its CPU oracle: ${maxAbsoluteError}`
    );
  }

  return {
    maxAbsoluteError,
    ...(approximationMaxAbsoluteError === undefined ? {} : {approximationMaxAbsoluteError}),
    readbackTimeMilliseconds
  };
}

/** Reads exactly one packed caller-owned GPU column after an explicit correctness request. */
async function readBenchmarkVector(
  vector: GPUVector<'uint32'> | GPUVector<'float32'> | GPUVector<'float32x2'>
): Promise<number[]> {
  if (vector.length === 0) return [];
  const chunk = vector.data[0];
  const componentCount = vector.format === 'float32x2' ? 2 : 1;
  const byteLength = vector.length * componentCount * SCALAR_BYTE_LENGTH;
  const bytes = await getVectorBuffer(vector).readAsync(chunk.byteOffset, byteLength);
  return vector.format === 'uint32'
    ? Array.from(new Uint32Array(bytes.buffer, bytes.byteOffset, byteLength / SCALAR_BYTE_LENGTH))
    : Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, byteLength / SCALAR_BYTE_LENGTH));
}

/** Atomic CSR placement is intentionally unordered within rows; compare complete row multisets. */
function getMaximumAdjacencyError(
  actualOffsets: readonly number[],
  actualNeighbors: readonly number[],
  expectedOffsets: ArrayLike<number>,
  expectedNeighbors: ArrayLike<number>
): number {
  let maximumError = 0;
  const expectedValues = Array.from(expectedNeighbors);
  for (let vertex = 0; vertex < expectedOffsets.length - 1; vertex++) {
    const actual = actualNeighbors
      .slice(actualOffsets[vertex], actualOffsets[vertex + 1])
      .sort((left, right) => left - right);
    const expected = expectedValues
      .slice(expectedOffsets[vertex], expectedOffsets[vertex + 1])
      .sort((left, right) => left - right);
    maximumError = Math.max(maximumError, getMaximumAbsoluteError(actual, expected));
  }
  return maximumError;
}

/** Rejects missing, extra, non-finite, or numerically divergent observable output rows. */
function getMaximumAbsoluteError(actual: ArrayLike<number>, expected: ArrayLike<number>): number {
  if (actual.length !== expected.length) return Number.POSITIVE_INFINITY;
  let maximumError = 0;
  for (let index = 0; index < actual.length; index++) {
    const difference = Math.abs(actual[index] - expected[index]);
    if (!Number.isFinite(difference)) return Number.POSITIVE_INFINITY;
    maximumError = Math.max(maximumError, difference);
  }
  return maximumError;
}

function getVectorBuffer(vector: GPUVector): Buffer {
  return vector.data[0].buffer as Buffer;
}
