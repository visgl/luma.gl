// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {Expression} from '../../utils/expression';
import {
  ArithmeticOperationInputs,
  ArithmeticOp,
  ARITHMETIC_OPERATIONS
} from '../arithmetic-operation';
import {getValueAtRow} from './common';

export const arithmetic: OperationHandler<ArithmeticOperationInputs> = async ({
  inputs,
  output,
  target
}) => {
  for (const table of Object.values(inputs.namedInputs)) {
    if (!table.value) {
      throw new Error(`${table} does not have CPU value`);
    }
  }

  const outputValue = new output.ValueType(output.length * output.size);

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    const rowInputs = Object.fromEntries(
      Object.entries(inputs.namedInputs).map(([name, table]) => [
        name,
        getValueAtRow(table, rowIndex)
      ])
    );

    for (let laneIndex = 0; laneIndex < output.size; laneIndex++) {
      outputValue[rowIndex * output.size + laneIndex] = evaluateExpression(
        inputs.expression,
        rowInputs,
        laneIndex
      );
    }
  }

  target.write(outputValue);
  return {
    success: true,
    value: outputValue
  };
};

function evaluateExpression(
  expression: Expression<ArithmeticOp>,
  rowInputs: Record<string, ArrayLike<number>>,
  laneIndex: number
): number {
  switch (expression.kind) {
    case 'input': {
      const input = rowInputs[expression.name];
      if (laneIndex < input.length) {
        return input[laneIndex];
      }
      return input.length === 1 ? input[0] : 0;
    }

    case 'literal':
      if (Array.isArray(expression.value)) {
        return expression.value[laneIndex] ?? 0;
      }
      return expression.value as number;

    case 'call': {
      validateArity(expression.op, expression.args.length);
      const args = expression.args.map(argument =>
        evaluateExpression(argument, rowInputs, laneIndex)
      );

      switch (expression.op) {
        case 'add':
          return args[0] + args[1];
        case 'subtract':
          return args[0] - args[1];
        case 'multiply':
          return args[0] * args[1];
        case 'divide':
          return args[0] / args[1];
        case 'pow':
          return Math.pow(args[0], args[1]);
        case 'sqrt':
          return Math.sqrt(args[0]);
        case 'abs':
          return Math.abs(args[0]);
        case 'sin':
          return Math.sin(args[0]);
        case 'cos':
          return Math.cos(args[0]);
        case 'tan':
          return Math.tan(args[0]);
        case 'exp':
          return Math.exp(args[0]);
        case 'log':
          return Math.log(args[0]);
        default: {
          const unreachable: never = expression.op;
          throw new Error(`Unsupported arithmetic op ${unreachable}`);
        }
      }
    }

    default: {
      const unreachable: never = expression;
      throw new Error(`Unsupported expression node ${(unreachable as {kind?: string}).kind}`);
    }
  }
}

function validateArity(op: ArithmeticOp, actualArity: number): void {
  const expectedArity = ARITHMETIC_OPERATIONS[op].arity;
  if (actualArity !== expectedArity) {
    throw new Error(`Arithmetic op '${op}' expects ${expectedArity} args, got ${actualArity}`);
  }
}
