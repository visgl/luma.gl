// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {GPUTable} from '../operation/gpu-table';
import {Operation} from '../operation/operation';
import {assert} from '@luma.gl/core';

class FroundOperation extends Operation<{x: GPUTable}> {
  name = 'fround';

  output: GPUTable;

  constructor(x: GPUTable) {
    assert(x.type === 'uint32');
    super({x});

    const {isConstant, size, length} = x;
    this.output = new GPUTable({isConstant, type: 'float32', size, length, source: this});
  }

  toString(): string {
    const {x} = this.inputs;
    return `fround(${x})_fp64Low(${x})`;
  }
}

export function fround(x: GPUTable): GPUTable {
  return new FroundOperation(x).output;
}
