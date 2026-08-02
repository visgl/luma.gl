// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GraphDataView} from '../../src/gpu-primitives/gpu-command-graph';
import type {GPUHaversineDistanceProps} from '../../src/geospatial/gpu-haversine-distance';
import type {GPUPairwisePointDistanceProps} from '../../src/geospatial/gpu-pairwise-point-distance';
import type {GPUPairwisePointSegmentDistanceProps} from '../../src/geospatial/gpu-pairwise-point-segment-distance';

/** Compile-time coverage for the input/output format correlations of precise planar kernels. */
export function checkGeospatialDistanceTypes(
  float32Positions: GraphDataView<'float32x2'>,
  float64Positions: GraphDataView<'uint32x4'>,
  float32Distances: GraphDataView<'float32'>,
  preciseDistances: GraphDataView<'float32x2'>
): void {
  ({
    left: float32Positions,
    right: float32Positions,
    output: float32Distances
  }) satisfies GPUPairwisePointDistanceProps;

  ({
    left: float32Positions,
    right: float32Positions,
    output: float32Distances
  }) satisfies GPUHaversineDistanceProps;

  ({
    left: float64Positions,
    right: float64Positions,
    output: float32Distances
  }) satisfies GPUHaversineDistanceProps;

  // @ts-expect-error haversine inputs must use the same coordinate format.
  const invalidMixedHaversineInputs: GPUHaversineDistanceProps = {
    left: float32Positions,
    right: float64Positions,
    output: float32Distances
  };

  ({
    left: float64Positions,
    right: float64Positions,
    output: preciseDistances
  }) satisfies GPUPairwisePointDistanceProps;

  // @ts-expect-error f32 point inputs require an f32 scalar output.
  const invalidFloat32PointOutput: GPUPairwisePointDistanceProps = {
    left: float32Positions,
    right: float32Positions,
    output: preciseDistances
  };

  // @ts-expect-error raw binary64 point inputs require a double-single output.
  const invalidFloat64PointOutput: GPUPairwisePointDistanceProps = {
    left: float64Positions,
    right: float64Positions,
    output: float32Distances
  };

  // @ts-expect-error pairwise point inputs must use the same coordinate format.
  const invalidMixedPointInputs: GPUPairwisePointDistanceProps = {
    left: float32Positions,
    right: float64Positions,
    output: float32Distances
  };

  ({
    points: float32Positions,
    segmentStarts: float32Positions,
    segmentEnds: float32Positions,
    output: float32Distances
  }) satisfies GPUPairwisePointSegmentDistanceProps;

  ({
    points: float64Positions,
    segmentStarts: float64Positions,
    segmentEnds: float64Positions,
    output: preciseDistances
  }) satisfies GPUPairwisePointSegmentDistanceProps;

  // @ts-expect-error raw binary64 segment inputs require a double-single output.
  const invalidFloat64SegmentOutput: GPUPairwisePointSegmentDistanceProps = {
    points: float64Positions,
    segmentStarts: float64Positions,
    segmentEnds: float64Positions,
    output: float32Distances
  };

  // @ts-expect-error every point and segment input must use the same coordinate format.
  const invalidMixedSegmentInputs: GPUPairwisePointSegmentDistanceProps = {
    points: float32Positions,
    segmentStarts: float64Positions,
    segmentEnds: float32Positions,
    output: float32Distances
  };

  void [
    invalidFloat32PointOutput,
    invalidFloat64PointOutput,
    invalidMixedPointInputs,
    invalidMixedHaversineInputs,
    invalidFloat64SegmentOutput,
    invalidMixedSegmentInputs
  ];
}
