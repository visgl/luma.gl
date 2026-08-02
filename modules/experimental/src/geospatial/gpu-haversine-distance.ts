// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type GPUCommandGraph,
  type GPUCommandGraphContributor
} from '../gpu-primitives/gpu-command-graph';
import type {GPUFloat32Positions, GPUFloat64Positions, GPUScalarRows} from './types';
import {
  GEOSPATIAL_WORKGROUP_SIZE,
  POSITION_FORMATS,
  RAW_POINT_WGSL,
  addGeospatialPass,
  assertGraphOwnership,
  getFloat32Literal,
  getGeospatialDispatchLayout,
  getGeospatialInvocationIndexSource,
  getPositionReadSource,
  getRowChunks,
  isGraphVectorView,
  validateMatchingRows,
  validateRowView,
  validateSeparateBuffers
} from './geospatial-utils';

type GPUHaversineDistanceBaseProps = {
  id?: string;
  output: GPUScalarRows;
  /** Sphere radius in output units. Defaults to 6371 kilometres. */
  radius?: number;
};

export type GPUHaversineDistanceProps = GPUHaversineDistanceBaseProps &
  (
    | {left: GPUFloat32Positions; right: GPUFloat32Positions}
    | {left: GPUFloat64Positions; right: GPUFloat64Positions}
  );

/**
 * Computes pairwise great-circle distance for longitude/latitude degree rows.
 *
 * Trigonometric operations and the final result remain f32. Raw Float64 inputs preserve each
 * coordinate delta through a correctly rounded raw-binary64 subtraction before f32 trigonometry.
 */
export class GPUHaversineDistance implements GPUCommandGraphContributor {
  readonly id: string;
  readonly left: GPUFloat32Positions | GPUFloat64Positions;
  readonly right: GPUFloat32Positions | GPUFloat64Positions;
  readonly output: GPUScalarRows;
  readonly radius: number;

