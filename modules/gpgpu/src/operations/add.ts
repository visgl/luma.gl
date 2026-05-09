// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GPUTable} from '../operation/gpu-table';
import {Operation} from '../operation/operation';
import {deduceOutputProps} from '../utils/output-props';

/** Deferred pairwise addition operation. */
class AddOperation extends Operation<{x: GPUTable; y: GPUTable}> {
  /** Operation name used for backend lookup. */
  name = 'add';

  /** Lazy output table for the addition result. */
  output: GPUTable;

  constructor(x: GPUTable, y: GPUTable) {
    super({x, y});

    const {isConstant, type, size, length} = deduceOutputProps(x, y);
    this.output = new GPUTable({isConstant, type, size, length, source: this});
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
 * {@link GPUTable.evaluate} is called on the result.
 */
export function add(...args: GPUTable[]): GPUTable {
  let result = args[0];
  for (let i = 1; i < args.length; i++) {
    result = new AddOperation(result, args[i]).output;
  }
  return result;
}
