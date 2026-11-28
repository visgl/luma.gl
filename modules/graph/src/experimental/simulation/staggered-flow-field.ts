// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {assert, Texture, type Device} from '@luma.gl/core';
import {validateFlowParticleDomain} from './flow-particle-field';

/** Rectilinear Cartesian Arakawa C-grid velocities on cell faces, in distance units per second. */
export type StaggeredVectorFieldInput = {
  /** Select face-preserving interpolation rather than collocated bilinear interpolation. */
  layout: 'c-grid';
  /** Cell rows and columns; bounds describe the outside cell faces. */
  shape: readonly [number, number];
  /** Row-major x-normal velocities: rows × (columns + 1). */
  eastward: Float32Array;
  /** Row-major y-normal velocities: (rows + 1) × columns. */
  northward: Float32Array;
  /** Per x-face validity, with the same shape as eastward. Zero means missing, not a wall. */
  eastwardValid: Uint8Array;
  /** Per y-face validity, with the same shape as northward. A closed face is valid with zero velocity. */
  northwardValid: Uint8Array;
};

/** Pack both face arrays without averaging them onto cell centers or conflating their masks. */
export function uploadStaggeredFlowField(
  device: Device,
  input: StaggeredVectorFieldInput,
  bounds: readonly [number, number, number, number],
  periodicLongitude: boolean,
  id?: string
): {
  /** Owned packed normal-face texture. */
  texture: Texture;
  /** Maximum normal speed measured in cells per second. */
  maximumCellSpeed: number;
} {
  validateFlowParticleDomain({bounds, coordinates: 'cartesian'});
  /** Cell counts in south-to-north and west-to-east order. */
  const [rows, columns] = input.shape;
  /** Packed columns, including the eastern exterior x-face. */
  const width = columns + 1;
  /** Packed rows, including the northern exterior y-face. */
  const height = rows + 1;
  // Cell counts must be positive safe integers before computing face-array sizes.
  assert(Number.isSafeInteger(rows) && Number.isSafeInteger(columns) && rows >= 1 && columns >= 1);
  // Bound the rgba32float allocation to 4194304 texels (64 MiB) and device texture limits.
  assert(
    width * height <= 4194304 &&
      width <= device.limits.maxTextureDimension2D &&
      height <= device.limits.maxTextureDimension2D
  );
  // Each cell row has columns + 1 x-normal faces and one validity value per face.
  assert(
    input.eastward.length === rows * width && input.eastwardValid.length === input.eastward.length
  );
  // There are rows + 1 y-normal face rows, each with columns velocities and masks.
  assert(
    input.northward.length === height * columns &&
      input.northwardValid.length === input.northward.length
  );
  /** Packed x/y velocities and their separate validity channels. */
  const texels = new Float32Array(width * height * 4);
  /** Conservative normal-component bound used to cap travel per integration step. */
  let maximumCellSpeed = 0;
  /** Packed row cursor, including the padded northern row. */
  for (let row = 0; row < height; row++) {
    /** Packed column cursor, including the padded eastern column. */
    for (let column = 0; column < width; column++) {
      /** First scalar of this texel in the interleaved four-channel allocation. */
      const offset = (row * width + column) * 4;
      if (row < rows && input.eastwardValid[row * width + column]) {
        /** Valid x-normal face velocity; absent faces retain finite zero padding. */
        const velocity = input.eastward[row * width + column];
        // Valid faces must be finite; masked payloads are intentionally ignored.
        assert(Number.isFinite(velocity));
        texels[offset] = velocity;
        texels[offset + 2] = 1;
        maximumCellSpeed = Math.max(
          maximumCellSpeed,
          (Math.abs(velocity) * columns) / (bounds[2] - bounds[0])
        );
      }
      if (column < columns && input.northwardValid[row * columns + column]) {
        /** Valid y-normal face velocity; absent faces retain finite zero padding. */
        const velocity = input.northward[row * columns + column];
        // Valid faces must be finite; masked payloads are intentionally ignored.
        assert(Number.isFinite(velocity));
        texels[offset + 1] = velocity;
        texels[offset + 3] = 1;
        maximumCellSpeed = Math.max(
          maximumCellSpeed,
          (Math.abs(velocity) * rows) / (bounds[3] - bounds[1])
        );
      }
    }
  }
  if (periodicLongitude) {
    /** Physical cell row whose periodic normal faces must coincide. */
    for (let row = 0; row < rows; row++) {
      /** Packed offset of the western boundary face. */
      const first = row * width * 4;
      /** Packed offset of the matching eastern boundary face. */
      const last = (row * width + columns) * 4;
      // Shared normal faces must have the same validity and velocity at the periodic seam.
      assert(texels[first + 2] === texels[last + 2] && texels[first] === texels[last]);
    }
  }
  return {
    maximumCellSpeed,
    texture: device.createTexture({
      id: id ?? 'staggered-flow-field',
      width,
      height,
      format: 'rgba32float',
      usage: Texture.SAMPLE | Texture.COPY_SRC | Texture.COPY_DST,
      data: texels,
      sampler: {minFilter: 'nearest', magFilter: 'nearest'}
    })
  };
}
