// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {
  GPURigidBodyTerrainStream,
  makeRigidBodyTerrainFetchProvider,
  stitchRigidBodyTerrainTiles,
  type GPURigidBodyHeightFieldEdit,
  type GPURigidBodyTerrainSeam,
  type GPURigidBodyTerrainTile
} from '../../src/gpu-physics';

/** A uniform three-by-three source tile in a common frame. */
function makeTile(
  position: GPURigidBodyTerrainTile['position'],
  spacing: number,
  rowHeights: readonly number[]
): GPURigidBodyTerrainTile {
  return {
    position,
    field: {
      width: 3,
      height: 3,
      heights: Float64Array.from(rowHeights.flatMap(height => [height, height, height])),
      columnStep: [spacing, 0],
      rowStep: [0, spacing]
    }
  };
}

/** Two fine neighbors covering the lower and upper halves of one coarse boundary. */
const JUNCTION: GPURigidBodyTerrainSeam[] = [
  {first: 0, firstEdge: 'last-column', second: 1, secondEdge: 'first-column'},
  {first: 0, firstEdge: 'last-column', second: 2, secondEdge: 'first-column'},
  {first: 1, firstEdge: 'last-row', second: 2, secondEdge: 'first-row'}
];

it('stitches two fine neighbors to a coarse edge without order dependence or source mutation', () => {
  const coarse = makeTile([1e9, 2e9, 10], 2, [0, 2, 0]);
  const firstFine = makeTile([1e9 + 4, 2e9, 6], 1, [90, 90, 90]);
  const secondFine = makeTile([1e9 + 4, 2e9 + 2, 6], 1, [100, 100, 100]);
  const tiles = new Map([
    [0, coarse],
    [1, firstFine],
    [2, secondFine]
  ]);
  const stitched = stitchRigidBodyTerrainTiles(tiles, JUNCTION);
  expect(stitchRigidBodyTerrainTiles(tiles, [...JUNCTION].reverse())).toEqual(stitched);
  expect(stitched.get(1)!.field.heights).toEqual(
    Float64Array.from([4, 90, 90, 5, 90, 90, 6, 90, 90])
  );
  expect(stitched.get(2)!.field.heights).toEqual(
    Float64Array.from([6, 90, 90, 5, 100, 100, 4, 100, 100])
  );
  expect(firstFine.field.heights![3]).toBe(90);
  expect(secondFine.field.heights![1]).toBe(100);
  expect(stitched.get(0)!.field.heights).toEqual(coarse.field.heights);
});

it('reverses the boundary direction and preserves gaps in both aligned lattices', () => {
  const coarse = makeTile([0, 0, 0], 2, [0, 2, 4]);
  const fine = makeTile([4, 2, 0], 1, [80, 70, 60]);
  fine.field.rowStep = [0, -1];
  fine.field.validity = new Uint8Array([1, 1, 1, 1, 1, 1, 0, 1, 1]);
  const tiles = new Map([
    [0, coarse],
    [1, fine]
  ]);
  const stitched = stitchRigidBodyTerrainTiles(tiles, JUNCTION.slice(0, 1));
  const fineHeights = stitched.get(1)!.field.heights!;
  expect(fineHeights[0]).toBe(2);
  expect(fineHeights[3]).toBeNaN();
  expect(fineHeights[6]).toBeNaN();
  expect(stitched.get(0)!.field.heights![2]).toBeNaN();
  expect(coarse.field.heights![2]).toBe(0);
  expect(fine.field.heights![6]).toBe(60);
});

it('rejects disjoint, displaced, and nonnested edges before creating seam samples', () => {
  const coarse = makeTile([0, 0, 0], 2, [0, 2, 4]);
  for (const tile of [makeTile([5, 0, 0], 1, [0, 1, 2]), makeTile([4, 0, 0], 0.6, [0, 1, 2])]) {
    expect(() =>
      stitchRigidBodyTerrainTiles(
        new Map([
          [0, coarse],
          [1, tile]
        ]),
        JUNCTION.slice(0, 1)
      )
    ).toThrow('Terrain seam requires collinear nested sample lattices');
  }
  for (const tile of [makeTile([4, 5, 0], 1, [0, 1, 2]), makeTile([4, 1, 0], 1, [0, 1, 2])]) {
    expect(() =>
      stitchRigidBodyTerrainTiles(
        new Map([
          [0, coarse],
          [1, tile]
        ]),
        JUNCTION.slice(0, 1)
      )
    ).toThrow('Terrain seam overlap must start and end at common sample knots');
  }
});

