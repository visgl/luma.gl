// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table-evaluator';
import {getValueAtRow} from './common';

export const length: OperationHandler<{x: GPUTableEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  const {x} = inputs;
  const result = new output.ValueType(output.length);

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    const row = getValueAtRow(x, rowIndex);
    let sum = 0;
    for (let laneIndex = 0; laneIndex < x.size; laneIndex++) {
      sum += row[laneIndex] * row[laneIndex];
    }
    result[rowIndex] = Math.sqrt(sum);
  }

  target.write(result);
  return {success: true, value: result};
};
