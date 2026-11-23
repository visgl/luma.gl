// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {runRowComputation} from './common/row-transform';

export const swizzle: OperationHandler<{x: GPUDataEvaluator; columns: number[]}> = ({
  inputs,
  output,
  target,
  scope
}) => {
  const {columns} = inputs;
  runRowComputation({
    scope,
    module: {name: 'swizzle', source: '// swizzle expression handled inline'},
    expression: laneIndex => `x[${columns[laneIndex]}]`,
    inputs: {x: inputs.x},
    output,
    outputBuffer: target
  });
  return {success: true};
};

swizzle.supportsEvaluationScope = true;
