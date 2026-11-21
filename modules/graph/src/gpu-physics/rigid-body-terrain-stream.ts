// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPURigidBodyWorld, GPURigidBodyHeightFieldEdit} from './gpu-rigid-body-world';
import {
  stitchRigidBodyTerrainTiles,
  type GPURigidBodyTerrainSeam,
  type GPURigidBodyTerrainTile
} from './rigid-body-terrain-stitch';

/** Fetch and decode a tile by an application-defined revisioned key. */
export type GPURigidBodyTerrainProvider = {
  /** Resolve a detached tile in the shared collider frame. Honor signal for prompt cancellation. */
  loadTile(key: string, signal: AbortSignal): Promise<GPURigidBodyTerrainTile>;
};

/** URL resolver and decoder used by the standard fetch provider. */
export type GPURigidBodyTerrainFetchProps = {
  /** Resolve a revisioned tile key to a request URL. */
  getTileUrl: (key: string) => string | URL;
  /** Decode the response into a native field and metric placement. */
  decode: (
    response: Response,
    key: string,
    signal: AbortSignal
  ) => Promise<GPURigidBodyTerrainTile>;
  /** Optional transport for applications with custom request policy. */
  fetch?: typeof globalThis.fetch;
};

/** Load HTTP tiles with the stream's cancellation signal and a caller-supplied decoder. */
export function makeRigidBodyTerrainFetchProvider(
  props: GPURigidBodyTerrainFetchProps
): GPURigidBodyTerrainProvider {
  return {
    async loadTile(key, signal) {
      const response = await (props.fetch ?? globalThis.fetch)(props.getTileUrl(key), {signal});
      if (!response.ok) throw new Error(`Terrain request failed with HTTP ${response.status}`);
      signal.throwIfAborted();
      return props.decode(response, key, signal);
    }
  };
}

/** One requested tile and its reserved native height-field slot. */
export type GPURigidBodyTerrainSlot = {
  /** Collider receiving the tile. */
  collider: number;
  /** Stable content key, including revision if tiles can change. */
  key: string;
};

/** Complete desired residency and the edges to reconcile before publication. */
export type GPURigidBodyTerrainWindow = {
  /** Requested tiles across all slots owned by this stream. */
  tiles: readonly GPURigidBodyTerrainSlot[];
  /** Explicit collinear neighbors in the supplied frame. */
  seams?: readonly GPURigidBodyTerrainSeam[];
};

/** Stream settings. */
export type GPURigidBodyTerrainStreamProps = {
  /** Data source for loading native fields. */
  provider: GPURigidBodyTerrainProvider;
  /** Upper bound shared across current and superseded windows. Defaults to four. */
  maximumConcurrentLoads?: number;
};

/** Prepared or committed provider data, including the unmodified seam sources. */
type ResidentWindow = {
  keys: Map<number, string>;
  source: Map<string, GPURigidBodyTerrainTile>;
  stitched: ReadonlyMap<number, GPURigidBodyTerrainTile>;
};

/** A revisioned request that may be queued, active, or retained for publication. */
type TileLoad = {
  controller: AbortController;
  tile: Promise<GPURigidBodyTerrainTile>;
  resolve: (tile: GPURigidBodyTerrainTile) => void;
  reject: (error: unknown) => void;
};

/** Bounded provider fetching with an explicit publication boundary between GPU submissions. */
export class GPURigidBodyTerrainStream {
  /** Last request, used to ignore late completions. */
  private controller?: AbortController;
  /** Fully fetched and stitched window waiting for publication. */
  private ready?: ResidentWindow;
  /** Current stream-owned collider contents. */
  private resident: ResidentWindow = {keys: new Map(), source: new Map(), stitched: new Map()};

  /** Create a streamer that borrows a world's fixed slots and owns its provider requests. */
  constructor(
    private readonly world: Pick<GPURigidBodyWorld, 'setHeightFieldTiles'>,
    props: GPURigidBodyTerrainStreamProps,
    /** @internal One queue can serve multiple independent residency windows. */
    private readonly loadQueue = new RigidBodyTerrainLoadQueue(props)
  ) {}

