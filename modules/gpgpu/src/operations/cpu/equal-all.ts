// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table-evaluator';
import {getValueAtRow} from './common';

export const equalAll: OperationHandler<{x: GPUTableEvaluator; y: GPUTableEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  const {x, y} = inputs;
  const result = new output.ValueType(output.length);

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    const xRow = getValueAtRow(x, rowIndex);
    const yRow = getValueAtRow(y, rowIndex);
    let allEqual = 1;
    for (let laneIndex = 0; laneIndex < x.size; laneIndex++) {
      if (xRow[laneIndex] !== yRow[laneIndex]) {
        allEqual = 0;
        break;
      }
    }
    result[rowIndex] = allEqual;
  }

  target.write(result);
  return {success: true, value: result};
};
