// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import {Buffer, type Device} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/core/dynamic';
import type {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUCommandGraph, type CompiledGPUCommandGraph} from '../gpu-core/gpu-command-graph';
import {
  type GPUGraphAlgorithmsShortestPathPersistentState,
  SHORTEST_PATH_CONTROL_BYTE_LENGTH,
  SHORTEST_PATH_CONTROL_CONVERGED,
  SHORTEST_PATH_CONTROL_DISPATCH_X,
  SHORTEST_PATH_CONTROL_ITERATIONS,
  addGPUGraphAlgorithmsShortestPathInitializationToGraph,
  addGPUGraphAlgorithmsShortestPathRoundsToGraph,
  addGPUGraphAlgorithmsSingleSourceShortestPathToGraphWithDispatchLimit
} from './gpu-graph-single-source-shortest-path-internals';
import type {GPUGraphAlgorithmsAdjacency, GPUGraphAlgorithmsTopology} from './gpu-graph-topology';

/** Most relaxation rounds that one command graph encodes. */
const MAXIMUM_ENCODED_ITERATIONS = 1024;
const MAXIMUM_UINT32 = 0xffffffff;
const DEFAULT_ITERATIONS_PER_SUBMIT = 128;
const SCALAR_BYTE_LENGTH = 4;

/** Forward, reverse, or combined orientation for weighted shortest-path exploration. */
export type GPUGraphAlgorithmsSingleSourceShortestPathDirection = 'outgoing' | 'incoming' | 'both';

/** Existing topology, one source, and caller-owned weighted shortest-path destinations. */
export type GPUGraphAlgorithmsSingleSourceShortestPathProps = {
  /** Prefix for generated command-graph nodes and imported-resource identifiers. */
  id?: string;
  /** Existing GPU-resident compressed adjacency and its explicit overflow status. */
  topology: GPUGraphAlgorithmsTopology;
  /** One caller-owned floating-point distance for every graph vertex. */
  distances: GPUVector<'float32'>;
  /** One caller-owned unsigned predecessor identifier for every graph vertex. */
  predecessors: GPUVector<'uint32'>;
  /**
   * Maximum relaxation rounds, a uint32. Defaults to `vertexCount - 1`, which is enough for every
   * simple path. `addToGraph()` encodes at most 1,024 of them; `run()` continues to this budget.
   */
  maxIterations?: number;
  /** Forward, reverse, or combined edge orientation. Defaults to outgoing. */
  direction?: GPUGraphAlgorithmsSingleSourceShortestPathDirection;
  /** Optional caller-owned scalar reporting whether all shortest distances are final. */
  converged?: GPUVector<'uint32'>;
  /** Optional caller-owned scalar receiving invalid, valid-endpoint source-edge weights. */
  invalidWeightCount?: GPUVector<'uint32'>;
  /**
   * Stable source vertex identifier; zero is also accepted for an empty graph. Give exactly one
   * of `sourceVertex` and `seeds`.
   */
  sourceVertex?: number;
  /**
   * Caller-owned source vertex identifiers in one packed chunk, read when the GPU work runs.
   * Await {@link GPUGraphAlgorithmsSingleSourceShortestPath.run} before writing new identifiers.
   * Every seed starts at distance zero. Identifiers outside the graph are ignored.
   */
  seeds?: GPUVector<'uint32'>;
};

/** Options for {@link GPUGraphAlgorithmsSingleSourceShortestPath.run}. */
export type GPUGraphAlgorithmsSingleSourceShortestPathRunOptions = {
  /** Relaxation rounds encoded per submission, between 1 and 1,024. Default 128. */
  iterationsPerSubmit?: number;
};

/** Status of one {@link GPUGraphAlgorithmsSingleSourceShortestPath.run}. */
export type GPUGraphAlgorithmsSingleSourceShortestPathRunResult = {
  /** Whether every distance is final. */
  converged: boolean;
  /** Relaxation rounds that ran, including the last round, which found no shorter distance. */
  iterations: number;
  /** Command buffers submitted, each followed by one status readback. */
  submissions: number;
};

/**
 * Computes bounded, non-negative weighted shortest paths without reading GPU graph data.
 *
 * Missing graph weights are treated as one. Negative, infinite, and NaN weights fail closed;
 * invalid source endpoints are ignored. Unreachable vertices receive positive infinity, and
 * unreachable vertices and the source receive the `0xffffffff` predecessor sentinel. Among
 * equally short routes first discovered in the same relaxation round, the lowest parent wins.
 */
