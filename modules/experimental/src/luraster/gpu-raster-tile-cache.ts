// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import type {CompiledGPUCommandGraph} from '../gpu-primitives/gpu-command-graph';
import type {
  GPURasterDecodedTile,
  GPURasterTileBandMetadata,
  GPURasterTileReader,
  GPURasterTileRequest
} from './gpu-raster-tile-source';

/** Independently bounded decoded CPU storage, uploaded GPU storage, tiles, and graph shapes. */
export type GPURasterTileCacheBudgets = {
  maxTiles: number;
  maxGraphs: number;
  maxCpuBytes: number;
  maxGpuBytes: number;
};

/** An application-owned source reader and the device on which decoded bands become resident. */
export type GPURasterTileCacheProps = GPURasterTileCacheBudgets & {
  reader: GPURasterTileReader;
  device: Device;
};

/** One native-format uploaded band; identical decoded validity arrays share one GPU buffer. */
export type GPURasterResidentBand = GPURasterTileBandMetadata & {
  buffer: Buffer;
  validity?: Buffer;
};

/** Borrowed decoded metadata and the exact unique CPU/GPU allocations retained for one tile. */
export type GPURasterResidentTile = {
  decoded: GPURasterDecodedTile;
  bands: readonly GPURasterResidentBand[];
  cpuByteLength: number;
  gpuByteLength: number;
};

/** Cache residency and cumulative hit, eviction, compilation, and active-pin counters. */
export type GPURasterTileCacheStats = {
  residentTiles: number;
  residentGraphs: number;
  cpuBytes: number;
  gpuBytes: number;
  tileHits: number;
  tileMisses: number;
  tileEvictions: number;
  graphHits: number;
  graphCompilations: number;
  pinnedTiles: number;
  pinnedGraphs: number;
};

/** A caller-created post-submit fence or equivalent application-owned completion promise. */
export type GPURasterTileReleaseFence = Promise<void> | {readonly signaled: Promise<void>};

/** A compiled graph and its separately owned application resources; imports are never owned. */
export type GPURasterTileGraphEntry<Value = unknown> = {
  graph: CompiledGPUCommandGraph;
  value: Value;
  /** Bytes owned outside the graph; graph transients are counted separately and automatically. */
  byteLength: number;
  destroy: () => void;
};

/** Explicit graph specialization and conservative allocation estimate required before compilation. */
export type GPURasterTileGraphRequest<Value = unknown> = {
  pipelineKey: string;
  halo?: number;
  /** Must include physical graph transients and separately owned graph-entry allocations. */
  estimatedByteLength: number;
  create: () => GPURasterTileGraphEntry<Value> | Promise<GPURasterTileGraphEntry<Value>>;
};

type TileRecord = {
  key: string;
  tile: GPURasterResidentTile;
  buffers: readonly Buffer[];
  pinCount: number;
  lastUsed: number;
};

type GraphRecord<Value = unknown> = {
  key: string;
  entry: GPURasterTileGraphEntry<Value>;
  gpuByteLength: number;
  pinCount: number;
  lastUsed: number;
};

type InFlightTile = {
  controller: AbortController;
  promise: Promise<TileRecord>;
  waiters: number;
  settled: boolean;
  deliveryRecord?: TileRecord;
};

type InFlightGraph = {
  promise: Promise<GraphRecord>;
  waiters: number;
  settled: boolean;
  deliveryRecord?: GraphRecord;
};

type GraphReservation = {
  byteLength: number;
  active: boolean;
};

type Reservation = {
  tiles: number;
  graphs: number;
  cpuBytes: number;
  gpuBytes: number;
};

/** Explicitly pins an uploaded tile until synchronous or fence-delayed release. */
export class GPURasterTileLease {
  readonly tile: GPURasterResidentTile;

  private readonly owner: GPURasterTileCache;
  private readonly releasePin: () => void;
  private released = false;
  private releaseDeferred = false;
  private releasePromise: Promise<void> | null = null;

