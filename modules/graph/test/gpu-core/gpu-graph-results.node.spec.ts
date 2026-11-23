// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {GPUGraph, GPUExpressionOperation, gpuGraph, type GPUOperation} from '@luma.gl/graph';
import {GPUSimpleGraph} from '@luma.gl/graph/gpu-simple-graph';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUExpressionProgram} from '../../src/gpu-core/gpu-expression-plan';
import {resolveGPUGraphDeclarations} from '../../src/gpu-core/gpu-graph-declarations';

function copy(input: string, output: string): GPUOperation {
  return {
    id: `copy-${output}`,
    type: 'copy',
    contract: {
      outputs: {[output]: gpuGraph.vector('uint32x2')},
      values: [
        {value: input, access: 'read'},
        {value: output, access: 'write', shape: {like: input}}
      ]
    }
  };
}

test('operations declare results without mutating the authored graph', () => {
  const graph = new GPUGraph();
  graph.addInput('positions', gpuGraph.vector('float32x3'));
  graph.addInput('scale', gpuGraph.scalar('float32'));
  graph.add(new GPUExpressionOperation({output: 'scaled', expression: 'positions * scale'}));
  graph.add(new GPUExpressionOperation({output: 'lengths', expression: 'length(scaled)'}));
  const program = new GPUExpressionProgram(graph);
  expect(graph.vectors.map(value => value.id)).toEqual(['positions']);
  expect(program.vectors.map(value => [value.id, value.format, value.role])).toEqual([
    ['positions', 'float32x3', 'input'],
    ['scaled', 'float32x3', 'value'],
    ['lengths', 'float32', 'value']
  ]);
  expect(program.outputs).toEqual(['lengths']);
  graph.addInput('later', gpuGraph.scalar('uint32'));
  expect(program.scalars.map(value => value.id)).toEqual(['scale']);
});

test('custom output declarations participate in format and shape planning', () => {
  const device = new NullDevice({});
  const input = new GPUVector({
    type: 'data',
    format: 'uint32x2',
    ownsData: true,
    data: [1, 0, 2].map(
      length =>
        new GPUData({
          format: 'uint32x2',
          length,
          ownsBuffer: true,
          buffer: device.createBuffer({byteLength: Math.max(1, length) * 8})
        })
    )
  });
  const graph = new GPUGraph();
  graph.addInput('input', gpuGraph.vector('uint32x2'));
  graph.add([copy('input', 'scratch'), copy('scratch', 'output')]);
  const program = new GPUExpressionProgram(graph);
  const resolved = program.resolveBindings({inputs: {input}});
  const invocation = program.prepare(device, resolved.bindings, resolved.options);
  const scratch = invocation.values.get('scratch') as GPUVector;
  const destroy = vi.spyOn(scratch, 'destroy');
  try {
    const outputs = invocation.finish();
    expect(Object.keys(outputs)).toEqual(['output']);
    expect(outputs.output.format).toBe('uint32x2');
    expect(outputs.output.data.map(chunk => chunk.length)).toEqual([1, 0, 2]);
    expect(destroy).toHaveBeenCalledOnce();
    expect(input.data[0].buffer.destroyed).toBe(false);
    outputs.output.destroy();
  } finally {
    input.destroy();
    device.destroy();
  }
});

test('declaration roles reject writes to inputs and multiple result writers', () => {
  const inputGraph = new GPUGraph();
  inputGraph.addInput('input', gpuGraph.vector('uint32x2'));
  inputGraph.add({
    id: 'write',
    type: 'custom',
    contract: {values: [{value: 'input', access: 'write'}]}
  });
  expect(() => resolveGPUGraphDeclarations(inputGraph)).toThrow('Cannot write graph input input');
  const graph = new GPUGraph();
  graph.addInput('input', gpuGraph.vector('uint32x2'));
  graph.add([copy('input', 'output'), copy('input', 'output')]);
  expect(() => resolveGPUGraphDeclarations(graph)).toThrow('Multiple writers');
});

test('missing producers and self references fail before allocation', () => {
  const graph = new GPUGraph();
  graph.add(new GPUExpressionOperation({output: 'result', expression: 'missing * 2'}));
  expect(() => new GPUExpressionProgram(graph)).toThrow('Undeclared operation value missing');
  const self = new GPUGraph();
  self.add(new GPUExpressionOperation({output: 'result', expression: 'result + 1'}));
  expect(() => new GPUExpressionProgram(self)).toThrow();
});

test('grouped bindings separate initialized inputs, state and selected targets', () => {
  const device = new NullDevice({});
  const vector = new GPUVector({
    type: 'data',
    format: 'float32',
    ownsData: true,
    data: [
      new GPUData({
        format: 'float32',
        length: 1,
        ownsBuffer: true,
        buffer: device.createBuffer({byteLength: 4})
      })
    ]
  });
  const graph = new GPUGraph();
  graph.addInput('factor', gpuGraph.scalar('float32'));
  graph.addState('state', gpuGraph.vector('float32'));
  graph.add(new GPUExpressionOperation({output: 'result', expression: 'state * factor'}));
  const program = new GPUExpressionProgram(graph);
  try {
    expect(() => program.resolveBindings({inputs: {factor: 2}})).toThrow('Missing state binding');
    expect(() => program.resolveBindings({inputs: {factor: 2, state: vector}})).toThrow(
      'Invalid input binding state'
    );
    expect(() =>
      program.resolveBindings({inputs: {factor: 2, result: vector}, state: {state: vector}})
    ).toThrow('Invalid input binding result');
    expect(() =>
      program.resolveBindings({
        inputs: {factor: 2},
        state: {state: vector},
        outputTargets: {state: vector}
      })
    ).toThrow('Invalid graph output target');
    expect(
      program.resolveBindings({inputs: {factor: 2}, state: {state: vector}}).bindings.state
    ).toBe(vector);
    const simple = new GPUSimpleGraph();
    simple.addState('state', gpuGraph.vector('float32'));
    expect(() => simple.compile(device)).toThrow('SimpleGraph state execution is unsupported');
    const legacy = new GPUSimpleGraph(device);
    legacy.addState('state', gpuGraph.vector('float32'));
    expect(() => legacy.compile()).toThrow(
      'Explicit input/state declarations require compile(device)'
    );
  } finally {
    vector.destroy();
    device.destroy();
  }
});

