// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  calculateRasterFixtureExtent,
  calculateRasterFixtureHistogram,
  calculateRasterFixtureNdvi,
  createRasterFixtureValidity,
  FLOAT32_NODATA_RASTER_FIXTURE,
  IDENTITY_RASTER_AFFINE_TRANSFORM,
  NDVI_NEAR_INFRARED_RASTER_FIXTURE,
  NDVI_RED_RASTER_FIXTURE,
  NORTH_UP_RASTER_AFFINE_TRANSFORM,
  ODD_WIDTH_RASTER_FIXTURE,
  SHEARED_RASTER_AFFINE_TRANSFORM,
  SINGLE_PIXEL_RASTER_FIXTURE,
  UINT32_NODATA_RASTER_FIXTURE
} from './raster-fixtures';

describe('GPURaster deterministic CPU fixtures', () => {
  test('keeps every offline raster shape aligned with its row-major values', () => {
    for (const fixture of [
      FLOAT32_NODATA_RASTER_FIXTURE,
      UINT32_NODATA_RASTER_FIXTURE,
      SINGLE_PIXEL_RASTER_FIXTURE,
      ODD_WIDTH_RASTER_FIXTURE,
      NDVI_RED_RASTER_FIXTURE,
      NDVI_NEAR_INFRARED_RASTER_FIXTURE
    ]) {
      expect(fixture.values.length).toBe(fixture.width * fixture.height);
      if (fixture.validity) expect(fixture.validity.length).toBe(fixture.values.length);
    }
    expect(SINGLE_PIXEL_RASTER_FIXTURE.values).toEqual(Float32Array.from([42]));
    expect(ODD_WIDTH_RASTER_FIXTURE.width).toBe(5);
  });

  test('intersects explicit masks with finite and raw nodata validity', () => {
    expect(createRasterFixtureValidity(FLOAT32_NODATA_RASTER_FIXTURE)).toEqual(
      Uint32Array.from([1, 1, 0, 1, 0, 1, 1, 0, 1])
    );
    expect(createRasterFixtureValidity(UINT32_NODATA_RASTER_FIXTURE)).toEqual(
      Uint32Array.from([1, 1, 0, 1, 1, 1, 0, 1, 1])
    );
  });

  test('computes valid extrema without rounding large unsigned integers', () => {
    expect(calculateRasterFixtureExtent(FLOAT32_NODATA_RASTER_FIXTURE)).toEqual([0, 8]);
    expect(calculateRasterFixtureExtent(UINT32_NODATA_RASTER_FIXTURE)).toEqual([0, 0xfffffffe]);
    expect(UINT32_NODATA_RASTER_FIXTURE.values[4]).toBe(0x1000001);
    expect(
      calculateRasterFixtureExtent({
        id: 'all-invalid',
        width: 2,
        height: 1,
        values: Float32Array.from([-9999, Number.NaN]),
        nodata: -9999
      })
    ).toBeUndefined();
  });

  test('matches inclusive histogram bounds and exact full-range uint32 binning', () => {
    expect(calculateRasterFixtureHistogram(FLOAT32_NODATA_RASTER_FIXTURE, 4, [0, 8])).toEqual(
      Uint32Array.from([2, 1, 1, 2])
    );
    expect(
      calculateRasterFixtureHistogram(UINT32_NODATA_RASTER_FIXTURE, 4, [0, 0xffffffff])
    ).toEqual(Uint32Array.from([6, 0, 0, 1]));
    expect(calculateRasterFixtureHistogram(SINGLE_PIXEL_RASTER_FIXTURE, 3, [42, 42])).toEqual(
      Uint32Array.from([1, 0, 0])
    );
  });

  test('rejects raw nodata and zero denominators before calibrated NDVI output', () => {
    const normalizedDifference = calculateRasterFixtureNdvi(
      NDVI_RED_RASTER_FIXTURE,
      NDVI_NEAR_INFRARED_RASTER_FIXTURE
    );

    expect(normalizedDifference.validity).toEqual(Uint32Array.from([1, 1, 0, 0, 0, 0]));
    expect(normalizedDifference.values[0]).toBeCloseTo(0.5, 6);
    expect(normalizedDifference.values[1]).toBeCloseTo(0, 6);
    expect(Number.isNaN(normalizedDifference.values[2])).toBe(true);
    expect(Number.isNaN(normalizedDifference.values[5])).toBe(true);
  });

  test('covers identity, north-up, and rotated/sheared affine coordinate systems', () => {
    expect(IDENTITY_RASTER_AFFINE_TRANSFORM).toEqual([1, 0, 0, 0, 1, 0]);
    expect(NORTH_UP_RASTER_AFFINE_TRANSFORM[4]).toBeLessThan(0);
    expect(SHEARED_RASTER_AFFINE_TRANSFORM[1]).not.toBe(0);
    expect(SHEARED_RASTER_AFFINE_TRANSFORM[3]).not.toBe(0);
  });
});
