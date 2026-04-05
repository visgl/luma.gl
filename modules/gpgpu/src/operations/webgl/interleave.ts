// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTable} from '../../operation/gpu-table';
import {runBufferTransform} from './common';

const vs = `\
void interleave(in TYPE x[X_LEN], in TYPE y[Y_LEN], out TYPE result[RESULT_LEN]) {
  for (int i = 0; i < X_LEN; i++) {
    result[i] = x[i];
  }
  for (int i = 0; i < Y_LEN; i++) {
    result[i + X_LEN] = y[i];
  }
}
`;

export const interleave: OperationHandler<{x: GPUTable; y: GPUTable}> = async ({
  inputs,
  output,
  target
}) => {
  runBufferTransform({
    module: {name: 'interleave', vs},
    inputs,
    output,
    outputBuffer: target
  });
};
