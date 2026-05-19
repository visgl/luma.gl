// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table-evaluator';
import {runRowComputation} from './common/row-transform';

const source = `\
fn subtract(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x - y;
}
`;

export const subtract: OperationHandler<{x: GPUTableEvaluator; y: GPUTableEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  runRowComputation({
    module: {name: 'subtract', source},
    elementWise: true,
    inputs,
    output,
    outputBuffer: target
  });
};
