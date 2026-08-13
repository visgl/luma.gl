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
import {getGPUReductionStrategy} from '../gpu-primitives/gpu-reduction';
import type {LuGraphPageRank} from './lu-graph-page-rank';

const PAGE_RANK_WORKGROUP_SIZE = 256;

type PageRankDataView = GraphDataView<'uint32'> | GraphDataView<'float32'>;

type ImportedPageRank = {
  id: string;
  vertexCount: number;
  damping: number;
  forwardOffsets: GraphDataView<'uint32'>;
  incomingOffsets: GraphDataView<'uint32'>;
  incomingNeighbors: GraphDataView<'uint32'>;
  overflow: GraphDataView<'uint32'>;
  reverseOverflow?: GraphDataView<'uint32'>;
  output: GraphDataView<'float32'>;
  residual?: GraphDataView<'float32'>;
  maxComputeWorkgroupsPerDimension: number;
};

type PageRankBinding = {
  view: PageRankDataView;
  usage: GraphBufferUse['usage'];
};

type PageRankPassProps = {
  id: string;
  source: string;
  bindings: Record<string, PageRankBinding>;
  dispatchLayout: GPUBoundedDispatchLayout;
};

/** Adds dangling-safe GPU PageRank using an explicit bounded dispatch limit. @internal */
export function addLuGraphPageRankToGraphWithDispatchLimit<Parameters>(
  pageRank: LuGraphPageRank,
  commandGraph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  if (pageRank.topology.graph.vertexCount === 0 && !pageRank.residual) {
    return;
  }

  const directed = pageRank.topology.graph.directed;
  const forwardOffsets = commandGraph.importGPUVector(
    `${pageRank.id}-forward-offsets`,
    pageRank.topology.forward.offsets
  ).data[0];
  const incoming = directed ? pageRank.topology.reverse! : pageRank.topology.forward;
  const state: ImportedPageRank = {
    id: pageRank.id,
    vertexCount: pageRank.topology.graph.vertexCount,
    damping: pageRank.damping,
    forwardOffsets,
    incomingOffsets: directed
      ? commandGraph.importGPUVector(`${pageRank.id}-incoming-offsets`, incoming.offsets).data[0]
      : forwardOffsets,
    incomingNeighbors: commandGraph.importGPUVector(
      `${pageRank.id}-incoming-neighbors`,
      incoming.neighbors
    ).data[0],
    overflow: commandGraph.importGPUVector(
      `${pageRank.id}-forward-overflow`,
      pageRank.topology.forward.overflow
    ).data[0],
    ...(directed
      ? {
          reverseOverflow: commandGraph.importGPUVector(
            `${pageRank.id}-incoming-overflow`,
            incoming.overflow
          ).data[0]
        }
      : {}),
    output: commandGraph.importGPUVector(`${pageRank.id}-output`, pageRank.output).data[0],
    ...(pageRank.residual
      ? {
          residual: commandGraph.importGPUVector(`${pageRank.id}-residual`, pageRank.residual)
            .data[0]
        }
      : {}),
    maxComputeWorkgroupsPerDimension
  };

  addInitializationPass(commandGraph, state);
  if (state.vertexCount === 0) {
    return;
  }

  const workspace = createTransientView(
    commandGraph,
    `${state.id}-workspace`,
    'float32',
    state.vertexCount
  );
  const reductionLevels = createReductionLevels(commandGraph, state);

  for (let iteration = 0; iteration < pageRank.iterations; iteration++) {
    addDanglingGatherPass(commandGraph, {state, workspace, iteration});
    const danglingMass = addReduction(commandGraph, {
      id: `${state.id}-iteration-${iteration}-dangling`,
      state,
      input: workspace,
      levels: reductionLevels
    });
    addPullPass(commandGraph, {state, workspace, danglingMass, iteration});
    const rankSum = addReduction(commandGraph, {
      id: `${state.id}-iteration-${iteration}-sum`,
      state,
      input: workspace,
      levels: reductionLevels
    });
    const collectResidual = Boolean(state.residual && iteration === pageRank.iterations - 1);
    addNormalizationPass(commandGraph, {state, workspace, rankSum, iteration, collectResidual});
    if (collectResidual) {
      addReduction(commandGraph, {
        id: `${state.id}-residual`,
        state,
        input: workspace,
        levels: reductionLevels,
        output: state.residual!
      });
    }
  }
}

