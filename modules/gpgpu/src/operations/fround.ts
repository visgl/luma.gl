// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {
  getGPUDataEvaluator,
  GPUDataEvaluator,
  type GPUDataEvaluatorInput
} from '../operation/gpu-data-evaluator';
import {Operation} from '../operation/operation';

/** Deferred float64 split operation. */
class FroundOperation extends Operation<{x: GPUDataEvaluator}> {
  /** Operation name used for backend lookup. */
  name = 'fround';

  /** Lazy output table for high and low float32 components. */
  output: GPUDataEvaluator;

  constructor(x: GPUDataEvaluator) {
    assert(x.type === 'uint32');
    super({x});

    const {isConstant, size, length} = x;
    this.output = new GPUDataEvaluator({isConstant, type: 'float32', size, length, source: this});
  }

  /** Returns a compact expression for debug output. */
  toString(): string {
    const {x} = this.inputs;
    return `fround(${x})_fp64Low(${x})`;
  }
}

/**
 * Splits float64 values into high and low float32 components for fp64-style arithmetic.
 *
 * `GPUDataEvaluator.fromArray()` represents `Float64Array` input as `uint32` pairs; `fround()` consumes
 * that representation and returns a lazy `float32` table containing high values followed by
 * residual low values.
 */
export function fround(x: GPUDataEvaluatorInput): GPUDataEvaluator {
  return new FroundOperation(getGPUDataEvaluator(x)).output;
}
