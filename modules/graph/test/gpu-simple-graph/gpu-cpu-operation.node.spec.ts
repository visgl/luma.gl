// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {
  GPUCPUOperation,
  GPUUploadOperation,
  GPUExpressionOperation,
  gpuGraph
} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';
import {backendRegistry} from '@luma.gl/graph/gpu-simple-graph';
import * as cpuBackend from '@luma.gl/graph/gpu-simple-graph/cpu';
import {GPUVector} from '@luma.gl/graph/gpu-data';

async function readValues(vector: GPUVector): Promise<number[][]> {
  return Promise.all(
    vector.data.map(async chunk => {
      const bytes = await chunk.buffer.readAsync(
        chunk.byteOffset,
        chunk.length * chunk.rowByteLength
      );
      return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4));
    })
  );
}

backendRegistry.add('null', cpuBackend);

describe('GPUCPUOperation', () => {
  it('allocates independent variable-sized outputs on each run and composes CPU/GPU stages', async () => {
    const device = new NullDevice({});
    let count = 2;
    const graph = new GPUSimpleGraph();
    graph.add(
      new GPUUploadOperation({output: 'input', format: 'float32', data: new Float32Array([3, 4])})
    );
    graph.add(
      new GPUCPUOperation({
        id: 'expand',
        inputs: {source: 'input'},
        outputs: {positions: gpuGraph.vector('float32x2'), indices: gpuGraph.vector('uint32')},
        async execute({inputs}) {
          const source = inputs.source;
          if (typeof source === 'number') throw new Error('Expected vector');
          expect(Array.from(source.pack())).toEqual([3, 4]);
          return {positions: new Float32Array(count * 2).fill(3), indices: new Uint32Array(count)};
        }
      })
    );
    graph.add(new GPUExpressionOperation({output: 'scaled', expression: 'positions * 2'}));
    const compiled = graph.compile(device, {outputs: ['positions', 'indices', 'scaled']});
    const first = await compiled.run({});
    expect(first.positions.length).toBe(2);
    expect(first.indices.length).toBe(2);
    expect(await readValues(first.scaled)).toEqual([[6, 6, 6, 6]]);
    count = 3;
    const second = await compiled.run({});
    expect(second.positions.length).toBe(3);
    expect(first.positions.length).toBe(2);
    expect(second.positions).not.toBe(first.positions);
    for (const result of [first, second])
      for (const vector of Object.values(result)) vector.destroy();
    compiled.destroy();
    device.destroy();
  });

  it('preserves chunks and allows empty results and CPU chains', async () => {
    const device = new NullDevice({});
    const graph = new GPUSimpleGraph();
    graph.add(
      new GPUCPUOperation({
        id: 'source',
        inputs: {},
        outputs: {source: gpuGraph.vector('float32')},
        execute: () => ({
          source: {
            chunks: [
              {values: new Float32Array([1, 2])},
              {values: new Float32Array(0)},
              {values: new Float32Array([3])}
            ]
          }
        })
      })
    );
    graph.add(
      new GPUCPUOperation({
        id: 'consume',
        inputs: {source: 'source'},
        outputs: {empty: gpuGraph.vector('float32')},
        execute({inputs}) {
          const source = inputs.source;
          if (typeof source === 'number') throw new Error('Expected vector');
          expect(source.chunks.map(chunk => chunk.length)).toEqual([2, 0, 1]);
          expect(Array.from(source.pack())).toEqual([1, 2, 3]);
          return {empty: new Float32Array(0)};
        }
      })
    );
    const compiled = graph.compile(device);
    const results = await compiled.run({});
    expect(Object.keys(results)).toEqual(['empty']);
    expect(results.empty.length).toBe(0);
    results.empty.destroy();
    compiled.destroy();
    device.destroy();
  });

  it('validates returned shapes and types and permits retry after callback failure', async () => {
    const device = new NullDevice({});
    let mode = 0;
    const graph = new GPUSimpleGraph();
    graph.add(
      new GPUCPUOperation({
        id: 'source',
        inputs: {},
        outputs: {result: gpuGraph.vector('float32x2', {length: 1})},
        execute() {
          if (mode === 0) throw new Error('callback failed');
          return {
            result:
              mode === 1
                ? new Uint32Array(2)
                : mode === 2
                  ? new Float32Array(3)
                  : new Float32Array(2)
          };
        }
      })
    );
    const compiled = graph.compile(device);
    await expect(compiled.run({})).rejects.toThrow('callback failed');
    mode = 1;
    await expect(compiled.run({})).rejects.toThrow();
    mode = 2;
    await expect(compiled.run({})).rejects.toThrow();
    mode = 3;
    const results = await compiled.run({});
    expect(results.result.length).toBe(1);
    results.result.destroy();
    compiled.destroy();
    device.destroy();
  });
});

it('enforces graph-declared CPU output lengths and chunk boundaries', async () => {
  const device = new NullDevice({});
  let chunks = [new Float32Array(3)];
  const graph = new GPUSimpleGraph();
  graph.vector('result', 'float32', 2, {chunkLengths: [1, 1]});
  graph.add(
    new GPUCPUOperation({
      id: 'source',
      inputs: {},
      outputs: {result: gpuGraph.vector('float32')},
      execute: () => ({result: {chunks: chunks.map(values => ({values}))}})
    })
  );
  const compiled = graph.compile(device, {outputs: ['result']});
  try {
    await expect(compiled.run({})).rejects.toThrow();
    chunks = [new Float32Array(2)];
    await expect(compiled.run({})).rejects.toThrow();
    chunks = [new Float32Array(1), new Float32Array(1)];
    const outputs = await compiled.run({});
    expect(outputs.result.data.map(chunk => chunk.length)).toEqual([1, 1]);
    outputs.result.destroy();
  } finally {
    compiled.destroy();
    device.destroy();
  }
});

it('preserves graph-declared output constraints in GPU stages after CPU work', async () => {
  const device = new NullDevice({});
  const graph = new GPUSimpleGraph();
  graph.vector('result', 'float32', 2);
  graph.add(
    new GPUCPUOperation({
      id: 'source',
      inputs: {},
      outputs: {source: gpuGraph.vector('float32')},
      execute: () => ({source: new Float32Array(3)})
    })
  );
  graph.add(new GPUExpressionOperation({output: 'result', expression: 'source * 2'}));
  const compiled = graph.compile(device, {outputs: ['result']});
  try {
    await expect(compiled.run({})).rejects.toThrow();
  } finally {
    compiled.destroy();
    device.destroy();
  }
});

it('preserves produced vector roles for scalar-only expressions in CPU graphs', async () => {
  const device = new NullDevice({});
  const graph = new GPUSimpleGraph();
  graph.add(
    new GPUCPUOperation({
      id: 'cpu',
      inputs: {},
      outputs: {input: gpuGraph.vector('float32')},
      execute: () => ({input: new Float32Array([1])})
    })
  );
  graph.add(new GPUExpressionOperation({output: 'result', expression: 'vec2(1, 2)'}));
  const compiled = graph.compile(device, {outputs: ['result']});
  try {
    expect(compiled).toBeDefined();
  } finally {
    compiled.destroy();
    device.destroy();
  }
});
