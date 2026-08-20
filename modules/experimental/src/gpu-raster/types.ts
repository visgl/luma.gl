// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GraphDataView, GraphTextureView} from '@luma.gl/gpgpu/gpu-core';
import type {GPURaster} from './gpu-raster';

/** Exact, fixed-width sample formats supported by graph-native raster analysis. */
export type GPURasterScalarFormat = 'float32' | 'uint32' | 'sint32';

/** Texture formats that preserve the scalar representation of one raster band. */
export type GPURasterTextureFormat<Format extends GPURasterScalarFormat> = Format extends 'float32'
  ? 'r32float' | 'rgba32float'
  : Format extends 'uint32'
    ? 'r32uint' | 'rgba32uint'
    : 'r32sint' | 'rgba32sint';

type GPURasterBandMetadata<Format extends GPURasterScalarFormat> = {
  /** Unique band identifier within its raster. */
  id: string;
  /** Exact GPU sample representation, independent of shader value types. */
  format: Format;
  /** Optional source-aligned validity flags: zero rejects a sample. */
  validity?: GraphDataView<'uint32'>;
  /** Raw source-domain nodata value, compared before calibration. */
  noDataValue?: number;
  /** Explicit source-domain calibration multiplier. Defaults to one. */
  scale?: number;
  /** Explicit source-domain calibration offset. Defaults to zero. */
  offset?: number;
};

/** Borrowed, packed, row-major storage-buffer representation of one raster band. */
export type GPURasterBufferBand<Format extends GPURasterScalarFormat = GPURasterScalarFormat> =
  Format extends GPURasterScalarFormat
    ? GPURasterBandMetadata<Format> & {
        storage: {kind: 'buffer'; values: GraphDataView<Format>};
      }
    : never;

/** Borrowed, single-mip, single-layer texture representation of one raster band. */
export type GPURasterTextureBand<Format extends GPURasterScalarFormat = GPURasterScalarFormat> =
  Format extends GPURasterScalarFormat
    ? GPURasterBandMetadata<Format> & {
        storage: {
          kind: 'texture';
          view: GraphTextureView<GPURasterTextureFormat<Format>>;
          /** Selected channel. Single-channel textures accept only zero. */
          channel?: 0 | 1 | 2 | 3;
        };
      }
    : never;

/** Exactly one borrowed physical representation; conversion is always explicit. */
export type GPURasterBand<Format extends GPURasterScalarFormat = GPURasterScalarFormat> =
  | GPURasterBufferBand<Format>
  | GPURasterTextureBand<Format>;

/** Opaque coordinate-system identity retained without implicit projection or normalization. */
export type GPURasterCoordinateReferenceSystem = {
  authority?: string;
  wellKnownText?: string;
  projectionJson?: Readonly<Record<string, unknown>>;
};

/** Explicit physical raster grid and optional coordinate-system metadata. */
export type GPURasterMetadata = {
  width: number;
  height: number;
  /** Pixel-to-world matrix: x = a * column + b * row + c, y = d * column + e * row + f. */
  affine: readonly [number, number, number, number, number, number];
  /** Area pixels are addressed at their centers; point pixels already identify their centers. */
  pixelInterpretation: 'area' | 'point';
  coordinateReferenceSystem?: GPURasterCoordinateReferenceSystem;
  /** Explicit overview level, with zero identifying the full-resolution source. */
  level?: number;
  /** Tile origin expressed in level-zero pixel coordinates. */
  levelZeroOrigin?: readonly [number, number];
};

/** One explicitly bounded raster tile and its available neighborhood. */
export type GPURasterTile = {
  key: string;
  level: number;
  column: number;
  row: number;
  corePixelBounds: readonly [number, number, number, number];
  availablePixelBounds: readonly [number, number, number, number];
  halo: number;
  raster: GPURaster;
};
