// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  GPUFFT1D,
  GPUConvolution,
  type GraphDataView,
  type GraphVectorView
} from '@luma.gl/gpgpu/gpu-core';
import {BatchConformanceFixture} from './batch-conformance-utils';

const fftCases = [
  {length: 2, batchCount: 3, input: [0, 1, 0, 2, 3], output: [2, 0, 1, 3]},
  {length: 8, batchCount: 3, input: [0, 3, 9, 12, 0], output: [0, 1, 6, 17, 0]},
  {length: 32, batchCount: 5, input: [65, 0, 1, 94], output: [1, 61, 98]},
  {length: 256, batchCount: 3, input: [255, 1, 0, 300, 212], output: [5, 251, 300, 212]},
  {length: 2048, batchCount: 3, input: [2047, 3, 0, 4094], output: [4095, 0, 1, 2048]},
  {length: 8, batchCount: 3, input: [0, 24, 0], output: [24]},
  {length: 8, batchCount: 3, input: [24], output: [1, 0, 23], atomicInput: true},
  {length: 8, batchCount: 3, input: [1, 0, 23], output: [24], atomicOutput: true}
];

for (const [configurationIndex, configuration] of fftCases.entries()) {
  for (const strategy of ['portable', 'auto'] as const) {
    test(`FFT batching: case ${configurationIndex}, ${strategy}`, async () => {
      const device = await getWebGPUTestDevice(strategy === 'auto' ? 'max' : 'core');
      if (!device) return;
      const fixture = new BatchConformanceFixture(device);
      const {length, batchCount} = configuration;
      const count = length * batchCount;
      const values = Array((count + 2) * 2).fill(0);
      for (let batch = 0; batch < batchCount; batch++) {
        const index = batch * length + ((batch + 1) % length);
        values[index * 2] = 1 + batch;
        values[index * 2 + 1] = batch * 0.25;
      }
      values.fill(99, count * 2);
      const input = fixture.column(
        'input',
        'float32x2',
        values,
        configuration.atomicInput ? [count + 2] : [...configuration.input, 2],
        {atomic: configuration.atomicInput}
      );
      const output = fixture.column(
        'output',
        'float32x2',
        Array((count + 3) * 2).fill(77),
        configuration.atomicOutput ? [count + 3] : [...configuration.output, 3],
        {atomic: configuration.atomicOutput}
      );
      const inverse = fixture.column('inverse', 'float32x2', Array((count + 1) * 2).fill(55), [
        0,
        1,
        count - 1,
        1
      ]);
      const atomicInput = fixture.column('atomic-input', 'float32x2', values, [count + 2], {
        atomic: true
      });
      const atomicForward = fixture.output('atomic-forward', 'float32x2', count);
      const atomicInverse = fixture.output('atomic-inverse', 'float32x2', count);
      fixture.graph.add([
        new GPUFFT1D({
          id: 'atomic-forward',
          input: atomicInput,
          output: atomicForward,
          length,
          batchCount,
          strategy
        }),
        new GPUFFT1D({
          id: 'atomic-inverse',
          input: atomicForward,
          output: atomicInverse,
          length,
          batchCount,
          strategy,
          direction: 'inverse'
        }),
        new GPUFFT1D({id: 'forward', input, output, length, batchCount, strategy}),
        new GPUFFT1D({
          id: 'inverse',
          input: output,
          output: inverse,
          length,
          batchCount,
          strategy,
          direction: 'inverse'
        })
      ]);
      const executable = fixture.graph.compile();
      try {
        for (let iteration = 0; iteration < 3; iteration++) {
          if (iteration === 2) {
            values.fill(0, 0, count * 2);
            writeValues(fixture, input, values);
            writeValues(fixture, atomicInput, values);
          }
          const encoder = device.createCommandEncoder();
          executable.encode(encoder, {parameters: undefined});
          device.submit(encoder.finish());
          const forward = await fixture.read(output);
          const restored = await fixture.read(inverse);
          assertAtomicAgreement(forward.slice(0, count * 2), await fixture.read(atomicForward));
          assertAtomicAgreement(restored.slice(0, count * 2), await fixture.read(atomicInverse));
          for (let batch = 0; batch < batchCount; batch++) {
            for (let frequency = 0; frequency < length; frequency++) {
              const angle = (-2 * Math.PI * frequency * ((batch + 1) % length)) / length;
              const real =
                iteration === 2
                  ? 0
                  : (1 + batch) * Math.cos(angle) - batch * 0.25 * Math.sin(angle);
              const imaginary =
                iteration === 2
                  ? 0
                  : (1 + batch) * Math.sin(angle) + batch * 0.25 * Math.cos(angle);
              const index = (batch * length + frequency) * 2;
              // Portable shader sin/cos accuracy varies by adapter; scale by signal amplitude.
              // The separate atomic comparison above checks chunk routing much more tightly.
              const tolerance = 0.002 * Math.hypot(1 + batch, batch * 0.25);
              expect(Math.abs(forward[index] - real)).toBeLessThan(tolerance);
              expect(Math.abs(forward[index + 1] - imaginary)).toBeLessThan(tolerance);
            }
          }
          for (let index = 0; index < count * 2; index++)
            expect(Math.abs(restored[index] - values[index])).toBeLessThan(
              0.002 * (1 + Math.floor(index / (length * 2)))
            );
          expect(forward.slice(count * 2)).toEqual(Array(6).fill(77));
          expect(restored.slice(count * 2)).toEqual([55, 55]);
          expect(await fixture.read(input)).toEqual(values);
        }
      } finally {
        executable.destroy();
        fixture.destroy();
      }
    });
  }
}

