// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {compileExpression} from '../../utils/expression';
import {ARITHMETIC_OPERATIONS, ArithmeticOperationInputs} from '../arithmetic-operation';
import {runRowComputation} from './common/row-transform';
import {formatLiteralValue, getWGSLType, getZeroValue} from './common/helper';

const source = `\
fn arithmetic_add(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x + y;
}

fn arithmetic_subtract(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x - y;
}

fn arithmetic_multiply(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x * y;
}

fn arithmetic_divide(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x / y;
}

fn arithmetic_tan(x: {TYPE}) -> {TYPE} {
  return tan(x);
}
`;

export const arithmetic: OperationHandler<ArithmeticOperationInputs> = async ({
  inputs,
  output,
  target
}) => {
  const operationType = output.type;
  const scalarType = getWGSLType(operationType);
  const zeroLiteral = getZeroValue(operationType);
  const namedInputs = inputs.namedInputs;

  runRowComputation({
    module: {name: 'arithmetic', source},
    inputs: namedInputs,
    output,
    operationType,
    outputBuffer: target,
    expression: laneIndex =>
      compileExpression(inputs.expression, {
        operations: ARITHMETIC_OPERATIONS,
        inputs: namedInputs,
        laneIndex,
        formatInput: name => `${name}[${laneIndex}]`,
        formatOutOfBoundsInput: name => (namedInputs[name].size === 1 ? `${name}[0]` : zeroLiteral),
        formatLiteral: value => {
          const v = Array.isArray(value) ? (value[laneIndex] ?? 0) : value;
          return `${scalarType}(${formatLiteralValue(operationType, v)})`;
        },
        formatCall: (symbol, args) => `${symbol}(${args.join(', ')})`
      })
  });
  return {success: true};
};
