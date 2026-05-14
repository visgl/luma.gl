// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table';
import {runCPUTransform} from './common';

export const add: OperationHandler<{x: GPUTableEvaluator; y: GPUTableEvaluator}> = async ({
  inputs,
  output,
  target
}) => {
  runCPUTransform({
    elementWise: true,
    func: (x: number, y: number) => x + y,
    inputs,
    output,
    outputBuffer: target
  });
};
