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

/** Deferred row interleave operation. */
class InterleaveOperation extends Operation<GPUDataEvaluator[]> {
  /** Operation name used for backend lookup. */
  name = 'interleave';

  /** Lazy output table for the interleaved result. */
  output: GPUDataEvaluator;

  constructor(inputs: GPUDataEvaluator[]) {
    super(inputs);

    const {isConstant, type, length} = deduceOutputProps(...inputs);
    this.output = new GPUDataEvaluator({
      isConstant,
      type,
      size: inputs.reduce((size, input) => size + input.size, 0),
      length,
      source: this
    });
  }

  /** Returns a compact expression for debug output. */
  toString(): string {
    return `_${this.inputs.join('_')}_`;
  }
}

/**
 * Concatenates each input row in argument order.
 *
 * The returned table is lazy; no CPU or GPU work is performed until
 * {@link GPUDataEvaluator.evaluate} is called on the result.
 */
export function interleave(...args: GPUDataEvaluatorInput[]): GPUDataEvaluator {
  if (args.length === 0) {
    throw new Error('interleave() requires at least one input');
  }
  if (args.length === 1) {
    return getGPUDataEvaluator(args[0]);
  }
  return new InterleaveOperation(args.map(getGPUDataEvaluator)).output;
}
