// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GPUDataEvaluator} from '../operation/gpu-data-evaluator';
import type {Expression, ExpressionOperations} from '../utils/expression';

export type ArithmeticOp =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'pow'
  | 'sqrt'
  | 'abs'
  | 'sin'
  | 'cos'
  | 'tan'
  | 'exp'
  | 'log';

export type ArithmeticOperationInputs = {
  expression: Expression<ArithmeticOp>;
  namedInputs: Record<string, GPUDataEvaluator>;
};

export const ARITHMETIC_OPERATIONS: ExpressionOperations<ArithmeticOp> = {
  add: {arity: 2, symbol: 'arithmetic_add'},
  subtract: {arity: 2, symbol: 'arithmetic_subtract'},
  multiply: {arity: 2, symbol: 'arithmetic_multiply'},
  divide: {arity: 2, symbol: 'arithmetic_divide'},
  pow: {arity: 2, symbol: 'pow'},
  sqrt: {arity: 1, symbol: 'sqrt'},
  abs: {arity: 1, symbol: 'abs'},
  sin: {arity: 1, symbol: 'sin'},
  cos: {arity: 1, symbol: 'cos'},
  tan: {arity: 1, symbol: 'arithmetic_tan'},
  exp: {arity: 1, symbol: 'exp'},
  log: {arity: 1, symbol: 'log'}
};
