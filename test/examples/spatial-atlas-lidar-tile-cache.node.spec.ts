// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {describe, expect, test} from 'vitest';
import {GPULidarTileCache} from '../../examples/showcase/billion-point-spatial-atlas/lidar-tile-cache';

type FakeBufferProperties = {
  id?: string;
  byteLength: number;
  usage?: number;
};

class FakeBuffer {
  readonly writes: (Float32Array | Uint32Array)[] = [];
  destroyCount = 0;

  constructor(readonly properties: FakeBufferProperties) {}

  write(data: Float32Array | Uint32Array): void {
    this.writes.push(data instanceof Float32Array ? new Float32Array(data) : new Uint32Array(data));
  }

  destroy(): void {
    this.destroyCount++;
  }
}

class FakeDevice {
  readonly buffers: FakeBuffer[] = [];

  createBuffer(properties: FakeBufferProperties): FakeBuffer {
    const buffer = new FakeBuffer(properties);
    this.buffers.push(buffer);
    return buffer;
  }
}

function makeCache(pointCapacity: number): {
  cache: GPULidarTileCache;
  positionsBuffer: FakeBuffer;
  attributesBuffer: FakeBuffer;
} {
  const device = new FakeDevice();
  const cache = new GPULidarTileCache(device as unknown as Device, pointCapacity);
  const positionsBuffer = device.buffers[0];
  const attributesBuffer = device.buffers[1];
  if (!positionsBuffer || !attributesBuffer) {
    throw new Error('GPULidarTileCache must allocate its position and attribute buffers');
  }
  return {
    cache,
    positionsBuffer,
    attributesBuffer
  };
}

function makePositions(...pointIdentifiers: number[]): Float32Array {
  return new Float32Array(
    pointIdentifiers.flatMap(pointIdentifier => [
      pointIdentifier,
      pointIdentifier + 0.25,
      -pointIdentifier
    ])
  );
}

describe('GPULidarTileCache', () => {
  test('inserts tiles and reports their resident rows', () => {
    const {cache, positionsBuffer, attributesBuffer} = makeCache(5);

    cache.insert('west', makePositions(1, 2), new Uint32Array([101, 102]));
    cache.insert('east', makePositions(3), new Uint32Array([103]));

    expect(cache.pointCount).toBe(3);
    expect(cache.tileCount).toBe(2);
    expect(cache.getPointCount('west')).toBe(2);
    expect(cache.getPointCount('east')).toBe(1);
    expect(cache.getPointCount('missing')).toBe(0);
    expect(cache.getSnapshot()).toEqual({
      positions: makePositions(1, 2, 3),
      attributes: new Uint32Array([101, 102, 103])
    });
    expect(positionsBuffer.properties).toMatchObject({
      id: 'spatial-atlas-lidar-lru',
      byteLength: 5 * 3 * Float32Array.BYTES_PER_ELEMENT
    });
    expect(attributesBuffer.properties).toMatchObject({
      id: 'spatial-atlas-lidar-lru-attributes',
      byteLength: 5 * Uint32Array.BYTES_PER_ELEMENT
    });
  });

  test('touches a tile before evicting the least-recently-used tile', () => {
    const {cache} = makeCache(4);
    cache.insert('oldest', makePositions(1, 2), new Uint32Array([11, 12]));
    cache.insert('newer', makePositions(3, 4), new Uint32Array([13, 14]));

    cache.touch('oldest');
    cache.touch('missing');
    cache.insert('newest', makePositions(5, 6), new Uint32Array([15, 16]));

    expect(cache.getPointCount('oldest')).toBe(2);
    expect(cache.getPointCount('newer')).toBe(0);
    expect(cache.getPointCount('newest')).toBe(2);
    expect(cache.getSnapshot()).toEqual({
      positions: makePositions(1, 2, 5, 6),
      attributes: new Uint32Array([11, 12, 15, 16])
    });
  });

  test('retains selected tiles and reports whether residency changed', () => {
    const {cache} = makeCache(6);
    cache.insert('one', makePositions(1, 2), new Uint32Array([11, 12]));
    cache.insert('two', makePositions(3), new Uint32Array([13]));
    cache.insert('three', makePositions(4, 5), new Uint32Array([14, 15]));

    expect(cache.retain(new Set(['two', 'three']))).toBe(true);
    expect(cache.retain(new Set(['two', 'three']))).toBe(false);
    expect(cache.pointCount).toBe(3);
    expect(cache.tileCount).toBe(2);
    expect(cache.getSnapshot()).toEqual({
      positions: makePositions(3, 4, 5),
      attributes: new Uint32Array([13, 14, 15])
    });
  });

  test('truncates an oversized tile to the atlas point capacity', () => {
    const {cache} = makeCache(3);

    cache.insert('oversized', makePositions(1, 2, 3, 4, 5), new Uint32Array([11, 12, 13, 14, 15]));

    expect(cache.pointCount).toBe(3);
    expect(cache.getPointCount('oversized')).toBe(3);
    expect(cache.getSnapshot()).toEqual({
      positions: makePositions(1, 2, 3),
      attributes: new Uint32Array([11, 12, 13])
    });
  });

  test('synchronizes a contiguous snapshot into both GPU buffers', () => {
    const {cache, positionsBuffer, attributesBuffer} = makeCache(4);
    cache.insert('one', makePositions(1), new Uint32Array([11]));
    cache.insert('two', makePositions(2, 3), new Uint32Array([12, 13]));

    const snapshot = cache.synchronize();

    expect(snapshot).toEqual({
      positions: makePositions(1, 2, 3),
      attributes: new Uint32Array([11, 12, 13])
    });
    expect(positionsBuffer.writes).toEqual([snapshot.positions]);
    expect(attributesBuffer.writes).toEqual([snapshot.attributes]);

    cache.retain(new Set());
    expect(cache.synchronize()).toEqual({
      positions: new Float32Array(),
      attributes: new Uint32Array()
    });
    expect(positionsBuffer.writes).toHaveLength(1);
    expect(attributesBuffer.writes).toHaveLength(1);
  });

  test('destroys GPU resources exactly once and rejects later insertions', () => {
    const {cache, positionsBuffer, attributesBuffer} = makeCache(2);
    cache.insert('tile', makePositions(1), new Uint32Array([11]));

    cache.destroy();
    cache.destroy();
    cache.insert('late', makePositions(2), new Uint32Array([12]));

    expect(positionsBuffer.destroyCount).toBe(1);
    expect(attributesBuffer.destroyCount).toBe(1);
    expect(cache.pointCount).toBe(0);
    expect(cache.tileCount).toBe(0);
    expect(cache.getPointCount('late')).toBe(0);
  });
});
