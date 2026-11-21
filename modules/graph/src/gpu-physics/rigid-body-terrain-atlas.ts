// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {getRigidBodyHeightFieldPageWords} from './rigid-body-height-field';

/** Fixed capacity for one grid size in a fused terrain atlas. */
export type GPUPhysicsTerrainAtlasPool = {
  /** Sample columns in each page. */
  width: number;
  /** Sample rows in each page. */
  height: number;
  /** Number of distinct payloads that may be resident at once. */
  pages: number;
};

/** Page capacity and live collider references across all atlas pools. */
export type GPUPhysicsTerrainAtlasStats = {
  /** Total page capacity across all grid pools, including unused pages. */
  capacityPages: number;
  /** Distinct pages with at least one live collider reference. */
  residentPages: number;
  /** Colliders referencing a page. Several colliders may count against one page. */
  residentSlots: number;
  /** GPU bytes reserved for page payloads, including vacant pages and excluding collider metadata. */
  reservedBytes: number;
  /** Payload bytes that a page per reserved collider slot would require. */
  privateSlotBytes: number;
};

/** Contiguous page range dedicated to one height-field grid size. */
type AtlasPool = {
  /** Size of one packed page in 32-bit words. */
  words: number;
  /** Number of page IDs in this range. */
  pages: number;
  /** First global page ID for the grid. */
  firstPage: number;
  /** Start of the grid range in atlas-relative 32-bit words. */
  firstWord: number;
  /** Vacant global page IDs available for reuse. */
  free: Set<number>;
  /** Live payloads grouped by hash. Exact comparison handles hash collisions. */
  byHash: Map<number, Set<AtlasPage>>;
};

/** Immutable packed terrain and the live reference count for its physical page. */
type AtlasPage = {
  /** Global page ID across grid pools. */
  index: number;
  /** Grid pool that owns the page address. */
  pool: AtlasPool;
  /** Fingerprint used to find matching payload candidates. */
  hash: number;
  /** Exact GPU sample and hierarchy payload. */
  data: Float32Array;
  /** Number of committed collider leases. */
  references: number;
};

/** Pending payload shared by edits in the same publication transaction. */
type DraftPage = {
  /** Fingerprint for matching additional edits during planning. */
  hash: number;
  /** Data to upload when the transaction commits. */
  data: Float32Array;
  /** Number of edits that will reference this page. */
  references: number;
  /** Assigned page after the fit check succeeds for its grid pool. */
  page?: AtlasPage;
};

/** One collider binding to install or remove during a transaction. */
type AtlasEdit = {
  /** Stable fused collider index. */
  collider: number;
  /** Packed data, or null to vacate the collider slot. */
  data: Float32Array | null;
};

/** Stable fused collider index paired with its global physical page ID. */
type AtlasLease = readonly [collider: number, page: number];

/** Host-side bindings preserved alongside a GPU checkpoint. */
export type RigidBodyTerrainAtlasSnapshot = {
  /** Live collider-to-page assignments in the saved GPU image. */
  leases: AtlasLease[];
  /** Immutable host payloads indexed by their saved physical page ID. */
  payloads: ReadonlyMap<number, Float32Array>;
};

/** Compute a stable grid key for pool admission and slot lookup. */
function getTerrainAtlasGridKey(width: number, height: number): string {
  return `${width}x${height}`;
}

/** Determine the exact reservation without allocating page payloads. */
export function getTerrainAtlasBytes(pools: readonly GPUPhysicsTerrainAtlasPool[]): number {
  const seen = new Set<string>();
  let total = 0;
  for (const {width, height, pages} of pools) {
    const key = getTerrainAtlasGridKey(width, height);
    if (!Number.isSafeInteger(pages) || pages < 1 || seen.has(key))
      throw new Error('Invalid terrain atlas pools');
    seen.add(key);
    total += getRigidBodyHeightFieldPageWords(width, height) * pages * 4;
  }
  // GPU metadata stores vec4 addresses as exact f32 integers.
  if (!total || total > 2 ** 28) throw new Error('Terrain atlas exceeds address capacity');
  return total;
}

/** Compare actual uploaded bits, including stitched boundary samples and grid transform. */
function equalPayload(first: Float32Array, second: Float32Array): boolean {
  if (first === second) return true;
  const firstWords = new Uint32Array(first.buffer, first.byteOffset, first.length);
  const secondWords = new Uint32Array(second.buffer, second.byteOffset, second.length);
  return (
    firstWords.length === secondWords.length &&
    firstWords.every((word, index) => word === secondWords[index])
  );
}

/** Hash the packed payload, using an exact bit comparison before sharing. */
function hashPayload(data: Float32Array): number {
  const words = new Uint32Array(data.buffer, data.byteOffset, data.length);
  let hash = 2166136261;
  for (const word of words) hash = Math.imul(hash ^ word, 16777619);
  return hash >>> 0;
}

