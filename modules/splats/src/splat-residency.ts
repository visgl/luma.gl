// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUSplatData} from './splat-data';

/** Independent limits applied to intact, independently uploaded Gaussian source batches. */
export type SplatResidencyBudget = {
  /** Maximum allocated bytes retained across resident Gaussian source batches. */
  maxGpuBytes?: number;
  /** Maximum logical source rows retained across resident Gaussian source batches. */
  maxResidentSplats?: number;
  /** Maximum independent source batches retained without combining their buffers. */
  maxResidentChunks?: number;
};

/** Optional spatial metadata supplied by a caller-owned splat tile or hierarchy. */
export type SplatResidencyBounds = {
  /** World-space center used by callers when determining a tile's residency priority. */
  center: readonly [number, number, number];
  /** Optional world-space bounding-sphere radius. */
  radius?: number;
};

/** Identity, priority, hierarchy, and ownership controls for one independent source batch. */
export type SplatResidencyChunkOptions = {
  /** Stable tile or chunk identity; defaults to the batch and global source-row identity. */
  id?: string;
  /** Higher-priority chunks displace lower-priority chunks when capacity is exhausted. */
  priority?: number;
  /** Pinned chunks are never removed automatically or by non-forced eviction. */
  pinned?: boolean;
  /** Caller-defined hierarchy level preserved without combining source batches. */
  levelOfDetail?: number;
  /** Optional tile bounds retained for camera-dependent priority updates. */
  bounds?: SplatResidencyBounds;
  /** Whether this manager owns and destroys this specific prepared source batch. */
  ownsData?: boolean;
  /** Upper-bound GPU bytes reserved before an asynchronous source batch is prepared. */
  estimatedGpuBytes?: number;
  /** Upper-bound source rows reserved before an asynchronous source batch is prepared. */
  estimatedSplatCount?: number;
};

/** Explicit residency metadata stored directly on each independently retained source chunk. */
export type SplatResidencyChunk = {
  /** Stable caller-supplied tile identity or source batch and global-row identity. */
  id: string;
  /** Original independently prepared Gaussian source batch, never copied or combined. */
  data: GPUSplatData;
  /** Retention priority; larger values are more valuable. */
  priority: number;
  /** Whether automatic and non-forced eviction must preserve this chunk. */
  pinned: boolean;
  /** Caller-defined level-of-detail hierarchy position. */
  levelOfDetail: number;
  /** Optional caller-supplied spatial bounds. */
  bounds?: SplatResidencyBounds;
  /** Exact GPU allocation size of this independently owned source batch. */
  byteLength: number;
  /** Number of logical Gaussian source rows. */
  splatCount: number;
  /** Monotonic access counter used to resolve equal-priority eviction ties. */
  lastUsed: number;
  /** Whether this manager must destroy the prepared source batch when it leaves residency. */
  ownsData: boolean;
};

/** Reason an intact Gaussian source batch was removed from the residency window. */
export type SplatResidencyEvictionReason = 'budget' | 'evict' | 'remove' | 'replace' | 'destroy';

/** Current bounded-residency allocations, logical rows, limits, and admission diagnostics. */
export type SplatResidencyStats = {
  /** Number of intact, independently prepared source batches in the residency window. */
  residentChunkCount: number;
  /** Number of logical Gaussian source rows retained without repacking. */
  residentSplatCount: number;
  /** Exact aggregate GPU allocation size across the retained source batches. */
  residentGpuByteLength: number;
  /** Number of pinned chunks protected against automatic eviction. */
  pinnedChunkCount: number;
  /** Number of currently running, coalesced asynchronous source-batch loads. */
  pendingChunkCount: number;
  /** Number of chunks removed by explicit or budget-triggered eviction. */
  evictedChunkCount: number;
  /** Number of incoming chunks rejected because they cannot fit without protected data. */
  rejectedChunkCount: number;
  /** Active exact GPU allocation budget. */
  maxGpuBytes: number;
  /** Active logical Gaussian source-row budget. */
  maxResidentSplats: number;
  /** Active intact source-batch budget. */
  maxResidentChunks: number;
  /** Whether protected chunks currently exceed a newly reduced residency budget. */
  overBudget: boolean;
};

