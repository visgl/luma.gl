// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getGPUDataEvaluator,
  GPUDataEvaluator,
  type GPUDataEvaluatorInput
} from '../operation/gpu-data-evaluator';
import {Operation} from '../operation/operation';
import {deduceOutputProps} from '../utils/output-props';

class EqualAllOperation extends Operation<{x: GPUDataEvaluator; y: GPUDataEvaluator}> {
  name = 'equalAll';

  output: GPUDataEvaluator;

  constructor(x: GPUDataEvaluator, y: GPUDataEvaluator) {
    super({x, y});

    validateMatchingRowSize('equalAll', x, y);
    const props = deduceOutputProps(x, y);
    this.output = new GPUDataEvaluator({
      isConstant: props.isConstant,
      type: 'uint32',
      size: 1,
      length: props.length,
      source: this
    });
  }

  toString(): string {
    const {x, y} = this.inputs;
    return `equalAll(${x}, ${y})`;
  }
}

export function equalAll(x: GPUDataEvaluatorInput, y: GPUDataEvaluatorInput): GPUDataEvaluator {
  return new EqualAllOperation(getGPUDataEvaluator(x), getGPUDataEvaluator(y)).output;
}

function validateMatchingRowSize(name: string, x: GPUDataEvaluator, y: GPUDataEvaluator): void {
  if (x.size !== y.size) {
    throw new Error(`${name} inputs must have matching row sizes, got ${x.size} and ${y.size}`);
  }
}