/** Host-side reference counts for immutable GPU pages, grouped by fixed grid dimensions. */
export class RigidBodyTerrainAtlas {
  /** Fixed grid ranges keyed by dimensions. */
  private readonly pools = new Map<string, AtlasPool>();
  /** Grid range compatible with each reserved collider. */
  private readonly slotPools = new Map<number, AtlasPool>();
  /** Committed collider bindings. Vacant colliders have no lease. */
  private readonly leases = new Map<number, AtlasPage>();
  /** Referenced pages addressed by global physical ID. */
  private readonly livePages = new Map<number, AtlasPage>();
  /** Total GPU allocation in 32-bit words. */
  readonly wordLength: number;
  /** Number of available physical page IDs across the pools. */
  private readonly capacity: number;
  /** Equivalent private-slot GPU payload bytes for the reserved colliders. */
  private readonly privateSlotBytes: number;

  /** Lay out fixed grid ranges and validate that each reserved collider has a compatible pool. */
  constructor(
    pools: readonly GPUPhysicsTerrainAtlasPool[],
    slots: readonly {collider: number; width: number; height: number}[]
  ) {
    this.wordLength = getTerrainAtlasBytes(pools) / 4;
    const slotsByGrid = new Map<string, number>();
    for (const {width, height} of slots) {
      const key = getTerrainAtlasGridKey(width, height);
      slotsByGrid.set(key, (slotsByGrid.get(key) ?? 0) + 1);
    }
    let firstPage = 0;
    let firstWord = 0;
    for (const {width, height, pages} of pools) {
      const words = getRigidBodyHeightFieldPageWords(width, height);
      const key = getTerrainAtlasGridKey(width, height);
      if (pages > (slotsByGrid.get(key) ?? 0))
        throw new Error('Terrain atlas pool exceeds its reserved grid slots');
      this.pools.set(key, {
        words,
        pages,
        firstPage,
        firstWord,
        free: new Set(Array.from({length: pages}, (_, index) => firstPage + index)),
        byHash: new Map()
      });
      firstPage += pages;
      firstWord += words * pages;
    }
    this.capacity = firstPage;
    let privateSlotBytes = 0;
    for (const {collider, width, height} of slots) {
      const pool = this.pools.get(getTerrainAtlasGridKey(width, height));
      if (!pool) throw new Error('Missing terrain atlas pool for a reserved grid');
      this.slotPools.set(collider, pool);
      privateSlotBytes += pool.words * 4;
    }
    this.privateSlotBytes = privateSlotBytes;
  }

  /** Plan and validate the full batch before changing leases or allocating page IDs. */
  bind(edits: readonly AtlasEdit[]): {
    /** Atlas-relative addresses in 32-bit words for the edited colliders that have data. */
    wordsByCollider: ReadonlyMap<number, number>;
    /** Newly installed payloads and their atlas-relative offsets in 32-bit words. */
    uploads: readonly {word: number; data: Float32Array}[];
  } {
    const deltas = new Map<AtlasPage, number>();
    const drafts = new Map<AtlasPool, Map<number, DraftPage[]>>();
    const bindings = new Map<number, AtlasPage | DraftPage>();
    const edited = new Set<number>();
    const hashes = new Map<Float32Array, number>();
    /** Stage reference changes without writing to the live page table. */
    const addDelta = (page: AtlasPage, delta: number) =>
      deltas.set(page, (deltas.get(page) ?? 0) + delta);

    for (const {collider, data} of edits) {
      const pool = this.slotPools.get(collider);
      if (!pool || edited.has(collider) || (data && data.length !== pool.words))
        throw new Error('Invalid terrain atlas edit');
      edited.add(collider);
      const oldPage = this.leases.get(collider);
      if (oldPage) addDelta(oldPage, -1);
      if (!data) continue;
      const hash = hashes.get(data) ?? hashPayload(data);
      hashes.set(data, hash);
      const match = Array.from(pool.byHash.get(hash) ?? []).find(page =>
        equalPayload(page.data, data)
      );
      if (match) {
        bindings.set(collider, match);
        addDelta(match, 1);
        continue;
      }
      let hashed = drafts.get(pool);
      if (!hashed) {
        hashed = new Map();
        drafts.set(pool, hashed);
      }
      let pages = hashed.get(hash);
      if (!pages) {
        pages = [];
        hashed.set(hash, pages);
      }
      let draft = pages.find(page => equalPayload(page.data, data));
      if (!draft) {
        draft = {hash, data, references: 0};
        pages.push(draft);
      }
      draft.references++;
      bindings.set(collider, draft);
    }

    const retired = new Map<AtlasPool, AtlasPage[]>();
    for (const [page, delta] of deltas) {
      if (page.references + delta !== 0) continue;
      let pages = retired.get(page.pool);
      if (!pages) {
        pages = [];
        retired.set(page.pool, pages);
      }
      pages.push(page);
    }
    const installed: AtlasPage[] = [];
    for (const [pool, hashed] of drafts) {
      const vacant = pool.free.values();
      const reusable = retired.get(pool)?.values();
      for (const pages of hashed.values()) {
        for (const draft of pages) {
          const index = vacant.next().value ?? reusable?.next().value?.index;
          if (index === undefined) throw new Error('Terrain atlas page capacity exhausted');
          draft.page = {
            index,
            pool,
            hash: draft.hash,
            data: draft.data,
            references: draft.references
          };
          installed.push(draft.page);
        }
      }
    }

    // The remaining work cannot fail because dimensions, reference counts and capacity are known.
    for (const [page, delta] of deltas) page.references += delta;
    for (const pages of retired.values()) {
      for (const page of pages) {
        const matches = page.pool.byHash.get(page.hash)!;
        matches.delete(page);
        if (!matches.size) page.pool.byHash.delete(page.hash);
        page.pool.free.add(page.index);
        this.livePages.delete(page.index);
      }
    }
    for (const page of installed) this.install(page);
    for (const collider of edited) this.leases.delete(collider);
    const wordsByCollider = new Map<number, number>();
    for (const [collider, binding] of bindings) {
      const page = 'index' in binding ? binding : binding.page!;
      this.leases.set(collider, page);
      wordsByCollider.set(collider, this.getPageWord(page.pool, page.index));
    }
    return {
      wordsByCollider,
      uploads: installed.map(page => ({
        word: this.getPageWord(page.pool, page.index),
        data: page.data
      }))
    };
  }

