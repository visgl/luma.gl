// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getGPUTableEvaluator,
  GPUTableEvaluator,
  type GPUTableEvaluatorInput
} from '../operation/gpu-table-evaluator';
import {Operation} from '../operation/operation';
import {deduceOutputProps} from '../utils/output-props';

class EqualAllOperation extends Operation<{x: GPUTableEvaluator; y: GPUTableEvaluator}> {
  name = 'equalAll';

  output: GPUTableEvaluator;

  constructor(x: GPUTableEvaluator, y: GPUTableEvaluator) {
    super({x, y});

    validateMatchingRowSize('equalAll', x, y);
    const props = deduceOutputProps(x, y);
    this.output = new GPUTableEvaluator({
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

export function equalAll(x: GPUTableEvaluatorInput, y: GPUTableEvaluatorInput): GPUTableEvaluator {
  return new EqualAllOperation(getGPUTableEvaluator(x), getGPUTableEvaluator(y)).output;
}

function validateMatchingRowSize(name: string, x: GPUTableEvaluator, y: GPUTableEvaluator): void {
  if (x.size !== y.size) {
    throw new Error(`${name} inputs must have matching row sizes, got ${x.size} and ${y.size}`);
  }
}
