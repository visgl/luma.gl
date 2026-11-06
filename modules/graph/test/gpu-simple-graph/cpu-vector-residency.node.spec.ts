// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {CPUData, CPUVector, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';
import {GPUCPUOperation, gpuGraph} from '@luma.gl/graph';

test('CPU chains return CPUVector without GPU allocation or readback', async () => {
  const device = new NullDevice({});
  const createBuffer = vi.spyOn(device, 'createBuffer');
  const graph = new GPUSimpleGraph();
  graph.addInput('source', gpuGraph.vector('float32'));
  for (const [input, output] of [
    ['source', 'first'],
    ['first', 'result']
  ]) {
    graph.add(
      new GPUCPUOperation({
        id: output,
        inputs: {value: input},
        outputs: {[output]: gpuGraph.vector('float32')},
        execute({inputs}) {
          const value = inputs.value;
          if (typeof value === 'number') throw new Error('Expected vector');
          return {
            [output]: {
              chunks: value.chunks.map(chunk => ({
                values: Float32Array.from(chunk.values, item => item * 2)
              }))
            }
          };
        }
      })
    );
  }
  const compiled = graph.compile<Record<string, CPUVector>>(device, {
    outputs: ['result'],
    outputLocations: {result: 'cpu'}
  });
  const source = new CPUVector({
    format: 'float32',
    data: [new CPUData({format: 'float32', buffer: new Float32Array([1, 2]), length: 2})]
  });
  try {
    const result = await compiled.run({inputs: {source}});
    expect(result.result).toBeInstanceOf(CPUVector);
    expect(
      Array.from(
        new Float32Array(result.result.data[0].buffer, result.result.data[0].byteOffset, 2)
      )
    ).toEqual([4, 8]);
    expect(createBuffer).not.toHaveBeenCalled();
  } finally {
    compiled.destroy();
    device.destroy();
  }
});

test('GPU input is read back once across CPU branches', async () => {
  const device = new NullDevice({});
  const buffer = device.createBuffer({data: new Float32Array([3])});
  const read = vi.spyOn(buffer, 'readAsync');
  const create = vi.spyOn(device, 'createBuffer');
  const source = new GPUVector({
    type: 'buffer',
    name: 'source',
    format: 'float32',
    buffer,
    length: 1
  });
  const graph = new GPUSimpleGraph();
  graph.addInput('source', gpuGraph.vector('float32'));
  for (const output of ['a', 'b'])
    graph.add(
      new GPUCPUOperation({
        id: output,
        inputs: {source: 'source'},
        outputs: {[output]: gpuGraph.vector('float32')},
        execute({inputs}) {
          const value = inputs.source;
          if (typeof value === 'number') throw new Error('Expected vector');
          return {[output]: value.pack()};
        }
      })
    );
  const compiled = graph.compile<Record<string, CPUVector>>(device, {
    outputs: ['a', 'b'],
    outputLocations: {a: 'cpu', b: 'cpu'}
  });
  try {
    await compiled.run({inputs: {source}});
    expect(read).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();
  } finally {
    compiled.destroy();
    buffer.destroy();
    device.destroy();
  }
});

test('CPU input uploads once for multiple GPU consumers', async () => {
  const {GPUExpressionOperation} = await import('@luma.gl/graph');
  const {backendRegistry} = await import('@luma.gl/graph/gpu-simple-graph');
  const backend = await import('@luma.gl/graph/gpu-simple-graph/cpu');
  await backendRegistry.add('null', backend);
  const device = new NullDevice({});
  const create = vi.spyOn(device, 'createBuffer');
  const graph = new GPUSimpleGraph();
  graph.addInput('source', gpuGraph.vector('float32'));
  graph.add(new GPUExpressionOperation({output: 'a', expression: 'source * 2'}));
  graph.add(new GPUExpressionOperation({output: 'b', expression: 'source * 3'}));
  const compiled = graph.compile(device, {outputs: ['a', 'b']});
  const source = new CPUVector({
    format: 'float32',
    data: [new CPUData({buffer: new Float32Array([2, 4]), format: 'float32', length: 2})]
  });
  try {
    const outputs = await compiled.run({inputs: {source}});
    // One source upload and one output allocation per expression.
    expect(create).toHaveBeenCalledTimes(3);
    for (const output of Object.values(outputs)) output.destroy();
  } finally {
    compiled.destroy();
    device.destroy();
  }
});

test('rejects unsupported CPU validity metadata before callbacks execute', async () => {
  const device = new NullDevice({});
  const execute = vi.fn(() => ({result: new Float32Array([1])}));
  const graph = new GPUSimpleGraph();
  graph.addInput('source', gpuGraph.vector('float32'));
  graph.add(
    new GPUCPUOperation({
      id: 'copy',
      inputs: {source: 'source'},
      outputs: {result: gpuGraph.vector('float32')},
      execute
    })
  );
  const compiled = graph.compile<Record<string, CPUVector>>(device, {
    outputs: ['result'],
    outputLocations: {result: 'cpu'}
  });
  const source = new CPUVector({
    format: 'float32',
    data: [
      new CPUData({
        buffer: new Float32Array([1]),
        format: 'float32',
        length: 1,
        nullBitmap: new Uint8Array([0])
      })
    ]
  });
  try {
    await expect(compiled.run({inputs: {source}})).rejects.toThrow();
    expect(execute).not.toHaveBeenCalled();
  } finally {
    compiled.destroy();
    device.destroy();
  }
});
