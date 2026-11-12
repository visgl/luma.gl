// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@math.gl/expressions';
import {GPUGraph, GPUExpressionOperation, type GPUGraphVectorFormat} from '@luma.gl/graph';
import {GPUExpressionProgram} from '../../src/gpu-core/gpu-expression-plan';
import {
  parseGPUExpression,
  getGPUExpressionFormat,
  getGPUExpressionReferences
} from '../../src/gpu-core/gpu-expression-operation';

const formats = new Map<string, GPUGraphVectorFormat>([
  ['positions', 'float32x3'],
  ['weights', 'float32'],
  ['ids', 'uint32x3'],
  ['flags', 'sint32x3'],
  ['mask', 'uint32']
]);
for (const [source, format] of [
  ['dot(positions, vec3(weights))', 'float32'],
  ['length(positions)', 'float32'],
  ['length(weights)', 'float32'],
  ['equalAll(ids, ids.zyx)', 'uint32'],
  ['equalAll(positions, vec3(weights))', 'uint32'],
  ['select(mask, positions, weights)', 'float32x3'],
  ['select(positions, ids, uint32(0))', 'uint32x3'],
  ['select(flags, ids, ids.zyx)', 'uint32x3'],
  ['vec2(dot(positions, positions), length(positions))', 'float32x2'],
  ['positions / length(positions)', 'float32x3'],
  ['select(equalAll(ids, ids.zyx), ids, uint32(0))', 'uint32x3']
] as const) {
  test(`row expression types and ASTs: ${source}`, () => {
    const expression = parseGPUExpression(source);
    expect(parseGPUExpression(parse(source))).toEqual(expression);
    expect(getGPUExpressionFormat(expression, formats)).toBe(format);
    expect(getGPUExpressionReferences(expression).every(name => formats.has(name))).toBe(true);
  });
}
for (const [source, message] of [
  ['dot(positions)', 'argument count'],
  ['length(positions, weights)', 'argument count'],
  ['equalAll(ids)', 'argument count'],
  ['select(mask, positions)', 'argument count'],
  ['dot(positions, weights)', 'matching row widths'],
  ['dot(ids, ids)', 'float32 operands'],
  ['length(ids)', 'float32 operands'],
  ['equalAll(ids, positions)', 'matching types and row widths'],
  ['equalAll(positions, weights)', 'matching types and row widths'],
  ['select(mask, positions, ids)', 'matching component types'],
  ['select(positions.xy, positions, weights)', 'select widths'],
  ['select(positions, weights, weights)', 'select widths'],
  ['select(mask, positions.xy, positions)', 'select widths']
]) {
  test(`row expression rejects incompatible syntax or types: ${source}`, () => {
    const graph = new GPUGraph();
    for (const [name, format] of formats) graph.vector(name, format);
    graph.vector('output', 'float32');
    graph.add(new GPUExpressionOperation({id: 'row-test', output: 'output', expression: source}));
    expect(() => new GPUExpressionProgram(graph)).toThrow(message);
    expect(() => new GPUExpressionProgram(graph)).toThrow('row-test:');
  });
}