/** Optional integration hooks for updating a borrowing renderer or tile scheduler. */
export type SplatResidencyCallbacks = {
  /** Called after one intact source batch enters the residency window. */
  onAdd?: (chunk: SplatResidencyChunk) => void;
  /** Called after removal but before manager-owned source GPU buffers are destroyed. */
  onEvict?: (chunk: SplatResidencyChunk, reason: SplatResidencyEvictionReason) => void;
  /** Called with the current exact source-batch list after every residency change. */
  onResidencyChange?: (batches: readonly GPUSplatData[], stats: SplatResidencyStats) => void;
};

/** Allocation budgets, default ownership, and optional renderer or scheduler integration. */
export type SplatResidencyManagerProps = SplatResidencyBudget &
  SplatResidencyCallbacks & {
    /** Whether admitted source batches are owned by default. Borrowing is the default. */
    ownsData?: boolean;
    /** Optional callback collection, useful when composing renderer integrations. */
    callbacks?: SplatResidencyCallbacks;
  };

type SplatResidencyTarget = string | GPUSplatData | SplatResidencyChunk;

type SplatResidencyReservation = {
  gpuByteLength: number;
  splatCount: number;
  released: boolean;
};

/**
 * Keeps intact Gaussian source batches within bounded GPU, row, and chunk budgets.
 *
 * Priorities protect more important tiles, equal priorities use least-recently-used
 * eviction, and pinned batches are never automatically removed. No source batch is
 * combined, repacked, or destroyed unless its explicit ownership has been transferred.
 */
export class SplatResidencyManager {
  private readonly chunks = new Map<string, SplatResidencyChunk>();
  private readonly chunksByData = new Map<GPUSplatData, SplatResidencyChunk>();
  private readonly pendingLoads = new Map<string, Promise<SplatResidencyChunk | undefined>>();
  private readonly callbacks: SplatResidencyCallbacks;
  private readonly ownsData: boolean;
  private maxGpuBytes: number;
  private maxResidentSplats: number;
  private maxResidentChunks: number;
  private residentGpuByteLength = 0;
  private residentSplatCount = 0;
  private reservedGpuByteLength = 0;
  private reservedSplatCount = 0;
  private reservedChunkCount = 0;
  private pinnedChunkCount = 0;
  private evictedChunkCount = 0;
  private rejectedChunkCount = 0;
  private accessCounter = 0;
  private isDestroyed = false;

  /** Creates an initially empty, borrowing residency window with optional finite budgets. */
  constructor(props: SplatResidencyManagerProps = {}) {
    this.maxGpuBytes = normalizeSplatResidencyBudget(props.maxGpuBytes);
    this.maxResidentSplats = normalizeSplatResidencyBudget(props.maxResidentSplats);
    this.maxResidentChunks = normalizeSplatResidencyBudget(props.maxResidentChunks);
    this.ownsData = props.ownsData ?? false;
    this.callbacks = {
      ...props.callbacks,
      ...(props.onAdd ? {onAdd: props.onAdd} : {}),
      ...(props.onEvict ? {onEvict: props.onEvict} : {}),
      ...(props.onResidencyChange ? {onResidencyChange: props.onResidencyChange} : {})
    };
  }

  /** Whether this residency manager has already released its retained source batches. */
  get destroyed(): boolean {
    return this.isDestroyed;
  }

  /** Original caller-owned source batches in stable admission order. */
  get residentBatches(): GPUSplatData[] {
    return this.getResidentBatches();
  }

  /** Explicit source chunk, tile, priority, hierarchy, and ownership metadata. */
  get residentChunks(): SplatResidencyChunk[] {
    return this.getResidentChunks();
  }

  /** Current exact GPU allocations, logical rows, source batches, and budget diagnostics. */
  get stats(): SplatResidencyStats {
    return this.getStats();
  }

  /** Returns the original intact GPU source batches without copying or combining their buffers. */
  getResidentBatches(): GPUSplatData[] {
    return Array.from(this.chunks.values(), chunk => chunk.data);
  }

