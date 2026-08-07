// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GraphBufferUse,
  GraphDataView
} from '../gpu-primitives/gpu-command-graph';
import {
  type GPUBoundedDispatchLayout,
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../gpu-primitives/gpu-dispatch-utils';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset
} from '../gpu-primitives/graph-data-view-utils';
import type {LuGraphLabelPropagation} from './lu-graph-label-propagation';

const LABEL_PROPAGATION_WORKGROUP_SIZE = 256;
const INVALID_COMMUNITY = 0xffffffff;

type ImportedLabelPropagation = {
  id: string;
  vertexCount: number;
  forwardOffsets: GraphDataView<'uint32'>;
  forwardNeighbors: GraphDataView<'uint32'>;
  forwardOverflow: GraphDataView<'uint32'>;
  reverseOffsets?: GraphDataView<'uint32'>;
  reverseNeighbors?: GraphDataView<'uint32'>;
  reverseOverflow?: GraphDataView<'uint32'>;
  output: GraphDataView<'uint32'>;
  scratch?: GraphDataView<'uint32'>;
  converged?: GraphDataView<'uint32'>;
  maxComputeWorkgroupsPerDimension: number;
};

type LabelPropagationBinding = {
  view: GraphDataView<'uint32'>;
  usage: GraphBufferUse['usage'];
  atomic?: boolean;
};

type LabelPropagationPassProps = {
  id: string;
  source: string;
  bindings: Record<string, LabelPropagationBinding>;
  dispatchLayout: GPUBoundedDispatchLayout;
};

/** Adds synchronous deterministic neighborhood-majority community propagation. @internal */
export function addLuGraphLabelPropagationToGraphWithDispatchLimit<Parameters>(
  propagation: LuGraphLabelPropagation,
  commandGraph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  const vertexCount = propagation.topology.graph.vertexCount;
  if (vertexCount === 0 && !propagation.converged) return;

  const reverse = propagation.topology.graph.directed ? propagation.topology.reverse : undefined;
  const state: ImportedLabelPropagation = {
    id: propagation.id,
    vertexCount,
    forwardOffsets: commandGraph.importGPUVector(
      `${propagation.id}-forward-offsets`,
      propagation.topology.forward.offsets
    ).data[0],
    forwardNeighbors: commandGraph.importGPUVector(
      `${propagation.id}-forward-neighbors`,
      propagation.topology.forward.neighbors
    ).data[0],
    forwardOverflow: commandGraph.importGPUVector(
      `${propagation.id}-forward-overflow`,
      propagation.topology.forward.overflow
    ).data[0],
    ...(reverse
      ? {
          reverseOffsets: commandGraph.importGPUVector(
            `${propagation.id}-reverse-offsets`,
            reverse.offsets
          ).data[0],
          reverseNeighbors: commandGraph.importGPUVector(
            `${propagation.id}-reverse-neighbors`,
            reverse.neighbors
          ).data[0],
          reverseOverflow: commandGraph.importGPUVector(
            `${propagation.id}-reverse-overflow`,
            reverse.overflow
          ).data[0]
        }
      : {}),
    output: commandGraph.importGPUVector(`${propagation.id}-output`, propagation.output).data[0],
    ...(propagation.converged
      ? {
          converged: commandGraph.importGPUVector(
            `${propagation.id}-converged`,
            propagation.converged
          ).data[0]
        }
      : {}),
    ...(vertexCount > 0
      ? {
          scratch: createTransientView(
            commandGraph,
            `${propagation.id}-next-labels`,
            'uint32',
            vertexCount
          )
        }
      : {}),
    maxComputeWorkgroupsPerDimension
  };

  addInitializationPass(commandGraph, state);
  if (vertexCount === 0) return;

  for (let iteration = 0; iteration < propagation.iterations; iteration++) {
    if (state.converged) addConvergenceResetPass(commandGraph, {state, iteration});
    addVotingPass(commandGraph, {state, iteration});
    addPublishPass(commandGraph, {state, iteration});
  }
}

