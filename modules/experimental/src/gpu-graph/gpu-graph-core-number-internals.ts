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
import {GPUReduction} from '../gpu-core/gpu-reduction';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset
} from '../gpu-core/graph-data-view-utils';
import type {GPUGraphCoreNumber} from './gpu-graph-core-number';

const CORE_NUMBER_WORKGROUP_SIZE = 256;
const INVALID_CORE_NUMBER = 0xffffffff;

type ImportedCoreNumber = {
  id: string;
  vertexCount: number;
  edgeCount: number;
  iterations: number;
  forwardOffsets: GraphDataView<'uint32'>;
  forwardNeighbors: GraphDataView<'uint32'>;
  forwardOverflow: GraphDataView<'uint32'>;
  reverseOffsets?: GraphDataView<'uint32'>;
  reverseNeighbors?: GraphDataView<'uint32'>;
  reverseOverflow?: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
  converged: GraphDataView<'uint32'>;
  degeneracy?: GraphDataView<'uint32'>;
  scratch?: GraphDataView<'uint32'>;
  changed?: GraphDataView<'uint32'>;
  maxComputeWorkgroupsPerDimension: number;
};

type CoreNumberBinding = {
  view: GraphDataView<'uint32'>;
  usage: GraphBufferUse['usage'];
  atomic?: boolean;
};

type CoreNumberPassProps = {
  id: string;
  source: string;
  bindings: Record<string, CoreNumberBinding>;
  dispatchLayout: GPUBoundedDispatchLayout;
};

/** Adds bounded, exact simple-weak-graph k-core refinement with explicit dispatch limits. */
export function addGPUGraphCoreNumberToGraphWithDispatchLimit<Parameters>(
  coreNumber: GPUGraphCoreNumber,
  commandGraph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  const graph = coreNumber.topology.graph;
  const reverse = graph.directed ? coreNumber.topology.reverse : undefined;
  const output = commandGraph.importGPUVector(`${coreNumber.id}-output`, coreNumber.output).data[0];
  const state: ImportedCoreNumber = {
    id: coreNumber.id,
    vertexCount: graph.vertexCount,
    edgeCount: graph.edgeCount,
    iterations: coreNumber.iterations,
    forwardOffsets: commandGraph.importGPUVector(
      `${coreNumber.id}-forward-offsets`,
      coreNumber.topology.forward.offsets
    ).data[0],
    forwardNeighbors: commandGraph.importGPUVector(
      `${coreNumber.id}-forward-neighbors`,
      coreNumber.topology.forward.neighbors
    ).data[0],
    forwardOverflow: commandGraph.importGPUVector(
      `${coreNumber.id}-forward-overflow`,
      coreNumber.topology.forward.overflow
    ).data[0],
    ...(reverse
      ? {
          reverseOffsets: commandGraph.importGPUVector(
            `${coreNumber.id}-reverse-offsets`,
            reverse.offsets
          ).data[0],
          reverseNeighbors: commandGraph.importGPUVector(
            `${coreNumber.id}-reverse-neighbors`,
            reverse.neighbors
          ).data[0],
          reverseOverflow: commandGraph.importGPUVector(
            `${coreNumber.id}-reverse-overflow`,
            reverse.overflow
          ).data[0]
        }
      : {}),
    output,
    converged: coreNumber.converged
      ? commandGraph.importGPUVector(`${coreNumber.id}-converged`, coreNumber.converged).data[0]
      : createTransientView(commandGraph, `${coreNumber.id}-convergence-scratch`, 'uint32', 1),
    ...(coreNumber.degeneracy
      ? {
          degeneracy: commandGraph.importGPUVector(
            `${coreNumber.id}-degeneracy`,
            coreNumber.degeneracy
          ).data[0]
        }
      : {}),
    ...(graph.vertexCount > 0 && coreNumber.iterations > 0
      ? {
          scratch: createTransientView(
            commandGraph,
            `${coreNumber.id}-next-core-numbers`,
            'uint32',
            graph.vertexCount
          ),
          changed: createTransientView(commandGraph, `${coreNumber.id}-changed`, 'uint32', 1)
        }
      : {}),
    maxComputeWorkgroupsPerDimension
  };

  addInitializationPass(commandGraph, state);
  if (state.vertexCount > 0) {
    for (let iteration = 0; iteration < state.iterations; iteration++) {
      addChangeResetPass(commandGraph, state, iteration);
      addRefinementPass(commandGraph, state, iteration);
      addPublishPass(commandGraph, state, iteration);
      addConvergencePass(commandGraph, state, iteration);
    }
  }

  if (state.degeneracy) {
    new GPUReduction({
      id: `${state.id}-degeneracy`,
      input: state.output,
      output: state.degeneracy,
      operation: 'max'
    }).addToGraph(commandGraph);
  }
}

