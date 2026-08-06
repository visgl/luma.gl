// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Independently implemented for WebGPU; inspired by NVIDIA RAPIDS cuSpatial.

export type {
  GPUFloat32Positions,
  GPUFloat64Positions,
  GPUGeospatialPositions,
  GPUPreciseScalarRows,
  GPUScalarRows
} from './types';

export {GPUSinusoidalProjection} from './gpu-sinusoidal-projection';
export type {GPUSinusoidalProjectionProps} from './gpu-sinusoidal-projection';
export {GPUHaversineDistance} from './gpu-haversine-distance';
export type {GPUHaversineDistanceProps} from './gpu-haversine-distance';
export {GPUPairwisePointDistance} from './gpu-pairwise-point-distance';
export type {GPUPairwisePointDistanceProps} from './gpu-pairwise-point-distance';
export {GPUPairwisePointSegmentDistance} from './gpu-pairwise-point-segment-distance';
export type {GPUPairwisePointSegmentDistanceProps} from './gpu-pairwise-point-segment-distance';
export {
  GPUPairwisePointInPolygon,
  GPU_POINT_IN_POLYGON_CLASSIFICATION
} from './gpu-pairwise-point-in-polygon';
export type {
  GPUPairwisePointInPolygonProps,
  GPUPointInPolygonClassification
} from './gpu-pairwise-point-in-polygon';
export {GPUPairwisePointLinestringNearest} from './gpu-pairwise-point-linestring-nearest';
export type {
  GPUFloat32PairwisePointLinestringNearestProps,
  GPUFloat64PairwisePointLinestringNearestProps,
  GPUPairwisePointLinestringNearestProps
} from './gpu-pairwise-point-linestring-nearest';
export {GPUGridIndex} from '../gpu-primitives/gpu-grid-index';
export type {
  GPUGridIndexBounds,
  GPUGridIndexPositions,
  GPUGridIndexProps,
  GPUGridIndexSize,
  GPUGridIndexSourceIds
} from '../gpu-primitives/gpu-grid-index';
export type {GPUSpatialQueryOutput} from './gpu-spatial-query-types';
export {GPUPointSpatialQuery} from './gpu-point-spatial-query';
export type {
  GPUGridIndexView,
  GPUPointSpatialQueryKind,
  GPUPointSpatialQueryPolygon,
  GPUPointSpatialQueryProps
} from './gpu-point-spatial-query';
