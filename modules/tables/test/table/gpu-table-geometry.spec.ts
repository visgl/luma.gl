// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer} from '@luma.gl/core';
import {NullDevice} from '@luma.gl/test-utils';
import {GPURecordBatch, GPUTable, GPUTableGeometry, GPUVector} from '@luma.gl/tables';

test('GPUTableGeometry exposes one static table batch as geometry', t => {
  const device = new NullDevice({});
  const table = makePositionsTable(device, 3);
  const geometry = new GPUTableGeometry({table, topology: 'triangle-list'});

  t.equal(geometry.vertexCount, 3, 'defaults non-indexed draw count to table rows');
  t.deepEqual(Object.keys(geometry.attributes), ['positions'], 'uses layout-named buffers');
  t.equal(
    geometry.attributes['positions'],
    table.gpuVectors['positions'].data[0].buffer,
    'borrows the static table buffer'
  );

  geometry.destroy();
  t.notOk(
    table.gpuVectors['positions'].data[0].buffer.destroyed,
    'borrowed table storage survives geometry destruction'
  );
  table.destroy();
  t.end();
});

test('GPUTableGeometry validates indexed and multi-batch geometry contracts', t => {
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

  t.throws(
    () => new GPUTableGeometry({table, topology: 'triangle-list', indices}),
    /explicit vertexCount/,
    'indexed geometry requires an explicit draw count'
  );
  t.throws(
    () => new GPUTableGeometry({table: batchedTable, topology: 'triangle-list'}),
    /single-batch or packed/,
    'multi-batch tables must be packed before geometry conversion'
  );

  indices.destroy();
  table.destroy();
  batchedTable.destroy();
  t.end();
});

test('GPUTable creates an empty inferred-schema table from vectors without GPUData', t => {
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

  t.equal(table.numRows, 0, 'empty vectors create a zero-row table');
  t.equal(table.batches.length, 0, 'empty vectors do not synthesize a batch');
  t.equal(table.schema.fields[0]?.name, 'positions', 'infers the schema field');
  t.deepEqual(
    table.bufferLayout,
    [{name: 'positions', byteStride: 8, format: 'float32x2'}],
    'retains inferred layout metadata'
  );

  table.destroy();
  positions.destroy();
  t.end();
});

test('GPUTable preserves compatible GPUVector chunk boundaries as batches', t => {
  const device = new NullDevice({});
  const positions = makeChunkedVector(device, 'positions', 'float32x2', [1, 2]);
  const weights = makeChunkedVector(device, 'weights', 'float32', [1, 2]);
  const table = new GPUTable({vectors: {positions, weights}});

  t.equal(table.batches.length, 2, 'creates one table batch per aligned vector chunk');
  t.equal(table.batches[0].numRows, 1, 'preserves first chunk row count');
  t.equal(table.batches[1].numRows, 2, 'preserves second chunk row count');
  t.equal(
    table.batches[1].gpuData.positions,
    positions.data[1],
    'preserves the original batch-local GPUData'
  );

  table.destroy();
  t.end();
});

test('GPUTable rejects incompatible GPUVector chunk structures', t => {
  const device = new NullDevice({});
  const positions = makeChunkedVector(device, 'positions', 'float32x2', [1, 2]);
  const shortWeights = makeChunkedVector(device, 'weights', 'float32', [1]);
  const mismatchedWeights = makeChunkedVector(device, 'weights', 'float32', [1, 3]);

  t.throws(
    () => new GPUTable({vectors: {positions, weights: shortWeights}}),
    /matching GPUData chunk counts/,
    'requires the same number of chunks for every vector'
  );
  t.throws(
    () => new GPUTable({vectors: {positions, weights: mismatchedWeights}}),
    /matching row counts in batch 1/,
    'requires row-aligned chunks'
  );

  positions.destroy();
  shortWeights.destroy();
  mismatchedWeights.destroy();
  t.end();
});

test('GPUTable infers batch metadata and supports typed empty tables', t => {
  const device = new NullDevice({});
  const batch = new GPURecordBatch({
    gpuData: {positions: makePositionsVector(device, 2).data[0]}
  });
  const table = new GPUTable({batches: [batch]});
  const emptyTable = new GPUTable({schema: batch.schema});

  t.equal(table.schema, batch.schema, 'infers the table schema from the first batch');
  t.deepEqual(table.bufferLayout, batch.bufferLayout, 'infers the first batch layout');
  t.throws(
    () => new GPUTable({batches: []}),
    /requires at least one GPURecordBatch/,
    'requires schema-only construction for empty tables'
  );

  emptyTable.addBatch(batch);
  t.deepEqual(emptyTable.bufferLayout, batch.bufferLayout, 'adopts the first batch layout');
  t.equal(emptyTable.numRows, 2, 'adopts the first batch rows');

  table.destroy();
  emptyTable.destroy();
  t.end();
});

test('GPUTableGeometry can take ownership of backing table storage', t => {
  const device = new NullDevice({});
  const table = makePositionsTable(device, 2);
  const positionsBuffer = table.gpuVectors['positions'].data[0].buffer;
  const geometry = new GPUTableGeometry({
    table,
    topology: 'triangle-list',
    ownsTable: true
  });

  geometry.destroy();
  t.ok(positionsBuffer.destroyed, 'owned table storage is destroyed with geometry');
  t.end();
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
