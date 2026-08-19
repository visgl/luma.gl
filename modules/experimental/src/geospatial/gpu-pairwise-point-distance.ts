// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuSpatial.

import {type GPUCommandGraph, type GPUCommandGraphContributor} from '../gpu-core/gpu-command-graph';
import type {
  GPUFloat32Positions,
  GPUFloat64Positions,
  GPUPreciseScalarRows,
  GPUScalarRows
} from './types';
import {
  GEOSPATIAL_WORKGROUP_SIZE,
  POSITION_FORMATS,
  PRECISE_DISTANCE_WGSL,
  RAW_POINT_WGSL,
  addGeospatialPass,
  assertGraphOwnership,
  getGeospatialDispatchLayout,
  getGeospatialInvocationIndexSource,
  getPositionReadSource,
  getRowChunks,
  isGraphVectorView,
  validateMatchingRows,
  validateRowView,
  validateSeparateBuffers
} from './geospatial-utils';

type GPUPairwisePointDistanceBaseProps = {
  /** Prefix for generated graph-node IDs. */
  id?: string;
};

/** Properties for Euclidean distance over aligned point rows. */
export type GPUPairwisePointDistanceProps = GPUPairwisePointDistanceBaseProps &
  (
    | {
        /** First local f32 point rows. */
        left: GPUFloat32Positions;
        /** Second local f32 point rows. */
        right: GPUFloat32Positions;
        /** Caller-owned f32 distance rows. */
        output: GPUScalarRows;
      }
    | {
        /** First raw binary64 point rows. */
        left: GPUFloat64Positions;
        /** Second raw binary64 point rows. */
        right: GPUFloat64Positions;
        /** Caller-owned `[high, low]` double-single distance rows. */
        output: GPUPreciseScalarRows;
      }
  );

/** Computes pairwise Euclidean point distance without first subtracting on the CPU. */
export class GPUPairwisePointDistance implements GPUCommandGraphContributor {
  readonly id: string;
  readonly left: GPUFloat32Positions | GPUFloat64Positions;
  readonly right: GPUFloat32Positions | GPUFloat64Positions;
  readonly output: GPUScalarRows | GPUPreciseScalarRows;

  /** Creates a distance contributor without compiling or submitting GPU work. */
  constructor(props: GPUPairwisePointDistanceProps) {
    this.id = props.id ?? 'gpu-pairwise-point-distance';
    this.left = props.left;
    this.right = props.right;
    this.output = props.output;
    validateRowView(this.left, POSITION_FORMATS, `${this.id} left`);
    validateRowView(this.right, POSITION_FORMATS, `${this.id} right`);
    const outputFormat = this.left.format === 'uint32x4' ? 'float32x2' : 'float32';
    validateRowView(this.output, [outputFormat], `${this.id} output`);
    if (this.left.format !== this.right.format) {
      throw new Error(`${this.id} position formats must match`);
    }
    validateMatchingRows(this.left, this.right, `${this.id} position inputs`);
    validateMatchingRows(this.left, this.output, `${this.id} input and output`);
    validateSeparateBuffers(this.output, [this.left, this.right], this.id);
  }

  /** Adds one distance node per non-empty input chunk to the target graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    assertGraphOwnership(graph, [this.left, this.right, this.output], this.id);
    const leftChunks = getRowChunks(this.left);
    const rightChunks = getRowChunks(this.right);
    const outputChunks = getRowChunks(this.output);
    for (let chunkIndex = 0; chunkIndex < leftChunks.length; chunkIndex++) {
      const left = leftChunks[chunkIndex];
      const right = rightChunks[chunkIndex];
      const output = outputChunks[chunkIndex];
      if (left.length === 0) continue;
      const leftSource = getPositionReadSource('leftPositions', left);
      const rightSource = getPositionReadSource('rightPositions', right);
      const precise = leftSource.precise;
      const dispatchLayout = getGeospatialDispatchLayout(
        left.length,
        graph.device.limits.maxComputeWorkgroupsPerDimension
      );
      const outputOffset = (output.byteOffset % 256) / 4 / (precise ? 2 : 1);
      const distanceExpression = precise
        ? `let leftPoint = ${leftSource.read('index')};
  let rightPoint = ${rightSource.read('index')};
  let deltaX = sub_fp64u32_to_fp64(leftPoint.x, rightPoint.x);
  let deltaY = sub_fp64u32_to_fp64(leftPoint.y, rightPoint.y);
  outputDistances[OUTPUT_OFFSET + index] = geospatial_hypot_fp64(deltaX, deltaY);`
        : `let delta = ${leftSource.read('index')} - ${rightSource.read('index')};
  outputDistances[OUTPUT_OFFSET + index] = length(delta);`;
      const source = /* wgsl */ `
${precise ? `${RAW_POINT_WGSL}\n${PRECISE_DISTANCE_WGSL}` : ''}
const ELEMENT_COUNT: u32 = ${left.length}u;
const OUTPUT_OFFSET: u32 = ${outputOffset}u;
${leftSource.declaration}
${rightSource.declaration}
@group(0) @binding(auto) var<storage, read_write> outputDistances: array<${precise ? 'vec2f' : 'f32'}>;

@compute @workgroup_size(${GEOSPATIAL_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  ${getGeospatialInvocationIndexSource(dispatchLayout)}
  if (index >= ELEMENT_COUNT) { return; }
  ${distanceExpression}
}`;
      addGeospatialPass(graph, {
        id: isGraphVectorView(this.left) ? `${this.id}-chunk-${chunkIndex}` : this.id,
        source,
        resources: [
          {buffer: left, usage: 'storage-read'},
          {buffer: right, usage: 'storage-read'},
          {buffer: output, usage: 'storage-write'}
        ],
        bindings: {leftPositions: left, rightPositions: right, outputDistances: output},
        dispatchLayout,
        precise
      });
    }
  }
}
