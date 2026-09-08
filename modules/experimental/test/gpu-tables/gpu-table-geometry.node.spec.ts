// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable, GPUTableGeometry} from '@luma.gl/experimental/gpu-tables';

it('GPUTableGeometry exposes one static table batch as geometry', () => {
  const device = new NullDevice({});
  const table = makePositionsTable(device, 3);
  const geometry = new GPUTableGeometry({table, topology: 'triangle-list'});

  expect(geometry.vertexCount, 'defaults non-indexed draw count to table rows').toBe(3);
  expect(Object.keys(geometry.attributes), 'uses layout-named buffers').toEqual(['positions']);
  expect(geometry.attributes['positions'], 'borrows the static table buffer').toBe(
    table.gpuVectors['positions'].data[0].buffer
  );

  geometry.destroy();
  expect(
    Boolean(table.gpuVectors['positions'].data[0].buffer.destroyed),
    'borrowed table storage survives geometry destruction'
  ).toBe(false);
  table.destroy();
  void 0;
});

it('GPUTableGeometry validates indexed and multi-batch geometry contracts', () => {
  const device = new NullDevice({});
  const table = makePositionsTable(device, 3);
  const indices = device.createBuffer({
    usage: Buffer.INDEX,
    data: new Uint16Array([0, 1, 2])
  });
  const batches = [
    new GPURecordBatch({gpuData: {positions: makePositionsVector(device, 1).data[0]}}),
    new GPURecordBatch({gpuData: {positions: makePositionsVector(device, 2).data[0]}})
  ];
  const batchedTable = new GPUTable({
    batches
  });

  expect(
    () => new GPUTableGeometry({table, topology: 'triangle-list', indices}),
    'indexed geometry requires an explicit draw count'
  ).toThrow(/explicit vertexCount/);
  expect(
    () => new GPUTableGeometry({table: batchedTable, topology: 'triangle-list'}),
    'multi-batch tables must be packed before geometry conversion'
  ).toThrow(/single-batch or packed/);

  indices.destroy();
  table.destroy();
  batchedTable.destroy();
  void 0;
});

it('GPUTable creates an empty inferred-schema table from vectors without GPUData', () => {
  const device = new NullDevice({});
  const positions = new GPUVector({
    type: 'appendable',
    name: 'positions',
    device,
    format: 'float32x2',
    stride: 2,
    byteStride: Float32Array.BYTES_PER_ELEMENT * 2
  });
  const table = new GPUTable({vectors: {positions}});

  expect(table.numRows, 'empty vectors create a zero-row table').toBe(0);
  expect(table.batches.length, 'empty vectors do not synthesize a batch').toBe(0);
  expect(table.schema.fields[0]?.name, 'infers the schema field').toBe('positions');
  expect(table.bufferLayout, 'retains inferred layout metadata').toEqual([
    {name: 'positions', byteStride: 8, format: 'float32x2'}
  ]);

  table.destroy();
  positions.destroy();
  void 0;
});

it('GPUTable preserves compatible GPUVector chunk boundaries as batches', () => {
  const device = new NullDevice({});
  const positions = makeChunkedVector(device, 'positions', 'float32x2', [1, 2]);
  const weights = makeChunkedVector(device, 'weights', 'float32', [1, 2]);
  const table = new GPUTable({vectors: {positions, weights}});

  expect(table.batches.length, 'creates one table batch per aligned vector chunk').toBe(2);
  expect(table.batches[0].numRows, 'preserves first chunk row count').toBe(1);
  expect(table.batches[1].numRows, 'preserves second chunk row count').toBe(2);
  expect(table.batches[1].gpuData.positions, 'preserves the original batch-local GPUData').toBe(
    positions.data[1]
  );

  table.destroy();
  void 0;
});

it('GPUTable rejects incompatible GPUVector chunk structures', () => {
  const device = new NullDevice({});
  const positions = makeChunkedVector(device, 'positions', 'float32x2', [1, 2]);
  const shortWeights = makeChunkedVector(device, 'weights', 'float32', [1]);
  const mismatchedWeights = makeChunkedVector(device, 'weights', 'float32', [1, 3]);

  expect(
    () => new GPUTable({vectors: {positions, weights: shortWeights}}),
    'requires the same number of chunks for every vector'
  ).toThrow(/matching GPUData chunk counts/);
  expect(
    () => new GPUTable({vectors: {positions, weights: mismatchedWeights}}),
    'requires row-aligned chunks'
  ).toThrow(/matching row counts in batch 1/);

  positions.destroy();
  shortWeights.destroy();
  mismatchedWeights.destroy();
  void 0;
});

it('GPUTable infers batch metadata and supports typed empty tables', () => {
  const device = new NullDevice({});
  const batch = new GPURecordBatch({
    gpuData: {positions: makePositionsVector(device, 2).data[0]}
  });
  const table = new GPUTable({batches: [batch]});
  const emptyTable = new GPUTable({schema: batch.schema});

  expect(table.schema, 'infers the table schema from the first batch').toBe(batch.schema);
  expect(table.bufferLayout, 'infers the first batch layout').toEqual(batch.bufferLayout);
  expect(
    () => new GPUTable({batches: []}),
    'requires schema-only construction for empty tables'
  ).toThrow(/requires at least one GPURecordBatch/);

  emptyTable.addBatch(batch);
  expect(emptyTable.bufferLayout, 'adopts the first batch layout').toEqual(batch.bufferLayout);
  expect(emptyTable.numRows, 'adopts the first batch rows').toBe(2);

  table.destroy();
  emptyTable.destroy();
  void 0;
});

it('GPUTableGeometry can take ownership of backing table storage', () => {
  const device = new NullDevice({});
  const table = makePositionsTable(device, 2);
  const positionsBuffer = table.gpuVectors['positions'].data[0].buffer;
  const geometry = new GPUTableGeometry({
    table,
    topology: 'triangle-list',
    ownsTable: true
  });

  geometry.destroy();
  expect(Boolean(positionsBuffer.destroyed), 'owned table storage is destroyed with geometry').toBe(
    true
  );
  void 0;
});

function makePositionsTable(device: NullDevice, rowCount: number): GPUTable {
  return new GPUTable({vectors: {positions: makePositionsVector(device, rowCount)}});
}

function makePositionsVector(device: NullDevice, rowCount: number): GPUVector {
  return new GPUVector({
    type: 'buffer',
    name: 'positions',
    buffer: device.createBuffer({data: new Float32Array(rowCount * 2)}),
    format: 'float32x2',
    length: rowCount,
    stride: 2,
    byteStride: Float32Array.BYTES_PER_ELEMENT * 2,
    ownsBuffer: true
  });
}

function makeChunkedVector(
  device: NullDevice,
  name: string,
  format: 'float32' | 'float32x2',
  rowCounts: number[]
): GPUVector {
  const componentCount = format === 'float32x2' ? 2 : 1;
  const data = rowCounts.map(rowCount => {
    const vector = new GPUVector({
      type: 'buffer',
      name,
      buffer: device.createBuffer({data: new Float32Array(rowCount * componentCount)}),
      format,
      length: rowCount,
      stride: componentCount,
      byteStride: Float32Array.BYTES_PER_ELEMENT * componentCount,
      ownsBuffer: true
    });
    return vector.data[0];
  });
  return new GPUVector({
    type: 'data',
    name,
    format,
    data,
    ownsData: true
  });
}
