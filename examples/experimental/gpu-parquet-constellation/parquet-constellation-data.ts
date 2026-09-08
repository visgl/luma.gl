// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Columns stored in the generated Parquet constellation. */
export const PARQUET_CONSTELLATION_COLUMNS = [
  'positionX',
  'positionY',
  'radius',
  'temperature',
  'sequence'
] as const;

export type ParquetConstellationColumn = (typeof PARQUET_CONSTELLATION_COLUMNS)[number];

/** Typed columnar source used only by the checked-in Parquet fixture generator. */
export type ParquetConstellationData = {
  positionX: Float32Array;
  positionY: Float32Array;
  radius: Float32Array;
  temperature: Float32Array;
  sequence: Uint32Array;
};

/**
 * Builds a deterministic five-arm galaxy whose visual attributes map one-to-one to Parquet columns.
 *
 * The data is deliberately columnar so loaders.gl infers FLOAT and UINT32 physical storage without
 * widening the values through JavaScript numbers before the file is encoded.
 */
export function makeParquetConstellationData(rowCount: number): ParquetConstellationData {
  const positionX = new Float32Array(rowCount);
  const positionY = new Float32Array(rowCount);
  const radius = new Float32Array(rowCount);
  const temperature = new Float32Array(rowCount);
  const sequence = new Uint32Array(rowCount);
  const armCount = 5;
  const rowsPerArm = Math.ceil(rowCount / armCount);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const armIndex = rowIndex % armCount;
    const armRowIndex = Math.floor(rowIndex / armCount);
    const radialProgress = armRowIndex / Math.max(1, rowsPerArm - 1);
    const randomA = hashToUnitFloat(rowIndex * 2 + 1);
    const randomB = hashToUnitFloat(rowIndex * 2 + 2);
    const armAngle = (armIndex / armCount) * Math.PI * 2;
    const spiralAngle = armAngle + radialProgress * Math.PI * 4.6;
    const distance = 0.035 + Math.pow(radialProgress, 0.58) * 0.91;
    const spread = (randomA - 0.5) * (0.035 + radialProgress * 0.17);
    const radialJitter = (randomB - 0.5) * 0.035;
    const finalDistance = distance + radialJitter;

    positionX[rowIndex] = Math.cos(spiralAngle) * finalDistance - Math.sin(spiralAngle) * spread;
    positionY[rowIndex] =
      (Math.sin(spiralAngle) * finalDistance + Math.cos(spiralAngle) * spread) * 0.58;
    radius[rowIndex] = 0.0012 + Math.pow(randomB, 7) * 0.0065;
    temperature[rowIndex] = Math.min(1, 0.15 + (1 - radialProgress) * 0.58 + randomA * 0.28);
    sequence[rowIndex] = rowIndex;
  }

  return {positionX, positionY, radius, temperature, sequence};
}

function hashToUnitFloat(value: number): number {
  let hash = value >>> 0;
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  hash ^= hash >>> 16;
  return hash / 0x1_0000_0000;
}
