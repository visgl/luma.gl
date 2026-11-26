// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import {Buffer, type Binding} from '@luma.gl/core';
import {Kernel} from '../execution/compute/kernel';
import type {
  GPUCommandGraph,
  GPUCommandGraphGPUIndirectCondition,
  GraphBufferUse,
  GraphDataView,
  GraphVectorView
} from '../gpu-core/gpu-command-graph';
import {
  type GPUBoundedDispatchLayout,
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../gpu-core/gpu-dispatch-utils';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset
} from '../gpu-core/graph-data-view-utils';
import type {GPUGraphAlgorithmsSingleSourceShortestPath} from './gpu-graph-single-source-shortest-path';
import type {GPUGraphAlgorithmsAdjacency} from './gpu-graph-topology';

const SHORTEST_PATH_WORKGROUP_SIZE = 256;
const POSITIVE_INFINITY_BITS = 0x7f800000;
const UNREACHABLE_PREDECESSOR = 0xffffffff;

/**
 * Layout of the uint32 control record shared by every round. Elements 0-2 are the indirect
 * dispatch command of each round pass; x is zero once the search stops. @internal
 */
export const SHORTEST_PATH_CONTROL_DISPATCH_X = 0;
/** Control element counting the relaxation rounds that ran. @internal */
export const SHORTEST_PATH_CONTROL_ITERATIONS = 3;
/** Control element that is nonzero when invalid weights or adjacency overflow stop the search. @internal */
export const SHORTEST_PATH_CONTROL_FAILED = 4;
/** Control element mirroring the convergence status. @internal */
export const SHORTEST_PATH_CONTROL_CONVERGED = 5;
/** Byte length of the control record. @internal */
export const SHORTEST_PATH_CONTROL_BYTE_LENGTH = 32;

/** Buffers that must survive between the separately compiled graphs of a batched run. @internal */
export type GPUGraphAlgorithmsShortestPathPersistentState = {
  /** Control record with `STORAGE | INDIRECT` usage. */
  control: Buffer;
};

type ShortestPathDataView = GraphDataView<'uint32'> | GraphDataView<'float32'>;

type ImportedShortestPathAdjacency = {
  offsets: GraphDataView<'uint32'>;
  neighbors: GraphDataView<'uint32'>;
  edgeWeights?: GraphDataView<'float32'>;
  overflow: GraphDataView<'uint32'>;
};

type ImportedShortestPathState = {
  id: string;
  vertexCount: number;
  edgeCount: number;
  maxIterations: number;
  distances: GraphDataView<'float32'>;
  predecessors: GraphDataView<'uint32'>;
  converged: GraphDataView<'uint32'>;
  invalidWeightCount: GraphDataView<'uint32'>;
  control: GraphDataView<'uint32'>;
  roundCondition: GPUCommandGraphGPUIndirectCondition;
  useIncoming: boolean;
  seeds?: GraphDataView<'uint32'>;
  previousDistances?: GraphDataView<'float32'>;
  changed?: GraphDataView<'uint32'>;
  sourceVertices?: GraphVectorView<'uint32'>;
  targetVertices?: GraphVectorView<'uint32'>;
  sourceWeights?: GraphVectorView<'float32'>;
  primaryAdjacency: ImportedShortestPathAdjacency;
  secondaryAdjacency?: ImportedShortestPathAdjacency;
  maxComputeWorkgroupsPerDimension: number;
};

type ShortestPathBinding = {
  view: ShortestPathDataView;
  usage: GraphBufferUse['usage'];
  atomic?: boolean;
};

type ShortestPathPassProps = {
  id: string;
  source: string;
  bindings: Record<string, ShortestPathBinding>;
  dispatchLayout: GPUBoundedDispatchLayout;
  condition?: GPUCommandGraphGPUIndirectCondition;
  /** Vertex uploaded to a node-owned `seeds` buffer bound after the graph bindings. */
  ownedSeed?: number;
};

/**
 * Adds initialization and `roundCount` GPU-gated weighted Bellman-Ford rounds to one graph,
 * using an explicit bounded dispatch limit. `roundCount` defaults to `min(maxIterations, 1024)`.
 * @internal
 */
export function addGPUGraphAlgorithmsSingleSourceShortestPathToGraphWithDispatchLimit<Parameters>(
  search: GPUGraphAlgorithmsSingleSourceShortestPath,
  commandGraph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number,
  roundCount = Math.min(search.maxIterations, 1024)
): void {
  const state = importShortestPathState(search, commandGraph, maxComputeWorkgroupsPerDimension, {
    rounds: roundCount > 0
  });
  addInitialization(commandGraph, state, search);
  addRounds(commandGraph, state, roundCount, 0);
}

