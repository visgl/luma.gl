// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {
  GPUCommandGraph,
  type GPUCommandGraphContributor,
  type GraphBufferUse,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource,
  type GPUBoundedDispatchLayout
} from '@luma.gl/gpgpu/gpu-core';
import {
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View
} from '@luma.gl/gpgpu/gpu-core';

const RANGE_MAXIMUM_WORKGROUP_SIZE = 256;
const INVALID_INDEX = 0xffffffff;

/** Invalid lane offsets or a lane longer than the reserved leaf capacity. */
export const GPU_TRACE_RANGE_MAXIMUM_INVALID_RANGE = 1;
/** A negative or non-finite indexed duration. */
export const GPU_TRACE_RANGE_MAXIMUM_INVALID_DURATION = 2;
/** A secondary-index row points outside the source columns. */
export const GPU_TRACE_RANGE_MAXIMUM_INVALID_ROW = 4;

/** Properties for a persistent lane-segmented maximum-duration index. */
export type GPUTraceRangeMaximumIndexBuilderProps = {
  id?: string;
  /** Scalar durations, directly ordered or addressed by rowOrder. */
  durations: GraphDataView<'float32'>;
  /** Canonical span IDs in the same source-row order as durations. */
  spanIds: GraphDataView<'uint32'>;
  /** Optional packed lane/time-ordered row indices into durations and spanIds. */
  rowOrder?: GraphDataView<'uint32'>;
  /** Lane offsets with a trailing sentinel. */
  laneOffsets: GraphDataView<'uint32'>;
  /** Power-of-two leaf capacity reserved independently for every lane. */
  leafCapacity: number;
  /** Segment-major binary heaps, each containing `2 * leafCapacity` index words. */
  output: GraphDataView<'uint32'>;
  /** One validation word. */
  validationErrors: GraphDataView<'uint32'>;
};

/** Immutable capacity and build-pass information. */
export type GPUTraceRangeMaximumIndexBuilderStats = {
  spanCount: number;
  laneCount: number;
  leafCapacity: number;
  treeStride: number;
  treeWordCount: number;
  levelCount: number;
};

/**
 * Builds a persistent segment tree selecting the longest span in any lane-local index range.
 *
 * Tree nodes store secondary-index positions, not copied durations or replacement identities.
 * Comparisons read the indexed duration and break ties by canonical span ID. Construction uses one
 * initialization pass and one dependency-ordered pass per binary-tree level. It belongs in a
 * source-update graph and can be spread across frames with graph execution budgets.
 */
export class GPUTraceRangeMaximumIndexBuilder implements GPUCommandGraphContributor {
  readonly id: string;
  readonly props: GPUTraceRangeMaximumIndexBuilderProps;
  readonly stats: Readonly<GPUTraceRangeMaximumIndexBuilderStats>;

  constructor(props: GPUTraceRangeMaximumIndexBuilderProps) {
    this.id = props.id ?? 'gpu-trace-range-maximum-index-builder';
    this.props = props;
    this.stats = Object.freeze(validateBuilder(this.id, props));
  }

  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const {props, stats} = this;
    const views = [
      props.durations,
      props.spanIds,
      ...(props.rowOrder ? [props.rowOrder] : []),
      props.laneOffsets,
      props.output,
      props.validationErrors
    ];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    addValidationClearPass(graph, this);
    addLeafInitializationPass(graph, this);
    for (let levelWidth = stats.leafCapacity / 2; levelWidth >= 1; levelWidth /= 2) {
      addLevelPass(graph, this, levelWidth);
    }
  }
}

