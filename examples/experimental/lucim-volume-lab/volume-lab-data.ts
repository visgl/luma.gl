// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUVolumeMetadata} from '@luma.gl/experimental/lucim';

/** Reproducible CT-like density samples and source-aligned observation validity. */
export type VolumeLabDataset = {
  metadata: GPUVolumeMetadata;
  values: Float32Array;
  validity: Uint32Array;
  validVoxelCount: number;
  missingVoxelCount: number;
};

export const VOLUME_LAB_DIMENSIONS = [56, 56, 40] as const;
export const VOLUME_LAB_DEFAULT_THRESHOLD = 320;

/**
 * Creates an entirely synthetic, non-diagnostic CT-like phantom in Hounsfield-style units.
 *
 * The fixture deliberately contains air, soft tissue, lung-like cavities, cortical structures,
 * two dense calibration inserts, and one explicitly missing acquisition wedge.
 */
export function makeVolumeLabDataset(
  dimensions: readonly [number, number, number] = VOLUME_LAB_DIMENSIONS
): VolumeLabDataset {
  const [width, height, depth] = dimensions;
  const voxelCount = width * height * depth;
  const values = new Float32Array(voxelCount);
  const validity = new Uint32Array(voxelCount);
  let validVoxelCount = 0;

  for (let z = 0; z < depth; z++) {
    const normalizedZ = normalizeCoordinate(z, depth);
    for (let y = 0; y < height; y++) {
      const normalizedY = normalizeCoordinate(y, height);
      for (let x = 0; x < width; x++) {
        const normalizedX = normalizeCoordinate(x, width);
        const voxelIndex = (z * height + y) * width + x;
        const missing = normalizedX > 0.72 && normalizedY < -0.64 && normalizedZ > 0.36;
        validity[voxelIndex] = missing ? 0 : 1;
        if (!missing) validVoxelCount++;
        values[voxelIndex] = getSyntheticDensity(normalizedX, normalizedY, normalizedZ, x, y, z);
      }
    }
  }

  return {
    metadata: {
      width,
      height,
      depth,
      spacing: [0.82, 0.82, 1.35],
      origin: [-(width * 0.82) / 2, -(height * 0.82) / 2, -(depth * 1.35) / 2],
      direction: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      voxelInterpretation: 'cell'
    },
    values,
    validity,
    validVoxelCount,
    missingVoxelCount: voxelCount - validVoxelCount
  };
}

function getSyntheticDensity(
  x: number,
  y: number,
  z: number,
  column: number,
  row: number,
  layer: number
): number {
  const bodyDistance = (x / 0.82) ** 2 + (y / 0.91) ** 2 + (z / 0.94) ** 2;
  if (bodyDistance > 1) return -1000;

  const texture = getNoise(column, row, layer) * 28 - 14;
  let density = 34 + texture;
  const leftLung = ((x + 0.27) / 0.23) ** 2 + ((y + 0.04) / 0.43) ** 2 + (z / 0.66) ** 2;
  const rightLung = ((x - 0.27) / 0.23) ** 2 + ((y + 0.04) / 0.43) ** 2 + (z / 0.66) ** 2;
  if (leftLung < 1 || rightLung < 1) {
    density = -735 + texture * 3.2;
  }

  const bodyShell = bodyDistance > 0.86 && bodyDistance < 0.96;
  if (bodyShell && Math.abs(z) < 0.79) {
    density = 560 + texture * 5;
  }

  const spine = (x / 0.105) ** 2 + ((y - 0.52) / 0.13) ** 2 < 1 && Math.abs(z) < 0.77;
  if (spine) density = 920 + texture * 4;

  const leftInsert = Math.hypot((x + 0.34) / 0.09, (y - 0.1) / 0.09, (z + 0.12) / 0.14);
  const rightInsert = Math.hypot((x - 0.35) / 0.075, (y - 0.12) / 0.075, (z - 0.2) / 0.11);
  if (leftInsert < 1) density = 1180 + texture * 2;
  if (rightInsert < 1) density = 760 + texture * 2;

  const nodule = Math.hypot((x + 0.28) / 0.055, (y + 0.02) / 0.055, (z - 0.18) / 0.07);
  if (nodule < 1) density = 185 + texture;
  return density;
}

function normalizeCoordinate(value: number, length: number): number {
  return (value / Math.max(length - 1, 1)) * 2 - 1;
}

function getNoise(x: number, y: number, z: number): number {
  let value =
    Math.imul(x + 17, 73856093) ^ Math.imul(y + 31, 19349663) ^ Math.imul(z + 47, 83492791);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}
