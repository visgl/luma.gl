// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import type {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData, GPUVector} from '@luma.gl/tables';
import type {GPUCommandGraph} from '../gpu-primitives/gpu-command-graph';
import {addLuGraphBreadthFirstSearchToGraphWithDispatchLimit} from './lu-graph-breadth-first-search-internals';
import type {LuGraphAdjacency, LuGraphTopology} from './lu-graph-topology';

const MAXIMUM_UINT32 = 0xffffffff;
const MAXIMUM_BREADTH_FIRST_DEPTH = 1024;
const SCALAR_BYTE_LENGTH = 4;

/** Forward, reverse, or combined orientation for shortest unweighted graph paths. */
export type LuGraphBreadthFirstSearchDirection = 'outgoing' | 'incoming' | 'both';

/** Caller-owned graph, seeds, GPU-resident controls, and shortest-path destinations. */
export type LuGraphBreadthFirstSearchProps = {
  /** Prefix for generated command-graph nodes and imported-resource identifiers. */
  id?: string;
  /** Existing GPU-resident graph adjacency and its explicit overflow status. */
  topology: LuGraphTopology;
  /** Stable source vertex identifiers, preserving every original seed chunk. */
  seeds: GPUVector<'uint32'>;
  /** One caller-owned unsigned hop-distance row for every graph vertex. */
  distances: GPUVector<'uint32'>;
  /** One caller-owned unsigned predecessor row for every graph vertex. */
  predecessors: GPUVector<'uint32'>;
  /** Optional caller-owned vertex-aligned zero/one reachability mask. */
  mask?: GPUVector<'uint32'>;
  /** Optional caller-owned scalar limiting the number of active seed rows. */
  seedCount?: GPUVector<'uint32'>;
  /** Compiled maximum hop count, bounded by 1,024. Defaults to one. */
  maxDepth?: number;
  /** Optional caller-owned scalar dynamically limiting the compiled hop count. */
  activeDepth?: GPUVector<'uint32'>;
  /** Forward, reverse, or combined edge orientation. Defaults to outgoing. */
  direction?: LuGraphBreadthFirstSearchDirection;
};

/**
 * Publishes deterministic shortest unweighted paths over existing GPU-resident adjacency.
 *
 * Unreachable vertices and seed predecessors contain `0xffffffff`. Equal-length predecessor ties
 * select the lowest stable parent vertex identifier. Invalid or inactive seeds are ignored. Any
 * overflow in the selected adjacency direction leaves every distance and predecessor unreachable
 * and clears the optional mask, preventing partial topology from producing misleading paths.
 */
export class LuGraphBreadthFirstSearch {
  /** Prefix for generated command-graph nodes and imported-resource identifiers. */
  readonly id: string;
  /** Existing caller-owned graph topology. */
  readonly topology: LuGraphTopology;
  /** Existing caller-owned, chunk-preserving seed identifiers. */
  readonly seeds: GPUVector<'uint32'>;
  /** Caller-owned vertex-aligned hop distances. */
  readonly distances: GPUVector<'uint32'>;
  /** Caller-owned vertex-aligned, deterministically selected predecessors. */
  readonly predecessors: GPUVector<'uint32'>;
  /** Optional caller-owned vertex-aligned reachability mask. */
  readonly mask?: GPUVector<'uint32'>;
  /** Optional GPU-resident active seed count. */
  readonly seedCount?: GPUVector<'uint32'>;
  /** Number of compiled breadth-first expansion passes. */
  readonly maxDepth: number;
  /** Optional GPU-resident active traversal depth. */
  readonly activeDepth?: GPUVector<'uint32'>;
  /** Forward, reverse, or combined edge orientation. */
  readonly direction: LuGraphBreadthFirstSearchDirection;

  /** Validates caller-owned metadata without allocating, submitting, or reading GPU work. */
  constructor(props: LuGraphBreadthFirstSearchProps) {
    this.id = props.id ?? 'lu-graph-breadth-first-search';
    this.topology = props.topology;
    this.seeds = props.seeds;
    this.distances = props.distances;
    this.predecessors = props.predecessors;
    this.mask = props.mask;
    this.seedCount = props.seedCount;
    this.maxDepth = props.maxDepth ?? 1;
    this.activeDepth = props.activeDepth;
    this.direction = props.direction ?? 'outgoing';

    if (!['outgoing', 'incoming', 'both'].includes(this.direction)) {
      throw new Error(`${this.id} direction must be outgoing, incoming, or both`);
    }
    if (this.direction !== 'outgoing' && this.topology.graph.directed && !this.topology.reverse) {
      throw new Error(
        `${this.id} incoming or bidirectional directed search requires reverse adjacency`
      );
    }
    if (
      !Number.isSafeInteger(this.maxDepth) ||
      this.maxDepth < 0 ||
      this.maxDepth > MAXIMUM_BREADTH_FIRST_DEPTH
    ) {
      throw new Error(`${this.id} maxDepth must be a safe integer between zero and 1024`);
    }

    validateSeedVector(this.seeds, this.id);
    validateSingleChunkVector(
      this.distances,
      this.topology.graph.vertexCount,
      `${this.id} distances`
    );
    validateSingleChunkVector(
      this.predecessors,
      this.topology.graph.vertexCount,
      `${this.id} predecessors`
    );
    if (this.mask) {
      validateSingleChunkVector(this.mask, this.topology.graph.vertexCount, `${this.id} mask`);
    }
    if (this.seedCount) {
      validateSingleChunkVector(this.seedCount, 1, `${this.id} seedCount`);
    }
    if (this.activeDepth) {
      validateSingleChunkVector(this.activeDepth, 1, `${this.id} activeDepth`);
    }
    validateDistinctSearchOutputs(this);
  }

