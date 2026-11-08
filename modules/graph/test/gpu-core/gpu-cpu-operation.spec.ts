// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getWebGPUTestDevice} from '@luma.gl/core/test-utils';
import {GPUGraph, GPUCPUOperation, GPUExpressionOperation, gpuGraph} from '@luma.gl/graph';

test('GPUGraph CPU outputs resolve shapes per run and retain caller-owned results', async ({
  skip
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  const graph = new GPUGraph();
  graph.addInput('count', gpuGraph.scalar('uint32'));
  graph.add(
    new GPUCPUOperation({
      id: 'mesh',
      inputs: {count: 'count'},
      outputs: {positions: gpuGraph.vector('float32x2'), indices: gpuGraph.vector('uint32')},
      execute({inputs}) {
        const count = inputs.count;
        if (typeof count !== 'number') throw new Error('Expected scalar');
        if (count === 7) throw new Error('CPU failure');
        return {
          positions: {
            chunks: [{values: new Float32Array(count * 2).fill(3)}, {values: new Float32Array(0)}]
          },
          indices: new Uint32Array(count)
        };
      }
    })
  );
  graph.add(new GPUExpressionOperation({output: 'scaled', expression: 'positions * 2'}));
  const compiled = graph.compile(device, {outputs: ['positions', 'scaled', 'indices']});
  try {
    expect(() => compiled.prepare({inputs: {count: 2}})).toThrow(
      'CPU operations require asynchronous run()'
    );
    const first = await compiled.run({inputs: {count: 2}});
    try {
      await expect(compiled.run({inputs: {count: 7}})).rejects.toThrow('CPU failure');
      const second = await compiled.run({inputs: {count: 3}});
      try {
        expect(first.positions.length).toBe(2);
        expect(second.positions.length).toBe(3);
        expect(second.indices.length).toBe(3);
        expect(second.scaled.data.map(chunk => chunk.length)).toEqual([3, 0]);
        const bytes = await second.scaled.data[0].buffer.readAsync(0, 24);
        expect(Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, 6))).toEqual([
          6, 6, 6, 6, 6, 6
        ]);
      } finally {
        for (const vector of Object.values(second)) vector.destroy();
      }
    } finally {
      for (const vector of Object.values(first)) vector.destroy();
    }
  } finally {
    compiled.destroy();
  }
});

test('GPUGraph retains its executor while an async CPU callback is pending', async ({skip}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return skip();
  let release: () => void = () => {};
  const pending = new Promise<void>(resolve => {
    release = resolve;
  });
  const graph = new GPUGraph();
  graph.add(
    new GPUCPUOperation({
      id: 'wait',
      inputs: {},
      outputs: {result: gpuGraph.vector('float32')},
      async execute() {
        await pending;
        return {result: new Float32Array([9])};
      }
    })
  );
  const compiled = graph.compile(device);
  const running = compiled.run({});
  try {
    expect(() => compiled.destroy()).toThrow();
    await expect(compiled.run({})).rejects.toThrow();
  } finally {
    release();
  }
  const outputs = await running;
  outputs.result.destroy();
  compiled.destroy();
});
