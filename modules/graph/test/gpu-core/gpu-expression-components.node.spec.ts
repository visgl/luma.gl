// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@math.gl/expressions';
import {GPUGraph, GPUExpressionOperation, type GPUGraphVectorFormat} from '@luma.gl/graph';
import {GPUExpressionProgram} from '../../src/gpu-core/gpu-expression-plan';
import {
  parseGPUExpression,
  getGPUExpressionReferences,
  getGPUExpressionFormat
} from '../../src/gpu-core/gpu-expression-operation';

const formats = new Map<string, GPUGraphVectorFormat>([
  ['positions', 'float32x3'],
  ['weight', 'float32'],
  ['ids', 'uint32x2']
]);
for (const [source, format] of [
  ['positions.x', 'float32'],
  ['positions.zyx', 'float32x3'],
  ['positions.xx', 'float32x2'],
  ['positions.xy.yx', 'float32x2'],
  ['vec4(positions, 1)', 'float32x4'],
  ['vec3(weight)', 'float32x3'],
  ['vec4(positions.xy, weight, 1)', 'float32x4'],
  ['vec3(ids, uint32(1))', 'uint32x3'],
  ['sint32(positions.yx)', 'sint32x2'],
  ['positions + vec2(weight).y', 'float32x3']
] as const) {
  test(`component expressions parse strings and ASTs with inferred types: ${source}`, () => {
    const expression = parseGPUExpression(source);
    expect(parseGPUExpression(parse(source))).toEqual(expression);
    expect(getGPUExpressionFormat(expression, formats)).toBe(format);
    expect(getGPUExpressionReferences(expression).every(reference => formats.has(reference))).toBe(
      true
    );
  });
}
for (const [source, message] of [
  ['positions.w', '.w needs 4 components; positions has 3'],
  ['vec4(positions.xy, 1)', 'vec4(...) needs 4 components; received 3'],
  ['vec3(ids, 1)', 'mixed component types (uint32, float32)'],
  ['positions.rgba', 'Invalid swizzle .rgba'],
  ['positions.xyzwx', 'Invalid swizzle'],
  ['positions[0]', 'Computed component access is unsupported'],
  ['positions["x"]', 'Computed component access is unsupported'],
  ['vec3()', 'expected 1–4 arguments, received 0'],
  ['positions.constructor', 'Invalid swizzle'],
  ['vec5(positions)', 'Unsupported GPU expression syntax']
]) {
  test(`component compilation gives actionable diagnostics: ${source}`, () => {
    const graph = new GPUGraph();
    graph.vector('positions', 'float32x3');
    graph.vector('ids', 'uint32x2');
    graph.vector('output', 'float32x4');
    graph.add(new GPUExpressionOperation({id: 'build-row', output: 'output', expression: source}));
    expect(() => new GPUExpressionProgram(graph)).toThrow(message);
    expect(() => new GPUExpressionProgram(graph)).toThrow('build-row:');
  });
}
