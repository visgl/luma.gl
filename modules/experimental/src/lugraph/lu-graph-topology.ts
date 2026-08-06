// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData, GPUVector} from '@luma.gl/tables';
import type {GPUCommandGraph} from '../gpu-primitives/gpu-command-graph';
import type {LuGraph} from './lu-graph';
import {addLuGraphTopologyToGraphWithDispatchLimit} from './lu-graph-topology-internals';

const MAXIMUM_UINT32 = 0xffffffff;
const SCALAR_BYTE_LENGTH = 4;

/** Caller-owned packed output vectors for one compressed sparse adjacency direction. */
export type LuGraphAdjacency = {
  /** Exclusive offsets for every vertex, followed by the total accepted adjacency count. */
  offsets: GPUVector<'uint32'>;
  /** Capacity-bounded adjacent vertex identifiers in unspecified per-vertex order. */
  neighbors: GPUVector<'uint32'>;
  /** Stable source edge identifiers aligned with the published adjacent vertices. */
  edgeIds: GPUVector<'uint32'>;
  /** Source-aligned weights when the graph provides an edge-weight column. */
  edgeWeights?: GPUVector<'float32'>;
  /** One row receiving the accepted adjacency count before capacity truncation. */
  count: GPUVector<'uint32'>;
  /** One row receiving whether accepted adjacencies exceed the output capacity. */
  overflow: GPUVector<'uint32'>;
};

/** Source graph and caller-owned output allocations for a complete GPU topology rebuild. */
export type LuGraphTopologyProps = {
  /** Prefix for generated command-graph nodes and graph-owned transient resources. */
  id?: string;
  /** Existing graph columns, preserving all source chunk boundaries and metadata. */
  graph: LuGraph;
  /** Caller-owned forward adjacency and capacity status. */
  forward: LuGraphAdjacency;
  /** Optional caller-owned transposed adjacency for directed graphs. */
  reverse?: LuGraphAdjacency;
  /** One caller-owned row receiving the number of invalid source edge endpoints. */
  invalidEdgeCount: GPUVector<'uint32'>;
};

/**
 * GPU-resident compressed sparse adjacency rebuilt directly from existing graph source chunks.
 *
 * Every output requires its own physical buffer allocation, distinct from every source chunk and
 * other output. This conservative ownership contract avoids command-graph handle aliasing even
 * when callers provide non-overlapping slices of one physical allocation.
 */
export class LuGraphTopology {
  /** Prefix for generated command-graph nodes and graph-owned transient resources. */
  readonly id: string;
  /** Existing caller-owned graph sources. */
  readonly graph: LuGraph;
  /** Caller-owned compressed forward adjacency. */
  readonly forward: LuGraphAdjacency;
  /** Optional caller-owned compressed reverse adjacency. */
  readonly reverse?: LuGraphAdjacency;
  /** Caller-owned invalid source edge count. */
  readonly invalidEdgeCount: GPUVector<'uint32'>;

  /** Validates existing source and destination metadata without allocating or submitting work. */
  constructor(props: LuGraphTopologyProps) {
    this.id = props.id ?? 'lu-graph-topology';
    this.graph = props.graph;
    this.forward = props.forward;
    this.reverse = props.reverse;
    this.invalidEdgeCount = props.invalidEdgeCount;

    if (!Number.isSafeInteger(this.graph.edgeCount) || this.graph.edgeCount < 0) {
      throw new Error(`${this.id} source edge count must be a non-negative uint32`);
    }
    if (
      this.graph.edgeCount > MAXIMUM_UINT32 ||
      (!this.graph.directed && this.graph.edgeCount > Math.floor(MAXIMUM_UINT32 / 2))
    ) {
      throw new Error(`${this.id} directed or symmetrized adjacency counts must fit in uint32`);
    }
    if (this.reverse && !this.graph.directed) {
      throw new Error(`${this.id} reverse adjacency requires a directed graph`);
    }

    validateAdjacency(this.graph, this.forward, `${this.id} forward`);
    if (this.reverse) {
      validateAdjacency(this.graph, this.reverse, `${this.id} reverse`);
    }
    validateTopologyVector(this.invalidEdgeCount, 'uint32', `${this.id} invalidEdgeCount`);
    if (this.invalidEdgeCount.length !== 1) {
      throw new Error(`${this.id} invalidEdgeCount must contain exactly one uint32 row`);
    }
    validateDistinctAllocations(this);
  }

