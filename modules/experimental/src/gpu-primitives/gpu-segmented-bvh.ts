// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {GPUBVHBoundsView} from './gpu-bvh';
import type {GPUCommandGraph, GraphDataView} from './gpu-command-graph';
import {getBoundedDispatchLayout, type GPUBoundedDispatchLayout} from './gpu-dispatch-utils';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';

const MAXIMUM_LEAF_CAPACITY = 128;
const WORKGROUP_BYTES_PER_LEAF = 64;
const INVALID_NODE = 0xffffffff;

/** One independent complete-binary hierarchy within eight caller-owned packed views. */
export type GPUBVHSegment = {
  /** First source-bound row, relative to both parent minimum and maximum views. */
  sourceOffset: number;
  /** Full source row count, including rows that exceed the reserved leaf capacity. */
  sourceCount: number;
  /** First hierarchy node, relative to all three parent node views. */
  nodeOffset: number;
  /** First reserved leaf identity, relative to the parent leaf identity view. */
  leafOffset: number;
  /** Destination row in both parent count and overflow views. */
  metadataOffset: number;
  /** Positive power-of-two number of reserved leaf slots, at most 128. */
  leafCapacity: number;
};

/** Properties for independently refitted packed two- or three-dimensional hierarchies. */
export type GPUSegmentedBVHProps = {
  /** Prefix for generated leaf-capacity graph nodes. */
  id?: string;
  /** Parent packed two- or three-dimensional source minima. */
  minima: GPUBVHBoundsView;
  /** Parent source maxima with the same format and length as `minima`. */
  maxima: GPUBVHBoundsView;
  /** Caller-owned packed hierarchy node minima. */
  nodeMinima: GPUBVHBoundsView;
  /** Caller-owned packed hierarchy node maxima. */
  nodeMaxima: GPUBVHBoundsView;
  /** Caller-owned packed complete-binary child pairs. */
  nodeChildren: GraphDataView<'uint32x2'>;
  /** Caller-owned packed segment-local leaf identities. */
  leafIds: GraphDataView<'uint32'>;
  /** Caller-owned full source counts, one row per independent hierarchy. */
  counts: GraphDataView<'uint32'>;
  /** Caller-owned capacity-overflow flags, one row per independent hierarchy. */
  overflows: GraphDataView<'uint32'>;
  /** CPU-known independent packed hierarchy descriptors. */
  segments: readonly GPUBVHSegment[];
};

/**
 * Builds and refits many small independent complete-binary hierarchies in shared packed storage.
 *
 * @remarks
 * Each hierarchy occupies one workgroup. Equal leaf capacities share one graph node and dispatch,
 * so arbitrarily many supported hierarchies require at most eight dispatches. Generated shaders
 * use exactly eight storage bindings and no adapter feature beyond standard CORE WebGPU limits.
 */
export class GPUSegmentedBVH {
  /** Prefix for generated leaf-capacity graph nodes. */
  readonly id: string;
  /** Parent packed source minima. */
  readonly minima: GPUBVHBoundsView;
  /** Parent packed source maxima. */
  readonly maxima: GPUBVHBoundsView;
  /** Caller-owned packed hierarchy node minima. */
  readonly nodeMinima: GPUBVHBoundsView;
  /** Caller-owned packed hierarchy node maxima. */
  readonly nodeMaxima: GPUBVHBoundsView;
  /** Caller-owned packed complete-binary child pairs. */
  readonly nodeChildren: GraphDataView<'uint32x2'>;
  /** Caller-owned packed segment-local leaf identities. */
  readonly leafIds: GraphDataView<'uint32'>;
  /** Caller-owned full source counts. */
  readonly counts: GraphDataView<'uint32'>;
  /** Caller-owned capacity-overflow flags. */
  readonly overflows: GraphDataView<'uint32'>;
  /** Immutable snapshot of independent packed hierarchy descriptors. */
  readonly segments: readonly GPUBVHSegment[];
  /** Number of packed scalar components per source and node bound. */
  readonly dimension: 2 | 3;
  /** Layout of every independently allocated hierarchy. */
  readonly topology = 'complete-binary' as const;
  /** Every graph encoding reloads source leaves and reduces the fixed hierarchy. */
  readonly updatePolicy = 'refit' as const;

