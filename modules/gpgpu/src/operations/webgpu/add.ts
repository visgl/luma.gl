// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { OperationHandler } from "../../operation/operation";
import { GPUTable } from "../../operation/gpu-table";
import { runComputation } from "./common";

export const add: OperationHandler<{x: GPUTable, y: GPUTable}> = async ({
  inputs,
  output,
  target
}) => {
  runComputation({
    inputs,
    output,
    outputBuffer: target
  });
};
