// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import type {GPUCommandGraph, GraphDataView} from '../gpu-core/gpu-command-graph';
import {validateChunkViews} from '../gpu-core/gpu-chunk-utils';
import {getSpatialOperationNodes} from '../utils/gpu-spatial-operation';

export type GPUPointCloudVoxelDownsampleProps = {
  id?: string;
  positions: GraphDataView<'float32x3'>;
  origin: readonly [number, number, number];
  voxelSize: number;
  gridSize: readonly [number, number, number];
  /** One source row ID per voxel, or 0xffffffff for an empty voxel. */
  representatives: GraphDataView<'uint32'>;
  /** One population count per voxel. */
  counts: GraphDataView<'uint32'>;
  /** Representative positions in voxel order. Empty voxels contain zero; use counts as validity. */
  output: GraphDataView<'float32x3'>;
};

/** Deterministic minimum-source-ID voxel sampling, O(points + voxels), with explicit bounded grid. */
export class GPUPointCloudVoxelDownsample {
  readonly id: string;
  constructor(readonly props: GPUPointCloudVoxelDownsampleProps) {
    this.id = props.id ?? 'gpu-pointcloud-voxel-downsample';
    const cells = props.gridSize.reduce((product, size) => product * size, 1);
    // Fixed grid capacities must fit uint32 and match all output views.
    assert(props.gridSize.every(size => Number.isSafeInteger(size) && size > 0));
    assert(Number.isSafeInteger(cells) && cells < 0xffffffff);
    assert(
      props.counts.length === cells &&
        props.representatives.length === cells &&
        props.output.length === cells
    );
    // Grid arithmetic uses finite float32 coordinates and a positive representable cell size.
    assert(Number.isFinite(Math.fround(props.voxelSize)) && Math.fround(props.voxelSize) > 0);
    assert(props.origin.every(value => Number.isFinite(Math.fround(value))));
    assert(props.positions.length < 0xffffffff);
  }
  getCommandNodes<Parameters>(graph: GPUCommandGraph<Parameters>) {
    const {positions, representatives, counts, output, gridSize, origin, voxelSize} = this.props;
    validateChunkViews(graph, [positions], [representatives, counts, output]);
    const dimensions = gridSize.map(size => `${size}u`).join(', ');
    const nodes = getSpatialOperationNodes(graph, {
      id: `${this.id}-clear`,
      length: counts.length,
      inputs: {},
      outputs: {representatives, counts},
      atomicOutputs: true,
      body: 'writeRepresentatives(index, 0xffffffffu); writeCounts(index, 0u);'
    });
    nodes.push(
      ...getSpatialOperationNodes(graph, {
        id: `${this.id}-select`,
        length: positions.length,
        inputs: {positions},
        outputs: {representatives, counts},
        atomicOutputs: true,
        body: `let coordinate = (readPositions(index) - vec3f(${origin.map(value => Math.fround(value)).join(', ')})) / ${Math.fround(voxelSize)};
if (!all(coordinate >= vec3f(0.0)) || !all(coordinate < vec3f(vec3u(${dimensions})))) { return; }
let cell = vec3u(floor(coordinate));
let voxel = (cell.z * ${gridSize[1]}u + cell.y) * ${gridSize[0]}u + cell.x;
minRepresentatives(voxel, index); addCounts(voxel, 1u);`
      })
    );
    nodes.push(
      ...getSpatialOperationNodes(graph, {
        id: `${this.id}-gather`,
        length: output.length,
        inputs: {positions, representatives},
        outputs: {output},
        body: `let representative = readRepresentatives(index);
var position = vec3f(0.0);
if (representative < ${positions.length}u) { position = readPositions(representative); }
writeOutput(index, position);`
      })
    );
    return nodes;
  }
}
