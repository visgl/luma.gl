// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import type {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData, GPUVector} from '@luma.gl/tables';
import type {GPUCommandGraph} from '../gpu-primitives/gpu-command-graph';
import {addLuGraphModularityOptimizationToGraphWithDispatchLimit} from './lu-graph-modularity-optimization-internals';
import type {LuGraphAdjacency, LuGraphTopology} from './lu-graph-topology';

const DEFAULT_OPTIMIZATION_ITERATIONS = 32;
const MAXIMUM_OPTIMIZATION_ITERATIONS = 1024;
const SCALAR_BYTE_LENGTH = 4;

/** Existing topology, optional community assignments, and caller-owned optimization results. */
export type LuGraphModularityOptimizationProps = {
  /** Prefix for generated command-graph nodes and imported-resource identifiers. */
  id?: string;
  /** Existing compressed graph adjacency; directed optimization requires reverse adjacency. */
  topology: LuGraphTopology;
  /** One caller-owned unsigned community identifier for each graph vertex. */
  output: GPUVector<'uint32'>;
  /** One caller-owned floating-point Newman modularity score for the final assignments. */
  modularity: GPUVector<'float32'>;
  /** Optional caller-owned initial community identifier for each graph vertex. */
  initialCommunities?: GPUVector<'uint32'>;
  /** Non-negative modularity resolution parameter; defaults to one. */
  resolution?: number;
  /** Maximum individually accepted local moves; defaults to 32 and cannot exceed 1,024. */
  iterations?: number;
  /** Strictly exceeded improvement required to accept a move; defaults to zero. */
  minimumGain?: number;
  /** Optional scalar reporting whether the final round found no admissible improving move. */
  converged?: GPUVector<'uint32'>;
  /** Optional scalar reporting whether the topology, partition, and modularity are valid. */
  valid?: GPUVector<'uint32'>;
};

/**
 * Improves a GPU-resident graph partition through single-level Newman modularity local moves.
 *
 * Every synchronized round scores weak-neighbor and unused singleton community candidates
 * against an immutable partition and accepts only its single best strictly improving move.
 * Equal computed gains choose the lowest vertex identifier and then the lowest candidate
 * community. Original source-edge weights, multiplicity, direction, self-loops, and resolution
 * follow {@link LuGraphModularity} exactly.
 *
 * Weighted float32 accumulation uses unordered atomic additions, so low-order rounding,
 * computed gains, threshold decisions, and selected partitions can vary across GPU execution
 * orders or adapters. Stable tie-breaking applies to the computed gains within each round.
 *
 * The final partition and its exact GPU-computed modularity remain caller-owned. This operation
 * performs neither graph coarsening nor multilevel Louvain or Leiden optimization. Overflow,
 * invalid initial labels, negative or nonfinite accepted-edge weights, and zero total accepted
 * weight fail closed: community rows receive `0xffffffff`, modularity is zero, and validity and
 * nonempty-graph convergence are zero.
 */
export class LuGraphModularityOptimization {
  /** Prefix for generated command-graph nodes and imported-resource identifiers. */
  readonly id: string;
  /** Existing caller-owned GPU graph topology. */
  readonly topology: LuGraphTopology;
  /** Caller-owned, vertex-aligned optimized community identifiers. */
  readonly output: GPUVector<'uint32'>;
  /** Caller-owned scalar receiving exact modularity for the final partition. */
  readonly modularity: GPUVector<'float32'>;
  /** Optional existing caller-owned partition used instead of stable vertex identifiers. */
  readonly initialCommunities?: GPUVector<'uint32'>;
  /** Non-negative Newman modularity resolution. */
  readonly resolution: number;
  /** Maximum number of globally synchronized, individually accepted local moves. */
  readonly iterations: number;
  /** Strictly exceeded finite non-negative local-move gain threshold. */
  readonly minimumGain: number;
  /** Optional caller-owned local-optimum convergence scalar. */
  readonly converged?: GPUVector<'uint32'>;
  /** Optional caller-owned graph, partition, and quality-validity scalar. */
  readonly valid?: GPUVector<'uint32'>;

