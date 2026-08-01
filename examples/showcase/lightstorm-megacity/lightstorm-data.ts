// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const LIGHTSTORM_INSTANCE_WORD_COUNT = 12;
export const LIGHTSTORM_GRID_SPACING = 3.2;

export type LightstormCityMetadata = {
  gridSize: number;
  fieldHalfExtent: number;
  towerCount: number;
  transitCount: number;
};

export type LightstormCityData = LightstormCityMetadata & {
  instances: Float32Array;
};

/** Creates deterministic GPU records for a dense city of towers and illuminated transit cells. */
export function makeLightstormCity(instanceCount: number): LightstormCityData {
  const gridSize = Math.ceil(Math.sqrt(instanceCount));
  const fieldHalfExtent = (gridSize * LIGHTSTORM_GRID_SPACING) / 2;
  const instances = new Float32Array(instanceCount * LIGHTSTORM_INSTANCE_WORD_COUNT);
  let randomState = 0x91e10da5;
  let towerCount = 0;
  let transitCount = 0;

  const random = (): number => {
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    return (randomState >>> 0) / 0x100000000;
  };

  for (let instanceIndex = 0; instanceIndex < instanceCount; instanceIndex++) {
    const wordOffset = instanceIndex * LIGHTSTORM_INSTANCE_WORD_COUNT;
    const gridX = instanceIndex % gridSize;
    const gridZ = Math.floor(instanceIndex / gridSize);
    const centeredX = gridX - (gridSize - 1) / 2;
    const centeredZ = gridZ - (gridSize - 1) / 2;
    const isTransit = gridX % 12 <= 1 || gridZ % 12 <= 1;
    const jitterScale = isTransit ? 0.04 : 0.34;
    const worldX = centeredX * LIGHTSTORM_GRID_SPACING + (random() * 2 - 1) * jitterScale;
    const worldZ = centeredZ * LIGHTSTORM_GRID_SPACING + (random() * 2 - 1) * jitterScale;
    const normalizedRadius = Math.min(1, Math.hypot(worldX, worldZ) / fieldHalfExtent);
    const districtWave = 0.5 + 0.5 * Math.sin(worldX * 0.021 + Math.cos(worldZ * 0.017) * 2.4);
    const seed = random();

    let halfWidth: number;
    let halfHeight: number;
    let halfDepth: number;
    let centerY: number;
    let red: number;
    let green: number;
    let blue: number;
    let instanceKind: number;

    if (isTransit) {
      transitCount++;
      halfWidth = LIGHTSTORM_GRID_SPACING * 0.49;
      halfHeight = 0.035;
      halfDepth = LIGHTSTORM_GRID_SPACING * 0.49;
      centerY = -0.025;
      const transitPalette = (gridX + gridZ) % 24 < 12;
      red = transitPalette ? 0.03 : 0.28;
      green = transitPalette ? 0.48 : 0.08;
      blue = transitPalette ? 0.82 : 0.38;
      instanceKind = 1;
    } else {
      towerCount++;
      const centerBias = Math.pow(1 - normalizedRadius, 2.2);
      const localCenter = Math.pow(Math.max(0, districtWave - 0.28), 1.7);
      halfWidth = 0.55 + random() * 0.66;
      halfDepth = 0.55 + random() * 0.66;
      halfHeight =
        0.8 +
        Math.pow(random(), 2.7) * 8 +
        centerBias * (5 + Math.pow(random(), 1.8) * 39) * localCenter;
      centerY = halfHeight;
      const paletteIndex = Math.floor(random() * 4);
      red = [0.055, 0.075, 0.12, 0.16][paletteIndex];
      green = [0.105, 0.12, 0.085, 0.07][paletteIndex];
      blue = [0.18, 0.23, 0.26, 0.2][paletteIndex];
      instanceKind = 0;
    }

    const boundingRadius = Math.hypot(halfWidth, halfHeight, halfDepth);
    instances[wordOffset] = worldX;
    instances[wordOffset + 1] = centerY;
    instances[wordOffset + 2] = worldZ;
    instances[wordOffset + 3] = boundingRadius;
    instances[wordOffset + 4] = halfWidth;
    instances[wordOffset + 5] = halfHeight;
    instances[wordOffset + 6] = halfDepth;
    instances[wordOffset + 7] = seed;
    instances[wordOffset + 8] = red;
    instances[wordOffset + 9] = green;
    instances[wordOffset + 10] = blue;
    instances[wordOffset + 11] = instanceKind;
  }

  return {instances, gridSize, fieldHalfExtent, towerCount, transitCount};
}