/** Adds only the reset, weight validation, status, and seed passes of a batched run. @internal */
export function addGPUGraphAlgorithmsShortestPathInitializationToGraph<Parameters>(
  search: GPUGraphAlgorithmsSingleSourceShortestPath,
  commandGraph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number,
  persistent: GPUGraphAlgorithmsShortestPathPersistentState
): void {
  const state = importShortestPathState(search, commandGraph, maxComputeWorkgroupsPerDimension, {
    rounds: false,
    persistent
  });
  addInitialization(commandGraph, state, search);
}

/** Adds `roundCount` GPU-gated rounds that continue from the current distances. @internal */
export function addGPUGraphAlgorithmsShortestPathRoundsToGraph<Parameters>(
  search: GPUGraphAlgorithmsSingleSourceShortestPath,
  commandGraph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number,
  roundCount: number,
  persistent: GPUGraphAlgorithmsShortestPathPersistentState
): void {
  const state = importShortestPathState(search, commandGraph, maxComputeWorkgroupsPerDimension, {
    rounds: true,
    persistent
  });
  addRounds(commandGraph, state, roundCount, 0);
}

/** Imports caller-owned vectors and declares the scratch and control views of one graph. */
function importShortestPathState<Parameters>(
  search: GPUGraphAlgorithmsSingleSourceShortestPath,
  commandGraph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number,
  options: {rounds: boolean; persistent?: GPUGraphAlgorithmsShortestPathPersistentState}
): ImportedShortestPathState {
  const directed = search.topology.graph.directed;
  const useIncoming = directed && search.direction === 'incoming';
  const primaryAdjacency = importShortestPathAdjacency(
    commandGraph,
    `${search.id}-${useIncoming ? 'incoming' : 'outgoing'}`,
    useIncoming ? search.topology.reverse! : search.topology.forward
  );
  const controlDescriptor = {
    id: `${search.id}-control`,
    byteLength: SHORTEST_PATH_CONTROL_BYTE_LENGTH,
    usage: Buffer.STORAGE | Buffer.INDIRECT | Buffer.COPY_SRC
  };
  const controlBuffer = options.persistent
    ? commandGraph.importBuffer(controlDescriptor, options.persistent.control)
    : commandGraph.createTransientBuffer(controlDescriptor);
  const state: ImportedShortestPathState = {
    id: search.id,
    vertexCount: search.topology.graph.vertexCount,
    edgeCount: search.topology.graph.edgeCount,
    maxIterations: search.maxIterations,
    useIncoming,
    ...(search.seeds
      ? {seeds: commandGraph.importGPUVector(`${search.id}-seeds`, search.seeds).data[0]}
      : {}),
    control: commandGraph.createDataView(controlBuffer, {
      format: 'uint32',
      length: SHORTEST_PATH_CONTROL_BYTE_LENGTH / Uint32Array.BYTES_PER_ELEMENT
    }),
    roundCondition: {
      id: `${search.id}-round-active`,
      source: 'gpu',
      mode: 'indirect',
      buffer: controlBuffer,
      byteOffset: SHORTEST_PATH_CONTROL_DISPATCH_X * Uint32Array.BYTES_PER_ELEMENT
    },
    distances: commandGraph.importGPUVector(`${search.id}-distances`, search.distances).data[0],
    predecessors: commandGraph.importGPUVector(`${search.id}-predecessors`, search.predecessors)
      .data[0],
    converged: search.converged
      ? commandGraph.importGPUVector(`${search.id}-converged`, search.converged).data[0]
      : createTransientView(commandGraph, `${search.id}-converged-scratch`, 'uint32', 1),
    invalidWeightCount: search.invalidWeightCount
      ? commandGraph.importGPUVector(`${search.id}-invalid-weight-count`, search.invalidWeightCount)
          .data[0]
      : createTransientView(commandGraph, `${search.id}-invalid-weight-scratch`, 'uint32', 1),
    ...(options.rounds
      ? {
          previousDistances: createTransientView(
            commandGraph,
            `${search.id}-previous-distances`,
            'float32',
            search.topology.graph.vertexCount
          ),
          changed: createTransientView(commandGraph, `${search.id}-changed`, 'uint32', 1)
        }
      : {}),
    ...(search.topology.graph.edgeWeights
      ? {
          sourceVertices: commandGraph.importGPUVector(
            `${search.id}-source-vertices`,
            search.topology.graph.sourceVertices
          ),
          targetVertices: commandGraph.importGPUVector(
            `${search.id}-target-vertices`,
            search.topology.graph.targetVertices
          ),
          sourceWeights: commandGraph.importGPUVector(
            `${search.id}-source-weights`,
            search.topology.graph.edgeWeights
          )
        }
      : {}),
    primaryAdjacency,
    ...(directed && search.direction === 'both'
      ? {
          secondaryAdjacency: importShortestPathAdjacency(
            commandGraph,
            `${search.id}-incoming`,
            search.topology.reverse!
          )
        }
      : {}),
    maxComputeWorkgroupsPerDimension
  };
  return state;
}

