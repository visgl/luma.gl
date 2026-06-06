// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, NativeFloat16ArrayConstructor, type Device} from '@luma.gl/core';
import {getGPUTableEvaluator, GPUTableEvaluator} from '@luma.gl/gpgpu';
import {GPUData, GPUVector, type GPUVectorFormat} from '@luma.gl/tables';
import {NullDevice} from '@luma.gl/test-utils';
import {expect, test, vi} from 'vitest';

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

test('GPUTableEvaluator.fromGPUVector accepts single-chunk segmented vectors', async () => {
  const device = new NullDevice({});
  const values = new Float32Array([99, 99, 0, 0, 1, 1, 2, 2]);
  const buffer = device.createBuffer({
    usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    data: values
  });
  const vector = new GPUVector({
    type: 'data',
    name: 'paths',
    format: 'vertex-list<float32x2>',
    data: [
      new GPUData({
        buffer,
        format: 'vertex-list<float32x2>',
        length: 2,
        valueLength: 4,
        stride: 2,
        byteStride: 8,
        rowByteLength: 8,
        ownsBuffer: true,
        readbackMetadata: {
          kind: 'variable-length-attribute',
          valueOffsets: new Int32Array([1, 3, 4]),
          nullCount: 0,
          valueByteLength: values.byteLength
        }
      })
    ],
    ownsData: true
  });

  const evaluator = GPUTableEvaluator.fromGPUVector(vector);

  expect(evaluator.type).toBe('float32');
  expect(evaluator.size).toBe(2);
  expect(evaluator.length).toBe(4);
  expect(evaluator.format).toBe('float32x2');
  expect(evaluator.gpuVector.format).toBe('float32x2');
  expect(evaluator.startIndices?.length).toBe(3);
  expect(Array.from(evaluator.startIndices!.value!)).toEqual([1, 3, 4]);
  expect(Array.from(await evaluator.readValue())).toEqual(Array.from(values));

  evaluator.destroy();
  vector.destroy();
  device.destroy();
});

test('getGPUTableEvaluator converts numeric inputs to constants', () => {
  const scalar = getGPUTableEvaluator(2);
  expect(scalar.isConstant).toBe(true);
  expect(scalar.size).toBe(1);
  expect(Array.from(scalar.value!)).toEqual([2]);

  const vector = getGPUTableEvaluator([1, 2]);
  expect(vector.isConstant).toBe(true);
  expect(vector.size).toBe(2);
  expect(Array.from(vector.value!)).toEqual([1, 2]);
});

test('GPUTableEvaluator.readValue only reads requested rows from GPU buffers', async () => {
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

  const packedEvaluator = GPUTableEvaluator.fromGPUVector(packed);
  const stridedEvaluator = new GPUTableEvaluator({
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
  const unevaluatedEvaluator = GPUTableEvaluator.fromArray([1, 2], {size: 1});

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
