// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@math.gl/expressions';
import {GPUGraph, GPUExpressionOperation} from '@luma.gl/graph';
import {GPUExpressionProgram} from '../../src/gpu-core/gpu-expression-plan';
import {parseGPUExpression} from '../../src/gpu-core/gpu-expression-operation';

function makeProgram(expression: string | ReturnType<typeof parse> = 'positions * scale + offset') {
  const graph = new GPUGraph();
  graph.vector('positions', 'float32');
  graph.scalar('scale', 'float32');
  graph.vector('offset', 'float32');
  graph.vector('output', 'float32');
  graph.add(new GPUExpressionOperation({output: 'output', expression}));
  return graph;
}

test('expression strings and math.gl ASTs normalize identically without bindings', () => {
  const source = 'positions * -scale + offset / 2';
  expect(parseGPUExpression(source)).toEqual(parseGPUExpression(parse(source)));
  const plan = new GPUExpressionProgram(makeProgram(source));
  expect(plan.expressions[0].references).toEqual(['positions', 'scale', 'offset']);
  expect(plan.vectors[0].length).toBeUndefined();
});

for (const expression of [
  'missing + 1',
  'Math.sin(positions)',
  'positions[0]',
  'positions > 0',
  'positions ? 1 : 2',
  '"hello"',
  '1e300',
  'output + 1'
]) {
  test(`compilation rejects unsupported or unresolved expression ${expression}`, () => {
    expect(() => new GPUExpressionProgram(makeProgram(expression))).toThrow();
  });
}

test('expression inputs and outputs require compatible declarations', () => {
  const graph = new GPUGraph();
  graph.vector('input', 'uint32');
  graph.vector('output', 'float32');
  graph.add(new GPUExpressionOperation({output: 'output', expression: 'input + 1'}));
  expect(() => new GPUExpressionProgram(graph)).toThrow('float32');
});

test('expression output writers must be unique and dependencies must precede readers', () => {
  const graph = makeProgram();
  graph.add(new GPUExpressionOperation({output: 'output', expression: 'positions + 1'}));
  expect(() => new GPUExpressionProgram(graph)).toThrow('Multiple');
});
