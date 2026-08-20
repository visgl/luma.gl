// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import type {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import type {GPUCommandGraph} from '../gpu-core/gpu-command-graph';
import {addGPUGraphSingleSourceShortestPathToGraphWithDispatchLimit} from './gpu-graph-single-source-shortest-path-internals';
import type {GPUGraphAdjacency, GPUGraphTopology} from './gpu-graph-topology';

const MAXIMUM_SHORTEST_PATH_ITERATIONS = 1024;
const SCALAR_BYTE_LENGTH = 4;

/** Forward, reverse, or combined orientation for weighted shortest-path exploration. */
export type GPUGraphSingleSourceShortestPathDirection = 'outgoing' | 'incoming' | 'both';

/** Existing topology, one source, and caller-owned weighted shortest-path destinations. */
export type GPUGraphSingleSourceShortestPathProps = {
  /** Prefix for generated command-graph nodes and imported-resource identifiers. */
  id?: string;
  /** Existing GPU-resident compressed adjacency and its explicit overflow status. */
  topology: GPUGraphTopology;
  /** Stable source vertex identifier; zero is also accepted for an empty graph. */
  sourceVertex: number;
  /** One caller-owned floating-point distance for every graph vertex. */
  distances: GPUVector<'float32'>;
  /** One caller-owned unsigned predecessor identifier for every graph vertex. */
  predecessors: GPUVector<'uint32'>;
  /** Maximum compiled relaxation rounds, between zero and 1,024 inclusive. */
  maxIterations?: number;
  /** Forward, reverse, or combined edge orientation. Defaults to outgoing. */
  direction?: GPUGraphSingleSourceShortestPathDirection;
  /** Optional caller-owned scalar reporting whether all shortest distances are final. */
  converged?: GPUVector<'uint32'>;
  /** Optional caller-owned scalar receiving invalid, valid-endpoint source-edge weights. */
  invalidWeightCount?: GPUVector<'uint32'>;
};

/**
 * Computes bounded, non-negative weighted shortest paths without reading GPU graph data.
 *
 * Missing graph weights are treated as one. Negative, infinite, and NaN weights fail closed;
 * invalid source endpoints are ignored. Unreachable vertices receive positive infinity, and
 * unreachable vertices and the source receive the `0xffffffff` predecessor sentinel. Among
 * equally short routes first discovered in the same relaxation round, the lowest parent wins.
 */
export class GPUGraphSingleSourceShortestPath {
  /** Prefix for generated command-graph nodes and imported resources. */
  readonly id: string;
  /** Existing caller-owned graph topology. */
  readonly topology: GPUGraphTopology;
  /** Stable source vertex identifier. */
  readonly sourceVertex: number;
  /** Caller-owned, vertex-aligned weighted distance column. */
  readonly distances: GPUVector<'float32'>;
  /** Caller-owned, vertex-aligned deterministic predecessor column. */
  readonly predecessors: GPUVector<'uint32'>;
  /** Maximum compiled Bellman-Ford relaxation rounds. */
  readonly maxIterations: number;
  /** Selected graph edge orientation. */
  readonly direction: GPUGraphSingleSourceShortestPathDirection;
  /** Optional caller-owned convergence status scalar. */
  readonly converged?: GPUVector<'uint32'>;
  /** Optional caller-owned invalid-source-edge-weight count scalar. */
  readonly invalidWeightCount?: GPUVector<'uint32'>;

  /** Validates caller-owned metadata without allocating, submitting, or reading GPU work. */
  constructor(props: GPUGraphSingleSourceShortestPathProps) {
    this.id = props.id ?? 'gpu-graph-single-source-shortest-path';
    this.topology = props.topology;
    this.sourceVertex = props.sourceVertex;
    this.distances = props.distances;
    this.predecessors = props.predecessors;
    this.maxIterations =
      props.maxIterations ??
      Math.min(Math.max(this.topology.graph.vertexCount - 1, 0), MAXIMUM_SHORTEST_PATH_ITERATIONS);
    this.direction = props.direction ?? 'outgoing';
    this.converged = props.converged;
    this.invalidWeightCount = props.invalidWeightCount;

    const maximumSourceVertex = Math.max(this.topology.graph.vertexCount - 1, 0);
    if (
      !Number.isSafeInteger(this.sourceVertex) ||
      this.sourceVertex < 0 ||
      this.sourceVertex > maximumSourceVertex
    ) {
      throw new Error(`${this.id} sourceVertex must identify an existing graph vertex`);
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
      this.maxIterations > MAXIMUM_SHORTEST_PATH_ITERATIONS
    ) {
      throw new Error(`${this.id} maxIterations must be a safe integer between zero and 1024`);
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

  /** Adds bounded weighted-path passes without submitting commands or reading GPU results. */
  addToGraph<Parameters>(commandGraph: GPUCommandGraph<Parameters>): void {
    addGPUGraphSingleSourceShortestPathToGraphWithDispatchLimit(
      this,
      commandGraph,
      commandGraph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
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
function validateDistinctShortestPathOutputs(search: GPUGraphSingleSourceShortestPath): void {
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
  adjacency: GPUGraphAdjacency
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
