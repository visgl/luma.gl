// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {GPUCommandGraph, GraphBufferUse, GraphDataView} from '../gpu-core/gpu-command-graph';
import {
  type GPUBoundedDispatchLayout,
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../gpu-core/gpu-dispatch-utils';
import {GPUGridIndex} from '../gpu-core/gpu-grid-index';
import {addGPUGridIndexToGraphWithDispatchLimit} from '../gpu-core/gpu-grid-index-internals';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset
} from '../gpu-core/graph-data-view-utils';
import type {GPUGraphSpatialForceLayout} from './gpu-graph-spatial-force-layout';

const SPATIAL_FORCE_WORKGROUP_SIZE = 256;
const MINIMUM_REPULSION_DISTANCE_SQUARED = 0.0001;

type SpatialDataView = GraphDataView<'uint32'> | GraphDataView<'float32x2'>;

type ImportedSpatialLayout = {
  id: string;
  vertexCount: number;
  cellCount: number;
  gridSize: readonly [number, number];
  bounds: readonly [number, number, number, number];
  theta: number;
  nearCellRadius: number;
  seed: number;
  repulsion: number;
  attraction: number;
  gravity: number;
  damping: number;
  maxVelocity: number;
  timeStep: number;
  positions: GraphDataView<'float32x2'>;
  velocities: GraphDataView<'float32x2'>;
  pinned?: GraphDataView<'uint32'>;
  reset?: GraphDataView<'uint32'>;
  forwardOffsets: GraphDataView<'uint32'>;
  forwardNeighbors: GraphDataView<'uint32'>;
  forwardOverflow: GraphDataView<'uint32'>;
  reverseOffsets?: GraphDataView<'uint32'>;
  reverseNeighbors?: GraphDataView<'uint32'>;
  reverseOverflow?: GraphDataView<'uint32'>;
  cellOffsets: GraphDataView<'uint32'>;
  vertexIds: GraphDataView<'uint32'>;
  cellCenters: GraphDataView<'float32x2'>;
  count: GraphDataView<'uint32'>;
  overflow: GraphDataView<'uint32'>;
  validity: GraphDataView<'uint32'>;
  maxComputeWorkgroupsPerDimension: number;
};

type SpatialBinding = {
  view: SpatialDataView;
  usage: GraphBufferUse['usage'];
};

type SpatialPassProps = {
  id: string;
  source: string;
  bindings: Record<string, SpatialBinding>;
  dispatchLayout: GPUBoundedDispatchLayout;
};

