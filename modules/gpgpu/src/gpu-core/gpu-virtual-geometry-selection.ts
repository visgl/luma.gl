// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {getGPUVectorFormatInfo, type GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {GPUCommandGraph, type GraphBufferUse, type GraphDataView} from './gpu-command-graph';
import {
  doGraphDataViewsOverlap,
  getViewBinding,
  getViewElementOffset,
  validatePackedUint32View,
  validatePackedView
} from './graph-data-view-utils';
import {GPUVisibilityWorkflow} from './gpu-visibility-workflow';

const VIRTUAL_GEOMETRY_WORKGROUP_SIZE = 256;
const MINIMUM_SURFACE_DISTANCE = 1e-6;

/** Fixed number of inward-facing planes in one virtual-geometry frustum. */
export const GPU_VIRTUAL_GEOMETRY_FRUSTUM_PLANE_COUNT = 6;

/** Breadth-level hierarchy consumed by {@link GPUVirtualGeometrySelection}. */
export type GPUVirtualGeometryHierarchy = {
  /** World-space bounding sphere per hierarchy node as center XYZ and nonnegative radius. */
  sphereBounds: GraphDataView<'float32x4'>;
  /** World-space geometric error per hierarchy node, scaled with its world-space bounds. */
  geometricErrors: GraphDataView<'float32'>;
  /** First-child index and child count per node. A zero child count identifies a leaf. */
  children: GraphDataView<'uint32x2'>;
  /** Render-cluster ID represented by each node. */
  clusterIds: GraphDataView<'uint32'>;
  /** CPU-known breadth-level offsets beginning at zero and ending at the node count. */
  levelOffsets: readonly number[];
};

/** Mutable camera and error metric consumed by {@link GPUVirtualGeometrySelection}. */
export type GPUVirtualGeometryView = {
  /** Six inward-facing world-space planes as normalized normal XYZ and signed distance. */
  frustumPlanes: GraphDataView<'float32x4'>;
  /** World-space camera position. */
  cameraPosition: GraphDataView<'float32x3'>;
  /** Projection scale in pixels at unit distance. */
  pixelProjectionScale: GraphDataView<'float32'>;
  /** Maximum permitted screen-space error in pixels. */
  maximumScreenSpaceError: GraphDataView<'float32'>;
};

/** Immutable CPU selection plan derived from one breadth-level hierarchy. */
export type GPUVirtualGeometrySelectionPlan = {
  nodeCount: number;
  rootCount: number;
  levelCount: number;
  traversalPassCount: number;
  levelOffsets: readonly number[];
};

/** Properties for GPU-driven virtual-geometry frontier selection. */
export type GPUVirtualGeometrySelectionProps = {
  /** Prefix for generated graph resources and pass IDs. */
  id?: string;
  /** Caller-owned breadth-level hierarchy. */
  hierarchy: GPUVirtualGeometryHierarchy;
  /** Caller-owned mutable camera and screen-space error state. */
  view: GPUVirtualGeometryView;
  /** Borrowed stable selected cluster IDs in node order. Its length is the retained capacity. */
  output: GraphDataView<'uint32'>;
  /** Borrowed retained count; may target an indirect instance-count word. */
  count: GraphDataView<'uint32'>;
  /** Optional full selected count before output-capacity clamping. */
  totalCount?: GraphDataView<'uint32'>;
  /** One when `totalCount` exceeds `output.length`, otherwise zero. */
  overflow: GraphDataView<'uint32'>;
};

/**
 * Validates and freezes CPU-known breadth-level topology.
 *
 * Node child ranges remain GPU data. Every nonempty range must address only the immediately next
 * breadth level. Selection checks that invariant conservatively while encoding and retains the
 * current coarse node when a range cannot be refined.
 */
