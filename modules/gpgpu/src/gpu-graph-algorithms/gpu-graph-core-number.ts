// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import type {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import type {GPUCommandGraph} from '../gpu-core/gpu-command-graph';
import {addGPUGraphCoreNumberToGraphWithDispatchLimit} from './gpu-graph-core-number-internals';
import type {GPUGraphAdjacency, GPUGraphTopology} from './gpu-graph-topology';

const DEFAULT_CORE_NUMBER_ITERATIONS = 32;
const MAXIMUM_CORE_NUMBER_ITERATIONS = 1024;
const SCALAR_BYTE_LENGTH = 4;

/** Existing graph topology and caller-owned k-core decomposition destinations. */
export type GPUGraphCoreNumberProps = {
  /** Prefix for generated command-graph nodes and imported-resource identifiers. */
  id?: string;
  /** Existing compressed adjacency; directed weak neighborhoods require reverse CSR. */
  topology: GPUGraphTopology;
  /** One caller-owned unsigned core-number row per graph vertex. */
  output: GPUVector<'uint32'>;
  /** Maximum synchronized core-refinement rounds; defaults to 32 and is bounded by 1,024. */
  iterations?: number;
  /** Optional caller-owned scalar reporting whether the core numbers reached a fixed point. */
  converged?: GPUVector<'uint32'>;
  /** Optional caller-owned scalar receiving the maximum currently published core number. */
  degeneracy?: GPUVector<'uint32'>;
};

/**
 * Computes the standard simple, undirected k-core numbers of GPU-resident weak neighborhoods.
 *
 * Directed graphs require reverse adjacency and are interpreted as undirected. Reciprocal and
 * duplicate edges are deduplicated, self-loops are ignored, and edge weights have no effect.
 * Synchronous H-index refinements monotonically lower distinct-degree upper bounds until the
 * exact core numbers are reached. If the bounded rounds stop first, outputs are valid upper
 * bounds and the optional convergence scalar remains zero.
 *
 * An isolated vertex has core number zero. Overflow in either required adjacency publishes
 * `0xffffffff` output and optional degeneracy sentinels and leaves convergence at zero.
 */
export class GPUGraphCoreNumber {
  /** Prefix for generated command-graph nodes and imported resources. */
  readonly id: string;
  /** Existing caller-owned GPU graph topology. */
  readonly topology: GPUGraphTopology;
  /** Caller-owned, vertex-aligned unsigned core numbers. */
  readonly output: GPUVector<'uint32'>;
  /** Maximum number of compiled, globally synchronized refinement rounds. */
  readonly iterations: number;
  /** Optional caller-owned fixed-point convergence status. */
  readonly converged?: GPUVector<'uint32'>;
  /** Optional caller-owned maximum currently published core number. */
  readonly degeneracy?: GPUVector<'uint32'>;

  /** Validates caller-owned metadata without allocating, submitting, or reading GPU work. */
  constructor(props: GPUGraphCoreNumberProps) {
    this.id = props.id ?? 'gpu-graph-core-number';
    this.topology = props.topology;
    this.output = props.output;
    this.iterations = props.iterations ?? DEFAULT_CORE_NUMBER_ITERATIONS;
    this.converged = props.converged;
    this.degeneracy = props.degeneracy;

    if (this.topology.graph.directed && !this.topology.reverse) {
      throw new Error(`${this.id} directed weak-neighbor core numbers require reverse adjacency`);
    }
    if (
      !Number.isSafeInteger(this.iterations) ||
      this.iterations < 0 ||
      this.iterations > MAXIMUM_CORE_NUMBER_ITERATIONS
    ) {
      throw new Error(`${this.id} iterations must be a safe integer between zero and 1024`);
    }

    validateCoreNumberVector(this.output, this.topology.graph.vertexCount, `${this.id} output`);
    if (this.converged) {
      validateCoreNumberVector(this.converged, 1, `${this.id} converged`);
    }
    if (this.degeneracy) {
      validateCoreNumberVector(this.degeneracy, 1, `${this.id} degeneracy`);
    }
    validateDistinctCoreNumberOutputs(this);
  }

  /** Declares bounded GPU core refinement without queue submission or CPU synchronization. */
  addToGraph<Parameters>(commandGraph: GPUCommandGraph<Parameters>): void {
    addGPUGraphCoreNumberToGraphWithDispatchLimit(
      this,
      commandGraph,
      commandGraph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Requires exactly one packed, uint32-aligned caller-owned scalar output chunk. */
function validateCoreNumberVector(vector: GPUVector<'uint32'>, length: number, name: string): void {
  if (
    vector.format !== 'uint32' ||
    vector.data.length !== 1 ||
    vector.length !== length ||
    vector.stride !== 1 ||
    vector.byteStride !== SCALAR_BYTE_LENGTH ||
    vector.rowByteLength !== SCALAR_BYTE_LENGTH ||
    vector.valueLength !== vector.length ||
    vector.bufferLayout
  ) {
    throw new Error(`${name} must contain exactly ${length} packed uint32 rows in one chunk`);
  }

  const chunk = vector.data[0];
  if (
    chunk.format !== 'uint32' ||
    chunk.length !== length ||
    chunk.stride !== 1 ||
    chunk.byteStride !== SCALAR_BYTE_LENGTH ||
    chunk.rowByteLength !== SCALAR_BYTE_LENGTH ||
    chunk.valueLength !== chunk.length ||
    !Number.isSafeInteger(chunk.byteOffset) ||
    chunk.byteOffset < 0 ||
    chunk.byteOffset % SCALAR_BYTE_LENGTH !== 0
  ) {
    throw new Error(`${name} must contain one packed, uint32-aligned chunk`);
  }
}

/** Keeps caller-visible core outputs disjoint from graph sources, CSR, status, and peers. */
function validateDistinctCoreNumberOutputs(coreNumber: GPUGraphCoreNumber): void {
  const {topology} = coreNumber;
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
    {name: 'output', vector: coreNumber.output},
    ...(coreNumber.converged ? [{name: 'converged', vector: coreNumber.converged}] : []),
    ...(coreNumber.degeneracy ? [{name: 'degeneracy', vector: coreNumber.degeneracy}] : [])
  ];
  for (const {name, vector} of outputs) {
    const physicalBuffer = getPhysicalBuffer(vector.data[0]);
    if (physicalAllocations.has(physicalBuffer)) {
      throw new Error(`${coreNumber.id} ${name} must use a distinct physical buffer allocation`);
    }
    physicalAllocations.add(physicalBuffer);
  }
}

/** Enumerates caller-owned adjacency payloads and statuses without changing source identity. */
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

/** Resolves borrowed engine wrappers to the actual physical allocation. */
function getPhysicalBuffer(chunk: GPUData<'uint32'> | GPUData<'float32'>): Buffer {
  return chunk.buffer instanceof DynamicBuffer ? chunk.buffer.buffer : chunk.buffer;
}
