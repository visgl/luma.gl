// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, NativeFloat16ArrayConstructor, type Device} from '@luma.gl/core';
import {GPUTableEvaluator} from '@luma.gl/gpgpu';
import {GPUVector} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';

test('GPUTableEvaluator.fromGPUVector accepts packed Float16 vectors', () => {
  const device = new NullDevice({});
  const vector3 = makeUint16Vector(device, 'colors16x3', [0x3c00, 0x3800, 0x3400], 3, {
    dataType: makeDataType(new arrow.Float16(), 3)
  });
  const vector4 = makeUint16Vector(device, 'colors16x4', [0x3c00, 0x3800, 0x3400, 0x3000], 4, {
    dataType: makeDataType(new arrow.Float16(), 4)
  });

  const evaluator3 = GPUTableEvaluator.fromGPUVector(vector3);
  const evaluator4 = GPUTableEvaluator.fromGPUVector(vector4);

  expect(evaluator3.type).toBe('float16');
  expect(evaluator3.size).toBe(3);
  expect(evaluator3.ValueType).toBe(NativeFloat16ArrayConstructor ?? Uint16Array);
  expect(evaluator4.type).toBe('float16');
  expect(evaluator4.size).toBe(4);
  expect(evaluator4.ValueType).toBe(NativeFloat16ArrayConstructor ?? Uint16Array);

  evaluator3.destroy();
  evaluator4.destroy();
  vector3.destroy();
  vector4.destroy();
  device.destroy();
});

test('GPUTableEvaluator.fromGPUVector validates packed numeric vectors', () => {
  const device = new NullDevice({});
  const vector = makeFloat32Vector(device, 'values', [1, 2, 3, 4], 2);
  const interleaved = new GPUVector({
    type: 'interleaved',
    name: 'interleaved-values',
    buffer: vector.buffer,
    dataType: new arrow.Binary(),
    length: 2,
    byteStride: 8,
    attributes: [{attribute: 'values', format: 'float32x2', byteOffset: 0}]
  });
  const int64 = makeUint16Vector(device, 'ids64', [0, 0, 0, 0], 1, {
    dataType: new arrow.Int64(),
    byteStride: 8,
    rowByteLength: 8
  });
  const mismatchedRowByteLength = makeUint16Vector(device, 'bad-row-byte-length', [0, 0, 0, 0], 4, {
    dataType: makeDataType(new arrow.Float16(), 4),
    byteStride: 4,
    rowByteLength: 4
  });
  const unpacked = makeUint16Vector(device, 'unpacked-values', [0, 0, 0, 0], 4, {
    dataType: makeDataType(new arrow.Float16(), 4),
    byteStride: 12,
    rowByteLength: 8
  });

  expect(() => GPUTableEvaluator.fromGPUVector(interleaved)).toThrow(/does not accept interleaved/);
  expect(() => GPUTableEvaluator.fromGPUVector(int64)).toThrow(/does not support 64-bit integer/);
  expect(() => GPUTableEvaluator.fromGPUVector(mismatchedRowByteLength)).toThrow(
    /requires rowByteLength 8/
  );
  expect(() => GPUTableEvaluator.fromGPUVector(unpacked)).toThrow(/requires packed vector/);

  interleaved.destroy();
  int64.destroy();
  mismatchedRowByteLength.destroy();
  unpacked.destroy();
  vector.destroy();
  device.destroy();
});

function makeFloat32Vector(
  device: Device,
  name: string,
  values: number[],
  stride: number
): GPUVector {
  const data = new Float32Array(values);
  const buffer = device.createBuffer({
    usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    data
  });
  return new GPUVector({
    type: 'buffer',
    name,
    buffer,
    dataType: makeDataType(new arrow.Float32(), stride),
    length: values.length / stride,
    stride,
    byteStride: stride * Float32Array.BYTES_PER_ELEMENT,
    rowByteLength: stride * Float32Array.BYTES_PER_ELEMENT,
    ownsBuffer: true
  });
}

function makeUint16Vector(
  device: Device,
  name: string,
  values: number[],
  stride: number,
  options: {dataType?: arrow.DataType; byteStride?: number; rowByteLength?: number} = {}
): GPUVector {
  const data = new Uint16Array(values);
  const byteStride = options.byteStride ?? stride * Uint16Array.BYTES_PER_ELEMENT;
  const rowByteLength = options.rowByteLength ?? stride * Uint16Array.BYTES_PER_ELEMENT;
  const buffer = device.createBuffer({
    usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    data
  });
  return new GPUVector({
    type: 'buffer',
    name,
    buffer,
    dataType: options.dataType ?? makeDataType(new arrow.Uint16(), stride),
    length: values.length / stride,
    stride,
    byteStride,
    rowByteLength,
    ownsBuffer: true
  });
}

function makeDataType(type: arrow.DataType, stride: number): arrow.DataType {
  return stride === 1
    ? type
    : new arrow.FixedSizeList(stride, new arrow.Field('value', type, false));
}
