// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {
  GPUGraph,
  GPUExpressionOperation,
  GPUGraphCompiler,
  GPUOperationLoweringRegistry,
  type GPUOperation,
  type GPUOperationContract
} from '@luma.gl/graph';
import {GPUGraphDotProduct, GPUGraphVectorMADD} from '@luma.gl/graph/gpu-core';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUExpressionProgram} from '../../src/gpu-core/gpu-expression-plan';
import {validateGPUOperationContract} from '../../src/gpu-core/gpu-operation-contract';

function makeOperation(contract: GPUOperationContract): GPUOperation {
  return {id: 'custom', type: 'custom', contract};
}

test('contracts resolve named and typed references and reject invalid shapes', () => {
  const graph = new GPUGraph();
  const input = graph.vector('input', 'uint32x2');
  const output = graph.vector('output', 'uint32x2');
  graph.scalar('scalar', 'float32');
  expect(() =>
    validateGPUOperationContract(graph, {
      values: [
        {value: input, access: 'read'},
        {value: output, access: 'write', shape: {like: 'input'}}
      ]
    })
  ).not.toThrow();
  for (const contract of [
    {values: [{value: 'missing', access: 'read'}]},
    {values: [{value: 'scalar', access: 'write', shape: {length: 1}}]},
    {values: [{value: input, access: 'read', shape: {length: 1}}]},
    {values: [{value: output, access: 'write', shape: {like: 'scalar'}}]},
    {values: [{value: output, access: 'write', shape: {like: input}}]},
    {values: [{value: output, access: 'write', shape: {length: -1}}]},
    {values: [{value: output, access: 'write', shape: {length: 3, chunkLengths: [1, 1]}}]}
  ] satisfies GPUOperationContract[]) {
    expect(() => validateGPUOperationContract(graph, contract)).toThrow();
  }
  const other = new GPUGraph().vector('input', 'float32');
  expect(() =>
    validateGPUOperationContract(graph, {values: [{value: other, access: 'read'}]})
  ).toThrow('Incompatible operation reference');
});

test('custom producers participate in ordering and scalar output selection', () => {
  const graph = new GPUGraph();
  graph.scalar('computed', 'float32');
  graph.scalar('output', 'float32');
  const producer = makeOperation({values: [{value: 'computed', access: 'write'}]});
  const consumer = new GPUExpressionOperation({output: 'output', expression: 'computed * 2'});
  graph.add([producer, consumer]);
  const program = new GPUExpressionProgram(graph, {outputs: ['computed', 'output']});
  expect(program.expressions[0].gpuScalarInputs).toEqual(['computed']);
  const reversed = new GPUGraph();
  reversed.scalar('computed', 'float32');
  reversed.scalar('output', 'float32');
  reversed.add([consumer, producer]);
  expect(() => new GPUExpressionProgram(reversed)).toThrow('before it is produced');
});

test('contract dependencies reject a forward read by a custom operation', () => {
  const graph = new GPUGraph();
  graph.vector('input', 'float32');
  graph.vector('output', 'float32');
  graph.add([
    makeOperation({values: [{value: 'output', access: 'read'}]}),
    new GPUExpressionOperation({output: 'output', expression: 'input * 2'})
  ]);
  expect(() => new GPUExpressionProgram(graph)).toThrow(
    'custom: Reads output before it is produced'
  );
});

test('generic vector allocation honors typed formats, fixed shapes and empty chunks', () => {
  const device = new NullDevice({});
  const graph = new GPUGraph();
  graph.vector('output', 'uint32x2');
  graph.add(
    makeOperation({
      values: [{value: 'output', access: 'write', shape: {length: 3, chunkLengths: [1, 0, 2]}}]
    })
  );
  const program = new GPUExpressionProgram(graph, {outputs: ['output']});
  const invocation = program.prepare(device, {});
  try {
    const result = invocation.finish();
    try {
      expect(result.output.format).toBe('uint32x2');
      expect(result.output.data.map(chunk => chunk.length)).toEqual([1, 0, 2]);
      expect(result.output.data.map(chunk => chunk.rowByteLength)).toEqual([8, 8, 8]);
    } finally {
      result.output.destroy();
    }
  } finally {
    invocation.destroy();
    device.destroy();
  }
});

