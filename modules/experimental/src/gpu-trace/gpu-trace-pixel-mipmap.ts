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
  createTransientView,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUTraceMipmapBoundaries,
  type GPUTraceMipmapBoundaryQuery
} from './gpu-trace-mipmap-boundaries';

const PIXEL_MIPMAP_WORKGROUP_SIZE = 256;
const INVALID_SPAN_ID = 0xffffffff;

/** Persistent lane/time-ordered secondary columns consumed by {@link GPUTracePixelMipmap}. */
export type GPUTracePixelMipmapIndex = {
  startTimes: GraphDataView<'float32'>;
  durations: GraphDataView<'float32'>;
  spanIds: GraphDataView<'uint32'>;
  /** Optional packed lane/time-ordered row indices into the three source columns. */
  rowOrder?: GraphDataView<'uint32'>;
  laneOffsets: GraphDataView<'uint32'>;
  /** Optional segment-major range-maximum heaps built by GPUTraceRangeMaximumIndexBuilder. */
  maximumDurationTree?: GraphDataView<'uint32'>;
  /** Power-of-two leaf capacity used to build maximumDurationTree. */
  maximumDurationLeafCapacity?: number;
};

/** Properties for one viewport-dependent longest-span-per-pixel selection. */
export type GPUTracePixelMipmapProps = {
  id?: string;
  index: GPUTracePixelMipmapIndex;
  query: GPUTraceMipmapBoundaryQuery;
  maximumPixelCount: number;
  boundariesPerTile?: number;
  /** Optional source-row bitset. Filtered rows cannot become representatives. */
  selectionMask?: GraphDataView<'uint32'>;
  /** Segment-major canonical span IDs, with `maximumPixelCount` rows per lane. */
  output: GraphDataView<'uint32'>;
  /** Validation shared by boundary generation and representative selection. */
  validationErrors: GraphDataView<'uint32'>;
};

/** Fixed selection capacity and dispatch information. */
export type GPUTracePixelMipmapStats = {
  laneCount: number;
  sourceSpanCount: number;
  /** Number of directly or indirectly ordered span positions searched by pixel boundaries. */
  orderedSpanCount: number;
  maximumPixelCount: number;
  maximumRepresentativeCount: number;
  rangeMaximumAccelerated: boolean;
  maximumDurationLeafCapacity: number;
};

/**
 * Selects the longest canonical span intersecting every lane/pixel cell.
 *
 * Galloping search converts regularly spaced trace-time boundaries into sorted-index ranges.
 * With a range-maximum tree, each invocation queries the disjoint pixel range in logarithmic work.
 * Without one, it scans that range as a memory-saving fallback; those disjoint scans still total
 * O(spanCount + pixelCount) work. A final pass also checks the immediately preceding span, which
 * preserves a non-overlapping span that begins before the pixel or viewport. The output is fixed
 * capacity and uses `0xffffffff` for empty or inactive cells.
 *
 * The index must have no overlaps within a lane/depth segment. Use
 * {@link GPUTraceLaneIndexBuilder}; it reports overlap violations during construction.
 */
export class GPUTracePixelMipmap implements GPUCommandGraphContributor {
  readonly id: string;
  readonly index: GPUTracePixelMipmapIndex;
  readonly query: GPUTraceMipmapBoundaryQuery;
  readonly output: GraphDataView<'uint32'>;
  readonly validationErrors: GraphDataView<'uint32'>;
  readonly selectionMask?: GraphDataView<'uint32'>;
  readonly boundariesPerTile?: number;
  readonly stats: Readonly<GPUTracePixelMipmapStats>;

  constructor(props: GPUTracePixelMipmapProps) {
    this.id = props.id ?? 'gpu-trace-pixel-mipmap';
    this.index = props.index;
    this.query = props.query;
    this.output = props.output;
    this.validationErrors = props.validationErrors;
    this.selectionMask = props.selectionMask;
    this.boundariesPerTile = props.boundariesPerTile;
    this.stats = Object.freeze(validateMipmap(this.id, props));
  }

