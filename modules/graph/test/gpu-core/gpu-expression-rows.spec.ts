// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {getWebGLTestDevice, getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUGraph, GPUExpressionOperation, type GPUGraphVectorFormat} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';
import {GPUData, GPUVector, getGPUVectorFormatInfo} from '@luma.gl/graph/gpu-data';

const arrayTypes = {float32: Float32Array, sint32: Int32Array, uint32: Uint32Array};
function createVector(
  device: Device,
  format: GPUGraphVectorFormat,
  chunks: number[][],
  offset = 0
): GPUVector {
  const {components, signedDataType} = getGPUVectorFormatInfo(format);
  const ArrayType = arrayTypes[signedDataType as keyof typeof arrayTypes];
  return new GPUVector({
    type: 'data',
    format,
    ownsData: true,
    data: chunks.map(values => {
      const data = new ArrayType(Math.max(components, values.length) + offset + 4).fill(99);
      data.set(values, offset);
      return new GPUData({
        buffer: device.createBuffer({
          data,
          usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
        }),
        format,
        length: values.length / components,
        byteOffset: offset * 4,
        ownsBuffer: true
      });
    })
  });
}
async function readVector(vector: GPUVector): Promise<number[]> {
  const info = getGPUVectorFormatInfo(vector.format);
  const ArrayType = arrayTypes[info.signedDataType as keyof typeof arrayTypes];
  const chunks = await Promise.all(
    vector.data.map(async chunk => {
      if (!chunk.length) return [];
      const data = await chunk.buffer.readAsync(chunk.byteOffset, chunk.length * info.byteLength);
      return Array.from(
        new ArrayType(data.buffer, data.byteOffset, chunk.length * info.components)
      );
    })
  );
  return chunks.flat();
}
for (const backend of ['webgl-simple', 'webgpu-simple', 'webgpu-full'] as const) {
  const getDevice = backend === 'webgl-simple' ? getWebGLTestDevice : getWebGPUTestDevice;
  const makeGraph = () => (backend === 'webgpu-full' ? new GPUGraph() : new GPUSimpleGraph());
  for (const width of [2, 3, 4] as const) {
    test(`${backend} executes packed width-${width} math, broadcasting and casts repeatedly`, async () => {
      const device = await getDevice();
      if (!device) return;
      const graph = makeGraph();
      graph.vector('input', `float32x${width}`);
      graph.vector('weights', 'float32');
      graph.scalar('scale', 'float32');
      graph.vector('output', `float32x${width}`);
      graph.vector('integers', `sint32x${width}`);
      graph.vector('unsigned', `uint32x${width}`);
      graph.add(
        new GPUExpressionOperation({
          output: 'output',
          expression: 'sqrt(abs(input * scale + weights))'
        })
      );
      graph.add(
        new GPUExpressionOperation({
          output: 'integers',
          expression: 'sint32(input)',
          integerRounding: 'nearest'
        })
      );
      graph.add(new GPUExpressionOperation({output: 'unsigned', expression: 'uint32(integers)'}));
      const compiled = graph.compile(device);
      try {
        for (const rowCount of [3, 1]) {
          const values = Array.from(
            {length: rowCount * width},
            (_, index) => (index % 2 ? -1 : 1) * (index + 0.5)
          );
          const chunks = [values.slice(0, width), [], values.slice(width)];
          const input = createVector(device, `float32x${width}`, chunks, 1);
          const weights = createVector(
            device,
            'float32',
            [[2], [], Array(rowCount - 1).fill(2)],
            1
          );
          const target = createVector(
            device,
            `sint32x${width}`,
            chunks.map(chunk => chunk.map(() => 0)),
            1
          );
          const submit = vi.spyOn(device, 'submit');
          try {
            const results = await compiled.run(
              {input, weights, scale: 2},
              {outputTargets: {integers: target}}
            );
            try {
              if (backend !== 'webgl-simple') expect(submit).toHaveBeenCalledTimes(1);
              const actual = await readVector(results.output);
              actual.forEach((value, index) =>
                expect(value).toBeCloseTo(Math.sqrt(Math.abs(values[index] * 2 + 2)), 3)
              );
              const rounded = values.map(
                value => Math.sign(value) * Math.floor(Math.abs(value) + 0.5)
              );
              expect(await readVector(results.integers)).toEqual(rounded);
              expect(await readVector(results.unsigned)).toEqual(
                rounded.map(value => Math.max(0, value))
              );
              expect(results.integers).toBe(target);
              expect(results.output.data.map(chunk => chunk.length)).toEqual([1, 0, rowCount - 1]);
              expect(results.output.data[0].byteStride).toBe(width * 4);
              for (const chunk of target.data) {
                const bytes = await chunk.buffer.readAsync();
                const stored = new Int32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
                expect(stored[0]).toBe(99);
                expect(stored[1 + chunk.length * width]).toBe(99);
              }
            } finally {
              results.output.destroy();
              results.unsigned.destroy();
            }
          } finally {
            submit.mockRestore();
            input.destroy();
            weights.destroy();
            target.destroy();
          }
        }
      } finally {
        compiled.destroy();
      }
    });
  }
  test(`${backend} preserves exact multi-component uint32 values through integer casts`, async () => {
    const device = await getDevice();
    if (!device) return;
    const graph = makeGraph();
    graph.vector('input', 'uint32x3');
    graph.vector('signed', 'sint32x3');
    graph.vector('float', 'float32x3');
    graph.add(new GPUExpressionOperation({output: 'signed', expression: 'sint32(input)'}));
    graph.add(new GPUExpressionOperation({output: 'float', expression: 'float32(input)'}));
    const compiled = graph.compile(device);
    const input = createVector(device, 'uint32x3', [[16777217, 2147483648, 4294967295]], 1);
    try {
      const results = await compiled.run({input});
      try {
        expect(await readVector(results.signed)).toEqual([16777217, 2147483647, 2147483647]);
        expect(await readVector(results.float)).toEqual(
          [16777217, 2147483648, 4294967295].map(Math.fround)
        );
      } finally {
        Object.values(results).forEach(result => result.destroy());
      }
    } finally {
      input.destroy();
      compiled.destroy();
    }
  });
}
