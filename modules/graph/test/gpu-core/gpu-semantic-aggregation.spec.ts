// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUConditionalOperation, GPUGraphScalarLiteral} from '@luma.gl/graph/gpu-core';
import {
  GPUGraph,
  GPUGraphCompiler,
  GPUGraphGroupAggregation,
  GPUGraphReduction,
  gpuGraph
} from '@luma.gl/graph';

for (const operation of ['count', 'sum', 'min', 'max', 'mean'] as const) {
  test(`semantic grouped ${operation} composes with extent across independent chunks`, async ({
    skip
  }) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    device.handle.pushErrorScope('validation');
    const makeVector = <Format extends 'uint32' | 'float32'>(format: Format, chunks: number[][]) =>
      new GPUVector({
        type: 'data',
        name: format,
        format,
        ownsData: true,
        data: chunks.map(
          values =>
            new GPUData({
              format,
              length: values.length,
              ownsBuffer: true,
              buffer: device.createBuffer({
                data: format === 'uint32' ? new Uint32Array(values) : new Float32Array(values),
                usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
              })
            })
        )
      });
    const keys = makeVector('uint32', [
      [0, 1],
      [0, 1, 99]
    ]);
    const weights = makeVector('float32', [[2], [4, 6, 100, 1000]]);
    const mask = makeVector('uint32', [
      [1, 1, 1],
      [0, 1]
    ]);
    const program = new GPUGraph();
    program.addInput('keys', gpuGraph.vector('uint32'));
    program.addInput('weights', gpuGraph.vector('float32'));
    program.addInput('mask', gpuGraph.vector('uint32'));
    program.add(
      operation === 'count'
        ? new GPUGraphGroupAggregation({
            keys: 'keys',
            mask: 'mask',
            output: 'groups',
            groupCount: 3,
            operation
          })
        : new GPUGraphGroupAggregation({
            keys: 'keys',
            values: 'weights',
            mask: 'mask',
            output: 'groups',
            groupCount: 3,
            operation
          })
    );
    program.add(new GPUGraphReduction({input: 'groups', output: 'extent', operation: 'extent'}));
    const compiled = program.compile(device, {outputs: ['groups', 'extent']});
    try {
      const result = await compiled.run({inputs: {keys, weights, mask}});
      const read = async (name: string) => {
        const vector = result[name];
        const bytes = await vector.data[0].buffer.readAsync();
        return Array.from(
          operation === 'count'
            ? new Uint32Array(bytes.buffer, bytes.byteOffset, vector.length)
            : new Float32Array(bytes.buffer, bytes.byteOffset, vector.length)
        );
      };
      const expected = {
        count: [2, 1, 0],
        sum: [8, 4, 0],
        min: [2, 4, NaN],
        max: [6, 4, NaN],
        mean: [4, 4, NaN]
      }[operation];
      expect(await read('groups')).toEqual(expected);
      const extent = await read('extent');
      expect(extent).toEqual(
        operation === 'count'
          ? [0, 2]
          : operation === 'sum'
            ? [0, 8]
            : operation === 'min'
              ? [2, 4]
              : operation === 'max'
                ? [4, 6]
                : [4, 4]
      );
      expect(keys.data.every(chunk => !chunk.buffer.destroyed)).toBe(true);
      for (const vector of Object.values(result)) vector.destroy();
    } finally {
      compiled.destroy();
      keys.destroy();
      weights.destroy();
      mask.destroy();
    }
    expect(await device.handle.popErrorScope()).toBeNull();
  });
}

