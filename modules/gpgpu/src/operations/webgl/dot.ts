// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {runRowTransform} from './common/row-transform';

const vs = `\
void row_dot(in TYPE x[X_LEN], in TYPE y[Y_LEN], out float result[1]) {
  float sum = 0.0;
  for (int i = 0; i < X_LEN; i++) {
    sum += float(x[i]) * float(y[i]);
  }
  result[0] = sum;
}
`;

export const dot: OperationHandler<{x: GPUDataEvaluator; y: GPUDataEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  runRowTransform({
    module: {name: 'row_dot', vs},
    inputs,
    output,
    operationType: 'float32',
    outputBuffer: target
  });
  return {success: true};
};
