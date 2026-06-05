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
class InterleaveOperation extends Operation<{x: GPUDataEvaluator; y: GPUDataEvaluator}> {
  /** Operation name used for backend lookup. */
  name = 'interleave';

  /** Lazy output table for the interleaved result. */
  output: GPUDataEvaluator;

  constructor(x: GPUDataEvaluator, y: GPUDataEvaluator) {
    super({x, y});

    const {isConstant, type, length} = deduceOutputProps(x, y);
    this.output = new GPUDataEvaluator({
      isConstant,
      type,
      size: x.size + y.size,
      length,
      source: this
    });
  }

  /** Returns a compact expression for debug output. */
  toString(): string {
    const {x, y} = this.inputs;
    return `_${x}_${y}_`;
  }
}

/**
 * Concatenates each input row in argument order.
 *
 * The returned table is lazy; no CPU or GPU work is performed until
 * {@link GPUDataEvaluator.evaluate} is called on the result.
 */
export function interleave(...args: GPUDataEvaluatorInput[]): GPUDataEvaluator {
  let result = getGPUDataEvaluator(args[0]);
  for (let i = 1; i < args.length; i++) {
    result = new InterleaveOperation(result, getGPUDataEvaluator(args[i])).output;
  }
  return result;
}