  /** Stage the latest window. False indicates a newer window or cancellation superseded it. */
  async prepare(window: GPURigidBodyTerrainWindow): Promise<boolean> {
    const keys = new Map<number, string>();
    for (const {collider, key} of window.tiles) {
      if (!Number.isSafeInteger(collider) || collider < 0 || keys.has(collider) || !key)
        throw new Error('Invalid terrain window slot');
      keys.set(collider, key);
    }
    const seams = window.seams?.map(seam => ({...seam})) ?? [];
    for (const seam of seams)
      if (!keys.has(seam.first) || !keys.has(seam.second))
        throw new Error('Terrain seam references an absent slot');

    this.controller?.abort();
    this.ready = undefined;
    const required = new Set(keys.values());
    this.loadQueue.setDemand(this, new Set([...this.resident.source.keys(), ...required]));
    const controller = new AbortController();
    this.controller = controller;
    const signal = controller.signal;
    const cancellation = new Promise<false>(resolve => {
      signal.addEventListener('abort', () => resolve(false), {once: true});
    });
    // Capture this revision's cache so a later publication cannot change the selected source.
    const residentSources = this.resident.source;
    const loadWindow = async (): Promise<boolean> => {
      const source = new Map(
        await Promise.all(
          [...required].map(
            async key =>
              [key, residentSources.get(key) ?? (await this.loadQueue.getLoad(key))] as const
          )
        )
      );
      if (signal.aborted) return false;
      const tiles = new Map(Array.from(keys, ([collider, key]) => [collider, source.get(key)!]));
      const stitched = stitchRigidBodyTerrainTiles(tiles, seams);
      this.ready = {keys, source, stitched};
      return true;
    };
    try {
      return await Promise.race([loadWindow(), cancellation]);
    } catch (error) {
      if (signal.aborted) return false;
      this.cancel();
      throw error;
    } finally {
      if (this.controller === controller) this.controller = undefined;
    }
  }

  /** Publish the fully staged window between submissions. Preserve it if upload validation fails. */
  apply(): boolean {
    const ready = this.ready;
    if (!ready) return false;
    const edits: GPURigidBodyHeightFieldEdit[] = [];
    for (const collider of this.resident.stitched.keys()) {
      if (!ready.keys.has(collider)) edits.push({collider, field: null});
    }
    for (const [collider, tile] of ready.stitched) {
      const previous = this.resident.stitched.get(collider);
      const keyChanged = this.resident.keys.get(collider) !== ready.keys.get(collider);
      if (keyChanged || !sameStitchedSamples(previous, tile))
        edits.push({collider, field: tile.field, position: tile.position});
    }
    if (edits.length) this.world.setHeightFieldTiles(edits);
    this.resident = ready;
    this.ready = undefined;
    this.loadQueue.setDemand(this, new Set(ready.source.keys()));
    return true;
  }

  /** Number of slots in the committed window. */
  get residentTileCount(): number {
    return this.resident.keys.size;
  }

  /** Read a detached copy of the collider's currently committed and stitched tile. */
  getTile(collider: number): GPURigidBodyTerrainTile | null {
    const tile = this.resident.stitched.get(collider);
    return tile ? structuredClone(tile) : null;
  }

  /** Cancel pending work and discard unapplied data. */
  cancel(): void {
    this.controller?.abort();
    this.controller = undefined;
    this.ready = undefined;
    this.loadQueue.setDemand(this, new Set(this.resident.source.keys()));
  }

  /** Release stream-owned slots after canceling fetches. Call between submissions. */
  clear(): void {
    this.cancel();
    const edits = Array.from(this.resident.stitched.keys(), collider => ({collider, field: null}));
    if (edits.length) this.world.setHeightFieldTiles(edits);
    this.release();
  }

