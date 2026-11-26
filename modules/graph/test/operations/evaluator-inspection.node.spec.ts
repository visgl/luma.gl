// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it, vi} from 'vitest';
import {GPUDataEvaluator, GPUVectorEvaluator, add, swizzle} from '@luma.gl/graph/gpu-simple-graph';

it('inspects shared dependencies and ordered chunks without evaluation or CPU payloads', () => {
  const input = GPUDataEvaluator.fromArray(new Float32Array([1, 2, 3, 4]), {size: 2});
  const first = add(input, 1);
  const second = swizzle(first, [1, 0]);
  const vector = GPUVectorEvaluator.fromGPUDataEvaluators([first, second, first]);
  const evaluate = vi.spyOn(input, 'evaluate');
  const inspection = vector.getInspection();
  expect(inspection.outputs).toHaveLength(3);
  expect(inspection.outputs[0]).toBe(inspection.outputs[2]);
  expect(new Set(inspection.nodes.map(node => node.id)).size).toBe(inspection.nodes.length);
  const inputNode = inspection.nodes.find(node => node.label === input.id);
  expect(inputNode).toMatchObject({
    kind: 'source',
    format: 'float32x2',
    length: 2,
    evaluated: false
  });
  expect(inspection.nodes.some(node => node.kind === 'operation')).toBe(true);
  for (const node of inspection.nodes) {
    expect(Object.isFrozen(node)).toBe(true);
    expect(Object.isFrozen(node.dependencies)).toBe(true);
    expect(node).not.toHaveProperty('value');
    expect(node).not.toHaveProperty('buffer');
    for (const dependency of node.dependencies) {
      expect(inspection.nodes.some(candidate => candidate.id === dependency)).toBe(true);
    }
  }
  expect(Object.isFrozen(inspection.outputs)).toBe(true);
  expect(Object.isFrozen(inspection.nodes)).toBe(true);
  expect(Object.isFrozen(inspection)).toBe(true);
  expect(evaluate).not.toHaveBeenCalled();
  expect(vector.evaluated).toBe(false);
  expect(input.getInspection().nodes[0].format).toBe('float32x2');
  evaluate.mockRestore();
  vector.destroy();
  input.destroy();
});
