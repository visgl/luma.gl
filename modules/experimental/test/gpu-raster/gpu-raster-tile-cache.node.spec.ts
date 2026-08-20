// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {describe, expect, test, vi} from 'vitest';
import type {CompiledGPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterTileCache,
  GPURasterTileReader,
  type GPURasterDecodedBand,
  type GPURasterDecodedTile,
  type GPURasterPixelBounds,
  type GPURasterTileCacheBudgets,
  type GPURasterTileGraphEntry,
  type GPURasterTileGraphRequest,
  type GPURasterTileLease,
  type GPURasterTileRequest,
  type GPURasterTileSource,
  type GPURasterTileSourceMetadata
} from '@luma.gl/experimental/gpu-raster';

type FakeBuffer = {
  byteLength: number;
  usage: number;
  data: ArrayBufferView;
  destroyed: boolean;
  destroy: ReturnType<typeof vi.fn>;
};

type CacheFixture = {
  source: SyntheticTileSource;
  device: Device;
  cache: GPURasterTileCache;
  buffers: FakeBuffer[];
};

const TILE_BYTES = 4 * 4 * 4 * 4;

describe('GPURasterTileCache budgets and exact ownership', () => {
  test.each([
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    1.5
  ])('rejects non-positive or unsafe budget %s', invalidBudget => {
    const {source, device} = makeFixture();
    expect(
      () =>
        new GPURasterTileCache({
          device,
          reader: new GPURasterTileReader(source),
          ...makeBudgets(),
          maxCpuBytes: invalidBudget
        })
    ).toThrow(/budgets/);
  });

  test('uploads native scalar arrays and counts a shared decoded validity mask exactly once', async () => {
    const {source, device, cache, buffers} = makeFixture();
    const lease = await cache.acquire({level: 0, column: 0, row: 0});

    expect(source.requests).toHaveLength(1);
    expect(buffers).toHaveLength(4);
    expect(buffers.map(buffer => buffer.data.constructor)).toEqual([
      Float32Array,
      Uint32Array,
      Uint32Array,
      Int32Array
    ]);
    expect(buffers.every(buffer => buffer.usage === (Buffer.STORAGE | Buffer.COPY_DST))).toBe(true);
    expect(lease.bands.map(band => band.format)).toEqual(['float32', 'uint32', 'sint32']);
    expect(lease.bands[0].validity).toBe(lease.bands[1].validity);
    expect(lease.bands[1].validity).toBe(lease.bands[2].validity);
    expect(lease.bands[0].noDataValue).toBe(-9999);
    expect(lease.bands[0].scale).toBe(0.5);
    expect(lease.bands[0].offset).toBe(2);
    expect(lease.tile.cpuByteLength).toBe(TILE_BYTES);
    expect(lease.tile.gpuByteLength).toBe(TILE_BYTES);
    expect(cache.stats).toMatchObject({
      residentTiles: 1,
      cpuBytes: TILE_BYTES,
      gpuBytes: TILE_BYTES,
      tileMisses: 1,
      pinnedTiles: 1
    });
    expect(device.createBuffer).toHaveBeenCalledTimes(4);

    lease.release();
    expect(cache.stats.pinnedTiles).toBe(0);
    cache.destroy();
    expect(buffers.every(buffer => buffer.destroyed)).toBe(true);
    expect(buffers.every(buffer => buffer.destroy.mock.calls.length === 1)).toBe(true);
  });

  test('counts overlapping decoded backing ranges only once without conflating GPU uploads', async () => {
    const source = new SyntheticTileSource();
    source.shareSampleBacking = true;
    const {cache} = makeFixture({}, source);
    const lease = await cache.acquire({level: 0, column: 0, row: 0});

    expect(lease.tile.cpuByteLength).toBe(3 * 4 * 4 * 4);
    expect(lease.tile.gpuByteLength).toBe(TILE_BYTES);
    lease.release();
    cache.destroy();
  });

  test.each([
    ['ArrayBuffer', () => new ArrayBuffer(4096)],
    ['SharedArrayBuffer', () => new SharedArrayBuffer(4096)]
  ])('accounts for the entire retained %s allocation exactly once', async (_name, createBacking) => {
    const source = new SyntheticTileSource();
    source.retainedBacking = createBacking();
    source.retainedBackingOffset = 128;
    const {cache, device} = makeFixture({maxCpuBytes: 4096}, source);
    const lease = await cache.acquire({level: 0, column: 0, row: 0});

    expect(lease.tile.cpuByteLength).toBe(4096);
    expect(lease.tile.gpuByteLength).toBe(TILE_BYTES);
    expect(cache.stats).toMatchObject({cpuBytes: 4096, gpuBytes: TILE_BYTES});
    expect(device.createBuffer).toHaveBeenCalledTimes(4);
    lease.release();
    cache.destroy();
  });

  test('rejects oversized pooled backing allocations before creating any GPU buffer', async () => {
    const source = new SyntheticTileSource();
    source.retainedBacking = new ArrayBuffer(8192);
    source.retainedBackingOffset = 256;
    const {cache, device} = makeFixture({maxCpuBytes: 4096}, source);

    await expect(cache.acquire({level: 0, column: 0, row: 0})).rejects.toThrow(/budget/);

    expect(source.requests).toHaveLength(1);
    expect(device.createBuffer).not.toHaveBeenCalled();
    expect(cache.stats).toMatchObject({residentTiles: 0, cpuBytes: 0, gpuBytes: 0});
    cache.destroy();
  });

  test('reuses identical resident tiles without reading or uploading them again', async () => {
    const {source, cache, buffers} = makeFixture();
    const first = await cache.acquire({level: 0, column: 0, row: 0});
    const second = await cache.acquire({level: 0, column: 0, row: 0});

    expect(first.tile).toBe(second.tile);
    expect(source.requests).toHaveLength(1);
    expect(buffers).toHaveLength(4);
    expect(cache.stats).toMatchObject({tileHits: 1, tileMisses: 1, pinnedTiles: 1});
    first.release();
    expect(cache.stats.pinnedTiles).toBe(1);
    second.release();
    expect(cache.stats.pinnedTiles).toBe(0);
    cache.destroy();
  });

  test('reuses canonical default and full-window variants while the sole tile is pinned', async () => {
    const {source, cache, buffers} = makeFixture({maxTiles: 1});
    const initial = await cache.acquire({level: 0, column: 0, row: 0});
    const equivalent = await Promise.all([
      cache.acquire({
        level: 0,
        column: 0,
        row: 0,
        bandIds: ['red', 'labels', 'signed'],
        pixelBounds: [0, 0, 4, 4],
        coordinateSpace: 'level'
      }),
      cache.acquire({
        level: 0,
        column: 0,
        row: 0,
        pixelBounds: [0, 0, 40, 40],
        coordinateSpace: 'level-zero'
      })
    ]);

    expect(equivalent.every(lease => lease.tile === initial.tile)).toBe(true);
    expect(source.requests).toHaveLength(1);
    expect(buffers).toHaveLength(4);
    expect(cache.stats).toMatchObject({
      residentTiles: 1,
      pinnedTiles: 1,
      tileHits: 2,
      tileMisses: 1
    });
    for (const lease of equivalent) lease.release();
    initial.release();
    cache.destroy();
  });

  test('coalesces omitted and explicit full-level defaults with a pinned one-tile budget', async () => {
    const {source, cache, device} = makeFixture({maxTiles: 1});
    const defaultRequest = await cache.acquire({level: 0});
    const explicitRequest = await cache.acquire({
      level: 0,
      bandIds: ['red', 'labels', 'signed'],
      pixelBounds: [0, 0, source.metadata.width, source.metadata.height],
      coordinateSpace: 'level'
    });

    expect(explicitRequest.tile).toBe(defaultRequest.tile);
    expect(source.requests).toHaveLength(1);
    expect(device.createBuffer).toHaveBeenCalledTimes(4);
    expect(cache.stats).toMatchObject({residentTiles: 1, tileHits: 1, tileMisses: 1});
    explicitRequest.release();
    defaultRequest.release();
    cache.destroy();
  });

  test('coalesces equivalent overview windows before a max-one tile admission', async () => {
    const source = new SyntheticTileSource();
    const gate = makeDeferred<void>();
    source.readGate = gate.promise;
    const {cache, device} = makeFixture({maxTiles: 1}, source);
    const levelCoordinates = cache.acquire({
      level: 1,
      column: 1,
      row: 0,
      pixelBounds: [2, 0, 4, 2]
    });
    const levelZeroCoordinates = cache.acquire({
      level: 1,
      column: 1,
      row: 0,
      pixelBounds: [4, 0, 8, 4],
      coordinateSpace: 'level-zero'
    });
    const defaultWindow = cache.acquire({level: 1, column: 1, row: 0});

    expect(source.requests).toHaveLength(1);
    gate.resolve();
    const leases = await Promise.all([levelCoordinates, levelZeroCoordinates, defaultWindow]);

    expect(leases.every(lease => lease.tile === leases[0].tile)).toBe(true);
    expect(source.requests[0]).toMatchObject({
      level: 1,
      column: 1,
      row: 0,
      pixelBounds: [2, 0, 4, 2],
      coordinateSpace: 'level'
    });
    expect(device.createBuffer).toHaveBeenCalledTimes(4);
    expect(cache.stats).toMatchObject({residentTiles: 1, tileHits: 2, tileMisses: 1});
    for (const lease of leases) lease.release();
    cache.destroy();
  });

  test('keeps full-level identity, ordered bands, and effective windows distinct', async () => {
    const {source, cache} = makeFixture({maxTiles: 8});
    const leases = await Promise.all([
      cache.acquire({level: 0}),
      cache.acquire({level: 0, column: 0, row: 0}),
      cache.acquire({level: 0, column: 0, row: 0, bandIds: ['red', 'labels']}),
      cache.acquire({level: 0, column: 0, row: 0, bandIds: ['labels', 'red']}),
      cache.acquire({level: 0, column: 0, row: 0, pixelBounds: [0, 0, 2, 4]}),
      cache.acquire({
        level: 0,
        column: 0,
        row: 0,
        pixelBounds: [0, 0, 2, 4],
        coordinateSpace: 'level-zero'
      })
    ]);

    expect(source.requests).toHaveLength(5);
    expect(cache.stats).toMatchObject({residentTiles: 5, tileHits: 1, tileMisses: 5});
    for (const lease of leases) lease.release();
    cache.destroy();
  });

  test('deterministically evicts the least-recently-used unpinned tile', async () => {
    const {source, cache, buffers} = makeFixture({maxTiles: 2});
    const west = await cache.acquire({level: 0, column: 0, row: 0});
    const westBuffers = buffers.slice();
    west.release();
    const center = await cache.acquire({level: 0, column: 1, row: 0});
    const centerBuffers = buffers.slice(4);
    center.release();
    const revisitWest = await cache.acquire({level: 0, column: 0, row: 0});
    revisitWest.release();

    const east = await cache.acquire({level: 0, column: 2, row: 0});

    expect(westBuffers.every(buffer => !buffer.destroyed)).toBe(true);
    expect(centerBuffers.every(buffer => buffer.destroyed)).toBe(true);
    expect(cache.stats).toMatchObject({residentTiles: 2, tileEvictions: 1, tileHits: 1});
    east.release();
    const restoredCenter = await cache.acquire({level: 0, column: 1, row: 0});
    expect(source.requests).toHaveLength(4);
    restoredCenter.release();
    cache.destroy();
  });

  test('rejects oversized decoded tiles before allocating any GPU buffers', async () => {
    for (const budgets of [{maxCpuBytes: TILE_BYTES - 1}, {maxGpuBytes: TILE_BYTES - 1}]) {
      const {device, cache} = makeFixture(budgets);
      await expect(cache.acquire({level: 0, column: 0, row: 0})).rejects.toThrow(/budget/);
      expect(device.createBuffer).not.toHaveBeenCalled();
      expect(cache.stats.residentTiles).toBe(0);
      cache.destroy();
    }
  });

  test('rejects all-pinned admission before allocating or destroying resident buffers', async () => {
    const {device, cache, buffers} = makeFixture({maxTiles: 1});
    const active = await cache.acquire({level: 0, column: 0, row: 0});

    await expect(cache.acquire({level: 0, column: 1, row: 0})).rejects.toThrow(/pinned/);

    expect(device.createBuffer).toHaveBeenCalledTimes(4);
    expect(buffers.every(buffer => !buffer.destroyed)).toBe(true);
    active.release();
    const next = await cache.acquire({level: 0, column: 1, row: 0});
    next.release();
    cache.destroy();
  });

  test('shrinks feasible budgets with LRU eviction and rejects impossible pinned shrink atomically', async () => {
    const {cache} = makeFixture({maxTiles: 3});
    const first = await cache.acquire({level: 0, column: 0, row: 0});
    first.release();
    const second = await cache.acquire({level: 0, column: 1, row: 0});
    second.release();
    const third = await cache.acquire({level: 0, column: 2, row: 0});

    cache.setBudgets({maxTiles: 1, maxCpuBytes: TILE_BYTES});
    expect(cache.stats).toMatchObject({residentTiles: 1, tileEvictions: 2});
    const previousBudgets = cache.budgets;
    expect(() => cache.setBudgets({maxGpuBytes: TILE_BYTES - 1})).toThrow(/pinned/);
    expect(cache.budgets).toEqual(previousBudgets);
    expect(cache.stats.residentTiles).toBe(1);
    third.release();
    cache.destroy();
  });

  test('destroys partial uploads if GPU allocation fails', async () => {
    const {cache, device, buffers} = makeFixture();
    const originalCreate = device.createBuffer;
    let allocationCount = 0;
    vi.mocked(device.createBuffer).mockImplementation(props => {
      if (++allocationCount === 3) throw new Error('Synthetic GPU allocation failure');
      return originalCreate.call(device, props);
    });

    await expect(cache.acquire({level: 0, column: 0, row: 0})).rejects.toThrow(
      /allocation failure/
    );
    expect(buffers.every(buffer => buffer.destroyed)).toBe(true);
    expect(cache.stats).toMatchObject({residentTiles: 0, cpuBytes: 0, gpuBytes: 0});
    cache.destroy();
  });
});