function validateBuilder(
  id: string,
  props: GPUTraceRangeMaximumIndexBuilderProps
): GPUTraceRangeMaximumIndexBuilderStats {
  validateScalarView(props.durations, 'float32', `${id} durations`);
  validateScalarView(props.spanIds, 'uint32', `${id} spanIds`);
  if (props.rowOrder) {
    validatePackedUint32View(props.rowOrder, `${id} rowOrder`);
  }
  validatePackedUint32View(props.laneOffsets, `${id} laneOffsets`);
  validatePackedUint32View(props.output, `${id} output`);
  validatePackedUint32View(props.validationErrors, `${id} validationErrors`);
  if (props.spanIds.length !== props.durations.length) {
    throw new Error(`${id} durations and spanIds must have matching lengths`);
  }
  if (props.laneOffsets.length < 2) {
    throw new Error(`${id} laneOffsets must contain at least one lane and sentinel`);
  }
  if (
    !Number.isSafeInteger(props.leafCapacity) ||
    props.leafCapacity < 1 ||
    props.leafCapacity > 0x40000000 ||
    !Number.isInteger(Math.log2(props.leafCapacity))
  ) {
    throw new Error(`${id} leafCapacity must be a positive power of two`);
  }
  if (props.validationErrors.length !== 1) {
    throw new Error(`${id} validationErrors must contain one uint32`);
  }
  const laneCount = props.laneOffsets.length - 1;
  const treeStride = props.leafCapacity * 2;
  const treeWordCount = laneCount * treeStride;
  if (!Number.isSafeInteger(treeWordCount) || props.output.length !== treeWordCount) {
    throw new Error(`${id} output must contain laneCount * 2 * leafCapacity words`);
  }
  const sources = [
    props.durations,
    props.spanIds,
    ...(props.rowOrder ? [props.rowOrder] : []),
    props.laneOffsets
  ];
  if (
    sources.some(view => view.buffer === props.output.buffer) ||
    sources.some(view => view.buffer === props.validationErrors.buffer) ||
    props.output.buffer === props.validationErrors.buffer
  ) {
    throw new Error(`${id} sources, output, and validationErrors must use separate buffers`);
  }
  return {
    spanCount: props.rowOrder?.length ?? props.durations.length,
    laneCount,
    leafCapacity: props.leafCapacity,
    treeStride,
    treeWordCount,
    levelCount: Math.log2(props.leafCapacity) + 1
  };
}

function addValidationClearPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  builder: GPUTraceRangeMaximumIndexBuilder
): void {
  const {props, id} = builder;
  const source = /* wgsl */ `
const ERROR_OFFSET: u32 = ${getViewElementOffset(props.validationErrors)}u;
@group(0) @binding(0) var<storage, read_write> validationErrors: array<u32>;
@compute @workgroup_size(1) fn main() { validationErrors[ERROR_OFFSET] = 0u; }`;
  addComputationPass(graph, {
    id: `${id}-clear-validation`,
    source,
    dispatch: {x: 1, y: 1, z: 1},
    workgroupSize: 1,
    bindings: {validationErrors: props.validationErrors},
    resources: [{buffer: props.validationErrors, usage: 'storage-write'}]
  });
}

function addLeafInitializationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  builder: GPUTraceRangeMaximumIndexBuilder
): void {
  const {props, stats, id} = builder;
  const jobCount = stats.laneCount * stats.leafCapacity;
  const dispatch = getDispatch(graph, `${id}-initialize`, jobCount);
  const durationStride = props.durations.byteStride / Uint32Array.BYTES_PER_ELEMENT;
  const orderDeclaration = props.rowOrder
    ? '@group(0) @binding(1) var<storage, read> rowOrder: array<u32>;'
    : '';
  const laneBinding = props.rowOrder ? 2 : 1;
  const treeBinding = laneBinding + 1;
  const errorBinding = laneBinding + 2;
  const rowRead = props.rowOrder
    ? 'let row = rowOrder[ORDER_OFFSET + candidate];'
    : 'let row = candidate;';
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${stats.spanCount}u;
const SOURCE_SPAN_COUNT: u32 = ${props.durations.length}u;
const LANE_COUNT: u32 = ${stats.laneCount}u;
const LEAF_CAPACITY: u32 = ${stats.leafCapacity}u;
const TREE_STRIDE: u32 = ${stats.treeStride}u;
const JOB_COUNT: u32 = ${jobCount}u;
const DURATION_OFFSET: u32 = ${getViewElementOffset(props.durations)}u;
const DURATION_STRIDE: u32 = ${durationStride}u;
const ORDER_OFFSET: u32 = ${props.rowOrder ? getViewElementOffset(props.rowOrder) : 0}u;
const LANE_OFFSET: u32 = ${getViewElementOffset(props.laneOffsets)}u;
const TREE_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
const ERROR_OFFSET: u32 = ${getViewElementOffset(props.validationErrors)}u;
@group(0) @binding(0) var<storage, read> durations: array<f32>;
${orderDeclaration}
@group(0) @binding(${laneBinding}) var<storage, read> laneOffsets: array<u32>;
@group(0) @binding(${treeBinding}) var<storage, read_write> tree: array<u32>;
@group(0) @binding(${errorBinding}) var<storage, read_write> validationErrors: array<atomic<u32>>;
@compute @workgroup_size(${RANGE_MAXIMUM_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, RANGE_MAXIMUM_WORKGROUP_SIZE)}
  if (index >= JOB_COUNT) { return; }
  let lane = index / LEAF_CAPACITY;
  let localIndex = index % LEAF_CAPACITY;
  let laneStart = laneOffsets[LANE_OFFSET + lane];
  let laneEnd = laneOffsets[LANE_OFFSET + lane + 1u];
  let validRange = lane < LANE_COUNT && laneStart <= laneEnd && laneEnd <= SPAN_COUNT &&
    laneEnd - laneStart <= LEAF_CAPACITY;
  var position = ${INVALID_INDEX}u;
  if (validRange && localIndex < laneEnd - laneStart) {
    let candidate = laneStart + localIndex;
    ${rowRead}
    if (row < SOURCE_SPAN_COUNT) {
      let duration = durations[DURATION_OFFSET + row * DURATION_STRIDE];
      let validDuration = duration == duration && abs(duration) <= 3.402823466e+38 &&
        duration >= 0.0;
      position = select(${INVALID_INDEX}u, candidate, validDuration);
      if (!validDuration) {
        atomicOr(&validationErrors[ERROR_OFFSET], ${GPU_TRACE_RANGE_MAXIMUM_INVALID_DURATION}u);
      }
    } else {
      atomicOr(&validationErrors[ERROR_OFFSET], ${GPU_TRACE_RANGE_MAXIMUM_INVALID_ROW}u);
    }
  }
  if (!validRange) {
    atomicOr(&validationErrors[ERROR_OFFSET], ${GPU_TRACE_RANGE_MAXIMUM_INVALID_RANGE}u);
  }
  tree[TREE_OFFSET + lane * TREE_STRIDE + LEAF_CAPACITY + localIndex] = position;
}`;
  addComputationPass(graph, {
    id: `${id}-initialize`,
    source,
    dispatch,
    workgroupSize: RANGE_MAXIMUM_WORKGROUP_SIZE,
    bindings: {
      durations: props.durations,
      ...(props.rowOrder ? {rowOrder: props.rowOrder} : {}),
      laneOffsets: props.laneOffsets,
      tree: props.output,
      validationErrors: props.validationErrors
    },
    resources: [
      {buffer: props.durations, usage: 'storage-read'},
      ...(props.rowOrder ? [{buffer: props.rowOrder, usage: 'storage-read' as const}] : []),
      {buffer: props.laneOffsets, usage: 'storage-read'},
      {buffer: props.output, usage: 'storage-write'},
      {buffer: props.validationErrors, usage: 'storage-read-write'}
    ]
  });
}

function addLevelPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  builder: GPUTraceRangeMaximumIndexBuilder,
  levelWidth: number
): void {
  const {props, stats, id} = builder;
  const jobCount = stats.laneCount * levelWidth;
  const dispatch = getDispatch(graph, `${id}-level-${levelWidth}`, jobCount);
  const durationStride = props.durations.byteStride / Uint32Array.BYTES_PER_ELEMENT;
  const spanIdStride = props.spanIds.byteStride / Uint32Array.BYTES_PER_ELEMENT;
  const orderDeclaration = props.rowOrder
    ? '@group(0) @binding(2) var<storage, read> rowOrder: array<u32>;'
    : '';
  const treeBinding = props.rowOrder ? 3 : 2;
  const leftRow = props.rowOrder
    ? 'let leftRow = rowOrder[ORDER_OFFSET + left];'
    : 'let leftRow = left;';
  const rightRow = props.rowOrder
    ? 'let rightRow = rowOrder[ORDER_OFFSET + right];'
    : 'let rightRow = right;';
  const source = /* wgsl */ `
