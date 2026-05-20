// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fp32} from '@luma.gl/shadertools';
import {OperationHandler} from '../../operation/operation';
import {compileExpression} from '../../utils/expression';
import {ARITHMETIC_OPERATIONS, ArithmeticOperationInputs} from '../arithmetic-operation';
import {runRowTransform} from './common/row-transform';
import {formatLiteralValue, getAttributeType, getZeroLiteral} from './common/helper';

const vs = `\
TYPE arithmetic_add(TYPE x, TYPE y) {
  return x + y;
}

TYPE arithmetic_subtract(TYPE x, TYPE y) {
  return x - y;
}

TYPE arithmetic_multiply(TYPE x, TYPE y) {
  return x * y;
}

TYPE arithmetic_divide(TYPE x, TYPE y) {
  return x / y;
}

float arithmetic_tan(float x) {
  return tan_fp32(x);
}
`;

export const arithmetic: OperationHandler<ArithmeticOperationInputs> = async ({
  inputs,
  output,
  target
}) => {
  const operationType = output.type;
  const scalarType = getAttributeType(operationType, 1, output.normalized);
  const zeroLiteral = getZeroLiteral(scalarType);
  const namedInputs = inputs.namedInputs;

  runRowTransform({
    module: {name: 'arithmetic', dependencies: [fp32], vs},
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
          const resolvedValue = Array.isArray(value) ? (value[laneIndex] ?? 0) : value;
          return `${scalarType}(${formatLiteralValue(operationType, resolvedValue)})`;
        },
        formatCall: (symbol, args) => `${symbol}(${args.join(', ')})`
      })
  });
  return {success: true};
};