/** Publishes distinct weak-neighbor degree upper bounds or fail-closed overflow sentinels. */
function addInitializationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedCoreNumber
): void {
  const bindings: Record<string, CoreNumberBinding> = {
    output: {view: state.output, usage: 'storage-write'},
    forwardOffsets: {view: state.forwardOffsets, usage: 'storage-read'},
    forwardNeighbors: {view: state.forwardNeighbors, usage: 'storage-read'},
    forwardOverflow: {view: state.forwardOverflow, usage: 'storage-read'},
    ...(state.reverseOffsets && state.reverseNeighbors && state.reverseOverflow
      ? {
          reverseOffsets: {view: state.reverseOffsets, usage: 'storage-read' as const},
          reverseNeighbors: {view: state.reverseNeighbors, usage: 'storage-read' as const},
          reverseOverflow: {view: state.reverseOverflow, usage: 'storage-read' as const}
        }
      : {}),
    converged: {view: state.converged, usage: 'storage-write', atomic: true}
  };
  const dispatchLayout = getDispatchLayout(state, Math.max(state.vertexCount, 1));
  const noEdges = state.vertexCount === 0 || state.edgeCount === 0;
  const source = /* wgsl */ `
${getNeighborhoodConstants(state)}
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(state.output)}u;
const FORWARD_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.forwardOverflow)}u;
const CONVERGED_OFFSET: u32 = ${getViewElementOffset(state.converged)}u;
${state.reverseOverflow ? `const REVERSE_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.reverseOverflow)}u;` : ''}
${getBindingDeclarations(bindings)}
${getNeighborhoodFunctions(state)}

@compute @workgroup_size(${CORE_NUMBER_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, CORE_NUMBER_WORKGROUP_SIZE)}
  let hasOverflow = forwardOverflow[FORWARD_OVERFLOW_OFFSET] != 0u${
    state.reverseOverflow ? ' || reverseOverflow[REVERSE_OVERFLOW_OFFSET] != 0u' : ''
  };
  if (index == 0u) {
    atomicStore(&converged[CONVERGED_OFFSET], select(0u, ${noEdges ? '1u' : '0u'}, !hasOverflow));
  }
  if (index >= VERTEX_COUNT) { return; }
  if (hasOverflow) {
    output[OUTPUT_OFFSET + index] = ${INVALID_CORE_NUMBER}u;
    return;
  }

  var degree = 0u;
  for (var direction = 0u; direction < NEIGHBOR_DIRECTION_COUNT; direction++) {
    let first = getFirstNeighborSlot(index, direction);
    let last = getLastNeighborSlot(index, direction);
    for (var slot = first; slot < last; slot++) {
      let neighbor = getNeighbor(direction, slot);
      if (isFirstDistinctNeighbor(index, direction, slot, neighbor)) { degree++; }
    }
  }
  output[OUTPUT_OFFSET + index] = degree;
}`;
  addCoreNumberPass(commandGraph, {id: `${state.id}-initialize`, source, bindings, dispatchLayout});
}

