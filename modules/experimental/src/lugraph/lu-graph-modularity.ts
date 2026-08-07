// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import type {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData, GPUVector} from '@luma.gl/tables';
import type {GPUCommandGraph} from '../gpu-primitives/gpu-command-graph';
import type {LuGraph} from './lu-graph';
import {addLuGraphModularityToGraphWithDispatchLimit} from './lu-graph-modularity-internals';

const SCALAR_BYTE_LENGTH = 4;

/** Existing GPU graph, vertex-aligned community labels, and caller-owned quality outputs. */
export type LuGraphModularityProps = {
  /** Prefix for generated command-graph nodes and imported-resource identifiers. */
  id?: string;
  /** Original directed or undirected edge columns, including their preserved source chunks. */
  graph: LuGraph;
  /** One existing unsigned community label below `vertexCount` for every graph vertex. */
  communities: GPUVector<'uint32'>;
  /** One caller-owned floating-point Newman modularity score. */
  output: GPUVector<'float32'>;
  /** Non-negative modularity resolution parameter. Defaults to one. */
  resolution?: number;
  /** Optional vertex-count-sized output indexed directly by stable community label. */
  communityContributions?: GPUVector<'float32'>;
  /** Optional scalar that is one only when labels, weights, and total edge weight are valid. */
  valid?: GPUVector<'uint32'>;
};

/**
 * Scores an existing graph partition without CPU synchronization or a CSR rebuild.
 *
 * Directed modularity is `sum(L / W - resolution * outgoing * incoming / W²)`. Undirected
 * modularity is `sum(L / W - resolution * (degree / (2 * W))²)`. Each original edge contributes
 * once to total and internal weight. Undirected edges contribute their weight to both endpoint
 * volumes, including twice for a self-loop. Parallel and reciprocated source edges remain
 * independent; missing edge weights are one, and invalid source endpoints are ignored.
 *
 * Invalid vertex-community labels, negative or nonfinite valid-endpoint edge weights, zero total
 * accepted weight, and floating-point accumulation overflow publish zero score and contributions
 * with zero optional validity. Contributions are indexed by community identifier rather than
 * source vertex. Floating-point atomic accumulation can vary slightly with GPU execution order.
 */
export class LuGraphModularity {
  /** Prefix for generated command-graph nodes and imported-resource identifiers. */
  readonly id: string;
  /** Existing caller-owned graph source columns. */
  readonly graph: LuGraph;
  /** Existing caller-owned vertex-aligned community assignments. */
  readonly communities: GPUVector<'uint32'>;
  /** Caller-owned scalar receiving the floating-point modularity score. */
  readonly output: GPUVector<'float32'>;
  /** Non-negative floating-point resolution parameter. */
  readonly resolution: number;
  /** Optional caller-owned contribution for every possible stable community label. */
  readonly communityContributions?: GPUVector<'float32'>;
  /** Optional caller-owned scalar publishing whether the score is mathematically valid. */
  readonly valid?: GPUVector<'uint32'>;

  /** Validates metadata without allocating, submitting, reading, or destroying GPU resources. */
  constructor(props: LuGraphModularityProps) {
    this.id = props.id ?? 'lu-graph-modularity';
    this.graph = props.graph;
    this.communities = props.communities;
    this.output = props.output;
    this.resolution = props.resolution ?? 1;
    this.communityContributions = props.communityContributions;
    this.valid = props.valid;

    if (
      !Number.isFinite(this.resolution) ||
      this.resolution < 0 ||
      !Number.isFinite(Math.fround(this.resolution))
    ) {
      throw new Error(`${this.id} resolution must be a non-negative finite float32`);
    }

    validateModularityVector(
      this.communities,
      'uint32',
      this.graph.vertexCount,
      `${this.id} communities`
    );
    validateModularityVector(this.output, 'float32', 1, `${this.id} output`);
    if (this.communityContributions) {
      validateModularityVector(
        this.communityContributions,
        'float32',
        this.graph.vertexCount,
        `${this.id} communityContributions`
      );
    }
    if (this.valid) {
      validateModularityVector(this.valid, 'uint32', 1, `${this.id} valid`);
    }
    validateDistinctModularityOutputs(this);
  }

  /** Declares chunk-preserving weighted scoring without submitting or reading commands. */
  addToGraph<Parameters>(commandGraph: GPUCommandGraph<Parameters>): void {
    addLuGraphModularityToGraphWithDispatchLimit(
      this,
      commandGraph,
      commandGraph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Requires one packed, aligned scalar vector chunk with its exact documented row count. */
function validateModularityVector<Format extends 'uint32' | 'float32'>(
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

/** Keeps all caller-owned writable results physically disjoint from sources and community input. */
function validateDistinctModularityOutputs(modularity: LuGraphModularity): void {
  const inputs = [
    modularity.graph.sourceVertices,
    modularity.graph.targetVertices,
    ...(modularity.graph.edgeWeights ? [modularity.graph.edgeWeights] : []),
    ...(modularity.graph.edgeIds ? [modularity.graph.edgeIds] : []),
    modularity.communities
  ];
  const allocations = new Set<Buffer>();
  for (const vector of inputs) {
    for (const chunk of vector.data) allocations.add(getPhysicalBuffer(chunk));
  }

  const outputs = [
    {name: 'output', vector: modularity.output},
    ...(modularity.communityContributions
      ? [{name: 'communityContributions', vector: modularity.communityContributions}]
      : []),
    ...(modularity.valid ? [{name: 'valid', vector: modularity.valid}] : [])
  ];
  for (const {name, vector} of outputs) {
    const buffer = getPhysicalBuffer(vector.data[0]);
    if (allocations.has(buffer)) {
      throw new Error(`${modularity.id} ${name} must use a distinct physical buffer allocation`);
    }
    allocations.add(buffer);
  }
}

/** Resolves borrowed engine wrappers so sliced allocations cannot disguise writable aliases. */
function getPhysicalBuffer(chunk: GPUData<'uint32'> | GPUData<'float32'>): Buffer {
  return chunk.buffer instanceof DynamicBuffer ? chunk.buffer.buffer : chunk.buffer;
}
