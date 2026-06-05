// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getCompatibleGPUDataEvaluatorFormat,
  getGPUDataEvaluator,
  GPUDataEvaluator,
  type GPUDataEvaluatorInput
} from '../operation/gpu-data-evaluator';
import {Operation} from '../operation/operation';
import {deduceOutputProps} from '../utils/output-props';

class SelectOperation extends Operation<{
  condition: GPUDataEvaluator;
  whenTrue: GPUDataEvaluator;
  whenFalse: GPUDataEvaluator;
}> {
  name = 'select';

  output: GPUDataEvaluator;

  constructor(
    condition: GPUDataEvaluator,
    whenTrue: GPUDataEvaluator,
    whenFalse: GPUDataEvaluator
  ) {
    super({condition, whenTrue, whenFalse});

    const conditionAndLengthProps = deduceOutputProps(condition, whenTrue, whenFalse);
    const valueProps = deduceOutputProps(whenTrue, whenFalse);
    validateInputSize('select condition', condition.size, valueProps.size);
    validateInputSize('select whenTrue', whenTrue.size, valueProps.size);
    validateInputSize('select whenFalse', whenFalse.size, valueProps.size);

    this.output = new GPUDataEvaluator({
      isConstant: conditionAndLengthProps.isConstant,
      type: valueProps.type,
      size: valueProps.size,
      length: conditionAndLengthProps.length,
      format:
        getCompatibleGPUDataEvaluatorFormat(whenTrue, valueProps.type, valueProps.size) ??
        getCompatibleGPUDataEvaluatorFormat(whenFalse, valueProps.type, valueProps.size),
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
  condition: GPUDataEvaluatorInput,
  whenTrue: GPUDataEvaluatorInput,
  whenFalse: GPUDataEvaluatorInput
): GPUDataEvaluator {
  return new SelectOperation(
    getGPUDataEvaluator(condition),
    getGPUDataEvaluator(whenTrue),
    getGPUDataEvaluator(whenFalse)
  ).output;
}

function validateInputSize(name: string, size: number, outputSize: number): void {
  if (size !== 1 && size !== outputSize) {
    throw new Error(`${name} must have size 1 or ${outputSize}, got ${size}`);
  }
}
