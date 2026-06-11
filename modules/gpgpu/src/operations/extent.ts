// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getGPUDataEvaluator,
  GPUDataEvaluator,
  type GPUDataEvaluatorInput
} from '../operation/gpu-data-evaluator';
import {Operation} from '../operation/operation';

/** Deferred extent reduction operation. */
class ExtentOperation extends Operation<{sourceValues: GPUDataEvaluator}> {
  /** Operation name used for backend lookup. */
  name = 'extent';

  /** Lazy output table for the per-channel extents. */
  output: GPUDataEvaluator;

  constructor(sourceValues: GPUDataEvaluator) {
    super({sourceValues});

    this.output = new GPUDataEvaluator({
      type: sourceValues.type,
      size: 2,
      length: sourceValues.size,
      source: this
    });
  }

  /** Returns a compact expression for debug output. */
  toString(): string {
    const {sourceValues} = this.inputs;
    return `extent(${sourceValues})`;
  }
}

/**
 * Computes `[min, max]` pairs for each channel across all rows in `sourceValues`.
 *
 * The returned table is lazy; no CPU or GPU work is performed until
 * {@link GPUDataEvaluator.evaluate} is called on the result.
 */
export function extent(sourceValues: GPUDataEvaluatorInput): GPUDataEvaluator {
  return new ExtentOperation(getGPUDataEvaluator(sourceValues)).output;
}
