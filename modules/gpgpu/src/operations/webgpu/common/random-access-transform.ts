// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {SignedDataType} from '@luma.gl/core';
import {GPUTableEvaluator} from '../../../operation/gpu-table-evaluator';
import {getLiteralValue, getWGSLType, getZeroValue} from './helper';

export const RANDOM_ACCESS_WORKGROUP_SIZE = 64;

export function getInputBinding(name: string, input: GPUTableEvaluator, index: number): string {
  const inputType = getWGSLType(input.type);
  return `@group(0) @binding(${index}) var<storage, read> ${name}: array<${inputType}>;`;
}

export function getSourceValuesAccessor(input: GPUTableEvaluator, asType: SignedDataType): string {
  const type = getWGSLType(asType);

  if (input.isConstant) {
    const values = input.value;
    if (!values) {
      throw new Error(`Constant input ${input} is missing CPU values`);
    }
    return `fn read_source_values(_sourceIndex: u32) -> array<${type}, ${input.size}> {
  return array<${type}, ${input.size}>(${Array.from({length: input.size}, (_, index) =>
    getLiteralValue(type, values[index] ?? 0)
  ).join(', ')});
}`;
  }

  const stride = input.stride / input.ValueType.BYTES_PER_ELEMENT;
  const offset = input.offset / input.ValueType.BYTES_PER_ELEMENT;
  const inputType = getWGSLType(input.type);
  const cast = inputType === type ? '' : `${type}`;

  return `fn read_source_values(sourceIndex: u32) -> array<${type}, ${input.size}> {
  var value: array<${type}, ${input.size}>;
  let rowOffset = ${offset}u + sourceIndex * ${stride}u;
${Array.from({length: input.size}, (_, index) =>
  cast
    ? `  value[${index}] = ${cast}(sourceValues[rowOffset + ${index}u]);`
    : `  value[${index}] = sourceValues[rowOffset + ${index}u];`
).join('\n')}
  return value;
}`;
}

export function getOutputBinding(output: GPUTableEvaluator, bindingIndex: number): string {
  const type = getWGSLType(output.type);
  return `@group(0) @binding(${bindingIndex}) var<storage, read_write> result: array<${type}>;`;
}

export function getOutputWriter(output: GPUTableEvaluator): string {
  const stride = output.stride / output.ValueType.BYTES_PER_ELEMENT;
  const offset = output.offset / output.ValueType.BYTES_PER_ELEMENT;
  const type = getWGSLType(output.type);
  return `fn write_result(rowIndex: u32, value: array<${type}, ${output.size}>) {
  let rowOffset = ${offset}u + rowIndex * ${stride}u;
${Array.from({length: output.size}, (_, elementIndex) => `  result[rowOffset + ${elementIndex}u] = value[${elementIndex}];`).join('\n')}
}`;
}

export function getZeroResultFunction(type: SignedDataType, size: number): string {
  const zero = getZeroValue(type);
  return `fn zero_result() -> array<${getWGSLType(type)}, ${size}> {
  var result: array<${getWGSLType(type)}, ${size}>;
${Array.from({length: size}, (_, index) => `  result[${index}] = ${zero};`).join('\n')}
  return result;
}`;
}
