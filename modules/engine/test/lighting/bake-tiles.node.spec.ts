// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  estimateBakeTextureBytes,
  planBakeTiles
} from '../../../../examples/api/lightmap-baking/bake-tiles';

test('Cornell tiles cover the atlas exactly and preserve a filter halo at internal edges', () => {
  const tiles = planBakeTiles(4096, 4096, 1024, 9);
  expect(tiles).toHaveLength(16);
  expect(new Set(tiles.map(({core}) => `${core.x},${core.y}`)).size).toBe(16);
  for (const {core, scratch} of tiles) {
    expect(scratch.width).toBe(1042);
    expect(scratch.height).toBe(1042);
    expect(scratch.x).toBeLessThanOrEqual(Math.max(0, core.x - 9));
    expect(scratch.y).toBeLessThanOrEqual(Math.max(0, core.y - 9));
    expect(scratch.x + scratch.width).toBeGreaterThanOrEqual(
      Math.min(4096, core.x + core.width + 9)
    );
    expect(scratch.y + scratch.height).toBeGreaterThanOrEqual(
      Math.min(4096, core.y + core.height + 9)
    );
  }
  const shadowPixels = 6 * 4096 ** 2 + 3 * 2048 ** 2 + 512 ** 2;
  const full = estimateBakeTextureBytes(4096 ** 2, 4096 ** 2, shadowPixels, true, false);
  const tiled = estimateBakeTextureBytes(4096 ** 2, 1042 ** 2, shadowPixels, true, true);
  expect(tiled).toBeLessThan(full / 2);
});