  /** Returns every admitted source chunk and its directly stored residency metadata. */
  getResidentChunks(): SplatResidencyChunk[] {
    return Array.from(this.chunks.values());
  }

  /** Returns one retained chunk using its tile identity or exact source-batch object. */
  getChunk(target: SplatResidencyTarget): SplatResidencyChunk | undefined {
    return this.resolveChunk(target);
  }

  /** Whether the exact source batch or source tile identity is currently resident. */
  has(target: SplatResidencyTarget): boolean {
    return this.resolveChunk(target) !== undefined;
  }

  /**
   * Admits one intact source batch, evicting only lower-priority or older equal-priority chunks.
   *
   * Returns `undefined` without changing existing residency when the source batch cannot fit.
   */
  add(
    data: GPUSplatData,
    options: SplatResidencyChunkOptions = {}
  ): SplatResidencyChunk | undefined {
    if (this.isDestroyed || data.destroyed) {
      throw new Error('Splat residency requires a live manager and source batch');
    }

    const chunkId = options.id ?? getSplatResidencyChunkId(data);
    const existingChunk = this.chunks.get(chunkId);
    const retainedData = this.resolveChunk(data);
    if (retainedData) {
      this.updateChunk(retainedData, options);
      return this.resolveChunk(data);
    }

    const incomingPriority = options.priority ?? existingChunk?.priority ?? 0;
    let prospectiveByteLength =
      this.residentGpuByteLength +
      this.reservedGpuByteLength -
      (existingChunk?.byteLength ?? 0) +
      data.byteLength;
    let prospectiveSplatCount =
      this.residentSplatCount +
      this.reservedSplatCount -
      (existingChunk?.splatCount ?? 0) +
      data.length;
    let prospectiveChunkCount =
      this.chunks.size + this.reservedChunkCount + (existingChunk ? 0 : 1);
    const evictedChunks: SplatResidencyChunk[] = [];

    if (this.exceedsBudget(prospectiveByteLength, prospectiveSplatCount, prospectiveChunkCount)) {
      for (const candidate of this.getEvictionCandidates(incomingPriority, existingChunk)) {
        if (
          !this.exceedsBudget(prospectiveByteLength, prospectiveSplatCount, prospectiveChunkCount)
        ) {
          break;
        }
        prospectiveByteLength -= candidate.byteLength;
        prospectiveSplatCount -= candidate.splatCount;
        prospectiveChunkCount--;
        evictedChunks.push(candidate);
      }
    }

    if (this.exceedsBudget(prospectiveByteLength, prospectiveSplatCount, prospectiveChunkCount)) {
      this.rejectedChunkCount++;
      return undefined;
    }

    if (existingChunk) {
      this.removeChunk(existingChunk, 'replace');
    }
    for (const candidate of evictedChunks) {
      this.removeChunk(candidate, 'budget');
    }

    const chunk: SplatResidencyChunk = {
      id: chunkId,
      data,
      priority: incomingPriority,
      pinned: options.pinned ?? false,
      levelOfDetail: options.levelOfDetail ?? 0,
      ...(options.bounds ? {bounds: options.bounds} : {}),
      byteLength: data.byteLength,
      splatCount: data.length,
      lastUsed: ++this.accessCounter,
      ownsData: options.ownsData ?? this.ownsData
    };

    this.chunks.set(chunk.id, chunk);
    this.chunksByData.set(chunk.data, chunk);
    this.residentGpuByteLength += chunk.byteLength;
    this.residentSplatCount += chunk.splatCount;
    if (chunk.pinned) {
      this.pinnedChunkCount++;
    }
    this.callbacks.onAdd?.(chunk);
    this.notifyResidencyChange();
    return chunk;
  }

  /** Alias for registering one intact source tile or independently prepared streaming batch. */
  register(
    data: GPUSplatData,
    options: SplatResidencyChunkOptions = {}
  ): SplatResidencyChunk | undefined {
    return this.add(data, options);
  }

