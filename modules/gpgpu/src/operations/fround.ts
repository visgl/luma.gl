// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {assert} from '@luma.gl/core';
import {GPUTableEvaluator} from '../operation/gpu-table';
import {Operation} from '../operation/operation';

/** Deferred float64 split operation. */
class FroundOperation extends Operation<{x: GPUTableEvaluator}> {
  /** Operation name used for backend lookup. */
  name = 'fround';

  /** Lazy output table for high and low float32 components. */
  output: GPUTableEvaluator;

  constructor(x: GPUTableEvaluator) {
    assert(x.type === 'uint32');
    super({x});

    const {isConstant, size, length} = x;
    this.output = new GPUTableEvaluator({isConstant, type: 'float32', size, length, source: this});
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
 * `GPUTableEvaluator.fromArray()` represents `Float64Array` input as `uint32` pairs; `fround()` consumes
 * that representation and returns a lazy `float32` table containing high values followed by
 * residual low values.
 */
export function fround(x: GPUTableEvaluator): GPUTableEvaluator {
  return new FroundOperation(x).output;
}
