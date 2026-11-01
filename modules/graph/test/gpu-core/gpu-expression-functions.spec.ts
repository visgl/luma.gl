// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUGraph, GPUExpressionOperation} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';
import type {GPUExpressionFormat} from '../../src/gpu-core/gpu-expression-operation';

const arrays = {float32: Float32Array, sint32: Int32Array, uint32: Uint32Array};
function makeVector(
  device: Device,
  values: number[][],
  format: GPUExpressionFormat = 'float32'
): GPUVector {
  return new GPUVector({
    type: 'data',
    name: 'test',
    format,
    ownsData: true,
    data: values.map(
      chunk =>
        new GPUData({
          buffer: device.createBuffer({
            data: new arrays[format](chunk.length ? chunk : [0]),
            usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
          }),
          format,
          length: chunk.length,
          ownsBuffer: true
        })
    )
  });
}
async function readVector(vector: GPUVector): Promise<number[]> {
  return (
    await Promise.all(
      vector.data.map(async chunk => {
        if (!chunk.length) return [];
        const data = await chunk.buffer.readAsync(chunk.byteOffset, chunk.length * 4);
        return Array.from(
          new arrays[vector.format as GPUExpressionFormat](
            data.buffer,
            data.byteOffset,
            chunk.length
          )
        );
      })
    )
  ).flat();
}

for (const backend of ['webgl-simple', 'webgpu-simple', 'webgpu-full'] as const) {
  const getDevice = backend === 'webgl-simple' ? getWebGLTestDevice : getWebGPUTestDevice;
  const makeGraph = () => (backend === 'webgpu-full' ? new GPUGraph() : new GPUSimpleGraph());
  test(`${backend} accepts finite scalar bindings that overflow float32`, async () => {
    const device = await getDevice();
    if (!device) return;
    const graph = makeGraph();
    graph.scalar('input', 'float32');
    graph.scalar('output', 'float32');
    graph.add(new GPUExpressionOperation({output: 'output', expression: 'abs(input)'}));
    const compiled = graph.compile(device);
    try {
      for (const input of [1e40, -1e40]) {
        const result = await compiled.run({input});
        try {
          // Nonfinite results are backend-defined, but accepted bindings must execute.
          expect(await readVector(result.output)).toHaveLength(1);
        } finally {
          result.output.destroy();
        }
      }
    } finally {
      compiled.destroy();
    }
  });
  test(`${backend} rounds scalar inputs and intermediate math to float32`, async () => {
    const device = await getDevice();
    if (!device) return;
    for (const expression of [
      'pow(input, 100000000)',
      'pow(1.00000001, 100000000)',
      'uint32(pow(input, 100000000))'
    ]) {
      const graph = makeGraph();
      graph.scalar('input', 'float32');
      graph.scalar('output', expression.startsWith('uint32') ? 'uint32' : 'float32');
      graph.add(new GPUExpressionOperation({output: 'output', expression}));
      const compiled = graph.compile(device);
      try {
        const result = await compiled.run({input: 1.00000001});
        try {
          expect(await readVector(result.output)).toEqual([1]);
        } finally {
          result.output.destroy();
        }
      } finally {
        compiled.destroy();
      }
    }
  });
  test(`${backend} evaluates all math functions with chunks and reusable bindings`, async () => {
    const device = await getDevice();
    if (!device) return;
    const cases: [string, (value: number) => number][] = [
      ['abs(-input)', Math.abs],
      ['sqrt(input)', Math.sqrt],
      ['pow(input, scale)', value => value ** 2],
      ['sin(input)', Math.sin],
      ['cos(input)', Math.cos],
      ['tan(input)', Math.tan],
      ['exp(input)', Math.exp],
      ['log(input)', Math.log],
      ['sqrt(abs(input * -scale)) + sin(input)', value => Math.sqrt(value * 2) + Math.sin(value)]
    ];
    for (const [expression, expected] of cases) {
      const graph = makeGraph();
      graph.vector('input', 'float32');
      graph.scalar('scale', 'float32');
      graph.vector('output', 'float32');
      graph.add(new GPUExpressionOperation({output: 'output', expression}));
      const compiled = graph.compile(device);
      try {
        for (const chunks of [[[0.25, 0.5], [], [1, 2]], [[0.75]]]) {
          const input = makeVector(device, chunks);
          const submit = vi.spyOn(device, 'submit');
          try {
            const result = await compiled.run({input, scale: 2});
            if (backend !== 'webgl-simple') expect(submit).toHaveBeenCalledTimes(1);
            try {
              const actual = await readVector(result.output);
              actual.forEach((value, index) =>
                expect(value).toBeCloseTo(expected(chunks.flat()[index]), 4)
              );
              expect(result.output.data.map(chunk => chunk.length)).toEqual(
                chunks.map(chunk => chunk.length)
              );
            } finally {
              result.output.destroy();
            }
          } finally {
            submit.mockRestore();
            input.destroy();
          }
        }
      } finally {
        compiled.destroy();
      }
    }
  });

  test(`${backend} casts truncate and saturate into declared integer outputs`, async () => {
    const device = await getDevice();
    if (!device) return;
    for (const format of ['sint32', 'uint32'] as const) {
      const graph = makeGraph();
      graph.vector('input', 'float32');
      graph.vector('output', format);
      graph.add(new GPUExpressionOperation({output: 'output', expression: `${format}(input)`}));
      const compiled = graph.compile(device);
      const values = [-4294967296, -2.9, -0.9, 0, 0.9, 1.9, 2147483648, 4294967296];
      const input = makeVector(device, [values.slice(0, 4), [], values.slice(4)]);
      const submit = vi.spyOn(device, 'submit');
      try {
        const result = await compiled.run({input});
        if (backend !== 'webgl-simple') expect(submit).toHaveBeenCalledTimes(1);
        try {
          expect(result.output.format).toBe(format);
          const minimum = format === 'uint32' ? 0 : -2147483648;
          const maximum = format === 'uint32' ? 4294967295 : 2147483647;
          expect(await readVector(result.output)).toEqual(
            values.map(value => Math.max(minimum, Math.min(maximum, Math.trunc(value))) || 0)
          );
        } finally {
          result.output.destroy();
        }
      } finally {
        submit.mockRestore();
        input.destroy();
        compiled.destroy();
      }
    }
  });

  test(`${backend} casts integer vectors and scalars without losing input precision`, async () => {
    const device = await getDevice();
    if (!device) return;
    for (const outputFormat of ['float32', 'sint32', 'uint32'] as const) {
      const graph = makeGraph();
      graph.vector('input', 'uint32');
      graph.vector('output', outputFormat);
      graph.scalar('constant', 'uint32');
      graph.scalar('scalarOutput', 'uint32');
      graph.add(
        new GPUExpressionOperation({output: 'output', expression: `${outputFormat}(input)`})
      );
      graph.add(
        new GPUExpressionOperation({output: 'scalarOutput', expression: 'uint32(constant)'})
      );
      const compiled = graph.compile(device);
      const input = makeVector(device, [[0, 16777217, 4294967295]], 'uint32');
      try {
        const result = await compiled.run({input, constant: 4294967295});
        try {
          expect(await readVector(result.output)).toEqual(
            [0, 16777217, 4294967295].map(value =>
              outputFormat === 'float32'
                ? Math.fround(value)
                : outputFormat === 'sint32'
                  ? Math.min(value, 2147483647)
                  : value
            )
          );
          expect(await readVector(result.scalarOutput)).toEqual([4294967295]);
        } finally {
          result.output.destroy();
          result.scalarOutput.destroy();
        }
      } finally {
        input.destroy();
        compiled.destroy();
      }
    }
  });
}

