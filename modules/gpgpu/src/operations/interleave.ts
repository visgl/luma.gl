// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GPUTable} from '../operation/gpu-table';
import {Operation} from '../operation/operation';
import {deduceOutputProps} from '../utils/output-props';

/** Deferred row interleave operation. */
class InterleaveOperation extends Operation<{x: GPUTable; y: GPUTable}> {
  /** Operation name used for backend lookup. */
  name = 'interleave';

  /** Lazy output table for the interleaved result. */
  output: GPUTable;

  constructor(x: GPUTable, y: GPUTable) {
    super({x, y});

    const {isConstant, type, length} = deduceOutputProps(x, y);
    this.output = new GPUTable({isConstant, type, size: x.size + y.size, length, source: this});
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
 * {@link GPUTable.evaluate} is called on the result.
 */
export function interleave(...args: GPUTable[]): GPUTable {
  let result = args[0];
  for (let i = 1; i < args.length; i++) {
    result = new InterleaveOperation(result, args[i]).output;
  }
  return result;
}
