// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, NativeFloat16ArrayConstructor, type Device} from '@luma.gl/core';
import {GPUDataEvaluator} from '@luma.gl/gpgpu';
import {GPUVector, type GPUVectorFormat} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, test, vi} from 'vitest';

test('GPUDataEvaluator buffer pool allocates exact sizes and validates device limits', async () => {
  const device = new NullDevice({});
  Object.defineProperty(device.limits, 'maxBufferSize', {value: 16});

  const evaluator = GPUDataEvaluator.fromArray(new Uint8Array(8), {type: 'uint8', size: 1});
  await evaluator.evaluate(device);
  const buffer = evaluator.buffer;

  expect(buffer.byteLength).toBe(evaluator.byteLength);
  expect(buffer.byteLength).toBe(8);

  evaluator.destroy();

  const smallerEvaluator = GPUDataEvaluator.fromArray(new Uint8Array(4), {
    type: 'uint8',
    size: 1
  });
  await smallerEvaluator.evaluate(device);

  expect(smallerEvaluator.buffer).toBe(buffer);
  expect(smallerEvaluator.buffer.byteLength).toBe(8);

  const oversizedEvaluator = GPUDataEvaluator.fromArray(new Uint8Array(17), {
    type: 'uint8',
    size: 1
  });
  await expect(oversizedEvaluator.evaluate(device)).rejects.toThrow(
    'Buffer pool cannot allocate 17 bytes: device.limits.maxBufferSize is 16'
  );

  smallerEvaluator.destroy();
  oversizedEvaluator.destroy();
  device.destroy();
});

test('GPUDataEvaluator.fromGPUData accepts packed Float16 chunks', () => {
  const device = new NullDevice({});
  const vector2 = makeUint16Vector(device, 'colors16x2', [0x3c00, 0x3800], 2, {
    format: 'float16x2'
  });
  const vector4 = makeUint16Vector(device, 'colors16x4', [0x3c00, 0x3800, 0x3400, 0x3000], 4, {
    format: 'float16x4'
  });

  const evaluator2 = GPUDataEvaluator.fromGPUData(vector2.data[0]);
  const evaluator4 = GPUDataEvaluator.fromGPUData(vector4.data[0]);

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

test('GPUDataEvaluator.fromGPUData validates fixed-width chunks and preserves strides', () => {
  const device = new NullDevice({});
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

  expect(() => GPUDataEvaluator.fromGPUData(mismatchedRowByteLength.data[0])).toThrow(
    /requires rowByteLength 8/
  );
  const stridedEvaluator = GPUDataEvaluator.fromGPUData(unpacked.data[0]);
  expect(stridedEvaluator.stride).toBe(12);
  expect(stridedEvaluator.byteLength).toBe(8);

  stridedEvaluator.destroy();
  mismatchedRowByteLength.destroy();
  unpacked.destroy();
  device.destroy();
});

test('GPUDataEvaluator.readValue only reads requested rows from GPU buffers', async () => {
  const device = new NullDevice({});
  const packed = makeFloat32Vector(device, 'packed-values', [10, 11, 20, 21, 30, 31, 40, 41], 2);
  const strided = makeFloat32Vector(
    device,
    'strided-values',
    [10, 11, -1, 20, 21, -1, 30, 31, -1],
    2,
    {
      byteStride: 12,
      rowByteLength: 8
    }
  );

  const packedEvaluator = GPUDataEvaluator.fromGPUData(packed.data[0]);
  const stridedEvaluator = new GPUDataEvaluator({
    id: 'strided-evaluator',
    type: 'float32',
    size: 2,
    stride: 12,
    length: 3,
    buffer: strided.data[0].buffer,
    format: 'float32x2'
  });

  const packedBuffer = packed.data[0].buffer;
  const stridedBuffer = strided.data[0].buffer;
  const packedReadAsyncSpy = vi.spyOn(packedBuffer, 'readAsync');
  const stridedReadAsyncSpy = vi.spyOn(stridedBuffer, 'readAsync');
  const unevaluatedEvaluator = GPUDataEvaluator.fromArray([1, 2], {size: 1});

  expect(packedEvaluator.buffer).toBe(packedBuffer);
  expect(stridedEvaluator.buffer).toBe(stridedBuffer);
  expect(() => unevaluatedEvaluator.buffer).toThrow(/not evaluated/);

  expect(Array.from(await packedEvaluator.readValue(1, 3))).toEqual([20, 21, 30, 31]);
  expect(packedReadAsyncSpy).toHaveBeenCalledWith(8, 16);

  expect(Array.from(await stridedEvaluator.readValue(1, 3))).toEqual([20, 21, 30, 31]);
  expect(stridedReadAsyncSpy).toHaveBeenCalledWith(12, 20);

  packedReadAsyncSpy.mockRestore();
  stridedReadAsyncSpy.mockRestore();
  unevaluatedEvaluator.destroy();
  packedEvaluator.destroy();
  stridedEvaluator.destroy();
  packed.destroy();
  strided.destroy();
  device.destroy();
});

function makeFloat32Vector(
  device: Device,
  name: string,
  values: number[],
  stride: number,
  options: {byteStride?: number; rowByteLength?: number} = {}
): GPUVector {
  const data = new Float32Array(values);
  const byteStride = options.byteStride ?? stride * Float32Array.BYTES_PER_ELEMENT;
  const rowByteLength = options.rowByteLength ?? stride * Float32Array.BYTES_PER_ELEMENT;
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
    byteStride,
    rowByteLength,
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
