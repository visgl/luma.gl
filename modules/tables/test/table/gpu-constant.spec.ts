// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUConstant, GPURecordBatch, GPUTable, GPUVector} from '@luma.gl/tables';

test('GPUConstant validates and owns one fixed-width payload', t => {
  const sourceValue = new Uint8Array([10, 20, 30, 40]);
  const constant = new GPUConstant({format: 'unorm8x4', value: sourceValue});
  sourceValue[0] = 255;

  t.equal(constant.isConstant, true, 'exposes a constant discriminator');
  t.equal(constant.byteLength, 4, 'reports one physical payload row');
  t.deepEqual(Array.from(constant.value), [10, 20, 30, 40], 'owns an immutable copy');
  t.throws(
    () => new GPUConstant({format: 'float32', value: new Uint32Array([1])}),
    /requires Float32Array/,
    'rejects the wrong typed-array component type'
  );
  t.throws(
    () => new GPUConstant({format: 'float32x2', value: new Float32Array([1])}),
    /requires exactly 8 bytes/,
    'rejects incomplete rows'
  );
  t.end();
});

test('GPUTable exposes mixed varying and constant logical columns', t => {
  const device = new NullDevice({});
  const positions = makeVector(device, 'positions', 3);
  const color = new GPUConstant({format: 'unorm8x4', value: new Uint8Array([1, 2, 3, 4])});
  const table = new GPUTable({columns: {positions, color}});

  t.equal(table.numRows, 3, 'varying columns determine logical row count');
  t.deepEqual(
    table.schema.fields.map(field => [field.name, field.format]),
    [
      ['positions', 'float32x2'],
      ['color', 'unorm8x4']
    ],
    'logical schema contains varying and constant columns'
  );
  t.equal(table.gpuColumns.color, color, 'canonical columns expose the constant');
  t.equal(table.gpuConstants.color, color, 'constant map exposes the constant');
  t.equal(table.gpuVectors.positions.length, 3, 'vector map remains varying-only');
  t.deepEqual(
    Object.keys(table.batches[0].gpuData),
    ['positions'],
    'batch data stays physical-only'
  );
  t.deepEqual(
    table.bufferLayout.map(layout => layout.name),
    ['positions'],
    'physical layout excludes constants'
  );

  table.select('color');
  t.deepEqual(Object.keys(table.gpuColumns), ['color'], 'selection retains the constant column');
  t.deepEqual(Object.keys(table.batches[0].gpuData), [], 'selection removes varying GPUData');
  table.destroy();
  t.end();
});

test('GPUTable requires explicit rows for all-constant columns', t => {
  const radius = new GPUConstant({format: 'float32', value: new Float32Array([2])});
  t.throws(
    () => new GPUTable({columns: {radius}}),
    /requires numRows/,
    'does not infer logical rows from one physical value'
  );

  const table = new GPUTable({columns: {radius}, numRows: 5});
  t.equal(table.numRows, 5, 'retains explicit logical rows');
  t.equal(table.batches.length, 1, 'creates one data-less logical draw batch');
  t.equal(table.batches[0].numRows, 5, 'data-less batch carries the logical row count');
  t.deepEqual(table.batches[0].schema.fields, [], 'batch schema remains physical-only');
  table.destroy();
  t.end();
});

test('GPUTable batch construction keeps constants table-wide', t => {
  const device = new NullDevice({});
  const firstVector = makeVector(device, 'positions', 2);
  const secondVector = makeVector(device, 'positions', 3);
  const color = new GPUConstant({format: 'unorm8x4', value: new Uint8Array([1, 2, 3, 4])});
  const table = new GPUTable({
    batches: [
      new GPURecordBatch({gpuData: {positions: firstVector.data[0]}}),
      new GPURecordBatch({gpuData: {positions: secondVector.data[0]}})
    ],
    constants: {color}
  });

  t.equal(table.numRows, 5, 'aggregates physical batch rows');
  t.equal(table.gpuConstants.color, color, 'retains one table-level constant');
  table.packBatches();
  t.equal(table.batches.length, 1, 'packing affects physical batches');
  t.equal(table.gpuConstants.color, color, 'packing preserves the table-level constant');
  table.destroy();
  t.end();
});

test('GPUTable batch construction rejects invalid constant names', t => {
  const device = new NullDevice({});
  const positions = makeVector(device, 'positions', 2);
  const batch = new GPURecordBatch({gpuData: {positions: positions.data[0]}});
  const constant = new GPUConstant({format: 'float32x2', value: new Float32Array([1, 2])});

  t.throws(
    () => new GPUTable({batches: [batch], constants: {positions: constant}}),
    /conflicts with batch GPUData/,
    'does not allow one logical name to be varying and constant'
  );
  t.throws(
    () => new GPUTable({batches: [batch], constants: {indices: constant}}),
    /reserved index column/,
    'keeps the index column physical'
  );

  batch.destroy();
  t.end();
});

function makeVector(device: NullDevice, name: string, rowCount: number): GPUVector<'float32x2'> {
  return new GPUVector({
    type: 'buffer',
    name,
    buffer: device.createBuffer({data: new Float32Array(rowCount * 2)}),
    format: 'float32x2',
    length: rowCount,
    ownsBuffer: true
  });
}