/** Initializes one stable identity label per vertex or publishes explicit overflow sentinels. */
function addInitializationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedLabelPropagation
): void {
  const bindings: Record<string, LabelPropagationBinding> = {
    output: {view: state.output, usage: 'storage-write'},
    forwardOverflow: {view: state.forwardOverflow, usage: 'storage-read'},
    ...(state.reverseOverflow
      ? {reverseOverflow: {view: state.reverseOverflow, usage: 'storage-read'}}
      : {}),
    ...(state.converged
      ? {converged: {view: state.converged, usage: 'storage-write', atomic: true}}
      : {})
  };
  const reverseOffset = state.reverseOverflow
    ? `const REVERSE_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.reverseOverflow)}u;`
    : '';
  const reverseOverflow = state.reverseOverflow
    ? ' || reverseOverflow[REVERSE_OVERFLOW_OFFSET] != 0u'
    : '';
  const convergenceOffset = state.converged
    ? `const CONVERGED_OFFSET: u32 = ${getViewElementOffset(state.converged)}u;`
    : '';
  const initializeConvergence = state.converged
    ? `if (index == 0u) {
    atomicStore(&converged[CONVERGED_OFFSET], select(0u, 1u, VERTEX_COUNT == 0u && !hasOverflow));
  }`
    : '';
  const dispatchLayout = getLabelPropagationDispatchLayout(state, Math.max(state.vertexCount, 1));
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(state.output)}u;
const FORWARD_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.forwardOverflow)}u;
${reverseOffset}
${convergenceOffset}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${LABEL_PROPAGATION_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, LABEL_PROPAGATION_WORKGROUP_SIZE)}
  let hasOverflow = forwardOverflow[FORWARD_OVERFLOW_OFFSET] != 0u${reverseOverflow};
  if (index < VERTEX_COUNT) {
    output[OUTPUT_OFFSET + index] = select(index, ${INVALID_COMMUNITY}u, hasOverflow);
  }
  ${initializeConvergence}
}`;
  addLabelPropagationPass(commandGraph, {
    id: `${state.id}-initialize`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Publishes a fresh optimistic convergence scalar after a globally synchronized boundary. */
function addConvergenceResetPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {state: ImportedLabelPropagation; iteration: number}
): void {
  const {state} = props;
  const converged = state.converged!;
  const bindings: Record<string, LabelPropagationBinding> = {
    forwardOverflow: {view: state.forwardOverflow, usage: 'storage-read'},
    ...(state.reverseOverflow
      ? {reverseOverflow: {view: state.reverseOverflow, usage: 'storage-read'}}
      : {}),
    converged: {view: converged, usage: 'storage-write', atomic: true}
  };
  const reverseOffset = state.reverseOverflow
    ? `const REVERSE_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.reverseOverflow)}u;`
    : '';
  const reverseOverflow = state.reverseOverflow
    ? ' || reverseOverflow[REVERSE_OVERFLOW_OFFSET] != 0u'
    : '';
  const dispatchLayout = getLabelPropagationDispatchLayout(state, 1);
  const source = /* wgsl */ `
const FORWARD_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.forwardOverflow)}u;
const CONVERGED_OFFSET: u32 = ${getViewElementOffset(converged)}u;
${reverseOffset}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${LABEL_PROPAGATION_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, LABEL_PROPAGATION_WORKGROUP_SIZE)}
  if (index != 0u) { return; }
  let hasOverflow = forwardOverflow[FORWARD_OVERFLOW_OFFSET] != 0u${reverseOverflow};
  atomicStore(&converged[CONVERGED_OFFSET], select(1u, 0u, hasOverflow));
}`;
  addLabelPropagationPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-reset`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Counts every weak-neighbor occurrence from one immutable label snapshot, using eight bindings. */
function addVotingPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {state: ImportedLabelPropagation; iteration: number}
): void {
  const {state} = props;
  const scratch = state.scratch!;
  const bindings: Record<string, LabelPropagationBinding> = {
    output: {view: state.output, usage: 'storage-read'},
    scratch: {view: scratch, usage: 'storage-write'},
    forwardOffsets: {view: state.forwardOffsets, usage: 'storage-read'},
    forwardNeighbors: {view: state.forwardNeighbors, usage: 'storage-read'},
    forwardOverflow: {view: state.forwardOverflow, usage: 'storage-read'},
    ...(state.reverseOffsets && state.reverseNeighbors && state.reverseOverflow
      ? {
          reverseOffsets: {view: state.reverseOffsets, usage: 'storage-read'},
          reverseNeighbors: {view: state.reverseNeighbors, usage: 'storage-read'},
          reverseOverflow: {view: state.reverseOverflow, usage: 'storage-read'}
        }
      : {})
  };
  const hasReverse = Boolean(
    state.reverseOffsets && state.reverseNeighbors && state.reverseOverflow
  );
  const reverseConstants = hasReverse
    ? `const REVERSE_CAPACITY: u32 = ${state.reverseNeighbors!.length}u;
const REVERSE_OFFSETS_OFFSET: u32 = ${getViewElementOffset(state.reverseOffsets!)}u;
const REVERSE_NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(state.reverseNeighbors!)}u;
const REVERSE_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.reverseOverflow!)}u;`
    : '';
  const reverseOverflow = hasReverse ? ' || reverseOverflow[REVERSE_OVERFLOW_OFFSET] != 0u' : '';
  const countReverseVotes = hasReverse
    ? `let reverseFirst = min(reverseOffsets[REVERSE_OFFSETS_OFFSET + vertex], REVERSE_CAPACITY);
  let reverseLast = min(reverseOffsets[REVERSE_OFFSETS_OFFSET + vertex + 1u], REVERSE_CAPACITY);
  for (var slot = reverseFirst; slot < reverseLast; slot++) {
    let neighbor = reverseNeighbors[REVERSE_NEIGHBORS_OFFSET + slot];
    if (neighbor < VERTEX_COUNT && neighbor != vertex && output[OUTPUT_OFFSET + neighbor] == candidate) {
      votes++;
    }
  }`
    : '';
  const selectReverseCandidates = hasReverse
    ? `let reverseFirst = min(reverseOffsets[REVERSE_OFFSETS_OFFSET + index], REVERSE_CAPACITY);
  let reverseLast = min(reverseOffsets[REVERSE_OFFSETS_OFFSET + index + 1u], REVERSE_CAPACITY);
  for (var slot = reverseFirst; slot < reverseLast; slot++) {
    let neighbor = reverseNeighbors[REVERSE_NEIGHBORS_OFFSET + slot];
    if (neighbor >= VERTEX_COUNT || neighbor == index) { continue; }
    let candidate = output[OUTPUT_OFFSET + neighbor];
    let votes = countCandidateVotes(index, candidate);
    if (votes > selectedVotes || (votes == selectedVotes && candidate < selectedLabel)) {
      selectedLabel = candidate;
      selectedVotes = votes;
    }
  }`
    : '';
  const dispatchLayout = getLabelPropagationDispatchLayout(state, state.vertexCount);
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const FORWARD_CAPACITY: u32 = ${state.forwardNeighbors.length}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(state.output)}u;
const SCRATCH_OFFSET: u32 = ${getViewElementOffset(scratch)}u;
const FORWARD_OFFSETS_OFFSET: u32 = ${getViewElementOffset(state.forwardOffsets)}u;
const FORWARD_NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(state.forwardNeighbors)}u;
const FORWARD_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.forwardOverflow)}u;
${reverseConstants}
${getBindingDeclarations(bindings)}

fn countCandidateVotes(vertex: u32, candidate: u32) -> u32 {
  var votes = select(0u, 1u, output[OUTPUT_OFFSET + vertex] == candidate);
  let first = min(forwardOffsets[FORWARD_OFFSETS_OFFSET + vertex], FORWARD_CAPACITY);
  let last = min(forwardOffsets[FORWARD_OFFSETS_OFFSET + vertex + 1u], FORWARD_CAPACITY);
  for (var slot = first; slot < last; slot++) {
    let neighbor = forwardNeighbors[FORWARD_NEIGHBORS_OFFSET + slot];
    if (neighbor < VERTEX_COUNT && neighbor != vertex && output[OUTPUT_OFFSET + neighbor] == candidate) {
      votes++;
    }
  }
  ${countReverseVotes}
  return votes;
}

