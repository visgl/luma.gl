// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OperationHandler} from '../../operation/operation';
import {GPUDataEvaluator} from '../../operation/gpu-data-evaluator';
import {runCPUTransform} from './common';
import type {TypedArray} from '@luma.gl/core';

export const fround: OperationHandler<{x: GPUDataEvaluator}> = async ({inputs, output, target}) => {
  return runCPUTransform({
    func: (out: TypedArray, x: TypedArray) => {
      const vertexSize = out.length / 2;
      const f64Arr = new Float64Array(x.buffer);
      for (let i = 0; i < vertexSize; i++) {
        const value = f64Arr[i];
        out[i] = Math.fround(value);
        out[i + vertexSize] = value - out[i];
      }
      return out;
    },
    inputs,
    output,
    outputBuffer: target
  });
};
