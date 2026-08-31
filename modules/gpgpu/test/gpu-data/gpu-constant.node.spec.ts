import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {NullDevice} from '@luma.gl/test-utils';
import {GPUConstant, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {GPURecordBatch, GPUTable} from '@luma.gl/experimental/gpu-tables';

it('GPUConstant validates and owns one fixed-width payload', () => {
  const sourceValue = new Uint8Array([10, 20, 30, 40]);
  const constant = new GPUConstant({format: 'unorm8x4', value: sourceValue});
  sourceValue[0] = 255;

  expect(constant.isConstant, 'exposes a constant discriminator').toBe(true);
  expect(constant.byteLength, 'reports one physical payload row').toBe(4);
  expect(Array.from(constant.value), 'owns an immutable copy').toEqual([10, 20, 30, 40]);
  expect(
    () => new GPUConstant({format: 'float32', value: new Uint32Array([1])}),
    'rejects the wrong typed-array component type'
  ).toThrow(/requires Float32Array/);
  expect(
    () => new GPUConstant({format: 'float32x2', value: new Float32Array([1])}),
    'rejects incomplete rows'
  ).toThrow(/requires exactly 8 bytes/);
});

it('GPUTable exposes mixed varying and constant logical columns', () => {
  const device = new NullDevice({});
  const positions = makeVector(device, 'positions', 3);
  const color = new GPUConstant({format: 'unorm8x4', value: new Uint8Array([1, 2, 3, 4])});
  const table = new GPUTable({columns: {positions, color}});

  expect(table.numRows, 'varying columns determine logical row count').toBe(3);
  expect(
    table.schema.fields.map(field => [field.name, field.format]),
    'logical schema contains varying and constant columns'
  ).toEqual([
    ['positions', 'float32x2'],
    ['color', 'unorm8x4']
  ]);
  expect(table.gpuColumns.color, 'canonical columns expose the constant').toBe(color);
  expect(table.gpuConstants.color, 'constant map exposes the constant').toBe(color);
  expect(table.gpuVectors.positions.length, 'vector map remains varying-only').toBe(3);
  expect(Object.keys(table.batches[0].gpuData), 'batch data stays physical-only').toEqual([
    'positions'
  ]);
  expect(
    table.bufferLayout.map(layout => layout.name),
    'physical layout excludes constants'
  ).toEqual(['positions']);

  table.select('color');
  expect(Object.keys(table.gpuColumns), 'selection retains the constant column').toEqual(['color']);
  expect(Object.keys(table.batches[0].gpuData), 'selection removes varying GPUData').toEqual([]);
  table.destroy();
});

it('GPUTable requires explicit rows for all-constant columns', () => {
  const radius = new GPUConstant({format: 'float32', value: new Float32Array([2])});
  expect(
    () => new GPUTable({columns: {radius}}),
    'does not infer logical rows from one physical value'
  ).toThrow(/requires numRows/);

  const table = new GPUTable({columns: {radius}, numRows: 5});
  expect(table.numRows, 'retains explicit logical rows').toBe(5);
  expect(table.batches.length, 'creates one data-less logical draw batch').toBe(1);
  expect(table.batches[0].numRows, 'data-less batch carries the logical row count').toBe(5);
  expect(table.batches[0].schema.fields, 'batch schema remains physical-only').toEqual([]);
  table.destroy();
});

it('GPUTable batch construction keeps constants table-wide', () => {
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

  expect(table.numRows, 'aggregates physical batch rows').toBe(5);
  expect(table.gpuConstants.color, 'retains one table-level constant').toBe(color);
  table.packBatches();
  expect(table.batches.length, 'packing affects physical batches').toBe(1);
  expect(table.gpuConstants.color, 'packing preserves the table-level constant').toBe(color);
  table.destroy();
});

it('GPUTable batch construction rejects invalid constant names', () => {
  const device = new NullDevice({});
  const positions = makeVector(device, 'positions', 2);
  const batch = new GPURecordBatch({gpuData: {positions: positions.data[0]}});
  const constant = new GPUConstant({format: 'float32x2', value: new Float32Array([1, 2])});

  expect(
    () => new GPUTable({batches: [batch], constants: {positions: constant}}),
    'does not allow one logical name to be varying and constant'
  ).toThrow(/conflicts with batch GPUData/);
  expect(
    () => new GPUTable({batches: [batch], constants: {indices: constant}}),
    'keeps the index column physical'
  ).toThrow(/reserved index column/);

  batch.destroy();
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
