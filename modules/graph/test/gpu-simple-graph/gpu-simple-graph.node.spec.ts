// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it, vi} from 'vitest';
import {GPUDataEvaluator, GPUVectorEvaluator, add, multiply, sqrt} from '@luma.gl/gpgpu';
import {GPUSimpleGraph, GPUSimpleGraphOperation} from '@luma.gl/graph/gpu-simple-graph';
import {
  GPUProgram,
  GPUProgramScalarLiteral,
  GPUProgramScalarOperation,
  GPUProgramVectorMADD,
  GPULoopOperation,
  composite
} from '@luma.gl/graph/gpu-core';
import {NullDevice} from '@luma.gl/test-utils';

describe('GPUSimpleGraph prototype', () => {
  it('compiles lazily, evaluates selected outputs, and exposes dependency order', async () => {
    const device = new NullDevice({});
    const createBuffer = vi.spyOn(device, 'createBuffer');
    const graph = new GPUSimpleGraph(device);
    const source = graph.addEvaluator('source', GPUDataEvaluator.fromConstant(7));
    const result = graph.addEvaluator('result', add(multiply(source, 2), 3));
    const unused = graph.addEvaluator('unused', GPUDataEvaluator.fromConstant(99));
    const unusedEvaluate = vi.spyOn(unused, 'evaluate');
    const compiled = graph.compile({outputs: ['result']});

    expect(createBuffer).not.toHaveBeenCalled();
    const positions = new Map(compiled.nodes.map((node, index) => [node.id, index]));
    for (const node of compiled.nodes) {
      for (const dependency of node.dependencies) {
        expect(positions.get(dependency)!).toBeLessThan(positions.get(node.id)!);
      }
    }
    const outputs = await compiled.run();
    expect(Object.keys(outputs)).toEqual(['result']);
    expect(outputs.result.length).toBe(1);
    expect(Array.from(await result.readValue())).toEqual([17]);
    expect(unusedEvaluate).not.toHaveBeenCalled();
    result.destroy();
    source.destroy();
    unused.destroy();
    device.destroy();
  });

  it('captures a reusable snapshot and borrows evaluator ownership', async () => {
    const device = new NullDevice({});
    const graph = new GPUSimpleGraph(device);
    const source = graph.addEvaluator('source', GPUDataEvaluator.fromConstant(4));
    const result = graph.addEvaluator('result', multiply(source, 2));
    const destroy = vi.spyOn(result, 'destroy');
    const compiled = graph.compile();
    expect(() => graph.compile()).toThrow();
    expect(() => graph.addEvaluator('replacement', source)).toThrow();

    const first = await compiled.run();
    const second = await compiled.run();
    expect(Object.keys(first)).toEqual(['result']);
    expect(second.result).toBe(first.result);
    expect(destroy).not.toHaveBeenCalled();
    result.destroy();
    source.destroy();
    device.destroy();
  });

  it('preserves chunk boundaries through vector evaluators', async () => {
    const device = new NullDevice({});
    const chunks = [GPUDataEvaluator.fromConstant(3), GPUDataEvaluator.fromConstant(5)];
    const source = GPUVectorEvaluator.fromGPUDataEvaluators(chunks);
    const mapped = source.mapGPUData(chunk => add(chunk, 10));
    const graph = new GPUSimpleGraph(device);
    graph.addEvaluator('mapped', mapped);
    const compiled = graph.compile();
    const outputs = await compiled.run();

    expect(outputs.mapped.length).toBe(2);
    expect(outputs.mapped.data.map(chunk => chunk.length)).toEqual([1, 1]);
    expect(compiled.nodes.at(-1)?.operation).toBe('collect-chunks');
    expect(await mapped.gpuDataEvaluators[0].readValue()).toEqual(new Float32Array([13]));
    expect(await mapped.gpuDataEvaluators[1].readValue()).toEqual(new Float32Array([15]));
    mapped.destroy();
    source.destroy();
    device.destroy();
  });

  it('keeps explicitly named shared outputs and aliases on the same buffer', async () => {
    const device = new NullDevice({});
    const graph = new GPUSimpleGraph(device);
    const source = GPUDataEvaluator.fromConstant(2);
    const shared = graph.addEvaluator('shared', multiply(source, 3));
    const alias = graph.addEvaluator(
      'alias',
      new GPUDataEvaluator({source: shared, type: shared.type, size: shared.size})
    );
    const outputs = await graph.compile({outputs: ['shared', 'alias']}).run();

    expect(outputs.shared.data[0].buffer).toBe(outputs.alias.data[0].buffer);
    alias.destroy();
    shared.destroy();
    source.destroy();
    device.destroy();
  });

  it('propagates backend errors and permits an explicit retry', async () => {
    const device = new NullDevice({});
    const graph = new GPUSimpleGraph(device);
    const output = graph.addEvaluator('output', GPUDataEvaluator.fromConstant(2));
    vi.spyOn(output, 'evaluate').mockRejectedValueOnce(new Error('unsupported backend operation'));
    const compiled = graph.compile();

    await expect(compiled.run()).rejects.toThrow('unsupported backend operation');
    expect((await compiled.run()).output.length).toBe(1);
    output.destroy();
    device.destroy();
  });

  it('rejects duplicate names, missing outputs, and dependency cycles', () => {
    const device = new NullDevice({});
    const graph = new GPUSimpleGraph(device);
    const source = graph.addEvaluator('source', GPUDataEvaluator.fromConstant(1));
    expect(() => graph.addEvaluator('source', source)).toThrow();
    expect(() => new GPUSimpleGraph(device).compile({outputs: ['missing']})).toThrow();
    const cyclic = graph.addEvaluator('cyclic', add(source, 1));
    const operation = cyclic.source;
    if (!operation || operation instanceof GPUDataEvaluator) throw new Error('Expected operation');
    operation.dependencies.push(cyclic);
    expect(() => graph.compile()).toThrow();
    source.destroy();
    cyclic.destroy();
    device.destroy();
  });

  it('supports an empty graph without allocating resources', async () => {
    const device = new NullDevice({});
    const createBuffer = vi.spyOn(device, 'createBuffer');
    expect(await new GPUSimpleGraph(device).compile().run()).toEqual({});
    expect(createBuffer).not.toHaveBeenCalled();
    device.destroy();
  });
});

