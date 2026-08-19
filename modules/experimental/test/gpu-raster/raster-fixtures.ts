// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** CPU values accepted by the deterministic, offline raster reference fixtures. */
export type RasterFixtureValues = Float32Array | Uint32Array;

/** One explicitly shaped raster band used by metadata and WebGPU correctness tests. */
export type RasterFixture<Values extends RasterFixtureValues = RasterFixtureValues> = {
  id: string;
  width: number;
  height: number;
  values: Values;
  validity?: Uint32Array;
  nodata?: number;
  scale?: number;
  offset?: number;
};

/** Coefficients map pixel coordinates to `[a * x + b * y + c, d * x + e * y + f]`. */
export type RasterFixtureAffineTransform = readonly [
  number,
  number,
  number,
  number,
  number,
  number
];

/** Pixel and world coordinates coincide for the identity reference. */
export const IDENTITY_RASTER_AFFINE_TRANSFORM: RasterFixtureAffineTransform = [1, 0, 0, 0, 1, 0];

/** Typical north-up projected imagery has a negative vertical pixel scale. */
export const NORTH_UP_RASTER_AFFINE_TRANSFORM: RasterFixtureAffineTransform = [
  30, 0, 500_000, 0, -30, 4_100_000
];

/** A rotated/sheared fixture prevents helpers from assuming axis-aligned pixels. */
export const SHEARED_RASTER_AFFINE_TRANSFORM: RasterFixtureAffineTransform = [
  2, 0.5, 100, -0.25, -3, 200
];

/** Includes finite nodata, NaN, and one independently rejected mask row. */
export const FLOAT32_NODATA_RASTER_FIXTURE: RasterFixture<Float32Array> = {
  id: 'float32-nodata',
  width: 3,
  height: 3,
  values: Float32Array.from([0, 1, -9999, 3, Number.NaN, 5, 6, 7, 8]),
  validity: Uint32Array.from([1, 1, 1, 1, 1, 1, 1, 0, 1]),
  nodata: -9999
};

/** Retains integers above the exact float32 range and a full-range nodata sentinel. */
export const UINT32_NODATA_RASTER_FIXTURE: RasterFixture<Uint32Array> = {
  id: 'uint32-nodata',
  width: 3,
  height: 3,
  values: Uint32Array.from([0, 1, 0xffffffff, 2, 0x1000001, 0xfffffffe, 7, 9, 10]),
  validity: Uint32Array.from([1, 1, 1, 1, 1, 1, 0, 1, 1]),
  nodata: 0xffffffff
};

/** The smallest nonempty raster catches off-by-one indexing and boundary errors. */
export const SINGLE_PIXEL_RASTER_FIXTURE: RasterFixture<Float32Array> = {
  id: 'single-pixel',
  width: 1,
  height: 1,
  values: Float32Array.from([42])
};

/** Five-column rows exercise packed texture bridges without 256-byte row padding. */
export const ODD_WIDTH_RASTER_FIXTURE: RasterFixture<Float32Array> = {
  id: 'odd-width',
  width: 5,
  height: 3,
  values: Float32Array.from({length: 15}, (_, pixelIndex) => pixelIndex - 7)
};

/** Red reflectance samples require raw nodata rejection before their calibration. */
export const NDVI_RED_RASTER_FIXTURE: RasterFixture<Float32Array> = {
  id: 'ndvi-red',
  width: 3,
  height: 2,
  values: Float32Array.from([100, 200, -9999, 0, 300, 400]),
  validity: Uint32Array.from([1, 1, 1, 1, 0, 1]),
  nodata: -9999,
  scale: 0.001,
  offset: 0
};

