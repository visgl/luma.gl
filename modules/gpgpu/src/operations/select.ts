// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getCompatibleGPUTableEvaluatorFormat,
  getGPUTableEvaluator,
  GPUTableEvaluator,
  type GPUTableEvaluatorInput
} from '../operation/gpu-table-evaluator';
import {Operation} from '../operation/operation';
import {deduceOutputProps} from '../utils/output-props';

class SelectOperation extends Operation<{
  condition: GPUTableEvaluator;
  whenTrue: GPUTableEvaluator;
  whenFalse: GPUTableEvaluator;
}> {
  name = 'select';

  output: GPUTableEvaluator;

  constructor(
    condition: GPUTableEvaluator,
    whenTrue: GPUTableEvaluator,
    whenFalse: GPUTableEvaluator
  ) {
    super({condition, whenTrue, whenFalse});

    const conditionAndLengthProps = deduceOutputProps(condition, whenTrue, whenFalse);
    const valueProps = deduceOutputProps(whenTrue, whenFalse);
    validateInputSize('select condition', condition.size, valueProps.size);
    validateInputSize('select whenTrue', whenTrue.size, valueProps.size);
    validateInputSize('select whenFalse', whenFalse.size, valueProps.size);

    this.output = new GPUTableEvaluator({
      isConstant: conditionAndLengthProps.isConstant,
      type: valueProps.type,
      size: valueProps.size,
      length: conditionAndLengthProps.length,
      format:
        getCompatibleGPUTableEvaluatorFormat(whenTrue, valueProps.type, valueProps.size) ??
        getCompatibleGPUTableEvaluatorFormat(whenFalse, valueProps.type, valueProps.size),
      source: this
    });
  }

  toString(): string {
    const {condition, whenTrue, whenFalse} = this.inputs;
    return `(${condition} ? ${whenTrue} : ${whenFalse})`;
  }
}

/**
 * Selects between `whenTrue` and `whenFalse` using per-row or per-lane non-zero condition values.
 *
 * `condition`, `whenTrue`, and `whenFalse` may each be scalar rows (size 1) or match the resolved
 * output row size. Scalar rows broadcast across lanes.
 */
export function select(
  condition: GPUTableEvaluatorInput,
  whenTrue: GPUTableEvaluatorInput,
  whenFalse: GPUTableEvaluatorInput
): GPUTableEvaluator {
  return new SelectOperation(
    getGPUTableEvaluator(condition),
    getGPUTableEvaluator(whenTrue),
    getGPUTableEvaluator(whenFalse)
  ).output;
}

function validateInputSize(name: string, size: number, outputSize: number): void {
  if (size !== 1 && size !== outputSize) {
    throw new Error(`${name} must have size 1 or ${outputSize}, got ${size}`);
  }
}
