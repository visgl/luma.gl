// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import type {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData, GPUVector} from '@luma.gl/tables';
import type {GPUCommandGraph} from '../gpu-core/gpu-command-graph';
import {addGPUGraphLocalClusteringCoefficientToGraphWithDispatchLimit} from './gpu-graph-local-clustering-coefficient-internals';
import type {GPUGraphAdjacency, GPUGraphTopology} from './gpu-graph-topology';

const SCALAR_BYTE_LENGTH = 4;

/** Existing graph adjacency and caller-owned Graphalytics local-clustering outputs. */
export type GPUGraphLocalClusteringCoefficientProps = {
  /** Prefix for generated command-graph nodes and imported-resource identifiers. */
  id?: string;
  /** Existing GPU graph adjacency; directed weak neighborhoods require reverse CSR. */
  topology: GPUGraphTopology;
  /** One packed, caller-owned floating-point clustering coefficient per vertex. */
  output: GPUVector<'float32'>;
  /** Optional packed per-vertex triangle count or directed neighbor-edge closure count. */
  triangles?: GPUVector<'uint32'>;
};

/**
 * Computes exact Graphalytics local clustering directly from existing, unordered GPU CSR.
 *
 * A vertex's neighborhood is the distinct union of its incoming and outgoing neighbors. Self
 * loops and duplicate edges are ignored. For directed graphs every distinct directed edge among
 * those neighbors contributes separately; reciprocated edges therefore contribute twice. The
 * coefficient is the directed closure count divided by `degree * (degree - 1)`. Undirected CSR
 * is symmetric, so this is equivalently twice the unique incident triangle count divided by the
 * same denominator. Vertices with fewer than two distinct neighbors receive zero.
 *
 * Optional triangle output contains directed neighbor-edge closures for directed graphs and
 * unique incident triangles for undirected graphs. Required adjacency overflow or uint32
 * closure-count overflow publishes zero coefficients and `0xffffffff` triangle sentinels.
 *
 * Existing adjacency is intentionally unordered and may contain duplicates, so exact GPU
 * deduplication and membership scans have cubic worst-case work in vertex degree. No source
 * vectors are sorted, repacked, read back, or implicitly destroyed.
 */
export class GPUGraphLocalClusteringCoefficient {
  /** Prefix for generated command-graph node and imported-resource identifiers. */
  readonly id: string;
  /** Existing caller-owned GPU graph topology. */
  readonly topology: GPUGraphTopology;
  /** Caller-owned vertex-aligned floating-point local-clustering coefficients. */
  readonly output: GPUVector<'float32'>;
  /** Optional caller-owned unsigned incident-triangle or directed-closure counts. */
  readonly triangles?: GPUVector<'uint32'>;

  /** Validates caller metadata without allocating, submitting, reading, or destroying work. */
  constructor(props: GPUGraphLocalClusteringCoefficientProps) {
    this.id = props.id ?? 'gpu-graph-local-clustering-coefficient';
    this.topology = props.topology;
    this.output = props.output;
    this.triangles = props.triangles;

    if (this.topology.graph.directed && !this.topology.reverse) {
      throw new Error(`${this.id} directed weak-neighbor clustering requires reverse adjacency`);
    }

    validateClusteringVector(
      this.output,
      'float32',
      this.topology.graph.vertexCount,
      `${this.id} output`
    );
    if (this.triangles) {
      validateClusteringVector(
        this.triangles,
        'uint32',
        this.topology.graph.vertexCount,
        `${this.id} triangles`
      );
    }
    validateDistinctClusteringOutputs(this);
  }

  /** Declares bounded GPU clustering without queue submission or CPU graph synchronization. */
  addToGraph<Parameters>(commandGraph: GPUCommandGraph<Parameters>): void {
    addGPUGraphLocalClusteringCoefficientToGraphWithDispatchLimit(
      this,
      commandGraph,
      commandGraph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Requires one packed, aligned scalar output chunk with its exact logical vertex count. */
function validateClusteringVector<Format extends 'uint32' | 'float32'>(
  vector: GPUVector<Format>,
  format: Format,
  length: number,
  name: string
): void {
  if (
    vector.data.length !== 1 ||
    vector.format !== format ||
    vector.stride !== 1 ||
    vector.byteStride !== SCALAR_BYTE_LENGTH ||
    vector.rowByteLength !== SCALAR_BYTE_LENGTH ||
    vector.valueLength !== vector.length ||
    vector.bufferLayout
  ) {
    throw new Error(`${name} must contain exactly one packed ${format} chunk`);
  }
  if (vector.length !== length) {
    throw new Error(`${name} must contain exactly ${length} ${format} rows`);
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
    throw new Error(`${name} must contain one packed, ${format}-aligned chunk`);
  }
}

/** Protects source graph, CSR/status allocations, and optional triangle output from alias. */
function validateDistinctClusteringOutputs(clustering: GPUGraphLocalClusteringCoefficient): void {
  const {topology} = clustering;
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
    for (const chunk of vector.data) allocations.add(getPhysicalBuffer(chunk));
  }

  const outputs = [
    {name: 'output', vector: clustering.output},
    ...(clustering.triangles ? [{name: 'triangles', vector: clustering.triangles}] : [])
  ];
  for (const {name, vector} of outputs) {
    const buffer = getPhysicalBuffer(vector.data[0]);
    if (allocations.has(buffer)) {
      throw new Error(`${clustering.id} ${name} must use a distinct physical buffer allocation`);
    }
    allocations.add(buffer);
  }
}

/** Enumerates existing adjacency payloads and statuses without changing their chunk identity. */
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

/** Resolves borrowed engine wrappers so slices cannot disguise physical allocation aliases. */
function getPhysicalBuffer(chunk: GPUData<'uint32'> | GPUData<'float32'>): Buffer {
  return chunk.buffer instanceof DynamicBuffer ? chunk.buffer.buffer : chunk.buffer;
}