describe('GPUSimpleGraph semantic composition', () => {
  it('shares semantic composites and inspection with GPUProgram', async () => {
    const device = new NullDevice({});
    const source = GPUDataEvaluator.fromConstant(3);
    const output = multiply(source, 4);
    const inputOperation = new GPUSimpleGraphOperation({id: 'input', evaluator: source});
    const outputOperation = new GPUSimpleGraphOperation({id: 'output', evaluator: output});
    const group = composite([inputOperation, composite([outputOperation], {id: 'inner'})], {
      id: 'outer'
    });
    const program = new GPUProgram().add([group]);
    const graph = new GPUSimpleGraph(device);
    expect(graph.add([[group]])).toBe(graph);
    expect(graph.operationTree).toEqual(program.operationTree);
    expect(graph.operationTree[0].children?.[1].children?.[0]).toMatchObject({
      id: 'output',
      type: 'simple-graph-evaluator',
      metadata: {outputs: [{name: 'output', kind: 'vector', shape: [1]}]}
    });
    const compiled = graph.compile({outputs: ['output']});
    expect(compiled.operationTree).toEqual(program.operationTree);
    expect(Object.keys(await compiled.run())).toEqual(['output']);
    expect(Array.from(await output.readValue())).toEqual([12]);
    expect(graph.capabilities).toEqual({
      callerControlledSubmission: false,
      dynamicBindings: false,
      transientAllocation: false
    });
    output.destroy();
    source.destroy();
    device.destroy();
  });

  it('validates a whole group before registering any of it', async () => {
    const device = new NullDevice({});
    const source = GPUDataEvaluator.fromConstant(3);
    const operation = new GPUSimpleGraphOperation({id: 'value', evaluator: source});
    const graph = new GPUSimpleGraph(device);
    expect(() => graph.add([operation, operation])).toThrow();
    expect(() => graph.add(composite([operation, {id: 'unsupported', type: 'custom'}]))).toThrow();
    expect(graph.operationTree).toEqual([]);
    graph.add(operation);
    expect((await graph.compile().run()).value.length).toBe(1);
    source.destroy();
    device.destroy();
  });

  it('freezes compilation after a validation failure', () => {
    const device = new NullDevice({});
    const graph = new GPUSimpleGraph(device);
    expect(() => graph.compile({outputs: ['missing']})).toThrow();
    expect(() => graph.compile()).toThrow();
    expect(() => graph.add([])).toThrow();
    device.destroy();
  });
});