/** Resets outputs, validates weights, publishes the control record, and places the seeds. */
function addInitialization<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedShortestPathState,
  search: GPUGraphAlgorithmsSingleSourceShortestPath
): void {
  addInitializationPass(commandGraph, state);
  for (const [chunkIndex, weights] of state.sourceWeights?.data.entries() ?? []) {
    if (weights.length > 0) {
      addWeightValidationPass(commandGraph, {
        state,
        weights,
        sources: state.sourceVertices!.data[chunkIndex],
        targets: state.targetVertices!.data[chunkIndex],
        chunkIndex
      });
    }
  }
  addStatusPass(commandGraph, state);
  addSeedPass(commandGraph, state, search);
}

/** Adds GPU-gated rounds; `firstIteration` only names the nodes. */
function addRounds<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedShortestPathState,
  roundCount: number,
  firstIteration: number
): void {
  const useIncoming = state.useIncoming;
  for (let iteration = firstIteration; iteration < firstIteration + roundCount; iteration++) {
    addSnapshotPass(commandGraph, state, iteration);
    addRelaxationPass(commandGraph, {
      state,
      adjacency: state.primaryAdjacency,
      iteration,
      direction: useIncoming ? 'incoming' : 'outgoing'
    });
    if (state.secondaryAdjacency) {
      addRelaxationPass(commandGraph, {
        state,
        adjacency: state.secondaryAdjacency,
        iteration,
        direction: 'incoming'
      });
    }
    addPredecessorResetPass(commandGraph, state, iteration);
    addPredecessorPass(commandGraph, {
      state,
      adjacency: state.primaryAdjacency,
      iteration,
      direction: useIncoming ? 'incoming' : 'outgoing'
    });
    if (state.secondaryAdjacency) {
      addPredecessorPass(commandGraph, {
        state,
        adjacency: state.secondaryAdjacency,
        iteration,
        direction: 'incoming'
      });
    }
    addConvergencePass(commandGraph, state, iteration);
  }
}

/** Imports the capacity-bounded CSR and optional edge weights for one traversal direction. */
function importShortestPathAdjacency<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  id: string,
  adjacency: GPUGraphAlgorithmsAdjacency
): ImportedShortestPathAdjacency {
  return {
    offsets: commandGraph.importGPUVector(`${id}-offsets`, adjacency.offsets).data[0],
    neighbors: commandGraph.importGPUVector(`${id}-neighbors`, adjacency.neighbors).data[0],
    ...(adjacency.edgeWeights
      ? {
          edgeWeights: commandGraph.importGPUVector(`${id}-edge-weights`, adjacency.edgeWeights)
            .data[0]
        }
      : {}),
    overflow: commandGraph.importGPUVector(`${id}-overflow`, adjacency.overflow).data[0]
  };
}

/** Resets every caller-visible output and internal status before each graph encoding. */
function addInitializationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedShortestPathState
): void {
  const bindings: Record<string, ShortestPathBinding> = {
    distances: {view: state.distances, usage: 'storage-write', atomic: true},
    predecessors: {view: state.predecessors, usage: 'storage-write', atomic: true},
    invalidWeightCount: {view: state.invalidWeightCount, usage: 'storage-write', atomic: true}
  };
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const DISTANCES_OFFSET: u32 = ${getViewElementOffset(state.distances)}u;
const PREDECESSORS_OFFSET: u32 = ${getViewElementOffset(state.predecessors)}u;
const INVALID_WEIGHT_COUNT_OFFSET: u32 = ${getViewElementOffset(state.invalidWeightCount)}u;
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${SHORTEST_PATH_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getInvocationIndexSource(state, Math.max(state.vertexCount, 1))}
  if (index == 0u) {
    atomicStore(&invalidWeightCount[INVALID_WEIGHT_COUNT_OFFSET], 0u);
  }
  if (index >= VERTEX_COUNT) { return; }
  atomicStore(&distances[DISTANCES_OFFSET + index], ${POSITIVE_INFINITY_BITS}u);
  atomicStore(&predecessors[PREDECESSORS_OFFSET + index], ${UNREACHABLE_PREDECESSOR}u);
}`;
  addShortestPathPass(commandGraph, {
    id: `${state.id}-initialize`,
    source,
    bindings,
    dispatchLayout: getDispatchLayout(state, Math.max(state.vertexCount, 1))
  });
}

/** Counts every invalid original source edge exactly once, excluding invalid endpoint rows. */
function addWeightValidationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    state: ImportedShortestPathState;
    sources: GraphDataView<'uint32'>;
    targets: GraphDataView<'uint32'>;
    weights: GraphDataView<'float32'>;
    chunkIndex: number;
  }
): void {
  const {state} = props;
  const bindings: Record<string, ShortestPathBinding> = {
    sources: {view: props.sources, usage: 'storage-read'},
    targets: {view: props.targets, usage: 'storage-read'},
    weights: {view: props.weights, usage: 'storage-read'},
    invalidWeightCount: {view: state.invalidWeightCount, usage: 'storage-read-write', atomic: true}
  };
  const source = /* wgsl */ `
