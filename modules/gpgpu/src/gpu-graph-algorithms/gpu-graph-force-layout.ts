// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import type {GPUCommandGraph} from '../gpu-core/gpu-command-graph';
import {addGPUGraphForceLayoutToGraphWithDispatchLimit} from './gpu-graph-force-layout-internals';
import type {GPUGraphAdjacency, GPUGraphTopology} from './gpu-graph-topology';

const MAXIMUM_UINT32 = 0xffffffff;
const MAXIMUM_LAYOUT_ITERATIONS = 1024;
const SCALAR_BYTE_LENGTH = 4;

/** Existing graph topology and caller-owned, directly renderable force-layout resources. */
export type GPUGraphForceLayoutProps = {
  /** Prefix for generated command-graph nodes and imported resources. */
  id?: string;
  /** Existing GPU-resident topology; directed graphs require reverse adjacency. */
  topology: GPUGraphTopology;
  /** Caller-owned, vertex-bindable packed two-component positions for every graph vertex. */
  positions: GPUVector<'float32x2'>;
  /** Caller-owned packed two-component velocities for every graph vertex. */
  velocities: GPUVector<'float32x2'>;
  /** Optional caller-owned vertex mask; nonzero rows preserve their current positions. */
  pinned?: GPUVector<'uint32'>;
  /** Optional caller-owned scalar requesting deterministic initialization; consumed on encoding. */
  reset?: GPUVector<'uint32'>;
  /** Unsigned seed used by deterministic GPU position initialization. Defaults to zero. */
  seed?: number;
  /** Bounded number of synchronized force and integration steps per encode. Defaults to four. */
  iterationsPerFrame?: number;
  /** Nonnegative strength of exact all-vertex repulsion. Defaults to one. */
  repulsion?: number;
  /** Nonnegative strength of edge-based attraction. Defaults to 0.1. */
  attraction?: number;
  /** Nonnegative attraction toward the coordinate origin. Defaults to 0.01. */
  gravity?: number;
  /** Velocity-retention factor between zero and one. Defaults to 0.9. */
  damping?: number;
  /** Positive maximum velocity magnitude applied during integration. Defaults to one. */
  maxVelocity?: number;
  /** Positive integration time step. Defaults to one. */
  timeStep?: number;
};

/**
 * Updates caller-owned, directly renderable graph positions entirely on the GPU.
 *
 * Each iteration computes exact `O(V² + E)` all-vertex repulsion and bidirectional edge
 * attraction; directed topologies therefore require reverse adjacency. Existing edge weights are
 * ignored. Separate globally synchronized force and integration passes avoid floating-point
 * atomics and hidden scratch allocations. Repeated encodes preserve positions and velocities as
 * warm starts unless the optional GPU reset scalar requests deterministic reinitialization.
 * Pinned positions remain unchanged, and adjacency overflow preserves all positions while clearing
 * velocities.
 */
export class GPUGraphForceLayout {
  /** Prefix for generated command-graph nodes and imported resources. */
  readonly id: string;
  /** Existing caller-owned GPU graph topology. */
  readonly topology: GPUGraphTopology;
  /** Caller-owned, vertex-bindable packed two-component positions. */
  readonly positions: GPUVector<'float32x2'>;
  /** Caller-owned packed two-component progressive velocities. */
  readonly velocities: GPUVector<'float32x2'>;
  /** Optional caller-owned vertex mask preserving pinned positions. */
  readonly pinned?: GPUVector<'uint32'>;
  /** Optional caller-owned, automatically consumed GPU initialization request. */
  readonly reset?: GPUVector<'uint32'>;
  /** Unsigned seed used by deterministic GPU position initialization. */
  readonly seed: number;
  /** Number of force and integration steps performed by each encoding. */
  readonly iterationsPerFrame: number;
  /** Exact all-vertex repulsion strength. */
  readonly repulsion: number;
  /** Forward and reverse edge-attraction strength. */
  readonly attraction: number;
  /** Coordinate-origin attraction strength. */
  readonly gravity: number;
  /** Velocity-retention factor. */
  readonly damping: number;
  /** Maximum integrated velocity magnitude. */
  readonly maxVelocity: number;
  /** Integration time step. */
  readonly timeStep: number;

