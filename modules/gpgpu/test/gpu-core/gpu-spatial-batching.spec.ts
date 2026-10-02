// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  GPUGridBinning,
  GPUGridAggregation,
  GPUPointSpatialFilter,
  type GraphDataView,
  type GraphVectorView
} from '@luma.gl/gpgpu/gpu-core';
import {BATCH_PARTITIONS, BatchConformanceFixture} from './batch-conformance-utils';

for (const featureLevel of ['core', 'max'] as const) {
  for (const gridSize of [
    [1, 1],
    [2, 2],
    [17, 17]
  ] as const) {
    for (const partition of BATCH_PARTITIONS) {
      test(`spatial grids: ${featureLevel}, ${gridSize}, ${partition.name}`, async () => {
        const device = await getWebGPUTestDevice(featureLevel);
        if (!device) return;
        const fixture = new BatchConformanceFixture(device);
        const atomic = 'atomic' in partition && partition.atomic;
        const positions = fixture.column(
          'positions',
          'float32x2',
          Array(12).fill(0),
          partition.input,
          {atomic}
        );
        const weights = fixture.column('weights', 'float32', Array(6).fill(0), partition.paired);
        const capacity = gridSize[0] * gridSize[1];
        const counts = fixture.column(
          'counts',
          'uint32',
          Array(capacity).fill(77),
          atomic ? [capacity] : split(capacity, capacity > 256 ? 257 : 2),
          {atomic}
        );
        const outputs = (['sum', 'min', 'max', 'mean'] as const).map((operation, index) => ({
          operation,
          output: fixture.column(
            operation,
            'float32',
            Array(capacity).fill(77),
            split(capacity, index + 1)
          )
        }));
        const gpuBounds = fixture.output('bounds', 'float32x4', 1);
        fixture.graph.add([
          new GPUGridBinning({
            positions,
            output: counts,
            gridSize,
            bounds: atomic ? [0, 0, 1, 1] : gpuBounds
          }),
          ...outputs.map(
            ({operation, output}) =>
              new GPUGridAggregation({
                id: operation,
                positions,
                weights,
                output,
                gridSize,
                operation,
                bounds: atomic ? [0, 0, 1, 1] : gpuBounds
              })
          )
        ]);
        const executable = fixture.graph.compile();
        try {
          for (let iteration = 0; iteration < 3; iteration++) {
            const points =
              iteration === 0
                ? [0, 0, 1, 1, 0.25, 0.5, 1, 0.25, -1, 0.5, NaN, 0.5]
                : Array(12).fill(iteration === 1 ? 1 : NaN);
            const contributions =
              iteration === 0 ? [1, 2, -3, NaN, 5, 6] : [-2, 4, 0, 6, Infinity, NaN];
            const bounds = !atomic && iteration === 1 ? [1, 1, 1, 1] : [0, 0, 1, 1];
            write(fixture, positions, points);
            write(fixture, weights, contributions);
            write(fixture, gpuBounds, bounds);
            const encoder = device.createCommandEncoder();
            executable.encode(encoder, {parameters: undefined});
            device.submit(encoder.finish());
            const expectedCounts = Array(capacity).fill(0);
            const cells: number[][] = Array.from({length: capacity}, () => []);
            for (let row = 0; row < 6; row++) {
              const [x, y] = points.slice(row * 2, row * 2 + 2);
              if (
                !Number.isFinite(x) ||
                !Number.isFinite(y) ||
                x < bounds[0] ||
                x > bounds[2] ||
                y < bounds[1] ||
                y > bounds[3]
              )
                continue;
              const column = coordinate(x, bounds[0], bounds[2], gridSize[0]);
              const line = coordinate(y, bounds[1], bounds[3], gridSize[1]);
              const cell = line * gridSize[0] + column;
              expectedCounts[cell]++;
              if (Number.isFinite(contributions[row])) cells[cell].push(contributions[row]);
            }
            expect(await fixture.read(counts)).toEqual(expectedCounts);
            for (const {operation, output} of outputs) {
              const actual = await fixture.read(output);
              for (let cell = 0; cell < capacity; cell++) {
                const values = cells[cell];
                const sum = values.reduce((total, value) => total + value, 0);
                const expected =
                  operation === 'sum'
                    ? sum
                    : !values.length
                      ? NaN
                      : operation === 'mean'
                        ? sum / values.length
                        : operation === 'min'
                          ? Math.min(...values)
                          : Math.max(...values);
                if (Number.isNaN(expected)) expect(actual[cell]).toBeNaN();
                else expect(actual[cell]).toBeCloseTo(expected, 6);
              }
            }
            expect(await fixture.read(positions)).toEqual(points);
            expect(await fixture.read(weights)).toEqual(contributions);
          }
        } finally {
          executable.destroy();
          fixture.destroy();
        }
      });
    }
  }
}

