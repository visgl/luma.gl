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

/** Deferred pairwise addition operation. */
class AddOperation extends Operation<{x: GPUTableEvaluator; y: GPUTableEvaluator}> {
  /** Operation name used for backend lookup. */
  name = 'add';

  /** Lazy output table for the addition result. */
  output: GPUTableEvaluator;

  constructor(x: GPUTableEvaluator, y: GPUTableEvaluator) {
    super({x, y});

    const {isConstant, type, size, length} = deduceOutputProps(x, y);
    this.output = new GPUTableEvaluator({
      isConstant,
      type,
      size,
      length,
      dataType: x.dataType,
      source: this
    });
  }

  /** Returns a compact expression for debug output. */
  toString(): string {
    const {x, y} = this.inputs;
    return `[${x} + ${y}]`;
  }
}

/**
 * Adds corresponding row elements from two or more tables.
 *
 * The returned table is lazy; no CPU or GPU work is performed until
 * {@link GPUTableEvaluator.evaluate} is called on the result.
 */
export function add(...args: GPUTableEvaluatorInput[]): GPUTableEvaluator {
  let result = getGPUTableEvaluator(args[0]);
  for (let i = 1; i < args.length; i++) {
    result = new AddOperation(result, getGPUTableEvaluator(args[i])).output;
  }
  return result;
}