  /** Copy the exact live bindings without duplicating the sample payloads. */
  getLeases(): AtlasLease[] {
    return Array.from(this.leases, ([collider, page]) => [collider, page.index]);
  }

  /** Snapshot immutable payload references and the exact leases restored with the GPU image. */
  snapshot(): RigidBodyTerrainAtlasSnapshot {
    return {
      leases: this.getLeases(),
      payloads: new Map(Array.from(this.livePages, ([index, page]) => [index, page.data]))
    };
  }

  /** Preserve exact page IDs when a CPU capture provides the original allocator assignment. */
  restore(
    leases: readonly AtlasLease[],
    readPage: (word: number, words: number, pageIndex: number) => Float32Array,
    validateLease?: (collider: number, word: number) => void
  ): void {
    const pages = new Map<number, AtlasPage>();
    const restored = new Map<number, AtlasPage>();
    for (const [collider, index] of leases) {
      const pool = this.slotPools.get(collider);
      if (
        !pool ||
        !Number.isInteger(index) ||
        index < pool.firstPage ||
        index >= pool.firstPage + pool.pages ||
        restored.has(collider)
      )
        throw new Error('Invalid captured terrain atlas lease');
      const word = this.getPageWord(pool, index);
      validateLease?.(collider, word);
      let page = pages.get(index);
      if (!page) {
        const data = readPage(word, pool.words, index);
        if (data.length !== pool.words) throw new Error('Invalid captured terrain atlas page');
        page = {index, pool, data, hash: hashPayload(data), references: 0};
        pages.set(index, page);
      }
      page.references++;
      restored.set(collider, page);
    }
    for (const page of this.livePages.values()) page.pool.free.add(page.index);
    for (const pool of this.pools.values()) pool.byHash.clear();
    this.livePages.clear();
    this.leases.clear();
    for (const page of pages.values()) this.install(page);
    for (const [collider, page] of restored) this.leases.set(collider, page);
  }

  /** Read occupancy without touching GPU buffers or packing terrain again. */
  getStats(): GPUPhysicsTerrainAtlasStats {
    return {
      capacityPages: this.capacity,
      residentPages: this.livePages.size,
      residentSlots: this.leases.size,
      reservedBytes: this.wordLength * 4,
      privateSlotBytes: this.privateSlotBytes
    };
  }

  /** Translate a physical page ID to its atlas-relative address in 32-bit words. */
  private getPageWord(pool: AtlasPool, index: number): number {
    return pool.firstWord + (index - pool.firstPage) * pool.words;
  }

  /** Mark a live page occupied and index it for matching future payloads. */
  private install(page: AtlasPage): void {
    let matches = page.pool.byHash.get(page.hash);
    if (!matches) {
      matches = new Set();
      page.pool.byHash.set(page.hash, matches);
    }
    matches.add(page);
    page.pool.free.delete(page.index);
    this.livePages.set(page.index, page);
  }
}