  /** @internal */
  constructor(owner: GPURasterTileCache, tile: GPURasterResidentTile, releasePin: () => void) {
    this.owner = owner;
    this.tile = tile;
    this.releasePin = releasePin;
  }

  /** The original decoded tile, retained without copying or converting its native samples. */
  get decoded(): GPURasterDecodedTile {
    return this.tile.decoded;
  }

  /** Native-format uploaded sample and optional source-validity buffers. */
  get bands(): readonly GPURasterResidentBand[] {
    return this.tile.bands;
  }

  /** Releases an unencoded or already completed tile pin exactly once. */
  release(): void {
    if (this.released || this.releaseDeferred) return;
    this.released = true;
    this.releasePin();
  }

  /** Keeps an encoded/submitted tile pinned until the caller-created completion fence settles. */
  releaseAfter(fence: GPURasterTileReleaseFence): Promise<void> {
    if (this.releasePromise) return this.releasePromise;
    if (this.released) return Promise.resolve();
    const signaled = 'signaled' in fence ? fence.signaled : fence;
    this.releaseDeferred = true;
    this.releasePromise = Promise.resolve(signaled).finally(() => {
      this.releaseDeferred = false;
      this.release();
    });
    return this.releasePromise;
  }

  /** @internal Confirms graph compilation consumes an active pin from the same cache/device. */
  assertOwnedBy(owner: GPURasterTileCache): void {
    if (this.owner !== owner || this.released || this.releaseDeferred) {
      throw new Error('Raster tile graph reuse requires an active tile lease from the same cache');
    }
  }
}

/** Explicitly pins a reusable compiled graph and its additional application-owned resources. */
export class GPURasterTileGraphLease<Value = unknown> {
  readonly graph: CompiledGPUCommandGraph;
  readonly value: Value;

  private readonly releasePin: () => void;
  private released = false;
  private releaseDeferred = false;
  private releasePromise: Promise<void> | null = null;

  /** @internal */
  constructor(entry: GPURasterTileGraphEntry<Value>, releasePin: () => void) {
    this.graph = entry.graph;
    this.value = entry.value;
    this.releasePin = releasePin;
  }

  /** Releases an unencoded or already completed graph pin exactly once. */
  release(): void {
    if (this.released || this.releaseDeferred) return;
    this.released = true;
    this.releasePin();
  }

  /** Defers graph and transient destruction until application-owned submitted work settles. */
  releaseAfter(fence: GPURasterTileReleaseFence): Promise<void> {
    if (this.releasePromise) return this.releasePromise;
    if (this.released) return Promise.resolve();
    const signaled = 'signaled' in fence ? fence.signaled : fence;
    this.releaseDeferred = true;
    this.releasePromise = Promise.resolve(signaled).finally(() => {
      this.releaseDeferred = false;
      this.release();
    });
    return this.releasePromise;
  }
}

/**
 * Bounded decoded/uploaded tile residency and application-specialized compiled-graph reuse.
 *
 * Applications own raster transport, graph construction, command encoding, submission, and
 * synchronization. Every encoded tile and graph must remain leased until a fence constructed
 * after the application's submission resolves.
 */
export class GPURasterTileCache {
  readonly reader: GPURasterTileReader;
  readonly device: Device;

  private readonly tiles = new Map<string, TileRecord>();
  private readonly graphs = new Map<string, GraphRecord>();
  private readonly inFlightTiles = new Map<string, InFlightTile>();
  private readonly inFlightGraphs = new Map<string, InFlightGraph>();
  private currentBudgets: GPURasterTileCacheBudgets;
  private currentCpuBytes = 0;
  private currentGpuBytes = 0;
  private pendingGraphCount = 0;
  private pendingGraphGpuBytes = 0;
  private accessTimestamp = 0;
  private totalTileHits = 0;
  private totalTileMisses = 0;
  private totalTileEvictions = 0;
  private totalGraphHits = 0;
  private totalGraphCompilations = 0;
  private destroyed = false;

  constructor(props: GPURasterTileCacheProps) {
    if (!props?.reader || !props.device) {
      throw new Error('Raster tile cache requires an application reader and GPU device');
    }
    this.reader = props.reader;
    this.device = props.device;
    this.currentBudgets = validateBudgets(props);
  }

