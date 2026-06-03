// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table-evaluator';
import {runRowTransform} from './common/row-transform';
import {getAttributeType, getZeroLiteral} from './common/helper';

export const select: OperationHandler<{
  condition: GPUTableEvaluator;
  whenTrue: GPUTableEvaluator;
  whenFalse: GPUTableEvaluator;
}> = async ({inputs, output, target}) => {
  const scalarType = getAttributeType(output.type, 1, output.normalized);
  const zeroLiteral = getZeroLiteral(scalarType);

  runRowTransform({
    module: {name: 'select', vs: ''},
    inputs,
    output,
    operationType: output.type,
    outputBuffer: target,
    expression: laneIndex => {
      const conditionExpr = getLaneExpression(
        'condition',
        inputs.condition,
        laneIndex,
        zeroLiteral
      );
      const whenTrueExpr = getLaneExpression('whenTrue', inputs.whenTrue, laneIndex, zeroLiteral);
      const whenFalseExpr = getLaneExpression(
        'whenFalse',
        inputs.whenFalse,
        laneIndex,
        zeroLiteral
      );
      return `(${conditionExpr} != ${zeroLiteral} ? ${whenTrueExpr} : ${whenFalseExpr})`;
    }
  });
  return {success: true};
};

function getLaneExpression(
  name: string,
  input: GPUTableEvaluator,
  laneIndex: number,
  zeroLiteral: string
): string {
  if (laneIndex < input.size) {
    return `${name}[${laneIndex}]`;
  }
  return input.size === 1 ? `${name}[0]` : zeroLiteral;
}