it('enforces the global fetch limit and publishes only the latest complete window', async () => {
  const requests = new Map<
    string,
    {signal: AbortSignal; resolve: (tile: GPURigidBodyTerrainTile) => void}
  >();
  const edits: GPURigidBodyHeightFieldEdit[][] = [];
  const stream = new GPURigidBodyTerrainStream(
    {setHeightFieldTiles: editsForWindow => edits.push([...editsForWindow])},
    {
      maximumConcurrentLoads: 2,
      provider: {
        // Intentionally keep aborted requests outstanding until they resolve.
        loadTile: (key, signal) => new Promise(resolve => requests.set(key, {signal, resolve}))
      }
    }
  );
  const first = stream.prepare({
    tiles: [
      {collider: 0, key: 'old-west'},
      {collider: 1, key: 'old-east'}
    ]
  });
  await vi.waitFor(() => expect(requests.size).toBe(2));
  const next = stream.prepare({
    tiles: [
      {collider: 1, key: 'east'},
      {collider: 2, key: 'east'}
    ]
  });
  expect(await first).toBe(false);
  expect(requests.get('old-west')!.signal.aborted).toBe(true);
  expect(requests.has('east')).toBe(false);
  requests.get('old-west')!.resolve(makeTile([0, 0, 0], 2, [0, 0, 0]));
  await vi.waitFor(() => expect(requests.has('east')).toBe(true));
  requests.get('east')!.resolve(makeTile([4, 0, 0], 1, [1, 1, 1]));
  expect(await next).toBe(true);
  expect(edits).toHaveLength(0);
  expect(stream.apply()).toBe(true);
  expect(edits[0].map(edit => edit.collider)).toEqual([1, 2]);

  requests.get('old-east')!.resolve(makeTile([0, 0, 0], 2, [10, 10, 10]));
  expect(stream.apply()).toBe(false);
  expect(await stream.prepare({tiles: [{collider: 1, key: 'east'}]})).toBe(true);
  expect(stream.apply()).toBe(true);
  expect(edits[1]).toEqual([{collider: 2, field: null}]);
  expect(stream.getTile(1)!.field.heights![0]).toBe(1);
});

it('re-stitches from original samples and keeps the active window on a provider or upload failure', async () => {
  const coarse = makeTile([0, 0, 0], 2, [0, 2, 4]);
  const fine = makeTile([4, 0, 0], 1, [50, 50, 50]);
  const loads = vi.fn(async (key: string) => {
    if (key === 'coarse') return coarse;
    if (key === 'fine') return fine;
    throw new Error('Tile unavailable');
  });
  const publish = vi.fn<(edits: readonly GPURigidBodyHeightFieldEdit[]) => void>();
  const stream = new GPURigidBodyTerrainStream(
    {setHeightFieldTiles: publish},
    {provider: {loadTile: loads}}
  );
  const tiles = [
    {collider: 0, key: 'coarse'},
    {collider: 1, key: 'fine'}
  ];
  await stream.prepare({tiles, seams: JUNCTION.slice(0, 1)});
  stream.apply();
  expect(stream.getTile(1)!.field.heights![3]).toBe(1);

  await expect(stream.prepare({tiles: [{collider: 0, key: 'missing'}]})).rejects.toThrow(
    'Tile unavailable'
  );
  expect(stream.apply()).toBe(false);
  expect(stream.getTile(0)).toBeTruthy();
  await stream.prepare({tiles: tiles.slice(1)});
  publish.mockImplementationOnce(() => {
    throw new Error('Busy world');
  });
  expect(() => stream.apply()).toThrow('Busy world');
  expect(stream.getTile(1)!.field.heights![3]).toBe(1);
  expect(stream.apply()).toBe(true);
  expect(stream.getTile(1)!.field.heights![3]).toBe(50);
  expect(fine.field.heights![3]).toBe(50);
  expect(loads).toHaveBeenCalledTimes(3);
  stream.clear();
  expect(publish.mock.lastCall?.[0]).toEqual([{collider: 1, field: null}]);
  expect(stream.getTile(1)).toBeNull();
});

it('forwards cancellation to fetch and reports HTTP errors before decoding', async () => {
  const decode = vi.fn();
  const transport = vi.fn<typeof globalThis.fetch>(async () => new Response('', {status: 404}));
  const provider = makeRigidBodyTerrainFetchProvider({
    getTileUrl: key => `https://terrain.example/${key}`,
    fetch: transport,
    decode
  });
  const signal = new AbortController().signal;
  await expect(provider.loadTile('patch@one', signal)).rejects.toThrow(
    'Terrain request failed with HTTP 404'
  );
  expect(transport).toHaveBeenCalledWith('https://terrain.example/patch@one', {signal});
  expect(decode).not.toHaveBeenCalled();
});

it('retains an in-flight revisioned tile across overlapping windows', async () => {
  const requests = new Map<
    string,
    {signal: AbortSignal; resolve: (tile: GPURigidBodyTerrainTile) => void}
  >();
  const loadTile = vi.fn(
    (key: string, signal: AbortSignal) =>
      new Promise<GPURigidBodyTerrainTile>(resolve => requests.set(key, {signal, resolve}))
  );
  const publish = vi.fn();
  const stream = new GPURigidBodyTerrainStream(
    {setHeightFieldTiles: publish},
    {provider: {loadTile}, maximumConcurrentLoads: 2}
  );
  const shared = {collider: 0, key: 'shared@1'};
  const first = stream.prepare({tiles: [shared, {collider: 1, key: 'old@1'}]});
  await vi.waitFor(() => expect(requests.size).toBe(2));
  const latest = stream.prepare({tiles: [shared, {collider: 2, key: 'new@1'}]});
  expect(await first).toBe(false);
  expect(requests.get('shared@1')!.signal.aborted).toBe(false);
  expect(requests.get('old@1')!.signal.aborted).toBe(true);
  expect(requests.has('new@1')).toBe(false);
  const tile = makeTile([0, 0, 0], 2, [0, 2, 4]);
  requests.get('shared@1')!.resolve(tile);
  await vi.waitFor(() => expect(requests.has('new@1')).toBe(true));
  requests.get('new@1')!.resolve(tile);
  expect(await latest).toBe(true);
  expect(stream.apply()).toBe(true);
  expect(
    publish.mock.lastCall?.[0].map((edit: GPURigidBodyHeightFieldEdit) => edit.collider)
  ).toEqual([0, 2]);
  expect(loadTile.mock.calls.filter(([key]) => key === 'shared@1')).toHaveLength(1);
  requests.get('old@1')!.resolve(tile);
});
