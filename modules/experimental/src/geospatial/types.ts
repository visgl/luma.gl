// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GraphDataView, GraphVectorView} from '../gpu-primitives/gpu-command-graph';

/** Packed two-dimensional f32 positions, either local XY or longitude/latitude values. */
export type GPUFloat32Positions = GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;

/**
 * Packed raw binary64 XY positions in browser `Float64Array` word order.
 *
 * Each `uint32x4` row stores `[xLowWord, xHighWord, yLowWord, yHighWord]`, matching the
 * `Uint32Array` view of an interleaved browser `Float64Array` on little-endian WebGPU platforms.
 */
export type GPUFloat64Positions = GraphDataView<'uint32x4'> | GraphVectorView<'uint32x4'>;

/** Packed local or raw binary64 two-dimensional positions. */
export type GPUGeospatialPositions = GPUFloat32Positions | GPUFloat64Positions;

/** One f32 scalar result per row, preserving source chunk topology. */
export type GPUScalarRows = GraphDataView<'float32'> | GraphVectorView<'float32'>;

/** One `[high, low]` double-single scalar per row, preserving source chunk topology. */
export type GPUPreciseScalarRows = GraphDataView<'float32x2'> | GraphVectorView<'float32x2'>;