for (const boundary of ['zero', 'wrap'] as const) {
  for (const strategy of ['direct', 'fft', 'auto'] as const) {
    for (const partition of ['one chunk', 'independent', 'atomic source'] as const) {
      test(`convolution batching: ${boundary}, ${strategy}, ${partition}`, async () => {
        const device = await getWebGPUTestDevice('core');
        if (!device) return;
        const fixture = new BatchConformanceFixture(device);
        const width = boundary === 'wrap' ? 8 : 7;
        const height = boundary === 'wrap' ? 4 : 5;
        const count = width * height;
        const values = Array.from({length: count + 2}, (_, index) => (index % 11) - 4);
        const coefficients = [1, -2, 3, 0.5, 2, -1, 0, 1.5, -0.25, 99, 99];
        const input = fixture.column(
          'input',
          'float32',
          values,
          partition === 'independent' ? [0, 1, 8, 0, count - 9, 2] : [count + 2],
          {atomic: partition === 'atomic source'}
        );
        const kernel = fixture.column(
          'kernel',
          'float32',
          coefficients,
          partition === 'one chunk' ? [11] : [0, 2, 0, 4, 3, 2]
        );
        const output = fixture.column(
          'output',
          'float32',
          Array(count + 3).fill(77),
          partition === 'one chunk' ? [count + 3] : [0, 6, 0, count - 6, 3]
        );
        const atomicInput = fixture.column('atomic-input', 'float32', values, [values.length], {
          atomic: true
        });
        const atomicKernel = fixture.column(
          'atomic-kernel',
          'float32',
          coefficients,
          [coefficients.length],
          {atomic: true}
        );
        const atomicOutput = fixture.output('atomic-output', 'float32', count);
        fixture.graph.add(
          new GPUConvolution({
            id: 'atomic',
            input: atomicInput,
            kernel: atomicKernel,
            output: atomicOutput,
            width,
            height,
            kernelWidth: 3,
            kernelHeight: 3,
            boundary,
            strategy
          })
        );
        fixture.graph.add(
          new GPUConvolution({
            input,
            kernel,
            output,
            width,
            height,
            kernelWidth: 3,
            kernelHeight: 3,
            boundary,
            strategy
          })
        );
        const executable = fixture.graph.compile();
        try {
          for (let iteration = 0; iteration < 3; iteration++) {
            if (iteration === 2) {
              values.fill(2, 0, count);
              coefficients.fill(0, 0, 9);
              coefficients[4] = 3;
              writeValues(fixture, input, values);
              writeValues(fixture, kernel, coefficients);
              writeValues(fixture, atomicInput, values);
              writeValues(fixture, atomicKernel, coefficients);
            }
            const encoder = device.createCommandEncoder();
            executable.encode(encoder, {parameters: undefined});
            device.submit(encoder.finish());
            const actual = await fixture.read(output);
            const expected = convolve(values, coefficients, width, height, boundary);
            const magnitude = convolve(
              values.map(Math.abs),
              coefficients.map(Math.abs),
              width,
              height,
              boundary
            );
            assertAtomicAgreement(actual.slice(0, count), await fixture.read(atomicOutput));
            for (let index = 0; index < count; index++)
              expect(Math.abs(actual[index] - expected[index])).toBeLessThan(
                strategy === 'fft' ? 0.001 * Math.max(1, magnitude[index]) : 0.001
              );
            expect(actual.slice(count)).toEqual([77, 77, 77]);
            expect(await fixture.read(input)).toEqual(values);
            expect(await fixture.read(kernel)).toEqual(coefficients);
          }
        } finally {
          executable.destroy();
          fixture.destroy();
        }
      });
    }
  }
}