describe('SimpleGraph semantic subset', () => {
  it('executes existing scalar literals and owns only adapter-created evaluators', async () => {
    const device = new NullDevice({});
    const program = new GPUProgram();
    const scale = program.scalar('scale', 'float32');
    program.add(new GPUProgramScalarLiteral({output: scale, value: 2}));
    const borrowed = GPUDataEvaluator.fromConstant(5);
    const destroyBorrowed = vi.spyOn(borrowed, 'destroy');
    const graph = new GPUSimpleGraph(device).add(program.operations);
    graph.addEvaluator('borrowed', borrowed);
    const compiled = graph.compile({outputs: ['scale', 'borrowed']});
    const outputs = await compiled.run();
    expect(outputs.scale.length).toBe(1);
    expect((await compiled.run()).scale).toBe(outputs.scale);
    compiled.destroy();
    compiled.destroy();
    expect(destroyBorrowed).not.toHaveBeenCalled();
    await expect(compiled.run()).rejects.toThrow();
    borrowed.destroy();
    device.destroy();
  });

  it('rejects control-flow composites atomically', () => {
    const device = new NullDevice({});
    const program = new GPUProgram();
    const literal = new GPUProgramScalarLiteral({
      output: program.scalar('scale', 'float32'),
      value: 2
    });
    const graph = new GPUSimpleGraph(device);
    expect(() =>
      graph.add([literal, new GPULoopOperation({body: [], maximumIterations: 2})])
    ).toThrow();
    expect(graph.operationTree).toEqual([]);
    graph.add(literal).compile().destroy();
    device.destroy();
  });

  it('rejects missing bindings, unsupported formats, and repeated writes', () => {
    const device = new NullDevice({});
    const program = new GPUProgram();
    const scale = program.scalar('scale', 'float32');
    const input = program.vector('input', 'float32', 3, {external: true});
    const output = program.vector('output', 'float32', 3);
    const literal = new GPUProgramScalarLiteral({output: scale, value: 2});
    const operation = new GPUProgramVectorMADD({input, addend: input, output, scale});
    expect(() => new GPUSimpleGraph(device).add([literal, operation]).compile()).toThrow();
    expect(() =>
      new GPUSimpleGraph(device)
        .add([literal, new GPUProgramScalarLiteral({id: 'rewrite', output: scale, value: 3})])
        .compile()
    ).toThrow();
    expect(() =>
      new GPUSimpleGraph(device)
        .add(
          new GPUProgramScalarLiteral({
            output: program.scalar('integer', 'uint32'),
            value: 2
          })
        )
        .compile()
    ).toThrow();
    device.destroy();
  });
});