@compute @workgroup_size(${LABEL_PROPAGATION_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, LABEL_PROPAGATION_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT) { return; }
  if (forwardOverflow[FORWARD_OVERFLOW_OFFSET] != 0u${reverseOverflow}) {
    scratch[SCRATCH_OFFSET + index] = ${INVALID_COMMUNITY}u;
    return;
  }

  var selectedLabel = output[OUTPUT_OFFSET + index];
  var selectedVotes = countCandidateVotes(index, selectedLabel);
  let first = min(forwardOffsets[FORWARD_OFFSETS_OFFSET + index], FORWARD_CAPACITY);
  let last = min(forwardOffsets[FORWARD_OFFSETS_OFFSET + index + 1u], FORWARD_CAPACITY);
  for (var slot = first; slot < last; slot++) {
    let neighbor = forwardNeighbors[FORWARD_NEIGHBORS_OFFSET + slot];
    if (neighbor >= VERTEX_COUNT || neighbor == index) { continue; }
    let candidate = output[OUTPUT_OFFSET + neighbor];
    let votes = countCandidateVotes(index, candidate);
    if (votes > selectedVotes || (votes == selectedVotes && candidate < selectedLabel)) {
      selectedLabel = candidate;
      selectedVotes = votes;
    }
  }
  ${selectReverseCandidates}
  scratch[SCRATCH_OFFSET + index] = selectedLabel;
}`;
  addLabelPropagationPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-vote`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Publishes one globally synchronized label snapshot and atomically marks actual changes. */
function addPublishPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {state: ImportedLabelPropagation; iteration: number}
): void {
  const {state} = props;
  const scratch = state.scratch!;
  const bindings: Record<string, LabelPropagationBinding> = {
    output: {view: state.output, usage: 'storage-read-write'},
    scratch: {view: scratch, usage: 'storage-read'},
    ...(state.converged
      ? {converged: {view: state.converged, usage: 'storage-read-write', atomic: true}}
      : {})
  };
  const convergenceOffset = state.converged
    ? `const CONVERGED_OFFSET: u32 = ${getViewElementOffset(state.converged)}u;`
    : '';
  const markChanged = state.converged
    ? `if (nextLabel != previousLabel) { atomicStore(&converged[CONVERGED_OFFSET], 0u); }`
    : '';
  const dispatchLayout = getLabelPropagationDispatchLayout(state, state.vertexCount);
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(state.output)}u;
const SCRATCH_OFFSET: u32 = ${getViewElementOffset(scratch)}u;
${convergenceOffset}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${LABEL_PROPAGATION_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, LABEL_PROPAGATION_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT) { return; }
  let previousLabel = output[OUTPUT_OFFSET + index];
  let nextLabel = scratch[SCRATCH_OFFSET + index];
  output[OUTPUT_OFFSET + index] = nextLabel;
  ${markChanged}
}`;
  addLabelPropagationPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-publish`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Declares packed scalar and optional atomic convergence views in exact binding order. */
function getBindingDeclarations(bindings: Record<string, LabelPropagationBinding>): string {
  return Object.entries(bindings)
    .map(([name, binding], location) => {
      const access = binding.usage === 'storage-read' ? 'read' : 'read_write';
      const element = binding.atomic ? 'atomic<u32>' : 'u32';
      return `@group(0) @binding(${location}) var<storage, ${access}> ${name}: array<${element}>;`;
    })
    .join('\n');
}

/** Compiles one graph-owned bounded community pass without submission or CPU synchronization. */
function addLabelPropagationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: LabelPropagationPassProps
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

function getLabelPropagationDispatchLayout(
  state: ImportedLabelPropagation,
  elementCount: number
): GPUBoundedDispatchLayout {
  return getLuGraphLabelPropagationDispatchLayout(
    elementCount,
    state.maxComputeWorkgroupsPerDimension
  );
}

/** Plans bounded true three-dimensional community-label or convergence dispatch. @internal */
export function getLuGraphLabelPropagationDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    'LuGraphLabelPropagation',
    elementCount,
    LABEL_PROPAGATION_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}