/** Initializes uniform scores and the optional residual while failing closed on overflow. */
function addInitializationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedPageRank
): void {
  const bindings: Record<string, PageRankBinding> = {
    output: {view: state.output, usage: 'storage-write'},
    overflow: {view: state.overflow, usage: 'storage-read'},
    ...(state.reverseOverflow
      ? {reverseOverflow: {view: state.reverseOverflow, usage: 'storage-read'}}
      : {}),
    ...(state.residual ? {residual: {view: state.residual, usage: 'storage-write'}} : {})
  };
  const reverseOffset = state.reverseOverflow
    ? `const REVERSE_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.reverseOverflow)}u;`
    : '';
  const residualOffset = state.residual
    ? `const RESIDUAL_OFFSET: u32 = ${getViewElementOffset(state.residual)}u;`
    : '';
  const reverseOverflow = state.reverseOverflow
    ? ' || reverseOverflow[REVERSE_OVERFLOW_OFFSET] != 0u'
    : '';
  const clearResidual = state.residual
    ? 'if (index == 0u) { residual[RESIDUAL_OFFSET] = 0.0; }'
    : '';
  const dispatchLayout = getLuGraphPageRankDispatchLayout(
    Math.max(state.vertexCount, 1),
    state.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(state.output)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.overflow)}u;