  /** Current explicit residency limits; caller mutation cannot alter the cache. */
  get budgets(): GPURasterTileCacheBudgets {
    return {...this.currentBudgets};
  }

  /** Exact resident bytes and cumulative event counters at the time of observation. */
  get stats(): GPURasterTileCacheStats {
    let pinnedTiles = 0;
    let pinnedGraphs = 0;
    for (const tile of this.tiles.values()) {
      if (tile.pinCount > 0) pinnedTiles++;
    }
    for (const graph of this.graphs.values()) {
      if (graph.pinCount > 0) pinnedGraphs++;
    }
    return {
      residentTiles: this.tiles.size,
      residentGraphs: this.graphs.size,
      cpuBytes: this.currentCpuBytes,
      gpuBytes: this.currentGpuBytes,
      tileHits: this.totalTileHits,
      tileMisses: this.totalTileMisses,
      tileEvictions: this.totalTileEvictions,
      graphHits: this.totalGraphHits,
      graphCompilations: this.totalGraphCompilations,
      pinnedTiles,
      pinnedGraphs
    };
  }

  /** Coalesces identical decoded requests while preserving independent caller cancellation. */
  async acquire(
    request: GPURasterTileRequest,
    signal: AbortSignal = new AbortController().signal
  ): Promise<GPURasterTileLease> {
    this.assertAvailable();
    throwIfAborted(signal);
    const key = makeTileRequestKey(this.reader, request);
    const resident = this.tiles.get(key);
    if (resident) {
      this.totalTileHits++;
      return this.acquireTilePin(resident);
    }

    let pending = this.inFlightTiles.get(key);
    if (pending?.controller.signal.aborted && !pending.settled) {
      this.inFlightTiles.delete(key);
      pending = undefined;
    }
    if (pending) {
      this.totalTileHits++;
    } else {
      this.totalTileMisses++;
      const controller = new AbortController();
      pending = {
        controller,
        promise: Promise.resolve(undefined as unknown as TileRecord),
        waiters: 0,
        settled: false
      };
      this.inFlightTiles.set(key, pending);
      pending.promise = this.loadTile(key, request, controller.signal)
        .then(record => {
          pending!.deliveryRecord = record;
          return record;
        })
        .finally(() => {
          pending!.settled = true;
          this.releaseTileDeliveryPin(pending!);
          if (this.inFlightTiles.get(key) === pending) this.inFlightTiles.delete(key);
        });
    }

    return await this.waitForTile(pending, signal);
  }

  /** Reuses only exactly compatible shapes and conservatively reserves GPU memory first. */
  async acquireGraph<Value>(
    tile: GPURasterTileLease,
    request: GPURasterTileGraphRequest<Value>
  ): Promise<GPURasterTileGraphLease<Value>> {
    this.assertAvailable();
    if (!(tile instanceof GPURasterTileLease)) {
      throw new Error('Raster graph reuse requires an active tile lease');
    }
    tile.assertOwnedBy(this);
    validateGraphRequest(request);
    const key = makeGraphShapeKey(tile.decoded, request);
    const resident = this.graphs.get(key);
    if (resident) {
      this.totalGraphHits++;
      return this.acquireGraphPin(resident as GraphRecord<Value>);
    }

    let pending = this.inFlightGraphs.get(key);
    if (pending) {
      this.totalGraphHits++;
    } else {
      this.reserve({tiles: 0, graphs: 1, cpuBytes: 0, gpuBytes: request.estimatedByteLength});
      this.pendingGraphCount++;
      this.pendingGraphGpuBytes += request.estimatedByteLength;
      const reservation: GraphReservation = {
        byteLength: request.estimatedByteLength,
        active: true
      };
      pending = {
        promise: Promise.resolve(undefined as unknown as GraphRecord),
        waiters: 0,
        settled: false
      };
      pending.promise = this.createGraph(key, request, reservation)
        .then(record => {
          pending!.deliveryRecord = record as GraphRecord;
          return record as GraphRecord;
        })
        .finally(() => {
          this.releaseGraphReservation(reservation);
          pending!.settled = true;
          this.releaseGraphDeliveryPin(pending!);
          if (this.inFlightGraphs.get(key) === pending) this.inFlightGraphs.delete(key);
        });
      this.inFlightGraphs.set(key, pending);
    }
    return await this.waitForGraph<Value>(pending);
  }

