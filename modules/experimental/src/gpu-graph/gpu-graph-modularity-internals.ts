// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuGraph.

import {type Binding} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GraphBufferUse,
  GraphDataView,
  GraphVectorView
} from '../gpu-core/gpu-command-graph';
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
import type {GPUGraphModularity} from './gpu-graph-modularity';

const MODULARITY_WORKGROUP_SIZE = 256;

type ModularityView = GraphDataView<'uint32'> | GraphDataView<'float32'>;

type ImportedModularity = {
  id: string;
  vertexCount: number;
  directed: boolean;
  resolution: number;
  sourceVertices: GraphVectorView<'uint32'>;
  targetVertices: GraphVectorView<'uint32'>;
  edgeWeights?: GraphVectorView<'float32'>;
  communities: GraphDataView<'uint32'>;
  outgoingVolumes: GraphDataView<'float32'>;
  incomingVolumes?: GraphDataView<'float32'>;
  internalWeights: GraphDataView<'float32'>;
  contributions: GraphDataView<'float32'>;
  totalVolume: GraphDataView<'float32'>;
  status: GraphDataView<'uint32'>;
  output: GraphDataView<'float32'>;
  valid?: GraphDataView<'uint32'>;
  maxComputeWorkgroupsPerDimension: number;
};

type ModularityBinding = {
  view: ModularityView;
  usage: GraphBufferUse['usage'];
  atomic?: boolean;
};

type ModularityPass = {
  id: string;
  source: string;
  bindings: Record<string, ModularityBinding>;
  dispatchLayout: GPUBoundedDispatchLayout;
};

/** Composes weighted Newman modularity directly over original ordered edge batches. @internal */
export function addGPUGraphModularityToGraphWithDispatchLimit<Parameters>(
  modularity: GPUGraphModularity,
  commandGraph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  const vertexCount = modularity.graph.vertexCount;
  const state: ImportedModularity = {
    id: modularity.id,
    vertexCount,
    directed: modularity.graph.directed,
    resolution: Math.fround(modularity.resolution),
    sourceVertices: commandGraph.importGPUVector(
      `${modularity.id}-source-vertices`,
      modularity.graph.sourceVertices
    ),
    targetVertices: commandGraph.importGPUVector(
      `${modularity.id}-target-vertices`,
      modularity.graph.targetVertices
    ),
    ...(modularity.graph.edgeWeights
      ? {
          edgeWeights: commandGraph.importGPUVector(
            `${modularity.id}-source-weights`,
            modularity.graph.edgeWeights
          )
        }
      : {}),
    communities: commandGraph.importGPUVector(
      `${modularity.id}-communities`,
      modularity.communities
    ).data[0],
    outgoingVolumes: createTransientView(
      commandGraph,
      `${modularity.id}-outgoing-volumes`,
      'float32',
      vertexCount
    ),
    ...(modularity.graph.directed
      ? {
          incomingVolumes: createTransientView(
            commandGraph,
            `${modularity.id}-incoming-volumes`,
            'float32',
            vertexCount
          )
        }
      : {}),
    internalWeights: createTransientView(
      commandGraph,
      `${modularity.id}-internal-weights`,
      'float32',
      vertexCount
    ),
    contributions: modularity.communityContributions
      ? commandGraph.importGPUVector(
          `${modularity.id}-community-contributions`,
          modularity.communityContributions
        ).data[0]
      : createTransientView(
          commandGraph,
          `${modularity.id}-contribution-scratch`,
          'float32',
          vertexCount
        ),
    totalVolume: createTransientView(commandGraph, `${modularity.id}-total-volume`, 'float32', 1),
    status: createTransientView(commandGraph, `${modularity.id}-invalid-status`, 'uint32', 1),
    output: commandGraph.importGPUVector(`${modularity.id}-output`, modularity.output).data[0],
    ...(modularity.valid
      ? {valid: commandGraph.importGPUVector(`${modularity.id}-valid`, modularity.valid).data[0]}
      : {}),
    maxComputeWorkgroupsPerDimension
  };

  addStatusInitializationPass(commandGraph, state);
  if (vertexCount > 0) addCommunityInitializationPass(commandGraph, state);

  for (const [chunkIndex, sources] of state.sourceVertices.data.entries()) {
    if (sources.length === 0) continue;
    addEdgeAccumulationPass(commandGraph, {
      state,
      chunkIndex,
      sources,
      targets: state.targetVertices.data[chunkIndex],
      weights: state.edgeWeights?.data[chunkIndex]
    });
  }

  new GPUReduction({
    id: `${state.id}-total-volume-reduction`,
    input: state.outgoingVolumes,
    output: state.totalVolume,
    operation: 'sum'
  }).addToGraph(commandGraph);

  if (vertexCount > 0) addContributionPass(commandGraph, state);

  new GPUReduction({
    id: `${state.id}-score-reduction`,
    input: state.contributions,
    output: state.output,
    operation: 'sum'
  }).addToGraph(commandGraph);

  addValidityFinalizationPass(commandGraph, state);
}

