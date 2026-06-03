// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table-evaluator';
import {getValueAtRow} from './common';

export const select: OperationHandler<{
  condition: GPUTableEvaluator;
  whenTrue: GPUTableEvaluator;
  whenFalse: GPUTableEvaluator;
}> = async ({inputs, output, target}) => {
  const {condition, whenTrue, whenFalse} = inputs;
  const result = new output.ValueType(output.length * output.size);

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    const conditionRow = getValueAtRow(condition, rowIndex);
    const whenTrueRow = getValueAtRow(whenTrue, rowIndex);
    const whenFalseRow = getValueAtRow(whenFalse, rowIndex);

    for (let laneIndex = 0; laneIndex < output.size; laneIndex++) {
      const conditionValue = getLaneValue(conditionRow, condition.size, laneIndex);
      result[rowIndex * output.size + laneIndex] =
        conditionValue !== 0
          ? getLaneValue(whenTrueRow, whenTrue.size, laneIndex)
          : getLaneValue(whenFalseRow, whenFalse.size, laneIndex);
    }
  }

  target.write(result);
  return {success: true, value: result};
};

function getLaneValue(row: ArrayLike<number>, size: number, laneIndex: number): number {
  if (laneIndex < size) {
    return row[laneIndex];
  }
  return size === 1 ? row[0] : 0;
}