/** Adds honest near-exact/far-monopole force integration with bounded dispatch. @internal */
export function addGPUGraphSpatialForceLayoutToGraphWithDispatchLimit<Parameters>(
  spatial: GPUGraphSpatialForceLayout,
  commandGraph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  const layout = spatial.layout;
  const reverse = layout.topology.reverse;
  const state: ImportedSpatialLayout = {
    id: spatial.id,
    vertexCount: layout.topology.graph.vertexCount,
    cellCount: spatial.cellCount,
    gridSize: spatial.gridSize,
    bounds: spatial.bounds,
    theta: spatial.theta,
    nearCellRadius: spatial.nearCellRadius,
    seed: layout.seed,
    repulsion: layout.repulsion,
    attraction: layout.attraction,
    gravity: layout.gravity,
    damping: layout.damping,
    maxVelocity: layout.maxVelocity,
    timeStep: layout.timeStep,
    positions: commandGraph.importGPUVector(`${spatial.id}-positions`, layout.positions).data[0],
    velocities: commandGraph.importGPUVector(`${spatial.id}-velocities`, layout.velocities).data[0],
    ...(layout.pinned
      ? {pinned: commandGraph.importGPUVector(`${spatial.id}-pinned`, layout.pinned).data[0]}
      : {}),
    ...(layout.reset
      ? {reset: commandGraph.importGPUVector(`${spatial.id}-reset`, layout.reset).data[0]}
      : {}),
    forwardOffsets: commandGraph.importGPUVector(
      `${spatial.id}-forward-offsets`,
      layout.topology.forward.offsets
    ).data[0],
    forwardNeighbors: commandGraph.importGPUVector(
      `${spatial.id}-forward-neighbors`,
      layout.topology.forward.neighbors
    ).data[0],
    forwardOverflow: commandGraph.importGPUVector(
      `${spatial.id}-forward-overflow`,
      layout.topology.forward.overflow
    ).data[0],
    ...(layout.topology.graph.directed && reverse
      ? {
          reverseOffsets: commandGraph.importGPUVector(
            `${spatial.id}-reverse-offsets`,
            reverse.offsets
          ).data[0],
          reverseNeighbors: commandGraph.importGPUVector(
            `${spatial.id}-reverse-neighbors`,
            reverse.neighbors
          ).data[0],
          reverseOverflow: commandGraph.importGPUVector(
            `${spatial.id}-reverse-overflow`,
            reverse.overflow
          ).data[0]
        }
      : {}),
    cellOffsets: commandGraph.importGPUVector(`${spatial.id}-cell-offsets`, spatial.cellOffsets)
      .data[0],
    vertexIds: commandGraph.importGPUVector(`${spatial.id}-vertex-ids`, spatial.vertexIds).data[0],
    cellCenters: commandGraph.importGPUVector(`${spatial.id}-cell-centers`, spatial.cellCenters)
      .data[0],
    count: commandGraph.importGPUVector(`${spatial.id}-index-count`, spatial.count).data[0],
    overflow: commandGraph.importGPUVector(`${spatial.id}-index-overflow`, spatial.overflow)
      .data[0],
    validity: createTransientView(commandGraph, `${spatial.id}-validity`, 'uint32', 1),
    maxComputeWorkgroupsPerDimension
  };

  if (state.reset && state.vertexCount > 0) {
    addInitializationPass(commandGraph, state);
  }
  if (state.reset) {
    addResetClearPass(commandGraph, state);
  }

  const iterationCount = state.vertexCount === 0 ? 1 : layout.iterationsPerFrame;
  for (let iteration = 0; iteration < iterationCount; iteration++) {
    const index = new GPUGridIndex({
      id: `${state.id}-iteration-${iteration}-index`,
      positions: state.positions,
      gridSize: state.gridSize,
      bounds: state.bounds,
      cellOffsets: state.cellOffsets,
      objectIds: state.vertexIds,
      count: state.count,
      overflow: state.overflow
    });
    addGPUGridIndexToGraphWithDispatchLimit(
      index,
      commandGraph,
      state.maxComputeWorkgroupsPerDimension
    );
    addValidityPass(commandGraph, {state, iteration});
    addCellCenterPass(commandGraph, {state, iteration});
    if (state.vertexCount > 0) {
      addRepulsionPass(commandGraph, {state, iteration});
      addAttractionPass(commandGraph, {state, iteration});
      addIntegrationPass(commandGraph, {state, iteration});
    }
  }
}

/** Preserves the exact-layout reset hash, pinned coordinates, and topology overflow contract. */
function addInitializationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedSpatialLayout
): void {
  const reset = state.reset!;
  const bindings: Record<string, SpatialBinding> = {
    positions: {view: state.positions, usage: 'storage-read-write'},
    velocities: {view: state.velocities, usage: 'storage-write'},
    reset: {view: reset, usage: 'storage-read'},
    forwardOverflow: {view: state.forwardOverflow, usage: 'storage-read'},
    ...(state.reverseOverflow
      ? {reverseOverflow: {view: state.reverseOverflow, usage: 'storage-read'}}
      : {}),
    ...(state.pinned ? {pinned: {view: state.pinned, usage: 'storage-read'}} : {})
  };
  const reverseOffset = state.reverseOverflow
    ? `const REVERSE_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.reverseOverflow)}u;`
    : '';
  const pinnedOffset = state.pinned
    ? `const PINNED_OFFSET: u32 = ${getViewElementOffset(state.pinned)}u;`
    : '';
  const reverseOverflow = state.reverseOverflow
    ? ' || reverseOverflow[REVERSE_OVERFLOW_OFFSET] != 0u'
    : '';
  const pinned = state.pinned ? ' || pinned[PINNED_OFFSET + index] != 0u' : '';
  const dispatchLayout = getSpatialDispatchLayout(state, state.vertexCount);
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const SEED: u32 = ${state.seed}u;
const POSITIONS_OFFSET: u32 = ${getViewElementOffset(state.positions)}u;
const VELOCITIES_OFFSET: u32 = ${getViewElementOffset(state.velocities)}u;
const RESET_OFFSET: u32 = ${getViewElementOffset(reset)}u;
const FORWARD_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.forwardOverflow)}u;
${reverseOffset}
${pinnedOffset}
${getBindingDeclarations(bindings)}