  /** Validates caller-owned layout metadata without allocating, submitting, or reading GPU work. */
  constructor(props: GPUGraphForceLayoutProps) {
    this.id = props.id ?? 'gpu-graph-force-layout';
    this.topology = props.topology;
    this.positions = props.positions;
    this.velocities = props.velocities;
    this.pinned = props.pinned;
    this.reset = props.reset;
    this.seed = props.seed ?? 0;
    this.iterationsPerFrame = props.iterationsPerFrame ?? 4;
    this.repulsion = props.repulsion ?? 1;
    this.attraction = props.attraction ?? 0.1;
    this.gravity = props.gravity ?? 0.01;
    this.damping = props.damping ?? 0.9;
    this.maxVelocity = props.maxVelocity ?? 1;
    this.timeStep = props.timeStep ?? 1;

    if (this.topology.graph.directed && !this.topology.reverse) {
      throw new Error(`${this.id} directed force layout requires reverse adjacency`);
    }
    if (!Number.isSafeInteger(this.seed) || this.seed < 0 || this.seed > MAXIMUM_UINT32) {
      throw new Error(`${this.id} seed must be an unsigned 32-bit integer`);
    }
    if (
      !Number.isSafeInteger(this.iterationsPerFrame) ||
      this.iterationsPerFrame < 1 ||
      this.iterationsPerFrame > MAXIMUM_LAYOUT_ITERATIONS
    ) {
      throw new Error(`${this.id} iterationsPerFrame must be an integer between one and 1024`);
    }
    validateNonNegativeParameter(this.repulsion, `${this.id} repulsion`);
    validateNonNegativeParameter(this.attraction, `${this.id} attraction`);
    validateNonNegativeParameter(this.gravity, `${this.id} gravity`);
    if (!Number.isFinite(this.damping) || this.damping < 0 || this.damping > 1) {
      throw new Error(`${this.id} damping must be a finite number between zero and one`);
    }
    validatePositiveParameter(this.maxVelocity, `${this.id} maxVelocity`);
    validatePositiveParameter(this.timeStep, `${this.id} timeStep`);

    const vertexCount = this.topology.graph.vertexCount;
    validateLayoutVector(this.positions, 'float32x2', vertexCount, `${this.id} positions`);
    validateLayoutVector(this.velocities, 'float32x2', vertexCount, `${this.id} velocities`);
    if (this.pinned) {
      validateLayoutVector(this.pinned, 'uint32', vertexCount, `${this.id} pinned`);
    }
    if (this.reset) {
      validateLayoutVector(this.reset, 'uint32', 1, `${this.id} reset`);
    }

    const positionUsage = getPhysicalBuffer(this.positions.data[0]).usage;
    const requiredPositionUsage = Buffer.STORAGE | Buffer.VERTEX;
    if ((positionUsage & requiredPositionUsage) !== requiredPositionUsage) {
      throw new Error(`${this.id} positions require both STORAGE and VERTEX buffer usage`);
    }
    if ((getPhysicalBuffer(this.velocities.data[0]).usage & Buffer.STORAGE) === 0) {
      throw new Error(`${this.id} velocities require STORAGE buffer usage`);
    }
    validateDistinctLayoutVectors(this);
  }

  /** Declares bounded progressive layout passes without submitting commands or reading results. */
  addToGraph<Parameters>(commandGraph: GPUCommandGraph<Parameters>): void {
    addGPUGraphForceLayoutToGraphWithDispatchLimit(
      this,
      commandGraph,
      commandGraph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Rejects non-finite or negative user-configured force strengths. */
function validateNonNegativeParameter(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite non-negative number`);
  }
}

/** Rejects non-finite or non-positive integration limits. */
function validatePositiveParameter(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a finite positive number`);
  }
}

/** Requires one packed scalar or two-component chunk with its exact logical row count. */
function validateLayoutVector<Format extends 'uint32' | 'float32x2'>(
  vector: GPUVector<Format>,
  format: Format,
  length: number,
  name: string
): void {
  const componentCount = format === 'float32x2' ? 2 : 1;
  const rowByteLength = componentCount * SCALAR_BYTE_LENGTH;
  if (
    vector.data.length !== 1 ||
    vector.format !== format ||
    vector.stride !== componentCount ||
    vector.byteStride !== rowByteLength ||
    vector.rowByteLength !== rowByteLength ||
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
    chunk.stride !== componentCount ||
    chunk.byteStride !== rowByteLength ||
    chunk.rowByteLength !== rowByteLength ||
    chunk.valueLength !== chunk.length ||
    !Number.isSafeInteger(chunk.byteOffset) ||
    chunk.byteOffset < 0 ||
    chunk.byteOffset % SCALAR_BYTE_LENGTH !== 0
  ) {
    throw new Error(`${name} must contain one packed, uint32-aligned ${format} chunk`);
  }
}

/** Keeps layout state, pins, and reset controls disjoint from every existing graph allocation. */
function validateDistinctLayoutVectors(layout: GPUGraphForceLayout): void {
  const topology = layout.topology;
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

  const layoutVectors = [
    {name: 'positions', vector: layout.positions},
    {name: 'velocities', vector: layout.velocities},
    ...(layout.pinned ? [{name: 'pinned', vector: layout.pinned}] : []),
    ...(layout.reset ? [{name: 'reset', vector: layout.reset}] : [])
  ];
  for (const {name, vector} of layoutVectors) {
    const buffer = getPhysicalBuffer(vector.data[0]);
    if (allocations.has(buffer)) {
      throw new Error(`${layout.id} ${name} must use a distinct physical buffer allocation`);
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

/** Resolves a replaceable engine wrapper to its current underlying physical allocation. */
function getPhysicalBuffer(
  chunk: GPUData<'uint32'> | GPUData<'float32'> | GPUData<'float32x2'>
): Buffer {
  return chunk.buffer instanceof DynamicBuffer ? chunk.buffer.buffer : chunk.buffer;
}
