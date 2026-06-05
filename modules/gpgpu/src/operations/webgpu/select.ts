// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {runRowComputation} from './common/row-transform';
import {getZeroValue} from './common/helper';

export const select: OperationHandler<{
  condition: GPUDataEvaluator;
  whenTrue: GPUDataEvaluator;
  whenFalse: GPUDataEvaluator;
}> = async ({inputs, output, target}) => {
  const zeroLiteral = getZeroValue(output.type);

  runRowComputation({
    module: {name: 'select', source: '// inline expression select\n'},
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
      return `select(${whenFalseExpr}, ${whenTrueExpr}, ${conditionExpr} != ${zeroLiteral})`;
    }
  });
  return {success: true};
};

function getLaneExpression(
  name: string,
  input: GPUDataEvaluator,
  laneIndex: number,
  zeroLiteral: string
): string {
  if (laneIndex < input.size) {
    return `${name}[${laneIndex}]`;
  }
  return input.size === 1 ? `${name}[0]` : zeroLiteral;
}