const EDGE_COUNT: u32 = ${props.weights.length}u;
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const SOURCES_OFFSET: u32 = ${getViewElementOffset(props.sources)}u;
const TARGETS_OFFSET: u32 = ${getViewElementOffset(props.targets)}u;
const WEIGHTS_OFFSET: u32 = ${getViewElementOffset(props.weights)}u;
const INVALID_WEIGHT_COUNT_OFFSET: u32 = ${getViewElementOffset(state.invalidWeightCount)}u;
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${SHORTEST_PATH_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getInvocationIndexSource(state, props.weights.length)}
  if (index >= EDGE_COUNT) { return; }
  if (sources[SOURCES_OFFSET + index] >= VERTEX_COUNT ||
      targets[TARGETS_OFFSET + index] >= VERTEX_COUNT) { return; }
  let bits = bitcast<u32>(weights[WEIGHTS_OFFSET + index]);
  let magnitude = bits & 0x7fffffffu;
  let negative = (bits & 0x80000000u) != 0u && magnitude != 0u;
  if (magnitude >= 0x7f800000u || negative) {
    atomicAdd(&invalidWeightCount[INVALID_WEIGHT_COUNT_OFFSET], 1u);
  }
}`;
  addShortestPathPass(commandGraph, {
    id: `${state.id}-validate-weights-${props.chunkIndex}`,
    source,
    bindings,
    dispatchLayout: getDispatchLayout(state, props.weights.length)
  });
}

/** Publishes failure, trivial convergence, and the first round dispatch after weight validation. */
function addStatusPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedShortestPathState
): void {
  const bindings: Record<string, ShortestPathBinding> = {
    converged: {view: state.converged, usage: 'storage-write'},
    control: {view: state.control, usage: 'storage-write'},
    invalidWeightCount: {view: state.invalidWeightCount, usage: 'storage-read'},
    ...getOverflowBindings(state)
  };
  const triviallyConverged = state.vertexCount <= 1 || state.edgeCount === 0;
  const stopsBeforeRounds = triviallyConverged || state.maxIterations === 0;
  const roundLayout = getDispatchLayout(state, Math.max(state.vertexCount, 1));
  const source = /* wgsl */ `
