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
import {addGPUScanToGraphWithDispatchLimit, GPUScan} from '../gpu-primitives/gpu-scan';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset
} from '../gpu-primitives/graph-data-view-utils';
import type {LuGraphAdjacency, LuGraphTopology} from './lu-graph-topology';

const TOPOLOGY_WORKGROUP_SIZE = 256;
const INVALID_EDGE_SLOT = 0xffffffff;

type ImportedGraphSources = {
  sourceVertices: GraphVectorView<'uint32'>;
  targetVertices: GraphVectorView<'uint32'>;
  edgeIds?: GraphVectorView<'uint32'>;
  edgeWeights?: GraphVectorView<'float32'>;
};

type ImportedAdjacency = {
  offsets: GraphDataView<'uint32'>;
  neighbors: GraphDataView<'uint32'>;
  edgeIds: GraphDataView<'uint32'>;
  edgeWeights?: GraphDataView<'float32'>;
  count: GraphDataView<'uint32'>;
  overflow: GraphDataView<'uint32'>;
};

type AdjacencyBuild = {
  id: string;
  vertexCount: number;
  directed: boolean;
  reverse: boolean;
  sources: ImportedGraphSources;
  adjacency: ImportedAdjacency;
  invalidEdgeCount?: GraphDataView<'uint32'>;
  maxComputeWorkgroupsPerDimension: number;
};

type TopologyPassProps = {
  id: string;
  source: string;
  resources: GraphBufferUse[];
  bindings: Record<string, GraphDataView>;
  dispatchLayout: GPUBoundedDispatchLayout;
};

/** Adds chunk-preserving GPU CSR construction with an explicit dispatch limit. @internal */
export function addLuGraphTopologyToGraphWithDispatchLimit<Parameters>(
  topology: LuGraphTopology,
  commandGraph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  const sources: ImportedGraphSources = {
    sourceVertices: commandGraph.importGPUVector(
      `${topology.id}-source-vertices`,
      topology.graph.sourceVertices
    ),
    targetVertices: commandGraph.importGPUVector(
      `${topology.id}-target-vertices`,
      topology.graph.targetVertices
    ),
    ...(topology.graph.edgeIds
      ? {
          edgeIds: commandGraph.importGPUVector(
            `${topology.id}-source-edge-ids`,
            topology.graph.edgeIds
          )
        }
      : {}),
    ...(topology.graph.edgeWeights
      ? {
          edgeWeights: commandGraph.importGPUVector(
            `${topology.id}-source-edge-weights`,
            topology.graph.edgeWeights
          )
        }
      : {})
  };
  const invalidEdgeCount = commandGraph.importGPUVector(
    `${topology.id}-invalid-edge-count`,
    topology.invalidEdgeCount
  ).data[0];

  addAdjacencyBuild(commandGraph, {
    id: `${topology.id}-forward`,
    vertexCount: topology.graph.vertexCount,
    directed: topology.graph.directed,
    reverse: false,
    sources,
    adjacency: importAdjacency(commandGraph, `${topology.id}-forward`, topology.forward),
    invalidEdgeCount,
    maxComputeWorkgroupsPerDimension
  });

  if (topology.reverse) {
    addAdjacencyBuild(commandGraph, {
      id: `${topology.id}-reverse`,
      vertexCount: topology.graph.vertexCount,
      directed: topology.graph.directed,
      reverse: true,
      sources,
      adjacency: importAdjacency(commandGraph, `${topology.id}-reverse`, topology.reverse),
      maxComputeWorkgroupsPerDimension
    });
  }
}

/** Imports caller-owned output vectors without changing their single-buffer topology. */
function importAdjacency<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  id: string,
  adjacency: LuGraphAdjacency
): ImportedAdjacency {
  return {
    offsets: commandGraph.importGPUVector(`${id}-offsets`, adjacency.offsets).data[0],
    neighbors: commandGraph.importGPUVector(`${id}-neighbors`, adjacency.neighbors).data[0],
    edgeIds: commandGraph.importGPUVector(`${id}-edge-ids`, adjacency.edgeIds).data[0],
    ...(adjacency.edgeWeights
      ? {
          edgeWeights: commandGraph.importGPUVector(`${id}-edge-weights`, adjacency.edgeWeights)
            .data[0]
        }
      : {}),
    count: commandGraph.importGPUVector(`${id}-count`, adjacency.count).data[0],
    overflow: commandGraph.importGPUVector(`${id}-overflow`, adjacency.overflow).data[0]
  };
}

