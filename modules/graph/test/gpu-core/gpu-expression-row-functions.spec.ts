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
function makeVector(device: Device, format: GPUGraphVectorFormat, chunks: number[][]): GPUVector {
  const {components, signedDataType} = getGPUVectorFormatInfo(format);
  const ArrayType = arrayTypes[signedDataType as keyof typeof arrayTypes];
  return new GPUVector({
    type: 'data',
    format,
    ownsData: true,
    data: chunks.map(values => {
      const data = new ArrayType(Math.max(components, values.length) + 2).fill(99);
      data.set(values, 1);
      return new GPUData({
        buffer: device.createBuffer({
          data,
          usage: Buffer.STORAGE | Buffer.VERTEX | Buffer.COPY_SRC | Buffer.COPY_DST
        }),
        format,
        length: values.length / components,
        byteOffset: 4,
        ownsBuffer: true
      });
    })
  });
}
async function readVector(vector: GPUVector): Promise<number[]> {
  const info = getGPUVectorFormatInfo(vector.format);
  const ArrayType = arrayTypes[info.signedDataType as keyof typeof arrayTypes];
  return (
    await Promise.all(
      vector.data.map(async chunk => {
        if (!chunk.length) return [];
        const data = await chunk.buffer.readAsync(chunk.byteOffset, chunk.length * info.byteLength);
        return Array.from(
          new ArrayType(data.buffer, data.byteOffset, chunk.length * info.components)
        );
      })
    )
  ).flat();
}
for (const backend of ['webgl-simple', 'webgpu-simple', 'webgpu-full'] as const) {
  const getDevice = backend === 'webgl-simple' ? getWebGLTestDevice : getWebGPUTestDevice;
  const makeGraph = () => (backend === 'webgpu-full' ? new GPUGraph() : new GPUSimpleGraph());
  test(`${backend} row functions compose across chunks, targets and repeated runs`, async ({
    skip
  }) => {
    const device = await getDevice();
    if (!device) return skip();
    const graph = makeGraph();
    graph.vector('positions', 'float32x3');
    graph.vector('ids', 'uint32x3');
    graph.scalar('fallback', 'uint32');
    graph.vector('mask', 'uint32');
    graph.add(new GPUExpressionOperation({output: 'mask', expression: 'equalAll(ids, ids.zyx)'}));
    const cases: {
      name: string;
      expression: string;
      format: GPUGraphVectorFormat;
      expected: number[];
    }[] = [
      {
        name: 'dot',
        expression: 'dot(positions, vec3(2))',
        format: 'float32',
        expected: [14, -2, 12]
      },
      {name: 'length', expression: 'length(positions)', format: 'float32', expected: [5, 3, 6]},
      {
        name: 'length4',
        expression: 'length(vec4(positions, 0))',
        format: 'float32',
        expected: [5, 3, 6]
      },
      {
        name: 'exactEquality',
        expression: 'equalAll(ids.x, ids.y)',
        format: 'uint32',
        expected: [0, 0, 1]
      },
      {
        name: 'broadcast',
        expression: 'positions + length(positions)',
        format: 'float32x3',
        expected: [8, 9, 5, 1, 2, 5, 10, 4, 10]
      },
      {
        name: 'equal',
        expression: 'equalAll(positions, positions.zyx)',
        format: 'uint32',
        expected: [0, 0, 1]
      },
      {
        name: 'exact',
        expression: 'select(mask, ids, fallback)',
        format: 'uint32x3',
        expected: [4294967295, 16777217, 4294967295, 2147483649, 2147483649, 2147483649, 0, 0, 0]
      },
      {
        name: 'lanes',
        expression: 'select(positions, ids, uint32(0))',
        format: 'uint32x3',
        expected: [4294967295, 16777217, 0, 16777217, 16777216, 4294967295, 0, 0, 0]
      },
      {
        name: 'fractional',
        expression: 'select(positions / 16, ids, fallback)',
        format: 'uint32x3',
        expected: [4294967295, 16777217, 2147483649, 16777217, 16777216, 4294967295, 0, 0, 0]
      },
      {
        name: 'signedCondition',
        expression: 'select(sint32(positions), ids, fallback)',
        format: 'uint32x3',
        expected: [4294967295, 16777217, 2147483649, 16777217, 16777216, 4294967295, 0, 0, 0]
      },
      {
        name: 'selectedScalar',
        expression: 'select(mask, 1, positions)',
        format: 'float32x3',
        expected: [1, 1, 1, -2, -1, 2, 1, 1, 1]
      },
      {
        name: 'nested',
        expression: 'vec2(dot(positions.xy, positions.xy), length(positions)).yx',
        format: 'float32x2',
        expected: [5, 25, 3, 5, 6, 20]
      },
      {
        name: 'constant',
        expression: 'positions + dot(vec2(3, 4), vec2(3, 4))',
        format: 'float32x3',
        expected: [28, 29, 25, 23, 24, 27, 29, 23, 29]
      }
    ];
    for (const entry of cases) {
      graph.vector(entry.name, entry.format);
      graph.add(new GPUExpressionOperation({output: entry.name, expression: entry.expression}));
    }
    const compiled = graph.compile(device, {outputs: cases.map(entry => entry.name)});
    try {
      for (const rows of [3, 1]) {
        const positionValues = [3, 4, 0, -2, -1, 2, 4, -2, 4].slice(0, rows * 3);
        const idValues = [
          4294967295, 16777217, 4294967295, 16777217, 16777216, 4294967295, 0, 0, 0
        ].slice(0, rows * 3);
        const positions = makeVector(device, 'float32x3', [
          positionValues.slice(0, 3),
          [],
          positionValues.slice(3)
        ]);
        const ids = makeVector(device, 'uint32x3', [idValues.slice(0, 3), [], idValues.slice(3)]);
        const target = makeVector(device, 'uint32x3', [
          [0, 0, 0],
          [],
          Array((rows - 1) * 3).fill(0)
        ]);
        const submit = vi.spyOn(device, 'submit');
        try {
          const results = await compiled.run(
            {positions, ids, fallback: 2147483649},
            {outputTargets: {exact: target}}
          );
          try {
            if (backend !== 'webgl-simple') expect(submit).toHaveBeenCalledTimes(1);
            expect(results.exact).toBe(target);
            for (const entry of cases) {
              const components = getGPUVectorFormatInfo(entry.format).components;
              const actual = await readVector(results[entry.name]);
              const expected = entry.expected.slice(0, rows * components);
              if (entry.format.startsWith('float32')) {
                expect(actual.length).toBe(expected.length);
                actual.forEach((value, index) =>
                  expect(value, entry.expression).toBeCloseTo(expected[index], 5)
                );
              } else expect(actual, entry.expression).toEqual(expected);
              expect(results[entry.name].data.map(chunk => chunk.length)).toEqual([1, 0, rows - 1]);
            }
            expect(await readVector(ids)).toEqual(idValues);
            for (const chunk of target.data) {
              const bytes = await chunk.buffer.readAsync();
              const values = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
              expect(values[0]).toBe(99);
              expect(values[1 + chunk.length * 3]).toBe(99);
            }
          } finally {
            Object.entries(results).forEach(([name, value]) => {
              if (name !== 'exact') value.destroy();
            });
          }
        } finally {
          submit.mockRestore();
          positions.destroy();
          ids.destroy();
          target.destroy();
        }
      }
    } finally {
      compiled.destroy();
    }
  });
  test(`${backend} row functions accept scalar bindings and keep integer selection exact`, async ({
    skip
  }) => {
    const device = await getDevice();
    if (!device) return skip();
    const graph = makeGraph();
    graph.scalar('value', 'float32');
    graph.scalar('id', 'sint32');
    graph.scalar('magnitude', 'float32');
    graph.scalar('match', 'uint32');
    graph.scalar('chosen', 'sint32');
    graph.add(new GPUExpressionOperation({output: 'magnitude', expression: 'length(value)'}));
    graph.add(new GPUExpressionOperation({output: 'match', expression: 'equalAll(id, id)'}));
    graph.add(
      new GPUExpressionOperation({output: 'chosen', expression: 'select(value, id, sint32(0))'})
    );
    const compiled = graph.compile(device);
    const results = await compiled.run({value: -0.25, id: -2147483648});
    compiled.destroy();
    try {
      expect(await readVector(results.magnitude)).toEqual([0.25]);
      expect(await readVector(results.match)).toEqual([1]);
      expect(await readVector(results.chosen)).toEqual([-2147483648]);
    } finally {
      Object.values(results).forEach(value => value.destroy());
    }
  });
}