describe('GPURasterTileCache cancellation and submission lifetimes', () => {
  test('coalesces concurrent reads and preserves a surviving waiter when another caller aborts', async () => {
    const source = new SyntheticTileSource();
    const read = makeDeferred<void>();
    source.readGate = read.promise;
    const {cache} = makeFixture({}, source);
    const cancelled = new AbortController();
    const first = cache.acquire({level: 0, column: 0, row: 0}, cancelled.signal);
    const second = cache.acquire({level: 0, column: 0, row: 0});

    cancelled.abort(new DOMException('Viewport moved', 'AbortError'));
    await expect(first).rejects.toThrow(/Viewport moved/);
    expect(source.signals[0].aborted).toBe(false);
    read.resolve();
    const survivor = await second;

    expect(source.requests).toHaveLength(1);
    expect(cache.stats).toMatchObject({tileHits: 1, tileMisses: 1, pinnedTiles: 1});
    survivor.release();
    cache.destroy();
  });

  test('aborts the underlying adapter only after every coalesced waiter cancels', async () => {
    const source = new SyntheticTileSource();
    source.readGate = new Promise(() => {});
    const {cache, device} = makeFixture({}, source);
    const firstController = new AbortController();
    const secondController = new AbortController();
    const first = cache.acquire({level: 0, column: 0, row: 0}, firstController.signal);
    const second = cache.acquire({level: 0, column: 0, row: 0}, secondController.signal);

    firstController.abort();
    await expect(first).rejects.toThrow();
    expect(source.signals[0].aborted).toBe(false);
    secondController.abort();
    await expect(second).rejects.toThrow();

    expect(source.signals[0].aborted).toBe(true);
    expect(device.createBuffer).not.toHaveBeenCalled();
    cache.destroy();
  });

  test('protects completed concurrent tiles before acquiring their caller-visible pins', async () => {
    const source = new SyntheticTileSource();
    const gate = makeDeferred<void>();
    source.readGate = gate.promise;
    const {cache, buffers} = makeFixture({maxTiles: 1}, source);
    const west = cache.acquire({level: 0, column: 0, row: 0});
    const east = cache.acquire({level: 0, column: 1, row: 0});

    gate.resolve();
    const results = await Promise.allSettled([west, east]);
    const fulfilled = results.filter(
      (result): result is PromiseFulfilledResult<GPURasterTileLease> =>
        result.status === 'fulfilled'
    );

    expect(fulfilled).toHaveLength(1);
    expect(results.find(result => result.status === 'rejected')).toBeDefined();
    expect(
      fulfilled[0].value.bands.every(band => !(band.buffer as unknown as FakeBuffer).destroyed)
    ).toBe(true);
    expect(buffers.filter(buffer => !buffer.destroyed)).toHaveLength(4);
    fulfilled[0].value.release();
    cache.destroy();
  });

  test('retains encoded tile buffers until its post-submit fence resolves', async () => {
    const {cache, buffers} = makeFixture({maxTiles: 1});
    const lease = await cache.acquire({level: 0, column: 0, row: 0});
    const completion = makeDeferred<void>();
    const released = lease.releaseAfter({signaled: completion.promise});

    lease.release();
    expect(cache.stats.pinnedTiles).toBe(1);
    await expect(cache.acquire({level: 0, column: 1, row: 0})).rejects.toThrow(/pinned/);
    expect(buffers.every(buffer => !buffer.destroyed)).toBe(true);
    completion.resolve();
    await released;
    expect(cache.stats.pinnedTiles).toBe(0);

    const next = await cache.acquire({level: 0, column: 1, row: 0});
    next.release();
    cache.destroy();
  });

  test('releases pins even when an explicit submitted-work completion promise rejects', async () => {
    const {cache} = makeFixture();
    const lease = await cache.acquire({level: 0, column: 0, row: 0});
    const completion = makeDeferred<void>();
    const released = lease.releaseAfter(completion.promise);
    completion.reject(new Error('Device lost after submission'));

    await expect(released).rejects.toThrow(/Device lost/);
    expect(cache.stats.pinnedTiles).toBe(0);
    cache.destroy();
  });

  test('defers destruction of pinned source buffers after cache teardown', async () => {
    const {cache, buffers} = makeFixture();
    const lease = await cache.acquire({level: 0, column: 0, row: 0});
    const completion = makeDeferred<void>();
    const released = lease.releaseAfter(completion.promise);

    cache.destroy();
    expect(buffers.every(buffer => !buffer.destroyed)).toBe(true);
    await expect(cache.acquire({level: 0, column: 1, row: 0})).rejects.toThrow(/destroyed/);
    completion.resolve();
    await released;
    expect(buffers.every(buffer => buffer.destroyed)).toBe(true);
    expect(cache.stats).toMatchObject({residentTiles: 0, cpuBytes: 0, gpuBytes: 0});
  });
});