  /** Adds bounded shortest-path passes without submitting commands or reading GPU results. */
  addToGraph<Parameters>(commandGraph: GPUCommandGraph<Parameters>): void {
    addLuGraphBreadthFirstSearchToGraphWithDispatchLimit(
      this,
      commandGraph,
      commandGraph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Preserves ordered source seed chunks while validating their packed uint32 scalar layout. */
function validateSeedVector(seeds: GPUVector<'uint32'>, id: string): void {
  validatePackedVector(seeds, `${id} seeds`);
  if (
    !Number.isSafeInteger(seeds.length) ||
    seeds.length < 0 ||
    seeds.length > MAXIMUM_UINT32 ||
    seeds.data.reduce((totalLength, chunk) => totalLength + chunk.length, 0) !== seeds.length
  ) {
    throw new Error(`${id} seed row count must fit in uint32`);
  }
  for (const chunk of seeds.data) {
    validatePackedChunk(chunk, `${id} seed chunk`);
  }
}

/** Requires one caller-owned packed scalar chunk with its exact output or status length. */
function validateSingleChunkVector(
  vector: GPUVector<'uint32'>,
  length: number,
  name: string
): void {
  validatePackedVector(vector, name);
  if (vector.data.length !== 1) {
    throw new Error(`${name} must contain exactly one packed uint32 chunk`);
  }
  if (vector.length !== length) {
    throw new Error(`${name} must contain exactly ${length} uint32 rows`);
  }
  validatePackedChunk(vector.data[0], name);
  if (vector.data[0].length !== length) {
    throw new Error(`${name} chunk must contain exactly ${length} uint32 rows`);
  }
}

/** Requires exact vector-level packed uint32 scalar metadata. */
function validatePackedVector(vector: GPUVector<'uint32'>, name: string): void {
  if (
    vector.format !== 'uint32' ||
    vector.stride !== 1 ||
    vector.byteStride !== SCALAR_BYTE_LENGTH ||
    vector.rowByteLength !== SCALAR_BYTE_LENGTH ||
    vector.valueLength !== vector.length ||
    vector.bufferLayout
  ) {
    throw new Error(`${name} must contain packed uint32 rows`);
  }
}

/** Requires exact chunk-level packed uint32 scalar metadata and aligned physical offsets. */
function validatePackedChunk(chunk: GPUData<'uint32'>, name: string): void {
  if (
    chunk.format !== 'uint32' ||
    !Number.isSafeInteger(chunk.length) ||
    chunk.length < 0 ||
    chunk.length > MAXIMUM_UINT32 ||
    chunk.stride !== 1 ||
    chunk.byteStride !== SCALAR_BYTE_LENGTH ||
    chunk.rowByteLength !== SCALAR_BYTE_LENGTH ||
    chunk.valueLength !== chunk.length ||
    !Number.isSafeInteger(chunk.byteOffset) ||
    chunk.byteOffset < 0 ||
    chunk.byteOffset % SCALAR_BYTE_LENGTH !== 0
  ) {
    throw new Error(`${name} must contain packed, uint32-aligned rows`);
  }
}

/** Keeps every writable result physically disjoint from all graph sources, controls, and peers. */
function validateDistinctSearchOutputs(search: LuGraphBreadthFirstSearch): void {
  const inputVectors = [
    search.topology.graph.sourceVertices,
    search.topology.graph.targetVertices,
    ...(search.topology.graph.edgeWeights ? [search.topology.graph.edgeWeights] : []),
    ...(search.topology.graph.edgeIds ? [search.topology.graph.edgeIds] : []),
    ...getAdjacencyVectors(search.topology.forward),
    ...(search.topology.reverse ? getAdjacencyVectors(search.topology.reverse) : []),
    search.topology.invalidEdgeCount,
    search.seeds,
    ...(search.seedCount ? [search.seedCount] : []),
    ...(search.activeDepth ? [search.activeDepth] : [])
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
    ...(search.mask ? [{name: 'mask', vector: search.mask}] : [])
  ];
  for (const {name, vector} of outputs) {
    const physicalBuffer = getPhysicalBuffer(vector.data[0]);
    if (physicalAllocations.has(physicalBuffer)) {
      throw new Error(`${search.id} ${name} must use a distinct physical buffer allocation`);
    }
    physicalAllocations.add(physicalBuffer);
  }
}

/** Enumerates existing caller-owned adjacency and status vectors without copying their chunks. */
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

/** Resolves a replaceable engine wrapper to its current concrete physical GPU allocation. */
function getPhysicalBuffer(chunk: GPUData<'uint32'> | GPUData<'float32'>): Buffer {
  return chunk.buffer instanceof DynamicBuffer ? chunk.buffer.buffer : chunk.buffer;
}