/** Builds one orientation using separate initialization, degree, scan, and scatter passes. */
function addAdjacencyBuild<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: AdjacencyBuild
): void {
  const degrees = createTransientView(
    commandGraph,
    `${props.id}-degrees`,
    'uint32',
    props.vertexCount
  );
  const cursors = createTransientView(
    commandGraph,
    `${props.id}-cursors`,
    'uint32',
    props.vertexCount
  );
  const scannedOffsets = createTransientView(
    commandGraph,
    `${props.id}-scanned-offsets`,
    'uint32',
    props.vertexCount
  );

  addInitializePass(commandGraph, {
    id: `${props.id}-initialize`,
    degrees,
    cursors,
    invalidEdgeCount: props.invalidEdgeCount,
    dispatchLayout: getTopologyDispatchLayout(
      Math.max(props.vertexCount, 1),
      props.maxComputeWorkgroupsPerDimension
    )
  });

  for (const [chunkIndex, sourceVertices] of props.sources.sourceVertices.data.entries()) {
    if (sourceVertices.length > 0) {
      addDegreePass(commandGraph, {
        id: `${props.id}-degrees-${chunkIndex}`,
        sourceVertices,
        targetVertices: props.sources.targetVertices.data[chunkIndex],
        degrees,
        invalidEdgeCount: props.invalidEdgeCount,
        vertexCount: props.vertexCount,
        directed: props.directed,
        reverse: props.reverse,
        dispatchLayout: getTopologyDispatchLayout(
          sourceVertices.length,
          props.maxComputeWorkgroupsPerDimension
        )
      });
    }
  }

  const scan = new GPUScan({id: `${props.id}-scan`, input: degrees, output: scannedOffsets});
  addGPUScanToGraphWithDispatchLimit(scan, commandGraph, props.maxComputeWorkgroupsPerDimension);

  addFinalizePass(commandGraph, {
    id: `${props.id}-finalize`,
    degrees,
    scannedOffsets,
    adjacency: props.adjacency,
    vertexCount: props.vertexCount,
    dispatchLayout: getTopologyDispatchLayout(
      Math.max(props.vertexCount, 1),
      props.maxComputeWorkgroupsPerDimension
    )
  });

  let sourceBase = 0;
  for (const [chunkIndex, sourceVertices] of props.sources.sourceVertices.data.entries()) {
    if (sourceVertices.length > 0 && props.adjacency.neighbors.length > 0) {
      const edgeWeights = props.sources.edgeWeights?.data[chunkIndex];
      const slots = edgeWeights
        ? createTransientView(
            commandGraph,
            `${props.id}-slots-${chunkIndex}`,
            'uint32',
            sourceVertices.length * (props.directed ? 1 : 2)
          )
        : undefined;
      const dispatchLayout = getTopologyDispatchLayout(
        sourceVertices.length,
        props.maxComputeWorkgroupsPerDimension
      );

      addScatterPass(commandGraph, {
        id: `${props.id}-scatter-${chunkIndex}`,
        sourceVertices,
        targetVertices: props.sources.targetVertices.data[chunkIndex],
        sourceEdgeIds: props.sources.edgeIds?.data[chunkIndex],
        sourceBase,
        scannedOffsets,
        cursors,
        adjacency: props.adjacency,
        slots,
        vertexCount: props.vertexCount,
        directed: props.directed,
        reverse: props.reverse,
        dispatchLayout
      });

      if (edgeWeights && slots && props.adjacency.edgeWeights) {
        addWeightPass(commandGraph, {
          id: `${props.id}-weights-${chunkIndex}`,
          sourceWeights: edgeWeights,
          outputWeights: props.adjacency.edgeWeights,
          slots,
          directed: props.directed,
          dispatchLayout
        });
      }
    }
    sourceBase += sourceVertices.length;
  }
}

