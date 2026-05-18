// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table';
import {runRowTransform} from './common/row-transform';

const vs = `\
TYPE divide(TYPE x, TYPE y) {
  return x / y;
}
`;

export const divide: OperationHandler<{x: GPUTableEvaluator; y: GPUTableEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  runRowTransform({
    elementWise: true,
    module: {name: 'divide', vs},
    inputs,
    output,
    outputBuffer: target
  });
};
