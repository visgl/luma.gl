// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/types';
import {GPUTable} from '../operation/gpu-table';
import {Operation} from '../operation/operation';
import {deduceOutputProps} from '../utils/output-props';

class InterleaveOperation extends Operation<{x: GPUTable; y: GPUTable}> {
  name = 'interleave';

  output: GPUTable;

  constructor(x: GPUTable, y: GPUTable) {
    super({x, y});

    const {isConstant, type, length} = deduceOutputProps(x, y);
    this.output = new GPUTable({isConstant, type, size: x.size + y.size, length, source: this});
  }

  toString(): string {
    const {x, y} = this.inputs;
    return `_${x}_${y}_`;
  }
}

export function interleave(...args: GPUTable[]): GPUTable {
  let result = args[0];
  for (let i = 1; i < args.length; i++) {
    result = new InterleaveOperation(result, args[i]).output;
  }
  return result;
}
