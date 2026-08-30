// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Immutable draw plan for the procedural tiled ocean mesh. */
export type TempestOceanGridPlan = {
  readonly gridResolution: number;
  readonly cellCount: number;
  readonly vertexCount: number;
  readonly tileCount: number;
  readonly instanceCount: number;
};

/**
 * Builds the raster-grid plan independently from the spectral simulation resolution.
 *
 * The shader bilinearly samples the simulation's periodic storage buffers, so this render grid
 * does not need to be a power of two or match the FFT field dimensions.
 */
export function makeTempestOceanGridPlan(
  gridResolution: number,
  tileCount: number
): TempestOceanGridPlan {
  if (!Number.isInteger(gridResolution) || gridResolution < 2 || gridResolution > 512) {
    throw new Error('Tempest Ocean gridResolution must be an integer from 2 through 512.');
  }
  if (!Number.isInteger(tileCount) || tileCount < 1 || tileCount > 5 || tileCount % 2 === 0) {
    throw new Error('Tempest Ocean tileCount must be an odd integer from 1 through 5.');
  }
  const cellCount = (gridResolution - 1) * (gridResolution - 1);
  return Object.freeze({
    gridResolution,
    cellCount,
    vertexCount: cellCount * 6,
    tileCount,
    instanceCount: tileCount * tileCount
  });
}

/** Returns the centered X/Z origin of one periodic tile. Mirrors the vertex shader mapping. */
export function getTempestOceanTileOffset(
  instanceIndex: number,
  tileCount: number,
  patchSize: number
): readonly [number, number] {
  if (
    !Number.isInteger(instanceIndex) ||
    instanceIndex < 0 ||
    instanceIndex >= tileCount * tileCount
  ) {
    throw new Error('Tempest Ocean instanceIndex must address the tiled draw plan.');
  }
  if (!Number.isFinite(patchSize) || patchSize <= 0) {
    throw new Error('Tempest Ocean patchSize must be positive and finite.');
  }
  const halfTileCount = Math.floor(tileCount / 2);
  return Object.freeze([
    ((instanceIndex % tileCount) - halfTileCount) * patchSize,
    (Math.floor(instanceIndex / tileCount) - halfTileCount) * patchSize
  ]);
}
