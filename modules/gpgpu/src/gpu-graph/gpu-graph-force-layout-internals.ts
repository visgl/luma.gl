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
import {getViewBinding, getViewElementOffset} from '../gpu-core/graph-data-view-utils';
import type {GPUGraphForceLayout} from './gpu-graph-force-layout';

const FORCE_LAYOUT_WORKGROUP_SIZE = 256;
const MINIMUM_REPULSION_DISTANCE_SQUARED = 0.0001;

type ForceLayoutDataView = GraphDataView<'uint32'> | GraphDataView<'float32x2'>;

type ImportedForceLayout = {
  id: string;
  vertexCount: number;
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
  overflow: GraphDataView<'uint32'>;
  reverseOffsets?: GraphDataView<'uint32'>;
  reverseNeighbors?: GraphDataView<'uint32'>;
  reverseOverflow?: GraphDataView<'uint32'>;
  maxComputeWorkgroupsPerDimension: number;
};

type ForceLayoutBinding = {
  view: ForceLayoutDataView;
  usage: GraphBufferUse['usage'];
};

type ForceLayoutPassProps = {
  id: string;
  source: string;
  bindings: Record<string, ForceLayoutBinding>;
  dispatchLayout: GPUBoundedDispatchLayout;
};

/** Adds exact tiled force integration using an explicit bounded dispatch limit. @internal */
export function addGPUGraphForceLayoutToGraphWithDispatchLimit<Parameters>(
  layout: GPUGraphForceLayout,
  commandGraph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  if (layout.topology.graph.vertexCount === 0 && !layout.reset) {
    return;
  }

  const directed = layout.topology.graph.directed;
  const reverse = layout.topology.reverse;
  const state: ImportedForceLayout = {
    id: layout.id,
    vertexCount: layout.topology.graph.vertexCount,
    seed: layout.seed,
    repulsion: layout.repulsion,
    attraction: layout.attraction,
    gravity: layout.gravity,
    damping: layout.damping,
    maxVelocity: layout.maxVelocity,
    timeStep: layout.timeStep,
    positions: commandGraph.importGPUVector(`${layout.id}-positions`, layout.positions).data[0],
    velocities: commandGraph.importGPUVector(`${layout.id}-velocities`, layout.velocities).data[0],
    ...(layout.pinned
      ? {pinned: commandGraph.importGPUVector(`${layout.id}-pinned`, layout.pinned).data[0]}
      : {}),
    ...(layout.reset
      ? {reset: commandGraph.importGPUVector(`${layout.id}-reset`, layout.reset).data[0]}
      : {}),
    forwardOffsets: commandGraph.importGPUVector(
      `${layout.id}-forward-offsets`,
      layout.topology.forward.offsets
    ).data[0],
    forwardNeighbors: commandGraph.importGPUVector(
      `${layout.id}-forward-neighbors`,
      layout.topology.forward.neighbors
    ).data[0],
    overflow: commandGraph.importGPUVector(
      `${layout.id}-forward-overflow`,
      layout.topology.forward.overflow
    ).data[0],
    ...(directed && reverse
      ? {
          reverseOffsets: commandGraph.importGPUVector(
            `${layout.id}-reverse-offsets`,
            reverse.offsets
          ).data[0],
          reverseNeighbors: commandGraph.importGPUVector(
            `${layout.id}-reverse-neighbors`,
            reverse.neighbors
          ).data[0],
          reverseOverflow: commandGraph.importGPUVector(
            `${layout.id}-reverse-overflow`,
            reverse.overflow
          ).data[0]
        }
      : {}),
    maxComputeWorkgroupsPerDimension
  };

  if (state.reset && state.vertexCount > 0) {
    addInitializationPass(commandGraph, state);
  }
  if (state.reset) {
    addResetClearPass(commandGraph, state);
  }
  if (state.vertexCount === 0) {
    return;
  }

  for (let iteration = 0; iteration < layout.iterationsPerFrame; iteration++) {
    addForcePass(commandGraph, {state, iteration});
    addIntegrationPass(commandGraph, {state, iteration});
  }
}