${reverseOffset}
${residualOffset}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${PAGE_RANK_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, PAGE_RANK_WORKGROUP_SIZE)}
  if (index < VERTEX_COUNT) {
    let hasOverflow = overflow[OVERFLOW_OFFSET] != 0u${reverseOverflow};
    let uniformScore = 1.0 / f32(max(VERTEX_COUNT, 1u));
    output[OUTPUT_OFFSET + index] = select(uniformScore, 0.0, hasOverflow);
  }
  ${clearResidual}
}`;

  addPageRankPass(commandGraph, {
    id: `${state.id}-initialize`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Allocates one reusable 256-way reduction hierarchy shared by all ranking iterations. */
function createReductionLevels<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedPageRank
): GraphDataView<'float32'>[] {
  const levels: GraphDataView<'float32'>[] = [];
  let length = state.vertexCount;
  do {
    length = Math.ceil(length / PAGE_RANK_WORKGROUP_SIZE);
    levels.push(
      createTransientView(
        commandGraph,
        `${state.id}-reduction-level-${levels.length}`,
        'float32',
        length
      )
    );
  } while (length > 1);
  return levels;
}

/** Extracts dangling-node probability mass without unsupported floating-point atomics. */
function addDanglingGatherPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    state: ImportedPageRank;
    workspace: GraphDataView<'float32'>;
    iteration: number;
  }
): void {
  const {state, workspace} = props;
  const bindings: Record<string, PageRankBinding> = {
    output: {view: state.output, usage: 'storage-read'},
    forwardOffsets: {view: state.forwardOffsets, usage: 'storage-read'},
    workspace: {view: workspace, usage: 'storage-write'},
    overflow: {view: state.overflow, usage: 'storage-read'},
    ...(state.reverseOverflow
      ? {reverseOverflow: {view: state.reverseOverflow, usage: 'storage-read'}}
      : {})
  };
  const reverseOffset = state.reverseOverflow
    ? `const REVERSE_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.reverseOverflow)}u;`
    : '';
  const reverseOverflow = state.reverseOverflow
    ? ' || reverseOverflow[REVERSE_OVERFLOW_OFFSET] != 0u'
    : '';
  const dispatchLayout = getLuGraphPageRankDispatchLayout(
    state.vertexCount,
    state.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(state.output)}u;
const FORWARD_OFFSETS_OFFSET: u32 = ${getViewElementOffset(state.forwardOffsets)}u;
const WORKSPACE_OFFSET: u32 = ${getViewElementOffset(workspace)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.overflow)}u;
${reverseOffset}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${PAGE_RANK_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, PAGE_RANK_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT) { return; }
  let hasOverflow = overflow[OVERFLOW_OFFSET] != 0u${reverseOverflow};
  var contribution = 0.0;
  if (!hasOverflow) {
    let degree =
      forwardOffsets[FORWARD_OFFSETS_OFFSET + index + 1u] -
      forwardOffsets[FORWARD_OFFSETS_OFFSET + index];
    if (degree == 0u) { contribution = output[OUTPUT_OFFSET + index]; }
  }
  workspace[WORKSPACE_OFFSET + index] = contribution;
}`;

  addPageRankPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-gather-dangling`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Applies the reverse-CSR pull recurrence using no more than eight storage bindings. */
function addPullPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    state: ImportedPageRank;
    workspace: GraphDataView<'float32'>;
    danglingMass: GraphDataView<'float32'>;
    iteration: number;
  }
): void {
  const {state, workspace, danglingMass} = props;
  const bindings: Record<string, PageRankBinding> = {
    output: {view: state.output, usage: 'storage-read'},
    workspace: {view: workspace, usage: 'storage-write'},
    forwardOffsets: {view: state.forwardOffsets, usage: 'storage-read'},
    ...(state.reverseOverflow
      ? {incomingOffsets: {view: state.incomingOffsets, usage: 'storage-read'}}
      : {}),
    incomingNeighbors: {view: state.incomingNeighbors, usage: 'storage-read'},
    danglingMass: {view: danglingMass, usage: 'storage-read'},
    overflow: {view: state.overflow, usage: 'storage-read'},
    ...(state.reverseOverflow
      ? {reverseOverflow: {view: state.reverseOverflow, usage: 'storage-read'}}
      : {})
  };
  const incomingOffset = state.reverseOverflow
    ? `const INCOMING_OFFSETS_OFFSET: u32 = ${getViewElementOffset(state.incomingOffsets)}u;`
    : '';
  const reverseOffset = state.reverseOverflow
    ? `const REVERSE_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.reverseOverflow)}u;`
    : '';
  const reverseOverflow = state.reverseOverflow
    ? ' || reverseOverflow[REVERSE_OVERFLOW_OFFSET] != 0u'
    : '';
  const incomingOffsets = state.reverseOverflow ? 'incomingOffsets' : 'forwardOffsets';
  const incomingOffsetsOffset = state.reverseOverflow
    ? 'INCOMING_OFFSETS_OFFSET'
    : 'FORWARD_OFFSETS_OFFSET';
  const dispatchLayout = getLuGraphPageRankDispatchLayout(
    state.vertexCount,
    state.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const CAPACITY: u32 = ${state.incomingNeighbors.length}u;
const DAMPING: f32 = ${state.damping};
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(state.output)}u;
const WORKSPACE_OFFSET: u32 = ${getViewElementOffset(workspace)}u;
const FORWARD_OFFSETS_OFFSET: u32 = ${getViewElementOffset(state.forwardOffsets)}u;
const INCOMING_NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(state.incomingNeighbors)}u;
const DANGLING_MASS_OFFSET: u32 = ${getViewElementOffset(danglingMass)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.overflow)}u;
${incomingOffset}
${reverseOffset}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${PAGE_RANK_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, PAGE_RANK_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT) { return; }
  let hasOverflow = overflow[OVERFLOW_OFFSET] != 0u${reverseOverflow};
  if (hasOverflow) {
    workspace[WORKSPACE_OFFSET + index] = 0.0;
    return;
  }
  let first = min(${incomingOffsets}[${incomingOffsetsOffset} + index], CAPACITY);
  let last = min(${incomingOffsets}[${incomingOffsetsOffset} + index + 1u], CAPACITY);
  var incomingMass = 0.0;
  for (var slot = first; slot < last; slot++) {
    let neighbor = incomingNeighbors[INCOMING_NEIGHBORS_OFFSET + slot];
    if (neighbor >= VERTEX_COUNT) { continue; }
    let degree =
      forwardOffsets[FORWARD_OFFSETS_OFFSET + neighbor + 1u] -
      forwardOffsets[FORWARD_OFFSETS_OFFSET + neighbor];
    if (degree > 0u) {
      incomingMass += output[OUTPUT_OFFSET + neighbor] / f32(degree);
    }
  }
  let vertexCount = f32(VERTEX_COUNT);
  let redistributedDangling = danglingMass[DANGLING_MASS_OFFSET] / vertexCount;
  let teleportation = (1.0 - DAMPING) / vertexCount;
  workspace[WORKSPACE_OFFSET + index] =
    teleportation + DAMPING * (incomingMass + redistributedDangling);
}`;

  addPageRankPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-pull`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Normalizes every iteration and optionally writes final absolute residual contributions. */
function addNormalizationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    state: ImportedPageRank;
    workspace: GraphDataView<'float32'>;
    rankSum: GraphDataView<'float32'>;
    iteration: number;
    collectResidual: boolean;
  }
): void {
  const {state, workspace, rankSum} = props;
  const bindings: Record<string, PageRankBinding> = {
    output: {view: state.output, usage: 'storage-read-write'},
    workspace: {
      view: workspace,
      usage: props.collectResidual ? 'storage-read-write' : 'storage-read'
    },
    rankSum: {view: rankSum, usage: 'storage-read'},
    overflow: {view: state.overflow, usage: 'storage-read'},
    ...(state.reverseOverflow
      ? {reverseOverflow: {view: state.reverseOverflow, usage: 'storage-read'}}
      : {})
  };
  const reverseOffset = state.reverseOverflow
    ? `const REVERSE_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.reverseOverflow)}u;`
    : '';
  const reverseOverflow = state.reverseOverflow
    ? ' || reverseOverflow[REVERSE_OVERFLOW_OFFSET] != 0u'
    : '';
  const collectResidual = props.collectResidual
    ? 'workspace[WORKSPACE_OFFSET + index] = difference;'
    : '';
  const dispatchLayout = getLuGraphPageRankDispatchLayout(
    state.vertexCount,
    state.maxComputeWorkgroupsPerDimension
  );
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(state.output)}u;
const WORKSPACE_OFFSET: u32 = ${getViewElementOffset(workspace)}u;
const RANK_SUM_OFFSET: u32 = ${getViewElementOffset(rankSum)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.overflow)}u;
${reverseOffset}
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${PAGE_RANK_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, PAGE_RANK_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT) { return; }
  let hasOverflow = overflow[OVERFLOW_OFFSET] != 0u${reverseOverflow};
  let total = rankSum[RANK_SUM_OFFSET];
  let validTotal = total > 0.0 && total == total && abs(total) <= 3.402823466e+38;
  var next = 0.0;
  var difference = 0.0;
  if (!hasOverflow && validTotal) {
    next = workspace[WORKSPACE_OFFSET + index] / total;
    difference = abs(next - output[OUTPUT_OFFSET + index]);
  }
  output[OUTPUT_OFFSET + index] = next;
  ${collectResidual}
}`;

  addPageRankPass(commandGraph, {
    id: `${state.id}-iteration-${props.iteration}-normalize`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Reuses one bounded workgroup hierarchy for dangling mass, rank sums, and final residual. */
function addReduction<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    state: ImportedPageRank;
    input: GraphDataView<'float32'>;
    levels: GraphDataView<'float32'>[];
    output?: GraphDataView<'float32'>;
  }
): GraphDataView<'float32'> {
  let input = props.input;
  for (const [levelIndex, level] of props.levels.entries()) {
    const last = levelIndex === props.levels.length - 1;
    const output = last && props.output ? props.output : level;
    addReductionPass(commandGraph, {
      id: `${props.id}-level-${levelIndex}`,
      input,
      output,
      maxComputeWorkgroupsPerDimension: props.state.maxComputeWorkgroupsPerDimension
    });
    input = output;
  }
  return input;
}

