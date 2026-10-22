// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import type {GPUCommandGraph, GraphDataView} from '../gpu-core/gpu-command-graph';
import {getSpatialOperationNodes} from '../utils/gpu-spatial-operation';

export type GPUMeshSmoothingProps = {
  id?: string;
  positions: GraphDataView<'float32x3'>;
  /** CSR vertex-neighbor adjacency with a terminal sentinel. Neighbor IDs should be unique per row. */
  offsets: GraphDataView<'uint32'>;
  neighbors: GraphDataView<'uint32'>;
  output: GraphDataView<'float32x3'>;
  /** Interpolation toward the neighbor mean, in [0, 1]. Default 0.5. */
  factor?: number;
  /** Optional nonzero flags preserve boundary or constrained vertices. */
  pinned?: GraphDataView<'uint32'>;
};

/** One Jacobi Laplacian smoothing iteration. Compose ping-pong buffers for multiple iterations. */
export class GPUMeshSmoothing {
  readonly id: string;
  constructor(readonly props: GPUMeshSmoothingProps) {
    this.id = props.id ?? 'gpu-mesh-smoothing';
    // Outputs and optional pin flags preserve vertex identity; CSR has a sentinel.
    assert(
      props.output.length === props.positions.length &&
        props.offsets.length === props.positions.length + 1
    );
    assert(!props.pinned || props.pinned.length === props.positions.length);
    const factor = props.factor ?? 0.5;
    // Convex interpolation only; extrapolation is not a stable smoothing policy.
    assert(Number.isFinite(factor) && factor >= 0 && factor <= 1);
  }
  getCommandNodes<Parameters>(graph: GPUCommandGraph<Parameters>) {
    const {positions, offsets, neighbors, output, pinned} = this.props;
    return getSpatialOperationNodes(graph, {
      id: this.id,
      length: positions.length,
      inputs: {positions, offsets, neighbors, ...(pinned ? {pinned} : {})},
      outputs: {output},
      body: `let position = readPositions(index);
${pinned ? 'if (readPinned(index) != 0u) { writeOutput(index, position); return; }' : ''}
var total = vec3f(0.0);
var count = 0u;
let end = min(readOffsets(index + 1u), ${neighbors.length}u);
for (var entry = readOffsets(index); entry < end; entry++) {
  let neighbor = readNeighbors(entry);
  if (neighbor < ${positions.length}u && neighbor != index) { total += readPositions(neighbor); count++; }
}
var result = position;
if (count > 0u) { result = mix(position, total / f32(count), ${Math.fround(this.props.factor ?? 0.5)}); }
writeOutput(index, result);`
    });
  }
}
