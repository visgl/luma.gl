// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {
  GPUGraph,
  GPUExpressionOperation,
  GPUGraphCompiler,
  type GPUOperationLowering,
  type GPUOperation,
  type GPUOperationContract
} from '@luma.gl/graph';
import {
  GPUGraphDotProduct,
  GPUGraphVectorMADD,
  GPULoopOperation,
  GPUGraphScalarLiteral,
  GPUGraphScalarOperation
} from '@luma.gl/graph/gpu-core';
import {GPUData, GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUExpressionProgram} from '../../src/gpu-core/gpu-expression-plan';
import {validateGPUOperationContract} from '../../src/gpu-core/gpu-operation-contract';

function makeOperation(contract: GPUOperationContract): GPUOperation {
  return {id: 'custom', type: 'custom', contract};
}

test('loop summaries preserve initial scalar reads and internal initialization', () => {
  const device = new NullDevice({});
  try {
    for (const initializeInside of [false, true]) {
      const graph = new GPUGraph();
      const state = graph.scalar('state', 'float32');
      const output = graph.scalar('output', 'float32');
      if (!initializeInside)
        graph.add(new GPUGraphScalarOperation({operation: 'copy', left: state, output}));
      graph.add(
        new GPULoopOperation({
          maximumIterations: 2,
          body: [
            ...(initializeInside ? [new GPUGraphScalarLiteral({output: state, value: 7})] : []),
            new GPUGraphScalarOperation({
              operation: 'add',
              left: state,
              right: state,
              output: state
            })
          ]
        })
      );
      const program = new GPUExpressionProgram(graph, {outputs: ['state']});
      const invocation = program.prepare(device, initializeInside ? {} : {state: 7});
      invocation.destroy();
      if (!initializeInside) expect(() => program.prepare(device, {})).toThrow('binding state');
    }
  } finally {
    device.destroy();
  }
});

test('lowering snapshots retain prototype methods and their receiver', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  const lower = vi.fn();
  class CustomLowering implements GPUOperationLowering {
    readonly type = 'custom';
    readonly value = 7;
    lower() {
      lower(this.value);
    }
  }
  try {
    const graph = new GPUGraph();
    graph.add(makeOperation({values: []}));
    new GPUGraphCompiler(device, [new CustomLowering()]).compile(graph);
    expect(lower).toHaveBeenCalledOnce();
    expect(lower).toHaveBeenCalledWith(7);
  } finally {
    device.destroy();
  }
});

test('expressions reject self references after a contract writer', () => {
  const graph = new GPUGraph();
  graph.vector('output', 'float32');
  graph.add([
    makeOperation({values: [{value: 'output', access: 'write', shape: {length: 1}}]}),
    new GPUExpressionOperation({output: 'output', expression: 'output + 1'})
  ]);
  expect(() => new GPUExpressionProgram(graph)).toThrow('before it is produced');
});

test('fixed-count loop scalar writes are available to subsequent consumers', () => {
  const device = new NullDevice({});
  const graph = new GPUGraph();
  const intermediate = graph.scalar('intermediate', 'float32');
  const output = graph.scalar('output', 'float32');
  graph.add([
    new GPULoopOperation({
      maximumIterations: 1,
      body: new GPULoopOperation({
        maximumIterations: 2,
        body: new GPUGraphScalarLiteral({output: intermediate, value: 7})
      })
    }),
    new GPUGraphScalarOperation({operation: 'copy', left: intermediate, output})
  ]);
  try {
    const program = new GPUExpressionProgram(graph, {outputs: ['intermediate', 'output']});
    const invocation = program.prepare(device, {});
    invocation.destroy();
  } finally {
    device.destroy();
  }
});

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
  const device = new NullDevice({});
  try {
    const reversedProgram = new GPUExpressionProgram(reversed);
    expect(() => reversedProgram.prepare(device, {})).toThrow('Missing execution binding computed');
    const invocation = reversedProgram.prepare(device, {computed: 3});
    invocation.destroy();
  } finally {
    device.destroy();
  }
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

test('lowering inputs augment core implementations and are snapshotted without mutation', () => {
  const device = new NullDevice({});
  const custom = {type: 'custom', lower: () => {}};
  const lowerings: GPUOperationLowering[] = [custom];
  try {
    const compiler = new GPUGraphCompiler(device, lowerings);
    expect(compiler.lowerings.map(lowering => lowering.type)).toContain('custom');
    expect(compiler.lowerings.map(lowering => lowering.type)).toContain('dot-product');
    lowerings.push({type: 'later', lower: () => {}});
    custom.type = 'changed';
    expect(compiler.lowerings.map(lowering => lowering.type)).toContain('custom');
    expect(compiler.lowerings.map(lowering => lowering.type)).not.toContain('later');
    expect(Object.isFrozen(compiler.lowerings)).toBe(true);
    expect(compiler.lowerings.every(Object.isFrozen)).toBe(true);
    expect(() => new GPUGraphCompiler(device, [{type: 'dot-product', lower: () => {}}])).toThrow(
      'Duplicate'
    );
    expect(() => new GPUGraphCompiler(device, [custom, custom])).toThrow('Duplicate');
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
    const compiler = new GPUGraphCompiler(device, [{type: 'custom', lower: () => {}}]);
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
