// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPURasterMetadata} from '@luma.gl/experimental/luraster';

/** Explicit reflectance bands and a source-aligned cloud validity mask. */
export type RasterLabDataset = {
  width: number;
  height: number;
  pixelCount: number;
  red: Float32Array;
  nearInfrared: Float32Array;
  validity: Uint32Array;
  cloudPixelCount: number;
  noDataPixelCount: number;
  waterPixelCount: number;
  metadata?: GPURasterMetadata;
  tile?: 'full' | 'west' | 'east';
  overviewLevel?: 0 | 1;
  levelZeroOrigin?: readonly [number, number];
  coordinateReferenceSystem?: string;
};

/** Sentinel remains in the raw source domain and is never confused with calibrated reflectance. */
export const RASTER_LAB_NO_DATA_VALUE = -9999;

/** Creates a reproducible, entirely synthetic remote-sensing reflectance scene. */
export function makeRasterLabDataset(width: number, height: number): RasterLabDataset {
  const pixelCount = width * height;
  const red = new Float32Array(pixelCount);
  const nearInfrared = new Float32Array(pixelCount);
  const validity = new Uint32Array(pixelCount);
  let cloudPixelCount = 0;
  let noDataPixelCount = 0;
  let waterPixelCount = 0;

  for (let row = 0; row < height; row++) {
    const normalizedRow = row / Math.max(height - 1, 1);
    for (let column = 0; column < width; column++) {
      const normalizedColumn = column / Math.max(width - 1, 1);
      const pixelIndex = row * width + column;
      const terrain = getFractalNoise(normalizedColumn * 6.4, normalizedRow * 6.4);
      const microtexture = getNoise(normalizedColumn * 52, normalizedRow * 52);
      const riverCenter =
        0.64 +
        Math.sin(normalizedColumn * 8.2 + 0.5) * 0.075 +
        Math.sin(normalizedColumn * 19.1) * 0.018;
      const riverDistance = Math.abs(normalizedRow - riverCenter);
      const reservoirDistance = Math.hypot(
        (normalizedColumn - 0.75) / 1.24,
        (normalizedRow - 0.66) * 1.6
      );
      const isWater = riverDistance < 0.023 + terrain * 0.008 || reservoirDistance < 0.076;
      const isOutsideFootprint =
        normalizedColumn + normalizedRow * 0.24 < 0.045 ||
        normalizedColumn - normalizedRow * 0.14 > 0.976;
      const isCloud = getCloudDensity(normalizedColumn, normalizedRow, terrain) > 0.72;

      if (isOutsideFootprint) {
        red[pixelIndex] = RASTER_LAB_NO_DATA_VALUE;
        nearInfrared[pixelIndex] = RASTER_LAB_NO_DATA_VALUE;
        validity[pixelIndex] = 1;
        noDataPixelCount++;
        continue;
      }

      if (isCloud) {
        red[pixelIndex] = 0.83 + microtexture * 0.1;
        nearInfrared[pixelIndex] = 0.78 + microtexture * 0.08;
        validity[pixelIndex] = 0;
        cloudPixelCount++;
        continue;
      }

      validity[pixelIndex] = 1;
      if (isWater) {
        red[pixelIndex] = 0.09 + terrain * 0.045;
        nearInfrared[pixelIndex] = 0.034 + microtexture * 0.024;
        waterPixelCount++;
        continue;
      }

      const agriculture =
        normalizedColumn > 0.13 &&
        normalizedColumn < 0.6 &&
        normalizedRow > 0.2 &&
        normalizedRow < 0.59;
      const fieldCoordinate =
        Math.floor(normalizedColumn * 13) * 19 + Math.floor(normalizedRow * 10) * 37;
      const fieldVegetation = getHash(fieldCoordinate, fieldCoordinate + 7);
      const ridge = Math.abs(Math.sin(normalizedColumn * 14 + terrain * 5.6));
      const vegetation = clamp(
        terrain * 0.48 +
          (1 - normalizedColumn) * 0.2 +
          (agriculture ? fieldVegetation * 0.42 - 0.11 : 0) +
          (1 - ridge) * 0.13,
        0,
        1
      );
      const soilBrightness = 0.25 + microtexture * 0.14 + ridge * 0.08;
      red[pixelIndex] = clamp(soilBrightness * (1 - vegetation * 0.7), 0.025, 0.86);
      nearInfrared[pixelIndex] = clamp(0.13 + vegetation * 0.58 + terrain * 0.075, 0.045, 0.92);
    }
  }

  return {
    width,
    height,
    pixelCount,
    red,
    nearInfrared,
    validity,
    cloudPixelCount,
    noDataPixelCount,
    waterPixelCount
  };
}

function getCloudDensity(column: number, row: number, terrain: number): number {
  const upperCloud = Math.hypot((column - 0.72) * 6.4, (row - 0.2) * 8.7);
  const middleCloud = Math.hypot((column - 0.81) * 9, (row - 0.29) * 11);
  const distantCloud = Math.hypot((column - 0.3) * 11, (row - 0.82) * 15);
  const threshold = 0.86 + terrain * 0.19;
  return Math.max(threshold - upperCloud, threshold - middleCloud, threshold - distantCloud) + 0.2;
}

function getFractalNoise(column: number, row: number): number {
  return (
    getNoise(column, row) * 0.55 +
    getNoise(column * 2.07 + 7.4, row * 2.07 + 3.1) * 0.29 +
    getNoise(column * 4.11 + 13.6, row * 4.11 + 9.8) * 0.16
  );
}

function getNoise(column: number, row: number): number {
  const minimumColumn = Math.floor(column);
  const minimumRow = Math.floor(row);
  const columnFraction = smoothstep(column - minimumColumn);
  const rowFraction = smoothstep(row - minimumRow);
  const upper = interpolate(
    getHash(minimumColumn, minimumRow),
    getHash(minimumColumn + 1, minimumRow),
    columnFraction
  );
  const lower = interpolate(
    getHash(minimumColumn, minimumRow + 1),
    getHash(minimumColumn + 1, minimumRow + 1),
    columnFraction
  );
  return interpolate(upper, lower, rowFraction);
}

function getHash(column: number, row: number): number {
  let value = Math.imul(column, 374761393) + Math.imul(row, 668265263) + 1274126177;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function interpolate(minimum: number, maximum: number, fraction: number): number {
  return minimum + (maximum - minimum) * fraction;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
