// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GPUH3MapPointSource,
  GPUTableMapPointSource,
  type MaterializedMapProjectionSource
} from '@deck.gl-community/gpu-layers';
import {Buffer, type Device} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/core/test-utils';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUTable} from '@luma.gl/graph/gpu-tables';
import {expect, it, vi} from 'vitest';

/** Shared geographic test region in the source CRS. */
const bounds = [-123, 37, -122, 38] as const;
/** Midpoint used as the stable local render origin. */
const sourceOrigin = [-122.5, 37.5] as const;

/** Allocates caller-owned packed inputs with the requested physical chunk lengths. */
function makeInput<Format extends 'uint32x2' | 'uint32x4'>(
  device: Device,
  format: Format,
  lengths: number[]
): GPUVector<Format> {
  const bytesPerRow = format === 'uint32x2' ? 8 : 16;
  return new GPUVector({
    type: 'data',
    name: 'input',
    format,
    ownsData: true,
    data: lengths.map(
      length =>
        new GPUData({
          format,
          length,
          ownsBuffer: true,
          buffer: device.createBuffer({
            byteLength: Math.max(1, length) * bytesPerRow,
            usage: Buffer.STORAGE
          })
        })
    )
  });
}

/** Creates the H3 fixture and exposes its borrowed buffers for ownership assertions. */
function makeH3Source(device: Device, lengths: number[]) {
  const cells = makeInput(device, 'uint32x2', lengths);
  return {
    source: new GPUH3MapPointSource(device, {cells, bounds}),
    inputBuffers: cells.data.map(chunk => chunk.buffer),
    destroyInput: () => cells.destroy()
  };
}

/** Creates the resident XY fixture and exposes its borrowed buffers for ownership assertions. */
function makeTableSource(device: Device, lengths: number[]) {
  const coordinates = makeInput(device, 'uint32x4', lengths);
  const table = new GPUTable({vectors: {input: coordinates}});
  return {
    source: new GPUTableMapPointSource(device, {
      id: 'contract-table',
      table,
      positions: 'input',
      from: 'EPSG:4326',
      bounds,
      sourceOrigin,
      tolerance: 0.05
    }),
    inputBuffers: coordinates.data.map(chunk => chunk.buffer),
    destroyInput: () => {
      table.destroy();
      coordinates.destroy();
    }
  };
}

it.each([
  ['H3', makeH3Source],
  ['resident XY table', makeTableSource]
] as const)('%s preserves topology and borrows input storage', (_name, makeSource) => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const encode = vi.spyOn(device, 'createCommandEncoder');
  const original = makeSource(device, [2, 0, 1]);
  const {
    source,
    inputBuffers
  }: {source: MaterializedMapProjectionSource; inputBuffers: typeof original.inputBuffers} =
    original;
  const positions = source.positions;
  const validity = source.validity;
  const outputBuffers = [...positions.data, ...validity.data].map(chunk => chunk.buffer);
  let replacement: ReturnType<typeof makeSource> | undefined;
  try {
    expect(positions.format).toBe('float32x2');
    expect(validity.format).toBe('uint32');
    expect(positions.data.map(chunk => chunk.length)).toEqual([2, 0, 1]);
    expect(validity.data.map(chunk => chunk.length)).toEqual([2, 0, 1]);
    expect(Object.isFrozen(source.commonOrigin)).toBe(true);
    source.updateChunks([]);
    source.updateChunks([1, 1]);
    for (const invalid of [-1, 3, 0.5, Infinity, NaN]) {
      expect(() => source.updateChunks([0, invalid])).toThrow(/Invalid projection chunk index/);
    }
    expect(encode).not.toHaveBeenCalled();
    expect(source.positions).toBe(positions);
    expect(source.validity).toBe(validity);
    expect(outputBuffers.every(buffer => !buffer.destroyed)).toBe(true);
    source.destroy();
    source.destroy();
    expect(outputBuffers.every(buffer => buffer.destroyed)).toBe(true);
    expect(inputBuffers.every(buffer => !buffer.destroyed)).toBe(true);
    expect(() => source.updateChunks()).toThrow(/destroyed/);

    replacement = makeSource(device, [1]);
    expect(replacement.source.positions.data.map(chunk => chunk.length)).toEqual([1]);
    expect(replacement.source.positions.data[0].buffer).not.toBe(outputBuffers[0]);
    expect(replacement.inputBuffers[0]).not.toBe(inputBuffers[0]);
  } finally {
    replacement?.source.destroy();
    replacement?.destroyInput();
    source.destroy();
    original.destroyInput();
    encode.mockRestore();
    device.destroy();
  }
});