export function makeGPUVirtualGeometrySelectionPlan(
  levelOffsets: readonly number[],
  nodeCount: number
): Readonly<GPUVirtualGeometrySelectionPlan> {
  if (!Number.isSafeInteger(nodeCount) || nodeCount < 1) {
    throw new Error('GPU virtual geometry nodeCount must be a positive safe integer');
  }
  if (levelOffsets.length < 2 || levelOffsets[0] !== 0) {
    throw new Error('GPU virtual geometry levelOffsets must begin with zero and contain one level');
  }
  for (let index = 1; index < levelOffsets.length; index++) {
    const offset = levelOffsets[index];
    if (!Number.isSafeInteger(offset) || offset <= levelOffsets[index - 1]) {
      throw new Error(
        'GPU virtual geometry levelOffsets must be strictly increasing safe integers'
      );
    }
  }
  if (levelOffsets[levelOffsets.length - 1] !== nodeCount) {
    throw new Error('GPU virtual geometry levelOffsets must end at nodeCount');
  }
  const frozenLevelOffsets = Object.freeze([...levelOffsets]);
  return Object.freeze({
    nodeCount,
    rootCount: frozenLevelOffsets[1],
    levelCount: frozenLevelOffsets.length - 1,
    traversalPassCount: frozenLevelOffsets.length - 1,
    levelOffsets: frozenLevelOffsets
  });
}

/**
 * Selects one deterministic render frontier from a breadth-level cluster hierarchy.
 *
 * A visible node is selected when it is a leaf or its projected error is at most the configured
 * threshold. Otherwise only its children are activated, making parent and child selection
 * mutually exclusive. Projected error is
 * `geometricError * projectionScalePixels / distanceToSphereSurface`. A camera inside or within
 * `1e-6` world units of a sphere refines conservatively when valid children exist.
 *
 * Traversal writes a source-aligned mask. {@link GPUVisibilityWorkflow} then performs stable scan
 * compaction of cluster IDs, so multiple roots and convergent child activation cannot duplicate a
 * node. A coarse shared parent suppresses its shared children, preserving frontier exclusivity.
 * The final pass copies only retained IDs and resets the
 * borrowed count, optional `totalCount`, and `overflow` rows on every graph encoding.
 */
export class GPUVirtualGeometrySelection {
  readonly id: string;
  readonly hierarchy: GPUVirtualGeometryHierarchy;
  readonly view: GPUVirtualGeometryView;
  readonly output: GraphDataView<'uint32'>;
  readonly count: GraphDataView<'uint32'>;
  readonly totalCount?: GraphDataView<'uint32'>;
  readonly overflow: GraphDataView<'uint32'>;
  readonly plan: Readonly<GPUVirtualGeometrySelectionPlan>;
  private readonly ownedBuffers: Buffer[] = [];
  private addedToGraph = false;
  private destroyed = false;

