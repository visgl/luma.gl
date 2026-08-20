// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuSpatial.

import {type GPUCommandGraph, type GPUCommandGraphContributor} from '@luma.gl/gpgpu/gpu-core';
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

type GPUPairwisePointSegmentDistanceBaseProps = {
  /** Prefix for generated graph-node IDs. */
  id?: string;
};

/** Properties for point-to-segment distance over aligned rows. */
export type GPUPairwisePointSegmentDistanceProps = GPUPairwisePointSegmentDistanceBaseProps &
  (
    | {
        /** Local f32 point rows. */
        points: GPUFloat32Positions;
        /** Local f32 segment-start rows. */
        segmentStarts: GPUFloat32Positions;
        /** Local f32 segment-end rows. */
        segmentEnds: GPUFloat32Positions;
        /** Caller-owned f32 distance rows. */
        output: GPUScalarRows;
      }
    | {
        /** Raw binary64 point rows. */
        points: GPUFloat64Positions;
        /** Raw binary64 segment-start rows. */
        segmentStarts: GPUFloat64Positions;
        /** Raw binary64 segment-end rows. */
        segmentEnds: GPUFloat64Positions;
        /** Caller-owned `[high, low]` double-single distance rows. */
        output: GPUPreciseScalarRows;
      }
  );

/** Computes the distance from each point row to its paired closed line segment. */
export class GPUPairwisePointSegmentDistance implements GPUCommandGraphContributor {
  readonly id: string;
  readonly points: GPUFloat32Positions | GPUFloat64Positions;
  readonly segmentStarts: GPUFloat32Positions | GPUFloat64Positions;
  readonly segmentEnds: GPUFloat32Positions | GPUFloat64Positions;
  readonly output: GPUScalarRows | GPUPreciseScalarRows;

  /** Creates a distance contributor without compiling or submitting GPU work. */
  constructor(props: GPUPairwisePointSegmentDistanceProps) {
    this.id = props.id ?? 'gpu-pairwise-point-segment-distance';
    this.points = props.points;
    this.segmentStarts = props.segmentStarts;
    this.segmentEnds = props.segmentEnds;
    this.output = props.output;
    for (const [name, positions] of [
      ['points', this.points],
      ['segmentStarts', this.segmentStarts],
      ['segmentEnds', this.segmentEnds]
    ] as const) {
      validateRowView(positions, POSITION_FORMATS, `${this.id} ${name}`);
      if (positions.format !== this.points.format) {
        throw new Error(`${this.id} position formats must match`);
      }
      validateMatchingRows(this.points, positions, `${this.id} ${name}`);
    }
    const outputFormat = this.points.format === 'uint32x4' ? 'float32x2' : 'float32';
    validateRowView(this.output, [outputFormat], `${this.id} output`);
    validateMatchingRows(this.points, this.output, `${this.id} input and output`);
    validateSeparateBuffers(
      this.output,
      [this.points, this.segmentStarts, this.segmentEnds],
      this.id
    );
  }

  /** Adds one distance node per non-empty input chunk to the target graph. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    assertGraphOwnership(
      graph,
      [this.points, this.segmentStarts, this.segmentEnds, this.output],
      this.id
    );
    const pointChunks = getRowChunks(this.points);
    const startChunks = getRowChunks(this.segmentStarts);
    const endChunks = getRowChunks(this.segmentEnds);
    const outputChunks = getRowChunks(this.output);
    for (let chunkIndex = 0; chunkIndex < pointChunks.length; chunkIndex++) {
      const points = pointChunks[chunkIndex];
      const starts = startChunks[chunkIndex];
      const ends = endChunks[chunkIndex];
      const output = outputChunks[chunkIndex];
      if (points.length === 0) continue;
      const pointSource = getPositionReadSource('points', points);
      const startSource = getPositionReadSource('segmentStarts', starts);
      const endSource = getPositionReadSource('segmentEnds', ends);
      const precise = pointSource.precise;
      const dispatchLayout = getGeospatialDispatchLayout(
        points.length,
        graph.device.limits.maxComputeWorkgroupsPerDimension
      );
      const outputOffset = (output.byteOffset % 256) / 4 / (precise ? 2 : 1);
      const expression = precise
        ? getPreciseDistanceExpression(pointSource, startSource, endSource)
        : getFloat32DistanceExpression(pointSource, startSource, endSource);
      const source = /* wgsl */ `
${precise ? `${RAW_POINT_WGSL}\n${PRECISE_DISTANCE_WGSL}` : ''}
const ELEMENT_COUNT: u32 = ${points.length}u;
const OUTPUT_OFFSET: u32 = ${outputOffset}u;
${pointSource.declaration}
${startSource.declaration}
${endSource.declaration}
@group(0) @binding(auto) var<storage, read_write> outputDistances: array<${precise ? 'vec2f' : 'f32'}>;

@compute @workgroup_size(${GEOSPATIAL_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  ${getGeospatialInvocationIndexSource(dispatchLayout)}
  if (index >= ELEMENT_COUNT) { return; }
  ${expression}
}`;
      addGeospatialPass(graph, {
        id: isGraphVectorView(this.points) ? `${this.id}-chunk-${chunkIndex}` : this.id,
        source,
        resources: [
          {buffer: points, usage: 'storage-read'},
          {buffer: starts, usage: 'storage-read'},
          {buffer: ends, usage: 'storage-read'},
          {buffer: output, usage: 'storage-write'}
        ],
        bindings: {
          points,
          segmentStarts: starts,
          segmentEnds: ends,
          outputDistances: output
        },
        dispatchLayout,
        precise
      });
    }
  }
}