export class GPUGraphAlgorithmsSingleSourceShortestPath {
  /** Prefix for generated command-graph nodes and imported resources. */
  readonly id: string;
  /** Existing caller-owned graph topology. */
  readonly topology: GPUGraphAlgorithmsTopology;
  /** Stable source vertex identifier, when the source is not read from `seeds`. */
  readonly sourceVertex?: number;
  /** Caller-owned source vertex identifiers. Await {@link run} before writing to the buffer. */
  readonly seeds?: GPUVector<'uint32'>;
  /** Caller-owned, vertex-aligned weighted distance column. */
  readonly distances: GPUVector<'float32'>;
  /** Caller-owned, vertex-aligned deterministic predecessor column. */
  readonly predecessors: GPUVector<'uint32'>;
  /** Maximum Bellman-Ford relaxation rounds. */
  readonly maxIterations: number;
  /** Selected graph edge orientation. */
  readonly direction: GPUGraphAlgorithmsSingleSourceShortestPathDirection;
  /** Optional caller-owned convergence status scalar. */
  readonly converged?: GPUVector<'uint32'>;
  /** Optional caller-owned invalid-source-edge-weight count scalar. */
  readonly invalidWeightCount?: GPUVector<'uint32'>;

  private _runner?: ShortestPathRunner;
  /** Whether a run owns the runner and its outputs. */
  private _running = false;

  /** Validates caller-owned metadata without allocating, submitting, or reading GPU work. */
  constructor(props: GPUGraphAlgorithmsSingleSourceShortestPathProps) {
    this.id = props.id ?? 'gpu-graph-single-source-shortest-path';
    this.topology = props.topology;
    this.sourceVertex = props.sourceVertex;
    this.seeds = props.seeds;
    this.distances = props.distances;
    this.predecessors = props.predecessors;
    this.maxIterations = props.maxIterations ?? Math.max(this.topology.graph.vertexCount - 1, 0);
    this.direction = props.direction ?? 'outgoing';
    this.converged = props.converged;
    this.invalidWeightCount = props.invalidWeightCount;

    if ((this.sourceVertex === undefined) === (this.seeds === undefined)) {
      throw new Error(`${this.id} requires exactly one of sourceVertex and seeds`);
    }
    const maximumSourceVertex = Math.max(this.topology.graph.vertexCount - 1, 0);
    if (
      this.sourceVertex !== undefined &&
      (!Number.isSafeInteger(this.sourceVertex) ||
        this.sourceVertex < 0 ||
        this.sourceVertex > maximumSourceVertex)
    ) {
      throw new Error(`${this.id} sourceVertex must identify an existing graph vertex`);
    }
    if (this.seeds) {
      validateSeedVector(this.seeds, `${this.id} seeds`);
    }
    if (!['outgoing', 'incoming', 'both'].includes(this.direction)) {
      throw new Error(`${this.id} direction must be outgoing, incoming, or both`);
    }
    if (this.direction !== 'outgoing' && this.topology.graph.directed && !this.topology.reverse) {
      throw new Error(
        `${this.id} incoming or bidirectional directed paths require reverse adjacency`
      );
    }
    if (
      !Number.isSafeInteger(this.maxIterations) ||
      this.maxIterations < 0 ||
      this.maxIterations > MAXIMUM_UINT32
    ) {
      throw new Error(`${this.id} maxIterations must be an integer between zero and 2^32 - 1`);
    }

    validateShortestPathVector(
      this.distances,
      'float32',
      this.topology.graph.vertexCount,
      `${this.id} distances`
    );
    validateShortestPathVector(
      this.predecessors,
      'uint32',
      this.topology.graph.vertexCount,
      `${this.id} predecessors`
    );
    if (this.converged) {
      validateShortestPathVector(this.converged, 'uint32', 1, `${this.id} converged`);
    }
    if (this.invalidWeightCount) {
      validateShortestPathVector(
        this.invalidWeightCount,
        'uint32',
        1,
        `${this.id} invalidWeightCount`
      );
    }
    validateDistinctShortestPathOutputs(this);
  }

  /**
   * Adds initialization and up to 1,024 relaxation rounds without submitting or reading back.
   *
   * Every round is GPU-gated: once the search converges or exhausts `maxIterations`, later rounds
   * dispatch zero workgroups. Use {@link run} when the search can need more than 1,024 rounds.
   */
  addToGraph<Parameters>(commandGraph: GPUCommandGraph<Parameters>): void {
    addGPUGraphAlgorithmsSingleSourceShortestPathToGraphWithDispatchLimit(
      this,
      commandGraph,
      commandGraph.device.limits.maxComputeWorkgroupsPerDimension,
      Math.min(this.maxIterations, MAXIMUM_ENCODED_ITERATIONS)
    );
  }

