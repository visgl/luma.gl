// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GPUTableEvaluator} from '../operation/gpu-table-evaluator';
import {Operation} from '../operation/operation';

/** Deferred row gather operation. */
class GatherOperation extends Operation<{ids: GPUTableEvaluator; sourceValues: GPUTableEvaluator}> {
  /** Operation name used for backend lookup. */
  name = 'gather';

  /** Lazy output table for the gathered rows. */
  output: GPUTableEvaluator;

  constructor(ids: GPUTableEvaluator, sourceValues: GPUTableEvaluator) {
    super({ids, sourceValues});

    this.output = new GPUTableEvaluator({
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
 * {@link GPUTableEvaluator.evaluate} is called on the result.
 */
export function gather(ids: GPUTableEvaluator, sourceValues: GPUTableEvaluator): GPUTableEvaluator {
  return new GatherOperation(ids, sourceValues).output;
}