describe('GPURasterTileCache compatible compiled graph reuse', () => {
  test('reuses identical tile shapes across world origins and counts owner plus transient bytes', async () => {
    const {cache, device} = makeFixture();
    const west = await cache.acquire({level: 0, column: 0, row: 0});
    const east = await cache.acquire({level: 0, column: 1, row: 0});
    const entry = makeGraphEntry(device, 'native-shape', 64, 32);
    const create = vi.fn(() => entry);
    const first = await cache.acquireGraph(west, {
      pipelineKey: 'ndvi',
      estimatedByteLength: 96,
      create
    });
    const second = await cache.acquireGraph(east, {
      pipelineKey: 'ndvi',
      halo: 0,
      estimatedByteLength: 96,
      create
    });

    expect(first.graph).toBe(second.graph);
    expect(first.value).toBe(second.value);
    expect(create).toHaveBeenCalledTimes(1);
    expect(cache.stats).toMatchObject({
      gpuBytes: TILE_BYTES * 2 + 96,
      residentGraphs: 1,
      graphCompilations: 1,
      graphHits: 1,
      pinnedGraphs: 1
    });
    first.release();
    expect(cache.stats.pinnedGraphs).toBe(1);
    second.release();
    west.release();
    east.release();
    cache.destroy();
    expect(entry.destroy).toHaveBeenCalledTimes(1);
  });

  test('specializes graphs by pipeline, halo, overview, dimensions, and ordered band metadata', async () => {
    const {cache, device} = makeFixture({maxTiles: 8, maxGraphs: 8});
    const native = await cache.acquire({level: 0, column: 0, row: 0});
    const reordered = await cache.acquire({
      level: 0,
      column: 0,
      row: 0,
      bandIds: ['labels', 'red']
    });
    const overview = await cache.acquire({level: 1, column: 0, row: 0});
    const full = await cache.acquire({level: 0});
    const leases = await Promise.all([
      cache.acquireGraph(native, makeGraphRequest(device, 'ndvi', 0)),
      cache.acquireGraph(native, makeGraphRequest(device, 'histogram', 0)),
      cache.acquireGraph(native, makeGraphRequest(device, 'ndvi', 1)),
      cache.acquireGraph(reordered, makeGraphRequest(device, 'ndvi', 0)),
      cache.acquireGraph(overview, makeGraphRequest(device, 'ndvi', 0)),
      cache.acquireGraph(full, makeGraphRequest(device, 'ndvi', 0))
    ]);

    expect(cache.stats).toMatchObject({residentGraphs: 6, graphCompilations: 6, graphHits: 0});
    for (const lease of leases) lease.release();
    for (const lease of [native, reordered, overview, full]) lease.release();
    cache.destroy();
  });

  test('rejects released, fence-deferred, and foreign-cache tile leases before graph allocation', async () => {
    const first = makeFixture();
    const second = makeFixture();
    const released = await first.cache.acquire({level: 0, column: 0, row: 0});
    released.release();
    const foreign = await second.cache.acquire({level: 0, column: 0, row: 0});
    const pending = await first.cache.acquire({level: 0, column: 1, row: 0});
    const completion = makeDeferred<void>();
    const finished = pending.releaseAfter(completion.promise);
    const create = vi.fn(() => makeGraphEntry(first.device, 'unsafe', 8, 8));
    const request = {pipelineKey: 'unsafe', estimatedByteLength: 16, create};

    for (const lease of [released, foreign, pending]) {
      await expect(first.cache.acquireGraph(lease, request)).rejects.toThrow(/active tile lease/);
    }
    expect(create).not.toHaveBeenCalled();
    completion.resolve();
    await finished;
    foreign.release();
    first.cache.destroy();
    second.cache.destroy();
  });

  test('coalesces concurrent shape-compatible graph factories and protects caller leases', async () => {
    const {cache, device} = makeFixture({maxGraphs: 1});
    const west = await cache.acquire({level: 0, column: 0, row: 0});
    const east = await cache.acquire({level: 0, column: 1, row: 0});
    const completion = makeDeferred<GPURasterTileGraphEntry<{name: string}>>();
    const create = vi.fn(() => completion.promise);
    const request = {pipelineKey: 'deduplicated', estimatedByteLength: 32, create};
    const first = cache.acquireGraph(west, request);
    const second = cache.acquireGraph(east, request);
    completion.resolve(makeGraphEntry(device, 'deduplicated', 16, 16));
    const leases = await Promise.all([first, second]);

    expect(create).toHaveBeenCalledTimes(1);
    expect(leases[0].graph).toBe(leases[1].graph);
    expect(cache.stats).toMatchObject({graphHits: 1, graphCompilations: 1, pinnedGraphs: 1});
    for (const lease of leases) lease.release();
    west.release();
    east.release();
    cache.destroy();
  });

  test('rejects oversized and all-pinned graph requests before invoking their factories', async () => {
    const {cache, device} = makeFixture({maxGraphs: 1, maxGpuBytes: TILE_BYTES + 32});
    const tile = await cache.acquire({level: 0, column: 0, row: 0});
    const active = await cache.acquireGraph(tile, makeGraphRequest(device, 'active', 0, 32));
    const factory = vi.fn(() => makeGraphEntry(device, 'unsafe', 16, 16));

    await expect(
      cache.acquireGraph(tile, {
        pipelineKey: 'over-capacity',
        estimatedByteLength: TILE_BYTES + 33,
        create: factory
      })
    ).rejects.toThrow(/budget/);
    await expect(
      cache.acquireGraph(tile, {
        pipelineKey: 'pinned-shape',
        estimatedByteLength: 32,
        create: factory
      })
    ).rejects.toThrow(/pinned/);
    expect(factory).not.toHaveBeenCalled();
    active.release();
    tile.release();
    cache.destroy();
  });

  test('destroys a factory entry whose exact owner plus transient bytes exceed its estimate', async () => {
    const {cache, device} = makeFixture();
    const tile = await cache.acquire({level: 0, column: 0, row: 0});
    const entry = makeGraphEntry(device, 'underestimated', 64, 33);

    await expect(
      cache.acquireGraph(tile, {
        pipelineKey: 'underestimated',
        estimatedByteLength: 96,
        create: () => entry
      })
    ).rejects.toThrow(/estimate/);

    expect(entry.destroy).toHaveBeenCalledTimes(1);
    expect(cache.stats).toMatchObject({residentGraphs: 0, gpuBytes: TILE_BYTES});
    tile.release();
    cache.destroy();
  });

  test('rejects a compiled graph created on a foreign device and destroys owned resources', async () => {
    const first = makeFixture();
    const second = makeFixture();
    const tile = await first.cache.acquire({level: 0, column: 0, row: 0});
    const foreignEntry = makeGraphEntry(second.device, 'foreign', 8, 8);

    await expect(
      first.cache.acquireGraph(tile, {
        pipelineKey: 'foreign',
        estimatedByteLength: 16,
        create: () => foreignEntry
      })
    ).rejects.toThrow(/residency device/);
    expect(foreignEntry.destroy).toHaveBeenCalledTimes(1);
    tile.release();
    first.cache.destroy();
    second.cache.destroy();
  });

  test('transfers graph reservations atomically without double-counting committed allocations', async () => {
    const {cache, device} = makeFixture({maxGraphs: 2, maxGpuBytes: TILE_BYTES + 64});
    const tile = await cache.acquire({level: 0, column: 0, row: 0});
    const first = cache.acquireGraph(tile, makeGraphRequest(device, 'first', 0, 32));
    const second = cache.acquireGraph(tile, makeGraphRequest(device, 'second', 0, 32));
    const leases = await Promise.all([first, second]);

    expect(cache.stats).toMatchObject({residentGraphs: 2, gpuBytes: TILE_BYTES + 64});
    for (const lease of leases) lease.release();
    tile.release();
    cache.destroy();
  });

  test('retains pinned compiled graph resources until submitted work completion after teardown', async () => {
    const {cache, device, buffers} = makeFixture();
    const tile = await cache.acquire({level: 0, column: 0, row: 0});
    const entry = makeGraphEntry(device, 'submitted', 16, 16);
    const graph = await cache.acquireGraph(tile, {
      pipelineKey: 'submitted',
      estimatedByteLength: 32,
      create: () => entry
    });
    const completion = makeDeferred<void>();
    const graphDone = graph.releaseAfter(completion.promise);
    const tileDone = tile.releaseAfter({signaled: completion.promise});

    graph.release();
    tile.release();
    cache.destroy();
    expect(entry.destroy).not.toHaveBeenCalled();
    expect(buffers.every(buffer => !buffer.destroyed)).toBe(true);
    completion.resolve();
    await Promise.all([graphDone, tileDone]);

    expect(entry.destroy).toHaveBeenCalledTimes(1);
    expect(buffers.every(buffer => buffer.destroyed)).toBe(true);
    expect(cache.stats).toMatchObject({residentGraphs: 0, residentTiles: 0, gpuBytes: 0});
  });
});

