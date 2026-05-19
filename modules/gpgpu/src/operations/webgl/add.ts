// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table-evaluator';
import {runRowTransform} from './common/row-transform';

const vs = `\
TYPE add(TYPE x, TYPE y) {
  return x + y;
}
`;

export const add: OperationHandler<{x: GPUTableEvaluator; y: GPUTableEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  runRowTransform({
    elementWise: true,
    module: {name: 'add', vs},
    inputs,
    output,
    outputBuffer: target
  });
};
