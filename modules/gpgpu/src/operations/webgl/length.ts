// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {runRowTransform} from './common/row-transform';

const vs = `\
void row_length(in TYPE x[X_LEN], out float result[1]) {
  float sum = 0.0;
  for (int i = 0; i < X_LEN; i++) {
    sum += float(x[i]) * float(x[i]);
  }
  result[0] = sqrt(sum);
}
`;

export const length: OperationHandler<{x: GPUDataEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  runRowTransform({
    module: {name: 'row_length', vs},
    inputs,
    output,
    operationType: 'float32',
    outputBuffer: target
  });
  return {success: true};
};
