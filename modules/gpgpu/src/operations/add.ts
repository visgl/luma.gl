// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GPUTable} from '../operation/gpu-table';
import {Operation} from '../operation/operation';
import {deduceOutputProps} from '../utils/output-props';

class AddOperation extends Operation<{x: GPUTable; y: GPUTable}> {
  name = 'add';

  output: GPUTable;

  constructor(x: GPUTable, y: GPUTable) {
    super({x, y});

    const {isConstant, type, size, length} = deduceOutputProps(x, y);
    this.output = new GPUTable({isConstant, type, size, length, source: this});
  }

  toString(): string {
    const {x, y} = this.inputs;
    return `[${x} + ${y}]`;
  }
}

export function add(...args: GPUTable[]): GPUTable {
  let result = args[0];
  for (let i = 1; i < args.length; i++) {
    result = new AddOperation(result, args[i]).output;
  }
  return result;
}
