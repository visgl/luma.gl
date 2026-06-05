// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {runRowTransform} from './common/row-transform';

export const swizzle: OperationHandler<{x: GPUDataEvaluator; columns: number[]}> = async ({
  inputs,
  output,
  target
}) => {
  const {columns} = inputs;
  runRowTransform({
    module: {name: 'swizzle', vs: '// swizzle expression handled inline'},
    expression: laneIndex => `x[${columns[laneIndex]}]`,
    inputs: {x: inputs.x},
    output,
    outputBuffer: target
  });
  return {success: true};
};