/** Sums 256 float32 lanes with only workgroup-uniform exits before synchronization barriers. */
function addReductionPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    input: GraphDataView<'float32'>;
    output: GraphDataView<'float32'>;
    maxComputeWorkgroupsPerDimension: number;
  }
): void {
  const bindings: Record<string, PageRankBinding> = {
    inputValues: {view: props.input, usage: 'storage-read'},
    outputValues: {view: props.output, usage: 'storage-write'}
  };
  const dispatchLayout = getLuGraphPageRankDispatchLayout(
    props.input.length,
    props.maxComputeWorkgroupsPerDimension
  );
  const useSubgroups = getGPUReductionStrategy(commandGraph.device) === 'subgroups';
  const reductionSource = useSubgroups
    ? `let subgroupTotal = subgroupAdd(value);
  if (subgroupInvocationId == 0u) {
    reductionValues[subgroupId] = subgroupTotal;
  }
  workgroupBarrier();
  let subgroupCount = ${PAGE_RANK_WORKGROUP_SIZE}u / subgroupSize;
  if (subgroupCount > 1u) {
    for (var stride = subgroupCount / 2u; stride > 0u; stride /= 2u) {
      if (localInvocationIndex < stride) {
        reductionValues[localInvocationIndex] += reductionValues[localInvocationIndex + stride];
      }
      workgroupBarrier();
    }
  }`
    : `reductionValues[localInvocationIndex] = value;
  workgroupBarrier();

  for (var stride = ${PAGE_RANK_WORKGROUP_SIZE / 2}u; stride > 0u; stride /= 2u) {
    if (localInvocationIndex < stride) {
      reductionValues[localInvocationIndex] += reductionValues[localInvocationIndex + stride];
    }
    workgroupBarrier();
  }`;
  const source = /* wgsl */ `
${useSubgroups ? 'enable subgroups;\nrequires subgroup_id;' : ''}
const INPUT_COUNT: u32 = ${props.input.length}u;
const OUTPUT_COUNT: u32 = ${props.output.length}u;
const INPUT_OFFSET: u32 = ${getViewElementOffset(props.input)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.output)}u;
${getBindingDeclarations(bindings)}
var<workgroup> reductionValues: array<f32, ${PAGE_RANK_WORKGROUP_SIZE}>;

@compute @workgroup_size(${PAGE_RANK_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  ${useSubgroups ? '@builtin(subgroup_invocation_id) subgroupInvocationId: u32,\n  @builtin(subgroup_size) subgroupSize: u32,\n  @builtin(subgroup_id) subgroupId: u32,' : ''}
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, PAGE_RANK_WORKGROUP_SIZE)}
  if (workgroupIndex >= OUTPUT_COUNT) { return; }
  var value = 0.0;
  if (index < INPUT_COUNT) { value = inputValues[INPUT_OFFSET + index]; }
  ${reductionSource}
  if (localInvocationIndex == 0u) {
    outputValues[OUTPUT_OFFSET + workgroupIndex] = reductionValues[0];
  }
}`;

  addPageRankPass(commandGraph, {id: props.id, source, bindings, dispatchLayout});
}

/** Declares packed uint32 and float32 storage views in generated binding-layout order. */
function getBindingDeclarations(bindings: Record<string, PageRankBinding>): string {
  return Object.entries(bindings)
    .map(([name, binding], location) => {
      const access = binding.usage === 'storage-read' ? 'read' : 'read_write';
      const element = binding.view.format === 'float32' ? 'f32' : 'u32';
      return `@group(0) @binding(${location}) var<storage, ${access}> ${name}: array<${element}>;`;
    })
    .join('\n');
}

/** Compiles one bounded GPU pass without hidden submission, synchronization, or readback. */
function addPageRankPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: PageRankPassProps
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

/** Plans bounded three-dimensional PageRank vertex and hierarchical-reduction dispatch. @internal */
export function getLuGraphPageRankDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    'LuGraphPageRank',
    elementCount,
    PAGE_RANK_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}
