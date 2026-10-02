// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  GPUMatVec,
  GPUMatMul,
  type GraphDataView,
  type GraphVectorView
} from '@luma.gl/gpgpu/gpu-core';
import {BatchConformanceFixture} from './batch-conformance-utils';

const shapes = [
  {rows: 3, inner: 7, columns: 5},
  {rows: 17, inner: 33, columns: 19},
  {rows: 5, inner: 513, columns: 1},
  {rows: 3, inner: 0, columns: 5},
  {rows: 0, inner: 7, columns: 5},
  {rows: 4, inner: 7, columns: 0}
];

for (const kind of ['matvec', 'matmul'] as const) {
  for (const shape of shapes) {
    for (const partition of ['atomic', 'one chunk', 'independent', 'mixed'] as const) {
      test(`${kind} batching: ${JSON.stringify(shape)}, ${partition}`, async () => {
        const device = await getWebGPUTestDevice('core');
        if (!device) return;
        const fixture = new BatchConformanceFixture(device);
        const {rows, inner} = shape;
        const columns = kind === 'matvec' ? 1 : shape.columns;
        const leftCount = rows * inner;
        const rightCount = inner * columns;
        const outputCount = rows * columns;
        const leftValues = Array.from(
          {length: leftCount + 2},
          (_, index) => ((index % 13) - 6) / 4
        );
        const rightValues = Array.from(
          {length: rightCount + 2},
          (_, index) => ((index % 7) - 3) / 2
        );
        const split = partition === 'independent' || partition === 'mixed';
        const left = fixture.column(
          'left',
          'float32',
          leftValues,
          partition === 'independent' ? splitRows(leftCount + 2) : [leftCount + 2],
          {atomic: partition === 'atomic' || partition === 'mixed'}
        );
        const right = fixture.column(
          'right',
          'float32',
          rightValues,
          split ? splitRows(rightCount + 2) : [rightCount + 2],
          {atomic: partition === 'atomic'}
        );
        const output = fixture.column(
          'output',
          'float32',
          Array(outputCount + 3).fill(77),
          partition === 'independent' ? splitRows(outputCount + 3) : [outputCount + 3],
          {atomic: partition === 'atomic' || partition === 'mixed'}
        );
        fixture.graph.add(
          kind === 'matvec'
            ? new GPUMatVec({matrix: left, vector: right, output, rows, columns: inner})
            : new GPUMatMul({left, right, output, m: rows, k: inner, n: columns})
        );
        const executable = fixture.graph.compile();
        try {
          for (let iteration = 0; iteration < 3; iteration++) {
            if (iteration === 2) {
              leftValues.fill(0.5, 0, leftCount);
              rightValues.fill(-0.25, 0, rightCount);
              writeValues(fixture, left, leftValues);
              writeValues(fixture, right, rightValues);
              // Also catches a zero-inner-dimension graph that only initializes at construction.
              writeValues(fixture, output, Array(outputCount + 3).fill(77));
            }
            const encoder = device.createCommandEncoder();
            executable.encode(encoder, {parameters: undefined});
            device.submit(encoder.finish());
            const actual = await fixture.read(output);
            for (let row = 0; row < rows; row++) {
              for (let column = 0; column < columns; column++) {
                let expected = 0;
                for (let innerIndex = 0; innerIndex < inner; innerIndex++) {
                  expected +=
                    leftValues[row * inner + innerIndex] *
                    rightValues[innerIndex * columns + column];
                }
                // Binary fractions make these finite reference sums exact in float32.
                expect(actual[row * columns + column]).toBe(expected);
              }
            }
            expect(actual.slice(outputCount)).toEqual([77, 77, 77]);
            expect(await fixture.read(left)).toEqual(leftValues);
            expect(await fixture.read(right)).toEqual(rightValues);
          }
        } finally {
          executable.destroy();
          fixture.destroy();
        }
      });
    }
  }
}

test('dense decimal products agree with a CPU reference across different reduction orders', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const fixture = new BatchConformanceFixture(device);
  const rows = 3;
  const inner = 257;
  const columns = 19;
  const leftValues = Array.from({length: rows * inner}, (_, index) =>
    Math.fround(Math.sin(index) * 3)
  );
  const rightValues = Array.from({length: inner * columns}, (_, index) =>
    Math.fround(Math.cos(index / 7))
  );
  const vectorValues = rightValues.slice(0, inner);
  const left = fixture.column('left', 'float32', leftValues, splitRows(leftValues.length));
  const right = fixture.column('right', 'float32', rightValues, splitRows(rightValues.length));
  const vector = fixture.column('vector', 'float32', vectorValues, splitRows(inner));
  const product = fixture.column(
    'product',
    'float32',
    Array(rows * columns).fill(77),
    [1, 0, 32, 24]
  );
  const result = fixture.column('result', 'float32', Array(rows).fill(77), [0, 1, 2]);
  fixture.graph.add([
    new GPUMatMul({left, right, output: product, m: rows, k: inner, n: columns}),
    new GPUMatVec({matrix: left, vector, output: result, rows, columns: inner})
  ]);
  const executable = fixture.graph.compile();
  try {
    const encoder = device.createCommandEncoder();
    executable.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    for (const [actual, values, width] of [
      [await fixture.read(product), rightValues, columns],
      [await fixture.read(result), vectorValues, 1]
    ] as const) {
      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < width; column++) {
          let expected = 0;
          let magnitude = 0;
          for (let index = 0; index < inner; index++) {
            const term = leftValues[row * inner + index] * values[index * width + column];
            expected += term;
            magnitude += Math.abs(term);
          }
          expect(Math.abs(actual[row * width + column] - expected)).toBeLessThan(
            0.00001 * Math.max(1, magnitude)
          );
        }
      }
    }
  } finally {
    executable.destroy();
    fixture.destroy();
  }
});

function splitRows(length: number): number[] {
  const first = Math.min(1, length);
  const second = Math.floor((length - first) / 3);
  return [0, first, second, 0, length - first - second, 0];
}

function writeValues(
  fixture: BatchConformanceFixture,
  view: GraphDataView<'float32'> | GraphVectorView<'float32'>,
  values: number[]
): void {
  let offset = 0;
  for (const chunk of 'data' in view ? view.data : [view]) {
    if (chunk.length)
      fixture.storage
        .get(chunk.buffer)!
        .write(new Float32Array(values.slice(offset, offset + chunk.length)), chunk.byteOffset);
    offset += chunk.length;
  }
}