for (const dimension of [2, 3] as const) {
  for (const kind of ['bounds', 'radius'] as const) {
    for (const useCandidates of [false, true]) {
      test(`point filter chunks: ${dimension}D ${kind}, candidates ${useCandidates}`, async () => {
        const device = await getWebGPUTestDevice('core');
        if (!device) return;
        const fixture = new BatchConformanceFixture(device);
        const points = [
          [0, 0, 0],
          [1, 0, 0],
          [0.5, 0.5, 0.5],
          [-1, 0, 0],
          [NaN, 0, 0],
          [2, 2, 2]
        ].flatMap(point => point.slice(0, dimension));
        const positions = fixture.column(
          'positions',
          dimension === 2 ? 'float32x2' : 'float32x3',
          points,
          [0, 2, 0, 3, 1, 0]
        );
        const outputMask = fixture.column('mask', 'uint32', Array(6).fill(77), [1, 0, 4, 1]);
        const query = fixture.output(
          'query',
          'float32',
          kind === 'bounds' ? dimension * 2 : dimension + 1
        );
        const overflow = fixture.output('overflow', 'uint32', 1);
        const ids = fixture.column(
          'candidates',
          'uint32',
          [5, 0, 2, 2, 1, 0xffffffff, 99, 3],
          [0, 1, 3, 0, 4, 0]
        );
        const count = fixture.output('candidate-count', 'uint32', 1);
        const sourceOverflow = fixture.output('source-overflow', 'uint32', 1);
        fixture.graph.add(
          new GPUPointSpatialFilter({
            positions,
            outputMask,
            query,
            overflow,
            kind,
            ...(useCandidates ? {candidates: {ids, count, overflow: sourceOverflow}} : {})
          })
        );
        const executable = fixture.graph.compile();
        try {
          for (const iteration of [0, 1, 2, 3]) {
            const queryValues =
              kind === 'bounds'
                ? [
                    ...Array(dimension).fill(iteration === 1 ? -2 : 0),
                    ...Array(dimension).fill(iteration === 2 ? -1 : 1)
                  ]
                : [...Array(dimension).fill(0), iteration === 1 ? 3 : iteration === 2 ? -1 : 1];
            const available = iteration === 1 ? 3 : iteration === 2 ? 0 : 11;
            write(fixture, query, queryValues);
            write(fixture, count, [available]);
            write(fixture, sourceOverflow, [Number(iteration === 1)]);
            const encoder = device.createCommandEncoder();
            executable.encode(encoder, {parameters: undefined});
            device.submit(encoder.finish());
            const selectedCandidates = useCandidates
              ? [5, 0, 2, 2, 1, 0xffffffff, 99, 3].slice(0, available)
              : [0, 1, 2, 3, 4, 5];
            const expected = Array(6).fill(0);
            for (const row of selectedCandidates) {
              if (row >= 6) continue;
              const point = points.slice(row * dimension, (row + 1) * dimension);
              const accepted =
                point.every(Number.isFinite) &&
                (kind === 'bounds'
                  ? point.every(
                      (value, axis) =>
                        value >= queryValues[axis] && value <= queryValues[axis + dimension]
                    )
                  : queryValues[dimension] >= 0 &&
                    point.reduce((sum, value) => sum + value * value, 0) <=
                      queryValues[dimension] ** 2);
              expected[row] = Number(accepted);
            }
            expect(await fixture.read(outputMask)).toEqual(expected);
            expect(await fixture.read(overflow)).toEqual([
              Number(useCandidates && (available > 8 || iteration === 1))
            ]);
            expect(await fixture.read(positions)).toEqual(points);
          }
        } finally {
          executable.destroy();
          fixture.destroy();
        }
      });
    }
  }
}