/** Clears graph-owned vertex scratch and the shared invalid-edge counter before each encoding. */
function addInitializePass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    degrees: GraphDataView<'uint32'>;
    cursors: GraphDataView<'uint32'>;
    invalidEdgeCount?: GraphDataView<'uint32'>;
    dispatchLayout: GPUBoundedDispatchLayout;
  }
): void {
  const invalidDeclaration = props.invalidEdgeCount
    ? `const INVALID_OFFSET: u32 = ${getViewElementOffset(props.invalidEdgeCount)}u;
@group(0) @binding(2) var<storage, read_write> invalidEdges: array<atomic<u32>>;`
    : '';
  const invalidClear = props.invalidEdgeCount
    ? 'if (index == 0u) { atomicStore(&invalidEdges[INVALID_OFFSET], 0u); }'
    : '';
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${props.degrees.length}u;
const DEGREES_OFFSET: u32 = ${getViewElementOffset(props.degrees)}u;
const CURSORS_OFFSET: u32 = ${getViewElementOffset(props.cursors)}u;
@group(0) @binding(0) var<storage, read_write> degrees: array<atomic<u32>>;
@group(0) @binding(1) var<storage, read_write> cursors: array<atomic<u32>>;
${invalidDeclaration}

@compute @workgroup_size(${TOPOLOGY_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getTopologyInvocationIndexSource(props.dispatchLayout)}
  if (index < VERTEX_COUNT) {
    atomicStore(&degrees[DEGREES_OFFSET + index], 0u);
    atomicStore(&cursors[CURSORS_OFFSET + index], 0u);
  }
  ${invalidClear}
}`;
  const bindings: Record<string, GraphDataView> = {
    degrees: props.degrees,
    cursors: props.cursors
  };
  const resources: GraphBufferUse[] = [
    {buffer: props.degrees, usage: 'storage-write'},
    {buffer: props.cursors, usage: 'storage-write'}
  ];
  if (props.invalidEdgeCount) {
    bindings['invalidEdges'] = props.invalidEdgeCount;
    resources.push({buffer: props.invalidEdgeCount, usage: 'storage-write'});
  }
  addTopologyPass(commandGraph, {
    id: props.id,
    source,
    bindings,
    resources,
    dispatchLayout: props.dispatchLayout
  });
}

/** Counts accepted source edges once while retaining duplicate edges and isolated vertices. */
function addDegreePass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    sourceVertices: GraphDataView<'uint32'>;
    targetVertices: GraphDataView<'uint32'>;
    degrees: GraphDataView<'uint32'>;
    invalidEdgeCount?: GraphDataView<'uint32'>;
    vertexCount: number;
    directed: boolean;
    reverse: boolean;
    dispatchLayout: GPUBoundedDispatchLayout;
  }
): void {
  const invalidDeclaration = props.invalidEdgeCount
    ? `const INVALID_OFFSET: u32 = ${getViewElementOffset(props.invalidEdgeCount)}u;
@group(0) @binding(3) var<storage, read_write> invalidEdges: array<atomic<u32>>;`
    : '';
  const invalidIncrement = props.invalidEdgeCount
    ? 'atomicAdd(&invalidEdges[INVALID_OFFSET], 1u);'
    : '';
  const firstVertex = props.reverse ? 'targetVertex' : 'sourceVertex';
  const secondVertex = props.reverse ? 'sourceVertex' : 'targetVertex';
  const symmetricCount = props.directed
    ? ''
    : `if (sourceVertex != targetVertex) {
    atomicAdd(&degrees[DEGREES_OFFSET + ${secondVertex}], 1u);
  }`;
  const source = /* wgsl */ `
const EDGE_COUNT: u32 = ${props.sourceVertices.length}u;
const VERTEX_COUNT: u32 = ${props.vertexCount}u;
const SOURCES_OFFSET: u32 = ${getViewElementOffset(props.sourceVertices)}u;
const TARGETS_OFFSET: u32 = ${getViewElementOffset(props.targetVertices)}u;
const DEGREES_OFFSET: u32 = ${getViewElementOffset(props.degrees)}u;
@group(0) @binding(0) var<storage, read> sourceVertices: array<u32>;
@group(0) @binding(1) var<storage, read> targetVertices: array<u32>;
@group(0) @binding(2) var<storage, read_write> degrees: array<atomic<u32>>;
${invalidDeclaration}

@compute @workgroup_size(${TOPOLOGY_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getTopologyInvocationIndexSource(props.dispatchLayout)}
  if (index >= EDGE_COUNT) { return; }
  let sourceVertex = sourceVertices[SOURCES_OFFSET + index];
  let targetVertex = targetVertices[TARGETS_OFFSET + index];
  if (sourceVertex >= VERTEX_COUNT || targetVertex >= VERTEX_COUNT) {
    ${invalidIncrement}
    return;
  }
  atomicAdd(&degrees[DEGREES_OFFSET + ${firstVertex}], 1u);
  ${symmetricCount}
}`;
  const bindings: Record<string, GraphDataView> = {
    sourceVertices: props.sourceVertices,
    targetVertices: props.targetVertices,
    degrees: props.degrees
  };
  const resources: GraphBufferUse[] = [
    {buffer: props.sourceVertices, usage: 'storage-read'},
    {buffer: props.targetVertices, usage: 'storage-read'},
    {buffer: props.degrees, usage: 'storage-read-write'}
  ];
  if (props.invalidEdgeCount) {
    bindings['invalidEdges'] = props.invalidEdgeCount;
    resources.push({buffer: props.invalidEdgeCount, usage: 'storage-read-write'});
  }
  addTopologyPass(commandGraph, {
    id: props.id,
    source,
    bindings,
    resources,
    dispatchLayout: props.dispatchLayout
  });
}

/** Publishes complete untruncated CSR offsets, accepted edge count, and explicit overflow. */
function addFinalizePass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    degrees: GraphDataView<'uint32'>;
    scannedOffsets: GraphDataView<'uint32'>;
    adjacency: ImportedAdjacency;
    vertexCount: number;
    dispatchLayout: GPUBoundedDispatchLayout;
  }
): void {
  const source = /* wgsl */ `
const VERTEX_COUNT: u32 = ${props.vertexCount}u;
const CAPACITY: u32 = ${props.adjacency.neighbors.length}u;
const DEGREES_OFFSET: u32 = ${getViewElementOffset(props.degrees)}u;
const SCANNED_OFFSET: u32 = ${getViewElementOffset(props.scannedOffsets)}u;
const OFFSETS_OFFSET: u32 = ${getViewElementOffset(props.adjacency.offsets)}u;
const COUNT_OFFSET: u32 = ${getViewElementOffset(props.adjacency.count)}u;
const OVERFLOW_OFFSET: u32 = ${getViewElementOffset(props.adjacency.overflow)}u;
@group(0) @binding(0) var<storage, read> degrees: array<u32>;
@group(0) @binding(1) var<storage, read> scannedOffsets: array<u32>;
@group(0) @binding(2) var<storage, read_write> offsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> outputCount: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputOverflow: array<u32>;

@compute @workgroup_size(${TOPOLOGY_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getTopologyInvocationIndexSource(props.dispatchLayout)}
  if (index < VERTEX_COUNT) {
    offsets[OFFSETS_OFFSET + index] = scannedOffsets[SCANNED_OFFSET + index];
  }
  if (index == 0u) {
    var total = 0u;
    if (VERTEX_COUNT > 0u) {
      let last = max(VERTEX_COUNT, 1u) - 1u;
      total = scannedOffsets[SCANNED_OFFSET + last] + degrees[DEGREES_OFFSET + last];
    }
    offsets[OFFSETS_OFFSET + VERTEX_COUNT] = total;
    outputCount[COUNT_OFFSET] = total;
    outputOverflow[OVERFLOW_OFFSET] = select(0u, 1u, total > CAPACITY);
  }
}`;
  addTopologyPass(commandGraph, {
    id: props.id,
    source,
    resources: [
      {buffer: props.degrees, usage: 'storage-read'},
      {buffer: props.scannedOffsets, usage: 'storage-read'},
      {buffer: props.adjacency.offsets, usage: 'storage-write'},
      {buffer: props.adjacency.count, usage: 'storage-write'},
      {buffer: props.adjacency.overflow, usage: 'storage-write'}
    ],
    bindings: {
      degrees: props.degrees,
      scannedOffsets: props.scannedOffsets,
      offsets: props.adjacency.offsets,
      outputCount: props.adjacency.count,
      outputOverflow: props.adjacency.overflow
    },
    dispatchLayout: props.dispatchLayout
  });
}

/** Places neighbors and stable edge IDs with at most eight portable storage bindings. */
function addScatterPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    sourceVertices: GraphDataView<'uint32'>;
    targetVertices: GraphDataView<'uint32'>;
    sourceEdgeIds?: GraphDataView<'uint32'>;
    sourceBase: number;
    scannedOffsets: GraphDataView<'uint32'>;
    cursors: GraphDataView<'uint32'>;
    adjacency: ImportedAdjacency;
    slots?: GraphDataView<'uint32'>;
    vertexCount: number;
    directed: boolean;
    reverse: boolean;
    dispatchLayout: GPUBoundedDispatchLayout;
  }
): void {
  const edgeIdsDeclaration = props.sourceEdgeIds
    ? `const SOURCE_EDGE_IDS_OFFSET: u32 = ${getViewElementOffset(props.sourceEdgeIds)}u;
@group(0) @binding(6) var<storage, read> sourceEdgeIds: array<u32>;`
    : '';
  const slotBinding = props.sourceEdgeIds ? 7 : 6;
  const slotsDeclaration = props.slots
    ? `const SLOTS_OFFSET: u32 = ${getViewElementOffset(props.slots)}u;
@group(0) @binding(${slotBinding}) var<storage, read_write> slots: array<u32>;`
    : '';
  const slotStride = props.directed ? 1 : 2;
  const clearSlots = props.slots
    ? `slots[SLOTS_OFFSET + index * ${slotStride}u] = ${INVALID_EDGE_SLOT}u;
  ${props.directed ? '' : `slots[SLOTS_OFFSET + index * 2u + 1u] = ${INVALID_EDGE_SLOT}u;`}`
    : '';
  const firstVertex = props.reverse ? 'targetVertex' : 'sourceVertex';
  const firstNeighbor = props.reverse ? 'sourceVertex' : 'targetVertex';
  const secondVertex = firstNeighbor;
  const secondNeighbor = firstVertex;
  const firstSlotWrite = props.slots
    ? `slots[SLOTS_OFFSET + index * ${slotStride}u] = firstSlot;`
    : '';
  const secondSlotWrite = props.slots ? 'slots[SLOTS_OFFSET + index * 2u + 1u] = secondSlot;' : '';
  const symmetricScatter = props.directed
    ? ''
    : `if (sourceVertex != targetVertex) {
    let secondSlot = scannedOffsets[SCANNED_OFFSET + ${secondVertex}] +
      atomicAdd(&cursors[CURSORS_OFFSET + ${secondVertex}], 1u);
    if (secondSlot < CAPACITY) {
      neighbors[NEIGHBORS_OFFSET + secondSlot] = ${secondNeighbor};
      outputEdgeIds[OUTPUT_EDGE_IDS_OFFSET + secondSlot] = edgeIdentifier;
      ${secondSlotWrite}
    }
  }`;
  const edgeIdentifier = props.sourceEdgeIds
    ? 'sourceEdgeIds[SOURCE_EDGE_IDS_OFFSET + index]'
    : `${props.sourceBase}u + index`;
  const source = /* wgsl */ `
const EDGE_COUNT: u32 = ${props.sourceVertices.length}u;
const VERTEX_COUNT: u32 = ${props.vertexCount}u;
const CAPACITY: u32 = ${props.adjacency.neighbors.length}u;
const SOURCES_OFFSET: u32 = ${getViewElementOffset(props.sourceVertices)}u;
const TARGETS_OFFSET: u32 = ${getViewElementOffset(props.targetVertices)}u;
const SCANNED_OFFSET: u32 = ${getViewElementOffset(props.scannedOffsets)}u;
const CURSORS_OFFSET: u32 = ${getViewElementOffset(props.cursors)}u;
const NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(props.adjacency.neighbors)}u;
const OUTPUT_EDGE_IDS_OFFSET: u32 = ${getViewElementOffset(props.adjacency.edgeIds)}u;
@group(0) @binding(0) var<storage, read> sourceVertices: array<u32>;
@group(0) @binding(1) var<storage, read> targetVertices: array<u32>;
@group(0) @binding(2) var<storage, read> scannedOffsets: array<u32>;
@group(0) @binding(3) var<storage, read_write> cursors: array<atomic<u32>>;
@group(0) @binding(4) var<storage, read_write> neighbors: array<u32>;
@group(0) @binding(5) var<storage, read_write> outputEdgeIds: array<u32>;
${edgeIdsDeclaration}
${slotsDeclaration}

