// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {getValueAtRow} from './common';

export const dot: OperationHandler<{x: GPUDataEvaluator; y: GPUDataEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  const {x, y} = inputs;
  const result = new output.ValueType(output.length);

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    const xRow = getValueAtRow(x, rowIndex);
    const yRow = getValueAtRow(y, rowIndex);
    let sum = 0;
    for (let laneIndex = 0; laneIndex < x.size; laneIndex++) {
      sum += xRow[laneIndex] * yRow[laneIndex];
    }
    result[rowIndex] = sum;
  }

  target.write(result);
  return {success: true, value: result};
};
