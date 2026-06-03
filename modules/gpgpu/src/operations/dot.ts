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
import {deduceOutputProps} from '../utils/output-props';

class DotOperation extends Operation<{x: GPUTableEvaluator; y: GPUTableEvaluator}> {
  name = 'dot';

  output: GPUTableEvaluator;

  constructor(x: GPUTableEvaluator, y: GPUTableEvaluator) {
    super({x, y});

    validateMatchingRowSize('dot', x, y);
    const props = deduceOutputProps(x, y);
    this.output = new GPUTableEvaluator({
      isConstant: props.isConstant,
      type: 'float32',
      size: 1,
      length: props.length,
      format: getCompatibleGPUTableEvaluatorFormat(x, 'float32', 1, x.normalized),
      source: this
    });
  }

  toString(): string {
    const {x, y} = this.inputs;
    return `dot(${x}, ${y})`;
  }
}

export function dot(x: GPUTableEvaluatorInput, y: GPUTableEvaluatorInput): GPUTableEvaluator {
  return new DotOperation(getGPUTableEvaluator(x), getGPUTableEvaluator(y)).output;
}

function validateMatchingRowSize(name: string, x: GPUTableEvaluator, y: GPUTableEvaluator): void {
  if (x.size !== y.size) {
    throw new Error(`${name} inputs must have matching row sizes, got ${x.size} and ${y.size}`);
  }
}
