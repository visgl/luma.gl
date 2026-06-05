// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getGPUDataEvaluator,
  getCompatibleGPUDataEvaluatorFormat,
  GPUDataEvaluator,
  type GPUDataEvaluatorInput
} from '../operation/gpu-data-evaluator';
import {Operation} from '../operation/operation';

class LengthOperation extends Operation<{x: GPUDataEvaluator}> {
  name = 'length';

  output: GPUDataEvaluator;

  constructor(x: GPUDataEvaluator) {
    super({x});

    this.output = new GPUDataEvaluator({
      isConstant: x.isConstant,
      type: 'float32',
      size: 1,
      length: x.length,
      format: getCompatibleGPUDataEvaluatorFormat(x, 'float32', 1, x.normalized),
      source: this
    });
  }

  toString(): string {
    return `length(${this.inputs.x})`;
  }
}

export function length(x: GPUDataEvaluatorInput): GPUDataEvaluator {
  return new LengthOperation(getGPUDataEvaluator(x)).output;
}