for (const boundary of ['zero', 'wrap'] as const) {
  test(`convolution batching: large kernel, ${boundary}, auto`, async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) return;
    const fixture = new BatchConformanceFixture(device);
    const width = 8;
    const height = 4;
    const kernelWidth = boundary === 'zero' ? 65 : 11;
    const kernelHeight = boundary === 'zero' ? 65 : 5;
    const count = kernelWidth * kernelHeight;
    const values = Array.from({length: width * height}, (_, index) => (index % 7) - 3);
    const coefficients = Array.from({length: count}, (_, index) => ((index % 5) - 2) / 8);
    const input = fixture.column('input', 'float32', values, [0, 7, 25]);
    const kernel = fixture.column('kernel', 'float32', coefficients, [
      1,
      0,
      kernelWidth + 1,
      count - kernelWidth - 2
    ]);
    const output = fixture.column(
      'output',
      'float32',
      Array(width * height + 1).fill(77),
      [13, 0, 19, 1]
    );
    const atomicInput = fixture.column('atomic-input', 'float32', values, [values.length], {
      atomic: true
    });
    const atomicKernel = fixture.column(
      'atomic-kernel',
      'float32',
      coefficients,
      [coefficients.length],
      {atomic: true}
    );
    const atomicOutput = fixture.output('atomic-output', 'float32', width * height);
    fixture.graph.add(
      new GPUConvolution({
        id: 'atomic',
        input: atomicInput,
        kernel: atomicKernel,
        output: atomicOutput,
        width,
        height,
        kernelWidth,
        kernelHeight,
        boundary
      })
    );
    fixture.graph.add(
      new GPUConvolution({
        input,
        kernel,
        output,
        width,
        height,
        kernelWidth,
        kernelHeight,
        boundary
      })
    );
    const executable = fixture.graph.compile();
    try {
      for (let iteration = 0; iteration < 2; iteration++) {
        if (iteration) {
          coefficients.fill(0);
          coefficients[Math.floor(kernelHeight / 2) * kernelWidth + Math.floor(kernelWidth / 2)] =
            2;
          writeValues(fixture, kernel, coefficients);
          writeValues(fixture, atomicKernel, coefficients);
        }
        const encoder = device.createCommandEncoder();
        executable.encode(encoder, {parameters: undefined});
        device.submit(encoder.finish());
        const actual = await fixture.read(output);
        const expected = convolve(
          values,
          coefficients,
          width,
          height,
          boundary,
          kernelWidth,
          kernelHeight
        );
        const magnitude = convolve(
          values.map(Math.abs),
          coefficients.map(Math.abs),
          width,
          height,
          boundary,
          kernelWidth,
          kernelHeight
        );
        assertAtomicAgreement(actual.slice(0, expected.length), await fixture.read(atomicOutput));
        for (let index = 0; index < expected.length; index++)
          expect(Math.abs(actual[index] - expected[index])).toBeLessThan(
            boundary === 'zero' ? 0.001 * Math.max(1, magnitude[index]) : 0.001
          );
        expect(actual.at(-1)).toBe(77);
      }
    } finally {
      executable.destroy();
      fixture.destroy();
    }
  });
}

/** Chunk routing must agree tightly with the existing pipeline on the same adapter. */
function assertAtomicAgreement(actual: number[], expected: number[]): void {
  expect(actual.length).toBe(expected.length);
  for (let index = 0; index < actual.length; index++) {
    expect(Math.abs(actual[index] - expected[index])).toBeLessThan(
      0.00001 * Math.max(1, Math.abs(expected[index]))
    );
  }
}

function writeValues<T extends 'float32' | 'float32x2'>(
  fixture: BatchConformanceFixture,
  view: GraphDataView<T> | GraphVectorView<T>,
  values: number[]
): void {
  let offset = 0;
  for (const chunk of 'data' in view ? view.data : [view]) {
    const count = (chunk.length * chunk.rowByteLength) / 4;
    if (count)
      fixture.storage
        .get(chunk.buffer)!
        .write(new Float32Array(values.slice(offset, offset + count)), chunk.byteOffset);
    offset += count;
  }
}

function convolve(
  values: number[],
  kernel: number[],
  width: number,
  height: number,
  boundary: 'zero' | 'wrap',
  kernelWidth = 3,
  kernelHeight = 3
): number[] {
  return Array.from({length: width * height}, (_, index) => {
    let total = 0;
    for (let kernelRow = 0; kernelRow < kernelHeight; kernelRow++) {
      for (let kernelColumn = 0; kernelColumn < kernelWidth; kernelColumn++) {
        let column = (index % width) - kernelColumn + Math.floor(kernelWidth / 2);
        let row = Math.floor(index / width) - kernelRow + Math.floor(kernelHeight / 2);
        if (boundary === 'wrap') {
          column = ((column % width) + width) % width;
          row = ((row % height) + height) % height;
        }
        if (column >= 0 && column < width && row >= 0 && row < height)
          total += values[row * width + column] * kernel[kernelRow * kernelWidth + kernelColumn];
      }
    }
    return total;
  });
}
