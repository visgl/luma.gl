// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {NullDevice} from '@luma.gl/core/test-utils';
import {GPUGraph, GPUGraphCompiler, GPUExpressionOperation} from '@luma.gl/graph';
import {GPUExpressionProgram} from '../../src/gpu-core/gpu-expression-plan';

for (const width of [2, 3, 4] as const) {
  test(`typed expression rows infer width ${width} and preserve it through casts`, () => {
    const graph = new GPUGraph();
    graph.vector('positions', `float32x${width}`);
    graph.vector('weights', 'float32');
    graph.scalar('scale', 'float32');
    graph.vector('output', `sint32x${width}`);
    graph.add(
      new GPUExpressionOperation({
        output: 'output',
        expression: 'sint32(sqrt(abs(positions * scale + weights)))'
      })
    );
    expect(new GPUExpressionProgram(graph).expressions[0].format).toBe(`sint32x${width}`);
  });
}

for (const expression of ['left + right', 'pow(left, right)']) {
  test(`typed expression rejects incompatible widths: ${expression}`, () => {
    const graph = new GPUGraph();
    graph.vector('left', 'float32x2');
    graph.vector('right', 'float32x3');
    graph.vector('output', 'float32x3');
    graph.add(new GPUExpressionOperation({output: 'output', expression}));
    expect(() => new GPUExpressionProgram(graph)).toThrow(/width/);
  });
}

test('typed expression rejects integer arithmetic, width-changing casts and next-tranche syntax', () => {
  for (const expression of [
    'input + 1',
    'float32(input)',
    'input.x',
    'vec3(input)',
    'length(input)',
    'dot(input, input)'
  ]) {
    const graph = new GPUGraph();
    graph.vector('input', 'uint32x2');
    graph.vector('output', 'float32x3');
    graph.add(new GPUExpressionOperation({output: 'output', expression}));
    expect(() => new GPUExpressionProgram(graph)).toThrow();
  }
});

test('typed transient vectors partition by row bytes and retain packed metadata', () => {
  const device = new NullDevice({});
  Object.defineProperty(device, 'type', {value: 'webgpu'});
  Object.defineProperty(device, 'limits', {
    value: {...device.limits, maxStorageBufferBindingSize: 24}
  });
  try {
    const graph = new GPUGraph();
    graph.vector('scratch', 'float32x3', 5);
    const compiled = new GPUGraphCompiler(device).compile(graph);
    const vector = compiled.vectors.get('scratch')!;
    expect(vector.data.map(chunk => chunk.length)).toEqual([2, 2, 1]);
    expect(vector.byteStride).toBe(12);
    expect(vector.rowByteLength).toBe(12);
    expect(vector.stride).toBe(3);
    expect(vector.data.every(chunk => chunk.byteStride === 12)).toBe(true);
  } finally {
    device.destroy();
  }
});
