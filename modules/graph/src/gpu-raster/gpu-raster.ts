// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPURasterBand, GPURasterMetadata} from './types';
import {
  hasMatchingRasterCoordinateReferenceSystem,
  validateRasterBand,
  validateRasterMetadata,
  type RasterResourceOwner
} from './raster-utils';

/** Borrowed graph resources and explicit spatial metadata for one raster grid. */
export type GPURasterProps = {
  id?: string;
  metadata: GPURasterMetadata;
  bands: readonly GPURasterBand[];
};

/**
 * Non-owning, graph-native raster metadata and band collection.
 *
 * Raster construction never allocates, uploads, encodes, submits, or destroys GPU resources.
 */
export class GPURaster {
  readonly id: string;
  readonly metadata: GPURasterMetadata;
  readonly bands: readonly GPURasterBand[];
  readonly pixelCount: number;
  /** Graph that owns every borrowed band and validity-mask handle. */
  readonly graph: RasterResourceOwner;

  private readonly bandsById = new Map<string, GPURasterBand>();

  constructor(props: GPURasterProps) {
    this.id = props.id ?? 'gpu-raster';
    this.metadata = props.metadata;
    this.bands = props.bands;
    this.pixelCount = validateRasterMetadata(this.metadata, this.id);
    if (this.bands.length === 0) {
      throw new Error(`${this.id} requires at least one band`);
    }

    let owner: RasterResourceOwner | undefined;
    for (const band of this.bands) {
      if (this.bandsById.has(band.id)) {
        throw new Error(`${this.id} band identifiers must be unique`);
      }
      const bandOwner = validateRasterBand(band, this.metadata, `${this.id} ${band.id}`);
      if (owner && bandOwner !== owner) {
        throw new Error(`${this.id} bands must belong to the same graph`);
      }
      owner = bandOwner;
      this.bandsById.set(band.id, band);
    }
    this.graph = owner!;
  }

  /** Returns an existing borrowed band without creating or synchronizing another representation. */
  getBand(id: string): GPURasterBand {
    const band = this.bandsById.get(id);
    if (!band) {
      throw new Error(`${this.id} does not contain band ${id}`);
    }
    return band;
  }

  /** Maps one pixel center into the original double-precision world-coordinate reference frame. */
  getPixelWorldPosition(column: number, row: number): readonly [number, number] {
    const centerOffset = this.metadata.pixelInterpretation === 'area' ? 0.5 : 0;
    const [first, second, third, fourth, fifth, sixth] = this.metadata.affine;
    return [
      first * (column + centerOffset) + second * (row + centerOffset) + third,
      fourth * (column + centerOffset) + fifth * (row + centerOffset) + sixth
    ];
  }

  /** Returns the pixel area in square CRS-coordinate units, without implying geodesic area. */
  getPixelArea(): number {
    const [first, second, , fourth, fifth] = this.metadata.affine;
    return Math.abs(first * fifth - second * fourth);
  }

  /** Conservatively checks grid and opaque CRS identity without implicit reprojection. */
  isCompatibleWith(other: GPURaster): boolean {
    return (
      this.metadata.width === other.metadata.width &&
      this.metadata.height === other.metadata.height &&
      this.metadata.pixelInterpretation === other.metadata.pixelInterpretation &&
      this.metadata.level === other.metadata.level &&
      this.metadata.affine.every((value, index) => value === other.metadata.affine[index]) &&
      hasMatchingRasterCoordinateReferenceSystem(
        this.metadata.coordinateReferenceSystem,
        other.metadata.coordinateReferenceSystem
      ) &&
      hasMatchingLevelZeroOrigin(this.metadata.levelZeroOrigin, other.metadata.levelZeroOrigin)
    );
  }

  /** Rejects mismatched grids instead of silently resampling or transforming coordinates. */
  assertCompatibleWith(other: GPURaster): void {
    if (!this.isCompatibleWith(other)) {
      throw new Error(`${this.id} raster grids and coordinate systems must match`);
    }
  }
}

function hasMatchingLevelZeroOrigin(
  first?: readonly [number, number],
  second?: readonly [number, number]
): boolean {
  if (first === second) return true;
  if (!first || !second) return false;
  return first[0] === second[0] && first[1] === second[1];
}