for (const backend of ['webgl-simple', 'webgpu-simple', 'webgpu-full'] as const) {
  test(`${backend} composes nested casts and clamps signed-to-unsigned conversions`, async () => {
    const device = await (backend === 'webgl-simple'
      ? getWebGLTestDevice()
      : getWebGPUTestDevice());
    if (!device) return;
    const cases: {
      inputFormat: GPUExpressionFormat;
      outputFormat: GPUExpressionFormat;
      expression: string;
      values: number[];
      expected: number[];
    }[] = [
      {
        inputFormat: 'float32',
        outputFormat: 'float32',
        expression: 'float32(sint32(input)) + sqrt(abs(input))',
        values: [-2.9, 1.9],
        expected: [-2 + Math.sqrt(2.9), 1 + Math.sqrt(1.9)]
      },
      {
        inputFormat: 'sint32',
        outputFormat: 'uint32',
        expression: 'uint32(input)',
        values: [-2147483648, -1, 0, 2147483647],
        expected: [0, 0, 0, 2147483647]
      }
    ];
    for (const {inputFormat, outputFormat, expression, values, expected} of cases) {
      const graph = backend === 'webgpu-full' ? new GPUGraph() : new GPUSimpleGraph();
      graph.vector('input', inputFormat);
      graph.vector('output', outputFormat);
      graph.add(new GPUExpressionOperation({output: 'output', expression}));
      const compiled = graph.compile(device);
      const input = makeVector(device, [values], inputFormat);
      const submit = vi.spyOn(device, 'submit');
      try {
        const result = await compiled.run({input});
        if (backend !== 'webgl-simple') expect(submit).toHaveBeenCalledTimes(1);
        try {
          const actual = await readVector(result.output);
          if (outputFormat === 'float32')
            actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 4));
          else expect(actual).toEqual(expected);
        } finally {
          result.output.destroy();
        }
      } finally {
        submit.mockRestore();
        input.destroy();
        compiled.destroy();
      }
    }
  });
}