  /** @internal Forget the window after its world has taken over resource disposal. */
  release(): void {
    this.cancel();
    this.loadQueue.setDemand(this, new Set());
    this.resident = {keys: new Map(), source: new Map(), stitched: new Map()};
  }
}

/** @internal Shared, ref-counted provider requests across independent windows. */
export class RigidBodyTerrainLoadQueue {
  /** Active provider work, including aborted requests that have not settled. */
  private activeLoads = 0;
  /** Requests retained by the latest window, including completed but unapplied data. */
  private readonly loads = new Map<string, TileLoad>();
  /** Pending provider work in submission order. */
  private readonly queued = new Map<string, TileLoad>();
  /** Shared concurrency limit. */
  private readonly maximumConcurrentLoads: number;
  private readonly demands = new Map<object, ReadonlySet<string>>();
  private readonly references = new Map<string, number>();

  constructor(private readonly props: GPURigidBodyTerrainStreamProps) {
    this.maximumConcurrentLoads = props.maximumConcurrentLoads ?? 4;
    if (!Number.isSafeInteger(this.maximumConcurrentLoads) || this.maximumConcurrentLoads < 1)
      throw new Error('Invalid terrain provider concurrency');
  }

  /** Replace one owner's demand while keeping shared requests and resident content alive. */
  setDemand(owner: object, keys: ReadonlySet<string>): void {
    const previous = this.demands.get(owner);
    for (const key of keys)
      if (!previous?.has(key)) this.references.set(key, (this.references.get(key) ?? 0) + 1);
    for (const key of previous ?? []) {
      if (keys.has(key)) continue;
      const remaining = this.references.get(key)! - 1;
      if (remaining) {
        this.references.set(key, remaining);
      } else {
        this.references.delete(key);
        const load = this.loads.get(key);
        if (load) this.abortLoad(load);
        this.loads.delete(key);
        this.queued.delete(key);
      }
    }
    if (keys.size) this.demands.set(owner, keys);
    else this.demands.delete(owner);
  }

  /** Reuse the same fetch when a superseding window still needs its revisioned key. */
  getLoad(key: string): Promise<GPURigidBodyTerrainTile> {
    const retained = this.loads.get(key);
    if (retained) return retained.tile;
    let resolve!: TileLoad['resolve'];
    let reject!: TileLoad['reject'];
    const tile = new Promise<GPURigidBodyTerrainTile>((resolveTile, rejectTile) => {
      resolve = resolveTile;
      reject = rejectTile;
    });
    const load = {controller: new AbortController(), tile, resolve, reject};
    this.loads.set(key, load);
    this.queued.set(key, load);
    this.startQueuedLoads();
    return tile;
  }

  /** Release the waiting window promptly while retaining the active capacity reservation. */
  private abortLoad(load: TileLoad): void {
    load.controller.abort();
    load.reject(load.controller.signal.reason);
  }

  /** Only active provider work consumes concurrency, even if the provider ignores abort. */
  private startQueuedLoads(): void {
    for (const [key, load] of this.queued) {
      if (this.activeLoads >= this.maximumConcurrentLoads) break;
      this.queued.delete(key);
      this.activeLoads++;
      const {signal} = load.controller;
      void Promise.resolve()
        .then(() => {
          signal.throwIfAborted();
          return this.props.provider.loadTile(key, signal);
        })
        .then(tile => load.resolve(structuredClone(tile)))
        .catch(error => {
          if (this.loads.get(key) === load) this.loads.delete(key);
          load.reject(error);
        })
        .finally(() => {
          this.activeLoads--;
          this.startQueuedLoads();
        });
    }
  }
}

/** For the same raw tile, only stitched seam heights can differ. */
function sameStitchedSamples(
  previous: GPURigidBodyTerrainTile | undefined,
  next: GPURigidBodyTerrainTile
): boolean {
  if (previous === next) return true;
  const first = previous?.field.heights;
  const second = next.field.heights;
  return (
    first?.length === second?.length &&
    (!first || first.every((value, index) => Object.is(value, second![index])))
  );
}
