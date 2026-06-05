// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type TypedArray} from '@math.gl/types';
import {
  getGPUDataEvaluator,
  GPUDataEvaluator,
  type GPUDataEvaluatorInput
} from '../operation/gpu-data-evaluator';
import {Operation} from '../operation/operation';

class SwizzleOperation extends Operation<{x: GPUDataEvaluator; columns: number[]}> {
  name = 'swizzle';

  output: GPUDataEvaluator;

  constructor(x: GPUDataEvaluator, columns: number[]) {
    super({x, columns});

    this.output = new GPUDataEvaluator({
      isConstant: x.isConstant,
      type: x.type,
      size: columns.length,
      length: x.length,
      normalized: x.normalized,
      source: this
    });
  }

  toString(): string {
    const {x, columns} = this.inputs;
    return `swizzle(${x}, [${columns.join(', ')}])`;
  }
}

export function swizzle(table: GPUDataEvaluatorInput, columns: number[]): GPUDataEvaluator {
  const source = getGPUDataEvaluator(table);
  validateColumns(source, columns);

  if (isContinuousColumns(columns)) {
    const startColumn = columns[0];
    return new GPUDataEvaluator({
      type: source.type,
      size: columns.length,
      offset: source.offset + startColumn * source.ValueType.BYTES_PER_ELEMENT,
      stride: source.stride,
      normalized: source.normalized,
      length: source.length,
      source
    });
  }

  if (source.value) {
    return new GPUDataEvaluator({
      isConstant: source.isConstant,
      type: source.type,
      size: columns.length,
      normalized: source.normalized,
      length: source.length,
      value: getSwizzledValue(source, columns)
    });
  }

  return new SwizzleOperation(source, columns).output;
}

function validateColumns(source: GPUDataEvaluator, columns: number[]): void {
  if (columns.length === 0) {
    throw new Error('swizzle columns must not be empty');
  }

  for (const column of columns) {
    if (!Number.isInteger(column)) {
      throw new Error(`swizzle columns must be integers, got ${column}`);
    }
    if (column < 0 || column >= source.size) {
      throw new Error(`swizzle column ${column} out of range for size ${source.size}`);
    }
  }
}

function isContinuousColumns(columns: number[]): boolean {
  for (let index = 1; index < columns.length; index++) {
    if (columns[index] !== columns[0] + index) {
      return false;
    }
  }
  return true;
}

function getSwizzledValue(source: GPUDataEvaluator, columns: number[]): TypedArray {
  const rowCount = source.isConstant ? 1 : source.length;
  const result = new source.ValueType(rowCount * columns.length) as TypedArray;
  const value = source.value!;
  const valueStride = source.stride / source.ValueType.BYTES_PER_ELEMENT;
  const valueOffset = source.offset / source.ValueType.BYTES_PER_ELEMENT;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const sourceStart = valueOffset + rowIndex * valueStride;
    const targetStart = rowIndex * columns.length;
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      result[targetStart + columnIndex] = value[sourceStart + columns[columnIndex]];
    }
  }

  return result;
}
