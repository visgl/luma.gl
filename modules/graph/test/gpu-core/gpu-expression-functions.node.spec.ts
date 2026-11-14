// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@math.gl/expressions';
import {GPUGraph, GPUExpressionOperation} from '@luma.gl/graph';
import {GPUExpressionProgram} from '../../src/gpu-core/gpu-expression-plan';
import {
  parseGPUExpression,
  getGPUExpressionReferences
} from '../../src/gpu-core/gpu-expression-operation';

for (const expression of [
  'abs(x)',
  'sqrt(x)',
  'pow(x, y)',
  'sin(x)',
  'cos(x)',
  'tan(x)',
  'exp(x)',
  'log(x)',
  'float32(uint32(x))',
  'sint32(x)'
]) {
  test(`expression function parses strings and ASTs: ${expression}`, () => {
    expect(parseGPUExpression(expression)).toEqual(parseGPUExpression(parse(expression)));
    expect(getGPUExpressionReferences(parseGPUExpression(expression))).toEqual(
      expression.includes('y') ? ['x', 'y'] : ['x']
    );
  });
}

for (const expression of [
  'sqrt()',
  'sqrt(x, y)',
  'pow(x)',
  'pow(x, y, 2)',
  'unknown(x)',
  'Math.sin(x)',
  'x.sin()',
  'uint32()',
  'uint32(x, y)',
  'toString(x)'
]) {
  test(`unsupported function call fails at compilation: ${expression}`, () => {
    expect(() => parseGPUExpression(expression)).toThrow();
  });
}

test('casts enforce result types and explicit float arithmetic', () => {
  const graph = new GPUGraph();
  graph.vector('input', 'uint32');
  graph.vector('output', 'float32');
  graph.add(new GPUExpressionOperation({output: 'output', expression: 'sqrt(float32(input))'}));
  expect(new GPUExpressionProgram(graph).expressions[0].format).toBe('float32');
  for (const expression of ['sqrt(input)', 'input + 1', 'sint32(input)']) {
    const invalid = new GPUGraph();
    invalid.vector('input', 'uint32');
    invalid.vector('output', 'float32');
    invalid.add(new GPUExpressionOperation({output: 'output', expression}));
    expect(() => new GPUExpressionProgram(invalid)).toThrow();
  }
});
