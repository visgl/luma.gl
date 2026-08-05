// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GraphBufferUse,
  GraphDataView,
  GraphVectorView
} from '../gpu-primitives/gpu-command-graph';
import {
  type GPUBoundedDispatchLayout,
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../gpu-primitives/gpu-dispatch-utils';
import {getViewBinding, getViewElementOffset} from '../gpu-primitives/graph-data-view-utils';
import type {LuGraphBreadthFirstSearch} from './lu-graph-breadth-first-search';
import type {LuGraphAdjacency} from './lu-graph-topology';

const BREADTH_FIRST_SEARCH_WORKGROUP_SIZE = 256;
const UNREACHABLE_VERTEX = 0xffffffff;

type ImportedSearchAdjacency = {
  offsets: GraphDataView<'uint32'>;
  neighbors: GraphDataView<'uint32'>;
  overflow: GraphDataView<'uint32'>;
};

type ImportedBreadthFirstSearch = {
  id: string;
  vertexCount: number;
  seeds: GraphVectorView<'uint32'>;
  distances: GraphDataView<'uint32'>;
  predecessors: GraphDataView<'uint32'>;
  mask?: GraphDataView<'uint32'>;
  seedCount?: GraphDataView<'uint32'>;
  activeDepth?: GraphDataView<'uint32'>;
  primaryAdjacency: ImportedSearchAdjacency;
  secondaryAdjacency?: ImportedSearchAdjacency;
  maxComputeWorkgroupsPerDimension: number;
};

type BreadthFirstSearchBinding = {
  view: GraphDataView<'uint32'>;
  usage: GraphBufferUse['usage'];
  atomic?: boolean;
};

type BreadthFirstSearchPassProps = {
  id: string;
  source: string;
  bindings: Record<string, BreadthFirstSearchBinding>;
  dispatchLayout: GPUBoundedDispatchLayout;
};

/** Adds deterministic GPU shortest-hop traversal with an explicit dispatch limit. @internal */
export function addLuGraphBreadthFirstSearchToGraphWithDispatchLimit<Parameters>(
  search: LuGraphBreadthFirstSearch,
  commandGraph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  if (search.topology.graph.vertexCount === 0) {
    return;
  }

  const useIncoming = search.topology.graph.directed && search.direction === 'incoming';
  const primaryAdjacency = importSearchAdjacency(
    commandGraph,
    `${search.id}-${useIncoming ? 'incoming' : 'outgoing'}`,
    useIncoming ? search.topology.reverse! : search.topology.forward
  );
  const state: ImportedBreadthFirstSearch = {
    id: search.id,
    vertexCount: search.topology.graph.vertexCount,
    seeds: commandGraph.importGPUVector(`${search.id}-seeds`, search.seeds),
    distances: commandGraph.importGPUVector(`${search.id}-distances`, search.distances).data[0],
    predecessors: commandGraph.importGPUVector(`${search.id}-predecessors`, search.predecessors)
      .data[0],
    ...(search.mask
      ? {mask: commandGraph.importGPUVector(`${search.id}-mask`, search.mask).data[0]}
      : {}),
    ...(search.seedCount
      ? {
          seedCount: commandGraph.importGPUVector(`${search.id}-seed-count`, search.seedCount)
            .data[0]
        }
      : {}),
    ...(search.activeDepth
      ? {
          activeDepth: commandGraph.importGPUVector(`${search.id}-active-depth`, search.activeDepth)
            .data[0]
        }
      : {}),
    primaryAdjacency,
    ...(search.topology.graph.directed && search.direction === 'both'
      ? {
          secondaryAdjacency: importSearchAdjacency(
            commandGraph,
            `${search.id}-incoming`,
            search.topology.reverse!
          )
        }
      : {}),
    maxComputeWorkgroupsPerDimension
  };

  addInitializationPass(commandGraph, state);

  let seedBase = 0;
  for (const [chunkIndex, seeds] of state.seeds.data.entries()) {
    if (seeds.length > 0) {
      addSeedPass(commandGraph, {state, seeds, seedBase, chunkIndex});
    }
    seedBase += seeds.length;
  }

  for (let depth = 0; depth < search.maxDepth; depth++) {
    addExpansionPass(commandGraph, {
      state,
      adjacency: state.primaryAdjacency,
      depth,
      direction: useIncoming ? 'incoming' : 'outgoing'
    });
    if (state.secondaryAdjacency) {
      addExpansionPass(commandGraph, {
        state,
        adjacency: state.secondaryAdjacency,
        depth,
        direction: 'incoming'
      });
    }
  }
}

/** Imports only the packed CSR allocations and overflow state consumed by one direction. */
function importSearchAdjacency<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  id: string,
  adjacency: LuGraphAdjacency
): ImportedSearchAdjacency {
  return {
    offsets: commandGraph.importGPUVector(`${id}-offsets`, adjacency.offsets).data[0],
    neighbors: commandGraph.importGPUVector(`${id}-neighbors`, adjacency.neighbors).data[0],
    overflow: commandGraph.importGPUVector(`${id}-overflow`, adjacency.overflow).data[0]
  };
}