const CONVERGED_OFFSET: u32 = ${getViewElementOffset(state.converged)}u;
const CONTROL_OFFSET: u32 = ${getViewElementOffset(state.control)}u;
const INVALID_WEIGHT_COUNT_OFFSET: u32 = ${getViewElementOffset(state.invalidWeightCount)}u;
${getOverflowConstants(state)}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(1)
fn main() {
  let failed = invalidWeightCount[INVALID_WEIGHT_COUNT_OFFSET] != 0u || ${getOverflowGuard(state)};
  let converges = !failed && ${triviallyConverged};
  let stopped = failed || ${stopsBeforeRounds};
  control[CONTROL_OFFSET + ${SHORTEST_PATH_CONTROL_DISPATCH_X}u] = select(${roundLayout.x}u, 0u, stopped);
  control[CONTROL_OFFSET + 1u] = ${roundLayout.y}u;
  control[CONTROL_OFFSET + 2u] = ${roundLayout.z}u;
  control[CONTROL_OFFSET + ${SHORTEST_PATH_CONTROL_ITERATIONS}u] = 0u;
  control[CONTROL_OFFSET + ${SHORTEST_PATH_CONTROL_FAILED}u] = select(0u, 1u, failed);
  control[CONTROL_OFFSET + ${SHORTEST_PATH_CONTROL_CONVERGED}u] = select(0u, 1u, converges);
  converged[CONVERGED_OFFSET] = select(0u, 1u, converges);
}`;
  addShortestPathPass(commandGraph, {
    id: `${state.id}-status`,
    source,
    bindings,
    dispatchLayout: {x: 1, y: 1, z: 1}
  });
}

/**
 * Places every valid seed at distance zero unless the search failed.
 *
 * A constant `sourceVertex` is uploaded to a node-owned buffer at compile time, so the shader
 * source, and with it the cached pipeline, does not depend on the source vertex.
 */
function addSeedPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedShortestPathState,
  search: GPUGraphAlgorithmsSingleSourceShortestPath
): void {
  const seedCount = state.seeds?.length ?? 1;
  const bindings: Record<string, ShortestPathBinding> = {
    control: {view: state.control, usage: 'storage-read'},
    distances: {view: state.distances, usage: 'storage-read-write', atomic: true},
    ...(state.seeds ? {seeds: {view: state.seeds, usage: 'storage-read' as const}} : {})
  };
  const declarations = getBindingDeclarations(bindings);
  const ownedSeedLocation = Object.keys(bindings).length;
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const SEED_COUNT: u32 = ${seedCount}u;
const SEEDS_OFFSET: u32 = ${state.seeds ? getViewElementOffset(state.seeds) : 0}u;
const CONTROL_OFFSET: u32 = ${getViewElementOffset(state.control)}u;
const DISTANCES_OFFSET: u32 = ${getViewElementOffset(state.distances)}u;
${declarations}
${state.seeds ? '' : `@group(0) @binding(${ownedSeedLocation}) var<storage, read> seeds: array<u32>;`}

@compute @workgroup_size(${SHORTEST_PATH_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getInvocationIndexSource(state, seedCount)}
  if (index >= SEED_COUNT || control[CONTROL_OFFSET + ${SHORTEST_PATH_CONTROL_FAILED}u] != 0u) {
    return;
  }
  let vertex = seeds[SEEDS_OFFSET + index];
  if (vertex < VERTEX_COUNT) {
    atomicStore(&distances[DISTANCES_OFFSET + vertex], 0u);
  }
}`;
  addShortestPathPass(commandGraph, {
    id: `${state.id}-seeds`,
    source,
    bindings,
    dispatchLayout: getDispatchLayout(state, seedCount),
    ...(state.seeds ? {} : {ownedSeed: search.sourceVertex!})
  });
}

