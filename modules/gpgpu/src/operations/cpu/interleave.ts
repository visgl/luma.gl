// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUTable} from '../../operation/gpu-table';
import {runCPUTransform} from './common';
import type {TypedArray} from '@luma.gl/core';

export const interleave: OperationHandler<{x: GPUTable; y: GPUTable}> = async ({
  inputs,
  output,
  target
}) => {
  runCPUTransform({
    func: (out: TypedArray, ...args: TypedArray[]) => {
      let index = 0;
      for (const arr of args) {
        out.set(arr, index);
        index += arr.length;
      }
    },
    inputs,
    output,
    outputBuffer: target
  });
};
