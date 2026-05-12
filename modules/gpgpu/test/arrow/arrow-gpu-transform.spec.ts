// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {ArrowGPUVector, makeArrowFixedSizeListVector} from '@luma.gl/arrow';
import {
  ArrowAddOperation,
  ArrowGPUTransform,
  arrowAdd,
  arrowDeinterleave,
  arrowDesegment,
  arrowFround,
  arrowInterleave,
  arrowProjectWGS84ToPseudoMercator,
  arrowSegment,
  arrowUpload,
  evaluateGPUComputeGraph
} from '@luma.gl/gpgpu';
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

  test(`evaluateGPUComputeGraph#upload:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const x = makeArrowFixedSizeListVector(new arrow.Float32(), 2, new Float32Array([0, 1, 2, 3]));
    const table = new arrow.Table({
      y: makeArrowFixedSizeListVector(new arrow.Float32(), 2, new Float32Array([10, 20, 30, 40]))
    });
    const result = evaluateGPUComputeGraph(
      arrowAdd(arrowUpload(x, {name: 'x'}), arrowUpload(table, 'y', {name: 'y'}), {name: 'sum'}),
      device
    );

    expect(result.name).toBe('sum');
    expect(await readFloat32(result)).toEqual([10, 21, 32, 43]);

    result.destroy();
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

  test(`ArrowGPUTransform#segment/desegment:${deviceType}`, async t => {
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
    const segmented = transform.segment([positions, weights], {
      name: 'segments',
      segments: ['positions', 'weights']
    });
    const packedPositions = transform.desegment(segmented, 'positions', {name: 'packedPositions'});
    const packedWeights = transform.desegment(segmented, 'weights', {name: 'packedWeights'});

    expect(segmented.name).toBe('segments');
    expect(arrow.DataType.isBinary(segmented.type)).toBe(true);
    expect(segmented.segmentedBufferLayout).toEqual({
      alignment: 256,
      byteLength: 512,
      segments: [
        {
          name: 'positions',
          arrowType: positions.type,
          length: 2,
          byteOffset: 0,
          byteLength: 16,
          byteStride: 8
        },
        {
          name: 'weights',
          arrowType: weights.type,
          length: 2,
          byteOffset: 256,
          byteLength: 8,
          byteStride: 4
        }
      ]
    });
    expect(packedPositions.name).toBe('packedPositions');
    expect(await readFloat32(packedPositions)).toEqual([0, 1, 2, 3]);
    expect(packedWeights.name).toBe('packedWeights');
    expect(await readFloat32(packedWeights)).toEqual([10, 20]);

    positions.destroy();
    weights.destroy();
    segmented.destroy();
    packedPositions.destroy();
    packedWeights.destroy();
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

  test(`evaluateGPUComputeGraph#chained evaluate:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const x = makeVector(device, 'x', [0, 1, 2, 3], 2);
    const y = makeVector(device, 'y', [10, 20, 30, 40], 2);
    const sum = arrowAdd(x, y, {name: 'sum'});
    const interleaved = arrowInterleave([sum, x], {
      name: 'sum_positions',
      attributes: ['sum', 'positions']
    });
    const result = evaluateGPUComputeGraph(interleaved);

    expect(result.name).toBe('sum_positions');
    expect(await readFloat32(result)).toEqual([10, 21, 0, 1, 32, 43, 2, 3]);

    x.destroy();
    y.destroy();
    result.destroy();
  });

  test(`evaluateGPUComputeGraph#deinterleave:${deviceType}`, async t => {
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
    const interleaved = evaluateGPUComputeGraph(
      arrowInterleave([positions, weights], {
        name: 'instances',
        attributes: ['positions', 'weights']
      })
    );
    const packedPositions = evaluateGPUComputeGraph(
      arrowDeinterleave(interleaved, 'positions', {name: 'packedPositions'})
    );
    const packedWeights = evaluateGPUComputeGraph(
      arrowDeinterleave(interleaved, 'weights', {name: 'packedWeights'})
    );

    expect(packedPositions.name).toBe('packedPositions');
    expect(packedPositions.stride).toBe(2);
    expect(await readFloat32(packedPositions)).toEqual([0, 1, 2, 3]);
    expect(packedWeights.name).toBe('packedWeights');
    expect(packedWeights.stride).toBe(1);
    expect(await readFloat32(packedWeights)).toEqual([10, 20]);

    positions.destroy();
    weights.destroy();
    interleaved.destroy();
    packedPositions.destroy();
    packedWeights.destroy();
  });

  test(`evaluateGPUComputeGraph#segment chained evaluate:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const x = makeVector(device, 'x', [0, 1, 2, 3], 2);
    const y = makeVector(device, 'y', [10, 20, 30, 40], 2);
    const z = makeVector(device, 'z', [100, 200, 300, 400], 2);
    const segmented = arrowSegment([x, y], {name: 'xy', segments: ['x', 'y']});
    const xSegment = arrowDesegment(segmented, 'x', {name: 'xPacked'});
    const result = evaluateGPUComputeGraph(arrowAdd(xSegment, z, {name: 'sum'}));

    expect(result.name).toBe('sum');
    expect(await readFloat32(result)).toEqual([100, 201, 302, 403]);

    x.destroy();
    y.destroy();
    z.destroy();
    result.destroy();
  });

  test(`evaluateGPUComputeGraph#inferred device:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const x = makeVector(device, 'x', [0, 1, 2, 3], 2);
    const y = makeVector(device, 'y', [10, 20, 30, 40], 2);
    const result = evaluateGPUComputeGraph(arrowAdd(x, y, {name: 'sum'}));

    expect(result.name).toBe('sum');
    expect(await readFloat32(result)).toEqual([10, 21, 32, 43]);

    x.destroy();
    y.destroy();
    result.destroy();
  });

  test(`evaluateGPUComputeGraph#explicit operation class:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const x = makeVector(device, 'x', [0, 1, 2, 3], 2);
    const y = makeVector(device, 'y', [10, 20, 30, 40], 2);
    const sum = new ArrowAddOperation({parameters: {x, y}, props: {name: 'sum'}});
    const result = evaluateGPUComputeGraph(sum);

    expect(result.name).toBe('sum');
    expect(await readFloat32(result)).toEqual([10, 21, 32, 43]);

    x.destroy();
    y.destroy();
    result.destroy();
  });

  test(`evaluateGPUComputeGraph#fround evaluate:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const input: ArrowGPUVector<arrow.Float64> = new ArrowGPUVector({
      type: 'arrow',
      name: 'positions64',
      device,
      vector: arrow.makeVector(new Float64Array([0.25, Math.E]))
    });
    const roundedNode = arrowFround(input, {name: 'positions32'});
    const rounded = evaluateGPUComputeGraph(roundedNode);

    expect(rounded.name).toBe('positions32');
    expect(await readFloat32(rounded)).toEqual(splitFloat64Values([0.25, Math.E]));

    input.destroy();
    rounded.destroy();
  });

  test(`evaluateGPUComputeGraph#project WGS84 to pseudo-Mercator:${deviceType}`, async t => {
    const device = await getTestDevice(deviceType);
    if (!device) {
      t.annotate(`${deviceType} not available`);
      return;
    }

    const input: ArrowGPUVector<arrow.FixedSizeList<arrow.Float64>> = new ArrowGPUVector({
      type: 'arrow',
      name: 'lonLat64',
      device,
      vector: makeArrowFixedSizeListVector(
        new arrow.Float64(),
        2,
        new Float64Array([-122.4194, 37.7749, -74.006, 40.7128])
      )
    });
    const rounded = arrowFround(input, {name: 'lonLat32'});
    const projected = evaluateGPUComputeGraph(
      arrowProjectWGS84ToPseudoMercator(rounded, {name: 'xy3857'})
    );
    const values = await readFloat32(projected);
    const expected = projectWGS84ToPseudoMercatorSplit([-122.4194, 37.7749, -74.006, 40.7128]);

    expect(projected.name).toBe('xy3857');
    expect(projected.stride).toBe(4);
    for (let index = 0; index < values.length; index++) {
      expect(Math.abs(values[index] - expected[index]), `component ${index}`).toBeLessThan(8);
    }
    expect(Math.abs(values[2])).toBeGreaterThan(0);
    expect(Math.abs(values[3])).toBeGreaterThan(0);

    input.destroy();
    projected.destroy();
  });
}

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

