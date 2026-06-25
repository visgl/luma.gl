// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {BitonicArgsort} from '@luma.gl/gpgpu/webgpu';
import {GPUVector, type GPUVectorFormat} from '@luma.gl/tables';
import {getTestDevice} from '@luma.gl/test-utils';
import {beforeEach, describe, expect, test} from 'vitest';

describe('BitonicArgsort', () => {
  let device: Device | null;

  beforeEach(async () => {
    device = await getTestDevice('webgpu');
  });

  test('sorts power-of-two uint32 keys', async t => {
    if (!device) {
      t.skip('webgpu not available');
      return;
    }

    const sorter = new BitonicArgsort(device);
    const keys = makeUint32Vector(device, 'keys', [7, 2, 5, 1, 6, 0, 4, 3]);
    const sortedRowIndices = sorter.sortGPUVector(keys);

    expect(sortedRowIndices.format).toBe('uint32');
    expect(Array.from(await readUint32Vector(sortedRowIndices))).toEqual([5, 3, 1, 7, 6, 2, 4, 0]);

    sortedRowIndices.destroy();
    keys.destroy();
    sorter.destroy();
  });

  test('sorts non-power-of-two uint32 keys', async t => {
    if (!device) {
      t.skip('webgpu not available');
      return;
    }

    const sorter = new BitonicArgsort(device);
    const values = [9, 4, 6, 2, 8, 1, 7];
    const keys = makeUint32Vector(device, 'keys', values);
    const sortedRowIndices = sorter.sortGPUVector(keys);

    expect(Array.from(await readUint32Vector(sortedRowIndices))).toEqual(getStableArgsort(values));

    sortedRowIndices.destroy();
    keys.destroy();
    sorter.destroy();
  });

  test('preserves source row order for duplicate keys', async t => {
    if (!device) {
      t.skip('webgpu not available');
      return;
    }

    const sorter = new BitonicArgsort(device);
    const values = [4, 1, 4, 2, 1, 4, 2];
    const keys = makeUint32Vector(device, 'keys', values);
    const sortedRowIndices = sorter.sortGPUVector(keys);

    expect(Array.from(await readUint32Vector(sortedRowIndices))).toEqual([1, 4, 3, 6, 0, 2, 5]);

    sortedRowIndices.destroy();
    keys.destroy();
    sorter.destroy();
  });

  test('returns an empty uint32 vector for zero rows', async t => {
    if (!device) {
      t.skip('webgpu not available');
      return;
    }

    const sorter = new BitonicArgsort(device);
    const keys = makeUint32Vector(device, 'keys', []);
    const sortedRowIndices = sorter.sortGPUVector(keys);

    expect(sortedRowIndices.length).toBe(0);
    expect(sortedRowIndices.format).toBe('uint32');
    expect(Array.from(await readUint32Vector(sortedRowIndices))).toEqual([]);

    sortedRowIndices.destroy();
    keys.destroy();
    sorter.destroy();
  });

  test('reuses one sorter across different lengths', async t => {
    if (!device) {
      t.skip('webgpu not available');
      return;
    }

    const sorter = new BitonicArgsort(device);
    const shortKeys = makeUint32Vector(device, 'short-keys', [3, 0, 2, 1]);
    const shortSortedRowIndices = sorter.sortGPUVector(shortKeys);
    expect(Array.from(await readUint32Vector(shortSortedRowIndices))).toEqual([1, 3, 2, 0]);

    const longValues = [10, 3, 8, 3, 2, 9, 1, 7, 6];
    const longKeys = makeUint32Vector(device, 'long-keys', longValues);
    const longSortedRowIndices = sorter.sortGPUVector(longKeys);
    expect(Array.from(await readUint32Vector(longSortedRowIndices))).toEqual(
      getStableArgsort(longValues)
    );

    longSortedRowIndices.destroy();
    longKeys.destroy();
    shortSortedRowIndices.destroy();
    shortKeys.destroy();
    sorter.destroy();
  });

  test('rejects non-uint32 key vectors', t => {
    if (!device) {
      t.skip('webgpu not available');
      return;
    }

    const sorter = new BitonicArgsort(device);
    const keys = makeVector(device, 'keys', new Float32Array([3, 2, 1]), 'float32');

    expect(() => sorter.sortGPUVector(keys as unknown as GPUVector<'uint32'>)).toThrow(
      'GPUVector<"uint32">'
    );

    keys.destroy();
    sorter.destroy();
  });

  test('rejects multi-chunk key vectors', t => {
    if (!device) {
      t.skip('webgpu not available');
      return;
    }

    const sorter = new BitonicArgsort(device);
    const firstChunk = makeUint32Vector(device, 'keys-0', [3, 2]);
    const secondChunk = makeUint32Vector(device, 'keys-1', [1, 0]);
    const keys = new GPUVector({
      type: 'data',
      name: 'keys',
      format: 'uint32',
      data: [firstChunk.data[0], secondChunk.data[0]],
      ownsData: false
    });

    expect(() => sorter.sortGPUVector(keys)).toThrow('requires exactly one GPUData chunk');

    keys.destroy();
    firstChunk.destroy();
    secondChunk.destroy();
    sorter.destroy();
  });
});

function makeUint32Vector(device: Device, name: string, values: number[]): GPUVector<'uint32'> {
  return makeVector(device, name, new Uint32Array(values), 'uint32');
}

function makeVector<T extends GPUVectorFormat>(
  device: Device,
  name: string,
  values: Uint32Array | Float32Array,
  format: T
): GPUVector<T> {
  const buffer = device.createBuffer({
    id: name,
    byteLength: Math.max(values.byteLength, Uint32Array.BYTES_PER_ELEMENT),
    usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: values
  });
  return new GPUVector({
    type: 'buffer',
    name,
    buffer,
    format,
    length: values.length,
    ownsBuffer: true
  });
}

async function readUint32Vector(vector: GPUVector<'uint32'>): Promise<Uint32Array> {
  if (vector.length === 0) {
    return new Uint32Array(0);
  }

  const data = vector.data[0];
  const bytes = await data.buffer.readAsync(
    data.byteOffset,
    vector.length * Uint32Array.BYTES_PER_ELEMENT
  );
  return new Uint32Array(bytes.buffer, bytes.byteOffset, vector.length).slice();
}

function getStableArgsort(values: number[]): number[] {
  return values
    .map((value, rowIndex) => ({rowIndex, value}))
    .sort((left, right) => left.value - right.value || left.rowIndex - right.rowIndex)
    .map(({rowIndex}) => rowIndex);
}
