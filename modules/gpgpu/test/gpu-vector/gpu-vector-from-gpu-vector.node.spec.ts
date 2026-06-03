// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, NativeFloat16ArrayConstructor, type Device} from '@luma.gl/core';
import {GPUTableEvaluator} from '@luma.gl/gpgpu';
import {GPUVector, type GPUVectorFormat} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, test} from 'vitest';

test('GPUTableEvaluator.fromGPUVector accepts packed Float16 vectors', () => {
  const device = new NullDevice({});
  const vector2 = makeUint16Vector(device, 'colors16x2', [0x3c00, 0x3800], 2, {
    format: 'float16x2'
  });
  const vector4 = makeUint16Vector(device, 'colors16x4', [0x3c00, 0x3800, 0x3400, 0x3000], 4, {
    format: 'float16x4'
  });

  const evaluator2 = GPUTableEvaluator.fromGPUVector(vector2);
  const evaluator4 = GPUTableEvaluator.fromGPUVector(vector4);

  expect(evaluator2.type).toBe('float16');
  expect(evaluator2.size).toBe(2);
  expect(evaluator2.ValueType).toBe(NativeFloat16ArrayConstructor ?? Uint16Array);
  expect(evaluator4.type).toBe('float16');
  expect(evaluator4.size).toBe(4);
  expect(evaluator4.ValueType).toBe(NativeFloat16ArrayConstructor ?? Uint16Array);

  evaluator2.destroy();
  evaluator4.destroy();
  vector2.destroy();
  vector4.destroy();
  device.destroy();
});

test('GPUTableEvaluator.fromGPUVector validates packed numeric vectors', () => {
  const device = new NullDevice({});
  const vector = makeFloat32Vector(device, 'values', [1, 2, 3, 4], 2);
  const interleaved = new GPUVector({
    type: 'interleaved',
    name: 'interleaved-values',
    buffer: vector.data[0].buffer,
    length: 2,
    byteStride: 8,
    attributes: [{attribute: 'values', format: 'float32x2', byteOffset: 0}]
  });
  const mismatchedRowByteLength = makeUint16Vector(device, 'bad-row-byte-length', [0, 0, 0, 0], 4, {
    format: 'float16x4',
    byteStride: 4,
    rowByteLength: 4
  });
  const unpacked = makeUint16Vector(device, 'unpacked-values', [0, 0, 0, 0], 4, {
    format: 'float16x4',
    byteStride: 12,
    rowByteLength: 8
  });

  expect(() => GPUTableEvaluator.fromGPUVector(interleaved)).toThrow(/does not accept interleaved/);
  expect(() => GPUTableEvaluator.fromGPUVector(mismatchedRowByteLength)).toThrow(
    /requires rowByteLength 8/
  );
  expect(() => GPUTableEvaluator.fromGPUVector(unpacked)).toThrow(/requires packed vector/);

  interleaved.destroy();
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
    format: getFloat32VectorFormat(stride),
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
  options: {format?: GPUVectorFormat; byteStride?: number; rowByteLength?: number} = {}
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
    format: options.format ?? getUint16VectorFormat(stride),
    length: values.length / stride,
    stride,
    byteStride,
    rowByteLength,
    ownsBuffer: true
  });
}

function getFloat32VectorFormat(stride: number): GPUVectorFormat {
  return (stride === 1 ? 'float32' : `float32x${stride}`) as GPUVectorFormat;
}

function getUint16VectorFormat(stride: number): GPUVectorFormat {
  return (stride === 1 ? 'uint16' : `uint16x${stride}`) as GPUVectorFormat;
}
