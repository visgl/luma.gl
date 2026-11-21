// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  GPURigidBodyTerrainSelector,
  stitchRigidBodyTerrainTiles,
  type GPURigidBodyTerrainBounds,
  type GPURigidBodyTerrainSelection,
  type GPURigidBodyTerrainTile
} from '../../src/gpu-physics';

/** The quadtree covers this square in meters. */
const BOUNDS = [0, 0, 64, 64] as const;

/** Determine whether two numeric spans share an interval of positive length. */
function overlaps(
  firstMin: number,
  firstMax: number,
  secondMin: number,
  secondMax: number
): boolean {
  return Math.max(firstMin, secondMin) < Math.min(firstMax, secondMax);
}

/** Independently check coverage, balance, and the emitted edge declarations. */
function checkLeaves(selection: GPURigidBodyTerrainSelection, fullCoverage: boolean) {
  const {tiles, seams} = selection;
  expect(new Set(tiles.map(tile => tile.collider)).size).toBe(tiles.length);
  const expected = [];
  let area = 0;
  for (const [index, first] of tiles.entries()) {
    const [west, south, east, north] = first.bounds;
    area += (east - west) * (north - south);
    for (const second of tiles.slice(index + 1)) {
      const [otherWest, otherSouth, otherEast, otherNorth] = second.bounds;
      const eastOverlap = overlaps(west, east, otherWest, otherEast);
      const northOverlap = overlaps(south, north, otherSouth, otherNorth);
      expect(eastOverlap && northOverlap).toBe(false);
      const adjacent =
        (eastOverlap && (north === otherSouth || south === otherNorth)) ||
        (northOverlap && (east === otherWest || west === otherEast));
      if (!adjacent) continue;
      expect(Math.abs(first.address.level - second.address.level)).toBeLessThanOrEqual(1);
      expected.push(
        [first.collider, second.collider].sort((left, right) => left - right).join('/')
      );
    }
  }
  expect(
    seams
      .map(seam => [seam.first, seam.second].sort((left, right) => left - right).join('/'))
      .sort()
  ).toEqual(expected.sort());
  if (fullCoverage) expect(area).toBe(64 * 64);
}

/** A fixture with four cells per axis and vertices at the selected world-space bounds. */
function makeFlatTile(bounds: GPURigidBodyTerrainBounds): GPURigidBodyTerrainTile {
  const [west, south, east, north] = bounds;
  return {
    position: [west, south, 0],
    field: {
      width: 5,
      height: 5,
      heights: new Float32Array(25),
      columnStep: [(east - west) / 4, 0],
      rowStep: [0, (north - south) / 4]
    }
  };
}

it('preserves full coverage and stitches a balanced mixed-resolution window within budget', () => {
  const selector = new GPURigidBodyTerrainSelector({
    bounds: BOUNDS,
    maximumLevel: 6,
    slots: Array.from({length: 36}, (_, index) => index + 7)
  });
  const foci = [
    [7, 7],
    [31, 22],
    [32, 32],
    [35, 33],
    [63, 41],
    [63, 63]
  ] as const;
  let previous: GPURigidBodyTerrainSelection | undefined;
  for (const position of foci) {
    const selection = selector.select({position});
    expect(selection.tiles.length).toBeLessThanOrEqual(36);
    expect(selection.slotLimitReached).toBe(true);
    expect(new Set(selection.tiles.map(tile => tile.address.level)).size).toBeGreaterThan(1);
    checkLeaves(selection, true);
    const surfaces = new Map(
      selection.tiles.map(tile => [tile.collider, makeFlatTile(tile.bounds)])
    );
    expect(stitchRigidBodyTerrainTiles(surfaces, selection.seams).size).toBe(
      selection.tiles.length
    );
    for (const tile of selection.tiles) {
      const oldTile = previous?.tiles.find(previousTile => previousTile.key === tile.key);
      if (oldTile) expect(tile.collider).toBe(oldTile.collider);
    }
    previous = selection;
  }
});

it('enforces residency radius and preserves positional and LOD hysteresis', () => {
  const selector = new GPURigidBodyTerrainSelector({
    bounds: BOUNDS,
    maximumLevel: 1,
    slots: [12, 16, 18, 22],
    refinementDistance: 0.5
  });
  expect(selector.select({position: [-23, 32]}).tiles).toHaveLength(4);
  expect(selector.select({position: [-34, 32]}).tiles).toHaveLength(4);
  selector.reset();
  expect(selector.select({position: [-34, 32]}).tiles).toHaveLength(1);
  expect(selector.select({position: [-11, 32], radius: 10}).tiles).toHaveLength(1);
  expect(selector.select({position: [-13, 32], radius: 10}).tiles).toHaveLength(0);
  const local = selector.select({position: [10, 10], radius: 1});
  expect(local.tiles.map(tile => tile.key)).toEqual(['1/0/0']);
  expect(local.seams).toEqual([]);
});

it('recovers local detail after resetting hysteresis on a teleport', () => {
  const selector = new GPURigidBodyTerrainSelector({
    bounds: [-32, -32, 32, 32],
    maximumLevel: 3,
    slots: [0, 1, 2, 3]
  });
  selector.select({position: [0, -11], radius: 12});
  const focus = {position: [-13, -29] as const, radius: 12};
  const retained = selector.select(focus);
  expect(Math.max(...retained.tiles.map(tile => tile.address.level))).toBe(2);
  selector.reset();
  const recovered = selector.select(focus);
  expect(Math.max(...recovered.tiles.map(tile => tile.address.level))).toBe(3);
});

it('keeps a parent for unavailable children and retains slots across tile revisions', () => {
  let revision = 'a';
  const selector = new GPURigidBodyTerrainSelector({
    bounds: BOUNDS,
    maximumLevel: 3,
    slots: [4, 5, 6, 7],
    getTileKey: ({level, column, row}) =>
      level === 1 && column === 1 && row === 0 ? undefined : `${level}/${column}/${row}@${revision}`
  });
  const first = selector.select({position: [32, 32]});
  expect(first.tiles.map(tile => tile.key)).toEqual(['0/0/0@a']);
  revision = 'b';
  const second = selector.select({position: [32, 32]});
  expect(second.tiles[0].key).toBe('0/0/0@b');
  expect(second.tiles[0].collider).toBe(first.tiles[0].collider);
  expect(second.slotLimitReached).toBe(false);
});

it('retains a root when a complete refinement cannot fit the collider budget', () => {
  const selector = new GPURigidBodyTerrainSelector({
    bounds: BOUNDS,
    maximumLevel: 4,
    slots: [0, 3, 6]
  });
  const selection = selector.select({position: [20, 20]});
  expect(selection.tiles.map(tile => tile.key)).toEqual(['0/0/0']);
  expect(selection.slotLimitReached).toBe(true);
  expect(selection.seams).toEqual([]);
  expect(() => selector.select({position: [0, 0], radius: -1})).toThrow('Invalid terrain focus');
  expect(
    () => new GPURigidBodyTerrainSelector({bounds: BOUNDS, maximumLevel: 4, slots: [0, 0]})
  ).toThrow('Invalid terrain selection policy');
});
