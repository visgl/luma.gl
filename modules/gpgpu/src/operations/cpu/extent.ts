// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table';
import {getValueAtRow} from './common';

export const extent: OperationHandler<{sourceValues: GPUTableEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  const {sourceValues} = inputs;
  const values = sourceValues.value;
  if (!values) {
    throw new Error(`${sourceValues} does not have CPU value`);
  }

  const result = new output.ValueType(output.length * output.size);
  if (sourceValues.length === 0) {
    target.write(result);
    return;
  }

  for (let channelIndex = 0; channelIndex < sourceValues.size; channelIndex++) {
    const firstValue = getValueAtRow(sourceValues, 0)[channelIndex];
    const minIndex = channelIndex * output.size;
    const maxIndex = minIndex + 1;
    result[minIndex] = firstValue;
    result[maxIndex] = firstValue;
    for (let rowIndex = 1; rowIndex < sourceValues.length; rowIndex++) {
      const value = getValueAtRow(sourceValues, rowIndex)[channelIndex];
      if (value < result[minIndex]) {
        result[minIndex] = value;
      }
      if (value > result[maxIndex]) {
        result[maxIndex] = value;
      }
    }
  }

  target.write(result);
};
