// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/types';
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

  executeCPU(): TypedArray | null {
    const {x} = this.inputs;
    if (x.value && this.output.isConstant) {
      const size = x.size / 2;
      const source = new Float64Array(x.value.buffer);
      const target = new Float32Array(size * 2);
      for (let i = 0; i < size; i++) {
        const v = source[i];
        target[i] = Math.fround(v);
        target[i + size] = v - target[i];
      }
      return target;
    }
    return null;
  }
}

export function fround(x: GPUTable): GPUTable {
  return new FroundOperation(x).output;
}
