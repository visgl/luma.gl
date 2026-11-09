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
  test(`${backend} composes component expressions with chunks, offsets and reusable bindings`, async () => {
    const device = await getDevice();
    if (!device) return;
    const graph = makeGraph();
    graph.vector('positions', 'float32x3');
    graph.vector('weights', 'float32');
    graph.scalar('scale', 'float32');
    graph.vector('built', 'float32x4');
    graph.add(new GPUExpressionOperation({output: 'built', expression: 'vec4(positions, scale)'}));
    const cases: {
      name: string;
      expression: string;
      format: GPUGraphVectorFormat;
      expected: (row: number[]) => number[];
    }[] = [
      {name: 'component', expression: 'positions.x', format: 'float32', expected: row => [row[0]]},
      {
        name: 'contiguous',
        expression: 'positions.yz',
        format: 'float32x2',
        expected: row => row.slice(1)
      },
      {
        name: 'reordered',
        expression: 'positions.zyx',
        format: 'float32x3',
        expected: row => [...row].reverse()
      },
      {
        name: 'repeated',
        expression: 'positions.xx',
        format: 'float32x2',
        expected: row => [row[0], row[0]]
      },
      {
        name: 'nested',
        expression: 'positions.xy.yx',
        format: 'float32x2',
        expected: row => [row[1], row[0]]
      },
      {
        name: 'constructed',
        expression: 'vec4(positions.xy, weights, scale)',
        format: 'float32x4',
        expected: row => [row[0], row[1], 4, 2.5]
      },
      {
        name: 'replicated',
        expression: 'vec3(weights)',
        format: 'float32x3',
        expected: () => [4, 4, 4]
      },
      {
        name: 'broadcast',
        expression: 'positions + positions.y',
        format: 'float32x3',
        expected: row => row.map(value => value + row[1])
      },
      {
        name: 'constantBroadcast',
        expression: 'positions + vec3(1, 2, 3).y',
        format: 'float32x3',
        expected: row => row.map(value => value + 2)
      },
      {
        name: 'nestedConstant',
        expression: 'positions + vec3(scale).z',
        format: 'float32x3',
        expected: row => row.map(value => value + 2.5)
      },
      {
        name: 'fromIntermediate',
        expression: 'built.wz.yx',
        format: 'float32x2',
        expected: row => [row[2], 2.5]
      },
      {
        name: 'cast',
        expression: 'uint32(vec2(positions.z, positions.x))',
        format: 'uint32x2',
        expected: row => [Math.max(0, row[2]), Math.max(0, row[0])]
      }
    ];
    for (const entry of cases) {
      graph.vector(entry.name, entry.format);
      graph.add(new GPUExpressionOperation({output: entry.name, expression: entry.expression}));
    }
    const compiled = graph.compile(device, {outputs: cases.map(entry => entry.name)});
    try {
      for (const rows of [
        [
          [1, 2, 3],
          [-4, 5, 6],
          [7, 8, 9]
        ],
        [[10, 11, 12]]
      ]) {
        const positions = makeVector(device, 'float32x3', [rows[0], [], rows.slice(1).flat()]);
        const weights = makeVector(device, 'float32', [[4], [], rows.slice(1).map(() => 4)]);
        const target = makeVector(device, 'float32x2', [
          [0, 0],
          [],
          rows.slice(1).flatMap(() => [0, 0])
        ]);
        const submit = vi.spyOn(device, 'submit');
        try {
          const results = await compiled.run(
            {positions, weights, scale: 2.5},
            {outputTargets: {contiguous: target}}
          );
          try {
            if (backend !== 'webgl-simple') expect(submit).toHaveBeenCalledTimes(1);
            expect(results.contiguous).toBe(target);
            for (const entry of cases) {
              expect(await readVector(results[entry.name]), entry.expression).toEqual(
                rows.flatMap(entry.expected)
              );
              expect(results[entry.name].data.map(chunk => chunk.length)).toEqual([
                1,
                0,
                rows.length - 1
              ]);
            }
            expect(await readVector(positions)).toEqual(rows.flat());
            for (const chunk of target.data) {
              const data = await chunk.buffer.readAsync();
              const values = new Float32Array(data.buffer, data.byteOffset, data.byteLength / 4);
              expect(values[0]).toBe(99);
              expect(values[1 + chunk.length * 2]).toBe(99);
            }
          } finally {
            Object.entries(results).forEach(([name, value]) => {
              if (name !== 'contiguous') value.destroy();
            });
          }
        } finally {
          submit.mockRestore();
          positions.destroy();
          weights.destroy();
          target.destroy();
        }
      }
    } finally {
      compiled.destroy();
    }
  });
  test(`${backend} constructs exact integer rows and preserves results after destruction`, async () => {
    const device = await getDevice();
    if (!device) return;
    const graph = makeGraph();
    graph.vector('ids', 'uint32x2');
    graph.scalar('last', 'uint32');
    graph.vector('output', 'uint32x4');
    graph.add(new GPUExpressionOperation({output: 'output', expression: 'vec4(ids.yx, last.xx)'}));
    const compiled = graph.compile(device);
    const ids = makeVector(device, 'uint32x2', [[16777217, 4294967295]]);
    const result = await compiled.run({ids, last: 2147483649});
    compiled.destroy();
    ids.destroy();
    try {
      expect(await readVector(result.output)).toEqual([
        4294967295, 16777217, 2147483649, 2147483649
      ]);
    } finally {
      result.output.destroy();
    }
  });
  test(`${backend} extracts scalars from constant constructors`, async () => {
    const device = await getDevice();
    if (!device) return;
    const graph = makeGraph();
    graph.scalar('scale', 'float32');
    graph.scalar('output', 'float32');
    graph.add(new GPUExpressionOperation({output: 'output', expression: 'vec3(1, scale, 3).y'}));
    const compiled = graph.compile(device);
    try {
      const result = await compiled.run({scale: 5});
      try {
        expect(await readVector(result.output)).toEqual([5]);
      } finally {
        result.output.destroy();
      }
    } finally {
      compiled.destroy();
    }
  });
}
