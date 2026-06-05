// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {runRowComputation} from './common/row-transform';

const source = `\
fn row_dot(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<f32, 1> {
  var sum = 0.0;
  for (var i = 0u; i < {X_LEN}u; i = i + 1u) {
    sum += f32(x[i]) * f32(y[i]);
  }
  return array<f32, 1>(sum);
}
`;

export const dot: OperationHandler<{x: GPUDataEvaluator; y: GPUDataEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  runRowComputation({
    module: {name: 'row_dot', source},
    inputs,
    output,
    operationType: 'float32',
    outputBuffer: target
  });
  return {success: true};
};