function getFloat32DistanceExpression(
  pointSource: ReturnType<typeof getPositionReadSource>,
  startSource: ReturnType<typeof getPositionReadSource>,
  endSource: ReturnType<typeof getPositionReadSource>
): string {
  return `let point = ${pointSource.read('index')};
  let start = ${startSource.read('index')};
  let end = ${endSource.read('index')};
  let segment = end - start;
  let denominator = dot(segment, segment);
  let fraction = select(
    clamp(dot(point - start, segment) / denominator, 0.0, 1.0),
    0.0,
    denominator == 0.0
  );
  outputDistances[OUTPUT_OFFSET + index] = length(point - (start + fraction * segment));`;
}

function getPreciseDistanceExpression(
  pointSource: ReturnType<typeof getPositionReadSource>,
  startSource: ReturnType<typeof getPositionReadSource>,
  endSource: ReturnType<typeof getPositionReadSource>
): string {
  return `let point = ${pointSource.read('index')};
  let start = ${startSource.read('index')};
  let end = ${endSource.read('index')};
  let segmentX = sub_fp64u32_to_fp64(end.x, start.x);
  let segmentY = sub_fp64u32_to_fp64(end.y, start.y);
  let pointX = sub_fp64u32_to_fp64(point.x, start.x);
  let pointY = sub_fp64u32_to_fp64(point.y, start.y);
  let pointFromEndX = sub_fp64u32_to_fp64(point.x, end.x);
  let pointFromEndY = sub_fp64u32_to_fp64(point.y, end.y);
  var distance = geospatial_nan_fp64(pointX.x);
  if (
    is_finite_fp64(segmentX) && is_finite_fp64(segmentY) &&
    is_finite_fp64(pointX) && is_finite_fp64(pointY) &&
    is_finite_fp64(pointFromEndX) && is_finite_fp64(pointFromEndY)
  ) {
    let segmentScale = geospatial_max_abs_fp64(segmentX, segmentY);
    let pointScale = geospatial_max_abs_fp64(pointX, pointY);
    let pointFromEndScale = geospatial_max_abs_fp64(pointFromEndX, pointFromEndY);
    if (segmentScale == 0.0) {
      distance = geospatial_hypot_fp64(pointX, pointY);
    } else if (pointScale == 0.0 || pointFromEndScale == 0.0) {
      distance = vec2f(0.0, 0.0);
    } else {
      let normalizedSegmentX = geospatial_div_fp64_f32(segmentX, segmentScale);
      let normalizedSegmentY = geospatial_div_fp64_f32(segmentY, segmentScale);
      let normalizedPointX = geospatial_div_fp64_f32(pointX, pointScale);
      let normalizedPointY = geospatial_div_fp64_f32(pointY, pointScale);
      let normalizedPointFromEndX = geospatial_div_fp64_f32(
        pointFromEndX, pointFromEndScale
      );
      let normalizedPointFromEndY = geospatial_div_fp64_f32(
        pointFromEndY, pointFromEndScale
      );
      let startProjection = sum_fp64(
        mul_fp64(normalizedPointX, normalizedSegmentX),
        mul_fp64(normalizedPointY, normalizedSegmentY)
      );
      let endProjection = sum_fp64(
        mul_fp64(normalizedPointFromEndX, normalizedSegmentX),
        mul_fp64(normalizedPointFromEndY, normalizedSegmentY)
      );
      if (sign_fp64(startProjection) <= 0) {
        distance = geospatial_hypot_fp64(pointX, pointY);
      } else if (sign_fp64(endProjection) >= 0) {
        distance = geospatial_hypot_fp64(pointFromEndX, pointFromEndY);
      } else {
        let normalizedCrossProduct = sub_fp64(
          mul_fp64(normalizedSegmentX, normalizedPointY),
          mul_fp64(normalizedSegmentY, normalizedPointX)
        );
        let normalizedSegmentLength = sqrt_fp64(
          sum_fp64(
            mul_fp64(normalizedSegmentX, normalizedSegmentX),
            mul_fp64(normalizedSegmentY, normalizedSegmentY)
          )
        );
        let normalizedDistance = div_fp64(
          geospatial_abs_fp64(normalizedCrossProduct),
          normalizedSegmentLength
        );
        distance = geospatial_mul_fp64_f32(normalizedDistance, pointScale);
      }
    }
  }
  outputDistances[OUTPUT_OFFSET + index] = distance;`;
}
