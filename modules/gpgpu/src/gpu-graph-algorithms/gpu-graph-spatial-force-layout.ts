// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import type {Buffer} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import type {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import type {GPUCommandGraph} from '../gpu-core/gpu-command-graph';
import type {GPUGraphForceLayout} from './gpu-graph-force-layout';
import {addGPUGraphSpatialForceLayoutToGraphWithDispatchLimit} from './gpu-graph-spatial-force-layout-internals';
import type {GPUGraphAdjacency} from './gpu-graph-topology';

const MAXIMUM_UINT32 = 0xffffffff;
const SCALAR_BYTE_LENGTH = 4;

/** Exact layout state, spatial approximation controls, and explicit caller-owned grid storage. */
export type GPUGraphSpatialForceLayoutProps = {
  /** Prefix for generated command-graph nodes and graph-owned synchronization state. */
  id?: string;
  /** Existing caller-owned progressive force layout, including its render-ready positions. */
  layout: GPUGraphForceLayout;
  /** Positive horizontal and vertical uniform-grid cell counts. */
  gridSize: readonly [number, number];
  /** Strictly increasing minimum x/y and maximum x/y spatial domain coordinates. */
  bounds: readonly [number, number, number, number];
  /** Nonnegative far-cell opening criterion; zero disables approximation. Defaults to 0.6. */
  theta?: number;
  /** Nonnegative exact Chebyshev-neighborhood radius in grid cells. Defaults to one. */
  nearCellRadius?: number;
  /** Caller-owned exclusive cell offsets with one trailing total row. */
  cellOffsets: GPUVector<'uint32'>;
  /** Caller-owned, explicitly capacity-bounded vertex identifiers grouped by grid cell. */
  vertexIds: GPUVector<'uint32'>;
  /** Caller-owned floating-point center of mass for every uniform-grid cell. */
  cellCenters: GPUVector<'float32x2'>;
  /** Caller-owned scalar receiving the number of positions accepted by the spatial grid. */
  count: GPUVector<'uint32'>;
  /** Caller-owned scalar receiving whether accepted positions exceed vertex-ID capacity. */
  overflow: GPUVector<'uint32'>;
};

/**
 * Applies explicit uniform-grid near/far approximation to an existing progressive force layout.
 *
 * Every iteration rebuilds the caller-owned spatial index from current positions. The source
 * vertex's own and configured neighboring cells remain exact, while sufficiently distant cells
 * contribute population-weighted center-of-mass repulsion. Setting `theta` to zero makes every
 * cell exact. This is a flat-grid monopole approximation, not Barnes–Hut or ForceAtlas2.
 *
 * Out-of-domain vertices, index-capacity overflow, or graph-topology overflow leave positions
 * unchanged and clear velocities. Original caller-owned index buffers expose actual build capacity,
 * acceptance, overflow, and storage overhead without implicit readback or floating-point atomics.
 */
export class GPUGraphSpatialForceLayout {
  /** Prefix for generated command-graph nodes and graph-owned synchronization state. */
  readonly id: string;
  /** Existing caller-owned exact-layout configuration and progressive vertex state. */
  readonly layout: GPUGraphForceLayout;
  /** Horizontal and vertical uniform-grid dimensions. */
  readonly gridSize: readonly [number, number];
  /** Explicit two-dimensional minimum and maximum spatial domain. */
  readonly bounds: readonly [number, number, number, number];
  /** Far-cell opening criterion; zero preserves exact all-pairs repulsion. */
  readonly theta: number;
  /** Exact grid-cell neighborhood radius around each source vertex. */
  readonly nearCellRadius: number;
  /** Number of caller-owned row-major uniform-grid cells. */
  readonly cellCount: number;
  /** Caller-owned exclusive offsets for every uniform-grid cell. */
  readonly cellOffsets: GPUVector<'uint32'>;
  /** Caller-owned, capacity-bounded stable vertex identifiers grouped by cell. */
  readonly vertexIds: GPUVector<'uint32'>;
  /** Caller-owned two-component floating-point centers of mass. */
  readonly cellCenters: GPUVector<'float32x2'>;
  /** Caller-owned accepted-position count. */
  readonly count: GPUVector<'uint32'>;
  /** Caller-owned spatial-index capacity overflow flag. */
  readonly overflow: GPUVector<'uint32'>;

