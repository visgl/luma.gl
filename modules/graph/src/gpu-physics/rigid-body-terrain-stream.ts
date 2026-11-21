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

/** Bounded provider fetching with an explicit publication boundary between GPU submissions. */
export class GPURigidBodyTerrainStream {
  /** Active provider work, including requests that are still finishing after cancellation. */
  private readonly running = new Set<Promise<void>>();
  /** Shared concurrency limit. */
  private readonly maximumConcurrentLoads: number;
  /** Last request, used to ignore late completions. */
  private controller?: AbortController;
  /** Fully fetched and stitched window waiting for publication. */
  private ready?: ResidentWindow;
  /** Current stream-owned collider contents. */
  private resident: ResidentWindow = {keys: new Map(), source: new Map(), stitched: new Map()};

  /** Create a streamer that borrows a world's fixed slots and owns its provider requests. */
  constructor(
    private readonly world: Pick<GPURigidBodyWorld, 'setHeightFieldTiles'>,
    private readonly props: GPURigidBodyTerrainStreamProps
  ) {
    this.maximumConcurrentLoads = props.maximumConcurrentLoads ?? 4;
    if (!Number.isSafeInteger(this.maximumConcurrentLoads) || this.maximumConcurrentLoads < 1)
      throw new Error('Invalid terrain provider concurrency');
  }

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

    this.cancel();
    const controller = new AbortController();
    this.controller = controller;
    const signal = controller.signal;
    const cancellation = new Promise<false>(resolve => {
      signal.addEventListener('abort', () => resolve(false), {once: true});
    });
    // Capture this revision's cache so a later publication cannot change the selected source.
    const residentSources = this.resident.source;
    const loadWindow = async (): Promise<boolean> => {
      const source = new Map<string, GPURigidBodyTerrainTile>();
      const missing: string[] = [];
      for (const key of new Set(keys.values())) {
        const cached = residentSources.get(key);
        if (cached) source.set(key, cached);
        else missing.push(key);
      }
      let nextTile = 0;
      /** Take the next key only when this worker is free. */
      const loadNext = async () => {
        while (!signal.aborted && nextTile < missing.length) {
          const key = missing[nextTile++];
          const tile = await this.loadTile(key, signal, cancellation);
          source.set(key, tile);
        }
      };
      await Promise.all(
        Array.from({length: Math.min(missing.length, this.maximumConcurrentLoads)}, loadNext)
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
      controller.abort();
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
  }

  /** Release stream-owned slots after canceling fetches. Call between submissions. */
  clear(): void {
    this.cancel();
    const edits = Array.from(this.resident.stitched.keys(), collider => ({collider, field: null}));
    if (edits.length) this.world.setHeightFieldTiles(edits);
    this.resident = {keys: new Map(), source: new Map(), stitched: new Map()};
  }

  /** Keep the provider concurrency bound even if an aborted provider ignores its signal. */
  private async loadTile(
    key: string,
    signal: AbortSignal,
    cancellation: Promise<false>
  ): Promise<GPURigidBodyTerrainTile> {
    while (this.running.size >= this.maximumConcurrentLoads && !signal.aborted)
      await Promise.race([...this.running, cancellation]);
    signal.throwIfAborted();
    const loading = Promise.resolve().then(() => {
      signal.throwIfAborted();
      return this.props.provider.loadTile(key, signal);
    });
    const settled = loading.then(
      () => {},
      () => {}
    );
    this.running.add(settled);
    try {
      return structuredClone(await loading);
    } finally {
      this.running.delete(settled);
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
