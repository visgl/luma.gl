// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table-evaluator';
import {runRowComputation} from './common/row-transform';

const source = `\
fn row_length(x: array<{TYPE}, {X_LEN}>) -> array<f32, 1> {
  var sum = 0.0;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    sum += f32(x[i]) * f32(x[i]);
  }
  return array<f32, 1>(sqrt(sum));
}
`;

export const length: OperationHandler<{x: GPUTableEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  runRowComputation({
    module: {name: 'row_length', source},
    inputs,
    output,
    operationType: 'float32',
    outputBuffer: target
  });
  return {success: true};
};
