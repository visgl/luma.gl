// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GraphDataView} from '../gpu-core/gpu-command-graph';

/** Exact, fixed-width sample formats supported by graph-native volume analysis. */
export type GPUVolumeScalarFormat = 'float32' | 'uint32' | 'sint32';

/** Borrowed, packed, x-fastest storage-buffer representation of one volume channel. */
export type GPUVolumeBufferChannel<Format extends GPUVolumeScalarFormat = GPUVolumeScalarFormat> =
  Format extends GPUVolumeScalarFormat
    ? {
        /** Unique channel identifier within its volume. */
        id: string;
        /** Exact GPU sample representation, independent of shader value types. */
        format: Format;
        /** One packed value per voxel in x-fastest, then y, then z order. */
        values: GraphDataView<Format>;
        /** Optional source-aligned validity flags: zero rejects a sample. */
        validity?: GraphDataView<'uint32'>;
        /** Raw source-domain nodata value, compared before calibration. */
        noDataValue?: number;
        /** Explicit source-domain calibration multiplier. Defaults to one. */
        scale?: number;
        /** Explicit source-domain calibration offset. Defaults to zero. */
        offset?: number;
      }
    : never;

/** Physical metadata for one dense three-dimensional voxel grid. */
export type GPUVolumeMetadata = {
  width: number;
  height: number;
  depth: number;
  /** Physical x/y/z distance between adjacent samples. */
  spacing: readonly [number, number, number];
  /** Physical position of grid coordinate zero before cell-center adjustment. */
  origin: readonly [number, number, number];
  /** Row-major 3x3 direction matrix applied after spacing. */
  direction: readonly [number, number, number, number, number, number, number, number, number];
  /** Cells address centers with a half-voxel offset; points are already centered. */
  voxelInterpretation: 'cell' | 'point';
};
