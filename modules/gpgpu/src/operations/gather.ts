// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  getGPUDataEvaluator,
  GPUDataEvaluator,
  type GPUDataEvaluatorInput
} from '../operation/gpu-data-evaluator';
import {Operation} from '../operation/operation';

/** Deferred row gather operation. */
class GatherOperation extends Operation<{ids: GPUDataEvaluator; sourceValues: GPUDataEvaluator}> {
  /** Operation name used for backend lookup. */
  name = 'gather';

  /** Lazy output table for the gathered rows. */
  output: GPUDataEvaluator;

  constructor(ids: GPUDataEvaluator, sourceValues: GPUDataEvaluator) {
    super({ids, sourceValues});

    this.output = new GPUDataEvaluator({
      isConstant: ids.isConstant,
      type: sourceValues.type,
      size: sourceValues.size,
      length: ids.length,
      source: this
    });
  }

  /** Returns a compact expression for debug output. */
  toString(): string {
    const {ids, sourceValues} = this.inputs;
    return `${sourceValues}[${ids}]`;
  }
}

/**
 * Gathers rows from `sourceValues` using 0-based row indices from `ids`.
 *
 * Each row in `ids` must be a scalar index. Out-of-range indices return a zero row.
 * The returned table is lazy; no CPU or GPU work is performed until
 * {@link GPUDataEvaluator.evaluate} is called on the result.
 */
export function gather(
  ids: GPUDataEvaluatorInput,
  sourceValues: GPUDataEvaluatorInput
): GPUDataEvaluator {
  return new GatherOperation(getGPUDataEvaluator(ids), getGPUDataEvaluator(sourceValues)).output;
}