/** Saves the previous round so parallel relaxations cannot cross multiple hops in one dispatch. */
function addSnapshotPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedShortestPathState,
  iteration: number
): void {
  const previousDistances = state.previousDistances!;
  const changed = state.changed!;
  const bindings: Record<string, ShortestPathBinding> = {
    distances: {view: state.distances, usage: 'storage-read-write', atomic: true},
    previousDistances: {view: previousDistances, usage: 'storage-write'},
    changed: {view: changed, usage: 'storage-write', atomic: true}
  };
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const DISTANCES_OFFSET: u32 = ${getViewElementOffset(state.distances)}u;
const PREVIOUS_DISTANCES_OFFSET: u32 = ${getViewElementOffset(previousDistances)}u;
const CHANGED_OFFSET: u32 = ${getViewElementOffset(changed)}u;
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${SHORTEST_PATH_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getInvocationIndexSource(state, Math.max(state.vertexCount, 1))}
  if (index == 0u) { atomicStore(&changed[CHANGED_OFFSET], 0u); }
  if (index >= VERTEX_COUNT) { return; }
  previousDistances[PREVIOUS_DISTANCES_OFFSET + index] =
    bitcast<f32>(atomicLoad(&distances[DISTANCES_OFFSET + index]));
}`;
  addShortestPathPass(commandGraph, {
    id: `${state.id}-iteration-${iteration}-snapshot`,
    source,
    bindings,
    dispatchLayout: getDispatchLayout(state, Math.max(state.vertexCount, 1)),
    condition: state.roundCondition
  });
}

/** Computes one exact-hop parallel Bellman-Ford relaxation through aligned weighted CSR. */
function addRelaxationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    state: ImportedShortestPathState;
    adjacency: ImportedShortestPathAdjacency;
    iteration: number;
    direction: 'outgoing' | 'incoming';
  }
): void {
  const {state, adjacency} = props;
  const previousDistances = state.previousDistances!;
  const changed = state.changed!;
  const bindings: Record<string, ShortestPathBinding> = {
    offsets: {view: adjacency.offsets, usage: 'storage-read'},
    neighbors: {view: adjacency.neighbors, usage: 'storage-read'},
    ...(adjacency.edgeWeights
      ? {edgeWeights: {view: adjacency.edgeWeights, usage: 'storage-read' as const}}
      : {}),
    previousDistances: {view: previousDistances, usage: 'storage-read'},
    distances: {view: state.distances, usage: 'storage-read-write', atomic: true},
    changed: {view: changed, usage: 'storage-read-write', atomic: true}
  };
  const weightOffset = adjacency.edgeWeights
    ? `const WEIGHTS_OFFSET: u32 = ${getViewElementOffset(adjacency.edgeWeights)}u;`
    : '';
  const weight = adjacency.edgeWeights ? 'edgeWeights[WEIGHTS_OFFSET + slot]' : '1.0';
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const CAPACITY: u32 = ${adjacency.neighbors.length}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(adjacency.offsets)}u;
const NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(adjacency.neighbors)}u;
const PREVIOUS_DISTANCES_OFFSET: u32 = ${getViewElementOffset(previousDistances)}u;
const DISTANCES_OFFSET: u32 = ${getViewElementOffset(state.distances)}u;
const CHANGED_OFFSET: u32 = ${getViewElementOffset(changed)}u;
${weightOffset}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${SHORTEST_PATH_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getInvocationIndexSource(state, state.vertexCount)}
  if (index >= VERTEX_COUNT) { return; }
  let distance = previousDistances[PREVIOUS_DISTANCES_OFFSET + index];
  if (bitcast<u32>(distance) >= 0x7f800000u) { return; }
  let first = min(offsets[OFFSETS_OFFSET + index], CAPACITY);
  let last = min(offsets[OFFSETS_OFFSET + index + 1u], CAPACITY);
  for (var slot = first; slot < last; slot++) {
    let neighbor = neighbors[NEIGHBORS_OFFSET + slot];
    if (neighbor >= VERTEX_COUNT) { continue; }
    let candidate = distance + ${weight};
    let candidateBits = bitcast<u32>(candidate);
    if (candidateBits >= 0x7f800000u) { continue; }
    let previous = atomicMin(&distances[DISTANCES_OFFSET + neighbor], candidateBits);
    if (candidateBits < previous) { atomicStore(&changed[CHANGED_OFFSET], 1u); }
  }
}`;
  addShortestPathPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-relax-${props.direction}`,
    source,
    bindings,
    dispatchLayout: getDispatchLayout(state, state.vertexCount),
    condition: state.roundCondition
  });
}

/** Clears stale parents only where this synchronized round discovered a better distance. */
function addPredecessorResetPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedShortestPathState,
  iteration: number
): void {
  const previousDistances = state.previousDistances!;
  const bindings: Record<string, ShortestPathBinding> = {
    previousDistances: {view: previousDistances, usage: 'storage-read'},
    distances: {view: state.distances, usage: 'storage-read-write', atomic: true},
    predecessors: {view: state.predecessors, usage: 'storage-read-write', atomic: true}
  };
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const PREVIOUS_DISTANCES_OFFSET: u32 = ${getViewElementOffset(previousDistances)}u;
const DISTANCES_OFFSET: u32 = ${getViewElementOffset(state.distances)}u;
const PREDECESSORS_OFFSET: u32 = ${getViewElementOffset(state.predecessors)}u;
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${SHORTEST_PATH_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getInvocationIndexSource(state, state.vertexCount)}
  // A seed keeps distance zero, so it never takes this branch and keeps the sentinel parent.
  if (index >= VERTEX_COUNT) { return; }
  let previous = bitcast<u32>(previousDistances[PREVIOUS_DISTANCES_OFFSET + index]);
  let current = atomicLoad(&distances[DISTANCES_OFFSET + index]);
  if (current < previous) {
    atomicStore(&predecessors[PREDECESSORS_OFFSET + index], ${UNREACHABLE_PREDECESSOR}u);
  }
}`;
  addShortestPathPass(commandGraph, {
    id: `${state.id}-iteration-${iteration}-reset-predecessors`,
    source,
    bindings,
    dispatchLayout: getDispatchLayout(state, state.vertexCount),
    condition: state.roundCondition
  });
}

