// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  compileExpression,
  validateExpression,
  type ExpressionOperations
} from '../../src/utils/expression';

type TestOp = 'add' | 'divide';

const TEST_OPERATIONS: ExpressionOperations<TestOp> = {
  add: {arity: 2, symbol: 'add'},
  divide: {arity: 2, symbol: 'divide'}
};

test('GPGPU#Expression#compileExpression', () => {
  const expression = {
    kind: 'call' as const,
    op: 'divide' as const,
    args: [
      {
        kind: 'call' as const,
        op: 'add' as const,
        args: [
          {kind: 'input' as const, name: 'x'},
          {kind: 'input' as const, name: 'y'}
        ]
      },
      {kind: 'literal' as const, value: 2}
    ]
  };

  expect(
    compileExpression(expression, {
      operations: TEST_OPERATIONS,
      inputs: {
        x: {size: 2},
        y: {size: 1}
      },
      laneIndex: 1,
      formatInput: name => `${name}[1]`,
      formatOutOfBoundsInput: () => 'ZERO',
      formatLiteral: value => `L(${value})`,
      formatCall: (symbol, args) => `${symbol}(${args.join(', ')})`
    })
  ).toBe('divide(add(x[1], ZERO), L(2))');
});

test('GPGPU#Expression#validateExpression:bad_arity', () => {
  const expression = {
    kind: 'call' as const,
    op: 'add' as const,
    args: [{kind: 'input' as const, name: 'x'}]
  };

  expect(() =>
    validateExpression(expression, {
      operations: TEST_OPERATIONS,
      inputs: {x: {size: 1}}
    })
  ).toThrow("Expression op 'add' expects 2 args, got 1");
});

test('GPGPU#Expression#validateExpression:unknown_input', () => {
  const expression = {kind: 'input' as const, name: 'missing'};

  expect(() =>
    validateExpression(expression, {
      operations: TEST_OPERATIONS,
      inputs: {x: {size: 1}}
    })
  ).toThrow("Unknown expression input 'missing'");
});

test('GPGPU#Expression#compileExpression:array_literal', () => {
  const expression = {
    kind: 'call' as const,
    op: 'add' as const,
    args: [
      {kind: 'input' as const, name: 'x'},
      {kind: 'literal' as const, value: [10, 20]}
    ]
  };

  expect(
    compileExpression(expression, {
      operations: TEST_OPERATIONS,
      inputs: {x: {size: 3}},
      laneIndex: 2,
      formatInput: name => `${name}[2]`,
      formatOutOfBoundsInput: () => 'ZERO',
      formatLiteral: value => `L(${value})`,
      formatCall: (symbol, args) => `${symbol}(${args.join(', ')})`
    })
  ).toBe('add(x[2], L(10,20))');
});