  /** Validates metadata without allocating, destroying, submitting, or reading GPU resources. */
  constructor(props: LuGraphModularityOptimizationProps) {
    this.id = props.id ?? 'lu-graph-modularity-optimization';
    this.topology = props.topology;
    this.output = props.output;
    this.modularity = props.modularity;
    this.initialCommunities = props.initialCommunities;
    this.resolution = props.resolution ?? 1;
    this.iterations = props.iterations ?? DEFAULT_OPTIMIZATION_ITERATIONS;
    this.minimumGain = props.minimumGain ?? 0;
    this.converged = props.converged;
    this.valid = props.valid;

    if (this.topology.graph.directed && !this.topology.reverse) {
      throw new Error(`${this.id} directed modularity optimization requires reverse adjacency`);
    }
    if (
      !Number.isFinite(this.resolution) ||
      this.resolution < 0 ||
      !Number.isFinite(Math.fround(this.resolution))
    ) {
      throw new Error(`${this.id} resolution must be a non-negative finite float32`);
    }
    if (
      !Number.isFinite(this.minimumGain) ||
      this.minimumGain < 0 ||
      !Number.isFinite(Math.fround(this.minimumGain))
    ) {
      throw new Error(`${this.id} minimumGain must be a non-negative finite float32`);
    }
    if (
      !Number.isSafeInteger(this.iterations) ||
      this.iterations < 0 ||
      this.iterations > MAXIMUM_OPTIMIZATION_ITERATIONS
    ) {
      throw new Error(`${this.id} iterations must be a safe integer between zero and 1024`);
    }

    const vertexCount = this.topology.graph.vertexCount;
    validateOptimizationVector(this.output, 'uint32', vertexCount, `${this.id} output`);
    validateOptimizationVector(this.modularity, 'float32', 1, `${this.id} modularity`);
    if (this.initialCommunities) {
      validateOptimizationVector(
        this.initialCommunities,
        'uint32',
        vertexCount,
        `${this.id} initialCommunities`
      );
    }
    if (this.converged) {
      validateOptimizationVector(this.converged, 'uint32', 1, `${this.id} converged`);
    }
    if (this.valid) {
      validateOptimizationVector(this.valid, 'uint32', 1, `${this.id} valid`);
    }
    validateDistinctOptimizationOutputs(this);
  }

  /** Declares bounded GPU local-moving and exact scoring without submission or readback. */
  addToGraph<Parameters>(commandGraph: GPUCommandGraph<Parameters>): void {
    addLuGraphModularityOptimizationToGraphWithDispatchLimit(
      this,
      commandGraph,
      commandGraph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Requires one contiguous, scalar-packed, uint32-aligned caller-owned vector chunk. */
function validateOptimizationVector<Format extends 'uint32' | 'float32'>(
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

/** Keeps every caller-owned result physically separate from inputs, CSR, and peer results. */
function validateDistinctOptimizationOutputs(optimization: LuGraphModularityOptimization): void {
  const {topology} = optimization;
  const inputs = [
    topology.graph.sourceVertices,
    topology.graph.targetVertices,
    ...(topology.graph.edgeWeights ? [topology.graph.edgeWeights] : []),
    ...(topology.graph.edgeIds ? [topology.graph.edgeIds] : []),
    ...getAdjacencyVectors(topology.forward),
    ...(topology.reverse ? getAdjacencyVectors(topology.reverse) : []),
    topology.invalidEdgeCount,
    ...(optimization.initialCommunities ? [optimization.initialCommunities] : [])
  ];
  const allocations = new Set<Buffer>();
  for (const vector of inputs) {
    for (const chunk of vector.data) allocations.add(getPhysicalBuffer(chunk));
  }

  const outputs = [
    {name: 'output', vector: optimization.output},
    {name: 'modularity', vector: optimization.modularity},
    ...(optimization.converged ? [{name: 'converged', vector: optimization.converged}] : []),
    ...(optimization.valid ? [{name: 'valid', vector: optimization.valid}] : [])
  ];
  for (const {name, vector} of outputs) {
    const buffer = getPhysicalBuffer(vector.data[0]);
    if (allocations.has(buffer)) {
      throw new Error(`${optimization.id} ${name} must use a distinct physical buffer allocation`);
    }
    allocations.add(buffer);
  }
}

/** Enumerates existing adjacency payload and status vectors without replacing allocations. */
function getAdjacencyVectors(
  adjacency: LuGraphAdjacency
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

/** Resolves borrowed engine wrappers before checking physical writable-buffer aliases. */
function getPhysicalBuffer(chunk: GPUData<'uint32'> | GPUData<'float32'>): Buffer {
  return chunk.buffer instanceof DynamicBuffer ? chunk.buffer.buffer : chunk.buffer;
}
