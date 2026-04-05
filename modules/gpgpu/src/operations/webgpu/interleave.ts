// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTable} from '../../operation/gpu-table';
import {runComputation} from './common';

const source = `\
fn interleave(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<{TYPE}, {RESULT_LEN}> {
  var out: array<{TYPE}, {RESULT_LEN}>;
  var i: u32;
  for (i = 0u; i < {X_LEN}u; i = i + 1u) {
    out[i] = x[i];
  }
  for (i = 0u; i < {Y_LEN}u; i = i + 1u) {
    out[i + {X_LEN}u] = y[i];
  }
  return out;
}
`;

export const interleave: OperationHandler<{x: GPUTable; y: GPUTable}> = async ({
  inputs,
  output,
  target
}) => {
  runComputation({
    module: {name: 'interleave', source},
    inputs,
    output,
    outputBuffer: target
  });
};