describe('SimpleGraph inspection metadata', () => {
  it('derives canonical formats before evaluation without allocating buffers', () => {
    const device = new NullDevice({});
    const createBuffer = vi.spyOn(device, 'createBuffer');
    const values = [
      GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3]), {size: 3}),
      GPUDataEvaluator.fromConstant(2),
      GPUDataEvaluator.fromArray(new Uint8Array([0, 127, 255, 255]), {size: 4, normalized: true})
    ];
    const vector = GPUVectorEvaluator.fromGPUDataEvaluators([values[0]]);
    const graph = new GPUSimpleGraph(device);
    for (const [index, evaluator] of [...values, vector].entries()) {
      graph.addEvaluator(`value-${index}`, evaluator);
    }
    const compiled = graph.compile({outputs: ['value-0', 'value-1', 'value-2', 'value-3']});
    expect(graph.operationTree.map(operation => operation.metadata?.outputs?.[0].format)).toEqual([
      'float32x3',
      'float32',
      'unorm8x4',
      'float32x3'
    ]);
    expect(compiled.nodes.map(node => node.format)).toEqual([
      'float32x3',
      'float32',
      'unorm8x4',
      'float32x3'
    ]);
    expect(createBuffer).not.toHaveBeenCalled();
    compiled.destroy();
    vector.destroy();
    values[1].destroy();
    values[2].destroy();
    device.destroy();
  });

  it('maps selected aliases to their shared dependency node', async () => {
    const device = new NullDevice({});
    const evaluator = GPUDataEvaluator.fromConstant(2);
    const graph = new GPUSimpleGraph(device);
    graph.addEvaluator('first', evaluator);
    graph.addEvaluator('second', evaluator);
    const compiled = graph.compile({outputs: ['second']});
    expect(compiled.nodes.map(node => node.id)).toEqual(['first']);
    expect(compiled.outputNodes).toEqual({second: 'first'});
    expect(Object.isFrozen(compiled.outputNodes)).toBe(true);
    expect(Object.keys(await compiled.run())).toEqual(['second']);
    compiled.destroy();
    evaluator.destroy();
    device.destroy();
  });
});

it('keeps WebGL byte-triplet formats in pre-execution inspection', () => {
  const device = new NullDevice({});
  const evaluators = [
    GPUDataEvaluator.fromArray(new Uint8Array([1, 2, 3]), {size: 3}),
    GPUDataEvaluator.fromArray(new Int8Array([-1, 2, 3]), {size: 3})
  ];
  const graph = new GPUSimpleGraph(device);
  evaluators.forEach((evaluator, index) => graph.addEvaluator(`triplet-${index}`, evaluator));
  const compiled = graph.compile({outputs: ['triplet-0', 'triplet-1']});
  expect(compiled.operationTree.map(operation => operation.metadata?.outputs?.[0].format)).toEqual([
    'uint8x3-webgl',
    'sint8x3-webgl'
  ]);
  expect(compiled.nodes.map(node => node.format)).toEqual(['uint8x3-webgl', 'sint8x3-webgl']);
  compiled.destroy();
  evaluators.forEach(evaluator => evaluator.destroy());
  device.destroy();
});

it('lowers chained existing scalar arithmetic and rejects unsupported scalar operations', async () => {
  const device = new NullDevice({});
  const program = new GPUProgram();
  const first = program.scalar('first', 'float32');
  const second = program.scalar('second', 'float32');
  program.add([
    new GPUProgramScalarLiteral({output: first, value: 9}),
    new GPUProgramScalarLiteral({output: second, value: 3})
  ]);
  let previous = first;
  const expected = [9, 3, 6, 3, 9, 3];
  for (const operation of ['copy', 'sqrt', 'add', 'subtract', 'multiply', 'divide'] as const) {
    const output = program.scalar(operation, 'float32');
    program.add(
      new GPUProgramScalarOperation({
        operation,
        left: previous,
        right: operation === 'copy' || operation === 'sqrt' ? undefined : second,
        output
      })
    );
    previous = output;
  }
  const names = ['copy', 'sqrt', 'add', 'subtract', 'multiply', 'divide'];
  const compiled = new GPUSimpleGraph(device).add(program.operations).compile({outputs: names});
  try {
    const results = await compiled.run();
    for (const [index, name] of names.entries()) {
      const reader = GPUDataEvaluator.fromGPUData(results[name].data[0]);
      expect(Array.from(await reader.readValue())).toEqual([expected[index]]);
      reader.destroy();
    }
  } finally {
    compiled.destroy();
  }
  program.add(
    new GPUProgramScalarOperation({
      operation: 'min',
      left: first,
      right: second,
      output: program.scalar('minimum', 'float32')
    })
  );
  expect(() => new GPUSimpleGraph(device).add(program.operations).compile()).toThrow();
  device.destroy();
});