/** Resets status and scalar outputs before any parallel label validation or edge accumulation. */
function addStatusInitializationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedModularity
): void {
  const bindings: Record<string, ModularityBinding> = {
    status: {view: state.status, usage: 'storage-write', atomic: true},
    output: {view: state.output, usage: 'storage-write'},
    ...(state.valid ? {validity: {view: state.valid, usage: 'storage-write'}} : {})
  };
  const validityInitialization = state.valid
    ? `validity[${getViewElementOffset(state.valid)}u] = 0u;`
    : '';
  const source = /* wgsl */ `
${getBindingDeclarations(bindings)}

@compute @workgroup_size(1)
fn main() {
  atomicStore(&status[${getViewElementOffset(state.status)}u], 0u);
  output[${getViewElementOffset(state.output)}u] = 0.0;
  ${validityInitialization}
}`;
  addModularityPass(commandGraph, {
    id: `${state.id}-initialize-status`,
    source,
    bindings,
    dispatchLayout: {x: 1, y: 1, z: 1}
  });
}

/** Clears dense community volumes and rejects every out-of-domain label, including isolates. */
function addCommunityInitializationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedModularity
): void {
  const bindings: Record<string, ModularityBinding> = {
    communities: {view: state.communities, usage: 'storage-read'},
    outgoingVolumes: {view: state.outgoingVolumes, usage: 'storage-write', atomic: true},
    ...(state.incomingVolumes
      ? {incomingVolumes: {view: state.incomingVolumes, usage: 'storage-write', atomic: true}}
      : {}),
    internalWeights: {view: state.internalWeights, usage: 'storage-write', atomic: true},
    contributions: {view: state.contributions, usage: 'storage-write'},
    status: {view: state.status, usage: 'storage-read-write', atomic: true}
  };
  const initializeIncoming = state.incomingVolumes
    ? `atomicStore(&incomingVolumes[${getViewElementOffset(state.incomingVolumes)}u + index], 0u);`
    : '';
  const dispatchLayout = getDispatchLayout(state, state.vertexCount);
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
${getBindingDeclarations(bindings)}

@compute @workgroup_size(${MODULARITY_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, MODULARITY_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT) { return; }
  atomicStore(&outgoingVolumes[${getViewElementOffset(state.outgoingVolumes)}u + index], 0u);
  ${initializeIncoming}
  atomicStore(&internalWeights[${getViewElementOffset(state.internalWeights)}u + index], 0u);
  contributions[${getViewElementOffset(state.contributions)}u + index] = 0.0;
  if (communities[${getViewElementOffset(state.communities)}u + index] >= VERTEX_COUNT) {
    atomicStore(&status[${getViewElementOffset(state.status)}u], 1u);
  }
}`;
  addModularityPass(commandGraph, {
    id: `${state.id}-initialize-communities`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Atomically aggregates one unchanged source chunk into dense directed or undirected volumes. */
function addEdgeAccumulationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    state: ImportedModularity;
    chunkIndex: number;
    sources: GraphDataView<'uint32'>;
    targets: GraphDataView<'uint32'>;
    weights?: GraphDataView<'float32'>;
  }
): void {
  const {state} = props;
  const bindings: Record<string, ModularityBinding> = {
    sourceVertices: {view: props.sources, usage: 'storage-read'},
    targetVertices: {view: props.targets, usage: 'storage-read'},
    ...(props.weights ? {edgeWeights: {view: props.weights, usage: 'storage-read'}} : {}),
    communities: {view: state.communities, usage: 'storage-read'},
    outgoingVolumes: {view: state.outgoingVolumes, usage: 'storage-read-write', atomic: true},
    ...(state.incomingVolumes
      ? {incomingVolumes: {view: state.incomingVolumes, usage: 'storage-read-write', atomic: true}}
      : {}),
    internalWeights: {view: state.internalWeights, usage: 'storage-read-write', atomic: true},
    status: {view: state.status, usage: 'storage-read-write', atomic: true}
  };
  const weightExpression = props.weights
    ? `edgeWeights[${getViewElementOffset(props.weights)}u + index]`
    : '1.0';
  const accumulateSecondEndpoint = state.incomingVolumes
    ? `atomicAddFloat(&incomingVolumes[${getViewElementOffset(state.incomingVolumes)}u + targetCommunity], edgeWeight);`
    : `atomicAddFloat(&outgoingVolumes[${getViewElementOffset(state.outgoingVolumes)}u + targetCommunity], edgeWeight);`;
  const dispatchLayout = getDispatchLayout(state, props.sources.length);
  const source = /* wgsl */ `
const EDGE_COUNT: u32 = ${props.sources.length}u;
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
${getBindingDeclarations(bindings)}

${getAtomicFloatAdditionSource()}

@compute @workgroup_size(${MODULARITY_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, MODULARITY_WORKGROUP_SIZE)}
  if (index >= EDGE_COUNT) { return; }
  let sourceVertex = sourceVertices[${getViewElementOffset(props.sources)}u + index];
  let targetVertex = targetVertices[${getViewElementOffset(props.targets)}u + index];
  if (sourceVertex >= VERTEX_COUNT || targetVertex >= VERTEX_COUNT) { return; }

  let edgeWeight = ${weightExpression};
  let weightMagnitudeBits = bitcast<u32>(edgeWeight) & 0x7fffffffu;
  if (weightMagnitudeBits >= 0x7f800000u || edgeWeight < 0.0) {
    atomicStore(&status[${getViewElementOffset(state.status)}u], 1u);
    return;
  }

  let sourceCommunity = communities[${getViewElementOffset(state.communities)}u + sourceVertex];
  let targetCommunity = communities[${getViewElementOffset(state.communities)}u + targetVertex];
  if (sourceCommunity >= VERTEX_COUNT || targetCommunity >= VERTEX_COUNT) {
    atomicStore(&status[${getViewElementOffset(state.status)}u], 1u);
    return;
  }

  atomicAddFloat(&outgoingVolumes[${getViewElementOffset(state.outgoingVolumes)}u + sourceCommunity], edgeWeight);
  ${accumulateSecondEndpoint}
  if (sourceCommunity == targetCommunity) {
    atomicAddFloat(&internalWeights[${getViewElementOffset(state.internalWeights)}u + sourceCommunity], edgeWeight);
  }
}`;
  addModularityPass(commandGraph, {
    id: `${state.id}-accumulate-chunk-${props.chunkIndex}`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Computes stable-label contributions after a synchronized exact total-volume reduction. */
function addContributionPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedModularity
): void {
  const bindings: Record<string, ModularityBinding> = {
    outgoingVolumes: {view: state.outgoingVolumes, usage: 'storage-read'},
    ...(state.incomingVolumes
      ? {incomingVolumes: {view: state.incomingVolumes, usage: 'storage-read'}}
      : {}),
    internalWeights: {view: state.internalWeights, usage: 'storage-read'},
    totalVolume: {view: state.totalVolume, usage: 'storage-read'},
    contributions: {view: state.contributions, usage: 'storage-write'},
    status: {view: state.status, usage: 'storage-read-write', atomic: true}
  };
  const incomingVolume = state.incomingVolumes
    ? `incomingVolumes[${getViewElementOffset(state.incomingVolumes)}u + index]`
    : `outgoingVolumes[${getViewElementOffset(state.outgoingVolumes)}u + index]`;
  const internalFactor = state.directed ? '1.0' : '2.0';
  const dispatchLayout = getDispatchLayout(state, state.vertexCount);
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const RESOLUTION: f32 = ${state.resolution.toExponential()};
${getBindingDeclarations(bindings)}

fn isFiniteValue(value: f32) -> bool {
  return (bitcast<u32>(value) & 0x7fffffffu) < 0x7f800000u;
}

@compute @workgroup_size(${MODULARITY_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, MODULARITY_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT) { return; }

  let volume = totalVolume[${getViewElementOffset(state.totalVolume)}u];
  if (atomicLoad(&status[${getViewElementOffset(state.status)}u]) != 0u ||
      !isFiniteValue(volume) || volume <= 0.0) {
    contributions[${getViewElementOffset(state.contributions)}u + index] = 0.0;
    return;
  }

  let internal = internalWeights[${getViewElementOffset(state.internalWeights)}u + index];
  let outgoing = outgoingVolumes[${getViewElementOffset(state.outgoingVolumes)}u + index];
  let incoming = ${incomingVolume};
  let contribution =
    (internal / volume) * ${internalFactor} - RESOLUTION * (outgoing / volume) * (incoming / volume);
  if (!isFiniteValue(contribution)) {
    atomicStore(&status[${getViewElementOffset(state.status)}u], 1u);
    contributions[${getViewElementOffset(state.contributions)}u + index] = 0.0;
    return;
  }
  contributions[${getViewElementOffset(state.contributions)}u + index] = contribution;
}`;
  addModularityPass(commandGraph, {
    id: `${state.id}-community-contributions`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Publishes final scalar validity and clears every contribution when any stage failed closed. */
function addValidityFinalizationPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  state: ImportedModularity
): void {
  const bindings: Record<string, ModularityBinding> = {
    status: {view: state.status, usage: 'storage-read'},
    totalVolume: {view: state.totalVolume, usage: 'storage-read'},
    output: {view: state.output, usage: 'storage-read-write'},
    contributions: {view: state.contributions, usage: 'storage-read-write'},
    ...(state.valid ? {validity: {view: state.valid, usage: 'storage-write'}} : {})
  };
  const publishValidity = state.valid
    ? `validity[${getViewElementOffset(state.valid)}u] = select(0u, 1u, isValid);`
    : '';
  const dispatchLayout = getDispatchLayout(state, Math.max(state.vertexCount, 1));
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
${getBindingDeclarations(bindings)}

fn isFiniteValue(value: f32) -> bool {
  return (bitcast<u32>(value) & 0x7fffffffu) < 0x7f800000u;
}

@compute @workgroup_size(${MODULARITY_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, MODULARITY_WORKGROUP_SIZE)}
  if (index >= max(VERTEX_COUNT, 1u)) { return; }
  let volume = totalVolume[${getViewElementOffset(state.totalVolume)}u];
  let score = output[${getViewElementOffset(state.output)}u];
  let isValid = status[${getViewElementOffset(state.status)}u] == 0u &&
    isFiniteValue(volume) && volume > 0.0 && isFiniteValue(score);
  if (index == 0u) {
    output[${getViewElementOffset(state.output)}u] = select(0.0, score, isValid);
    ${publishValidity}
  }
  if (index < VERTEX_COUNT && !isValid) {
    contributions[${getViewElementOffset(state.contributions)}u + index] = 0.0;
  }
}`;
  addModularityPass(commandGraph, {
    id: `${state.id}-finalize-validity`,
    source,
    bindings,
    dispatchLayout
  });
}

/** Implements portable float addition with the only universally available WGSL atomic type. */
function getAtomicFloatAdditionSource(): string {
  return /* wgsl */ `
fn atomicAddFloat(destination: ptr<storage, atomic<u32>, read_write>, value: f32) {
  var previousBits = atomicLoad(destination);
  loop {
    let nextBits = bitcast<u32>(bitcast<f32>(previousBits) + value);
    let exchange = atomicCompareExchangeWeak(destination, previousBits, nextBits);
    if (exchange.exchanged) { return; }
    previousBits = exchange.old_value;
  }
}`;
}

/** Declares packed float, unsigned, and portable float-atomic storage bindings. */
function getBindingDeclarations(bindings: Record<string, ModularityBinding>): string {
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

/** Compiles one graph-owned bounded pass without hidden queue submission or result readback. */
function addModularityPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: ModularityPass
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
          const shaderBindings: Record<string, Binding> = {};
          for (const [name, binding] of Object.entries(props.bindings)) {
            shaderBindings[name] = getViewBinding(binding.view, getBuffer);
          }
          computation.setBindings(shaderBindings);
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

function getDispatchLayout(
  state: ImportedModularity,
  elementCount: number
): GPUBoundedDispatchLayout {
  return getGPUGraphModularityDispatchLayout(elementCount, state.maxComputeWorkgroupsPerDimension);
}

/** Plans bounded true three-dimensional edge-chunk, label, or finalization dispatch. @internal */
export function getGPUGraphModularityDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    'GPUGraphModularity',
    elementCount,
    MODULARITY_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}