@compute @workgroup_size(${TOPOLOGY_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getTopologyInvocationIndexSource(props.dispatchLayout)}
  if (index >= EDGE_COUNT) { return; }
  ${clearSlots}
  let sourceVertex = sourceVertices[SOURCES_OFFSET + index];
  let targetVertex = targetVertices[TARGETS_OFFSET + index];
  if (sourceVertex >= VERTEX_COUNT || targetVertex >= VERTEX_COUNT) { return; }
  let edgeIdentifier = ${edgeIdentifier};
  let firstSlot = scannedOffsets[SCANNED_OFFSET + ${firstVertex}] +
    atomicAdd(&cursors[CURSORS_OFFSET + ${firstVertex}], 1u);
  if (firstSlot < CAPACITY) {
    neighbors[NEIGHBORS_OFFSET + firstSlot] = ${firstNeighbor};
    outputEdgeIds[OUTPUT_EDGE_IDS_OFFSET + firstSlot] = edgeIdentifier;
    ${firstSlotWrite}
  }
  ${symmetricScatter}
}`;
  const bindings: Record<string, GraphDataView> = {
    sourceVertices: props.sourceVertices,
    targetVertices: props.targetVertices,
    scannedOffsets: props.scannedOffsets,
    cursors: props.cursors,
    neighbors: props.adjacency.neighbors,
    outputEdgeIds: props.adjacency.edgeIds
  };
  const resources: GraphBufferUse[] = [
    {buffer: props.sourceVertices, usage: 'storage-read'},
    {buffer: props.targetVertices, usage: 'storage-read'},
    {buffer: props.scannedOffsets, usage: 'storage-read'},
    {buffer: props.cursors, usage: 'storage-read-write'},
    {buffer: props.adjacency.neighbors, usage: 'storage-write'},
    {buffer: props.adjacency.edgeIds, usage: 'storage-write'}
  ];
  if (props.sourceEdgeIds) {
    bindings['sourceEdgeIds'] = props.sourceEdgeIds;
    resources.push({buffer: props.sourceEdgeIds, usage: 'storage-read'});
  }
  if (props.slots) {
    bindings['slots'] = props.slots;
    resources.push({buffer: props.slots, usage: 'storage-write'});
  }
  addTopologyPass(commandGraph, {
    id: props.id,
    source,
    bindings,
    resources,
    dispatchLayout: props.dispatchLayout
  });
}

/** Materializes float32 edge weights into the exact atomic slots selected by placement. */
function addWeightPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: {
    id: string;
    sourceWeights: GraphDataView<'float32'>;
    outputWeights: GraphDataView<'float32'>;
    slots: GraphDataView<'uint32'>;
    directed: boolean;
    dispatchLayout: GPUBoundedDispatchLayout;
  }
): void {
  const slotStride = props.directed ? 1 : 2;
  const secondWeight = props.directed
    ? ''
    : `let secondSlot = slots[SLOTS_OFFSET + index * 2u + 1u];
  if (secondSlot != ${INVALID_EDGE_SLOT}u) {
    outputWeights[OUTPUT_OFFSET + secondSlot] = weight;
  }`;
  const source = /* wgsl */ `
