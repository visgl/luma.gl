// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import type {GPUCommandGraph, GraphDataView} from '../gpu-core/gpu-command-graph';
import {getSpatialOperationNodes} from '../utils/gpu-spatial-operation';

export type GPUPointCloudRadiusFilterProps = {
  id?: string;
  positions: GraphDataView<'float32x3'>;
  radius: number;
  /** Minimum other points within the inclusive radius. Default 1. */
  minimumNeighbors?: number;
  /** Optional nonzero validity flags; also excludes invalid rows from neighbor searches. */
  validity?: GraphDataView<'uint32'>;
  counts: GraphDataView<'uint32'>;
  mask: GraphDataView<'uint32'>;
};

/** Exact all-pairs radius counts and outlier mask for bounded clouds. O(N²); no hidden truncation. */
export class GPUPointCloudRadiusFilter {
  readonly id: string;
  constructor(readonly props: GPUPointCloudRadiusFilterProps) {
    this.id = props.id ?? 'gpu-pointcloud-radius-filter';
    // Squared distances must have a positive finite float32 threshold.
    assert(
      Math.fround(props.radius) > 0 &&
        Number.isFinite(Math.fround(props.radius * props.radius)) &&
        Math.fround(props.radius * props.radius) > 0
    );
    const minimum = props.minimumNeighbors ?? 1;
    assert(Number.isSafeInteger(minimum) && minimum >= 0 && minimum <= 0xffffffff);
    // Output and validity rows retain original point IDs.
    assert(
      props.counts.length === props.positions.length && props.mask.length === props.positions.length
    );
    assert(!props.validity || props.validity.length === props.positions.length);
  }
  getCommandNodes<Parameters>(graph: GPUCommandGraph<Parameters>) {
    const {positions, validity, counts, mask} = this.props;
    return getSpatialOperationNodes(graph, {
      id: this.id,
      length: positions.length,
      inputs: {positions, ...(validity ? {validity} : {})},
      outputs: {counts, mask},
      body: `let position = readPositions(index);
var count = 0u;
let valid = all(abs(position) <= vec3f(3.402823e38)) ${validity ? '&& readValidity(index) != 0u' : ''};
if (valid) {
  for (var neighbor = 0u; neighbor < ${positions.length}u; neighbor++) {
    if (neighbor == index) { continue; }
    ${validity ? 'if (readValidity(neighbor) == 0u) { continue; }' : ''}
    let delta = readPositions(neighbor) - position;
    if (dot(delta, delta) <= ${Math.fround(this.props.radius * this.props.radius)}) { count++; }
  }
}
writeCounts(index, count);
writeMask(index, select(0u, 1u, valid && count >= ${this.props.minimumNeighbors ?? 1}u));`
    });
  }
}
