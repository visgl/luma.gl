// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it, vi} from 'vitest';
import {GPUDataEvaluator, GPUVectorEvaluator, add, multiply} from '@luma.gl/gpgpu';
import {GPUSimpleGraph, GPUSimpleGraphOperation} from '@luma.gl/gpu-graph/gpu-simple-graph';
import {GPUProgram, composite} from '@luma.gl/gpu-graph/gpu-core';
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