  /** Creates and validates independent packed hierarchy domains. */
  constructor(props: GPUSegmentedBVHProps) {
    this.id = props.id ?? 'gpu-segmented-bvh';
    this.minima = props.minima;
    this.maxima = props.maxima;
    this.nodeMinima = props.nodeMinima;
    this.nodeMaxima = props.nodeMaxima;
    this.nodeChildren = props.nodeChildren;
    this.leafIds = props.leafIds;
    this.counts = props.counts;
    this.overflows = props.overflows;
    this.dimension = this.minima.format === 'float32x2' ? 2 : 3;

    validatePackedView(this.minima, ['float32x2', 'float32x3'], `${this.id} minima`);
    validatePackedView(this.maxima, ['float32x2', 'float32x3'], `${this.id} maxima`);
    validatePackedView(this.nodeMinima, ['float32x2', 'float32x3'], `${this.id} nodeMinima`);
    validatePackedView(this.nodeMaxima, ['float32x2', 'float32x3'], `${this.id} nodeMaxima`);
    validatePackedView(this.nodeChildren, ['uint32x2'], `${this.id} nodeChildren`);
    validatePackedUint32View(this.leafIds, `${this.id} leafIds`);
    validatePackedUint32View(this.counts, `${this.id} counts`);
    validatePackedUint32View(this.overflows, `${this.id} overflows`);

    if (this.minima.format !== this.maxima.format || this.minima.length !== this.maxima.length) {
      throw new Error(`${this.id} minima and maxima must have matching formats and lengths`);
    }
    if (
      this.nodeMinima.format !== this.minima.format ||
      this.nodeMaxima.format !== this.minima.format ||
      this.nodeMinima.length !== this.nodeMaxima.length ||
      this.nodeMinima.length !== this.nodeChildren.length
    ) {
      throw new Error(`${this.id} node views must have matching formats and lengths`);
    }
    if (this.counts.length !== this.overflows.length) {
      throw new Error(`${this.id} counts and overflows must have matching lengths`);
    }

    const inputs = [this.minima, this.maxima];
    const outputs = [
      this.nodeMinima,
      this.nodeMaxima,
      this.nodeChildren,
      this.leafIds,
      this.counts,
      this.overflows
    ];
    for (const [outputIndex, output] of outputs.entries()) {
      if (
        inputs.some(input => input.buffer === output.buffer) ||
        outputs.slice(0, outputIndex).some(previous => previous.buffer === output.buffer)
      ) {
        throw new Error(`${this.id} outputs must use separate buffers from inputs and each other`);
      }
    }

    this.segments = props.segments.map((segment, segmentIndex) =>
      validateSegment(this, segment, segmentIndex)
    );
    validateDisjointRanges(this.segments, 'nodeOffset', segment => segment.leafCapacity * 2 - 1);
    validateDisjointRanges(this.segments, 'leafOffset', segment => segment.leafCapacity);
    validateDisjointRanges(this.segments, 'metadataOffset', () => 1);
  }