function projectWGS84ToPseudoMercatorSplit(values: number[]): number[] {
  const radius = 6378137;
  const degreesToRadians = Math.PI / 180;
  const maxLatitude = 85.05112878;
  const quarterPi = Math.PI / 4;
  const result: number[] = [];

  for (let index = 0; index < values.length; index += 2) {
    const longitudeHigh = Math.fround(values[index]);
    const latitudeHigh = Math.fround(values[index + 1]);
    const longitudeLow = Math.fround(values[index] - longitudeHigh);
    const latitudeLow = Math.fround(values[index + 1] - latitudeHigh);
    const clampedLatitudeHigh = Math.min(maxLatitude, Math.max(-maxLatitude, latitudeHigh));
    const projectedXHigh = Math.fround(longitudeHigh * radius * degreesToRadians);
    const projectedYHigh = Math.fround(
      radius * Math.log(Math.tan(quarterPi + clampedLatitudeHigh * degreesToRadians * 0.5))
    );
    const projectedXLow = Math.fround(longitudeLow * radius * degreesToRadians);
    const projectedYLow = Math.fround(
      latitudeLow * ((radius * degreesToRadians) / Math.cos(clampedLatitudeHigh * degreesToRadians))
    );
    result.push(projectedXHigh, projectedYHigh, projectedXLow, projectedYLow);
  }

  return result;
}
