// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it, vi} from 'vitest';
import {GPUDataEvaluator, GPUVectorEvaluator, add, multiply} from '@luma.gl/gpgpu';
import {GPUSimpleGraph} from '@luma.gl/gpu-graph/gpu-simple-graph';
import {NullDevice} from '@luma.gl/test-utils';

describe('GPUSimpleGraph prototype', () => {
  it('compiles lazily, evaluates selected outputs, and exposes dependency order', async () => {
    const device = new NullDevice({});
    const createBuffer = vi.spyOn(device, 'createBuffer');
    const graph = new GPUSimpleGraph(device);
    const source = graph.add('source', GPUDataEvaluator.fromConstant(7));
    const result = graph.add('result', add(multiply(source, 2), 3));
    const unused = graph.add('unused', GPUDataEvaluator.fromConstant(99));
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
    const source = graph.add('source', GPUDataEvaluator.fromConstant(4));
    const result = graph.add('result', multiply(source, 2));
    const destroy = vi.spyOn(result, 'destroy');
    const compiled = graph.compile();
    graph.clear();
    graph.add('replacement', GPUDataEvaluator.fromConstant(100));

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
    graph.add('mapped', mapped);
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
    const shared = graph.add('shared', multiply(source, 3));
    const alias = graph.add(
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
    const output = graph.add('output', GPUDataEvaluator.fromConstant(2));
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
    const source = graph.add('source', GPUDataEvaluator.fromConstant(1));
    expect(() => graph.add('source', source)).toThrow();
    expect(() => graph.compile({outputs: ['missing']})).toThrow();
    const cyclic = graph.add('cyclic', add(source, 1));
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
