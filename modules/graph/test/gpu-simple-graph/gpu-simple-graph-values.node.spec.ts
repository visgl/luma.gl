// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {GPUDataEvaluator, GPUVectorEvaluator} from '@luma.gl/gpgpu';
import {NullDevice} from '@luma.gl/test-utils/device';
import {
  GPUSimpleGraph,
  GPUSimpleGraphValue,
  simpleGraphOperations
} from '@luma.gl/graph/gpu-simple-graph';
import {
  createExpressionEvaluator,
  evaluateExpression
} from '../../../../examples/v10/gpgpu/src/expression';

it('authors shared expressions without evaluators and isolates compilation ownership', async () => {
  const device = new NullDevice({});
  const allocate = vi.spyOn(device, 'createBuffer');
  const source = GPUSimpleGraphValue.constant(4);
  const middle = simpleGraphOperations.multiply(source, 2);
  const graph = new GPUSimpleGraph(device);
  graph.addValue('middle', middle);
  graph.addValue('output', simpleGraphOperations.add(middle, 3));
  const compiled = graph.compile({outputs: ['middle', 'output']});
  const secondGraph = new GPUSimpleGraph(device);
  secondGraph.addValue('output', middle);
  const second = secondGraph.compile();
  expect(allocate).not.toHaveBeenCalled();
  expect(compiled.outputs.middle).not.toBe(second.outputs.output);
  await compiled.run();
  expect(compiled.outputs.output).toBeInstanceOf(GPUDataEvaluator);
  if (compiled.outputs.output instanceof GPUDataEvaluator)
    expect(Array.from(await compiled.outputs.output.readValue())).toEqual([11]);
  const middleNodes = compiled.nodes.filter(node => node.id === compiled.outputNodes.middle);
  expect(middleNodes).toHaveLength(1);
  compiled.destroy();
  await second.run();
  if (second.outputs.output instanceof GPUDataEvaluator)
    expect(Array.from(await second.outputs.output.readValue())).toEqual([8]);
  second.destroy();
  device.destroy();
});

it('keeps chunk boundaries explicit and supports the shared expression syntax', async () => {
  const parse = createExpressionEvaluator(
    simpleGraphOperations,
    GPUSimpleGraphValue.constant,
    (value): value is GPUSimpleGraphValue => value instanceof GPUSimpleGraphValue
  );
  const device = new NullDevice({});
  const values = [2, 5].map(value =>
    parse('sqrt(input * input) + 1', {input: GPUSimpleGraphValue.constant(value)})
  );
  const graph = new GPUSimpleGraph(device);
  graph.addValue('output', values);
  const compiled = graph.compile();
  const result = await compiled.run();
  expect(result.output.data.map(chunk => chunk.length)).toEqual([1, 1]);
  expect(compiled.outputs.output).toBeInstanceOf(GPUVectorEvaluator);
  if (compiled.outputs.output instanceof GPUVectorEvaluator) {
    const values = await Promise.all(
      compiled.outputs.output.gpuDataEvaluators.map(chunk => chunk.readValue())
    );
    expect(values.flatMap(value => Array.from(value))).toEqual([3, 6]);
  }
  // Legacy parser remains available with the same literal behavior.
  const legacy = evaluateExpression('sqrt(9) + 1', {});
  await legacy.evaluate(device);
  expect(Array.from(await legacy.readValue())).toEqual([4]);
  legacy.destroy();
  compiled.destroy();
  device.destroy();
});

it('destroys owned operation dependencies when compilation fails', () => {
  const destroy = vi.spyOn(GPUDataEvaluator.prototype, 'destroy');
  const device = new NullDevice({});
  const graph = new GPUSimpleGraph(device);
  graph.addValue('value', simpleGraphOperations.add(GPUSimpleGraphValue.constant(2), 1));
  expect(() => graph.compile({outputs: ['missing']})).toThrow();
  expect(destroy).toHaveBeenCalled();
  destroy.mockRestore();
  device.destroy();
});