/** Deterministically initializes unpinned positions only when the caller requests a reset. */
function addInitializationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedForceLayout
): void {
  const reset = state.reset!;
  const bindings: Record<string, ForceLayoutBinding> = {
    positions: {view: state.positions, usage: 'storage-read-write'},
    velocities: {view: state.velocities, usage: 'storage-write'},
    reset: {view: reset, usage: 'storage-read'},
    overflow: {view: state.overflow, usage: 'storage-read'},
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
  const pinnedGuard = state.pinned ? 'pinned[PINNED_OFFSET + index] != 0u' : 'false';
  const dispatchLayout = getGPUGraphForceLayoutDispatchLayout(
    state.vertexCount,
    state.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const SEED: u32 = ${state.seed}u;
const POSITIONS_OFFSET: u32 = ${getViewElementOffset(state.positions)}u;
const VELOCITIES_OFFSET: u32 = ${getViewElementOffset(state.velocities)}u;
const RESET_OFFSET: u32 = ${getViewElementOffset(reset)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.overflow)}u;
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

@compute @workgroup_size(${FORCE_LAYOUT_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, FORCE_LAYOUT_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT || reset[RESET_OFFSET] == 0u) { return; }
  let velocityOffset = VELOCITIES_OFFSET + index * 2u;
  velocities[velocityOffset] = 0.0;
  velocities[velocityOffset + 1u] = 0.0;
  let hasOverflow = overflow[OVERFLOW_OFFSET] != 0u${reverseOverflow};
  if (hasOverflow || ${pinnedGuard}) { return; }
  let first = hash(SEED ^ (index * 2u));
  let second = hash(SEED ^ (index * 2u + 1u));
  let positionOffset = POSITIONS_OFFSET + index * 2u;
  positions[positionOffset] = f32(first & 0x00ffffffu) / 16777216.0 * 2.0 - 1.0;
  positions[positionOffset + 1u] = f32(second & 0x00ffffffu) / 16777216.0 * 2.0 - 1.0;
}`;

  addForceLayoutPass(commandGraph, {
    id: `${state.id}-initialize`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Clears the one-shot caller-owned reset control after all initialization invocations finish. */
function addResetClearPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedForceLayout
): void {
  const reset = state.reset!;
  const bindings: Record<string, ForceLayoutBinding> = {
    reset: {view: reset, usage: 'storage-write'}
  };
  const dispatchLayout = getGPUGraphForceLayoutDispatchLayout(
    1,
    state.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const RESET_OFFSET: u32 = ${getViewElementOffset(reset)}u;
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${FORCE_LAYOUT_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, FORCE_LAYOUT_WORKGROUP_SIZE)}
  if (index == 0u) { reset[RESET_OFFSET] = 0u; }
}`;

  addForceLayoutPass(commandGraph, {
    id: `${state.id}-clear-reset`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Evaluates exact tiled all-pairs repulsion and symmetric incident-edge attraction. */
function addForcePass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {state: ImportedForceLayout; iteration: number}
): void {
  const {state} = props;
  const bindings: Record<string, ForceLayoutBinding> = {
    positions: {view: state.positions, usage: 'storage-read'},
    velocities: {view: state.velocities, usage: 'storage-read-write'},
    forwardOffsets: {view: state.forwardOffsets, usage: 'storage-read'},
    forwardNeighbors: {view: state.forwardNeighbors, usage: 'storage-read'},
    overflow: {view: state.overflow, usage: 'storage-read'},
    ...(state.reverseOffsets && state.reverseNeighbors && state.reverseOverflow
      ? {
          reverseOffsets: {view: state.reverseOffsets, usage: 'storage-read'},
          reverseNeighbors: {view: state.reverseNeighbors, usage: 'storage-read'},
          reverseOverflow: {view: state.reverseOverflow, usage: 'storage-read'}
        }
      : {})
  };
  const reverseConstants =
    state.reverseOffsets && state.reverseNeighbors && state.reverseOverflow
      ? `const REVERSE_CAPACITY: u32 = ${state.reverseNeighbors.length}u;
const REVERSE_OFFSETS_OFFSET: u32 = ${getViewElementOffset(state.reverseOffsets)}u;
const REVERSE_NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(state.reverseNeighbors)}u;
const REVERSE_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.reverseOverflow)}u;`
      : '';
  const reverseOverflow = state.reverseOverflow
    ? ' || reverseOverflow[REVERSE_OVERFLOW_OFFSET] != 0u'
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
  const tileCount = Math.ceil(state.vertexCount / FORCE_LAYOUT_WORKGROUP_SIZE);
  const dispatchLayout = getGPUGraphForceLayoutDispatchLayout(
    state.vertexCount,
    state.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const TILE_COUNT: u32 = ${tileCount}u;
const FORWARD_CAPACITY: u32 = ${state.forwardNeighbors.length}u;
const POSITIONS_OFFSET: u32 = ${getViewElementOffset(state.positions)}u;
const VELOCITIES_OFFSET: u32 = ${getViewElementOffset(state.velocities)}u;
const FORWARD_OFFSETS_OFFSET: u32 = ${getViewElementOffset(state.forwardOffsets)}u;
const FORWARD_NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(state.forwardNeighbors)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.overflow)}u;
const REPULSION: f32 = ${state.repulsion};
const ATTRACTION: f32 = ${state.attraction};
const GRAVITY: f32 = ${state.gravity};
const DAMPING: f32 = ${state.damping};
const MAX_VELOCITY: f32 = ${state.maxVelocity};
const TIME_STEP: f32 = ${state.timeStep};
const MINIMUM_DISTANCE_SQUARED: f32 = ${MINIMUM_REPULSION_DISTANCE_SQUARED};
${reverseConstants}
${getBindingDeclarations(bindings)}
var<workgroup> tilePositions: array<vec2<f32>, ${FORCE_LAYOUT_WORKGROUP_SIZE}>;

fn readPosition(vertex: u32) -> vec2<f32> {
  let positionOffset = POSITIONS_OFFSET + vertex * 2u;
  return vec2<f32>(positions[positionOffset], positions[positionOffset + 1u]);
}

@compute @workgroup_size(${FORCE_LAYOUT_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, FORCE_LAYOUT_WORKGROUP_SIZE)}
  if (workgroupIndex >= TILE_COUNT) { return; }
  let isActiveVertex = index < VERTEX_COUNT;
  let hasOverflow = overflow[OVERFLOW_OFFSET] != 0u${reverseOverflow};
  var position = vec2<f32>(0.0);
  if (isActiveVertex) { position = readPosition(index); }
  var force = -GRAVITY * position;

  for (var tile = 0u; tile < TILE_COUNT; tile++) {
    let sourceVertex = tile * ${FORCE_LAYOUT_WORKGROUP_SIZE}u + localInvocationIndex;
    if (sourceVertex < VERTEX_COUNT) {
      tilePositions[localInvocationIndex] = readPosition(sourceVertex);
    } else {
      tilePositions[localInvocationIndex] = vec2<f32>(0.0);
    }
    workgroupBarrier();

    if (isActiveVertex && !hasOverflow) {
      let firstVertex = tile * ${FORCE_LAYOUT_WORKGROUP_SIZE}u;
      let count = min(${FORCE_LAYOUT_WORKGROUP_SIZE}u, VERTEX_COUNT - firstVertex);
      for (var localVertex = 0u; localVertex < count; localVertex++) {
        if (firstVertex + localVertex != index) {
          let difference = position - tilePositions[localVertex];
          let distanceSquared = max(dot(difference, difference), MINIMUM_DISTANCE_SQUARED);
          force += REPULSION * difference / distanceSquared;
        }
      }
    }
    workgroupBarrier();
  }

  if (!isActiveVertex) { return; }
  let velocityOffset = VELOCITIES_OFFSET + index * 2u;
  if (hasOverflow) {
    velocities[velocityOffset] = 0.0;
    velocities[velocityOffset + 1u] = 0.0;
    return;
  }

  let first = min(forwardOffsets[FORWARD_OFFSETS_OFFSET + index], FORWARD_CAPACITY);
  let last = min(forwardOffsets[FORWARD_OFFSETS_OFFSET + index + 1u], FORWARD_CAPACITY);
  for (var slot = first; slot < last; slot++) {
    let neighbor = forwardNeighbors[FORWARD_NEIGHBORS_OFFSET + slot];
    if (neighbor < VERTEX_COUNT) {
      force += ATTRACTION * (readPosition(neighbor) - position);
    }
  }
  ${reverseAttraction}
  let previousVelocity = vec2<f32>(velocities[velocityOffset], velocities[velocityOffset + 1u]);
  var velocity = (previousVelocity + force * TIME_STEP) * DAMPING;
  let speed = length(velocity);
  if (speed > MAX_VELOCITY) { velocity *= MAX_VELOCITY / speed; }
  velocities[velocityOffset] = velocity.x;
  velocities[velocityOffset + 1u] = velocity.y;
}`;

  addForceLayoutPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-forces`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Integrates one globally synchronized velocity field while preserving pinned positions. */
function addIntegrationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {state: ImportedForceLayout; iteration: number}
): void {
  const {state} = props;
  const bindings: Record<string, ForceLayoutBinding> = {
    positions: {view: state.positions, usage: 'storage-read-write'},
    velocities: {view: state.velocities, usage: 'storage-read-write'},
    overflow: {view: state.overflow, usage: 'storage-read'},
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
  const dispatchLayout = getGPUGraphForceLayoutDispatchLayout(
    state.vertexCount,
    state.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const TIME_STEP: f32 = ${state.timeStep};
const POSITIONS_OFFSET: u32 = ${getViewElementOffset(state.positions)}u;
const VELOCITIES_OFFSET: u32 = ${getViewElementOffset(state.velocities)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.overflow)}u;
${reverseOffset}
${pinnedOffset}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${FORCE_LAYOUT_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, FORCE_LAYOUT_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT) { return; }
  let velocityOffset = VELOCITIES_OFFSET + index * 2u;
  let blocked = overflow[OVERFLOW_OFFSET] != 0u${reverseOverflow}${pinned};
  if (blocked) {
    velocities[velocityOffset] = 0.0;
    velocities[velocityOffset + 1u] = 0.0;
    return;
  }
  let positionOffset = POSITIONS_OFFSET + index * 2u;
  positions[positionOffset] += velocities[velocityOffset] * TIME_STEP;
  positions[positionOffset + 1u] += velocities[velocityOffset + 1u] * TIME_STEP;
}`;

  addForceLayoutPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-integrate`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Declares uint32 metadata and float32 scalar components in portable binding order. */
function getBindingDeclarations(bindings: Record<string, ForceLayoutBinding>): string {
  return Object.entries(bindings)
    .map(([name, binding], location) => {
      const access = binding.usage === 'storage-read' ? 'read' : 'read_write';
      const element = binding.view.format === 'uint32' ? 'u32' : 'f32';
      return `@group(0) @binding(${location}) var<storage, ${access}> ${name}: array<${element}>;`;
    })
    .join('\n');
}

/** Compiles one bounded compute pass without graph-owned scratch or hidden submission. */
function addForceLayoutPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: ForceLayoutPassProps
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

/** Plans bounded three-dimensional position initialization and force integration. @internal */
export function getGPUGraphForceLayoutDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    'GPUGraphForceLayout',
    elementCount,
    FORCE_LAYOUT_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}