  constructor(props: GPUVirtualGeometrySelectionProps) {
    this.id = props.id ?? 'gpu-virtual-geometry-selection';
    this.hierarchy = props.hierarchy;
    this.view = props.view;
    this.output = props.output;
    this.count = props.count;
    this.totalCount = props.totalCount;
    this.overflow = props.overflow;
    this.plan = makeGPUVirtualGeometrySelectionPlan(
      this.hierarchy.levelOffsets,
      this.hierarchy.sphereBounds.length
    );

    validatePackedView(this.hierarchy.sphereBounds, ['float32x4'], `${this.id} sphereBounds`);
    validatePackedView(this.hierarchy.geometricErrors, ['float32'], `${this.id} geometricErrors`);
    validatePackedView(this.hierarchy.children, ['uint32x2'], `${this.id} children`);
    validatePackedUint32View(this.hierarchy.clusterIds, `${this.id} clusterIds`);
    for (const [name, view] of [
      ['geometricErrors', this.hierarchy.geometricErrors],
      ['children', this.hierarchy.children],
      ['clusterIds', this.hierarchy.clusterIds]
    ] as const) {
      if (view.length !== this.plan.nodeCount) {
        throw new Error(`${this.id} ${name} length must match sphereBounds`);
      }
    }

    validatePackedView(this.view.frustumPlanes, ['float32x4'], `${this.id} frustumPlanes`);
    validatePackedView(this.view.cameraPosition, ['float32x3'], `${this.id} cameraPosition`);
    validatePackedView(
      this.view.pixelProjectionScale,
      ['float32'],
      `${this.id} pixelProjectionScale`
    );
    validatePackedView(
      this.view.maximumScreenSpaceError,
      ['float32'],
      `${this.id} maximumScreenSpaceError`
    );
    if (
      this.view.frustumPlanes.length !== GPU_VIRTUAL_GEOMETRY_FRUSTUM_PLANE_COUNT ||
      this.view.cameraPosition.length !== 1 ||
      this.view.pixelProjectionScale.length !== 1 ||
      this.view.maximumScreenSpaceError.length !== 1
    ) {
      throw new Error(
        `${this.id} view requires six frustum planes and one row for each camera parameter`
      );
    }

    validatePackedUint32View(this.output, `${this.id} output`);
    validatePackedUint32View(this.count, `${this.id} count`);
    validatePackedUint32View(this.overflow, `${this.id} overflow`);
    if (this.totalCount) validatePackedUint32View(this.totalCount, `${this.id} totalCount`);
    if (
      this.count.length < 1 ||
      this.overflow.length < 1 ||
      (this.totalCount && this.totalCount.length < 1)
    ) {
      throw new Error(`${this.id} count, totalCount, and overflow must contain one uint32 row`);
    }
    const outputs = [
      this.output,
      this.count,
      this.overflow,
      ...(this.totalCount ? [this.totalCount] : [])
    ];
    for (let firstIndex = 0; firstIndex < outputs.length; firstIndex++) {
      for (let secondIndex = firstIndex + 1; secondIndex < outputs.length; secondIndex++) {
        if (doGraphDataViewsOverlap(outputs[firstIndex], outputs[secondIndex])) {
          throw new Error(`${this.id} output views must not overlap`);
        }
      }
    }
  }

