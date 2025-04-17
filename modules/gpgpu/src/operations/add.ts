// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/types';
import { GPUTable } from "../operation/gpu-table";
import { Operation } from "../operation/operation";
import { deduceOutputProps } from './common/output';

class AddOperation extends Operation<{x: GPUTable, y: GPUTable}> {
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

  executeCPU(): TypedArray | null {
    const {x, y} = this.inputs;
    const vx = x.value;
    const vy = y.value;
    if (vx && vy && this.output.isConstant) {
      const {ValueType, size} = this.output;
      const target = new ValueType(size);
      for (let i = 0; i < size; i++) {
        target[i] = (vx[i] ?? 0) + (vy[i] ?? 0);
      }
      return target;
    }
    return null;
  }
}

export function add(...args: GPUTable[]): GPUTable {
  let result = args[0];
  for (let i = 1; i < args.length; i++) {
    result = new AddOperation(result, args[i]).output;
  }
  return result;
}