/** Selects the lowest stable parent among equally short, same-hop newly discovered paths. */
function addPredecessorPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    state: ImportedShortestPathState;
    adjacency: ImportedShortestPathAdjacency;
    iteration: number;
    direction: 'outgoing' | 'incoming';
  }
): void {
  const {state, adjacency} = props;
  const previousDistances = state.previousDistances!;
  const bindings: Record<string, ShortestPathBinding> = {
    offsets: {view: adjacency.offsets, usage: 'storage-read'},
    neighbors: {view: adjacency.neighbors, usage: 'storage-read'},
    ...(adjacency.edgeWeights
      ? {edgeWeights: {view: adjacency.edgeWeights, usage: 'storage-read' as const}}
      : {}),
    previousDistances: {view: previousDistances, usage: 'storage-read'},
    distances: {view: state.distances, usage: 'storage-read-write', atomic: true},
    predecessors: {view: state.predecessors, usage: 'storage-read-write', atomic: true}
  };
  const weightOffset = adjacency.edgeWeights
    ? `const WEIGHTS_OFFSET: u32 = ${getViewElementOffset(adjacency.edgeWeights)}u;`
    : '';
  const weight = adjacency.edgeWeights ? 'edgeWeights[WEIGHTS_OFFSET + slot]' : '1.0';
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const CAPACITY: u32 = ${adjacency.neighbors.length}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(adjacency.offsets)}u;
const NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(adjacency.neighbors)}u;
const PREVIOUS_DISTANCES_OFFSET: u32 = ${getViewElementOffset(previousDistances)}u;
const DISTANCES_OFFSET: u32 = ${getViewElementOffset(state.distances)}u;
const PREDECESSORS_OFFSET: u32 = ${getViewElementOffset(state.predecessors)}u;
${weightOffset}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${SHORTEST_PATH_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getInvocationIndexSource(state, state.vertexCount)}
  if (index >= VERTEX_COUNT) { return; }
  let sourceDistance = previousDistances[PREVIOUS_DISTANCES_OFFSET + index];
  if (bitcast<u32>(sourceDistance) >= 0x7f800000u) { return; }
  let first = min(offsets[OFFSETS_OFFSET + index], CAPACITY);
  let last = min(offsets[OFFSETS_OFFSET + index + 1u], CAPACITY);
  for (var slot = first; slot < last; slot++) {
    let neighbor = neighbors[NEIGHBORS_OFFSET + slot];
    // A seed never improves, so the first condition below also keeps its sentinel parent.
    if (neighbor >= VERTEX_COUNT) { continue; }
    let previousDistance = bitcast<u32>(previousDistances[PREVIOUS_DISTANCES_OFFSET + neighbor]);
    let currentDistance = atomicLoad(&distances[DISTANCES_OFFSET + neighbor]);
    let candidate = bitcast<u32>(sourceDistance + ${weight});
    if (currentDistance < previousDistance && candidate == currentDistance) {
      atomicMin(&predecessors[PREDECESSORS_OFFSET + neighbor], index);
    }
  }
}`;
  addShortestPathPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-predecessors-${props.direction}`,
    source,
    bindings,
    dispatchLayout: getDispatchLayout(state, state.vertexCount),
    condition: state.roundCondition
  });
}

/**
 * Counts the round and stops later rounds on convergence or at the round budget.
 *
 * Stopping writes a zero x dimension into the shared indirect dispatch command, so every later
 * round pass dispatches no workgroups, in this submission and in later ones.
 */
