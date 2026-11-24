// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {nextFloat32} from '../utils/float32';

/** Vertex format for each supported box dimension. */
const BOUNDS_FORMATS = {2: 'float32x2', 3: 'float32x3'} as const;

/** Smallest normal binary32 magnitude, also valid on GPUs that flush subnormals. */
const MINIMUM_NORMAL = 2 ** -126;

/** Interleaved min/max records, compatible with math.gl BoxIndex input. */
export type GPUBVHBoundsInput<Dimension extends 2 | 3 = 2 | 3> = {
  /** Number of coordinates in each minimum or maximum. */
  dimension: Dimension;
  /** One record per source row, with minimum coordinates followed by maximum coordinates. */
  bounds: ArrayLike<number>;
  /** Optional origin subtracted in number precision before narrowing each coordinate. */
  origin?: ArrayLike<number>;
};

/** Split bounds ready to upload into two packed GPUBVH source views. */
export type GPUBVHPackedBounds<Dimension extends 2 | 3 = 2 | 3> = {
  /** GPU format of each minimum and maximum row. */
  format: (typeof BOUNDS_FORMATS)[Dimension];
  /** Source box count, in original row order. */
  length: number;
  /** Packed local lower bounds, rounded outward. */
  minima: Float32Array;
  /** Packed local upper bounds, rounded outward. */
  maxima: Float32Array;
};

/**
 * Convert CPU box data shared with math.gl BoxIndex to the split buffers used by GPUBVH.
 * Rows keep their input IDs. With an origin, subsequent GPU queries must use the same local frame.
 */
export function packGPUBVHBounds<Dimension extends 2 | 3>({
  bounds,
  dimension,
  origin
}: GPUBVHBoundsInput<Dimension>): GPUBVHPackedBounds<Dimension> {
  /** Each interleaved row holds one minimum and one maximum. */
  const stride = 2 * dimension;
  if ((dimension !== 2 && dimension !== 3) || bounds.length % stride !== 0)
    throw new Error('Invalid packed BVH bounds layout');
  if (origin && (origin.length !== dimension || !Array.from(origin).every(Number.isFinite)))
    throw new Error('Invalid BVH bounds origin');

  /** Output rows retain the source order and leave input storage untouched. */
  const length = bounds.length / stride;
  /** Lower bounds occupy one contiguous buffer. */
  const minima = new Float32Array(length * dimension);
  /** Upper bounds occupy a separate contiguous buffer. */
  const maxima = new Float32Array(length * dimension);
  for (let row = 0; row < length; row++) {
    for (let coordinate = 0; coordinate < dimension; coordinate++) {
      /** Compute local coordinates before reducing precision. */
      const shift = origin?.[coordinate] ?? 0;
      /** Check source ordering before subtracting a potentially distant origin. */
      const minimum = bounds[row * stride + coordinate];
      /** Upper bound in the same dimension. */
      const maximum = bounds[row * stride + dimension + coordinate];
      if (minimum > maximum) throw new Error('Invalid BVH bounds order');
      minima[row * dimension + coordinate] = roundBoundsCoordinate(minimum - shift, false);
      maxima[row * dimension + coordinate] = roundBoundsCoordinate(maximum - shift, true);
    }
  }
  return {format: BOUNDS_FORMATS[dimension], length, minima, maxima};
}

/** Keep the float32 bound conservative even when the adapter flushes subnormal values. */
function roundBoundsCoordinate(value: number, increase: boolean): number {
  if (value === 0) return 0;
  if (Math.abs(value) < MINIMUM_NORMAL)
    return value > 0 === increase ? Math.sign(value) * MINIMUM_NORMAL : 0;
  /** Start with nearest rounding and step outward only if it moved the bound inward. */
  let rounded = Math.fround(value);
  if (Number.isFinite(rounded) && (increase ? rounded < value : rounded > value))
    rounded = nextFloat32(rounded, increase);
  if (!Number.isFinite(rounded)) throw new Error('BVH bounds exceed finite float32 range');
  return rounded;
}