test('semantic aggregation reuses borrowed destinations and resets them between runs', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const makeVector = (values: number[]) =>
    new GPUVector({
      type: 'buffer',
      format: 'uint32',
      length: values.length,
      ownsBuffer: true,
      buffer: device.createBuffer({
        data: new Uint32Array(values),
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      })
    });
  const keys = makeVector([0, 0, 1]);
  const mask = makeVector([0, 1]);
  const target = makeVector([123, 456]);
  const program = new GPUGraph();
  program.addInput('keys', gpuGraph.vector('uint32'));
  program.addInput('mask', gpuGraph.vector('uint32'));
  program.add([
    new GPUGraphGroupAggregation({
      keys: 'keys',
      output: 'counts',
      groupCount: 2,
      operation: 'count'
    }),
    new GPUGraphReduction({input: 'counts', mask: 'mask', output: 'selected', operation: 'sum'})
  ]);
  const compiled = program.compile(device, {outputs: ['counts', 'selected']});
  try {
    for (const [input, expected] of [
      [
        [0, 0, 1],
        [2, 1]
      ],
      [
        [1, 1, 1],
        [0, 3]
      ]
    ] as const) {
      keys.data[0].buffer.write(new Uint32Array(input));
      const result = await compiled.run({inputs: {keys, mask}, outputTargets: {counts: target}});
      try {
        expect(result.counts).toBe(target);
        const countBytes = await target.data[0].buffer.readAsync();
        expect(Array.from(new Uint32Array(countBytes.buffer, countBytes.byteOffset, 2))).toEqual(
          expected
        );
        const selectedBytes = await result.selected.data[0].buffer.readAsync();
        expect(new Uint32Array(selectedBytes.buffer, selectedBytes.byteOffset, 1)[0]).toBe(
          expected[1]
        );
      } finally {
        result.selected.destroy();
      }
    }
  } finally {
    compiled.destroy();
    expect(target.data[0].buffer.destroyed).toBe(false);
    keys.destroy();
    mask.destroy();
    target.destroy();
  }
});

for (const enabled of [0, 1]) {
  test(`semantic grouped sum and extent respect GPU predicate ${enabled}`, async ({skip}) => {
    const device = await getWebGPUTestDevice();
    if (!device) return skip();
    const keys = new GPUData({
      format: 'uint32',
      length: 3,
      ownsBuffer: true,
      buffer: device.createBuffer({
        data: new Uint32Array([0, 0, 1]),
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
      })
    });
    const makeFloatData = (values: number[]) =>
      new GPUData({
        format: 'float32',
        length: values.length,
        ownsBuffer: true,
        buffer: device.createBuffer({
          data: new Float32Array(values),
          usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC
        })
      });
    const values = makeFloatData([2, 3, 4]);
    const groups = makeFloatData([100, 200]);
    const extent = makeFloatData([300, 400]);
    const program = new GPUGraph();
    program.vector('keys', 'uint32', 3, {external: true});
    program.vector('values', 'float32', 3, {external: true});
    program.vector('groups', 'float32', 2, {external: true});
    program.vector('extent', 'float32', 2, {external: true});
    const active = program.scalar('active', 'uint32');
    program.add([
      new GPUGraphScalarLiteral({output: active, value: enabled}),
      new GPUConditionalOperation({
        predicate: {id: 'enabled', source: 'gpu', value: active},
        body: [
          new GPUGraphGroupAggregation({
            keys: 'keys',
            values: 'values',
            output: 'groups',
            operation: 'sum'
          }),
          new GPUGraphReduction({input: 'groups', output: 'extent', operation: 'extent'})
        ]
      })
    ]);
    const {graph} = new GPUGraphCompiler(device).compile(program, {
      vectors: {keys, values, groups, extent}
    });
    const executable = graph.compile();
    try {
      const encoder = device.createCommandEncoder();
      executable.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
      for (const [output, expected] of [
        [groups, enabled ? [5, 4] : [100, 200]],
        [extent, enabled ? [4, 5] : [300, 400]]
      ] as const) {
        const bytes = await output.buffer.readAsync();
        expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 2))).toEqual(expected);
      }
    } finally {
      executable.destroy();
      for (const data of [keys, values, groups, extent]) data.destroy();
    }
  });
}
