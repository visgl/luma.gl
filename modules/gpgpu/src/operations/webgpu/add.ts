// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table';
import {runComputation} from './common';

const source = `\
fn add(x: {TYPE}, y: {TYPE}) -> {TYPE} {
  return x + y;
}
`;

export const add: OperationHandler<{x: GPUTableEvaluator; y: GPUTableEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  runComputation({
    module: {name: 'add', source},
    elementWise: true,
    inputs,
    output,
    outputBuffer: target
  });
};