function addConvergencePass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedShortestPathState,
  iteration: number
): void {
  const changed = state.changed!;
  const bindings: Record<string, ShortestPathBinding> = {
    changed: {view: changed, usage: 'storage-read'},
    converged: {view: state.converged, usage: 'storage-write'},
    control: {view: state.control, usage: 'storage-read-write'}
  };
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const MAX_ITERATIONS: u32 = ${state.maxIterations}u;
const CHANGED_OFFSET: u32 = ${getViewElementOffset(changed)}u;
const CONVERGED_OFFSET: u32 = ${getViewElementOffset(state.converged)}u;
const CONTROL_OFFSET: u32 = ${getViewElementOffset(state.control)}u;
${getBindingDeclarations(bindings)}

@compute @workgroup_size(1)
fn main() {
  if (control[CONTROL_OFFSET + ${SHORTEST_PATH_CONTROL_DISPATCH_X}u] == 0u) { return; }
  let iterations = control[CONTROL_OFFSET + ${SHORTEST_PATH_CONTROL_ITERATIONS}u] + 1u;
  control[CONTROL_OFFSET + ${SHORTEST_PATH_CONTROL_ITERATIONS}u] = iterations;
  // No change, or V - 1 rounds, which bound every simple path, mean every distance is final.
  if (changed[CHANGED_OFFSET] == 0u || iterations + 1u >= VERTEX_COUNT) {
    converged[CONVERGED_OFFSET] = 1u;
    control[CONTROL_OFFSET + ${SHORTEST_PATH_CONTROL_CONVERGED}u] = 1u;
    control[CONTROL_OFFSET + ${SHORTEST_PATH_CONTROL_DISPATCH_X}u] = 0u;
  } else if (iterations >= MAX_ITERATIONS) {
    control[CONTROL_OFFSET + ${SHORTEST_PATH_CONTROL_DISPATCH_X}u] = 0u;
  }
}`;
  addShortestPathPass(commandGraph, {
    id: `${state.id}-iteration-${iteration}-convergence`,
    source,
    bindings,
    dispatchLayout: {x: 1, y: 1, z: 1}
  });
}

/** Returns storage reads for every adjacency direction required by this traversal. */
function getOverflowBindings(
  state: ImportedShortestPathState
): Record<string, ShortestPathBinding> {
  return {
    overflow: {view: state.primaryAdjacency.overflow, usage: 'storage-read'},
    ...(state.secondaryAdjacency
      ? {secondaryOverflow: {view: state.secondaryAdjacency.overflow, usage: 'storage-read'}}
      : {})
  };
}

/** Emits aligned component offsets for primary and optional secondary adjacency status. */
function getOverflowConstants(state: ImportedShortestPathState): string {
  return [
    `const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.primaryAdjacency.overflow)}u;`,
    ...(state.secondaryAdjacency
      ? [
          `const SECONDARY_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.secondaryAdjacency.overflow)}u;`
        ]
      : [])
  ].join('\n');
}

/** Emits the fail-closed condition for every selected adjacency direction. */
function getOverflowGuard(state: ImportedShortestPathState): string {
  return `overflow[OVERFLOW_OFFSET] != 0u${
    state.secondaryAdjacency ? ' || secondaryOverflow[SECONDARY_OVERFLOW_OFFSET] != 0u' : ''
  }`;
}

/** Declares storage arrays, reinterpreting non-negative float32 distances as atomic uint32. */
function getBindingDeclarations(bindings: Record<string, ShortestPathBinding>): string {
  return Object.entries(bindings)
    .map(([name, binding], location) => {
      const access = binding.usage === 'storage-read' ? 'read' : 'read_write';
      const element = binding.atomic
        ? 'atomic<u32>'
        : binding.view.format === 'float32'
          ? 'f32'
          : 'u32';
      return `@group(0) @binding(${location}) var<storage, ${access}> ${name}: array<${element}>;`;
    })
    .join('\n');
}

/** Compiles one bounded GPU pass without submitting, reading back, or owning caller buffers. */
function addShortestPathPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: ShortestPathPassProps
): void {
  const names = Object.keys(props.bindings);
  if (props.ownedSeed !== undefined) names.push('seeds');
  commandGraph.addComputePass({
    id: props.id,
    resources: Object.values(props.bindings).map(({view, usage}) => ({buffer: view, usage})),
    ...(props.condition ? {condition: props.condition} : {}),
    compile: ({device}) => {
      const kernel = new Kernel(device, {
        id: props.id,
        source: props.source,
        shaderLayout: {
          bindings: names.map((name, location) => ({
            name,
            type: 'storage' as const,
            group: 0,
            location
          }))
        }
      });
      const ownedSeed =
        props.ownedSeed === undefined
          ? undefined
          : device.createBuffer({
              id: `${props.id}-source-vertex`,
              data: Uint32Array.of(props.ownedSeed),
              usage: Buffer.STORAGE
            });

      return {
        encode: ({computePass, getBuffer}) => {
          const bindings: Record<string, Binding> = {};
          for (const [name, binding] of Object.entries(props.bindings)) {
            bindings[name] = getViewBinding(binding.view, getBuffer);
          }
          if (ownedSeed) bindings['seeds'] = ownedSeed;
          kernel.dispatch(computePass, {
            bindings,
            x: props.dispatchLayout.x,
            y: props.dispatchLayout.y,
            z: props.dispatchLayout.z
          });
        },
        destroy: () => {
          kernel.destroy();
          ownedSeed?.destroy();
        }
      };
    }
  });
}

/** Plans one bounded vertex or source-edge dispatch using the owning adapter's limits. */
function getDispatchLayout(
  state: ImportedShortestPathState,
  elementCount: number
): GPUBoundedDispatchLayout {
  return getGPUGraphAlgorithmsSingleSourceShortestPathDispatchLayout(
    elementCount,
    state.maxComputeWorkgroupsPerDimension
  );
}

/** Emits a three-dimensional global invocation index for the planned bounded dispatch. */
function getInvocationIndexSource(state: ImportedShortestPathState, elementCount: number): string {
  return getBoundedInvocationIndexSource(
    getDispatchLayout(state, elementCount),
    SHORTEST_PATH_WORKGROUP_SIZE
  );
}

/** Plans one bounded three-dimensional weighted shortest-path dispatch. @internal */
export function getGPUGraphAlgorithmsSingleSourceShortestPathDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    'GPUGraphAlgorithmsSingleSourceShortestPath',
    elementCount,
    SHORTEST_PATH_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}
