// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GPUTableEvaluator} from '../../operation/gpu-table-evaluator';
import type {InterleavedGPUTableEvaluator} from '../../operation/interleaved-gpu-table-evaluator';
import type {OperationHandler} from '../../operation/operation';

export const scatterInterleaved: OperationHandler<
  Record<string, GPUTableEvaluator>,
  InterleavedGPUTableEvaluator
> = async () => ({
  success: false,
  error: new Error('WebGPU scatterInterleaved does not yet support mixed-format interleaved writes')
});