  /**
   * Runs the search to convergence or to `maxIterations`, in batches of GPU-gated rounds.
   *
   * Each submission encodes `iterationsPerSubmit` rounds and reads back one 32-byte status.
   * Runs with the same batch size reuse the compiled command graphs. Build the topology first.
   * An overlapping call rejects. Await the current run before writing to {@link seeds} or calling
   * {@link destroy}.
   */
  async run(
    options: GPUGraphAlgorithmsSingleSourceShortestPathRunOptions = {}
  ): Promise<GPUGraphAlgorithmsSingleSourceShortestPathRunResult> {
    if (this._running) {
      throw new Error(`${this.id} is already running. Await run() before starting another run.`);
    }
    const iterationsPerSubmit = options.iterationsPerSubmit ?? DEFAULT_ITERATIONS_PER_SUBMIT;
    if (
      !Number.isSafeInteger(iterationsPerSubmit) ||
      iterationsPerSubmit < 1 ||
      iterationsPerSubmit > MAXIMUM_ENCODED_ITERATIONS
    ) {
      throw new Error(`${this.id} iterationsPerSubmit must be an integer between 1 and 1024`);
    }
    this._running = true;
    try {
      if (this._runner?.iterationsPerSubmit !== iterationsPerSubmit) {
        this._runner?.destroy();
        this._runner = undefined;
        this._runner = createShortestPathRunner(this, iterationsPerSubmit);
      }
      const runner = this._runner;
      const {device} = runner;

      let submissions = 0;
      let status: Uint32Array;
      let encoder = device.createCommandEncoder({id: `${this.id}-run`});
      runner.initialization.encode(encoder, {parameters: undefined});
      for (;;) {
        runner.rounds.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        submissions++;
        status = await readControl(runner.control);
        if (status[SHORTEST_PATH_CONTROL_DISPATCH_X] === 0) {
          break;
        }
        encoder = device.createCommandEncoder({id: `${this.id}-run`});
      }
      return {
        converged: status[SHORTEST_PATH_CONTROL_CONVERGED] === 1,
        iterations: status[SHORTEST_PATH_CONTROL_ITERATIONS],
        submissions
      };
    } finally {
      this._running = false;
    }
  }

  /** Releases the command graphs and status buffers. Await {@link run} before calling this method. */
  destroy(): void {
    this._runner?.destroy();
    this._runner = undefined;
  }
}

type ShortestPathRunner = {
  device: Device;
  iterationsPerSubmit: number;
  control: Buffer;
  initialization: CompiledGPUCommandGraph;
  rounds: CompiledGPUCommandGraph;
  destroy: () => void;
};

/** Compiles the reusable initialization and round-batch command graphs for {@link run}. */
function createShortestPathRunner(
  search: GPUGraphAlgorithmsSingleSourceShortestPath,
  iterationsPerSubmit: number
): ShortestPathRunner {
  const device = getPhysicalBuffer(search.distances.data[0]).device;
  const maxComputeWorkgroupsPerDimension = device.limits.maxComputeWorkgroupsPerDimension;
  const control = device.createBuffer({
    id: `${search.id}-control`,
    byteLength: SHORTEST_PATH_CONTROL_BYTE_LENGTH,
    usage: Buffer.STORAGE | Buffer.INDIRECT | Buffer.COPY_SRC
  });
  const persistent: GPUGraphAlgorithmsShortestPathPersistentState = {control};
  const compiled: CompiledGPUCommandGraph[] = [];
  const destroy = () => {
    for (const graph of compiled) graph.destroy();
    control.destroy();
  };
  try {
    const initializationGraph = new GPUCommandGraph(device, {id: `${search.id}-initialization`});
    addGPUGraphAlgorithmsShortestPathInitializationToGraph(
      search,
      initializationGraph,
      maxComputeWorkgroupsPerDimension,
      persistent
    );
    const initialization = initializationGraph.compile();
    compiled.push(initialization);
    const roundsGraph = new GPUCommandGraph(device, {id: `${search.id}-rounds`});
    addGPUGraphAlgorithmsShortestPathRoundsToGraph(
      search,
      roundsGraph,
      maxComputeWorkgroupsPerDimension,
      iterationsPerSubmit,
      persistent
    );
    const rounds = roundsGraph.compile();
    compiled.push(rounds);
    return {
      device,
      iterationsPerSubmit,
      control,
      initialization,
      rounds,
      destroy
    };
  } catch (error) {
    destroy();
    throw error;
  }
}