  /**
   * Loads one source tile at most once, retaining its exact source-batch boundaries.
   *
   * Optional GPU-byte and source-row estimates reserve capacity before the source loader runs.
   * Protected or higher-priority chunks are retained transactionally when admission cannot fit.
   * Manager-owned asynchronous results are destroyed if final admission fails or the manager
   * has already been destroyed. Borrowed results always remain owned by their source loader.
   */
  load(
    id: string,
    loadData: () => GPUSplatData | Promise<GPUSplatData>,
    options: Omit<SplatResidencyChunkOptions, 'id'> = {}
  ): Promise<SplatResidencyChunk | undefined> {
    if (this.isDestroyed) {
      return Promise.reject(new Error('Splat residency manager has been destroyed'));
    }

    const existingChunk = this.chunks.get(id);
    if (existingChunk) {
      this.updateChunk(existingChunk, options);
      return Promise.resolve(this.chunks.get(id));
    }

    const pendingLoad = this.pendingLoads.get(id);
    if (pendingLoad) {
      return pendingLoad;
    }

    const shouldReserve =
      options.estimatedGpuBytes !== undefined || options.estimatedSplatCount !== undefined;
    const reservation = shouldReserve ? this.reserveLoad(options) : undefined;
    if (shouldReserve && !reservation) {
      this.rejectedChunkCount++;
      return Promise.resolve(undefined);
    }

    let requestedLoad: Promise<SplatResidencyChunk | undefined>;
    requestedLoad = Promise.resolve()
      .then(loadData)
      .then(data => {
        if (reservation) {
          this.releaseReservation(reservation);
        }
        if (this.isDestroyed) {
          if (options.ownsData ?? this.ownsData) {
            data.destroy();
          }
          return undefined;
        }

        const chunk = this.add(data, {id, ...options});
        if (!chunk && (options.ownsData ?? this.ownsData)) {
          data.destroy();
        }
        return chunk;
      })
      .finally(() => {
        if (reservation) {
          this.releaseReservation(reservation);
        }
        if (this.pendingLoads.get(id) === requestedLoad) {
          this.pendingLoads.delete(id);
        }
      });
    this.pendingLoads.set(id, requestedLoad);
    return requestedLoad;
  }

  /** Marks one source tile as recently used without changing its source buffers or identity. */
  touch(target: SplatResidencyTarget): boolean {
    const chunk = this.resolveChunk(target);
    if (!chunk) {
      return false;
    }
    chunk.lastUsed = ++this.accessCounter;
    return true;
  }

  /** Updates the eviction priority of one source tile without moving or repacking its data. */
  setPriority(target: SplatResidencyTarget, priority: number): boolean {
    const chunk = this.resolveChunk(target);
    if (!chunk) {
      return false;
    }
    chunk.priority = priority;
    chunk.lastUsed = ++this.accessCounter;
    return true;
  }

  /** Protects a retained source tile against automatic and non-forced explicit eviction. */
  pin(target: SplatResidencyTarget, pinned = true): boolean {
    const chunk = this.resolveChunk(target);
    if (!chunk) {
      return false;
    }
    if (chunk.pinned !== pinned) {
      this.pinnedChunkCount += pinned ? 1 : -1;
    }
    chunk.pinned = pinned;
    chunk.lastUsed = ++this.accessCounter;
    if (!pinned) {
      this.trim();
    }
    return true;
  }

  /** Removes explicit eviction protection and immediately enforces any reduced budgets. */
  unpin(target: SplatResidencyTarget): boolean {
    return this.pin(target, false);
  }

  /** Updates any combination of exact GPU-byte, source-row, and independent-chunk budgets. */
  setBudget(budget: SplatResidencyBudget | number): void {
    const updatedBudget = typeof budget === 'number' ? {maxGpuBytes: budget} : budget;
    if (updatedBudget.maxGpuBytes !== undefined) {
      this.maxGpuBytes = normalizeSplatResidencyBudget(updatedBudget.maxGpuBytes);
    }
    if (updatedBudget.maxResidentSplats !== undefined) {
      this.maxResidentSplats = normalizeSplatResidencyBudget(updatedBudget.maxResidentSplats);
    }
    if (updatedBudget.maxResidentChunks !== undefined) {
      this.maxResidentChunks = normalizeSplatResidencyBudget(updatedBudget.maxResidentChunks);
    }
    this.trim();
  }