/** Clears one graph-owned atomic modification flag before the next synchronized round. */
function addChangeResetPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedCoreNumber,
  iteration: number
): void {
  const changed = state.changed!;
  const bindings: Record<string, CoreNumberBinding> = {
    changed: {view: changed, usage: 'storage-write', atomic: true}
  };
  const source = /* wgsl */ `
const CHANGED_OFFSET: u32 = ${getViewElementOffset(changed)}u;
${getBindingDeclarations(bindings)}

@compute @workgroup_size(1)
fn main() {
  atomicStore(&changed[CHANGED_OFFSET], 0u);
}`;
  addCoreNumberPass(commandGraph, {
    id: `${state.id}-iteration-${iteration}-reset`,
    source,
    bindings,
    dispatchLayout: {x: 1, y: 1, z: 1}
  });
}

/** Computes a monotone, synchronized neighborhood H-index using at most eight storage buffers. */
function addRefinementPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedCoreNumber,
  iteration: number
): void {
  const scratch = state.scratch!;
  const changed = state.changed!;
  const bindings: Record<string, CoreNumberBinding> = {
    output: {view: state.output, usage: 'storage-read'},
    scratch: {view: scratch, usage: 'storage-write'},
    forwardOffsets: {view: state.forwardOffsets, usage: 'storage-read'},
    forwardNeighbors: {view: state.forwardNeighbors, usage: 'storage-read'},
    ...(state.reverseOffsets && state.reverseNeighbors
      ? {
          reverseOffsets: {view: state.reverseOffsets, usage: 'storage-read' as const},
          reverseNeighbors: {view: state.reverseNeighbors, usage: 'storage-read' as const}
        }
      : {}),
    changed: {view: changed, usage: 'storage-read-write', atomic: true},
    converged: {view: state.converged, usage: 'storage-read'}
  };
  const dispatchLayout = getDispatchLayout(state, state.vertexCount);
  const source = /* wgsl */ `
${getNeighborhoodConstants(state)}
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(state.output)}u;
const SCRATCH_OFFSET: u32 = ${getViewElementOffset(scratch)}u;
const CHANGED_OFFSET: u32 = ${getViewElementOffset(changed)}u;
const CONVERGED_OFFSET: u32 = ${getViewElementOffset(state.converged)}u;
${getBindingDeclarations(bindings)}
${getNeighborhoodFunctions(state)}

fn countSupportingNeighbors(vertex: u32, candidate: u32) -> u32 {
  var supporters = 0u;
  for (var direction = 0u; direction < NEIGHBOR_DIRECTION_COUNT; direction++) {
    let first = getFirstNeighborSlot(vertex, direction);
    let last = getLastNeighborSlot(vertex, direction);
    for (var slot = first; slot < last; slot++) {
      let neighbor = getNeighbor(direction, slot);
      if (!isFirstDistinctNeighbor(vertex, direction, slot, neighbor)) { continue; }
      let neighborCore = output[OUTPUT_OFFSET + neighbor];
      if (neighborCore != ${INVALID_CORE_NUMBER}u && neighborCore >= candidate) {
        supporters++;
      }
    }
  }
  return supporters;
}

@compute @workgroup_size(${CORE_NUMBER_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, CORE_NUMBER_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT || converged[CONVERGED_OFFSET] != 0u) { return; }
  let previous = output[OUTPUT_OFFSET + index];
  if (previous == ${INVALID_CORE_NUMBER}u) {
    scratch[SCRATCH_OFFSET + index] = ${INVALID_CORE_NUMBER}u;
    return;
  }

  var lower = 0u;
  var upper = previous;
  while (lower < upper) {
    let candidate = lower + (upper - lower + 1u) / 2u;
    if (countSupportingNeighbors(index, candidate) >= candidate) {
      lower = candidate;
    } else {
      upper = candidate - 1u;
    }
  }
  scratch[SCRATCH_OFFSET + index] = lower;
  if (lower != previous) { atomicStore(&changed[CHANGED_OFFSET], 1u); }
}`;
  addCoreNumberPass(commandGraph, {
    id: `${state.id}-iteration-${iteration}-refine`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Publishes the fully synchronized round without exposing a partially updated neighbor field. */
function addPublishPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedCoreNumber,
  iteration: number
): void {
  const scratch = state.scratch!;
  const bindings: Record<string, CoreNumberBinding> = {
    output: {view: state.output, usage: 'storage-write'},
    scratch: {view: scratch, usage: 'storage-read'},
    converged: {view: state.converged, usage: 'storage-read'}
  };
  const dispatchLayout = getDispatchLayout(state, state.vertexCount);
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(state.output)}u;
const SCRATCH_OFFSET: u32 = ${getViewElementOffset(scratch)}u;
const CONVERGED_OFFSET: u32 = ${getViewElementOffset(state.converged)}u;
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${CORE_NUMBER_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, CORE_NUMBER_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT || converged[CONVERGED_OFFSET] != 0u) { return; }
  output[OUTPUT_OFFSET + index] = scratch[SCRATCH_OFFSET + index];
}`;
  addCoreNumberPass(commandGraph, {
    id: `${state.id}-iteration-${iteration}-publish`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Reports fixed-point convergence while preserving explicit selected-adjacency failure status. */
function addConvergencePass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedCoreNumber,
  iteration: number
): void {
  const changed = state.changed!;
  const bindings: Record<string, CoreNumberBinding> = {
    changed: {view: changed, usage: 'storage-read'},
    converged: {view: state.converged, usage: 'storage-read-write', atomic: true},
    forwardOverflow: {view: state.forwardOverflow, usage: 'storage-read'},
    ...(state.reverseOverflow
      ? {reverseOverflow: {view: state.reverseOverflow, usage: 'storage-read' as const}}
      : {})
  };
  const source = /* wgsl */ `
const CHANGED_OFFSET: u32 = ${getViewElementOffset(changed)}u;
const CONVERGED_OFFSET: u32 = ${getViewElementOffset(state.converged)}u;
const FORWARD_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.forwardOverflow)}u;
${state.reverseOverflow ? `const REVERSE_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.reverseOverflow)}u;` : ''}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(1)
fn main() {
  let hasOverflow = forwardOverflow[FORWARD_OVERFLOW_OFFSET] != 0u${
    state.reverseOverflow ? ' || reverseOverflow[REVERSE_OVERFLOW_OFFSET] != 0u' : ''
  };
  atomicStore(&converged[CONVERGED_OFFSET], select(0u, 1u, !hasOverflow && changed[CHANGED_OFFSET] == 0u));
}`;
  addCoreNumberPass(commandGraph, {
    id: `${state.id}-iteration-${iteration}-convergence`,
    source,
    bindings,
    dispatchLayout: {x: 1, y: 1, z: 1}
  });
}

/** Emits bounded CSR storage offsets shared by initialization and synchronous refinement. */
function getNeighborhoodConstants(state: ImportedCoreNumber): string {
  return [
    `const VERTEX_COUNT: u32 = ${state.vertexCount}u;`,
    `const FORWARD_CAPACITY: u32 = ${state.forwardNeighbors.length}u;`,
    `const FORWARD_OFFSETS_OFFSET: u32 = ${getViewElementOffset(state.forwardOffsets)}u;`,
    `const FORWARD_NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(state.forwardNeighbors)}u;`,
    `const NEIGHBOR_DIRECTION_COUNT: u32 = ${state.reverseOffsets ? 2 : 1}u;`,
    ...(state.reverseOffsets && state.reverseNeighbors
      ? [
          `const REVERSE_CAPACITY: u32 = ${state.reverseNeighbors.length}u;`,
          `const REVERSE_OFFSETS_OFFSET: u32 = ${getViewElementOffset(state.reverseOffsets)}u;`,
          `const REVERSE_NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(state.reverseNeighbors)}u;`
        ]
      : [])
  ].join('\n');
}

/** Enumerates each distinct non-self weak neighbor exactly once across unsorted CSR directions. */
function getNeighborhoodFunctions(state: ImportedCoreNumber): string {
  const hasReverse = Boolean(state.reverseOffsets && state.reverseNeighbors);
  const reverseFirst = hasReverse
    ? `if (direction == 1u) {
    return min(reverseOffsets[REVERSE_OFFSETS_OFFSET + vertex], REVERSE_CAPACITY);
  }`
    : '';
  const reverseLast = hasReverse
    ? `if (direction == 1u) {
    return min(reverseOffsets[REVERSE_OFFSETS_OFFSET + vertex + 1u], REVERSE_CAPACITY);
  }`
    : '';
  const reverseNeighbor = hasReverse
    ? `if (direction == 1u) {
    return reverseNeighbors[REVERSE_NEIGHBORS_OFFSET + slot];
  }`
    : '';
  const scanReverse = hasReverse
    ? `if (direction == 1u) {
    let reverseFirst = min(reverseOffsets[REVERSE_OFFSETS_OFFSET + vertex], REVERSE_CAPACITY);
    for (var previous = reverseFirst; previous < slot; previous++) {
      if (reverseNeighbors[REVERSE_NEIGHBORS_OFFSET + previous] == candidate) { return false; }
    }
  }`
    : '';

  return /* wgsl */ `
