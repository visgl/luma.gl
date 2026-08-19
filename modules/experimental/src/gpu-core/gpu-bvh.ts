// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {getGPUVectorFormatInfo} from '@luma.gl/tables';
import type {GPUCommandGraph, GraphBufferUse, GraphDataView} from './gpu-command-graph';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';

const BVH_WORKGROUP_SIZE = 256;
const MAXIMUM_FUSED_LEAF_CAPACITY = 128;
const FUSED_WORKGROUP_BYTES_PER_LEAF = 64;
const INVALID_NODE = 0xffffffff;

type GPUBVHDispatchLayout = {x: number; y: number; z: number};

/** Packed two- or three-dimensional bounds consumed and published by {@link GPUBVH}. */
export type GPUBVHBoundsView = GraphDataView<'float32x2'> | GraphDataView<'float32x3'>;

/** Compute-pass strategy requested for one graph-native complete-binary BVH. */
export type GPUBVHStrategy = 'auto' | 'fused' | 'level';

/** Properties for one complete-binary GPU BVH. */
export type GPUBVHProps = {
  /** Prefix for generated graph node IDs. */
  id?: string;
  /** Small hierarchies use one workgroup by default; larger trees retain per-level passes. */
  strategy?: GPUBVHStrategy;
  /** Packed source minima. */
  minima: GPUBVHBoundsView;
  /** Packed source maxima with the same format and length as `minima`. */
  maxima: GPUBVHBoundsView;
  /** Optional stable IDs aligned with source rows. Identity IDs are generated when omitted. */
  sourceIds?: GraphDataView<'uint32'>;
  /** Power-of-two number of reserved leaf slots. */
  leafCapacity: number;
  /** Caller-owned minima for all `2 * leafCapacity - 1` nodes. */
  nodeMinima: GPUBVHBoundsView;
  /** Caller-owned maxima for all `2 * leafCapacity - 1` nodes. */
  nodeMaxima: GPUBVHBoundsView;
  /** Caller-owned child pairs for every node; leaves contain `0xffffffff`. */
  nodeChildren: GraphDataView<'uint32x2'>;
  /** Caller-owned stable IDs for the reserved leaf slots. */
  leafIds: GraphDataView<'uint32'>;
  /** Caller-owned row receiving the full source row count. */
  count: GraphDataView<'uint32'>;
  /** Caller-owned row set when source rows exceed leaf capacity. */
  overflow: GraphDataView<'uint32'>;
};

/** Allocation and topology facts exposed without GPU readback. */
export type GPUBVHStorageStats = {
  dimension: 2 | 3;
  leafCapacity: number;
  internalNodeCount: number;
  nodeCount: number;
  levelCount: number;
  outputByteLength: number;
};

/**
 * Builds and refits a flat complete-binary bounding-volume hierarchy on the GPU.
 *
 * Source order defines stable leaf slots. Every encoding reloads the bounded leaf prefix and
 * reduces parent bounds bottom-up without changing topology or identity. This is a deterministic
 * refit-oriented foundation; spatial sorting and topology rebuilds remain separate policies.
 */
export class GPUBVH {
  readonly id: string;
  readonly strategy: GPUBVHStrategy;
  readonly resolvedStrategy: Exclude<GPUBVHStrategy, 'auto'>;
  readonly minima: GPUBVHBoundsView;
  readonly maxima: GPUBVHBoundsView;
  readonly sourceIds?: GraphDataView<'uint32'>;
  readonly leafCapacity: number;
  readonly nodeMinima: GPUBVHBoundsView;
  readonly nodeMaxima: GPUBVHBoundsView;
  readonly nodeChildren: GraphDataView<'uint32x2'>;
  readonly leafIds: GraphDataView<'uint32'>;
  readonly count: GraphDataView<'uint32'>;
  readonly overflow: GraphDataView<'uint32'>;
  readonly dimension: 2 | 3;
  readonly nodeCount: number;
  readonly internalNodeCount: number;
  readonly levelCount: number;
  readonly rootNode = 0;
  readonly topology = 'complete-binary' as const;
  readonly updatePolicy = 'refit' as const;
  readonly stats: GPUBVHStorageStats;