class SyntheticTileSource implements GPURasterTileSource {
  readonly metadata: GPURasterTileSourceMetadata = {
    id: 'bounded-raster-test',
    width: 12,
    height: 4,
    affine: [10, 0, 100, 0, -10, 200],
    pixelInterpretation: 'area',
    bands: [
      {id: 'red', format: 'float32', noDataValue: -9999, scale: 0.5, offset: 2},
      {id: 'labels', format: 'uint32', noDataValue: 4294967295},
      {id: 'signed', format: 'sint32', noDataValue: -2147483648}
    ],
    levels: [
      {level: 0, width: 12, height: 4, tileWidth: 4, tileHeight: 4, downsample: [1, 1]},
      {level: 1, width: 6, height: 2, tileWidth: 2, tileHeight: 2, downsample: [2, 2]}
    ]
  };

  readonly requests: GPURasterTileRequest[] = [];
  readonly signals: AbortSignal[] = [];
  readGate?: Promise<void>;
  shareSampleBacking = false;
  retainedBacking?: ArrayBufferLike;
  retainedBackingOffset = 0;

  async readTile(
    request: GPURasterTileRequest,
    signal: AbortSignal
  ): Promise<GPURasterDecodedTile> {
    this.requests.push(request);
    this.signals.push(signal);
    if (this.readGate) await this.readGate;
    signal.throwIfAborted();
    return makeDecodedTile(
      this.metadata,
      request,
      this.shareSampleBacking,
      this.retainedBacking,
      this.retainedBackingOffset
    );
  }
}