  /** Validates existing metadata without allocating GPU storage, submitting, or reading back. */
  constructor(props: GPUGraphSpatialForceLayoutProps) {
    this.id = props.id ?? 'gpu-graph-spatial-force-layout';
    this.layout = props.layout;
    this.gridSize = props.gridSize;
    this.bounds = props.bounds;
    this.theta = props.theta ?? 0.6;
    this.nearCellRadius = props.nearCellRadius ?? 1;
    this.cellOffsets = props.cellOffsets;
    this.vertexIds = props.vertexIds;
    this.cellCenters = props.cellCenters;
    this.count = props.count;
    this.overflow = props.overflow;

    if (
      this.gridSize.length !== 2 ||
      this.gridSize.some(dimension => !Number.isSafeInteger(dimension) || dimension < 1)
    ) {
      throw new Error(`${this.id} gridSize requires two positive integer dimensions`);
    }
    const cellCount = this.gridSize[0] * this.gridSize[1];
    if (!Number.isSafeInteger(cellCount) || cellCount >= MAXIMUM_UINT32) {
      throw new Error(`${this.id} grid cell count and trailing offset must fit in uint32`);
    }
    this.cellCount = cellCount;

    if (
      this.bounds.length !== 4 ||
      !this.bounds.every(Number.isFinite) ||
      this.bounds[0] >= this.bounds[2] ||
      this.bounds[1] >= this.bounds[3]
    ) {
      throw new Error(`${this.id} bounds require finite, strictly increasing x and y extents`);
    }
    if (!Number.isFinite(this.theta) || this.theta < 0) {
      throw new Error(`${this.id} theta must be a finite non-negative number`);
    }
    if (
      !Number.isSafeInteger(this.nearCellRadius) ||
      this.nearCellRadius < 0 ||
      this.nearCellRadius > MAXIMUM_UINT32
    ) {
      throw new Error(`${this.id} nearCellRadius must be a non-negative uint32`);
    }

    validateSpatialVector(this.cellOffsets, 'uint32', `${this.id} cellOffsets`, cellCount + 1);
    validateSpatialVector(this.vertexIds, 'uint32', `${this.id} vertexIds`);
    validateSpatialVector(this.cellCenters, 'float32x2', `${this.id} cellCenters`, cellCount);
    validateSpatialVector(this.count, 'uint32', `${this.id} count`, 1);
    validateSpatialVector(this.overflow, 'uint32', `${this.id} overflow`, 1);
    validateDistinctSpatialOutputs(this);
  }

  /** Declares bounded index construction and approximate force work without implicit submission. */
  addToGraph<Parameters>(commandGraph: GPUCommandGraph<Parameters>): void {
    addGPUGraphSpatialForceLayoutToGraphWithDispatchLimit(
      this,
      commandGraph,
      commandGraph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Validates one packed, four-byte-aligned index destination and optional exact row count. */
function validateSpatialVector<Format extends 'uint32' | 'float32x2'>(
  vector: GPUVector<Format>,
  format: Format,
  name: string,
  expectedLength?: number
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
    vector.bufferLayout ||
    !Number.isSafeInteger(vector.length) ||
    vector.length < 0 ||
    vector.length > MAXIMUM_UINT32
  ) {
    throw new Error(`${name} must contain exactly one packed ${format} chunk`);
  }
  if (expectedLength !== undefined && vector.length !== expectedLength) {
    throw new Error(`${name} must contain exactly ${expectedLength} ${format} rows`);
  }

  const chunk = vector.data[0];
  if (
    chunk.format !== format ||
    chunk.length !== vector.length ||
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

/** Requires every explicit index destination to avoid all topology and mutable layout allocations. */
function validateDistinctSpatialOutputs(spatial: GPUGraphSpatialForceLayout): void {
  const layout = spatial.layout;
  const topology = layout.topology;
  const existingVectors = [
    topology.graph.sourceVertices,
    topology.graph.targetVertices,
    ...(topology.graph.edgeWeights ? [topology.graph.edgeWeights] : []),
    ...(topology.graph.edgeIds ? [topology.graph.edgeIds] : []),
    ...getAdjacencyVectors(topology.forward),
    ...(topology.reverse ? getAdjacencyVectors(topology.reverse) : []),
    topology.invalidEdgeCount,
    layout.positions,
    layout.velocities,
    ...(layout.pinned ? [layout.pinned] : []),
    ...(layout.reset ? [layout.reset] : [])
  ];
  const allocations = new Set<Buffer>();
  for (const vector of existingVectors) {
    for (const chunk of vector.data) {
      allocations.add(getPhysicalBuffer(chunk));
    }
  }

  const destinations = [
    {name: 'cellOffsets', vector: spatial.cellOffsets},
    {name: 'vertexIds', vector: spatial.vertexIds},
    {name: 'cellCenters', vector: spatial.cellCenters},
    {name: 'count', vector: spatial.count},
    {name: 'overflow', vector: spatial.overflow}
  ];
  for (const {name, vector} of destinations) {
    const buffer = getPhysicalBuffer(vector.data[0]);
    if (allocations.has(buffer)) {
      throw new Error(`${spatial.id} ${name} must use a distinct physical buffer allocation`);
    }
    allocations.add(buffer);
  }
}

/** Enumerates existing topology columns without changing any caller-owned chunks or metadata. */
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

/** Resolves stable engine wrappers before comparing underlying physical index allocations. */
function getPhysicalBuffer(
  chunk: GPUData<'uint32'> | GPUData<'float32'> | GPUData<'float32x2'>
): Buffer {
  return chunk.buffer instanceof DynamicBuffer ? chunk.buffer.buffer : chunk.buffer;
}
