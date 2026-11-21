// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {
  GPUPhysicsEnsembleTerrain,
  type GPURigidBodyHeightFieldEdit,
  type GPURigidBodyTerrainTile
} from '../../src/gpu-physics';

const TILE: GPURigidBodyTerrainTile = {
  position: [0, 0, 0],
  field: {width: 3, height: 3, heights: new Float32Array(9)}
};

const windowOf = (key: string) => ({tiles: [{collider: 3, key}]});

it('shares the provider cap, resident content, and outstanding requests between instance windows', async () => {
  const outstanding = new Map<
    string,
    {
      signal: AbortSignal;
      resolve: (tile: GPURigidBodyTerrainTile) => void;
      reject: (error: unknown) => void;
    }
  >();
  const edits: [number, readonly GPURigidBodyHeightFieldEdit[]][] = [];
  const streamer = new GPUPhysicsEnsembleTerrain(
    {
      maximumConcurrentLoads: 1,
      provider: {
        loadTile: (key, signal) =>
          new Promise((resolve, reject) => outstanding.set(key, {signal, resolve, reject}))
      }
    },
    [3],
    () => {},
    (instance, batch) => edits.push([instance, batch])
  );
  try {
    const first = streamer.prepare(0, windowOf('shared'));
    const shared = streamer.prepare(1, windowOf('shared'));
    const other = streamer.prepare(2, windowOf('other'));
    await vi.waitFor(() => expect([...outstanding.keys()]).toEqual(['shared']));
    streamer.cancel(0);
    expect(await first).toBe(false);
    expect(outstanding.get('shared')!.signal.aborted).toBe(false);
    outstanding.get('shared')!.resolve(TILE);
    expect(await shared).toBe(true);
    expect(streamer.apply(1)).toBe(true);
    await vi.waitFor(() => expect([...outstanding.keys()]).toEqual(['shared', 'other']));

    // A third window adopts already resident contents without scheduling another load.
    expect(await streamer.prepare(3, windowOf('shared'))).toBe(true);
    expect(streamer.apply(3)).toBe(true);
    expect(edits.map(([instance]) => instance)).toEqual([1, 3]);
    streamer.clear(1);
    expect(streamer.getResidentTileCount(3)).toBe(1);
    expect(outstanding.get('shared')!.signal.aborted).toBe(false);

    // A failed update leaves other committed windows intact, and capacity is reusable.
    outstanding.get('other')!.reject(new Error('Provider unavailable'));
    await expect(other).rejects.toThrow('Provider unavailable');
    expect(streamer.getResidentTileCount(2)).toBe(0);
    expect(streamer.apply(2)).toBe(false);
    const failed = outstanding.get('other');
    const retry = streamer.prepare(2, windowOf('other'));
    await vi.waitFor(() => expect(outstanding.get('other')).not.toBe(failed));
    streamer.release();
    expect(await retry).toBe(false);
    expect(outstanding.get('other')!.signal.aborted).toBe(true);
    outstanding.get('other')!.resolve(TILE);
  } finally {
    streamer.release();
  }
});
