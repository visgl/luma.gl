// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {runRowComputation} from './common/row-transform';

const source = `\
fn equalAll(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<u32, 1> {
  var allEqual = 1u;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    if (x[i] != y[i]) {
      allEqual = 0u;
      break;
    }
  }
  return array<u32, 1>(allEqual);
}
`;

export const equalAll: OperationHandler<{x: GPUDataEvaluator; y: GPUDataEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  runRowComputation({
    module: {name: 'equalAll', source},
    inputs,
    output,
    operationType: inputs.x.type,
    outputBuffer: target
  });
  return {success: true};
};
