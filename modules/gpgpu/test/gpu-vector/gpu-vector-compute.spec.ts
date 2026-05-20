// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer} from '@luma.gl/core';
import {add, fround, GPUTableEvaluator, interleave} from '@luma.gl/gpgpu';
import {GPUVector} from '@luma.gl/tables';
import {getTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import '../operations/fixtures';

for (const deviceType of ['webgl', 'webgpu'] as const) {
  test(`GPUVector compute#add:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const x = makeFloat32Vector(device, 'x', [0, 1, 2, 3, 4, 5], 2);
    const y = makeFloat32Vector(device, 'y', [10, 20, 30, 40, 50, 60], 2);
    const sum = add(x, y);
    const result = await sum.evaluateToGPUVector(device, {name: 'sum'});

    expect(result.name).toBe('sum');
    expect(arrow.util.compareTypes(result.type, x.type)).toBe(true);
    expect(Array.from(await readFloat32Vector(result))).toEqual([10, 21, 32, 43, 54, 65]);

    const xBuffer = x.buffer;
    const sumBuffer = sum.buffer;
    result.destroy();
    expect(xBuffer.destroyed).toBe(false);
    expect(sumBuffer.destroyed).toBe(false);
    expect(Array.from(await sum.readValue())).toEqual([10, 21, 32, 43, 54, 65]);
    sum.destroy();
    x.destroy();
    y.destroy();
  });

  test(`GPUVector compute#lazy evaluator chain:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const x = makeFloat32Vector(device, 'x', [0, 1, 2, 3], 2);
    const y = makeFloat32Vector(device, 'y', [10, 20, 30, 40], 2);
    const z = makeFloat32Vector(device, 'z', [100, 200], 1);
    const sum = add(x, y);
    const packed = interleave(sum, z);
    const result = await packed.evaluateToGPUVector(device, {
      name: 'packed',
      interleaved: {
        attributes: [
          {attribute: 'sum', format: 'float32x2', byteOffset: 0},
          {attribute: 'z', format: 'float32', byteOffset: 8}
        ]
      }
    });

    expect(result.name).toBe('packed');
    expect(arrow.DataType.isBinary(result.type)).toBe(true);
    expect(result.bufferLayout).toEqual({
      name: 'packed',
      byteStride: 12,
      attributes: [
        {attribute: 'sum', format: 'float32x2', byteOffset: 0},
        {attribute: 'z', format: 'float32', byteOffset: 8}
      ]
    });
    expect(Array.from(await readFloat32Vector(result))).toEqual([10, 21, 100, 32, 43, 200]);

    const packedBuffer = packed.buffer;
    result.destroy();
    expect(packedBuffer.destroyed).toBe(false);
    packed.destroy();
    sum.destroy();
    x.destroy();
    y.destroy();
    z.destroy();
  });

  test(`GPUVector compute#fround:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const values = [Math.PI, -122.123456789, Math.E, 37.987654321];
    const source = makeFloat64Vector(device, 'positions64', values, 2);
    const rounded = fround(source);
    const result = await rounded.evaluateToGPUVector(device, {name: 'positions32'});

    expect(result.name).toBe('positions32');
    expect(result.stride).toBe(4);
    expect(Array.from(await readFloat32Vector(result))).toEqual(splitFloat64Rows(values, 2));

    const outputBuffer = rounded.buffer;
    result.destroy();
    expect(outputBuffer.destroyed).toBe(false);
    rounded.destroy();
    source.destroy();
  });

  test(`GPUVector compute#fromGPUVector:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const vector = makeFloat32Vector(device, 'values', [1, 2, 3], 1);
    const evaluator = GPUTableEvaluator.fromGPUVector(vector);
    const result = await evaluator.evaluateToGPUVector(device, {name: 'values-view'});

    expect(result.name).toBe('values-view');
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
    dataType: makeDataType(new arrow.Float32(), stride),
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
    dataType: makeDataType(new arrow.Float64(), stride),
    length: values.length / stride,
    stride,
    byteStride: stride * Float64Array.BYTES_PER_ELEMENT,
    rowByteLength: stride * Float64Array.BYTES_PER_ELEMENT,
    ownsBuffer: true
  });
}

function makeDataType(type: arrow.DataType, stride: number): arrow.DataType {
  return stride === 1
    ? type
    : new arrow.FixedSizeList(stride, new arrow.Field('value', type, false));
}

async function readFloat32Vector(vector: GPUVector): Promise<Float32Array> {
  const readByteLength = (vector.length - 1) * vector.byteStride + vector.rowByteLength;
  const bytes = await vector.buffer.readAsync(vector.byteOffset, readByteLength);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return new Float32Array(arrayBuffer);
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