fn hash(value: u32) -> u32 {
  var result = value;
  result ^= result >> 16u;
  result *= 0x7feb352du;
  result ^= result >> 15u;
  result *= 0x846ca68bu;
  result ^= result >> 16u;
  return result;
}

@compute @workgroup_size(${SPATIAL_FORCE_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, SPATIAL_FORCE_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT || reset[RESET_OFFSET] == 0u) { return; }
  let velocityOffset = VELOCITIES_OFFSET + index * 2u;
  velocities[velocityOffset] = 0.0;
  velocities[velocityOffset + 1u] = 0.0;
  if (forwardOverflow[FORWARD_OVERFLOW_OFFSET] != 0u${reverseOverflow}${pinned}) { return; }
  let first = hash(SEED ^ (index * 2u));
  let second = hash(SEED ^ (index * 2u + 1u));
  let positionOffset = POSITIONS_OFFSET + index * 2u;
  positions[positionOffset] = f32(first & 0x00ffffffu) / 16777216.0 * 2.0 - 1.0;
  positions[positionOffset + 1u] = f32(second & 0x00ffffffu) / 16777216.0 * 2.0 - 1.0;
}`;
  addSpatialPass(commandGraph, {id: `${state.id}-initialize`, source, bindings, dispatchLayout});
}

/** Consumes a one-shot reset request only after every initialization invocation completes. */
function addResetClearPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedSpatialLayout
): void {
  const reset = state.reset!;
  const bindings: Record<string, SpatialBinding> = {
    reset: {view: reset, usage: 'storage-write'}
  };
  const dispatchLayout = getSpatialDispatchLayout(state, 1);
  const source = /* wgsl */ `
const RESET_OFFSET: u32 = ${getViewElementOffset(reset)}u;
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${SPATIAL_FORCE_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, SPATIAL_FORCE_WORKGROUP_SIZE)}
  if (index == 0u) { reset[RESET_OFFSET] = 0u; }
}`;
  addSpatialPass(commandGraph, {id: `${state.id}-clear-reset`, source, bindings, dispatchLayout});
}

/** Combines exact topology and complete in-domain index status into one portable binding. */
function addValidityPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {state: ImportedSpatialLayout; iteration: number}
): void {
  const {state} = props;
  const bindings: Record<string, SpatialBinding> = {
    count: {view: state.count, usage: 'storage-read'},
    indexOverflow: {view: state.overflow, usage: 'storage-read'},
    forwardOverflow: {view: state.forwardOverflow, usage: 'storage-read'},
    validity: {view: state.validity, usage: 'storage-write'},
    ...(state.reverseOverflow
      ? {reverseOverflow: {view: state.reverseOverflow, usage: 'storage-read'}}
      : {})
  };
  const reverseOffset = state.reverseOverflow
    ? `const REVERSE_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.reverseOverflow)}u;`
    : '';
  const reverseGuard = state.reverseOverflow
    ? ' && reverseOverflow[REVERSE_OVERFLOW_OFFSET] == 0u'
    : '';
  const dispatchLayout = getSpatialDispatchLayout(state, 1);
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(state.count)}u;
const INDEX_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.overflow)}u;
const FORWARD_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.forwardOverflow)}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(state.validity)}u;
${reverseOffset}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${SPATIAL_FORCE_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, SPATIAL_FORCE_WORKGROUP_SIZE)}
  if (index != 0u) { return; }
  let isValid =
    count[COUNT_OFFSET] == VERTEX_COUNT &&
    indexOverflow[INDEX_OVERFLOW_OFFSET] == 0u &&
    forwardOverflow[FORWARD_OVERFLOW_OFFSET] == 0u${reverseGuard};
  validity[VALIDITY_OFFSET] = select(0u, 1u, isValid);
}`;
  addSpatialPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-validate`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Computes each exact cell center sequentially without floating-point atomic operations. */
function addCellCenterPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {state: ImportedSpatialLayout; iteration: number}
): void {
  const {state} = props;
  const bindings: Record<string, SpatialBinding> = {
    positions: {view: state.positions, usage: 'storage-read'},
    cellOffsets: {view: state.cellOffsets, usage: 'storage-read'},
    vertexIds: {view: state.vertexIds, usage: 'storage-read'},
    cellCenters: {view: state.cellCenters, usage: 'storage-write'},
    validity: {view: state.validity, usage: 'storage-read'}
  };
  const dispatchLayout = getSpatialDispatchLayout(state, state.cellCount);
  const source = /* wgsl */ `