fn getFirstNeighborSlot(vertex: u32, direction: u32) -> u32 {
  ${reverseFirst}
  return min(forwardOffsets[FORWARD_OFFSETS_OFFSET + vertex], FORWARD_CAPACITY);
}

fn getLastNeighborSlot(vertex: u32, direction: u32) -> u32 {
  ${reverseLast}
  return min(forwardOffsets[FORWARD_OFFSETS_OFFSET + vertex + 1u], FORWARD_CAPACITY);
}

fn getNeighbor(direction: u32, slot: u32) -> u32 {
  ${reverseNeighbor}
  return forwardNeighbors[FORWARD_NEIGHBORS_OFFSET + slot];
}

fn isFirstDistinctNeighbor(vertex: u32, direction: u32, slot: u32, candidate: u32) -> bool {
  if (candidate >= VERTEX_COUNT || candidate == vertex) { return false; }
  let forwardFirst = min(forwardOffsets[FORWARD_OFFSETS_OFFSET + vertex], FORWARD_CAPACITY);
  let forwardEnd = select(
    slot,
    min(forwardOffsets[FORWARD_OFFSETS_OFFSET + vertex + 1u], FORWARD_CAPACITY),
    direction != 0u
  );
  for (var previous = forwardFirst; previous < forwardEnd; previous++) {
    if (forwardNeighbors[FORWARD_NEIGHBORS_OFFSET + previous] == candidate) { return false; }
  }
  ${scanReverse}
  return true;
}`;
}

/** Declares ordinary or atomic unsigned storage arrays in deterministic binding order. */
function getBindingDeclarations(bindings: Record<string, CoreNumberBinding>): string {
  return Object.entries(bindings)
    .map(([name, binding], location) => {
      const access = binding.usage === 'storage-read' ? 'read' : 'read_write';
      const element = binding.atomic ? 'atomic<u32>' : 'u32';
      return `@group(0) @binding(${location}) var<storage, ${access}> ${name}: array<${element}>;`;
    })
    .join('\n');
}

/** Compiles one portable bounded pass without owning, submitting, or mapping caller buffers. */
function addCoreNumberPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: CoreNumberPassProps
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

/** Plans a portable one-, two-, or three-dimensional scalar dispatch. */
function getDispatchLayout(
  state: ImportedCoreNumber,
  elementCount: number
): GPUBoundedDispatchLayout {
  return getGPUGraphCoreNumberDispatchLayout(elementCount, state.maxComputeWorkgroupsPerDimension);
}

/** Plans one bounded three-dimensional k-core initialization or refinement dispatch. @internal */
export function getGPUGraphCoreNumberDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    'GPUGraphCoreNumber',
    elementCount,
    CORE_NUMBER_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}
