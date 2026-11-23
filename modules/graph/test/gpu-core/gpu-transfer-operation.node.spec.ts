// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Buffer} from '@luma.gl/core';
import {GPUData} from '@luma.gl/graph/gpu-data';
import {GPUGraphCompiler} from '@luma.gl/graph/gpu-core';
import {NullDevice} from '@luma.gl/core/test-utils';
import {
  GPUGraph,
  GPUUploadOperation,
  GPUCopyOperation,
  GPUCompactionOperation,
  gpuGraph
} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';
import {GPUExpressionProgram} from '../../src/gpu-core/gpu-expression-plan';

test('upload snapshots typed rows and copy preserves empty chunks', () => {
  const data = new Float32Array([1, 2, 3, 4]);
  const upload = new GPUUploadOperation({
    output: 'uploaded',
    format: 'float32x2',
    data: [data, new Float32Array(0)]
  });
  data.fill(99);
  expect(Array.from(new Float32Array(upload.getData()[0].buffer))).toEqual([1, 2, 3, 4]);
  upload.getData()[0].fill(0);
  expect(Array.from(new Float32Array(upload.getData()[0].buffer))).toEqual([1, 2, 3, 4]);
  const graph = new GPUGraph();
  graph.add([upload, new GPUCopyOperation({input: 'uploaded', output: 'copied'})]);
  const program = new GPUExpressionProgram(graph);
  expect(program.outputs).toEqual(['copied']);
  const device = new NullDevice({});
  const invocation = program.prepare(device, {});
  try {
    const result = invocation.getOutputs().copied;
    expect(result.format).toBe('float32x2');
    expect(result.data.map(chunk => chunk.length)).toEqual([2, 0]);
  } finally {
    invocation.destroy();
    device.destroy();
  }
});

test('transfer contracts reject scalar copy, wrong host types and partial rows', () => {
  expect(
    () => new GPUUploadOperation({output: 'out', format: 'uint32', data: new Float32Array([1])})
  ).toThrow();
  expect(
    () =>
      new GPUUploadOperation({output: 'out', format: 'float32x3', data: new Float32Array([1, 2])})
  ).toThrow();
  const graph = new GPUGraph();
  graph.addInput('input', gpuGraph.scalar('float32'));
  graph.add(new GPUCopyOperation({input: 'input', output: 'copy'}));
  expect(() => new GPUExpressionProgram(graph)).toThrow();
});

test('compaction declares capacity and GPU count independently', () => {
  const graph = new GPUGraph();
  graph.addInput('input', gpuGraph.vector('uint32'));
  graph.addInput('flags', gpuGraph.vector('uint32'));
  graph.add(
    new GPUCompactionOperation({input: 'input', flags: 'flags', output: 'selected', count: 'count'})
  );
  const program = new GPUExpressionProgram(graph);
  expect(program.outputs).toEqual(['selected', 'count']);
  expect(program.scalars.find(value => value.id === 'count')?.format).toBe('uint32');
  expect(program.vectors.find(value => value.id === 'selected')?.length).toBeUndefined();
  const simple = new GPUSimpleGraph();
  simple.addInput('input', gpuGraph.vector('uint32'));
  simple.addInput('flags', gpuGraph.vector('uint32'));
  simple.add(
    new GPUCompactionOperation({input: 'input', flags: 'flags', output: 'selected', count: 'count'})
  );
  const device = new NullDevice({});
  try {
    expect(() => simple.compile(device)).toThrow('SimpleGraph declarative execution supports');
  } finally {
    device.destroy();
  }
});

test('direct compiler inherits bound partitions through copy chains and adds transfer usage', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const data = [1, 2].map(
    length =>
      new GPUData({
        format: 'uint32',
        length,
        ownsBuffer: true,
        buffer: device.createBuffer({
          byteLength: length * 4,
          usage: Buffer.STORAGE | Buffer.COPY_SRC
        })
      })
  );
  const graph = new GPUGraph();
  graph.vector('input', 'uint32', 3, {external: true});
  graph.vector('intermediate', 'uint32', 3);
  graph.add([
    new GPUCopyOperation({input: 'input', output: 'intermediate'}),
    new GPUCopyOperation({input: 'intermediate', output: 'result'})
  ]);
  const compilation = new GPUGraphCompiler(device).compile(graph, {vectors: {input: data}});
  try {
    for (const name of ['intermediate', 'result'])
      expect(compilation.vectors.get(name)!.data.map(chunk => chunk.length)).toEqual([1, 2]);
    for (const chunk of compilation.vectors.get('intermediate')!.data) {
      expect(chunk.buffer.usage & (Buffer.COPY_SRC | Buffer.COPY_DST)).toBe(
        Buffer.COPY_SRC | Buffer.COPY_DST
      );
    }
    expect(graph.vectors.find(vector => vector.id === 'input')!.chunkLengths).toBeUndefined();
    expect(
      graph.vectors.find(vector => vector.id === 'intermediate')!.chunkLengths
    ).toBeUndefined();
  } finally {
    data.forEach(chunk => chunk.destroy());
    device.destroy();
  }
});
