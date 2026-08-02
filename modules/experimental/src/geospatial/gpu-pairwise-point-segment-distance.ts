// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type GPUCommandGraph,
  type GPUCommandGraphContributor
} from '../gpu-primitives/gpu-command-graph';
import type {
  GPUFloat32Positions,
  GPUFloat64Positions,
  GPUPreciseScalarRows,
  GPUScalarRows
} from './types';
import {
  GEOSPATIAL_WORKGROUP_SIZE,
  POSITION_FORMATS,
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

type GPUPairwisePointSegmentDistanceBaseProps = {id?: string};

export type GPUPairwisePointSegmentDistanceProps = GPUPairwisePointSegmentDistanceBaseProps &
  (
    | {
        points: GPUFloat32Positions;
        segmentStarts: GPUFloat32Positions;
        segmentEnds: GPUFloat32Positions;
        output: GPUScalarRows;
      }
    | {
        points: GPUFloat64Positions;
        segmentStarts: GPUFloat64Positions;
        segmentEnds: GPUFloat64Positions;
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
${precise ? RAW_POINT_WGSL : ''}
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
  let denominator = sum_fp64(mul_fp64(segmentX, segmentX), mul_fp64(segmentY, segmentY));
  let numerator = sum_fp64(mul_fp64(pointX, segmentX), mul_fp64(pointY, segmentY));
  var fraction = vec2f(0.0, 0.0);
  if (sign_fp64(denominator) > 0) {
    fraction = div_fp64(numerator, denominator);
    if (sign_fp64(fraction) < 0) { fraction = vec2f(0.0, 0.0); }
    if (compare_fp64(fraction, vec2f(1.0, 0.0)) > 0) { fraction = vec2f(1.0, 0.0); }
  }
  let deltaX = sub_fp64(pointX, mul_fp64(fraction, segmentX));
  let deltaY = sub_fp64(pointY, mul_fp64(fraction, segmentY));
  outputDistances[OUTPUT_OFFSET + index] = sqrt_fp64(
    sum_fp64(mul_fp64(deltaX, deltaX), mul_fp64(deltaY, deltaY))
  );`;
}