for (const empty of [true, false]) {
  test(`spatial bounded dispatch and empty initialization: ${empty}`, async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) return;
    const fixture = new BatchConformanceFixture(device);
    const length = empty ? 0 : 1025;
    const positions = fixture.column(
      'positions',
      'float32x2',
      Array(length * 2).fill(0),
      [length],
      {atomic: true}
    );
    const weights = fixture.column('weights', 'float32', Array(length).fill(3), [0, length, 0]);
    const counts = fixture.column('counts', 'uint32', Array(289).fill(77), [289], {atomic: true});
    const means = fixture.column('means', 'float32', Array(289).fill(77), [0, 257, 32]);
    const mask = fixture.column(
      'mask',
      'uint32',
      Array(length).fill(77),
      empty ? [] : [257, 0, 768]
    );
    const ids = fixture.column(
      'ids',
      'uint32',
      Array.from({length}, (_, row) => row),
      [length],
      {atomic: true}
    );
    const count = fixture.output('count', 'uint32', 1);
    const overflow = fixture.output('overflow', 'uint32', 1);
    const query = fixture.output('query', 'float32', 4);
    write(fixture, query, [0, 0, 1, 1]);
    write(fixture, count, [length + 1]);
    const descriptor = Object.getOwnPropertyDescriptor(device, 'limits');
    const limits = device.limits;
    Object.defineProperty(device, 'limits', {
      configurable: true,
      value: new Proxy(limits, {
        get: (target, property) =>
          property === 'maxComputeWorkgroupsPerDimension'
            ? 2
            : Reflect.get(target, property, target)
      })
    });
    try {
      fixture.graph.add([
        new GPUGridBinning({positions, output: counts, gridSize: [17, 17], bounds: [0, 0, 1, 1]}),
        new GPUGridAggregation({
          positions,
          weights,
          output: means,
          operation: 'mean',
          gridSize: [17, 17],
          bounds: [0, 0, 1, 1]
        }),
        new GPUPointSpatialFilter({
          positions,
          query,
          kind: 'bounds',
          outputMask: mask,
          overflow,
          candidates: {ids, count}
        })
      ]);
      const executable = fixture.graph.compile();
      try {
        for (let iteration = 0; iteration < 2; iteration++) {
          const encoder = device.createCommandEncoder();
          executable.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          expect(await fixture.read(counts)).toEqual([length, ...Array(288).fill(0)]);
          const actualMeans = await fixture.read(means);
          if (empty) expect(actualMeans[0]).toBeNaN();
          else expect(actualMeans[0]).toBe(3);
          expect(actualMeans.slice(1).every(Number.isNaN)).toBe(true);
          expect(await fixture.read(mask)).toEqual(Array(length).fill(1));
          expect(await fixture.read(overflow)).toEqual([1]);
        }
      } finally {
        executable.destroy();
      }
    } finally {
      if (descriptor) Object.defineProperty(device, 'limits', descriptor);
      else Reflect.deleteProperty(device, 'limits');
      fixture.destroy();
    }
  });
}

function split(length: number, first: number): number[] {
  return [0, Math.min(length, first), 0, Math.max(0, length - first), 0];
}

function coordinate(value: number, minimum: number, maximum: number, size: number): number {
  if (maximum === minimum || value === minimum) return 0;
  if (value === maximum) return size - 1;
  return Math.min(Math.floor(((value - minimum) / (maximum - minimum)) * size), size - 1);
}

function write<T extends 'uint32' | 'float32' | 'float32x2' | 'float32x3' | 'float32x4'>(
  fixture: BatchConformanceFixture,
  view: GraphDataView<T> | GraphVectorView<T>,
  values: number[]
): void {
  let offset = 0;
  for (const chunk of 'data' in view ? view.data : [view]) {
    const components = chunk.rowByteLength / 4;
    if (chunk.length) {
      const data = values.slice(offset, offset + chunk.length * components);
      fixture.storage
        .get(chunk.buffer)!
        .write(
          chunk.format === 'uint32' ? new Uint32Array(data) : new Float32Array(data),
          chunk.byteOffset
        );
    }
    offset += chunk.length * components;
  }
}
