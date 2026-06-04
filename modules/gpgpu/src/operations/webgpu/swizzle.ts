// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table-evaluator';
import {runRowComputation} from './common/row-transform';

export const swizzle: OperationHandler<{x: GPUTableEvaluator; columns: number[]}> = async ({
  inputs,
  output,
  target
}) => {
  const {columns} = inputs;
  runRowComputation({
    module: {name: 'swizzle', source: '// swizzle expression handled inline'},
    expression: laneIndex => `x[${columns[laneIndex]}]`,
    inputs: {x: inputs.x},
    output,
    outputBuffer: target
  });
  return {success: true};
};
