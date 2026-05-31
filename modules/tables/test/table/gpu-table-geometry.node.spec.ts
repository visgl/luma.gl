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
    new GPURecordBatch({vectors: {positions: makePositionsVector(device, 1)}}),
    new GPURecordBatch({vectors: {positions: makePositionsVector(device, 2)}})
  ];
  const batchedTable = new GPUTable({
    batches,
    schema: batches[0].schema,
    bufferLayout: batches[0].bufferLayout
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

test('GPUTableGeometry rejects appendable DynamicBuffer attributes', t => {
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

  t.throws(
    () => new GPUTableGeometry({table, topology: 'triangle-list'}),
    /static single-buffer attributes/,
    'geometry conversion documents the static-buffer-only contract'
  );

  table.destroy();
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
