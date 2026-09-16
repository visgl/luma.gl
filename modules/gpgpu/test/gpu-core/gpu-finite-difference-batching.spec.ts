// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  GPUFiniteDifference2D,
  GPUFiniteDifference3D,
  type GraphDataView,
  type GraphVectorView
} from '@luma.gl/gpgpu/gpu-core';
import {BatchConformanceFixture} from './batch-conformance-utils';

for (const dimensions of [2, 3] as const) {
  for (const operator of ['gradient', 'divergence', 'curl', 'laplacian'] as const) {
    for (const boundary of ['one-sided', 'periodic'] as const) {
      for (const partition of ['one source', 'split sources', 'single output'] as const) {
        test(`finite-difference batching: ${dimensions}D ${operator}, ${boundary}, ${partition}`, async () => {
          const device = await getWebGPUTestDevice('core');
          if (!device) return;
          const fixture = new BatchConformanceFixture(device);
          const width = 7;
          const height = 5;
          const depth = dimensions === 3 ? 4 : 1;
          const length = width * height * depth;
          const inputComponents =
            operator === 'gradient' || operator === 'laplacian' ? 1 : dimensions === 2 ? 2 : 4;
          const outputComponents =
            operator === 'gradient' || (dimensions === 3 && operator === 'curl')
              ? dimensions === 2
                ? 2
                : 4
              : 1;
          const inputFormat =
            inputComponents === 1 ? 'float32' : inputComponents === 2 ? 'float32x2' : 'float32x4';
          const outputFormat =
            outputComponents === 1 ? 'float32' : outputComponents === 2 ? 'float32x2' : 'float32x4';
          const values = Array.from({length: (length + 2) * inputComponents}, (_, index) =>
            Math.fround(Math.sin(index * 0.73) * 10 + index / 7)
          );
          const input = fixture.column(
            'input',
            inputFormat,
            values,
            partition === 'one source' ? [length + 2] : [0, 1, 8, 0, length - 9, 0, 2],
            {atomic: partition === 'one source'}
          );
          const output = fixture.column(
            'output',
            outputFormat,
            Array((length + 3) * outputComponents).fill(77),
            partition === 'single output' ? [length + 3] : [0, 6, 0, length - 6, 3],
            {atomic: partition === 'single output'}
          );
          const referenceInput = fixture.column(
            'reference-input',
            inputFormat,
            values,
            [length + 2],
            {atomic: true}
          );
          const referenceOutput = fixture.column(
            'reference-output',
            outputFormat,
            Array((length + 3) * outputComponents).fill(77),
            [length + 3],
            {atomic: true}
          );
          for (const [operationIndex, [source, destination]] of (
            [
              [input, output],
              [referenceInput, referenceOutput]
            ] as const
          ).entries()) {
            const common = {id: `difference-${operationIndex}`, width, height, operator, boundary};
            // Localized dimension-specific narrowing keeps production callers precisely typed.
            if (
              dimensions === 2 &&
              isField(source, 'float32x2') &&
              isField(destination, 'float32x2')
            ) {
              fixture.graph.add(
                new GPUFiniteDifference2D({
                  ...common,
                  input: source,
                  output: destination,
                  spacing: [0.25, 0.5]
                })
              );
            } else if (
              dimensions === 3 &&
              isField(source, 'float32x4') &&
              isField(destination, 'float32x4')
            ) {
              fixture.graph.add(
                new GPUFiniteDifference3D({
                  ...common,
                  input: source,
                  output: destination,
                  depth,
                  spacing: [0.25, 0.5, 0.75]
                })
              );
            }
          }
          const executable = fixture.graph.compile();
          try {
            for (let iteration = 0; iteration < 3; iteration++) {
              if (iteration === 2) {
                for (const source of [input, referenceInput]) {
                  for (const chunk of 'data' in source ? source.data : [source]) {
                    if (chunk.length)
                      fixture.storage
                        .get(chunk.buffer)!
                        .write(
                          new Float32Array(chunk.length * inputComponents).fill(262144),
                          chunk.byteOffset
                        );
                  }
                }
              }
              const encoder = device.createCommandEncoder();
              executable.encode(encoder, {parameters: undefined});
              device.submit(encoder.finish());
              const actual = await fixture.read(output);
              const expected = await fixture.read(referenceOutput);
              // Shader specialization may change floating-point contraction by a few ULPs.
              for (let index = 0; index < actual.length; index++) {
                expect(Math.abs(actual[index] - expected[index])).toBeLessThanOrEqual(
                  0.00003 * Math.max(1, Math.abs(expected[index]))
                );
              }
              expect(actual.slice(length * outputComponents)).toEqual(
                Array(3 * outputComponents).fill(77)
              );
              if (iteration === 2)
                expect(actual.slice(0, length * outputComponents).every(value => value === 0)).toBe(
                  true
                );
            }
          } finally {
            executable.destroy();
            fixture.destroy();
          }
        });
      }
    }
  }
}

test('finite-difference batching: stencil scratch is reused across output blocks', async () => {
  const device = await getWebGPUTestDevice('core');
  if (!device) return;
  const fixture = new BatchConformanceFixture(device);
  const width = 69;
  const height = 65;
  const length = width * height;
  const input = fixture.column(
    'input',
    'float32',
    Array.from({length}, (_, index) => (index % width) ** 2 + Math.floor(index / width) ** 2),
    [2000, 0, length - 2000]
  );
  const output = fixture.column('output', 'float32', Array(length).fill(77), [length], {
    atomic: true
  });
  fixture.graph.add(
    new GPUFiniteDifference2D({
      input,
      output,
      width,
      height,
      spacing: [1, 1],
      operator: 'laplacian'
    })
  );
  const executable = fixture.graph.compile();
  try {
    const encoder = device.createCommandEncoder();
    executable.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    expect(await fixture.read(output)).toEqual(Array(length).fill(4));
  } finally {
    executable.destroy();
    fixture.destroy();
  }
});

function isField<T extends 'float32x2' | 'float32x4'>(
  view:
    | GraphDataView<'float32' | 'float32x2' | 'float32x4'>
    | GraphVectorView<'float32' | 'float32x2' | 'float32x4'>,
  vectorFormat: T
): view is GraphDataView<'float32' | T> | GraphVectorView<'float32' | T> {
  return view.format === 'float32' || view.format === vectorFormat;
}