  constructor(props: GPUBVHProps) {
    this.id = props.id ?? 'gpu-bvh';
    this.strategy = props.strategy ?? 'auto';
    this.minima = props.minima;
    this.maxima = props.maxima;
    this.sourceIds = props.sourceIds;
    this.leafCapacity = props.leafCapacity;
    this.nodeMinima = props.nodeMinima;
    this.nodeMaxima = props.nodeMaxima;
    this.nodeChildren = props.nodeChildren;
    this.leafIds = props.leafIds;
    this.count = props.count;
    this.overflow = props.overflow;
    this.dimension = this.minima.format === 'float32x2' ? 2 : 3;

    if (this.minima.length > INVALID_NODE) {
      throw new Error(`${this.id} source row count exceeds uint32 range`);
    }
    if (!Number.isSafeInteger(this.leafCapacity) || !isPowerOfTwo(this.leafCapacity)) {
      throw new Error(`${this.id} leafCapacity must be a positive power of two`);
    }
    if (!['auto', 'fused', 'level'].includes(this.strategy)) {
      throw new Error(`${this.id} strategy must be auto, fused, or level`);
    }
    const limits = (this.minima.buffer.graph as GPUCommandGraph).device.limits;
    const supportsFusedStrategy =
      this.leafCapacity <= MAXIMUM_FUSED_LEAF_CAPACITY &&
      this.leafCapacity <= limits.maxComputeInvocationsPerWorkgroup &&
      this.leafCapacity <= limits.maxComputeWorkgroupSizeX &&
      this.leafCapacity * FUSED_WORKGROUP_BYTES_PER_LEAF <= limits.maxComputeWorkgroupStorageSize;
    if (this.strategy === 'fused' && !supportsFusedStrategy) {
      throw new Error(`${this.id} fused strategy exceeds portable single-workgroup limits`);
    }
    this.resolvedStrategy = this.strategy === 'level' || !supportsFusedStrategy ? 'level' : 'fused';
    this.nodeCount = this.leafCapacity * 2 - 1;
    this.internalNodeCount = this.leafCapacity - 1;
    this.levelCount = Math.log2(this.leafCapacity) + 1;
    if (!Number.isSafeInteger(this.nodeCount) || this.nodeCount > INVALID_NODE) {
      throw new Error(`${this.id} node count exceeds uint32 range`);
    }

    validatePackedView(this.minima, ['float32x2', 'float32x3'], `${this.id} minima`);
    validatePackedView(this.maxima, ['float32x2', 'float32x3'], `${this.id} maxima`);
    validatePackedView(this.nodeMinima, ['float32x2', 'float32x3'], `${this.id} nodeMinima`);
    validatePackedView(this.nodeMaxima, ['float32x2', 'float32x3'], `${this.id} nodeMaxima`);
    validatePackedView(this.nodeChildren, ['uint32x2'], `${this.id} nodeChildren`);
    validatePackedUint32View(this.leafIds, `${this.id} leafIds`);
    validatePackedUint32View(this.count, `${this.id} count`);
    validatePackedUint32View(this.overflow, `${this.id} overflow`);
    if (this.sourceIds) validatePackedUint32View(this.sourceIds, `${this.id} sourceIds`);

    if (this.minima.format !== this.maxima.format || this.minima.length !== this.maxima.length) {
      throw new Error(`${this.id} minima and maxima must have matching formats and lengths`);
    }
    if (this.sourceIds && this.sourceIds.length !== this.minima.length) {
      throw new Error(`${this.id} sourceIds.length must equal bounds length`);
    }
    if (
      this.nodeMinima.format !== this.minima.format ||
      this.nodeMaxima.format !== this.minima.format ||
      this.nodeMinima.length !== this.nodeCount ||
      this.nodeMaxima.length !== this.nodeCount
    ) {
      throw new Error(`${this.id} node bounds must match source format and node count`);
    }
    if (this.nodeChildren.length !== this.nodeCount) {
      throw new Error(`${this.id} nodeChildren.length must equal node count`);
    }
    if (this.leafIds.length !== this.leafCapacity) {
      throw new Error(`${this.id} leafIds.length must equal leafCapacity`);
    }
    if (this.count.length < 1 || this.overflow.length < 1) {
      throw new Error(`${this.id} count and overflow must each contain one uint32 row`);
    }

    const boundsByteLength = getGPUVectorFormatInfo(this.minima.format).byteLength;
    this.stats = {
      dimension: this.dimension,
      leafCapacity: this.leafCapacity,
      internalNodeCount: this.internalNodeCount,
      nodeCount: this.nodeCount,
      levelCount: this.levelCount,
      outputByteLength:
        this.nodeCount * (boundsByteLength * 2 + Uint32Array.BYTES_PER_ELEMENT * 2) +
        this.leafCapacity * Uint32Array.BYTES_PER_ELEMENT +
        Uint32Array.BYTES_PER_ELEMENT * 2
    };
  }