/** Resets published outputs before every encoding without allocating frontier scratch. */
function addInitializationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedBreadthFirstSearch
): void {
  const bindings: Record<string, BreadthFirstSearchBinding> = {
    distances: {view: state.distances, usage: 'storage-write', atomic: true},
    predecessors: {view: state.predecessors, usage: 'storage-write', atomic: true},
    ...(state.mask ? {mask: {view: state.mask, usage: 'storage-write', atomic: true}} : {})
  };
  const maskOffset = state.mask
    ? `const MASK_OFFSET: u32 = ${getViewElementOffset(state.mask)}u;`
    : '';
  const clearMask = state.mask ? 'atomicStore(&mask[MASK_OFFSET + index], 0u);' : '';
  const dispatchLayout = getLuGraphBreadthFirstSearchDispatchLayout(
    state.vertexCount,
    state.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const DISTANCES_OFFSET: u32 = ${getViewElementOffset(state.distances)}u;
const PREDECESSORS_OFFSET: u32 = ${getViewElementOffset(state.predecessors)}u;
${maskOffset}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${BREADTH_FIRST_SEARCH_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, BREADTH_FIRST_SEARCH_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT) { return; }
  atomicStore(&distances[DISTANCES_OFFSET + index], ${UNREACHABLE_VERTEX}u);
  atomicStore(&predecessors[PREDECESSORS_OFFSET + index], ${UNREACHABLE_VERTEX}u);
  ${clearMask}
}`;

  addBreadthFirstSearchPass(commandGraph, {
    id: `${state.id}-initialize`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Publishes valid roots from one original seed chunk unless selected adjacency overflowed. */
function addSeedPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    state: ImportedBreadthFirstSearch;
    seeds: GraphDataView<'uint32'>;
    seedBase: number;
    chunkIndex: number;
  }
): void {
  const {state} = props;
  const bindings: Record<string, BreadthFirstSearchBinding> = {
    seeds: {view: props.seeds, usage: 'storage-read'},
    distances: {view: state.distances, usage: 'storage-read-write', atomic: true},
    overflow: {view: state.primaryAdjacency.overflow, usage: 'storage-read'},
    ...(state.secondaryAdjacency
      ? {secondaryOverflow: {view: state.secondaryAdjacency.overflow, usage: 'storage-read'}}
      : {}),
    ...(state.mask ? {mask: {view: state.mask, usage: 'storage-read-write', atomic: true}} : {}),
    ...(state.seedCount ? {activeSeedCount: {view: state.seedCount, usage: 'storage-read'}} : {})
  };
  const dynamicOffsets = [
    state.secondaryAdjacency
      ? `const SECONDARY_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.secondaryAdjacency.overflow)}u;`
      : '',
    state.mask ? `const MASK_OFFSET: u32 = ${getViewElementOffset(state.mask)}u;` : '',
    state.seedCount
      ? `const ACTIVE_SEED_COUNT_OFFSET: u32 = ${getViewElementOffset(state.seedCount)}u;`
      : ''
  ].join('\n');
  const secondaryOverflowGuard = state.secondaryAdjacency
    ? ' || secondaryOverflow[SECONDARY_OVERFLOW_OFFSET] != 0u'
    : '';
  const seedCountGuard = state.seedCount
    ? `if (${props.seedBase}u + index >= activeSeedCount[ACTIVE_SEED_COUNT_OFFSET]) { return; }`
    : '';
  const publishMask = state.mask ? 'atomicStore(&mask[MASK_OFFSET + vertex], 1u);' : '';
  const dispatchLayout = getLuGraphBreadthFirstSearchDispatchLayout(
    props.seeds.length,
    state.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const SEED_COUNT: u32 = ${props.seeds.length}u;
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const SEEDS_OFFSET: u32 = ${getViewElementOffset(props.seeds)}u;
const DISTANCES_OFFSET: u32 = ${getViewElementOffset(state.distances)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.primaryAdjacency.overflow)}u;
${dynamicOffsets}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${BREADTH_FIRST_SEARCH_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, BREADTH_FIRST_SEARCH_WORKGROUP_SIZE)}
  if (index >= SEED_COUNT) { return; }
  if (overflow[OVERFLOW_OFFSET] != 0u${secondaryOverflowGuard}) { return; }
  ${seedCountGuard}
  let vertex = seeds[SEEDS_OFFSET + index];
  if (vertex >= VERTEX_COUNT) { return; }
  atomicStore(&distances[DISTANCES_OFFSET + vertex], 0u);
  ${publishMask}
}`;

  addBreadthFirstSearchPass(commandGraph, {
    id: `${state.id}-seed-${props.chunkIndex}`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Computes the next shortest-hop layer and the deterministic lowest-ID predecessor. */
function addExpansionPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    state: ImportedBreadthFirstSearch;
    adjacency: ImportedSearchAdjacency;
    depth: number;
    direction: 'outgoing' | 'incoming';
  }
): void {
  const {state, adjacency} = props;
  const bindings: Record<string, BreadthFirstSearchBinding> = {
    offsets: {view: adjacency.offsets, usage: 'storage-read'},
    neighbors: {view: adjacency.neighbors, usage: 'storage-read'},
    distances: {view: state.distances, usage: 'storage-read-write', atomic: true},
    predecessors: {view: state.predecessors, usage: 'storage-read-write', atomic: true},
    overflow: {view: state.primaryAdjacency.overflow, usage: 'storage-read'},
    ...(state.secondaryAdjacency
      ? {secondaryOverflow: {view: state.secondaryAdjacency.overflow, usage: 'storage-read'}}
      : {}),
    ...(state.mask ? {mask: {view: state.mask, usage: 'storage-read-write', atomic: true}} : {}),
    ...(state.activeDepth ? {activeDepth: {view: state.activeDepth, usage: 'storage-read'}} : {})
  };
  const dynamicOffsets = [
    state.secondaryAdjacency
      ? `const SECONDARY_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.secondaryAdjacency.overflow)}u;`
      : '',
    state.mask ? `const MASK_OFFSET: u32 = ${getViewElementOffset(state.mask)}u;` : '',
    state.activeDepth
      ? `const ACTIVE_DEPTH_OFFSET: u32 = ${getViewElementOffset(state.activeDepth)}u;`
      : ''
  ].join('\n');
  const secondaryOverflowGuard = state.secondaryAdjacency
    ? ' || secondaryOverflow[SECONDARY_OVERFLOW_OFFSET] != 0u'
    : '';
  const activeDepthGuard = state.activeDepth
    ? `if (${props.depth}u >= activeDepth[ACTIVE_DEPTH_OFFSET]) { return; }`
    : '';
  const publishMask = state.mask ? 'atomicStore(&mask[MASK_OFFSET + neighbor], 1u);' : '';
  const dispatchLayout = getLuGraphBreadthFirstSearchDispatchLayout(
    state.vertexCount,
    state.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const CAPACITY: u32 = ${adjacency.neighbors.length}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(adjacency.offsets)}u;
const NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(adjacency.neighbors)}u;
const DISTANCES_OFFSET: u32 = ${getViewElementOffset(state.distances)}u;
const PREDECESSORS_OFFSET: u32 = ${getViewElementOffset(state.predecessors)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.primaryAdjacency.overflow)}u;
${dynamicOffsets}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${BREADTH_FIRST_SEARCH_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, BREADTH_FIRST_SEARCH_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT) { return; }
  if (overflow[OVERFLOW_OFFSET] != 0u${secondaryOverflowGuard}) { return; }
  ${activeDepthGuard}
  if (atomicLoad(&distances[DISTANCES_OFFSET + index]) != ${props.depth}u) { return; }
  let first = min(offsets[OFFSETS_OFFSET + index], CAPACITY);
  let last = min(offsets[OFFSETS_OFFSET + index + 1u], CAPACITY);
  for (var slot = first; slot < last; slot++) {
    let neighbor = neighbors[NEIGHBORS_OFFSET + slot];
    if (neighbor >= VERTEX_COUNT) { continue; }
    let previousDistance = atomicMin(&distances[DISTANCES_OFFSET + neighbor], ${props.depth + 1}u);
    if (previousDistance >= ${props.depth + 1}u) {
      atomicMin(&predecessors[PREDECESSORS_OFFSET + neighbor], index);
      ${publishMask}
    }
  }
}`;

  addBreadthFirstSearchPass(commandGraph, {
    id: `${state.id}-depth-${props.depth}-${props.direction}`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Declares storage buffers in the same order as the generated shader binding layout. */
function getBindingDeclarations(bindings: Record<string, BreadthFirstSearchBinding>): string {
  return Object.entries(bindings)
    .map(([name, binding], location) => {
      const access = binding.usage === 'storage-read' ? 'read' : 'read_write';
      const element = binding.atomic ? 'atomic<u32>' : 'u32';
      return `@group(0) @binding(${location}) var<storage, ${access}> ${name}: array<${element}>;`;
    })
    .join('\n');
}

/** Compiles one bounded GPU pass without allocating, submitting, or reading graph resources. */
function addBreadthFirstSearchPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: BreadthFirstSearchPassProps
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

/** Plans one bounded three-dimensional breadth-first seed or vertex dispatch. @internal */
export function getLuGraphBreadthFirstSearchDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    'LuGraphBreadthFirstSearch',
    elementCount,
    BREADTH_FIRST_SEARCH_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}
