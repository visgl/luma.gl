// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table-evaluator';
import {runRowTransform} from './common/row-transform';

const vs = `\
TYPE multiply(TYPE x, TYPE y) {
  return x * y;
}
`;

export const multiply: OperationHandler<{x: GPUTableEvaluator; y: GPUTableEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  runRowTransform({
    elementWise: true,
    module: {name: 'multiply', vs},
    inputs,
    output,
    outputBuffer: target
  });
};