function makeFixture(
  overrides: Partial<GPURasterTileCacheBudgets> = {},
  source = new SyntheticTileSource()
): CacheFixture {
  const buffers: FakeBuffer[] = [];
  const device = {
    createBuffer: vi.fn((props: {data: ArrayBufferView; usage: number}) => {
      const buffer: FakeBuffer = {
        byteLength: props.data.byteLength,
        usage: props.usage,
        data: props.data,
        destroyed: false,
        destroy: vi.fn(() => {
          buffer.destroyed = true;
        })
      };
      buffers.push(buffer);
      return buffer as unknown as Buffer;
    })
  } as unknown as Device;
  const cache = new GPURasterTileCache({
    reader: new GPURasterTileReader(source),
    device,
    ...makeBudgets(),
    ...overrides
  });
  return {source, device, cache, buffers};
}

function makeBudgets(): GPURasterTileCacheBudgets {
  return {maxTiles: 4, maxGraphs: 4, maxCpuBytes: 16384, maxGpuBytes: 16384};
}

function makeDecodedTile(
  metadata: GPURasterTileSourceMetadata,
  request: GPURasterTileRequest,
  shareSampleBacking: boolean,
  retainedBacking?: ArrayBufferLike,
  retainedBackingOffset = 0
): GPURasterDecodedTile {
  const level = metadata.levels.find(candidate => candidate.level === request.level)!;
  const bounds = request.pixelBounds as GPURasterPixelBounds;
  const width = bounds[2] - bounds[0];
  const height = bounds[3] - bounds[1];
  const pixelCount = width * height;
  const originColumn = bounds[0] * level.downsample[0];
  const originRow = bounds[1] * level.downsample[1];
  const sharedValidity = retainedBacking
    ? new Uint32Array(retainedBacking, retainedBackingOffset + pixelCount * 3 * 4, pixelCount)
    : new Uint32Array(pixelCount);
  sharedValidity.fill(1);
  if (pixelCount > 1) sharedValidity[1] = 0;
  const sharedSamples = shareSampleBacking ? new ArrayBuffer(pixelCount * 4) : undefined;
  const bands = (request.bandIds ?? metadata.bands.map(band => band.id)).map(identifier => {
    const band = metadata.bands.find(candidate => candidate.id === identifier)!;
    switch (band.format) {
      case 'float32':
        return {
          ...band,
          values: retainedBacking
            ? new Float32Array(retainedBacking, retainedBackingOffset, pixelCount)
            : sharedSamples
              ? new Float32Array(sharedSamples)
              : new Float32Array(pixelCount),
          validity: sharedValidity
        } as GPURasterDecodedBand;
      case 'uint32':
        return {
          ...band,
          values: retainedBacking
            ? new Uint32Array(retainedBacking, retainedBackingOffset + pixelCount * 4, pixelCount)
            : sharedSamples
              ? new Uint32Array(sharedSamples)
              : new Uint32Array(pixelCount),
          validity: sharedValidity
        } as GPURasterDecodedBand;
      case 'sint32':
        return {
          ...band,
          values: retainedBacking
            ? new Int32Array(
                retainedBacking,
                retainedBackingOffset + pixelCount * 2 * 4,
                pixelCount
              )
            : new Int32Array(pixelCount),
          validity: sharedValidity
        };
    }
  });
  const [
    horizontalScale,
    horizontalShear,
    horizontalOrigin,
    verticalShear,
    verticalScale,
    verticalOrigin
  ] = metadata.affine;
  return {
    level: level.level,
    column: request.column ?? 0,
    row: request.row ?? 0,
    pixelBounds: bounds,
    levelZeroBounds: [
      originColumn,
      originRow,
      Math.min(metadata.width, Math.ceil(bounds[2] * level.downsample[0])),
      Math.min(metadata.height, Math.ceil(bounds[3] * level.downsample[1]))
    ],
    metadata: {
      width,
      height,
      affine: [
        horizontalScale * level.downsample[0],
        horizontalShear * level.downsample[1],
        horizontalOrigin + horizontalScale * originColumn + horizontalShear * originRow,
        verticalShear * level.downsample[0],
        verticalScale * level.downsample[1],
        verticalOrigin + verticalShear * originColumn + verticalScale * originRow
      ],
      pixelInterpretation: metadata.pixelInterpretation,
      level: level.level,
      levelZeroOrigin: [originColumn, originRow]
    },
    bands
  };
}

function makeGraphEntry(
  device: Device,
  name: string,
  transientBytes: number,
  ownerBytes: number
): GPURasterTileGraphEntry<{name: string}> {
  return {
    graph: {
      device,
      stats: {physicalTransientResourceBytes: transientBytes}
    } as CompiledGPUCommandGraph,
    value: {name},
    byteLength: ownerBytes,
    destroy: vi.fn()
  };
}

function makeGraphRequest(
  device: Device,
  pipelineKey: string,
  halo: number,
  estimatedByteLength = 32
): GPURasterTileGraphRequest<{name: string}> {
  const transientBytes = Math.floor(estimatedByteLength / 2);
  return {
    pipelineKey,
    halo,
    estimatedByteLength,
    create: () =>
      makeGraphEntry(device, pipelineKey, transientBytes, estimatedByteLength - transientBytes)
  };
}

function makeDeferred<Value>(): {
  promise: Promise<Value>;
  resolve: (value: Value) => void;
  reject: (reason: Error) => void;
} {
  let resolve: (value: Value) => void = () => {};
  let reject: (reason: Error) => void = () => {};
  const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return {promise, resolve, reject};
}
