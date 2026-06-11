// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {runRowTransform} from './common/row-transform';

const vs = `\
void equalAll(in TYPE x[X_LEN], in TYPE y[Y_LEN], out uint result[1]) {
  uint allEqual = uint(1);
  for (int i = 0; i < X_LEN; i++) {
    if (x[i] != y[i]) {
      allEqual = uint(0);
      break;
    }
  }
  result[0] = allEqual;
}
`;

export const equalAll: OperationHandler<{x: GPUDataEvaluator; y: GPUDataEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  runRowTransform({
    module: {name: 'equalAll', vs},
    inputs,
    output,
    operationType: output.type === 'uint32' ? inputs.x.type : output.type,
    outputBuffer: target
  });
  return {success: true};
};
