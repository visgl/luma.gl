// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expectTypeOf, test} from 'vitest';
import type {GraphDataView} from '../../src/gpu-primitives/gpu-command-graph';
import type {
  GPUHaversineDistanceProps,
  GPUPairwisePointDistanceProps,
  GPUPairwisePointInPolygonProps,
  GPUPairwisePointLinestringNearestProps,
  GPUPairwisePointSegmentDistanceProps
} from '../../src/geospatial';

/** Compile-time coverage for the input/output format correlations of precise planar kernels. */
export function checkGeospatialDistanceTypes(
  float32Positions: GraphDataView<'float32x2'>,
  float64Positions: GraphDataView<'uint32x4'>,
  float32Distances: GraphDataView<'float32'>,
  preciseDistances: GraphDataView<'float32x2'>,
  precisePositions: GraphDataView<'float32x4'>,
  offsets: GraphDataView<'uint32'>,
  classifications: GraphDataView<'uint32'>
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

  ({
    points: float32Positions,
    polygonPositions: float32Positions,
    geometryOffsets: offsets,
    polygonOffsets: offsets,
    ringOffsets: offsets,
    output: classifications
  }) satisfies GPUPairwisePointInPolygonProps;

  ({
    points: float64Positions,
    polygonPositions: float64Positions,
    geometryOffsets: offsets,
    polygonOffsets: offsets,
    ringOffsets: offsets,
    output: classifications
  }) satisfies GPUPairwisePointInPolygonProps;

  // @ts-expect-error point and polygon storage formats must match.
  const invalidMixedPolygonInputs: GPUPairwisePointInPolygonProps = {
    points: float32Positions,
    polygonPositions: float64Positions,
    geometryOffsets: offsets,
    polygonOffsets: offsets,
    ringOffsets: offsets,
    output: classifications
  };

  // @ts-expect-error point-in-polygon classifications require a uint32 output.
  const invalidPolygonOutput: GPUPairwisePointInPolygonProps = {
    points: float32Positions,
    polygonPositions: float32Positions,
    geometryOffsets: offsets,
    polygonOffsets: offsets,
    ringOffsets: offsets,
    output: float32Distances
  };

  ({
    points: float32Positions,
    linestringPositions: float32Positions,
    geometryOffsets: offsets,
    linestringOffsets: offsets,
    output: float32Distances,
    nearestPoints: float32Positions,
    linestringIndices: classifications,
    segmentIndices: classifications
  }) satisfies GPUPairwisePointLinestringNearestProps;

  ({
    points: float64Positions,
    linestringPositions: float64Positions,
    geometryOffsets: offsets,
    linestringOffsets: offsets,
    output: preciseDistances,
    nearestPoints: precisePositions,
    linestringIndices: classifications,
    segmentIndices: classifications
  }) satisfies GPUPairwisePointLinestringNearestProps;

  // @ts-expect-error raw binary64 linestring inputs require double-single distance output.
  const invalidFloat64LinestringOutput: GPUPairwisePointLinestringNearestProps = {
    points: float64Positions,
    linestringPositions: float64Positions,
    geometryOffsets: offsets,
    linestringOffsets: offsets,
    output: float32Distances
  };

  // @ts-expect-error local f32 linestring inputs require float32x2 nearest points.
  const invalidFloat32NearestPointOutput: GPUPairwisePointLinestringNearestProps = {
    points: float32Positions,
    linestringPositions: float32Positions,
    geometryOffsets: offsets,
    linestringOffsets: offsets,
    output: float32Distances,
    nearestPoints: precisePositions
  };

  // @ts-expect-error point and linestring storage formats must match.
  const invalidMixedLinestringInputs: GPUPairwisePointLinestringNearestProps = {
    points: float32Positions,
    linestringPositions: float64Positions,
    geometryOffsets: offsets,
    linestringOffsets: offsets,
    output: float32Distances
  };

  // @ts-expect-error raw binary64 inputs require float32x4 nearest-point rows.
  const invalidFloat64NearestPointOutput: GPUPairwisePointLinestringNearestProps = {
    points: float64Positions,
    linestringPositions: float64Positions,
    geometryOffsets: offsets,
    linestringOffsets: offsets,
    output: preciseDistances,
    nearestPoints: float32Positions
  };

  void [
    invalidFloat32PointOutput,
    invalidFloat64PointOutput,
    invalidMixedPointInputs,
    invalidMixedHaversineInputs,
    invalidFloat64SegmentOutput,
    invalidMixedSegmentInputs,
    invalidMixedPolygonInputs,
    invalidPolygonOutput,
    invalidFloat64LinestringOutput,
    invalidFloat32NearestPointOutput,
    invalidMixedLinestringInputs,
    invalidFloat64NearestPointOutput
  ];
}

test('geospatial distance props preserve their coordinate/output format correlations', () => {
  expectTypeOf(checkGeospatialDistanceTypes).toBeFunction();
});
