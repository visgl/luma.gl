// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GPUGraph, GPUGraphGroupAggregation, GPUGraphReduction, gpuGraph} from '@luma.gl/graph';
import {resolveGPUGraphDeclarations} from '../../src/gpu-core/gpu-graph-declarations';

function createProgram() {
  const program = new GPUGraph();
  program.addInput('keys', gpuGraph.vector('uint32', {length: 4}));
  program.addInput('weights', gpuGraph.vector('float32', {length: 4}));
  program.addInput('mask', gpuGraph.vector('uint32', {length: 4}));
  return program;
}

test('aggregation contracts infer group cardinality and reduction format without mutating the graph', () => {
  const program = createProgram();
  program.add(
    new GPUGraphGroupAggregation({
      keys: 'keys',
      values: 'weights',
      mask: 'mask',
      output: 'groups',
      groupCount: 3,
      operation: 'mean'
    })
  );
  program.add(new GPUGraphReduction({input: 'groups', output: 'extent', operation: 'extent'}));
  const resolved = resolveGPUGraphDeclarations(program);
  expect(program.vectors.map(vector => vector.id)).toEqual(['keys', 'weights', 'mask']);
  expect(
    resolved.vectors.slice(3).map(vector => [vector.id, vector.format, vector.length])
  ).toEqual([
    ['groups', 'float32', 3],
    ['extent', 'float32', 2]
  ]);
});

test('count aggregation preserves declared destination shape and accepts typed logical references', () => {
  const program = createProgram();
  const output = program.vector('counts', 'uint32', 2);
  program.add(
    new GPUGraphGroupAggregation({
      keys: program.addInput('typedKeys', gpuGraph.vector('uint32', {length: 4})),
      output,
      operation: 'count'
    })
  );
  const resolved = resolveGPUGraphDeclarations(program);
  expect(resolved.vectors.find(vector => vector.id === 'counts')?.length).toBe(2);
});

for (const format of ['uint32', 'sint32', 'float32'] as const) {
  test(`scalar reduction infers ${format} output`, () => {
    const program = new GPUGraph();
    const input = program.addInput('input', gpuGraph.vector(format, {length: 4}));
    program.add(new GPUGraphReduction({input, output: 'sum', operation: 'sum'}));
    const resolved = resolveGPUGraphDeclarations(program);
    expect(resolved.vectors[1].format).toBe(format);
    expect(resolved.vectors[1].length).toBe(1);
  });
}

test('semantic operations reject incompatible formats and group counts', () => {
  for (const groupCount of [0, -1, 1.5, Infinity]) {
    expect(
      () =>
        new GPUGraphGroupAggregation({
          keys: 'keys',
          output: 'counts',
          operation: 'count',
          groupCount
        })
    ).toThrow();
  }
  for (const operation of [
    new GPUGraphGroupAggregation({
      keys: 'weights',
      output: 'counts',
      operation: 'count',
      groupCount: 2
    }),
    new GPUGraphGroupAggregation({
      keys: 'keys',
      values: 'mask',
      output: 'groups',
      operation: 'sum',
      groupCount: 2
    }),
    new GPUGraphGroupAggregation({
      keys: 'keys',
      mask: 'weights',
      output: 'counts',
      operation: 'count',
      groupCount: 2
    }),
    new GPUGraphReduction({
      input: 'weights',
      mask: 'weights',
      output: 'extent',
      operation: 'extent'
    })
  ]) {
    const program = createProgram();
    program.add(operation);
    expect(() => resolveGPUGraphDeclarations(program)).toThrow();
  }
});