/** Near-infrared samples have their own calibration and independent raw nodata value. */
export const NDVI_NEAR_INFRARED_RASTER_FIXTURE: RasterFixture<Float32Array> = {
  id: 'ndvi-near-infrared',
  width: 3,
  height: 2,
  values: Float32Array.from([150, 100, 500, 0, 800, -32768]),
  validity: Uint32Array.from([1, 1, 1, 1, 1, 1]),
  nodata: -32768,
  scale: 0.002,
  offset: 0
};

/** Produces canonical 0/1 validity after intersecting masks, nodata, and finite values. */
export function createRasterFixtureValidity(fixture: RasterFixture): Uint32Array {
  return Uint32Array.from(fixture.values, (value, pixelIndex) => {
    const explicitlyValid = fixture.validity?.[pixelIndex] !== 0;
    const finite = Number.isFinite(value);
    const matchesNodata =
      fixture.nodata !== undefined &&
      (Number.isNaN(fixture.nodata) ? Number.isNaN(value) : value === fixture.nodata);
    return Number(explicitlyValid && finite && !matchesNodata);
  });
}

/** Returns the valid raw-value extent, or `undefined` when every sample is rejected. */
export function calculateRasterFixtureExtent(
  fixture: RasterFixture
): readonly [number, number] | undefined {
  const validity = createRasterFixtureValidity(fixture);
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;

  for (const [pixelIndex, value] of fixture.values.entries()) {
    if (validity[pixelIndex] === 0) continue;
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }

  return minimum <= maximum ? [minimum, maximum] : undefined;
}

/** Matches GPUHistogram's inclusive upper edge and exact uint32-domain integer arithmetic. */
export function calculateRasterFixtureHistogram(
  fixture: RasterFixture,
  binCount: number,
  domain: readonly [number, number]
): Uint32Array {
  const counts = new Uint32Array(binCount);
  const validity = createRasterFixtureValidity(fixture);
  const [minimum, maximum] = domain;

  for (const [pixelIndex, value] of fixture.values.entries()) {
    if (validity[pixelIndex] === 0 || value < minimum || value > maximum) continue;
    if (minimum === maximum) {
      if (value === minimum) counts[0]++;
      continue;
    }

    const binIndex =
      value === maximum
        ? binCount - 1
        : fixture.values instanceof Uint32Array
          ? Number((BigInt(value - minimum) * BigInt(binCount)) / BigInt(maximum - minimum))
          : Math.min(
              Math.floor(((value - minimum) / (maximum - minimum)) * binCount),
              binCount - 1
            );
    counts[binIndex]++;
  }

  return counts;
}

/** Reference NDVI result keeps invalid output pixels separate from their canonical validity mask. */
export type RasterFixtureNdviResult = {
  values: Float32Array;
  validity: Uint32Array;
};

/** Intersects raw band validity, applies distinct calibrations, then rejects zero denominators. */
export function calculateRasterFixtureNdvi(
  red: RasterFixture,
  nearInfrared: RasterFixture,
  minimumDenominator: number = 0
): RasterFixtureNdviResult {
  const redValidity = createRasterFixtureValidity(red);
  const nearInfraredValidity = createRasterFixtureValidity(nearInfrared);
  const values = new Float32Array(red.values.length);
  const validity = new Uint32Array(red.values.length);
  values.fill(Number.NaN);

  for (let pixelIndex = 0; pixelIndex < red.values.length; pixelIndex++) {
    if (redValidity[pixelIndex] === 0 || nearInfraredValidity[pixelIndex] === 0) continue;

    const redValue = red.values[pixelIndex] * (red.scale ?? 1) + (red.offset ?? 0);
    const nearInfraredValue =
      nearInfrared.values[pixelIndex] * (nearInfrared.scale ?? 1) + (nearInfrared.offset ?? 0);
    const denominator = nearInfraredValue + redValue;
    if (!Number.isFinite(denominator) || Math.abs(denominator) <= minimumDenominator) continue;

    values[pixelIndex] = (nearInfraredValue - redValue) / denominator;
    validity[pixelIndex] = 1;
  }

  return {values, validity};
}
