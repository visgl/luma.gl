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
import {deduceOutputProps} from '../utils/output-props';

class DotOperation extends Operation<{x: GPUDataEvaluator; y: GPUDataEvaluator}> {
  name = 'dot';

  output: GPUDataEvaluator;

  constructor(x: GPUDataEvaluator, y: GPUDataEvaluator) {
    super({x, y});

    validateMatchingRowSize('dot', x, y);
    const props = deduceOutputProps(x, y);
    this.output = new GPUDataEvaluator({
      isConstant: props.isConstant,
      type: 'float32',
      size: 1,
      length: props.length,
      format: getCompatibleGPUDataEvaluatorFormat(x, 'float32', 1, x.normalized),
      source: this
    });
  }

  toString(): string {
    const {x, y} = this.inputs;
    return `dot(${x}, ${y})`;
  }
}

export function dot(x: GPUDataEvaluatorInput, y: GPUDataEvaluatorInput): GPUDataEvaluator {
  return new DotOperation(getGPUDataEvaluator(x), getGPUDataEvaluator(y)).output;
}

function validateMatchingRowSize(name: string, x: GPUDataEvaluator, y: GPUDataEvaluator): void {
  if (x.size !== y.size) {
    throw new Error(`${name} inputs must have matching row sizes, got ${x.size} and ${y.size}`);
  }
}