const CELL_COUNT: u32 = ${state.cellCount}u;
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const CAPACITY: u32 = ${state.vertexIds.length}u;
const POSITIONS_OFFSET: u32 = ${getViewElementOffset(state.positions)}u;
const CELL_OFFSETS_OFFSET: u32 = ${getViewElementOffset(state.cellOffsets)}u;
const VERTEX_IDS_OFFSET: u32 = ${getViewElementOffset(state.vertexIds)}u;
const CELL_CENTERS_OFFSET: u32 = ${getViewElementOffset(state.cellCenters)}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(state.validity)}u;
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${SPATIAL_FORCE_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, SPATIAL_FORCE_WORKGROUP_SIZE)}
  if (index >= CELL_COUNT) { return; }
  var center = vec2<f32>(0.0);
  var mass = 0u;
  if (validity[VALIDITY_OFFSET] != 0u) {
    let first = min(cellOffsets[CELL_OFFSETS_OFFSET + index], CAPACITY);
    let last = min(cellOffsets[CELL_OFFSETS_OFFSET + index + 1u], CAPACITY);
    for (var slot = first; slot < last; slot++) {
      let vertex = vertexIds[VERTEX_IDS_OFFSET + slot];
      if (vertex < VERTEX_COUNT) {
        let positionOffset = POSITIONS_OFFSET + vertex * 2u;
        center += vec2<f32>(positions[positionOffset], positions[positionOffset + 1u]);
        mass++;
      }
    }
  }
  if (mass > 0u) { center /= f32(mass); }
  let centerOffset = CELL_CENTERS_OFFSET + index * 2u;
  cellCenters[centerOffset] = center.x;
  cellCenters[centerOffset + 1u] = center.y;
}`;
  addSpatialPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-cell-centers`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Visits every occupied cell, retaining exact near-field and accepted far-field monopoles. */
function addRepulsionPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {state: ImportedSpatialLayout; iteration: number}
): void {
  const {state} = props;
  const bindings: Record<string, SpatialBinding> = {
    positions: {view: state.positions, usage: 'storage-read'},
    velocities: {view: state.velocities, usage: 'storage-read-write'},
    cellOffsets: {view: state.cellOffsets, usage: 'storage-read'},
    vertexIds: {view: state.vertexIds, usage: 'storage-read'},
    cellCenters: {view: state.cellCenters, usage: 'storage-read'},
    validity: {view: state.validity, usage: 'storage-read'}
  };
  const dispatchLayout = getSpatialDispatchLayout(state, state.vertexCount);
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const CELL_COUNT: u32 = ${state.cellCount}u;
const WIDTH: u32 = ${state.gridSize[0]}u;
const HEIGHT: u32 = ${state.gridSize[1]}u;
const CAPACITY: u32 = ${state.vertexIds.length}u;
const NEAR_CELL_RADIUS: u32 = ${state.nearCellRadius}u;
const MINIMUM_X: f32 = ${getFloatLiteral(state.bounds[0])};
const MINIMUM_Y: f32 = ${getFloatLiteral(state.bounds[1])};
const MAXIMUM_X: f32 = ${getFloatLiteral(state.bounds[2])};
const MAXIMUM_Y: f32 = ${getFloatLiteral(state.bounds[3])};
const THETA: f32 = ${getFloatLiteral(state.theta)};
const REPULSION: f32 = ${getFloatLiteral(state.repulsion)};
const GRAVITY: f32 = ${getFloatLiteral(state.gravity)};
const TIME_STEP: f32 = ${getFloatLiteral(state.timeStep)};
const MINIMUM_DISTANCE_SQUARED: f32 = ${MINIMUM_REPULSION_DISTANCE_SQUARED};
const POSITIONS_OFFSET: u32 = ${getViewElementOffset(state.positions)}u;
const VELOCITIES_OFFSET: u32 = ${getViewElementOffset(state.velocities)}u;
const CELL_OFFSETS_OFFSET: u32 = ${getViewElementOffset(state.cellOffsets)}u;
const VERTEX_IDS_OFFSET: u32 = ${getViewElementOffset(state.vertexIds)}u;
const CELL_CENTERS_OFFSET: u32 = ${getViewElementOffset(state.cellCenters)}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(state.validity)}u;
${getBindingDeclarations(bindings)}

