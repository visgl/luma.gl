// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';

export const sequence: OperationHandler<{start: number; step: number}> = async ({
  inputs,
  output,
  target
}) => {
  const result = new output.ValueType(output.length);
  for (let rowIndex = 0; rowIndex < output.length; rowIndex++) {
    result[rowIndex] = inputs.start + rowIndex * inputs.step;
  }
  target.write(result);
};