  /** Adds initialization, breadth-level traversal, stable compaction, and bounded publication. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.destroyed) {
      throw new Error(`${this.id} has been destroyed`);
    }
    if (this.addedToGraph) {
      throw new Error(`${this.id} can only be added to one graph`);
    }
    this.addedToGraph = true;
    const views = [
      this.hierarchy.sphereBounds,
      this.hierarchy.geometricErrors,
      this.hierarchy.children,
      this.hierarchy.clusterIds,
      this.view.frustumPlanes,
      this.view.cameraPosition,
      this.view.pixelProjectionScale,
      this.view.maximumScreenSpaceError,
      this.output,
      this.count,
      this.overflow,
      ...(this.totalCount ? [this.totalCount] : [])
    ];
    if (views.some(view => view.buffer.graph !== graph)) {
      throw new Error(`${this.id} views must belong to the target graph`);
    }

    const activeNodes = this.createOwnedView(
      graph,
      `${this.id}-active-nodes`,
      'uint32',
      this.plan.nodeCount
    );
    const selectedMask = this.createOwnedView(
      graph,
      `${this.id}-selected-mask`,
      'uint32',
      this.plan.nodeCount
    );
    const packedView = this.createOwnedView(graph, `${this.id}-packed-view`, 'float32x4', 2);
    addInitializePass(graph, this, activeNodes, selectedMask);
    addPackViewPass(graph, this, packedView);
    for (let levelIndex = 0; levelIndex < this.plan.levelCount; levelIndex++) {
      addTraversalPass(graph, this, activeNodes, selectedMask, packedView, levelIndex);
    }

    const compactedClusterIds = this.createOwnedView(
      graph,
      `${this.id}-compacted-cluster-ids`,
      'uint32',
      this.plan.nodeCount
    );
    const selectedTotalCount = this.createOwnedView(
      graph,
      `${this.id}-selected-total-count`,
      'uint32',
      1
    );
    new GPUVisibilityWorkflow({
      id: `${this.id}-visibility`,
      predicates: [{kind: ['bounds', 'lod'], mask: selectedMask}],
      output: compactedClusterIds,
      outputMask: selectedMask,
      sourceIds: this.hierarchy.clusterIds,
      count: selectedTotalCount
    }).addToGraph(graph);
    addFinalizePass(graph, this, compactedClusterIds, selectedTotalCount);
  }

  /** Destroys selector-owned masks, compacted IDs, counts, and packed view storage. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    for (const buffer of this.ownedBuffers) {
      buffer.destroy();
    }
    this.ownedBuffers.length = 0;
    this.destroyed = true;
  }

  private createOwnedView<T extends GPUVectorFormat, Parameters>(
    graph: GPUCommandGraph<Parameters>,
    id: string,
    format: T,
    length: number
  ): GraphDataView<T> {
    const byteLength = Math.max(length, 1) * getGPUVectorFormatInfo(format).byteLength;
    const buffer = graph.device.createBuffer({id, byteLength, usage: Buffer.STORAGE});
    this.ownedBuffers.push(buffer);
    const handle = graph.importBuffer({id, byteLength, usage: buffer.usage}, buffer);
    return graph.createDataView(handle, {format, length});
  }
}

function addInitializePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  selection: GPUVirtualGeometrySelection,
  activeNodes: GraphDataView<'uint32'>,
  selectedMask: GraphDataView<'uint32'>
): void {
  const source = /* wgsl */ `
const NODE_COUNT: u32 = ${selection.plan.nodeCount}u;
const ROOT_COUNT: u32 = ${selection.plan.rootCount}u;
const ACTIVE_OFFSET: u32 = ${getViewElementOffset(activeNodes)}u;
const SELECTED_OFFSET: u32 = ${getViewElementOffset(selectedMask)}u;
@group(0) @binding(0) var<storage, read_write> activeNodes: array<atomic<u32>>;
@group(0) @binding(1) var<storage, read_write> selectedMask: array<u32>;

@compute @workgroup_size(${VIRTUAL_GEOMETRY_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let nodeIndex = globalId.x;
  if (nodeIndex >= NODE_COUNT) { return; }
  atomicStore(&activeNodes[ACTIVE_OFFSET + nodeIndex], select(0u, 1u, nodeIndex < ROOT_COUNT));
  selectedMask[SELECTED_OFFSET + nodeIndex] = 0u;
}`;
  addComputationPass(graph, {
    id: `${selection.id}-initialize`,
    source,
    resources: [
      {buffer: activeNodes, usage: 'storage-write'},
      {buffer: selectedMask, usage: 'storage-write'}
    ],
    bindings: {activeNodes, selectedMask},
    dispatchCount: Math.ceil(selection.plan.nodeCount / VIRTUAL_GEOMETRY_WORKGROUP_SIZE)
  });
}

function addPackViewPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  selection: GPUVirtualGeometrySelection,
  packedView: GraphDataView<'float32x4'>
): void {
  const source = /* wgsl */ `
const CAMERA_OFFSET: u32 = ${getViewElementOffset(selection.view.cameraPosition)}u;
const SCALE_OFFSET: u32 = ${getViewElementOffset(selection.view.pixelProjectionScale)}u;
const ERROR_OFFSET: u32 = ${getViewElementOffset(selection.view.maximumScreenSpaceError)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(packedView)}u;
@group(0) @binding(0) var<storage, read> cameraPosition: array<f32>;
@group(0) @binding(1) var<storage, read> pixelProjectionScale: array<f32>;
@group(0) @binding(2) var<storage, read> maximumScreenSpaceError: array<f32>;
@group(0) @binding(3) var<storage, read_write> packedView: array<f32>;

@compute @workgroup_size(1) fn main() {
  packedView[OUTPUT_OFFSET] = cameraPosition[CAMERA_OFFSET];
  packedView[OUTPUT_OFFSET + 1u] = cameraPosition[CAMERA_OFFSET + 1u];
  packedView[OUTPUT_OFFSET + 2u] = cameraPosition[CAMERA_OFFSET + 2u];
  packedView[OUTPUT_OFFSET + 3u] = pixelProjectionScale[SCALE_OFFSET];
  packedView[OUTPUT_OFFSET + 4u] = maximumScreenSpaceError[ERROR_OFFSET];
}`;
  addComputationPass(graph, {
    id: `${selection.id}-pack-view`,
    source,
    resources: [
      {buffer: selection.view.cameraPosition, usage: 'storage-read'},
      {buffer: selection.view.pixelProjectionScale, usage: 'storage-read'},
      {buffer: selection.view.maximumScreenSpaceError, usage: 'storage-read'},
      {buffer: packedView, usage: 'storage-write'}
    ],
    bindings: {
      cameraPosition: selection.view.cameraPosition,
      pixelProjectionScale: selection.view.pixelProjectionScale,
      maximumScreenSpaceError: selection.view.maximumScreenSpaceError,
      packedView
    },
    dispatchCount: 1
  });
}

function addTraversalPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  selection: GPUVirtualGeometrySelection,
  activeNodes: GraphDataView<'uint32'>,
  selectedMask: GraphDataView<'uint32'>,
  packedView: GraphDataView<'float32x4'>,
  levelIndex: number
): void {
  const firstNode = selection.plan.levelOffsets[levelIndex];
  const levelEnd = selection.plan.levelOffsets[levelIndex + 1];
  const nodeCount = levelEnd - firstNode;
  const hasNextLevel = levelIndex + 1 < selection.plan.levelCount;
  const nextLevelFirst = hasNextLevel ? selection.plan.levelOffsets[levelIndex + 1] : 0;
  const nextLevelEnd = hasNextLevel ? selection.plan.levelOffsets[levelIndex + 2] : 0;
  const source = /* wgsl */ `
const FIRST_NODE: u32 = ${firstNode}u;
const LEVEL_NODE_COUNT: u32 = ${nodeCount}u;
const HAS_NEXT_LEVEL: bool = ${hasNextLevel};
const NEXT_LEVEL_FIRST: u32 = ${nextLevelFirst}u;
const NEXT_LEVEL_END: u32 = ${nextLevelEnd}u;
const BOUNDS_OFFSET: u32 = ${getViewElementOffset(selection.hierarchy.sphereBounds)}u;
const ERROR_OFFSET: u32 = ${getViewElementOffset(selection.hierarchy.geometricErrors)}u;
const CHILDREN_OFFSET: u32 = ${getViewElementOffset(selection.hierarchy.children)}u;
const PLANE_OFFSET: u32 = ${getViewElementOffset(selection.view.frustumPlanes)}u;
const VIEW_OFFSET: u32 = ${getViewElementOffset(packedView)}u;
const ACTIVE_OFFSET: u32 = ${getViewElementOffset(activeNodes)}u;
const SELECTED_OFFSET: u32 = ${getViewElementOffset(selectedMask)}u;
@group(0) @binding(0) var<storage, read> sphereBounds: array<f32>;
@group(0) @binding(1) var<storage, read> geometricErrors: array<f32>;
@group(0) @binding(2) var<storage, read> children: array<u32>;
@group(0) @binding(3) var<storage, read> frustumPlanes: array<f32>;
@group(0) @binding(4) var<storage, read> packedView: array<f32>;
@group(0) @binding(5) var<storage, read_write> activeNodes: array<atomic<u32>>;
@group(0) @binding(6) var<storage, read_write> selectedMask: array<u32>;

fn finite(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn sphereVisible(center: vec3f, radius: f32) -> bool {
  for (var planeIndex = 0u; planeIndex < ${GPU_VIRTUAL_GEOMETRY_FRUSTUM_PLANE_COUNT}u; planeIndex++) {
    let planeOffset = PLANE_OFFSET + planeIndex * 4u;
    let plane = vec4f(
      frustumPlanes[planeOffset],
      frustumPlanes[planeOffset + 1u],
      frustumPlanes[planeOffset + 2u],
      frustumPlanes[planeOffset + 3u]
    );
    let validPlane = all(vec4<bool>(finite(plane.x), finite(plane.y), finite(plane.z), finite(plane.w)));
    if (validPlane && dot(plane.xyz, center) + plane.w < -radius) { return false; }
  }
  return true;
}

@compute @workgroup_size(${VIRTUAL_GEOMETRY_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  if (globalId.x >= LEVEL_NODE_COUNT) { return; }
  let nodeIndex = FIRST_NODE + globalId.x;
  if (atomicLoad(&activeNodes[ACTIVE_OFFSET + nodeIndex]) != 1u) { return; }

  let boundsOffset = BOUNDS_OFFSET + nodeIndex * 4u;
  let center = vec3f(
    sphereBounds[boundsOffset],
    sphereBounds[boundsOffset + 1u],
    sphereBounds[boundsOffset + 2u]
  );
  let radius = sphereBounds[boundsOffset + 3u];
  let validBounds = all(vec3<bool>(finite(center.x), finite(center.y), finite(center.z))) &&
    finite(radius) && radius >= 0.0;
  if (validBounds && !sphereVisible(center, radius)) { return; }

  let childOffset = CHILDREN_OFFSET + nodeIndex * 2u;
  let firstChild = children[childOffset];
  let childCount = children[childOffset + 1u];
  let validChildRange = HAS_NEXT_LEVEL && childCount > 0u &&
    firstChild >= NEXT_LEVEL_FIRST && firstChild <= NEXT_LEVEL_END &&
    childCount <= NEXT_LEVEL_END - firstChild;

  var refineForView = true;
  let camera = vec3f(
    packedView[VIEW_OFFSET],
    packedView[VIEW_OFFSET + 1u],
    packedView[VIEW_OFFSET + 2u]
  );
  let projectionScalePixels = packedView[VIEW_OFFSET + 3u];
  let thresholdPixels = packedView[VIEW_OFFSET + 4u];
  let geometricError = geometricErrors[ERROR_OFFSET + nodeIndex];
  let validView = validBounds &&
    all(vec3<bool>(finite(camera.x), finite(camera.y), finite(camera.z))) &&
    finite(projectionScalePixels) && projectionScalePixels >= 0.0 &&
    finite(thresholdPixels) && thresholdPixels >= 0.0 &&
    finite(geometricError) && geometricError >= 0.0;
  if (validView) {
    let surfaceDistance = distance(camera, center) - radius;
    if (surfaceDistance > ${MINIMUM_SURFACE_DISTANCE}) {
      let projectedError = geometricError * projectionScalePixels / surfaceDistance;
      refineForView = !finite(projectedError) || projectedError > thresholdPixels;
    }
  }

  if (validChildRange && refineForView) {
    let childEnd = firstChild + childCount;
    for (var childIndex = firstChild; childIndex < childEnd; childIndex++) {
      atomicMax(&activeNodes[ACTIVE_OFFSET + childIndex], 1u);
    }
    return;
  }
  if (validChildRange) {
    let childEnd = firstChild + childCount;
    for (var childIndex = firstChild; childIndex < childEnd; childIndex++) {
      atomicMax(&activeNodes[ACTIVE_OFFSET + childIndex], 2u);
    }
  }
  selectedMask[SELECTED_OFFSET + nodeIndex] = 1u;
}`;
  addComputationPass(graph, {
    id: `${selection.id}-level-${levelIndex}`,
    source,
    resources: [
      {buffer: selection.hierarchy.sphereBounds, usage: 'storage-read'},
      {buffer: selection.hierarchy.geometricErrors, usage: 'storage-read'},
      {buffer: selection.hierarchy.children, usage: 'storage-read'},
      {buffer: selection.view.frustumPlanes, usage: 'storage-read'},
      {buffer: packedView, usage: 'storage-read'},
      {buffer: activeNodes, usage: 'storage-read-write'},
      {buffer: selectedMask, usage: 'storage-write'}
    ],
    bindings: {
      sphereBounds: selection.hierarchy.sphereBounds,
      geometricErrors: selection.hierarchy.geometricErrors,
      children: selection.hierarchy.children,
      frustumPlanes: selection.view.frustumPlanes,
      packedView,
      activeNodes,
      selectedMask
    },
    dispatchCount: Math.ceil(nodeCount / VIRTUAL_GEOMETRY_WORKGROUP_SIZE)
  });
}

