// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { OperationHandler } from "../../operation/operation";
import { GPUTable } from "../../operation/gpu-table";
import { runBufferTransform } from "../common/webgl-modules";

const vs = `\
void add(in TYPE x[SIZE], in TYPE y[SIZE], inout TYPE sum[SIZE]) {
  for (int i = 0; i < SIZE; i++) {
    sum[i] = x[i] + y[i];
  }
}
`;

export const add: OperationHandler<{x: GPUTable, y: GPUTable}> = async ({
  inputs,
  output,
  target
}) => {
  runBufferTransform(target.device, {
    module: { name: 'add', vs },
    inputs,
    output,
    outputBuffer: target
  });
};