test('output requirements with no computable dimensions fail instead of guessing capacity', () => {
  const device = new NullDevice({});
  const graph = new GPUGraph();
  graph.add({
    id: 'dynamic',
    type: 'custom',
    contract: {
      outputs: {output: gpuGraph.vector('float32')},
      values: [{value: 'output', access: 'write'}]
    }
  });
  try {
    expect(() => new GPUExpressionProgram(graph).prepare(device, {})).toThrow(
      'Cannot infer length'
    );
  } finally {
    device.destroy();
  }
});

test('operation shapes resolve fixed result dimensions for the lower-level compiler', () => {
  const graph = new GPUGraph();
  graph.addInput('input', gpuGraph.vector('uint32x2', {length: 3, chunkLengths: [1, 0, 2]}));
  graph.add(copy('input', 'result'));
  const resolved = resolveGPUGraphDeclarations(graph);
  expect(resolved.vectors.find(value => value.id === 'result')).toMatchObject({
    role: 'value',
    length: 3,
    chunkLengths: [1, 0, 2]
  });
});

test('custom scalar results honor selected caller-owned targets', () => {
  const device = new NullDevice({});
  const target = new GPUVector({
    type: 'data',
    format: 'uint32',
    ownsData: true,
    data: [
      new GPUData({
        format: 'uint32',
        length: 1,
        ownsBuffer: true,
        buffer: device.createBuffer({byteLength: 4})
      })
    ]
  });
  const graph = new GPUGraph();
  graph.add({
    id: 'count',
    type: 'custom',
    contract: {
      outputs: {count: gpuGraph.scalar('uint32')},
      values: [{value: 'count', access: 'write'}]
    }
  });
  try {
    const program = new GPUExpressionProgram(graph);
    const resolved = program.resolveBindings({outputTargets: {count: target}});
    const invocation = program.prepare(device, resolved.bindings, resolved.options);
    expect(invocation.finish().count).toBe(target);
    expect(target.data[0].buffer.destroyed).toBe(false);
  } finally {
    target.destroy();
    device.destroy();
  }
});

test('explicit declarations must agree with operation-defined result types', () => {
  for (const kind of ['format', 'kind'] as const) {
    const graph = new GPUGraph();
    graph.addInput('input', gpuGraph.vector('uint32x2'));
    if (kind === 'format') graph.vector('result', 'float32');
    else graph.scalar('result', 'uint32');
    graph.add(copy('input', 'result'));
    expect(() => new GPUExpressionProgram(graph)).toThrow('Incompatible operation result result');
  }
});

test('operation result dimensions constrain explicit declarations on a snapshot', () => {
  for (const length of [undefined, 2, 3]) {
    const graph = new GPUGraph();
    const output = graph.vector('output', 'float32', length);
    graph.add({
      id: 'fixed',
      type: 'custom',
      contract: {
        outputs: {output: gpuGraph.vector('float32', {length: 3})},
        values: [{value: 'output', access: 'write'}]
      }
    });
    if (length === 2)
      expect(() => resolveGPUGraphDeclarations(graph)).toThrow('Incompatible result length');
    else expect(resolveGPUGraphDeclarations(graph).vectors[0].length).toBe(3);
    expect(output.length).toBe(length);
  }
});

test('mixed explicit and inferred results retain terminal outputs and caller targets', () => {
  const device = new NullDevice({});
  const makeVector = () =>
    new GPUVector({
      type: 'data',
      format: 'float32',
      ownsData: true,
      data: [
        new GPUData({
          format: 'float32',
          length: 1,
          ownsBuffer: true,
          buffer: device.createBuffer({byteLength: 4})
        })
      ]
    });
  const input = makeVector();
  const target = makeVector();
  try {
    for (const explicitRole of [false, true]) {
      const graph = new GPUGraph();
      if (explicitRole) graph.addInput('input', gpuGraph.vector('float32'));
      else graph.vector('input', 'float32');
      graph.vector('result', 'float32');
      graph.add([
        new GPUExpressionOperation({output: 'scratch', expression: 'input * 2'}),
        new GPUExpressionOperation({output: 'result', expression: 'scratch + 1'})
      ]);
      const program = new GPUExpressionProgram(graph);
      expect(program.outputs).toEqual(['result']);
      const resolved = program.resolveBindings({inputs: {input}, outputTargets: {result: target}});
      const invocation = program.prepare(device, resolved.bindings, resolved.options);
      expect(invocation.finish().result).toBe(target);
      expect(target.data[0].buffer.destroyed).toBe(false);
    }
  } finally {
    input.destroy();
    target.destroy();
    device.destroy();
  }
});
