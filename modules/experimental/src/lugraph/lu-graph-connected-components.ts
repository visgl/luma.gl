// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import type {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData, GPUVector} from '@luma.gl/tables';
import type {GPUCommandGraph} from '../gpu-primitives/gpu-command-graph';
import {addLuGraphConnectedComponentsToGraphWithDispatchLimit} from './lu-graph-connected-components-internals';
import type {LuGraphAdjacency, LuGraphTopology} from './lu-graph-topology';

const DEFAULT_COMPONENT_ITERATIONS = 32;
const MAXIMUM_COMPONENT_ITERATIONS = 1024;
const SCALAR_BYTE_LENGTH = 4;

/** Caller-owned GPU graph topology, component labels, and optional convergence status. */
export type LuGraphConnectedComponentsProps = {
  /** Prefix for generated command-graph node and imported-resource identifiers. */
  id?: string;
  /** Existing forward graph adjacency; reverse adjacency is not required. */
  topology: LuGraphTopology;
  /** One caller-owned packed unsigned component label for every graph vertex. */
  output: GPUVector<'uint32'>;
  /** Bounded number of compiled relaxation and pointer-jumping iterations. Defaults to 32. */
  iterations?: number;
  /** Optional caller-owned scalar publishing whether the final iteration reached a fixed point. */
  converged?: GPUVector<'uint32'>;
};

/**
 * Publishes weak graph components directly from existing GPU-resident forward adjacency.
 *
 * Directed edges connect both endpoints, so reverse adjacency is unnecessary. Once converged, each
 * component receives its lowest stable vertex identifier, and isolated vertices label themselves.
 * The optional convergence scalar is one only when the last compiled iteration reaches a fixed
 * point. Forward-adjacency overflow instead publishes `0xffffffff` labels and zero convergence.
 */
export class LuGraphConnectedComponents {
  /** Prefix for generated command-graph node and imported-resource identifiers. */
  readonly id: string;
  /** Existing caller-owned GPU graph topology. */
  readonly topology: LuGraphTopology;
  /** Caller-owned vertex-aligned component labels. */
  readonly output: GPUVector<'uint32'>;
  /** Number of compiled, explicitly synchronized component-relaxation iterations. */
  readonly iterations: number;
  /** Optional caller-owned GPU-resident convergence status. */
  readonly converged?: GPUVector<'uint32'>;

  /** Validates caller-owned graph metadata without allocating, submitting, or reading GPU work. */
  constructor(props: LuGraphConnectedComponentsProps) {
    this.id = props.id ?? 'lu-graph-connected-components';
    this.topology = props.topology;
    this.output = props.output;
    this.iterations = props.iterations ?? DEFAULT_COMPONENT_ITERATIONS;
    this.converged = props.converged;

    if (
      !Number.isSafeInteger(this.iterations) ||
      this.iterations < 1 ||
      this.iterations > MAXIMUM_COMPONENT_ITERATIONS
    ) {
      throw new Error(`${this.id} iterations must be a safe integer between one and 1024`);
    }
    validateComponentVector(this.output, this.topology.graph.vertexCount, `${this.id} output`);
    if (this.converged) {
      validateComponentVector(this.converged, 1, `${this.id} converged`);
    }
    validateDistinctComponentOutputs(this);
  }

  /** Declares bounded weak-component passes without submitting commands or reading results. */
  addToGraph<Parameters>(commandGraph: GPUCommandGraph<Parameters>): void {
    addLuGraphConnectedComponentsToGraphWithDispatchLimit(
      this,
      commandGraph,
      commandGraph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Requires one packed, aligned unsigned output chunk with its exact logical row count. */
function validateComponentVector(vector: GPUVector<'uint32'>, length: number, name: string): void {
  if (
    vector.data.length !== 1 ||
    vector.format !== 'uint32' ||
    vector.stride !== 1 ||
    vector.byteStride !== SCALAR_BYTE_LENGTH ||
    vector.rowByteLength !== SCALAR_BYTE_LENGTH ||
    vector.valueLength !== vector.length ||
    vector.bufferLayout
  ) {
    throw new Error(`${name} must contain exactly one packed uint32 chunk`);
  }
  if (vector.length !== length) {
    throw new Error(`${name} must contain exactly ${length} uint32 rows`);
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

/** Keeps component labels and optional convergence status disjoint from all graph allocations. */
function validateDistinctComponentOutputs(components: LuGraphConnectedComponents): void {
  const topology = components.topology;
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
    {name: 'output', vector: components.output},
    ...(components.converged ? [{name: 'converged', vector: components.converged}] : [])
  ];
  for (const {name, vector} of outputs) {
    const buffer = getPhysicalBuffer(vector.data[0]);
    if (allocations.has(buffer)) {
      throw new Error(`${components.id} ${name} must use a distinct physical buffer allocation`);
    }
    allocations.add(buffer);
  }
}

/** Enumerates existing caller-owned adjacency and status columns without changing their chunks. */
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

/** Resolves a stable engine wrapper to its current concrete physical GPU allocation. */
function getPhysicalBuffer(chunk: GPUData<'uint32'> | GPUData<'float32'>): Buffer {
  return chunk.buffer instanceof DynamicBuffer ? chunk.buffer.buffer : chunk.buffer;
}