  /** Evicts one unpinned source tile, defaulting to the least valuable and oldest resident. */
  evict(target?: SplatResidencyTarget): boolean {
    const chunk = target
      ? this.resolveChunk(target)
      : this.getEvictionCandidates(Number.POSITIVE_INFINITY)[0];
    if (!chunk || chunk.pinned) {
      return false;
    }
    this.removeChunk(chunk, 'evict');
    return true;
  }

  /** Explicitly removes one source tile, including chunks protected against automatic eviction. */
  remove(target: SplatResidencyTarget): boolean {
    const chunk = this.resolveChunk(target);
    if (!chunk) {
      return false;
    }
    this.removeChunk(chunk, 'remove');
    return true;
  }

  /** Removes the least valuable unpinned chunks until every active residency budget is met. */
  trim(): number {
    let removedChunkCount = 0;
    for (const chunk of this.getEvictionCandidates(Number.POSITIVE_INFINITY)) {
      if (
        !this.exceedsBudget(
          this.residentGpuByteLength + this.reservedGpuByteLength,
          this.residentSplatCount + this.reservedSplatCount,
          this.chunks.size + this.reservedChunkCount
        )
      ) {
        break;
      }
      this.removeChunk(chunk, 'budget');
      removedChunkCount++;
    }
    return removedChunkCount;
  }

  /** Removes all retained source tiles while respecting each batch's explicit ownership. */
  clear(): void {
    for (const chunk of Array.from(this.chunks.values())) {
      this.removeChunk(chunk, 'remove');
    }
  }

  /** Returns exact retained GPU allocations, source boundaries, budgets, and eviction counts. */
  getStats(): SplatResidencyStats {
    return {
      residentChunkCount: this.chunks.size,
      residentSplatCount: this.residentSplatCount,
      residentGpuByteLength: this.residentGpuByteLength,
      pinnedChunkCount: this.pinnedChunkCount,
      pendingChunkCount: this.pendingLoads.size,
      evictedChunkCount: this.evictedChunkCount,
      rejectedChunkCount: this.rejectedChunkCount,
      maxGpuBytes: this.maxGpuBytes,
      maxResidentSplats: this.maxResidentSplats,
      maxResidentChunks: this.maxResidentChunks,
      overBudget: this.exceedsBudget(
        this.residentGpuByteLength,
        this.residentSplatCount,
        this.chunks.size
      )
    };
  }

