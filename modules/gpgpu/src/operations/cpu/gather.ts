// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table';
import {getValueAtRow} from './common';

export const gather: OperationHandler<{
  ids: GPUTableEvaluator;
  sourceValues: GPUTableEvaluator;
}> = async ({inputs, output, target}) => {
  const {ids, sourceValues} = inputs;
  const idsValue = ids.value;
  const sourceValue = sourceValues.value;
  if (!idsValue) {
    throw new Error(`${ids} does not have CPU value`);
  }
  if (!sourceValue) {
    throw new Error(`${sourceValues} does not have CPU value`);
  }

  const result = new output.ValueType(output.length * output.size);
  const zeroRow = new Array<number>(output.size).fill(0);

  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    const idRow = getValueAtRow(ids, rowIndex);
    const sourceIndex = Number(idRow[0]);
    const row = isValidSourceIndex(sourceIndex, sourceValues.length)
      ? getValueAtRow(sourceValues, sourceIndex)
      : zeroRow;
    result.set(row, rowIndex * output.size);
  }

  target.write(result);
  return {
    success: true,
    value: result
  };
};

function isValidSourceIndex(sourceIndex: number, length: number): boolean {
  return Number.isInteger(sourceIndex) && sourceIndex >= 0 && sourceIndex < length;
}
