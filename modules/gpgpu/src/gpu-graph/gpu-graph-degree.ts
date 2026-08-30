// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import type {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import type {GPUCommandGraph} from '../gpu-core/gpu-command-graph';
import {addGPUGraphDegreeToGraphWithDispatchLimit} from './gpu-graph-degree-internals';
import type {GPUGraphAdjacency, GPUGraphTopology} from './gpu-graph-topology';

const SCALAR_BYTE_LENGTH = 4;

/** Orientation of graph edges counted for every vertex. */
export type GPUGraphDegreeDirection = 'outgoing' | 'incoming';

/** Caller-owned graph topology and unsigned vertex-degree destination. */
export type GPUGraphDegreeProps = {
  /** Prefix for generated command-graph node and imported-resource identifiers. */
  id?: string;
  /** Existing GPU topology with exact, untruncated compressed sparse row offsets. */
  topology: GPUGraphTopology;
  /** One caller-owned packed unsigned degree row for every graph vertex. */
  output: GPUVector<'uint32'>;
  /** Edge orientation. Undirected adjacency gives the same degree in both directions. */
  direction?: GPUGraphDegreeDirection;
};

/**
 * Computes exact unsigned vertex degrees directly from GPU-resident adjacency offsets.
 *
 * Invalid edges are already excluded by topology construction. Duplicate edges contribute once
 * each, and an undirected self-loop contributes one. Degrees remain exact even when bounded
 * adjacency storage overflows because compressed sparse row offsets are never truncated.
 */
export class GPUGraphDegree {
  /** Prefix for generated command-graph node and imported-resource identifiers. */
  readonly id: string;
  /** Existing caller-owned GPU topology. */
  readonly topology: GPUGraphTopology;
  /** Caller-owned packed unsigned degree destination. */
  readonly output: GPUVector<'uint32'>;
  /** Outgoing or incoming edge orientation. */
  readonly direction: GPUGraphDegreeDirection;

  /** Validates caller-owned metadata without allocating, submitting, or reading GPU work. */
  constructor(props: GPUGraphDegreeProps) {
    this.id = props.id ?? 'gpu-graph-degree';
    this.topology = props.topology;
    this.output = props.output;
    this.direction = props.direction ?? 'outgoing';

    if (this.direction !== 'outgoing' && this.direction !== 'incoming') {
      throw new Error(`${this.id} direction must be outgoing or incoming`);
    }
    if (this.direction === 'incoming' && this.topology.graph.directed && !this.topology.reverse) {
      throw new Error(`${this.id} incoming directed degree requires reverse adjacency`);
    }
    validateDegreeOutput(this.output, this.topology.graph.vertexCount, this.id);
    validateDistinctDegreeOutput(this.topology, this.output, this.id);
  }

  /** Declares one bounded GPU degree pass without submitting commands or reading results. */
  addToGraph<Parameters>(commandGraph: GPUCommandGraph<Parameters>): void {
    addGPUGraphDegreeToGraphWithDispatchLimit(
      this,
      commandGraph,
      commandGraph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Requires exactly one packed, aligned, vertex-length unsigned destination chunk. */
function validateDegreeOutput(output: GPUVector<'uint32'>, vertexCount: number, id: string): void {
  if (
    output.data.length !== 1 ||
    output.format !== 'uint32' ||
    output.stride !== 1 ||
    output.byteStride !== SCALAR_BYTE_LENGTH ||
    output.rowByteLength !== SCALAR_BYTE_LENGTH ||
    output.valueLength !== output.length ||
    output.bufferLayout
  ) {
    throw new Error(`${id} output must contain one packed uint32 chunk`);
  }
  if (output.length !== vertexCount) {
    throw new Error(`${id} output length must equal vertexCount`);
  }

  const chunk = output.data[0];
  if (
    chunk.format !== 'uint32' ||
    chunk.length !== output.length ||
    chunk.stride !== 1 ||
    chunk.byteStride !== SCALAR_BYTE_LENGTH ||
    chunk.rowByteLength !== SCALAR_BYTE_LENGTH ||
    chunk.valueLength !== chunk.length ||
    !Number.isSafeInteger(chunk.byteOffset) ||
    chunk.byteOffset < 0 ||
    chunk.byteOffset % SCALAR_BYTE_LENGTH !== 0
  ) {
    throw new Error(`${id} output must contain one packed, uint32-aligned chunk`);
  }
}

/** Prevents degree publication from replacing any original graph or topology allocation. */
function validateDistinctDegreeOutput(
  topology: GPUGraphTopology,
  output: GPUVector<'uint32'>,
  id: string
): void {
  const inputVectors = [
    topology.graph.sourceVertices,
    topology.graph.targetVertices,
    ...(topology.graph.edgeWeights ? [topology.graph.edgeWeights] : []),
    ...(topology.graph.edgeIds ? [topology.graph.edgeIds] : []),
    ...getAdjacencyVectors(topology.forward),
    ...(topology.reverse ? getAdjacencyVectors(topology.reverse) : []),
    topology.invalidEdgeCount
  ];
  const outputBuffer = getPhysicalBuffer(output.data[0]);
  for (const vector of inputVectors) {
    if (vector.data.some(chunk => getPhysicalBuffer(chunk) === outputBuffer)) {
      throw new Error(`${id} output must use a distinct physical buffer allocation`);
    }
  }
}

/** Lists existing caller-owned adjacency and status vectors without changing their identities. */
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

/** Resolves a stable engine wrapper to the current concrete physical GPU allocation. */
function getPhysicalBuffer(chunk: GPUData<'uint32'> | GPUData<'float32'>): Buffer {
  return chunk.buffer instanceof DynamicBuffer ? chunk.buffer.buffer : chunk.buffer;
}
