// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GPUTableEvaluator} from '../../src/operation/gpu-table';
import {ArithmeticOperation} from '../../src/operations/arithmetic-operation';

test('GPGPU#ArithmeticOperation#mergeDependenciesAndExpressions', () => {
  const a = new GPUTableEvaluator({
    id: 'a',
    type: 'float32',
    size: 1,
    value: new Float32Array([1, 2, 3])
  });
  const b = new GPUTableEvaluator({
    id: 'b',
    type: 'float32',
    size: 1,
    value: new Float32Array([4, 5, 6])
  });
  const c = new GPUTableEvaluator({
    id: 'c',
    type: 'float32',
    size: 1,
    value: new Float32Array([7, 8, 9])
  });

  const addOperation = new ArithmeticOperation('add', [a, b]);
  const divideOperation = new ArithmeticOperation('divide', [addOperation.output, c]);

  expect(divideOperation.dependencies).toEqual([a, b, c]);
  expect(divideOperation.inputs.namedInputs).toEqual({
    arg0: a,
    arg1: b,
    arg2: c
  });
  expect(divideOperation.inputs.expression).toEqual({
    kind: 'call',
    op: 'divide',
    args: [
      {
        kind: 'call',
        op: 'add',
        args: [
          {kind: 'input', name: 'arg0'},
          {kind: 'input', name: 'arg1'}
        ]
      },
      {kind: 'input', name: 'arg2'}
    ]
  });
});

test('GPGPU#ArithmeticOperation#toString', () => {
  const a = new GPUTableEvaluator({
    id: 'a',
    type: 'float32',
    size: 1,
    value: new Float32Array([1])
  });
  const b = new GPUTableEvaluator({
    id: 'b',
    type: 'float32',
    size: 1,
    value: new Float32Array([2])
  });
  const two = new GPUTableEvaluator({
    id: '2',
    isConstant: true,
    type: 'float32',
    size: 1,
    value: new Float32Array([2])
  });

  const addOperation = new ArithmeticOperation('add', [a, b]);
  const cosOperation = new ArithmeticOperation('cos', [addOperation.output]);
  const divideOperation = new ArithmeticOperation('divide', [cosOperation.output, two]);

  expect(divideOperation.toString()).toBe('cos(a + b) / 2');
});

test('GPGPU#ArithmeticOperation#literalArgs', () => {
  const a = new GPUTableEvaluator({
    id: 'a',
    type: 'float32',
    size: 1,
    value: new Float32Array([1, 2, 3])
  });

  const operation = new ArithmeticOperation('add', [a, [10, 20]]);

  expect(operation.inputs.expression).toEqual({
    kind: 'call',
    op: 'add',
    args: [
      {kind: 'input', name: 'arg0'},
      {kind: 'literal', value: [10, 20]}
    ]
  });
  expect(operation.inputs.namedInputs).toEqual({arg0: a});
  expect(operation.dependencies).toEqual([a]);
  expect(operation.output.size).toBe(2);
  expect(operation.output.length).toBe(3);
  expect(operation.output.type).toBe('float32');
});

test('GPGPU#ArithmeticOperation#literalOnlyExpression', () => {
  const operation = new ArithmeticOperation('multiply', [[2, 3], 4]);

  expect(operation.inputs.expression).toEqual({
    kind: 'call',
    op: 'multiply',
    args: [
      {kind: 'literal', value: [2, 3]},
      {kind: 'literal', value: 4}
    ]
  });
  expect(operation.inputs.namedInputs).toEqual({});
  expect(operation.dependencies).toEqual([]);
  expect(operation.output.size).toBe(2);
  expect(operation.output.length).toBe(1);
  expect(operation.output.type).toBe('float32');
});

test('GPGPU#ArithmeticOperation#floatOnlyOpsPromoteOutputType', () => {
  const integers = new GPUTableEvaluator({
    id: 'integers',
    type: 'uint32',
    size: 1,
    value: new Uint32Array([1, 2, 3])
  });

  expect(new ArithmeticOperation('pow', [integers, 2]).output.type).toBe('float32');
  expect(new ArithmeticOperation('sqrt', [integers]).output.type).toBe('float32');
  expect(new ArithmeticOperation('sin', [integers]).output.type).toBe('float32');
  expect(new ArithmeticOperation('cos', [integers]).output.type).toBe('float32');
  expect(new ArithmeticOperation('tan', [integers]).output.type).toBe('float32');
  expect(new ArithmeticOperation('exp', [integers]).output.type).toBe('float32');
  expect(new ArithmeticOperation('log', [integers]).output.type).toBe('float32');
});
