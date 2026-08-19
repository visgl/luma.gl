// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import type {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData, GPUVector} from '@luma.gl/tables';
import type {GPUCommandGraph} from '../gpu-core/gpu-command-graph';
import {addGPUGraphPageRankToGraphWithDispatchLimit} from './gpu-graph-page-rank-internals';
import type {GPUGraphAdjacency, GPUGraphTopology} from './gpu-graph-topology';

const DEFAULT_PAGE_RANK_DAMPING = 0.85;
const DEFAULT_PAGE_RANK_ITERATIONS = 40;
const MAXIMUM_PAGE_RANK_ITERATIONS = 1024;
const SCALAR_BYTE_LENGTH = 4;

/** Existing graph topology, caller-owned PageRank scores, and optional residual. */
export type GPUGraphPageRankProps = {
  /** Prefix for generated command-graph nodes and imported resources. */
  id?: string;
  /** Existing GPU-resident graph topology; directed graphs require reverse adjacency. */
  topology: GPUGraphTopology;
  /** One caller-owned, packed floating-point PageRank score for each graph vertex. */
  output: GPUVector<'float32'>;
  /** Probability of following an outgoing edge rather than teleporting. Defaults to 0.85. */
  damping?: number;
  /** Bounded number of compiled, normalized PageRank iterations. Defaults to 40. */
  iterations?: number;
  /** Optional caller-owned scalar receiving the final iteration's absolute rank change. */
  residual?: GPUVector<'float32'>;
};

/**
 * Publishes normalized, unweighted PageRank scores entirely from existing GPU graph topology.
 *
 * Directed graphs require reverse adjacency for incoming-edge gathers; undirected graphs reuse
 * their symmetric forward adjacency. Each iteration redistributes dangling-vertex mass before
 * normalizing the published scores. Existing edge weights do not affect this unweighted metric.
 * Overflow in either required adjacency instead publishes zero scores and a zero residual.
 */
export class GPUGraphPageRank {
  /** Prefix for generated command-graph nodes and imported resources. */
  readonly id: string;
  /** Existing caller-owned GPU graph topology. */
  readonly topology: GPUGraphTopology;
  /** Caller-owned, vertex-aligned floating-point PageRank scores. */
  readonly output: GPUVector<'float32'>;
  /** Probability of following an outgoing edge rather than teleporting. */
  readonly damping: number;
  /** Number of compiled, synchronized PageRank iterations. */
  readonly iterations: number;
  /** Optional caller-owned GPU-resident final absolute rank-change scalar. */
  readonly residual?: GPUVector<'float32'>;

  /** Validates existing caller-owned metadata without allocating, submitting, or reading work. */
  constructor(props: GPUGraphPageRankProps) {
    this.id = props.id ?? 'gpu-graph-page-rank';
    this.topology = props.topology;
    this.output = props.output;
    this.damping = props.damping ?? DEFAULT_PAGE_RANK_DAMPING;
    this.iterations = props.iterations ?? DEFAULT_PAGE_RANK_ITERATIONS;
    this.residual = props.residual;

    if (this.topology.graph.directed && !this.topology.reverse) {
      throw new Error(`${this.id} directed PageRank requires reverse adjacency`);
    }
    if (!Number.isFinite(this.damping) || this.damping < 0 || this.damping > 1) {
      throw new Error(`${this.id} damping must be a finite number between zero and one`);
    }
    if (
      !Number.isSafeInteger(this.iterations) ||
      this.iterations < 1 ||
      this.iterations > MAXIMUM_PAGE_RANK_ITERATIONS
    ) {
      throw new Error(`${this.id} iterations must be a safe integer between one and 1024`);
    }

    validatePageRankVector(this.output, this.topology.graph.vertexCount, `${this.id} output`);
    if (this.residual) {
      validatePageRankVector(this.residual, 1, `${this.id} residual`);
    }
    validateDistinctPageRankOutputs(this);
  }

  /** Declares bounded graph ranking work without submitting commands or reading results. */
  addToGraph<Parameters>(commandGraph: GPUCommandGraph<Parameters>): void {
    addGPUGraphPageRankToGraphWithDispatchLimit(
      this,
      commandGraph,
      commandGraph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Requires one packed, aligned floating-point output chunk with its exact logical row count. */
function validatePageRankVector(vector: GPUVector<'float32'>, length: number, name: string): void {
  if (
    vector.data.length !== 1 ||
    vector.format !== 'float32' ||
    vector.stride !== 1 ||
    vector.byteStride !== SCALAR_BYTE_LENGTH ||
    vector.rowByteLength !== SCALAR_BYTE_LENGTH ||
    vector.valueLength !== vector.length ||
    vector.bufferLayout
  ) {
    throw new Error(`${name} must contain exactly one packed float32 chunk`);
  }
  if (vector.length !== length) {
    throw new Error(`${name} must contain exactly ${length} float32 rows`);
  }

  const chunk = vector.data[0];
  if (
    chunk.format !== 'float32' ||
    chunk.length !== length ||
    chunk.stride !== 1 ||
    chunk.byteStride !== SCALAR_BYTE_LENGTH ||
    chunk.rowByteLength !== SCALAR_BYTE_LENGTH ||
    chunk.valueLength !== chunk.length ||
    !Number.isSafeInteger(chunk.byteOffset) ||
    chunk.byteOffset < 0 ||
    chunk.byteOffset % SCALAR_BYTE_LENGTH !== 0
  ) {
    throw new Error(`${name} must contain one packed, float32-aligned chunk`);
  }
}

/** Keeps ranking scores and optional residual disjoint from every existing graph allocation. */
function validateDistinctPageRankOutputs(pageRank: GPUGraphPageRank): void {
  const topology = pageRank.topology;
  const inputVectors = [
    topology.graph.sourceVertices,
    topology.graph.targetVertices,
    ...(topology.graph.edgeWeights ? [topology.graph.edgeWeights] : []),
    ...(topology.graph.edgeIds ? [topology.graph.edgeIds] : []),
    ...getAdjacencyVectors(topology.forward),
    ...(topology.reverse ? getAdjacencyVectors(topology.reverse) : []),
    topology.invalidEdgeCount
  ];
  const allocations = new Set<Buffer>();
  for (const vector of inputVectors) {
    for (const chunk of vector.data) {
      allocations.add(getPhysicalBuffer(chunk));
    }
  }

  const outputs = [
    {name: 'output', vector: pageRank.output},
    ...(pageRank.residual ? [{name: 'residual', vector: pageRank.residual}] : [])
  ];
  for (const {name, vector} of outputs) {
    const buffer = getPhysicalBuffer(vector.data[0]);
    if (allocations.has(buffer)) {
      throw new Error(`${pageRank.id} ${name} must use a distinct physical buffer allocation`);
    }
    allocations.add(buffer);
  }
}

/** Enumerates existing adjacency and status columns without changing any chunk identities. */
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

/** Resolves an engine wrapper to its current underlying physical GPU allocation. */
function getPhysicalBuffer(chunk: GPUData<'uint32'> | GPUData<'float32'>): Buffer {
  return chunk.buffer instanceof DynamicBuffer ? chunk.buffer.buffer : chunk.buffer;
}
