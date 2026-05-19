// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GPUTableEvaluator} from '../operation/gpu-table-evaluator';
import {Operation} from '../operation/operation';

/** Deferred extent reduction operation. */
class ExtentOperation extends Operation<{sourceValues: GPUTableEvaluator}> {
  /** Operation name used for backend lookup. */
  name = 'extent';

  /** Lazy output table for the per-channel extents. */
  output: GPUTableEvaluator;

  constructor(sourceValues: GPUTableEvaluator) {
    super({sourceValues});

    this.output = new GPUTableEvaluator({
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
 * {@link GPUTableEvaluator.evaluate} is called on the result.
 */
export function extent(sourceValues: GPUTableEvaluator): GPUTableEvaluator {
  return new ExtentOperation(sourceValues).output;
}