function addFinalizePass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  selection: GPUVirtualGeometrySelection,
  compactedClusterIds: GraphDataView<'uint32'>,
  selectedTotalCount: GraphDataView<'uint32'>
): void {
  const totalCountBinding = selection.totalCount
    ? '@group(0) @binding(5) var<storage, read_write> publishedTotalCount: array<u32>;'
    : '';
  const totalCountWrite = selection.totalCount
    ? 'publishedTotalCount[PUBLISHED_TOTAL_OFFSET] = totalCountValue;'
    : '';
  const source = /* wgsl */ `
const OUTPUT_CAPACITY: u32 = ${selection.output.length}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(compactedClusterIds)}u;
const TOTAL_OFFSET: u32 = ${getViewElementOffset(selectedTotalCount)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(selection.output)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(selection.count)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(selection.overflow)}u;
${
  selection.totalCount
    ? `const PUBLISHED_TOTAL_OFFSET: u32 = ${getViewElementOffset(selection.totalCount)}u;`
    : ''
}
@group(0) @binding(0) var<storage, read> sourceIds: array<u32>;
@group(0) @binding(1) var<storage, read> sourceTotalCount: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputIds: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputCount: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputOverflow: array<u32>;
${totalCountBinding}

@compute @workgroup_size(${VIRTUAL_GEOMETRY_WORKGROUP_SIZE}) fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>
) {
  let totalCountValue = sourceTotalCount[TOTAL_OFFSET];
  let retained = min(totalCountValue, OUTPUT_CAPACITY);
  let outputIndex = globalId.x;
  if (outputIndex < retained) {
    outputIds[OUTPUT_OFFSET + outputIndex] = sourceIds[SOURCE_OFFSET + outputIndex];
  }
  if (outputIndex == 0u) {
    outputCount[COUNT_OFFSET] = retained;
    outputOverflow[OVERFLOW_OFFSET] = select(0u, 1u, totalCountValue > OUTPUT_CAPACITY);
    ${totalCountWrite}
  }
}`;
  addComputationPass(graph, {
    id: `${selection.id}-finalize`,
    source,
    resources: [
      {buffer: compactedClusterIds, usage: 'storage-read'},
      {buffer: selectedTotalCount, usage: 'storage-read'},
      {buffer: selection.output, usage: 'storage-write'},
      {buffer: selection.count, usage: 'storage-write'},
      {buffer: selection.overflow, usage: 'storage-write'},
      ...(selection.totalCount
        ? ([{buffer: selection.totalCount, usage: 'storage-write'}] as GraphBufferUse[])
        : [])
    ],
    bindings: {
      sourceIds: compactedClusterIds,
      sourceTotalCount: selectedTotalCount,
      outputIds: selection.output,
      outputCount: selection.count,
      outputOverflow: selection.overflow,
      ...(selection.totalCount ? {publishedTotalCount: selection.totalCount} : {})
    },
    dispatchCount: Math.ceil(Math.max(selection.output.length, 1) / VIRTUAL_GEOMETRY_WORKGROUP_SIZE)
  });
}

function addComputationPass<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    source: string;
    resources: GraphBufferUse[];
    bindings: Record<string, GraphDataView>;
    dispatchCount: number;
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
          computation.dispatch(computePass, props.dispatchCount);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}
