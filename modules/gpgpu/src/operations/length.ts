// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getGPUTableEvaluator,
  getCompatibleGPUTableEvaluatorFormat,
  GPUTableEvaluator,
  type GPUTableEvaluatorInput
} from '../operation/gpu-table-evaluator';
import {Operation} from '../operation/operation';

class LengthOperation extends Operation<{x: GPUTableEvaluator}> {
  name = 'length';

  output: GPUTableEvaluator;

  constructor(x: GPUTableEvaluator) {
    super({x});

    this.output = new GPUTableEvaluator({
      isConstant: x.isConstant,
      type: 'float32',
      size: 1,
      length: x.length,
      format: getCompatibleGPUTableEvaluatorFormat(x, 'float32', 1, x.normalized),
      source: this
    });
  }

  toString(): string {
    return `length(${this.inputs.x})`;
  }
}

export function length(x: GPUTableEvaluatorInput): GPUTableEvaluator {
  return new LengthOperation(getGPUTableEvaluator(x)).output;
}