  /** Adds pixel-boundary generation and longest-duration representative selection. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const views = [
      this.index.startTimes,
      this.index.durations,
      this.index.spanIds,
      ...(this.index.rowOrder ? [this.index.rowOrder] : []),
      this.index.laneOffsets,
      ...(this.index.maximumDurationTree ? [this.index.maximumDurationTree] : []),
      ...(this.selectionMask ? [this.selectionMask] : []),
      ...Object.values(this.query),
      this.output,
      this.validationErrors
    ];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }
    const boundaries = createTransientView(
      graph,
      `${this.id}-boundaries`,
      'uint32',
      this.stats.laneCount * (this.stats.maximumPixelCount + 1)
    );
    new GPUTraceMipmapBoundaries({
      id: `${this.id}-boundaries`,
      startTimes: this.index.startTimes,
      startTimeOrder: this.index.rowOrder,
      segmentOffsets: this.index.laneOffsets,
      query: this.query,
      maximumPixelCount: this.stats.maximumPixelCount,
      boundariesPerTile: this.boundariesPerTile,
      output: boundaries,
      validationErrors: this.validationErrors
    }).addToGraph(graph);
    if (this.index.maximumDurationTree) {
      const candidates = createTransientView(
        graph,
        `${this.id}-range-candidates`,
        'uint32',
        this.stats.maximumRepresentativeCount * 2
      );
      addRangeMaximumPass(graph, this, boundaries, candidates);
      addCandidateFinalizationPass(graph, this, candidates);
    } else if (this.index.rowOrder) {
      const candidates = createTransientView(
        graph,
        `${this.id}-linear-candidates`,
        'uint32',
        this.stats.maximumRepresentativeCount
      );
      addIndirectLinearRepresentativePass(graph, this, boundaries, candidates);
      addIndirectCandidateMappingPass(graph, this, candidates);
    } else {
      addRepresentativePass(graph, this, boundaries);
    }
  }
}

function validateMipmap(id: string, props: GPUTracePixelMipmapProps): GPUTracePixelMipmapStats {
  if (props.index.rowOrder) {
    validateScalarView(props.index.startTimes, 'float32', `${id} index startTimes`);
    validateScalarView(props.index.durations, 'float32', `${id} index durations`);
    validateScalarView(props.index.spanIds, 'uint32', `${id} index spanIds`);
    validatePackedUint32View(props.index.rowOrder, `${id} index rowOrder`);
  } else {
    // The compact direct pass indexes these columns by logical position. Strided canonical columns
    // use rowOrder and the indirect passes below instead.
    validatePackedView(props.index.startTimes, ['float32'], `${id} index startTimes`);
    validatePackedView(props.index.durations, ['float32'], `${id} index durations`);
    validatePackedUint32View(props.index.spanIds, `${id} index spanIds`);
  }
  validatePackedUint32View(props.index.laneOffsets, `${id} index laneOffsets`);
  if (props.index.maximumDurationTree) {
    validatePackedUint32View(props.index.maximumDurationTree, `${id} index maximumDurationTree`);
  }
  validatePackedView(props.query.domain, ['float32'], `${id} query domain`);
  validatePackedUint32View(props.query.pixelCount, `${id} query pixelCount`);
  validatePackedUint32View(props.output, `${id} output`);
  validatePackedUint32View(props.validationErrors, `${id} validationErrors`);
  const sourceSpanCount = props.index.startTimes.length;
  if (
    props.index.durations.length !== sourceSpanCount ||
    props.index.spanIds.length !== sourceSpanCount
  ) {
    throw new Error(`${id} secondary-index columns must have matching lengths`);
  }
  if (props.index.laneOffsets.length < 2) {
    throw new Error(`${id} laneOffsets must contain at least one lane and sentinel`);
  }
  if (!Number.isSafeInteger(props.maximumPixelCount) || props.maximumPixelCount < 1) {
    throw new Error(`${id} maximumPixelCount must be a positive safe integer`);
  }
  if (props.query.domain.length !== 2 || props.query.pixelCount.length !== 1) {
    throw new Error(`${id} query must contain two domain values and one pixel count`);
  }
  if (props.validationErrors.length !== 1) {
    throw new Error(`${id} validationErrors must contain one uint32`);
  }
  if (props.selectionMask) {
    validatePackedUint32View(props.selectionMask, `${id} selectionMask`);
    if (props.selectionMask.length < Math.ceil(sourceSpanCount / 32)) {
      throw new Error(`${id} selectionMask must contain one bit per source span`);
    }
    if (props.index.maximumDurationTree) {
      throw new Error(`${id} selectionMask is not compatible with maximumDurationTree`);
    }
  }
  const laneCount = props.index.laneOffsets.length - 1;
  const hasMaximumTree = Boolean(props.index.maximumDurationTree);
  const hasMaximumCapacity = props.index.maximumDurationLeafCapacity !== undefined;
  if (hasMaximumTree !== hasMaximumCapacity) {
    throw new Error(
      `${id} maximumDurationTree and maximumDurationLeafCapacity must be supplied together`
    );
  }
  const maximumDurationLeafCapacity = props.index.maximumDurationLeafCapacity ?? 0;
  if (
    hasMaximumTree &&
    (!Number.isSafeInteger(maximumDurationLeafCapacity) ||
      maximumDurationLeafCapacity < 1 ||
      maximumDurationLeafCapacity > 0x40000000 ||
      !Number.isInteger(Math.log2(maximumDurationLeafCapacity)))
  ) {
    throw new Error(`${id} maximumDurationLeafCapacity must be a positive power of two`);
  }
  if (
    props.index.maximumDurationTree &&
    props.index.maximumDurationTree.length !== laneCount * maximumDurationLeafCapacity * 2
  ) {
    throw new Error(
      `${id} maximumDurationTree has the wrong length for its lane count and capacity`
    );
  }
  const maximumRepresentativeCount = laneCount * props.maximumPixelCount;
  if (
    !Number.isSafeInteger(maximumRepresentativeCount) ||
    props.output.length !== maximumRepresentativeCount
  ) {
    throw new Error(`${id} output must contain laneCount * maximumPixelCount rows`);
  }
  const sources = [
    props.index.startTimes,
    props.index.durations,
    props.index.spanIds,
    ...(props.index.rowOrder ? [props.index.rowOrder] : []),
    props.index.laneOffsets,
    ...(props.index.maximumDurationTree ? [props.index.maximumDurationTree] : []),
    ...Object.values(props.query),
    ...(props.selectionMask ? [props.selectionMask] : [])
  ];
  if (
    sources.some(view => view.buffer === props.output.buffer) ||
    sources.some(view => view.buffer === props.validationErrors.buffer) ||
    props.output.buffer === props.validationErrors.buffer
  ) {
    throw new Error(`${id} sources, output, and validationErrors must use separate buffers`);
  }
  return {
    laneCount,
    sourceSpanCount,
    orderedSpanCount: props.index.rowOrder?.length ?? sourceSpanCount,
    maximumPixelCount: props.maximumPixelCount,
    maximumRepresentativeCount,
    rangeMaximumAccelerated: hasMaximumTree,
    maximumDurationLeafCapacity
  };
}

function addRangeMaximumPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  mipmap: GPUTracePixelMipmap,
  boundaries: GraphDataView<'uint32'>,
  candidates: GraphDataView<'uint32'>
): void {
  const {stats} = mipmap;
  const maximumDurationTree = mipmap.index.maximumDurationTree;
  if (!maximumDurationTree) {
    throw new Error(`${mipmap.id} range maximum pass requires a maximum-duration tree`);
  }
  const dispatch = getBoundedDispatchLayout(
    `${mipmap.id}-range-maximum`,
    stats.maximumRepresentativeCount,
    PIXEL_MIPMAP_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const durationStride = mipmap.index.durations.byteStride / Uint32Array.BYTES_PER_ELEMENT;
  const spanIdStride = mipmap.index.spanIds.byteStride / Uint32Array.BYTES_PER_ELEMENT;
  const orderDeclaration = mipmap.index.rowOrder
    ? '@group(0) @binding(2) var<storage, read> rowOrder: array<u32>;'
    : '';
  const laneBinding = mipmap.index.rowOrder ? 3 : 2;
  const pixelBinding = laneBinding + 1;
  const boundaryBinding = laneBinding + 2;
  const treeBinding = laneBinding + 3;
  const candidateBinding = laneBinding + 4;
  const leftRow = mipmap.index.rowOrder
    ? 'let leftRow = rowOrder[ORDER_OFFSET + left];'
    : 'let leftRow = left;';
  const rightRow = mipmap.index.rowOrder
    ? 'let rightRow = rowOrder[ORDER_OFFSET + right];'
    : 'let rightRow = right;';
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${stats.orderedSpanCount}u;
const LANE_COUNT: u32 = ${stats.laneCount}u;
const MAXIMUM_PIXEL_COUNT: u32 = ${stats.maximumPixelCount}u;
const ROWS_PER_LANE: u32 = ${stats.maximumPixelCount + 1}u;
const LEAF_CAPACITY: u32 = ${stats.maximumDurationLeafCapacity}u;
const TREE_STRIDE: u32 = ${stats.maximumDurationLeafCapacity * 2}u;
const JOB_COUNT: u32 = ${stats.maximumRepresentativeCount}u;
const DURATION_OFFSET: u32 = ${getViewElementOffset(mipmap.index.durations)}u;
const DURATION_STRIDE: u32 = ${durationStride}u;
const SPAN_ID_OFFSET: u32 = ${getViewElementOffset(mipmap.index.spanIds)}u;
const SPAN_ID_STRIDE: u32 = ${spanIdStride}u;
const ORDER_OFFSET: u32 = ${mipmap.index.rowOrder ? getViewElementOffset(mipmap.index.rowOrder) : 0}u;
const LANE_OFFSET: u32 = ${getViewElementOffset(mipmap.index.laneOffsets)}u;
const PIXEL_COUNT_OFFSET: u32 = ${getViewElementOffset(mipmap.query.pixelCount)}u;
const BOUNDARY_OFFSET: u32 = ${getViewElementOffset(boundaries)}u;
const TREE_OFFSET: u32 = ${getViewElementOffset(maximumDurationTree)}u;
const CANDIDATE_OFFSET: u32 = ${getViewElementOffset(candidates)}u;
@group(0) @binding(0) var<storage, read> durations: array<f32>;
@group(0) @binding(1) var<storage, read> spanIds: array<u32>;
${orderDeclaration}
@group(0) @binding(${laneBinding}) var<storage, read> laneOffsets: array<u32>;
@group(0) @binding(${pixelBinding}) var<storage, read> pixelCounts: array<u32>;
@group(0) @binding(${boundaryBinding}) var<storage, read> boundaries: array<u32>;
@group(0) @binding(${treeBinding}) var<storage, read> maximumTree: array<u32>;
@group(0) @binding(${candidateBinding}) var<storage, read_write> candidates: array<u32>;

fn chooseLongest(left: u32, right: u32) -> u32 {
  if (left == ${INVALID_SPAN_ID}u) { return right; }
  if (right == ${INVALID_SPAN_ID}u) { return left; }
  ${leftRow}
  ${rightRow}
  let leftDuration = durations[DURATION_OFFSET + leftRow * DURATION_STRIDE];
  let rightDuration = durations[DURATION_OFFSET + rightRow * DURATION_STRIDE];
  let leftId = spanIds[SPAN_ID_OFFSET + leftRow * SPAN_ID_STRIDE];
  let rightId = spanIds[SPAN_ID_OFFSET + rightRow * SPAN_ID_STRIDE];
  return select(left, right, rightDuration > leftDuration ||
    (rightDuration == leftDuration && rightId < leftId));
}

@compute @workgroup_size(${PIXEL_MIPMAP_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, PIXEL_MIPMAP_WORKGROUP_SIZE)}
  if (index >= JOB_COUNT) { return; }
  let lane = index / MAXIMUM_PIXEL_COUNT;
  let pixel = index % MAXIMUM_PIXEL_COUNT;
  let candidateBase = CANDIDATE_OFFSET + index * 2u;
  candidates[candidateBase] = ${INVALID_SPAN_ID}u;
  candidates[candidateBase + 1u] = ${INVALID_SPAN_ID}u;
  let activePixelCount = min(pixelCounts[PIXEL_COUNT_OFFSET], MAXIMUM_PIXEL_COUNT);
  if (lane >= LANE_COUNT || pixel >= activePixelCount) { return; }
  let laneStart = laneOffsets[LANE_OFFSET + lane];
  let laneEnd = laneOffsets[LANE_OFFSET + lane + 1u];
  let boundaryBase = BOUNDARY_OFFSET + lane * ROWS_PER_LANE;
  let first = boundaries[boundaryBase + pixel];
  let last = boundaries[boundaryBase + pixel + 1u];
  if (laneStart > laneEnd || laneEnd > SPAN_COUNT || laneEnd - laneStart > LEAF_CAPACITY ||
      first < laneStart || last < first || last > laneEnd) { return; }

  if (first > laneStart) { candidates[candidateBase + 1u] = first - 1u; }
  var left = LEAF_CAPACITY + first - laneStart;
  var right = LEAF_CAPACITY + last - laneStart;
  let treeBase = TREE_OFFSET + lane * TREE_STRIDE;
  var selected = ${INVALID_SPAN_ID}u;
  loop {
    if (left >= right) { break; }
    if ((left & 1u) != 0u) {
      selected = chooseLongest(selected, maximumTree[treeBase + left]);
      left += 1u;
    }
    if ((right & 1u) != 0u) {
      right -= 1u;
      selected = chooseLongest(selected, maximumTree[treeBase + right]);
    }
    left >>= 1u;
    right >>= 1u;
  }
  candidates[candidateBase] = selected;
}`;
  addPixelComputePass(graph, {
    id: `${mipmap.id}-range-maximum`,
    operation: 'GPUTracePixelMipmapRangeMaximum',
    source,
    dispatch,
    bindings: {
      durations: mipmap.index.durations,
      spanIds: mipmap.index.spanIds,
      ...(mipmap.index.rowOrder ? {rowOrder: mipmap.index.rowOrder} : {}),
      laneOffsets: mipmap.index.laneOffsets,
      pixelCounts: mipmap.query.pixelCount,
      boundaries,
      maximumTree: maximumDurationTree,
      candidates
    },
    resources: [
      {buffer: mipmap.index.durations, usage: 'storage-read'},
      {buffer: mipmap.index.spanIds, usage: 'storage-read'},
      ...(mipmap.index.rowOrder
        ? [{buffer: mipmap.index.rowOrder, usage: 'storage-read' as const}]
        : []),
      {buffer: mipmap.index.laneOffsets, usage: 'storage-read'},
      {buffer: mipmap.query.pixelCount, usage: 'storage-read'},
      {buffer: boundaries, usage: 'storage-read'},
      {buffer: maximumDurationTree, usage: 'storage-read'},
      {buffer: candidates, usage: 'storage-write'}
    ]
  });
}

function addCandidateFinalizationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  mipmap: GPUTracePixelMipmap,
  candidates: GraphDataView<'uint32'>
): void {
  const {stats} = mipmap;
  const dispatch = getBoundedDispatchLayout(
    `${mipmap.id}-finalize`,
    stats.maximumRepresentativeCount,
    PIXEL_MIPMAP_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const startStride = mipmap.index.startTimes.byteStride / Uint32Array.BYTES_PER_ELEMENT;
  const durationStride = mipmap.index.durations.byteStride / Uint32Array.BYTES_PER_ELEMENT;
  const spanIdStride = mipmap.index.spanIds.byteStride / Uint32Array.BYTES_PER_ELEMENT;
  const orderDeclaration = mipmap.index.rowOrder
    ? '@group(0) @binding(3) var<storage, read> rowOrder: array<u32>;'
    : '';
  const domainBinding = mipmap.index.rowOrder ? 4 : 3;
  const candidateBinding = domainBinding + 1;
  const outputBinding = domainBinding + 2;
  const leftRow = mipmap.index.rowOrder
    ? 'let leftRow = rowOrder[ORDER_OFFSET + left];'
    : 'let leftRow = left;';
  const rightRow = mipmap.index.rowOrder
    ? 'let rightRow = rowOrder[ORDER_OFFSET + right];'
    : 'let rightRow = right;';
  const selectedRow = mipmap.index.rowOrder
    ? 'let selectedRow = rowOrder[ORDER_OFFSET + selected];'
    : 'let selectedRow = selected;';
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${stats.orderedSpanCount}u;
const SOURCE_SPAN_COUNT: u32 = ${stats.sourceSpanCount}u;
const MAXIMUM_PIXEL_COUNT: u32 = ${stats.maximumPixelCount}u;
const JOB_COUNT: u32 = ${stats.maximumRepresentativeCount}u;
const START_OFFSET: u32 = ${getViewElementOffset(mipmap.index.startTimes)}u;
const START_STRIDE: u32 = ${startStride}u;
const DURATION_OFFSET: u32 = ${getViewElementOffset(mipmap.index.durations)}u;
const DURATION_STRIDE: u32 = ${durationStride}u;
const SPAN_ID_OFFSET: u32 = ${getViewElementOffset(mipmap.index.spanIds)}u;
const SPAN_ID_STRIDE: u32 = ${spanIdStride}u;
const ORDER_OFFSET: u32 = ${mipmap.index.rowOrder ? getViewElementOffset(mipmap.index.rowOrder) : 0}u;
const DOMAIN_OFFSET: u32 = ${getViewElementOffset(mipmap.query.domain)}u;
const CANDIDATE_OFFSET: u32 = ${getViewElementOffset(candidates)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(mipmap.output)}u;
@group(0) @binding(0) var<storage, read> startTimes: array<f32>;
@group(0) @binding(1) var<storage, read> durations: array<f32>;
@group(0) @binding(2) var<storage, read> spanIds: array<u32>;
${orderDeclaration}
@group(0) @binding(${domainBinding}) var<storage, read> domain: array<f32>;
@group(0) @binding(${candidateBinding}) var<storage, read> candidates: array<u32>;
@group(0) @binding(${outputBinding}) var<storage, read_write> representatives: array<u32>;

fn chooseLongest(left: u32, right: u32, pixelStart: f32, requireRightOverlap: bool) -> u32 {
  if (right >= SPAN_COUNT) { return left; }
  ${rightRow}
  let rightDuration = durations[DURATION_OFFSET + rightRow * DURATION_STRIDE];
  let rightStart = startTimes[START_OFFSET + rightRow * START_STRIDE];
  let rightValid = rightDuration == rightDuration && abs(rightDuration) <= 3.402823466e+38 &&
    rightDuration >= 0.0 && (!requireRightOverlap || rightStart + rightDuration > pixelStart);
  if (!rightValid) { return left; }
  if (left >= SPAN_COUNT) { return right; }
  ${leftRow}
  let leftDuration = durations[DURATION_OFFSET + leftRow * DURATION_STRIDE];
  let leftId = spanIds[SPAN_ID_OFFSET + leftRow * SPAN_ID_STRIDE];
  let rightId = spanIds[SPAN_ID_OFFSET + rightRow * SPAN_ID_STRIDE];
  return select(left, right, rightDuration > leftDuration ||
    (rightDuration == leftDuration && rightId < leftId));
}

@compute @workgroup_size(${PIXEL_MIPMAP_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, PIXEL_MIPMAP_WORKGROUP_SIZE)}
  if (index >= JOB_COUNT) { return; }
  let pixel = index % MAXIMUM_PIXEL_COUNT;
  let candidateBase = CANDIDATE_OFFSET + index * 2u;
  var selected = candidates[candidateBase];
  let predecessor = candidates[candidateBase + 1u];
  let firstBoundaryTime = domain[DOMAIN_OFFSET];
  let timePerPixel = domain[DOMAIN_OFFSET + 1u];
  let validDomain = firstBoundaryTime == firstBoundaryTime && timePerPixel == timePerPixel &&
    abs(firstBoundaryTime) <= 3.402823466e+38 && abs(timePerPixel) <= 3.402823466e+38 &&
    timePerPixel > 0.0;
  if (!validDomain) {
    representatives[OUTPUT_OFFSET + index] = ${INVALID_SPAN_ID}u;
    return;
  }
  let pixelStart = firstBoundaryTime + f32(pixel) * timePerPixel;
  selected = chooseLongest(selected, predecessor, pixelStart, true);
  if (selected < SPAN_COUNT) {
    ${selectedRow}
    if (selectedRow < SOURCE_SPAN_COUNT) {
      representatives[OUTPUT_OFFSET + index] =
        spanIds[SPAN_ID_OFFSET + selectedRow * SPAN_ID_STRIDE];
    } else {
      representatives[OUTPUT_OFFSET + index] = ${INVALID_SPAN_ID}u;
    }
  } else {
    representatives[OUTPUT_OFFSET + index] = ${INVALID_SPAN_ID}u;
  }
}`;
  addPixelComputePass(graph, {
    id: `${mipmap.id}-finalize`,
    operation: 'GPUTracePixelMipmapFinalize',
    source,
    dispatch,
    bindings: {
      startTimes: mipmap.index.startTimes,
      durations: mipmap.index.durations,
      spanIds: mipmap.index.spanIds,
      ...(mipmap.index.rowOrder ? {rowOrder: mipmap.index.rowOrder} : {}),
      domain: mipmap.query.domain,
      candidates,
      representatives: mipmap.output
    },
    resources: [
      {buffer: mipmap.index.startTimes, usage: 'storage-read'},
      {buffer: mipmap.index.durations, usage: 'storage-read'},
      {buffer: mipmap.index.spanIds, usage: 'storage-read'},
      ...(mipmap.index.rowOrder
        ? [{buffer: mipmap.index.rowOrder, usage: 'storage-read' as const}]
        : []),
      {buffer: mipmap.query.domain, usage: 'storage-read'},
      {buffer: candidates, usage: 'storage-read'},
      {buffer: mipmap.output, usage: 'storage-write'}
    ]
  });
}

function addPixelComputePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    operation: string;
    source: string;
    dispatch: GPUBoundedDispatchLayout;
    bindings: Record<string, GraphDataView>;
    resources: GraphBufferUse[];
  }
): void {
  graph.addComputePass({
    id: props.id,
    resources: props.resources,
    workload: {
      operation: props.operation,
      commandCount: 1,
      maximumWorkgroupCount: props.dispatch.x * props.dispatch.y * props.dispatch.z,
      maximumInvocationCount:
        props.dispatch.x * props.dispatch.y * props.dispatch.z * PIXEL_MIPMAP_WORKGROUP_SIZE
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
          const resolvedBindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(props.bindings)) {
            resolvedBindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(resolvedBindings);
          computation.dispatch(computePass, props.dispatch.x, props.dispatch.y, props.dispatch.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

function addIndirectLinearRepresentativePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  mipmap: GPUTracePixelMipmap,
  boundaries: GraphDataView<'uint32'>,
  candidates: GraphDataView<'uint32'>
): void {
  const {stats} = mipmap;
  const rowOrder = mipmap.index.rowOrder;
  if (!rowOrder) {
    throw new Error(`${mipmap.id} indirect representative pass requires rowOrder`);
  }
  const dispatch = getBoundedDispatchLayout(
    `${mipmap.id}-linear-representatives`,
    stats.maximumRepresentativeCount,
    PIXEL_MIPMAP_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const startStride = mipmap.index.startTimes.byteStride / Uint32Array.BYTES_PER_ELEMENT;
  const durationStride = mipmap.index.durations.byteStride / Uint32Array.BYTES_PER_ELEMENT;
  const selectionDeclaration = mipmap.selectionMask
    ? '@group(0) @binding(8) var<storage, read> selectionMask: array<u32>;'
    : '';
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${stats.orderedSpanCount}u;
const SOURCE_SPAN_COUNT: u32 = ${stats.sourceSpanCount}u;
const LANE_COUNT: u32 = ${stats.laneCount}u;
const MAXIMUM_PIXEL_COUNT: u32 = ${stats.maximumPixelCount}u;
const ROWS_PER_LANE: u32 = ${stats.maximumPixelCount + 1}u;
const JOB_COUNT: u32 = ${stats.maximumRepresentativeCount}u;
const START_OFFSET: u32 = ${getViewElementOffset(mipmap.index.startTimes)}u;
const START_STRIDE: u32 = ${startStride}u;
const DURATION_OFFSET: u32 = ${getViewElementOffset(mipmap.index.durations)}u;
const DURATION_STRIDE: u32 = ${durationStride}u;
const ORDER_OFFSET: u32 = ${getViewElementOffset(rowOrder)}u;
const LANE_OFFSET: u32 = ${getViewElementOffset(mipmap.index.laneOffsets)}u;
const DOMAIN_OFFSET: u32 = ${getViewElementOffset(mipmap.query.domain)}u;
const PIXEL_COUNT_OFFSET: u32 = ${getViewElementOffset(mipmap.query.pixelCount)}u;
const BOUNDARY_OFFSET: u32 = ${getViewElementOffset(boundaries)}u;
const CANDIDATE_OFFSET: u32 = ${getViewElementOffset(candidates)}u;
const SELECTION_OFFSET: u32 = ${mipmap.selectionMask ? getViewElementOffset(mipmap.selectionMask) : 0}u;
@group(0) @binding(0) var<storage, read> startTimes: array<f32>;
@group(0) @binding(1) var<storage, read> durations: array<f32>;
@group(0) @binding(2) var<storage, read> rowOrder: array<u32>;
@group(0) @binding(3) var<storage, read> laneOffsets: array<u32>;
@group(0) @binding(4) var<storage, read> domain: array<f32>;
@group(0) @binding(5) var<storage, read> pixelCounts: array<u32>;
@group(0) @binding(6) var<storage, read> boundaries: array<u32>;
@group(0) @binding(7) var<storage, read_write> candidates: array<u32>;
${selectionDeclaration}

fn considerCandidate(position: u32, pixelStart: f32, requireOverlap: bool,
  current: vec2<u32>) -> vec2<u32> {
  if (position >= SPAN_COUNT) { return current; }
  let row = rowOrder[ORDER_OFFSET + position];
  if (row >= SOURCE_SPAN_COUNT) { return current; }
  ${mipmap.selectionMask ? 'if ((selectionMask[SELECTION_OFFSET + (row >> 5u)] & (1u << (row & 31u))) == 0u) { return current; }' : ''}
  let duration = durations[DURATION_OFFSET + row * DURATION_STRIDE];
  let startTime = startTimes[START_OFFSET + row * START_STRIDE];
  let valid = duration == duration && abs(duration) <= 3.402823466e+38 && duration >= 0.0 &&
    (!requireOverlap || startTime + duration > pixelStart);
  if (!valid) { return current; }
  if (current.x == ${INVALID_SPAN_ID}u) { return vec2<u32>(position, bitcast<u32>(duration)); }
  let currentDuration = bitcast<f32>(current.y);
  if (duration > currentDuration || (duration == currentDuration && position < current.x)) {
    return vec2<u32>(position, bitcast<u32>(duration));
  }
  return current;
}

@compute @workgroup_size(${PIXEL_MIPMAP_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, PIXEL_MIPMAP_WORKGROUP_SIZE)}
  if (index >= JOB_COUNT) { return; }
  let lane = index / MAXIMUM_PIXEL_COUNT;
  let pixel = index % MAXIMUM_PIXEL_COUNT;
  let activePixelCount = min(pixelCounts[PIXEL_COUNT_OFFSET], MAXIMUM_PIXEL_COUNT);
  let firstBoundaryTime = domain[DOMAIN_OFFSET];
  let timePerPixel = domain[DOMAIN_OFFSET + 1u];
  let validDomain = firstBoundaryTime == firstBoundaryTime && timePerPixel == timePerPixel &&
    abs(firstBoundaryTime) <= 3.402823466e+38 && abs(timePerPixel) <= 3.402823466e+38 &&
    timePerPixel > 0.0;
  if (lane >= LANE_COUNT || pixel >= activePixelCount || !validDomain) {
    candidates[CANDIDATE_OFFSET + index] = ${INVALID_SPAN_ID}u;
    return;
  }
  let laneStart = laneOffsets[LANE_OFFSET + lane];
  let laneEnd = laneOffsets[LANE_OFFSET + lane + 1u];
  let boundaryBase = BOUNDARY_OFFSET + lane * ROWS_PER_LANE;
  let first = boundaries[boundaryBase + pixel];
  let last = boundaries[boundaryBase + pixel + 1u];
  if (laneStart > laneEnd || laneEnd > SPAN_COUNT || first < laneStart || last < first ||
      last > laneEnd) {
    candidates[CANDIDATE_OFFSET + index] = ${INVALID_SPAN_ID}u;
    return;
  }
  let pixelStart = firstBoundaryTime + f32(pixel) * timePerPixel;
  var selected = vec2<u32>(${INVALID_SPAN_ID}u, 0u);
  if (first > laneStart) { selected = considerCandidate(first - 1u, pixelStart, true, selected); }
  for (var position = first; position < last; position++) {
    selected = considerCandidate(position, pixelStart, false, selected);
  }
  candidates[CANDIDATE_OFFSET + index] = selected.x;
}`;
  addPixelComputePass(graph, {
    id: `${mipmap.id}-linear-representatives`,
    operation: 'GPUTracePixelMipmapLinear',
    source,
    dispatch,
    bindings: {
      startTimes: mipmap.index.startTimes,
      durations: mipmap.index.durations,
      rowOrder,
      laneOffsets: mipmap.index.laneOffsets,
      domain: mipmap.query.domain,
      pixelCounts: mipmap.query.pixelCount,
      boundaries,
      candidates,
      ...(mipmap.selectionMask ? {selectionMask: mipmap.selectionMask} : {})
    },
    resources: [
      {buffer: mipmap.index.startTimes, usage: 'storage-read'},
      {buffer: mipmap.index.durations, usage: 'storage-read'},
      {buffer: rowOrder, usage: 'storage-read'},
      {buffer: mipmap.index.laneOffsets, usage: 'storage-read'},
      {buffer: mipmap.query.domain, usage: 'storage-read'},
      {buffer: mipmap.query.pixelCount, usage: 'storage-read'},
      {buffer: boundaries, usage: 'storage-read'},
      {buffer: candidates, usage: 'storage-write'},
      ...(mipmap.selectionMask
        ? [{buffer: mipmap.selectionMask, usage: 'storage-read' as const}]
        : [])
    ]
  });
}

function addIndirectCandidateMappingPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  mipmap: GPUTracePixelMipmap,
  candidates: GraphDataView<'uint32'>
): void {
  const rowOrder = mipmap.index.rowOrder;
  if (!rowOrder) {
    throw new Error(`${mipmap.id} indirect mapping pass requires rowOrder`);
  }
  const dispatch = getBoundedDispatchLayout(
    `${mipmap.id}-map-candidates`,
    mipmap.stats.maximumRepresentativeCount,
    PIXEL_MIPMAP_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const spanIdStride = mipmap.index.spanIds.byteStride / Uint32Array.BYTES_PER_ELEMENT;
  const source = /* wgsl */ `
const JOB_COUNT: u32 = ${mipmap.stats.maximumRepresentativeCount}u;
const SPAN_COUNT: u32 = ${mipmap.stats.orderedSpanCount}u;
const SOURCE_SPAN_COUNT: u32 = ${mipmap.stats.sourceSpanCount}u;
const SPAN_ID_OFFSET: u32 = ${getViewElementOffset(mipmap.index.spanIds)}u;
const SPAN_ID_STRIDE: u32 = ${spanIdStride}u;
const ORDER_OFFSET: u32 = ${getViewElementOffset(rowOrder)}u;
const CANDIDATE_OFFSET: u32 = ${getViewElementOffset(candidates)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(mipmap.output)}u;
@group(0) @binding(0) var<storage, read> spanIds: array<u32>;
@group(0) @binding(1) var<storage, read> rowOrder: array<u32>;
@group(0) @binding(2) var<storage, read> candidates: array<u32>;
@group(0) @binding(3) var<storage, read_write> representatives: array<u32>;
@compute @workgroup_size(${PIXEL_MIPMAP_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, PIXEL_MIPMAP_WORKGROUP_SIZE)}
  if (index >= JOB_COUNT) { return; }
  let candidate = candidates[CANDIDATE_OFFSET + index];
  if (candidate < SPAN_COUNT) {
    let row = rowOrder[ORDER_OFFSET + candidate];
    if (row < SOURCE_SPAN_COUNT) {
      representatives[OUTPUT_OFFSET + index] = spanIds[SPAN_ID_OFFSET + row * SPAN_ID_STRIDE];
      return;
    }
  }
  representatives[OUTPUT_OFFSET + index] = ${INVALID_SPAN_ID}u;
}`;
  addPixelComputePass(graph, {
    id: `${mipmap.id}-map-candidates`,
    operation: 'GPUTracePixelMipmapMap',
    source,
    dispatch,
    bindings: {spanIds: mipmap.index.spanIds, rowOrder, candidates, representatives: mipmap.output},
    resources: [
      {buffer: mipmap.index.spanIds, usage: 'storage-read'},
      {buffer: rowOrder, usage: 'storage-read'},
      {buffer: candidates, usage: 'storage-read'},
      {buffer: mipmap.output, usage: 'storage-write'}
    ]
  });
}

function addRepresentativePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  mipmap: GPUTracePixelMipmap,
  boundaries: GraphDataView<'uint32'>
): void {
  const {stats} = mipmap;
  const dispatch = getBoundedDispatchLayout(
    mipmap.id,
    stats.maximumRepresentativeCount,
    PIXEL_MIPMAP_WORKGROUP_SIZE,
    graph.device.limits.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const SPAN_COUNT: u32 = ${stats.orderedSpanCount}u;
const LANE_COUNT: u32 = ${stats.laneCount}u;
const MAXIMUM_PIXEL_COUNT: u32 = ${stats.maximumPixelCount}u;
const ROWS_PER_LANE: u32 = ${stats.maximumPixelCount + 1}u;
const JOB_COUNT: u32 = ${stats.maximumRepresentativeCount}u;
const START_OFFSET: u32 = ${getViewElementOffset(mipmap.index.startTimes)}u;
const DURATION_OFFSET: u32 = ${getViewElementOffset(mipmap.index.durations)}u;
const SPAN_ID_OFFSET: u32 = ${getViewElementOffset(mipmap.index.spanIds)}u;
const LANE_OFFSET: u32 = ${getViewElementOffset(mipmap.index.laneOffsets)}u;
const DOMAIN_OFFSET: u32 = ${getViewElementOffset(mipmap.query.domain)}u;
const PIXEL_COUNT_OFFSET: u32 = ${getViewElementOffset(mipmap.query.pixelCount)}u;
const BOUNDARY_OFFSET: u32 = ${getViewElementOffset(boundaries)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(mipmap.output)}u;
@group(0) @binding(0) var<storage, read> startTimes: array<f32>;
@group(0) @binding(1) var<storage, read> durations: array<f32>;
@group(0) @binding(2) var<storage, read> spanIds: array<u32>;
@group(0) @binding(3) var<storage, read> laneOffsets: array<u32>;
@group(0) @binding(4) var<storage, read> domain: array<f32>;
@group(0) @binding(5) var<storage, read> pixelCounts: array<u32>;
@group(0) @binding(6) var<storage, read> boundaries: array<u32>;
@group(0) @binding(7) var<storage, read_write> representatives: array<u32>;

fn considerCandidate(position: u32, pixelStart: f32, requireOverlap: bool, current: vec2<u32>) -> vec2<u32> {
  if (position >= SPAN_COUNT) { return current; }
  let duration = durations[DURATION_OFFSET + position];
  let startTime = startTimes[START_OFFSET + position];
  let valid = duration == duration && abs(duration) <= 3.402823466e+38 && duration >= 0.0 &&
    (!requireOverlap || startTime + duration > pixelStart);
  if (!valid) { return current; }
  let spanId = spanIds[SPAN_ID_OFFSET + position];
  if (current.x == ${INVALID_SPAN_ID}u) { return vec2<u32>(spanId, bitcast<u32>(duration)); }
  let currentDuration = bitcast<f32>(current.y);
  if (duration > currentDuration || (duration == currentDuration && spanId < current.x)) {
    return vec2<u32>(spanId, bitcast<u32>(duration));
  }
  return current;
}

@compute @workgroup_size(${PIXEL_MIPMAP_WORKGROUP_SIZE}) fn main(
  @builtin(local_invocation_index) localInvocationIndex: u32,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  ${getBoundedInvocationIndexSource(dispatch, PIXEL_MIPMAP_WORKGROUP_SIZE)}
  if (index >= JOB_COUNT) { return; }
  let lane = index / MAXIMUM_PIXEL_COUNT;
  let pixel = index % MAXIMUM_PIXEL_COUNT;
  let outputIndex = OUTPUT_OFFSET + index;
  let activePixelCount = min(pixelCounts[PIXEL_COUNT_OFFSET], MAXIMUM_PIXEL_COUNT);
  let firstBoundaryTime = domain[DOMAIN_OFFSET];
  let timePerPixel = domain[DOMAIN_OFFSET + 1u];
  let validDomain = firstBoundaryTime == firstBoundaryTime && timePerPixel == timePerPixel &&
    abs(firstBoundaryTime) <= 3.402823466e+38 &&
    abs(timePerPixel) <= 3.402823466e+38 && timePerPixel > 0.0;
  if (lane >= LANE_COUNT || pixel >= activePixelCount || !validDomain) {
    representatives[outputIndex] = ${INVALID_SPAN_ID}u;
    return;
  }
  let laneStart = laneOffsets[LANE_OFFSET + lane];
  let laneEnd = laneOffsets[LANE_OFFSET + lane + 1u];
  let boundaryBase = BOUNDARY_OFFSET + lane * ROWS_PER_LANE;
  let first = boundaries[boundaryBase + pixel];
  let last = boundaries[boundaryBase + pixel + 1u];
  if (laneStart > laneEnd || laneEnd > SPAN_COUNT || first < laneStart || last < first || last > laneEnd) {
    representatives[outputIndex] = ${INVALID_SPAN_ID}u;
    return;
  }
  let pixelStart = firstBoundaryTime + f32(pixel) * timePerPixel;
  var selected = vec2<u32>(${INVALID_SPAN_ID}u, 0u);
  if (first > laneStart) { selected = considerCandidate(first - 1u, pixelStart, true, selected); }
  for (var position = first; position < last; position++) {
    selected = considerCandidate(position, pixelStart, false, selected);
  }
  representatives[outputIndex] = selected.x;
}`;
  const bindings = {
    startTimes: mipmap.index.startTimes,
    durations: mipmap.index.durations,
    spanIds: mipmap.index.spanIds,
    laneOffsets: mipmap.index.laneOffsets,
    domain: mipmap.query.domain,
    pixelCounts: mipmap.query.pixelCount,
    boundaries,
    representatives: mipmap.output
  };
  const resources: GraphBufferUse[] = [
    {buffer: mipmap.index.startTimes, usage: 'storage-read'},
    {buffer: mipmap.index.durations, usage: 'storage-read'},
    {buffer: mipmap.index.spanIds, usage: 'storage-read'},
    {buffer: mipmap.index.laneOffsets, usage: 'storage-read'},
    {buffer: mipmap.query.domain, usage: 'storage-read'},
    {buffer: mipmap.query.pixelCount, usage: 'storage-read'},
    {buffer: boundaries, usage: 'storage-read'},
    {buffer: mipmap.output, usage: 'storage-write'}
  ];
  graph.addComputePass({
    id: `${mipmap.id}-representatives`,
    resources,
    workload: {
      operation: 'GPUTracePixelMipmap',
      commandCount: 1,
      maximumWorkgroupCount: dispatch.x * dispatch.y * dispatch.z,
      maximumInvocationCount: dispatch.x * dispatch.y * dispatch.z * PIXEL_MIPMAP_WORKGROUP_SIZE
    },
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: `${mipmap.id}-representatives`,
        source,
        shaderLayout: {
          bindings: Object.keys(bindings).map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      return {
        encode: ({computePass, getBuffer}) => {
          const resolvedBindings: Record<string, Binding> = {};
          for (const [name, view] of Object.entries(bindings)) {
            resolvedBindings[name] = getViewBinding(view, getBuffer);
          }
          computation.setBindings(resolvedBindings);
          computation.dispatch(computePass, dispatch.x, dispatch.y, dispatch.z);
        },
        destroy: () => computation.destroy()
      };
    }
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
