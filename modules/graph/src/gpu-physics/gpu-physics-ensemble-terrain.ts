// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPURigidBodyTerrainStream,
  RigidBodyTerrainLoadQueue,
  type GPURigidBodyTerrainStreamProps,
  type GPURigidBodyTerrainWindow
} from './rigid-body-terrain-stream';
import type {GPURigidBodyHeightFieldEdit} from './gpu-rigid-body-world';
import type {GPURigidBodyTerrainTile} from './rigid-body-terrain-stitch';

type TerrainPublication = {
  instance: number;
  edits: readonly GPURigidBodyHeightFieldEdit[];
};

/** Independent local terrain windows with one provider queue for a fused ensemble. */
export class GPUPhysicsEnsembleTerrain {
  private readonly streams = new Map<number, GPURigidBodyTerrainStream>();
  private readonly slots: ReadonlySet<number>;
  private readonly loads: RigidBodyTerrainLoadQueue;

  /** @internal Create with GPUPhysicsEnsemble.createTerrainStreamer(). */
  constructor(
    private readonly props: GPURigidBodyTerrainStreamProps,
    slots: readonly number[],
    private readonly validateInstance: (instance: number) => void,
    private readonly publish: (windows: readonly TerrainPublication[]) => void
  ) {
    this.slots = new Set(slots);
    this.loads = new RigidBodyTerrainLoadQueue(props);
  }

  /** Stage an instance's complete window using template-local collider indices. */
  async prepare(instance: number, window: GPURigidBodyTerrainWindow): Promise<boolean> {
    this.validateInstance(instance);
    if (window.tiles.some(({collider}) => !this.slots.has(collider)))
      throw new Error('Invalid ensemble terrain slot');
    let stream = this.streams.get(instance);
    if (!stream) {
      stream = new GPURigidBodyTerrainStream(
        {setHeightFieldTiles: edits => this.publish([{instance, edits}])},
        this.props,
        this.loads
      );
      this.streams.set(instance, stream);
    }
    return stream.prepare(window);
  }

  /** Apply only this instance's staged window between fused graph submissions. */
  apply(instance: number): boolean {
    this.validateInstance(instance);
    return this.streams.get(instance)?.apply() ?? false;
  }

  /**
   * Publish all ready windows in one transaction. Instances without a ready window are skipped.
   * Use this for a shared-atlas handoff when the last users of an old page move together.
   */
  applyMany(instances: readonly number[]): number {
    const windows: TerrainPublication[] = [];
    const streams: GPURigidBodyTerrainStream[] = [];
    for (const instance of new Set(instances)) {
      this.validateInstance(instance);
      const stream = this.streams.get(instance);
      const edits = stream?.getPreparedEdits();
      if (stream && edits) {
        windows.push({instance, edits});
        streams.push(stream);
      }
    }
    if (windows.some(({edits}) => edits.length)) this.publish(windows);
    for (const stream of streams) stream.commitPreparedWindow();
    return streams.length;
  }

  /** Get the number of committed tiles in the selected instance. */
  getResidentTileCount(instance: number): number {
    this.validateInstance(instance);
    return this.streams.get(instance)?.residentTileCount ?? 0;
  }

  /** Read a detached stitched surface from a template-local collider slot. */
  getTile(instance: number, collider: number): GPURigidBodyTerrainTile | null {
    this.validateInstance(instance);
    if (!this.slots.has(collider)) throw new Error('Invalid ensemble terrain slot');
    return this.streams.get(instance)?.getTile(collider) ?? null;
  }

  /** Drop staged and pending requests for this instance, keeping its committed surfaces. */
  cancel(instance: number): void {
    this.validateInstance(instance);
    this.streams.get(instance)?.cancel();
  }

  /** Evict every stream-owned tile in this instance between submissions. */
  clear(instance: number): void {
    this.validateInstance(instance);
    this.streams.get(instance)?.clear();
    this.streams.delete(instance);
  }

  /** @internal Cancel outstanding provider demand when the parent ensemble is destroyed. */
  release(): void {
    for (const stream of this.streams.values()) stream.release();
    this.streams.clear();
  }
}