  constructor(props: GPUHaversineDistanceProps) {
    this.id = props.id ?? 'gpu-haversine-distance';
    this.left = props.left;
    this.right = props.right;
    this.output = props.output;
    this.radius = props.radius ?? 6371;
    validateRowView(this.left, POSITION_FORMATS, `${this.id} left`);
    validateRowView(this.right, POSITION_FORMATS, `${this.id} right`);
    validateRowView(this.output, ['float32'], `${this.id} output`);
    if (this.left.format !== this.right.format) {
      throw new Error(`${this.id} position formats must match`);
    }
    validateMatchingRows(this.left, this.right, `${this.id} position inputs`);
    validateMatchingRows(this.left, this.output, `${this.id} input and output`);
    validateSeparateBuffers(this.output, [this.left, this.right], this.id);
    if (!Number.isFinite(Math.fround(this.radius)) || Math.fround(this.radius) <= 0) {
      throw new Error(`${this.id} radius must be positive and representable as float32`);
    }
  }

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
      const pointSetup = precise
        ? `let leftRawPoint = ${leftSource.read('index')};
  let rightRawPoint = ${rightSource.read('index')};
  let deltaDegrees = vec2f(
    sub_fp64u32_to_f32(rightRawPoint.x, leftRawPoint.x),
    sub_fp64u32_to_f32(rightRawPoint.y, leftRawPoint.y)
  );
  let delta = deltaDegrees * DEGREES_TO_RADIANS;
  let leftPoint = rawPointToF32(leftRawPoint) * DEGREES_TO_RADIANS;
  let rightPoint = rawPointToF32(rightRawPoint) * DEGREES_TO_RADIANS;
  let nonFinite = rawScalarNonFinite(leftRawPoint.x) | rawScalarNonFinite(leftRawPoint.y) |
    rawScalarNonFinite(rightRawPoint.x) | rawScalarNonFinite(rightRawPoint.y) |
    pointNonFinite(leftPoint) | pointNonFinite(rightPoint) | pointNonFinite(delta);`
        : `let leftDegrees = ${leftSource.read('index')};
  let rightDegrees = ${rightSource.read('index')};
  let deltaDegrees = rightDegrees - leftDegrees;
  let delta = deltaDegrees * DEGREES_TO_RADIANS;
  let leftPoint = leftDegrees * DEGREES_TO_RADIANS;
  let rightPoint = rightDegrees * DEGREES_TO_RADIANS;
  let nonFinite = pointNonFinite(leftPoint) | pointNonFinite(rightPoint) |
    pointNonFinite(delta);`;
      const outputOffset = (output.byteOffset % 256) / 4;
      const source = /* wgsl */ `
${precise ? RAW_POINT_WGSL : ''}
const ELEMENT_COUNT: u32 = ${left.length}u;
const OUTPUT_OFFSET: u32 = ${outputOffset}u;
const DEGREES_TO_RADIANS: f32 = ${getFloat32Literal(Math.PI / 180)};
const RADIUS: f32 = ${getFloat32Literal(this.radius)};
const SMALL_ANGLE_THRESHOLD: f32 = 0.0001;
${leftSource.declaration}
${rightSource.declaration}
@group(0) @binding(auto) var<storage, read_write> outputDistances: array<f32>;

fn rawScalarNonFinite(value: vec2u) -> u32 {
  let exponent = (value.x >> 20u) & 0x7ffu;
  return (exponent + 1u) >> 11u;
}

fn scalarNonFinite(value: f32) -> u32 {
  let exponent = (bitcast<u32>(value) >> 23u) & 0xffu;
  return (exponent + 1u) >> 8u;
}

fn pointNonFinite(point: vec2f) -> u32 {
  return scalarNonFinite(point.x) | scalarNonFinite(point.y);
}

@compute @workgroup_size(${GEOSPATIAL_WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroupId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>
) {
  ${getGeospatialInvocationIndexSource(dispatchLayout)}
  if (index >= ELEMENT_COUNT) { return; }
  ${pointSetup}
  var centralAngle: f32;
  if (max(abs(delta.x), abs(delta.y)) < SMALL_ANGLE_THRESHOLD) {
    let midpointLatitude = (leftPoint.y + rightPoint.y) * 0.5;
    centralAngle = length(vec2f(delta.x * cos(midpointLatitude), delta.y));
  } else {
    let halfDeltaSines = sin(delta * 0.5);
    let haversine = halfDeltaSines.y * halfDeltaSines.y +
      cos(leftPoint.y) * cos(rightPoint.y) * halfDeltaSines.x * halfDeltaSines.x;
    let clampedHaversine = clamp(haversine, 0.0, 1.0);
    let nearAngle = 2.0 * asin(sqrt(clampedHaversine));
    let sinDeltaLongitude = sin(delta.x);
    let cosDeltaLongitude = cos(delta.x);
    let sinLeftLatitude = sin(leftPoint.y);
    let cosLeftLatitude = cos(leftPoint.y);
    let sinRightLatitude = sin(rightPoint.y);
    let cosRightLatitude = cos(rightPoint.y);
    let crossX = cosRightLatitude * sinDeltaLongitude;
    let crossY = cosLeftLatitude * sinRightLatitude -
      sinLeftLatitude * cosRightLatitude * cosDeltaLongitude;
    let sphericalDot = sinLeftLatitude * sinRightLatitude +
      cosLeftLatitude * cosRightLatitude * cosDeltaLongitude;
    let farAngle = atan2(length(vec2f(crossX, crossY)), sphericalDot);
    centralAngle = select(nearAngle, farAngle, clampedHaversine > 0.5);
  }
  let distance = RADIUS * centralAngle;
  let nonFiniteMask = 0u - nonFinite;
  let distanceBits = bitcast<u32>(distance);
  outputDistances[OUTPUT_OFFSET + index] = bitcast<f32>(
    (distanceBits & ~nonFiniteMask) | (0x7fc00000u & nonFiniteMask)
  );
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