  /** Adds leaf loading, topology publication, and bottom-up refit passes to the graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [
      this.minima,
      this.maxima,
      ...(this.sourceIds ? [this.sourceIds] : []),
      this.nodeMinima,
      this.nodeMaxima,
      this.nodeChildren,
      this.leafIds,
      this.count,
      this.overflow
    ];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }

    if (this.resolvedStrategy === 'fused') {
      addFusedRefitPass(graph, this);
    } else {
      addLoadLeavesPass(
        graph,
        this,
        getGPUBVHDispatchLayout(
          this.nodeCount,
          graph.device.limits.maxComputeWorkgroupsPerDimension
        )
      );
      for (let depth = this.levelCount - 2; depth >= 0; depth--) {
        addRefitLevelPass(graph, this, depth);
      }
    }

    if (this.sourceIds) {
      addRemapSourceIdsPass(graph, this, this.sourceIds);
    }
  }
}

/** Builds the complete hierarchy inside one synchronized workgroup without global barriers. */
function addFusedRefitPass<Parameters>(graph: GPUCommandGraph<Parameters>, bvh: GPUBVH): void {
  const source = /* wgsl */ `
const SOURCE_COUNT: u32 = ${bvh.minima.length}u;
const STORED_COUNT: u32 = ${Math.min(bvh.minima.length, bvh.leafCapacity)}u;
const LEAF_CAPACITY: u32 = ${bvh.leafCapacity}u;
const INTERNAL_NODE_COUNT: u32 = ${bvh.internalNodeCount}u;
const DIMENSION: u32 = ${bvh.dimension}u;
const MINIMA_OFFSET: u32 = ${getViewElementOffset(bvh.minima)}u;
const MAXIMA_OFFSET: u32 = ${getViewElementOffset(bvh.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${getViewElementOffset(bvh.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${getViewElementOffset(bvh.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${getViewElementOffset(bvh.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${getViewElementOffset(bvh.leafIds)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(bvh.count)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(bvh.overflow)}u;
@group(0) @binding(0) var<storage, read> sourceMinima: array<f32>;
@group(0) @binding(1) var<storage, read> sourceMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(3) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(4) var<storage, read_write> nodeChildren: array<u32>;
@group(0) @binding(5) var<storage, read_write> leafIds: array<u32>;
@group(0) @binding(6) var<storage, read_write> outputCount: array<u32>;
@group(0) @binding(7) var<storage, read_write> outputOverflow: array<u32>;

var<workgroup> sharedMinima: array<vec4<f32>, ${bvh.leafCapacity * 2}>;
var<workgroup> sharedMaxima: array<vec4<f32>, ${bvh.leafCapacity * 2}>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${bvh.leafCapacity}) fn main(
  @builtin(local_invocation_index) localIndex: u32
) {
  var minimum = vec4<f32>(3.402823466e+38);
  var maximum = vec4<f32>(-3.402823466e+38);
  let leafNode = INTERNAL_NODE_COUNT + localIndex;
  let leafComponent = leafNode * DIMENSION;
  let leafChildComponent = leafNode * 2u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent] = ${INVALID_NODE}u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent + 1u] = ${INVALID_NODE}u;
  leafIds[LEAF_IDS_OFFSET + localIndex] = ${INVALID_NODE}u;

  if (localIndex < STORED_COUNT) {
    let sourceComponent = localIndex * DIMENSION;
    var valid = true;
    for (var axis = 0u; axis < DIMENSION; axis++) {
      let sourceMinimum = sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
      let sourceMaximum = sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
      valid = valid && finite(sourceMinimum) && finite(sourceMaximum) &&
        sourceMinimum <= sourceMaximum;
    }
    leafIds[LEAF_IDS_OFFSET + localIndex] = localIndex;
    if (valid) {
      for (var axis = 0u; axis < DIMENSION; axis++) {
        minimum[axis] = sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
        maximum[axis] = sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
      }
    }
  }

  for (var axis = 0u; axis < DIMENSION; axis++) {
    nodeMinima[NODE_MINIMA_OFFSET + leafComponent + axis] = minimum[axis];
    nodeMaxima[NODE_MAXIMA_OFFSET + leafComponent + axis] = maximum[axis];
  }
  sharedMinima[localIndex] = minimum;
  sharedMaxima[localIndex] = maximum;

  if (localIndex < INTERNAL_NODE_COUNT) {
    let childComponent = localIndex * 2u;
    nodeChildren[CHILDREN_OFFSET + childComponent] = localIndex * 2u + 1u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = localIndex * 2u + 2u;
  }
  if (localIndex == 0u) {
    outputCount[COUNT_OFFSET] = SOURCE_COUNT;
    outputOverflow[OVERFLOW_OFFSET] = select(0u, 1u, SOURCE_COUNT > LEAF_CAPACITY);
  }
  workgroupBarrier();

  var sourceOffset = 0u;
  var destinationOffset = LEAF_CAPACITY;
  for (var levelNodeCount = LEAF_CAPACITY / 2u;
       levelNodeCount > 0u;
       levelNodeCount = levelNodeCount / 2u) {
    if (localIndex < levelNodeCount) {
      let firstChild = sourceOffset + localIndex * 2u;
      let reducedMinimum = min(sharedMinima[firstChild], sharedMinima[firstChild + 1u]);
      let reducedMaximum = max(sharedMaxima[firstChild], sharedMaxima[firstChild + 1u]);
      sharedMinima[destinationOffset + localIndex] = reducedMinimum;
      sharedMaxima[destinationOffset + localIndex] = reducedMaximum;

      let nodeIndex = levelNodeCount - 1u + localIndex;
      let nodeComponent = nodeIndex * DIMENSION;
      for (var axis = 0u; axis < DIMENSION; axis++) {
        nodeMinima[NODE_MINIMA_OFFSET + nodeComponent + axis] = reducedMinimum[axis];
        nodeMaxima[NODE_MAXIMA_OFFSET + nodeComponent + axis] = reducedMaximum[axis];
      }
    }
    workgroupBarrier();
    let previousSourceOffset = sourceOffset;
    sourceOffset = destinationOffset;
    destinationOffset = previousSourceOffset;
  }
}`;
  const resources: GraphBufferUse[] = [
    {buffer: bvh.minima, usage: 'storage-read'},
    {buffer: bvh.maxima, usage: 'storage-read'},
    {buffer: bvh.nodeMinima, usage: 'storage-write'},
    {buffer: bvh.nodeMaxima, usage: 'storage-write'},
    {buffer: bvh.nodeChildren, usage: 'storage-write'},
    {buffer: bvh.leafIds, usage: 'storage-write'},
    {buffer: bvh.count, usage: 'storage-write'},
    {buffer: bvh.overflow, usage: 'storage-write'}
  ];
  addComputationPass(graph, {
    id: `${bvh.id}-fused-refit`,
    source,
    resources,
    bindings: {
      sourceMinima: bvh.minima,
      sourceMaxima: bvh.maxima,
      nodeMinima: bvh.nodeMinima,
      nodeMaxima: bvh.nodeMaxima,
      nodeChildren: bvh.nodeChildren,
      leafIds: bvh.leafIds,
      outputCount: bvh.count,
      outputOverflow: bvh.overflow
    },
    dispatchCount: 1
  });
}

function addLoadLeavesPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  bvh: GPUBVH,
  dispatchLayout: GPUBVHDispatchLayout
): void {
  const source = /* wgsl */ `
const SOURCE_COUNT: u32 = ${bvh.minima.length}u;
const STORED_COUNT: u32 = ${Math.min(bvh.minima.length, bvh.leafCapacity)}u;
const LEAF_CAPACITY: u32 = ${bvh.leafCapacity}u;
const INTERNAL_NODE_COUNT: u32 = ${bvh.internalNodeCount}u;
const NODE_COUNT: u32 = ${bvh.nodeCount}u;
const DIMENSION: u32 = ${bvh.dimension}u;
const MINIMA_OFFSET: u32 = ${getViewElementOffset(bvh.minima)}u;
const MAXIMA_OFFSET: u32 = ${getViewElementOffset(bvh.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${getViewElementOffset(bvh.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${getViewElementOffset(bvh.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${getViewElementOffset(bvh.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${getViewElementOffset(bvh.leafIds)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(bvh.count)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(bvh.overflow)}u;
@group(0) @binding(0) var<storage, read> sourceMinima: array<f32>;
@group(0) @binding(1) var<storage, read> sourceMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(3) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(4) var<storage, read_write> nodeChildren: array<u32>;
@group(0) @binding(5) var<storage, read_write> leafIds: array<u32>;
@group(0) @binding(6) var<storage, read_write> outputCount: array<u32>;
@group(0) @binding(7) var<storage, read_write> outputOverflow: array<u32>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${BVH_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${dispatchLayout.y}u + workgroupId.y) * ${dispatchLayout.x}u + workgroupId.x;
  let nodeIndex = workgroupIndex * ${BVH_WORKGROUP_SIZE}u + localId.x;
  if (nodeIndex >= NODE_COUNT) { return; }
  let nodeComponent = nodeIndex * DIMENSION;
  for (var axis = 0u; axis < DIMENSION; axis++) {
    nodeMinima[NODE_MINIMA_OFFSET + nodeComponent + axis] = 3.402823466e+38;
    nodeMaxima[NODE_MAXIMA_OFFSET + nodeComponent + axis] = -3.402823466e+38;
  }
  let childComponent = nodeIndex * 2u;
  if (nodeIndex < INTERNAL_NODE_COUNT) {
    nodeChildren[CHILDREN_OFFSET + childComponent] = nodeIndex * 2u + 1u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = nodeIndex * 2u + 2u;
  } else {
    nodeChildren[CHILDREN_OFFSET + childComponent] = ${INVALID_NODE}u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = ${INVALID_NODE}u;
    let leafIndex = nodeIndex - INTERNAL_NODE_COUNT;
    leafIds[LEAF_IDS_OFFSET + leafIndex] = ${INVALID_NODE}u;
    if (leafIndex < STORED_COUNT) {
      var valid = true;
      let sourceComponent = leafIndex * DIMENSION;
      for (var axis = 0u; axis < DIMENSION; axis++) {
        let minimum = sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
        let maximum = sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
        valid = valid && finite(minimum) && finite(maximum) && minimum <= maximum;
      }
      leafIds[LEAF_IDS_OFFSET + leafIndex] = leafIndex;
      if (valid) {
        for (var axis = 0u; axis < DIMENSION; axis++) {
          nodeMinima[NODE_MINIMA_OFFSET + nodeComponent + axis] =
            sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
          nodeMaxima[NODE_MAXIMA_OFFSET + nodeComponent + axis] =
            sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
        }
      }
    }
  }
  if (nodeIndex == 0u) {
    outputCount[COUNT_OFFSET] = SOURCE_COUNT;
    outputOverflow[OVERFLOW_OFFSET] = select(0u, 1u, SOURCE_COUNT > LEAF_CAPACITY);
  }
}`;
  const resources: GraphBufferUse[] = [
    {buffer: bvh.minima, usage: 'storage-read'},
    {buffer: bvh.maxima, usage: 'storage-read'},
    {buffer: bvh.nodeMinima, usage: 'storage-write'},
    {buffer: bvh.nodeMaxima, usage: 'storage-write'},
    {buffer: bvh.nodeChildren, usage: 'storage-write'},
    {buffer: bvh.leafIds, usage: 'storage-write'},
    {buffer: bvh.count, usage: 'storage-write'},
    {buffer: bvh.overflow, usage: 'storage-write'}
  ];
  addComputationPass(graph, {
    id: `${bvh.id}-load-leaves`,
    source,
    resources,
    bindings: {
      sourceMinima: bvh.minima,
      sourceMaxima: bvh.maxima,
      nodeMinima: bvh.nodeMinima,
      nodeMaxima: bvh.nodeMaxima,
      nodeChildren: bvh.nodeChildren,
      leafIds: bvh.leafIds,
      outputCount: bvh.count,
      outputOverflow: bvh.overflow
    },
    dispatchSize: dispatchLayout
  });
}