/** Reads the dispatch command, round count, and convergence status in one transfer. */
async function readControl(control: Buffer): Promise<Uint32Array> {
  const bytes = await control.readAsync(0, SHORTEST_PATH_CONTROL_BYTE_LENGTH);
  return new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

/** Requires one packed uint32 chunk with at least one seed. */
function validateSeedVector(seeds: GPUVector<'uint32'>, name: string): void {
  if (seeds.length < 1 || seeds.length > MAXIMUM_UINT32) {
    throw new Error(`${name} must contain at least one uint32 vertex identifier`);
  }
  validateShortestPathVector(seeds, 'uint32', seeds.length, name);
}

/** Requires exactly one packed, properly aligned caller-owned scalar output chunk. */
function validateShortestPathVector<Format extends 'uint32' | 'float32'>(
  vector: GPUVector<Format>,
  format: Format,
  length: number,
  name: string
): void {
  if (
    vector.format !== format ||
    vector.data.length !== 1 ||
    vector.length !== length ||
    vector.stride !== 1 ||
    vector.byteStride !== SCALAR_BYTE_LENGTH ||
    vector.rowByteLength !== SCALAR_BYTE_LENGTH ||
    vector.valueLength !== vector.length ||
    vector.bufferLayout
  ) {
    throw new Error(`${name} must contain exactly ${length} packed ${format} rows in one chunk`);
  }

  const chunk = vector.data[0];
  if (
    chunk.format !== format ||
    chunk.length !== length ||
    chunk.stride !== 1 ||
    chunk.byteStride !== SCALAR_BYTE_LENGTH ||
    chunk.rowByteLength !== SCALAR_BYTE_LENGTH ||
    chunk.valueLength !== chunk.length ||
    !Number.isSafeInteger(chunk.byteOffset) ||
    chunk.byteOffset < 0 ||
    chunk.byteOffset % SCALAR_BYTE_LENGTH !== 0
  ) {
    throw new Error(`${name} must contain one packed, uint32-aligned ${format} chunk`);
  }
}

/** Keeps writable shortest-path results physically disjoint from every graph input and peer. */
function validateDistinctShortestPathOutputs(
  search: GPUGraphAlgorithmsSingleSourceShortestPath
): void {
  const topology = search.topology;
  const inputVectors = [
    topology.graph.sourceVertices,
    topology.graph.targetVertices,
    ...(topology.graph.edgeWeights ? [topology.graph.edgeWeights] : []),
    ...(topology.graph.edgeIds ? [topology.graph.edgeIds] : []),
    ...getAdjacencyVectors(topology.forward),
    ...(topology.reverse ? getAdjacencyVectors(topology.reverse) : []),
    topology.invalidEdgeCount
  ];
  const physicalAllocations = new Set<Buffer>();
  for (const vector of inputVectors) {
    for (const chunk of vector.data) {
      physicalAllocations.add(getPhysicalBuffer(chunk));
    }
  }

  if (search.seeds) {
    physicalAllocations.add(getPhysicalBuffer(search.seeds.data[0]));
  }
  const outputs = [
    {name: 'distances', vector: search.distances},
    {name: 'predecessors', vector: search.predecessors},
    ...(search.converged ? [{name: 'converged', vector: search.converged}] : []),
    ...(search.invalidWeightCount
      ? [{name: 'invalidWeightCount', vector: search.invalidWeightCount}]
      : [])
  ];
  for (const {name, vector} of outputs) {
    const physicalBuffer = getPhysicalBuffer(vector.data[0]);
    if (physicalAllocations.has(physicalBuffer)) {
      throw new Error(`${search.id} ${name} must use a distinct physical buffer allocation`);
    }
    physicalAllocations.add(physicalBuffer);
  }
}

/** Enumerates existing adjacency allocations without copying or changing source identity. */
function getAdjacencyVectors(
  adjacency: GPUGraphAlgorithmsAdjacency
): (GPUVector<'uint32'> | GPUVector<'float32'>)[] {
  return [
    adjacency.offsets,
    adjacency.neighbors,
    adjacency.edgeIds,
    ...(adjacency.edgeWeights ? [adjacency.edgeWeights] : []),
    adjacency.count,
    adjacency.overflow
  ];
}

/** Resolves an engine wrapper to its current physical GPU allocation. */
function getPhysicalBuffer(chunk: GPUData<'uint32'> | GPUData<'float32'>): Buffer {
  return chunk.buffer instanceof DynamicBuffer ? chunk.buffer.buffer : chunk.buffer;
}