  /** Records one CORE-compatible complete hierarchy pass for each occupied leaf-capacity bucket. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    addGPUSegmentedBVHToGraphWithDispatchLimit(
      this,
      graph,
      graph.device.limits.maxComputeWorkgroupsPerDimension
    );
  }
}

/** Adds packed hierarchy work while propagating a bounded 3D dispatch limit. @internal */
export function addGPUSegmentedBVHToGraphWithDispatchLimit<Parameters>(
  hierarchy: GPUSegmentedBVH,
  graph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  for (const view of [
    hierarchy.minima,
    hierarchy.maxima,
    hierarchy.nodeMinima,
    hierarchy.nodeMaxima,
    hierarchy.nodeChildren,
    hierarchy.leafIds,
    hierarchy.counts,
    hierarchy.overflows
  ]) {
    if (view.buffer.graph !== graph) {
      throw new Error(`${hierarchy.id} views must belong to the target graph`);
    }
  }

  const groups = groupSegmentsByLeafCapacity(hierarchy.segments);
  const plans = Array.from(groups, ([leafCapacity, segments]) => {
    // The generic planner validates workgroup sizes >= 2, but one-lane BVHs remain legal WGSL.
    const dispatchPlanningWidth = Math.max(2, leafCapacity);
    return {
      leafCapacity,
      segments,
      dispatchLayout: getBoundedDispatchLayout(
        `${hierarchy.id} ${leafCapacity}-leaf hierarchies`,
        segments.length * dispatchPlanningWidth,
        dispatchPlanningWidth,
        maxComputeWorkgroupsPerDimension
      )
    };
  });

  for (const plan of plans) {
    addHierarchyBucketPass(graph, hierarchy, plan.leafCapacity, plan.segments, plan.dispatchLayout);
  }
}

/** Validates and snapshots one hierarchy against its corresponding packed parent domains. */
function validateSegment(
  hierarchy: GPUSegmentedBVH,
  segment: GPUBVHSegment,
  segmentIndex: number
): GPUBVHSegment {
  const name = `${hierarchy.id} segment ${segmentIndex}`;
  if (
    !Number.isSafeInteger(segment.leafCapacity) ||
    segment.leafCapacity < 1 ||
    segment.leafCapacity > MAXIMUM_LEAF_CAPACITY ||
    (segment.leafCapacity & (segment.leafCapacity - 1)) !== 0
  ) {
    throw new Error(`${name} leafCapacity must be a positive power of two from 1 through 128`);
  }
  const limits = (hierarchy.minima.buffer.graph as GPUCommandGraph).device.limits;
  if (
    segment.leafCapacity > limits.maxComputeInvocationsPerWorkgroup ||
    segment.leafCapacity > limits.maxComputeWorkgroupSizeX ||
    segment.leafCapacity * WORKGROUP_BYTES_PER_LEAF > limits.maxComputeWorkgroupStorageSize
  ) {
    throw new Error(`${name} leafCapacity exceeds portable single-workgroup limits`);
  }

  for (const field of [
    'sourceOffset',
    'sourceCount',
    'nodeOffset',
    'leafOffset',
    'metadataOffset'
  ] as const) {
    const value = segment[field];
    if (!Number.isSafeInteger(value) || value < 0 || value > INVALID_NODE) {
      throw new Error(`${name} ${field} must be a non-negative uint32`);
    }
  }

  validateRange(
    name,
    'sourceOffset',
    segment.sourceOffset,
    segment.sourceCount,
    hierarchy.minima.length
  );
  validateRange(
    name,
    'nodeOffset',
    segment.nodeOffset,
    segment.leafCapacity * 2 - 1,
    hierarchy.nodeMinima.length
  );
  validateRange(
    name,
    'leafOffset',
    segment.leafOffset,
    segment.leafCapacity,
    hierarchy.leafIds.length
  );
  validateRange(name, 'metadataOffset', segment.metadataOffset, 1, hierarchy.counts.length);

  return {
    sourceOffset: segment.sourceOffset,
    sourceCount: segment.sourceCount,
    nodeOffset: segment.nodeOffset,
    leafOffset: segment.leafOffset,
    metadataOffset: segment.metadataOffset,
    leafCapacity: segment.leafCapacity
  };
}

/** Confirms that every required logical row belongs to its caller-owned parent view. */
function validateRange(
  name: string,
  field: string,
  offset: number,
  length: number,
  capacity: number
): void {
  if (offset > capacity || length > capacity - offset) {
    throw new Error(`${name} ${field} and required rows exceed the parent view`);
  }
}

/** Rejects distinct hierarchies that publish to the same caller-owned output rows. */
function validateDisjointRanges(
  segments: readonly GPUBVHSegment[],
  field: 'nodeOffset' | 'leafOffset' | 'metadataOffset',
  getLength: (segment: GPUBVHSegment) => number
): void {
  const sortedSegments = segments.slice().sort((first, second) => first[field] - second[field]);
  for (let index = 1; index < sortedSegments.length; index++) {
    const previous = sortedSegments[index - 1];
    const current = sortedSegments[index];
    if (current[field] < previous[field] + getLength(previous)) {
      throw new Error(`GPUSegmentedBVH ${field} ranges must not overlap`);
    }
  }
}

/** Returns deterministic workgroup-width buckets, including empty singleton hierarchies. */
function groupSegmentsByLeafCapacity(
  segments: readonly GPUBVHSegment[]
): Map<number, GPUBVHSegment[]> {
  const groups = new Map<number, GPUBVHSegment[]>();
  for (const segment of segments) {
    const group = groups.get(segment.leafCapacity);
    if (group) {
      group.push(segment);
    } else {
      groups.set(segment.leafCapacity, [segment]);
    }
  }
  return new Map(
    Array.from(groups).sort(([firstCapacity], [secondCapacity]) => firstCapacity - secondCapacity)
  );
}

/** Records all equally sized complete-binary hierarchies in one CORE-compatible graph node. */
function addHierarchyBucketPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  hierarchy: GPUSegmentedBVH,
  leafCapacity: number,
  segments: readonly GPUBVHSegment[],
  dispatchLayout: GPUBoundedDispatchLayout
): void {
  const descriptorSource = segments
    .map(
      segment =>
        `  BVHSegment(${segment.sourceOffset}u, ${segment.sourceCount}u, ` +
        `${segment.nodeOffset}u, ${segment.leafOffset}u, ${segment.metadataOffset}u)`
    )
    .join(',\n');
  const source = /* wgsl */ `
struct BVHSegment {
  sourceOffset: u32,
  sourceCount: u32,
  nodeOffset: u32,
  leafOffset: u32,
  metadataOffset: u32,
};

const SEGMENT_COUNT: u32 = ${segments.length}u;
const LEAF_CAPACITY: u32 = ${leafCapacity}u;
const INTERNAL_NODE_COUNT: u32 = ${leafCapacity - 1}u;
const DIMENSION: u32 = ${hierarchy.dimension}u;
const MINIMA_OFFSET: u32 = ${getViewElementOffset(hierarchy.minima)}u;
const MAXIMA_OFFSET: u32 = ${getViewElementOffset(hierarchy.maxima)}u;
const NODE_MINIMA_OFFSET: u32 = ${getViewElementOffset(hierarchy.nodeMinima)}u;
const NODE_MAXIMA_OFFSET: u32 = ${getViewElementOffset(hierarchy.nodeMaxima)}u;
const CHILDREN_OFFSET: u32 = ${getViewElementOffset(hierarchy.nodeChildren)}u;
const LEAF_IDS_OFFSET: u32 = ${getViewElementOffset(hierarchy.leafIds)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(hierarchy.counts)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(hierarchy.overflows)}u;
const SEGMENTS: array<BVHSegment, ${segments.length}> = array<BVHSegment, ${segments.length}>(
${descriptorSource}
);

@group(0) @binding(0) var<storage, read> sourceMinima: array<f32>;
@group(0) @binding(1) var<storage, read> sourceMaxima: array<f32>;
@group(0) @binding(2) var<storage, read_write> nodeMinima: array<f32>;
@group(0) @binding(3) var<storage, read_write> nodeMaxima: array<f32>;
@group(0) @binding(4) var<storage, read_write> nodeChildren: array<u32>;
@group(0) @binding(5) var<storage, read_write> leafIds: array<u32>;
@group(0) @binding(6) var<storage, read_write> outputCounts: array<u32>;
@group(0) @binding(7) var<storage, read_write> outputOverflows: array<u32>;

var<workgroup> sharedMinima: array<vec4<f32>, ${leafCapacity * 2}>;
var<workgroup> sharedMaxima: array<vec4<f32>, ${leafCapacity * 2}>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

@compute @workgroup_size(${leafCapacity}) fn main(
  @builtin(local_invocation_index) localIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let segmentIndex =
    (workgroupId.z * ${dispatchLayout.y}u + workgroupId.y) * ${dispatchLayout.x}u + workgroupId.x;
  if (segmentIndex >= SEGMENT_COUNT) { return; }
  let segment = SEGMENTS[segmentIndex];
  let storedCount = min(segment.sourceCount, LEAF_CAPACITY);
  var minimum = vec4<f32>(3.402823466e+38);
  var maximum = vec4<f32>(-3.402823466e+38);
  let localLeafNode = INTERNAL_NODE_COUNT + localIndex;
  let globalLeafNode = segment.nodeOffset + localLeafNode;
  let leafComponent = globalLeafNode * DIMENSION;
  let leafChildComponent = globalLeafNode * 2u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent] = ${INVALID_NODE}u;
  nodeChildren[CHILDREN_OFFSET + leafChildComponent + 1u] = ${INVALID_NODE}u;
  leafIds[LEAF_IDS_OFFSET + segment.leafOffset + localIndex] = ${INVALID_NODE}u;

  if (localIndex < storedCount) {
    let sourceComponent = (segment.sourceOffset + localIndex) * DIMENSION;
    var valid = true;
    for (var axis = 0u; axis < DIMENSION; axis++) {
      let sourceMinimum = sourceMinima[MINIMA_OFFSET + sourceComponent + axis];
      let sourceMaximum = sourceMaxima[MAXIMA_OFFSET + sourceComponent + axis];
      valid = valid && finite(sourceMinimum) && finite(sourceMaximum) &&
        sourceMinimum <= sourceMaximum;
    }
    leafIds[LEAF_IDS_OFFSET + segment.leafOffset + localIndex] = localIndex;
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
    let childComponent = (segment.nodeOffset + localIndex) * 2u;
    nodeChildren[CHILDREN_OFFSET + childComponent] = localIndex * 2u + 1u;
    nodeChildren[CHILDREN_OFFSET + childComponent + 1u] = localIndex * 2u + 2u;
  }
  if (localIndex == 0u) {
    outputCounts[COUNT_OFFSET + segment.metadataOffset] = segment.sourceCount;
    outputOverflows[OVERFLOW_OFFSET + segment.metadataOffset] =
      select(0u, 1u, segment.sourceCount > LEAF_CAPACITY);
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

      let nodeIndex = segment.nodeOffset + levelNodeCount - 1u + localIndex;
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
  const identifier = `${hierarchy.id}-fused-refit-${leafCapacity}`;
  const bindingViews: Record<string, GraphDataView> = {
    sourceMinima: hierarchy.minima,
    sourceMaxima: hierarchy.maxima,
    nodeMinima: hierarchy.nodeMinima,
    nodeMaxima: hierarchy.nodeMaxima,
    nodeChildren: hierarchy.nodeChildren,
    leafIds: hierarchy.leafIds,
    outputCounts: hierarchy.counts,
    outputOverflows: hierarchy.overflows
  };
  graph.addComputePass({
    id: identifier,
    resources: [
      {buffer: hierarchy.minima, usage: 'storage-read'},
      {buffer: hierarchy.maxima, usage: 'storage-read'},
      {buffer: hierarchy.nodeMinima, usage: 'storage-write'},
      {buffer: hierarchy.nodeMaxima, usage: 'storage-write'},
      {buffer: hierarchy.nodeChildren, usage: 'storage-write'},
      {buffer: hierarchy.leafIds, usage: 'storage-write'},
      {buffer: hierarchy.counts, usage: 'storage-write'},
      {buffer: hierarchy.overflows, usage: 'storage-write'}
    ],
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: identifier,
        source,
        shaderLayout: {
          bindings: Object.keys(bindingViews).map((name, location) => ({
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
          for (const [name, view] of Object.entries(bindingViews)) {
            bindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