/** Remaps published leaf indices without exceeding the eight-buffer CORE storage limit. */
function addRemapSourceIdsPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  bvh: GPUBVH,
  sourceIds: GraphDataView<'uint32'>
): void {
  const storedCount = Math.min(sourceIds.length, bvh.leafCapacity);
  const dispatchLayout = getGPUBVHDispatchLayout(
    storedCount,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const STORED_COUNT: u32 = ${storedCount}u;
const SOURCE_IDS_OFFSET: u32 = ${getViewElementOffset(sourceIds)}u;
const LEAF_IDS_OFFSET: u32 = ${getViewElementOffset(bvh.leafIds)}u;
@group(0) @binding(0) var<storage, read> sourceIds: array<u32>;
@group(0) @binding(1) var<storage, read_write> leafIds: array<u32>;

@compute @workgroup_size(${BVH_WORKGROUP_SIZE}) fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  let workgroupIndex = (workgroupId.z * ${dispatchLayout.y}u + workgroupId.y) * ${dispatchLayout.x}u + workgroupId.x;
  let leafIndex = workgroupIndex * ${BVH_WORKGROUP_SIZE}u + localId.x;
  if (leafIndex >= STORED_COUNT) { return; }
  let sourceIndex = leafIds[LEAF_IDS_OFFSET + leafIndex];
  if (sourceIndex == ${INVALID_NODE}u) { return; }
  leafIds[LEAF_IDS_OFFSET + leafIndex] = sourceIds[SOURCE_IDS_OFFSET + sourceIndex];
}`;
  addComputationPass(graph, {
    id: `${bvh.id}-remap-source-ids`,
    source,
    resources: [
      {buffer: sourceIds, usage: 'storage-read'},
      {buffer: bvh.leafIds, usage: 'storage-read-write'}
    ],
    bindings: {sourceIds, leafIds: bvh.leafIds},
    dispatchSize: dispatchLayout
  });
}

function addRefitLevelPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  bvh: GPUBVH,
  depth: number
): void {
  const firstNode = 2 ** depth - 1;
  const levelNodeCount = 2 ** depth;
  const source = /* wgsl */ `
const FIRST_NODE: u32 = ${firstNode}u;
const LEVEL_NODE_COUNT: u32 = ${levelNodeCount}u;
const DIMENSION: u32 = ${bvh.dimension}u;
const NODE_MINIMA_OFFSET: u32 = ${getViewElementOffset(bvh.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${getViewElementOffset(bvh.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${getViewElementOffset(bvh.nodeChildren)}u;
@group(0) @binding(0) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(1) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(2) var<storage, read> nodeChildren: array<u32>;

@compute @workgroup_size(${BVH_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  if (globalId.x >= LEVEL_NODE_COUNT) { return; }
  let nodeIndex = FIRST_NODE + globalId.x;
  let childComponent = nodeIndex * 2u;
  let left = nodeChildren[CHILDREN_OFFSET + childComponent];
  let right = nodeChildren[CHILDREN_OFFSET + childComponent + 1u];
  for (var axis = 0u; axis < DIMENSION; axis++) {
    nodeMinima[NODE_MINIMA_OFFSET + nodeIndex * DIMENSION + axis] = min(
      nodeMinima[NODE_MINIMA_OFFSET + left * DIMENSION + axis],
      nodeMinima[NODE_MINIMA_OFFSET + right * DIMENSION + axis]
    );
    nodeMaxima[NODE_MAXIMA_OFFSET + nodeIndex * DIMENSION + axis] = max(
      nodeMaxima[NODE_MAXIMA_OFFSET + left * DIMENSION + axis],
      nodeMaxima[NODE_MAXIMA_OFFSET + right * DIMENSION + axis]
    );
  }
}`;
  addComputationPass(graph, {
    id: `${bvh.id}-refit-depth-${depth}`,
    source,
    resources: [
      {buffer: bvh.nodeMinima, usage: 'storage-read-write'},
      {buffer: bvh.nodeMaxima, usage: 'storage-read-write'},
      {buffer: bvh.nodeChildren, usage: 'storage-read'}
    ],
    bindings: {
      nodeMinima: bvh.nodeMinima,
      nodeMaxima: bvh.nodeMaxima,
      nodeChildren: bvh.nodeChildren
    },
    dispatchCount: Math.ceil(levelNodeCount / BVH_WORKGROUP_SIZE)
  });
}

function addComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchCount?: number;
    dispatchSize?: GPUBVHDispatchLayout;
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: Object.keys(props.bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(bindings);
          if (props.dispatchSize) {
            computation.dispatch(
              computePass,
              props.dispatchSize.x,
              props.dispatchSize.y,
              props.dispatchSize.z
            );
          } else {
            computation.dispatch(computePass, props.dispatchCount!);
          }
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Plans a bounded 3D dispatch for BVH node initialization. @internal */
export function getGPUBVHDispatchLayout(
  nodeCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBVHDispatchLayout {
  const maximum = Math.floor(maxComputeWorkgroupsPerDimension);
  const workgroupCount = Math.max(1, Math.ceil(nodeCount / BVH_WORKGROUP_SIZE));
  const x = Math.min(workgroupCount, maximum);
  const y = Math.min(Math.ceil(workgroupCount / x), maximum);
  const z = Math.ceil(workgroupCount / x / y);
  if (z > maximum) {
    throw new Error(
      `GPUBVH requires ${workgroupCount} workgroups, exceeding the 3D dispatch limit of ${maximum} per dimension`
    );
  }
  return {x, y, z};
}

function isPowerOfTwo(value: number): boolean {
  return value > 0 && Number.isInteger(Math.log2(value));
}
