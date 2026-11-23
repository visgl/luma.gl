// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {iterateRayTracingImageTiles} from '@luma.gl/anari';
import {expect, it} from 'vitest';

it('export interiors cover an odd image exactly once and halos stay within image bounds', () => {
  const width = 37;
  const height = 23;
  const coverage = new Uint8Array(width * height);
  const tiles = Array.from(iterateRayTracingImageTiles(width, height, 9, 2));
  expect(tiles).toHaveLength(15);
  expect(tiles[1]).toEqual({
    x: 9,
    y: 0,
    width: 9,
    height: 9,
    renderX: 7,
    renderY: 0,
    renderWidth: 13,
    renderHeight: 11
  });
  for (const tile of tiles) {
    expect(tile.renderX).toBeGreaterThanOrEqual(0);
    expect(tile.renderY).toBeGreaterThanOrEqual(0);
    expect(tile.renderX + tile.renderWidth).toBeLessThanOrEqual(width);
    expect(tile.renderY + tile.renderHeight).toBeLessThanOrEqual(height);
    for (let y = tile.y; y < tile.y + tile.height; y++) {
      for (let x = tile.x; x < tile.x + tile.width; x++) coverage[y * width + x]++;
    }
  }
  expect(Array.from(coverage).every(value => value === 1)).toBe(true);
  expect(tiles.at(-1)).toEqual({
    x: 36,
    y: 18,
    width: 1,
    height: 5,
    renderX: 34,
    renderY: 16,
    renderWidth: 3,
    renderHeight: 7
  });
});

it('export planning stays lazy and rejects unsafe dimensions before yielding', () => {
  expect(iterateRayTracingImageTiles(65535, 65535, 8).next().value).toEqual({
    x: 0,
    y: 0,
    width: 8,
    height: 8,
    renderX: 0,
    renderY: 0,
    renderWidth: 8,
    renderHeight: 8
  });
  for (const values of [
    [0, 10, 8],
    [10, 10, 0],
    [10.5, 10, 8],
    [Infinity, 10, 8],
    [65536, 65536, 8],
    [10, 10, 8, 258]
  ]) {
    expect(() =>
      Array.from(iterateRayTracingImageTiles(values[0], values[1], values[2], values[3]))
    ).toThrow();
  }
});
