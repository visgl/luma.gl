// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {add, fround, GPUDataEvaluator, GPUVectorEvaluator, interleave} from '@luma.gl/gpgpu';
import {GPUVector, type GPUVectorFormat} from '@luma.gl/tables';
import {getTestDevice} from '@luma.gl/test-utils';
import {expect, test} from 'vitest';
import '../operations/fixtures';

for (const deviceType of ['webgl', 'webgpu'] as const) {
  test(`GPUData compute#add:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const x = makeFloat32Vector(device, 'x', [0, 1, 2, 3, 4, 5], 2);
    const y = makeFloat32Vector(device, 'y', [10, 20, 30, 40, 50, 60], 2);
    const sum = add(x.data[0], y.data[0]);
    const result = await sum.evaluate(device, {name: 'sum'});

    expect(result.name).toBe('sum');
    expect(result.format).toBe(x.format);
    expect(Array.from(await readFloat32Vector(result))).toEqual([10, 21, 32, 43, 54, 65]);

    const xBuffer = getBuffer(x);
    const sumBuffer = getBuffer(sum.gpuVector);
    result.destroy();
    expect(xBuffer.destroyed).toBe(false);
    expect(sumBuffer.destroyed).toBe(false);
    expect(Array.from(await sum.readValue())).toEqual([10, 21, 32, 43, 54, 65]);
    sum.destroy();
    x.destroy();
    y.destroy();
  });

  test(`GPUVectorEvaluator compute#mapGPUData:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const x0 = makeFloat32Vector(device, 'x0', [0, 1, 2, 3], 2);
    const x1 = makeFloat32Vector(device, 'x1', [4, 5, 6, 7], 2);
    const vector = new GPUVector({
      type: 'data',
      name: 'x',
      format: 'float32x2',
      data: [x0.data[0], x1.data[0]]
    });
    const offset = GPUDataEvaluator.fromConstant([10, 20]);
    const transformed = GPUVectorEvaluator.fromGPUVector(vector).mapGPUData(data =>
      add(data, offset)
    );
    const result = await transformed.evaluate(device, {name: 'sum'});

    expect(result.name).toBe('sum');
    expect(result.data).toHaveLength(2);
    expect(Array.from(await readFloat32Data(result.data[0]))).toEqual([10, 21, 12, 23]);
    expect(Array.from(await readFloat32Data(result.data[1]))).toEqual([14, 25, 16, 27]);

    transformed.destroy();
    offset.destroy();
    vector.destroy();
    x0.destroy();
    x1.destroy();
  });

  test(`GPUData compute#add synthesizes widened output type:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const x = makeFloat32Vector(device, 'x', [1, 2, 3], 1);
    const y = makeFloat32Vector(device, 'y', [10, 20, 30, 40, 50, 60], 2);
    const sum = add(x.data[0], y.data[0]);
    const result = await sum.evaluate(device, {name: 'sum'});

    expect(result.format).toBe('float32x2');
    expect(Array.from(await readFloat32Vector(result))).toEqual([11, 21, 32, 42, 53, 63]);

    sum.destroy();
    x.destroy();
    y.destroy();
  });

  test(`GPUData compute#lazy evaluator chain:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const x = makeFloat32Vector(device, 'x', [0, 1, 2, 3], 2);
    const y = makeFloat32Vector(device, 'y', [10, 20, 30, 40], 2);
    const z = makeFloat32Vector(device, 'z', [100, 200], 1);
    const sum = add(x.data[0], y.data[0]);
    const packed = interleave(sum, z.data[0]);
    const result = await packed.evaluate(device, {
      name: 'packed',
      interleaved: {
        attributes: [
          {attribute: 'sum', format: 'float32x2', byteOffset: 0},
          {attribute: 'z', format: 'float32', byteOffset: 8}
        ]
      }
    });

    expect(result.name).toBe('packed');
    expect(result.format).toBeUndefined();
    expect(result.bufferLayout).toEqual({
      name: 'packed',
      byteStride: 12,
      attributes: [
        {attribute: 'sum', format: 'float32x2', byteOffset: 0},
        {attribute: 'z', format: 'float32', byteOffset: 8}
      ]
    });
    expect(Array.from(await readFloat32Vector(result))).toEqual([10, 21, 100, 32, 43, 200]);

    const packedBuffer = getBuffer(packed.gpuVector);
    result.destroy();
    expect(packedBuffer.destroyed).toBe(false);
    packed.destroy();
    sum.destroy();
    x.destroy();
    y.destroy();
    z.destroy();
  });

  test(`GPUData compute#interleave synthesizes flattened attributes:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const x = makeFloat32Vector(device, 'x', [1, 2], 1);
    const y = makeFloat32Vector(device, 'y', [10, 20], 1);
    const z = makeFloat32Vector(device, 'z', [100, 200], 1);
    const xEvaluator = GPUDataEvaluator.fromGPUData(x.data[0], {id: x.name});
    const yEvaluator = GPUDataEvaluator.fromGPUData(y.data[0], {id: y.name});
    const zEvaluator = GPUDataEvaluator.fromGPUData(z.data[0], {id: z.name});
    const packed = interleave(xEvaluator, yEvaluator, zEvaluator);
    const result = await packed.evaluate(device, {name: 'packed3', interleaved: true});

    expect(result.bufferLayout).toEqual({
      name: 'packed3',
      byteStride: 12,
      attributes: [
        {attribute: 'x', format: 'float32', byteOffset: 0},
        {attribute: 'y', format: 'float32', byteOffset: 4},
        {attribute: 'z', format: 'float32', byteOffset: 8}
      ]
    });
    expect(Array.from(await readFloat32Vector(result))).toEqual([1, 10, 100, 2, 20, 200]);

    packed.destroy();
    xEvaluator.destroy();
    yEvaluator.destroy();
    zEvaluator.destroy();
    x.destroy();
    y.destroy();
    z.destroy();
  });

  test(`GPUData compute#fround:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const values = [Math.PI, -122.123456789, Math.E, 37.987654321];
    const source = makeFloat64Vector(device, 'positions64', values, 2);
    const rounded = fround(source.data[0]);
    const result = await rounded.evaluate(device, {name: 'positions32'});

    expect(result.name).toBe('positions32');
    expect(result.stride).toBe(4);
    expect(Array.from(await readFloat32Vector(result))).toEqual(splitFloat64Rows(values, 2));

    const outputBuffer = getBuffer(rounded.gpuVector);
    result.destroy();
    expect(outputBuffer.destroyed).toBe(false);
    rounded.destroy();
    source.destroy();
  });

  test(`GPUData compute#fromGPUData:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const vector = makeFloat32Vector(device, 'values', [1, 2, 3], 1);
    const evaluator = GPUDataEvaluator.fromGPUData(vector.data[0], {id: vector.name});
    const result = await evaluator.evaluate(device, {name: 'values-view'});

    expect(result.data[0]).toBe(vector.data[0]);
    expect(result.name).toBe('values');
    expect(Array.from(await readFloat32Vector(result))).toEqual([1, 2, 3]);
    result.destroy();
    evaluator.destroy();
    vector.destroy();
  });
}

function makeFloat32Vector(
  device: NonNullable<Awaited<ReturnType<typeof getTestDevice>>>,
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

function makeFloat64Vector(
  device: NonNullable<Awaited<ReturnType<typeof getTestDevice>>>,
  name: string,
  values: number[],
  stride: number
): GPUVector {
  const data = new Float64Array(values);
  const buffer = device.createBuffer({
    usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    data
  });
  return new GPUVector({
    type: 'buffer',
    name,
    buffer,
    format: getUint32VectorFormat(stride * 2),
    length: values.length / stride,
    stride,
    byteStride: stride * Float64Array.BYTES_PER_ELEMENT,
    rowByteLength: stride * Float64Array.BYTES_PER_ELEMENT,
    ownsBuffer: true
  });
}

function getFloat32VectorFormat(stride: number): GPUVectorFormat {
  return (stride === 1 ? 'float32' : `float32x${stride}`) as GPUVectorFormat;
}

function getUint32VectorFormat(stride: number): GPUVectorFormat {
  return (stride === 1 ? 'uint32' : `uint32x${stride}`) as GPUVectorFormat;
}

async function readFloat32Vector(vector: GPUVector): Promise<Float32Array> {
  const readByteLength = (vector.length - 1) * vector.byteStride + vector.rowByteLength;
  const bytes = await getBuffer(vector).readAsync(vector.byteOffset, readByteLength);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Float32Array(arrayBuffer);
}

async function readFloat32Data(data: GPUVector['data'][number]): Promise<Float32Array> {
  const buffer = data.buffer instanceof Buffer ? data.buffer : data.buffer.buffer;
  const readByteLength = (data.length - 1) * data.byteStride + data.rowByteLength;
  const bytes = await buffer.readAsync(data.byteOffset, readByteLength);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Float32Array(arrayBuffer);
}

function getBuffer(vector: GPUVector): Buffer {
  const buffer = vector.data[0].buffer;
  return buffer instanceof Buffer ? buffer : buffer.buffer;
}

function splitFloat64Rows(values: number[], stride: number): number[] {
  const result = new Array<number>(values.length * 2);
  for (let rowStart = 0; rowStart < values.length; rowStart += stride) {
    for (let component = 0; component < stride; component++) {
      const value = values[rowStart + component];
      const high = Math.fround(value);
      const low = Math.fround(value - high);
      result[rowStart * 2 + component] = high;
      result[rowStart * 2 + component + stride] = low;
    }
  }
  return result;
}