  /** Atomically rejects limits smaller than pinned work, otherwise evicts deterministic LRU. */
  setBudgets(budgets: Partial<GPURasterTileCacheBudgets>): void {
    this.assertAvailable();
    const nextBudgets = validateBudgets({...this.currentBudgets, ...budgets});
    const previousBudgets = this.currentBudgets;
    this.currentBudgets = nextBudgets;
    try {
      this.reserve({tiles: 0, graphs: 0, cpuBytes: 0, gpuBytes: 0});
    } catch (error) {
      this.currentBudgets = previousBudgets;
      throw error;
    }
  }

  /** Cancels unclaimed reads; pinned tile/graph destruction remains deferred until release. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const pending of this.inFlightTiles.values()) pending.controller.abort();
    for (const graph of Array.from(this.graphs.values())) {
      if (graph.pinCount === 0) this.removeGraph(graph);
    }
    for (const tile of Array.from(this.tiles.values())) {
      if (tile.pinCount === 0) this.removeTile(tile);
    }
  }

  private async loadTile(
    key: string,
    request: GPURasterTileRequest,
    signal: AbortSignal
  ): Promise<TileRecord> {
    const decoded = await this.reader.readTile(request, signal);
    throwIfAborted(signal);
    this.assertAvailable();
    const uploadViews = collectUploadViews(decoded);
    const cpuByteLength = countUniqueViewBytes(uploadViews);
    const estimatedGpuByteLength = uploadViews.reduce((total, view) => total + view.byteLength, 0);
    this.reserve({tiles: 1, graphs: 0, cpuBytes: cpuByteLength, gpuBytes: estimatedGpuByteLength});
    throwIfAborted(signal);

    const buffers = new Map<ArrayBufferView, Buffer>();
    try {
      for (const view of uploadViews) {
        const buffer = this.device.createBuffer({
          id: `${key}:${buffers.size}`,
          data: view,
          usage: Buffer.STORAGE | Buffer.COPY_DST
        });
        buffers.set(view, buffer);
      }
      throwIfAborted(signal);
      this.assertAvailable();
      const residentBuffers = Array.from(buffers.values());
      const gpuByteLength = residentBuffers.reduce((total, buffer) => total + buffer.byteLength, 0);
      if (gpuByteLength > estimatedGpuByteLength) {
        throw new Error('Raster tile GPU allocation exceeded its conservative byte estimate');
      }
      const bands: GPURasterResidentBand[] = decoded.bands.map(band => ({
        id: band.id,
        format: band.format,
        ...(band.noDataValue !== undefined ? {noDataValue: band.noDataValue} : {}),
        ...(band.scale !== undefined ? {scale: band.scale} : {}),
        ...(band.offset !== undefined ? {offset: band.offset} : {}),
        buffer: buffers.get(band.values)!,
        ...(band.validity ? {validity: buffers.get(band.validity)!} : {})
      }));
      const tile: GPURasterResidentTile = {decoded, bands, cpuByteLength, gpuByteLength};
      const record: TileRecord = {
        key,
        tile,
        buffers: residentBuffers,
        // Protect the completed record until every coalesced waiter acquires its own lease.
        pinCount: 1,
        lastUsed: ++this.accessTimestamp
      };
      this.tiles.set(key, record);
      this.currentCpuBytes += cpuByteLength;
      this.currentGpuBytes += gpuByteLength;
      return record;
    } catch (error) {
      for (const buffer of buffers.values()) buffer.destroy();
      throw error;
    }
  }

  private async waitForTile(
    pending: InFlightTile,
    signal: AbortSignal
  ): Promise<GPURasterTileLease> {
    pending.waiters++;
    try {
      return await new Promise<GPURasterTileLease>((resolve, reject) => {
        const abort = (): void => reject(makeAbortError(signal));
        signal.addEventListener('abort', abort, {once: true});
        pending.promise
          .then(record => {
            try {
              throwIfAborted(signal);
              this.assertAvailable();
              resolve(this.acquireTilePin(record));
            } catch (error) {
              reject(error);
            }
          }, reject)
          .finally(() => signal.removeEventListener('abort', abort));
        if (signal.aborted) abort();
      });
    } finally {
      pending.waiters--;
      if (pending.waiters === 0 && !pending.settled) pending.controller.abort();
      this.releaseTileDeliveryPin(pending);
    }
  }

  private async createGraph<Value>(
    key: string,
    request: GPURasterTileGraphRequest<Value>,
    reservation: GraphReservation
  ): Promise<GraphRecord<Value>> {
    let entry: GPURasterTileGraphEntry<Value> | undefined;
    try {
      entry = await request.create();
      this.assertAvailable();
      if (!entry?.graph || typeof entry.destroy !== 'function') {
        throw new Error('Raster tile graph factory must return an owned graph entry');
      }
      if (entry.graph.device !== this.device) {
        throw new Error('Raster tile graph must belong to the residency device');
      }
      if (!Number.isSafeInteger(entry.byteLength) || entry.byteLength < 0) {
        throw new Error('Raster tile graph owner byte length must be a non-negative safe integer');
      }
      const gpuByteLength = entry.graph.stats.physicalTransientResourceBytes + entry.byteLength;
      if (!Number.isSafeInteger(gpuByteLength) || gpuByteLength > request.estimatedByteLength) {
        throw new Error('Raster tile graph allocation exceeded its conservative GPU byte estimate');
      }
      const record: GraphRecord<Value> = {
        key,
        entry,
        gpuByteLength,
        // Prevent another graph reservation evicting this entry before caller leases arrive.
        pinCount: 1,
        lastUsed: ++this.accessTimestamp
      };
      // Transfer the conservative pending reservation to exact residency atomically.
      this.releaseGraphReservation(reservation);
      this.graphs.set(key, record as GraphRecord);
      this.currentGpuBytes += gpuByteLength;
      this.totalGraphCompilations++;
      return record;
    } catch (error) {
      entry?.destroy();
      throw error;
    }
  }

  private acquireTilePin(record: TileRecord): GPURasterTileLease {
    record.pinCount++;
    record.lastUsed = ++this.accessTimestamp;
    return new GPURasterTileLease(this, record.tile, () => {
      record.pinCount--;
      record.lastUsed = ++this.accessTimestamp;
      if (this.destroyed && record.pinCount === 0) this.removeTile(record);
    });
  }

  private acquireGraphPin<Value>(record: GraphRecord<Value>): GPURasterTileGraphLease<Value> {
    record.pinCount++;
    record.lastUsed = ++this.accessTimestamp;
    return new GPURasterTileGraphLease(record.entry, () => {
      record.pinCount--;
      record.lastUsed = ++this.accessTimestamp;
      if (this.destroyed && record.pinCount === 0) this.removeGraph(record as GraphRecord);
    });
  }

  private async waitForGraph<Value>(
    pending: InFlightGraph
  ): Promise<GPURasterTileGraphLease<Value>> {
    pending.waiters++;
    try {
      const record = (await pending.promise) as GraphRecord<Value>;
      this.assertAvailable();
      return this.acquireGraphPin(record);
    } finally {
      pending.waiters--;
      this.releaseGraphDeliveryPin(pending);
    }
  }

  private releaseTileDeliveryPin(pending: InFlightTile): void {
    if (!pending.settled || pending.waiters > 0 || !pending.deliveryRecord) return;
    const record = pending.deliveryRecord;
    pending.deliveryRecord = undefined;
    record.pinCount--;
    if (this.destroyed && record.pinCount === 0) this.removeTile(record);
  }

  private releaseGraphDeliveryPin(pending: InFlightGraph): void {
    if (!pending.settled || pending.waiters > 0 || !pending.deliveryRecord) return;
    const record = pending.deliveryRecord;
    pending.deliveryRecord = undefined;
    record.pinCount--;
    if (this.destroyed && record.pinCount === 0) this.removeGraph(record);
  }

  private releaseGraphReservation(reservation: GraphReservation): void {
    if (!reservation.active) return;
    reservation.active = false;
    this.pendingGraphCount--;
    this.pendingGraphGpuBytes -= reservation.byteLength;
  }

  private reserve(reservation: Reservation): void {
    const budgets = this.currentBudgets;
    if (
      reservation.tiles > budgets.maxTiles ||
      reservation.graphs > budgets.maxGraphs ||
      reservation.cpuBytes > budgets.maxCpuBytes ||
      reservation.gpuBytes > budgets.maxGpuBytes
    ) {
      throw new Error('Raster tile or compiled graph exceeds its explicit cache budget');
    }

    let projectedTileCount = this.tiles.size + reservation.tiles;
    let projectedGraphCount = this.graphs.size + this.pendingGraphCount + reservation.graphs;
    let projectedCpuBytes = this.currentCpuBytes + reservation.cpuBytes;
    let projectedGpuBytes = this.currentGpuBytes + this.pendingGraphGpuBytes + reservation.gpuBytes;
    const availableTiles = Array.from(this.tiles.values())
      .filter(tile => tile.pinCount === 0)
      .sort((first, second) => first.lastUsed - second.lastUsed);
    const availableGraphs = Array.from(this.graphs.values())
      .filter(graph => graph.pinCount === 0)
      .sort((first, second) => first.lastUsed - second.lastUsed);
    const selectedTiles: TileRecord[] = [];
    const selectedGraphs: GraphRecord[] = [];

    const selectTile = (): boolean => {
      const tile = availableTiles.shift();
      if (!tile) return false;
      selectedTiles.push(tile);
      projectedTileCount--;
      projectedCpuBytes -= tile.tile.cpuByteLength;
      projectedGpuBytes -= tile.tile.gpuByteLength;
      return true;
    };
    const selectGraph = (): boolean => {
      const graph = availableGraphs.shift();
      if (!graph) return false;
      selectedGraphs.push(graph);
      projectedGraphCount--;
      projectedGpuBytes -= graph.gpuByteLength;
      return true;
    };

    while (projectedTileCount > budgets.maxTiles || projectedCpuBytes > budgets.maxCpuBytes) {
      if (!selectTile()) {
        throw new Error('Raster tile cache cannot evict pinned tiles within its explicit budgets');
      }
    }
    while (projectedGraphCount > budgets.maxGraphs) {
      if (!selectGraph()) {
        throw new Error('Raster tile cache cannot evict pinned graphs within its explicit budgets');
      }
    }
    while (projectedGpuBytes > budgets.maxGpuBytes) {
      const oldestTile = availableTiles[0];
      const oldestGraph = availableGraphs[0];
      if (oldestTile && (!oldestGraph || oldestTile.lastUsed <= oldestGraph.lastUsed)) {
        selectTile();
      } else if (oldestGraph) {
        selectGraph();
      } else {
        throw new Error('Raster tile cache cannot evict pinned GPU resources within its budget');
      }
    }

    for (const graph of selectedGraphs) this.removeGraph(graph);
    for (const tile of selectedTiles) this.removeTile(tile);
  }

  private removeTile(record: TileRecord): void {
    if (record.pinCount > 0 || this.tiles.get(record.key) !== record) return;
    this.tiles.delete(record.key);
    this.currentCpuBytes -= record.tile.cpuByteLength;
    this.currentGpuBytes -= record.tile.gpuByteLength;
    this.totalTileEvictions++;
    for (const buffer of record.buffers) buffer.destroy();
  }

  private removeGraph(record: GraphRecord): void {
    if (record.pinCount > 0 || this.graphs.get(record.key) !== record) return;
    this.graphs.delete(record.key);
    this.currentGpuBytes -= record.gpuByteLength;
    record.entry.destroy();
  }

  private assertAvailable(): void {
    if (this.destroyed) throw new Error('Raster tile cache has been destroyed');
  }
}

function validateBudgets(budgets: GPURasterTileCacheBudgets): GPURasterTileCacheBudgets {
  for (const limit of [
    budgets.maxTiles,
    budgets.maxGraphs,
    budgets.maxCpuBytes,
    budgets.maxGpuBytes
  ]) {
    if (!Number.isSafeInteger(limit) || limit <= 0) {
      throw new Error('Raster tile cache budgets must be positive safe integers');
    }
  }
  return {
    maxTiles: budgets.maxTiles,
    maxGraphs: budgets.maxGraphs,
    maxCpuBytes: budgets.maxCpuBytes,
    maxGpuBytes: budgets.maxGpuBytes
  };
}

function validateGraphRequest<Value>(request: GPURasterTileGraphRequest<Value>): void {
  if (
    !request ||
    typeof request.pipelineKey !== 'string' ||
    request.pipelineKey.length === 0 ||
    typeof request.create !== 'function' ||
    !Number.isSafeInteger(request.estimatedByteLength) ||
    request.estimatedByteLength < 0 ||
    (request.halo !== undefined && (!Number.isSafeInteger(request.halo) || request.halo < 0))
  ) {
    throw new Error(
      'Raster tile graph reuse requires explicit specialization and GPU byte estimate'
    );
  }
}

function makeTileRequestKey(reader: GPURasterTileReader, request: GPURasterTileRequest): string {
  return JSON.stringify({
    source: reader.metadata.id ?? '',
    level: request.level,
    column: request.column ?? null,
    row: request.row ?? null,
    bands: request.bandIds ?? reader.metadata.bands.map(band => band.id),
    bounds: request.pixelBounds ?? null,
    coordinateSpace: request.coordinateSpace ?? 'level'
  });
}

function makeGraphShapeKey<Value>(
  decoded: GPURasterDecodedTile,
  request: GPURasterTileGraphRequest<Value>
): string {
  return JSON.stringify({
    width: decoded.metadata.width,
    height: decoded.metadata.height,
    overview: decoded.level,
    halo: request.halo ?? 0,
    pipeline: request.pipelineKey,
    pixelInterpretation: decoded.metadata.pixelInterpretation,
    bands: decoded.bands.map(band => ({
      id: band.id,
      format: band.format,
      validity: band.validity !== undefined,
      noDataValue: encodeOptionalNumber(band.noDataValue),
      scale: encodeOptionalNumber(band.scale),
      offset: encodeOptionalNumber(band.offset)
    }))
  });
}

function encodeOptionalNumber(value: number | undefined): string | null {
  if (value === undefined) return null;
  if (Number.isNaN(value)) return 'NaN';
  if (Object.is(value, -0)) return '-0';
  return String(value);
}

function collectUploadViews(decoded: GPURasterDecodedTile): ArrayBufferView[] {
  const views = new Set<ArrayBufferView>();
  for (const band of decoded.bands) {
    views.add(band.values);
    if (band.validity) views.add(band.validity);
  }
  return Array.from(views);
}

function countUniqueViewBytes(views: readonly ArrayBufferView[]): number {
  const rangesByBuffer = new Map<ArrayBufferLike, Array<[number, number]>>();
  for (const view of views) {
    const ranges = rangesByBuffer.get(view.buffer) ?? [];
    ranges.push([view.byteOffset, view.byteOffset + view.byteLength]);
    rangesByBuffer.set(view.buffer, ranges);
  }
  let total = 0;
  for (const ranges of rangesByBuffer.values()) {
    ranges.sort((first, second) => first[0] - second[0]);
    let minimum = ranges[0][0];
    let maximum = ranges[0][1];
    for (const [start, end] of ranges.slice(1)) {
      if (start > maximum) {
        total += maximum - minimum;
        minimum = start;
        maximum = end;
      } else {
        maximum = Math.max(maximum, end);
      }
    }
    total += maximum - minimum;
  }
  return total;
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw makeAbortError(signal);
}

function makeAbortError(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('Raster tile request was aborted', 'AbortError');
}
