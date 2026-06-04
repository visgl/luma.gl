// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@luma.gl/core';
import {OperationHandler} from '../../operation/operation';
import {GPUTableEvaluator} from '../../operation/gpu-table-evaluator';
import {runCPUTransform} from './common';

export const swizzle: OperationHandler<{x: GPUTableEvaluator; columns: number[]}> = async ({
  inputs,
  output,
  target
}) => {
  const {columns} = inputs;
  return runCPUTransform({
    func: (out: TypedArray, x: TypedArray) => {
      for (let index = 0; index < columns.length; index++) {
        out[index] = x[columns[index]];
      }
    },
    inputs: {x: inputs.x},
    output,
    outputBuffer: target
  });
};