it('preserves float32 rounding between semantic scalar operations', async () => {
  const device = new NullDevice({});
  const program = new GPUProgram();
  const large = program.scalar('large', 'float32');
  const one = program.scalar('one', 'float32');
  const sum = program.scalar('sum', 'float32');
  const difference = program.scalar('difference', 'float32');
  program.add([
    new GPUProgramScalarLiteral({output: large, value: 16777216}),
    new GPUProgramScalarLiteral({output: one, value: 1}),
    new GPUProgramScalarOperation({operation: 'add', left: large, right: one, output: sum}),
    new GPUProgramScalarOperation({
      operation: 'subtract',
      left: sum,
      right: large,
      output: difference
    })
  ]);
  for (const outputs of [['difference'], ['sum', 'difference']]) {
    const compiled = new GPUSimpleGraph(device).add(program.operations).compile({outputs});
    try {
      const results = await compiled.run();
      const reader = GPUDataEvaluator.fromGPUData(results.difference.data[0]);
      expect(Array.from(await reader.readValue())).toEqual([0]);
      reader.destroy();
    } finally {
      compiled.destroy();
    }
  }
  device.destroy();
});

it('materializes shared scalar dependencies once before collecting vector chunks', async () => {
  const device = new NullDevice({});
  const input = GPUDataEvaluator.fromConstant(4);
  const scale = sqrt(input);
  const alias = new GPUDataEvaluator({
    type: 'float32',
    size: 1,
    length: 1,
    isConstant: true,
    source: scale
  });
  const chunks = [add(alias, 1), add(alias, 2)];
  const vector = GPUVectorEvaluator.fromGPUDataEvaluators(chunks);
  const graph = new GPUSimpleGraph(device);
  graph.addEvaluator('result', vector);
  const compiled = graph.compile();
  const originalEvaluate = scale.evaluate.bind(scale);
  const evaluateScale = vi.spyOn(scale, 'evaluate');
  let pending = false;
  evaluateScale.mockImplementation(async (...args) => {
    expect(pending).toBe(false);
    pending = true;
    try {
      return await originalEvaluate(...args);
    } finally {
      pending = false;
    }
  });
  try {
    const result = await compiled.run();
    expect(result.result.data).toHaveLength(2);
    expect(Array.from(await chunks[0].readValue())).toEqual([3]);
    expect(Array.from(await chunks[1].readValue())).toEqual([4]);
    expect((await compiled.run()).result).toBe(result.result);
  } finally {
    evaluateScale.mockRestore();
    compiled.destroy();
    vector.destroy();
    alias.destroy();
    scale.destroy();
    input.destroy();
    device.destroy();
  }
});

it('binds chunked output targets without retargeting borrowed evaluators', async () => {
  const device = new NullDevice({});
  const chunks = [
    GPUDataEvaluator.fromArray(new Float32Array([1, 2]), {}),
    GPUDataEvaluator.fromArray(new Float32Array([3]), {})
  ];
  const vector = GPUVectorEvaluator.fromGPUDataEvaluators(chunks);
  const targets = [device.createBuffer({byteLength: 16}), device.createBuffer({byteLength: 8})];
  const graph = new GPUSimpleGraph(device);
  graph.addEvaluator('value', vector);
  const compiled = graph.compile({
    outputTargets: {value: targets.map(buffer => ({buffer, byteOffset: 4}))}
  });
  try {
    expect(vector.evaluated).toBe(false);
    expect(new Set(compiled.nodes.map(node => node.id)).size).toBe(compiled.nodes.length);
    const result = await compiled.run();
    expect(result.value.data.map(chunk => chunk.length)).toEqual([2, 1]);
    expect(result.value.data.map(chunk => chunk.buffer)).toEqual(targets);
    expect(vector.gpuVector.data[0].buffer).not.toBe(targets[0]);
    for (const [index, expected] of [
      [0, [1, 2]],
      [1, [3]]
    ] as const) {
      const reader = GPUDataEvaluator.fromGPUData(result.value.data[index]);
      expect(Array.from(await reader.readValue())).toEqual(expected);
      reader.destroy();
    }
  } finally {
    compiled.destroy();
    expect(vector.evaluated).toBe(true);
    expect(targets.every(buffer => !buffer.destroyed)).toBe(true);
    vector.destroy();
    for (const target of targets) target.destroy();
    device.destroy();
  }
});
