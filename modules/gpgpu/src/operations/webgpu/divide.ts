// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table';
import {runRowComputation} from './common/row-transform';

const source = `\
fn divide(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x / y;
}
`;

export const divide: OperationHandler<{x: GPUTableEvaluator; y: GPUTableEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  runRowComputation({
    module: {name: 'divide', source},
    elementWise: true,
    inputs,
    output,
    outputBuffer: target
  });
};
