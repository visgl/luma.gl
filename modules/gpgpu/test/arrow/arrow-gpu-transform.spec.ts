// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {ArrowGPUVector, makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import {ArrowGPUComputeGraph, ArrowGPUTransform, addInPlace, froundInPlace} from '@luma.gl/gpgpu';
import type {Device} from '@luma.gl/core';
import {getTestDevice} from '@luma.gl/test-utils';
import * as arrow from 'apache-arrow';

for (const deviceType of ['webgl', 'webgpu'] as const) {
  test(`ArrowGPUTransform#add:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const x = makeVector(device, 'x', [0, 1, 2, 3], 2);
    const y = makeVector(device, 'y', [10, 20, 30, 40], 2);
    const transform = new ArrowGPUTransform(device);
    const sum = transform.add(x, y, {name: 'sum'});

    expect(sum.name).toBe('sum');
    expect(sum.length).toBe(2);
    expect(sum.stride).toBe(2);
    expect(await readFloat32(sum)).toEqual([10, 21, 32, 43]);

    x.destroy();
    y.destroy();
    sum.destroy();
  });

  test(`ArrowGPUTransform#interleave:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const positions = makeVector(device, 'positions', [0, 1, 2, 3], 2);
    const weights = new ArrowGPUVector({
      type: 'arrow',
      name: 'weights',
      device,
      vector: arrow.makeVector(new Float32Array([10, 20]))
    });
    const transform = new ArrowGPUTransform(device);
    const interleaved = transform.interleave([positions, weights], {
      name: 'instances',
      attributes: ['positions', 'weights']
    });

    expect(interleaved.name).toBe('instances');
    expect(arrow.DataType.isBinary(interleaved.type)).toBe(true);
    expect(interleaved.byteStride).toBe(12);
    expect(interleaved.bufferLayout).toEqual({
      name: 'instances',
      byteStride: 12,
      attributes: [
        {attribute: 'positions', format: 'float32x2', byteOffset: 0},
        {attribute: 'weights', format: 'float32', byteOffset: 8}
      ]
    });
    expect(await readFloat32(interleaved)).toEqual([0, 1, 10, 2, 3, 20]);

    positions.destroy();
    weights.destroy();
    interleaved.destroy();
  });

  test(`ArrowGPUTransform#fround:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const input: ArrowGPUVector<arrow.Float64> = new ArrowGPUVector({
      type: 'arrow',
      name: 'positions64',
      device,
      vector: arrow.makeVector(new Float64Array([0.1, Math.PI]))
    });
    const transform = new ArrowGPUTransform(device);
    const rounded: ArrowGPUVector<arrow.FixedSizeList<arrow.Float32>> = transform.fround(input, {
      name: 'positions32'
    });

    expect(rounded.name).toBe('positions32');
    expect(arrow.DataType.isFixedSizeList(rounded.type)).toBe(true);
    expect(rounded.stride).toBe(2);
    expect(await readFloat32(rounded)).toEqual(splitFloat64Values([0.1, Math.PI]));

    input.destroy();
    rounded.destroy();
  });

  test(`ArrowGPUComputeGraph#chained evaluate:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const x = makeVector(device, 'x', [0, 1, 2, 3], 2);
    const y = makeVector(device, 'y', [10, 20, 30, 40], 2);
    const graph = new ArrowGPUComputeGraph(device);
    const sum = graph.add(x, y, {name: 'sum'});
    const interleaved = graph.interleave([sum, x], {
      name: 'sum_positions',
      attributes: ['sum', 'positions']
    });
    const result = graph.evaluate(interleaved);

    expect(result.name).toBe('sum_positions');
    expect(await readFloat32(result)).toEqual([10, 21, 0, 1, 32, 43, 2, 3]);

    x.destroy();
    y.destroy();
    result.destroy();
  });
}

test('froundInPlace mutates a Float64 vector buffer on WebGPU', async t => {
  const device = await getTestDevice('webgpu');
  if (!device) {
    t.annotate('webgpu not available');
    return;
  }

  const input: ArrowGPUVector<arrow.Float64> = new ArrowGPUVector({
    type: 'arrow',
    name: 'positions64',
    device,
    vector: arrow.makeVector(new Float64Array([0.1, Math.PI]))
  });
  const rounded: ArrowGPUVector<arrow.FixedSizeList<arrow.Float32>> = froundInPlace(input);

  expect(rounded.name).toBe('positions64_fround');
  expect(rounded.buffer).toBe(input.buffer);
  expect(input.ownsBuffer).toBe(false);
  expect(rounded.ownsBuffer).toBe(true);
  expect(arrow.DataType.isFixedSizeList(rounded.type)).toBe(true);
  expect(rounded.stride).toBe(2);
  expect(await readFloat32(rounded)).toEqual(splitFloat64Values([0.1, Math.PI]));

  input.destroy();
  rounded.destroy();
});

test('addInPlace mutates the left Float32 vector buffer on WebGPU', async t => {
  const device = await getTestDevice('webgpu');
  if (!device) {
    t.annotate('webgpu not available');
    return;
  }

  const x = makeVector(device, 'x', [0, 1, 2, 3], 2);
  const y = makeVector(device, 'y', [10, 20, 30, 40], 2);
  const sum: ArrowGPUVector<arrow.FixedSizeList<arrow.Float32>> = addInPlace(x, y, {name: 'sum'});

  expect(sum.name).toBe('sum');
  expect(sum.buffer).toBe(x.buffer);
  expect(x.ownsBuffer).toBe(false);
  expect(y.ownsBuffer).toBe(true);
  expect(sum.ownsBuffer).toBe(true);
  expect(await readFloat32(sum)).toEqual([10, 21, 32, 43]);

  x.destroy();
  y.destroy();
  sum.destroy();
});

function makeVector(
  device: Device,
  name: string,
  values: number[],
  size: 2
): ArrowGPUVector<arrow.FixedSizeList<arrow.Float32>> {
  return new ArrowGPUVector({
    type: 'arrow',
    name,
    device,
    vector: makeArrowFixedSizeListVector(new arrow.Float32(), size, new Float32Array(values))
  });
}

async function readFloat32(vector: ArrowGPUVector): Promise<number[]> {
  const bytes = await vector.buffer.readAsync(0, vector.length * vector.byteStride);
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
}

function splitFloat64Values(values: number[]): number[] {
  return values.flatMap(value => {
    const highPart = Math.fround(value);
    const lowPart = Math.fround(value - highPart);
    return [highPart, lowPart];
  });
}
