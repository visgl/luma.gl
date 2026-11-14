// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type BakeTile = {x: number; y: number; width: number; height: number};

/** A fixed-size scratch rectangle can be reused across the entire atlas. */
export function planBakeTiles(width: number, height: number, size: number, border: number) {
  if (
    ![width, height, size].every(value => Number.isSafeInteger(value) && value > 0) ||
    !Number.isSafeInteger(border) ||
    border < 0 ||
    width % size ||
    height % size ||
    size + 2 * border > Math.min(width, height)
  ) {
    throw new Error('Bake tile size must divide both atlas dimensions.');
  }
  const tiles: {core: BakeTile; scratch: BakeTile}[] = [];
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      tiles.push({
        core: {x, y, width: size, height: size},
        scratch: {
          x: Math.max(0, Math.min(x - border, width - size - 2 * border)),
          y: Math.max(0, Math.min(y - border, height - size - 2 * border)),
          width: size + 2 * border,
          height: size + 2 * border
        }
      });
    }
  }
  return tiles;
}

/** Main texture payloads, excluding staging, scene buffers, canvas and driver overhead. */
export function estimateBakeTextureBytes(
  atlasPixels: number,
  scratchPixels: number,
  shadowPixels: number,
  indirect: boolean,
  assembled: boolean
): number {
  // Three rgba16float targets, two rgba32float accumulators and one r32float owner map.
  const scratch = scratchPixels * (60 + (indirect ? 40 : 0));
  return scratch + shadowPixels * 4 + (assembled ? atlasPixels * 8 : 0);
}