  /** Releases retained source metadata and only source batches explicitly owned by this manager. */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;
    this.pendingLoads.clear();
    for (const chunk of Array.from(this.chunks.values())) {
      this.removeChunk(chunk, 'destroy');
    }
  }

  private resolveChunk(target: SplatResidencyTarget): SplatResidencyChunk | undefined {
    if (typeof target === 'string') {
      return this.chunks.get(target);
    }
    if ('data' in target) {
      const retainedChunk = this.chunks.get(target.id);
      return retainedChunk === target ? retainedChunk : undefined;
    }
    return this.chunksByData.get(target);
  }

  private reserveLoad(
    options: Omit<SplatResidencyChunkOptions, 'id'>
  ): SplatResidencyReservation | undefined {
    const reservation: SplatResidencyReservation = {
      gpuByteLength: Math.max(0, options.estimatedGpuBytes ?? 0),
      splatCount: Math.max(0, options.estimatedSplatCount ?? 0),
      released: false
    };
    let prospectiveByteLength =
      this.residentGpuByteLength + this.reservedGpuByteLength + reservation.gpuByteLength;
    let prospectiveSplatCount =
      this.residentSplatCount + this.reservedSplatCount + reservation.splatCount;
    let prospectiveChunkCount = this.chunks.size + this.reservedChunkCount + 1;
    const evictedChunks: SplatResidencyChunk[] = [];

    if (this.exceedsBudget(prospectiveByteLength, prospectiveSplatCount, prospectiveChunkCount)) {
      for (const candidate of this.getEvictionCandidates(options.priority ?? 0)) {
        if (
          !this.exceedsBudget(prospectiveByteLength, prospectiveSplatCount, prospectiveChunkCount)
        ) {
          break;
        }
        prospectiveByteLength -= candidate.byteLength;
        prospectiveSplatCount -= candidate.splatCount;
        prospectiveChunkCount--;
        evictedChunks.push(candidate);
      }
    }

    if (this.exceedsBudget(prospectiveByteLength, prospectiveSplatCount, prospectiveChunkCount)) {
      return undefined;
    }

    this.reservedGpuByteLength += reservation.gpuByteLength;
    this.reservedSplatCount += reservation.splatCount;
    this.reservedChunkCount++;
    for (const candidate of evictedChunks) {
      this.removeChunk(candidate, 'budget');
    }
    return reservation;
  }

  private releaseReservation(reservation: SplatResidencyReservation): void {
    if (reservation.released) {
      return;
    }
    reservation.released = true;
    this.reservedGpuByteLength -= reservation.gpuByteLength;
    this.reservedSplatCount -= reservation.splatCount;
    this.reservedChunkCount--;
  }

  private updateChunk(chunk: SplatResidencyChunk, options: SplatResidencyChunkOptions): void {
    if (options.priority !== undefined) {
      chunk.priority = options.priority;
    }
    if (options.pinned !== undefined) {
      if (chunk.pinned !== options.pinned) {
        this.pinnedChunkCount += options.pinned ? 1 : -1;
      }
      chunk.pinned = options.pinned;
    }
    if (options.levelOfDetail !== undefined) {
      chunk.levelOfDetail = options.levelOfDetail;
    }
    if (options.bounds !== undefined) {
      chunk.bounds = options.bounds;
    }
    if (options.ownsData !== undefined) {
      chunk.ownsData = options.ownsData;
    }
    chunk.lastUsed = ++this.accessCounter;
    if (!chunk.pinned) {
      this.trim();
    }
  }

  private getEvictionCandidates(
    maximumPriority: number,
    excludedChunk?: SplatResidencyChunk
  ): SplatResidencyChunk[] {
    return Array.from(this.chunks.values())
      .filter(
        chunk => chunk !== excludedChunk && !chunk.pinned && chunk.priority <= maximumPriority
      )
      .sort(
        (firstChunk, secondChunk) =>
          firstChunk.priority - secondChunk.priority ||
          firstChunk.lastUsed - secondChunk.lastUsed ||
          firstChunk.id.localeCompare(secondChunk.id)
      );
  }

  private exceedsBudget(byteLength: number, splatCount: number, chunkCount: number): boolean {
    return (
      byteLength > this.maxGpuBytes ||
      splatCount > this.maxResidentSplats ||
      chunkCount > this.maxResidentChunks
    );
  }

  private removeChunk(chunk: SplatResidencyChunk, reason: SplatResidencyEvictionReason): void {
    if (this.chunks.get(chunk.id) !== chunk) {
      return;
    }
    this.chunks.delete(chunk.id);
    this.chunksByData.delete(chunk.data);
    this.residentGpuByteLength -= chunk.byteLength;
    this.residentSplatCount -= chunk.splatCount;
    if (chunk.pinned) {
      this.pinnedChunkCount--;
    }
    if (reason === 'budget' || reason === 'evict') {
      this.evictedChunkCount++;
    }
    this.callbacks.onEvict?.(chunk, reason);
    this.notifyResidencyChange();
    if (chunk.ownsData) {
      chunk.data.destroy();
    }
  }

  private notifyResidencyChange(): void {
    this.callbacks.onResidencyChange?.(this.getResidentBatches(), this.getStats());
  }
}

function getSplatResidencyChunkId(data: GPUSplatData): string {
  return `${data.sourceBatchIndex}:${data.rowIndexBase}`;
}

function normalizeSplatResidencyBudget(value?: number): number {
  return value === undefined ? Number.POSITIVE_INFINITY : Math.max(0, value);
}