fn getCoordinate(value: f32, minimum: f32, maximum: f32, size: u32) -> u32 {
  if (maximum == minimum || value == minimum) { return 0u; }
  if (value == maximum) { return size - 1u; }
  if (minimum < 0.0 && maximum > 0.0) {
    let scale = max(abs(minimum), abs(maximum));
    let scaledValue = value / scale;
    let scaledMinimum = minimum / scale;
    let scaledMaximum = maximum / scale;
    return min(
      u32((scaledValue - scaledMinimum) / (scaledMaximum - scaledMinimum) * f32(size)),
      size - 1u
    );
  }
  return min(u32((value - minimum) / (maximum - minimum) * f32(size)), size - 1u);
}

fn readPosition(vertex: u32) -> vec2<f32> {
  let positionOffset = POSITIONS_OFFSET + vertex * 2u;
  return vec2<f32>(positions[positionOffset], positions[positionOffset + 1u]);
}

@compute @workgroup_size(${SPATIAL_FORCE_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, SPATIAL_FORCE_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT) { return; }
  let velocityOffset = VELOCITIES_OFFSET + index * 2u;
  if (validity[VALIDITY_OFFSET] == 0u) {
    velocities[velocityOffset] = 0.0;
    velocities[velocityOffset + 1u] = 0.0;
    return;
  }

  let position = readPosition(index);
  let sourceColumn = getCoordinate(position.x, MINIMUM_X, MAXIMUM_X, WIDTH);
  let sourceRow = getCoordinate(position.y, MINIMUM_Y, MAXIMUM_Y, HEIGHT);
  let cellWidth = (MAXIMUM_X - MINIMUM_X) / f32(WIDTH);
  let cellHeight = (MAXIMUM_Y - MINIMUM_Y) / f32(HEIGHT);
  let cellDiameterSquared = cellWidth * cellWidth + cellHeight * cellHeight;
  var force = -GRAVITY * position;

  for (var cell = 0u; cell < CELL_COUNT; cell++) {
    let first = min(cellOffsets[CELL_OFFSETS_OFFSET + cell], CAPACITY);
    let last = min(cellOffsets[CELL_OFFSETS_OFFSET + cell + 1u], CAPACITY);
    let mass = last - first;
    if (mass == 0u) { continue; }
    let column = cell % WIDTH;
    let row = cell / WIDTH;
    let columnDistance = max(column, sourceColumn) - min(column, sourceColumn);
    let rowDistance = max(row, sourceRow) - min(row, sourceRow);
    let isNear = columnDistance <= NEAR_CELL_RADIUS && rowDistance <= NEAR_CELL_RADIUS;
    let centerOffset = CELL_CENTERS_OFFSET + cell * 2u;
    let center = vec2<f32>(cellCenters[centerOffset], cellCenters[centerOffset + 1u]);
    let centerDifference = position - center;
    let distanceSquared = dot(centerDifference, centerDifference);
    let useMonopole =
      !isNear && THETA > 0.0 && cellDiameterSquared < THETA * THETA * distanceSquared;
    if (useMonopole) {
      force += REPULSION * f32(mass) * centerDifference /
        max(distanceSquared, MINIMUM_DISTANCE_SQUARED);
      continue;
    }
    for (var slot = first; slot < last; slot++) {
      let otherVertex = vertexIds[VERTEX_IDS_OFFSET + slot];
      if (otherVertex >= VERTEX_COUNT || otherVertex == index) { continue; }
      let difference = position - readPosition(otherVertex);
      let separationSquared = max(dot(difference, difference), MINIMUM_DISTANCE_SQUARED);
      force += REPULSION * difference / separationSquared;
    }
  }

  let previous = vec2<f32>(velocities[velocityOffset], velocities[velocityOffset + 1u]);
  let velocity = previous + force * TIME_STEP;
  velocities[velocityOffset] = velocity.x;
  velocities[velocityOffset + 1u] = velocity.y;
}`;
  addSpatialPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-repulsion`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Adds symmetric incident-edge attraction and applies the exact layout's damping and cap. */
function addAttractionPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {state: ImportedSpatialLayout; iteration: number}
): void {
  const {state} = props;
  const bindings: Record<string, SpatialBinding> = {
    positions: {view: state.positions, usage: 'storage-read'},
    velocities: {view: state.velocities, usage: 'storage-read-write'},
    forwardOffsets: {view: state.forwardOffsets, usage: 'storage-read'},
    forwardNeighbors: {view: state.forwardNeighbors, usage: 'storage-read'},
    validity: {view: state.validity, usage: 'storage-read'},
    ...(state.reverseOffsets && state.reverseNeighbors
      ? {
          reverseOffsets: {view: state.reverseOffsets, usage: 'storage-read'},
          reverseNeighbors: {view: state.reverseNeighbors, usage: 'storage-read'}
        }
      : {})
  };
  const reverseConstants =
    state.reverseOffsets && state.reverseNeighbors
      ? `const REVERSE_CAPACITY: u32 = ${state.reverseNeighbors.length}u;
const REVERSE_OFFSETS_OFFSET: u32 = ${getViewElementOffset(state.reverseOffsets)}u;
const REVERSE_NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(state.reverseNeighbors)}u;`
      : '';
  const reverseAttraction =
    state.reverseOffsets && state.reverseNeighbors
      ? `let reverseFirst = min(reverseOffsets[REVERSE_OFFSETS_OFFSET + index], REVERSE_CAPACITY);
  let reverseLast = min(reverseOffsets[REVERSE_OFFSETS_OFFSET + index + 1u], REVERSE_CAPACITY);
  for (var slot = reverseFirst; slot < reverseLast; slot++) {
    let neighbor = reverseNeighbors[REVERSE_NEIGHBORS_OFFSET + slot];
    if (neighbor < VERTEX_COUNT) {
      force += ATTRACTION * (readPosition(neighbor) - position);
    }
  }`
      : '';
  const dispatchLayout = getSpatialDispatchLayout(state, state.vertexCount);
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const FORWARD_CAPACITY: u32 = ${state.forwardNeighbors.length}u;
const POSITIONS_OFFSET: u32 = ${getViewElementOffset(state.positions)}u;
const VELOCITIES_OFFSET: u32 = ${getViewElementOffset(state.velocities)}u;
const FORWARD_OFFSETS_OFFSET: u32 = ${getViewElementOffset(state.forwardOffsets)}u;
const FORWARD_NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(state.forwardNeighbors)}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(state.validity)}u;
const ATTRACTION: f32 = ${getFloatLiteral(state.attraction)};
const DAMPING: f32 = ${getFloatLiteral(state.damping)};
const MAX_VELOCITY: f32 = ${getFloatLiteral(state.maxVelocity)};
const TIME_STEP: f32 = ${getFloatLiteral(state.timeStep)};
${reverseConstants}
${getBindingDeclarations(bindings)}

fn readPosition(vertex: u32) -> vec2<f32> {
  let positionOffset = POSITIONS_OFFSET + vertex * 2u;
  return vec2<f32>(positions[positionOffset], positions[positionOffset + 1u]);
}

@compute @workgroup_size(${SPATIAL_FORCE_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, SPATIAL_FORCE_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT) { return; }
  let velocityOffset = VELOCITIES_OFFSET + index * 2u;
  if (validity[VALIDITY_OFFSET] == 0u) {
    velocities[velocityOffset] = 0.0;
    velocities[velocityOffset + 1u] = 0.0;
    return;
  }
  let position = readPosition(index);
  var force = vec2<f32>(0.0);
  let first = min(forwardOffsets[FORWARD_OFFSETS_OFFSET + index], FORWARD_CAPACITY);
  let last = min(forwardOffsets[FORWARD_OFFSETS_OFFSET + index + 1u], FORWARD_CAPACITY);
  for (var slot = first; slot < last; slot++) {
    let neighbor = forwardNeighbors[FORWARD_NEIGHBORS_OFFSET + slot];
    if (neighbor < VERTEX_COUNT) {
      force += ATTRACTION * (readPosition(neighbor) - position);
    }
  }
  ${reverseAttraction}
  let previous = vec2<f32>(velocities[velocityOffset], velocities[velocityOffset + 1u]);
  var velocity = (previous + force * TIME_STEP) * DAMPING;
  let speed = length(velocity);
  if (speed > MAX_VELOCITY) { velocity *= MAX_VELOCITY / speed; }
  velocities[velocityOffset] = velocity.x;
  velocities[velocityOffset + 1u] = velocity.y;
}`;
  addSpatialPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-attraction`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Preserves invalid-index and pinned coordinates while publishing bounded velocities. */
function addIntegrationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {state: ImportedSpatialLayout; iteration: number}
): void {
  const {state} = props;
  const bindings: Record<string, SpatialBinding> = {
    positions: {view: state.positions, usage: 'storage-read-write'},
    velocities: {view: state.velocities, usage: 'storage-read-write'},
    validity: {view: state.validity, usage: 'storage-read'},
    ...(state.pinned ? {pinned: {view: state.pinned, usage: 'storage-read'}} : {})
  };
  const pinnedOffset = state.pinned
    ? `const PINNED_OFFSET: u32 = ${getViewElementOffset(state.pinned)}u;`
    : '';
  const pinned = state.pinned ? ' || pinned[PINNED_OFFSET + index] != 0u' : '';
  const dispatchLayout = getSpatialDispatchLayout(state, state.vertexCount);
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const POSITIONS_OFFSET: u32 = ${getViewElementOffset(state.positions)}u;
const VELOCITIES_OFFSET: u32 = ${getViewElementOffset(state.velocities)}u;
const VALIDITY_OFFSET: u32 = ${getViewElementOffset(state.validity)}u;
const TIME_STEP: f32 = ${getFloatLiteral(state.timeStep)};
${pinnedOffset}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${SPATIAL_FORCE_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, SPATIAL_FORCE_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT) { return; }
  let velocityOffset = VELOCITIES_OFFSET + index * 2u;
  if (validity[VALIDITY_OFFSET] == 0u${pinned}) {
    velocities[velocityOffset] = 0.0;
    velocities[velocityOffset + 1u] = 0.0;
    return;
  }
  let positionOffset = POSITIONS_OFFSET + index * 2u;
  positions[positionOffset] += velocities[velocityOffset] * TIME_STEP;
  positions[positionOffset + 1u] += velocities[velocityOffset + 1u] * TIME_STEP;
}`;
  addSpatialPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-integrate`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Declares packed uint32 views and float32x2 component arrays in binding order. */
function getBindingDeclarations(bindings: Record<string, SpatialBinding>): string {
  return Object.entries(bindings)
    .map(([name, binding], location) => {
      const access = binding.usage === 'storage-read' ? 'read' : 'read_write';
      const element = binding.view.format === 'uint32' ? 'u32' : 'f32';
      return `@group(0) @binding(${location}) var<storage, ${access}> ${name}: array<${element}>;`;
    })
    .join('\n');
}

/** Compiles one bounded pass without floating-point atomics, submission, or readback. */
function addSpatialPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: SpatialPassProps
): void {
  commandGraph.addComputePass({
    id: props.id,
    resources: Object.values(props.bindings).map(({view, usage}) => ({buffer: view, usage})),
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
          for (const [name, binding] of Object.entries(props.bindings)) {
            bindings[name] = getViewBinding(binding.view, getBuffer);
          }
          computation.setBindings(bindings);
          computation.dispatch(
            computePass,
            props.dispatchLayout.x,
            props.dispatchLayout.y,
            props.dispatchLayout.z
          );
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Emits the exact float32 domain literal used by the existing uniform-grid index. */
function getFloatLiteral(value: number): string {
  const literal = `${Math.fround(value)}`;
  return literal.includes('.') || literal.includes('e') ? literal : `${literal}.0`;
}

function getSpatialDispatchLayout(
  state: ImportedSpatialLayout,
  elementCount: number
): GPUBoundedDispatchLayout {
  return getGPUGraphSpatialForceLayoutDispatchLayout(
    elementCount,
    state.maxComputeWorkgroupsPerDimension
  );
}

/** Plans bounded three-dimensional spatial index, cell, and vertex dispatch. @internal */
export function getGPUGraphSpatialForceLayoutDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    'GPUGraphSpatialForceLayout',
    elementCount,
    SPATIAL_FORCE_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}