  /** Adds a complete topology rebuild without submitting commands or reading source data back. */
  addToGraph<Parameters>(commandGraph: GPUCommandGraph<Parameters>): void {
    addLuGraphTopologyToGraphWithDispatchLimit(
      this,
      commandGraph,
      commandGraph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Requires caller-owned contiguous packed destinations with matching status and capacities. */
function validateAdjacency(graph: LuGraph, adjacency: LuGraphAdjacency, name: string): void {
  validateTopologyVector(adjacency.offsets, 'uint32', `${name} offsets`);
  validateTopologyVector(adjacency.neighbors, 'uint32', `${name} neighbors`);
  validateTopologyVector(adjacency.edgeIds, 'uint32', `${name} edgeIds`);
  validateTopologyVector(adjacency.count, 'uint32', `${name} count`);
  validateTopologyVector(adjacency.overflow, 'uint32', `${name} overflow`);

  if (adjacency.offsets.length !== graph.vertexCount + 1) {
    throw new Error(`${name} offsets must contain vertexCount + 1 rows`);
  }
  if (adjacency.neighbors.length !== adjacency.edgeIds.length) {
    throw new Error(`${name} neighbors and edgeIds must have matching capacities`);
  }
  if (adjacency.count.length !== 1 || adjacency.overflow.length !== 1) {
    throw new Error(`${name} count and overflow must each contain exactly one uint32 row`);
  }
  if (Boolean(adjacency.edgeWeights) !== Boolean(graph.edgeWeights)) {
    throw new Error(`${name} edgeWeights must match the source graph edge weights`);
  }
  if (adjacency.edgeWeights) {
    validateTopologyVector(adjacency.edgeWeights, 'float32', `${name} edgeWeights`);
    if (adjacency.edgeWeights.length !== adjacency.neighbors.length) {
      throw new Error(`${name} edgeWeights and neighbors must have matching capacities`);
    }
  }
}

/** Requires one scalar-packed and uint32-aligned caller-owned physical output chunk. */
function validateTopologyVector<Format extends 'uint32' | 'float32'>(
  vector: GPUVector<Format>,
  format: Format,
  name: string
): void {
  if (
    vector.data.length !== 1 ||
    vector.format !== format ||
    vector.stride !== 1 ||
    vector.byteStride !== SCALAR_BYTE_LENGTH ||
    vector.rowByteLength !== SCALAR_BYTE_LENGTH ||
    vector.valueLength !== vector.length ||
    vector.bufferLayout ||
    !Number.isSafeInteger(vector.length) ||
    vector.length < 0 ||
    vector.length > MAXIMUM_UINT32
  ) {
    throw new Error(`${name} must contain one packed ${format} chunk with uint32 capacity`);
  }

  const chunk = vector.data[0];
  if (
    chunk.format !== format ||
    chunk.length !== vector.length ||
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

/** Rejects shared physical source/destination buffers, including distinct disjoint slices. */
function validateDistinctAllocations(topology: LuGraphTopology): void {
  const allocations = new Map<Buffer, string>();
  const sourceVectors = [
    topology.graph.sourceVertices,
    topology.graph.targetVertices,
    ...(topology.graph.edgeWeights ? [topology.graph.edgeWeights] : []),
    ...(topology.graph.edgeIds ? [topology.graph.edgeIds] : [])
  ];
  for (const vector of sourceVectors) {
    for (const chunk of vector.data) {
      const buffer = getPhysicalBuffer(chunk);
      if (!allocations.has(buffer)) {
        allocations.set(buffer, vector.name);
      }
    }
  }

  const outputs = [
    ...getAdjacencyOutputs(topology.forward, 'forward'),
    ...(topology.reverse ? getAdjacencyOutputs(topology.reverse, 'reverse') : []),
    {name: 'invalidEdgeCount', vector: topology.invalidEdgeCount}
  ];
  for (const {name, vector} of outputs) {
    const buffer = getPhysicalBuffer(vector.data[0]);
    const previousAllocation = allocations.get(buffer);
    if (previousAllocation !== undefined) {
      throw new Error(`${topology.id} ${name} must use a distinct physical buffer allocation`);
    }
    allocations.set(buffer, name);
  }
}

/** Enumerates caller-owned output vectors without changing vector or chunk identities. */
function getAdjacencyOutputs(
  adjacency: LuGraphAdjacency,
  direction: string
): {name: string; vector: GPUVector<'uint32'> | GPUVector<'float32'>}[] {
  return [
    {name: `${direction}.offsets`, vector: adjacency.offsets},
    {name: `${direction}.neighbors`, vector: adjacency.neighbors},
    {name: `${direction}.edgeIds`, vector: adjacency.edgeIds},
    ...(adjacency.edgeWeights
      ? [{name: `${direction}.edgeWeights`, vector: adjacency.edgeWeights}]
      : []),
    {name: `${direction}.count`, vector: adjacency.count},
    {name: `${direction}.overflow`, vector: adjacency.overflow}
  ];
}

/** Resolves a replaceable engine wrapper to its current concrete physical GPU allocation. */
function getPhysicalBuffer(chunk: GPUData<'uint32'> | GPUData<'float32'>): Buffer {
  return chunk.buffer instanceof DynamicBuffer ? chunk.buffer.buffer : chunk.buffer;
}
