// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';

export type GPULidarTileCacheSnapshot = {
  positions: Float32Array;
  attributes: Uint32Array;
};

type LidarTile = GPULidarTileCacheSnapshot;

/** Bounded least-recently-used LAZ tile cache backed by one directly renderable GPU atlas. */
export class GPULidarTileCache {
  readonly positionsBuffer: Buffer;
  readonly attributesBuffer: Buffer;

  private readonly pointCapacity: number;
  private readonly tiles = new Map<string, LidarTile>();
  private residentPointCount = 0;
  private destroyed = false;

  get pointCount(): number {
    return this.residentPointCount;
  }

  get tileCount(): number {
    return this.tiles.size;
  }

  constructor(device: Device, pointCapacity: number) {
    this.pointCapacity = pointCapacity;
    this.positionsBuffer = device.createBuffer({
      id: 'spatial-atlas-lidar-lru',
      byteLength: Math.max(
        Float32Array.BYTES_PER_ELEMENT * 3,
        pointCapacity * 3 * Float32Array.BYTES_PER_ELEMENT
      ),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.attributesBuffer = device.createBuffer({
      id: 'spatial-atlas-lidar-lru-attributes',
      byteLength: Math.max(
        Uint32Array.BYTES_PER_ELEMENT,
        pointCapacity * Uint32Array.BYTES_PER_ELEMENT
      ),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
  }

  insert(key: string, sourcePositions: Float32Array, sourceAttributes: Uint32Array): void {
    if (this.destroyed) return;
    const positions =
      sourcePositions.length / 3 > this.pointCapacity
        ? sourcePositions.slice(0, this.pointCapacity * 3)
        : sourcePositions;
    const pointCount = positions.length / 3;
    const attributes =
      sourceAttributes.length === pointCount
        ? sourceAttributes
        : sourceAttributes.slice(0, pointCount);
    const existing = this.tiles.get(key);
    if (existing) {
      this.residentPointCount -= existing.positions.length / 3;
      this.tiles.delete(key);
    }
    while (
      this.tiles.size > 0 &&
      this.residentPointCount + positions.length / 3 > this.pointCapacity
    ) {
      const oldestEntry = this.tiles.entries().next().value;
      if (!oldestEntry) break;
      const [oldestKey, oldest] = oldestEntry;
      this.tiles.delete(oldestKey);
      this.residentPointCount -= oldest.positions.length / 3;
    }
    this.tiles.set(key, {positions, attributes});
    this.residentPointCount += positions.length / 3;
  }

  getPointCount(key: string): number {
    return (this.tiles.get(key)?.positions.length ?? 0) / 3;
  }

  touch(key: string): void {
    const tile = this.tiles.get(key);
    if (!tile) return;
    this.tiles.delete(key);
    this.tiles.set(key, tile);
  }

  retain(keys: ReadonlySet<string>): boolean {
    let changed = false;
    for (const [key, tile] of this.tiles) {
      if (!keys.has(key)) {
        this.tiles.delete(key);
        this.residentPointCount -= tile.positions.length / 3;
        changed = true;
      }
    }
    return changed;
  }

  getSnapshot(): GPULidarTileCacheSnapshot {
    const positions = new Float32Array(this.residentPointCount * 3);
    const attributes = new Uint32Array(this.residentPointCount);
    let pointOffset = 0;
    for (const tile of this.tiles.values()) {
      positions.set(tile.positions, pointOffset * 3);
      attributes.set(tile.attributes, pointOffset);
      pointOffset += tile.positions.length / 3;
    }
    return {positions, attributes};
  }

  synchronize(): GPULidarTileCacheSnapshot {
    const snapshot = this.getSnapshot();
    if (snapshot.positions.length > 0) this.positionsBuffer.write(snapshot.positions);
    if (snapshot.attributes.length > 0) this.attributesBuffer.write(snapshot.attributes);
    return snapshot;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.positionsBuffer.destroy();
    this.attributesBuffer.destroy();
    this.tiles.clear();
    this.residentPointCount = 0;
  }
}
