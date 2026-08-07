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
import {getViewBinding, getViewElementOffset} from '../gpu-primitives/graph-data-view-utils';
import type {LuGraphLocalClusteringCoefficient} from './lu-graph-local-clustering-coefficient';

const LOCAL_CLUSTERING_WORKGROUP_SIZE = 256;
const INVALID_TRIANGLE_COUNT = 0xffffffff;

type ImportedLocalClustering = {
  id: string;
  vertexCount: number;
  directed: boolean;
  forwardOffsets: GraphDataView<'uint32'>;
  forwardNeighbors: GraphDataView<'uint32'>;
  forwardOverflow: GraphDataView<'uint32'>;
  reverseOffsets?: GraphDataView<'uint32'>;
  reverseNeighbors?: GraphDataView<'uint32'>;
  reverseOverflow?: GraphDataView<'uint32'>;
  output: GraphDataView<'float32'>;
  triangles?: GraphDataView<'uint32'>;
};

type LocalClusteringBinding = {
  view: GraphDataView<'uint32'> | GraphDataView<'float32'>;
  usage: GraphBufferUse['usage'];
};

/** Declares exact Graphalytics clustering across existing unordered weak neighborhoods. @internal */
export function addLuGraphLocalClusteringCoefficientToGraphWithDispatchLimit<Parameters>(
  clustering: LuGraphLocalClusteringCoefficient,
  commandGraph: GPUCommandGraph<Parameters>,
  maxComputeWorkgroupsPerDimension: number
): void {
  const vertexCount = clustering.topology.graph.vertexCount;
  if (vertexCount === 0) return;

  const reverse = clustering.topology.graph.directed ? clustering.topology.reverse : undefined;
  const state: ImportedLocalClustering = {
    id: clustering.id,
    vertexCount,
    directed: clustering.topology.graph.directed,
    forwardOffsets: commandGraph.importGPUVector(
      `${clustering.id}-forward-offsets`,
      clustering.topology.forward.offsets
    ).data[0],
    forwardNeighbors: commandGraph.importGPUVector(
      `${clustering.id}-forward-neighbors`,
      clustering.topology.forward.neighbors
    ).data[0],
    forwardOverflow: commandGraph.importGPUVector(
      `${clustering.id}-forward-overflow`,
      clustering.topology.forward.overflow
    ).data[0],
    ...(reverse
      ? {
          reverseOffsets: commandGraph.importGPUVector(
            `${clustering.id}-reverse-offsets`,
            reverse.offsets
          ).data[0],
          reverseNeighbors: commandGraph.importGPUVector(
            `${clustering.id}-reverse-neighbors`,
            reverse.neighbors
          ).data[0],
          reverseOverflow: commandGraph.importGPUVector(
            `${clustering.id}-reverse-overflow`,
            reverse.overflow
          ).data[0]
        }
      : {}),
    output: commandGraph.importGPUVector(`${clustering.id}-output`, clustering.output).data[0],
    ...(clustering.triangles
      ? {
          triangles: commandGraph.importGPUVector(
            `${clustering.id}-triangles`,
            clustering.triangles
          ).data[0]
        }
      : {})
  };

  const bindings: Record<string, LocalClusteringBinding> = {
    forwardOffsets: {view: state.forwardOffsets, usage: 'storage-read'},
    forwardNeighbors: {view: state.forwardNeighbors, usage: 'storage-read'},
    forwardOverflow: {view: state.forwardOverflow, usage: 'storage-read'},
    ...(state.reverseOffsets && state.reverseNeighbors && state.reverseOverflow
      ? {
          reverseOffsets: {view: state.reverseOffsets, usage: 'storage-read'},
          reverseNeighbors: {view: state.reverseNeighbors, usage: 'storage-read'},
          reverseOverflow: {view: state.reverseOverflow, usage: 'storage-read'}
        }
      : {}),
    output: {view: state.output, usage: 'storage-write'},
    ...(state.triangles ? {triangles: {view: state.triangles, usage: 'storage-write'}} : {})
  };
  const dispatchLayout = getLuGraphLocalClusteringCoefficientDispatchLayout(
    vertexCount,
    maxComputeWorkgroupsPerDimension
  );
  const source = getLocalClusteringSource(state, bindings, dispatchLayout);

  commandGraph.addComputePass({
    id: `${state.id}-calculate`,
    resources: Object.values(bindings).map(({view, usage}) => ({buffer: view, usage})),
    compile: ({device}) => {
      const computation = new Computation(device, {
        id: `${state.id}-calculate`,
        source,
        shaderLayout: {
          bindings: Object.keys(bindings).map((name, location) => ({
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
          for (const [name, binding] of Object.entries(bindings)) {
            shaderBindings[name] = getViewBinding(binding.view, getBuffer);
          }
          computation.setBindings(shaderBindings);
          computation.dispatch(computePass, dispatchLayout.x, dispatchLayout.y, dispatchLayout.z);
        },
        destroy: () => computation.destroy()
      };
    }
  });
}

/** Generates one bounded pass using at most eight baseline WebGPU storage-buffer bindings. */
function getLocalClusteringSource(
  state: ImportedLocalClustering,
  bindings: Record<string, LocalClusteringBinding>,
  dispatchLayout: GPUBoundedDispatchLayout
): string {
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
  const reverseFirstSlot = hasReverse
    ? `if (direction == 1u) {
    return min(reverseOffsets[REVERSE_OFFSETS_OFFSET + vertex], REVERSE_CAPACITY);
  }`
    : '';
  const reverseLastSlot = hasReverse
    ? `if (direction == 1u) {
    return min(reverseOffsets[REVERSE_OFFSETS_OFFSET + vertex + 1u], REVERSE_CAPACITY);
  }`
    : '';
  const reverseNeighbor = hasReverse
    ? `if (direction == 1u) {
    return reverseNeighbors[REVERSE_NEIGHBORS_OFFSET + slot];
  }`
    : '';
  const scanEarlierReverse = hasReverse
    ? `if (direction == 1u) {
    let reverseFirst = min(reverseOffsets[REVERSE_OFFSETS_OFFSET + vertex], REVERSE_CAPACITY);
    for (var previous = reverseFirst; previous < slot; previous++) {
      if (reverseNeighbors[REVERSE_NEIGHBORS_OFFSET + previous] == candidate) { return false; }
    }
  }`
    : '';
  const triangleOffset = state.triangles
    ? `const TRIANGLES_OFFSET: u32 = ${getViewElementOffset(state.triangles)}u;`
    : '';
  const publishInvalidTriangles = state.triangles
    ? `triangles[TRIANGLES_OFFSET + index] = ${INVALID_TRIANGLE_COUNT}u;`
    : '';
  const publishTriangles = state.triangles
    ? `triangles[TRIANGLES_OFFSET + index] = ${state.directed ? 'closureCount' : 'closureCount / 2u'};`
    : '';
  const declarations = Object.entries(bindings)
    .map(([name, binding], location) => {
      const access = binding.usage === 'storage-read' ? 'read' : 'read_write';
      const element = binding.view.format === 'float32' ? 'f32' : 'u32';
      return `@group(0) @binding(${location}) var<storage, ${access}> ${name}: array<${element}>;`;
    })
    .join('\n');

  return /* wgsl */ `
const VERTEX_COUNT: u32 = ${state.vertexCount}u;
const FORWARD_CAPACITY: u32 = ${state.forwardNeighbors.length}u;
const FORWARD_OFFSETS_OFFSET: u32 = ${getViewElementOffset(state.forwardOffsets)}u;
const FORWARD_NEIGHBORS_OFFSET: u32 = ${getViewElementOffset(state.forwardNeighbors)}u;
const FORWARD_OVERFLOW_OFFSET: u32 = ${getViewElementOffset(state.forwardOverflow)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(state.output)}u;
const NEIGHBOR_DIRECTION_COUNT: u32 = ${hasReverse ? 2 : 1}u;
${reverseConstants}
${triangleOffset}
${declarations}

fn getFirstNeighborSlot(vertex: u32, direction: u32) -> u32 {
  ${reverseFirstSlot}
  return min(forwardOffsets[FORWARD_OFFSETS_OFFSET + vertex], FORWARD_CAPACITY);
}

fn getLastNeighborSlot(vertex: u32, direction: u32) -> u32 {
  ${reverseLastSlot}
  return min(forwardOffsets[FORWARD_OFFSETS_OFFSET + vertex + 1u], FORWARD_CAPACITY);
}

fn getNeighbor(direction: u32, slot: u32) -> u32 {
  ${reverseNeighbor}
  return forwardNeighbors[FORWARD_NEIGHBORS_OFFSET + slot];
}

fn isFirstDistinctNeighbor(vertex: u32, direction: u32, slot: u32, candidate: u32) -> bool {
  if (candidate >= VERTEX_COUNT || candidate == vertex) { return false; }

  let forwardFirst = min(forwardOffsets[FORWARD_OFFSETS_OFFSET + vertex], FORWARD_CAPACITY);
  let forwardEnd = select(slot, min(forwardOffsets[FORWARD_OFFSETS_OFFSET + vertex + 1u], FORWARD_CAPACITY), direction != 0u);
  for (var previous = forwardFirst; previous < forwardEnd; previous++) {
    if (forwardNeighbors[FORWARD_NEIGHBORS_OFFSET + previous] == candidate) { return false; }
  }
  ${scanEarlierReverse}
  return true;
}

fn containsForwardEdge(sourceVertex: u32, targetVertex: u32) -> bool {
  let first = min(forwardOffsets[FORWARD_OFFSETS_OFFSET + sourceVertex], FORWARD_CAPACITY);
  let last = min(forwardOffsets[FORWARD_OFFSETS_OFFSET + sourceVertex + 1u], FORWARD_CAPACITY);
  for (var slot = first; slot < last; slot++) {
    if (forwardNeighbors[FORWARD_NEIGHBORS_OFFSET + slot] == targetVertex) { return true; }
  }
  return false;
}

@compute @workgroup_size(${LOCAL_CLUSTERING_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_index) localInvocationIndex: u32
) {
  ${getBoundedInvocationIndexSource(dispatchLayout, LOCAL_CLUSTERING_WORKGROUP_SIZE)}
  if (index >= VERTEX_COUNT) { return; }
  if (forwardOverflow[FORWARD_OVERFLOW_OFFSET] != 0u${reverseOverflow}) {
    output[OUTPUT_OFFSET + index] = 0.0;
    ${publishInvalidTriangles}
    return;
  }

  var degree = 0u;
  var closureCount = 0u;
  for (var firstDirection = 0u; firstDirection < NEIGHBOR_DIRECTION_COUNT; firstDirection++) {
    let firstStart = getFirstNeighborSlot(index, firstDirection);
    let firstEnd = getLastNeighborSlot(index, firstDirection);
    for (var firstSlot = firstStart; firstSlot < firstEnd; firstSlot++) {
      let firstNeighbor = getNeighbor(firstDirection, firstSlot);
      if (!isFirstDistinctNeighbor(index, firstDirection, firstSlot, firstNeighbor)) { continue; }
      degree++;

      for (var secondDirection = 0u; secondDirection < NEIGHBOR_DIRECTION_COUNT; secondDirection++) {
        let secondStart = getFirstNeighborSlot(index, secondDirection);
        let secondEnd = getLastNeighborSlot(index, secondDirection);
        for (var secondSlot = secondStart; secondSlot < secondEnd; secondSlot++) {
          let secondNeighbor = getNeighbor(secondDirection, secondSlot);
          if (firstNeighbor >= secondNeighbor ||
              !isFirstDistinctNeighbor(index, secondDirection, secondSlot, secondNeighbor)) {
            continue;
          }

          let forwardClosure = select(0u, 1u, containsForwardEdge(firstNeighbor, secondNeighbor));
          let reverseClosure = select(0u, 1u, containsForwardEdge(secondNeighbor, firstNeighbor));
          let increment = forwardClosure + reverseClosure;
          if (closureCount >= ${INVALID_TRIANGLE_COUNT}u - increment) {
            output[OUTPUT_OFFSET + index] = 0.0;
            ${publishInvalidTriangles}
            return;
          }
          closureCount += increment;
        }
      }
    }
  }

  output[OUTPUT_OFFSET + index] = select(
    0.0,
    f32(closureCount) / (f32(degree) * f32(degree - 1u)),
    degree >= 2u
  );
  ${publishTriangles}
}`;
}

/** Plans bounded true three-dimensional vertex-clustering dispatch. @internal */
export function getLuGraphLocalClusteringCoefficientDispatchLayout(
  elementCount: number,
  maxComputeWorkgroupsPerDimension: number
): GPUBoundedDispatchLayout {
  return getBoundedDispatchLayout(
    'LuGraphLocalClusteringCoefficient',
    elementCount,
    LOCAL_CLUSTERING_WORKGROUP_SIZE,
    maxComputeWorkgroupsPerDimension
  );
}