const LANE_COUNT: u32 = ${stats.laneCount}u;
const TREE_STRIDE: u32 = ${stats.treeStride}u;
const LEVEL_WIDTH: u32 = ${levelWidth}u;
const JOB_COUNT: u32 = ${jobCount}u;
const DURATION_OFFSET: u32 = ${getViewElementOffset(props.durations)}u;
const DURATION_STRIDE: u32 = ${durationStride}u;
const SPAN_ID_OFFSET: u32 = ${getViewElementOffset(props.spanIds)}u;
const SPAN_ID_STRIDE: u32 = ${spanIdStride}u;
const ORDER_OFFSET: u32 = ${props.rowOrder ? getViewElementOffset(props.rowOrder) : 0}u;
const TREE_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
@group(0) @binding(0) var<storage, read> durations: array<f32>;
@group(0) @binding(1) var<storage, read> spanIds: array<u32>;
${orderDeclaration}
@group(0) @binding(${treeBinding}) var<storage, read_write> tree: array<u32>;

fn chooseLongest(left: u32, right: u32) -> u32 {
  if (left == ${INVALID_INDEX}u) { return right; }
  if (right == ${INVALID_INDEX}u) { return left; }
  ${leftRow}
  ${rightRow}
  let leftDuration = durations[DURATION_OFFSET + leftRow * DURATION_STRIDE];
  let rightDuration = durations[DURATION_OFFSET + rightRow * DURATION_STRIDE];
  let leftId = spanIds[SPAN_ID_OFFSET + leftRow * SPAN_ID_STRIDE];
  let rightId = spanIds[SPAN_ID_OFFSET + rightRow * SPAN_ID_STRIDE];
  return select(left, right, rightDuration > leftDuration ||
    (rightDuration == leftDuration && rightId < leftId));
}

@compute @workgroup_size(${RANGE_MAXIMUM_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, RANGE_MAXIMUM_WORKGROUP_SIZE)}
  if (index >= JOB_COUNT) { return; }
  let lane = index / LEVEL_WIDTH;
  let localIndex = index % LEVEL_WIDTH;
  if (lane >= LANE_COUNT) { return; }
  let treeBase = TREE_OFFSET + lane * TREE_STRIDE;
  let node = LEVEL_WIDTH + localIndex;
  tree[treeBase + node] = chooseLongest(tree[treeBase + node * 2u], tree[treeBase + node * 2u + 1u]);
}`;
  addComputationPass(graph, {
    id: `${id}-level-${levelWidth}`,
    source,
    dispatch,
    workgroupSize: RANGE_MAXIMUM_WORKGROUP_SIZE,
    bindings: {
      durations: props.durations,
      spanIds: props.spanIds,
      ...(props.rowOrder ? {rowOrder: props.rowOrder} : {}),
      tree: props.output
    },
    resources: [
      {buffer: props.durations, usage: 'storage-read'},
      {buffer: props.spanIds, usage: 'storage-read'},
      ...(props.rowOrder ? [{buffer: props.rowOrder, usage: 'storage-read' as const}] : []),
      {buffer: props.output, usage: 'storage-read-write'}
    ]
  });
}

function validateScalarView(view: GraphDataView, format: 'float32' | 'uint32', name: string): void {
  if (
    view.format !== format ||
    view.rowByteLength !== Uint32Array.BYTES_PER_ELEMENT ||
    view.byteStride < Uint32Array.BYTES_PER_ELEMENT ||
    view.byteStride % Uint32Array.BYTES_PER_ELEMENT !== 0 ||
    view.byteOffset % Uint32Array.BYTES_PER_ELEMENT !== 0
  ) {
    throw new Error(`${name} must be uint32-aligned scalar GPU data`);
  }
}

function getDispatch<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  id: string,
  jobCount: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    id,
    jobCount,
    RANGE_MAXIMUM_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
}

function addComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    dispatch: GPUBoundedDispatchLayout;
    workgroupSize: number;
    bindings: Record<string, GraphDataView>;
    resources: GraphBufferUse[];
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    workload: {
      operation: 'GPUTraceRangeMaximumIndexBuilder',
      commandCount: 1,
      maximumWorkgroupCount: props.dispatch.x * props.dispatch.y * props.dispatch.z,
      maximumInvocationCount:
        props.dispatch.x * props.dispatch.y * props.dispatch.z * props.workgroupSize
    },
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
          computation.dispatch(computePass, props.dispatch.x, props.dispatch.y, props.dispatch.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