const EDGE_COUNT: u32 = ${props.sourceWeights.length}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(props.sourceWeights)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(props.outputWeights)}u;
const SLOTS_OFFSET: u32 = ${getViewElementOffset(props.slots)}u;
@group(0) @binding(0) var<storage, read> sourceWeights: array<f32>;
@group(0) @binding(1) var<storage, read> slots: array<u32>;
@group(0) @binding(2) var<storage, read_write> outputWeights: array<f32>;

@compute @workgroup_size(${TOPOLOGY_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getTopologyInvocationIndexSource(props.dispatchLayout)}
  if (index >= EDGE_COUNT) { return; }
  let weight = sourceWeights[SOURCE_OFFSET + index];
  let firstSlot = slots[SLOTS_OFFSET + index * ${slotStride}u];
  if (firstSlot != ${INVALID_EDGE_SLOT}u) {
    outputWeights[OUTPUT_OFFSET + firstSlot] = weight;
  }
  ${secondWeight}
}`;
  addTopologyPass(commandGraph, {
    id: props.id,
    source,
    resources: [
      {buffer: props.sourceWeights, usage: 'storage-read'},
      {buffer: props.slots, usage: 'storage-read'},
      {buffer: props.outputWeights, usage: 'storage-write'}
    ],
    bindings: {
      sourceWeights: props.sourceWeights,
      slots: props.slots,
      outputWeights: props.outputWeights
    },
    dispatchLayout: props.dispatchLayout
  });
}

/** Compiles one bounded storage-buffer kernel without submitting or reading GPU work. */
function addTopologyPass<Parameters>(
  commandGraph: GPUCommandGraph<Parameters>,
  props: TopologyPassProps
): void {
  commandGraph.addComputePass({
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

/** Plans a bounded three-dimensional dispatch for a graph topology pass. @internal */
export function getLuGraphTopologyDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBoundedDispatchLayout {
  return getTopologyDispatchLayout(elementCount, maxComputeWorkgroupsPerDimension);
}

function getTopologyDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    'LuGraphTopology',
    elementCount,
    TOPOLOGY_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}

function getTopologyInvocationIndexSource(layout: GPUBoundedDispatchLayout): string {
  return getBoundedInvocationIndexSource(layout, TOPOLOGY_WORKGROUP_SIZE);
}