test('contracts enforce declared length and chunk constraints', () => {
  const device = new NullDevice({});
  try {
    for (const props of [{length: 2}, {length: 3, chunkLengths: [3]}]) {
      const graph = new GPUGraph();
      graph.vector('output', 'float32', props);
      graph.add(
        makeOperation({
          values: [{value: 'output', access: 'write', shape: {length: 3, chunkLengths: [1, 2]}}]
        })
      );
      expect(() => new GPUExpressionProgram(graph).prepare(device, {})).toThrow(
        'constraint failed'
      );
    }
  } finally {
    device.destroy();
  }
});

test('read-write contracts require initialized storage', () => {
  const device = new NullDevice({});
  const graph = new GPUGraph();
  graph.vector('state', 'uint32', 1);
  graph.add(makeOperation({values: [{value: 'state', access: 'read-write'}]}));
  try {
    expect(() => new GPUExpressionProgram(graph).prepare(device, {})).toThrow('read-write binding');
  } finally {
    device.destroy();
  }
});

test('existing algorithms describe their dependencies and output topology', () => {
  const graph = new GPUGraph();
  const input = graph.vector('input', 'float32');
  const output = graph.vector('output', 'float32');
  const scalar = graph.scalar('scalar', 'float32');
  const dot = new GPUGraphDotProduct({left: input, right: input, output: scalar});
  expect(dot.contract.values.map(use => use.access)).toEqual(['read', 'read', 'write']);
  const madd = new GPUGraphVectorMADD({input, addend: input, scale: scalar, output});
  expect(madd.contract.values.at(-1)?.shape).toEqual({like: input});
});

test('extension registries augment core lowerings without mutable sharing or silent replacement', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  try {
    const registry = new GPUOperationLoweringRegistry().register('custom', () => {});
    const compiler = new GPUGraphCompiler(device, registry);
    expect(compiler.lowerings.get('custom')).toBeDefined();
    expect(compiler.lowerings.get('dot-product')).toBeDefined();
    expect(compiler.lowerings.get('scalar-literal')).toBeDefined();
    registry.register('later', () => {});
    expect(compiler.lowerings.get('later')).toBeUndefined();
    expect(
      () =>
        new GPUGraphCompiler(
          device,
          new GPUOperationLoweringRegistry().register('dot-product', () => {})
        )
    ).toThrow('already registered');
    const overlap = new GPUOperationLoweringRegistry()
      .register('new', () => {})
      .register('custom', () => {});
    expect(() => compiler.lowerings.registerAll(overlap)).toThrow();
    expect(compiler.lowerings.get('new')).toBeUndefined();
  } finally {
    device.destroy();
  }
});

test('feature requirements are checked by reusable and legacy compilation paths', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const features = vi.spyOn(device.features, 'has').mockReturnValue(false);
  const graph = new GPUGraph();
  graph.add(makeOperation({values: [], requiredFeatures: ['timestamp-query']}));
  try {
    expect(() => new GPUExpressionProgram(graph).prepare(device, {})).toThrow(
      'requires timestamp-query'
    );
    const compiler = new GPUGraphCompiler(
      device,
      new GPUOperationLoweringRegistry().register('custom', () => {})
    );
    expect(() => compiler.compile(graph)).toThrow('custom requires timestamp-query');
  } finally {
    features.mockRestore();
    device.destroy();
  }
});

test('read-write outputs preserve initialized storage and reject replacement targets', () => {
  const device = new NullDevice({});
  const makeVector = () =>
    new GPUVector({
      type: 'data',
      format: 'uint32',
      ownsData: true,
      data: [
        new GPUData({
          format: 'uint32',
          length: 1,
          ownsBuffer: true,
          buffer: device.createBuffer({data: new Uint32Array([7])})
        })
      ]
    });
  const input = makeVector();
  const replacement = makeVector();
  const graph = new GPUGraph();
  graph.vector('state', 'uint32', 1);
  graph.add(makeOperation({values: [{value: 'state', access: 'read-write'}]}));
  const program = new GPUExpressionProgram(graph, {outputs: ['state']});
  try {
    expect(() =>
      program.prepare(device, {state: input}, {outputTargets: {state: replacement}})
    ).toThrow('bound storage');
    const invocation = program.prepare(device, {state: input});
    expect(invocation.finish().state).toBe(input);
    expect(input.data[0].buffer.destroyed).toBe(false);
  } finally {
    input.destroy();
    replacement.destroy();
    device.destroy();
  }
});
